"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FoodSearchResult } from "@/lib/food-search";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/translations";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import { TrashIcon } from "./icons";
import MacroBar from "./MacroBar";

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

const SOURCE_LABELS: Record<string, string> = {
  crea: "CREA",
  usda: "USDA",
  openfoodfacts: "OFF",
  fatsecret: "FS",
};

function scale(value: number, grams: number): number {
  return Math.round((value * grams) / 100);
}

function scaleDecimal(value: number, grams: number): number {
  return parseFloat(((value * grams) / 100).toFixed(1));
}

export default function FoodSearch({ onSave }: FoodSearchProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [grams, setGrams] = useState(100);
  const [cart, setCart] = useState<(FoodSearchResult & { grams: number })[]>([]);
  const [showMealType, setShowMealType] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setShowResults(true);
      try {
        const res = await fetch("/api/foods/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
        }
      } catch {
        // ignore network errors
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close results
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
        setSelectedId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (result: FoodSearchResult) => {
    if (selectedId === result.id) {
      setSelectedId(null);
    } else {
      setSelectedId(result.id);
      setGrams(100);
    }
  };

  const handleAddToCart = (result: FoodSearchResult) => {
    setCart((prev) => [...prev, { ...result, grams }]);
    setSelectedId(null);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
    setShowMealType(false);
  };

  const handleLogMeal = (mealType: string) => {
    const description = cart
      .map((item) => `${item.name}(${item.grams}g)`)
      .join(", ");

    const totalCalories = cart.reduce((s, item) => s + scale(item.calories_100g, item.grams), 0);
    const totalProtein = cart.reduce((s, item) => s + scaleDecimal(item.protein_100g, item.grams), 0);
    const totalCarbs = cart.reduce((s, item) => s + scaleDecimal(item.carbs_100g, item.grams), 0);
    const totalFat = cart.reduce((s, item) => s + scaleDecimal(item.fat_100g, item.grams), 0);
    const totalFiber = cart.reduce((s, item) => s + scaleDecimal(item.fiber_100g, item.grams), 0);

    onSave({
      description,
      calories: totalCalories,
      protein_g: parseFloat(totalProtein.toFixed(1)),
      carbs_g: parseFloat(totalCarbs.toFixed(1)),
      fat_g: parseFloat(totalFat.toFixed(1)),
      fiber_g: parseFloat(totalFiber.toFixed(1)),
      meal_type: mealType,
    });

    // Reset everything
    setCart([]);
    setQuery("");
    setResults([]);
    setShowResults(false);
    setShowMealType(false);
    setSelectedId(null);
    setGrams(100);
  };

  // Cart totals
  const cartTotalCal = cart.reduce((s, item) => s + scale(item.calories_100g, item.grams), 0);
  const cartTotalProtein = cart.reduce((s, item) => s + scaleDecimal(item.protein_100g, item.grams), 0);
  const cartTotalCarbs = cart.reduce((s, item) => s + scaleDecimal(item.carbs_100g, item.grams), 0);
  const cartTotalFat = cart.reduce((s, item) => s + scaleDecimal(item.fat_100g, item.grams), 0);
  const cartTotalFiber = cart.reduce((s, item) => s + scaleDecimal(item.fiber_100g, item.grams), 0);

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
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("foodSearch.placeholder")}
            className="flex-1 bg-transparent text-text-primary placeholder-text-tertiary font-body text-sm outline-none"
          />
          {searching && (
            <span className="font-mono-label text-[11px] text-text-tertiary animate-pulse">
              {t("foodSearch.searching")}
            </span>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      <AnimatePresence>
        {showResults && (query.trim().length >= 2) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="data-card !p-0 overflow-hidden"
          >
            {searching && results.length === 0 ? (
              <div className="space-y-0">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="h-4 w-3/4 shimmer rounded" />
                    <div className="h-3 w-1/2 shimmer rounded mt-2" />
                  </div>
                ))}
              </div>
            ) : results.length === 0 && !searching ? (
              <div className="px-4 py-6 text-center">
                <p className="font-body text-sm text-text-tertiary">{t("foodSearch.noResults")}</p>
              </div>
            ) : (
              <motion.div
                initial="initial"
                animate="animate"
                variants={staggerContainer(0.03)}
                className="divide-y divide-border-subtle"
              >
                {results.map((result) => (
                  <motion.div key={result.id} variants={staggerItem}>
                    <button
                      onClick={() => handleSelectResult(result)}
                      className="w-full text-left px-4 py-3 hover:bg-surface-raised transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-body text-sm text-text-primary truncate capitalize">
                            {result.name}
                          </p>
                          <p className="font-mono-label text-[11px] text-text-tertiary mt-0.5">
                            {result.calories_100g} kcal{" "}
                            <span className="text-text-tertiary/60">&middot;</span>{" "}
                            <span className="text-protein">P:{result.protein_100g}g</span>{" "}
                            <span className="text-carbs">C:{result.carbs_100g}g</span>{" "}
                            <span className="text-fat">G:{result.fat_100g}g</span>
                          </p>
                        </div>
                        <span className="font-mono-label text-[10px] text-text-tertiary/50 shrink-0 mt-0.5">
                          {SOURCE_LABELS[result.source] ?? result.source}
                        </span>
                      </div>
                    </button>

                    {/* Gram picker (inline below selected result) */}
                    <AnimatePresence>
                      {selectedId === result.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 space-y-3">
                            {/* Gram controls */}
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

                            {/* Scaled macros */}
                            <div className="grid grid-cols-4 gap-1.5">
                              <div className="p-2 rounded-lg bg-protein/10 text-center">
                                <p className="font-mono-label text-[10px] text-protein">P</p>
                                <p className="font-display text-xs font-bold text-text-primary">
                                  {scaleDecimal(result.protein_100g, grams)}g
                                </p>
                              </div>
                              <div className="p-2 rounded-lg bg-carbs/10 text-center">
                                <p className="font-mono-label text-[10px] text-carbs">C</p>
                                <p className="font-display text-xs font-bold text-text-primary">
                                  {scaleDecimal(result.carbs_100g, grams)}g
                                </p>
                              </div>
                              <div className="p-2 rounded-lg bg-fat/10 text-center">
                                <p className="font-mono-label text-[10px] text-fat">G</p>
                                <p className="font-display text-xs font-bold text-text-primary">
                                  {scaleDecimal(result.fat_100g, grams)}g
                                </p>
                              </div>
                              <div className="p-2 rounded-lg bg-fiber/10 text-center">
                                <p className="font-mono-label text-[10px] text-fiber">F</p>
                                <p className="font-display text-xs font-bold text-text-primary">
                                  {scaleDecimal(result.fiber_100g, grams)}g
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="font-mono-label text-sm text-text-secondary">
                                {scale(result.calories_100g, grams)} kcal
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(result);
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
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart */}
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
                    <p className="font-body text-sm text-text-primary truncate capitalize">{item.name}</p>
                    <div className="flex gap-2 mt-0.5 font-mono-label text-[11px]">
                      <span className="text-text-secondary">{item.grams}g</span>
                      <span className="text-text-tertiary/60">&middot;</span>
                      <span className="text-protein">P:{scaleDecimal(item.protein_100g, item.grams)}g</span>
                      <span className="text-carbs">C:{scaleDecimal(item.carbs_100g, item.grams)}g</span>
                      <span className="text-fat">G:{scaleDecimal(item.fat_100g, item.grams)}g</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-label text-sm text-text-secondary whitespace-nowrap">
                      {scale(item.calories_100g, item.grams)} kcal
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
      {cart.length === 0 && !showResults && (
        <p className="font-body text-sm text-text-tertiary text-center py-2">
          {t("foodSearch.emptyCart")}
        </p>
      )}
    </div>
  );
}
