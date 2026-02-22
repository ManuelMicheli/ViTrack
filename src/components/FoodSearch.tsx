"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/translations";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import { TrashIcon } from "./icons";
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
  onSave: (meal: {
    description: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    meal_type: string;
  }) => void;
  /** Current daily intake — used to compute macro-based suggestions */
  dailyIntake?: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  /** User goals — used to compute macro-based suggestions */
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
export default function FoodSearch({ onSave, dailyIntake, goals }: FoodSearchProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // State
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [grams, setGrams] = useState(100);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showMealType, setShowMealType] = useState(false);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [frequentFoodIds, setFrequentFoodIds] = useState<string[]>([]);

  // Load history on mount
  useEffect(() => {
    setRecentFoods(getRecentFoods());
    setFrequentFoodIds(getFrequentFoodIds());
  }, []);

  // Fuzzy search results (debounced via useMemo on trimmed query)
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 150);
    return () => clearTimeout(timer);
  }, [query]);

  const searchResults = useMemo(() => {
    if (debouncedQuery.length < 2) return [];
    return searchLocalFoods(debouncedQuery, { limit: 6 });
  }, [debouncedQuery]);

  // Frequent foods resolved from IDs
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

    // Find the macro with the largest relative deficit
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

    // Only show suggestions if there's a meaningful deficit (>20% remaining)
    if (maxRatio < 0.2) return { suggestedFoods: [] as FoodItem[], deficitLabel: "" };

    return {
      suggestedFoods: getSuggestedFoods(deficitMacro, 5),
      deficitLabel: label,
    };
  }, [dailyIntake, goals]);

  // What to show
  const isSearching = debouncedQuery.length >= 2;
  const showHome = !isSearching;

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
    // Refresh history
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
  };

  // Cart totals
  const cartTotalCal = cart.reduce((s, item) => s + scale(item.calories_per_100g, item.grams), 0);
  const cartTotalProtein = cart.reduce((s, item) => s + scaleDecimal(item.protein_per_100g, item.grams), 0);
  const cartTotalCarbs = cart.reduce((s, item) => s + scaleDecimal(item.carbs_per_100g, item.grams), 0);
  const cartTotalFat = cart.reduce((s, item) => s + scaleDecimal(item.fat_per_100g, item.grams), 0);
  const cartTotalFiber = cart.reduce((s, item) => s + scaleDecimal(item.fiber_per_100g, item.grams), 0);

  // ---------------------------------------------------------------------------
  // Render food item row
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
                <span className="font-mono-label text-[10px] text-[var(--color-accent-dynamic)]/70">
                  {food.brand}
                </span>
              )}
              {food.brand && (
                <span className="text-text-tertiary/40 text-[10px]">&middot;</span>
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

      {/* Gram picker */}
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
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGrams((g) => Math.max(1, g - 10));
                  }}
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
                    className="w-16 text-center bg-transparent border border-border rounded-lg py-1.5 font-mono-label text-sm text-text-primary outline-none focus:border-[var(--color-accent-dynamic)]/30 transition-all"
                    min={1}
                  />
                  <span className="font-mono-label text-[11px] text-text-tertiary">g</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGrams((g) => g + 10);
                  }}
                  className="w-9 h-9 rounded-lg border border-border text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-all font-mono-label text-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>

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

              <div className="flex items-center justify-between">
                <span className="font-mono-label text-sm text-text-secondary">
                  {scale(food.calories_per_100g, grams)} kcal
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(food);
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--color-accent-dynamic)] text-black font-mono-label text-sm hover:opacity-90 transition-all"
                >
                  {t("foodSearch.addToCart")}
                </button>
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
    <div ref={containerRef} className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-transparent focus-within:border-[var(--color-accent-dynamic)]/30 transition-all">
          <svg
            className="w-4 h-4 text-text-tertiary shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

      {/* ── HOME VIEW: Frequent + Recent + Suggested ── */}
      {showHome && (
        <div className="space-y-4">
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
                    className="shrink-0 px-3 py-2 rounded-lg border border-border hover:bg-surface-raised transition-all"
                  >
                    <p className="font-body text-xs text-text-primary whitespace-nowrap capitalize">{food.name_it}</p>
                    <p className="font-mono-label text-[10px] text-text-tertiary mt-0.5">{food.calories_per_100g} kcal</p>
                  </button>
                ))}
              </div>
              {/* Inline gram picker for frequent food */}
              <AnimatePresence>
                {selectedId && frequentFoods.some(f => f.id === selectedId) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2"
                  >
                    {renderFoodItem(frequentFoods.find(f => f.id === selectedId)!)}
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
                  {recentFoods.slice(0, 5).map((food) => (
                    <button
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className="w-full text-left px-4 py-2.5 hover:bg-surface-raised transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-body text-sm text-text-primary truncate capitalize">{food.name_it}</p>
                          {food.brand && (
                            <span className="font-mono-label text-[10px] text-text-tertiary">{food.brand}</span>
                          )}
                        </div>
                        <span className="font-mono-label text-[11px] text-text-tertiary shrink-0 ml-2">
                          {food.calories_per_100g} kcal
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Inline gram picker for recent food */}
              <AnimatePresence>
                {selectedId && recentFoods.some(f => f.id === selectedId) && !frequentFoods.some(f => f.id === selectedId) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2"
                  >
                    <div className="data-card !p-0">
                      {renderFoodItem(recentFoods.find(f => f.id === selectedId)!)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Suggested foods based on macro deficit */}
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
        </div>
      )}

      {/* ── SEARCH RESULTS VIEW (flat list, no categories) ── */}
      {isSearching && (
        <div className="space-y-2">
          {searchResults.length === 0 ? (
            <div className="data-card text-center py-6">
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
        </div>
      )}

      {/* ── CART ── */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="data-card !p-0"
          >
            <div className="px-4 pt-4 pb-2">
              <span className="font-mono-label text-text-tertiary">{t("foodSearch.cart")}</span>
            </div>

            <div className="divide-y divide-border-subtle">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="px-4 py-3 flex items-center justify-between gap-2 group">
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm text-text-primary truncate capitalize">{item.name_it}</p>
                    <div className="flex gap-2 mt-0.5 font-mono-label text-[11px]">
                      <span className="text-text-secondary">{item.grams}g</span>
                      <span className="text-text-tertiary/60">&middot;</span>
                      <span className="text-protein">P:{scaleDecimal(item.protein_per_100g, item.grams)}g</span>
                      <span className="text-carbs">C:{scaleDecimal(item.carbs_per_100g, item.grams)}g</span>
                      <span className="text-fat">G:{scaleDecimal(item.fat_per_100g, item.grams)}g</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-label text-sm text-text-secondary whitespace-nowrap">
                      {scale(item.calories_per_100g, item.grams)} kcal
                    </span>
                    <button
                      onClick={() => handleRemoveFromCart(index)}
                      className="text-text-tertiary hover:text-danger hover:bg-danger/10 rounded p-1 transition-all"
                      title={t("foodSearch.remove")}
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart totals */}
            <div className="px-4 pt-2 pb-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-label text-text-tertiary">{t("foodSearch.total")}</span>
                <span className="font-display text-lg font-bold text-text-primary">{cartTotalCal} kcal</span>
              </div>
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
            <div className="px-4 pb-4">
              <AnimatePresence mode="wait">
                {!showMealType ? (
                  <motion.button
                    key="log-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
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

      {/* Empty cart hint */}
      {cart.length === 0 && !showHome && !isSearching && (
        <p className="font-body text-sm text-text-tertiary text-center py-2">
          {t("foodSearch.emptyCart")}
        </p>
      )}
    </div>
  );
}
