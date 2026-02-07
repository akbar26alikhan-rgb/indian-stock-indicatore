
import { GoogleGenAI, Type } from "@google/genai";
import { StockData, TradingSignal } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAITradingInsights = async (data: StockData[], symbol: string): Promise<TradingSignal[]> => {
  const recentData = data.slice(-20);
  const prompt = `
    Analyze the following Indian stock market data for ${symbol} based on these 10 indicator strategies:
    1. 13-EMA Momentum
    2. 20-EMA/50-SMA Crossover
    3. 10-period RSI (Oversold 38/Overbought 62)
    4. MACD (8, 17, 9) + Histogram trend
    5. Bollinger Bands (18, 1.8 std dev)
    6. Stochastic (10, 6, 6)
    7. Ichimoku (9, 26, 52)
    8. ADX(14) > 25
    9. VWAP + Volume (>1.5x avg)
    10. Parabolic SAR (Step 0.01)

    Current Price: ${recentData[recentData.length - 1].close}
    Data points: ${JSON.stringify(recentData.map(d => ({ 
      t: d.time,
      c: d.close, 
      r: d.rsi, 
      m: d.macdHist, 
      v: d.volume 
    })))}

    Provide high-probability BUY or SELL signals based on these specific Indian market presets.
    For each signal, you MUST include the "time" from the provided data points where the signal occurred.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "BUY, SELL, or HOLD" },
              indicator: { type: Type.STRING },
              price: { type: Type.NUMBER },
              stopLoss: { type: Type.STRING },
              reason: { type: Type.STRING },
              time: { type: Type.STRING, description: "The exact timestamp string (t) from the provided data points where this signal triggered." }
            },
            required: ["type", "indicator", "price", "stopLoss", "reason", "time"]
          }
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("AI Insights Error:", error);
    return [];
  }
};
