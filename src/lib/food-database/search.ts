import Fuse from "fuse.js";
import type { FoodItem, FoodCategory } from "./types";
import { getAllFoods } from "./index";

// ---------------------------------------------------------------------------
// Popularity map — common Italian foods get a boost in search results.
// Lower number = higher priority. Items not listed default to 100.
// ---------------------------------------------------------------------------
const POPULARITY: Record<string, number> = {
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
  "riso": 4,
  "riso integrale": 5,
  "riso venere": 6,
  "riso parboiled": 7,
  // Bread & cereals
  pane: 1,
  "pane integrale": 2,
  "fiocchi d'avena": 3,
  farro: 4,
  "fette biscottate": 5,
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
// Fuse.js search instance (lazy-initialized)
// ---------------------------------------------------------------------------
let fuseInstance: Fuse<FoodItem> | null = null;

function getFuse(): Fuse<FoodItem> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(getAllFoods(), {
      keys: [
        { name: "name_it", weight: 0.45 },
        { name: "category", weight: 0.2 },
        { name: "brand", weight: 0.15 },
        { name: "name_en", weight: 0.1 },
        { name: "tags", weight: 0.05 },
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
// Results are sorted: generic first, then branded. Within each group,
// popular/well-known items come first. Deduplicates by name (keeps most
// popular variant of each food name).
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
  let results = fuse.search(q, { limit: 80 });

  if (options?.category) {
    results = results.filter((r) => r.item.category === options.category);
  }

  // Split into generic (no brand) and branded
  const generic = results.filter((r) => !r.item.brand);
  const branded = results.filter((r) => !!r.item.brand);

  // Sort each group by popularity (lower = more popular), then by fuzzy score
  const sortByPopularity = (
    a: { item: FoodItem; score?: number },
    b: { item: FoodItem; score?: number }
  ) => {
    const popA = getPopularity(a.item);
    const popB = getPopularity(b.item);
    if (popA !== popB) return popA - popB;
    return (a.score ?? 1) - (b.score ?? 1);
  };

  generic.sort(sortByPopularity);
  branded.sort(sortByPopularity);

  // Deduplicate generic by name — keep the most popular variant
  const seenGeneric = new Set<string>();
  const uniqueGeneric = generic.filter((r) => {
    const key = r.item.name_it.toLowerCase();
    if (seenGeneric.has(key)) return false;
    seenGeneric.add(key);
    return true;
  });

  // Deduplicate branded by name+brand
  const seenBranded = new Set<string>();
  const uniqueBranded = branded.filter((r) => {
    const key = `${r.item.brand?.toLowerCase()}|${r.item.name_it.toLowerCase()}`;
    if (seenBranded.has(key)) return false;
    seenBranded.add(key);
    return true;
  });

  const sorted = [...uniqueGeneric, ...uniqueBranded];
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
