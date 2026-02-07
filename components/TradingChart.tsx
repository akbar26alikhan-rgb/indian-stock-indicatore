
import React from 'react';
import { 
  ComposedChart, 
  Line, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';
import { StockData, IndicatorConfig, TradingSignal } from '../types';

interface TradingChartProps {
  data: StockData[];
  configs: IndicatorConfig[];
  signals: TradingSignal[];
  symbol: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
        <p className="text-slate-400 mb-1 font-bold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between gap-4 py-0.5">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-mono font-bold">{entry.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const TradingChart: React.FC<TradingChartProps> = ({ data, configs, signals, symbol }) => {
  const isEnabled = (id: string) => configs.find(c => c.id === id)?.enabled;

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950/50">
      <div className="absolute top-4 left-6 z-10 flex gap-4 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur px-4 py-1.5 rounded-lg border border-slate-700 shadow-xl">
          <span className="text-[10px] text-slate-500 mr-2 uppercase tracking-widest font-black">ACTIVE TICKER</span>
          <span className="text-sm font-mono font-black text-blue-400">{symbol}</span>
        </div>
        <div className="bg-slate-900/90 backdrop-blur px-4 py-1.5 rounded-lg border border-slate-700 shadow-xl">
          <span className="text-[10px] text-slate-500 mr-2 uppercase tracking-widest font-black">LTP (SYNCED)</span>
          <span className="text-sm font-mono font-black text-emerald-400">
            ₹{data[data.length - 1]?.close.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 70, right: 40, left: 10, bottom: 20 }}>
          <defs>
            <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            
            <linearGradient id="buySignalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
              <stop offset="100%" stopColor="#14532d" stopOpacity={0.6} />
            </linearGradient>

            <linearGradient id="sellSignalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="1 4" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#475569" 
            tick={{ fontSize: 9, fontWeight: 'bold' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="#475569" 
            tick={{ fontSize: 9, fontWeight: 'mono' }} 
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => val.toLocaleString('en-IN')}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
          
          {signals.map((signal, index) => {
            if (!signal.time) return null;
            const gradientId = signal.type === 'BUY' ? 'url(#buySignalGradient)' : 'url(#sellSignalGradient)';
            const strokeColor = signal.type === 'BUY' ? '#10b981' : '#ef4444';
            const fillOpacity = 0.1 + ((signal.strength || 1) / 10 * 0.3);

            const dataIndex = data.findIndex(d => d.time === signal.time);
            if (dataIndex === -1) return null;

            // Signal width spanning 1.5% of the visible chart for visual emphasis
            const x2 = data[dataIndex + 1]?.time || data[dataIndex].time;

            return (
              <ReferenceArea
                key={`signal-${index}`}
                x1={signal.time}
                x2={x2}
                fill={gradientId}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeOpacity={0.6}
                strokeWidth={2}
                label={{ 
                  value: `${signal.type}`, 
                  position: 'insideTop', 
                  fill: strokeColor, 
                  fontSize: 10, 
                  fontWeight: 'black',
                  offset: 15
                }}
              />
            );
          })}

          <Area 
            type="monotone" 
            dataKey="close" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorClose)" 
            strokeWidth={2}
            animationDuration={800}
          />

          {isEnabled('ma') && (
            <>
              <Line type="monotone" dataKey="ema13" stroke="#f59e0b" dot={false} strokeWidth={1} name="13-EMA" />
              <Line type="monotone" dataKey="ema20" stroke="#10b981" dot={false} strokeWidth={1} name="20-EMA" />
              <Line type="monotone" dataKey="sma50" stroke="#ef4444" dot={false} strokeWidth={1.5} name="50-SMA" />
            </>
          )}

          {isEnabled('bb') && (
            <>
              <Line type="monotone" dataKey="bbUpper" stroke="#6366f1" dot={false} strokeDasharray="3 3" name="BB Upper" />
              <Line type="monotone" dataKey="bbLower" stroke="#6366f1" dot={false} strokeDasharray="3 3" name="BB Lower" />
              <Line type="monotone" dataKey="bbMid" stroke="#6366f1" dot={false} opacity={0.2} name="BB Mid" />
            </>
          )}

          {isEnabled('rsi') && (
             <Line type="monotone" dataKey="rsi" stroke="#ec4899" dot={false} yAxisId="rsi" name="RSI (10)" strokeWidth={1} />
          )}

          <YAxis yAxisId="rsi" hide domain={[0, 100]} />
          <Bar dataKey="volume" fill="#475569" opacity={0.1} yAxisId="volume" />
          <YAxis yAxisId="volume" hide domain={[0, (dataMax: number) => dataMax * 4]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradingChart;
