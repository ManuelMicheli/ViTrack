import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// User context — assembles full user state for AI prompt enrichment
// ---------------------------------------------------------------------------

export interface UserProfile {
  gender: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  activityLevel: string | null;
  goal: string | null;
  goalSubtype: string | null;
  tdee: number | null;
  bmr: number | null;
  bodyFatPercentage: number | null;
  dietType: string | null;
  intolerances: string[];
  trainingExperience: string | null;
}

export interface WeightTrend {
  current: number | null;
  weekAgo: number | null;
  change: number | null;
}

export interface UserContext {
  firstName: string;
  dailyCalorieGoal: number;
  proteinGoal: number | null;
  carbsGoal: number | null;
  fatGoal: number | null;
  profile: UserProfile;
  weightTrend: WeightTrend;
  todayIntake: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    mealCount: number;
  };
  todayWorkouts: {
    count: number;
    totalBurned: number;
    descriptions: string[];
  };
  recentMessages: { role: string; content: string }[];
}

// Activity level labels for Italian prompt
const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentario",
  light: "Leggermente attivo",
  moderate: "Moderatamente attivo",
  active: "Attivo",
  very_active: "Molto attivo",
};

// Goal labels for Italian prompt
const GOAL_LABELS: Record<string, string> = {
  cut: "Dimagrimento (cut)",
  maintain: "Mantenimento",
  bulk: "Massa (bulk)",
  performance: "Performance",
  healthy: "Salute generale",
};

export function getActivityLabel(level: string | null): string {
  return level ? (ACTIVITY_LABELS[level] ?? level) : "Non specificato";
}

export function getGoalLabel(goal: string | null): string {
  return goal ? (GOAL_LABELS[goal] ?? goal) : "Non specificato";
}

export async function buildUserContext(
  userId: string,
  options?: { messageLimit?: number }
): Promise<UserContext | null> {
  try {
    const messageLimit = options?.messageLimit ?? 15;
    const today = new Date().toISOString().split("T")[0];
    const startOfDay = `${today}T00:00:00.000Z`;
    const endOfDay = `${today}T23:59:59.999Z`;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userRes, mealsRes, workoutsRes, messagesRes, weightRes] = await Promise.all([
      supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single() as unknown as Promise<{ data: any; error: any }>,
      supabase
        .from("meals")
        .select("calories, protein_g, carbs_g, fat_g, fiber_g")
        .eq("user_id", userId)
        .gte("logged_at", startOfDay)
        .lte("logged_at", endOfDay),
      supabase
        .from("workouts")
        .select("description, calories_burned")
        .eq("user_id", userId)
        .gte("logged_at", startOfDay)
        .lte("logged_at", endOfDay),
      supabase
        .from("chat_messages")
        .select("role, content")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(messageLimit),
      supabase
        .from("weight_logs")
        .select("weight_kg, logged_at")
        .eq("user_id", userId)
        .gte("logged_at", weekAgo)
        .order("logged_at", { ascending: false })
        .limit(7),
    ]);

    const user = userRes.data;
    if (!user) return null;

    // Sum today's meals
    const meals = mealsRes.data ?? [];
    const todayIntake = {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      mealCount: meals.length,
    };
    for (const m of meals) {
      todayIntake.calories += m.calories || 0;
      todayIntake.protein_g += m.protein_g || 0;
      todayIntake.carbs_g += m.carbs_g || 0;
      todayIntake.fat_g += m.fat_g || 0;
      todayIntake.fiber_g += m.fiber_g || 0;
    }

    // Sum today's workouts
    const workouts = workoutsRes.data ?? [];
    const todayWorkouts = {
      count: workouts.length,
      totalBurned: 0,
      descriptions: [] as string[],
    };
    for (const w of workouts) {
      todayWorkouts.totalBurned += w.calories_burned || 0;
      if (w.description) todayWorkouts.descriptions.push(w.description);
    }

    // Recent messages — reverse to chronological order
    const recentMessages = (messagesRes.data ?? [])
      .reverse()
      .map((m) => ({ role: m.role, content: m.content }));

    // Weight trend from weight_logs
    const weightLogs = weightRes.data ?? [];
    const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight_kg : null;
    const oldestWeight = weightLogs.length > 1 ? weightLogs[weightLogs.length - 1].weight_kg : null;
    const weightChange = currentWeight && oldestWeight ? parseFloat((currentWeight - oldestWeight).toFixed(1)) : null;

    // Build profile
    const profile: UserProfile = {
      gender: user.gender ?? null,
      age: user.age ?? null,
      heightCm: user.height_cm ?? null,
      weightKg: user.weight_kg ?? (currentWeight ? parseFloat(currentWeight) : null),
      targetWeightKg: user.target_weight_kg ? parseFloat(String(user.target_weight_kg)) : null,
      activityLevel: user.activity_level ?? null,
      goal: user.goal ?? null,
      goalSubtype: user.goal_subtype ?? null,
      tdee: user.tdee ? parseFloat(String(user.tdee)) : null,
      bmr: user.bmr ? parseFloat(String(user.bmr)) : null,
      bodyFatPercentage: user.body_fat_percentage ? parseFloat(String(user.body_fat_percentage)) : null,
      dietType: user.diet_type ?? null,
      intolerances: user.intolerances ?? [],
      trainingExperience: user.training_experience ?? null,
    };

    return {
      firstName: user.first_name ?? "",
      dailyCalorieGoal: user.daily_calorie_goal ?? 2000,
      proteinGoal: user.protein_goal ?? null,
      carbsGoal: user.carbs_goal ?? null,
      fatGoal: user.fat_goal ?? null,
      profile,
      weightTrend: {
        current: currentWeight ? parseFloat(String(currentWeight)) : null,
        weekAgo: oldestWeight ? parseFloat(String(oldestWeight)) : null,
        change: weightChange,
      },
      todayIntake,
      todayWorkouts,
      recentMessages,
    };
  } catch (err) {
    console.error("[UserContext] Error building context:", err);
    return null;
  }
}
