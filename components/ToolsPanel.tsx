import React, { useState } from 'react';
import { ShieldAlert, Zap, Banknote, CheckCircle2 } from 'lucide-react';

export const ToolsPanel: React.FC = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const activate = (tool: string) => {
      setActiveTool(tool);
      setTimeout(() => setActiveTool(null), 2000);
  }

  const ToolCard = ({ title, desc, icon: Icon, color, id }: any) => (
      <div 
        onClick={() => activate(id)}
        className={`bg-gistfi-dark border border-gray-800 p-6 rounded-xl hover:border-gistfi-green transition-all cursor-pointer relative overflow-hidden group`}
      >
        {activeTool === id && (
            <div className="absolute inset-0 bg-gistfi-green/10 flex items-center justify-center backdrop-blur-sm z-10 animate-in fade-in">
                <div className="bg-black p-2 rounded-full border border-gistfi-green">
                    <CheckCircle2 className="text-gistfi-green" size={24} />
                </div>
            </div>
        )}
        <Icon className={`${color} mb-3 group-hover:scale-110 transition-transform`} size={24} />
        <h3 className="font-bold text-white mb-1">{title}</h3>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
  );

  return (
    <div className="p-6 h-full overflow-y-auto bg-black">
        <h2 className="text-2xl font-bold mb-6 text-white">Execution Tools</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ToolCard id="rug" title="Rug Scan" desc="Deep wallet analysis." icon={ShieldAlert} color="text-gistfi-red" />
            <ToolCard id="sniper" title="Sniper" desc="MEV-protected buys." icon={Zap} color="text-yellow-400" />
            <ToolCard id="deploy" title="Deployer" desc="Instant token launch." icon={Banknote} color="text-gistfi-green" />
        </div>
    </div>
  );
};