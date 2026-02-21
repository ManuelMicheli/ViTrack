import { FOODS } from "./italian-foods";

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------
export interface FoodSearchResult {
  id: string;
  name: string;
  calories_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  fiber_100g: number;
  source: "crea" | "usda" | "openfoodfacts" | "fatsecret";
}

// ---------------------------------------------------------------------------
// FatSecret OAuth2 token cache (local, lightweight)
// ---------------------------------------------------------------------------
let fsToken: string | null = null;
let fsTokenExpiresAt = 0;

async function getFatSecretToken(): Promise<string> {
  if (fsToken && Date.now() < fsTokenExpiresAt) return fsToken;

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("FatSecret credentials missing");

  const res = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "premier",
    }),
  });

  if (!res.ok) throw new Error(`FatSecret token error: ${res.status}`);

  const data = await res.json();
  fsToken = data.access_token;
  fsTokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
  return fsToken!;
}

// ---------------------------------------------------------------------------
// 1. CREA (local, instant)
// ---------------------------------------------------------------------------
async function searchCREA(query: string): Promise<FoodSearchResult[]> {
  const q = query.toLowerCase().trim();
  const results: FoodSearchResult[] = [];

  for (let i = 0; i < FOODS.length; i++) {
    const entry = FOODS[i];
    const match = entry.names.some((name) => {
      const lower = name.toLowerCase();
      return lower.includes(q) || q.includes(lower);
    });

    if (match) {
      results.push({
        id: `crea-${i}`,
        name: entry.names[0],
        calories_100g: entry.per100g.calories,
        protein_100g: entry.per100g.protein_g,
        carbs_100g: entry.per100g.carbs_g,
        fat_100g: entry.per100g.fat_g,
        fiber_100g: entry.per100g.fiber_g,
        source: "crea",
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// 2. OpenFoodFacts
// ---------------------------------------------------------------------------
async function searchOpenFoodFacts(query: string): Promise<FoodSearchResult[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const params = new URLSearchParams({
      search_terms: query,
      cc: "it",
      fields: "code,product_name,brands,nutriments",
      page_size: "8",
      json: "1",
    });

    const res = await fetch(
      `https://world.openfoodfacts.org/api/v1/search.json?${params}`,
      {
        headers: { "User-Agent": "ViTrack/1.0" },
        signal: controller.signal,
      }
    );

    clearTimeout(timer);
    if (!res.ok) return [];

    const data = await res.json();
    const products = data.products ?? [];
    const results: FoodSearchResult[] = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const n = p.nutriments;
      if (!n) continue;

      const kcal = n["energy-kcal_100g"];
      if (typeof kcal !== "number" || kcal <= 0) continue;
      if (
        typeof n.proteins_100g === "undefined" ||
        typeof n.carbohydrates_100g === "undefined" ||
        typeof n.fat_100g === "undefined"
      )
        continue;

      const displayName = p.product_name
        ? p.brands
          ? `${p.product_name} (${p.brands})`
          : p.product_name
        : null;
      if (!displayName) continue;

      results.push({
        id: `off-${i}`,
        name: displayName,
        calories_100g: Math.round(kcal),
        protein_100g: parseFloat((n.proteins_100g ?? 0).toFixed(1)),
        carbs_100g: parseFloat((n.carbohydrates_100g ?? 0).toFixed(1)),
        fat_100g: parseFloat((n.fat_100g ?? 0).toFixed(1)),
        fiber_100g: parseFloat((n.fiber_100g ?? 0).toFixed(1)),
        source: "openfoodfacts",
      });
    }

    return results;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// 3. USDA
// ---------------------------------------------------------------------------
const NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  fat: 1004,
  carbs: 1005,
  fiber: 1079,
} as const;

async function searchUSDA(query: string): Promise<FoodSearchResult[]> {
  try {
    const apiKey = process.env.USDA_API_KEY;
    if (!apiKey) return [];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const res = await fetch("https://api.nal.usda.gov/fdc/v1/foods/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        query,
        dataType: ["Foundation", "SR Legacy"],
        pageSize: 5,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    if (!res.ok) return [];

    const data = await res.json();
    const foods = data.foods ?? [];
    const results: FoodSearchResult[] = [];

    for (let i = 0; i < foods.length; i++) {
      const food = foods[i];
      const nutrients = food.foodNutrients ?? [];
      const get = (id: number) =>
        nutrients.find((n: { nutrientId: number; value: number }) => n.nutrientId === id)?.value ?? 0;

      const cal = get(NUTRIENT_IDS.calories);
      const prot = get(NUTRIENT_IDS.protein);
      const carbs = get(NUTRIENT_IDS.carbs);
      const fat = get(NUTRIENT_IDS.fat);
      const fiber = get(NUTRIENT_IDS.fiber);

      if (cal === 0 && prot === 0 && carbs === 0 && fat === 0) continue;

      results.push({
        id: `usda-${i}`,
        name: food.description ?? `USDA #${food.fdcId}`,
        calories_100g: Math.round(cal),
        protein_100g: parseFloat(prot.toFixed(1)),
        carbs_100g: parseFloat(carbs.toFixed(1)),
        fat_100g: parseFloat(fat.toFixed(1)),
        fiber_100g: parseFloat(fiber.toFixed(1)),
        source: "usda",
      });
    }

    return results;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// 4. FatSecret
// ---------------------------------------------------------------------------
async function searchFatSecret(query: string): Promise<FoodSearchResult[]> {
  try {
    const clientId = process.env.FATSECRET_CLIENT_ID;
    const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
    if (!clientId || !clientSecret) return [];

    const token = await getFatSecretToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const params = new URLSearchParams({
      method: "foods.search",
      search_expression: query,
      format: "json",
      region: "IT",
      language: "it",
      max_results: "5",
    });

    const res = await fetch(
      `https://platform.fatsecret.com/rest/foods/search/v1?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }
    );

    clearTimeout(timer);
    if (!res.ok) return [];

    const data = await res.json();
    const rawFoods = data?.foods?.food;
    if (!rawFoods) return [];

    const foods: { food_name: string; food_description?: string }[] = Array.isArray(rawFoods)
      ? rawFoods
      : [rawFoods];

    const results: FoodSearchResult[] = [];

    // FatSecret search results include a food_description string like:
    // "Per 100g - Calories: 110kcal | Fat: 1.90g | Carbs: 0.00g | Protein: 23.30g"
    const descRegex =
      /Per\s+100g\s*-\s*Calories:\s*([\d.]+)\s*kcal\s*\|\s*Fat:\s*([\d.]+)\s*g\s*\|\s*Carbs:\s*([\d.]+)\s*g\s*\|\s*Protein:\s*([\d.]+)\s*g/i;

    for (let i = 0; i < foods.length; i++) {
      const food = foods[i];
      const desc = food.food_description ?? "";
      const match = descRegex.exec(desc);
      if (!match) continue;

      const cal = parseFloat(match[1]);
      const fat = parseFloat(match[2]);
      const carbs = parseFloat(match[3]);
      const prot = parseFloat(match[4]);

      results.push({
        id: `fs-${i}`,
        name: food.food_name,
        calories_100g: Math.round(cal),
        protein_100g: parseFloat(prot.toFixed(1)),
        carbs_100g: parseFloat(carbs.toFixed(1)),
        fat_100g: parseFloat(fat.toFixed(1)),
        fiber_100g: 0, // not available in search description
        source: "fatsecret",
      });
    }

    return results;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------
function areSimilarNames(a: string, b: string): boolean {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();

  // Check inclusion
  if (!la.includes(lb) && !lb.includes(la)) return false;

  // Must share at least one word
  const wordsA = la.split(/\s+/);
  const wordsB = new Set(lb.split(/\s+/));
  return wordsA.some((w) => w.length > 1 && wordsB.has(w));
}

function deduplicateResults(results: FoodSearchResult[]): FoodSearchResult[] {
  const unique: FoodSearchResult[] = [];

  for (const result of results) {
    const isDuplicate = unique.some((existing) =>
      areSimilarNames(existing.name, result.name)
    );
    if (!isDuplicate) {
      unique.push(result);
    }
  }

  return unique;
}

// ---------------------------------------------------------------------------
// Main search function
// ---------------------------------------------------------------------------
export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const [creaResult, usdaResult, offResult, fsResult] = await Promise.allSettled([
    searchCREA(q),
    searchUSDA(q),
    searchOpenFoodFacts(q),
    searchFatSecret(q),
  ]);

  const allResults: FoodSearchResult[] = [
    ...(creaResult.status === "fulfilled" ? creaResult.value : []),
    ...(usdaResult.status === "fulfilled" ? usdaResult.value : []),
    ...(offResult.status === "fulfilled" ? offResult.value : []),
    ...(fsResult.status === "fulfilled" ? fsResult.value : []),
  ];

  const deduplicated = deduplicateResults(allResults);
  return deduplicated.slice(0, 15);
}
