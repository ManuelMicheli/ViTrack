import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// AIUserContext — rich user context for AI system prompt enrichment
// ---------------------------------------------------------------------------

export interface AIUserContext {
  // Identity
  userId: string;
  firstName: string;

  // Profile
  gender: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  bodyFatPercentage: number | null;
  activityLevel: string | null;
  trainingExperience: string | null;

  // Goal
  goal: string | null;
  goalSubtype: string | null;

  // Metabolic
  bmr: number | null;
  tdee: number | null;
  dailyCalorieGoal: number;
  proteinGoal: number | null;
  carbsGoal: number | null;
  fatGoal: number | null;

  // Preferences & restrictions
  dietType: string | null;
  intolerances: string[];
  allergies: string[];
  dislikedFoods: string[];
  preferredCuisine: string[];
  cookingSkill: string;
  availableEquipment: string[];
  injuriesOrLimitations: string[];
  trainingDaysPerWeek: number;
  preferredTrainingTime: string | null;

  // Today
  today: {
    date: string;
    dayOfWeek: string;
    currentTime: string;
    meals: {
      id: string;
      time: string;
      type: string;
      description: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    }[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
    remainingCalories: number;
    remainingProtein: number;
    remainingCarbs: number;
    remainingFat: number;
    workouts: {
      description: string;
      type: string;
      durationMin: number | null;
      caloriesBurned: number | null;
    }[];
    waterMl: number;
  };

  // Recent history (7 days)
  recentHistory: {
    avgDailyCalories: number;
    avgDailyProtein: number;
    workoutsThisWeek: number;
    weightTrend: number[];
    weightChange7d: number | null;
    streakDays: number;
    adherencePercentage: number;
  };

  // Conversation context
  recentMessages: { role: string; content: string }[];
}

// ---------------------------------------------------------------------------
// Helper: Italian day-of-week names
// ---------------------------------------------------------------------------

const DAY_NAMES = [
  "domenica",
  "luned\u00ec",
  "marted\u00ec",
  "mercoled\u00ec",
  "gioved\u00ec",
  "venerd\u00ec",
  "sabato",
];

// ---------------------------------------------------------------------------
// buildAIContext — assembles the full AIUserContext for a given user
// ---------------------------------------------------------------------------

export async function buildAIContext(
  userId: string
): Promise<AIUserContext | null> {
  try {
    // ---- Italian timezone calculations ----
    const italianNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" })
    );
    const todayDate = italianNow.toISOString().split("T")[0]; // YYYY-MM-DD
    const dayOfWeek = DAY_NAMES[italianNow.getDay()];
    const currentTime = `${String(italianNow.getHours()).padStart(2, "0")}:${String(italianNow.getMinutes()).padStart(2, "0")}`;

    const startOfDay = `${todayDate}T00:00:00.000Z`;
    const endOfDay = `${todayDate}T23:59:59.999Z`;
    const weekAgoISO = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // ---- Parallel queries ----
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const [
      userRes,
      todayMealsRes,
      todayWorkoutsRes,
      waterRes,
      weekMealsRes,
      weekWorkoutsRes,
      weightRes,
      messagesRes,
    ] = await Promise.all([
      // 1. User profile
      supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single() as unknown as Promise<{ data: any; error: any }>,

      // 2. Today's meals
      supabase
        .from("meals")
        .select(
          "id, description, calories, protein_g, carbs_g, fat_g, fiber_g, meal_type, logged_at"
        )
        .eq("user_id", userId)
        .gte("logged_at", startOfDay)
        .lte("logged_at", endOfDay)
        .order("logged_at", { ascending: true }),

      // 3. Today's workouts
      supabase
        .from("workouts")
        .select("description, workout_type, duration_min, calories_burned")
        .eq("user_id", userId)
        .gte("logged_at", startOfDay)
        .lte("logged_at", endOfDay),

      // 4. Today's water
      supabase
        .from("water_logs")
        .select("ml")
        .eq("user_id", userId)
        .eq("date", todayDate),

      // 5. Meals last 7 days (for averages & streak)
      supabase
        .from("meals")
        .select("calories, protein_g, logged_at")
        .eq("user_id", userId)
        .gte("logged_at", weekAgoISO),

      // 6. Workouts last 7 days (count)
      supabase
        .from("workouts")
        .select("id")
        .eq("user_id", userId)
        .gte("logged_at", weekAgoISO),

      // 7. Weight logs last 7 days
      supabase
        .from("weight_logs")
        .select("weight_kg, logged_at")
        .eq("user_id", userId)
        .gte("logged_at", weekAgoISO)
        .order("logged_at", { ascending: false })
        .limit(7),

      // 8. Recent chat messages
      supabase
        .from("chat_messages")
        .select("role, content")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(15),
    ]);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // ---- Bail if no user ----
    const user = userRes.data;
    if (!user) return null;

    // ---- Today's meals ----
    const todayMeals = (todayMealsRes.data ?? []) as any[];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    const formattedMeals = todayMeals.map((m: any) => {
      const cal = m.calories || 0;
      const pro = m.protein_g || 0;
      const carb = m.carbs_g || 0;
      const fat = m.fat_g || 0;
      const fib = m.fiber_g || 0;

      totalCalories += cal;
      totalProtein += pro;
      totalCarbs += carb;
      totalFat += fat;
      totalFiber += fib;

      // Extract HH:MM from logged_at
      let mealTime = "";
      if (m.logged_at) {
        const d = new Date(m.logged_at);
        const localD = new Date(
          d.toLocaleString("en-US", { timeZone: "Europe/Rome" })
        );
        mealTime = `${String(localD.getHours()).padStart(2, "0")}:${String(localD.getMinutes()).padStart(2, "0")}`;
      }

      return {
        id: m.id,
        time: mealTime,
        type: m.meal_type || "",
        description: m.description || "",
        calories: cal,
        protein_g: pro,
        carbs_g: carb,
        fat_g: fat,
      };
    });

    // ---- Today's workouts ----
    const todayWorkouts = (todayWorkoutsRes.data ?? []) as any[];
    const formattedWorkouts = todayWorkouts.map((w: any) => ({
      description: w.description || "",
      type: w.workout_type || "",
      durationMin: w.duration_min ?? null,
      caloriesBurned: w.calories_burned ?? null,
    }));

    // ---- Today's water ----
    const waterLogs = (waterRes.data ?? []) as any[];
    const waterMl = waterLogs.reduce(
      (sum: number, w: any) => sum + (w.ml || 0),
      0
    );

    // ---- Macro goals ----
    const dailyCalorieGoal: number = user.daily_calorie_goal ?? 2000;
    const proteinGoal: number | null = user.protein_goal ?? null;
    const carbsGoal: number | null = user.carbs_goal ?? null;
    const fatGoal: number | null = user.fat_goal ?? null;

    // ---- Remaining macros ----
    const remainingCalories = dailyCalorieGoal - totalCalories;
    const remainingProtein = (proteinGoal ?? 0) - totalProtein;
    const remainingCarbs = (carbsGoal ?? 0) - totalCarbs;
    const remainingFat = (fatGoal ?? 0) - totalFat;

    // ---- 7-day meals: averages, streak, adherence ----
    const weekMeals = (weekMealsRes.data ?? []) as any[];

    // Group by date
    const mealsByDate: Record<string, { calories: number; protein: number }> =
      {};
    for (const m of weekMeals) {
      if (!m.logged_at) continue;
      const date = m.logged_at.split("T")[0];
      if (!mealsByDate[date]) {
        mealsByDate[date] = { calories: 0, protein: 0 };
      }
      mealsByDate[date].calories += m.calories || 0;
      mealsByDate[date].protein += m.protein_g || 0;
    }

    const dates = Object.keys(mealsByDate);
    const numDays = dates.length || 1; // avoid divide-by-zero
    const avgDailyCalories = Math.round(
      dates.reduce((sum, d) => sum + mealsByDate[d].calories, 0) / numDays
    );
    const avgDailyProtein = Math.round(
      dates.reduce((sum, d) => sum + mealsByDate[d].protein, 0) / numDays
    );

    // Streak: count consecutive days backward from today with at least 1 meal
    let streakDays = 0;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(italianNow);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = checkDate.toISOString().split("T")[0];
      if (mealsByDate[checkDateStr]) {
        streakDays++;
      } else {
        break;
      }
    }

    // Adherence: % of last 7 distinct dates within +/-10% of calorie target
    let adherentDays = 0;
    for (const d of dates) {
      const dayCal = mealsByDate[d].calories;
      const lowerBound = dailyCalorieGoal * 0.9;
      const upperBound = dailyCalorieGoal * 1.1;
      if (dayCal >= lowerBound && dayCal <= upperBound) {
        adherentDays++;
      }
    }
    const adherencePercentage =
      dates.length > 0 ? Math.round((adherentDays / dates.length) * 100) : 0;

    // ---- Workouts this week ----
    const weekWorkouts = (weekWorkoutsRes.data ?? []) as any[];
    const workoutsThisWeek = weekWorkouts.length;

    // ---- Weight trend ----
    const weightLogs = (weightRes.data ?? []) as any[];
    const weightTrend = weightLogs.map((w: any) => w.weight_kg as number);
    let weightChange7d: number | null = null;
    if (weightLogs.length >= 2) {
      const mostRecent = weightLogs[0].weight_kg;
      const oldest = weightLogs[weightLogs.length - 1].weight_kg;
      weightChange7d = parseFloat((mostRecent - oldest).toFixed(1));
    }

    // ---- Recent messages (reverse to chronological) ----
    const recentMessages = ((messagesRes.data ?? []) as any[])
      .reverse()
      .map((m: any) => ({ role: m.role as string, content: m.content as string }));

    // ---- Assemble AIUserContext ----
    return {
      userId,
      firstName: user.first_name ?? "",

      gender: user.gender ?? null,
      age: user.age ?? null,
      heightCm: user.height_cm ?? null,
      weightKg: user.weight_kg ?? null,
      targetWeightKg: user.target_weight_kg
        ? parseFloat(String(user.target_weight_kg))
        : null,
      bodyFatPercentage: user.body_fat_percentage
        ? parseFloat(String(user.body_fat_percentage))
        : null,
      activityLevel: user.activity_level ?? null,
      trainingExperience: user.training_experience ?? null,

      goal: user.goal ?? null,
      goalSubtype: user.goal_subtype ?? null,

      bmr: user.bmr ? parseFloat(String(user.bmr)) : null,
      tdee: user.tdee ? parseFloat(String(user.tdee)) : null,
      dailyCalorieGoal,
      proteinGoal,
      carbsGoal,
      fatGoal,

      dietType: user.diet_type ?? null,
      intolerances: user.intolerances ?? [],
      allergies: user.allergies ?? [],
      dislikedFoods: user.disliked_foods ?? [],
      preferredCuisine: user.preferred_cuisine ?? [],
      cookingSkill: user.cooking_skill ?? "intermedio",
      availableEquipment: user.available_equipment ?? [],
      injuriesOrLimitations: user.injuries_or_limitations ?? [],
      trainingDaysPerWeek: user.training_days_per_week ?? 3,
      preferredTrainingTime: user.preferred_training_time ?? null,

      today: {
        date: todayDate,
        dayOfWeek,
        currentTime,
        meals: formattedMeals,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        totalFiber,
        remainingCalories,
        remainingProtein,
        remainingCarbs,
        remainingFat,
        workouts: formattedWorkouts,
        waterMl,
      },

      recentHistory: {
        avgDailyCalories,
        avgDailyProtein,
        workoutsThisWeek,
        weightTrend,
        weightChange7d,
        streakDays,
        adherencePercentage,
      },

      recentMessages,
    };
  } catch (err) {
    console.error("[AIContext] Error building context:", err);
    return null;
  }
}
