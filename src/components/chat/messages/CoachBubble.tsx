"use client";
import type { ReactNode } from "react";

export function CoachBubble({ children, timestamp, compact }: {
  children: ReactNode; timestamp?: string; compact?: boolean;
}) {
  return (
    <div className="flex justify-start gap-2 mb-3">
      <div className={`w-7 h-7 rounded-full bg-surface-raised border border-border flex items-center justify-center flex-shrink-0 ${compact ? "mt-0.5" : "mt-1"}`}>
        <span className="text-xs">🏋️</span>
      </div>
      <div className="max-w-[85%] min-w-0">
        {children}
        {timestamp && (
          <span className="text-[10px] text-text-tertiary mt-0.5 block">
            {new Date(timestamp).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}
