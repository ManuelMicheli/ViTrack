"use client";

const COLORS = {
  protein: "bg-protein/20 text-protein",
  carbs: "bg-carbs/20 text-carbs",
  fat: "bg-fat/20 text-fat",
} as const;

export function MacroPill({ label, value, type }: {
  label: string; value: number; type: "protein" | "carbs" | "fat";
}) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium tabular-nums ${COLORS[type]}`}>
      {label} {Math.round(value)}g
    </span>
  );
}
