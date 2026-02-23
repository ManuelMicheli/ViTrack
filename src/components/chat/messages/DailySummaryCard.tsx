"use client";

import type { ChatMessage, DailySummaryData } from "@/lib/types";
import { CoachBubble } from "./CoachBubble";
import { CalorieRing } from "../shared/CalorieRing";
import { MacroBar } from "../shared/MacroBar";
import { WaterBar } from "../shared/WaterBar";

const MEAL_LABELS: Record<string, string> = {
  colazione: "Colazione", pranzo: "Pranzo", cena: "Cena", snack: "Snack",
};

export function DailySummaryCard({ message }: { message: ChatMessage }) {
  const data = message.metadata as unknown as DailySummaryData;
  if (!data?.calories) return null;

  return (
    <CoachBubble timestamp={message.created_at}>
      <div className="bg-surface rounded-xl border border-border overflow-hidden min-w-[280px]">
        <div className="px-3 py-2.5 bg-gradient-to-r from-[var(--color-accent-dynamic)]/20 to-protein/10">
          <p className="font-medium text-xs text-text-primary">📊 Riepilogo Giornata</p>
          <p className="text-[10px] text-text-tertiary">
            {data.date}{data.streak ? ` · 🔥 Streak ${data.streak} giorni` : ""}
          </p>
        </div>

        <div className="px-3 py-3 flex items-center gap-3">
          <CalorieRing current={data.calories.current} target={data.calories.target} size={72} />
          <div>
            <p className="text-lg font-bold tabular-nums text-text-primary">
              {data.calories.current}
              <span className="text-xs font-normal text-text-tertiary"> /{data.calories.target} kcal</span>
            </p>
            <p className="text-[10px] text-text-tertiary tabular-nums">
              Rimanenti: {data.calories.target - data.calories.current} kcal
            </p>
          </div>
        </div>

        <div className="px-3 pb-2.5 space-y-1.5">
          <MacroBar label="Proteine" emoji="🥩" current={data.macros.protein.current} target={data.macros.protein.target} type="protein" />
          <MacroBar label="Carboidrati" emoji="🍞" current={data.macros.carbs.current} target={data.macros.carbs.target} type="carbs" />
          <MacroBar label="Grassi" emoji="🫒" current={data.macros.fat.current} target={data.macros.fat.target} type="fat" />
        </div>

        <div className="px-3 py-2 border-t border-border">
          <WaterBar current_ml={data.water.current_ml} target_ml={data.water.target_ml} />
        </div>

        {data.meals.length > 0 && (
          <div className="px-3 py-2 border-t border-border">
            <p className="text-[10px] font-medium text-text-tertiary uppercase mb-1.5">Pasti</p>
            {data.meals.map((meal, i) => (
              <div key={i} className="flex justify-between text-xs py-0.5">
                <span className="text-text-secondary">{MEAL_LABELS[meal.type] ?? meal.type} — {meal.description}</span>
                <span className="text-text-tertiary tabular-nums ml-2 flex-shrink-0">{meal.calories} kcal</span>
              </div>
            ))}
          </div>
        )}

        {data.workouts.length > 0 && (
          <div className="px-3 py-2 border-t border-border">
            <p className="text-[10px] font-medium text-text-tertiary uppercase mb-1.5">Allenamenti</p>
            {data.workouts.map((w, i) => (
              <div key={i} className="flex justify-between text-xs py-0.5">
                <span className="text-text-secondary">🏋️ {w.description}</span>
                {w.duration_min && <span className="text-text-tertiary ml-2">{w.duration_min}min</span>}
              </div>
            ))}
          </div>
        )}

        {data.insight && (
          <div className="px-3 py-2.5 bg-protein/5 border-t border-border">
            <p className="text-xs text-protein">💡 {data.insight}</p>
          </div>
        )}
      </div>
    </CoachBubble>
  );
}
