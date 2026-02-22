"use client";

import { useAnimatedNumber, motion } from "@/hooks/useAnimatedNumber";
import { staggerContainer, staggerItem } from "@/lib/animation-config";

interface CalorieTargetsProps {
  caloriesCut: number | null;
  caloriesMaintain: number | null;
  caloriesBulk: number | null;
  goal: string | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

const goalToHighlight: Record<string, string> = {
  "Perdere grasso corporeo": "cut",
  "Mantenere il peso": "maintain",
  "Mangiare più sano": "maintain",
  "Aumentare massa muscolare": "bulk",
  "Migliorare la performance atletica": "bulk",
};

// Derive macro grams from calories for each goal
// Maintain = base macros; Cut = -20% cal, higher protein ratio; Bulk = +15% cal, higher carb ratio
function deriveMacros(
  kcal: number | null,
  baseProtein: number | null,
  baseCarbs: number | null,
  baseFat: number | null,
  type: "cut" | "maintain" | "bulk"
): { protein: number; carbs: number; fat: number } | null {
  if (!kcal || !baseProtein || !baseCarbs || !baseFat) return null;

  const totalBaseKcal = baseProtein * 4 + baseCarbs * 4 + baseFat * 9;
  if (totalBaseKcal <= 0) return null;

  const ratio = kcal / totalBaseKcal;

  if (type === "cut") {
    // Keep protein high, reduce carbs and fat proportionally
    const protein = Math.round(baseProtein * 1.05);
    const fat = Math.round(baseFat * ratio * 0.9);
    const remainingKcal = kcal - protein * 4 - fat * 9;
    const carbs = Math.max(0, Math.round(remainingKcal / 4));
    return { protein, carbs, fat };
  }
  if (type === "bulk") {
    // Keep protein, increase carbs more
    const protein = Math.round(baseProtein * ratio);
    const fat = Math.round(baseFat * ratio);
    const remainingKcal = kcal - protein * 4 - fat * 9;
    const carbs = Math.max(0, Math.round(remainingKcal / 4));
    return { protein, carbs, fat };
  }
  // maintain
  return {
    protein: Math.round(baseProtein),
    carbs: Math.round(baseCarbs),
    fat: Math.round(baseFat),
  };
}

function AnimatedCard({
  label,
  value,
  isHighlighted,
  macros,
}: {
  label: string;
  value: number | null;
  isHighlighted: boolean;
  macros: { protein: number; carbs: number; fat: number } | null;
}) {
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

      {macros && (
        <div className="mt-3 pt-3 border-t border-border-subtle flex justify-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-protein)" }} />
            <span className="font-mono-label text-[10px] text-text-tertiary">{macros.protein}g</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-carbs)" }} />
            <span className="font-mono-label text-[10px] text-text-tertiary">{macros.carbs}g</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-fat)" }} />
            <span className="font-mono-label text-[10px] text-text-tertiary">{macros.fat}g</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function CalorieTargets({ caloriesCut, caloriesMaintain, caloriesBulk, goal, proteinG, carbsG, fatG }: CalorieTargetsProps) {
  const highlighted = goal ? goalToHighlight[goal] || "maintain" : "maintain";

  const cutMacros = deriveMacros(caloriesCut, proteinG, carbsG, fatG, "cut");
  const maintainMacros = deriveMacros(caloriesMaintain, proteinG, carbsG, fatG, "maintain");
  const bulkMacros = deriveMacros(caloriesBulk, proteinG, carbsG, fatG, "bulk");

  return (
    <div className="space-y-3">
      <p className="font-mono-label text-text-tertiary">Obiettivi calorici</p>
      <motion.div
        className="grid grid-cols-3 gap-3"
        variants={staggerContainer(0.06)}
        initial="initial"
        animate="animate"
      >
        <AnimatedCard label="Dimagrimento" value={caloriesCut ? Math.round(caloriesCut) : null} isHighlighted={highlighted === "cut"} macros={cutMacros} />
        <AnimatedCard label="Mantenimento" value={caloriesMaintain ? Math.round(caloriesMaintain) : null} isHighlighted={highlighted === "maintain"} macros={maintainMacros} />
        <AnimatedCard label="Massa" value={caloriesBulk ? Math.round(caloriesBulk) : null} isHighlighted={highlighted === "bulk"} macros={bulkMacros} />
      </motion.div>
    </div>
  );
}
