// ---------------------------------------------------------------------------
// Patate - Italian potato database
// ---------------------------------------------------------------------------

import type { FoodItem } from "../types";

export const PATATE: FoodItem[] = [
  // =========================================================================
  // PATATE FRESCHE
  // =========================================================================

  // --- Patata comune (gialla) ---
  {
    id: "patate_comune_gialla",
    name_it: "Patata comune (gialla)",
    name_en: "Yellow potato (raw)",
    category: "patate",
    subcategory: "fresca",
    serving_size_g: 200,
    calories_per_100g: 77,
    protein_per_100g: 2,
    carbs_per_100g: 17,
    fat_per_100g: 0.1,
    fiber_per_100g: 2.2,
    tags: ["senza glutine"],
  },

  // --- Patata rossa ---
  {
    id: "patate_rossa",
    name_it: "Patata rossa",
    name_en: "Red potato (raw)",
    category: "patate",
    subcategory: "fresca",
    serving_size_g: 200,
    calories_per_100g: 70,
    protein_per_100g: 1.9,
    carbs_per_100g: 16,
    fat_per_100g: 0.1,
    fiber_per_100g: 1.7,
    tags: ["senza glutine"],
  },

  // --- Patata dolce / Batata ---
  {
    id: "patate_dolce_batata",
    name_it: "Patata dolce / Batata",
    name_en: "Sweet potato (raw)",
    category: "patate",
    subcategory: "fresca",
    serving_size_g: 200,
    calories_per_100g: 86,
    protein_per_100g: 1.6,
    carbs_per_100g: 20,
    fat_per_100g: 0.1,
    fiber_per_100g: 3,
    tags: ["senza glutine"],
  },

  // --- Patata novella ---
  {
    id: "patate_novella",
    name_it: "Patata novella",
    name_en: "New potato (raw)",
    category: "patate",
    subcategory: "fresca",
    serving_size_g: 200,
    calories_per_100g: 70,
    protein_per_100g: 1.7,
    carbs_per_100g: 16,
    fat_per_100g: 0.1,
    fiber_per_100g: 2,
    tags: ["senza glutine"],
  },

  // --- Patata viola ---
  {
    id: "patate_viola",
    name_it: "Patata viola",
    name_en: "Purple potato (raw)",
    category: "patate",
    subcategory: "fresca",
    serving_size_g: 200,
    calories_per_100g: 73,
    protein_per_100g: 2,
    carbs_per_100g: 16,
    fat_per_100g: 0.1,
    fiber_per_100g: 1.6,
    tags: ["senza glutine"],
  },

  // --- Patata americana ---
  {
    id: "patate_americana",
    name_it: "Patata americana",
    name_en: "American sweet potato (raw)",
    category: "patate",
    subcategory: "fresca",
    serving_size_g: 200,
    calories_per_100g: 86,
    protein_per_100g: 1.6,
    carbs_per_100g: 20,
    fat_per_100g: 0.1,
    fiber_per_100g: 3,
    tags: ["senza glutine"],
  },

  // =========================================================================
  // PREPARATE
  // =========================================================================

  // --- Pure di patate istantaneo (secco) ---
  {
    id: "patate_pure_istantaneo",
    name_it: "Pure di patate istantaneo (secco)",
    name_en: "Instant mashed potato flakes (dry)",
    category: "patate",
    subcategory: "preparata",
    serving_size_g: 200,
    calories_per_100g: 354,
    protein_per_100g: 8,
    carbs_per_100g: 78,
    fat_per_100g: 1,
    fiber_per_100g: 6,
    tags: ["senza glutine"],
  },

  // --- Gnocchi di patate ---
  {
    id: "patate_gnocchi",
    name_it: "Gnocchi di patate",
    name_en: "Potato gnocchi",
    category: "patate",
    subcategory: "preparata",
    serving_size_g: 180,
    calories_per_100g: 133,
    protein_per_100g: 3,
    carbs_per_100g: 30,
    fat_per_100g: 0.5,
    fiber_per_100g: 1.5,
    tags: [],
  },

  // --- Gnocchi di patate (Rana) ---
  {
    id: "patate_gnocchi_rana",
    name_it: "Gnocchi di patate Rana",
    name_en: "Rana Potato Gnocchi",
    category: "patate",
    subcategory: "preparata",
    brand: "Rana",
    serving_size_g: 180,
    calories_per_100g: 140,
    protein_per_100g: 3.5,
    carbs_per_100g: 30,
    fat_per_100g: 0.8,
    fiber_per_100g: 1.5,
    tags: [],
  },

  // --- Fecola di patate ---
  {
    id: "patate_fecola",
    name_it: "Fecola di patate",
    name_en: "Potato starch",
    category: "patate",
    subcategory: "preparata",
    serving_size_g: 200,
    calories_per_100g: 357,
    protein_per_100g: 0.1,
    carbs_per_100g: 88,
    fat_per_100g: 0,
    fiber_per_100g: 0,
    tags: ["senza glutine"],
  },
];
