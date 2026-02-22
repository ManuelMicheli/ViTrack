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
  return (maleBMR + femaleBMR) / 2;
}

function calculateBodyFat(
  gender: "male" | "female" | "other",
  waist_cm: number,
  neck_cm: number,
  height_cm: number,
  hip_cm?: number | null
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
  // "other" — use male formula as default
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
  return calories_maintain;
}

interface RecalculateRequest {
  user_id: string;
  weight_kg?: number;
  neck_cm?: number;
  waist_cm?: number;
  hip_cm?: number;
  activity_level?: string;
  goal?: string;
}

export async function POST(request: NextRequest) {
  let body: RecalculateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { user_id } = body;

  if (!user_id) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  // 1. Fetch current user
  const { data: currentUser, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", user_id)
    .single();

  if (fetchError || !currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 2. Merge incoming fields with existing data
  const weight_kg = body.weight_kg ?? currentUser.weight_kg;
  const neck_cm = body.neck_cm ?? currentUser.neck_cm;
  const waist_cm = body.waist_cm ?? currentUser.waist_cm;
  const hip_cm = body.hip_cm ?? currentUser.hip_cm;
  const activity_level = body.activity_level ?? currentUser.activity_level;
  const goal = body.goal ?? currentUser.goal;
  const height_cm = currentUser.height_cm;
  const age = currentUser.age;
  const gender = currentUser.gender;

  // Validate required fields exist (from onboarding)
  if (!weight_kg || !height_cm || !age || !gender || !goal) {
    return NextResponse.json(
      { error: "Missing required user data for recalculation. Complete onboarding first." },
      { status: 400 }
    );
  }

  // 3. Recalculate everything
  const bmr = round1(calculateBMR(weight_kg, height_cm, age, gender));
  const multiplier = ACTIVITY_MULTIPLIERS[activity_level] ?? 1.2;
  const tdee = round1(bmr * multiplier);

  const calories_bulk = round1(tdee + 300);
  const calories_maintain = round1(tdee);
  const calories_cut = round1(tdee - 400);
  const daily_calorie_target = round1(
    getDailyCalorieTarget(goal, calories_bulk, calories_maintain, calories_cut)
  );

  // Macro split
  const protein_g = round1(weight_kg * 2);
  const protein_kcal = protein_g * 4;
  const fat_kcal = daily_calorie_target * 0.25;
  const fat_g = round1(fat_kcal / 9);
  const carbs_kcal = daily_calorie_target - protein_kcal - fat_kcal;
  const carbs_g = round1(carbs_kcal / 4);

  // Body fat % (US Navy Formula)
  let body_fat_percentage: number | null = null;
  let lean_mass_kg: number | null = null;

  if (neck_cm && waist_cm) {
    const bf = calculateBodyFat(gender, waist_cm, neck_cm, height_cm, hip_cm);
    if (bf !== null && bf > 0 && bf < 100) {
      body_fat_percentage = round1(bf);
      lean_mass_kg = round1(weight_kg * (1 - body_fat_percentage / 100));
    }
  }

  // 4. Build update object
  const updateData: Record<string, unknown> = {
    // Updated raw fields (only if provided)
    ...(body.weight_kg !== undefined && { weight_kg: body.weight_kg }),
    ...(body.neck_cm !== undefined && { neck_cm: body.neck_cm }),
    ...(body.waist_cm !== undefined && { waist_cm: body.waist_cm }),
    ...(body.hip_cm !== undefined && { hip_cm: body.hip_cm }),
    ...(body.activity_level !== undefined && { activity_level: body.activity_level }),
    ...(body.goal !== undefined && { goal: body.goal }),

    // Recalculated fields (always updated)
    bmr,
    tdee,
    daily_calorie_target,
    calories_bulk,
    calories_maintain,
    calories_cut,
    macro_protein_g: protein_g,
    macro_carbs_g: carbs_g,
    macro_fat_g: fat_g,
    body_fat_percentage,
    lean_mass_kg,

    // Backward-compatible goal fields
    daily_calorie_goal: daily_calorie_target,
    protein_goal: protein_g,
    carbs_goal: carbs_g,
    fat_goal: fat_g,
  };

  // 5. Update users table
  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from("users")
    .update(updateData)
    .eq("id", user_id)
    .select()
    .single();

  if (updateError) {
    console.error("[POST /api/recalculate] Supabase update error:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 6. If weight changed, insert a new weight log entry
  if (body.weight_kg !== undefined) {
    const { error: weightError } = await supabaseAdmin
      .from("weight_logs")
      .insert({ user_id, weight_kg: body.weight_kg });

    if (weightError) {
      console.error("[POST /api/recalculate] Weight log insert error:", weightError);
      // Non-fatal: user data was updated, weight log is supplementary
    }
  }

  return NextResponse.json(updatedUser);
}
