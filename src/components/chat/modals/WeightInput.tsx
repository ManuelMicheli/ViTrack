"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const PRESETS = [60, 65, 70, 75, 80, 85];

export function WeightInput({ onLog, onClose }: {
  onLog: (kg: number) => void;
  onClose: () => void;
}) {
  const [custom, setCustom] = useState("");

  const handleSubmit = () => {
    const val = parseFloat(custom);
    if (!isNaN(val) && val > 0) onLog(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-surface rounded-t-2xl w-full max-w-[400px] p-5 space-y-4 border-t border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-medium text-sm text-text-primary text-center">
          ⚖️ Quanto pesi oggi?
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((kg, i) => (
            <motion.button
              key={kg}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => onLog(kg)}
              className="py-3 bg-[var(--color-accent-dynamic)]/10 rounded-xl text-[var(--color-accent-dynamic)] font-medium text-sm
                         hover:bg-[var(--color-accent-dynamic)]/20 transition-colors"
            >
              {kg} kg
            </motion.button>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: PRESETS.length * 0.03 }}
            className="relative"
          >
            <input
              type="number"
              step="0.1"
              placeholder="kg"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              className="w-full py-3 text-center bg-surface-raised border border-border rounded-xl text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-[var(--color-accent-dynamic)]"
            />
            {custom && (
              <button
                onClick={handleSubmit}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-accent-dynamic)] text-xs font-medium"
              >
                OK
              </button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
