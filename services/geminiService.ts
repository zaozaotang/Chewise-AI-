import { FoodAnalysis } from '../types';

export const analyzeFoodImage = async (base64Image: string): Promise<FoodAnalysis> => {
  try {
    // Call our own Vercel API Route
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error:", errorData);
      throw new Error(errorData.message || 'Server connection failed');
    }

    const data = await response.json();
    
    return {
      foodName: data.foodName || "未知餐食",
      calories: data.calories || 300,
      textureLevel: data.textureLevel || 'Medium',
      recommendedChews: data.recommendedChews || 25,
      fatShieldTip: data.fatShieldTip || "充分咀嚼可以帮助身体更好地代谢热量。"
    };

  } catch (error) {
    console.error("Analysis Service Error:", error);
    
    // Return Friendly Fallback UI
    // This prevents the white screen crash and lets the user continue manually
    return {
      foodName: "AI 连接中断",
      calories: 0, 
      textureLevel: 'Medium',
      recommendedChews: 30, // Default safe value
      fatShieldTip: "网络信号不佳，无法启动AI分析。请手动保持慢速进食，建议每口咀嚼 30 次。"
    };
  }
};