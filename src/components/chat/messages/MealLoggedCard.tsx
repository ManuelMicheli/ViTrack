"use client";

import type { ChatMessage, MealLoggedData } from "@/lib/types";
import { CoachBubble } from "./CoachBubble";
import { MacroPill } from "../shared/MacroPill";
import { CalorieProgressBar } from "../shared/CalorieProgressBar";

const MEAL_LABELS: Record<string, string> = {
  colazione: "Colazione", pranzo: "Pranzo", cena: "Cena", snack: "Snack",
};

export function MealLoggedCard({ message }: { message: ChatMessage }) {
  const data = message.metadata as unknown as MealLoggedData;
  if (!data?.items) return null;

  return (
    <CoachBubble timestamp={message.created_at}>
      <div className="bg-surface rounded-xl border border-border overflow-hidden min-w-[260px]">
        {/* Header with checkmark */}
        <div className="px-3 py-2 bg-success/10 border-b border-border flex items-center gap-2">
          <span className="w-5 h-5 bg-success rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <p className="font-medium text-xs text-text-primary">
            {MEAL_LABELS[data.meal_type] ?? data.meal_type} registrato
          </p>
        </div>

        {/* Foods compact */}
        <div className="px-3 py-2">
          <p className="text-xs text-text-secondary">
            {data.items.map(f => f.name).join(", ")}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-medium text-text-primary tabular-nums">{data.totals.kcal} kcal</span>
            <MacroPill label="P" value={data.totals.protein_g} type="protein" />
            <MacroPill label="C" value={data.totals.carbs_g} type="carbs" />
            <MacroPill label="F" value={data.totals.fat_g} type="fat" />
          </div>
        </div>

        {/* Day progress inline */}
        {data.day_status && (
          <div className="px-3 py-2 border-t border-border">
            <CalorieProgressBar
              current={data.day_status.total_calories}
              target={data.day_status.target_calories}
            />
            <p className="text-[10px] text-text-tertiary mt-1 tabular-nums">
              Rimanenti: {data.day_status.remaining_calories} kcal
            </p>
          </div>
        )}
      </div>
    </CoachBubble>
  );
}
