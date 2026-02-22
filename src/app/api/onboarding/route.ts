import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

// Activity level to multiplier mapping (Mifflin-St Jeor)
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Goals that map to bulk calories
const BULK_GOALS = ["Aumentare massa muscolare", "Migliorare la performance atletica"];
// Goals that map to maintenance calories
const MAINTAIN_GOALS = ["Mantenere il peso", "Mangiare più sano"];
// Goals that map to cut calories
const CUT_GOALS = ["Perdere grasso corporeo"];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function calculateBMR(
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: "male" | "female" | "other"
): number {
  const maleBMR = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  const femaleBMR = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;

  if (gender === "male") return maleBMR;
  if (gender === "female") return femaleBMR;
  // "other" uses the average
  return (maleBMR + femaleBMR) / 2;
}

function calculateBodyFat(
  gender: "male" | "female" | "other",
  waist_cm: number,
  neck_cm: number,
  height_cm: number,
  hip_cm?: number
): number | null {
  if (gender === "male") {
    const diff = waist_cm - neck_cm;
    if (diff <= 0) return null;
    return 495 / (1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(height_cm)) - 450;
  }
  if (gender === "female") {
    if (!hip_cm) return null;
    const sum = waist_cm + hip_cm - neck_cm;
    if (sum <= 0) return null;
    return 495 / (1.29579 - 0.35004 * Math.log10(sum) + 0.22100 * Math.log10(height_cm)) - 450;
  }
  // "other" — try male formula as a reasonable default
  const diff = waist_cm - neck_cm;
  if (diff <= 0) return null;
  return 495 / (1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(height_cm)) - 450;
}

function getDailyCalorieTarget(
  goal: string,
  calories_bulk: number,
  calories_maintain: number,
  calories_cut: number
): number {
  if (BULK_GOALS.includes(goal)) return calories_bulk;
  if (CUT_GOALS.includes(goal)) return calories_cut;
  // Default to maintenance for maintain goals or unknown
  return calories_maintain;
}

interface OnboardingRequest {
  user_id: string;
  goal: string;
  age: number;
  gender: "male" | "female" | "other";
  height_cm: number;
  weight_kg: number;
  target_weight_kg?: number;
  neck_cm?: number;
  waist_cm?: number;
  hip_cm?: number;
  activity_level: string;
  workout_types: string[];
  weekly_frequency: string;
  sleep_hours: string;
  stress_level: string;
  diet_type: string;
  intolerances: string[];
  meals_per_day: number;
  supplements: string[];
}

export async function POST(request: NextRequest) {
  let body: OnboardingRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    user_id,
    goal,
    age,
    gender,
    height_cm,
    weight_kg,
    target_weight_kg,
    neck_cm,
    waist_cm,
    hip_cm,
    activity_level,
    workout_types,
    weekly_frequency,
    sleep_hours,
    stress_level,
    diet_type,
    intolerances,
    meals_per_day,
    supplements,
  } = body;

  // Validation
  if (!user_id || !goal || !age || !gender || !height_cm || !weight_kg || !activity_level) {
    return NextResponse.json(
      { error: "Missing required fields: user_id, goal, age, gender, height_cm, weight_kg, activity_level" },
      { status: 400 }
    );
  }

  // 1. BMR (Mifflin-St Jeor)
  const bmr = round1(calculateBMR(weight_kg, height_cm, age, gender));

  // 2. TDEE
  const multiplier = ACTIVITY_MULTIPLIERS[activity_level] ?? 1.2;
  const tdee = round1(bmr * multiplier);

  // 3. Calorie targets
  const calories_bulk = round1(tdee + 300);
  const calories_maintain = round1(tdee);
  const calories_cut = round1(tdee - 400);
  const daily_calorie_target = round1(
    getDailyCalorieTarget(goal, calories_bulk, calories_maintain, calories_cut)
  );

  // 4. Macro split
  const protein_g = round1(weight_kg * 2);
  const protein_kcal = protein_g * 4;
  const fat_kcal = daily_calorie_target * 0.25;
  const fat_g = round1(fat_kcal / 9);
  const carbs_kcal = daily_calorie_target - protein_kcal - fat_kcal;
  const carbs_g = round1(carbs_kcal / 4);

  // 5. Body fat % (US Navy Formula) — only if measurements provided
  let body_fat_percentage: number | null = null;
  let lean_mass_kg: number | null = null;

  if (neck_cm && waist_cm) {
    const bf = calculateBodyFat(gender, waist_cm, neck_cm, height_cm, hip_cm);
    if (bf !== null && bf > 0 && bf < 100) {
      body_fat_percentage = round1(bf);
      lean_mass_kg = round1(weight_kg * (1 - body_fat_percentage / 100));
    }
  }

  // Save to users table
  const updateData = {
    // Raw form fields
    goal,
    age,
    gender,
    height_cm,
    weight_kg,
    target_weight_kg: target_weight_kg ?? null,
    neck_cm: neck_cm ?? null,
    waist_cm: waist_cm ?? null,
    hip_cm: hip_cm ?? null,
    activity_level,
    workout_types: workout_types ?? [],
    weekly_frequency: weekly_frequency ?? null,
    sleep_hours: sleep_hours ?? null,
    stress_level: stress_level ?? null,
    diet_type: diet_type ?? null,
    intolerances: intolerances ?? [],
    meals_per_day: meals_per_day ?? null,
    supplements: supplements ?? [],

    // Calculated metabolic fields
    bmr,
    tdee,
    daily_calorie_target,
    calories_bulk,
    calories_maintain,
    calories_cut,
    macro_protein_g: protein_g,
    macro_carbs_g: carbs_g,
    macro_fat_g: fat_g,

    // Body composition
    body_fat_percentage,
    lean_mass_kg,

    // Also update existing goal fields for backward compatibility
    daily_calorie_goal: daily_calorie_target,
    protein_goal: protein_g,
    carbs_goal: carbs_g,
    fat_goal: fat_g,
    weight_goal_kg: target_weight_kg ?? null,

    // Mark onboarding complete
    onboarding_completed: true,
  };

  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from("users")
    .update(updateData)
    .eq("id", user_id)
    .select()
    .single();

  if (updateError) {
    console.error("[POST /api/onboarding] Supabase update error:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Insert initial weight log
  const { error: weightError } = await supabaseAdmin
    .from("weight_logs")
    .insert({ user_id, weight_kg });

  if (weightError) {
    console.error("[POST /api/onboarding] Weight log insert error:", weightError);
    // Non-fatal: onboarding data was saved, weight log is supplementary
  }

  return NextResponse.json(updatedUser);
}
