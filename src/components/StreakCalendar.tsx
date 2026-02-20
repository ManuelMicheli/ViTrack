"use client";

import { useState, useEffect } from "react";

interface StreakCalendarProps {
  userId: string;
}

export default function StreakCalendar({ userId }: StreakCalendarProps) {
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreak = async () => {
      const days: string[] = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
      }

      const active = new Set<string>();
      // Check recent days in batches - just check if summary has data
      const results = await Promise.allSettled(
        days.map((date) =>
          fetch(`/api/summary?user_id=${userId}&date=${date}`)
            .then((r) => r.ok ? r.json() : null)
        )
      );

      days.forEach((date, i) => {
        const result = results[i];
        if (result.status === "fulfilled" && result.value) {
          const s = result.value;
          if (s.totals?.meals_count > 0 || s.totals?.workouts_count > 0) {
            active.add(date);
          }
        }
      });

      setActiveDays(active);
      setLoading(false);
    };
    fetchStreak();
  }, [userId]);

  // Calculate streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 29; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (activeDays.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🔥</span>
          <h3 className="text-sm font-medium">Streak</h3>
        </div>
        <span className="text-sm font-bold text-[#F59E0B]">{streak} {streak === 1 ? "giorno" : "giorni"}</span>
      </div>

      {loading ? (
        <div className="h-10 shimmer rounded-lg" />
      ) : (
        <div className="grid grid-cols-10 gap-1">
          {days.map((day) => {
            const isActive = activeDays.has(day);
            const isToday = day === today.toISOString().split("T")[0];
            return (
              <div
                key={day}
                className={`aspect-square rounded-sm transition-colors ${
                  isActive
                    ? "bg-[#22C55E]/60"
                    : "bg-white/[0.04]"
                } ${isToday ? "ring-1 ring-white/20" : ""}`}
                title={new Date(day + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
