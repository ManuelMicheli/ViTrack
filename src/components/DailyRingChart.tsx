"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { springs } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";

interface DailyRingChartProps {
  consumed: number;
  goal: number;
}

export default function DailyRingChart({ consumed, goal }: DailyRingChartProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const animatedConsumed = useAnimatedNumber(consumed);

  const percentage = goal > 0 ? Math.min((consumed / goal) * 100, 150) : 0;

  // SVG ring params
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * Math.min(percentage, 100)) / 100;

  // Color based on percentage
  const ringColor =
    percentage > 100
      ? "var(--color-danger, #ef4444)"
      : percentage >= 80
        ? "var(--color-carbs, #eab308)"
        : "var(--color-accent-dynamic, #22c55e)";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-surface-raised, #1a1a1a)"
            strokeWidth={strokeWidth}
          />
        </svg>

        {/* Animated fill ring */}
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: mounted ? dashOffset : circumference }}
            transition={springs.smooth}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className="font-display text-3xl font-bold text-text-primary leading-none">
            {animatedConsumed}
          </motion.span>
          <span className="font-mono-label text-[11px] text-text-tertiary mt-0.5">
            / {goal} kcal
          </span>
        </div>
      </div>

      {/* Label below */}
      <span className="font-mono-label text-[11px] text-text-tertiary">
        {consumed <= goal
          ? `${Math.max(0, goal - consumed)} kcal ${t("mealsPage.remaining")}`
          : `+${consumed - goal} kcal`}
      </span>
    </div>
  );
}
