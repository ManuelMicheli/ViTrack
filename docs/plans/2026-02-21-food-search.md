# Food Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an instant food search bar on the meals page that queries USDA, OpenFoodFacts, FatSecret, and the local CREA database, lets users pick items, set grams, build a cart, and log as a meal.

**Architecture:** New server-side search module (`food-search.ts`) queries all 4 sources in parallel and returns deduplicated results with per-100g values. New API endpoint (`/api/foods/search`) exposes this. New client component (`FoodSearch`) renders the search bar, results dropdown, gram picker, cart, and meal logging flow. Zero changes to existing chat/Telegram/meals code.

**Tech Stack:** Next.js API routes, existing nutrition API clients (USDA/OFF/FatSecret/CREA), React useState, Tailwind CSS, framer-motion, existing translation system.

---

### Task 1: Create `src/lib/food-search.ts` — search logic

**Files:**
- Create: `src/lib/food-search.ts`

**Step 1: Create the food search module**

This module exports a `searchFoods(query)` function that:
- Searches the local CREA database instantly (fuzzy match on all names)
- Queries OpenFoodFacts search API (returns up to 5 products with names)
- Queries USDA search API (returns up to 5 foods with names)
- Queries FatSecret search API (returns up to 5 foods with names)
- Merges results, deduplicates by name similarity, returns max 10 results

```typescript
// src/lib/food-search.ts
import type { NutrientResult } from "./nutrition";

export interface FoodSearchResult {
  id: string;          // unique id for React keys
  name: string;        // display name (Italian preferred)
  calories_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  fiber_100g: number;
  source: NutrientResult["source"];
}
```

For each API, create internal search functions that return `FoodSearchResult[]`:

**CREA (instant, local):** Filter `FOODS` array from `italian-foods.ts` — match if any name includes query or query includes name. Need to export `FOODS` array from `italian-foods.ts` (or duplicate the data — prefer exporting).

**OpenFoodFacts:** Use existing `OFF_SEARCH_URL` pattern from `openfoodfacts.ts`. GET request with `search_terms`, `cc: "it"`, `page_size: "8"`. Extract `product_name` + `nutriments` per-100g. Filter products with complete nutriments.

**USDA:** Use existing `USDA_SEARCH_URL` pattern from `usda.ts`. POST with `query`, `dataType: ["Foundation", "SR Legacy"]`, `pageSize: 5`. Extract `description` + nutrient values per 100g.

**FatSecret:** Use search endpoint from `fatsecret.ts`. GET `foods.search` with `max_results: 5`. For each result, use the serving description if available (skip detail call for speed — only use search-level data). NOTE: FatSecret search only returns brief serving info, not full per-100g. To keep it fast, only include FatSecret results that have a "per 100g" serving in search results. If not available, skip (the other 3 sources will cover).

**Deduplication:** After collecting all results, deduplicate by comparing lowercase names — if two results share >80% of words, keep the one from the higher-priority source (CREA > USDA > OFF > FatSecret).

**Step 2: Export CREA FOODS array from italian-foods.ts**

Modify `src/lib/italian-foods.ts` line 13 — change `const FOODS` to `export const FOODS`.

**Step 3: Validate build**

Run: `npm run build`
Expected: Build succeeds with no type errors.

**Step 4: Commit**

```bash
git add src/lib/food-search.ts src/lib/italian-foods.ts
git commit -m "feat: add food-search module with multi-source parallel search"
```

---

### Task 2: Create `POST /api/foods/search` — API endpoint

**Files:**
- Create: `src/app/api/foods/search/route.ts`

**Step 1: Create the API route**

```typescript
// src/app/api/foods/search/route.ts
import { searchFoods } from "@/lib/food-search";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { query } = await request.json();

  if (!query || typeof query !== "string" || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchFoods(query.trim());
  return NextResponse.json({ results });
}
```

**Step 2: Validate build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/api/foods/search/route.ts
git commit -m "feat: add /api/foods/search endpoint"
```

---

### Task 3: Add translations for food search UI

**Files:**
- Modify: `src/lib/translations.ts`

**Step 1: Add translation keys**

Add these keys in the translations object (after the existing `mealsPage.*` keys, around line 101):

```typescript
// ── Food Search ──
"foodSearch.placeholder": { it: "Cerca alimento...", en: "Search food..." },
"foodSearch.searching": { it: "Ricerca...", en: "Searching..." },
"foodSearch.noResults": { it: "Nessun risultato", en: "No results" },
"foodSearch.per100g": { it: "per 100g", en: "per 100g" },
"foodSearch.grams": { it: "Grammi", en: "Grams" },
"foodSearch.addToCart": { it: "Aggiungi", en: "Add" },
"foodSearch.cart": { it: "Alimenti selezionati", en: "Selected foods" },
"foodSearch.total": { it: "Totale", en: "Total" },
"foodSearch.logMeal": { it: "Registra pasto", en: "Log meal" },
"foodSearch.emptyCart": { it: "Cerca e aggiungi alimenti per comporre il pasto", en: "Search and add foods to build your meal" },
"foodSearch.selectMealType": { it: "Tipo di pasto", en: "Meal type" },
"foodSearch.remove": { it: "Rimuovi", en: "Remove" },
```

**Step 2: Validate build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/lib/translations.ts
git commit -m "feat: add food search translation keys"
```

---

### Task 4: Create `src/components/FoodSearch.tsx` — UI component

**Files:**
- Create: `src/components/FoodSearch.tsx`

**Step 1: Create the FoodSearch component**

This is a self-contained component that receives an `onSave` callback (same shape as AddMealModal's onSave). It renders:

1. **Search bar** — text input with magnifying glass icon, debounced 400ms
2. **Results dropdown** — appears below search bar when results are available. Each result shows: name, source badge, kcal/100g, P/C/F per 100g. Clicking a result expands an inline gram picker.
3. **Gram picker** — input field (default 100g) with +/- buttons. Shows scaled macros in real-time. "Aggiungi" button adds to cart.
4. **Cart** — list of selected items below the search area. Each item shows name, grams, scaled macros, remove button. Shows aggregate totals (total kcal, P, C, F).
5. **Log meal** — "Registra pasto" button at bottom of cart. Clicking it shows meal type selector (colazione/pranzo/cena/snack), then calls `onSave()`.

**Component signature:**

```typescript
interface FoodSearchProps {
  onSave: (meal: {
    description: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    meal_type: string;
  }) => void;
}
```

**State management:**
- `query: string` — search input
- `results: FoodSearchResult[]` — from API
- `searching: boolean` — loading state
- `selectedResult: FoodSearchResult | null` — the result being configured (gram picker open)
- `grams: number` — gram input for selected result (default 100)
- `cart: CartItem[]` — where `CartItem = FoodSearchResult & { grams: number }`
- `showMealTypePicker: boolean` — controls meal type selection step

**Debounce:** Use a `useEffect` + `setTimeout` pattern (no external library). When `query` changes and length >= 2, set a 400ms timeout to call `/api/foods/search`. Clear timeout on query change (debounce).

**Styling:** Follow existing patterns from meals page:
- `font-display` for headers, `font-mono-label` for labels, `font-body` for descriptions
- `data-card` class for card containers
- `text-protein`, `text-carbs`, `text-fat`, `text-fiber` for macro colors
- `bg-surface-raised` for interactive elements
- `border border-border` for borders
- `text-text-primary`, `text-text-secondary`, `text-text-tertiary` for text hierarchy
- Use `motion.div` from framer-motion for enter/exit animations
- Source badges: small pill with source name (CREA/USDA/OFF/FS)

**Step 2: Validate build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/FoodSearch.tsx
git commit -m "feat: add FoodSearch component with search, cart, and meal logging"
```

---

### Task 5: Integrate FoodSearch into meals page

**Files:**
- Modify: `src/app/dashboard/meals/page.tsx`

**Step 1: Add FoodSearch to the meals page**

Import `FoodSearch` and render it between the page title/date row and the grouped meal sections. It should sit as a prominent section at the top of the page, always visible.

In `src/app/dashboard/meals/page.tsx`:

1. Add import: `import FoodSearch from "@/components/FoodSearch";`
2. After the title + DatePicker row (line ~110), add:

```tsx
<motion.div variants={staggerItem}>
  <FoodSearch onSave={handleSaveMeal} />
</motion.div>
```

The `handleSaveMeal` function already exists at line 61 and has the correct signature — it calls `POST /api/meals` and refreshes the meal list.

**Step 2: Validate build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/dashboard/meals/page.tsx
git commit -m "feat: integrate food search into meals page"
```

---

### Task 6: Visual validation and polish

**Step 1: Manual test in dev**

Run: `npm run dev`

Test the following flows:
1. Type "pollo" in search bar → should see CREA result instantly + API results after ~1-2s
2. Click a result → gram picker appears
3. Change grams → macros update in real time
4. Click "Aggiungi" → item added to cart
5. Add a second item (e.g. "riso")
6. Cart shows both items + total macros
7. Click "Registra pasto" → meal type picker appears
8. Select "pranzo" → meal saved, appears in list below
9. Verify the existing AddMealModal (+ button) still works independently

**Step 2: Fix any visual or functional issues found**

**Step 3: Final build check**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: polish food search UI and fix issues from testing"
```
