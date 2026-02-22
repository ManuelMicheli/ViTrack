"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animation-config";

interface CalorieTargetsProps {
  caloriesCut: number | null;
  caloriesMaintain: number | null;
  caloriesBulk: number | null;
  goal: string | null;
}

const goalToHighlight: Record<string, string> = {
  "Perdere grasso corporeo": "cut",
  "Mantenere il peso": "maintain",
  "Mangiare più sano": "maintain",
  "Aumentare massa muscolare": "bulk",
  "Migliorare la performance atletica": "bulk",
};

export default function CalorieTargets({
  caloriesCut,
  caloriesMaintain,
  caloriesBulk,
  goal,
}: CalorieTargetsProps) {
  const highlighted = goal ? goalToHighlight[goal] || "maintain" : "maintain";

  const targets = [
    {
      key: "cut",
      label: "Dimagrimento",
      value: caloriesCut ? Math.round(caloriesCut) : null,
    },
    {
      key: "maintain",
      label: "Mantenimento",
      value: caloriesMaintain ? Math.round(caloriesMaintain) : null,
    },
    {
      key: "bulk",
      label: "Massa",
      value: caloriesBulk ? Math.round(caloriesBulk) : null,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="font-mono-label text-text-tertiary">Obiettivi calorici</p>
      <motion.div
        className="grid grid-cols-3 gap-3"
        variants={staggerContainer(0.06)}
        initial="initial"
        animate="animate"
      >
        {targets.map((target) => {
          const isHighlighted = target.key === highlighted;
          return (
            <motion.div
              key={target.key}
              variants={staggerItem}
              className={`data-card text-center relative ${
                isHighlighted
                  ? "border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/5"
                  : ""
              }`}
            >
              {isHighlighted && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[var(--color-accent-dynamic)] text-black rounded-full whitespace-nowrap" style={{ fontSize: "9px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Il tuo obiettivo
                </span>
              )}
              <p className="font-display text-xl font-bold text-text-primary mt-1">
                {target.value ?? "--"}
              </p>
              <p className="font-body text-xs text-text-tertiary">kcal</p>
              <p className="font-mono-label text-text-tertiary mt-2">{target.label}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
