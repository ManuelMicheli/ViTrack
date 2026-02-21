"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, springs } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";

interface StreakCalendarProps {
  userId: string;
}

export default function StreakCalendar({ userId }: StreakCalendarProps) {
  const { t, language } = useLanguage();
  const locale = language === "en" ? "en-US" : "it-IT";
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
    <div className="data-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono-label text-text-tertiary">STREAK</span>
        </div>
        <span className="font-display text-2xl font-bold text-[var(--color-accent-dynamic)]">{streak} <span className="font-mono-label text-text-tertiary">{streak === 1 ? t("streak.day") : t("streak.days")}</span></span>
      </div>

      {loading ? (
        <div className="h-10 shimmer rounded-lg" />
      ) : (
        <motion.div
          className="grid grid-cols-10 gap-1"
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.02)}
        >
          {days.map((day) => {
            const isActive = activeDays.has(day);
            const isToday = day === today.toISOString().split("T")[0];
            return (
              <motion.div
                key={day}
                variants={staggerItem}
                whileHover={{ scale: 1.2 }}
                transition={springs.tap}
                className={`aspect-square rounded-sm transition-colors ${
                  isActive
                    ? "bg-success/60"
                    : "bg-surface-raised"
                } ${isToday ? "ring-1 ring-border" : ""}`}
                title={new Date(day + "T12:00:00").toLocaleDateString(locale, { day: "numeric", month: "short" })}
              />
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
