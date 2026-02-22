// ---------------------------------------------------------------------------
// Food database types
// ---------------------------------------------------------------------------

export type FoodCategory =
  | "pasta"
  | "riso"
  | "patate"
  | "pesce"
  | "carne"
  | "latticini"
  | "uova"
  | "verdure"
  | "frutta"
  | "legumi"
  | "frutta-secca"
  | "condimenti"
  | "pane-cereali"
  | "bevande"
  | "snack-dolci";

export interface FoodItem {
  id: string;
  name_it: string;
  name_en: string;
  category: FoodCategory;
  subcategory?: string;
  brand?: string;
  serving_size_g: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  tags: string[];
}

export interface CategoryInfo {
  id: FoodCategory;
  label_it: string;
  label_en: string;
  icon: string;
  order: number;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: "pasta", label_it: "Pasta", label_en: "Pasta", icon: "\uD83C\uDF5D", order: 0 },
  { id: "riso", label_it: "Riso", label_en: "Rice", icon: "\uD83C\uDF5A", order: 1 },
  { id: "pane-cereali", label_it: "Pane & Cereali", label_en: "Bread & Cereals", icon: "\uD83C\uDF5E", order: 2 },
  { id: "carne", label_it: "Carne", label_en: "Meat", icon: "\uD83E\uDD69", order: 3 },
  { id: "pesce", label_it: "Pesce", label_en: "Fish & Seafood", icon: "\uD83D\uDC1F", order: 4 },
  { id: "uova", label_it: "Uova", label_en: "Eggs", icon: "\uD83E\uDD5A", order: 5 },
  { id: "latticini", label_it: "Latticini", label_en: "Dairy", icon: "\uD83E\uDD5B", order: 6 },
  { id: "verdure", label_it: "Verdure", label_en: "Vegetables", icon: "\uD83E\uDD66", order: 7 },
  { id: "frutta", label_it: "Frutta", label_en: "Fruit", icon: "\uD83C\uDF4C", order: 8 },
  { id: "legumi", label_it: "Legumi", label_en: "Legumes", icon: "\uD83E\uDED8", order: 9 },
  { id: "patate", label_it: "Patate", label_en: "Potatoes", icon: "\uD83E\uDD54", order: 10 },
  { id: "frutta-secca", label_it: "Frutta secca & Semi", label_en: "Nuts & Seeds", icon: "\uD83E\uDD5C", order: 11 },
  { id: "condimenti", label_it: "Condimenti & Grassi", label_en: "Condiments & Fats", icon: "\uD83E\uDED2", order: 12 },
  { id: "bevande", label_it: "Bevande", label_en: "Beverages", icon: "\uD83E\uDDC3", order: 13 },
  { id: "snack-dolci", label_it: "Snack & Dolci", label_en: "Snacks & Sweets", icon: "\uD83C\uDF6B", order: 14 },
];
