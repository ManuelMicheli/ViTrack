"use client";

import type { ChatMessage, WorkoutLoggedData } from "@/lib/types";
import { CoachBubble } from "./CoachBubble";

export function WorkoutLoggedCard({ message }: { message: ChatMessage }) {
  const data = message.metadata as unknown as WorkoutLoggedData;
  if (!data?.exercises) return null;

  return (
    <CoachBubble timestamp={message.created_at}>
      <div className="bg-surface rounded-xl border border-border overflow-hidden min-w-[260px]">
        <div className="px-3 py-2 bg-success/10 border-b border-border flex items-center gap-2">
          <span className="w-5 h-5 bg-success rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <p className="font-medium text-xs text-text-primary">Allenamento registrato</p>
        </div>

        <div className="px-3 py-2">
          <p className="text-xs text-text-secondary">{data.description}</p>
          {data.exercises.length > 0 && (
            <p className="text-[10px] text-text-tertiary mt-1">
              {data.exercises.length} esercizi: {data.exercises.map(e => e.name).join(", ")}
            </p>
          )}
        </div>
      </div>
    </CoachBubble>
  );
}
