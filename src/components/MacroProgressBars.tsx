"use client";

import { motion } from "framer-motion";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { springs, staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";

interface MacroProgressBarsProps {
  protein: { current: number; goal: number };
  carbs: { current: number; goal: number };
  fat: { current: number; goal: number };
}

function MacroRow({
  label,
  current,
  goal,
  color,
}: {
  label: string;
  current: number;
  goal: number;
  color: string;
}) {
  const animatedCurrent = useAnimatedNumber(current);
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <motion.div variants={staggerItem} className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-mono-label text-[11px]" style={{ color }}>
          {label}
        </span>
        <span className="font-mono-label text-[11px] text-text-tertiary">
          <motion.span>{animatedCurrent}</motion.span>
          <span className="text-text-tertiary/50"> / {goal}g</span>
        </span>
      </div>
      <div className="h-1.5 w-full bg-surface-raised rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={springs.smooth}
        />
      </div>
    </motion.div>
  );
}

export default function MacroProgressBars({ protein, carbs, fat }: MacroProgressBarsProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer(0.06)}
      className="space-y-2.5 w-full"
    >
      <MacroRow
        label={t("macro.proteinShort")}
        current={protein.current}
        goal={protein.goal}
        color="var(--color-protein)"
      />
      <MacroRow
        label={t("macro.carbsShort")}
        current={carbs.current}
        goal={carbs.goal}
        color="var(--color-carbs)"
      />
      <MacroRow
        label={t("macro.fat")}
        current={fat.current}
        goal={fat.goal}
        color="var(--color-fat)"
      />
    </motion.div>
  );
}
