"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { springs, staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/translations";

interface DailySummaryProps {
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    meals_count: number;
    workouts_count: number;
    calories_burned: number;
    net_calories: number;
  };
  compact?: boolean;
}

const macroCards: { key: "protein_g" | "carbs_g" | "fat_g" | "fiber_g"; labelKey: TranslationKey; unit: string; color: string; goal: number }[] = [
  { key: "protein_g", labelKey: "macro.protein", unit: "g", color: "#3B82F6", goal: 150 },
  { key: "carbs_g", labelKey: "macro.carbs", unit: "g", color: "#F59E0B", goal: 250 },
  { key: "fat_g", labelKey: "macro.fat", unit: "g", color: "#EF4444", goal: 70 },
  { key: "fiber_g", labelKey: "macro.fiber", unit: "g", color: "#22C55E", goal: 30 },
];

function AnimatedNum({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, springs.number);
  const display = useTransform(spring, (v) => Math.round(v));
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      mv.set(value);
      return;
    }
    mv.set(value);
  }, [value, mv]);
  return <motion.span>{display}</motion.span>;
}

export default function DailySummary({ totals, compact }: DailySummaryProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      initial="initial"
      animate="animate"
      variants={staggerContainer(0.08)}
    >
      {macroCards.map((macro) => {
        const value = totals[macro.key];
        const pct = Math.min((value / macro.goal) * 100, 100);
        return (
          <motion.div key={macro.key} className={`data-card ${compact ? "p-2" : "p-3"}`} variants={staggerItem}>
            <span className="font-mono-label text-text-tertiary">{t(macro.labelKey)}</span>
            <p className="font-display text-lg font-bold mt-1">
              <AnimatedNum value={value} />
              <span className="font-body text-xs font-normal text-text-tertiary ml-0.5">{macro.unit}</span>
            </p>
            <div className="mt-2 w-full h-0.5 bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: pct + "%" }}
                transition={springs.smooth}
                style={{ backgroundColor: macro.color }}
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
