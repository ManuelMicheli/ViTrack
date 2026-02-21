"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { springs } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";

interface CalorieProgressProps {
  current: number;
  goal: number;
  burned: number;
  compact?: boolean;
}

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

export default function CalorieProgress({ current, goal, burned, compact }: CalorieProgressProps) {
  const { t } = useLanguage();
  const percentage = Math.min((current / goal) * 100, 100);
  const isOver = current > goal;
  const remaining = Math.max(goal - current, 0);

  return (
    <div className={`data-card ${compact ? "p-4" : "p-6"}`}>
      <div className="flex flex-col">
        {/* Hero calorie number */}
        <div>
          <span className="font-display text-4xl font-bold text-text-primary"><AnimatedNum value={current} /></span>
          <span className="font-body text-sm text-text-tertiary ml-2">kcal su {goal}</span>
        </div>

        {/* Percentage */}
        <p className="font-mono-label text-text-secondary mt-1">{Math.round(percentage)}%</p>

        {/* Thin progress bar */}
        <div className="mt-4 w-full h-0.5 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--color-accent-dynamic)]"
            animate={{ width: percentage + "%" }}
            transition={springs.smooth}
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6 mt-5 w-full text-center">
          <div>
            <p className="font-display text-lg font-bold"><AnimatedNum value={current} /></p>
            <p className="font-mono-label text-text-tertiary">{t("calories.consumed")}</p>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-amber-500"><AnimatedNum value={burned} /></p>
            <p className="font-mono-label text-text-tertiary">{t("calories.burned")}</p>
          </div>
          <div>
            <p className={`font-display text-lg font-bold ${isOver ? "text-red-500" : "text-green-500"}`}>
              {isOver ? "+" : ""}<AnimatedNum value={isOver ? current - goal : remaining} />
            </p>
            <p className="font-mono-label text-text-tertiary">
              {isOver ? t("calories.excess") : t("calories.remaining")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
