import { GoogleGenAI, Type } from "@google/genai";
import { FoodAnalysis } from '../types';

// REMOVED: Top-level initialization which causes "process is not defined" crash on app load.
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFoodImage = async (base64Image: string): Promise<FoodAnalysis> => {
  try {
    // Initialize client lazily. 
    // This ensures that if the API key is missing, the app loads first and only fails when action is taken.
    // The 'define' in vite.config.ts will replace process.env.API_KEY with the actual string.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API Key is missing!");
    }
    const ai = new GoogleGenAI({ apiKey: apiKey || '' });

    // UPDATED: Use 'gemini-3-flash-preview' for Multimodal Vision + JSON tasks.
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      Analyze this food image for a weight-loss application called 'SlimChew AI'.
      
      Tasks:
      1. Identify the main dish.
      2. Estimate the approximate calories for a standard serving size.
      3. Assess the 'Texture Density' (Soft, Medium, or Hard). Harder/Denser foods (like steak, nuts) require more chewing than Soft foods (like porridge).
      4. Calculate 'Required Chews' based on this formula logic:
         - Base chews: 15
         - If High Calorie (>500kcal): Add 10
         - If Hard Texture: Add 10
         - If Medium Texture: Add 5
         - Max chews: 50
      5. Generate a 'Fat Shield Tip': A 1-sentence psychological command linking chewing to blocking fat absorption (e.g., "Chew 30 times to break down the fat matrix.").

      Respond in JSON format.
      IMPORTANT: text fields (foodName, fatShieldTip) MUST be in Simplified Chinese.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            calories: { type: Type.INTEGER },
            textureLevel: { type: Type.STRING, enum: ['Soft', 'Medium', 'Hard'] },
            recommendedChews: { type: Type.INTEGER },
            fatShieldTip: { type: Type.STRING }
          },
          required: ['foodName', 'calories', 'textureLevel', 'recommendedChews', 'fatShieldTip']
        }
      },
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText) as FoodAnalysis;
    
    return {
      foodName: data.foodName || "未知餐食",
      calories: data.calories || 300,
      textureLevel: (data.textureLevel as any) || 'Medium',
      recommendedChews: data.recommendedChews || 25,
      fatShieldTip: data.fatShieldTip || "充分咀嚼可以帮助身体更好地代谢热量。"
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return safe default
    return {
      foodName: "健康餐食 (AI 离线)",
      calories: 400,
      textureLevel: 'Medium',
      recommendedChews: 30,
      fatShieldTip: "每一口咀嚼都是在为身体减轻负担。"
    };
  }
};