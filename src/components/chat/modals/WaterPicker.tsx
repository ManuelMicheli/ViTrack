"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const PRESETS = [250, 330, 500, 750, 1000];

export function WaterPicker({ onLog, onClose }: {
  onLog: (ml: number) => void;
  onClose: () => void;
}) {
  const [custom, setCustom] = useState("");

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
        <h3 className="font-medium text-sm text-text-primary text-center">💧 Quanta acqua?</h3>

        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((ml, i) => (
            <motion.button
              key={ml}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => onLog(ml)}
              className="py-3 bg-water/10 rounded-xl text-water font-medium text-sm
                         hover:bg-water/20 transition-colors"
            >
              {ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
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
              placeholder="ml"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && custom) onLog(parseInt(custom)); }}
              className="w-full py-3 text-center bg-surface-raised border border-border rounded-xl text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-water"
            />
            {custom && (
              <button
                onClick={() => onLog(parseInt(custom))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-water text-xs font-medium"
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
