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
  let results = fuse.search(q, { limit: options?.limit ?? 50 });

  if (options?.category) {
    results = results.filter((r) => r.item.category === options.category);
  }

  return results.map((r) => ({
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
