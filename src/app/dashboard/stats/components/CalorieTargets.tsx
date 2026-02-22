"use client";

import { useAnimatedNumber, motion } from "@/hooks/useAnimatedNumber";
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
  "Mangiare pi\u00f9 sano": "maintain",
  "Aumentare massa muscolare": "bulk",
  "Migliorare la performance atletica": "bulk",
};

function AnimatedCard({ label, value, isHighlighted }: { label: string; value: number | null; isHighlighted: boolean }) {
  const animValue = useAnimatedNumber(value ?? 0);

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -2 }}
      className={`data-card text-center relative transition-shadow ${
        isHighlighted
          ? "border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/5 shadow-[0_0_20px_-5px_var(--color-accent-dynamic)]"
          : ""
      }`}
    >
      {isHighlighted && (
        <span
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[var(--color-accent-dynamic)] text-black rounded-full whitespace-nowrap"
          style={{ fontSize: "9px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}
        >
          Il tuo obiettivo
        </span>
      )}
      <p className="font-display text-xl font-bold text-text-primary mt-1">
        {value ? <motion.span>{animValue}</motion.span> : "--"}
      </p>
      <p className="font-body text-xs text-text-tertiary">kcal</p>
      <p className="font-mono-label text-text-tertiary mt-2">{label}</p>
    </motion.div>
  );
}

export default function CalorieTargets({ caloriesCut, caloriesMaintain, caloriesBulk, goal }: CalorieTargetsProps) {
  const highlighted = goal ? goalToHighlight[goal] || "maintain" : "maintain";

  return (
    <div className="space-y-3">
      <p className="font-mono-label text-text-tertiary">Obiettivi calorici</p>
      <motion.div
        className="grid grid-cols-3 gap-3"
        variants={staggerContainer(0.06)}
        initial="initial"
        animate="animate"
      >
        <AnimatedCard label="Dimagrimento" value={caloriesCut ? Math.round(caloriesCut) : null} isHighlighted={highlighted === "cut"} />
        <AnimatedCard label="Mantenimento" value={caloriesMaintain ? Math.round(caloriesMaintain) : null} isHighlighted={highlighted === "maintain"} />
        <AnimatedCard label="Massa" value={caloriesBulk ? Math.round(caloriesBulk) : null} isHighlighted={highlighted === "bulk"} />
      </motion.div>
    </div>
  );
}
