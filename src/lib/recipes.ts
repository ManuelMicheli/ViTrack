import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface RecipeItem {
  name: string;
  name_en: string;
  quantity_g: number;
  brand: string | null;
  is_branded: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  items: RecipeItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  meal_type: string;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------
export async function saveRecipe(
  userId: string,
  name: string,
  items: RecipeItem[],
  nutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  },
  mealType: string
): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      user_id: userId,
      name,
      items,
      total_calories: Math.round(nutrition.calories),
      total_protein_g: parseFloat(nutrition.protein_g.toFixed(1)),
      total_carbs_g: parseFloat(nutrition.carbs_g.toFixed(1)),
      total_fat_g: parseFloat(nutrition.fat_g.toFixed(1)),
      total_fiber_g: parseFloat(nutrition.fiber_g.toFixed(1)),
      meal_type: mealType,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("saveRecipe error:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    items: data.items as RecipeItem[],
    total_calories: data.total_calories,
    total_protein_g: parseFloat(data.total_protein_g),
    total_carbs_g: parseFloat(data.total_carbs_g),
    total_fat_g: parseFloat(data.total_fat_g),
    total_fiber_g: parseFloat(data.total_fiber_g),
    meal_type: data.meal_type,
  };
}

export async function findRecipeByName(
  userId: string,
  text: string
): Promise<{ recipe: Recipe; portions: number } | null> {
  const { data } = await supabase
    .from("recipes")
    .select("*")
    .eq("user_id", userId);

  if (!data || data.length === 0) return null;

  const lower = text.toLowerCase().trim();

  // Extract portion multiplier: "pancake 2 porzioni", "pancake x3", "pancake 2"
  const portionMatch = lower.match(/(\d+)\s*(?:porzioni|porzione|x)\s*$/) ||
    lower.match(/x\s*(\d+)\s*$/) ||
    lower.match(/^(.+?)\s+(\d+)$/);

  let portions = 1;
  let searchText = lower;

  if (portionMatch) {
    // For the third regex pattern, the number is in group 2
    const numStr = portionMatch[2] || portionMatch[1];
    const num = parseInt(numStr);
    if (num >= 1 && num <= 20) {
      portions = num;
      // Remove the portion part from the search text
      searchText = lower
        .replace(/\s*(\d+)\s*(?:porzioni|porzione|x)\s*$/i, "")
        .replace(/\s*x\s*\d+\s*$/i, "")
        .replace(/\s+\d+\s*$/, "")
        .trim();
    }
  }

  // Find matching recipe — exact match on name first, then contains
  for (const row of data) {
    const recipeName = row.name.toLowerCase();
    if (searchText === recipeName) {
      return {
        recipe: rowToRecipe(row),
        portions,
      };
    }
  }

  // Contains match (only if search text is at least 3 chars)
  if (searchText.length >= 3) {
    for (const row of data) {
      const recipeName = row.name.toLowerCase();
      if (searchText === recipeName || recipeName.includes(searchText) || searchText.includes(recipeName)) {
        return {
          recipe: rowToRecipe(row),
          portions,
        };
      }
    }
  }

  return null;
}

export async function getRecipeByName(
  userId: string,
  name: string
): Promise<Recipe | null> {
  const { data } = await supabase
    .from("recipes")
    .select("*")
    .eq("user_id", userId)
    .ilike("name", name);

  if (!data || data.length === 0) return null;
  return rowToRecipe(data[0]);
}

export async function listRecipes(userId: string): Promise<Recipe[]> {
  const { data } = await supabase
    .from("recipes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!data) return [];
  return data.map(rowToRecipe);
}

export async function deleteRecipe(
  userId: string,
  name: string
): Promise<boolean> {
  const { error, count } = await supabase
    .from("recipes")
    .delete({ count: "exact" })
    .eq("user_id", userId)
    .ilike("name", name);

  return !error && (count ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRecipe(row: any): Recipe {
  return {
    id: row.id,
    name: row.name,
    items: row.items as RecipeItem[],
    total_calories: row.total_calories,
    total_protein_g: parseFloat(row.total_protein_g),
    total_carbs_g: parseFloat(row.total_carbs_g),
    total_fat_g: parseFloat(row.total_fat_g),
    total_fiber_g: parseFloat(row.total_fiber_g),
    meal_type: row.meal_type,
  };
}
