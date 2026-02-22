# Pasti Premium Redesign Design

## Overview
Redesign the Pasti (Meals) page from a sparse, basic layout into a premium single-page experience with rich micro-interactions, animations, and better UX organization — matching the quality level of the Stats and Workouts pages.

## Design Decisions
- **Single improved view** (no tab system) — keep everything on one scrollable page
- **Hero ring chart** for daily calorie progress
- **Expandable meal cards** with detail breakdown
- **Full-screen overlay** for food search/add flow
- **Premium quick-add pills** for frequent foods
- All animations use existing `animation-config.ts` springs. No new libraries.

---

## Section 1: Hero Daily Summary

Ring chart at the top showing calories consumed vs target:
- **SVG ring** with animated fill (0 → current value, spring animation)
- Center: animated calorie number (`useAnimatedNumber`) + "/ target kcal" label
- Ring color changes: green (<80%), yellow (80-100%), red (>100%)
- Below ring: **3 horizontal progress bars** for Protein/Carbs/Fat with animated grams, % completion, colored labels
- Entire block uses stagger entry animation

## Section 2: Quick Add — Frequent Foods Premium

Horizontal scrollable grid of pills for most-used foods:
- Each pill: food name + calories per default serving
- Tap: scale bounce micro-animation + add directly to cart with default portion
- Long press: opens inline gram picker
- Frequency badge on each pill (small, corner)
- **Smart sorting**: suggestions change based on time of day (breakfast in morning, lunch at noon...)
- Stagger entry animation, pulse animation on food add

## Section 3: Meal Sections (Colazione/Pranzo/Cena/Snack)

**Improved section header**: meal type with emoji + animated calorie total + "+" button

**Expandable meal cards**:
- **Collapsed**: food name, calories, time, compact MacroBar. Hover lift (y: -2)
- **Expanded** (tap to toggle, AnimatePresence):
  - Full macro breakdown with 4 mini progress bars (P/C/F/Fiber) with gram values
  - Log time
  - If multi-item: detailed ingredient list
  - Delete button with confirmation (red, shake animation, then confirm)
- Smooth transition with framer-motion `layout` prop
- **Improved empty state**: animated icon + inviting text + button with hover glow

## Section 4: Full-Screen Search Overlay

When user presses "+" or search bar:
- **Full-screen overlay** rising from bottom (spring animation)
- **Prominent search bar** at top with icon, auto-focus, clear button
- **Home sections** (when not searching): Frequent (grid), Recent (list), Suggested by macro deficit
- **Search results**: list with stagger animation, each result shows name + cal/100g + macro mini
- **Improved gram picker**: drag slider + preset buttons (50g, 100g, 150g, 200g, portion) + real-time macro preview
- **Cart bottom sheet**: slides up from bottom, shows items with totals, meal type selector, save button
- **Close button** top-right with animation

## Section 5: Daily Total

Bottom card with summary:
- Total calories with large animated number
- Full-width MacroBar
- 4-column grid for P/C/F/Fiber with values

---

## Animation Specs

All animations use existing springs from `src/lib/animation-config.ts`:
- Page entry: `staggerContainer(0.08)` + `staggerItem`
- Card hover: `whileHover={{ y: -2 }}`
- Card expand: `AnimatePresence` + `layout` prop
- Numbers: `useAnimatedNumber` hook
- Ring chart: custom SVG stroke-dasharray animation with `springs.smooth`
- Overlay: `initial={{ y: "100%" }}` → `animate={{ y: 0 }}` with `springs.enter`
- Buttons: `whileTap={{ scale: 0.95 }}` with `springs.tap`
- Quick-add pulse: `scale: [1, 1.15, 1]` transition on add

## Files to Modify/Create

- `src/app/dashboard/meals/page.tsx` — Main page restructure
- `src/components/FoodSearch.tsx` — Major refactor to full-screen overlay
- `src/components/DailyRingChart.tsx` — New: SVG ring chart component
- `src/components/MealCard.tsx` — New: Expandable meal card component
- `src/components/QuickAddPills.tsx` — New: Frequent foods quick-add section
- `src/components/MacroProgressBars.tsx` — New: Animated macro progress bars
