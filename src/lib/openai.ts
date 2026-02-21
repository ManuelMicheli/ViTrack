import type { UserContext } from "./user-context";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const BASE_SYSTEM_PROMPT = `Sei ViTrack, un assistente personale per nutrizione e fitness integrato in Telegram. Sei amichevole, motivante e competente. Parli in modo naturale e conciso — questa è una chat, non un manuale. Rispondi nella lingua dell'utente.

Rispondi SEMPRE con JSON valido, senza markdown, senza commenti fuori dal JSON.

=== IL TUO RUOLO ===

Tu sei un PARSER INTELLIGENTE. Il tuo compito è:
1. Capire COSA l'utente ha mangiato/fatto
2. Estrarre nome dell'alimento, quantità, e marca (se presente)
3. NON calcolare MAI calorie o macronutrienti — lo fanno le API collegate

=== PASTI ===

REGOLE PASTI:
- Identifica ogni alimento menzionato con la relativa quantità.
- Se la quantità NON è specificata per uno o più alimenti, rispondi con type "need_info" e chiedi le quantità mancanti. NON assumere mai un peso di default.
- NON calcolare calorie o macronutrienti. Restituisci SOLO nome, quantità, e marca.

PESO CRUDO/COTTO:
- Il peso indicato dall'utente si intende SEMPRE da CRUDO, salvo che l'utente specifichi esplicitamente "cotto" o "da cotto".
- Se l'utente specifica "cotto", "da cotto", "cotta", "da cotta", imposta "is_cooked": true nell'item. Default: false (ometti il campo se crudo).

CONDIMENTI:
- NON chiedere mai informazioni su condimenti (olio, burro, sale, spezie, salse, ecc.).
- Parsa SOLO gli alimenti che l'utente menziona esplicitamente.
- Se l'utente menziona esplicitamente un condimento con grammatura (es: "con 10g di olio"), includilo negli items.

PRODOTTI CONFEZIONATI/BRANDED:
- Se l'utente menziona un prodotto di marca (es: "Yogurt Müller", "Kinder Bueno", "Barilla"), imposta is_branded: true e brand: "NomeMarca".
- Separa il brand dal nome prodotto: "Yogurt Müller alla fragola" → brand: "Müller", name: "yogurt alla fragola".
- Per prodotti non di marca (es: "petto di pollo", "riso"), imposta is_branded: false e brand: null.

PIATTI COMPOSTI:
- Scomponi in ingredienti singoli con grammature realistiche.
- Chiedi SOLO la grammatura dell'ingrediente principale se mancante.
- Esempi di decomposizione:
  - "carbonara 200g" → pasta 200g + guanciale 40g + uovo 50g + pecorino 20g
  - "pasta al pomodoro 200g" → pasta 200g + sugo 80g
  - "risotto funghi 300g" → riso 100g + funghi 100g + parmigiano 15g + olio 5g
  - "insalata di pollo" → petto di pollo 150g + insalata 100g + pomodori 50g

Se hai TUTTI i dati (alimento + quantità):
{"type":"meal","items":[{"name":"petto di pollo","name_en":"chicken breast meat raw","brand":null,"quantity_g":200,"is_branded":false}],"meal_type":"colazione|pranzo|cena|snack"}

CAMPO ITEMS (obbligatorio per type "meal"):
- "name": nome dell'alimento in italiano (es: "petto di pollo", "yogurt alla fragola")
- "name_en": traduzione USDA in inglese. Sii specifico: "chicken breast meat raw" non "chicken". Per pesce: "atlantic salmon raw". Aggiungi "raw" se crudo.
- "brand": nome della marca se menzionata (es: "Müller", "Kinder", "Barilla"), null se generico
- "quantity_g": grammatura specificata dall'utente
- "is_branded": true se è un prodotto di marca, false se è un alimento generico
- "is_cooked": true SOLO se l'utente specifica esplicitamente "cotto"/"da cotto"/"cotta"/"da cotta". Ometti o false se crudo.

Se MANCANO informazioni (quantità, dettagli):
{"type":"need_info","message":"...domanda concisa...","context":"...breve riassunto..."}

TIPO PASTO: deduci da orario italiano (7-10: colazione, 12-14: pranzo, 19-21: cena) o usa "snack".

=== ALLENAMENTI ===

Se è un ALLENAMENTO:
{"type":"workout","description":"...","workout_type":"...","duration_min":null,"calories_burned":null,"exercises":[]}

REGOLE ALLENAMENTI:
- NON inventare, supporre o generare MAI esercizi che l'utente non ha esplicitamente menzionato.
- NON calcolare mai le calorie bruciate. Usa calories_burned: null.
- Se l'utente descrive l'allenamento in modo generico (es: "ho allenato petto e bicipiti"), exercises: [].
- Se l'utente elenca esercizi specifici con set/rep/peso (es: "panca piana 4x8 80kg"), parsali ESATTAMENTE.
- Per esercizi a corpo libero, usa weight_kg: null.

=== CONVERSAZIONE LIBERA ===

Se il messaggio NON è un pasto né un allenamento, rispondi come assistente esperto:
{"type":"chat","message":"...risposta naturale e utile..."}

QUANDO USARE type "chat":
- Saluti, domande su nutrizione/fitness, ringraziamenti, richieste di aiuto
- Qualsiasi cosa che non sia un pasto/allenamento da registrare
- "come sto andando?", "come va la mia giornata?" → usa il contesto utente per dare dati reali
- "cosa dovrei mangiare?" → suggerisci in base ai macro mancanti

STILE CONVERSAZIONE:
- Sii conciso — 2-5 frasi, questa è una chat Telegram
- Sii amichevole, motivante e proattivo — dai consigli concreti
- Usa il "tu" informale
- Puoi usare emoji con moderazione
- Se hai il contesto utente, usa i dati reali nelle risposte (calorie consumate, macro, obiettivi)
- Se l'utente chiede come sta andando, rispondi con numeri reali dal contesto
- Se mancano macro specifici, suggerisci cosa mangiare
- Ricorda la conversazione precedente e fai riferimento a cose dette prima

ATTENZIONE — DISTINGUI BENE:
- "ho mangiato pollo" → type "need_info" (manca la quantità)
- "quante calorie ha il pollo?" → type "chat" (domanda informativa)
- "pollo 200g" → type "meal" (va registrato)
- "che ne pensi del pollo?" → type "chat" (conversazione)

=== ERRORI ===

Usa type "error" SOLO per messaggi completamente incomprensibili:
{"type":"error","message":"..."}

REGOLE ASSOLUTE:
- NON calcolare MAI calorie o macronutrienti. Le API lo fanno.
- Restituisci SOLO nome, quantità, marca, e traduzione inglese per ogni item.
- Sii conciso — questa è una chat Telegram.`;

export interface ParsedMealItem {
  name: string;
  name_en: string;
  brand: string | null;
  quantity_g: number;
  is_branded: boolean;
  is_cooked?: boolean;
}

export interface ParsedMeal {
  type: "meal";
  items: ParsedMealItem[];
  meal_type: "colazione" | "pranzo" | "cena" | "snack";
}

export interface MealClassification {
  type: "meal";
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  meal_type: "colazione" | "pranzo" | "cena" | "snack";
  items: {
    name: string;
    name_en: string;
    quantity_g: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  }[];
}

export interface NeedInfoClassification {
  type: "need_info";
  message: string;
  context: string;
}

export interface WorkoutClassification {
  type: "workout";
  description: string;
  workout_type: string;
  duration_min: number | null;
  calories_burned: number | null;
  exercises: { name: string; sets: number; reps: number; weight_kg: number | null }[];
}

export interface ChatClassification {
  type: "chat";
  message: string;
}

export interface ErrorClassification {
  type: "error";
  message: string;
}

export type Classification =
  | ParsedMeal
  | MealClassification
  | NeedInfoClassification
  | WorkoutClassification
  | ChatClassification
  | ErrorClassification;

// ---------------------------------------------------------------------------
// Dynamic system prompt — enriches base prompt with user context
// ---------------------------------------------------------------------------
export function buildSystemPrompt(ctx?: UserContext | null): string {
  if (!ctx) return BASE_SYSTEM_PROMPT;

  const remaining = ctx.dailyCalorieGoal - ctx.todayIntake.calories;
  const macroGoals = [
    ctx.proteinGoal ? `${ctx.proteinGoal}g P` : null,
    ctx.carbsGoal ? `${ctx.carbsGoal}g C` : null,
    ctx.fatGoal ? `${ctx.fatGoal}g G` : null,
  ].filter(Boolean).join(" | ");

  const goalLine = macroGoals
    ? `Obiettivo: ${ctx.dailyCalorieGoal} kcal | ${macroGoals}`
    : `Obiettivo: ${ctx.dailyCalorieGoal} kcal`;

  const workoutLine = ctx.todayWorkouts.count > 0
    ? `Allenamenti: ${ctx.todayWorkouts.descriptions.join(", ")} (${ctx.todayWorkouts.totalBurned} kcal bruciate)`
    : "Allenamenti: nessuno oggi";

  const contextBlock = `

=== CONTESTO UTENTE ===
Nome: ${ctx.firstName || "utente"}
${goalLine}
Oggi: ${ctx.todayIntake.calories} kcal (${Math.round(ctx.todayIntake.protein_g)}g P, ${Math.round(ctx.todayIntake.carbs_g)}g C, ${Math.round(ctx.todayIntake.fat_g)}g G) — ${remaining > 0 ? `Restano ${remaining} kcal` : `Superato di ${Math.abs(remaining)} kcal`}
Pasti: ${ctx.todayIntake.mealCount} | ${workoutLine}`;

  return BASE_SYSTEM_PROMPT + contextBlock;
}

export async function classifyMessage(text: string, systemPrompt?: string): Promise<Classification> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        max_completion_tokens: 4096,
        messages: [
          { role: "developer", content: systemPrompt ?? BASE_SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("OpenAI API error:", res.status, errBody);
      return { type: "error", message: "Errore nella classificazione AI." };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content) {
      console.error("OpenAI empty content. finish_reason:", data.choices?.[0]?.finish_reason, "full response:", JSON.stringify(data).slice(0, 500));
      return { type: "error", message: "Non sono riuscito a elaborare. Puoi riformulare?" };
    }
    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("classifyMessage error:", err);
    return {
      type: "error",
      message: "Non sono riuscito a capire. Puoi riformulare?",
    };
  }
}

export async function classifyWithContext(
  conversationHistory: { role: string; content: string }[],
  systemPrompt?: string
): Promise<Classification> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        max_completion_tokens: 4096,
        messages: [
          { role: "developer", content: systemPrompt ?? BASE_SYSTEM_PROMPT },
          ...conversationHistory,
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("OpenAI API error (context):", res.status, errBody);
      return { type: "error", message: "Errore nella classificazione AI." };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content) {
      console.error("OpenAI empty content (context). finish_reason:", data.choices?.[0]?.finish_reason, "full response:", JSON.stringify(data).slice(0, 500));
      return { type: "error", message: "Non sono riuscito a elaborare. Puoi riformulare?" };
    }
    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("classifyWithContext error:", err);
    return {
      type: "error",
      message: "Non sono riuscito a capire. Puoi riformulare?",
    };
  }
}

// ---------------------------------------------------------------------------
// Streaming classification — progressive Telegram responses
// ---------------------------------------------------------------------------
export interface StreamCallbacks {
  /** Called when the response type is detected from early JSON tokens */
  onTypeDetected?: (type: string) => void;
  /** Called with accumulated message content for "chat" type responses */
  onChatDelta?: (partialMessage: string) => void;
}

export async function classifyStream(
  input: string | Array<{ role: string; content: string }>,
  callbacks?: StreamCallbacks,
  systemPrompt?: string
): Promise<Classification> {
  const userMessages =
    typeof input === "string"
      ? [{ role: "user", content: input }]
      : input;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        max_completion_tokens: 4096,
        stream: true,
        messages: [
          { role: "developer", content: systemPrompt ?? BASE_SYSTEM_PROMPT },
          ...userMessages,
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("OpenAI streaming error:", res.status, errBody);
      return { type: "error", message: "Errore nella classificazione AI." };
    }

    // Fallback if streaming body not available
    if (!res.body) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      if (!content) return { type: "error", message: "Non sono riuscito a elaborare. Puoi riformulare?" };
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(cleaned);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";
    let typeDetected = false;
    let detectedType = "";
    let sseBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split("\n");
      sseBuffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (!delta) continue;

          accumulated += delta;

          // Detect type from early JSON tokens
          if (!typeDetected) {
            const typeMatch = accumulated.match(/"type"\s*:\s*"(\w+)"/);
            if (typeMatch) {
              typeDetected = true;
              detectedType = typeMatch[1];
              callbacks?.onTypeDetected?.(detectedType);
            }
          }

          // Extract partial message for progressive chat display
          if (detectedType === "chat" && callbacks?.onChatDelta) {
            const msgMatch = accumulated.match(
              /"message"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/
            );
            if (msgMatch) {
              let raw = msgMatch[1];
              raw = raw
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\");
              callbacks.onChatDelta(raw);
            }
          }
        } catch {
          // Skip malformed SSE data
        }
      }
    }

    const cleaned = accumulated
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    if (!cleaned) {
      console.error("OpenAI streaming: empty content");
      return { type: "error", message: "Non sono riuscito a elaborare. Puoi riformulare?" };
    }

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("classifyStream error:", err);
    return {
      type: "error",
      message: "Non sono riuscito a capire. Puoi riformulare?",
    };
  }
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string = "voice.ogg"
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([new Uint8Array(audioBuffer)], { type: "audio/ogg" }),
      filename
    );
    formData.append("model", "whisper-1");
    formData.append("language", "it");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    if (!res.ok) {
      console.error("Whisper API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.text?.trim() || null;
  } catch (err) {
    console.error("transcribeAudio error:", err);
    return null;
  }
}
