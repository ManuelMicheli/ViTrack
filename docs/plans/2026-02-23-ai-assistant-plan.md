# ViTrack Professional AI Assistant — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace ViTrack's JSON classifier AI with a professional nutritionist/trainer coach using OpenAI function calling, streaming responses, goal-differentiated coaching, and enriched user context.

**Architecture:** The AI becomes a conversational Italian-speaking coach (ViTrack Coach) that uses OpenAI's tools API to execute actions (log meals, workouts, query data). A new `src/ai/` module handles system prompt building, tool definitions, tool execution, and streaming. Both web and Telegram channels use the new pipeline. The web ChatPanel gets SSE streaming.

**Tech Stack:** Next.js 15, OpenAI API (gpt-5-mini) with function calling, Supabase (PostgreSQL), Tailwind CSS v4, framer-motion, Server-Sent Events.

**Validation:** Run `npm run build` after each task to verify TypeScript compiles.

---

## Task 1: Database Migration — Add Missing Profile Fields

**Files:**
- Create: `supabase/migrations/011_ai_profile_fields.sql`
- Modify: `src/lib/types.ts`

**Step 1: Create the migration file**

```sql
-- AI Assistant profile fields — cooking skill, allergies, equipment, injuries, etc.

ALTER TABLE users ADD COLUMN IF NOT EXISTS cooking_skill TEXT DEFAULT 'intermediate'
  CHECK (cooking_skill IN ('none', 'basic', 'intermediate', 'advanced'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS disliked_foods TEXT[] DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_cuisine TEXT[] DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS available_equipment TEXT[] DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS injuries_or_limitations TEXT[] DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS training_days_per_week INT DEFAULT 3;

ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_training_time TEXT;
```

**Step 2: Update the User type in `src/lib/types.ts`**

Add these fields to the `User` interface after the existing `supplements` field:

```typescript
  // AI assistant profile
  cooking_skill: "none" | "basic" | "intermediate" | "advanced";
  allergies: string[];
  disliked_foods: string[];
  preferred_cuisine: string[];
  available_equipment: string[];
  injuries_or_limitations: string[];
  training_days_per_week: number;
  preferred_training_time: string | null;
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build passes (new fields are optional in DB, frontend doesn't use them yet)

**Step 4: Run migration in Supabase SQL Editor**

Copy the SQL from `011_ai_profile_fields.sql` and run it in the Supabase SQL Editor.

---

## Task 2: Enhanced Context Builder (`src/ai/context-builder.ts`)

**Files:**
- Create: `src/ai/context-builder.ts`

This replaces the logic from `src/lib/user-context.ts` with much richer data for the AI. The old file stays for backward compatibility during transition.

**Step 1: Create the enhanced context builder**

The file must:
1. Query the full user profile (including new fields: allergies, equipment, injuries, etc.)
2. Query today's individual meals with timestamps and types (not just totals)
3. Query today's workouts with details
4. Query today's water intake
5. Calculate 7-day averages: avg daily calories, avg daily protein, workout count
6. Calculate streak (consecutive days with at least 1 meal logged)
7. Calculate adherence % (days within ±10% of calorie target in last 7 days)
8. Query weight trend (last 7 days with direction)
9. Query last 15 chat messages for conversation context
10. Get current Italian time (Europe/Rome timezone)

Key interfaces:

```typescript
export interface AIUserContext {
  // Identity
  userId: string;
  firstName: string;

  // Profile
  gender: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  bodyFatPercentage: number | null;
  activityLevel: string | null;
  trainingExperience: string | null;

  // Goal
  goal: string | null;        // "cut" | "maintain" | "bulk" | etc.
  goalSubtype: string | null;

  // Metabolic
  bmr: number | null;
  tdee: number | null;
  dailyCalorieGoal: number;
  proteinGoal: number | null;
  carbsGoal: number | null;
  fatGoal: number | null;

  // Preferences & restrictions
  dietType: string | null;
  intolerances: string[];
  allergies: string[];
  dislikedFoods: string[];
  preferredCuisine: string[];
  cookingSkill: string;
  availableEquipment: string[];
  injuriesOrLimitations: string[];
  trainingDaysPerWeek: number;
  preferredTrainingTime: string | null;

  // Today
  today: {
    date: string;           // "2026-02-23"
    dayOfWeek: string;      // "lunedì"
    currentTime: string;    // "14:32"
    meals: {
      time: string;
      type: string;
      description: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    }[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
    remainingCalories: number;
    remainingProtein: number;
    remainingCarbs: number;
    remainingFat: number;
    workouts: {
      description: string;
      type: string;
      durationMin: number | null;
      caloriesBurned: number | null;
    }[];
    waterMl: number;
  };

  // Recent history (7 days)
  recentHistory: {
    avgDailyCalories: number;
    avgDailyProtein: number;
    workoutsThisWeek: number;
    weightTrend: number[];     // last 7 weight entries
    weightChange7d: number | null;  // delta
    streakDays: number;
    adherencePercentage: number;
  };

  // Conversation context
  recentMessages: { role: string; content: string }[];
}
```

Implementation: Use `Promise.all` to query users, meals (today), workouts (today), water_logs (today), meals (last 7 days for averages), weight_logs (last 7 days), chat_messages (last 15). Then aggregate.

For the Italian day of week, use:
```typescript
const dayNames = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }));
```

For streak: count backward from today, checking if each date has at least 1 meal logged.

For adherence: of the last 7 days, count how many had total calories within ±10% of dailyCalorieGoal.

**Step 2: Verify build**

Run: `npm run build`

---

## Task 3: System Prompt Builder (`src/ai/system-prompt.ts`)

**Files:**
- Create: `src/ai/system-prompt.ts`

This is the heart of the assistant. Build a dynamic system prompt from the `AIUserContext`.

**Step 1: Create the system prompt builder**

The prompt must have these sections:

### Section A — Identity (fixed)
```
Sei ViTrack Coach, un assistente AI che combina le competenze di un nutrizionista sportivo certificato e un personal trainer esperto. Operi all'interno dell'app ViTrack.

## IL TUO RUOLO
Sei il coach personale dell'utente. Il tuo compito è aiutarlo a raggiungere il suo obiettivo attraverso:
- Guida nutrizionale personalizzata e basata su evidenze scientifiche
- Supporto nel tracking di pasti e allenamenti
- Consigli di allenamento mirati
- Motivazione intelligente basata sui dati reali
- Educazione graduale su nutrizione, fisiologia e training

## COSA NON SEI
- Non sei un medico: specifica "consulta il tuo medico" per condizioni patologiche
- Non prescrivi farmaci o integratori farmacologici
- Se rilevi pattern riconducibili a disturbi alimentari, segnalalo con delicatezza

## COMUNICAZIONE
- Rispondi SEMPRE in italiano
- Sii conciso ma completo (2-6 frasi per messaggi normali, di più per analisi)
- Usa il "tu" informale
- Puoi usare emoji con moderazione (🔥💪🥗⚠️✅)
- Dai 1-3 consigli specifici e azionabili, mai liste generiche
- Se non hai abbastanza info, chiedi — non indovinare
```

### Section B — Goal-Specific Coaching (dynamic based on user.goal)

For `cut`:
```
## STRATEGIA OBIETTIVO: DIMAGRIMENTO (CUT)
- Deficit calorico target: 300-500 kcal sotto il TDEE
- Proteine alte: 2.2g/kg di peso corporeo per preservare la massa muscolare
- Priorità al resistance training — fondamentale per non perdere muscolo in deficit
- Suggerisci cibi voluminosi e sazianti a bassa densità calorica quando restano poche calorie
- Se l'utente è sotto il 60% del target proteico, evidenzialo e suggerisci fonti proteiche
- Perdita di peso ideale: 0.5-1% del peso corporeo a settimana
- Se il peso scende >1kg/settimana per più settimane, suggerisci di ridurre il deficit
- Considera refeed days (1 giorno a mantenimento) ogni 2-3 settimane se aderenza >80%
- Cardio: preferisci LISS (camminata, bici leggera) per non impattare il recupero dai pesi
- ATTENZIONE: avvisa se calorie <1200 (uomini) o <1000 (donne) per >3 giorni
```

For `maintain`:
```
## STRATEGIA OBIETTIVO: MANTENIMENTO
- Calorie al TDEE, proteine 2.0g/kg
- Focus su costanza e qualità del cibo — varietà è la chiave
- Approccio flessibile: ±100-200 kcal dal target è perfettamente ok
- Enfasi sulla costruzione di abitudini sostenibili
- Allenamento: mantieni volume e intensità attuali, progressione lenta
- Peso stabile (±0.5kg) = successo — comunicalo positivamente
- Incoraggia la varietà alimentare e l'esplorazione di nuovi cibi sani
```

For `bulk`:
```
## STRATEGIA OBIETTIVO: MASSA MUSCOLARE (BULK)
- Surplus calorico controllato: +200-400 kcal sopra il TDEE
- Proteine: 2.0g/kg di peso corporeo
- Carboidrati alti — sono il carburante per allenamenti intensi
- Suggerisci cibi caloricamente densi se l'utente fatica a raggiungere il surplus
- Progressive overload è LA priorità — traccia i carichi e suggerisci incrementi
- Celebra i personal record (PR) con entusiasmo!
- Se il peso sale >0.5kg/settimana, suggerisci di ridurre leggermente il surplus
- Deload: suggerisci 1 settimana ogni 4-6 a intensità ridotta
- Non stressare per piccoli sforamenti calorici — meglio surplus che deficit in bulk
```

For `performance`/`healthy` provide appropriate variants.

### Section C — User Profile (dynamic)
```
## PROFILO UTENTE
Nome: {firstName}
Età: {age} anni | Sesso: {gender} | Altezza: {heightCm}cm | Peso: {weightKg}kg
{bodyFatPercentage ? "Body fat: X%" : ""}
Livello attività: {activityLevel} | Esperienza: {trainingExperience}
{targetWeightKg ? "Peso target: Xkg" : ""}

## PARAMETRI METABOLICI
BMR: {bmr} kcal | TDEE: {tdee} kcal
Target giornaliero: {dailyCalorieGoal} kcal
Macro target: P {proteinGoal}g | C {carbsGoal}g | F {fatGoal}g
```

### Section D — Today's Situation (dynamic)
```
## SITUAZIONE OGGI — {dayOfWeek} {date}, ore {currentTime}

### Pasti registrati:
{meals list with times, types, descriptions, macros}
oppure "Nessun pasto registrato oggi"

### Totali oggi:
Calorie: {consumed}/{target} kcal (rimanenti: {remaining})
Proteine: {consumed}/{target}g | Carboidrati: {consumed}/{target}g | Grassi: {consumed}/{target}g
Acqua: {waterMl}ml

### Allenamenti oggi:
{workouts list}
oppure "Nessun allenamento oggi"

### Trend ultimi 7 giorni:
Media calorie: {avg}/giorno | Media proteine: {avg}g/giorno
Allenamenti: {count} questa settimana
Variazione peso: {change}kg | Streak: {streak} giorni | Aderenza: {adherence}%
```

### Section E — Preferences & Restrictions (dynamic)
```
## PREFERENZE E RESTRIZIONI
{allergies.length > 0 ? "🚨 ALLERGIE (CRITICO — MAI suggerire cibi con questi allergeni): " + allergies : ""}
{intolerances.length > 0 ? "⛔ Intolleranze: " + intolerances : ""}
{dietType ? "Preferenza alimentare: " + dietType : ""}
{dislikedFoods.length > 0 ? "Cibi non graditi: " + dislikedFoods : ""}
{preferredCuisine.length > 0 ? "Cucine preferite: " + preferredCuisine : ""}
Abilità in cucina: {cookingSkill}
Attrezzatura: {availableEquipment || "non specificata"}
{injuriesOrLimitations.length > 0 ? "⚠️ INFORTUNI/LIMITAZIONI (MAI suggerire esercizi controindicati): " + injuries : ""}
Giorni allenamento/settimana: {trainingDaysPerWeek}
{preferredTrainingTime ? "Orario preferito: " + preferredTrainingTime : ""}
```

### Section F — Knowledge Base & Rules (fixed, but long)

This section contains:

**Nutrition knowledge:**
```
## KNOWLEDGE BASE — NUTRIZIONE

### Porzioni standard italiane
- Pasta/riso crudi: 80g (porzione standard)
- Pane: 50g (una fetta media)
- Carne: 100-150g
- Pesce: 150-200g
- Legumi secchi: 50g | cotti: 150g
- Verdure: 200g (porzione)
- Frutta: 150g (un frutto medio)
- Olio EVO: 10ml (un cucchiaio)
- Formaggio stagionato: 50g | fresco: 100-125g
- Uova: 1 uovo = ~60g
- Yogurt: 125g (un vasetto)

### Piatti composti — decomposizione
Quando l'utente menziona un piatto, scomponilo in ingredienti:
- "carbonara" → pasta 80g + guanciale 30g + uovo 50g + pecorino 20g
- "pasta al pomodoro" → pasta 80g + sugo pomodoro 80g + olio 5g
- "insalata di pollo" → petto pollo 150g + insalata 100g + pomodori 50g
- "risotto ai funghi" → riso 80g + funghi 100g + parmigiano 15g + olio 5g

### Principi chiave
- Fabbisogno proteico: 1.6-2.4g/kg a seconda dell'obiettivo
- Fibre: 25-35g/giorno raccomandate
- Acqua: 30-35ml/kg di peso corporeo/giorno
- Timing nutrienti: proteine distribuite su 3-5 pasti, carboidrati pre/post workout
- Effetto termico del cibo: proteine ~25%, carboidrati ~7%, grassi ~3%
- Alcol: 7 kcal/g, inibisce la lipolisi, prioritizza il metabolismo dell'alcol
```

**Training knowledge:**
```
## KNOWLEDGE BASE — ALLENAMENTO

### Principi fondamentali
- Progressive overload: aumenta carichi/volume/densità nel tempo
- Volume consigliato ipertrofia: 10-20 serie/settimana per gruppo muscolare
- RPE 7-9 per la maggior parte delle serie di lavoro
- Riposo tra serie: 2-3 min compound, 1-2 min isolation
- Deload ogni 4-6 settimane: riduci volume del 40-50%

### Split consigliati per frequenza
- 2-3x/settimana: Full Body
- 4x/settimana: Upper/Lower
- 5-6x/settimana: Push/Pull/Legs
- Principianti: Full Body 3x sempre

### Esercizi per infortuni — ESCLUSIONI
- Ernia lombare: NO stacco da terra pesante, NO good morning pesanti, cautela con squat
- Dolore spalla: NO military press, NO dips profondi, cautela con panca piana
- Dolore ginocchio: NO squat profondo con carico, NO leg extension pesante, preferisci leg press range ridotto
```

**Pattern detection rules:**
```
## PATTERN DA RILEVARE E SEGNALARE

Quando noti questi pattern, segnalali proattivamente:
- ⚠️ Calorie <1200 (uomini) o <1000 (donne) per >3 giorni → avvisa gentilmente
- ⚠️ Proteine costantemente sotto il 60% del target → suggerisci fonti proteiche
- ⚠️ Nessun allenamento per >5 giorni → chiedi come sta, proponi qualcosa di leggero
- ⚠️ Peso che sale >0.5kg/settimana in cut → rivedi strategia
- ⚠️ Peso che scende >1kg/settimana per >2 settimane → troppo aggressivo
- ⚠️ Acqua costantemente sotto 1.5L → ricorda l'idratazione
- ⚠️ Pasti saltati ricorrenti → suggerisci struttura pasti
```

**Time-of-day proactivity:**
```
## PROATTIVITÀ BASATA SULL'ORARIO

Se l'utente ti saluta o chiede "come va", adatta in base all'ora:
- Mattina (6-10): suggerisci colazione se non registrata, pre-workout se allena al mattino
- Metà mattina (10-12): snack se necessario, prepara pranzo
- Pranzo (12-14): pasto principale, bilancia i macro
- Pomeriggio (14-17): snack, pre-workout se allena la sera
- Cena (17-21): ultimo pasto principale, gestisci calorie rimanenti
- Sera (21-24): se calorie raggiunte, sconsiglia di mangiare; se mancano proteine, suggerisci snack proteico
```

### Section G — Food Database Names (dynamic, cached)

Same as current `buildFoodDatabaseSummary()` — inject top food names per category so the AI can reference them when using tools.

**Step 2: Export function**

```typescript
export function buildAISystemPrompt(ctx: AIUserContext | null): string
```

If `ctx` is null, return a minimal prompt with identity + knowledge base only.

**Step 3: Verify build**

Run: `npm run build`

---

## Task 4: Tool Definitions (`src/ai/tools.ts`)

**Files:**
- Create: `src/ai/tools.ts`

Define OpenAI function calling tool schemas.

**Step 1: Create tool definitions**

Export an array of OpenAI tool objects:

```typescript
import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const AI_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "log_meal",
      description: "Registra un pasto dell'utente. Usa questo tool quando l'utente dice cosa ha mangiato e hai tutti i dati necessari (alimenti + quantità). Per piatti composti, scomponi in ingredienti singoli.",
      parameters: {
        type: "object",
        required: ["items", "meal_type"],
        properties: {
          items: {
            type: "array",
            description: "Lista degli alimenti del pasto",
            items: {
              type: "object",
              required: ["name", "name_en", "quantity_g"],
              properties: {
                name: { type: "string", description: "Nome alimento in italiano (es: 'petto di pollo')" },
                name_en: { type: "string", description: "Nome alimento in inglese USDA-style (es: 'chicken breast meat raw'). Sii specifico. Aggiungi 'raw' se crudo." },
                quantity_g: { type: "number", description: "Quantità in grammi" },
                brand: { type: "string", nullable: true, description: "Marca se prodotto confezionato, null se generico" },
                is_cooked: { type: "boolean", description: "true solo se l'utente specifica 'cotto/da cotto'. Default false." },
              },
            },
          },
          meal_type: {
            type: "string",
            enum: ["colazione", "pranzo", "cena", "snack"],
            description: "Tipo di pasto. Deduci da orario: 7-10 colazione, 12-14 pranzo, 19-21 cena, altro snack.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_workout",
      description: "Registra un allenamento dell'utente. Usa quando l'utente descrive un workout completato.",
      parameters: {
        type: "object",
        required: ["description", "workout_type"],
        properties: {
          description: { type: "string", description: "Titolo conciso (es: 'Petto e bicipiti', 'Corsa 30 min')" },
          workout_type: { type: "string", description: "Categoria (es: 'Palestra', 'Corsa', 'Cardio', 'Yoga', 'Nuoto')" },
          duration_min: { type: "number", nullable: true, description: "Durata in minuti se specificata" },
          exercises: {
            type: "array",
            description: "Esercizi specifici se menzionati dall'utente. NON inventare esercizi.",
            items: {
              type: "object",
              required: ["name", "sets", "reps"],
              properties: {
                name: { type: "string" },
                sets: { type: "number" },
                reps: { type: "number" },
                weight_kg: { type: "number", nullable: true },
              },
            },
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_water",
      description: "Registra assunzione di acqua.",
      parameters: {
        type: "object",
        required: ["amount_ml"],
        properties: {
          amount_ml: { type: "number", description: "Quantità in millilitri (es: 250 per un bicchiere, 500 per una bottiglia)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_weight",
      description: "Registra il peso corporeo dell'utente.",
      parameters: {
        type: "object",
        required: ["weight_kg"],
        properties: {
          weight_kg: { type: "number", description: "Peso in kg" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_food",
      description: "Cerca informazioni nutrizionali di un alimento. Usa quando l'utente chiede 'quante calorie ha X?' o 'valori nutrizionali di X'. NON usare per registrare pasti — usa log_meal.",
      parameters: {
        type: "object",
        required: ["food_name", "food_name_en", "quantity_g"],
        properties: {
          food_name: { type: "string", description: "Nome alimento in italiano" },
          food_name_en: { type: "string", description: "Nome alimento in inglese USDA-style" },
          quantity_g: { type: "number", description: "Quantità in grammi per il calcolo" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_daily_summary",
      description: "Ottieni il riepilogo completo della giornata di oggi (pasti, allenamenti, macro, calorie). Usa quando l'utente chiede 'come va oggi?', 'riepilogo giornata', 'quante calorie mi restano?'",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weekly_report",
      description: "Ottieni il report settimanale (media calorie, proteine, allenamenti, trend peso, aderenza). Usa per 'riepilogo settimana', 'come sto andando?', analisi trend.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_meal",
      description: "Elimina un pasto registrato. Usa quando l'utente chiede di cancellare un pasto specifico.",
      parameters: {
        type: "object",
        required: ["meal_id"],
        properties: {
          meal_id: { type: "string", description: "ID del pasto da eliminare" },
        },
      },
    },
  },
];
```

Note: We don't define the OpenAI types manually. The type `ChatCompletionTool` may not be available since we're using raw fetch. Instead, define a simple local type:

```typescript
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}
```

**Step 2: Verify build**

Run: `npm run build`

---

## Task 5: Tool Executor (`src/ai/tool-executor.ts`)

**Files:**
- Create: `src/ai/tool-executor.ts`

Executes tool calls from the AI against the database and nutrition APIs.

**Step 1: Create the executor**

```typescript
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult>
```

Implementation for each tool:

**`log_meal`**:
1. Extract items from args
2. Call `lookupNutrients()` for each item (from `src/lib/nutrition.ts`) in parallel
3. Sum totals
4. Insert into `meals` table via supabaseAdmin
5. Return `{ success: true, data: { meal_id, description, calories, protein_g, carbs_g, fat_g, fiber_g, items: [{name, quantity_g, calories, protein_g, carbs_g, fat_g}] } }`

**`log_workout`**:
1. Insert into `workouts` table
2. Return `{ success: true, data: { workout_id, description } }`

**`log_water`**:
1. Get today's water_log for user (upsert: increment)
2. Return `{ success: true, data: { total_today_ml } }`

**`log_weight`**:
1. Insert into `weight_logs` table
2. Return `{ success: true, data: { weight_kg } }`

**`search_food`**:
1. Call `lookupNutrients()` from `src/lib/nutrition.ts`
2. Return nutrition data formatted for the AI

**`get_daily_summary`**:
1. Query today's meals, workouts, water
2. Aggregate totals
3. Return structured summary

**`get_weekly_report`**:
1. Query last 7 days of meals, workouts, weight
2. Calculate averages, trends
3. Return structured report

**`delete_meal`**:
1. Delete from meals table where id = meal_id AND user_id = userId
2. Return success/failure

**Step 2: Verify build**

Run: `npm run build`

---

## Task 6: AI Client — Streaming with Function Calling (`src/ai/ai-client.ts`)

**Files:**
- Create: `src/ai/ai-client.ts`

This is the core OpenAI API client that handles:
1. Sending messages with system prompt + tools
2. Streaming the response
3. Detecting and executing tool calls
4. Feeding tool results back and continuing
5. Streaming text deltas for real-time UX

**Step 1: Create the AI client**

Key function:

```typescript
export interface AIStreamCallbacks {
  onTextDelta?: (text: string) => void;           // Partial text for streaming UI
  onToolCall?: (toolName: string) => void;         // Notify UI about tool being called
  onToolResult?: (toolName: string, result: ToolResult) => void;  // Tool completed
}

export async function chatWithAI(params: {
  messages: { role: string; content: string }[];
  systemPrompt: string;
  userId: string;
  callbacks?: AIStreamCallbacks;
  stream?: boolean;
}): Promise<{
  content: string;           // Final text response
  toolCalls: { name: string; result: ToolResult }[];  // Tools that were executed
}>
```

**Implementation:**

1. Call OpenAI with `stream: true`, `tools: AI_TOOLS`, `tool_choice: "auto"`
2. Read the streaming response:
   - Accumulate text content deltas → call `callbacks.onTextDelta` for each
   - Accumulate tool call deltas (name + arguments come incrementally in streaming)
3. When stream completes with `finish_reason: "tool_calls"`:
   a. Parse all tool call arguments
   b. Execute each via `executeTool()`
   c. Call `callbacks.onToolCall` and `callbacks.onToolResult`
   d. Add tool results as `{ role: "tool", tool_call_id, content }` messages
   e. Call OpenAI again with the full message history (including tool results)
   f. Stream the follow-up response (this time it should be text)
4. When stream completes with `finish_reason: "stop"`:
   - Return the accumulated text content

**Important: Tool call streaming in OpenAI API**

In streaming mode, tool calls come as deltas in `choices[0].delta.tool_calls`:
```json
{"index": 0, "id": "call_xxx", "type": "function", "function": {"name": "log_meal", "arguments": ""}}
{"index": 0, "function": {"arguments": "{\"ite"}}
{"index": 0, "function": {"arguments": "ms\":"}}
```

You need to accumulate `function.arguments` across deltas for each tool call index, then JSON.parse the complete arguments string.

**Step 2: Handle the OpenAI message format**

Messages to OpenAI should use:
- `role: "developer"` for the system prompt (OpenAI convention)
- `role: "user"` for user messages
- `role: "assistant"` for assistant messages (with tool_calls if applicable)
- `role: "tool"` for tool execution results

**Step 3: Verify build**

Run: `npm run build`

---

## Task 7: Streaming Chat API (`src/app/api/chat/stream/route.ts`)

**Files:**
- Create: `src/app/api/chat/stream/route.ts`

SSE endpoint for the web ChatPanel.

**Step 1: Create the streaming endpoint**

```typescript
import { NextRequest } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { buildAIContext } from "@/ai/context-builder";
import { buildAISystemPrompt } from "@/ai/system-prompt";
import { chatWithAI } from "@/ai/ai-client";

export async function POST(request: NextRequest) {
  const { user_id, message } = await request.json();

  if (!user_id || !message?.trim()) {
    return new Response("user_id and message required", { status: 400 });
  }

  const text = message.trim();

  // Save user message
  await supabase.from("chat_messages").insert({
    user_id,
    role: "user",
    content: text,
    message_type: "text",
    source: "web",
  });

  // Build context and prompt
  const ctx = await buildAIContext(user_id);
  const systemPrompt = buildAISystemPrompt(ctx);

  // Build conversation history
  const history = [
    ...(ctx?.recentMessages ?? []),
    { role: "user", content: text },
  ];

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chatWithAI({
          messages: history,
          systemPrompt,
          userId: user_id,
          stream: true,
          callbacks: {
            onTextDelta: (delta) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`));
            },
            onToolCall: (name) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_call", name })}\n\n`));
            },
            onToolResult: (name, res) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", name, success: res.success })}\n\n`));
            },
          },
        });

        // Determine message type based on tool calls
        let messageType = "text";
        if (result.toolCalls.some(tc => tc.name === "log_meal")) messageType = "meal_saved";
        else if (result.toolCalls.some(tc => tc.name === "log_workout")) messageType = "workout_saved";

        // Save assistant response
        await supabase.from("chat_messages").insert({
          user_id,
          role: "assistant",
          content: result.content,
          message_type: messageType,
          source: "web",
          metadata: { toolCalls: result.toolCalls.map(tc => tc.name) },
        });

        // Send done event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", content: result.content, messageType })}\n\n`));
        controller.close();
      } catch (err) {
        console.error("Stream error:", err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Errore nell'elaborazione." })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

**Step 2: Keep the existing GET endpoint in `/api/chat/route.ts`**

The GET for loading message history stays unchanged. The POST in the old route can remain as a fallback or be removed later.

**Step 3: Verify build**

Run: `npm run build`

---

## Task 8: Update ChatPanel for Streaming (`src/components/ChatPanel.tsx`)

**Files:**
- Modify: `src/components/ChatPanel.tsx`

**Step 1: Replace the `sendMessage` function**

Change from fetch→JSON to fetch→ReadableStream:

```typescript
const sendMessage = useCallback(async (text: string) => {
  if (!text.trim() || !userId || loading) return;

  const trimmed = text.trim();
  setInput("");
  if (textareaRef.current) textareaRef.current.style.height = "auto";

  // Add user message optimistically
  const tempUserMsg = { /* same as current */ };
  setMessages(prev => [...prev, tempUserMsg]);
  setLoading(true);

  // Create a streaming assistant message placeholder
  const streamMsgId = `stream-${Date.now()}`;
  const streamMsg: ChatMessage = {
    id: streamMsgId,
    user_id: userId,
    role: "assistant",
    content: "",
    message_type: "text",
    source: "web",
    metadata: {},
    created_at: new Date().toISOString(),
  };
  setMessages(prev => [...prev, streamMsg]);

  try {
    const res = await fetch("/api/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, message: trimmed }),
    });

    if (!res.ok || !res.body) throw new Error("Stream failed");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = JSON.parse(line.slice(6));

        if (data.type === "delta") {
          accumulated += data.content;
          setMessages(prev =>
            prev.map(m => m.id === streamMsgId ? { ...m, content: accumulated } : m)
          );
        } else if (data.type === "tool_call") {
          // Could show a status indicator
        } else if (data.type === "done") {
          setMessages(prev =>
            prev.map(m => m.id === streamMsgId ? { ...m, content: data.content, message_type: data.messageType } : m)
          );
        } else if (data.type === "error") {
          setMessages(prev =>
            prev.map(m => m.id === streamMsgId ? { ...m, content: data.message, message_type: "error" } : m)
          );
        }
      }
    }
  } catch {
    setMessages(prev =>
      prev.map(m => m.id === streamMsgId ? { ...m, content: "Errore di connessione.", message_type: "error" } : m)
    );
  } finally {
    setLoading(false);
  }
}, [userId, loading]);
```

**Step 2: Remove the old fetch→JSON code**

Replace the entire `sendMessage` function with the streaming version above.

**Step 3: Update the loading indicator**

The current bouncing dots appear when `loading` is true and there's no stream message yet. With streaming, the assistant message appears immediately (empty) and fills in. The bouncing dots should only show briefly before the first delta arrives. The `loading` state can still control the input being disabled.

**Step 4: Verify build**

Run: `npm run build`

---

## Task 9: Update Telegram Webhook to Use New AI Pipeline

**Files:**
- Modify: `src/app/api/telegram/webhook/route.ts`

**Step 1: Update `handleFreeText` to use the new AI client**

Replace the current `classifyStream` call with `chatWithAI`:

```typescript
import { buildAIContext } from "@/ai/context-builder";
import { buildAISystemPrompt } from "@/ai/system-prompt";
import { chatWithAI } from "@/ai/ai-client";
```

The new `handleFreeText` should:
1. Build context with `buildAIContext(userId)`
2. Build prompt with `buildAISystemPrompt(ctx)`
3. Build conversation history from `ctx.recentMessages` + current message
4. Call `chatWithAI` with streaming and callbacks for progressive Telegram editing
5. The AI handles everything through tool calls — no more manual routing for meal/workout types
6. After the AI finishes, save the assistant message to chat_messages

The `onTextDelta` callback should progressively edit the Telegram message (same throttling pattern as current, every 400ms).

The `onToolCall` callback can update the message to show what's happening (e.g., "🔍 Cerco i valori nutrizionali..." when `search_food` or `log_meal` is called).

**Step 2: Keep command shortcuts**

Commands like `/oggi`, `/sessione`, `/fine`, `/annulla` should still be handled as fast-path shortcuts (no AI call needed). Keep the existing handler functions for these.

The recipe commands (`/ricetta`, `/crearicetta`, `/ricette`) also stay as-is.

**Step 3: Remove old classification imports**

Remove imports of `classifyStream`, `classifyMessage`, `classifyWithContext` from the webhook file as they're no longer needed for free text handling.

Keep `generateRecipe`, `transcribeAudio` imports as these are still used.

**Step 4: Simplify pending state management**

With function calling, the AI handles multi-turn conversations naturally. The `pendingMeals` and `pendingWorkouts` maps may no longer be needed — the AI will ask follow-up questions naturally and use tools when it has all the info.

However, keep `activeSessions` for the gym session feature (this is a user-controlled workflow that bypasses AI).

**Step 5: Verify build**

Run: `npm run build`

---

## Task 10: Update the Web Chat POST Endpoint

**Files:**
- Modify: `src/app/api/chat/route.ts`

**Step 1: Update the POST handler**

The POST handler should now use the new AI pipeline as a non-streaming fallback (for cases where streaming isn't available):

```typescript
import { buildAIContext } from "@/ai/context-builder";
import { buildAISystemPrompt } from "@/ai/system-prompt";
import { chatWithAI } from "@/ai/ai-client";

export async function POST(request: NextRequest) {
  const { user_id, message } = await request.json();

  // Save user message (same as before)

  // Build context
  const ctx = await buildAIContext(user_id);
  const systemPrompt = buildAISystemPrompt(ctx);
  const history = [...(ctx?.recentMessages ?? []), { role: "user", content: message.trim() }];

  // Non-streaming call
  const result = await chatWithAI({
    messages: history,
    systemPrompt,
    userId: user_id,
    stream: false,
  });

  // Determine message type
  let messageType = "text";
  if (result.toolCalls.some(tc => tc.name === "log_meal")) messageType = "meal_saved";
  else if (result.toolCalls.some(tc => tc.name === "log_workout")) messageType = "workout_saved";

  // Save and return
  const { data: assistantMsg } = await supabase.from("chat_messages").insert({
    user_id,
    role: "assistant",
    content: result.content,
    message_type: messageType,
    source: "web",
    metadata: { toolCalls: result.toolCalls.map(tc => tc.name) },
  }).select().single();

  return NextResponse.json({ userMessage: userMsg, assistantMessage: assistantMsg });
}
```

**Step 2: Keep GET handler unchanged**

**Step 3: Verify build**

Run: `npm run build`

---

## Task 11: Cleanup — Remove Old Classification Code

**Files:**
- Modify: `src/lib/openai.ts` — Keep `transcribeAudio`, `generateRecipe`, `buildFoodDatabaseSummary`. Remove or deprecate `classifyMessage`, `classifyWithContext`, `classifyStream`, `BASE_SYSTEM_PROMPT`, `buildSystemPrompt`.
- Modify: `src/lib/chat-processor.ts` — Keep command handlers (`processToday`, `processGoal`, `processSessionStart`, etc.) and `enrichWithNutrition`. Remove `processFreeText` (replaced by AI client with tools). Update `processMessage` to only handle commands and gym sessions, delegating everything else to the new AI pipeline.
- Modify: `src/lib/user-context.ts` — Mark as deprecated, keep for any remaining references.

**Step 1: Update `chat-processor.ts` processMessage**

```typescript
export async function processMessage(
  userId: string,
  text: string
): Promise<ProcessResult> {
  // Commands (fast path — no AI needed)
  if (text === "/oggi") return processToday(userId);
  if (text.startsWith("/obiettivo")) return processGoal(userId, text);
  if (text.startsWith("/crearicetta")) return processCreateRecipe(userId, text);
  if (text.startsWith("/ricetta")) return processRecipe(userId, text);
  if (text === "/ricette") return processRecipeList(userId);
  if (text === "/sessione") return processSessionStart(userId);
  if (text === "/fine") return processSessionEnd(userId);
  if (text === "/annulla") return processSessionCancel(userId);

  // Active gym session → parse exercise
  const { data: activeSession } = await supabase
    .from("active_chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (activeSession) {
    const exercises = (activeSession.exercises as ParsedExercise[]) || [];
    if (activeSession.workout_id && exercises.length === 0) {
      const lower = text.toLowerCase().trim();
      const isYesNo = /^(s[iì]|yes|y|ok|certo|va bene|dai|no|nah|nope|non?|skip|salta)$/i.test(lower);
      if (isYesNo) return processPendingWorkoutResponse(userId, text);
    }
    return processSessionExercise(userId, text);
  }

  // Check recipe match (instant, no AI)
  const recipeMatch = await findRecipeByName(userId, text);
  if (recipeMatch) {
    return processRecipeMatch(userId, recipeMatch.recipe, recipeMatch.portions);
  }

  // Everything else → handled by new AI pipeline (caller's responsibility)
  // Return a marker so the caller knows to use chatWithAI
  return { kind: "chat", reply: "__USE_AI_PIPELINE__" };
}
```

The actual AI call happens in the API routes (chat/stream, chat POST, telegram webhook), not in processMessage. This keeps processMessage as a fast-path command router.

**Step 2: Verify build**

Run: `npm run build`

---

## Task 12: Final Integration Test

**Step 1: Full build check**

Run: `npm run build`
Expected: Clean build with no TypeScript errors.

**Step 2: Manual test scenarios**

Start dev server: `npm run dev`

Test in web ChatPanel:
1. "Ciao" → Should get a personalized Italian greeting with daily summary
2. "Ho mangiato 200g di pollo e 100g di riso" → AI should call log_meal, lookup nutrition, confirm with macros
3. "Quante calorie ha la mozzarella?" → AI should call search_food and respond with nutrition data
4. "Come sto andando?" → AI should call get_weekly_report and give personalized analysis
5. "Ho fatto panca piana 4x8 80kg e croci 3x12 16kg" → AI should call log_workout
6. "/oggi" → Fast command, daily summary (no AI)
7. "/sessione" → Start gym session (no AI)

Test that streaming works — responses should appear token by token.

Test that Telegram still works with the same scenarios.

**Step 3: Verify goal-specific behavior**

- User with goal "cut": AI should emphasize protein, satiety, controlled deficit
- User with goal "bulk": AI should encourage surplus, celebrate PRs, suggest calorie-dense foods
- User with goal "maintain": AI should focus on consistency, balanced approach
