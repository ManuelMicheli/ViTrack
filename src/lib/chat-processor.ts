import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import {
  classifyMessage,
  classifyWithContext,
  generateRecipe,
  type MealClassification,
  type ParsedMeal,
  type WorkoutClassification,
} from "@/lib/openai";
import { parseExerciseLocal, type ParsedExercise } from "@/lib/exercise-parser";
import { lookupNutrients, type NutrientResult } from "@/lib/nutrition";
import {
  saveRecipe,
  getRecipeByName,
  listRecipes,
  deleteRecipe,
  findRecipeByName,
  type Recipe,
} from "@/lib/recipes";

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
  | { kind: "recipe_saved"; reply: string; data: Recipe }
  | { kind: "recipe_deleted"; reply: string }
  | { kind: "recipe_list"; reply: string }
  | { kind: "recipe_match"; reply: string; data: MealClassification }
  | { kind: "command_result"; reply: string }
  | { kind: "chat"; reply: string }
  | { kind: "error"; reply: string };

// ---------------------------------------------------------------------------
// Nutrition enrichment — accepts ParsedMeal, builds MealClassification
// from API lookup results only (no AI fallback).
// ---------------------------------------------------------------------------
export interface EnrichmentResult {
  meal: MealClassification | null;
  failedItems: string[];
}

export async function enrichWithNutrition(
  parsed: ParsedMeal
): Promise<EnrichmentResult> {
  if (!parsed.items || parsed.items.length === 0) {
    return { meal: null, failedItems: [] };
  }

  const results: (NutrientResult | null)[] = await Promise.all(
    parsed.items.map((item) =>
      lookupNutrients(item.name, item.name_en, item.quantity_g, item.brand, item.is_cooked)
    )
  );

  const failedItems: string[] = [];
  let totCal = 0, totProt = 0, totCarbs = 0, totFat = 0, totFiber = 0;
  const enrichedItems: MealClassification["items"] = [];
  const descParts: string[] = [];

  for (let i = 0; i < parsed.items.length; i++) {
    const item = parsed.items[i];
    const result = results[i];

    if (result) {
      totCal += result.calories;
      totProt += result.protein_g;
      totCarbs += result.carbs_g;
      totFat += result.fat_g;
      totFiber += result.fiber_g;
      enrichedItems.push({
        name: item.name,
        name_en: item.name_en,
        quantity_g: item.quantity_g,
        calories: result.calories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fat_g: result.fat_g,
        fiber_g: result.fiber_g,
      });
      descParts.push(`${item.name}(${item.quantity_g}g)`);
    } else {
      failedItems.push(item.brand ? `${item.brand} ${item.name}` : item.name);
    }
  }

  if (enrichedItems.length === 0) {
    return { meal: null, failedItems };
  }

  const meal: MealClassification = {
    type: "meal",
    description: descParts.join(", "),
    calories: Math.round(totCal),
    protein_g: parseFloat(totProt.toFixed(1)),
    carbs_g: parseFloat(totCarbs.toFixed(1)),
    fat_g: parseFloat(totFat.toFixed(1)),
    fiber_g: parseFloat(totFiber.toFixed(1)),
    meal_type: parsed.meal_type,
    items: enrichedItems,
  };

  return { meal, failedItems };
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
// /crearicetta — User-defined recipe with explicit ingredients
// ---------------------------------------------------------------------------
export async function processCreateRecipe(
  userId: string,
  text: string
): Promise<ProcessResult> {
  const valid = await getUserId(userId);
  if (!valid) return { kind: "error", reply: "Utente non trovato." };

  // Parse: /crearicetta <name>: <ingredients>
  const rest = text.replace(/^\/crearicetta\s*/i, "").trim();
  const colonIdx = rest.indexOf(":");
  if (!rest || colonIdx === -1) {
    return {
      kind: "error",
      reply:
        "Formato: /crearicetta <nome>: <ingredienti>\n" +
        "Esempio: /crearicetta pancake: farina 50g, uova 60g, latte 100ml",
    };
  }

  const name = rest.slice(0, colonIdx).trim();
  const ingredientsText = rest.slice(colonIdx + 1).trim();

  if (!name || !ingredientsText) {
    return {
      kind: "error",
      reply:
        "Formato: /crearicetta <nome>: <ingredienti>\n" +
        "Esempio: /crearicetta pancake: farina 50g, uova 60g, latte 100ml",
    };
  }

  // Check if recipe with this name already exists
  const existing = await getRecipeByName(userId, name);
  if (existing) {
    return {
      kind: "error",
      reply:
        `Esiste già una ricetta "${name}".\n` +
        `Usa /ricetta elimina ${name} per eliminarla prima di ricrearla.`,
    };
  }

  // Use AI to parse the ingredients string into structured ParsedMeal
  const parsed = await classifyMessage(ingredientsText);

  if (parsed.type !== "meal") {
    return {
      kind: "error",
      reply:
        "Non sono riuscito a interpretare gli ingredienti.\n" +
        "Formato: /crearicetta <nome>: <ingredienti>\n" +
        "Esempio: /crearicetta pancake: farina 50g, uova 60g, latte 100ml",
    };
  }

  const isParsedMeal = !("calories" in parsed);
  if (!isParsedMeal) {
    return { kind: "error", reply: "Errore nell'elaborazione degli ingredienti." };
  }

  const parsedMeal = parsed as ParsedMeal;

  // Enrich with real nutrition data
  const enrichResult = await enrichWithNutrition(parsedMeal);

  if (!enrichResult.meal) {
    return {
      kind: "error",
      reply: "Non sono riuscito a trovare i valori nutrizionali per gli ingredienti.",
    };
  }

  // Save recipe
  const recipeItems = parsedMeal.items.map((item) => ({
    name: item.name,
    name_en: item.name_en,
    quantity_g: item.quantity_g,
    brand: item.brand,
    is_branded: item.is_branded,
  }));

  const recipe = await saveRecipe(userId, name, recipeItems, {
    calories: enrichResult.meal.calories,
    protein_g: enrichResult.meal.protein_g,
    carbs_g: enrichResult.meal.carbs_g,
    fat_g: enrichResult.meal.fat_g,
    fiber_g: enrichResult.meal.fiber_g,
  }, enrichResult.meal.meal_type);

  if (!recipe) {
    return { kind: "error", reply: "Errore nel salvataggio della ricetta." };
  }

  const itemsList = recipe.items
    .map((item) => `  - ${item.name} ${item.quantity_g}g`)
    .join("\n");

  let msg =
    `\u2705 Ricetta "${recipe.name}" salvata!\n\n` +
    `Ingredienti:\n${itemsList}\n\n` +
    `\uD83D\uDD25 ${recipe.total_calories} kcal | ` +
    `P ${recipe.total_protein_g}g | ` +
    `C ${recipe.total_carbs_g}g | ` +
    `G ${recipe.total_fat_g}g | ` +
    `F ${recipe.total_fiber_g}g`;

  if (enrichResult.failedItems.length > 0) {
    msg += `\n\nAttenzione: non ho trovato i valori per ${enrichResult.failedItems.join(", ")}`;
  }

  msg += `\n\nOra scrivi "${name}" per loggare il pasto istantaneamente!`;

  return { kind: "recipe_saved", reply: msg, data: recipe };
}

// ---------------------------------------------------------------------------
// /ricetta — Create, show, or delete a recipe
// ---------------------------------------------------------------------------
export async function processRecipe(
  userId: string,
  text: string
): Promise<ProcessResult> {
  const valid = await getUserId(userId);
  if (!valid) return { kind: "error", reply: "Utente non trovato." };

  // Extract name after "/ricetta "
  const rest = text.replace(/^\/ricetta\s*/i, "").trim();

  if (!rest) {
    return {
      kind: "error",
      reply: "Formato: /ricetta <nome>\nEsempio: /ricetta pancake\n\nUsa /ricette per vedere le tue ricette.",
    };
  }

  // /ricetta elimina <nome>
  const eliminaMatch = rest.match(/^elimina\s+(.+)$/i);
  if (eliminaMatch) {
    const name = eliminaMatch[1].trim();
    const deleted = await deleteRecipe(userId, name);
    if (deleted) {
      return { kind: "recipe_deleted", reply: `\u2705 Ricetta "${name}" eliminata!` };
    }
    return { kind: "error", reply: `Ricetta "${name}" non trovata.` };
  }

  // Check if recipe already exists
  const existing = await getRecipeByName(userId, rest);
  if (existing) {
    const itemsList = existing.items
      .map((item) => `  - ${item.name} ${item.quantity_g}g`)
      .join("\n");
    return {
      kind: "recipe_saved",
      reply:
        `\uD83D\uDCD6 Ricetta "${existing.name}" (gi\u00e0 salvata)\n\n` +
        `Ingredienti:\n${itemsList}\n\n` +
        `\uD83D\uDD25 ${existing.total_calories} kcal | ` +
        `P ${existing.total_protein_g}g | ` +
        `C ${existing.total_carbs_g}g | ` +
        `G ${existing.total_fat_g}g | ` +
        `F ${existing.total_fiber_g}g\n\n` +
        `Per eliminarla: /ricetta elimina ${existing.name}`,
      data: existing,
    };
  }

  // Generate recipe via AI
  const generated = await generateRecipe(rest);

  if ("error" in generated) {
    return { kind: "error", reply: generated.error };
  }

  // Enrich with nutrition data
  const enrichResult = await enrichWithNutrition(generated);

  if (!enrichResult.meal) {
    return {
      kind: "error",
      reply: "Non sono riuscito a trovare i valori nutrizionali per gli ingredienti.",
    };
  }

  // Save recipe
  const recipeItems = generated.items.map((item) => ({
    name: item.name,
    name_en: item.name_en,
    quantity_g: item.quantity_g,
    brand: item.brand,
    is_branded: item.is_branded,
  }));

  const recipe = await saveRecipe(userId, rest, recipeItems, {
    calories: enrichResult.meal.calories,
    protein_g: enrichResult.meal.protein_g,
    carbs_g: enrichResult.meal.carbs_g,
    fat_g: enrichResult.meal.fat_g,
    fiber_g: enrichResult.meal.fiber_g,
  }, enrichResult.meal.meal_type);

  if (!recipe) {
    return { kind: "error", reply: "Errore nel salvataggio della ricetta." };
  }

  const itemsList = recipe.items
    .map((item) => `  - ${item.name} ${item.quantity_g}g`)
    .join("\n");

  let msg =
    `\u2705 Ricetta "${recipe.name}" salvata!\n\n` +
    `Ingredienti:\n${itemsList}\n\n` +
    `\uD83D\uDD25 ${recipe.total_calories} kcal | ` +
    `P ${recipe.total_protein_g}g | ` +
    `C ${recipe.total_carbs_g}g | ` +
    `G ${recipe.total_fat_g}g | ` +
    `F ${recipe.total_fiber_g}g`;

  if (enrichResult.failedItems.length > 0) {
    msg += `\n\nAttenzione: non ho trovato i valori per ${enrichResult.failedItems.join(", ")}`;
  }

  msg += `\n\nOra scrivi "${rest}" per loggare il pasto istantaneamente!`;

  return { kind: "recipe_saved", reply: msg, data: recipe };
}

// ---------------------------------------------------------------------------
// /ricette — List all saved recipes
// ---------------------------------------------------------------------------
export async function processRecipeList(
  userId: string
): Promise<ProcessResult> {
  const valid = await getUserId(userId);
  if (!valid) return { kind: "error", reply: "Utente non trovato." };

  const recipes = await listRecipes(userId);

  if (recipes.length === 0) {
    return {
      kind: "recipe_list",
      reply: "Nessuna ricetta salvata.\n\nUsa /ricetta <nome> per crearne una!\nEsempio: /ricetta pancake",
    };
  }

  const lines = recipes.map(
    (r) =>
      `\uD83D\uDCD6 ${r.name} — ${r.total_calories} kcal (P ${r.total_protein_g}g | C ${r.total_carbs_g}g | G ${r.total_fat_g}g)`
  );

  return {
    kind: "recipe_list",
    reply:
      `\uD83D\uDCD6 Le tue ricette (${recipes.length}):\n\n` +
      lines.join("\n") +
      `\n\nScrivi il nome di una ricetta per loggarla istantaneamente!`,
  };
}

// ---------------------------------------------------------------------------
// Recipe match → instant meal logging (no AI)
// ---------------------------------------------------------------------------
export async function processRecipeMatch(
  userId: string,
  recipe: Recipe,
  portions: number
): Promise<ProcessResult> {
  const cal = Math.round(recipe.total_calories * portions);
  const prot = parseFloat((recipe.total_protein_g * portions).toFixed(1));
  const carbs = parseFloat((recipe.total_carbs_g * portions).toFixed(1));
  const fat = parseFloat((recipe.total_fat_g * portions).toFixed(1));
  const fiber = parseFloat((recipe.total_fiber_g * portions).toFixed(1));

  const portionStr = portions > 1 ? ` x${portions}` : "";
  const description = `${recipe.name}${portionStr}`;

  const { error } = await supabase.from("meals").insert({
    user_id: userId,
    description,
    calories: cal,
    protein_g: prot,
    carbs_g: carbs,
    fat_g: fat,
    fiber_g: fiber,
    meal_type: recipe.meal_type,
  });

  if (error) return { kind: "error", reply: "Errore nel salvataggio del pasto." };

  const meal: MealClassification = {
    type: "meal",
    description,
    calories: cal,
    protein_g: prot,
    carbs_g: carbs,
    fat_g: fat,
    fiber_g: fiber,
    meal_type: recipe.meal_type as MealClassification["meal_type"],
    items: [],
  };

  const msg =
    `\u26A1 Pasto registrato da ricetta!\n\n` +
    `${description}\n\n` +
    `\uD83D\uDD25 ${cal} kcal | P ${prot}g | C ${carbs}g | G ${fat}g | F ${fiber}g\n\n` +
    `Tipo: ${recipe.meal_type}`;

  return { kind: "recipe_match", reply: msg, data: meal };
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

  const result = parseExerciseLocal(text);
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
  // Check saved recipes BEFORE AI classification (zero AI cost)
  const recipeMatch = await findRecipeByName(userId, text);
  if (recipeMatch) {
    return processRecipeMatch(userId, recipeMatch.recipe, recipeMatch.portions);
  }

  const result = conversationHistory
    ? await classifyWithContext(conversationHistory)
    : await classifyMessage(text);

  if (result.type === "meal") {
    // ParsedMeal has no "calories" field — detect by checking
    const isParsedMeal = !("calories" in result);

    if (isParsedMeal) {
      const enrichResult = await enrichWithNutrition(result as ParsedMeal);

      if (enrichResult.failedItems.length > 0 && !enrichResult.meal) {
        // All items failed — ask for photo
        const itemNames = enrichResult.failedItems.join(", ");
        return {
          kind: "need_info",
          reply: `Non ho trovato i valori nutrizionali per ${itemNames}. Puoi mandarmi una foto dell'etichetta nutrizionale o del codice a barre?`,
        };
      }

      if (!enrichResult.meal) {
        return { kind: "error", reply: "Errore nell'elaborazione del pasto." };
      }

      const { error } = await supabase.from("meals").insert({
        user_id: userId,
        description: enrichResult.meal.description,
        calories: enrichResult.meal.calories,
        protein_g: enrichResult.meal.protein_g,
        carbs_g: enrichResult.meal.carbs_g,
        fat_g: enrichResult.meal.fat_g,
        fiber_g: enrichResult.meal.fiber_g,
        meal_type: enrichResult.meal.meal_type,
      });

      if (error) return { kind: "error", reply: "Errore nel salvataggio del pasto." };

      let msg =
        `Pasto registrato!\n\n` +
        `${enrichResult.meal.description}\n\n` +
        `Calorie: ${enrichResult.meal.calories} kcal\n` +
        `Proteine: ${enrichResult.meal.protein_g}g\n` +
        `Carboidrati: ${enrichResult.meal.carbs_g}g\n` +
        `Grassi: ${enrichResult.meal.fat_g}g\n` +
        `Fibre: ${enrichResult.meal.fiber_g}g\n\n` +
        `Tipo: ${enrichResult.meal.meal_type}`;

      if (enrichResult.failedItems.length > 0) {
        const itemNames = enrichResult.failedItems.join(", ");
        msg += `\n\nNon ho trovato i valori per: ${itemNames}\nMandami una foto dell'etichetta per aggiungerli.`;
      }

      return { kind: "meal_saved", reply: msg, data: enrichResult.meal };
    }

    // Legacy MealClassification (shouldn't happen with new prompt, but safe fallback)
    const legacyMeal = result as MealClassification;
    const { error } = await supabase.from("meals").insert({
      user_id: userId,
      description: legacyMeal.description,
      calories: legacyMeal.calories,
      protein_g: legacyMeal.protein_g,
      carbs_g: legacyMeal.carbs_g,
      fat_g: legacyMeal.fat_g,
      fiber_g: legacyMeal.fiber_g,
      meal_type: legacyMeal.meal_type,
    });

    if (error) return { kind: "error", reply: "Errore nel salvataggio del pasto." };

    const msg =
      `Pasto registrato!\n\n` +
      `${legacyMeal.description}\n\n` +
      `Calorie: ${legacyMeal.calories} kcal\n` +
      `Proteine: ${legacyMeal.protein_g}g\n` +
      `Carboidrati: ${legacyMeal.carbs_g}g\n` +
      `Grassi: ${legacyMeal.fat_g}g\n` +
      `Fibre: ${legacyMeal.fiber_g}g\n\n` +
      `Tipo: ${legacyMeal.meal_type}`;

    return { kind: "meal_saved", reply: msg, data: legacyMeal };
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
  if (text.startsWith("/crearicetta")) return processCreateRecipe(userId, text);
  if (text.startsWith("/ricetta")) return processRecipe(userId, text);
  if (text === "/ricette") return processRecipeList(userId);
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
    case "recipe_match":
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
    case "recipe_saved":
    case "recipe_deleted":
    case "recipe_list":
      return "command_result";
    case "chat":
      return "text";
    default:
      return "text";
  }
}
