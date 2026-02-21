export interface User {
  id: string;
  telegram_id: number | null;
  username: string | null;
  first_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | null;
  activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active";
  dietary_preferences: string[];
  avatar_url: string | null;
  theme: "dark" | "light" | "auto";
  unit_system: "metric" | "imperial";
  language: "it" | "en";
  notifications_enabled: boolean;
  daily_calorie_goal: number;
  protein_goal: number | null;
  carbs_goal: number | null;
  fat_goal: number | null;
  water_goal_ml: number;
  water_tracking_mode: "glasses" | "ml";
  weight_goal_kg: number | null;
  height_cm: number | null;
  accent_color: "blue" | "violet" | "cyan" | "green" | "orange" | "pink";
  layout_mode: "compact" | "expanded";
  section_order: string[];
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
  ml: number;
  date: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  message_type:
    | "text"
    | "meal_saved"
    | "workout_saved"
    | "need_info"
    | "command_result"
    | "error";
  source: "telegram" | "web";
  metadata: Record<string, unknown>;
  created_at: string;
}
