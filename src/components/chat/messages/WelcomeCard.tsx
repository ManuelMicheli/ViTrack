"use client";

import type { User } from "@/lib/types";
import { CoachBubble } from "./CoachBubble";

export function WelcomeCard({ user }: { user: User }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buongiorno" : hour < 18 ? "Buon pomeriggio" : "Buonasera";

  return (
    <CoachBubble timestamp={new Date().toISOString()}>
      <div className="bg-surface rounded-xl border border-border overflow-hidden min-w-[260px]">
        <div className="px-3 py-2.5 bg-gradient-to-r from-[var(--color-accent-dynamic)]/20 to-protein/10">
          <p className="font-medium text-sm text-text-primary">
            {greeting} {user.first_name ?? ""}! 👋
          </p>
        </div>
        <div className="px-3 py-2 text-xs">
          <p className="text-text-tertiary mb-1">Oggi</p>
          <p className="text-text-secondary tabular-nums">
            Target: {user.daily_calorie_goal ?? 2000} kcal
          </p>
        </div>
        <div className="px-3 py-2 border-t border-border">
          <p className="text-[10px] text-text-tertiary">
            Dimmi cosa hai mangiato o chiedi un suggerimento
          </p>
        </div>
      </div>
    </CoachBubble>
  );
}
