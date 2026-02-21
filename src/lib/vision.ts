import { type NutrientResult } from "./nutrition";

// ---------------------------------------------------------------------------
// Vision analysis result types
// ---------------------------------------------------------------------------

interface LabelData {
  product_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export type VisionResult =
  | { type: "label" } & LabelData
  | { type: "barcode"; code: string }
  | { type: "both"; code: string } & LabelData
  | { type: "unreadable" };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const VISION_TIMEOUT_MS = 15_000;
const BARCODE_TIMEOUT_MS = 5_000;
const OFF_PRODUCT_URL = "https://world.openfoodfacts.org/api/v0/product";
const USER_AGENT = "ViTrack/1.0";

// ---------------------------------------------------------------------------
// Vision prompt (Italian)
// ---------------------------------------------------------------------------

const VISION_PROMPT = `Analizza questa immagine. Cerca:
1. Un'etichetta nutrizionale con valori per 100g
2. Un codice a barre EAN

Rispondi SOLO con JSON valido, senza markdown, senza commenti.

Se trovi un'etichetta nutrizionale con valori leggibili per 100g:
{"type":"label","product_name":"Nome Prodotto","calories":N,"protein_g":N,"carbs_g":N,"fat_g":N,"fiber_g":N}

Se trovi solo un codice a barre EAN leggibile:
{"type":"barcode","code":"1234567890123"}

Se trovi sia etichetta che codice a barre:
{"type":"both","product_name":"Nome Prodotto","calories":N,"protein_g":N,"carbs_g":N,"fat_g":N,"fiber_g":N,"code":"1234567890123"}

Se non riesci a leggere nulla di utile:
{"type":"unreadable"}

REGOLE:
- I valori nutrizionali DEVONO essere per 100g.
- Se l'etichetta mostra valori per porzione, converti a per 100g.
- Usa numeri, non stringhe, per i valori nutrizionali.
- Il codice a barre deve essere il numero EAN completo (8 o 13 cifre).
- Se i valori sono parzialmente illeggibili, rispondi con type "unreadable".`;

// ---------------------------------------------------------------------------
// analyzePhoto — sends image to GPT-4o Vision API
// ---------------------------------------------------------------------------

export async function analyzePhoto(imageBuffer: Buffer): Promise<VisionResult> {
  try {
    const base64 = imageBuffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: VISION_PROMPT },
              {
                type: "image_url",
                image_url: { url: dataUrl, detail: "high" },
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[Vision] API error:", res.status, errBody);
      return { type: "unreadable" };
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? "";

    if (!content) {
      console.error("[Vision] Empty response from GPT-4o");
      return { type: "unreadable" };
    }

    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleaned) as VisionResult;

    // Validate the parsed result has expected fields
    if (
      parsed.type === "label" ||
      parsed.type === "both"
    ) {
      if (
        typeof parsed.calories !== "number" ||
        typeof parsed.protein_g !== "number" ||
        typeof parsed.carbs_g !== "number" ||
        typeof parsed.fat_g !== "number"
      ) {
        console.error("[Vision] Invalid label data:", parsed);
        return { type: "unreadable" };
      }
    }

    if (parsed.type === "barcode" || parsed.type === "both") {
      if (typeof parsed.code !== "string" || !parsed.code) {
        console.error("[Vision] Invalid barcode data:", parsed);
        return { type: "unreadable" };
      }
    }

    console.log(`[Vision] Result: type=${parsed.type}`);
    return parsed;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error(`[Vision] TIMEOUT (>${VISION_TIMEOUT_MS}ms)`);
    } else {
      console.error("[Vision] analyzePhoto error:", err);
    }
    return { type: "unreadable" };
  }
}

// ---------------------------------------------------------------------------
// labelToNutrients — converts per-100g label data to NutrientResult
// ---------------------------------------------------------------------------

export function labelToNutrients(
  label: LabelData,
  grams: number
): NutrientResult {
  const scale = grams / 100;
  return {
    calories: Math.round(label.calories * scale),
    protein_g: parseFloat((label.protein_g * scale).toFixed(1)),
    carbs_g: parseFloat((label.carbs_g * scale).toFixed(1)),
    fat_g: parseFloat((label.fat_g * scale).toFixed(1)),
    fiber_g: parseFloat((label.fiber_g * scale).toFixed(1)),
    source: "openfoodfacts",
  };
}

// ---------------------------------------------------------------------------
// lookupByBarcode — looks up product on OpenFoodFacts by EAN barcode
// ---------------------------------------------------------------------------

interface OFFProductResponse {
  status: number;
  product?: {
    product_name?: string;
    nutriments?: {
      "energy-kcal_100g"?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
      fiber_100g?: number;
    };
  };
}

export async function lookupByBarcode(
  barcode: string,
  grams: number
): Promise<NutrientResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), BARCODE_TIMEOUT_MS);

    const res = await fetch(`${OFF_PRODUCT_URL}/${barcode}.json`, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.error(`[Barcode] API error for ${barcode}:`, res.status);
      return null;
    }

    const data: OFFProductResponse = await res.json();

    if (data.status !== 1 || !data.product?.nutriments) {
      console.log(`[Barcode] MISS: "${barcode}" — product not found`);
      return null;
    }

    const n = data.product.nutriments;
    const cal = n["energy-kcal_100g"];
    const prot = n.proteins_100g;
    const carbs = n.carbohydrates_100g;
    const fat = n.fat_100g;

    if (
      typeof cal !== "number" ||
      typeof prot !== "number" ||
      typeof carbs !== "number" ||
      typeof fat !== "number"
    ) {
      console.log(
        `[Barcode] MISS: "${barcode}" — incomplete nutriments`
      );
      return null;
    }

    const scale = grams / 100;
    const result: NutrientResult = {
      calories: Math.round(cal * scale),
      protein_g: parseFloat((prot * scale).toFixed(1)),
      carbs_g: parseFloat((carbs * scale).toFixed(1)),
      fat_g: parseFloat((fat * scale).toFixed(1)),
      fiber_g: parseFloat(((n.fiber_100g ?? 0) * scale).toFixed(1)),
      source: "openfoodfacts",
    };

    const productName = data.product.product_name ?? barcode;
    console.log(
      `[Barcode] HIT: "${barcode}" → "${productName}" | ` +
        `${result.calories} kcal, ${result.protein_g}P, ${result.carbs_g}C, ${result.fat_g}G (${grams}g)`
    );

    return result;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error(`[Barcode] TIMEOUT for "${barcode}" (>${BARCODE_TIMEOUT_MS}ms)`);
    } else {
      console.error(`[Barcode] Lookup failed for "${barcode}":`, err);
    }
    return null;
  }
}
