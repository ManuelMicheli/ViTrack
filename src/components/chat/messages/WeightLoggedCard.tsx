"use client";

import type { ChatMessage, WeightLoggedData } from "@/lib/types";
import { CoachBubble } from "./CoachBubble";

export function WeightLoggedCard({ message }: { message: ChatMessage }) {
  const data = message.metadata as unknown as WeightLoggedData;
  if (!data) return null;

  const trend =
    data.change_kg != null
      ? data.change_kg > 0
        ? "up"
        : data.change_kg < 0
          ? "down"
          : "stable"
      : null;

  const trendIcon = trend === "up" ? "\u2191" : trend === "down" ? "\u2193" : "\u2192";
  const trendColor =
    trend === "up"
      ? "text-red-400"
      : trend === "down"
        ? "text-green-400"
        : "text-text-tertiary";

  return (
    <CoachBubble timestamp={message.created_at} compact>
      <div className="flex items-center gap-2.5 py-0.5 min-w-[200px]">
        <span className="text-base">{"\u2696\uFE0F"}</span>
        <span className="text-sm font-bold tabular-nums text-text-primary">
          {data.weight_kg} kg
        </span>
        {trend && data.change_kg != null && (
          <span className={`text-xs tabular-nums ${trendColor}`}>
            {trendIcon} {data.change_kg > 0 ? "+" : ""}
            {data.change_kg} kg
          </span>
        )}
      </div>
    </CoachBubble>
  );
}
