# Bot Precision Enhancement — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Telegram bot so GPT only parses messages (food, quantity, brand) and ALL nutritional values come from verified APIs — never AI estimates. Add photo support for nutrition labels and barcodes via GPT-4o Vision.

**Architecture:** GPT becomes a parser-only (no nutritional database in prompt). Two lookup paths: branded products prioritize OpenFoodFacts, generic foods prioritize USDA. When APIs fail, bot asks user for a photo instead of guessing. New `vision.ts` module handles label OCR and barcode reading via GPT-4o Vision.

**Tech Stack:** Next.js 16, OpenAI API (GPT-5-mini for parsing, GPT-4o for vision), USDA FoodData Central, OpenFoodFacts API, FatSecret API, Telegram Bot API, Supabase.

**Validation:** No test framework configured. Validate every task with `npm run build` (strict TypeScript).

---

### Task 1: Create `src/lib/vision.ts` — Photo Analysis Module

**Files:**
- Create: `src/lib/vision.ts`

**Why first:** This is a standalone new module with no dependencies on existing code changes. Building it first means we can integrate it later without blocking other work.

**Step 1: Create the vision module**

```typescript
// src/lib/vision.ts
import { type NutrientResult } from "./nutrition";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const TIMEOUT_MS = 15000; // Vision needs more time than text

// ---------------------------------------------------------------------------
// Analyze a nutrition label photo → extract per-100g values
// ---------------------------------------------------------------------------
export interface LabelResult {
  product_name: string | null;
  per_100g: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
}

const LABEL_PROMPT = `Analizza questa immagine. Cerca un'etichetta nutrizionale (tabella valori nutrizionali).

Se trovi un'etichetta nutrizionale, estrai i valori PER 100g:
- calories (kcal)
- protein_g (proteine in grammi)
- carbs_g (carboidrati in grammi)
- fat_g (grassi in grammi)
- fiber_g (fibre in grammi, 0 se non presente)
- product_name (nome del prodotto se visibile, null altrimenti)

Se trovi un codice a barre (barcode/EAN), estrai il numero.

Rispondi SOLO con JSON valido, senza markdown:

Se etichetta trovata:
{"type":"label","product_name":"...","calories":N,"protein_g":N,"carbs_g":N,"fat_g":N,"fiber_g":N}

Se barcode trovato:
{"type":"barcode","code":"1234567890123"}

Se trovi ENTRAMBI (etichetta + barcode):
{"type":"both","product_name":"...","calories":N,"protein_g":N,"carbs_g":N,"fat_g":N,"fiber_g":N,"barcode":"1234567890123"}

Se non riesci a leggere nulla di utile:
{"type":"unreadable"}`;

export type VisionResult =
  | { type: "label"; product_name: string | null; calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }
  | { type: "barcode"; code: string }
  | { type: "both"; product_name: string | null; calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number; barcode: string }
  | { type: "unreadable" };

export async function analyzePhoto(imageBuffer: Buffer): Promise<VisionResult> {
  try {
    const base64 = imageBuffer.toString("base64");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_completion_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: LABEL_PROMPT },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64}`, detail: "high" },
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.error("[Vision] API error:", res.status, await res.text());
      return { type: "unreadable" };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content) return { type: "unreadable" };

    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[Vision] analyzePhoto error:", err);
    return { type: "unreadable" };
  }
}

// ---------------------------------------------------------------------------
// Convert label result to NutrientResult scaled to grams
// ---------------------------------------------------------------------------
export function labelToNutrients(
  label: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number },
  grams: number
): NutrientResult {
  const scale = grams / 100;
  return {
    calories: Math.round(label.calories * scale),
    protein_g: parseFloat((label.protein_g * scale).toFixed(1)),
    carbs_g: parseFloat((label.carbs_g * scale).toFixed(1)),
    fat_g: parseFloat((label.fat_g * scale).toFixed(1)),
    fiber_g: parseFloat((label.fiber_g * scale).toFixed(1)),
    source: "openfoodfacts", // label data treated as "real" source
  };
}

// ---------------------------------------------------------------------------
// Lookup product by barcode on OpenFoodFacts
// ---------------------------------------------------------------------------
export async function lookupByBarcode(barcode: string, grams: number): Promise<NutrientResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        headers: { "User-Agent": "ViTrack/1.0" },
        signal: controller.signal,
      }
    );

    clearTimeout(timer);

    if (!res.ok) {
      console.error("[OFF-Barcode] API error:", res.status);
      return null;
    }

    const data = await res.json();
    if (data.status !== 1 || !data.product?.nutriments) {
      console.log(`[OFF-Barcode] MISS: barcode ${barcode} — not found or no nutriments`);
      return null;
    }

    const n = data.product.nutriments;
    const cal100 = n["energy-kcal_100g"];
    const prot100 = n.proteins_100g;
    const carbs100 = n.carbohydrates_100g;
    const fat100 = n.fat_100g;
    const fiber100 = n.fiber_100g ?? 0;

    if (typeof cal100 !== "number" || cal100 === 0) {
      console.log(`[OFF-Barcode] MISS: barcode ${barcode} — incomplete nutriments`);
      return null;
    }

    const scale = grams / 100;
    const result: NutrientResult = {
      calories: Math.round(cal100 * scale),
      protein_g: parseFloat(((prot100 ?? 0) * scale).toFixed(1)),
      carbs_g: parseFloat(((carbs100 ?? 0) * scale).toFixed(1)),
      fat_g: parseFloat(((fat100 ?? 0) * scale).toFixed(1)),
      fiber_g: parseFloat((fiber100 * scale).toFixed(1)),
      source: "openfoodfacts",
    };

    const productName = data.product.product_name ?? barcode;
    console.log(
      `[OFF-Barcode] HIT: ${barcode} → "${productName}" | ${result.calories} kcal (${grams}g)`
    );
    return result;
  } catch (err) {
    console.error(`[OFF-Barcode] Lookup failed for ${barcode}:`, err);
    return null;
  }
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build passes (new file has no consumers yet, but must compile).

**Step 3: Commit**

```bash
git add src/lib/vision.ts
git commit -m "feat: add vision module for nutrition label and barcode analysis"
```

---

### Task 2: Enhance OpenFoodFacts — Branded Search + Barcode Lookup

**Files:**
- Modify: `src/lib/openfoodfacts.ts`

**Why:** OpenFoodFacts needs branded product search with separate brand parameter, and we need to export the barcode lookup from vision.ts as well. This prepares the lookup pipeline for branded routing.

**Step 1: Add branded search function to openfoodfacts.ts**

Add a new exported function `lookupOFFBranded` after the existing `lookupOFF`. This function searches with brand as a separate parameter for better matching:

```typescript
// Add after the existing lookupOFF function:

export async function lookupOFFBranded(
  productName: string,
  brand: string,
  grams: number
): Promise<NutrientResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Use tag-based filtering for brand + text search for product name
    const params = new URLSearchParams({
      search_terms: `${brand} ${productName}`,
      tagtype_0: "brands",
      tag_contains_0: "contains",
      tag_0: brand,
      cc: "it",
      fields: "code,product_name,brands,nutriments",
      page_size: "10",
      json: "1",
    });

    const res = await fetch(`${OFF_SEARCH_URL}?${params}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.error("[OFF-Branded] Search error:", res.status);
      return null;
    }

    const data: OFFSearchResponse = await res.json();
    const products = data.products ?? [];
    if (products.length === 0) {
      console.log(`[OFF-Branded] MISS: "${brand} ${productName}" — no results`);
      return null;
    }

    // Score with brand awareness
    const scored = products
      .map((p) => {
        const base = scoreProduct(p, productName);
        if (base < 0) return { product: p, score: -1 };
        // Boost if brand matches
        const pBrand = (p.brands ?? "").toLowerCase();
        const brandBoost = pBrand.includes(brand.toLowerCase()) ? 25 : 0;
        return { product: p, score: base + brandBoost };
      })
      .filter((s) => s.score >= 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      console.log(`[OFF-Branded] MISS: "${brand} ${productName}" — no valid nutriments`);
      return null;
    }

    const best = scored[0].product;
    const n = best.nutriments!;
    const scale = grams / 100;

    const result: NutrientResult = {
      calories: Math.round((n["energy-kcal_100g"] ?? 0) * scale),
      protein_g: parseFloat(((n.proteins_100g ?? 0) * scale).toFixed(1)),
      carbs_g: parseFloat(((n.carbohydrates_100g ?? 0) * scale).toFixed(1)),
      fat_g: parseFloat(((n.fat_100g ?? 0) * scale).toFixed(1)),
      fiber_g: parseFloat(((n.fiber_100g ?? 0) * scale).toFixed(1)),
      source: "openfoodfacts",
    };

    const label = best.product_name
      ? `${best.product_name}${best.brands ? ` (${best.brands})` : ""}`
      : best.code;

    console.log(
      `[OFF-Branded] HIT: "${brand} ${productName}" → "${label}" | ` +
        `${result.calories} kcal, ${result.protein_g}P, ${result.carbs_g}C, ${result.fat_g}G (${grams}g)`
    );
    return result;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[OFF-Branded] TIMEOUT: "${brand} ${productName}" (>${TIMEOUT_MS}ms)`);
    } else {
      console.error(`[OFF-Branded] Lookup failed for "${brand} ${productName}":`, err);
    }
    return null;
  }
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build passes.

**Step 3: Commit**

```bash
git add src/lib/openfoodfacts.ts
git commit -m "feat: add branded product search to OpenFoodFacts client"
```

---

### Task 3: Restructure Nutrition Pipeline — Branded vs Generic Paths

**Files:**
- Modify: `src/lib/nutrition.ts`

**Why:** The nutrition module needs two lookup paths (branded prioritizes OFF, generic prioritizes USDA) and must return null with no AI fallback when all APIs fail.

**Step 1: Update nutrition.ts with dual-path lookup**

Replace the `fetchPer100g` function and update `lookupNutrients` signature to accept brand/is_branded:

```typescript
// New import at top:
import { lookupOFFBranded } from "./openfoodfacts";

// Replace fetchPer100g with two functions:

async function fetchPer100gGeneric(
  name: string,
  nameEn: string
): Promise<NutrientResult | null> {
  // Priority: USDA → FatSecret → OpenFoodFacts
  const [usdaRes, offRes, fsRes] = await Promise.allSettled([
    lookupUSDA(nameEn, 100),
    lookupOFF(name, 100),
    lookupFood(name, 100),
  ]);

  const usda = usdaRes.status === "fulfilled" ? usdaRes.value : null;
  const off = offRes.status === "fulfilled" ? offRes.value : null;
  const fs = fsRes.status === "fulfilled" ? fsRes.value : null;

  // Cross-validate: collect all valid results
  const valid = [usda, off, fs].filter((r): r is NutrientResult => r !== null && atwaterCheck(r));

  if (valid.length >= 2) {
    // Check if top 2 agree within 15%
    const [a, b] = valid;
    const diff = Math.abs(a.calories - b.calories);
    const avg = (a.calories + b.calories) / 2;
    if (avg > 0 && diff / avg <= 0.15) {
      return a; // Use first (highest priority) since they agree
    }
  }

  // Single best result by priority
  if (usda && atwaterCheck(usda)) return usda;
  if (off && atwaterCheck(off)) return off;
  if (fs && atwaterCheck(fs)) return fs;
  return null;
}

async function fetchPer100gBranded(
  name: string,
  nameEn: string,
  brand: string
): Promise<NutrientResult | null> {
  // Priority: OpenFoodFacts (branded) → FatSecret → USDA
  const [offBrandedRes, offRes, fsRes, usdaRes] = await Promise.allSettled([
    lookupOFFBranded(name, brand, 100),
    lookupOFF(`${brand} ${name}`, 100),
    lookupFood(`${brand} ${name}`, 100),
    lookupUSDA(`${brand} ${nameEn}`, 100),
  ]);

  const offBranded = offBrandedRes.status === "fulfilled" ? offBrandedRes.value : null;
  const off = offRes.status === "fulfilled" ? offRes.value : null;
  const fs = fsRes.status === "fulfilled" ? fsRes.value : null;
  const usda = usdaRes.status === "fulfilled" ? usdaRes.value : null;

  // Cross-validate
  const valid = [offBranded, off, fs, usda].filter(
    (r): r is NutrientResult => r !== null && atwaterCheck(r)
  );

  if (valid.length >= 2) {
    const [a, b] = valid;
    const diff = Math.abs(a.calories - b.calories);
    const avg = (a.calories + b.calories) / 2;
    if (avg > 0 && diff / avg <= 0.15) {
      return a;
    }
  }

  // Single best by priority
  if (offBranded && atwaterCheck(offBranded)) return offBranded;
  if (off && atwaterCheck(off)) return off;
  if (fs && atwaterCheck(fs)) return fs;
  if (usda && atwaterCheck(usda)) return usda;
  return null;
}
```

Update the `lookupNutrients` signature:

```typescript
export async function lookupNutrients(
  name: string,
  nameEn: string,
  grams: number,
  brand?: string | null
): Promise<NutrientResult | null> {
  const key = makeKey(name, nameEn);

  // 1. Cache hit
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    if (cached.per100g) {
      const r = scaleResult(cached.per100g, grams);
      console.log(`[Nutrition] CACHE: "${name}" → ${r.source} | ${r.calories} kcal (${grams}g)`);
      return r;
    }
    return null;
  }

  // 2. In-flight deduplication
  let fetchPromise = inFlight.get(key);
  if (!fetchPromise) {
    fetchPromise = brand
      ? fetchPer100gBranded(name, nameEn, brand)
      : fetchPer100gGeneric(name, nameEn);
    inFlight.set(key, fetchPromise);
  }

  try {
    const per100g = await fetchPromise;
    cache.set(key, { per100g, ts: Date.now() });

    if (per100g) {
      const r = scaleResult(per100g, grams);
      console.log(`[Nutrition] "${name}" → ${r.source} | ${r.calories} kcal (${grams}g)`);
      return r;
    }

    console.log(`[Nutrition] "${name}" → NO DATA (all APIs failed, no fallback)`);
    return null;
  } finally {
    inFlight.delete(key);
  }
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build passes. Existing callers pass `brand` as undefined which matches the optional param.

**Step 3: Commit**

```bash
git add src/lib/nutrition.ts
git commit -m "feat: add branded vs generic dual-path nutrition lookup with cross-validation"
```

---

### Task 4: Rewrite GPT System Prompt — Parser Only

**Files:**
- Modify: `src/lib/openai.ts`

**Why:** The system prompt must be rewritten to remove the nutritional database and change GPT's role from calculator to parser. The MealClassification type needs new fields (brand, is_branded) and must drop calorie/macro fields from GPT output.

**Step 1: Add new ParsedMealItem type and update MealClassification**

Add a new type for GPT's parsed output (before enrichment):

```typescript
// New type: what GPT returns (parse only, no macros)
export interface ParsedMealItem {
  name: string;
  name_en: string;
  brand: string | null;
  quantity_g: number;
  is_branded: boolean;
}

export interface ParsedMeal {
  type: "meal";
  items: ParsedMealItem[];
  meal_type: "colazione" | "pranzo" | "cena" | "snack";
}
```

The existing `MealClassification` stays as-is (it's the enriched output with full macros). The type union `Classification` needs to include `ParsedMeal`:

```typescript
export type Classification =
  | ParsedMeal
  | MealClassification
  | NeedInfoClassification
  | WorkoutClassification
  | ChatClassification
  | ErrorClassification;
```

**Step 2: Rewrite SYSTEM_PROMPT**

Replace the entire `SYSTEM_PROMPT` constant. Remove the nutritional database. GPT only parses:

```typescript
const SYSTEM_PROMPT = `Sei ViTrack, un assistente personale per nutrizione e fitness integrato in Telegram. Sei amichevole, motivante e competente. Parli in modo naturale e conciso — questa è una chat, non un manuale. Rispondi nella lingua dell'utente.

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

CONDIMENTI:
- NON chiedere mai informazioni su condimenti (olio, burro, sale, spezie, salse, ecc.).
- Parsa SOLO gli alimenti che l'utente menziona esplicitamente.
- Se l'utente menziona esplicitamente un condimento con grammatura (es: "con 10g di olio"), includilo negli items.

PRODOTTI CONFEZIONATI/BRANDED:
- Se l'utente menziona un prodotto di marca (es: "Yogurt Müller", "Kinder Bueno", "Barilla"), imposta is_branded: true e brand: "NomeMarca".
- Separa il brand dal nome prodotto: "Yogurt Müller alla fragola" → brand: "Müller", name: "yogurt alla fragola".
- Per prodotti non di marca (es: "petto di pollo", "riso"), imposta is_branded: false e brand: null.

PIATTI COMPOSTI:
- Scomponi in ingredienti singoli. "pasta al pomodoro 200g" → items: [{"name": "pasta", ...}] con quantity_g del piatto.
- Chiedi SOLO la grammatura dell'ingrediente principale se mancante.

Se hai TUTTI i dati (alimento + quantità):
{"type":"meal","items":[{"name":"petto di pollo","name_en":"chicken breast meat raw","brand":null,"quantity_g":200,"is_branded":false}],"meal_type":"colazione|pranzo|cena|snack"}

CAMPO ITEMS (obbligatorio per type "meal"):
- "name": nome dell'alimento in italiano (es: "petto di pollo", "yogurt alla fragola")
- "name_en": traduzione USDA in inglese. Sii specifico: "chicken breast meat raw" non "chicken". Per pesce: "atlantic salmon raw". Aggiungi "raw" se crudo.
- "brand": nome della marca se menzionata (es: "Müller", "Kinder", "Barilla"), null se generico
- "quantity_g": grammatura specificata dall'utente
- "is_branded": true se è un prodotto di marca, false se è un alimento generico

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

STILE CONVERSAZIONE:
- Sii conciso — 1-3 frasi, questa è una chat Telegram
- Sii amichevole e motivante, mai freddo o robotico
- Usa il "tu" informale
- Puoi usare emoji con moderazione

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
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build passes. The streaming functions return `Classification` which now includes `ParsedMeal`.

**Step 4: Commit**

```bash
git add src/lib/openai.ts
git commit -m "feat: rewrite GPT prompt as parser-only, add ParsedMeal type, remove nutritional database"
```

---

### Task 5: Update `chat-processor.ts` — Handle ParsedMeal + Strict Enrichment

**Files:**
- Modify: `src/lib/chat-processor.ts`

**Why:** The chat processor's `enrichWithNutrition` and `processFreeText` must handle the new `ParsedMeal` format from GPT (items without macros) and return an error/ask for photo when APIs fail, instead of using AI fallback values.

**Step 1: Rewrite enrichWithNutrition to build MealClassification from ParsedMeal**

```typescript
import { type ParsedMeal, type MealClassification } from "@/lib/openai";

// New type for enrichment failures
export interface EnrichmentResult {
  meal: MealClassification | null;
  failedItems: string[]; // names of items that couldn't be looked up
}

export async function enrichWithNutrition(
  parsed: ParsedMeal
): Promise<EnrichmentResult> {
  if (!parsed.items || parsed.items.length === 0) {
    return { meal: null, failedItems: [] };
  }

  const results: (NutrientResult | null)[] = await Promise.all(
    parsed.items.map((item) =>
      lookupNutrients(item.name, item.name_en, item.quantity_g, item.brand)
    )
  );

  const failedItems: string[] = [];
  let totCal = 0, totProt = 0, totCarbs = 0, totFat = 0, totFiber = 0;
  const enrichedItems: MealClassification["items"] = [];
  const descParts: string[] = [];
  let allFound = true;

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
      allFound = false;
      failedItems.push(item.brand ? `${item.brand} ${item.name}` : item.name);
    }
  }

  if (!allFound) {
    // If some items failed, return partial result + failure list
    // If ALL items failed, return null meal
    if (enrichedItems.length === 0) {
      return { meal: null, failedItems };
    }
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
```

**Step 2: Update processFreeText to handle ParsedMeal and failedItems**

In `processFreeText`, after classification, check if it's a `ParsedMeal` (has `type === "meal"` but no `calories` property — or check for `is_branded` on items):

```typescript
// In processFreeText, replace the meal handling block:
if (result.type === "meal") {
  // Check if this is a ParsedMeal (no calories) or legacy MealClassification
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

    if (enrichResult.failedItems.length > 0 && enrichResult.meal) {
      // Partial failure — save what we have, ask for the rest
      // Save the successful items
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

      const itemNames = enrichResult.failedItems.join(", ");
      const msg =
        `Pasto parzialmente registrato!\n\n` +
        `${enrichResult.meal.description}\n` +
        `Calorie: ${enrichResult.meal.calories} kcal | P: ${enrichResult.meal.protein_g}g | C: ${enrichResult.meal.carbs_g}g | G: ${enrichResult.meal.fat_g}g\n\n` +
        `Non ho trovato i valori per: ${itemNames}\nMandami una foto dell'etichetta per aggiungerli.`;
      return { kind: "meal_saved", reply: msg, data: enrichResult.meal };
    }

    // All items found — save normally
    const meal = enrichResult.meal!;
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

    if (error) return { kind: "error", reply: "Errore nel salvataggio del pasto." };

    const msg =
      `Pasto registrato!\n\n` +
      `${meal.description}\n\n` +
      `Calorie: ${meal.calories} kcal\n` +
      `Proteine: ${meal.protein_g}g\n` +
      `Carboidrati: ${meal.carbs_g}g\n` +
      `Grassi: ${meal.fat_g}g\n` +
      `Fibre: ${meal.fiber_g}g\n\n` +
      `Tipo: ${meal.meal_type}`;
    return { kind: "meal_saved", reply: msg, data: meal };
  }

  // Legacy MealClassification handling (from classifyWithContext follow-ups)
  // ... keep existing code as fallback during transition
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build passes.

**Step 4: Commit**

```bash
git add src/lib/chat-processor.ts
git commit -m "feat: handle ParsedMeal with strict API-only enrichment, no AI fallback"
```

---

### Task 6: Update Telegram Webhook — Photo Handling + Awaiting Photo State

**Files:**
- Modify: `src/app/api/telegram/webhook/route.ts`

**Why:** The webhook needs to handle photo messages (nutrition labels and barcodes), manage the "awaiting_photo" state when APIs fail, and use the new enrichment flow.

**Step 1: Add photo handling imports and awaiting-photo state**

At the top of the file, add:

```typescript
import { analyzePhoto, lookupByBarcode, labelToNutrients } from "@/lib/vision";
import { type ParsedMeal } from "@/lib/openai";
```

Add new state type after existing interfaces:

```typescript
interface AwaitingPhoto {
  items: ParsedMeal["items"];
  failedItemNames: string[];
  meal_type: "colazione" | "pranzo" | "cena" | "snack";
  expiresAt: number;
}

const awaitingPhotos = new Map<number, AwaitingPhoto>();
```

**Step 2: Add photo message handling in the main after() block**

In the `after()` callback, before the text processing, add photo handling:

```typescript
// After voice message handling and before the text-based command routing:

// Handle photo messages
if (message.photo && message.photo.length > 0) {
  const userId = uid ?? await getUserId(telegramId);
  if (!userId) {
    await sendMessage(chatId, "Invia prima /start per registrarti.");
    return;
  }

  saveChatMsg(userId, "user", "[foto]");
  await handlePhoto(chatId, telegramId, userId, message);
  return;
}
```

**Step 3: Implement handlePhoto function**

```typescript
async function handlePhoto(
  chatId: number,
  telegramId: number,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any
) {
  // Get the largest photo (last in array)
  const photos = message.photo;
  const largestPhoto = photos[photos.length - 1];
  const caption = message.caption?.trim() ?? "";

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

  // Extract quantity from caption if present
  const quantityMatch = caption.match(/(\d+)\s*g/i);
  let grams = quantityMatch ? parseInt(quantityMatch[1]) : null;

  // Check if this is responding to an "awaiting photo" state
  const awaiting = awaitingPhotos.get(telegramId);
  if (awaiting && Date.now() < awaiting.expiresAt) {
    awaitingPhotos.delete(telegramId);
    // Use the quantity from the original parsed items if not in caption
    if (!grams && awaiting.items.length > 0) {
      grams = awaiting.items[0].quantity_g;
    }
  }

  if (visionResult.type === "barcode" || visionResult.type === "both") {
    const barcode = visionResult.type === "barcode" ? visionResult.code : visionResult.barcode;

    if (!grams) {
      // We need quantity — ask and save barcode for later
      pendingMeals.set(telegramId, {
        history: [
          { role: "user", content: `[foto barcode: ${barcode}]` },
          { role: "assistant", content: `{"type":"need_info","message":"Quanti grammi?"}` },
        ],
      });
      if (thinkingId) await editMessage(chatId, thinkingId, `\uD83D\uDCF7 Ho letto il codice a barre. Quanti grammi hai mangiato?`);
      saveChatMsg(userId, "assistant", "Ho letto il codice a barre. Quanti grammi?", "need_info");
      return;
    }

    const nutrients = await lookupByBarcode(barcode, grams);
    if (nutrients) {
      await saveMealFromNutrients(chatId, userId, nutrients, grams, "snack", thinkingId);
      return;
    }

    // Barcode not in OFF database — if we also have label data (type "both"), use that
    if (visionResult.type === "both") {
      const nutrients2 = labelToNutrients(visionResult, grams);
      await saveMealFromNutrients(chatId, userId, nutrients2, grams, "snack", thinkingId, visionResult.product_name);
      return;
    }

    if (thinkingId) await editMessage(chatId, thinkingId, "Ho letto il codice a barre ma il prodotto non è nel database. Puoi mandarmi una foto dell'etichetta nutrizionale?");
    saveChatMsg(userId, "assistant", "Barcode non trovato, serve foto etichetta.", "need_info");
    return;
  }

  // type === "label"
  if (!grams) {
    // Save label data and ask for quantity
    pendingMeals.set(telegramId, {
      history: [
        { role: "user", content: `[foto etichetta: ${JSON.stringify(visionResult)}]` },
        { role: "assistant", content: `{"type":"need_info","message":"Quanti grammi hai mangiato?"}` },
      ],
    });
    if (thinkingId) await editMessage(chatId, thinkingId, `\uD83D\uDCF7 Ho letto l'etichetta${visionResult.product_name ? ` di <b>${visionResult.product_name}</b>` : ""}. Quanti grammi hai mangiato?`);
    saveChatMsg(userId, "assistant", "Ho letto l'etichetta. Quanti grammi?", "need_info");
    return;
  }

  const nutrients = labelToNutrients(visionResult, grams);
  await saveMealFromNutrients(chatId, userId, nutrients, grams, "snack", thinkingId, visionResult.product_name);
}
```

**Step 4: Add saveMealFromNutrients helper**

```typescript
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

  const [, dbResult] = await Promise.all([
    thinkingId
      ? editMessage(chatId, thinkingId,
          `<b>Pasto registrato!</b>\n\n` +
          `${description}\n\n` +
          `Calorie: ${nutrients.calories} kcal\n` +
          `Proteine: ${nutrients.protein_g}g\n` +
          `Carboidrati: ${nutrients.carbs_g}g\n` +
          `Grassi: ${nutrients.fat_g}g\n` +
          `Fibre: ${nutrients.fiber_g}g\n\n` +
          `Tipo: ${mealType}`)
      : sendMessage(chatId, `Pasto registrato! ${description}`),
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
  saveChatMsg(userId, "assistant", `Pasto registrato: ${description}`, "meal_saved");
}
```

**Step 5: Update handleFreeText to set awaiting-photo state on failure**

In `handleFreeText`, after the enrichment fails and we send the "ask for photo" message, set the state:

```typescript
// When enrichment fails and we ask for photo, add:
awaitingPhotos.set(telegramId, {
  items: (result as ParsedMeal).items,
  failedItemNames: enrichResult.failedItems,
  meal_type: (result as ParsedMeal).meal_type,
  expiresAt: Date.now() + 5 * 60 * 1000, // 5 min timeout
});
```

**Step 6: Update handleFreeText to use new enrichment flow**

The handleFreeText function must handle `ParsedMeal` from the streaming classifier. Update the `result.type === "meal"` block:

```typescript
if (result.type === "meal") {
  const isParsedMeal = !("calories" in result);

  if (isParsedMeal) {
    const { enrichWithNutrition } = await import("@/lib/chat-processor");
    const enrichResult = await enrichWithNutrition(result as ParsedMeal);
    console.log(`[Perf] Nutrition enriched: ${(performance.now() - t0).toFixed(0)}ms`);

    if (enrichResult.failedItems.length > 0 && !enrichResult.meal) {
      const itemNames = enrichResult.failedItems.join(", ");
      const reply = `Non ho trovato i valori nutrizionali per <b>${itemNames}</b>. Puoi mandarmi una foto dell'etichetta nutrizionale o del codice a barre?`;
      if (thinkingId) await editMessage(chatId, thinkingId, reply);
      else await sendMessage(chatId, reply);
      saveChatMsg(userId, "assistant", reply, "need_info");

      awaitingPhotos.set(telegramId, {
        items: (result as ParsedMeal).items,
        failedItemNames: enrichResult.failedItems,
        meal_type: (result as ParsedMeal).meal_type,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      return;
    }

    if (enrichResult.meal) {
      await saveMealWithEdit(chatId, userId, enrichResult.meal, thinkingId);

      if (enrichResult.failedItems.length > 0) {
        const itemNames = enrichResult.failedItems.join(", ");
        await sendMessage(chatId, `Non ho trovato i valori per: <b>${itemNames}</b>\nMandami una foto dell'etichetta per aggiungerli.`);
      }
    }
  } else {
    // Legacy MealClassification (shouldn't happen with new prompt, but safe fallback)
    const enriched = await enrichWithNutrition(result as unknown as ParsedMeal);
    if (enriched.meal) {
      await saveMealWithEdit(chatId, userId, enriched.meal, thinkingId);
    }
  }
}
```

**Step 7: Add photo handling in routing before text commands**

In the main `after()` block, add the photo check early:

```typescript
// Early in after(), after voice handling, before text null check:
if (!text && message.photo && message.photo.length > 0) {
  const userId = uid ?? await getUserId(telegramId);
  if (!userId) {
    await sendMessage(chatId, "Invia prima /start per registrarti.");
    return;
  }
  saveChatMsg(userId, "user", "[foto]");
  await handlePhoto(chatId, telegramId, userId, message);
  return;
}

// Also handle photo WITH caption (text + photo):
if (text && message.photo && message.photo.length > 0) {
  const userId = uid ?? await getUserId(telegramId);
  if (!userId) {
    await sendMessage(chatId, "Invia prima /start per registrarti.");
    return;
  }
  saveChatMsg(userId, "user", `[foto] ${text}`);
  await handlePhoto(chatId, telegramId, userId, message);
  return;
}
```

**Step 8: Handle pending label/barcode quantity responses**

Update `handlePendingMealResponse` to detect when the pending context contains photo data and extract quantity:

```typescript
// In handlePendingMealResponse, after classifying the follow-up:
// Check if original context was a photo (barcode or label)
const firstMsg = pending.history[0]?.content ?? "";
if (firstMsg.startsWith("[foto barcode:")) {
  const barcodeMatch = firstMsg.match(/\[foto barcode: (\d+)\]/);
  const quantityMatch = text.match(/(\d+)/);
  if (barcodeMatch && quantityMatch) {
    const barcode = barcodeMatch[1];
    const grams = parseInt(quantityMatch[1]);
    pendingMeals.delete(telegramId);

    const nutrients = await lookupByBarcode(barcode, grams);
    if (nutrients) {
      await saveMealFromNutrients(chatId, userId, nutrients, grams, "snack", thinkingId);
      return;
    }
  }
}

if (firstMsg.startsWith("[foto etichetta:")) {
  const quantityMatch = text.match(/(\d+)/);
  if (quantityMatch) {
    try {
      const labelData = JSON.parse(firstMsg.replace("[foto etichetta: ", "").replace("]", ""));
      const grams = parseInt(quantityMatch[1]);
      pendingMeals.delete(telegramId);

      const nutrients = labelToNutrients(labelData, grams);
      await saveMealFromNutrients(chatId, userId, nutrients, grams, "snack", thinkingId, labelData.product_name);
      return;
    } catch { /* fall through to normal classification */ }
  }
}
```

**Step 9: Import NutrientResult type**

Add at the top:

```typescript
import { type NutrientResult } from "@/lib/nutrition";
```

**Step 10: Verify build**

Run: `npm run build`
Expected: Build passes.

**Step 11: Commit**

```bash
git add src/app/api/telegram/webhook/route.ts
git commit -m "feat: add photo handling, awaiting-photo state, and ParsedMeal enrichment to Telegram webhook"
```

---

### Task 7: Update Web Chat API for ParsedMeal Compatibility

**Files:**
- Modify: `src/app/api/chat/route.ts`

**Why:** The web chat API delegates to chat-processor.ts. Since we changed `enrichWithNutrition`, the web chat path needs to work with the new types too. Check that the web API route handles the new ParsedMeal type correctly.

**Step 1: Read and update the web chat route**

The web chat route calls `processMessage()` from chat-processor which calls `processFreeText`. Since we updated `processFreeText` in Task 5, the web chat should work. But verify there are no type errors and that the web chat properly handles the "ask for photo" fallback (on web, it sends a text message asking for photo, which the user can't do from web — so add a note in the response).

**Step 2: Verify build**

Run: `npm run build`
Expected: Build passes with no type errors across all routes.

**Step 3: Commit (if changes needed)**

```bash
git add src/app/api/chat/route.ts
git commit -m "fix: ensure web chat API compatible with ParsedMeal enrichment flow"
```

---

### Task 8: Integration Testing — End-to-End Verification

**Files:**
- No new files. Manual testing of flows.

**Step 1: Verify build succeeds**

Run: `npm run build`
Expected: Clean build, zero errors.

**Step 2: Verify dev server starts**

Run: `npm run dev`
Expected: Server starts on port 3000 without errors.

**Step 3: Test scenarios to verify manually (document for user)**

Create a test checklist the user can run on Telegram:

1. **Generic food:** Send "200g di petto di pollo" → should get macros from USDA
2. **Branded food:** Send "Yogurt Müller 150g" → should search OFF with brand filter
3. **Unknown branded:** Send a very niche product → should ask for photo
4. **Photo of barcode:** Send a photo of any food barcode → should lookup on OFF
5. **Photo of label:** Send a photo of a nutrition label → should extract values
6. **Photo + caption:** Send photo with "150g" caption → should process both
7. **Missing quantity:** Send "ho mangiato yogurt" → should ask quantity (no macros guessed)
8. **Chat:** Send "ciao" → should respond as chat
9. **Workout:** Send "ho allenato petto" → should register workout

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete bot precision enhancement — API-only nutrition, photo support, branded lookup"
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/lib/vision.ts` | **NEW** — GPT-4o Vision for labels + barcode + OFF barcode lookup |
| `src/lib/openfoodfacts.ts` | **MODIFIED** — Add `lookupOFFBranded()` with brand parameter |
| `src/lib/nutrition.ts` | **MODIFIED** — Dual-path lookup (branded vs generic), cross-validation, no AI fallback |
| `src/lib/openai.ts` | **MODIFIED** — Rewrite system prompt (parser only), add `ParsedMeal` type |
| `src/lib/chat-processor.ts` | **MODIFIED** — New `enrichWithNutrition` for `ParsedMeal`, strict no-fallback |
| `src/app/api/telegram/webhook/route.ts` | **MODIFIED** — Photo handling, awaiting-photo state, new enrichment flow |
| `src/app/api/chat/route.ts` | **VERIFIED** — Compatibility with new types |

## Dependency Order

```
Task 1 (vision.ts) ──────────────────────────────────┐
Task 2 (openfoodfacts branded) ──→ Task 3 (nutrition) ├──→ Task 5 (chat-processor) ──→ Task 6 (webhook) ──→ Task 7 (web chat) ──→ Task 8 (testing)
Task 4 (openai.ts prompt) ────────────────────────────┘
```

Tasks 1, 2, and 4 can be done in parallel. Task 3 depends on Task 2. Tasks 5-6 depend on 3+4. Task 7 depends on 5. Task 8 is final verification.
