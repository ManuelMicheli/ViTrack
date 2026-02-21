import { NextResponse, after } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { sendMessage, editMessage, sendTyping, downloadFile } from "@/lib/telegram";
import {
  classifyStream,
  parseExercise,
  transcribeAudio,
  type MealClassification,
  type ParsedMeal,
  type WorkoutClassification,
  type ParsedExercise,
} from "@/lib/openai";
import { warmupCache, type NutrientResult } from "@/lib/nutrition";
import { enrichWithNutrition } from "@/lib/chat-processor";
import { analyzePhoto, lookupByBarcode, labelToNutrients } from "@/lib/vision";

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------
interface SessionData {
  exercises: ParsedExercise[];
  startedAt: Date;
  workoutId?: string; // set when session is linked to a saved workout
}

interface PendingWorkout {
  workoutId: string;
  description: string;
  workout_type: string;
}

interface PendingMealInfo {
  history: { role: string; content: string }[];
}

interface AwaitingPhoto {
  items: { name: string; name_en: string; brand: string | null; quantity_g: number; is_branded: boolean }[];
  failedItemNames: string[];
  meal_type: "colazione" | "pranzo" | "cena" | "snack";
  expiresAt: number;
}

const activeSessions = new Map<number, SessionData>();
const pendingWorkouts = new Map<number, PendingWorkout>();
const pendingMeals = new Map<number, PendingMealInfo>();
const awaitingPhotos = new Map<number, AwaitingPhoto>();

// ---------------------------------------------------------------------------
// Hourglass animation — flips ⏳/⌛ every 2s while processing
// ---------------------------------------------------------------------------
function startHourglassAnimation(
  chatId: number,
  messageId: number
): { stop: () => void } {
  const frames = ["\u23F3 Sto elaborando...", "\u231B Sto elaborando..."];
  let i = 1; // frame 0 is already shown on send
  const interval = setInterval(async () => {
    try {
      await editMessage(chatId, messageId, frames[i % frames.length]);
      i++;
    } catch {
      // Ignore edit errors (message already replaced, etc.)
    }
  }, 2000);

  return {
    stop: () => clearInterval(interval),
  };
}

// ---------------------------------------------------------------------------
// Save messages to chat_messages for unified history (fire-and-forget)
// ---------------------------------------------------------------------------
function saveChatMsg(
  userId: string,
  role: "user" | "assistant",
  content: string,
  messageType: string = "text"
) {
  supabase.from("chat_messages").insert({
    user_id: userId,
    role,
    content,
    message_type: messageType,
    source: "telegram",
  }).then(() => {}, () => {});
}

// Wrap sendMessage to also save to chat_messages
async function sendAndSave(
  chatId: number,
  text: string,
  userId: string | null,
  messageType: string = "text"
): Promise<number | null> {
  const msgId = await sendMessage(chatId, text);
  if (userId) saveChatMsg(userId, "assistant", text, messageType);
  return msgId;
}

export async function POST(request: Request) {
  // Parse body before after() — request body can only be read once
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = body?.message;
  if (!message?.from?.id || !message?.chat?.id) {
    return NextResponse.json({ ok: true });
  }

  const telegramId = message.from.id as number;
  const chatId = message.chat.id as number;
  const firstName = message.from.first_name ?? "";
  const username = message.from.username ?? "";

  // ACK Telegram immediately — all processing runs in the background
  after(async () => {
    const t0 = performance.now();
    try {
      let text: string | null = message.text?.trim() ?? null;

      if (!text && (message.voice || message.audio)) {
        const fileId = message.voice?.file_id ?? message.audio?.file_id;
        if (fileId) {
          await sendTyping(chatId);
          const thinkingId = await sendMessage(chatId, "\uD83C\uDFA4 Trascrivo l'audio...");

          const audioBuffer = await downloadFile(fileId);
          if (!audioBuffer) {
            if (thinkingId) await editMessage(chatId, thinkingId, "Non sono riuscito a scaricare l'audio. Riprova.");
            return;
          }

          const transcription = await transcribeAudio(audioBuffer);
          if (!transcription) {
            if (thinkingId) await editMessage(chatId, thinkingId, "Non sono riuscito a trascrivere l'audio. Riprova o scrivi a testo.");
            return;
          }

          text = transcription;
          if (thinkingId) await editMessage(chatId, thinkingId, `\uD83C\uDFA4 <i>"${text}"</i>`);
        }
      }

      // Handle photo messages (with or without caption)
      if (message.photo && message.photo.length > 0) {
        const photoUserId = await getUserId(telegramId);
        if (!photoUserId) {
          await sendMessage(chatId, "Invia prima /start per registrarti.");
          return;
        }
        saveChatMsg(photoUserId, "user", message.caption ? `[foto] ${message.caption}` : "[foto]");
        await handlePhoto(chatId, telegramId, photoUserId, message);
        return;
      }

      if (!text) return;

      const uid = await getUserId(telegramId);
      if (uid) saveChatMsg(uid, "user", text);

      if (text === "/start") {
        await handleStart(chatId, telegramId, username, firstName);
      } else if (text === "/oggi") {
        await handleToday(chatId, telegramId, uid);
      } else if (text.startsWith("/obiettivo")) {
        await handleGoal(chatId, telegramId, text, uid);
      } else if (text === "/sessione") {
        await handleSessionStart(chatId, telegramId, uid);
      } else if (text === "/fine") {
        await handleSessionEnd(chatId, telegramId, uid);
      } else if (text === "/annulla") {
        await handleSessionCancel(chatId, telegramId, uid);
      } else if (pendingMeals.has(telegramId)) {
        await handlePendingMealResponse(chatId, telegramId, text, uid);
      } else if (pendingWorkouts.has(telegramId)) {
        await handlePendingResponse(chatId, telegramId, text, uid);
      } else if (activeSessions.has(telegramId)) {
        await handleSessionExercise(chatId, telegramId, text, uid);
      } else {
        await handleFreeText(chatId, telegramId, text, uid);
      }

      console.log(`[Perf] Total: ${(performance.now() - t0).toFixed(0)}ms`);
    } catch (err) {
      console.error("Webhook error:", err);
      try { await sendMessage(chatId, "Si \u00e8 verificato un errore. Riprova."); } catch { /* ignore */ }
    }
  });

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------------
// /start — Register user and send welcome
// ---------------------------------------------------------------------------
async function handleStart(
  chatId: number,
  telegramId: number,
  username: string,
  firstName: string
) {
  await supabase.from("users").upsert(
    { telegram_id: telegramId, username, first_name: firstName },
    { onConflict: "telegram_id" }
  );

  await sendMessage(
    chatId,
    `Ciao <b>${firstName}</b>! Benvenuto in <b>ViTrack</b>!\n\n` +
      `Sono il tuo assistente per il tracking di alimentazione e allenamenti.\n\n` +
      `Ecco cosa puoi fare:\n` +
      `- Scrivimi cosa hai mangiato e calcolo calorie e macro\n` +
      `- Scrivimi il tuo allenamento e lo registro\n` +
      `- /sessione - Inizia sessione live in palestra\n` +
      `- /oggi - Riepilogo giornaliero\n` +
      `- /obiettivo 2000 - Imposta obiettivo calorico\n\n` +
      `Il tuo Telegram ID per accedere alla dashboard: <code>${telegramId}</code>\n\n` +
      `Inizia pure a scrivermi!`
  );

  // Pre-warm nutrition cache while user reads the welcome message
  warmupCache();
}

// ---------------------------------------------------------------------------
// /oggi — Daily summary
// ---------------------------------------------------------------------------
async function handleToday(chatId: number, telegramId: number, uid: string | null) {
  const userId = uid ?? await getUserId(telegramId);
  if (!userId) {
    await sendMessage(chatId, "Invia prima /start per registrarti.");
    return;
  }

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

  let totalCal = 0,
    totalP = 0,
    totalC = 0,
    totalF = 0,
    totalFib = 0,
    totalBurned = 0;

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
    workoutLines.push(
      `\uD83C\uDFCB ${w.description} - ${w.duration_min} min, ${w.calories_burned} kcal`
    );
  }

  const net = totalCal - totalBurned;
  const remaining = dailyGoal - net;

  let msg = `\uD83D\uDCCA <b>Riepilogo di oggi</b>\n\n`;
  msg +=
    mealLines.length > 0
      ? `<b>Pasti:</b>\n${mealLines.join("\n")}\n\n`
      : `<b>Pasti:</b> Nessun pasto registrato\n\n`;
  msg +=
    workoutLines.length > 0
      ? `<b>Allenamenti:</b>\n${workoutLines.join("\n")}\n\n`
      : `<b>Allenamenti:</b> Nessun allenamento registrato\n\n`;
  msg += `<b>Totali:</b>\n`;
  msg += `\uD83D\uDD25 Calorie: ${totalCal} kcal\n`;
  msg += `\uD83E\uDD69 Proteine: ${Math.round(totalP)}g\n`;
  msg += `\uD83C\uDF5E Carboidrati: ${Math.round(totalC)}g\n`;
  msg += `\uD83E\uDDC8 Grassi: ${Math.round(totalF)}g\n`;
  msg += `\uD83E\uDD66 Fibre: ${Math.round(totalFib)}g\n`;
  msg += `\uD83C\uDFCB Bruciate: ${totalBurned} kcal\n\n`;
  msg += `\uD83C\uDFAF Obiettivo: ${dailyGoal} kcal\n`;
  msg += `\u2696 Netto: ${net} kcal\n`;
  msg +=
    remaining > 0
      ? `\u2705 Restano ${remaining} kcal`
      : `\u26A0 Superato di ${Math.abs(remaining)} kcal`;

  await sendAndSave(chatId, msg, userId, "command_result");
}

// ---------------------------------------------------------------------------
// /obiettivo N — Set calorie goal
// ---------------------------------------------------------------------------
async function handleGoal(
  chatId: number,
  telegramId: number,
  text: string,
  uid: string | null
) {
  const match = text.match(/\/obiettivo\s+(\d+)/);
  if (!match) {
    await sendAndSave(chatId, "Formato non valido. Usa: <code>/obiettivo 2000</code>", uid, "error");
    return;
  }

  const kcal = parseInt(match[1]);
  const { error } = await supabase
    .from("users")
    .update({ daily_calorie_goal: kcal })
    .eq("telegram_id", telegramId);

  if (error) {
    await sendAndSave(chatId, "Errore nell'aggiornamento. Invia /start prima.", uid, "error");
    return;
  }

  await sendAndSave(chatId, `\u2705 Obiettivo giornaliero aggiornato a <b>${kcal} kcal</b>!`, uid, "command_result");
}

// ---------------------------------------------------------------------------
// Free text — AI classification → save meal or workout
// ---------------------------------------------------------------------------
async function handleFreeText(
  chatId: number,
  telegramId: number,
  text: string,
  uid: string | null
) {
  const userId = uid ?? await getUserId(telegramId);
  if (!userId) {
    await sendMessage(chatId, "Invia prima /start per registrarti.");
    return;
  }

  warmupCache();

  const t0 = performance.now();

  // Send placeholder and typing in parallel
  const [thinkingId] = await Promise.all([
    sendMessage(chatId, "\u23F3 Sto elaborando..."),
    sendTyping(chatId),
  ]);

  // Progressive editing state for chat streaming
  let lastEditTime = 0;
  let lastEditText = "";
  let isChat = false;
  const anim = thinkingId ? startHourglassAnimation(chatId, thinkingId) : null;

  const result = await classifyStream(text, {
    onTypeDetected: (type) => {
      console.log(`[Perf] Type "${type}" detected: ${(performance.now() - t0).toFixed(0)}ms`);
      if (type === "chat") {
        isChat = true;
        anim?.stop(); // Stop hourglass — streamed text replaces it
      }
    },
    onChatDelta: (partial) => {
      if (!thinkingId || !partial) return;
      const now = Date.now();
      if (now - lastEditTime > 400 && partial !== lastEditText) {
        lastEditTime = now;
        lastEditText = partial;
        editMessage(chatId, thinkingId, partial + " \u258D").catch(() => {});
      }
    },
  });

  if (!isChat) anim?.stop();
  console.log(`[Perf] AI complete: ${(performance.now() - t0).toFixed(0)}ms`);

  try {
    if (result.type === "meal") {
      const isParsedMeal = !("calories" in result);
      if (isParsedMeal) {
        const enrichResult = await enrichWithNutrition(result as ParsedMeal);
        console.log(`[Perf] Nutrition enriched: ${(performance.now() - t0).toFixed(0)}ms`);

        if (enrichResult.failedItems.length > 0 && !enrichResult.meal) {
          const itemNames = enrichResult.failedItems.join(", ");
          const reply = `Non ho trovato i valori nutrizionali per ${itemNames}. Puoi mandarmi una foto dell'etichetta nutrizionale o del codice a barre?`;
          if (thinkingId) await editMessage(chatId, thinkingId, reply);
          else await sendMessage(chatId, reply);
          saveChatMsg(userId, "assistant", reply, "need_info");
          awaitingPhotos.set(telegramId, {
            items: (result as ParsedMeal).items,
            failedItemNames: enrichResult.failedItems,
            meal_type: (result as ParsedMeal).meal_type,
            expiresAt: Date.now() + 5 * 60 * 1000,
          });
        } else if (enrichResult.meal) {
          let extraMsg = "";
          if (enrichResult.failedItems.length > 0) {
            const itemNames = enrichResult.failedItems.join(", ");
            extraMsg = `\n\nNon ho trovato i valori per: ${itemNames}\nMandami una foto dell'etichetta per aggiungerli.`;
            awaitingPhotos.set(telegramId, {
              items: (result as ParsedMeal).items,
              failedItemNames: enrichResult.failedItems,
              meal_type: (result as ParsedMeal).meal_type,
              expiresAt: Date.now() + 5 * 60 * 1000,
            });
          }
          await saveMealWithEdit(chatId, userId, enrichResult.meal, thinkingId, extraMsg);
        } else {
          const reply = "Errore nell'elaborazione del pasto.";
          if (thinkingId) await editMessage(chatId, thinkingId, reply);
          else await sendMessage(chatId, reply);
          saveChatMsg(userId, "assistant", reply, "error");
        }
      } else {
        // Legacy MealClassification fallback
        const legacyMeal = result as MealClassification;
        console.log(`[Perf] Nutrition enriched (legacy): ${(performance.now() - t0).toFixed(0)}ms`);
        await saveMealWithEdit(chatId, userId, legacyMeal, thinkingId);
      }
    } else if (result.type === "need_info") {
      pendingMeals.set(telegramId, {
        history: [
          { role: "user", content: text },
          { role: "assistant", content: JSON.stringify(result) },
        ],
      });
      const reply = result.message;
      if (thinkingId) await editMessage(chatId, thinkingId, reply);
      else await sendMessage(chatId, reply);
      saveChatMsg(userId, "assistant", reply, "need_info");
    } else if (result.type === "workout") {
      if (thinkingId) await editMessage(chatId, thinkingId, "\uD83C\uDFCB Registro allenamento...");
      await saveWorkout(chatId, telegramId, userId, result);
    } else {
      // chat / error — final edit removes cursor, shows complete message
      const reply = result.message;
      const msgType = result.type === "error" ? "error" : "text";
      if (thinkingId) await editMessage(chatId, thinkingId, reply);
      else await sendMessage(chatId, reply);
      saveChatMsg(userId, "assistant", reply, msgType);
    }
  } catch (err) {
    anim?.stop();
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Pending meal — user is providing missing info (quantities, labels, etc.)
// ---------------------------------------------------------------------------
async function handlePendingMealResponse(
  chatId: number,
  telegramId: number,
  text: string,
  uid: string | null
) {
  const pending = pendingMeals.get(telegramId)!;
  const userId = uid ?? await getUserId(telegramId);
  if (!userId) {
    pendingMeals.delete(telegramId);
    await sendMessage(chatId, "Invia prima /start per registrarti.");
    return;
  }

  const firstMsg = pending.history[0]?.content ?? "";

  // Handle barcode follow-up (user sending quantity after barcode scan)
  if (firstMsg.startsWith("[foto barcode:")) {
    const barcodeMatch = firstMsg.match(/\[foto barcode: (\d+)\]/);
    const quantityMatch = text.match(/(\d+)/);
    if (barcodeMatch && quantityMatch) {
      pendingMeals.delete(telegramId);
      const barcode = barcodeMatch[1];
      const grams = parseInt(quantityMatch[1]);

      const [thinkId] = await Promise.all([
        sendMessage(chatId, "\u23F3 Cerco il prodotto..."),
        sendTyping(chatId),
      ]);

      const nutrients = await lookupByBarcode(barcode, grams);
      if (nutrients) {
        await saveMealFromNutrients(chatId, userId, nutrients, grams, "snack", thinkId);
        return;
      }
      if (thinkId) await editMessage(chatId, thinkId, "Prodotto non trovato nel database. Prova a mandarmi una foto dell'etichetta nutrizionale.");
      saveChatMsg(userId, "assistant", "Barcode non trovato.", "error");
      return;
    }
  }

  // Handle label follow-up (user sending quantity after label scan)
  if (firstMsg.startsWith("[foto etichetta:")) {
    const quantityMatch = text.match(/(\d+)/);
    if (quantityMatch) {
      try {
        const labelJson = firstMsg.replace("[foto etichetta: ", "").replace(/\]$/, "");
        const labelData = JSON.parse(labelJson);
        const grams = parseInt(quantityMatch[1]);
        pendingMeals.delete(telegramId);

        const nutrients = labelToNutrients(labelData, grams);

        const thinkId = await sendMessage(chatId, "\u23F3 Calcolo i valori...");
        await saveMealFromNutrients(chatId, userId, nutrients, grams, "snack", thinkId, labelData.product_name);
        return;
      } catch { /* fall through to normal classification */ }
    }
  }

  pending.history.push({ role: "user", content: text });

  const [thinkingId] = await Promise.all([
    sendMessage(chatId, "\u23F3 Sto elaborando..."),
    sendTyping(chatId),
  ]);

  // Progressive editing state for chat streaming
  let lastEditTime = 0;
  let lastEditText = "";
  let isChat = false;
  const anim = thinkingId ? startHourglassAnimation(chatId, thinkingId) : null;

  const result = await classifyStream(pending.history, {
    onTypeDetected: (type) => {
      if (type === "chat") {
        isChat = true;
        anim?.stop();
      }
    },
    onChatDelta: (partial) => {
      if (!thinkingId || !partial) return;
      const now = Date.now();
      if (now - lastEditTime > 400 && partial !== lastEditText) {
        lastEditTime = now;
        lastEditText = partial;
        editMessage(chatId, thinkingId, partial + " \u258D").catch(() => {});
      }
    },
  });

  if (!isChat) anim?.stop();

  try {
    if (result.type === "meal") {
      pendingMeals.delete(telegramId);
      const isParsedMeal = !("calories" in result);
      if (isParsedMeal) {
        const enrichResult = await enrichWithNutrition(result as ParsedMeal);
        if (enrichResult.failedItems.length > 0 && !enrichResult.meal) {
          const itemNames = enrichResult.failedItems.join(", ");
          const reply = `Non ho trovato i valori nutrizionali per ${itemNames}. Puoi mandarmi una foto dell'etichetta nutrizionale o del codice a barre?`;
          if (thinkingId) await editMessage(chatId, thinkingId, reply);
          else await sendMessage(chatId, reply);
          saveChatMsg(userId, "assistant", reply, "need_info");
          awaitingPhotos.set(telegramId, {
            items: (result as ParsedMeal).items,
            failedItemNames: enrichResult.failedItems,
            meal_type: (result as ParsedMeal).meal_type,
            expiresAt: Date.now() + 5 * 60 * 1000,
          });
        } else if (enrichResult.meal) {
          let extraMsg = "";
          if (enrichResult.failedItems.length > 0) {
            const itemNames = enrichResult.failedItems.join(", ");
            extraMsg = `\n\nNon ho trovato i valori per: ${itemNames}\nMandami una foto dell'etichetta per aggiungerli.`;
            awaitingPhotos.set(telegramId, {
              items: (result as ParsedMeal).items,
              failedItemNames: enrichResult.failedItems,
              meal_type: (result as ParsedMeal).meal_type,
              expiresAt: Date.now() + 5 * 60 * 1000,
            });
          }
          await saveMealWithEdit(chatId, userId, enrichResult.meal, thinkingId, extraMsg);
        } else {
          const reply = "Errore nell'elaborazione del pasto.";
          if (thinkingId) await editMessage(chatId, thinkingId, reply);
          else await sendMessage(chatId, reply);
          saveChatMsg(userId, "assistant", reply, "error");
        }
      } else {
        // Legacy MealClassification fallback
        await saveMealWithEdit(chatId, userId, result as MealClassification, thinkingId);
      }
    } else if (result.type === "need_info") {
      pending.history.push({ role: "assistant", content: JSON.stringify(result) });
      const reply = result.message;
      if (thinkingId) await editMessage(chatId, thinkingId, reply);
      else await sendMessage(chatId, reply);
      saveChatMsg(userId, "assistant", reply, "need_info");
    } else if (result.type === "chat") {
      pending.history.push({ role: "assistant", content: JSON.stringify(result) });
      const reply = result.message;
      if (thinkingId) await editMessage(chatId, thinkingId, reply);
      else await sendMessage(chatId, reply);
      saveChatMsg(userId, "assistant", reply, "text");
    } else {
      pendingMeals.delete(telegramId);
      const msg = result.type === "error" ? result.message : "Qualcosa e andato storto. Riprova.";
      if (thinkingId) await editMessage(chatId, thinkingId, msg);
      else await sendMessage(chatId, msg);
      saveChatMsg(userId, "assistant", msg, "error");
    }
  } catch (err) {
    anim?.stop();
    throw err;
  }
}

// ---------------------------------------------------------------------------
// /sessione — Start a live workout session
// ---------------------------------------------------------------------------
async function handleSessionStart(chatId: number, telegramId: number, uid: string | null) {
  const userId = uid ?? await getUserId(telegramId);
  if (!userId) {
    await sendMessage(chatId, "Invia prima /start per registrarti.");
    return;
  }

  if (activeSessions.has(telegramId)) {
    const session = activeSessions.get(telegramId)!;
    const reply = `Hai gi\u00e0 una sessione attiva con ${session.exercises.length} esercizi.\nUsa /fine per salvarla o /annulla per cancellarla.`;
    await sendAndSave(chatId, reply, userId, "command_result");
    return;
  }

  activeSessions.set(telegramId, { exercises: [], startedAt: new Date() });
  await sendAndSave(
    chatId,
    `\uD83C\uDFCB <b>Sessione iniziata!</b>\n\n` +
      `Inviami gli esercizi uno alla volta, ad esempio:\n` +
      `<code>panca piana 4x8 80kg</code>\n` +
      `<code>curl 3x12 25kg</code>\n` +
      `<code>trazioni 3x8</code>\n\n` +
      `Comandi:\n` +
      `/fine - Salva e termina la sessione\n` +
      `/annulla - Annulla senza salvare`,
    userId,
    "command_result"
  );
}

// ---------------------------------------------------------------------------
// /fine — End session and save workout
// ---------------------------------------------------------------------------
async function handleSessionEnd(chatId: number, telegramId: number, uid: string | null) {
  const session = activeSessions.get(telegramId);
  const userId = uid ?? await getUserId(telegramId);
  if (!session) {
    await sendAndSave(chatId, "Nessuna sessione attiva. Usa /sessione per iniziarne una.", userId, "error");
    return;
  }

  if (session.exercises.length === 0) {
    activeSessions.delete(telegramId);
    await sendAndSave(chatId, "Sessione vuota, nessun esercizio aggiunto.", userId, "command_result");
    return;
  }

  if (session.workoutId) {
    const { error } = await supabase
      .from("workouts")
      .update({ exercises: session.exercises })
      .eq("id", session.workoutId);

    activeSessions.delete(telegramId);

    if (error) {
      await sendAndSave(chatId, "Errore nel salvataggio degli esercizi.", userId, "error");
      return;
    }

    const list = session.exercises
      .map((e, i) => {
        const base = `${i + 1}. ${e.name}: ${e.sets}x${e.reps}`;
        return e.weight_kg ? `${base} @ ${e.weight_kg}kg` : base;
      })
      .join("\n");

    await sendAndSave(
      chatId,
      `\u2705 <b>Esercizi aggiunti!</b>\n\n\uD83D\uDCAA <b>Esercizi (${session.exercises.length}):</b>\n${list}`,
      userId,
      "workout_saved"
    );
  } else {
    if (!userId) {
      await sendMessage(chatId, "Errore: utente non trovato.");
      return;
    }

    const durationMin = Math.round(
      (Date.now() - session.startedAt.getTime()) / 60000
    );

    const exerciseNames = session.exercises.map((e) => e.name).join(", ");
    const description = `Sessione: ${exerciseNames}`;

    const { error } = await supabase.from("workouts").insert({
      user_id: userId,
      description,
      workout_type: "Palestra",
      duration_min: durationMin || 1,
      calories_burned: null,
      exercises: session.exercises,
    });

    activeSessions.delete(telegramId);

    if (error) {
      await sendAndSave(chatId, "Errore nel salvataggio dell'allenamento.", userId, "error");
      return;
    }

    const list = session.exercises
      .map((e, i) => {
        const base = `${i + 1}. ${e.name}: ${e.sets}x${e.reps}`;
        return e.weight_kg ? `${base} @ ${e.weight_kg}kg` : base;
      })
      .join("\n");

    await sendAndSave(
      chatId,
      `\u2705 <b>Sessione salvata!</b>\n\n\uD83D\uDCAA <b>Esercizi (${session.exercises.length}):</b>\n${list}\n\n\u23F1 Durata: ${durationMin} min`,
      userId,
      "workout_saved"
    );
  }
}

// ---------------------------------------------------------------------------
// /annulla — Cancel session without saving
// ---------------------------------------------------------------------------
async function handleSessionCancel(chatId: number, telegramId: number, uid: string | null) {
  if (!activeSessions.has(telegramId)) {
    await sendAndSave(chatId, "Nessuna sessione attiva da annullare.", uid, "error");
    return;
  }

  activeSessions.delete(telegramId);
  await sendAndSave(chatId, "\u274C Sessione annullata. Nessun dato salvato.", uid, "command_result");
}

// ---------------------------------------------------------------------------
// Session active — parse single exercise
// ---------------------------------------------------------------------------
async function handleSessionExercise(
  chatId: number,
  telegramId: number,
  text: string,
  uid: string | null
) {
  const session = activeSessions.get(telegramId)!;
  const result = await parseExercise(text);

  if ("error" in result) {
    await sendAndSave(chatId, result.error, uid, "error");
    return;
  }

  session.exercises.push(result);

  const weightStr = result.weight_kg ? ` @ ${result.weight_kg}kg` : "";
  await sendAndSave(
    chatId,
    `\u2705 <b>${result.name}</b>: ${result.sets}x${result.reps}${weightStr}\n` +
      `(${session.exercises.length} ${session.exercises.length === 1 ? "esercizio" : "esercizi"} in sessione)`,
    uid,
    "command_result"
  );
}

// enrichWithNutrition is imported from @/lib/chat-processor

// ---------------------------------------------------------------------------
// Photo handling — nutrition labels and barcodes
// ---------------------------------------------------------------------------
async function handlePhoto(
  chatId: number,
  telegramId: number,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any
) {
  const photos = message.photo;
  const largestPhoto = photos[photos.length - 1];
  const caption: string = message.caption?.trim() ?? "";

  const thinkingId = await sendMessage(chatId, "\uD83D\uDCF7 Analizzo l'immagine...");

  const imageBuffer = await downloadFile(largestPhoto.file_id);
  if (!imageBuffer) {
    if (thinkingId) await editMessage(chatId, thinkingId, "Non sono riuscito a scaricare l'immagine. Riprova.");
    return;
  }

  const visionResult = await analyzePhoto(imageBuffer);

  if (visionResult.type === "unreadable") {
    if (thinkingId) await editMessage(chatId, thinkingId, "Non riesco a leggere l'immagine. Prova con una foto più nitida dell'etichetta nutrizionale.");
    saveChatMsg(userId, "assistant", "Non riesco a leggere l'immagine.", "error");
    return;
  }

  // Extract quantity from caption
  const quantityMatch = caption.match(/(\d+)\s*g/i);
  let grams: number | null = quantityMatch ? parseInt(quantityMatch[1]) : null;

  // Check awaiting-photo state
  const awaiting = awaitingPhotos.get(telegramId);
  if (awaiting && Date.now() < awaiting.expiresAt) {
    awaitingPhotos.delete(telegramId);
    if (!grams && awaiting.items.length > 0) {
      grams = awaiting.items[0].quantity_g;
    }
  }

  if (visionResult.type === "barcode" || visionResult.type === "both") {
    const barcode = visionResult.code;

    if (!grams) {
      pendingMeals.set(telegramId, {
        history: [
          { role: "user", content: `[foto barcode: ${barcode}]` },
          { role: "assistant", content: JSON.stringify({ type: "need_info", message: "Quanti grammi?" }) },
        ],
      });
      if (thinkingId) await editMessage(chatId, thinkingId, "\uD83D\uDCF7 Ho letto il codice a barre. Quanti grammi hai mangiato?");
      saveChatMsg(userId, "assistant", "Ho letto il codice a barre. Quanti grammi?", "need_info");
      return;
    }

    const nutrients = await lookupByBarcode(barcode, grams);
    if (nutrients) {
      await saveMealFromNutrients(chatId, userId, nutrients, grams, "snack", thinkingId);
      return;
    }

    if (visionResult.type === "both") {
      const labelNutrients = labelToNutrients(visionResult, grams);
      await saveMealFromNutrients(chatId, userId, labelNutrients, grams, "snack", thinkingId, visionResult.product_name);
      return;
    }

    if (thinkingId) await editMessage(chatId, thinkingId, "Ho letto il codice a barre ma il prodotto non \u00e8 nel database. Puoi mandarmi una foto dell'etichetta nutrizionale?");
    saveChatMsg(userId, "assistant", "Barcode non trovato, serve foto etichetta.", "need_info");
    return;
  }

  // type === "label"
  if (!grams) {
    pendingMeals.set(telegramId, {
      history: [
        { role: "user", content: `[foto etichetta: ${JSON.stringify({ calories: visionResult.calories, protein_g: visionResult.protein_g, carbs_g: visionResult.carbs_g, fat_g: visionResult.fat_g, fiber_g: visionResult.fiber_g, product_name: visionResult.product_name })}]` },
        { role: "assistant", content: JSON.stringify({ type: "need_info", message: "Quanti grammi?" }) },
      ],
    });
    const nameText = visionResult.product_name ? ` di <b>${visionResult.product_name}</b>` : "";
    if (thinkingId) await editMessage(chatId, thinkingId, `\uD83D\uDCF7 Ho letto l'etichetta${nameText}. Quanti grammi hai mangiato?`);
    saveChatMsg(userId, "assistant", "Ho letto l'etichetta. Quanti grammi?", "need_info");
    return;
  }

  const nutrients = labelToNutrients(visionResult, grams);
  await saveMealFromNutrients(chatId, userId, nutrients, grams, "snack", thinkingId, visionResult.product_name);
}

async function saveMealFromNutrients(
  chatId: number,
  userId: string,
  nutrients: NutrientResult,
  grams: number,
  mealType: string,
  thinkingId: number | null,
  productName?: string | null
) {
  const description = productName ? `${productName} (${grams}g)` : `Prodotto (${grams}g)`;

  const msg =
    `<b>Pasto registrato!</b>\n\n` +
    `${description}\n\n` +
    `Calorie: ${nutrients.calories} kcal\n` +
    `Proteine: ${nutrients.protein_g}g\n` +
    `Carboidrati: ${nutrients.carbs_g}g\n` +
    `Grassi: ${nutrients.fat_g}g\n` +
    `Fibre: ${nutrients.fiber_g}g\n\n` +
    `Tipo: ${mealType}`;

  const [, dbResult] = await Promise.all([
    thinkingId
      ? editMessage(chatId, thinkingId, msg)
      : sendMessage(chatId, msg),
    supabase.from("meals").insert({
      user_id: userId,
      description,
      calories: nutrients.calories,
      protein_g: nutrients.protein_g,
      carbs_g: nutrients.carbs_g,
      fat_g: nutrients.fat_g,
      fiber_g: nutrients.fiber_g,
      meal_type: mealType,
    }),
  ]);

  if (dbResult.error) console.error("Photo meal save error:", dbResult.error);
  saveChatMsg(userId, "assistant", msg, "meal_saved");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function getUserId(telegramId: number): Promise<string | null> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();
  return data?.id ?? null;
}

async function saveMealWithEdit(
  chatId: number,
  userId: string,
  meal: MealClassification,
  thinkingId: number | null,
  extraMsg: string = ""
) {
  const msg =
    `<b>Pasto registrato!</b>\n\n` +
    `${meal.description}\n\n` +
    `Calorie: ${meal.calories} kcal\n` +
    `Proteine: ${meal.protein_g}g\n` +
    `Carboidrati: ${meal.carbs_g}g\n` +
    `Grassi: ${meal.fat_g}g\n` +
    `Fibre: ${meal.fiber_g}g\n\n` +
    `Tipo: ${meal.meal_type}` +
    extraMsg;

  // Show result to user AND save to DB in parallel — user sees response instantly
  const [, dbResult] = await Promise.all([
    thinkingId
      ? editMessage(chatId, thinkingId, msg)
      : sendMessage(chatId, msg),
    supabase.from("meals").insert({
      user_id: userId,
      description: meal.description,
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      fiber_g: meal.fiber_g,
      meal_type: meal.meal_type,
    }),
  ]);

  if (dbResult.error) {
    console.error("Meal save error:", dbResult.error);
  }

  saveChatMsg(userId, "assistant", msg, "meal_saved");
}

async function saveMeal(
  chatId: number,
  userId: string,
  meal: MealClassification
) {
  const { error } = await supabase.from("meals").insert({
    user_id: userId,
    description: meal.description,
    calories: meal.calories,
    protein_g: meal.protein_g,
    carbs_g: meal.carbs_g,
    fat_g: meal.fat_g,
    fiber_g: meal.fiber_g,
    meal_type: meal.meal_type,
  });

  if (error) {
    await sendMessage(chatId, "Errore nel salvataggio del pasto.");
    return;
  }

  await sendMessage(
    chatId,
    `<b>Pasto registrato!</b>\n\n` +
      `${meal.description}\n\n` +
      `Calorie: ${meal.calories} kcal\n` +
      `Proteine: ${meal.protein_g}g\n` +
      `Carboidrati: ${meal.carbs_g}g\n` +
      `Grassi: ${meal.fat_g}g\n` +
      `Fibre: ${meal.fiber_g}g\n\n` +
      `Tipo: ${meal.meal_type}`
  );
}

async function saveWorkout(
  chatId: number,
  telegramId: number,
  userId: string,
  workout: WorkoutClassification
) {
  const hasExercises = workout.exercises && workout.exercises.length > 0;

  // Save workout to DB
  const { data, error } = await supabase.from("workouts").insert({
    user_id: userId,
    description: workout.description,
    workout_type: workout.workout_type,
    duration_min: workout.duration_min,
    calories_burned: workout.calories_burned,
    exercises: hasExercises ? workout.exercises : null,
  }).select("id").single();

  if (error || !data) {
    await sendMessage(chatId, "Errore nel salvataggio dell'allenamento.");
    return;
  }

  if (hasExercises) {
    const list = workout.exercises
      .map((e) => {
        const base = `  - ${e.name}: ${e.sets}x${e.reps}`;
        return e.weight_kg ? `${base} @ ${e.weight_kg}kg` : base;
      })
      .join("\n");

    const reply =
      `\u2705 <b>Allenamento registrato!</b>\n\n` +
      `\uD83C\uDFCB ${workout.description}\n\n` +
      `\uD83D\uDCAA Esercizi:\n${list}`;
    await sendMessage(chatId, reply);
    saveChatMsg(userId, "assistant", reply, "workout_saved");
  } else {
    pendingWorkouts.set(telegramId, {
      workoutId: data.id,
      description: workout.description,
      workout_type: workout.workout_type,
    });

    const reply =
      `\u2705 <b>${workout.description}</b> registrato!\n\n` +
      `Vuoi aggiungere gli esercizi che hai fatto? (si/no)`;
    await sendMessage(chatId, reply);
    saveChatMsg(userId, "assistant", reply, "need_info");
  }
}

// ---------------------------------------------------------------------------
// Pending workout — handle yes/no response
// ---------------------------------------------------------------------------
async function handlePendingResponse(
  chatId: number,
  telegramId: number,
  text: string,
  uid: string | null
) {
  const pending = pendingWorkouts.get(telegramId)!;
  const lower = text.toLowerCase().trim();

  const isYes = /^(s[iì]|yes|y|ok|certo|va bene|dai)$/i.test(lower);
  const isNo = /^(no|nah|nope|non?|skip|salta)$/i.test(lower);

  if (isYes) {
    pendingWorkouts.delete(telegramId);
    activeSessions.set(telegramId, {
      exercises: [],
      startedAt: new Date(),
      workoutId: pending.workoutId,
    });

    await sendAndSave(
      chatId,
      `\uD83D\uDCAA Inviami gli esercizi uno alla volta, ad esempio:\n` +
        `<code>panca piana 4x8 80kg</code>\n` +
        `<code>curl 3x12 25kg</code>\n\n` +
        `/fine - Salva e chiudi\n` +
        `/annulla - Annulla senza aggiungere esercizi`,
      uid,
      "command_result"
    );
  } else if (isNo) {
    pendingWorkouts.delete(telegramId);
    await sendAndSave(
      chatId,
      `\uD83D\uDC4D Sessione <b>${pending.description}</b> registrata senza esercizi.`,
      uid,
      "workout_saved"
    );
  } else {
    await sendAndSave(
      chatId,
      `Rispondi <b>si</b> per aggiungere gli esercizi o <b>no</b> per registrare solo la sessione.`,
      uid,
      "need_info"
    );
  }
}
