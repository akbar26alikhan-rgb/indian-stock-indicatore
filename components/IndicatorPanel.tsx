
import React from 'react';
import { IndicatorConfig } from '../types';

interface IndicatorPanelProps {
  configs: IndicatorConfig[];
  onToggle: (id: string) => void;
}

const IndicatorPanel: React.FC<IndicatorPanelProps> = ({ configs, onToggle }) => {
  return (
    <div className="bg-slate-900/50 backdrop-blur-md border-r border-slate-800 w-80 h-full overflow-y-auto p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2 px-2">
        <i className="fas fa-chart-line text-blue-500 text-xl"></i>
        <h2 className="text-lg font-bold">Market Strategies</h2>
      </div>

      <div className="space-y-3">
        {configs.map(config => (
          <div 
            key={config.id}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              config.enabled 
                ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/5' 
                : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
            }`}
            onClick={() => onToggle(config.id)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">{config.name}</span>
              <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {config.description}
            </p>
            {config.enabled && (
              <div className="mt-2 pt-2 border-t border-blue-500/20 flex flex-wrap gap-1">
                {Object.entries(config.settings).map(([key, val]) => (
                  <span key={key} className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 rounded uppercase font-bold">
                    {key}: {val}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-800 px-2 text-[10px] text-slate-500 italic">
        * Stop-loss parameters optimized for Nifty & Bank Nifty volatility.
      </div>
    </div>
  );
};

export default IndicatorPanel;
