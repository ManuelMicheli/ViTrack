import { lookupUSDA } from "./usda";
import { lookupOFF, lookupOFFBranded } from "./openfoodfacts";
import { lookupFood } from "./fatsecret";
import { lookupItalianFood } from "./italian-foods";
import { adjustForCooking } from "./cooking-factors";

// ---------------------------------------------------------------------------
// Shared type used by all nutrition clients
// ---------------------------------------------------------------------------
export interface NutrientResult {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  source: "usda" | "openfoodfacts" | "fatsecret" | "ai" | "crea";
}

// ---------------------------------------------------------------------------
// PER-100g CACHE — stores base values, scales on every request.
// One lookup for "chicken breast" serves any gram amount forever.
// ---------------------------------------------------------------------------
interface CacheEntry {
  per100g: NutrientResult | null; // null = all sources missed
  ts: number;
}

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<NutrientResult | null>>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function makeKey(name: string, nameEn: string): string {
  return `${name.toLowerCase().trim()}|${nameEn.toLowerCase().trim()}`;
}

// ---------------------------------------------------------------------------
// Atwater sanity check — calories ≈ 4P + 4C + 9F
// ---------------------------------------------------------------------------
function atwaterCheck(r: NutrientResult): boolean {
  const expected = 4 * r.protein_g + 4 * r.carbs_g + 9 * r.fat_g;
  if (r.calories === 0 && expected === 0) return true;
  if (r.calories === 0) return false;
  const ratio = expected / r.calories;
  return ratio > 0.55 && ratio < 1.45;
}

// ---------------------------------------------------------------------------
// Scale cached per-100g values to requested grams
// ---------------------------------------------------------------------------
function scaleResult(
  per100g: NutrientResult,
  grams: number
): NutrientResult {
  const s = grams / 100;
  return {
    calories: Math.round(per100g.calories * s),
    protein_g: parseFloat((per100g.protein_g * s).toFixed(1)),
    carbs_g: parseFloat((per100g.carbs_g * s).toFixed(1)),
    fat_g: parseFloat((per100g.fat_g * s).toFixed(1)),
    fiber_g: parseFloat((per100g.fiber_g * s).toFixed(1)),
    source: per100g.source,
  };
}

// ---------------------------------------------------------------------------
// Generic lookup — USDA priority, queries all 3 sources in parallel
// Cross-validates when 2+ APIs agree within 15% on calories
// ---------------------------------------------------------------------------
async function fetchPer100gGeneric(
  name: string,
  nameEn: string
): Promise<NutrientResult | null> {
  const [usdaRes, offRes, fsRes] = await Promise.allSettled([
    lookupUSDA(nameEn, 100),
    lookupOFF(name, 100),
    lookupFood(name, 100),
  ]);

  const usda = usdaRes.status === "fulfilled" ? usdaRes.value : null;
  const off = offRes.status === "fulfilled" ? offRes.value : null;
  const fs = fsRes.status === "fulfilled" ? fsRes.value : null;

  const valid = [usda, off, fs].filter(
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

  if (usda && atwaterCheck(usda)) return usda;
  if (off && atwaterCheck(off)) return off;
  if (fs && atwaterCheck(fs)) return fs;
  return null;
}

// ---------------------------------------------------------------------------
// Branded lookup — OpenFoodFacts priority, prepends brand to queries
// Cross-validates when 2+ APIs agree within 15% on calories
// ---------------------------------------------------------------------------
async function fetchPer100gBranded(
  name: string,
  nameEn: string,
  brand: string
): Promise<NutrientResult | null> {
  const [offBrandedRes, offRes, fsRes, usdaRes] = await Promise.allSettled([
    lookupOFFBranded(name, brand, 100),
    lookupOFF(`${brand} ${name}`, 100),
    lookupFood(`${brand} ${name}`, 100),
    lookupUSDA(`${brand} ${nameEn}`, 100),
  ]);

  const offBranded =
    offBrandedRes.status === "fulfilled" ? offBrandedRes.value : null;
  const off = offRes.status === "fulfilled" ? offRes.value : null;
  const fs = fsRes.status === "fulfilled" ? fsRes.value : null;
  const usda = usdaRes.status === "fulfilled" ? usdaRes.value : null;

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

  if (offBranded && atwaterCheck(offBranded)) return offBranded;
  if (off && atwaterCheck(off)) return off;
  if (fs && atwaterCheck(fs)) return fs;
  if (usda && atwaterCheck(usda)) return usda;
  return null;
}

// ---------------------------------------------------------------------------
// Main lookup — cache-first, then parallel APIs, deduplicates in-flight
// ---------------------------------------------------------------------------
export async function lookupNutrients(
  name: string,
  nameEn: string,
  grams: number,
  brand?: string | null,
  isCooked?: boolean
): Promise<NutrientResult | null> {
  // Cooking adjustment — convert cooked grams to raw equivalent
  let lookupGrams = grams;
  if (isCooked) {
    const { adjustedGrams } = adjustForCooking(name, grams, true);
    lookupGrams = adjustedGrams;
  }

  // Try CREA local database first (instant, no API calls) — skip for branded items
  if (!brand) {
    const creaResult = lookupItalianFood(name, lookupGrams);
    if (creaResult) {
      console.log(
        `[Nutrition] CREA: "${name}" → ${creaResult.calories} kcal (${lookupGrams}g${isCooked ? `, from ${grams}g cooked` : ""})`
      );
      return creaResult;
    }
  }

  const key = makeKey(name, nameEn);

  // 1. Cache hit — instant
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    if (cached.per100g) {
      const r = scaleResult(cached.per100g, lookupGrams);
      console.log(
        `[Nutrition] CACHE: "${name}" → ${r.source} | ${r.calories} kcal (${lookupGrams}g)`
      );
      return r;
    }
    // Cached miss — all sources missed last time, skip APIs
    return null;
  }

  // 2. In-flight deduplication — if someone else is already fetching this food,
  //    wait for their result instead of making duplicate API calls
  let fetchPromise = inFlight.get(key);
  if (!fetchPromise) {
    fetchPromise = brand
      ? fetchPer100gBranded(name, nameEn, brand)
      : fetchPer100gGeneric(name, nameEn);
    inFlight.set(key, fetchPromise);
  }

  try {
    const per100g = await fetchPromise;

    // Store in cache (even misses, to avoid re-fetching unknown foods)
    cache.set(key, { per100g, ts: Date.now() });

    if (per100g) {
      const r = scaleResult(per100g, lookupGrams);
      console.log(
        `[Nutrition] "${name}" → ${r.source} | ${r.calories} kcal (${lookupGrams}g)`
      );
      return r;
    }

    console.log(
      `[Nutrition] "${name}" → NO DATA (all APIs failed, no fallback)`
    );
    return null;
  } finally {
    inFlight.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Background cache warmup — pre-fetches common Italian gym foods.
// Called once on first request; fire-and-forget, doesn't block anything.
// ---------------------------------------------------------------------------
const COMMON_FOODS: [string, string][] = [
  ["petto di pollo", "chicken breast meat raw"],
  ["riso bianco", "white rice raw"],
  ["pasta", "pasta dry"],
  ["uovo", "egg whole raw"],
  ["tonno", "tuna yellowfin raw"],
  ["salmone", "atlantic salmon raw"],
  ["patate", "potato raw"],
  ["avena", "oats raw"],
  ["pane", "white bread"],
  ["olio d'oliva", "olive oil"],
  ["mozzarella", "mozzarella cheese"],
  ["yogurt greco", "greek yogurt"],
  ["banana", "banana raw"],
  ["riso integrale", "brown rice raw"],
  ["petto di tacchino", "turkey breast raw"],
  ["merluzzo", "cod atlantic raw"],
  ["mandorle", "almonds"],
  ["lenticchie", "lentils dry"],
  ["ceci", "chickpeas dry"],
  ["broccoli", "broccoli raw"],
];

let warmupStarted = false;

export function warmupCache(): void {
  if (warmupStarted) return;
  warmupStarted = true;

  console.log("[Nutrition] Cache warmup starting...");

  // Process in batches of 5 to avoid rate-limit storms
  const batchSize = 5;

  (async () => {
    for (let i = 0; i < COMMON_FOODS.length; i += batchSize) {
      const batch = COMMON_FOODS.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(([name, nameEn]) => {
          const key = makeKey(name, nameEn);
          if (cache.has(key)) return Promise.resolve();
          return fetchPer100gGeneric(name, nameEn).then((per100g) => {
            cache.set(key, { per100g, ts: Date.now() });
          });
        })
      );
    }
    console.log(`[Nutrition] Cache warmup done — ${cache.size} entries`);
  })();
}

export function getCacheStats(): { size: number; hitRate: string } {
  return { size: cache.size, hitRate: `${cache.size}/${COMMON_FOODS.length}` };
}
