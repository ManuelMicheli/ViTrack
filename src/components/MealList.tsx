"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Meal } from "@/lib/types";
import { TrashIcon } from "./icons";
import ConfirmModal from "./ConfirmModal";
import { staggerContainer, staggerItem } from "@/lib/animation-config";

interface MealListProps {
  meals: Meal[];
  onDelete?: (mealId: string) => void;
  compact?: boolean;
}

const mealTypeLabels: Record<string, string> = {
  colazione: "Colazione",
  pranzo: "Pranzo",
  cena: "Cena",
  snack: "Snack",
};

export default function MealList({ meals, onDelete, compact }: MealListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId || !onDelete) return;
    setDeleting(true);
    onDelete(deleteId);
    setDeleteId(null);
    setDeleting(false);
  };

  if (meals.length === 0) {
    return (
      <div className="glass-card p-6">
        <p className="text-[#666] text-sm text-center py-2">Nessun pasto registrato</p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs text-[#666] uppercase tracking-wider font-medium">
            Pasti ({meals.length})
          </h3>
        </div>
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.05)}
          className="space-y-2"
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
                className="flex items-start justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition-colors group"
              >
                <div className="flex gap-3 flex-1 min-w-0">
                  <span className="text-[10px] text-[#666] uppercase tracking-wider self-center">{mealTypeLabels[meal.meal_type] || "Pasto"}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm truncate">{meal.description}</p>
                    <div className="flex gap-2 mt-1 text-xs">
                      <span className="text-[#3B82F6]">P:{meal.protein_g ?? 0}g</span>
                      <span className="text-[#F59E0B]">C:{meal.carbs_g ?? 0}g</span>
                      <span className="text-[#EF4444]">G:{meal.fat_g ?? 0}g</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm font-semibold whitespace-nowrap">{meal.calories} kcal</span>
                  {onDelete && (
                    <button
                      onClick={() => setDeleteId(meal.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#666] hover:text-[#EF4444] transition-all"
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
        title="Elimina pasto"
        message="Vuoi eliminare questo pasto? L'azione è irreversibile."
        confirmLabel="Elimina"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
