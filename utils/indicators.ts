
import { StockData } from '../types';

export const calculateSMA = (data: (number | null)[], period: number): (number | null)[] => {
  const sma = new Array(data.length).fill(null);
  if (data.length < period) return sma;

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    if (slice.some(v => v === null)) continue;
    const sum = slice.reduce((a, b) => (a as number) + (b as number), 0) as number;
    sma[i] = sum / period;
  }
  return sma;
};

export const calculateEMA = (data: (number | null)[], period: number): (number | null)[] => {
  const ema = new Array(data.length).fill(null);
  if (data.length < period) return ema;

  const k = 2 / (period + 1);
  
  // Find first valid slice for initial SMA
  let startIndex = period - 1;
  let firstValidSum = 0;
  let foundValid = false;
  
  for (let i = 0; i < data.length; i++) {
    if (data[i] !== null && !foundValid) {
        const slice = data.slice(i, i + period);
        if (slice.length === period && !slice.some(v => v === null)) {
            firstValidSum = slice.reduce((a, b) => (a as number) + (b as number), 0) as number;
            startIndex = i + period - 1;
            ema[startIndex] = firstValidSum / period;
            foundValid = true;
            break;
        }
    }
  }

  if (!foundValid) return ema;

  let prevEma = ema[startIndex] as number;
  for (let i = startIndex + 1; i < data.length; i++) {
    if (data[i] === null) {
      ema[i] = prevEma;
      continue;
    }
    const currentEma = (data[i] as number) * k + prevEma * (1 - k);
    ema[i] = currentEma;
    prevEma = currentEma;
  }
  return ema;
};

export const calculateRSI = (data: (number | null)[], period: number): (number | null)[] => {
  const rsi = new Array(data.length).fill(null);
  if (data.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const d1 = data[i];
    const d2 = data[i - 1];
    if (d1 === null || d2 === null) continue;
    const diff = d1 - d2;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  if (avgLoss === 0) rsi[period] = 100;
  else rsi[period] = 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < data.length; i++) {
    const d1 = data[i];
    const d2 = data[i - 1];
    if (d1 === null || d2 === null) {
        rsi[i] = rsi[i-1];
        continue;
    }
    const diff = d1 - d2;
    let currentGain = diff >= 0 ? diff : 0;
    let currentLoss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) rsi[i] = 100;
    else rsi[i] = 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
};

export const enrichDataWithIndicators = (data: StockData[]): StockData[] => {
  if (!data || data.length === 0) return [];
  
  const closes = data.map(d => d.close);

  const ema13 = calculateEMA(closes, 13);
  const ema20 = calculateEMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const rsi10 = calculateRSI(closes, 10);
  
  // MACD (8, 17, 9)
  const ema8 = calculateEMA(closes, 8);
  const ema17 = calculateEMA(closes, 17);
  const macd = ema8.map((v, i) => (v !== null && ema17[i] !== null ? v - (ema17[i] as number) : null));
  const macdSignal = calculateEMA(macd, 9);

  // Bollinger Bands (18, 1.8)
  const sma18 = calculateSMA(closes, 18);
  const bbUpper = sma18.map((v, i) => {
    if (v === null) return null;
    const slice = closes.slice(Math.max(0, i - 17), i + 1);
    const stdDev = Math.sqrt(slice.reduce((sq, n) => sq + Math.pow(n - (v as number), 2), 0) / slice.length);
    return (v as number) + 1.8 * stdDev;
  });
  const bbLower = sma18.map((v, i) => {
    if (v === null) return null;
    const slice = closes.slice(Math.max(0, i - 17), i + 1);
    const stdDev = Math.sqrt(slice.reduce((sq, n) => sq + Math.pow(n - (v as number), 2), 0) / slice.length);
    return (v as number) - 1.8 * stdDev;
  });

  return data.map((d, i) => ({
    ...d,
    ema13: ema13[i] ?? undefined,
    ema20: ema20[i] ?? undefined,
    sma50: sma50[i] ?? undefined,
    rsi: rsi10[i] ?? undefined,
    macd: macd[i] ?? undefined,
    macdSignal: macdSignal[i] ?? undefined,
    macdHist: (macd[i] !== null && macdSignal[i] !== null) ? (macd[i] as number) - (macdSignal[i] as number) : undefined,
    bbUpper: bbUpper[i] ?? undefined,
    bbLower: bbLower[i] ?? undefined,
    bbMid: sma18[i] ?? undefined,
  }));
};
