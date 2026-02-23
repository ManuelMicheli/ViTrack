"use client";

import type { ChatMessage, WaterLoggedData } from "@/lib/types";
import { CoachBubble } from "./CoachBubble";

export function WaterLoggedCard({ message }: { message: ChatMessage }) {
  const data = message.metadata as unknown as WaterLoggedData;
  if (!data) return null;

  const percentage = Math.min(data.current_ml / (data.target_ml || 1), 1);

  return (
    <CoachBubble timestamp={message.created_at} compact>
      <div className="flex items-center gap-2.5 py-0.5 min-w-[200px]">
        <span className="text-base">💧</span>
        <div className="flex-1">
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-water rounded-full transition-all duration-500" style={{ width: `${percentage * 100}%` }} />
          </div>
        </div>
        <span className="text-xs font-medium tabular-nums text-text-secondary whitespace-nowrap">
          {data.current_ml}ml / {data.target_ml}ml
        </span>
      </div>
    </CoachBubble>
  );
}
