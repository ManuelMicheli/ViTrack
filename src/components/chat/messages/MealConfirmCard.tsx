"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage, MealConfirmData } from "@/lib/types";
import { CoachBubble } from "./CoachBubble";
import { MacroPill } from "../shared/MacroPill";

const MEAL_LABELS: Record<string, string> = {
  colazione: "Colazione", pranzo: "Pranzo", cena: "Cena", snack: "Snack",
};

export function MealConfirmCard({ message, onConfirm, onCancel }: {
  message: ChatMessage;
  onConfirm: (tempId: string) => void;
  onCancel: (tempId: string) => void;
}) {
  const data = message.metadata as unknown as MealConfirmData;
  const [confirmed, setConfirmed] = useState(false);

  if (!data?.items) return null;

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm(data.temp_id);
  };

  return (
    <CoachBubble timestamp={message.created_at}>
      <div className="bg-surface rounded-xl border border-border overflow-hidden min-w-[260px]">
        {/* Header */}
        <div className="px-3 py-2 bg-carbs/10 border-b border-border flex items-center gap-2">
          <span className="text-base">🍽</span>
          <p className="font-medium text-xs text-text-primary">
            Conferma {MEAL_LABELS[data.meal_type] ?? data.meal_type}
          </p>
        </div>

        {/* Food list */}
        <div className="px-3 py-2.5 space-y-1.5">
          {data.items.map((food, i) => (
            <div key={i} className="flex justify-between items-center text-xs">
              <div className="flex-1 min-w-0">
                <span className="text-text-primary">{food.name}</span>
                <span className="text-text-tertiary ml-1">({food.quantity_g}g)</span>
              </div>
              <span className="text-text-tertiary ml-2 tabular-nums flex-shrink-0">
                {Math.round(food.calories)} kcal
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-3 py-2 bg-surface-raised border-t border-border">
          <div className="flex justify-between text-xs font-medium mb-1.5">
            <span className="text-text-primary">Totale</span>
            <span className="text-text-primary tabular-nums">{data.totals.kcal} kcal</span>
          </div>
          <div className="flex gap-2">
            <MacroPill label="P" value={data.totals.protein_g} type="protein" />
            <MacroPill label="C" value={data.totals.carbs_g} type="carbs" />
            <MacroPill label="F" value={data.totals.fat_g} type="fat" />
          </div>
        </div>

        {/* Action buttons / Confirmed state */}
        <AnimatePresence mode="wait">
          {!confirmed ? (
            <motion.div
              key="actions"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-3 py-2.5 flex gap-2 border-t border-border"
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleConfirm}
                className="flex-1 bg-success hover:bg-success/90 text-black text-xs font-medium py-2 rounded-lg transition-colors"
              >
                Conferma
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onCancel(data.temp_id)}
                className="px-3 bg-surface-raised hover:bg-border text-text-secondary text-xs font-medium py-2 rounded-lg transition-colors"
              >
                Annulla
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.25 }}
              className="px-3 py-2 bg-success/10 border-t border-border overflow-hidden"
            >
              <p className="text-xs text-success text-center font-medium">Confermato</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CoachBubble>
  );
}
