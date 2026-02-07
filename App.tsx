
import React, { useState, useEffect } from 'react';
import { StockData, IndicatorConfig, TradingSignal } from './types';
import { enrichDataWithIndicators } from './utils/indicators';
import { getLiveMarketAnalysis, MarketAnalysisResponse } from './services/geminiService';
import IndicatorPanel from './components/IndicatorPanel';
import TradingChart from './components/TradingChart';

const INITIAL_CONFIGS: IndicatorConfig[] = [
  { id: 'ma', name: 'Moving Average (MA)', enabled: true, settings: { short: '13-EMA', cross: '20-EMA/50-SMA' }, description: 'Nifty optimized crossover.' },
  { id: 'rsi', name: 'RSI (10-Period)', enabled: true, settings: { period: 10, OS: 38, OB: 62 }, description: 'Reduced lag for NSE mid-caps.' },
  { id: 'macd', name: 'MACD Pro', enabled: false, settings: { fast: 8, slow: 17, signal: 9 }, description: 'Nifty intraday specialist.' },
  { id: 'bb', name: 'Bollinger Bands', enabled: true, settings: { period: 18, stdDev: 1.8 }, description: 'Reduces whipsaws in Indian indices.' },
  { id: 'stoch', name: 'Stochastic Oscillator', enabled: false, settings: { K: 10, D: 6, S: 6 }, description: 'Momentum confirmation.' },
  { id: 'ichimoku', name: 'Ichimoku Cloud', enabled: false, settings: { tenkan: 9, kijun: 26, senkou: 52 }, description: 'Comprehensive trend view.' },
  { id: 'adx', name: 'Trend ADX', enabled: false, settings: { period: 14, min: 25 }, description: 'Trend strength indicator.' },
  { id: 'vwap', name: 'VWAP + Volume', enabled: false, settings: { volMultiplier: 1.5 }, description: 'Benchmark for institutional traders.' },
  { id: 'fib', name: 'Fibonacci Levels', enabled: false, settings: { levels: '38.2, 61.8' }, description: 'Support/Resistance levels.' },
  { id: 'psar', name: 'Parabolic SAR', enabled: false, settings: { step: 0.01, max: 0.2 }, description: 'Trailing stop-loss strategy.' }
];

const QUICK_SYMBOLS = [
  { label: 'NIFTY 50', value: 'NIFTY 50' },
  { label: 'BANK NIFTY', value: 'BANK NIFTY' },
  { label: 'RELIANCE', value: 'RELIANCE NSE' },
  { label: 'TCS', value: 'TCS NSE' },
  { label: 'HDFC BANK', value: 'HDFCBANK NSE' },
  { label: 'INFY', value: 'INFY NSE' },
  { label: 'SBI', value: 'SBIN NSE' }
];

const STORAGE_KEY = 'niftypro_signals_v4';

const App: React.FC = () => {
  const [symbol, setSymbol] = useState('NIFTY 50');
  const [data, setData] = useState<StockData[]>([]);
  const [configs, setConfigs] = useState<IndicatorConfig[]>(INITIAL_CONFIGS);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [marketStatus, setMarketStatus] = useState('Neutral');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSignals(parsed.signals || []);
        setSymbol(parsed.symbol || 'NIFTY 50');
      } catch (e) {
        console.error("Storage load error", e);
      }
    }
    // Perform initial fetch on mount for default symbol
    runLiveAnalysis('NIFTY 50');
  }, []);

  const handleToggleIndicator = (id: string) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  const runLiveAnalysis = async (searchSymbol: string = symbol) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const result = await getLiveMarketAnalysis(searchSymbol);
      setSignals(result.signals);
      setMarketStatus(result.marketStatus);
      setSources(result.sourceUrls);
      
      // Enrich the actual historical data returned by Gemini with calculated indicators
      const enriched = enrichDataWithIndicators(result.historicalData);
      setData(enriched);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        signals: result.signals,
        symbol: searchSymbol
      }));
    } catch (e) {
      console.error(e);
      alert("Error fetching live data. Please try a specific NSE/BSE name.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickSelect = (val: string) => {
    setSymbol(val);
    runLiveAnalysis(val);
  };

  return (
    <div className="flex h-screen w-full bg-[#0f172a] overflow-hidden text-slate-200">
      <IndicatorPanel configs={configs} onToggle={handleToggleIndicator} />

      <main className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              NiftyPro Terminal <span className="text-[10px] bg-red-500/20 text-red-500 border border-red-500/50 px-2 py-0.5 rounded-full align-middle ml-2 animate-pulse uppercase font-black">Live Data</span>
            </h1>
            <p className="text-slate-400 text-sm">Real-time charts synced with BSE/NSE via Grounding</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                <input 
                  type="text" 
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && runLiveAnalysis()}
                  placeholder="e.g. RELIANCE, TCS, ZOMATO"
                  className="bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all w-full lg:w-72"
                />
              </div>
              <button 
                onClick={() => runLiveAnalysis()}
                disabled={isAnalyzing}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-xl ${
                  isAnalyzing 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 active:scale-95'
                }`}
              >
                {isAnalyzing ? <i className="fas fa-sync animate-spin"></i> : <i className="fas fa-chart-line"></i>}
                {isAnalyzing ? 'FETCHING...' : 'SYNC LIVE'}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {QUICK_SYMBOLS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleQuickSelect(item.value)}
                  className={`text-[10px] px-2.5 py-1 rounded border transition-all ${
                    symbol === item.value 
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          <section className="lg:col-span-2 flex flex-col min-h-0">
            <div className="flex-1 bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
              <TradingChart data={data} configs={configs} signals={signals} symbol={symbol} />
            </div>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              <div className="bg-slate-900/60 backdrop-blur p-3 rounded-xl border border-slate-800 min-w-[150px] shadow-lg">
                <span className="text-[9px] text-slate-500 block uppercase font-black mb-1 tracking-widest">Market Status</span>
                <span className={`${marketStatus.toLowerCase().includes('bull') ? 'text-emerald-400' : marketStatus.toLowerCase().includes('bear') ? 'text-rose-400' : 'text-slate-300'} font-bold flex items-center gap-2 text-xs`}>
                  <i className={`fas ${marketStatus.toLowerCase().includes('bull') ? 'fa-arrow-trend-up' : marketStatus.toLowerCase().includes('bear') ? 'fa-arrow-trend-down' : 'fa-minus'}`}></i>
                  {marketStatus.toUpperCase() || 'CALCULATING...'}
                </span>
              </div>
              <div className="bg-slate-900/60 backdrop-blur p-3 rounded-xl border border-slate-800 flex-1 overflow-hidden shadow-lg">
                <span className="text-[9px] text-slate-500 block uppercase font-black mb-1 tracking-widest">Exchange Grounding</span>
                <div className="flex gap-2 truncate">
                  {sources.length > 0 ? sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded truncate flex items-center gap-1.5">
                      <i className="fas fa-check-circle text-[8px] opacity-60"></i>
                      {s.title}
                    </a>
                  )) : <span className="text-[10px] text-slate-600 italic">Syncing with BSE/NSE feeds...</span>}
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6 overflow-hidden">
            <div className="bg-slate-900/50 backdrop-blur rounded-2xl border border-slate-800 p-5 flex flex-col h-full shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2 text-orange-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  Live Strategy Signals
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {signals.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-8">
                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50">
                       <i className="fas fa-radar text-2xl opacity-20"></i>
                    </div>
                    <p className="text-sm font-medium mb-1">No Active Signals</p>
                    <p className="text-xs opacity-60">Wait for confluence between multiple indicators on the current timeline.</p>
                  </div>
                ) : (
                  signals.map((signal, idx) => (
                    <div key={idx} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                            signal.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {signal.type} CONFIRMED
                          </span>
                          <h4 className="text-sm font-bold mt-1.5 text-slate-100">{signal.indicator}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-200">₹{signal.price}</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5 tracking-tighter uppercase">{signal.time}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3 leading-relaxed italic">
                        {signal.reason}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-500 uppercase font-black">Safety SL</span>
                          <span className="text-[11px] font-mono font-black text-rose-500">{signal.stopLoss}</span>
                        </div>
                        <div className="flex gap-1 items-center">
                          <div className="flex">
                            {[...Array(10)].map((_, i) => (
                              <div key={i} className={`w-1 h-2 rounded-full mx-0.5 ${i < (signal.strength || 0) ? 'bg-orange-500' : 'bg-slate-700'}`}></div>
                            ))}
                          </div>
                          <span className="text-[8px] text-slate-500 font-bold">{signal.strength}/10</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/30 to-slate-900/30 border border-blue-500/20 rounded-2xl p-5 shadow-inner">
              <h4 className="text-[10px] font-black text-blue-400 uppercase mb-2 tracking-widest flex items-center gap-2">
                <i className="fas fa-info-circle"></i> Timeline Sync
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Charts are updated using the latest available OHLC candles from the current session. Signals are identified in real-time by the AI core.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;
