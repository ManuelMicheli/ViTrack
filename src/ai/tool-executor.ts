// ---------------------------------------------------------------------------
// AI Tool Executor — executes tool calls from the AI against DB & APIs
// ---------------------------------------------------------------------------

import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { lookupNutrients, NutrientResult } from "@/lib/nutrition";
import {
  invalidateAfterMealLog,
  invalidateAfterWorkoutLog,
  invalidateAfterWaterLog,
  invalidateAfterWeightLog,
} from "@/lib/context-cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface MealItem {
  name: string;
  name_en: string;
  quantity_g: number;
  brand?: string;
  is_cooked?: boolean;
}

interface EnrichedItem {
  name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight_kg?: number;
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  switch (toolName) {
    case "log_meal":
      return handleLogMeal(args, userId);
    case "log_workout":
      return handleLogWorkout(args, userId);
    case "log_water":
      return handleLogWater(args, userId);
    case "log_weight":
      return handleLogWeight(args, userId);
    case "search_food":
      return handleSearchFood(args);
    case "get_daily_summary":
      return handleDailySummary(userId);
    case "get_weekly_report":
      return handleWeeklyReport(userId);
    case "delete_meal":
      return handleDeleteMeal(args, userId);
    case "suggest_meal":
      return handleSuggestMeal(args, userId);
    default:
      return { success: false, error: `Tool sconosciuto: ${toolName}` };
  }
}

// ---------------------------------------------------------------------------
// 1. log_meal
// ---------------------------------------------------------------------------

async function handleLogMeal(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const items = args.items as MealItem[];
    const mealType = args.meal_type as string;

    // Lookup nutrients for all items in parallel
    const lookupResults = await Promise.all(
      items.map((item) =>
        lookupNutrients(
          item.name,
          item.name_en,
          item.quantity_g,
          item.brand ?? null,
          item.is_cooked ?? false
        )
      )
    );

    // Aggregate totals and track enriched/failed items
    let totalCal = 0;
    let totalProt = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    const enrichedItems: EnrichedItem[] = [];
    const failedItems: string[] = [];
    const descParts: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const result: NutrientResult | null = lookupResults[i];

      descParts.push(`${item.name} ${item.quantity_g}g`);

      if (result) {
        totalCal += result.calories;
        totalProt += result.protein_g;
        totalCarbs += result.carbs_g;
        totalFat += result.fat_g;
        totalFiber += result.fiber_g;

        enrichedItems.push({
          name: item.name,
          quantity_g: item.quantity_g,
          calories: result.calories,
          protein_g: result.protein_g,
          carbs_g: result.carbs_g,
          fat_g: result.fat_g,
        });
      } else {
        failedItems.push(item.name);
      }
    }

    const description = descParts.join(", ");

    // Insert into meals table
    const { data: mealData, error } = await supabase.from("meals").insert({
      user_id: userId,
      description,
      calories: Math.round(totalCal),
      protein_g: parseFloat(totalProt.toFixed(1)),
      carbs_g: parseFloat(totalCarbs.toFixed(1)),
      fat_g: parseFloat(totalFat.toFixed(1)),
      fiber_g: parseFloat(totalFiber.toFixed(1)),
      meal_type: mealType,
    }).select("id").single();

    if (error) {
      console.error("[ToolExecutor] log_meal insert error:", error);
      return { success: false, error: "Errore nel salvataggio del pasto." };
    }

    // Invalidate cache after successful meal log
    invalidateAfterMealLog(userId);

    return {
      success: true,
      data: {
        meal_id: mealData?.id ?? null,
        description,
        calories: Math.round(totalCal),
        protein_g: parseFloat(totalProt.toFixed(1)),
        carbs_g: parseFloat(totalCarbs.toFixed(1)),
        fat_g: parseFloat(totalFat.toFixed(1)),
        fiber_g: parseFloat(totalFiber.toFixed(1)),
        meal_type: mealType,
        items: enrichedItems,
        failedItems,
      },
    };
  } catch (err) {
    console.error("[ToolExecutor] log_meal error:", err);
    return { success: false, error: "Errore nell'esecuzione." };
  }
}

// ---------------------------------------------------------------------------
// 2. log_workout
// ---------------------------------------------------------------------------

async function handleLogWorkout(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const description = args.description as string;
    const workoutType = args.workout_type as string;
    const durationMin = (args.duration_min as number) ?? null;
    const exercises = (args.exercises as Exercise[]) ?? null;

    const { error } = await supabase.from("workouts").insert({
      user_id: userId,
      description,
      workout_type: workoutType,
      duration_min: durationMin,
      calories_burned: null,
      exercises: exercises?.length ? exercises : null,
    });

    if (error) {
      console.error("[ToolExecutor] log_workout insert error:", error);
      return {
        success: false,
        error: "Errore nel salvataggio dell'allenamento.",
      };
    }

    invalidateAfterWorkoutLog(userId);

    return {
      success: true,
      data: {
        description,
        workout_type: workoutType,
        exercises,
      },
    };
  } catch (err) {
    console.error("[ToolExecutor] log_workout error:", err);
    return { success: false, error: "Errore nell'esecuzione." };
  }
}

// ---------------------------------------------------------------------------
// 3. log_water
// ---------------------------------------------------------------------------

async function handleLogWater(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const amountMl = args.amount_ml as number;
    const italianNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" })
    );
    const todayDate = italianNow.toISOString().split("T")[0];

    // Check for existing water_log today
    const { data: existing } = await supabase
      .from("water_logs")
      .select("id, ml")
      .eq("user_id", userId)
      .eq("date", todayDate)
      .single();

    if (existing) {
      // Update existing record — increment ml
      const newMl = (existing.ml || 0) + amountMl;
      const { error } = await supabase
        .from("water_logs")
        .update({ ml: newMl })
        .eq("id", existing.id);

      if (error) {
        console.error("[ToolExecutor] log_water update error:", error);
        return {
          success: false,
          error: "Errore nell'aggiornamento dell'acqua.",
        };
      }

      invalidateAfterWaterLog(userId);

      return {
        success: true,
        data: {
          amount_added_ml: amountMl,
          total_today_ml: newMl,
        },
      };
    } else {
      // Insert new record
      const { error } = await supabase.from("water_logs").insert({
        user_id: userId,
        ml: amountMl,
        date: todayDate,
        glasses: Math.round(amountMl / 250),
      });

      if (error) {
        console.error("[ToolExecutor] log_water insert error:", error);
        return {
          success: false,
          error: "Errore nel salvataggio dell'acqua.",
        };
      }

      invalidateAfterWaterLog(userId);

      return {
        success: true,
        data: {
          amount_added_ml: amountMl,
          total_today_ml: amountMl,
        },
      };
    }
  } catch (err) {
    console.error("[ToolExecutor] log_water error:", err);
    return { success: false, error: "Errore nell'esecuzione." };
  }
}

// ---------------------------------------------------------------------------
// 4. log_weight
// ---------------------------------------------------------------------------

async function handleLogWeight(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const weightKg = args.weight_kg as number;

    // Insert weight log
    const { error: insertError } = await supabase
      .from("weight_logs")
      .insert({ user_id: userId, weight_kg: weightKg });

    if (insertError) {
      console.error("[ToolExecutor] log_weight insert error:", insertError);
      return { success: false, error: "Errore nel salvataggio del peso." };
    }

    // Also update user's current weight
    const { error: updateError } = await supabase
      .from("users")
      .update({ weight_kg: weightKg })
      .eq("id", userId);

    if (updateError) {
      console.error("[ToolExecutor] log_weight user update error:", updateError);
      // Weight log was saved, just user update failed — still success
    }

    invalidateAfterWeightLog(userId);

    // Query previous weight log (the one just inserted is most recent)
    const { data: prevWeights } = await supabase
      .from("weight_logs")
      .select("weight_kg")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(2);

    const previousKg =
      prevWeights && prevWeights.length >= 2
        ? (prevWeights[1] as { weight_kg: number }).weight_kg
        : null;
    const changeKg =
      previousKg != null
        ? parseFloat((weightKg - previousKg).toFixed(1))
        : null;

    return {
      success: true,
      data: { weight_kg: weightKg, previous_kg: previousKg, change_kg: changeKg },
    };
  } catch (err) {
    console.error("[ToolExecutor] log_weight error:", err);
    return { success: false, error: "Errore nell'esecuzione." };
  }
}

// ---------------------------------------------------------------------------
// 5. search_food
// ---------------------------------------------------------------------------

async function handleSearchFood(
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const foodName = args.food_name as string;
    const foodNameEn = args.food_name_en as string;
    const quantityG = args.quantity_g as number;

    const result = await lookupNutrients(foodName, foodNameEn, quantityG);

    if (result) {
      return {
        success: true,
        data: {
          name: foodName,
          quantity_g: quantityG,
          calories: result.calories,
          protein_g: result.protein_g,
          carbs_g: result.carbs_g,
          fat_g: result.fat_g,
          fiber_g: result.fiber_g,
        },
      };
    }

    return {
      success: false,
      error:
        "Non ho trovato i valori nutrizionali per questo alimento.",
    };
  } catch (err) {
    console.error("[ToolExecutor] search_food error:", err);
    return { success: false, error: "Errore nell'esecuzione." };
  }
}

// ---------------------------------------------------------------------------
// 6. get_daily_summary
// ---------------------------------------------------------------------------

async function handleDailySummary(userId: string): Promise<ToolResult> {
  try {
    const italianNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" })
    );
    const todayDate = italianNow.toISOString().split("T")[0];
    const startOfDay = `${todayDate}T00:00:00.000Z`;
    const endOfDay = `${todayDate}T23:59:59.999Z`;

    // Parallel queries
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const [mealsRes, workoutsRes, waterRes, userRes, streakMealsRes] = await Promise.all([
      supabase
        .from("meals")
        .select(
          "description, calories, protein_g, carbs_g, fat_g, fiber_g, meal_type, logged_at"
        )
        .eq("user_id", userId)
        .gte("logged_at", startOfDay)
        .lte("logged_at", endOfDay)
        .order("logged_at", { ascending: true }),

      supabase
        .from("workouts")
        .select("description, calories_burned")
        .eq("user_id", userId)
        .gte("logged_at", startOfDay)
        .lte("logged_at", endOfDay),

      supabase
        .from("water_logs")
        .select("ml")
        .eq("user_id", userId)
        .eq("date", todayDate),

      supabase
        .from("users")
        .select("daily_calorie_goal")
        .eq("id", userId)
        .single(),

      supabase
        .from("meals")
        .select("logged_at")
        .eq("user_id", userId)
        .gte("logged_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const meals = (mealsRes.data ?? []) as any[];
    const workouts = (workoutsRes.data ?? []) as any[];
    const waterLogs = (waterRes.data ?? []) as any[];
    const dailyGoal: number = userRes.data?.daily_calorie_goal ?? 2000;

    // Aggregate meal totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    for (const m of meals) {
      totalCalories += m.calories || 0;
      totalProtein += m.protein_g || 0;
      totalCarbs += m.carbs_g || 0;
      totalFat += m.fat_g || 0;
      totalFiber += m.fiber_g || 0;
    }

    // Workout calories burned
    const totalCaloriesBurned = workouts.reduce(
      (sum: number, w: any) => sum + (w.calories_burned || 0),
      0
    );

    // Water total
    const waterMl = waterLogs.reduce(
      (sum: number, w: any) => sum + (w.ml || 0),
      0
    );

    // Streak: count consecutive days backward from today with at least 1 meal
    const streakMeals = (streakMealsRes.data ?? []) as any[];
    const mealDates: Record<string, boolean> = {};
    for (const m of streakMeals) {
      if (m.logged_at) mealDates[m.logged_at.split("T")[0]] = true;
    }
    let streak = 0;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(italianNow);
      checkDate.setDate(checkDate.getDate() - i);
      if (mealDates[checkDate.toISOString().split("T")[0]]) {
        streak++;
      } else {
        break;
      }
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return {
      success: true,
      data: {
        date: todayDate,
        meals: meals.map((m) => {
          let time = "";
          if (m.logged_at) {
            const d = new Date(m.logged_at);
            const localD = new Date(
              d.toLocaleString("en-US", { timeZone: "Europe/Rome" })
            );
            time = `${String(localD.getHours()).padStart(2, "0")}:${String(localD.getMinutes()).padStart(2, "0")}`;
          }
          return {
            time,
            description: m.description,
            calories: m.calories,
            meal_type: m.meal_type,
          };
        }),
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein),
        totalCarbs: Math.round(totalCarbs),
        totalFat: Math.round(totalFat),
        totalFiber: Math.round(totalFiber),
        calorieGoal: dailyGoal,
        remainingCalories: dailyGoal - Math.round(totalCalories),
        workouts: workouts.map((w) => ({
          description: w.description,
          calories_burned: w.calories_burned,
        })),
        totalCaloriesBurned,
        waterMl,
        streak,
      },
    };
  } catch (err) {
    console.error("[ToolExecutor] get_daily_summary error:", err);
    return { success: false, error: "Errore nell'esecuzione." };
  }
}

// ---------------------------------------------------------------------------
// 7. get_weekly_report
// ---------------------------------------------------------------------------

async function handleWeeklyReport(userId: string): Promise<ToolResult> {
  try {
    const weekAgoISO = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Parallel queries
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const [mealsRes, workoutsRes, weightsRes, userRes] = await Promise.all([
      supabase
        .from("meals")
        .select("calories, protein_g, logged_at")
        .eq("user_id", userId)
        .gte("logged_at", weekAgoISO),

      supabase
        .from("workouts")
        .select("id")
        .eq("user_id", userId)
        .gte("logged_at", weekAgoISO),

      supabase
        .from("weight_logs")
        .select("weight_kg, logged_at")
        .eq("user_id", userId)
        .gte("logged_at", weekAgoISO)
        .order("logged_at", { ascending: true }),

      supabase
        .from("users")
        .select("daily_calorie_goal, protein_goal")
        .eq("id", userId)
        .single(),
    ]);

    const meals = (mealsRes.data ?? []) as any[];
    const workouts = (workoutsRes.data ?? []) as any[];
    const weights = (weightsRes.data ?? []) as any[];
    const calorieGoal: number = userRes.data?.daily_calorie_goal ?? 2000;

    // Group meals by date
    const mealsByDate: Record<string, { calories: number; protein: number }> =
      {};
    for (const m of meals) {
      if (!m.logged_at) continue;
      const date = m.logged_at.split("T")[0];
      if (!mealsByDate[date]) {
        mealsByDate[date] = { calories: 0, protein: 0 };
      }
      mealsByDate[date].calories += m.calories || 0;
      mealsByDate[date].protein += m.protein_g || 0;
    }

    const dates = Object.keys(mealsByDate);
    const numDays = dates.length || 1;

    const avgDailyCalories = Math.round(
      dates.reduce((sum, d) => sum + mealsByDate[d].calories, 0) / numDays
    );
    const avgDailyProtein = Math.round(
      dates.reduce((sum, d) => sum + mealsByDate[d].protein, 0) / numDays
    );

    // Weight change
    let weightChange: number | null = null;
    if (weights.length >= 2) {
      const oldest = weights[0].weight_kg;
      const mostRecent = weights[weights.length - 1].weight_kg;
      weightChange = parseFloat((mostRecent - oldest).toFixed(1));
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return {
      success: true,
      data: {
        avgDailyCalories,
        avgDailyProtein,
        workoutCount: workouts.length,
        weightEntries: weights.map((w) => ({
          date: w.logged_at,
          weight_kg: w.weight_kg,
        })),
        weightChange,
        calorieGoal,
      },
    };
  } catch (err) {
    console.error("[ToolExecutor] get_weekly_report error:", err);
    return { success: false, error: "Errore nell'esecuzione." };
  }
}

// ---------------------------------------------------------------------------
// 8. delete_meal
// ---------------------------------------------------------------------------

async function handleDeleteMeal(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const mealId = args.meal_id as string;

    const { error, count } = await supabase
      .from("meals")
      .delete({ count: "exact" })
      .eq("id", mealId)
      .eq("user_id", userId);

    if (error) {
      console.error("[ToolExecutor] delete_meal error:", error);
      return { success: false, error: "Errore nell'eliminazione del pasto." };
    }

    if (count === 0) {
      return { success: false, error: "Pasto non trovato." };
    }

    return {
      success: true,
      data: { deleted: true },
    };
  } catch (err) {
    console.error("[ToolExecutor] delete_meal error:", err);
    return { success: false, error: "Errore nell'esecuzione." };
  }
}

// ---------------------------------------------------------------------------
// 9. suggest_meal
// ---------------------------------------------------------------------------

async function handleSuggestMeal(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const mealType = (args.meal_type as string) ?? null;
    const numOptions = (args.num_options as number) ?? 3;

    const italianNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" })
    );
    const todayDate = italianNow.toISOString().split("T")[0];
    const startOfDay = `${todayDate}T00:00:00.000Z`;
    const endOfDay = `${todayDate}T23:59:59.999Z`;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const [mealsRes, userRes] = await Promise.all([
      supabase
        .from("meals")
        .select("calories, protein_g, carbs_g, fat_g")
        .eq("user_id", userId)
        .gte("logged_at", startOfDay)
        .lte("logged_at", endOfDay),
      supabase
        .from("users")
        .select(
          "daily_calorie_goal, protein_goal, carbs_goal, fat_goal, allergies, intolerances, disliked_foods, preferred_cuisine, cooking_skill, diet_type"
        )
        .eq("id", userId)
        .single(),
    ]);

    const meals = (mealsRes.data ?? []) as any[];
    let totalCal = 0,
      totalProt = 0,
      totalCarbs = 0,
      totalFat = 0;
    for (const m of meals) {
      totalCal += m.calories || 0;
      totalProt += m.protein_g || 0;
      totalCarbs += m.carbs_g || 0;
      totalFat += m.fat_g || 0;
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const user = userRes.data;
    const targetCal = user?.daily_calorie_goal ?? 2000;
    const targetProt = user?.protein_goal ?? 150;
    const targetCarbs = user?.carbs_goal ?? 200;
    const targetFat = user?.fat_goal ?? 65;

    const remainingCal = Math.max(0, targetCal - Math.round(totalCal));
    const remainingProt = Math.max(0, targetProt - Math.round(totalProt));
    const remainingCarbs = Math.max(0, targetCarbs - Math.round(totalCarbs));
    const remainingFat = Math.max(0, targetFat - Math.round(totalFat));

    // Infer meal type from time if not specified
    const hour = italianNow.getHours();
    const inferredMealType =
      mealType ??
      (hour < 10
        ? "colazione"
        : hour < 14
          ? "pranzo"
          : hour < 17
            ? "snack"
            : "cena");

    // Build restriction context
    const restrictions: string[] = [];
    if (user?.allergies?.length)
      restrictions.push(
        `ALLERGIE (CRITICO — evita assolutamente): ${(user.allergies as string[]).join(", ")}`
      );
    if (user?.intolerances?.length)
      restrictions.push(`Intolleranze: ${(user.intolerances as string[]).join(", ")}`);
    if (user?.disliked_foods?.length)
      restrictions.push(`Cibi non graditi: ${(user.disliked_foods as string[]).join(", ")}`);
    if (user?.diet_type) restrictions.push(`Dieta: ${user.diet_type}`);

    const suggestionPrompt = `Genera esattamente ${numOptions} opzioni per ${inferredMealType} italiano.

Budget rimanente per oggi: ${remainingCal} kcal, Proteine: ${remainingProt}g, Carboidrati: ${remainingCarbs}g, Grassi: ${remainingFat}g
${restrictions.length > 0 ? `\nRestrizioni:\n${restrictions.join("\n")}` : ""}
${(user?.preferred_cuisine as string[])?.length ? `Cucine preferite: ${(user?.preferred_cuisine as string[]).join(", ")}` : ""}
Abilità in cucina: ${user?.cooking_skill ?? "intermedio"}

Rispondi SOLO con JSON valido in questo formato:
{"options":[{"name":"Nome piatto","description":"Breve descrizione (max 15 parole)","kcal":123,"protein_g":20,"carbs_g":30,"fat_g":10}]}

Regole:
- Ogni opzione DEVE rientrare nel budget rimanente
- Preferisci piatti italiani semplici e realistici
- Macro realistiche e accurate
- Varietà tra le opzioni`;

    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          max_completion_tokens: 1024,
          messages: [
            {
              role: "developer",
              content:
                "Sei un nutrizionista esperto italiano. Genera suggerimenti pasto precisi con macro realistiche. Rispondi SOLO in JSON valido.",
            },
            { role: "user", content: suggestionPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!openaiRes.ok) {
      console.error(
        "[ToolExecutor] suggest_meal OpenAI error:",
        openaiRes.status
      );
      return {
        success: false,
        error: "Errore nella generazione dei suggerimenti.",
      };
    }

    const openaiData = await openaiRes.json();
    const content = openaiData.choices?.[0]?.message?.content;

    let parsed: {
      options: {
        name: string;
        description: string;
        kcal: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
      }[];
    };
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error(
        "[ToolExecutor] suggest_meal JSON parse error:",
        content
      );
      return {
        success: false,
        error: "Errore nel parsing dei suggerimenti.",
      };
    }

    return {
      success: true,
      data: {
        context: `Suggerimenti per ${inferredMealType}`,
        options: (parsed.options || []).map((opt) => ({
          name: opt.name,
          description: opt.description,
          kcal: opt.kcal,
          macros: {
            kcal: opt.kcal,
            protein_g: opt.protein_g,
            carbs_g: opt.carbs_g,
            fat_g: opt.fat_g,
          },
        })),
        remaining: {
          kcal: remainingCal,
          protein_g: remainingProt,
          carbs_g: remainingCarbs,
          fat_g: remainingFat,
        },
      },
    };
  } catch (err) {
    console.error("[ToolExecutor] suggest_meal error:", err);
    return { success: false, error: "Errore nell'esecuzione." };
  }
}
