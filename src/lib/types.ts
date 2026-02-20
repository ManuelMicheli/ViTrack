export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  daily_calorie_goal: number;
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  description: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  meal_type: "colazione" | "pranzo" | "cena" | "snack";
  logged_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  description: string;
  workout_type: string;
  duration_min: number | null;
  calories_burned: number | null;
  exercises: Exercise[] | null;
  logged_at: string;
}

export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  weight_kg?: number | null;
}

export interface DailySummary {
  meals: Meal[];
  workouts: Workout[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    meals_count: number;
    workouts_count: number;
    calories_burned: number;
    net_calories: number;
  };
  calorie_goal: number;
}

export interface WaterLog {
  id: string;
  user_id: string;
  glasses: number;
  date: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_at: string;
}
