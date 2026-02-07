
import { StockData } from '../types';

export const calculateSMA = (data: number[], period: number): number[] => {
  const sma = new Array(data.length).fill(null);
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma[i] = sum / period;
  }
  return sma;
};

export const calculateEMA = (data: number[], period: number): number[] => {
  const ema = new Array(data.length).fill(null);
  const k = 2 / (period + 1);
  let prevEma = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema[period - 1] = prevEma;
  
  for (let i = period; i < data.length; i++) {
    const currentEma = data[i] * k + prevEma * (1 - k);
    ema[i] = currentEma;
    prevEma = currentEma;
  }
  return ema;
};

export const calculateRSI = (data: number[], period: number): number[] => {
  const rsi = new Array(data.length).fill(null);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < period + 1; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    let currentGain = diff >= 0 ? diff : 0;
    let currentLoss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    rsi[i] = 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
};

export const enrichDataWithIndicators = (data: StockData[]): StockData[] => {
  const closes = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const volumes = data.map(d => d.volume);

  const ema13 = calculateEMA(closes, 13);
  const ema20 = calculateEMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const rsi10 = calculateRSI(closes, 10);
  
  // MACD (8, 17, 9)
  const ema8 = calculateEMA(closes, 8);
  const ema17 = calculateEMA(closes, 17);
  const macd = ema8.map((v, i) => (v !== null && ema17[i] !== null ? v - ema17[i] : null)) as number[];
  const validMacd = macd.filter(v => v !== null);
  const macdSignal = [...new Array(macd.length - validMacd.length).fill(null), ...calculateEMA(validMacd, 9)];

  // Bollinger Bands (18, 1.8)
  const sma18 = calculateSMA(closes, 18);
  const bbUpper = sma18.map((v, i) => {
    if (v === null) return null;
    const slice = closes.slice(i - 17, i + 1);
    const stdDev = Math.sqrt(slice.reduce((sq, n) => sq + Math.pow(n - v, 2), 0) / 18);
    return v + 1.8 * stdDev;
  });
  const bbLower = sma18.map((v, i) => {
    if (v === null) return null;
    const slice = closes.slice(i - 17, i + 1);
    const stdDev = Math.sqrt(slice.reduce((sq, n) => sq + Math.pow(n - v, 2), 0) / 18);
    return v - 1.8 * stdDev;
  });

  return data.map((d, i) => ({
    ...d,
    ema13: ema13[i],
    ema20: ema20[i],
    sma50: sma50[i],
    rsi: rsi10[i],
    macd: macd[i],
    macdSignal: macdSignal[i],
    macdHist: (macd[i] !== null && macdSignal[i] !== null) ? macd[i] - macdSignal[i] : null,
    bbUpper: bbUpper[i],
    bbLower: bbLower[i],
    bbMid: sma18[i],
  }));
};
