"use client";

interface MacroBarProps {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  height?: number;
  showLabels?: boolean;
}

export default function MacroBar({
  protein,
  carbs,
  fat,
  fiber,
  height = 8,
  showLabels = false,
}: MacroBarProps) {
  const total = protein + carbs + fat + fiber;

  if (total === 0) {
    return (
      <div
        className="w-full bg-surface-raised rounded-full overflow-hidden"
        style={{ height }}
      />
    );
  }

  const segments = [
    { value: protein, color: "var(--color-protein)", label: "P" },
    { value: carbs, color: "var(--color-carbs)", label: "C" },
    { value: fat, color: "var(--color-fat)", label: "G" },
    { value: fiber, color: "var(--color-fiber)", label: "F" },
  ];

  return (
    <div>
      <div
        className="w-full flex rounded-full overflow-hidden"
        style={{ height }}
      >
        {segments.map((seg) =>
          seg.value > 0 ? (
            <div
              key={seg.label}
              style={{
                width: `${(seg.value / total) * 100}%`,
                backgroundColor: seg.color,
              }}
              className="transition-all duration-500"
            />
          ) : null
        )}
      </div>
      {showLabels && (
        <div className="flex gap-3 mt-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1 text-xs text-text-secondary">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span>
                {seg.label}: {seg.value}g
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
