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
        className="w-full bg-[#1A1A1A] rounded-full overflow-hidden"
        style={{ height }}
      />
    );
  }

  const segments = [
    { value: protein, color: "#3B82F6", label: "P" },
    { value: carbs, color: "#F59E0B", label: "C" },
    { value: fat, color: "#EF4444", label: "G" },
    { value: fiber, color: "#22C55E", label: "F" },
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
            <div key={seg.label} className="flex items-center gap-1 text-xs text-[#A1A1A1]">
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
