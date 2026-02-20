import { type NutrientResult } from "./nutrition";

const FATSECRET_CLIENT_ID = process.env.FATSECRET_CLIENT_ID!;
const FATSECRET_CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET!;
const TOKEN_URL = "https://oauth.fatsecret.com/connect/token";
const API_BASE = "https://platform.fatsecret.com/rest";
const TIMEOUT_MS = 3000;

// ---------------------------------------------------------------------------
// OAuth2 token cache (Client Credentials flow, ~24h lifetime)
// ---------------------------------------------------------------------------
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: FATSECRET_CLIENT_ID,
      client_secret: FATSECRET_CLIENT_SECRET,
      scope: "premier",
    }),
  });

  if (!res.ok) {
    console.error("[FatSecret] Token error:", res.status);
    throw new Error("Failed to obtain FatSecret token");
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
  return cachedToken!;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------
function scoreFoodMatch(query: string, foodName: string): number {
  const q = query.toLowerCase().trim();
  const f = foodName.toLowerCase().trim();
  if (q === f) return 100;

  let score = 0;
  if (f.includes(q)) score += 50;

  const queryWords = q.split(/\s+/);
  const matchedWords = queryWords.filter((w) => f.includes(w)).length;
  if (queryWords.length > 0) score += 30 * (matchedWords / queryWords.length);

  const penalties = ["fritto", "impanato", "surgelato", "fried", "breaded", "frozen"];
  for (const p of penalties) {
    if (f.includes(p) && !q.includes(p)) score -= 20;
  }

  const extraChars = Math.max(0, f.length - q.length - 20);
  score -= extraChars * 0.5;

  return score;
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
interface FatSecretServing {
  serving_description?: string;
  metric_serving_amount?: string;
  metric_serving_unit?: string;
  calories?: string;
  protein?: string;
  carbohydrate?: string;
  fat?: string;
  fiber?: string;
}

interface FatSecretFood {
  food_id: string;
  food_name: string;
  servings?: { serving: FatSecretServing | FatSecretServing[] };
}

// ---------------------------------------------------------------------------
// Extract per-100g nutrients
// ---------------------------------------------------------------------------
function extractPer100g(servings: FatSecretServing[]): FatSecretServing | null {
  const per100g = servings.find(
    (s) =>
      s.metric_serving_unit === "g" &&
      parseFloat(s.metric_serving_amount ?? "0") === 100
  );
  if (per100g) return per100g;

  const gramServing = servings.find(
    (s) =>
      s.metric_serving_unit === "g" &&
      parseFloat(s.metric_serving_amount ?? "0") > 0
  );
  if (!gramServing) return null;

  const servingGrams = parseFloat(gramServing.metric_serving_amount!);
  const factor = 100 / servingGrams;

  return {
    ...gramServing,
    metric_serving_amount: "100",
    calories: String(parseFloat(gramServing.calories ?? "0") * factor),
    protein: String(parseFloat(gramServing.protein ?? "0") * factor),
    carbohydrate: String(parseFloat(gramServing.carbohydrate ?? "0") * factor),
    fat: String(parseFloat(gramServing.fat ?? "0") * factor),
    fiber: String(parseFloat(gramServing.fiber ?? "0") * factor),
  };
}

// ---------------------------------------------------------------------------
// lookupFood — single search + best match detail only + timeout
// ---------------------------------------------------------------------------
export async function lookupFood(
  name: string,
  grams: number
): Promise<NutrientResult | null> {
  try {
    const token = await getAccessToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Search
    const searchParams = new URLSearchParams({
      method: "foods.search",
      search_expression: name,
      format: "json",
      region: "IT",
      language: "it",
      max_results: "5",
    });

    const searchRes = await fetch(`${API_BASE}/foods/search/v1?${searchParams}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    if (!searchRes.ok) {
      clearTimeout(timer);
      console.error("[FatSecret] Search error:", searchRes.status);
      return null;
    }

    const searchData = await searchRes.json();
    const rawFoods = searchData?.foods?.food;
    if (!rawFoods) {
      clearTimeout(timer);
      console.log(`[FatSecret] MISS: "${name}" — no results`);
      return null;
    }

    const foods: FatSecretFood[] = Array.isArray(rawFoods) ? rawFoods : [rawFoods];

    // Pick the single best match
    const best = foods
      .map((f) => ({ food: f, score: scoreFoodMatch(name, f.food_name) }))
      .sort((a, b) => b.score - a.score)[0];

    if (!best || best.score < 5) {
      clearTimeout(timer);
      console.log(`[FatSecret] MISS: "${name}" — low score`);
      return null;
    }

    // Get detail for best match only
    const detailParams = new URLSearchParams({
      method: "food.get.v4",
      food_id: best.food.food_id,
      format: "json",
      region: "IT",
      language: "it",
    });

    const detailRes = await fetch(`${API_BASE}/food/v4?${detailParams}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!detailRes.ok) {
      console.error("[FatSecret] Detail error:", detailRes.status);
      return null;
    }

    const detailData = await detailRes.json();
    const detail: FatSecretFood | null = detailData?.food ?? null;
    if (!detail?.servings) return null;

    const servings = Array.isArray(detail.servings.serving)
      ? detail.servings.serving
      : [detail.servings.serving];

    const per100g = extractPer100g(servings);
    if (!per100g) return null;

    const scale = grams / 100;
    const result: NutrientResult = {
      calories: Math.round(parseFloat(per100g.calories ?? "0") * scale),
      protein_g: parseFloat((parseFloat(per100g.protein ?? "0") * scale).toFixed(1)),
      carbs_g: parseFloat((parseFloat(per100g.carbohydrate ?? "0") * scale).toFixed(1)),
      fat_g: parseFloat((parseFloat(per100g.fat ?? "0") * scale).toFixed(1)),
      fiber_g: parseFloat((parseFloat(per100g.fiber ?? "0") * scale).toFixed(1)),
      source: "fatsecret",
    };

    console.log(
      `[FatSecret] HIT: "${name}" → "${best.food.food_name}" (score: ${best.score}) | ${result.calories} kcal (${grams}g)`
    );
    return result;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[FatSecret] TIMEOUT: "${name}" (>${TIMEOUT_MS}ms)`);
    } else {
      console.error(`[FatSecret] Lookup failed for "${name}":`, err);
    }
    return null;
  }
}
