import React, { useState } from 'react';
import { View } from '../types';
import { Terminal, Activity, Zap, Mic, Settings, Hexagon, X, Check, Shield, User, Bell } from 'lucide-react';

interface LayoutProps {
  currentView: View;
  setView: (view: View) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, setView, children }) => {
  const [showSettings, setShowSettings] = useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => setView(view)}
      className={`flex items-center space-x-3 w-full p-2.5 rounded-lg transition-all duration-200 group font-medium text-sm ${
        currentView === view 
          ? 'bg-gistfi-green/10 text-gistfi-green' 
          : 'text-gray-400 hover:bg-gray-900 hover:text-white'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-black overflow-hidden selection:bg-gistfi-green selection:text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-900 flex flex-col bg-gistfi-dark hidden md:flex">
        <div className="p-6 flex items-center space-x-3">
          <div className="bg-gistfi-green text-white p-1.5 rounded-lg">
             <Hexagon size={20} fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Gistfi</span>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          <NavItem view={View.INTEL} icon={Terminal} label="Intel Core" />
          <NavItem view={View.WAR_ROOM} icon={Mic} label="War Room" />
          <NavItem view={View.GROWTH} icon={Activity} label="Growth Engine" />
          <NavItem view={View.TOOLS} icon={Zap} label="Execution Tools" />
        </nav>

        <div className="p-4 border-t border-gray-900">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full bg-black/50 hover:bg-black/80 transition-colors rounded-xl p-3 flex items-center space-x-3 border border-gray-800"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-gistfi-green to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-gistfi-green/20">
              0x
            </div>
            <div className="flex-1 text-left">
              <div className="text-white text-sm font-semibold">User.eth</div>
              <div className="text-[10px] text-gistfi-green font-medium flex items-center">
                Pro Plan <Shield size={8} className="ml-1" />
              </div>
            </div>
            <Settings size={16} className="text-gray-500" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-black">
        {children}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gistfi-dark border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Settings size={18} /> Settings
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white">
                    <X size={20} />
                </button>
             </div>
             
             <div className="p-6 space-y-6">
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Account</h4>
                    <div className="flex items-center justify-between p-3 bg-black rounded-lg border border-gray-800">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                                <User size={16} />
                             </div>
                             <div>
                                <div className="text-white text-sm font-medium">User.eth</div>
                                <div className="text-xs text-gray-500">Connected via Wallet</div>
                             </div>
                         </div>
                         <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-900/50">Active</span>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Integrations</h4>
                    <div className="space-y-2">
                         <div className="flex items-center justify-between p-3 bg-black rounded-lg border border-gray-800">
                            <span className="text-sm text-white">𝕏 (Twitter)</span>
                            <span className="text-xs flex items-center text-gistfi-green gap-1"><Check size={12}/> Connected</span>
                         </div>
                         <div className="flex items-center justify-between p-3 bg-black rounded-lg border border-gray-800">
                            <span className="text-sm text-white">TikTok</span>
                            <span className="text-xs flex items-center text-gistfi-green gap-1"><Check size={12}/> Connected</span>
                         </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Preferences</h4>
                    <div className="flex items-center justify-between p-2">
                        <span className="text-sm text-gray-300">Push Notifications</span>
                        <div className="w-10 h-5 bg-gistfi-green rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>
             </div>

             <div className="p-4 bg-black/50 border-t border-gray-800 text-center">
                 <button onClick={() => setShowSettings(false)} className="text-sm text-white font-medium hover:text-gistfi-green">Close</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};