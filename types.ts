
export interface StockData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema13?: number;
  ema20?: number;
  sma50?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  bbUpper?: number;
  bbLower?: number;
  bbMid?: number;
  stochK?: number;
  stochD?: number;
  adx?: number;
  plusDI?: number;
  minusDI?: number;
  vwap?: number;
  psar?: number;
  tenkan?: number;
  kijun?: number;
  senkouA?: number;
  senkouB?: number;
}

export interface IndicatorConfig {
  id: string;
  name: string;
  enabled: boolean;
  settings: Record<string, any>;
  description: string;
}

export enum MarketTrend {
  BULLISH = 'Bullish',
  BEARISH = 'Bearish',
  NEUTRAL = 'Neutral'
}

export interface TradingSignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  indicator: string;
  price: number;
  stopLoss: string;
  reason: string;
  time?: string;
  strength?: number;
}
