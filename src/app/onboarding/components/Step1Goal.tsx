"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animation-config";

interface Step1GoalProps {
  value: string | null;
  onChange: (value: string) => void;
}

const goals = [
  {
    value: "Aumentare massa muscolare",
    label: "Aumentare massa muscolare",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h2l1-3h2l1 3h6l1-3h2l1 3h2M6 9V7a1 1 0 011-1h1M18 9V7a1 1 0 00-1-1h-1" />
      </svg>
    ),
  },
  {
    value: "Perdere grasso corporeo",
    label: "Perdere grasso corporeo",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
      </svg>
    ),
  },
  {
    value: "Mantenere il peso",
    label: "Mantenere il peso",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5M18.364 5.636l-1.06 1.06M21 12h-1.5M18.364 18.364l-1.06-1.06M12 19.5V21M7.05 7.05L5.99 5.99M4.5 12H3M7.05 16.95l-1.06 1.06M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
      </svg>
    ),
  },
  {
    value: "Migliorare la performance atletica",
    label: "Migliorare la performance atletica",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    value: "Mangiare più sano",
    label: "Mangiare più sano",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
];

export default function Step1Goal({ value, onChange }: Step1GoalProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Obiettivo principale
        </h2>
        <p className="font-body text-sm text-text-secondary">
          Qual è il tuo obiettivo principale? Questo ci aiuterà a personalizzare il tuo piano.
        </p>
      </div>

      <motion.div
        className="space-y-3"
        variants={staggerContainer(0.06)}
        initial="initial"
        animate="animate"
      >
        {goals.map((goal) => {
          const isSelected = value === goal.value;
          return (
            <motion.button
              key={goal.value}
              variants={staggerItem}
              onClick={() => onChange(goal.value)}
              className={`w-full text-left p-4 rounded-lg border transition-all flex items-center gap-4 ${
                isSelected
                  ? "border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/10"
                  : "data-card hover:border-border"
              }`}
              style={
                isSelected
                  ? {}
                  : {
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                    }
              }
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`flex-shrink-0 ${
                  isSelected ? "text-[var(--color-accent-dynamic)]" : "text-text-tertiary"
                }`}
              >
                {goal.icon}
              </div>
              <span
                className={`font-body text-sm ${
                  isSelected ? "text-text-primary" : "text-text-secondary"
                }`}
              >
                {goal.label}
              </span>
              {isSelected && (
                <div className="ml-auto flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-[var(--color-accent-dynamic)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
