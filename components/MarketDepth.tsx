
import React from 'react';
import { MarketDepth as MarketDepthType } from '../types';

interface MarketDepthProps {
  depth?: MarketDepthType;
}

const MarketDepth: React.FC<MarketDepthProps> = ({ depth }) => {
  if (!depth) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center px-4">
      <i className="fas fa-layer-group text-2xl mb-2 opacity-20"></i>
      <p className="text-[10px] font-medium italic">Depth data pending sync...</p>
    </div>
  );

  const total = (depth.totalBidVolume || 0) + (depth.totalAskVolume || 0);
  const bidPercent = total > 0 ? (depth.totalBidVolume / total) * 100 : 50;
  const askPercent = 100 - bidPercent;

  const maxVolume = Math.max(
    ...(depth.bids?.map(b => b.volume) || [1]),
    ...(depth.asks?.map(a => a.volume) || [1])
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Market Depth</h3>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-emerald-400">{bidPercent.toFixed(1)}%</span>
          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500" style={{ width: `${bidPercent}%` }}></div>
            <div className="h-full bg-rose-500" style={{ width: `${askPercent}%` }}></div>
          </div>
          <span className="text-[9px] font-bold text-rose-400">{askPercent.toFixed(1)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin">
        {/* Bids */}
        <div>
          <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase mb-2 border-b border-slate-800 pb-1">
            <span>Price (Buy)</span>
            <span>Qty</span>
          </div>
          <div className="space-y-1">
            {depth.bids?.map((bid, i) => (
              <div key={i} className="relative group flex justify-between text-[10px] py-0.5 px-1 overflow-hidden">
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 transition-all duration-500" 
                  style={{ width: `${(bid.volume / maxVolume) * 100}%` }}
                ></div>
                <span className="relative font-mono font-bold text-emerald-400">₹{bid.price.toLocaleString('en-IN')}</span>
                <span className="relative font-mono text-slate-300">{bid.volume.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Asks */}
        <div>
          <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase mb-2 border-b border-slate-800 pb-1">
            <span>Price (Sell)</span>
            <span>Qty</span>
          </div>
          <div className="space-y-1">
            {depth.asks?.map((ask, i) => (
              <div key={i} className="relative group flex justify-between text-[10px] py-0.5 px-1 overflow-hidden">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-rose-500/10 transition-all duration-500" 
                  style={{ width: `${(ask.volume / maxVolume) * 100}%` }}
                ></div>
                <span className="relative font-mono font-bold text-rose-400">₹{ask.price.toLocaleString('en-IN')}</span>
                <span className="relative font-mono text-slate-300">{ask.volume.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between text-[9px] font-bold text-slate-500">
        <span>TOTAL BIDS: <span className="text-slate-300 ml-1">{(depth.totalBidVolume || 0).toLocaleString('en-IN')}</span></span>
        <span>TOTAL ASKS: <span className="text-slate-300 ml-1">{(depth.totalAskVolume || 0).toLocaleString('en-IN')}</span></span>
      </div>
    </div>
  );
};

export default MarketDepth;
