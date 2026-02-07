
import { GoogleGenAI, Type } from "@google/genai";
import { StockData, TradingSignal, MarketDepth } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface MarketAnalysisResponse {
  signals: TradingSignal[];
  historicalData: StockData[];
  marketDepth: MarketDepth;
  currentPrice: number;
  marketStatus: string;
  sourceUrls: { title: string; uri: string }[];
}

/**
 * Utility to strip markdown code blocks from a string
 */
const cleanJsonString = (str: string): string => {
  return str.replace(/```json\n?|```/g, "").trim();
};

export const getLiveMarketAnalysis = async (symbol: string): Promise<MarketAnalysisResponse> => {
  const prompt = `
    Analyze the Indian stock market ticker or name: "${symbol}".
    Using Google Search, perform a deep dive to find:
    1. The official ticker on NSE or BSE (e.g., RELIANCE.NS or 500325).
    2. The current Live Trading Price (LTP).
    3. A series of approximately 15-20 data points representing the price movement (OHLC) over the current trading session or the last 24 hours. Use actual market timestamps.
    4. Market Depth Data: Find the current top 5 bids (buy orders) and top 5 asks (sell orders) with their respective prices and volumes. Calculate the total bid and ask volume.
    5. Technical indicators based on THIS data:
       - 13-EMA, 20-EMA, 50-SMA
       - RSI (14)
       - MACD (8, 17, 9)
       - Bollinger Bands (18, 1.8)
       - ADX, VWAP, Ichimoku, Parabolic SAR, Stochastic.
    
    Return a structured JSON including 'historicalData', 'marketDepth', and signals.
    'historicalData' is an array of OHLC points with 'time' (HH:mm format).
    'marketDepth' should contain 'bids' (array of {price, volume}), 'asks' (array of {price, volume}), 'totalBidVolume', and 'totalAskVolume'.
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
            marketDepth: {
              type: Type.OBJECT,
              properties: {
                bids: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      price: { type: Type.NUMBER },
                      volume: { type: Type.NUMBER }
                    },
                    required: ["price", "volume"]
                  }
                },
                asks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      price: { type: Type.NUMBER },
                      volume: { type: Type.NUMBER }
                    },
                    required: ["price", "volume"]
                  }
                },
                totalBidVolume: { type: Type.NUMBER },
                totalAskVolume: { type: Type.NUMBER }
              },
              required: ["bids", "asks", "totalBidVolume", "totalAskVolume"]
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
          required: ["historicalData", "marketDepth", "signals", "currentPrice", "marketStatus"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const cleanedText = cleanJsonString(text);
    const data = JSON.parse(cleanedText);
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
