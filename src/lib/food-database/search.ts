import Fuse from "fuse.js";
import type { FoodItem, FoodCategory } from "./types";
import { getAllFoods } from "./index";

// ---------------------------------------------------------------------------
// Popularity map — common Italian foods get a boost in search results.
// Lower number = higher priority. Items not listed default to 100.
// ---------------------------------------------------------------------------
const POPULARITY: Record<string, number> = {
  // Generic categories — absolute top priority
  pasta: 0,
  "pasta integrale": 0,
  riso: 0,
  "riso integrale": 0,
  pane: 0,
  "pane integrale": 0,
  // Pasta shapes — most popular first
  spaghetti: 1,
  penne: 2,
  "penne rigate": 2,
  rigatoni: 3,
  fusilli: 4,
  tagliatelle: 5,
  farfalle: 6,
  linguine: 7,
  bucatini: 8,
  orecchiette: 9,
  maccheroni: 10,
  paccheri: 11,
  lasagne: 12,
  conchiglie: 13,
  // Rice
  "riso carnaroli": 1,
  "riso arborio": 2,
  "riso basmati": 3,
  "riso venere": 4,
  "riso parboiled": 5,
  // Bread & cereals
  "fiocchi d'avena": 1,
  farro: 2,
  "fette biscottate": 3,
  // Meat
  "petto di pollo": 1,
  "petto di tacchino": 2,
  "macinato di manzo": 3,
  "bresaola": 4,
  "prosciutto crudo": 5,
  "prosciutto cotto": 6,
  "fettina di vitello": 7,
  // Fish
  "tonno al naturale": 1,
  salmone: 2,
  merluzzo: 3,
  orata: 4,
  branzino: 5,
  gamberi: 6,
  // Dairy
  mozzarella: 1,
  "yogurt greco": 2,
  "parmigiano reggiano": 3,
  ricotta: 4,
  "latte intero": 5,
  "latte scremato": 6,
  // Eggs
  uovo: 1,
  albume: 2,
  // Vegetables
  pomodoro: 1,
  insalata: 2,
  zucchine: 3,
  spinaci: 4,
  broccoli: 5,
  carote: 6,
  peperoni: 7,
  // Fruit
  banana: 1,
  mela: 2,
  arancia: 3,
  fragole: 4,
  kiwi: 5,
  // Legumes
  lenticchie: 1,
  ceci: 2,
  "fagioli borlotti": 3,
  // Nuts & seeds
  mandorle: 1,
  noci: 2,
  "burro di arachidi": 3,
  // Condiments
  "olio extravergine d'oliva": 1,
  "olio extravergine di oliva": 1,
  // Beverages
  "latte di mandorla": 1,
  "latte di soia": 2,
  // Snacks
  "cioccolato fondente": 1,
  // Potatoes
  patata: 1,
  "patata dolce": 2,
};

function getPopularity(food: FoodItem): number {
  const name = food.name_it.toLowerCase();
  if (POPULARITY[name] !== undefined) return POPULARITY[name];
  // Partial match — if name starts with a popular term
  for (const [key, val] of Object.entries(POPULARITY)) {
    if (name.startsWith(key) || key.startsWith(name)) return val + 20;
  }
  return 100;
}

// ---------------------------------------------------------------------------
// Fuse.js search instance (lazy-initialized) — used only as fallback
// ---------------------------------------------------------------------------
let fuseInstance: Fuse<FoodItem> | null = null;

function getFuse(): Fuse<FoodItem> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(getAllFoods(), {
      keys: [
        { name: "name_it", weight: 0.6 },
        { name: "brand", weight: 0.2 },
        { name: "name_en", weight: 0.1 },
        { name: "tags", weight: 0.05 },
        { name: "subcategory", weight: 0.05 },
      ],
      threshold: 0.25, // strict — avoid false matches
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
// Phase 1: Exact / prefix / contains matching on name_it, brand, category.
// This is the primary search — instant and precise.
// ---------------------------------------------------------------------------
function exactSearch(query: string, allFoods: FoodItem[]): FoodItem[] {
  const q = query.toLowerCase();

  // Tier 1: name_it is exactly the query (e.g. "pasta" → "Pasta")
  const exact: FoodItem[] = [];
  // Tier 2: name_it starts with the query (e.g. "past" → "Pasta Integrale")
  const startsWith: FoodItem[] = [];
  // Tier 3: any word in name_it starts with the query (e.g. "pollo" → "Petto di pollo")
  const wordMatch: FoodItem[] = [];
  // Tier 4: name_it contains query anywhere, or category matches
  const contains: FoodItem[] = [];
  // Tier 5: brand matches
  const brandMatch: FoodItem[] = [];

  for (const food of allFoods) {
    const name = food.name_it.toLowerCase();
    const brand = food.brand?.toLowerCase() ?? "";

    if (name === q) {
      exact.push(food);
    } else if (name.startsWith(q)) {
      startsWith.push(food);
    } else if (
      name.split(/[\s/'()]+/).some((word) => word.startsWith(q))
    ) {
      wordMatch.push(food);
    } else if (name.includes(q) || food.category === q) {
      contains.push(food);
    } else if (brand.includes(q)) {
      brandMatch.push(food);
    }
  }

  return [...exact, ...startsWith, ...wordMatch, ...contains, ...brandMatch];
}

// ---------------------------------------------------------------------------
// Sort + deduplicate results: generic first (sorted by popularity), then
// branded (sorted by popularity). Deduplicate by name within each group.
// ---------------------------------------------------------------------------
function sortAndDeduplicate(
  items: FoodItem[],
  limit: number
): FoodSearchResultLocal[] {
  const generic = items.filter((f) => !f.brand);
  const branded = items.filter((f) => !!f.brand);

  const byPopularity = (a: FoodItem, b: FoodItem) =>
    getPopularity(a) - getPopularity(b);

  generic.sort(byPopularity);
  branded.sort(byPopularity);

  // Deduplicate generic by name
  const seenGeneric = new Set<string>();
  const uniqueGeneric = generic.filter((f) => {
    const key = f.name_it.toLowerCase();
    if (seenGeneric.has(key)) return false;
    seenGeneric.add(key);
    return true;
  });

  // Deduplicate branded by name+brand
  const seenBranded = new Set<string>();
  const uniqueBranded = branded.filter((f) => {
    const key = `${f.brand?.toLowerCase()}|${f.name_it.toLowerCase()}`;
    if (seenBranded.has(key)) return false;
    seenBranded.add(key);
    return true;
  });

  return [...uniqueGeneric, ...uniqueBranded]
    .slice(0, limit)
    .map((item) => ({ item, score: 0 }));
}

// ---------------------------------------------------------------------------
// Main search function — two-phase: exact first, fuzzy fallback
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

  const limit = options?.limit ?? 6;
  let allFoods = getAllFoods();

  if (options?.category) {
    allFoods = allFoods.filter((f) => f.category === options.category);
  }

  // Phase 1: exact / prefix / contains matching
  const exactResults = exactSearch(q, allFoods);

  if (exactResults.length >= limit) {
    return sortAndDeduplicate(exactResults, limit);
  }

  // Phase 2: fuzzy fallback — fill remaining slots
  const exactIds = new Set(exactResults.map((f) => f.id));
  const fuse = getFuse();
  const fuseResults = fuse
    .search(q, { limit: 30 })
    .filter((r) => !exactIds.has(r.item.id))
    .map((r) => r.item);

  if (options?.category) {
    const cat = options.category;
    const filtered = fuseResults.filter((f) => f.category === cat);
    return sortAndDeduplicate([...exactResults, ...filtered], limit);
  }

  return sortAndDeduplicate([...exactResults, ...fuseResults], limit);
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
