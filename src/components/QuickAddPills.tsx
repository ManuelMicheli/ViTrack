"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";
import { getFrequentFoodIds } from "@/lib/food-history";
import { getFoodById } from "@/lib/food-database/search";
import type { FoodItem } from "@/lib/food-database/types";

interface QuickAddPillsProps {
  onQuickAdd: (food: FoodItem, grams: number) => void;
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
