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
              {/* Macro detail grid */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 rounded-lg bg-protein/10 text-center">
                  <p className="font-mono-label text-[10px] text-protein">P</p>
                  <p className="font-display text-xs font-bold text-text-primary">{protein}g</p>
                </div>
                <div className="p-2 rounded-lg bg-carbs/10 text-center">
                  <p className="font-mono-label text-[10px] text-carbs">C</p>
                  <p className="font-display text-xs font-bold text-text-primary">{carbs}g</p>
                </div>
                <div className="p-2 rounded-lg bg-fat/10 text-center">
                  <p className="font-mono-label text-[10px] text-fat">G</p>
                  <p className="font-display text-xs font-bold text-text-primary">{fat}g</p>
                </div>
                <div className="p-2 rounded-lg bg-fiber/10 text-center">
                  <p className="font-mono-label text-[10px] text-fiber">F</p>
                  <p className="font-display text-xs font-bold text-text-primary">{fiber}g</p>
                </div>
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
