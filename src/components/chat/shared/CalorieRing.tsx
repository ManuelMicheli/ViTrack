"use client";

export function CalorieRing({ current, target, size = 80 }: {
  current: number; target: number; size?: number;
}) {
  const percentage = Math.min(current / (target || 1), 1.2);
  const clamped = Math.min(percentage, 1);
  const strokeWidth = size * 0.12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clamped);

  const color = percentage > 1.05 ? "var(--color-danger)"
    : percentage >= 0.7 ? "var(--color-success)"
    : percentage >= 0.4 ? "var(--color-carbs)"
    : "var(--color-danger)";

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold tabular-nums text-text-primary">{Math.round(percentage * 100)}%</span>
      </div>
    </div>
  );
}
