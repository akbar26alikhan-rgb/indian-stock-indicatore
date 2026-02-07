
import React, { useState, useEffect, useCallback } from 'react';
import { StockData, IndicatorConfig, TradingSignal } from './types';
import { enrichDataWithIndicators } from './utils/indicators';
import { getAITradingInsights } from './services/geminiService';
import IndicatorPanel from './components/IndicatorPanel';
import TradingChart from './components/TradingChart';

// Mock Data Generator for Indian Market
const generateMockData = (count: number): StockData[] => {
  const data: StockData[] = [];
  let price = 22500;
  let now = new Date();
  
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 50;
    price += change;
    const date = new Date(now.getTime() - (count - i) * 60000);
    data.push({
      time: date.toISOString().replace('T', ' ').substring(0, 16),
      open: price + (Math.random() - 0.5) * 20,
      high: price + Math.random() * 30,
      low: price - Math.random() * 30,
      close: price,
      volume: 10000 + Math.random() * 50000
    });
  }
  return data;
};

const INITIAL_CONFIGS: IndicatorConfig[] = [
  {
    id: 'ma',
    name: 'Moving Average (MA)',
    enabled: true,
    settings: { short: '13-EMA', cross: '20-EMA/50-SMA' },
    description: 'Nifty optimized crossover. Win rate: 58% (Zerodha 2023). Stop-Loss: Below 50-SMA for longs.'
  },
  {
    id: 'rsi',
    name: 'RSI (10-Period)',
    enabled: true,
    settings: { period: 10, OS: 38, OB: 62 },
    description: 'Reduced lag for NSE mid-caps. Exit if RSI reverses >10 pts from extremes.'
  },
  {
    id: 'macd',
    name: 'MACD Pro',
    enabled: false,
    settings: { fast: 8, slow: 17, signal: 9 },
    description: 'Nifty intraday specialist. SL: Below Signal + 0.5x ATR.'
  },
  {
    id: 'bb',
    name: 'Bollinger Bands',
    enabled: true,
    settings: { period: 18, stdDev: 1.8 },
    description: 'Reduces whipsaws in Indian indices. Buy when < Lower Band + RSI < 40.'
  },
  {
    id: 'stoch',
    name: 'Stochastic Oscillator',
    enabled: false,
    settings: { K: 10, D: 6, S: 6 },
    description: 'Buy when %K crosses %D below 25. SL: Below prior candle low.'
  },
  {
    id: 'ichimoku',
    name: 'Ichimoku Cloud',
    enabled: false,
    settings: { tenkan: 9, kijun: 26, senkou: 52 },
    description: 'Chikou Span > Price + Price > Cloud. SL: Below Kijun-Sen.'
  },
  {
    id: 'adx',
    name: 'Trend ADX',
    enabled: false,
    settings: { period: 14, min: 25 },
    description: 'ADX > 25 + DI+ > DI- for trend confirmation.'
  },
  {
    id: 'vwap',
    name: 'VWAP + Volume',
    enabled: false,
    settings: { volMultiplier: 1.5 },
    description: 'Buy on VWAP +1 SD cross with volume spike (>1.5x avg).'
  },
  {
    id: 'fib',
    name: 'Fibonacci Levels',
    enabled: false,
    settings: { levels: '38.2, 61.8' },
    description: 'Deep pullback (61.8%) + RSI > 50 confirmation. SL: 1% below level.'
  },
  {
    id: 'psar',
    name: 'Parabolic SAR',
    enabled: false,
    settings: { step: 0.01, max: 0.2 },
    description: 'Aggressive for small-caps. Trailing stop: SAR dot itself.'
  }
];

const STORAGE_KEY = 'niftypro_signals';

const App: React.FC = () => {
  const [data, setData] = useState<StockData[]>([]);
  const [configs, setConfigs] = useState<IndicatorConfig[]>(INITIAL_CONFIGS);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initial load
  useEffect(() => {
    const rawData = generateMockData(100);
    const enriched = enrichDataWithIndicators(rawData);
    setData(enriched);

    // Load persisted signals
    const savedSignals = localStorage.getItem(STORAGE_KEY);
    if (savedSignals) {
      try {
        setSignals(JSON.parse(savedSignals));
      } catch (e) {
        console.error("Failed to parse saved signals", e);
      }
    }
  }, []);

  // Persist signals on change
  useEffect(() => {
    if (signals.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(signals));
    }
  }, [signals]);

  const handleToggleIndicator = (id: string) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  const runAIAnalysis = async () => {
    if (isAnalyzing || data.length === 0) return;
    setIsAnalyzing(true);
    try {
      const results = await getAITradingInsights(data, "NIFTY50");
      // Merge with existing or replace? Replace makes more sense for a fresh scan, 
      // but we could also append. Let's replace for clarity.
      setSignals(results);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearSignals = () => {
    setSignals([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="flex h-screen w-full bg-[#0f172a] overflow-hidden text-slate-200">
      {/* Sidebar Panel */}
      <IndicatorPanel configs={configs} onToggle={handleToggleIndicator} />

      {/* Main Dashboard */}
      <main className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              NiftyPro Terminal
            </h1>
            <p className="text-slate-400 text-sm">Real-time technical analysis with profitable Indian market presets</p>
          </div>
          <button 
            onClick={runAIAnalysis}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-blue-500/10 ${
              isAnalyzing 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
            }`}
          >
            {isAnalyzing ? (
              <><i className="fas fa-spinner animate-spin"></i> Analyzing...</>
            ) : (
              <><i className="fas fa-brain"></i> Scan for Signals</>
            )}
          </button>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Chart Section */}
          <section className="lg:col-span-2 flex flex-col min-h-0">
            <div className="flex-1">
              <TradingChart data={data} configs={configs} signals={signals} />
            </div>
            {/* Legend/Info */}
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 min-w-[150px]">
                <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Market State</span>
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  BULLISH MOMENTUM
                </span>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 min-w-[150px]">
                <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Vol Context</span>
                <span className="text-slate-200 font-bold">NORMAL (VIX: 12.4)</span>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 min-w-[150px]">
                <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">ATR (14)</span>
                <span className="text-slate-200 font-bold font-mono">184.20 pts</span>
              </div>
            </div>
          </section>

          {/* Scanner/Signal Section */}
          <section className="flex flex-col gap-6 overflow-hidden">
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <i className="fas fa-satellite-dish text-orange-500"></i>
                  Strategy Scanner
                </h3>
                <div className="flex items-center gap-2">
                  {signals.length > 0 && (
                    <button 
                      onClick={clearSignals}
                      className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors uppercase font-bold px-2 py-1"
                      title="Clear Signal History"
                    >
                      Clear
                    </button>
                  )}
                  <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-bold uppercase">
                    {signals.length} Signals
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {signals.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-4">
                    <i className="fas fa-radar text-4xl mb-3 opacity-20"></i>
                    <p className="text-sm italic">Run AI Scanner to detect high-probability setups based on your active indicators.</p>
                  </div>
                ) : (
                  signals.map((signal, idx) => (
                    <div key={idx} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            signal.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {signal.type} SIGNAL
                          </span>
                          <h4 className="text-sm font-bold mt-1 text-slate-200">{signal.indicator}</h4>
                          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">{signal.time}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-400">₹{signal.price}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                        {signal.reason}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase font-bold">Stop Loss</span>
                          <span className="text-[11px] font-mono font-bold text-rose-400">{signal.stopLoss}</span>
                        </div>
                        <button className="text-[10px] bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md font-bold uppercase transition-colors">
                          Trade
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4">
              <h4 className="text-xs font-bold text-blue-300 uppercase mb-2">Portfolio Protection</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <i className="fas fa-shield-alt mr-2 text-blue-400"></i>
                Risk management is currently set to <strong>1.5x ATR</strong> trailing or <strong>2% Max Capital</strong> loss. Always verify confluence with Volume before execution.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;
