import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const telegramId = searchParams.get("telegram_id");
  const id = searchParams.get("id");

  if (!telegramId && !id) {
    return NextResponse.json(
      { error: "telegram_id or id required" },
      { status: 400 }
    );
  }

  let query = supabaseAdmin.from("users").select("*");

  if (id) {
    query = query.eq("id", id);
  } else {
    query = query.eq("telegram_id", parseInt(telegramId!));
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowedFields = [
    "first_name",
    "username",
    "email",
    "date_of_birth",
    "gender",
    "activity_level",
    "dietary_preferences",
    "avatar_url",
    "theme",
    "unit_system",
    "language",
    "notifications_enabled",
    "daily_calorie_goal",
    "protein_goal",
    "carbs_goal",
    "fat_goal",
    "water_goal_ml",
    "water_tracking_mode",
    "weight_goal_kg",
    "height_cm",
    "telegram_id",
    "accent_color",
    "layout_mode",
    "section_order",
    // Onboarding fields
    "onboarding_completed",
    "goal",
    "age",
    "weight_kg",
    "target_weight_kg",
    "neck_cm",
    "waist_cm",
    "hip_cm",
    "workout_types",
    "weekly_frequency",
    "sleep_hours",
    "stress_level",
    "diet_type",
    "intolerances",
    "meals_per_day",
    "supplements",
    "bmr",
    "tdee",
    "daily_calorie_target",
    "calories_bulk",
    "calories_maintain",
    "calories_cut",
    "macro_protein_g",
    "macro_carbs_g",
    "macro_fat_g",
    "body_fat_percentage",
    "lean_mass_kg",
  ];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Sync legacy ↔ new fields so both sets stay consistent
  if (updates.daily_calorie_goal !== undefined && updates.daily_calorie_target === undefined) {
    updates.daily_calorie_target = updates.daily_calorie_goal;
  } else if (updates.daily_calorie_target !== undefined && updates.daily_calorie_goal === undefined) {
    updates.daily_calorie_goal = updates.daily_calorie_target;
  }
  if (updates.protein_goal !== undefined && updates.macro_protein_g === undefined) {
    updates.macro_protein_g = updates.protein_goal;
  } else if (updates.macro_protein_g !== undefined && updates.protein_goal === undefined) {
    updates.protein_goal = updates.macro_protein_g;
  }
  if (updates.carbs_goal !== undefined && updates.macro_carbs_g === undefined) {
    updates.macro_carbs_g = updates.carbs_goal;
  } else if (updates.macro_carbs_g !== undefined && updates.carbs_goal === undefined) {
    updates.carbs_goal = updates.macro_carbs_g;
  }
  if (updates.fat_goal !== undefined && updates.macro_fat_g === undefined) {
    updates.macro_fat_g = updates.fat_goal;
  } else if (updates.macro_fat_g !== undefined && updates.fat_goal === undefined) {
    updates.fat_goal = updates.macro_fat_g;
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[PATCH /api/user] Supabase error:", { id, updates, code: error.code, message: error.message });
    return NextResponse.json({ error: error.message, code: error.code, details: { id, fields: Object.keys(updates) } }, { status: 500 });
  }

  return NextResponse.json(data);
}
