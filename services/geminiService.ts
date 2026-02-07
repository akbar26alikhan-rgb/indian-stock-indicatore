
import { GoogleGenAI, Type } from "@google/genai";
import { StockData, TradingSignal } from "../types";

// Note: For gemini-3-pro-preview, ensure the API key is valid for this model.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface MarketAnalysisResponse {
  signals: TradingSignal[];
  historicalData: StockData[];
  currentPrice: number;
  marketStatus: string;
  sourceUrls: { title: string; uri: string }[];
}

export const getLiveMarketAnalysis = async (symbol: string): Promise<MarketAnalysisResponse> => {
  const prompt = `
    Analyze the Indian stock market ticker or name: "${symbol}".
    Using Google Search, perform a deep dive to find:
    1. The official ticker on NSE or BSE (e.g., RELIANCE.NS or 500325).
    2. The current Live Trading Price (LTP).
    3. A series of approximately 15-20 data points representing the price movement (OHLC) over the current trading session or the last 24 hours. Use actual market timestamps.
    4. Technical indicators based on THIS data:
       - 13-EMA, 20-EMA, 50-SMA
       - RSI (14)
       - MACD (8, 17, 9)
       - Bollinger Bands (18, 1.8)
       - ADX, VWAP, Ichimoku, Parabolic SAR, Stochastic.
    
    Return a structured JSON including 'historicalData' which is an array of OHLC points with 'time' (HH:mm format).
    Provide high-probability BUY/SELL signals derived from confluence of these indicators.
    Each signal MUST specify which 'time' from the historicalData it triggered at.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            historicalData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING, description: "Market timestamp (e.g. 11:30)" },
                  open: { type: Type.NUMBER },
                  high: { type: Type.NUMBER },
                  low: { type: Type.NUMBER },
                  close: { type: Type.NUMBER },
                  volume: { type: Type.NUMBER }
                },
                required: ["time", "open", "high", "low", "close", "volume"]
              }
            },
            signals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "BUY, SELL, or HOLD" },
                  indicator: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  stopLoss: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  time: { type: Type.STRING, description: "Must match a 'time' from historicalData" },
                  strength: { type: Type.INTEGER, description: "Confirming indicators count (1-10)" }
                },
                required: ["type", "indicator", "price", "stopLoss", "reason", "time", "strength"]
              }
            },
            currentPrice: { type: Type.NUMBER },
            marketStatus: { type: Type.STRING, description: "Bullish, Bearish, or Neutral" }
          },
          required: ["historicalData", "signals", "currentPrice", "marketStatus"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const data = JSON.parse(text.trim());
    const sourceUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Market Source",
        uri: chunk.web?.uri
      }))
      .filter((chunk: any) => chunk.uri) || [];

    return { ...data, sourceUrls };
  } catch (error) {
    console.error("Live Analysis Error:", error);
    throw error;
  }
};
