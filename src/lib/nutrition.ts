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
// Generic lookup — FatSecret priority, USDA+OFF as fallback
// ---------------------------------------------------------------------------
async function fetchPer100gGeneric(
  name: string,
  nameEn: string
): Promise<NutrientResult | null> {
  // Try FatSecret first (primary source)
  try {
    const fs = await lookupFood(name, 100);
    if (fs && atwaterCheck(fs)) {
      console.log(`[Nutrition] FatSecret primary hit for "${name}"`);
      return fs;
    }
  } catch {
    console.warn(`[Nutrition] FatSecret failed for "${name}", trying fallbacks`);
  }

  // Fallback: USDA + OFF in parallel
  const [usdaRes, offRes] = await Promise.allSettled([
    lookupUSDA(nameEn, 100),
    lookupOFF(name, 100),
  ]);

  const usda = usdaRes.status === "fulfilled" ? usdaRes.value : null;
  const off = offRes.status === "fulfilled" ? offRes.value : null;

  if (usda && atwaterCheck(usda)) return usda;
  if (off && atwaterCheck(off)) return off;
  return null;
}

// ---------------------------------------------------------------------------
// Branded lookup — FatSecret priority (brand prepended), OFF/USDA as fallback
// ---------------------------------------------------------------------------
async function fetchPer100gBranded(
  name: string,
  nameEn: string,
  brand: string
): Promise<NutrientResult | null> {
  // Try FatSecret first with brand (primary source)
  try {
    const fs = await lookupFood(`${brand} ${name}`, 100);
    if (fs && atwaterCheck(fs)) {
      console.log(`[Nutrition] FatSecret primary hit for "${brand} ${name}"`);
      return fs;
    }
  } catch {
    console.warn(`[Nutrition] FatSecret failed for "${brand} ${name}", trying fallbacks`);
  }

  // Fallback: OFF branded + OFF generic + USDA in parallel
  const [offBrandedRes, offRes, usdaRes] = await Promise.allSettled([
    lookupOFFBranded(name, brand, 100),
    lookupOFF(`${brand} ${name}`, 100),
    lookupUSDA(`${brand} ${nameEn}`, 100),
  ]);

  const offBranded =
    offBrandedRes.status === "fulfilled" ? offBrandedRes.value : null;
  const off = offRes.status === "fulfilled" ? offRes.value : null;
  const usda = usdaRes.status === "fulfilled" ? usdaRes.value : null;

  if (offBranded && atwaterCheck(offBranded)) return offBranded;
  if (off && atwaterCheck(off)) return off;
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

    // Fallback to CREA local database if all APIs failed — skip for branded items
    if (!brand) {
      const creaResult = lookupItalianFood(name, lookupGrams);
      if (creaResult) {
        console.log(
          `[Nutrition] CREA fallback: "${name}" → ${creaResult.calories} kcal (${lookupGrams}g${isCooked ? `, from ${grams}g cooked` : ""})`
        );
        return creaResult;
      }
    }

    console.log(
      `[Nutrition] "${name}" → NO DATA (all APIs and CREA failed)`
    );
    return null;
  } finally {
    inFlight.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Background cache warmup — pre-fetches common Italian gym foods via FatSecret.
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

async function warmupFoodEntry(name: string, nameEn: string): Promise<void> {
  const key = makeKey(name, nameEn);
  if (cache.has(key)) return;

  // Try FatSecret first (primary source for warmup)
  try {
    const fs = await lookupFood(name, 100);
    if (fs && atwaterCheck(fs)) {
      cache.set(key, { per100g: fs, ts: Date.now() });
      return;
    }
  } catch { /* fall through to generic */ }

  // Fallback to full generic pipeline
  const per100g = await fetchPer100gGeneric(name, nameEn);
  cache.set(key, { per100g, ts: Date.now() });
}

export function warmupCache(): void {
  if (warmupStarted) return;
  warmupStarted = true;

  console.log("[Nutrition] Cache warmup starting (FatSecret primary)...");

  // Process in batches of 5 to avoid rate-limit storms
  const batchSize = 5;

  (async () => {
    for (let i = 0; i < COMMON_FOODS.length; i += batchSize) {
      const batch = COMMON_FOODS.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(([name, nameEn]) => warmupFoodEntry(name, nameEn))
      );
    }
    console.log(`[Nutrition] Cache warmup done — ${cache.size} entries`);
  })();
}

export function getCacheStats(): { size: number; hitRate: string } {
  return { size: cache.size, hitRate: `${cache.size}/${COMMON_FOODS.length}` };
}
