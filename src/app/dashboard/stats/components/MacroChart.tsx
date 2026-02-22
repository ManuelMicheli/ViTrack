"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useAnimatedNumber, motion } from "@/hooks/useAnimatedNumber";
import { staggerContainer, staggerItem } from "@/lib/animation-config";

interface MacroChartProps {
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  weightKg: number | null;
}

const COLORS = {
  protein: "var(--color-protein)",
  carbs: "var(--color-carbs)",
  fat: "var(--color-fat)",
};

function MacroLegendRow({ name, grams, kcal, pct, perKg, color }: {
  name: string; grams: number; kcal: number; pct: number; perKg: string | null; color: string;
}) {
  const animGrams = useAnimatedNumber(Math.round(grams));
  const animKcal = useAnimatedNumber(Math.round(kcal));

  return (
    <motion.div variants={staggerItem} className="flex items-center gap-3">
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <span className="font-body text-sm text-text-primary">{name}</span>
          <span className="font-body text-xs text-text-tertiary">{pct}%</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-sm font-bold text-text-primary">
            <motion.span>{animGrams}</motion.span>g
          </span>
          <span className="font-body text-xs text-text-tertiary">
            <motion.span>{animKcal}</motion.span> kcal
          </span>
          {perKg && name !== "Grassi" && (
            <span className="font-body text-xs text-text-tertiary">({perKg} g/kg)</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function MacroChart({ proteinG, carbsG, fatG, weightKg }: MacroChartProps) {
  if (!proteinG && !carbsG && !fatG) {
    return (
      <div className="data-card text-center py-8">
        <p className="font-body text-sm text-text-tertiary">
          Completa l&apos;onboarding per vedere i tuoi macro
        </p>
      </div>
    );
  }

  const protein = proteinG ?? 0;
  const carbs = carbsG ?? 0;
  const fat = fatG ?? 0;
  const proteinKcal = protein * 4;
  const carbsKcal = carbs * 4;
  const fatKcal = fat * 9;
  const totalKcal = proteinKcal + carbsKcal + fatKcal;

  const data = [
    { name: "Proteine", value: proteinKcal, grams: protein, color: COLORS.protein },
    { name: "Carboidrati", value: carbsKcal, grams: carbs, color: COLORS.carbs },
    { name: "Grassi", value: fatKcal, grams: fat, color: COLORS.fat },
  ];

  return (
    <div className="space-y-3">
      <p className="font-mono-label text-text-tertiary">Ripartizione macro</p>
      <div className="data-card">
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  dataKey="value"
                  strokeWidth={0}
                  animationDuration={800}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <motion.div
            className="flex-1 space-y-3"
            variants={staggerContainer(0.1)}
            initial="initial"
            animate="animate"
          >
            {data.map((macro) => {
              const pct = totalKcal > 0 ? Math.round((macro.value / totalKcal) * 100) : 0;
              const perKg = weightKg && weightKg > 0 ? (macro.grams / weightKg).toFixed(1) : null;
              return (
                <MacroLegendRow
                  key={macro.name}
                  name={macro.name}
                  grams={macro.grams}
                  kcal={macro.value}
                  pct={pct}
                  perKg={perKg}
                  color={macro.color}
                />
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
