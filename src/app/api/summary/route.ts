import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import type { Meal, Workout, DailySummary } from "@/lib/types";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const date = request.nextUrl.searchParams.get("date");

  if (!userId || !date) {
    return NextResponse.json(
      { error: "user_id and date are required" },
      { status: 400 }
    );
  }

  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  const [mealsResult, workoutsResult, userResult] = await Promise.all([
    supabaseAdmin
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", startOfDay)
      .lte("logged_at", endOfDay)
      .order("logged_at", { ascending: true }),
    supabaseAdmin
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", startOfDay)
      .lte("logged_at", endOfDay)
      .order("logged_at", { ascending: true }),
    supabaseAdmin.from("users").select("daily_calorie_goal").eq("id", userId).single(),
  ]);

  if (mealsResult.error || workoutsResult.error) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }

  const meals = mealsResult.data as Meal[];
  const workouts = workoutsResult.data as Workout[];
  const calorieGoal = userResult.data?.daily_calorie_goal ?? 2000;

  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein_g || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs_g || 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fat_g || 0), 0);
  const totalFiber = meals.reduce((sum, m) => sum + (m.fiber_g || 0), 0);
  const totalBurned = workouts.reduce(
    (sum, w) => sum + (w.calories_burned || 0),
    0
  );

  const summary: DailySummary = {
    meals,
    workouts,
    totals: {
      calories: totalCalories,
      protein_g: Math.round(totalProtein * 10) / 10,
      carbs_g: Math.round(totalCarbs * 10) / 10,
      fat_g: Math.round(totalFat * 10) / 10,
      fiber_g: Math.round(totalFiber * 10) / 10,
      meals_count: meals.length,
      workouts_count: workouts.length,
      calories_burned: totalBurned,
      net_calories: totalCalories - totalBurned,
    },
    calorie_goal: calorieGoal,
  };

  return NextResponse.json(summary);
}
