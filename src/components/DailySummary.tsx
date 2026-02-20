"use client";

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
  };
}

const macroCards = [
  { key: "protein_g", label: "Proteine", unit: "g", color: "#3B82F6", goal: 150 },
  { key: "carbs_g", label: "Carboidrati", unit: "g", color: "#F59E0B", goal: 250 },
  { key: "fat_g", label: "Grassi", unit: "g", color: "#EF4444", goal: 70 },
  { key: "fiber_g", label: "Fibre", unit: "g", color: "#22C55E", goal: 30 },
] as const;

export default function DailySummary({ totals }: DailySummaryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {macroCards.map((macro) => {
        const value = totals[macro.key];
        const pct = Math.min((value / macro.goal) * 100, 100);
        return (
          <div key={macro.key} className="glass-card p-3">
            <span className="text-[10px] text-[#666] uppercase tracking-wider">{macro.label}</span>
            <p className="text-xl font-bold mt-1">
              {value}
              <span className="text-xs font-normal text-[#666] ml-0.5">{macro.unit}</span>
            </p>
            <div className="mt-2 w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: macro.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
