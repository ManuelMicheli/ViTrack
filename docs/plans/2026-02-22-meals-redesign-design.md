# Meals Section Redesign

## Date: 2026-02-22

## Summary

Redesign the Pasti (Meals) section to remove category browsing, implement search-only food discovery with smart ordering, unify the food database with the Telegram bot, and add macro-based food suggestions.

## Changes

### 1. FoodSearch Component Redesign

**Home view (no search active):**
- Frequent foods carousel (keep as-is)
- Recent foods list (keep as-is)
- **NEW: Suggested foods section** based on missing macros for daily goal
- **REMOVE: Category grid** — no more browsing categories

**Search results:**
- Flat list (no category grouping)
- Max 6 results visible
- Ordering priority: generic (no brand) items first, then branded variants
- Example: search "pasta" → "Pasta" (generic) → "Pasta Barilla" → "Pasta De Cecco" → etc.

**Remove:**
- Category browse view (click category → see all items)
- `selectedCategory` state and all category browsing logic
- Category headers in search results

### 2. Search Engine Update (search.ts)

Modify `searchLocalFoods()` to sort results:
1. Generic items (no brand) with best fuzzy score
2. Branded items sorted by fuzzy score
3. Limit to 6 results by default

### 3. Unify Food Database with Bot

**nutrition.ts changes:**
- Add lookup function that queries `food-database` (795 items) FIRST
- Fall back to `italian-foods.ts` for items not found (piatti pronti, etc.)
- This means both Telegram bot and web dashboard use the same nutritional data

### 4. Suggested Foods Section

- Query user's daily intake vs goals
- Identify which macros are lacking (protein, carbs, fat)
- Show 3-5 foods rich in the lacking macro from the food-database
- Example: if low on protein → show "Petto di pollo", "Tonno", "Uova", etc.

## Files to Modify

- `src/components/FoodSearch.tsx` — remove categories, flatten results, add suggestions
- `src/lib/food-database/search.ts` — update sorting (generic first)
- `src/lib/nutrition.ts` — add food-database lookup before italian-foods fallback
- `src/app/dashboard/meals/page.tsx` — pass user goals/intake to FoodSearch for suggestions
