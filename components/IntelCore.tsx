import React, { useState, useRef, useEffect } from 'react';
import { Message, TrendingTopic } from '../types';
import { gistfiService } from '../services/geminiService';
import { Send, Cpu, Play, FileAudio, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Sparkles, Hash } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const IntelCore: React.FC = () => {
  // Start empty for speed
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useDeepDive, setUseDeepDive] = useState(false);
  
  // Trending State
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  
  // Price Feed & Chart State
  const [ticker, setTicker] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<{ price: string, change: string } | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'24h' | '7d'>('24h');
  const [showChart, setShowChart] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Load trends immediately on mount in background
  useEffect(() => {
    const loadTrends = async () => {
        const t = await gistfiService.getTrending();
        setTrends(t);
    };
    loadTrends();
  }, []);

  useEffect(() => {
    if (ticker) {
        loadHistory(ticker, timeframe);
    }
  }, [timeframe, ticker]);

  const loadHistory = async (sym: string, tf: '24h' | '7d') => {
      const history = await gistfiService.getTokenHistory(sym, tf);
      setChartData(history);
  };

  const fetchPrice = async (symbol: string) => {
    setIsFetchingPrice(true);
    setTicker(symbol.toUpperCase());
    setShowChart(true);
    
    const [priceInfo, historyInfo] = await Promise.all([
        gistfiService.getTokenPrice(symbol),
        gistfiService.getTokenHistory(symbol, timeframe)
    ]);
    
    if (priceInfo) setPriceData(priceInfo);
    if (historyInfo) setChartData(historyInfo);
    
    setIsFetchingPrice(false);
  };

  const handleSend = async (forcedInput?: string) => {
    const textToSend = forcedInput || input;
    if (!textToSend.trim() && !isProcessing) return;
    
    // Check ticker locally first for instant feedback
    const tickerMatch = textToSend.match(/\$([a-zA-Z0-9]+)/);
    let symbolToFetch = null;
    
    if (tickerMatch) {
        symbolToFetch = tickerMatch[1];
    } else if (["ETH", "SOL", "BTC", "BASE"].includes(textToSend.toUpperCase())) {
         symbolToFetch = textToSend;
    }

    if (symbolToFetch) fetchPrice(symbolToFetch);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      let responseText = "";
      // Fast path logic
      if (textToSend.toLowerCase().startsWith("scan")) {
         responseText = await gistfiService.quickScan(textToSend);
      } else {
         responseText = await gistfiService.analyzeToken(textToSend, useDeepDive);
      }

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: responseText,
        timestamp: Date.now(),
        type: 'analysis'
      };
      setMessages(prev => [...prev, agentMsg]);
      
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: "Network unavailable.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const text = await gistfiService.transcribeAudio(base64, file.type);
        setMessages(prev => [...prev, 
            { id: Date.now().toString(), role: 'user', content: "[Audio Upload]", timestamp: Date.now() },
            { id: (Date.now()+1).toString(), role: 'agent', content: `**Transcription:** ${text}`, timestamp: Date.now() }
        ]);
        setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const playAudio = async (text: string) => {
      const buffer = await gistfiService.textToSpeech(text);
      if (buffer) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = ctx.createBufferSource();
          ctx.decodeAudioData(buffer, (decoded) => {
              source.buffer = decoded;
              source.connect(ctx.destination);
              source.start(0);
          });
      }
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="p-4 border-b border-gray-900 bg-black/90 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-white tracking-wide">Intel Core</span>
            <label className="flex items-center cursor-pointer space-x-2 group">
                <span className={`text-xs font-medium transition-colors ${useDeepDive ? 'text-gistfi-green' : 'text-gray-500 group-hover:text-gray-300'}`}>Deep Dive</span>
                <div 
                onClick={() => setUseDeepDive(!useDeepDive)}
                className={`w-8 h-4 rounded-full relative transition-colors ${useDeepDive ? 'bg-gistfi-green' : 'bg-gray-800'}`}
                >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 ${useDeepDive ? 'left-4.5' : 'left-0.5'}`}></div>
                </div>
            </label>
        </div>
        
        {/* Price Widget */}
        {ticker && (
            <div className="bg-gistfi-dark border border-gray-800 rounded-lg p-3 mt-2 transition-all animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                        <span className="text-white font-bold text-lg">${ticker}</span>
                        {isFetchingPrice && !priceData ? (
                            <span className="text-xs text-gray-500 animate-pulse">Loading...</span>
                        ) : (
                            <div className="flex items-center space-x-3 animate-in fade-in">
                                <span className="text-white text-lg font-mono">{priceData?.price}</span>
                                <span className={`text-sm flex items-center font-medium ${priceData?.change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>
                                    {priceData?.change.includes('+') ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                                    {priceData?.change}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex bg-black rounded p-0.5 space-x-1">
                             <button onClick={() => setTimeframe('24h')} className={`px-2 py-0.5 text-[10px] rounded transition-colors ${timeframe === '24h' ? 'bg-gistfi-green text-white' : 'text-gray-500 hover:text-white'}`}>24H</button>
                             <button onClick={() => setTimeframe('7d')} className={`px-2 py-0.5 text-[10px] rounded transition-colors ${timeframe === '7d' ? 'bg-gistfi-green text-white' : 'text-gray-500 hover:text-white'}`}>7D</button>
                        </div>
                        <button onClick={() => setShowChart(!showChart)} className="text-gray-500 hover:text-white transition-colors">
                            {showChart ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>
                </div>
                
                {/* Chart */}
                {showChart && chartData.length > 0 && (
                    <div className="h-40 w-full mt-2 animate-in fade-in">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0052FF" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0052FF" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" hide />
                                <YAxis domain={['auto', 'auto']} hide />
                                <Area type="monotone" dataKey="price" stroke="#0052FF" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Main Area: Chat or Trending */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Trending Widget (Empty State) */}
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Trending Gists</h2>
                    <p className="text-gray-500 text-sm">Real-time alpha from 𝕏 & TikTok</p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                    {trends.length === 0 ? (
                        // Skeleton Loaders
                        Array.from({length: 4}).map((_, i) => (
                            <div key={i} className="bg-gistfi-dark border border-gray-800 rounded-xl p-4 h-24 animate-pulse"></div>
                        ))
                    ) : (
                        trends.map((t, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleSend(`Analyze ${t.topic}`)}
                                className="bg-gistfi-dark border border-gray-800 hover:border-gistfi-green/50 p-4 rounded-xl text-left transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-gistfi-green/10 group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="bg-gray-800 group-hover:bg-gistfi-green/20 p-1.5 rounded-lg transition-colors">
                                        <Hash size={16} className="text-gray-400 group-hover:text-gistfi-green" />
                                    </div>
                                    <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-900/50">{t.change}</span>
                                </div>
                                <h3 className="font-bold text-white mb-1 truncate">{t.topic}</h3>
                                <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                                    <span>{t.source}</span>
                                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                    <span>Vol: {t.volume}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`max-w-2xl px-5 py-3.5 rounded-2xl text-sm shadow-md ${
              msg.role === 'user' 
                ? 'bg-gistfi-green text-white rounded-br-none' 
                : msg.role === 'system'
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : 'bg-gistfi-gray text-white rounded-bl-none'
            }`}>
              {msg.role === 'agent' && (
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-700/50">
                   <div className="flex items-center space-x-2">
                       <Sparkles size={12} className="text-gistfi-green" />
                       <span className="text-[10px] font-bold text-gray-400 tracking-wider">GISTFI INTELLIGENCE</span>
                   </div>
                   <button onClick={() => playAudio(msg.content.substring(0, 300))} className="text-gray-400 hover:text-white transition-colors">
                       <Play size={10} />
                   </button>
                </div>
              )}
              <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                 <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-center space-x-3 text-gray-400 text-xs font-medium p-4 animate-in fade-in">
            <div className="relative">
                <div className="w-2 h-2 bg-gistfi-green rounded-full animate-ping absolute"></div>
                <div className="w-2 h-2 bg-gistfi-green rounded-full"></div>
            </div>
            <span>Analyzing market data...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-black border-t border-gray-900">
        <div className="relative flex items-center bg-gistfi-dark border border-gray-800 rounded-xl focus-within:border-gistfi-green focus-within:ring-1 focus-within:ring-gistfi-green transition-all shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Gistfi..."
            className="flex-1 bg-transparent border-none text-white text-sm p-4 focus:outline-none placeholder-gray-500"
            disabled={isProcessing}
            autoFocus
          />
          <div className="flex items-center pr-2 space-x-1">
            <button 
                onClick={() => fileInputRef.current?.click()} 
                className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800 rounded-lg"
                title="Upload Media"
            >
                <FileAudio size={18} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="audio/*,video/*" onChange={handleAudioUpload} />
            <button 
                onClick={() => handleSend()} 
                disabled={isProcessing || !input.trim()} 
                className="p-2 bg-gistfi-green text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-gistfi-green"
            >
                <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};