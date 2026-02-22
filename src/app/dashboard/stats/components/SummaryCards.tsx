"use client";

import { useAnimatedNumber, motion } from "@/hooks/useAnimatedNumber";
import { useLanguage } from "@/lib/language-context";

interface SummaryCardsProps {
  avgCalories: number;
  totalWorkouts: number;
  avgProtein: number;
  totalBurned: number;
}

function StatCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const animValue = useAnimatedNumber(value);

  return (
    <motion.div whileHover={{ y: -1 }} className="data-card">
      <p className="font-mono-label text-[10px] text-text-tertiary">{label}</p>
      <p className={`font-display text-xl font-bold mt-1 ${color}`}>
        <motion.span>{animValue}</motion.span>
        {unit && <span className="text-xs font-normal text-text-tertiary ml-1">{unit}</span>}
      </p>
    </motion.div>
  );
}

export default function SummaryCards({ avgCalories, totalWorkouts, avgProtein, totalBurned }: SummaryCardsProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label={t("statsPage.avgCalories")} value={avgCalories} unit="kcal" color="text-text-primary" />
      <StatCard label={t("statsPage.workouts")} value={totalWorkouts} unit="" color="text-text-primary" />
      <StatCard label={t("statsPage.avgProtein")} value={avgProtein} unit="g" color="text-protein" />
      <StatCard label={t("statsPage.caloriesBurned")} value={totalBurned} unit="kcal" color="text-carbs" />
    </div>
  );
}
