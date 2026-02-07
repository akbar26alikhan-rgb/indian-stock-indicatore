
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
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between gap-4 py-0.5">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-mono">{entry.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const TradingChart: React.FC<TradingChartProps> = ({ data, configs, signals }) => {
  const isEnabled = (id: string) => configs.find(c => c.id === id)?.enabled;

  return (
    <div className="w-full h-full bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden">
      <div className="absolute top-4 left-6 z-10 flex gap-4 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur px-3 py-1 rounded border border-slate-700">
          <span className="text-xs text-slate-500 mr-2 uppercase tracking-wider font-bold">Symbol</span>
          <span className="text-sm font-mono font-bold text-white">NIFTY 50</span>
        </div>
        <div className="bg-slate-900/80 backdrop-blur px-3 py-1 rounded border border-slate-700">
          <span className="text-xs text-slate-500 mr-2 uppercase tracking-wider font-bold">LTP</span>
          <span className="text-sm font-mono font-bold text-green-400">
            {data[data.length - 1]?.close.toFixed(2)}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 60, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#475569" 
            tick={{ fontSize: 10 }}
            tickFormatter={(str) => str.split(' ')[1] || str}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="#475569" 
            tick={{ fontSize: 10 }} 
            orientation="right"
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Signal Visualizations */}
          {signals.map((signal, index) => {
            if (!signal.time) return null;
            const fillColor = signal.type === 'BUY' ? '#10b981' : '#ef4444';
            
            // Find the index of this time to potentially create a small area width
            const dataIndex = data.findIndex(d => d.time === signal.time);
            const x2 = dataIndex >= 0 && dataIndex < data.length - 1 ? data[dataIndex + 1].time : signal.time;

            return (
              <ReferenceArea
                key={`signal-${index}`}
                x1={signal.time}
                x2={x2}
                fill={fillColor}
                fillOpacity={0.15}
                stroke={fillColor}
                strokeOpacity={0.4}
                strokeWidth={1}
                label={{ 
                  value: signal.type, 
                  position: 'insideTop', 
                  fill: fillColor, 
                  fontSize: 10, 
                  fontWeight: 'bold',
                  offset: 10
                }}
              />
            );
          })}

          {/* Main Price Area */}
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorClose)" 
            strokeWidth={2}
          />

          {/* Indicators */}
          {isEnabled('ma') && (
            <>
              <Line type="monotone" dataKey="ema13" stroke="#f59e0b" dot={false} strokeWidth={1.5} name="13-EMA" />
              <Line type="monotone" dataKey="ema20" stroke="#10b981" dot={false} strokeWidth={1.5} name="20-EMA" />
              <Line type="monotone" dataKey="sma50" stroke="#ef4444" dot={false} strokeWidth={1.5} name="50-SMA" />
            </>
          )}

          {isEnabled('bb') && (
            <>
              <Line type="monotone" dataKey="bbUpper" stroke="#6366f1" dot={false} strokeDasharray="5 5" name="BB Upper" />
              <Line type="monotone" dataKey="bbLower" stroke="#6366f1" dot={false} strokeDasharray="5 5" name="BB Lower" />
              <Line type="monotone" dataKey="bbMid" stroke="#6366f1" dot={false} opacity={0.3} name="BB Mid" />
            </>
          )}

          {/* RSI Panel Simulation (as a sub-line for simple view) */}
          {isEnabled('rsi') && (
             <Line type="monotone" dataKey="rsi" stroke="#ec4899" dot={false} yAxisId="rsi" name="RSI (10)" />
          )}

          <YAxis yAxisId="rsi" hide domain={[0, 100]} />

          <Bar dataKey="volume" fill="#475569" opacity={0.2} yAxisId="volume" />
          <YAxis yAxisId="volume" hide domain={[0, (dataMax: number) => dataMax * 5]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradingChart;
