"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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

export default function MacroChart({
  proteinG,
  carbsG,
  fatG,
  weightKg,
}: MacroChartProps) {
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
          {/* Donut chart */}
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
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend / breakdown */}
          <div className="flex-1 space-y-3">
            {data.map((macro) => {
              const pct = totalKcal > 0 ? Math.round((macro.value / totalKcal) * 100) : 0;
              const perKg = weightKg && weightKg > 0 ? (macro.grams / weightKg).toFixed(1) : null;

              return (
                <div key={macro.name} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: macro.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <span className="font-body text-sm text-text-primary">{macro.name}</span>
                      <span className="font-body text-xs text-text-tertiary">{pct}%</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-sm font-bold text-text-primary">
                        {Math.round(macro.grams)}g
                      </span>
                      <span className="font-body text-xs text-text-tertiary">
                        {Math.round(macro.value)} kcal
                      </span>
                      {perKg && macro.name !== "Grassi" && (
                        <span className="font-body text-xs text-text-tertiary">
                          ({perKg} g/kg)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
