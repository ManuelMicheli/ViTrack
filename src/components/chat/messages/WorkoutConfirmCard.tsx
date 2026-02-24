"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage, WorkoutConfirmData } from "@/lib/types";
import { CoachBubble } from "./CoachBubble";

export function WorkoutConfirmCard({ message, onConfirm, onCancel }: {
  message: ChatMessage;
  onConfirm: (tempId: string) => void;
  onCancel: (tempId: string) => void;
}) {
  const data = message.metadata as unknown as WorkoutConfirmData;
  const [confirmed, setConfirmed] = useState(false);

  if (!data?.exercises) return null;

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm(data.temp_id);
  };

  return (
    <CoachBubble timestamp={message.created_at}>
      <div className="bg-surface rounded-xl border border-border overflow-hidden min-w-[260px]">
        <div className="px-3 py-2 bg-protein/10 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🏋️</span>
            <div>
              <p className="font-medium text-xs text-text-primary">{data.description}</p>
              {data.duration_min && (
                <p className="text-[10px] text-text-tertiary">{data.duration_min} min</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-3 py-2.5 space-y-2">
          {data.exercises.map((exercise, i) => (
            <div key={i} className="text-xs">
              <span className="font-medium text-text-primary">{exercise.name}</span>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                <span className="bg-surface-raised border border-border px-1.5 py-0.5 rounded text-[10px] tabular-nums text-text-secondary">
                  {exercise.sets}×{exercise.reps}{exercise.weight_kg ? ` @${exercise.weight_kg}kg` : ""}
                </span>
              </div>
            </div>
          ))}
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
