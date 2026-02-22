import Fuse from "fuse.js";
import type { FoodItem, FoodCategory } from "./types";
import { getAllFoods } from "./index";

// ---------------------------------------------------------------------------
// Fuse.js search instance (lazy-initialized)
// ---------------------------------------------------------------------------
let fuseInstance: Fuse<FoodItem> | null = null;

function getFuse(): Fuse<FoodItem> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(getAllFoods(), {
      keys: [
        { name: "name_it", weight: 0.5 },
        { name: "brand", weight: 0.2 },
        { name: "name_en", weight: 0.15 },
        { name: "tags", weight: 0.1 },
        { name: "subcategory", weight: 0.05 },
      ],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }
  return fuseInstance;
}

// ---------------------------------------------------------------------------
// Search result type
// ---------------------------------------------------------------------------
export interface FoodSearchResultLocal {
  item: FoodItem;
  score: number;
}

// ---------------------------------------------------------------------------
// Main search function — fuzzy, instant, client-side
// ---------------------------------------------------------------------------
export function searchLocalFoods(
  query: string,
  options?: {
    category?: FoodCategory;
    limit?: number;
  }
): FoodSearchResultLocal[] {
  const q = query.trim();
  if (!q) return [];

  const fuse = getFuse();
  // Fetch more than needed so we can re-sort and still hit the limit
  let results = fuse.search(q, { limit: 60 });

  if (options?.category) {
    results = results.filter((r) => r.item.category === options.category);
  }

  // Sort: generic items (no brand) first, then branded — within each group
  // keep the original fuzzy-score ordering
  const generic = results.filter((r) => !r.item.brand);
  const branded = results.filter((r) => !!r.item.brand);
  const sorted = [...generic, ...branded];

  const limit = options?.limit ?? 6;

  return sorted.slice(0, limit).map((r) => ({
    item: r.item,
    score: r.score ?? 1,
  }));
}

// ---------------------------------------------------------------------------
// Get all foods in a category
// ---------------------------------------------------------------------------
export function getFoodsByCategory(category: FoodCategory): FoodItem[] {
  return getAllFoods().filter((f) => f.category === category);
}

// ---------------------------------------------------------------------------
// Get a single food by ID
// ---------------------------------------------------------------------------
export function getFoodById(id: string): FoodItem | undefined {
  return getAllFoods().find((f) => f.id === id);
}

// ---------------------------------------------------------------------------
// Look up a food by Italian name — exact match first, then fuzzy.
// Returns the best match with per-100g nutrition data, or null.
// Used by nutrition.ts to resolve foods from the structured food-database
// before falling back to external APIs.
// ---------------------------------------------------------------------------
export interface FoodDatabaseNutrition {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export function lookupFoodDatabase(
  name: string,
  brand?: string | null
): { item: FoodItem; per100g: FoodDatabaseNutrition } | null {
  const foods = getAllFoods();
  const lowerName = name.toLowerCase().trim();

  // 1. If brand specified, try exact brand + name match
  if (brand) {
    const lowerBrand = brand.toLowerCase().trim();
    const brandMatch = foods.find(
      (f) =>
        f.brand?.toLowerCase() === lowerBrand &&
        f.name_it.toLowerCase() === lowerName
    );
    if (brandMatch) {
      return {
        item: brandMatch,
        per100g: {
          calories: brandMatch.calories_per_100g,
          protein_g: brandMatch.protein_per_100g,
          carbs_g: brandMatch.carbs_per_100g,
          fat_g: brandMatch.fat_per_100g,
          fiber_g: brandMatch.fiber_per_100g,
        },
      };
    }
  }

  // 2. Exact name match (generic, no brand)
  const exactGeneric = foods.find(
    (f) => !f.brand && f.name_it.toLowerCase() === lowerName
  );
  if (exactGeneric) {
    return {
      item: exactGeneric,
      per100g: {
        calories: exactGeneric.calories_per_100g,
        protein_g: exactGeneric.protein_per_100g,
        carbs_g: exactGeneric.carbs_per_100g,
        fat_g: exactGeneric.fat_per_100g,
        fiber_g: exactGeneric.fiber_per_100g,
      },
    };
  }

  // 3. Fuzzy match via Fuse.js (top result only, strict threshold)
  const fuse = getFuse();
  const results = fuse.search(brand ? `${brand} ${name}` : name, { limit: 1 });
  if (results.length > 0 && (results[0].score ?? 1) < 0.25) {
    const match = results[0].item;
    return {
      item: match,
      per100g: {
        calories: match.calories_per_100g,
        protein_g: match.protein_per_100g,
        carbs_g: match.carbs_per_100g,
        fat_g: match.fat_per_100g,
        fiber_g: match.fiber_per_100g,
      },
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Get suggested foods based on a macro deficit
// ---------------------------------------------------------------------------
export type MacroType = "protein" | "carbs" | "fat";

export function getSuggestedFoods(
  deficitMacro: MacroType,
  limit: number = 5
): FoodItem[] {
  const foods = getAllFoods();

  // Filter to generic items only (no brands) for cleaner suggestions
  const generic = foods.filter((f) => !f.brand);

  // Sort by the deficit macro per 100g (descending)
  const key =
    deficitMacro === "protein"
      ? "protein_per_100g"
      : deficitMacro === "carbs"
        ? "carbs_per_100g"
        : "fat_per_100g";

  const sorted = [...generic].sort((a, b) => b[key] - a[key]);

  // Deduplicate by name (some items have similar names across categories)
  const seen = new Set<string>();
  const unique: FoodItem[] = [];
  for (const food of sorted) {
    const normalized = food.name_it.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(food);
    }
    if (unique.length >= limit) break;
  }

  return unique;
}
