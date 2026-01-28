import React from 'react';
import { ShieldAlert, Zap, Banknote } from 'lucide-react';

export const ToolsPanel: React.FC = () => {
  return (
    <div className="p-6 h-full overflow-y-auto bg-black">
        <h2 className="text-2xl font-bold mb-6 text-white">Execution Tools</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gistfi-dark border border-gray-800 p-6 rounded-xl hover:border-gistfi-green transition-all cursor-pointer">
                <ShieldAlert className="text-gistfi-red mb-3" size={24} />
                <h3 className="font-bold text-white mb-1">Rug Scan</h3>
                <p className="text-xs text-gray-500">Deep wallet analysis.</p>
            </div>

            <div className="bg-gistfi-dark border border-gray-800 p-6 rounded-xl hover:border-gistfi-green transition-all cursor-pointer">
                <Zap className="text-yellow-400 mb-3" size={24} />
                <h3 className="font-bold text-white mb-1">Sniper</h3>
                <p className="text-xs text-gray-500">MEV-protected buys.</p>
            </div>

            <div className="bg-gistfi-dark border border-gray-800 p-6 rounded-xl hover:border-gistfi-green transition-all cursor-pointer">
                <Banknote className="text-gistfi-green mb-3" size={24} />
                <h3 className="font-bold text-white mb-1">Deployer</h3>
                <p className="text-xs text-gray-500">Instant token launch.</p>
            </div>
        </div>
    </div>
  );
};