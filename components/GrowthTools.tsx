import React, { useState } from 'react';
import { gistfiService } from '../services/geminiService';
import { Image, Film, Wand2, Loader2, Download } from 'lucide-react';

export const GrowthTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'meme' | 'video'>('meme');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const handleGenerate = async () => {
      if (!prompt) return;
      setIsGenerating(true);
      setResult(null);

      try {
          if (activeTab === 'meme') {
              const img = await gistfiService.generateMeme(prompt);
              setResult(img);
          } else {
              const op = await gistfiService.generateVideo(prompt);
              let uri = null;
              while (!uri) {
                  await new Promise(r => setTimeout(r, 5000));
                  uri = await gistfiService.pollVideoOperation(op);
              }
              setResult(uri);
          }
      } catch (e) { alert("Failed."); } 
      finally { setIsGenerating(false); }
  };

  return (
    <div className="h-full flex flex-col bg-black p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Growth Engine</h2>

        <div className="flex space-x-6 mb-6 border-b border-gray-900">
            <button onClick={() => setActiveTab('meme')} className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'meme' ? 'text-gistfi-green border-b-2 border-gistfi-green' : 'text-gray-500'}`}>Meme Gen</button>
            <button onClick={() => setActiveTab('video')} className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'video' ? 'text-gistfi-green border-b-2 border-gistfi-green' : 'text-gray-500'}`}>Video Gen</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-gistfi-dark border border-gray-800 rounded-xl p-4 text-white focus:border-gistfi-green outline-none h-40 resize-none text-sm placeholder-gray-600"
                    placeholder="Describe your asset..."
                />
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt}
                    className="w-full py-3 bg-gistfi-green text-white font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                    <span>{isGenerating ? "Creating..." : "Generate"}</span>
                </button>
            </div>

            <div className="bg-gistfi-dark rounded-xl border border-gray-800 flex items-center justify-center relative overflow-hidden min-h-[300px]">
                {!result && !isGenerating && <span className="text-gray-600 text-xs">Preview Area</span>}
                {isGenerating && <Loader2 className="animate-spin text-gistfi-green" />}
                {result && activeTab === 'meme' && <img src={result} className="max-w-full max-h-full" />}
                {result && activeTab === 'video' && <video src={result} controls autoPlay loop className="max-w-full max-h-full" />}
                {result && <a href={result} download className="absolute bottom-4 right-4 bg-white text-black p-2 rounded-full"><Download size={16} /></a>}
            </div>
        </div>
    </div>
  );
};