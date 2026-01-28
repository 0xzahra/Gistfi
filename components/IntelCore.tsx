import React, { useState, useEffect, useRef } from 'react';
import { gistfiService } from '../services/geminiService';
import { XProfile, XPost, TrendingTopic } from '../types';
import { Twitter, ArrowRight, Loader2, Sparkles, TrendingUp, Send, Heart, Repeat, Search, PenTool, BarChart3, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const IntelCore: React.FC = () => {
  // --- STATE ---
  const [handle, setHandle] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [profile, setProfile] = useState<XProfile | null>(null);
  const [posts, setPosts] = useState<XPost[]>([]);
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'feed' | 'compose' | 'search'>('feed');
  const [composeText, setComposeText] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Command Line State (replaces simple chat)
  const [cmdInput, setCmdInput] = useState('');
  const [cmdOutput, setCmdOutput] = useState<{type: 'user'|'agent', text: string}[]>([]);
  const cmdEndRef = useRef<HTMLDivElement>(null);

  // --- EFFECTS ---
  useEffect(() => {
      // Check for persistent session
      const savedHandle = localStorage.getItem('gistfi_x_handle');
      if (savedHandle) {
          authenticate(savedHandle, true);
      }
      // Load trends background
      gistfiService.getTrending().then(setTrends);
  }, []);

  useEffect(() => {
      cmdEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cmdOutput]);

  // --- ACTIONS ---

  const authenticate = async (userHandle: string, isSilent = false) => {
      if (!userHandle) return;
      if (!isSilent) setIsLoadingAuth(true);
      
      try {
          // Simulate API Delay
          if (!isSilent) await new Promise(r => setTimeout(r, 1500));
          
          const data = await gistfiService.simulateXProfile(userHandle);
          setProfile(data.profile);
          setPosts(data.posts);
          setIsAuthenticated(true);
          localStorage.setItem('gistfi_x_handle', data.profile.handle);
          if (!isSilent) setCmdOutput(p => [...p, { type: 'agent', text: `Connection established: ${data.profile.handle}` }]);
      } catch (e) {
          alert("Auth failed.");
      } finally {
          setIsLoadingAuth(false);
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
      const cmd = cmdInput;
      setCmdInput('');
      setCmdOutput(p => [...p, { type: 'user', text: `> ${cmd}` }]);
      
      // Simple Command Handling
      if (cmd.startsWith('/logout')) {
          localStorage.removeItem('gistfi_x_handle');
          setIsAuthenticated(false);
          setProfile(null);
          setCmdOutput([]);
          return;
      }

      if (cmd.startsWith('/scan')) {
         const res = await gistfiService.quickScan(cmd.replace('/scan', ''));
         setCmdOutput(p => [...p, { type: 'agent', text: res }]);
         return;
      }

      // Default to analysis
      const res = await gistfiService.quickScan(cmd);
      setCmdOutput(p => [...p, { type: 'agent', text: res }]);
  };

  // --- RENDER: LOGIN ---
  if (!isAuthenticated) {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-black p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
              
              <div className="z-10 w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="text-center space-y-2">
                      <div className="mx-auto w-16 h-16 bg-gistfi-dark rounded-2xl flex items-center justify-center border border-gray-800 mb-6">
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
                              className="w-full bg-gistfi-dark border border-gray-800 text-white rounded-xl py-3 pl-8 pr-4 focus:border-gistfi-green focus:ring-1 focus:ring-gistfi-green outline-none transition-all"
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
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="flex flex-col h-full bg-black">
        {/* TOP BAR */}
        <div className="p-4 border-b border-gray-900 bg-black/80 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
             <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gistfi-green to-blue-400 flex items-center justify-center text-white font-bold text-xs">
                    {profile?.handle.substring(1,3).toUpperCase()}
                 </div>
                 <div>
                     <h2 className="text-sm font-bold text-white">{profile?.name}</h2>
                     <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                         <span>{profile?.followers} Followers</span>
                         <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                         <span className="text-gistfi-green">Alpha Score: {profile?.alphaScore}</span>
                     </div>
                 </div>
             </div>
             <div className="flex space-x-1">
                 <button onClick={() => setActiveTab('feed')} className={`p-2 rounded-lg transition-colors ${activeTab === 'feed' ? 'bg-gistfi-dark text-white' : 'text-gray-500 hover:text-white'}`}><Twitter size={18} /></button>
                 <button onClick={() => setActiveTab('compose')} className={`p-2 rounded-lg transition-colors ${activeTab === 'compose' ? 'bg-gistfi-dark text-white' : 'text-gray-500 hover:text-white'}`}><PenTool size={18} /></button>
                 <button onClick={() => setActiveTab('search')} className={`p-2 rounded-lg transition-colors ${activeTab === 'search' ? 'bg-gistfi-dark text-white' : 'text-gray-500 hover:text-white'}`}><Search size={18} /></button>
             </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* SEARCH TAB */}
            {activeTab === 'search' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Trending Alpha</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {trends.map((t, i) => (
                            <div key={i} className="bg-gistfi-dark border border-gray-800 p-4 rounded-xl flex justify-between items-center hover:border-gistfi-green/30 transition-colors cursor-pointer" onClick={() => setCmdInput(`Analyze ${t.topic}`)}>
                                <div>
                                    <div className="text-white font-bold">{t.topic}</div>
                                    <div className="text-xs text-gray-500">{t.source} • {t.volume} Vol</div>
                                </div>
                                <div className="text-green-500 text-sm font-mono">{t.change}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* COMPOSE TAB */}
            {activeTab === 'compose' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                    <div className="bg-gistfi-dark border border-gray-800 rounded-xl p-4">
                        <textarea 
                            value={composeText}
                            onChange={(e) => setComposeText(e.target.value)}
                            placeholder="What's happening?"
                            className="w-full bg-transparent text-white text-lg outline-none resize-none h-32 placeholder-gray-600"
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
                                     <span>Refine with AI</span>
                                 </button>
                                 <button className="px-4 py-1.5 bg-[#1DA1F2] hover:bg-blue-500 text-white font-bold rounded-full text-sm transition-colors">
                                     Post
                                 </button>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FEED TAB */}
            {activeTab === 'feed' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    {posts.map((post) => (
                        <div key={post.id} className="bg-gistfi-dark border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="text-white font-bold text-sm">{profile?.name}</span>
                                <span className="text-gray-500 text-xs">{profile?.handle} • {post.timestamp}</span>
                            </div>
                            <p className="text-white text-sm leading-relaxed mb-3">{post.content}</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-gray-500 text-xs">
                                    <span className="flex items-center space-x-1"><Heart size={14} /> <span>{post.likes}</span></span>
                                    <span className="flex items-center space-x-1"><Repeat size={14} /> <span>{post.retweets}</span></span>
                                </div>
                                <div className={`text-[10px] px-2 py-0.5 rounded border ${
                                    post.sentiment === 'BULLISH' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                    post.sentiment === 'BEARISH' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                    'border-gray-500/30 text-gray-400'
                                }`}>
                                    {post.sentiment}
                                </div>
                            </div>
                        </div>
                    ))}
                    {posts.length === 0 && (
                        <div className="text-center py-10 text-gray-600 text-sm">No recent activity found.</div>
                    )}
                </div>
            )}
        </div>

        {/* BOTTOM COMMAND LINE */}
        <div className="border-t border-gray-900 bg-black p-0">
             {cmdOutput.length > 0 && (
                 <div className="max-h-32 overflow-y-auto p-4 space-y-1 bg-black/50 border-b border-gray-900 font-mono text-xs">
                     {cmdOutput.map((line, i) => (
                         <div key={i} className={line.type === 'user' ? 'text-gray-400' : 'text-gistfi-green'}>
                             {line.text}
                         </div>
                     ))}
                     <div ref={cmdEndRef} />
                 </div>
             )}
             <div className="relative flex items-center p-2">
                 <div className="absolute left-4 text-gistfi-green font-mono text-sm">{'>'}</div>
                 <input 
                    value={cmdInput}
                    onChange={(e) => setCmdInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
                    placeholder="Enter command (/scan $ETH)..."
                    className="w-full bg-gistfi-dark border border-gray-800 rounded-lg py-2.5 pl-8 pr-4 text-white text-sm font-mono focus:border-gray-700 outline-none"
                 />
             </div>
        </div>
    </div>
  );
};