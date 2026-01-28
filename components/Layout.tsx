import React from 'react';
import { View } from '../types';
import { Terminal, Activity, Zap, Mic, Settings, Hexagon } from 'lucide-react';

interface LayoutProps {
  currentView: View;
  setView: (view: View) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, setView, children }) => {
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
    <div className="flex h-screen bg-black overflow-hidden selection:bg-gistfi-green selection:text-white">
      {/* Sidebar */}
      <aside className="w-60 border-r border-gray-900 flex flex-col bg-gistfi-dark">
        <div className="p-6 flex items-center space-x-3">
          <div className="bg-gistfi-green text-white p-1 rounded-full">
             <Hexagon size={20} fill="currentColor" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Gistfi</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <NavItem view={View.INTEL} icon={Terminal} label="Intel" />
          <NavItem view={View.WAR_ROOM} icon={Mic} label="Live" />
          <NavItem view={View.GROWTH} icon={Activity} label="Growth" />
          <NavItem view={View.TOOLS} icon={Zap} label="Tools" />
        </nav>

        <div className="p-4 border-t border-gray-900">
          <div className="bg-black/50 rounded-xl p-3 flex items-center space-x-3 border border-gray-800">
            <div className="w-8 h-8 bg-gistfi-green rounded-full flex items-center justify-center text-white font-bold text-xs">
              0x
            </div>
            <div className="flex-1">
              <div className="text-white text-sm font-semibold">User.eth</div>
              <div className="text-[10px] text-gray-500">Pro Plan</div>
            </div>
            <Settings size={14} className="text-gray-500 cursor-pointer hover:text-white" />
          </div>
          <div className="mt-4 text-center">
             <span className="text-[10px] text-gray-600">Built by arewa.base.eth</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-black">
        <div className="flex-1 overflow-auto">
            {children}
        </div>
      </main>
    </div>
  );
};