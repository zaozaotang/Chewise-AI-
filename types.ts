export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CAMERA_ANALYSIS = 'CAMERA_ANALYSIS',
  MEAL_PREP = 'MEAL_PREP',
  EATING_SESSION = 'EATING_SESSION',
  SUMMARY = 'SUMMARY',
}

export interface FoodAnalysis {
  foodName: string;
  calories: number; // Estimated calories
  textureLevel: 'Soft' | 'Medium' | 'Hard'; // Texture density
  recommendedChews: number;
  fatShieldTip: string; // Psychological tip
}

export interface MealSession {
  durationSeconds: number;
  totalBites: number;
  averageChewsPerBite: number;
  timestamp: number;
}

export interface PetState {
  level: number;
  exp: number;
  name: string;
}

export type PacerPhase = 'PREPARE' | 'BITE' | 'CHEW' | 'SWALLOW' | 'REST';