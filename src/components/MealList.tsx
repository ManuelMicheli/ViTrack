"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Meal } from "@/lib/types";
import { TrashIcon } from "./icons";
import ConfirmModal from "./ConfirmModal";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/translations";

interface MealListProps {
  meals: Meal[];
  onDelete?: (mealId: string) => void;
  compact?: boolean;
}

export default function MealList({ meals, onDelete, compact }: MealListProps) {
  const { t } = useLanguage();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getMealTypeLabel = (type: string) => {
    const key = `meal.${type}` as TranslationKey;
    return t(key);
  };

  const handleDelete = async () => {
    if (!deleteId || !onDelete) return;
    setDeleting(true);
    onDelete(deleteId);
    setDeleteId(null);
    setDeleting(false);
  };

  if (meals.length === 0) {
    return (
      <div className="data-card">
        <p className="text-text-tertiary text-sm text-center py-2 font-body">{t("mealList.noMeals")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="data-card !p-0">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <span className="font-mono-label text-text-tertiary">
            {t("mealList.title")} ({meals.length})
          </span>
        </div>
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.05)}
          className="divide-y divide-border-subtle"
        >
          <AnimatePresence mode="popLayout">
            {meals.slice(0, compact ? 3 : undefined).map((meal) => (
              <motion.div
                key={meal.id}
                variants={staggerItem}
                exit={{ opacity: 0, x: -100 }}
                layout
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80 && onDelete) setDeleteId(meal.id);
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-start justify-between px-5 py-3 hover:bg-surface-raised transition-colors group"
              >
                <div className="flex gap-3 flex-1 min-w-0">
                  <span className="font-mono-label text-text-tertiary self-center">{getMealTypeLabel(meal.meal_type)}</span>
                  <div className="min-w-0">
                    <p className="font-body text-[15px] text-text-primary truncate">{meal.description}</p>
                    <div className="flex gap-2 mt-1 font-mono-label text-[11px]">
                      <span className="text-protein">P:{meal.protein_g ?? 0}g</span>
                      <span className="text-carbs">C:{meal.carbs_g ?? 0}g</span>
                      <span className="text-fat">G:{meal.fat_g ?? 0}g</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="font-mono-label text-text-secondary whitespace-nowrap">{meal.calories} kcal</span>
                  {onDelete && (
                    <button
                      onClick={() => setDeleteId(meal.id)}
                      className="opacity-0 group-hover:opacity-100 text-danger hover:bg-danger/10 rounded p-1 transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

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
    </>
  );
}
