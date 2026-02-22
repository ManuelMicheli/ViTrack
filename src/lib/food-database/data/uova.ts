// ---------------------------------------------------------------------------
// Uova (Eggs) - Comprehensive Italian egg database
// ---------------------------------------------------------------------------

import type { FoodItem } from "../types";

export const UOVA: FoodItem[] = [
  // -------------------------------------------------------------------------
  // Uova intere e parti (Whole eggs and parts)
  // -------------------------------------------------------------------------
  {
    id: "uova_uovo_intero",
    name_it: "Uovo intero (di gallina)",
    name_en: "Whole chicken egg (raw)",
    category: "uova",
    serving_size_g: 60,
    calories_per_100g: 155,
    protein_per_100g: 13,
    carbs_per_100g: 1.1,
    fat_per_100g: 11,
    fiber_per_100g: 0,
    tags: [],
  },
  {
    id: "uova_albume",
    name_it: "Albume d'uovo",
    name_en: "Egg white (raw)",
    category: "uova",
    serving_size_g: 33,
    calories_per_100g: 52,
    protein_per_100g: 11,
    carbs_per_100g: 0.7,
    fat_per_100g: 0.2,
    fiber_per_100g: 0,
    tags: ["proteico"],
  },
  {
    id: "uova_tuorlo",
    name_it: "Tuorlo d'uovo",
    name_en: "Egg yolk (raw)",
    category: "uova",
    serving_size_g: 17,
    calories_per_100g: 322,
    protein_per_100g: 16,
    carbs_per_100g: 3.6,
    fat_per_100g: 27,
    fiber_per_100g: 0,
    tags: [],
  },

  // -------------------------------------------------------------------------
  // Uova di altre specie (Other species)
  // -------------------------------------------------------------------------
  {
    id: "uova_uovo_di_quaglia",
    name_it: "Uovo di quaglia",
    name_en: "Quail egg (raw)",
    category: "uova",
    serving_size_g: 10,
    calories_per_100g: 158,
    protein_per_100g: 13,
    carbs_per_100g: 0.4,
    fat_per_100g: 11,
    fiber_per_100g: 0,
    tags: [],
  },

  // -------------------------------------------------------------------------
  // Preparazioni (Preparations)
  // -------------------------------------------------------------------------
  {
    id: "uova_uovo_sodo",
    name_it: "Uovo sodo",
    name_en: "Hard-boiled egg",
    category: "uova",
    serving_size_g: 60,
    calories_per_100g: 155,
    protein_per_100g: 13,
    carbs_per_100g: 1.1,
    fat_per_100g: 11,
    fiber_per_100g: 0,
    tags: [],
  },
  {
    id: "uova_uovo_in_camicia",
    name_it: "Uovo in camicia",
    name_en: "Poached egg",
    category: "uova",
    serving_size_g: 60,
    calories_per_100g: 143,
    protein_per_100g: 12,
    carbs_per_100g: 0.7,
    fat_per_100g: 10,
    fiber_per_100g: 0,
    tags: [],
  },
  {
    id: "uova_strapazzate",
    name_it: "Uova strapazzate (senza olio)",
    name_en: "Scrambled eggs (no oil)",
    category: "uova",
    serving_size_g: 60,
    calories_per_100g: 149,
    protein_per_100g: 10,
    carbs_per_100g: 2,
    fat_per_100g: 11,
    fiber_per_100g: 0,
    tags: [],
  },

  // -------------------------------------------------------------------------
  // Prodotti a base di uovo (Egg products)
  // -------------------------------------------------------------------------
  {
    id: "uova_albume_liquido_pastorizzato",
    name_it: "Albume d'uovo liquido pastorizzato",
    name_en: "Pasteurized liquid egg whites",
    category: "uova",
    serving_size_g: 33,
    calories_per_100g: 47,
    protein_per_100g: 10,
    carbs_per_100g: 0.7,
    fat_per_100g: 0.1,
    fiber_per_100g: 0,
    tags: ["proteico"],
  },
];
