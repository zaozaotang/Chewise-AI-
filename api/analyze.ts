import { GoogleGenAI, Type } from "@google/genai";

// Vercel API Route Handler
export default async function handler(req: any, res: any) {
  // 1. Basic Method Check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. Security: Get Key from Server Environment
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Server Error: API_KEY is missing in environment variables.");
      return res.status(500).json({ 
        error: 'Configuration Error', 
        message: '服务器未配置 API Key，请在 Vercel Settings 中添加环境变量。' 
      });
    }

    // 3. Parse Request Body
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Bad Request', message: '未接收到图片数据' });
    }

    // 4. Initialize AI (Server-side)
    const ai = new GoogleGenAI({ apiKey });
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

    // 5. Call Gemini API
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: image,
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

    // 6. Return Data to Frontend
    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);
    
    return res.status(200).json(data);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Check for quota or billing errors to give specific feedback
    let userMessage = "服务器繁忙，请稍后再试。";
    if (error.message?.includes('429')) {
      userMessage = "AI 服务请求过多，请稍等一分钟再试。";
    }

    return res.status(500).json({ 
      error: 'AI Analysis Failed', 
      message: userMessage,
      details: error.message 
    });
  }
}