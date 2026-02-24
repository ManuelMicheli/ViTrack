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
  /** When set, skip the meal type picker and use this type directly */
  preselectedMealType?: string;
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
export default function FoodSearch({ isOpen, onClose, onSave, dailyIntake, goals, preselectedMealType }: FoodSearchProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  // State
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gramsInput, setGramsInput] = useState("100");
  const grams = parseInt(gramsInput, 10) || 0;
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
      setGramsInput(String(food.serving_size_g));
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
    setGramsInput("100");
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

      {/* Improved gram picker with presets */}
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
              <div className="flex items-center gap-2 justify-center flex-wrap">
                {gramPresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={(e) => { e.stopPropagation(); setGramsInput(String(preset)); }}
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
                    onClick={(e) => { e.stopPropagation(); setGramsInput(String(food.serving_size_g)); }}
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
                  onClick={(e) => { e.stopPropagation(); setGramsInput(String(Math.max(1, grams - 10))); }}
                  className="w-9 h-9 rounded-lg border border-border text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-all font-mono-label text-lg flex items-center justify-center"
                >
                  -
                </button>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={gramsInput}
                    onChange={(e) => setGramsInput(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-16 text-center bg-transparent border border-border rounded-lg py-1.5 font-mono-label text-sm text-text-primary outline-none focus:border-[var(--color-accent-dynamic)]/30 transition-all"
                    min={1}
                  />
                  <span className="font-mono-label text-[11px] text-text-tertiary">g</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setGramsInput(String(grams + 10)); }}
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
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-text-primary">
                    {t("foodSearch.addFood")}
                  </h2>
                  {preselectedMealType && (
                    <span className="px-2 py-0.5 rounded-md bg-surface-raised border border-border font-mono-label text-xs text-text-secondary flex items-center gap-1">
                      {mealTypeKeys.find(m => m.value === preselectedMealType)?.icon}
                      {t(mealTypeKeys.find(m => m.value === preselectedMealType)?.labelKey ?? "meal.snack")}
                    </span>
                  )}
                </div>
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
                    {preselectedMealType ? (
                      /* Preselected meal type — skip picker, save directly */
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleLogMeal(preselectedMealType)}
                        className="w-full py-3 rounded-lg bg-[var(--color-accent-dynamic)] text-black font-mono-label hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        <span>{mealTypeKeys.find(m => m.value === preselectedMealType)?.icon}</span>
                        {t("foodSearch.logMeal")} — {t(mealTypeKeys.find(m => m.value === preselectedMealType)?.labelKey ?? "meal.snack")}
                      </motion.button>
                    ) : (
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
                    )}
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
