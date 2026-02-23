"use client";

import type { ChatMessage, MealSuggestionData } from "@/lib/types";
import { CoachBubble } from "./CoachBubble";
import { MacroPill } from "../shared/MacroPill";

export function MealSuggestionCard({ message, onSelect }: {
  message: ChatMessage;
  onSelect: (optionName: string) => void;
}) {
  const data = message.metadata as unknown as MealSuggestionData;
  if (!data?.options) return null;

  return (
    <CoachBubble timestamp={message.created_at}>
      <div className="space-y-2 min-w-[260px]">
        {data.context && <p className="text-xs text-text-secondary mb-2">{data.context}</p>}

        <div className="flex gap-1.5 mb-2 flex-wrap">
          <span className="text-[10px] bg-surface-raised border border-border px-2 py-0.5 rounded tabular-nums text-text-secondary">
            Budget: {data.remaining.kcal} kcal
          </span>
          <MacroPill label="P" value={data.remaining.protein_g} type="protein" />
          <MacroPill label="C" value={data.remaining.carbs_g} type="carbs" />
          <MacroPill label="F" value={data.remaining.fat_g} type="fat" />
        </div>

        {data.options.map((option, i) => (
          <button
            key={i}
            onClick={() => onSelect(option.name)}
            className="w-full bg-surface rounded-xl border border-border p-2.5 text-left hover:border-[var(--color-accent-dynamic)] transition-all group"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs text-text-primary group-hover:text-[var(--color-accent-dynamic)] transition-colors">{option.name}</p>
                <p className="text-[10px] text-text-tertiary mt-0.5">{option.description}</p>
              </div>
              <span className="text-xs font-medium tabular-nums text-text-primary ml-2 flex-shrink-0">{option.kcal} kcal</span>
            </div>
            <div className="flex gap-1.5 mt-1.5">
              <MacroPill label="P" value={option.macros.protein_g} type="protein" />
              <MacroPill label="C" value={option.macros.carbs_g} type="carbs" />
              <MacroPill label="F" value={option.macros.fat_g} type="fat" />
            </div>
          </button>
        ))}
      </div>
    </CoachBubble>
  );
}
