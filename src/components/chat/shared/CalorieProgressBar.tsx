"use client";

export function CalorieProgressBar({ current, target }: { current: number; target: number }) {
  const percentage = Math.min(current / (target || 1), 1);
  const isOver = current > target;
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="font-medium tabular-nums text-text-primary">{current} kcal</span>
        <span className="text-text-tertiary tabular-nums">{target} kcal</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-danger" : "bg-success"}`} style={{ width: `${Math.min(percentage, 1) * 100}%` }} />
      </div>
    </div>
  );
}
