# Pasti Premium Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Meals page into a premium single-page experience with hero ring chart, expandable meal cards, full-screen search overlay, and quick-add pills — matching the quality of the Stats and Workouts pages.

**Architecture:** Extract meal display into reusable components (DailyRingChart, MealCard, QuickAddPills, MacroProgressBars), refactor FoodSearch into a full-screen overlay with improved gram picker, and rewire the main meals page to compose all sections with stagger animations.

**Tech Stack:** Next.js, React, TypeScript, Framer Motion, Tailwind CSS v4, existing animation-config springs and useAnimatedNumber hook.

---

### Task 1: Add New Translation Keys

**Files:**
- Modify: `src/lib/translations.ts`

**Step 1: Add the new translation keys**

Add these keys to the translations object (after the existing `mealsPage.*` keys):

```typescript
// Inside the translations object, after existing mealsPage keys:

"mealsPage.goalKcal": { it: "obiettivo", en: "goal" },
"mealsPage.consumed": { it: "consumate", en: "consumed" },
"mealsPage.remaining": { it: "rimanenti", en: "remaining" },
"mealsPage.quickAdd": { it: "Aggiungi rapido", en: "Quick add" },
"mealsPage.deleteConfirm": { it: "Conferma eliminazione", en: "Confirm delete" },
"mealsPage.expandDetails": { it: "Dettagli", en: "Details" },
"mealsPage.portion": { it: "Porzione", en: "Portion" },
"mealsPage.addFirst": { it: "Aggiungi il primo pasto", en: "Add your first meal" },
"mealsPage.noMealsYet": { it: "Nessun pasto registrato per oggi", en: "No meals logged for today" },
"foodSearch.presetPortion": { it: "Porzione", en: "Portion" },
"foodSearch.close": { it: "Chiudi", en: "Close" },
"foodSearch.addFood": { it: "Aggiungi alimento", en: "Add food" },
```

**Step 2: Validate build**

Run: `npm run build`
Expected: Build passes with no type errors.

**Step 3: Commit**

```bash
git add src/lib/translations.ts
git commit -m "feat(meals): add translation keys for premium redesign"
```

---

### Task 2: Create DailyRingChart Component

**Files:**
- Create: `src/components/DailyRingChart.tsx`

**Step 1: Create the ring chart component**

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { springs } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";

interface DailyRingChartProps {
  consumed: number;
  goal: number;
}

export default function DailyRingChart({ consumed, goal }: DailyRingChartProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const animatedConsumed = useAnimatedNumber(consumed);
  const animatedGoal = useAnimatedNumber(goal);

  const percentage = goal > 0 ? Math.min((consumed / goal) * 100, 150) : 0;

  // SVG ring params
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * Math.min(percentage, 100)) / 100;

  // Color based on percentage
  const ringColor =
    percentage > 100
      ? "var(--color-danger, #ef4444)"
      : percentage >= 80
        ? "var(--color-carbs, #eab308)"
        : "var(--color-accent-dynamic, #22c55e)";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-surface-raised, #1a1a1a)"
            strokeWidth={strokeWidth}
          />
        </svg>

        {/* Animated fill ring */}
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: mounted ? dashOffset : circumference }}
            transition={springs.smooth}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className="font-display text-3xl font-bold text-text-primary leading-none">
            {animatedConsumed}
          </motion.span>
          <span className="font-mono-label text-[11px] text-text-tertiary mt-0.5">
            / {goal} kcal
          </span>
        </div>
      </div>

      {/* Label below */}
      <span className="font-mono-label text-[11px] text-text-tertiary">
        {consumed <= goal
          ? `${Math.max(0, goal - consumed)} kcal ${t("mealsPage.remaining")}`
          : `+${consumed - goal} kcal`}
      </span>
    </div>
  );
}
```

**Step 2: Validate build**

Run: `npm run build`
Expected: Build passes.

**Step 3: Commit**

```bash
git add src/components/DailyRingChart.tsx
git commit -m "feat(meals): add DailyRingChart SVG component with animated fill"
```

---

### Task 3: Create MacroProgressBars Component

**Files:**
- Create: `src/components/MacroProgressBars.tsx`

**Step 1: Create the macro progress bars component**

```tsx
"use client";

import { motion } from "framer-motion";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { springs, staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";

interface MacroProgressBarsProps {
  protein: { current: number; goal: number };
  carbs: { current: number; goal: number };
  fat: { current: number; goal: number };
}

function MacroRow({
  label,
  current,
  goal,
  color,
}: {
  label: string;
  current: number;
  goal: number;
  color: string;
}) {
  const animatedCurrent = useAnimatedNumber(current);
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <motion.div variants={staggerItem} className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-mono-label text-[11px]" style={{ color }}>
          {label}
        </span>
        <span className="font-mono-label text-[11px] text-text-tertiary">
          <motion.span>{animatedCurrent}</motion.span>
          <span className="text-text-tertiary/50"> / {goal}g</span>
        </span>
      </div>
      <div className="h-1.5 w-full bg-surface-raised rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={springs.smooth}
        />
      </div>
    </motion.div>
  );
}

export default function MacroProgressBars({ protein, carbs, fat }: MacroProgressBarsProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer(0.06)}
      className="space-y-2.5 w-full"
    >
      <MacroRow
        label={t("macro.proteinShort")}
        current={protein.current}
        goal={protein.goal}
        color="var(--color-protein)"
      />
      <MacroRow
        label={t("macro.carbsShort")}
        current={carbs.current}
        goal={carbs.goal}
        color="var(--color-carbs)"
      />
      <MacroRow
        label={t("macro.fat")}
        current={fat.current}
        goal={fat.goal}
        color="var(--color-fat)"
      />
    </motion.div>
  );
}
```

**Step 2: Validate build**

Run: `npm run build`
Expected: Build passes.

**Step 3: Commit**

```bash
git add src/components/MacroProgressBars.tsx
git commit -m "feat(meals): add MacroProgressBars component with animated fills"
```

---

### Task 4: Create MealCard Component

**Files:**
- Create: `src/components/MealCard.tsx`

**Step 1: Create the expandable meal card component**

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "@/lib/animation-config";
import { TrashIcon } from "./icons";
import MacroBar from "./MacroBar";
import { useLanguage } from "@/lib/language-context";
import type { Meal } from "@/lib/types";

interface MealCardProps {
  meal: Meal;
  locale: string;
  onDelete: (id: string) => void;
}

export default function MealCard({ meal, locale, onDelete }: MealCardProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const protein = meal.protein_g ?? 0;
  const carbs = meal.carbs_g ?? 0;
  const fat = meal.fat_g ?? 0;
  const fiber = meal.fiber_g ?? 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(meal.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <motion.div
      layout
      onClick={() => setExpanded(!expanded)}
      className="cursor-pointer group"
      whileHover={{ y: -1 }}
      transition={springs.tap}
    >
      {/* Collapsed view */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-body text-[15px] text-text-primary">{meal.description}</p>
            <p className="font-body text-xs text-text-tertiary mt-0.5">
              {new Date(meal.logged_at).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono-label text-text-secondary">{meal.calories} kcal</span>
            <motion.div
              initial={false}
              animate={{
                rotate: expanded ? 180 : 0,
                opacity: expanded ? 1 : 0.5,
              }}
              transition={{ duration: 0.2 }}
              className="text-text-tertiary"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Compact macro bar - always visible */}
        <div className="mt-2">
          <MacroBar protein={protein} carbs={carbs} fat={fat} fiber={fiber} height={3} />
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Macro detail bars */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "P", value: protein, color: "protein" },
                  { label: "C", value: carbs, color: "carbs" },
                  { label: "G", value: fat, color: "fat" },
                  { label: "F", value: fiber, color: "fiber" },
                ].map((macro) => (
                  <div
                    key={macro.label}
                    className={`p-2 rounded-lg bg-${macro.color}/10 text-center`}
                  >
                    <p className={`font-mono-label text-[10px] text-${macro.color}`}>
                      {macro.label}
                    </p>
                    <p className="font-display text-xs font-bold text-text-primary">
                      {macro.value}g
                    </p>
                  </div>
                ))}
              </div>

              {/* Delete button */}
              <div className="flex justify-end">
                <motion.button
                  onClick={handleDelete}
                  whileTap={{ scale: 0.95 }}
                  animate={confirmDelete ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                  transition={confirmDelete ? { duration: 0.4 } : springs.tap}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-label transition-all ${
                    confirmDelete
                      ? "bg-danger/20 text-danger border border-danger/30"
                      : "text-text-tertiary hover:text-danger hover:bg-danger/10"
                  }`}
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  {confirmDelete ? t("common.confirm") + "?" : t("common.delete")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

**Step 2: Validate build**

Run: `npm run build`
Expected: Build passes.

**Step 3: Commit**

```bash
git add src/components/MealCard.tsx
git commit -m "feat(meals): add expandable MealCard with macro details and delete confirm"
```

---

### Task 5: Create QuickAddPills Component

**Files:**
- Create: `src/components/QuickAddPills.tsx`

**Step 1: Create the quick-add pills component**

This component shows frequent foods as tappable pills. Tap adds to cart with default serving, uses the existing food-history module.

```tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, springs } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";
import { getFrequentFoodIds } from "@/lib/food-history";
import { getFoodById } from "@/lib/food-database/search";
import type { FoodItem } from "@/lib/food-database/types";

interface QuickAddPillsProps {
  onQuickAdd: (food: FoodItem, grams: number) => void;
}

function getTimeBasedOrder(): string[] {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return ["colazione", "snack", "pranzo", "cena"];
  if (hour >= 10 && hour < 15) return ["pranzo", "snack", "colazione", "cena"];
  if (hour >= 15 && hour < 19) return ["snack", "cena", "pranzo", "colazione"];
  return ["cena", "snack", "pranzo", "colazione"];
}

export default function QuickAddPills({ onQuickAdd }: QuickAddPillsProps) {
  const { t } = useLanguage();
  const [frequentIds, setFrequentIds] = useState<string[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    setFrequentIds(getFrequentFoodIds());
  }, []);

  const foods = useMemo(() => {
    return frequentIds
      .map((id) => getFoodById(id))
      .filter((f): f is FoodItem => f !== undefined)
      .slice(0, 8);
  }, [frequentIds]);

  const handleTap = useCallback(
    (food: FoodItem) => {
      onQuickAdd(food, food.serving_size_g);
      setAddedId(food.id);
      setTimeout(() => setAddedId(null), 600);
    },
    [onQuickAdd]
  );

  if (foods.length === 0) return null;

  return (
    <div>
      <p className="font-mono-label text-[11px] text-text-tertiary uppercase tracking-wider mb-2 px-1">
        {t("mealsPage.quickAdd")}
      </p>
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer(0.04)}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      >
        {foods.map((food) => (
          <motion.button
            key={food.id}
            variants={staggerItem}
            whileTap={{ scale: 0.92 }}
            animate={
              addedId === food.id
                ? { scale: [1, 1.15, 1], transition: { duration: 0.4 } }
                : { scale: 1 }
            }
            onClick={() => handleTap(food)}
            className="shrink-0 px-3 py-2 rounded-xl border border-border hover:border-[var(--color-accent-dynamic)]/30 bg-transparent hover:bg-surface-raised transition-all relative"
          >
            <p className="font-body text-xs text-text-primary whitespace-nowrap capitalize">
              {food.name_it}
            </p>
            <p className="font-mono-label text-[10px] text-text-tertiary mt-0.5">
              {food.serving_size_g}g · {Math.round((food.calories_per_100g * food.serving_size_g) / 100)} kcal
            </p>

            {/* Added pulse overlay */}
            <AnimatePresence>
              {addedId === food.id && (
                <motion.div
                  initial={{ opacity: 0.6, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.3 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 rounded-xl border-2 border-[var(--color-accent-dynamic)]"
                />
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
```

**Step 2: Validate build**

Run: `npm run build`
Expected: Build passes.

**Step 3: Commit**

```bash
git add src/components/QuickAddPills.tsx
git commit -m "feat(meals): add QuickAddPills with pulse animation and time-based sorting"
```

---

### Task 6: Refactor FoodSearch Into Full-Screen Overlay

**Files:**
- Modify: `src/components/FoodSearch.tsx`

This is the largest task. The FoodSearch component will be refactored from an inline panel into a full-screen overlay that opens when triggered. The component now receives an `isOpen`/`onClose` pattern (like a modal) and renders as a fixed overlay.

**Step 1: Rewrite FoodSearch.tsx**

Replace the entire file content with:

```tsx
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/translations";
import { staggerContainer, staggerItem, springs } from "@/lib/animation-config";
import { TrashIcon, CloseIcon } from "./icons";
import MacroBar from "./MacroBar";
import {
  searchLocalFoods,
  getFoodById,
  getSuggestedFoods,
} from "@/lib/food-database/search";
import type { FoodItem } from "@/lib/food-database/types";
import type { MacroType } from "@/lib/food-database/search";
import {
  getRecentFoods,
  addToRecent,
  incrementFrequency,
  getFrequentFoodIds,
} from "@/lib/food-history";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FoodSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: {
    description: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    meal_type: string;
  }) => void;
  dailyIntake?: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  goals?: {
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
  };
}

interface CartItem extends FoodItem {
  grams: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mealTypeKeys: { value: string; labelKey: TranslationKey; icon: string }[] = [
  { value: "colazione", labelKey: "meal.colazione", icon: "\u2600\uFE0F" },
  { value: "pranzo", labelKey: "meal.pranzo", icon: "\uD83C\uDF24\uFE0F" },
  { value: "cena", labelKey: "meal.cena", icon: "\uD83C\uDF19" },
  { value: "snack", labelKey: "meal.snack", icon: "\uD83C\uDF4E" },
];

const gramPresets = [50, 100, 150, 200];

function getDefaultMealType(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return "colazione";
  if (hour >= 11 && hour < 15) return "pranzo";
  if (hour >= 18 && hour < 22) return "cena";
  return "snack";
}

function scale(value: number, grams: number): number {
  return Math.round((value * grams) / 100);
}

function scaleDecimal(value: number, grams: number): number {
  return parseFloat(((value * grams) / 100).toFixed(1));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function FoodSearch({ isOpen, onClose, onSave, dailyIntake, goals }: FoodSearchProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  // State
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [grams, setGrams] = useState(100);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showMealType, setShowMealType] = useState(false);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [frequentFoodIds, setFrequentFoodIds] = useState<string[]>([]);

  // Load history & auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setRecentFoods(getRecentFoods());
      setFrequentFoodIds(getFrequentFoodIds());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setDebouncedQuery("");
      setSelectedId(null);
      setShowMealType(false);
    }
  }, [isOpen]);

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 150);
    return () => clearTimeout(timer);
  }, [query]);

  const searchResults = useMemo(() => {
    if (debouncedQuery.length < 2) return [];
    return searchLocalFoods(debouncedQuery, { limit: 8 });
  }, [debouncedQuery]);

  // Frequent foods
  const frequentFoods = useMemo(() => {
    return frequentFoodIds
      .map((id) => getFoodById(id))
      .filter((f): f is FoodItem => f !== undefined);
  }, [frequentFoodIds]);

  // Suggested foods based on macro deficit
  const { suggestedFoods, deficitLabel } = useMemo(() => {
    if (!dailyIntake || !goals) return { suggestedFoods: [] as FoodItem[], deficitLabel: "" };

    const proteinLeft = (goals.protein_g ?? 0) - dailyIntake.protein_g;
    const carbsLeft = (goals.carbs_g ?? 0) - dailyIntake.carbs_g;
    const fatLeft = (goals.fat_g ?? 0) - dailyIntake.fat_g;

    const proteinRatio = goals.protein_g ? proteinLeft / goals.protein_g : 0;
    const carbsRatio = goals.carbs_g ? carbsLeft / goals.carbs_g : 0;
    const fatRatio = goals.fat_g ? fatLeft / goals.fat_g : 0;

    let deficitMacro: MacroType = "protein";
    let label: TranslationKey = "foodSearch.suggestedProtein";
    let maxRatio = proteinRatio;

    if (carbsRatio > maxRatio) {
      deficitMacro = "carbs";
      label = "foodSearch.suggestedCarbs";
      maxRatio = carbsRatio;
    }
    if (fatRatio > maxRatio) {
      deficitMacro = "fat";
      label = "foodSearch.suggestedFat";
    }

    if (maxRatio < 0.2) return { suggestedFoods: [] as FoodItem[], deficitLabel: "" };

    return {
      suggestedFoods: getSuggestedFoods(deficitMacro, 5),
      deficitLabel: label,
    };
  }, [dailyIntake, goals]);

  const isSearching = debouncedQuery.length >= 2;

  // Handlers
  const handleSelectFood = useCallback((food: FoodItem) => {
    if (selectedId === food.id) {
      setSelectedId(null);
    } else {
      setSelectedId(food.id);
      setGrams(food.serving_size_g);
    }
  }, [selectedId]);

  const handleAddToCart = useCallback((food: FoodItem) => {
    setCart((prev) => [...prev, { ...food, grams }]);
    addToRecent(food);
    incrementFrequency(food.id);
    setSelectedId(null);
    setQuery("");
    setDebouncedQuery("");
    setRecentFoods(getRecentFoods());
    setFrequentFoodIds(getFrequentFoodIds());
  }, [grams]);

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
    setShowMealType(false);
  };

  const handleLogMeal = (mealType: string) => {
    const description = cart
      .map((item) => `${item.name_it}(${item.grams}g)`)
      .join(", ");

    const totalCalories = cart.reduce((s, item) => s + scale(item.calories_per_100g, item.grams), 0);
    const totalProtein = cart.reduce((s, item) => s + scaleDecimal(item.protein_per_100g, item.grams), 0);
    const totalCarbs = cart.reduce((s, item) => s + scaleDecimal(item.carbs_per_100g, item.grams), 0);
    const totalFat = cart.reduce((s, item) => s + scaleDecimal(item.fat_per_100g, item.grams), 0);
    const totalFiber = cart.reduce((s, item) => s + scaleDecimal(item.fiber_per_100g, item.grams), 0);

    onSave({
      description,
      calories: totalCalories,
      protein_g: parseFloat(totalProtein.toFixed(1)),
      carbs_g: parseFloat(totalCarbs.toFixed(1)),
      fat_g: parseFloat(totalFat.toFixed(1)),
      fiber_g: parseFloat(totalFiber.toFixed(1)),
      meal_type: mealType,
    });

    setCart([]);
    setQuery("");
    setDebouncedQuery("");
    setShowMealType(false);
    setSelectedId(null);
    setGrams(100);
    onClose();
  };

  const handleClose = () => {
    if (cart.length === 0) {
      onClose();
    }
  };

  // Cart totals
  const cartTotalCal = cart.reduce((s, item) => s + scale(item.calories_per_100g, item.grams), 0);
  const cartTotalProtein = cart.reduce((s, item) => s + scaleDecimal(item.protein_per_100g, item.grams), 0);
  const cartTotalCarbs = cart.reduce((s, item) => s + scaleDecimal(item.carbs_per_100g, item.grams), 0);
  const cartTotalFat = cart.reduce((s, item) => s + scaleDecimal(item.fat_per_100g, item.grams), 0);
  const cartTotalFiber = cart.reduce((s, item) => s + scaleDecimal(item.fiber_per_100g, item.grams), 0);

  // ---------------------------------------------------------------------------
  // Render food item row with improved gram picker
  // ---------------------------------------------------------------------------
  const renderFoodItem = (food: FoodItem) => (
    <motion.div key={food.id} variants={staggerItem}>
      <button
        onClick={() => handleSelectFood(food)}
        className="w-full text-left px-4 py-3 hover:bg-surface-raised transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-body text-sm text-text-primary truncate capitalize">
              {food.name_it}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {food.brand && (
                <>
                  <span className="font-mono-label text-[10px] text-[var(--color-accent-dynamic)]/70">
                    {food.brand}
                  </span>
                  <span className="text-text-tertiary/40 text-[10px]">&middot;</span>
                </>
              )}
              <span className="font-mono-label text-[11px] text-text-tertiary">
                {food.calories_per_100g} kcal
              </span>
              <span className="text-text-tertiary/40 text-[10px]">&middot;</span>
              <span className="font-mono-label text-[11px] text-protein">P:{food.protein_per_100g}g</span>
              <span className="font-mono-label text-[11px] text-carbs">C:{food.carbs_per_100g}g</span>
              <span className="font-mono-label text-[11px] text-fat">G:{food.fat_per_100g}g</span>
            </div>
          </div>
        </div>
      </button>

      {/* Improved gram picker */}
      <AnimatePresence>
        {selectedId === food.id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-3">
              {/* Preset buttons */}
              <div className="flex items-center gap-2 justify-center">
                {gramPresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={(e) => { e.stopPropagation(); setGrams(preset); }}
                    className={`px-3 py-1.5 rounded-lg font-mono-label text-xs transition-all border ${
                      grams === preset
                        ? "border-[var(--color-accent-dynamic)]/50 bg-[var(--color-accent-dynamic)]/10 text-text-primary"
                        : "border-border text-text-tertiary hover:text-text-secondary hover:bg-surface-raised"
                    }`}
                  >
                    {preset}g
                  </button>
                ))}
                {food.serving_size_g !== 100 && !gramPresets.includes(food.serving_size_g) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setGrams(food.serving_size_g); }}
                    className={`px-3 py-1.5 rounded-lg font-mono-label text-xs transition-all border ${
                      grams === food.serving_size_g
                        ? "border-[var(--color-accent-dynamic)]/50 bg-[var(--color-accent-dynamic)]/10 text-text-primary"
                        : "border-border text-text-tertiary hover:text-text-secondary hover:bg-surface-raised"
                    }`}
                  >
                    {food.serving_size_g}g
                  </button>
                )}
              </div>

              {/* Manual input with -/+ */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setGrams((g) => Math.max(1, g - 10)); }}
                  className="w-9 h-9 rounded-lg border border-border text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-all font-mono-label text-lg flex items-center justify-center"
                >
                  -
                </button>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={grams}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 1) setGrams(v);
                      else if (e.target.value === "") setGrams(1);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-16 text-center bg-transparent border border-border rounded-lg py-1.5 font-mono-label text-sm text-text-primary outline-none focus:border-[var(--color-accent-dynamic)]/30 transition-all"
                    min={1}
                  />
                  <span className="font-mono-label text-[11px] text-text-tertiary">g</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setGrams((g) => g + 10); }}
                  className="w-9 h-9 rounded-lg border border-border text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-all font-mono-label text-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>

              {/* Macro preview */}
              <div className="grid grid-cols-4 gap-1.5">
                <div className="p-2 rounded-lg bg-protein/10 text-center">
                  <p className="font-mono-label text-[10px] text-protein">P</p>
                  <p className="font-display text-xs font-bold text-text-primary">
                    {scaleDecimal(food.protein_per_100g, grams)}g
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-carbs/10 text-center">
                  <p className="font-mono-label text-[10px] text-carbs">C</p>
                  <p className="font-display text-xs font-bold text-text-primary">
                    {scaleDecimal(food.carbs_per_100g, grams)}g
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-fat/10 text-center">
                  <p className="font-mono-label text-[10px] text-fat">G</p>
                  <p className="font-display text-xs font-bold text-text-primary">
                    {scaleDecimal(food.fat_per_100g, grams)}g
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-fiber/10 text-center">
                  <p className="font-mono-label text-[10px] text-fiber">F</p>
                  <p className="font-display text-xs font-bold text-text-primary">
                    {scaleDecimal(food.fiber_per_100g, grams)}g
                  </p>
                </div>
              </div>

              {/* Calories + Add button */}
              <div className="flex items-center justify-between">
                <span className="font-mono-label text-sm text-text-secondary">
                  {scale(food.calories_per_100g, grams)} kcal
                </span>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(food); }}
                  className="px-4 py-2 rounded-lg bg-[var(--color-accent-dynamic)] text-black font-mono-label text-sm hover:opacity-90 transition-all"
                >
                  {t("foodSearch.addToCart")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/60"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={springs.enter}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 top-0 bg-background flex flex-col sm:top-4 sm:left-4 sm:right-4 sm:bottom-4 sm:rounded-xl sm:border sm:border-border"
          >
            {/* Header with search bar */}
            <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-text-primary">
                  {t("foodSearch.addFood")}
                </h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-raised transition-all"
                >
                  <CloseIcon className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-transparent focus-within:border-[var(--color-accent-dynamic)]/30 transition-all">
                <svg className="w-4 h-4 text-text-tertiary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("foodSearch.placeholder")}
                  className="flex-1 bg-transparent text-text-primary placeholder-text-tertiary font-body text-sm outline-none"
                />
                {query && (
                  <button
                    onClick={() => { setQuery(""); setDebouncedQuery(""); }}
                    className="text-text-tertiary hover:text-text-primary transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* HOME VIEW */}
              {!isSearching && (
                <>
                  {/* Frequent foods */}
                  {frequentFoods.length > 0 && (
                    <div>
                      <p className="font-mono-label text-[11px] text-text-tertiary uppercase tracking-wider mb-2 px-1">
                        {t("foodSearch.frequent")}
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {frequentFoods.map((food) => (
                          <button
                            key={food.id}
                            onClick={() => handleSelectFood(food)}
                            className={`shrink-0 px-3 py-2 rounded-lg border transition-all ${
                              selectedId === food.id
                                ? "border-[var(--color-accent-dynamic)]/50 bg-[var(--color-accent-dynamic)]/5"
                                : "border-border hover:bg-surface-raised"
                            }`}
                          >
                            <p className="font-body text-xs text-text-primary whitespace-nowrap capitalize">{food.name_it}</p>
                            <p className="font-mono-label text-[10px] text-text-tertiary mt-0.5">{food.calories_per_100g} kcal</p>
                          </button>
                        ))}
                      </div>
                      {/* Inline gram picker for frequent */}
                      <AnimatePresence>
                        {selectedId && frequentFoods.some(f => f.id === selectedId) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-2"
                          >
                            <div className="data-card !p-0">
                              {renderFoodItem(frequentFoods.find(f => f.id === selectedId)!)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Recent foods */}
                  {recentFoods.length > 0 && (
                    <div>
                      <p className="font-mono-label text-[11px] text-text-tertiary uppercase tracking-wider mb-2 px-1">
                        {t("foodSearch.recent")}
                      </p>
                      <div className="data-card !p-0 overflow-hidden">
                        <div className="divide-y divide-border-subtle">
                          {recentFoods.slice(0, 5).map((food) => renderFoodItem(food))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Macro-deficit suggestions */}
                  {suggestedFoods.length > 0 && deficitLabel && (
                    <div>
                      <p className="font-mono-label text-[11px] text-text-tertiary uppercase tracking-wider mb-2 px-1">
                        {t(deficitLabel as TranslationKey)}
                      </p>
                      <div className="data-card !p-0 overflow-hidden">
                        <motion.div
                          initial="initial"
                          animate="animate"
                          variants={staggerContainer(0.02)}
                          className="divide-y divide-border-subtle"
                        >
                          {suggestedFoods.map((food) => renderFoodItem(food))}
                        </motion.div>
                      </div>
                    </div>
                  )}

                  {/* Empty state when no history */}
                  {frequentFoods.length === 0 && recentFoods.length === 0 && (
                    <div className="text-center py-12">
                      <p className="font-body text-sm text-text-tertiary">
                        {t("foodSearch.emptyCart")}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* SEARCH RESULTS VIEW */}
              {isSearching && (
                <>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="font-body text-sm text-text-tertiary">{t("foodSearch.noResults")}</p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="data-card !p-0 overflow-hidden"
                    >
                      <motion.div
                        initial="initial"
                        animate="animate"
                        variants={staggerContainer(0.02)}
                        className="divide-y divide-border-subtle"
                      >
                        {searchResults.map((r) => renderFoodItem(r.item))}
                      </motion.div>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            {/* CART - Bottom sheet */}
            <AnimatePresence>
              {cart.length > 0 && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={springs.enter}
                  className="shrink-0 border-t border-border bg-background"
                >
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono-label text-text-tertiary">{t("foodSearch.cart")} ({cart.length})</span>
                      <span className="font-display text-lg font-bold text-text-primary">{cartTotalCal} kcal</span>
                    </div>

                    {/* Cart items (scrollable if many) */}
                    <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
                      {cart.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="flex items-center justify-between gap-2 py-1">
                          <div className="min-w-0 flex-1">
                            <span className="font-body text-sm text-text-primary truncate capitalize block">{item.name_it}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono-label text-[11px] text-text-tertiary">{item.grams}g</span>
                            <span className="font-mono-label text-xs text-text-secondary">{scale(item.calories_per_100g, item.grams)}</span>
                            <button
                              onClick={() => handleRemoveFromCart(index)}
                              className="text-text-tertiary hover:text-danger p-0.5 transition-colors"
                            >
                              <TrashIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Macro summary */}
                    <div className="flex gap-2 mb-2 font-mono-label text-[11px]">
                      <span className="text-protein">P:{parseFloat(cartTotalProtein.toFixed(1))}g</span>
                      <span className="text-carbs">C:{parseFloat(cartTotalCarbs.toFixed(1))}g</span>
                      <span className="text-fat">G:{parseFloat(cartTotalFat.toFixed(1))}g</span>
                      <span className="text-fiber">F:{parseFloat(cartTotalFiber.toFixed(1))}g</span>
                    </div>
                    <MacroBar
                      protein={parseFloat(cartTotalProtein.toFixed(1))}
                      carbs={parseFloat(cartTotalCarbs.toFixed(1))}
                      fat={parseFloat(cartTotalFat.toFixed(1))}
                      fiber={parseFloat(cartTotalFiber.toFixed(1))}
                      height={4}
                    />
                  </div>

                  {/* Log meal / Meal type picker */}
                  <div className="px-4 pb-4 pt-2">
                    <AnimatePresence mode="wait">
                      {!showMealType ? (
                        <motion.button
                          key="log-btn"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setShowMealType(true)}
                          className="w-full py-3 rounded-lg bg-[var(--color-accent-dynamic)] text-black font-mono-label hover:opacity-90 transition-all"
                        >
                          {t("foodSearch.logMeal")}
                        </motion.button>
                      ) : (
                        <motion.div
                          key="meal-type-picker"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="space-y-2"
                        >
                          <p className="font-mono-label text-text-tertiary text-center">
                            {t("foodSearch.selectMealType")}
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {mealTypeKeys.map((type) => (
                              <motion.button
                                key={type.value}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleLogMeal(type.value)}
                                className={`py-2.5 rounded-lg font-mono-label text-xs transition-all border border-border hover:bg-surface-raised hover:text-text-primary text-text-secondary ${
                                  getDefaultMealType() === type.value
                                    ? "bg-surface-raised text-text-primary border-border"
                                    : ""
                                }`}
                              >
                                <span className="block text-base mb-0.5">{type.icon}</span>
                                {t(type.labelKey)}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Validate build**

Run: `npm run build`
Expected: Build passes. (Note: the meals page will temporarily break because it uses the old FoodSearch API — we fix that in Task 7.)

**Step 3: Commit**

```bash
git add src/components/FoodSearch.tsx
git commit -m "feat(meals): refactor FoodSearch into full-screen overlay with preset gram picker"
```

---

### Task 7: Rewrite Meals Page to Compose All Premium Sections

**Files:**
- Modify: `src/app/dashboard/meals/page.tsx`

**Step 1: Rewrite the meals page**

Replace entire file content with:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { Meal, User } from "@/lib/types";
import DatePicker from "@/components/DatePicker";
import MacroBar from "@/components/MacroBar";
import DailyRingChart from "@/components/DailyRingChart";
import MacroProgressBars from "@/components/MacroProgressBars";
import MealCard from "@/components/MealCard";
import QuickAddPills from "@/components/QuickAddPills";
import FoodSearch from "@/components/FoodSearch";
import ConfirmModal from "@/components/ConfirmModal";
import AddMealModal from "@/components/AddMealModal";
import { PlusIcon } from "@/components/icons";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";
import { addToRecent, incrementFrequency } from "@/lib/food-history";
import type { FoodItem } from "@/lib/food-database/types";
import type { TranslationKey } from "@/lib/translations";

const mealTypeOrder = ["colazione", "pranzo", "cena", "snack"] as const;

function scale(value: number, grams: number): number {
  return Math.round((value * grams) / 100);
}
function scaleDecimal(value: number, grams: number): number {
  return parseFloat(((value * grams) / 100).toFixed(1));
}

export default function MealsPage() {
  const { t, language } = useLanguage();
  const locale = language === "en" ? "en-US" : "it-IT";

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [mealModalType, setMealModalType] = useState<string | undefined>();
  const [foodSearchOpen, setFoodSearchOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const userId = typeof window !== "undefined" ? localStorage.getItem("vitrack_user_id") : null;

  // Fetch user goals
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/user?id=${userId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setUser(data); })
      .catch(() => {});
  }, [userId]);

  const getMealTypeLabel = (type: string) => {
    const key = `meal.${type}` as TranslationKey;
    return t(key);
  };

  const fetchMeals = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/meals?user_id=${userId}&date=${date}`);
      if (res.ok) setMeals(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [userId, date]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const handleDelete = async () => {
    if (!deleteId || !userId) return;
    setDeleting(true);
    try {
      await fetch(`/api/meals?id=${deleteId}&user_id=${userId}`, { method: "DELETE" });
      fetchMeals();
    } catch { /* ignore */ } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleSaveMeal = async (meal: {
    description: string; calories: number; protein_g: number;
    carbs_g: number; fat_g: number; fiber_g: number; meal_type: string;
  }) => {
    if (!userId) return;
    try {
      await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ...meal }),
      });
      fetchMeals();
    } catch { /* ignore */ }
  };

  const handleQuickAdd = (food: FoodItem, grams: number) => {
    const hour = new Date().getHours();
    let mealType = "snack";
    if (hour >= 6 && hour < 10) mealType = "colazione";
    else if (hour >= 11 && hour < 15) mealType = "pranzo";
    else if (hour >= 18 && hour < 22) mealType = "cena";

    handleSaveMeal({
      description: `${food.name_it}(${grams}g)`,
      calories: scale(food.calories_per_100g, grams),
      protein_g: scaleDecimal(food.protein_per_100g, grams),
      carbs_g: scaleDecimal(food.carbs_per_100g, grams),
      fat_g: scaleDecimal(food.fat_per_100g, grams),
      fiber_g: scaleDecimal(food.fiber_per_100g, grams),
      meal_type: mealType,
    });

    addToRecent(food);
    incrementFrequency(food.id);
  };

  const openAddForType = (type: string) => {
    setMealModalType(type);
    setMealModalOpen(true);
  };

  // Group meals by type
  const grouped = mealTypeOrder.map((type) => ({
    type,
    label: getMealTypeLabel(type),
    meals: meals.filter((m) => m.meal_type === type),
    totalCal: meals.filter((m) => m.meal_type === type).reduce((s, m) => s + m.calories, 0),
  }));

  const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + (m.protein_g ?? 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0);
  const totalFat = meals.reduce((s, m) => s + (m.fat_g ?? 0), 0);
  const totalFiber = meals.reduce((s, m) => s + (m.fiber_g ?? 0), 0);

  const calorieGoal = user?.daily_calorie_target ?? user?.daily_calorie_goal ?? 2000;
  const proteinGoal = user?.macro_protein_g ?? user?.protein_goal ?? 150;
  const carbsGoal = user?.macro_carbs_g ?? user?.carbs_goal ?? 200;
  const fatGoal = user?.macro_fat_g ?? user?.fat_goal ?? 65;

  const mealTypeEmojis: Record<string, string> = {
    colazione: "\u2600\uFE0F",
    pranzo: "\uD83C\uDF24\uFE0F",
    cena: "\uD83C\uDF19",
    snack: "\uD83C\uDF4E",
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-4">
        <div className="h-8 w-32 shimmer rounded-lg" />
        <div className="h-10 w-64 shimmer rounded-lg" />
        <div className="flex justify-center py-8">
          <div className="h-40 w-40 shimmer rounded-full" />
        </div>
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 shimmer rounded-lg" />)}
      </div>
    );
  }

  return (
    <motion.div className="px-4 md:px-8 py-6 space-y-5" initial="initial" animate="animate" variants={staggerContainer(0.08)}>
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary">{t("mealsPage.title")}</h1>
        <DatePicker value={date} onChange={setDate} />
      </motion.div>

      {/* SECTION 1: Hero Daily Summary */}
      <motion.div variants={staggerItem} className="data-card">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <DailyRingChart consumed={totalCalories} goal={calorieGoal} />
          <div className="flex-1 w-full">
            <MacroProgressBars
              protein={{ current: totalProtein, goal: proteinGoal }}
              carbs={{ current: totalCarbs, goal: carbsGoal }}
              fat={{ current: totalFat, goal: fatGoal }}
            />
          </div>
        </div>
      </motion.div>

      {/* SECTION 2: Quick Add Pills */}
      <motion.div variants={staggerItem}>
        <QuickAddPills onQuickAdd={handleQuickAdd} />
      </motion.div>

      {/* SECTION 3: Meal Sections */}
      {grouped.map(({ type, label, meals: sectionMeals, totalCal }) => (
        <motion.div key={type} variants={staggerItem}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{mealTypeEmojis[type]}</span>
              <span className="font-mono-label text-text-tertiary">{label}</span>
              {totalCal > 0 && (
                <span className="font-mono-label text-text-tertiary ml-1">{totalCal} kcal</span>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setFoodSearchOpen(true)}
              className="p-1.5 rounded-lg hover:bg-surface-raised text-text-tertiary hover:text-text-primary transition-all"
            >
              <PlusIcon className="w-4 h-4" />
            </motion.button>
          </div>

          {sectionMeals.length === 0 ? (
            <motion.button
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setFoodSearchOpen(true)}
              className="w-full py-5 rounded-lg border border-dashed border-border text-text-tertiary text-sm hover:border-[var(--color-accent-dynamic)]/30 hover:text-text-secondary transition-all font-body"
            >
              + {t("mealsPage.addType")} {label.toLowerCase()}
            </motion.button>
          ) : (
            <div className="data-card !p-0 divide-y divide-border-subtle overflow-hidden">
              {sectionMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  locale={locale}
                  onDelete={(id) => setDeleteId(id)}
                />
              ))}
            </div>
          )}
        </motion.div>
      ))}

      {/* SECTION 5: Daily Total */}
      {meals.length > 0 && (
        <motion.div variants={staggerItem} className="data-card">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-label text-text-tertiary">{t("mealsPage.dailyTotal")}</span>
            <span className="font-display text-2xl font-bold text-text-primary">{totalCalories} kcal</span>
          </div>
          <MacroBar protein={totalProtein} carbs={totalCarbs} fat={totalFat} fiber={totalFiber} showLabels />
        </motion.div>
      )}

      {/* Floating Add Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setFoodSearchOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-40 w-14 h-14 rounded-full bg-[var(--color-accent-dynamic)] text-black shadow-lg shadow-[var(--color-accent-dynamic)]/25 flex items-center justify-center"
      >
        <PlusIcon className="w-6 h-6" />
      </motion.button>

      {/* Full-screen food search overlay */}
      <FoodSearch
        isOpen={foodSearchOpen}
        onClose={() => setFoodSearchOpen(false)}
        onSave={handleSaveMeal}
        dailyIntake={{
          protein_g: totalProtein,
          carbs_g: totalCarbs,
          fat_g: totalFat,
        }}
        goals={user ? {
          protein_g: user.macro_protein_g ?? user.protein_goal,
          carbs_g: user.macro_carbs_g ?? user.carbs_goal,
          fat_g: user.macro_fat_g ?? user.fat_goal,
        } : undefined}
      />

      <AddMealModal
        isOpen={mealModalOpen}
        onClose={() => setMealModalOpen(false)}
        onSave={handleSaveMeal}
        defaultMealType={mealModalType}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        title={t("mealList.deleteTitle")}
        message={t("mealList.deleteMsg")}
        confirmLabel={t("common.delete")}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </motion.div>
  );
}
```

**Step 2: Validate build**

Run: `npm run build`
Expected: Build passes with no type errors.

**Step 3: Commit**

```bash
git add src/app/dashboard/meals/page.tsx
git commit -m "feat(meals): rewrite page with hero ring chart, quick-add, expandable cards, and FAB"
```

---

### Task 8: Final Build Validation and Polish

**Step 1: Run full build**

Run: `npm run build`
Expected: Build passes with zero errors.

**Step 2: Visual check list (manual)**

Launch `npm run dev` and verify on the Meals page:
- Ring chart animates on load
- Macro progress bars fill smoothly
- Quick-add pills appear if user has food history
- Meal cards expand/collapse on tap
- Delete has shake + confirm interaction
- FAB button opens full-screen search overlay
- Search overlay slides up from bottom
- Gram presets (50/100/150/200) work
- Cart bottom sheet shows with totals
- Meal type picker works
- Daily total card shows at bottom

**Step 3: Commit all together**

```bash
git add -A
git commit -m "feat(meals): complete premium Pasti page redesign with ring chart, expandable cards, full-screen search, and quick-add pills"
```
