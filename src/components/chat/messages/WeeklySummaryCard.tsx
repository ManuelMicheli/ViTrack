"use client";

import type { ChatMessage, WeeklySummaryData } from "@/lib/types";
import { CoachBubble } from "./CoachBubble";
import { CalorieProgressBar } from "../shared/CalorieProgressBar";

export function WeeklySummaryCard({ message }: { message: ChatMessage }) {
  const data = message.metadata as unknown as WeeklySummaryData;
  if (!data) return null;

  return (
    <CoachBubble timestamp={message.created_at}>
      <div className="bg-surface rounded-xl border border-border overflow-hidden min-w-[260px]">
        <div className="px-3 py-2.5 bg-gradient-to-r from-protein/20 to-carbs/10">
          <p className="font-medium text-xs text-text-primary">
            📈 Report Settimanale
          </p>
        </div>

        <div className="px-3 py-2.5 space-y-2">
          <div>
            <p className="text-[10px] text-text-tertiary uppercase mb-1">
              Media calorie giornaliera
            </p>
            <CalorieProgressBar
              current={data.avg_daily_calories}
              target={data.calorie_goal}
            />
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Proteine medie</span>
            <span className="text-text-primary tabular-nums font-medium">
              {data.avg_daily_protein}g/giorno
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Allenamenti</span>
            <span className="text-text-primary tabular-nums font-medium">
              {data.workout_count} sessioni
            </span>
          </div>

          {data.weight_change != null && (
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary">Variazione peso</span>
              <span
                className={`tabular-nums font-medium ${
                  data.weight_change > 0
                    ? "text-red-400"
                    : data.weight_change < 0
                      ? "text-green-400"
                      : "text-text-primary"
                }`}
              >
                {data.weight_change > 0 ? "+" : ""}
                {data.weight_change} kg
              </span>
            </div>
          )}
        </div>

        {message.content && (
          <div className="px-3 py-2.5 bg-protein/5 border-t border-border">
            <p className="text-xs text-text-secondary">{message.content}</p>
          </div>
        )}
      </div>
    </CoachBubble>
  );
}
