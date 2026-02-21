import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// User context — assembles full user state for AI prompt enrichment
// ---------------------------------------------------------------------------

export interface UserContext {
  firstName: string;
  dailyCalorieGoal: number;
  proteinGoal: number | null;
  carbsGoal: number | null;
  fatGoal: number | null;
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

export async function buildUserContext(
  userId: string,
  options?: { messageLimit?: number }
): Promise<UserContext | null> {
  try {
    const messageLimit = options?.messageLimit ?? 15;
    const today = new Date().toISOString().split("T")[0];
    const startOfDay = `${today}T00:00:00.000Z`;
    const endOfDay = `${today}T23:59:59.999Z`;

    const [userRes, mealsRes, workoutsRes, messagesRes] = await Promise.all([
      supabase
        .from("users")
        .select("first_name, daily_calorie_goal, protein_goal, carbs_goal, fat_goal")
        .eq("id", userId)
        .single(),
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

    return {
      firstName: user.first_name ?? "",
      dailyCalorieGoal: user.daily_calorie_goal ?? 2000,
      proteinGoal: user.protein_goal ?? null,
      carbsGoal: user.carbs_goal ?? null,
      fatGoal: user.fat_goal ?? null,
      todayIntake,
      todayWorkouts,
      recentMessages,
    };
  } catch (err) {
    console.error("[UserContext] Error building context:", err);
    return null;
  }
}
