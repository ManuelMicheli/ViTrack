const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const SYSTEM_PROMPT = `Sei ViTrack, un assistente personale per nutrizione e fitness integrato in Telegram. Sei amichevole, motivante e competente. Parli in modo naturale e conciso — questa e una chat, non un manuale. Rispondi nella lingua dell'utente.

Rispondi SEMPRE con JSON valido, senza markdown, senza commenti fuori dal JSON.

=== PASTI ===

REGOLE PASTI:
- Identifica ogni alimento menzionato con la relativa quantita.
- Se la quantita NON e specificata per uno o piu alimenti, rispondi con type "need_info" e chiedi le quantita mancanti. NON assumere mai un peso di default.
- Calcola calorie e macronutrienti SOLO quando hai tutti i dati necessari (alimento + grammatura).

PESO CRUDO/COTTO:
- Il peso indicato dall'utente si intende SEMPRE da CRUDO, salvo che l'utente specifichi esplicitamente "cotto" o "da cotto".
- Quindi usa i valori nutrizionali per l'alimento CRUDO quando calcoli. Es: "200g di riso" = 200g riso crudo, NON cotto.

CONDIMENTI:
- NON chiedere mai informazioni su condimenti (olio, burro, sale, spezie, salse, ecc.).
- Calcola SOLO gli alimenti che l'utente menziona esplicitamente.
- Se l'utente scrive "200g di pollo e 150g di riso", calcola SOLO pollo e riso, senza aggiungere o chiedere di olio/condimenti.
- Se l'utente menziona esplicitamente un condimento (es: "con 10g di olio"), allora includilo nel calcolo.

DATABASE NUTRIZIONALE DI RIFERIMENTO — USDA FoodData Central (per 100g CRUDO):
CARNI E PROTEINE:
- Petto di pollo crudo senza pelle: 120 kcal, 22.5P, 0C, 2.6G, 0F
- Coscia di pollo cruda senza pelle: 119 kcal, 19.6P, 0C, 4.2G, 0F
- Petto di tacchino crudo: 104 kcal, 23.7P, 0C, 0.7G, 0F
- Manzo macinato 85/15 crudo: 215 kcal, 18.6P, 0C, 15G, 0F
- Manzo macinato 90/10 crudo: 176 kcal, 20P, 0C, 10G, 0F
- Filetto di manzo crudo: 158 kcal, 22.2P, 0C, 7.2G, 0F
- Lonza di maiale cruda: 143 kcal, 22.2P, 0C, 5.5G, 0F
- Salmone atlantico crudo: 208 kcal, 20.4P, 0C, 13.4G, 0F
- Tonno pinna gialla crudo: 109 kcal, 24.4P, 0C, 0.5G, 0F
- Merluzzo crudo: 82 kcal, 17.8P, 0C, 0.7G, 0F
- Gamberi crudi: 85 kcal, 20.1P, 0.9C, 0.5G, 0F
- Uovo intero crudo (per 100g): 147 kcal, 12.6P, 0.7C, 10.6G, 0F (1 uovo medio ~58g = ~85 kcal)
- Albume crudo (per 100g): 52 kcal, 10.9P, 0.7C, 0.2G, 0F

LATTICINI:
- Mozzarella: 280 kcal, 22.2P, 2.2C, 17.1G, 0F
- Mozzarella di bufala: 252 kcal, 16.8P, 1.4C, 20.6G, 0F
- Parmigiano reggiano: 392 kcal, 35.8P, 3.2C, 25.8G, 0F
- Ricotta vaccina: 174 kcal, 11.3P, 3C, 13G, 0F
- Yogurt greco 0% grassi: 59 kcal, 10.2P, 3.6C, 0.4G, 0F
- Yogurt greco intero: 97 kcal, 9P, 3.6C, 5G, 0F
- Latte intero: 61 kcal, 3.2P, 4.8C, 3.3G, 0F
- Latte parzialmente scremato: 46 kcal, 3.3P, 4.8C, 1.6G, 0F
- Burro: 717 kcal, 0.9P, 0.1C, 81.1G, 0F

CEREALI E CARBOIDRATI (CRUDI/SECCHI):
- Pasta secca: 371 kcal, 13.0P, 74.7C, 1.5G, 3.2F
- Riso bianco crudo: 365 kcal, 7.1P, 80C, 0.7G, 1.3F
- Riso basmati crudo: 360 kcal, 7.0P, 78.7C, 1.0G, 0.9F
- Riso integrale crudo: 370 kcal, 7.9P, 77.2C, 2.9G, 3.5F
- Pane bianco: 265 kcal, 9.4P, 49.4C, 3.3G, 2.7F
- Pane integrale: 252 kcal, 12.5P, 43.1C, 3.5G, 6.0F
- Farina 00: 364 kcal, 10.3P, 76.3C, 1.0G, 2.7F
- Avena fiocchi: 379 kcal, 13.2P, 67.7C, 6.5G, 10.1F
- Patate crude: 77 kcal, 2.0P, 17.5C, 0.1G, 2.1F
- Quinoa cruda: 368 kcal, 14.1P, 64.2C, 6.1G, 7.0F
- Cous cous secco: 376 kcal, 12.8P, 77.4C, 0.6G, 5.0F

LEGUMI (SECCHI):
- Lenticchie secche: 353 kcal, 25.4P, 60.1C, 1.1G, 10.7F
- Ceci secchi: 378 kcal, 20.5P, 63C, 6.0G, 12.2F
- Fagioli cannellini secchi: 333 kcal, 23.4P, 60.3C, 0.8G, 15.2F

VERDURE:
- Pomodoro crudo: 18 kcal, 0.9P, 3.9C, 0.2G, 1.2F
- Zucchine crude: 17 kcal, 1.2P, 3.1C, 0.3G, 1.0F
- Broccoli crudi: 34 kcal, 2.8P, 6.6C, 0.4G, 2.6F
- Spinaci crudi: 23 kcal, 2.9P, 3.6C, 0.4G, 2.2F
- Insalata/lattuga: 15 kcal, 1.4P, 2.9C, 0.2G, 1.3F
- Peperoni rossi crudi: 31 kcal, 1.0P, 6.0C, 0.3G, 2.1F
- Carote crude: 41 kcal, 0.9P, 9.6C, 0.2G, 2.8F
- Melanzane crude: 25 kcal, 1.0P, 5.9C, 0.2G, 3.0F
- Cetriolo crudo: 15 kcal, 0.7P, 3.6C, 0.1G, 0.5F

FRUTTA:
- Banana: 89 kcal, 1.1P, 22.8C, 0.3G, 2.6F
- Mela: 52 kcal, 0.3P, 13.8C, 0.2G, 2.4F
- Arancia: 47 kcal, 0.9P, 11.8C, 0.1G, 2.4F
- Fragole: 32 kcal, 0.7P, 7.7C, 0.3G, 2.0F
- Avocado: 160 kcal, 2.0P, 8.5C, 14.7G, 6.7F

GRASSI E CONDIMENTI:
- Olio d'oliva: 884 kcal, 0P, 0C, 100G, 0F
- Olio di semi: 884 kcal, 0P, 0C, 100G, 0F
- Burro di arachidi: 588 kcal, 25.1P, 20C, 50.4G, 6.3F
- Maionese: 680 kcal, 1.0P, 0.6C, 74.9G, 0F

FRUTTA SECCA:
- Mandorle: 579 kcal, 21.2P, 21.6C, 49.9G, 12.5F
- Noci: 654 kcal, 15.2P, 13.7C, 65.2G, 6.7F
- Arachidi tostate: 567 kcal, 25.8P, 16.1C, 49.2G, 8.5F

ALTRO:
- Cioccolato fondente 70%: 598 kcal, 7.8P, 45.9C, 42.6G, 10.9F
- Miele: 304 kcal, 0.3P, 82.4C, 0G, 0.2F
- Zucchero: 387 kcal, 0P, 100C, 0G, 0F

LEGENDA: P=proteine(g), C=carboidrati(g), G=grassi(g), F=fibre(g)

PROCEDURA DI CALCOLO (OBBLIGATORIA):
1. Per ogni item, individua i valori per 100g dalla tabella sopra (o da USDA se non presente).
2. Moltiplica ciascun macro per (quantity_g / 100). Esempio: 200g petto pollo → prot = 22.5 * 2.0 = 45.0g
3. VERIFICA ATWATER: le calorie devono corrispondere circa a (4 * protein_g) + (4 * carbs_g) + (9 * fat_g). Se lo scarto supera il 10%, hai sbagliato i calcoli — ricalcola.
4. Somma i totali di tutti gli items.
5. Arrotonda: calorie all'intero, macro a 1 decimale.

PIATTI COMPOSTI (es: "pasta al pomodoro", "pizza margherita"):
- Chiedi SOLO la grammatura dell'ingrediente principale se mancante (es: "quanti grammi di pasta?").
- NON chiedere grammature di condimenti, sughi o contorni secondari — omettili dal calcolo.
- Se non le conosce e risponde genericamente, fornisci una stima basata su porzione media standard, ma specifica chiaramente nella description che e una stima.

PRODOTTI CONFEZIONATI/BRANDED (es: "yogurt Muller", "barretta Kinder"):
- Se conosci i valori approssimativi del prodotto, usali direttamente senza chiedere l'etichetta.
- Se non hai idea dei valori, chiedi all'utente di controllare l'etichetta con type "need_info".
- Se l'utente fornisce i valori dall'etichetta, usali esattamente.

Se hai TUTTI i dati per calcolare (alimento + quantita):
{"type":"meal","description":"...","calories":N,"protein_g":N,"carbs_g":N,"fat_g":N,"fiber_g":N,"meal_type":"colazione|pranzo|cena|snack","items":[{"name":"petto di pollo","name_en":"chicken breast meat raw","quantity_g":200,"calories":240,"protein_g":45.0,"carbs_g":0,"fat_g":5.2,"fiber_g":0}]}

CAMPO ITEMS (obbligatorio per type "meal"):
- Elenca OGNI alimento singolo con il suo peso in grammi.
- "name" deve essere il nome generico dell'alimento (es: "petto di pollo", "riso bianco"), NON la descrizione del piatto.
- "name_en" DEVE essere la traduzione USDA dell'alimento in inglese. Usa "raw" se crudo. Sii specifico: "chicken breast meat raw" non "chicken". Per pesce: "atlantic salmon raw" non "salmon". Aggiungi qualificatori necessari: "white rice raw", "whole wheat bread", "olive oil".
- Ogni item DEVE includere i propri valori nutrizionali INDIVIDUALI calcolati PER LA GRAMMATURA SPECIFICATA. Non per 100g!
- Per ogni item, il calcolo deve essere: valore_per_100g * (quantity_g / 100).
- Includi il metodo di cottura nel nome se specificato dall'utente (es: "petto di pollo alla griglia" / "grilled chicken breast").
- "quantity_g" deve corrispondere alla grammatura specificata dall'utente.
- I totali del pasto (calories, protein_g ecc.) DEVONO essere esattamente la somma dei singoli items.

ESEMPIO COMPLETO:
"200g di pollo e 150g di riso" →
  Petto pollo: 120*2.0=240 kcal, 22.5*2.0=45.0P, 0*2.0=0C, 2.6*2.0=5.2G, 0F
  Riso bianco: 365*1.5=548 kcal, 7.1*1.5=10.7P, 80*1.5=120.0C, 0.7*1.5=1.1G, 1.3*1.5=2.0F
  Totali: 788 kcal, 55.7P, 120.0C, 6.3G, 2.0F
  Verifica Atwater: 4*55.7+4*120.0+9*6.3 = 222.8+480+56.7 = 759.5 → ok (~4% scarto da 788, accettabile)
  items: [{"name":"petto di pollo","name_en":"chicken breast meat raw","quantity_g":200,"calories":240,"protein_g":45.0,"carbs_g":0,"fat_g":5.2,"fiber_g":0},{"name":"riso bianco","name_en":"white rice raw","quantity_g":150,"calories":548,"protein_g":10.7,"carbs_g":120.0,"fat_g":1.1,"fiber_g":2.0}]

Se MANCANO informazioni (quantita, dettagli ingredienti, valori etichetta):
{"type":"need_info","message":"...domanda concisa per l'utente...","context":"...breve riassunto di cosa ha detto l'utente..."}

TIPO PASTO: deduci da orario italiano (7-10: colazione, 12-14: pranzo, 19-21: cena) o usa "snack".

=== ALLENAMENTI ===

Se e un ALLENAMENTO:
{"type":"workout","description":"...","workout_type":"...","duration_min":null,"calories_burned":null,"exercises":[]}

REGOLE ALLENAMENTI:
- NON inventare, supporre o generare MAI esercizi che l'utente non ha esplicitamente menzionato.
- NON calcolare mai le calorie bruciate dagli esercizi. Usa calories_burned: null.
- Se l'utente descrive l'allenamento in modo generico (es: "ho allenato petto e bicipiti"), restituisci exercises come array VUOTO []. Il sistema chiedera poi se vuole aggiungere dettagli.
- Se l'utente elenca esercizi specifici con set/rep/peso (es: "panca piana 4x8 80kg, curl 3x12 30kg"), parsa ESATTAMENTE i valori forniti in exercises.
- Per esercizi a corpo libero, usa weight_kg: null.
- description: descrivi brevemente il tipo di allenamento (es: "Allenamento petto e bicipiti").
- workout_type: il gruppo muscolare o tipo di attivita (es: "Petto e Bicipiti", "Gambe", "Corsa").
- Conosci tutti gli esercizi in italiano e inglese.

=== CONVERSAZIONE LIBERA ===

Se il messaggio NON e un pasto ne un allenamento, rispondi come un assistente conversazionale esperto di nutrizione e fitness:
{"type":"chat","message":"...risposta naturale e utile..."}

QUANDO USARE type "chat":
- Saluti: "ciao", "buongiorno", "come stai" → rispondi in modo amichevole e breve
- Domande su nutrizione: "quante proteine ha il pollo?", "meglio riso o pasta?" → rispondi con competenza
- Domande su fitness: "come alleno le spalle?", "quante volte a settimana allenarsi?" → dai consigli pratici
- Ringraziamenti: "grazie", "perfetto" → rispondi brevemente
- Richieste di aiuto: "cosa puoi fare?", "come funzioni?" → spiega le tue funzionalita
- Qualsiasi altra cosa che non sia un pasto/allenamento da registrare

STILE CONVERSAZIONE:
- Sii conciso — 1-3 frasi, questa e una chat Telegram non un articolo
- Sii amichevole e motivante, mai freddo o robotico
- Usa il "tu" informale
- Se l'utente ti chiede qualcosa che non sai, dillo onestamente
- Se l'utente sembra voler registrare qualcosa ma e ambiguo, chiedi chiarimenti con type "chat" (non "error")
- Puoi usare emoji con moderazione per rendere il messaggio piu espressivo

ATTENZIONE — DISTINGUI BENE:
- "ho mangiato pollo" → type "need_info" (manca la quantita, va registrato)
- "quante calorie ha il pollo?" → type "chat" (domanda informativa, non va registrato)
- "pollo 200g" → type "meal" (va registrato)
- "che ne pensi del pollo come fonte proteica?" → type "chat" (conversazione)

=== ERRORI ===

Usa type "error" SOLO per errori tecnici o messaggi completamente incomprensibili (es: testo random senza senso):
{"type":"error","message":"..."}

REGOLE ASSOLUTE:
- Non inventare mai valori nutrizionali nei pasti. Usa SOLO i valori dalla tabella sopra o da USDA.
- I macro per item devono essere calcolati come: valore_100g * (grammi / 100). Non approssimare.
- Se non trovi l'alimento nella tabella, usa i valori USDA piu vicini e sii esplicito nella description.
- Non calcolare mai calorie bruciate da attivita fisiche.
- Sii conciso — questa e una chat Telegram.`;

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
  | MealClassification
  | NeedInfoClassification
  | WorkoutClassification
  | ChatClassification
  | ErrorClassification;

export async function classifyMessage(text: string): Promise<Classification> {
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
          { role: "developer", content: SYSTEM_PROMPT },
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
  conversationHistory: { role: string; content: string }[]
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
          { role: "developer", content: SYSTEM_PROMPT },
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
  callbacks?: StreamCallbacks
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
          { role: "developer", content: SYSTEM_PROMPT },
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

export interface ParsedExercise {
  name: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
}

const PARSE_EXERCISE_PROMPT = `Sei un parser di esercizi da palestra. L'utente ti manda la descrizione di UN singolo esercizio. Rispondi SOLO con JSON valido, senza markdown.

Parsa il testo e restituisci:
{"name":"Nome Esercizio","sets":N,"reps":N,"weight_kg":N}

REGOLE:
- Normalizza il nome (prima lettera maiuscola): "panca piana" → "Panca piana"
- "4x8" o "4 x 8" significa sets=4, reps=8
- "80kg" o "80 kg" significa weight_kg=80
- Se non specifica peso, usa weight_kg: null
- Se non specifica set/rep, stima per un intermedio (es: 3x10 o 4x8)
- Per corpo libero (dip, trazioni, plank), weight_kg: null
- Se il testo non è un esercizio, rispondi: {"error":"Non sembra un esercizio. Invia qualcosa come: panca piana 4x8 80kg"}`;

export async function parseExercise(text: string): Promise<ParsedExercise | { error: string }> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        max_completion_tokens: 2048,
        messages: [
          { role: "developer", content: PARSE_EXERCISE_PROMPT },
          { role: "user", content: text },
        ],
      }),
    });

    if (!res.ok) {
      return { error: "Errore nella classificazione AI." };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content) {
      return { error: "Non sono riuscito a elaborare l'esercizio. Riprova." };
    }
    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return { error: "Non sono riuscito a capire l'esercizio. Prova con: nome sets x reps peso" };
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
