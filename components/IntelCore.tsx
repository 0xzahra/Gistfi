import React, { useState, useEffect, useRef } from 'react';
import { gistfiService } from '../services/geminiService';
import { XProfile, XPost, TrendingTopic, Message } from '../types';
import { Twitter, ArrowRight, Loader2, Sparkles, TrendingUp, Send, Heart, Repeat, Search, PenTool, BarChart3, ShieldCheck, ChevronDown, ChevronUp, Play, TrendingDown, Hash, Video, RefreshCw, MessageCircle, Share, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface IntelCoreProps {
    user: XProfile | null;
    onLogin: (profile: XProfile) => void;
}

export const IntelCore: React.FC<IntelCoreProps> = ({ user, onLogin }) => {
  // --- AUTH STATE ---
  const [handle, setHandle] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  
  // --- DATA STATE ---
  const [posts, setPosts] = useState<XPost[]>([]);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  
  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<'intel' | 'trends' | 'feed' | 'compose'>('intel');
  const [composeText, setComposeText] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // --- INTEL/CHAT STATE ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const [useDeepDive, setUseDeepDive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Price/Chart State
  const [ticker, setTicker] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<{ price: string, change: string } | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showChart, setShowChart] = useState(true);

  // --- COMMAND LINE ---
  const [cmdInput, setCmdInput] = useState('');
  const [cmdOutput, setCmdOutput] = useState<{type: 'user'|'agent', text: string}[]>([]);
  const cmdEndRef = useRef<HTMLDivElement>(null);

  // --- EFFECTS ---
  useEffect(() => {
      // Load trends on mount
      gistfiService.getTrending().then(setTrends);
  }, []);

  useEffect(() => {
      if (user && posts.length === 0) {
        refreshFeed(user.handle);
      }
  }, [user]);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatProcessing]);

  useEffect(() => {
      cmdEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cmdOutput]);

  // --- ACTIONS ---

  const authenticate = async (userHandle: string) => {
      if (!userHandle) return;
      setIsLoadingAuth(true);
      try {
          await new Promise(r => setTimeout(r, 1000));
          const data = await gistfiService.simulateXProfile(userHandle);
          onLogin(data.profile);
          setPosts(data.posts);
      } catch (e) {
          onLogin({ 
              handle: `@${userHandle.replace('@','')}`, 
              name: 'Guest User', 
              bio: 'System access granted.', 
              followers: '0', 
              following: '0', 
              avatar: '', 
              alphaScore: 10 
          });
      } finally {
          setIsLoadingAuth(false);
      }
  };

  const loginAsGuest = () => authenticate("Guest");

  const refreshFeed = async (userHandle: string) => {
      setIsRefreshingFeed(true);
      try {
          const data = await gistfiService.simulateXProfile(userHandle);
          setPosts(data.posts);
      } catch(e) {
          console.error(e);
      } finally {
          setIsRefreshingFeed(false);
      }
  };

  // --- CHAT LOGIC ---
  const handleChatSend = async (textOverride?: string) => {
      const text = textOverride || chatInput;
      if (!text.trim() && !isChatProcessing) return;

      // Extract Ticker for Chart
      const tickerMatch = text.match(/\$([a-zA-Z0-9]+)/);
      if (tickerMatch) {
          const sym = tickerMatch[1].toUpperCase();
          setTicker(sym);
          gistfiService.getTokenPrice(sym).then(setPriceData);
          gistfiService.getTokenHistory(sym, '24h').then(setChartData);
      } else if (["ETH", "BTC", "SOL", "BASE"].includes(text.toUpperCase())) {
          setTicker(text.toUpperCase());
          gistfiService.getTokenPrice(text).then(setPriceData);
          gistfiService.getTokenHistory(text, '24h').then(setChartData);
      }

      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
      setMessages(p => [...p, userMsg]);
      setChatInput('');
      setIsChatProcessing(true);

      try {
          const response = await gistfiService.analyzeToken(text, useDeepDive);
          const agentMsg: Message = { id: (Date.now()+1).toString(), role: 'agent', content: response, timestamp: Date.now() };
          setMessages(p => [...p, agentMsg]);
      } catch (e) {
          setMessages(p => [...p, { id: Date.now().toString(), role: 'system', content: "Error analyzing.", timestamp: Date.now() }]);
      } finally {
          setIsChatProcessing(false);
      }
  };

  const handleRefineTweet = async () => {
      if (!composeText) return;
      setIsRefining(true);
      const refined = await gistfiService.refineTweet(composeText);
      setComposeText(refined);
      setIsRefining(false);
  };

  const executeCommand = async () => {
      if (!cmdInput.trim()) return;
      const cmd = cmdInput.trim();
      setCmdInput('');
      setCmdOutput(p => [...p, { type: 'user', text: `> ${cmd}` }]);
      
      const lowerCmd = cmd.toLowerCase();

      // Help Command
      if (lowerCmd === '/help') {
          setCmdOutput(p => [...p, { type: 'agent', text: 'CORE SYSTEM COMMANDS:\n/scan <query>  - Quick intelligence scan\n/clear         - Clear terminal output\n/help          - Show this list' }]);
          return;
      }
      
      // Clear Command
      if (lowerCmd === '/clear') {
          setCmdOutput([]);
          return;
      }

      // Scan Command logic
      let query = cmd;
      if (cmd.startsWith('/scan')) {
         query = cmd.replace('/scan', '').trim();
         if (!query) {
             setCmdOutput(p => [...p, { type: 'agent', text: 'Error: Missing query. Usage: /scan <token>' }]);
             return;
         }
      }

      try {
         const res = await gistfiService.quickScan(query);
         setCmdOutput(p => [...p, { type: 'agent', text: res }]);
      } catch (e) {
         setCmdOutput(p => [...p, { type: 'agent', text: 'Execution failed.' }]);
      }
  };

  // --- LOGIN SCREEN ---
  if (!user) {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-black p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
              <div className="z-10 w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="text-center space-y-2">
                      <div className="mx-auto w-16 h-16 bg-gistfi-dark rounded-2xl flex items-center justify-center border border-gray-800 mb-6 shadow-2xl shadow-blue-900/20">
                          <Twitter size={32} className="text-white" />
                      </div>
                      <h1 className="text-3xl font-bold text-white tracking-tight">Connect X Identity</h1>
                      <p className="text-gray-500">Authenticate to enable Gistfi neural link.</p>
                  </div>
                  <div className="space-y-4">
                      <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500">@</span>
                          </div>
                          <input 
                              type="text" 
                              value={handle}
                              onChange={(e) => setHandle(e.target.value)}
                              placeholder="username"
                              className="w-full bg-gistfi-dark border border-gray-800 text-white rounded-xl py-3 pl-8 pr-4 focus:border-gistfi-green focus:ring-1 focus:ring-gistfi-green outline-none transition-all placeholder-gray-600"
                              onKeyDown={(e) => e.key === 'Enter' && authenticate(handle)}
                          />
                      </div>
                      <button 
                          onClick={() => authenticate(handle)}
                          disabled={isLoadingAuth || !handle}
                          className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                          {isLoadingAuth ? <Loader2 className="animate-spin" /> : <span>Authorize</span>}
                          {!isLoadingAuth && <ArrowRight size={18} />}
                      </button>
                      <button onClick={loginAsGuest} className="w-full text-xs text-gray-500 hover:text-white transition-colors py-2">
                         Skip Authentication (Guest Mode)
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="flex flex-col h-full bg-black">
        {/* TOP BAR */}
        <div className="p-4 border-b border-gray-900 bg-black/80 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
             <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gistfi-green to-blue-400 flex items-center justify-center text-white font-bold text-xs">
                    {user.handle.substring(1,3).toUpperCase()}
                 </div>
                 <div>
                     <h2 className="text-sm font-bold text-white">{user.name}</h2>
                     <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                         <span>{user.followers} Followers</span>
                         <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                         <span className="text-gistfi-green">Alpha Score: {user.alphaScore}</span>
                     </div>
                 </div>
             </div>
             <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-xl">
                 <button onClick={() => setActiveTab('intel')} className={`p-2 rounded-lg transition-colors ${activeTab === 'intel' ? 'bg-gistfi-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`} title="Intel Core"><Sparkles size={18} /></button>
                 <button onClick={() => setActiveTab('trends')} className={`p-2 rounded-lg transition-colors ${activeTab === 'trends' ? 'bg-gistfi-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`} title="Trends"><TrendingUp size={18} /></button>
                 <button onClick={() => setActiveTab('feed')} className={`p-2 rounded-lg transition-colors ${activeTab === 'feed' ? 'bg-gistfi-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`} title="X Feed"><Twitter size={18} /></button>
                 <button onClick={() => setActiveTab('compose')} className={`p-2 rounded-lg transition-colors ${activeTab === 'compose' ? 'bg-gistfi-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`} title="Compose"><PenTool size={18} /></button>
             </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
            
            {/* --- INTEL TAB --- */}
            {activeTab === 'intel' && (
                <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2">
                    {/* Price Widget */}
                    {ticker && (
                        <div className="bg-gistfi-dark border border-gray-800 rounded-xl p-4 mb-4 shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                    <span className="text-white font-bold text-xl tracking-tight">${ticker}</span>
                                    <span className={`text-sm font-mono ${priceData?.change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>
                                        {priceData ? `${priceData.price} (${priceData.change})` : 'Fetching...'}
                                    </span>
                                </div>
                                <button onClick={() => setShowChart(!showChart)} className="text-gray-500 hover:text-white"><BarChart3 size={18}/></button>
                            </div>
                            {showChart && chartData.length > 0 && (
                                <div className="h-40 w-full mt-2">
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
                    
                    {/* Chat Area */}
                    <div className="flex-1 space-y-4 mb-4">
                        {messages.length === 0 && !ticker && (
                            <div className="text-center py-20 opacity-50">
                                <Sparkles className="mx-auto mb-4 text-gistfi-green" size={48} />
                                <h3 className="text-xl font-bold text-white">Gistfi Intelligence</h3>
                                <p className="text-sm text-gray-400">Ask about any token, contract, or narrative.</p>
                            </div>
                        )}
                        {messages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              msg.role === 'user' 
                                ? 'bg-gistfi-green text-white rounded-br-none' 
                                : 'bg-gistfi-dark border border-gray-800 text-gray-200 rounded-bl-none'
                            }`}>
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          </div>
                        ))}
                        {isChatProcessing && (
                            <div className="flex items-center space-x-2 text-gray-500 text-xs pl-2">
                                <Loader2 size={12} className="animate-spin" />
                                <span>Analyzing on-chain data...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="relative flex items-center bg-gistfi-dark border border-gray-800 rounded-xl focus-within:border-gistfi-green transition-all shadow-lg">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                            placeholder="Ask Gistfi (e.g., Analyze $BASE)..."
                            className="flex-1 bg-transparent border-none text-white text-sm p-4 focus:outline-none placeholder-gray-500"
                            disabled={isChatProcessing}
                            autoFocus
                        />
                        <button 
                            onClick={() => handleChatSend()} 
                            disabled={isChatProcessing || !chatInput.trim()} 
                            className="p-3 mr-1 bg-gistfi-green text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:bg-transparent"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* --- TRENDS TAB --- */}
            {activeTab === 'trends' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <TrendingUp className="text-gistfi-green" size={20} /> 
                            Real-time Signals
                        </h3>
                        <span className="text-xs text-gistfi-green border border-gistfi-green/30 px-2 py-1 rounded-full bg-gistfi-green/10 animate-pulse">Live Updating</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        {trends.map((t, i) => (
                            <div key={i} 
                                onClick={() => { setActiveTab('intel'); handleChatSend(`Deep dive into ${t.topic}`); }}
                                className="bg-gistfi-dark border border-gray-800 p-5 rounded-xl hover:border-gistfi-green/50 transition-all cursor-pointer group hover:bg-gray-900"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${t.source === 'TikTok' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {t.source === 'TikTok' ? <Video size={18} /> : <Twitter size={18} />}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-lg group-hover:text-gistfi-green transition-colors">{t.topic}</h4>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <span>Source: {t.source}</span>
                                                <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                                <span className={`${t.volume.includes('Viral') ? 'text-red-400 font-bold' : 'text-gray-400'}`}>{t.volume} Volume</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-green-400 font-mono font-bold bg-green-500/10 px-2 py-1 rounded border border-green-500/20">{t.change}</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-gradient-to-r from-gistfi-green to-purple-500 h-full rounded-full" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- COMPOSE TAB --- */}
            {activeTab === 'compose' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                    <div className="bg-gistfi-dark border border-gray-800 rounded-xl p-4">
                        <textarea 
                            value={composeText}
                            onChange={(e) => setComposeText(e.target.value)}
                            placeholder="Draft your alpha..."
                            className="w-full bg-transparent text-white text-lg outline-none resize-none h-40 placeholder-gray-600"
                        />
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-800">
                             <span className={`text-xs ${composeText.length > 280 ? 'text-red-500' : 'text-gray-500'}`}>{composeText.length}/280</span>
                             <div className="flex space-x-2">
                                 <button 
                                    onClick={handleRefineTweet}
                                    disabled={isRefining || !composeText}
                                    className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-white transition-colors"
                                 >
                                     {isRefining ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-gistfi-green" />}
                                     <span>Optimize</span>
                                 </button>
                                 <button className="px-4 py-1.5 bg-[#1DA1F2] hover:bg-blue-500 text-white font-bold rounded-full text-sm transition-colors">
                                     Post
                                 </button>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- FEED TAB --- */}
            {activeTab === 'feed' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Your Recent Activity</h3>
                        <button 
                            onClick={() => refreshFeed(user.handle)}
                            disabled={isRefreshingFeed}
                            className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-gray-900"
                        >
                            <RefreshCw size={14} className={isRefreshingFeed ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {posts.map((post) => (
                        <div key={post.id} className="bg-gistfi-dark border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gistfi-green to-blue-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                    {user.handle.substring(1,3).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5 truncate">
                                            <span className="text-white font-bold text-sm truncate">{user.name}</span>
                                            <span className="text-gray-500 text-xs truncate">{user.handle}</span>
                                            <span className="text-gray-600 text-xs">•</span>
                                            <span className="text-gray-500 text-xs">{post.timestamp}</span>
                                        </div>
                                        <div className={`text-[10px] px-2 py-0.5 rounded border shrink-0 ${
                                            post.sentiment === 'BULLISH' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                            post.sentiment === 'BEARISH' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                            'border-gray-500/30 text-gray-400'
                                        }`}>
                                            {post.sentiment}
                                        </div>
                                    </div>
                                    <p className="text-gray-200 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>
                                    
                                    <div className="flex items-center justify-between text-gray-500 text-xs max-w-sm">
                                        <button className="flex items-center gap-2 hover:text-blue-400 transition-colors group">
                                            <div className="p-1.5 rounded-full group-hover:bg-blue-400/10">
                                                <MessageCircle size={14} />
                                            </div>
                                            <span>24</span>
                                        </button>
                                        <button className="flex items-center gap-2 hover:text-green-400 transition-colors group">
                                            <div className="p-1.5 rounded-full group-hover:bg-green-400/10">
                                                <Repeat size={14} />
                                            </div>
                                            <span>{post.retweets}</span>
                                        </button>
                                        <button className="flex items-center gap-2 hover:text-pink-500 transition-colors group">
                                            <div className="p-1.5 rounded-full group-hover:bg-pink-500/10">
                                                <Heart size={14} />
                                            </div>
                                            <span>{post.likes}</span>
                                        </button>
                                        <button className="flex items-center gap-2 hover:text-blue-400 transition-colors group">
                                            <div className="p-1.5 rounded-full group-hover:bg-blue-400/10">
                                                <Share size={14} />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {posts.length === 0 && (
                        <div className="text-center py-10 text-gray-600 text-sm flex flex-col items-center">
                            <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mb-3">
                                <Twitter className="text-gray-700" size={24} />
                            </div>
                            <p>No recent activity found.</p>
                            <button onClick={() => refreshFeed(user.handle)} className="text-gistfi-green mt-2 text-xs hover:underline">Refresh Feed</button>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* BOTTOM COMMAND LINE (Persistent) */}
        <div className="border-t border-gray-800 bg-black p-0 z-30 relative shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
             {/* Output Log */}
             {cmdOutput.length > 0 && (
                 <div className="max-h-32 overflow-y-auto p-3 space-y-1 bg-gray-900/95 border-b border-gray-800 font-mono text-xs backdrop-blur-md">
                     {cmdOutput.map((line, i) => (
                         <div key={i} className={line.type === 'user' ? 'text-gray-400' : 'text-gistfi-green'}>
                             {line.text}
                         </div>
                     ))}
                     <div ref={cmdEndRef} />
                 </div>
             )}
             
             {/* Command Input */}
             <div className="relative flex items-center p-3 bg-black">
                 <div className="absolute left-6 text-gistfi-green font-mono text-sm animate-pulse">{'>'}</div>
                 <input 
                    value={cmdInput}
                    onChange={(e) => setCmdInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
                    placeholder="Enter command (try /help)..."
                    className="w-full bg-gray-900/50 border border-gray-800 hover:border-gray-700 focus:border-gistfi-green rounded-lg py-2.5 pl-8 pr-10 text-white text-sm font-mono outline-none transition-all placeholder-gray-600 shadow-inner focus:shadow-[0_0_10px_rgba(0,82,255,0.2)]"
                 />
                 <div className="absolute right-6 flex items-center gap-2">
                     <div className="p-1 bg-gray-800 rounded text-[10px] text-gray-400 font-mono border border-gray-700 flex items-center gap-1 cursor-help" title="Terminal Active">
                        <Terminal size={10} />
                        CMD
                     </div>
                 </div>
             </div>
        </div>
    </div>
  );
};