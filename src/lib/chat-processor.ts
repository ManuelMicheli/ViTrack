import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import {
  classifyMessage,
  classifyWithContext,
  parseExercise,
  type MealClassification,
  type ParsedExercise,
  type WorkoutClassification,
} from "@/lib/openai";
import { lookupNutrients, type NutrientResult } from "@/lib/nutrition";

// ---------------------------------------------------------------------------
// Result types — platform-agnostic responses
// ---------------------------------------------------------------------------
export type ProcessResult =
  | { kind: "meal_saved"; reply: string; data: MealClassification }
  | { kind: "workout_saved"; reply: string; data: WorkoutClassification }
  | { kind: "need_info"; reply: string }
  | { kind: "pending_workout"; reply: string; workoutId: string }
  | { kind: "session_started"; reply: string }
  | { kind: "session_ended"; reply: string }
  | { kind: "session_cancelled"; reply: string }
  | { kind: "session_exists"; reply: string }
  | { kind: "exercise_added"; reply: string }
  | { kind: "goal_updated"; reply: string }
  | { kind: "command_result"; reply: string }
  | { kind: "chat"; reply: string }
  | { kind: "error"; reply: string };

// ---------------------------------------------------------------------------
// Nutrition enrichment (moved from webhook — no Telegram dependency)
// ---------------------------------------------------------------------------
export async function enrichWithNutrition(
  meal: MealClassification
): Promise<MealClassification> {
  if (!meal.items || meal.items.length === 0) return meal;

  const results: (NutrientResult | null)[] = await Promise.all(
    meal.items.map((item) =>
      lookupNutrients(item.name, item.name_en ?? item.name, item.quantity_g)
    )
  );

  let totCal = 0,
    totProt = 0,
    totCarbs = 0,
    totFat = 0,
    totFiber = 0;
  const descParts: string[] = [];

  for (let i = 0; i < meal.items.length; i++) {
    const item = meal.items[i];
    const result = results[i];

    if (result) {
      totCal += result.calories;
      totProt += result.protein_g;
      totCarbs += result.carbs_g;
      totFat += result.fat_g;
      totFiber += result.fiber_g;
      descParts.push(`${item.name}(${item.quantity_g}g)`);
    } else if (typeof item.calories === "number" && !isNaN(item.calories)) {
      const aiP = item.protein_g ?? 0;
      const aiC = item.carbs_g ?? 0;
      const aiF = item.fat_g ?? 0;
      const aiFib = item.fiber_g ?? 0;
      const atwaterCal = Math.round(4 * aiP + 4 * aiC + 9 * aiF);
      const aiCal = item.calories;
      const useCal =
        aiCal > 0 && Math.abs(atwaterCal - aiCal) / aiCal > 0.15
          ? atwaterCal
          : aiCal;
      totCal += useCal;
      totProt += aiP;
      totCarbs += aiC;
      totFat += aiF;
      totFiber += aiFib;
      descParts.push(`${item.name}(${item.quantity_g}g)*`);
    } else {
      const aiTotal = meal.items.reduce((s, it) => s + it.quantity_g, 0);
      const ratio = aiTotal > 0 ? item.quantity_g / aiTotal : 0;
      totCal += Math.round(meal.calories * ratio);
      totProt += parseFloat((meal.protein_g * ratio).toFixed(1));
      totCarbs += parseFloat((meal.carbs_g * ratio).toFixed(1));
      totFat += parseFloat((meal.fat_g * ratio).toFixed(1));
      totFiber += parseFloat((meal.fiber_g * ratio).toFixed(1));
      descParts.push(`${item.name}(${item.quantity_g}g)*`);
    }
  }

  const hasFallback = results.some((r) => r === null);

  return {
    ...meal,
    calories: Math.round(totCal),
    protein_g: parseFloat(totProt.toFixed(1)),
    carbs_g: parseFloat(totCarbs.toFixed(1)),
    fat_g: parseFloat(totFat.toFixed(1)),
    fiber_g: parseFloat(totFiber.toFixed(1)),
    description:
      descParts.join(", ") + (hasFallback ? "\n(* = stima AI)" : ""),
  };
}

// ---------------------------------------------------------------------------
// Helper: get user id from users table
// ---------------------------------------------------------------------------
async function getUserId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();
  return data?.id ?? null;
}

// ---------------------------------------------------------------------------
// /oggi — Daily summary
// ---------------------------------------------------------------------------
export async function processToday(userId: string): Promise<ProcessResult> {
  const valid = await getUserId(userId);
  if (!valid) return { kind: "error", reply: "Utente non trovato." };

  const today = new Date().toISOString().split("T")[0];
  const startOfDay = `${today}T00:00:00.000Z`;
  const endOfDay = `${today}T23:59:59.999Z`;

  const [mealsRes, workoutsRes, userRes] = await Promise.all([
    supabase
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", startOfDay)
      .lte("logged_at", endOfDay),
    supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", startOfDay)
      .lte("logged_at", endOfDay),
    supabase
      .from("users")
      .select("daily_calorie_goal")
      .eq("id", userId)
      .single(),
  ]);

  const meals = mealsRes.data ?? [];
  const workouts = workoutsRes.data ?? [];
  const dailyGoal = userRes.data?.daily_calorie_goal ?? 2000;

  let totalCal = 0, totalP = 0, totalC = 0, totalF = 0, totalFib = 0, totalBurned = 0;

  const mealLines: string[] = [];
  for (const m of meals) {
    totalCal += m.calories || 0;
    totalP += m.protein_g || 0;
    totalC += m.carbs_g || 0;
    totalF += m.fat_g || 0;
    totalFib += m.fiber_g || 0;
    mealLines.push(`${m.description} - ${m.calories} kcal`);
  }

  const workoutLines: string[] = [];
  for (const w of workouts) {
    totalBurned += w.calories_burned || 0;
    workoutLines.push(`\uD83C\uDFCB ${w.description} - ${w.duration_min} min, ${w.calories_burned} kcal`);
  }

  const net = totalCal - totalBurned;
  const remaining = dailyGoal - net;

  let msg = `\uD83D\uDCCA Riepilogo di oggi\n\n`;
  msg += mealLines.length > 0
    ? `Pasti:\n${mealLines.join("\n")}\n\n`
    : `Pasti: Nessun pasto registrato\n\n`;
  msg += workoutLines.length > 0
    ? `Allenamenti:\n${workoutLines.join("\n")}\n\n`
    : `Allenamenti: Nessun allenamento registrato\n\n`;
  msg += `Totali:\n`;
  msg += `\uD83D\uDD25 Calorie: ${totalCal} kcal\n`;
  msg += `\uD83E\uDD69 Proteine: ${Math.round(totalP)}g\n`;
  msg += `\uD83C\uDF5E Carboidrati: ${Math.round(totalC)}g\n`;
  msg += `\uD83E\uDDC8 Grassi: ${Math.round(totalF)}g\n`;
  msg += `\uD83E\uDD66 Fibre: ${Math.round(totalFib)}g\n`;
  msg += `\uD83C\uDFCB Bruciate: ${totalBurned} kcal\n\n`;
  msg += `\uD83C\uDFAF Obiettivo: ${dailyGoal} kcal\n`;
  msg += `\u2696 Netto: ${net} kcal\n`;
  msg += remaining > 0
    ? `\u2705 Restano ${remaining} kcal`
    : `\u26A0 Superato di ${Math.abs(remaining)} kcal`;

  return { kind: "command_result", reply: msg };
}

// ---------------------------------------------------------------------------
// /obiettivo N — Set calorie goal
// ---------------------------------------------------------------------------
export async function processGoal(
  userId: string,
  text: string
): Promise<ProcessResult> {
  const match = text.match(/\/obiettivo\s+(\d+)/);
  if (!match) {
    return { kind: "error", reply: "Formato non valido. Usa: /obiettivo 2000" };
  }
  const kcal = parseInt(match[1]);
  const { error } = await supabase
    .from("users")
    .update({ daily_calorie_goal: kcal })
    .eq("id", userId);

  if (error) {
    return { kind: "error", reply: "Errore nell'aggiornamento." };
  }
  return { kind: "goal_updated", reply: `\u2705 Obiettivo giornaliero aggiornato a ${kcal} kcal!` };
}

// ---------------------------------------------------------------------------
// /sessione — Start gym session (uses DB-backed active_chat_sessions)
// ---------------------------------------------------------------------------
export async function processSessionStart(
  userId: string
): Promise<ProcessResult> {
  // Check if there's already an active session
  const { data: existing } = await supabase
    .from("active_chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existing) {
    const exercises = (existing.exercises as ParsedExercise[]) || [];
    return {
      kind: "session_exists",
      reply: `Hai gia una sessione attiva con ${exercises.length} esercizi.\nUsa /fine per salvarla o /annulla per cancellarla.`,
    };
  }

  await supabase.from("active_chat_sessions").insert({
    user_id: userId,
    exercises: [],
  });

  return {
    kind: "session_started",
    reply:
      `\uD83C\uDFCB Sessione iniziata!\n\n` +
      `Inviami gli esercizi uno alla volta, ad esempio:\n` +
      `panca piana 4x8 80kg\n` +
      `curl 3x12 25kg\n` +
      `trazioni 3x8\n\n` +
      `Comandi:\n` +
      `/fine - Salva e termina la sessione\n` +
      `/annulla - Annulla senza salvare`,
  };
}

// ---------------------------------------------------------------------------
// /fine — End session and save workout
// ---------------------------------------------------------------------------
export async function processSessionEnd(
  userId: string
): Promise<ProcessResult> {
  const { data: session } = await supabase
    .from("active_chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!session) {
    return {
      kind: "error",
      reply: "Nessuna sessione attiva. Usa /sessione per iniziarne una.",
    };
  }

  const exercises = (session.exercises as ParsedExercise[]) || [];

  if (exercises.length === 0) {
    await supabase.from("active_chat_sessions").delete().eq("user_id", userId);
    return { kind: "session_ended", reply: "Sessione vuota, nessun esercizio aggiunto." };
  }

  if (session.workout_id) {
    const { error } = await supabase
      .from("workouts")
      .update({ exercises })
      .eq("id", session.workout_id);

    await supabase.from("active_chat_sessions").delete().eq("user_id", userId);

    if (error) return { kind: "error", reply: "Errore nel salvataggio degli esercizi." };

    const list = exercises
      .map((e: ParsedExercise, i: number) => {
        const base = `${i + 1}. ${e.name}: ${e.sets}x${e.reps}`;
        return e.weight_kg ? `${base} @ ${e.weight_kg}kg` : base;
      })
      .join("\n");

    return {
      kind: "session_ended",
      reply: `\u2705 Esercizi aggiunti!\n\n\uD83D\uDCAA Esercizi (${exercises.length}):\n${list}`,
    };
  }

  // Standalone session — create new workout
  const durationMin = Math.round(
    (Date.now() - new Date(session.started_at).getTime()) / 60000
  );
  const exerciseNames = exercises.map((e: ParsedExercise) => e.name).join(", ");
  const description = `Sessione: ${exerciseNames}`;

  const { error } = await supabase.from("workouts").insert({
    user_id: userId,
    description,
    workout_type: "Palestra",
    duration_min: durationMin || 1,
    calories_burned: null,
    exercises,
  });

  await supabase.from("active_chat_sessions").delete().eq("user_id", userId);

  if (error) return { kind: "error", reply: "Errore nel salvataggio dell'allenamento." };

  const list = exercises
    .map((e: ParsedExercise, i: number) => {
      const base = `${i + 1}. ${e.name}: ${e.sets}x${e.reps}`;
      return e.weight_kg ? `${base} @ ${e.weight_kg}kg` : base;
    })
    .join("\n");

  return {
    kind: "session_ended",
    reply:
      `\u2705 Sessione salvata!\n\n` +
      `\uD83D\uDCAA Esercizi (${exercises.length}):\n${list}\n\n` +
      `\u23F1 Durata: ${durationMin} min`,
  };
}

// ---------------------------------------------------------------------------
// /annulla — Cancel session
// ---------------------------------------------------------------------------
export async function processSessionCancel(
  userId: string
): Promise<ProcessResult> {
  const { data } = await supabase
    .from("active_chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!data) {
    return { kind: "error", reply: "Nessuna sessione attiva da annullare." };
  }

  await supabase.from("active_chat_sessions").delete().eq("user_id", userId);
  return { kind: "session_cancelled", reply: "\u274C Sessione annullata. Nessun dato salvato." };
}

// ---------------------------------------------------------------------------
// Session exercise — parse single exercise and add to session
// ---------------------------------------------------------------------------
export async function processSessionExercise(
  userId: string,
  text: string
): Promise<ProcessResult> {
  const { data: session } = await supabase
    .from("active_chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!session) {
    return { kind: "error", reply: "Nessuna sessione attiva." };
  }

  const result = await parseExercise(text);
  if ("error" in result) {
    return { kind: "error", reply: result.error };
  }

  const exercises = [...((session.exercises as ParsedExercise[]) || []), result];

  await supabase
    .from("active_chat_sessions")
    .update({ exercises, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  const weightStr = result.weight_kg ? ` @ ${result.weight_kg}kg` : "";
  return {
    kind: "exercise_added",
    reply:
      `\u2705 ${result.name}: ${result.sets}x${result.reps}${weightStr}\n` +
      `(${exercises.length} ${exercises.length === 1 ? "esercizio" : "esercizi"} in sessione)`,
  };
}

// ---------------------------------------------------------------------------
// Free text — AI classification → save meal or workout
// ---------------------------------------------------------------------------
export async function processFreeText(
  userId: string,
  text: string,
  conversationHistory?: { role: string; content: string }[]
): Promise<ProcessResult> {
  const result = conversationHistory
    ? await classifyWithContext(conversationHistory)
    : await classifyMessage(text);

  if (result.type === "meal") {
    const enriched = await enrichWithNutrition(result as MealClassification);

    const { error } = await supabase.from("meals").insert({
      user_id: userId,
      description: enriched.description,
      calories: enriched.calories,
      protein_g: enriched.protein_g,
      carbs_g: enriched.carbs_g,
      fat_g: enriched.fat_g,
      fiber_g: enriched.fiber_g,
      meal_type: enriched.meal_type,
    });

    if (error) {
      return { kind: "error", reply: "Errore nel salvataggio del pasto." };
    }

    const msg =
      `Pasto registrato!\n\n` +
      `${enriched.description}\n\n` +
      `Calorie: ${enriched.calories} kcal\n` +
      `Proteine: ${enriched.protein_g}g\n` +
      `Carboidrati: ${enriched.carbs_g}g\n` +
      `Grassi: ${enriched.fat_g}g\n` +
      `Fibre: ${enriched.fiber_g}g\n\n` +
      `Tipo: ${enriched.meal_type}`;

    return { kind: "meal_saved", reply: msg, data: enriched };
  }

  if (result.type === "need_info") {
    return { kind: "need_info", reply: result.message };
  }

  if (result.type === "workout") {
    const hasExercises = result.exercises && result.exercises.length > 0;

    const { data, error } = await supabase
      .from("workouts")
      .insert({
        user_id: userId,
        description: result.description,
        workout_type: result.workout_type,
        duration_min: result.duration_min,
        calories_burned: result.calories_burned,
        exercises: hasExercises ? result.exercises : null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { kind: "error", reply: "Errore nel salvataggio dell'allenamento." };
    }

    if (hasExercises) {
      const list = result.exercises
        .map((e) => {
          const base = `  - ${e.name}: ${e.sets}x${e.reps}`;
          return e.weight_kg ? `${base} @ ${e.weight_kg}kg` : base;
        })
        .join("\n");

      return {
        kind: "workout_saved",
        reply:
          `\u2705 Allenamento registrato!\n\n` +
          `\uD83C\uDFCB ${result.description}\n\n` +
          `\uD83D\uDCAA Esercizi:\n${list}`,
        data: result,
      };
    }

    // Generic workout — ask if they want to add exercises
    // Save a session linked to this workout
    await supabase.from("active_chat_sessions").upsert({
      user_id: userId,
      exercises: [],
      workout_id: data.id,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return {
      kind: "pending_workout",
      reply:
        `\u2705 ${result.description} registrato!\n\n` +
        `Vuoi aggiungere gli esercizi che hai fatto? (si/no)`,
      workoutId: data.id,
    };
  }

  if (result.type === "chat") {
    return { kind: "chat", reply: result.message };
  }

  return { kind: "error", reply: result.message };
}

// ---------------------------------------------------------------------------
// Pending workout — handle yes/no response for adding exercises
// ---------------------------------------------------------------------------
export async function processPendingWorkoutResponse(
  userId: string,
  text: string
): Promise<ProcessResult> {
  const lower = text.toLowerCase().trim();
  const isYes = /^(s[iì]|yes|y|ok|certo|va bene|dai)$/i.test(lower);
  const isNo = /^(no|nah|nope|non?|skip|salta)$/i.test(lower);

  if (isYes) {
    // Keep the session (it already has workout_id), just clear exercises
    await supabase
      .from("active_chat_sessions")
      .update({ exercises: [], updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    return {
      kind: "session_started",
      reply:
        `\uD83D\uDCAA Inviami gli esercizi uno alla volta, ad esempio:\n` +
        `panca piana 4x8 80kg\n` +
        `curl 3x12 25kg\n\n` +
        `/fine - Salva e chiudi\n` +
        `/annulla - Annulla senza aggiungere esercizi`,
    };
  }

  if (isNo) {
    // Get workout description before deleting session
    const { data: session } = await supabase
      .from("active_chat_sessions")
      .select("workout_id")
      .eq("user_id", userId)
      .single();

    await supabase.from("active_chat_sessions").delete().eq("user_id", userId);

    let desc = "l'allenamento";
    if (session?.workout_id) {
      const { data: workout } = await supabase
        .from("workouts")
        .select("description")
        .eq("id", session.workout_id)
        .single();
      if (workout) desc = workout.description;
    }

    return {
      kind: "workout_saved",
      reply: `\uD83D\uDC4D ${desc} registrato senza esercizi.`,
      data: { type: "workout", description: desc, workout_type: "", duration_min: null, calories_burned: null, exercises: [] },
    };
  }

  return {
    kind: "need_info",
    reply: "Rispondi si per aggiungere gli esercizi o no per registrare solo la sessione.",
  };
}

// ---------------------------------------------------------------------------
// Main router: processes a message and returns a structured result
// ---------------------------------------------------------------------------
export async function processMessage(
  userId: string,
  text: string
): Promise<ProcessResult> {
  // Commands
  if (text === "/oggi") return processToday(userId);
  if (text.startsWith("/obiettivo")) return processGoal(userId, text);
  if (text === "/sessione") return processSessionStart(userId);
  if (text === "/fine") return processSessionEnd(userId);
  if (text === "/annulla") return processSessionCancel(userId);

  // Check for active session (DB-backed)
  const { data: activeSession } = await supabase
    .from("active_chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (activeSession) {
    // If session has a workout_id and no exercises yet, it's a pending workout response
    const exercises = (activeSession.exercises as ParsedExercise[]) || [];
    if (activeSession.workout_id && exercises.length === 0) {
      // Check if this is a yes/no answer
      const lower = text.toLowerCase().trim();
      const isYesNo = /^(s[iì]|yes|y|ok|certo|va bene|dai|no|nah|nope|non?|skip|salta)$/i.test(lower);
      if (isYesNo) {
        return processPendingWorkoutResponse(userId, text);
      }
    }
    // Active session with exercises or not a yes/no → parse as exercise
    return processSessionExercise(userId, text);
  }

  // Check recent messages for pending context (need_info follow-up)
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: recentMessages } = await supabase
    .from("chat_messages")
    .select("role, content, message_type")
    .eq("user_id", userId)
    .gte("created_at", thirtyMinAgo)
    .order("created_at", { ascending: true });

  if (recentMessages && recentMessages.length > 0) {
    const lastAssistant = [...recentMessages]
      .reverse()
      .find((m) => m.role === "assistant");

    if (lastAssistant?.message_type === "need_info") {
      // Rebuild conversation history from recent messages
      const history = recentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: "user", content: text });
      return processFreeText(userId, text, history);
    }
  }

  // Default: free text classification
  return processFreeText(userId, text);
}

// ---------------------------------------------------------------------------
// Helper: map ProcessResult kind to message_type for DB storage
// ---------------------------------------------------------------------------
export function resultToMessageType(
  kind: ProcessResult["kind"]
): string {
  switch (kind) {
    case "meal_saved":
      return "meal_saved";
    case "workout_saved":
      return "workout_saved";
    case "need_info":
    case "pending_workout":
      return "need_info";
    case "error":
      return "error";
    case "command_result":
    case "goal_updated":
    case "session_started":
    case "session_ended":
    case "session_cancelled":
    case "session_exists":
    case "exercise_added":
      return "command_result";
    case "chat":
      return "text";
    default:
      return "text";
  }
}
