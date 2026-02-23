"use client";

export function WaterBar({ current_ml, target_ml }: { current_ml: number; target_ml: number }) {
  const percentage = Math.min(current_ml / (target_ml || 1), 1);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm flex-shrink-0">💧</span>
      <div className="flex-1">
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-water rounded-full transition-all duration-500" style={{ width: `${percentage * 100}%` }} />
        </div>
      </div>
      <span className="text-[10px] text-text-tertiary tabular-nums flex-shrink-0">{current_ml}ml / {target_ml}ml</span>
    </div>
  );
}
