export type { FoodItem, FoodCategory, CategoryInfo } from "./types";
export { CATEGORIES } from "./types";

import { PASTA } from "./data/pasta";
import { RISO } from "./data/riso";
import { PATATE } from "./data/patate";
import { PESCE } from "./data/pesce";
import { CARNE } from "./data/carne";
import { LATTICINI } from "./data/latticini";
import { UOVA } from "./data/uova";
import { VERDURE } from "./data/verdure";
import { FRUTTA } from "./data/frutta";
import { LEGUMI } from "./data/legumi";
import { FRUTTA_SECCA } from "./data/frutta-secca";
import { CONDIMENTI } from "./data/condimenti";
import { PANE_CEREALI } from "./data/pane-cereali";
import { BEVANDE } from "./data/bevande";
import { SNACK_DOLCI } from "./data/snack-dolci";

// ---------------------------------------------------------------------------
// All foods — single flat array, lazily cached
// ---------------------------------------------------------------------------
let _allFoods: import("./types").FoodItem[] | null = null;

export function getAllFoods(): import("./types").FoodItem[] {
  if (!_allFoods) {
    _allFoods = [
      ...PASTA,
      ...RISO,
      ...PATATE,
      ...PESCE,
      ...CARNE,
      ...LATTICINI,
      ...UOVA,
      ...VERDURE,
      ...FRUTTA,
      ...LEGUMI,
      ...FRUTTA_SECCA,
      ...CONDIMENTI,
      ...PANE_CEREALI,
      ...BEVANDE,
      ...SNACK_DOLCI,
    ];
  }
  return _allFoods;
}
