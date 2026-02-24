// ---------------------------------------------------------------------------
// Quick Actions — intercept simple messages before AI (target: <300ms)
// ---------------------------------------------------------------------------
// 40-50% of chat messages are simple operations that don't need AI:
// water logging, weight logging, daily summary, calorie check.
// This module pattern-matches them and handles directly via DB.
// ---------------------------------------------------------------------------

import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import {
  invalidateAfterWaterLog,
  invalidateAfterWeightLog,
} from "@/lib/context-cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuickActionResult {
  matched: boolean;
  // If matched, these are populated:
  content?: string;
  messageType?: string;
  metadata?: Record<string, unknown>;
  /** Fire-and-forget side effects (cache invalidation, etc.) */
  sideEffects?: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Italian timezone helper
// ---------------------------------------------------------------------------

function italianNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" })
  );
}

function italianToday(): string {
  return italianNow().toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Main entry: try to match a quick action
// ---------------------------------------------------------------------------

export async function tryQuickAction(
  text: string,
  userId: string
): Promise<QuickActionResult> {
  const input = text.toLowerCase().trim();

  // ═══ ACQUA ═══
  const waterResult = matchWater(input);
  if (waterResult) {
    return handleWater(userId, waterResult);
  }

  // ═══ PESO ═══
  const weightResult = matchWeight(input);
  if (weightResult) {
    return handleWeight(userId, weightResult);
  }

  // ═══ RIEPILOGO GIORNATA ═══
  if (matchDailySummary(input)) {
    return handleDailySummary(userId);
  }

  // ═══ CALORIE RIMANENTI ═══
  if (matchCalorieCheck(input)) {
    return handleCalorieCheck(userId);
  }

  // Non è una quick action → passa all'AI
  return { matched: false };
}

// ---------------------------------------------------------------------------
// Pattern matchers
// ---------------------------------------------------------------------------

function matchWater(input: string): number | null {
  // "acqua 500", "acqua: 500 ml", "acqua 500ml", "ho bevuto 500ml", "💧 500"
  // Also: "acqua 2l", "acqua 1.5 litri"
  const patterns = [
    /^(?:acqua|💧|bevuto|ho bevuto)[:\s]*(\d+(?:[.,]\d+)?)\s*(ml|l|litri?)?$/,
    /^(\d+(?:[.,]\d+)?)\s*(ml|l|litri?)?\s*(?:di\s+)?acqua$/,
  ];

  for (const p of patterns) {
    const m = input.match(p);
    if (m) {
      let amount = parseFloat(m[1].replace(",", "."));
      const unit = m[2]?.toLowerCase();
      // If unit is liters or amount is suspiciously small (like "2"), convert to ml
      if (unit?.startsWith("l") || (amount <= 10 && !unit)) {
        amount = amount * 1000;
      }
      if (amount > 0 && amount <= 10000) return Math.round(amount);
    }
  }
  return null;
}

function matchWeight(input: string): number | null {
  // "peso 75", "peso: 75.5 kg", "peso 75,5kg", "⚖️ 75"
  const patterns = [
    /^(?:peso|⚖️)[:\s]*(\d+[.,]?\d*)\s*(?:kg)?$/,
    /^(\d+[.,]\d+)\s*kg$/,
  ];

  for (const p of patterns) {
    const m = input.match(p);
    if (m) {
      const kg = parseFloat(m[1].replace(",", "."));
      if (kg > 20 && kg < 300) return kg;
    }
  }
  return null;
}

function matchDailySummary(input: string): boolean {
  const keywords = [
    "oggi",
    "/today",
    "giornata",
    "riepilogo",
    "come sto",
    "come va",
    "📊",
    "status",
    "/oggi",
  ];
  return keywords.includes(input);
}

function matchCalorieCheck(input: string): boolean {
  return /^(?:quante calorie|kcal|calorie rimanenti|quanto mi resta|calorie rimaste|macro rimasti|macro rimanenti)/.test(
    input
  );
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleWater(
  userId: string,
  amountMl: number
): Promise<QuickActionResult> {
  const todayDate = italianToday();

  // Check for existing water_log today
  const { data: existing } = await supabase
    .from("water_logs")
    .select("id, ml")
    .eq("user_id", userId)
    .eq("date", todayDate)
    .single();

  let totalMl: number;

  if (existing) {
    totalMl = (existing.ml || 0) + amountMl;
    const { error } = await supabase
      .from("water_logs")
      .update({ ml: totalMl })
      .eq("id", existing.id);
    if (error) {
      return {
        matched: true,
        content: "Errore nel salvataggio dell'acqua.",
        messageType: "error",
        metadata: {},
      };
    }
  } else {
    totalMl = amountMl;
    const { error } = await supabase.from("water_logs").insert({
      user_id: userId,
      ml: amountMl,
      date: todayDate,
      glasses: Math.round(amountMl / 250),
    });
    if (error) {
      return {
        matched: true,
        content: "Errore nel salvataggio dell'acqua.",
        messageType: "error",
        metadata: {},
      };
    }
  }

  // Get user's water goal
  const { data: userData } = await supabase
    .from("users")
    .select("water_goal_ml")
    .eq("id", userId)
    .single();
  const targetMl = userData?.water_goal_ml ?? 2500;
  const pct = Math.round((totalMl / targetMl) * 100);

  const content = `💧 +${amountMl}ml registrato! Totale oggi: ${totalMl}ml/${targetMl}ml (${pct}%)`;

  return {
    matched: true,
    content,
    messageType: "water_logged",
    metadata: {
      amount_added_ml: amountMl,
      current_ml: totalMl,
      target_ml: targetMl,
      toolCalls: ["log_water"],
    },
    sideEffects: async () => {
      invalidateAfterWaterLog(userId);
    },
  };
}

async function handleWeight(
  userId: string,
  weightKg: number
): Promise<QuickActionResult> {
  // Insert weight log
  const { error: insertError } = await supabase
    .from("weight_logs")
    .insert({ user_id: userId, weight_kg: weightKg });

  if (insertError) {
    return {
      matched: true,
      content: "Errore nel salvataggio del peso.",
      messageType: "error",
      metadata: {},
    };
  }

  // Update user's current weight (fire-and-forget)
  supabase
    .from("users")
    .update({ weight_kg: weightKg })
    .eq("id", userId)
    .then(() => {});

  // Get previous weight
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

  let content = `⚖️ Peso registrato: ${weightKg} kg`;
  if (changeKg !== null) {
    const sign = changeKg > 0 ? "+" : "";
    content += ` (${sign}${changeKg} kg)`;
  }

  return {
    matched: true,
    content,
    messageType: "weight_logged",
    metadata: {
      weight_kg: weightKg,
      previous_kg: previousKg,
      change_kg: changeKg,
      toolCalls: ["log_weight"],
    },
    sideEffects: async () => {
      invalidateAfterWeightLog(userId);
    },
  };
}

async function handleDailySummary(
  userId: string
): Promise<QuickActionResult> {
  const now = italianNow();
  const todayDate = italianToday();
  const startOfDay = `${todayDate}T00:00:00.000Z`;
  const endOfDay = `${todayDate}T23:59:59.999Z`;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [mealsRes, workoutsRes, waterRes, userRes] = await Promise.all([
    supabase
      .from("meals")
      .select("description, calories, protein_g, carbs_g, fat_g, meal_type, logged_at")
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
      .select("daily_calorie_goal, protein_goal, carbs_goal, fat_goal, water_goal_ml")
      .eq("id", userId)
      .single(),
  ]);

  const meals = (mealsRes.data ?? []) as any[];
  const workouts = (workoutsRes.data ?? []) as any[];
  const waterLogs = (waterRes.data ?? []) as any[];

  let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;
  for (const m of meals) {
    totalCal += m.calories || 0;
    totalProt += m.protein_g || 0;
    totalCarbs += m.carbs_g || 0;
    totalFat += m.fat_g || 0;
  }

  const waterMl = waterLogs.reduce((s: number, w: any) => s + (w.ml || 0), 0);

  const targetCal = userRes.data?.daily_calorie_goal ?? 2000;
  const targetProt = userRes.data?.protein_goal ?? 150;
  const targetCarbs = userRes.data?.carbs_goal ?? 200;
  const targetFat = userRes.data?.fat_goal ?? 65;
  const targetWater = userRes.data?.water_goal_ml ?? 2500;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const remaining = targetCal - Math.round(totalCal);

  // Build formatted summary
  const dayNames = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  const dayName = dayNames[now.getDay()];
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  let content = `📊 Riepilogo ${dayName} ore ${time}\n\n`;

  content += `🔥 Calorie: ${Math.round(totalCal)}/${targetCal} kcal`;
  content += remaining > 0 ? ` (restano ${remaining})` : ` (superato di ${Math.abs(remaining)})`;
  content += `\n🥩 P: ${Math.round(totalProt)}/${targetProt}g | 🍞 C: ${Math.round(totalCarbs)}/${targetCarbs}g | 🧈 G: ${Math.round(totalFat)}/${targetFat}g`;
  content += `\n💧 Acqua: ${waterMl}/${targetWater}ml`;

  if (meals.length > 0) {
    content += `\n\nPasti (${meals.length}):`;
    for (const m of meals) {
      content += `\n- ${m.description} — ${m.calories} kcal`;
    }
  } else {
    content += `\n\nNessun pasto registrato.`;
  }

  if (workouts.length > 0) {
    content += `\n\n🏋️ Allenamenti:`;
    for (const w of workouts) {
      content += `\n- ${w.description}${w.calories_burned ? ` (${w.calories_burned} kcal)` : ""}`;
    }
  }

  return {
    matched: true,
    content,
    messageType: "daily_summary",
    metadata: {
      date: todayDate,
      calories: { current: Math.round(totalCal), target: targetCal },
      macros: {
        protein: { current: Math.round(totalProt), target: targetProt },
        carbs: { current: Math.round(totalCarbs), target: targetCarbs },
        fat: { current: Math.round(totalFat), target: targetFat },
      },
      water: { current_ml: waterMl, target_ml: targetWater },
      meals: meals.map((m: any) => ({
        time: "",
        type: m.meal_type ?? "",
        description: m.description ?? "",
        calories: m.calories ?? 0,
      })),
      workouts: workouts.map((w: any) => ({
        description: w.description,
        calories_burned: w.calories_burned,
      })),
      streak: 0,
      insight: "",
      toolCalls: ["get_daily_summary"],
    },
  };
}

async function handleCalorieCheck(
  userId: string
): Promise<QuickActionResult> {
  const todayDate = italianToday();
  const startOfDay = `${todayDate}T00:00:00.000Z`;
  const endOfDay = `${todayDate}T23:59:59.999Z`;

  const [mealsRes, userRes] = await Promise.all([
    supabase
      .from("meals")
      .select("calories, protein_g, carbs_g, fat_g")
      .eq("user_id", userId)
      .gte("logged_at", startOfDay)
      .lte("logged_at", endOfDay),
    supabase
      .from("users")
      .select("daily_calorie_goal, protein_goal, carbs_goal, fat_goal")
      .eq("id", userId)
      .single(),
  ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const meals = (mealsRes.data ?? []) as any[];
  let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;
  for (const m of meals) {
    totalCal += m.calories || 0;
    totalProt += m.protein_g || 0;
    totalCarbs += m.carbs_g || 0;
    totalFat += m.fat_g || 0;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const targetCal = userRes.data?.daily_calorie_goal ?? 2000;
  const targetProt = userRes.data?.protein_goal ?? 150;
  const targetCarbs = userRes.data?.carbs_goal ?? 200;
  const targetFat = userRes.data?.fat_goal ?? 65;

  const remCal = targetCal - Math.round(totalCal);
  const remProt = targetProt - Math.round(totalProt);
  const remCarbs = targetCarbs - Math.round(totalCarbs);
  const remFat = targetFat - Math.round(totalFat);

  let content: string;
  if (remCal > 0) {
    content = `Ti restano **${remCal} kcal** per oggi.\nP: ${Math.max(0, remProt)}g · C: ${Math.max(0, remCarbs)}g · G: ${Math.max(0, remFat)}g`;
  } else {
    content = `Hai superato il target di **${Math.abs(remCal)} kcal** oggi.\nP: ${Math.round(totalProt)}/${targetProt}g · C: ${Math.round(totalCarbs)}/${targetCarbs}g · G: ${Math.round(totalFat)}/${targetFat}g`;
  }

  return {
    matched: true,
    content,
    messageType: "text",
    metadata: {},
  };
}
