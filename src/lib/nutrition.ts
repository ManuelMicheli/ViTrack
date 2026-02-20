import { lookupUSDA } from "./usda";
import { lookupOFF } from "./openfoodfacts";
import { lookupFood } from "./fatsecret";

// ---------------------------------------------------------------------------
// Shared type used by all nutrition clients
// ---------------------------------------------------------------------------
export interface NutrientResult {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  source: "usda" | "openfoodfacts" | "fatsecret" | "ai";
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
// Fetch per-100g from all 3 sources in parallel, pick best
// ---------------------------------------------------------------------------
async function fetchPer100g(
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

  if (usda && atwaterCheck(usda)) return usda;
  if (off && atwaterCheck(off)) return off;
  if (fs && atwaterCheck(fs)) return fs;
  return null;
}

// ---------------------------------------------------------------------------
// Main lookup — cache-first, then parallel APIs, deduplicates in-flight
// ---------------------------------------------------------------------------
export async function lookupNutrients(
  name: string,
  nameEn: string,
  grams: number
): Promise<NutrientResult | null> {
  const key = makeKey(name, nameEn);

  // 1. Cache hit — instant
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    if (cached.per100g) {
      const r = scaleResult(cached.per100g, grams);
      console.log(
        `[Nutrition] CACHE: "${name}" → ${r.source} | ${r.calories} kcal (${grams}g)`
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
    fetchPromise = fetchPer100g(name, nameEn);
    inFlight.set(key, fetchPromise);
  }

  try {
    const per100g = await fetchPromise;

    // Store in cache (even misses, to avoid re-fetching unknown foods)
    cache.set(key, { per100g, ts: Date.now() });

    if (per100g) {
      const r = scaleResult(per100g, grams);
      console.log(
        `[Nutrition] "${name}" → ${r.source} | ${r.calories} kcal (${grams}g)`
      );
      return r;
    }

    console.log(`[Nutrition] "${name}" → ai fallback (${grams}g)`);
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
          return fetchPer100g(name, nameEn).then((per100g) => {
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
