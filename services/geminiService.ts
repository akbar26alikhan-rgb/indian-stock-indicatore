
import { GoogleGenAI, Type } from "@google/genai";
import { StockData, TradingSignal } from "../types";

// Note: For gemini-3-pro-preview, ensure the API key is valid for this model.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface MarketAnalysisResponse {
  signals: TradingSignal[];
  currentPrice: number;
  marketStatus: string;
  sourceUrls: { title: string; uri: string }[];
}

export const getLiveMarketAnalysis = async (symbol: string): Promise<MarketAnalysisResponse> => {
  const prompt = `
    Analyze the Indian stock market ticker or name: "${symbol}".
    If the name is vague, find the official NSE or BSE ticker (e.g., "Reliance" -> "RELIANCE.NS").
    
    Using Google Search, find:
    1. Current live market price (LTP).
    2. Today's Day High, Day Low, and Open.
    3. Technical values for:
       - 13-EMA, 20-EMA, 50-SMA
       - RSI (14-period)
       - MACD Histogram (8, 17, 9)
       - Bollinger Bands (18, 1.8)
       - Stochastic Oscillator
       - ADX (14)
       - Ichimoku Cloud (current position vs kumo)
       - Parabolic SAR
       - Fibonacci 61.8% and 38.2% levels from recent swing.
       - VWAP (for intraday)

    Based on these 10 indicator presets, provide high-probability BUY, SELL, or HOLD signals.
    Focus on confluence: only provide signals where multiple indicators align.
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
            signals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "BUY, SELL, or HOLD" },
                  indicator: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  stopLoss: { type: Type.STRING, description: "Calculated stop loss value based on technicals." },
                  reason: { type: Type.STRING, description: "Concise technical reason for the signal." },
                  time: { type: Type.STRING, description: "Market time of the signal." }
                },
                required: ["type", "indicator", "price", "stopLoss", "reason", "time"]
              }
            },
            currentPrice: { type: Type.NUMBER },
            marketStatus: { type: Type.STRING, description: "Bullish, Bearish, or Neutral" }
          },
          required: ["signals", "currentPrice", "marketStatus"]
        }
      }
    });

    const data = JSON.parse(response.text.trim());
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
