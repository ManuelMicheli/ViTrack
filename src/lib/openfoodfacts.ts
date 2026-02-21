import { type NutrientResult } from "./nutrition";

const OFF_SEARCH_URL = "https://world.openfoodfacts.org/api/v1/search.json";
const USER_AGENT = "ViTrack/1.0";
const TIMEOUT_MS = 3000;

interface OFFNutriments {
  "energy-kcal_100g"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
}

interface OFFProduct {
  code: string;
  product_name?: string;
  brands?: string;
  nutriments?: OFFNutriments;
}

interface OFFSearchResponse {
  products: OFFProduct[];
  count: number;
}

function hasCompleteNutriments(n?: OFFNutriments): boolean {
  if (!n) return false;
  return (
    typeof n["energy-kcal_100g"] === "number" &&
    n["energy-kcal_100g"] > 0 &&
    typeof n.proteins_100g === "number" &&
    typeof n.carbohydrates_100g === "number" &&
    typeof n.fat_100g === "number"
  );
}

function atwaterValid(n: OFFNutriments): boolean {
  const cal = n["energy-kcal_100g"] ?? 0;
  const p = n.proteins_100g ?? 0;
  const c = n.carbohydrates_100g ?? 0;
  const f = n.fat_100g ?? 0;
  if (cal === 0) return false;
  const expected = 4 * p + 4 * c + 9 * f;
  const ratio = expected / cal;
  return ratio > 0.55 && ratio < 1.45;
}

function scoreProduct(product: OFFProduct, query: string): number {
  const n = product.nutriments;
  if (!n || !hasCompleteNutriments(n) || !atwaterValid(n)) return -1;

  let score = 0;
  if (typeof n.fiber_100g === "number") score += 5;

  const pName = (product.product_name ?? "").toLowerCase();
  const q = query.toLowerCase();
  if (pName.includes(q)) score += 20;
  const queryWords = q.split(/\s+/).filter((w) => w.length > 1);
  const matched = queryWords.filter((w) => pName.includes(w)).length;
  if (queryWords.length > 0) score += 15 * (matched / queryWords.length);

  return score;
}

export async function lookupOFF(
  name: string,
  grams: number
): Promise<NutrientResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const params = new URLSearchParams({
      search_terms: name,
      cc: "it",
      fields: "code,product_name,brands,nutriments",
      page_size: "5",
      json: "1",
    });

    const res = await fetch(`${OFF_SEARCH_URL}?${params}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.error("[OFF] Search error:", res.status);
      return null;
    }

    const data: OFFSearchResponse = await res.json();
    const products = data.products ?? [];
    if (products.length === 0) {
      console.log(`[OFF] MISS: "${name}" — no results`);
      return null;
    }

    const scored = products
      .map((p) => ({ product: p, score: scoreProduct(p, name) }))
      .filter((s) => s.score >= 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      console.log(`[OFF] MISS: "${name}" — no valid nutriments`);
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
      `[OFF] HIT: "${name}" → "${label}" | ` +
        `${result.calories} kcal, ${result.protein_g}P, ${result.carbs_g}C, ${result.fat_g}G (${grams}g)`
    );
    return result;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[OFF] TIMEOUT: "${name}" (>${TIMEOUT_MS}ms)`);
    } else {
      console.error(`[OFF] Lookup failed for "${name}":`, err);
    }
    return null;
  }
}

export async function lookupOFFBranded(
  productName: string,
  brand: string,
  grams: number
): Promise<NutrientResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

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
      console.log(
        `[OFF-Branded] MISS: "${brand} ${productName}" — no results`
      );
      return null;
    }

    const brandLower = brand.toLowerCase();
    const scored = products
      .map((p) => {
        let score = scoreProduct(p, `${brand} ${productName}`);
        if (score < 0) return { product: p, score };
        // Brand boost: reward products whose brands field contains the query brand
        const productBrands = (p.brands ?? "").toLowerCase();
        if (productBrands.includes(brandLower)) {
          score += 25;
        }
        return { product: p, score };
      })
      .filter((s) => s.score >= 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      console.log(
        `[OFF-Branded] MISS: "${brand} ${productName}" — no valid nutriments`
      );
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
      console.warn(
        `[OFF-Branded] TIMEOUT: "${brand} ${productName}" (>${TIMEOUT_MS}ms)`
      );
    } else {
      console.error(
        `[OFF-Branded] Lookup failed for "${brand} ${productName}":`,
        err
      );
    }
    return null;
  }
}
