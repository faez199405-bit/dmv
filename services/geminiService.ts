
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getFoodRecommendation = async (menuNames: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Berdasarkan menu berikut: ${menuNames.join(", ")}. Berikan satu cadangan ringkas (max 30 patah perkataan) menu mana yang sedap dimakan bersama atau cadangan untuk makan tengah hari. Gunakan nada yang mesra dan ceria dalam Bahasa Melayu.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Maaf, Mommy tengah sibuk di dapur sekarang. Cuba lagi nanti ya!";
  }
};
