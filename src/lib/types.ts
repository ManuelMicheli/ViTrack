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
  theme: "dark";
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
  accent_color: "ivory" | "red" | "blue";
  layout_mode: "compact" | "expanded";
  section_order: string[];
  created_at: string;

  // Onboarding
  onboarding_completed: boolean;
  goal: string | null;
  age: number | null;
  weight_kg: number | null;
  target_weight_kg: number | null;

  // Body measurements
  neck_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;

  // Lifestyle
  workout_types: string[];
  weekly_frequency: string | null;
  sleep_hours: string | null;
  stress_level: string | null;

  // Nutrition
  diet_type: string | null;
  intolerances: string[];
  meals_per_day: number | null;
  supplements: string[];

  // AI assistant profile
  cooking_skill: "none" | "basic" | "intermediate" | "advanced";
  allergies: string[];
  disliked_foods: string[];
  preferred_cuisine: string[];
  available_equipment: string[];
  injuries_or_limitations: string[];
  training_days_per_week: number;
  preferred_training_time: string | null;

  // Calculated metabolic fields
  bmr: number | null;
  tdee: number | null;
  daily_calorie_target: number | null;
  calories_bulk: number | null;
  calories_maintain: number | null;
  calories_cut: number | null;
  macro_protein_g: number | null;
  macro_carbs_g: number | null;
  macro_fat_g: number | null;

  // Goal classification
  goal_subtype: string | null;
  calorie_surplus_deficit: number | null;

  // Body composition
  body_fat_percentage: number | null;
  lean_mass_kg: number | null;
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
  macro_goals?: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
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

// Rich chat message types for the premium widget
export type ChatMessageType =
  | "text"
  | "meal_saved"        // legacy: kept for backward compat with DB records
  | "workout_saved"     // legacy
  | "meal_confirm"      // pre-save: interactive card to verify parsed meal
  | "meal_logged"       // post-save: success card with day progress
  | "workout_confirm"   // pre-save: exercise list with confirm/cancel
  | "workout_logged"    // post-save: workout success
  | "daily_summary"     // full day recap with charts
  | "meal_suggestion"   // selectable meal options
  | "water_logged"      // compact water progress
  | "weight_logged"     // weight confirmation
  | "welcome"           // first-of-day greeting
  | "need_info"
  | "command_result"
  | "error";

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  message_type: ChatMessageType;
  source: "telegram" | "web";
  metadata: Record<string, unknown>;
  created_at: string;
}

// Structured data carried in metadata for rich cards
export interface MealItemData {
  name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MacroTotals {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DayStatus {
  total_calories: number;
  target_calories: number;
  remaining_calories: number;
  total_protein: number;
  target_protein: number;
  total_carbs: number;
  target_carbs: number;
  total_fat: number;
  target_fat: number;
}

export interface MealConfirmData {
  temp_id: string;
  meal_type: string;
  items: MealItemData[];
  totals: MacroTotals;
}

export interface MealLoggedData {
  meal_id: string;
  meal_type: string;
  items: MealItemData[];
  totals: MacroTotals;
  day_status: DayStatus;
}

export interface WorkoutConfirmData {
  temp_id: string;
  description: string;
  workout_type: string;
  duration_min: number | null;
  exercises: { name: string; sets: number; reps: number; weight_kg?: number }[];
}

export interface WorkoutLoggedData {
  description: string;
  workout_type: string;
  exercises: { name: string; sets: number; reps: number; weight_kg?: number }[];
}

export interface DailySummaryData {
  date: string;
  calories: { current: number; target: number };
  macros: {
    protein: { current: number; target: number };
    carbs: { current: number; target: number };
    fat: { current: number; target: number };
  };
  water: { current_ml: number; target_ml: number };
  meals: { time: string; type: string; description: string; calories: number }[];
  workouts: { description: string; duration_min: number | null }[];
  streak: number;
  insight: string;
}

export interface MealSuggestionData {
  context: string;
  options: {
    name: string;
    description: string;
    kcal: number;
    macros: MacroTotals;
  }[];
  remaining: MacroTotals;
}

export interface WaterLoggedData {
  amount_added_ml: number;
  current_ml: number;
  target_ml: number;
}

export interface WeightLoggedData {
  weight_kg: number;
  previous_kg: number | null;
  change_kg: number | null;
}
