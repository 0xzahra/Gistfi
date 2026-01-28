import React, { useEffect, useRef, useState } from 'react';
import { gistfiService } from '../services/geminiService';
import { Mic, MicOff } from 'lucide-react';
import { LiveServerMessage, Modality } from '@google/genai';

export const WarRoom: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [volume, setVolume] = useState(0);
  
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
  };

  const decodeAudioData = async (base64: string, ctx: AudioContext) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const buffer = ctx.createBuffer(1, bytes.length / 2, 24000);
      const data = buffer.getChannelData(0);
      const int16 = new Int16Array(bytes.buffer);
      for(let i=0; i < int16.length; i++) data[i] = int16[i] / 32768.0;
      return buffer;
  };

  const startSession = async () => {
    try {
      setStatus("Connecting...");
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = gistfiService.getLiveClient().connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: { responseModalities: [Modality.AUDIO], systemInstruction: "Be ultra-concise. Trade focus." },
        callbacks: {
            onopen: () => {
                setStatus("Live");
                setIsConnected(true);
                const source = inputCtx.createMediaStreamSource(stream);
                const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    let sum = 0; for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                    setVolume(Math.sqrt(sum/inputData.length) * 100);
                    sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(inputData) }));
                };
                source.connect(processor);
                processor.connect(inputCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
                const b64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (b64 && outputCtx) {
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                    const buf = await decodeAudioData(b64, outputCtx);
                    const src = outputCtx.createBufferSource();
                    src.buffer = buf;
                    src.connect(outputCtx.destination);
                    src.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += buf.duration;
                    sourcesRef.current.add(src);
                    src.onended = () => sourcesRef.current.delete(src);
                }
            },
            onclose: () => { setStatus("Disconnected"); setIsConnected(false); },
            onerror: () => setStatus("Error")
        }
      });
    } catch (e) { setStatus("Permission Denied"); }
  };

  const stopSession = () => {
     streamRef.current?.getTracks().forEach(t => t.stop());
     inputContextRef.current?.close();
     outputContextRef.current?.close();
     window.location.reload();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-black">
        <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight text-white">War Room</h2>
            
            <div className="h-24 flex items-center justify-center space-x-1.5">
                {Array.from({length: 12}).map((_, i) => (
                    <div key={i} className="w-2 bg-gistfi-green rounded-full transition-all duration-75"
                        style={{
                            height: isConnected ? `${Math.max(8, Math.random() * volume * 3 + 8)}px` : '4px',
                            opacity: isConnected ? 1 : 0.2
                        }}
                    ></div>
                ))}
            </div>

            <button
                onClick={isConnected ? stopSession : startSession}
                className={`
                    px-8 py-4 rounded-full font-semibold text-lg transition-all
                    ${isConnected 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-gistfi-green text-white hover:bg-blue-600'}
                `}
            >
                <div className="flex items-center space-x-2">
                    {isConnected ? <MicOff size={20}/> : <Mic size={20}/>}
                    <span>{isConnected ? "Disconnect" : "Go Live"}</span>
                </div>
            </button>
            <p className="text-xs text-gray-500 font-medium">{status}</p>
        </div>
    </div>
  );
};