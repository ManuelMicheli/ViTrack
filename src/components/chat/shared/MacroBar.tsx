"use client";

const BAR_COLORS = { protein: "bg-protein", carbs: "bg-carbs", fat: "bg-fat" } as const;

export function MacroBar({ label, emoji, current, target, type }: {
  label: string; emoji: string; current: number; target: number; type: "protein" | "carbs" | "fat";
}) {
  const percentage = Math.min(current / (target || 1), 1);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-5 flex-shrink-0">{emoji}</span>
      <div className="flex-1">
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[type]}`} style={{ width: `${percentage * 100}%` }} />
        </div>
      </div>
      <span className="text-[10px] text-text-tertiary tabular-nums w-20 text-right flex-shrink-0">{Math.round(current)}g / {Math.round(target)}g</span>
    </div>
  );
}
