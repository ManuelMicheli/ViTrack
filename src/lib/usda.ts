import { type NutrientResult } from "./nutrition";

const USDA_API_KEY = process.env.USDA_API_KEY ?? "";
const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const TIMEOUT_MS = 3000;

// Nutrient IDs: 1008=Energy(kcal), 1003=Protein, 1004=Fat, 1005=Carbs, 1079=Fiber
const NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  fat: 1004,
  carbs: 1005,
  fiber: 1079,
} as const;

interface USDAFoodNutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: USDAFoodNutrient[];
}

interface USDASearchResponse {
  foods: USDAFood[];
  totalHits: number;
}

// ---------------------------------------------------------------------------
// Scoring — smart matching with raw/cooked/skin awareness
// ---------------------------------------------------------------------------
const COOKING_TERMS = [
  "fried", "deep-fried", "breaded", "battered", "frozen", "canned",
  "dried", "smoked", "pickled", "braised", "roasted", "baked",
  "grilled", "boiled", "steamed", "sauteed", "stewed", "microwaved",
];

export function scoreFoodMatch(query: string, foodName: string): number {
  const q = query.toLowerCase().trim();
  const f = foodName.toLowerCase().trim();

  if (q === f) return 100;

  let score = 0;

  if (f.includes(q)) score += 50;

  const queryWords = q.split(/\s+/).filter((w) => w.length > 1);
  const matchedWords = queryWords.filter((w) => f.includes(w)).length;
  if (queryWords.length > 0) {
    score += 40 * (matchedWords / queryWords.length);
  }

  if (q.includes("raw") && f.includes("raw")) score += 15;

  if (q.includes("raw")) {
    for (const term of COOKING_TERMS) {
      if (f.includes(term)) { score -= 30; break; }
    }
  }

  for (const term of COOKING_TERMS) {
    if (f.includes(term) && !q.includes(term)) score -= 15;
  }

  if (f.includes("meat and skin") && !q.includes("skin")) score -= 10;
  if ((f.includes("meat only") || f.includes("without skin")) && !q.includes("skin")) score += 5;

  const extraChars = Math.max(0, f.length - q.length - 30);
  score -= extraChars * 0.3;

  return score;
}

// ---------------------------------------------------------------------------
// Atwater validation
// ---------------------------------------------------------------------------
function validateNutrients(result: NutrientResult): boolean {
  const atwaterCal = 4 * result.protein_g + 4 * result.carbs_g + 9 * result.fat_g;
  if (result.calories === 0 && atwaterCal === 0) return true;
  if (result.calories === 0) return false;
  const ratio = atwaterCal / result.calories;
  return ratio > 0.6 && ratio < 1.4;
}

// ---------------------------------------------------------------------------
// Single search with timeout
// ---------------------------------------------------------------------------
export async function lookupUSDA(
  name: string,
  grams: number
): Promise<NutrientResult | null> {
  if (!USDA_API_KEY) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(USDA_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": USDA_API_KEY,
      },
      body: JSON.stringify({
        query: name,
        dataType: ["Foundation", "SR Legacy"],
        pageSize: 5,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.error("[USDA] Search error:", res.status);
      return null;
    }

    const data: USDASearchResponse = await res.json();
    const foods = data.foods ?? [];
    if (foods.length === 0) {
      console.log(`[USDA] MISS: "${name}" — no results`);
      return null;
    }

    // Score, prefer Foundation
    const scored = foods
      .map((f) => ({
        food: f,
        score: scoreFoodMatch(name, f.description) + (f.dataType === "Foundation" ? 5 : 0),
      }))
      .sort((a, b) => b.score - a.score);

    for (const { food, score } of scored) {
      if (score < 10) break;

      const nutrients = food.foodNutrients;
      const get = (id: number) => nutrients.find((n) => n.nutrientId === id)?.value ?? 0;

      const cal100 = get(NUTRIENT_IDS.calories);
      const prot100 = get(NUTRIENT_IDS.protein);
      const carbs100 = get(NUTRIENT_IDS.carbs);
      const fat100 = get(NUTRIENT_IDS.fat);
      if (cal100 === 0 && prot100 === 0 && carbs100 === 0 && fat100 === 0) continue;

      const scale = grams / 100;
      const result: NutrientResult = {
        calories: Math.round(cal100 * scale),
        protein_g: parseFloat((prot100 * scale).toFixed(1)),
        carbs_g: parseFloat((carbs100 * scale).toFixed(1)),
        fat_g: parseFloat((fat100 * scale).toFixed(1)),
        fiber_g: parseFloat((get(NUTRIENT_IDS.fiber) * scale).toFixed(1)),
        source: "usda",
      };

      if (!validateNutrients(result)) continue;

      console.log(
        `[USDA] HIT: "${name}" → "${food.description}" [${food.dataType}] (score: ${score}) | ` +
          `${result.calories} kcal, ${result.protein_g}P, ${result.carbs_g}C, ${result.fat_g}G (${grams}g)`
      );
      return result;
    }

    console.log(`[USDA] MISS: "${name}" — no valid match`);
    return null;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[USDA] TIMEOUT: "${name}" (>${TIMEOUT_MS}ms)`);
    } else {
      console.error(`[USDA] Lookup failed for "${name}":`, err);
    }
    return null;
  }
}
