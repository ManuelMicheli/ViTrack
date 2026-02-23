"use client";
import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-surface-raised border border-border flex items-center justify-center flex-shrink-0 mt-1">
        <span className="text-xs">🏋️</span>
      </div>
      <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 bg-text-tertiary rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}
