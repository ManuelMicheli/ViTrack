"use client";

import { useState, useEffect } from "react";

interface WaterTrackerProps {
  userId: string;
  date: string;
}

const GOAL = 8;

export default function WaterTracker({ userId, date }: WaterTrackerProps) {
  const [glasses, setGlasses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWater = async () => {
      try {
        const res = await fetch(`/api/water?user_id=${userId}&date=${date}`);
        if (res.ok) {
          const data = await res.json();
          setGlasses(data.glasses || 0);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    };
    fetchWater();
  }, [userId, date]);

  const updateGlasses = async (newCount: number) => {
    const clamped = Math.max(0, Math.min(newCount, 12));
    setGlasses(clamped);
    try {
      await fetch("/api/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, glasses: clamped, date }),
      });
    } catch { /* ignore */ }
  };

  const percentage = Math.min((glasses / GOAL) * 100, 100);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">💧</span>
          <h3 className="text-sm font-medium">Acqua</h3>
        </div>
        <span className="text-xs text-[#A1A1A1]">{glasses}/{GOAL}</span>
      </div>

      {loading ? (
        <div className="h-8 shimmer rounded-lg" />
      ) : (
        <>
          <div className="flex gap-1.5 mb-3">
            {Array.from({ length: GOAL }).map((_, i) => (
              <button
                key={i}
                onClick={() => updateGlasses(i < glasses ? i : i + 1)}
                className={`flex-1 h-8 rounded-lg transition-all duration-300 ${
                  i < glasses
                    ? "bg-[#06B6D4]/30 border border-[#06B6D4]/40"
                    : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]"
                }`}
              />
            ))}
          </div>

          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#06B6D4] to-[#0891B2] rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
