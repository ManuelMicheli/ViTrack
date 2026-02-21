"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { springs } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";

function AnimatedNum({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, springs.number);
  const display = useTransform(spring, (v) => Math.round(v));
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      mv.set(value);
      return;
    }
    mv.set(value);
  }, [value, mv]);

  return <motion.span>{display}</motion.span>;
}

interface WaterTrackerProps {
  userId: string;
  date: string;
  waterGoalMl?: number;
  trackingMode?: "glasses" | "ml";
  onSettingsChange?: (settings: { water_goal_ml: number; water_tracking_mode: "glasses" | "ml" }) => void;
}

const ML_PER_GLASS = 250;
const QUICK_ML_OPTIONS = [150, 250, 500];

export default function WaterTracker({
  userId,
  date,
  waterGoalMl = 2000,
  trackingMode = "glasses",
  onSettingsChange,
}: WaterTrackerProps) {
  const { t } = useLanguage();
  const [glasses, setGlasses] = useState(0);
  const [ml, setMl] = useState(0);
  const [mode, setMode] = useState<"glasses" | "ml">(trackingMode);
  const [goalMl, setGoalMl] = useState(waterGoalMl);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<{ date: string; value: number }[]>([]);
  const [celebrated, setCelebrated] = useState(false);

  const goalGlasses = Math.round(goalMl / ML_PER_GLASS);
  const currentMl = mode === "glasses" ? glasses * ML_PER_GLASS : ml;
  const percentage = Math.min((currentMl / goalMl) * 100, 100);
  const isComplete = percentage >= 100;

  // Fetch today's water data
  useEffect(() => {
    const fetchWater = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/water?user_id=${userId}&date=${date}`);
        if (res.ok) {
          const data = await res.json();
          setGlasses(data.glasses || 0);
          setMl(data.ml || 0);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchWater();
  }, [userId, date]);

  // Fetch 7-day history for sparkline
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/water?user_id=${userId}&days=7`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((d: { date: string; glasses: number; ml: number }) => ({
            date: d.date,
            value: mode === "glasses" ? d.glasses * ML_PER_GLASS : d.ml,
          }));
          setHistory(mapped);
        }
      } catch {
        /* ignore */
      }
    };
    fetchHistory();
  }, [userId, mode]);

  // Celebration effect
  useEffect(() => {
    if (isComplete && !celebrated) {
      setCelebrated(true);
      const timer = setTimeout(() => setCelebrated(false), 2000);
      return () => clearTimeout(timer);
    }
    if (!isComplete) setCelebrated(false);
  }, [isComplete, celebrated]);

  const saveWater = useCallback(
    async (newGlasses: number, newMl: number) => {
      try {
        await fetch("/api/water", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, glasses: newGlasses, ml: newMl, date }),
        });
      } catch {
        /* ignore */
      }
    },
    [userId, date]
  );

  const handleGlassToggle = (index: number) => {
    const newCount = index < glasses ? index : index + 1;
    const clamped = Math.max(0, Math.min(newCount, 20));
    setGlasses(clamped);
    saveWater(clamped, ml);
  };

  const handleAddMl = (amount: number) => {
    const newMl = Math.max(0, ml + amount);
    setMl(newMl);
    saveWater(glasses, newMl);
  };

  const handleModeSwitch = (newMode: "glasses" | "ml") => {
    setMode(newMode);
    onSettingsChange?.({ water_goal_ml: goalMl, water_tracking_mode: newMode });
  };

  const handleSaveGoal = () => {
    const parsed = parseInt(goalInput);
    if (parsed > 0 && parsed <= 10000) {
      setGoalMl(parsed);
      setEditingGoal(false);
      onSettingsChange?.({ water_goal_ml: parsed, water_tracking_mode: mode });
    }
  };

  // Donut chart dimensions
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="data-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono-label text-text-tertiary">{t("water.title")}</span>

        {/* Mode toggle */}
        <div className="flex bg-surface-raised rounded-lg p-0.5">
          <button
            onClick={() => handleModeSwitch("glasses")}
            className={`px-2.5 py-1 rounded-md font-mono-label transition-all ${
              mode === "glasses"
                ? "bg-water/20 text-water"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {t("water.glasses")}
          </button>
          <button
            onClick={() => handleModeSwitch("ml")}
            className={`px-2.5 py-1 rounded-md font-mono-label transition-all ${
              mode === "ml"
                ? "bg-water/20 text-water"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            ML
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-28 shimmer rounded-lg" />
      ) : (
        <>
          {/* Main content: Donut + Info */}
          <div className="flex items-center gap-4 mb-3">
            {/* Donut progress */}
            <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="-rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth={strokeWidth}
                />
                <motion.circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="var(--color-water)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset: offset }}
                  transition={springs.smooth}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-display text-lg font-bold transition-colors ${isComplete ? "text-water" : "text-text-primary"}`}>
                  <AnimatedNum value={Math.round(percentage)} />%
                </span>
              </div>
              {/* Celebration pulse */}
              {celebrated && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-water"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>

            {/* Info + Quick actions */}
            <div className="flex-1 min-w-0">
              {/* Current / Goal */}
              <div className="mb-2">
                <p className="font-display text-lg font-bold leading-tight text-text-primary">
                  {mode === "glasses" ? (
                    <>
                      <AnimatedNum value={glasses} /> <span className="font-mono-label text-text-tertiary font-normal">/ {goalGlasses} {t("water.glassesUnit")}</span>
                    </>
                  ) : (
                    <>
                      <AnimatedNum value={ml} /> <span className="font-mono-label text-text-tertiary font-normal">/ {goalMl} ml</span>
                    </>
                  )}
                </p>
                {/* Editable goal */}
                {editingGoal ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="number"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      placeholder={String(goalMl)}
                      className="w-16 bg-transparent border border-border rounded-lg px-2 py-0.5 text-xs text-text-primary font-body focus:outline-none focus:border-water/40"
                      autoFocus
                    />
                    <span className="font-mono-label text-text-tertiary">ml</span>
                    <button onClick={handleSaveGoal} className="font-mono-label text-water">OK</button>
                    <button onClick={() => setEditingGoal(false)} className="font-mono-label text-text-tertiary">x</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingGoal(true); setGoalInput(String(goalMl)); }}
                    className="font-mono-label text-text-tertiary hover:text-water transition-colors mt-0.5"
                  >
                    {t("water.editGoal")}
                  </button>
                )}
              </div>

              {/* Quick add buttons */}
              {mode === "glasses" ? (
                <div className="flex gap-1.5">
                  <motion.button
                    onClick={() => handleGlassToggle(glasses)}
                    className="flex-1 py-1.5 rounded-lg bg-water/10 border border-water/20 text-water font-mono-label hover:bg-water/20 transition-colors"
                    whileTap={{ scale: 0.9 }}
                    transition={springs.tap}
                  >
                    +1
                  </motion.button>
                  <motion.button
                    onClick={() => { const n = Math.max(0, glasses - 1); setGlasses(n); saveWater(n, ml); }}
                    className="flex-1 py-1.5 rounded-lg border border-border text-text-tertiary font-mono-label hover:bg-surface-raised transition-colors"
                    whileTap={{ scale: 0.9 }}
                    transition={springs.tap}
                  >
                    -1
                  </motion.button>
                </div>
              ) : (
                <div className="flex gap-1">
                  {QUICK_ML_OPTIONS.map((amount) => (
                    <motion.button
                      key={amount}
                      onClick={() => handleAddMl(amount)}
                      className="flex-1 py-1.5 rounded-lg bg-water/10 border border-water/20 text-water font-mono-label hover:bg-water/20 transition-colors"
                      whileTap={{ scale: 0.9 }}
                      transition={springs.tap}
                    >
                      +{amount}
                    </motion.button>
                  ))}
                  <motion.button
                    onClick={() => handleAddMl(-250)}
                    className="py-1.5 px-2 rounded-lg border border-border text-text-tertiary font-mono-label hover:bg-surface-raised transition-colors"
                    whileTap={{ scale: 0.9 }}
                    transition={springs.tap}
                  >
                    -
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* Glass buttons row (glasses mode only) */}
          {mode === "glasses" && (
            <div className="flex gap-1 mb-3">
              {Array.from({ length: goalGlasses }).map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => handleGlassToggle(i)}
                  className={`flex-1 h-6 rounded-md transition-colors duration-300 ${
                    i < glasses
                      ? "bg-water/30 border border-water/40"
                      : "bg-surface-raised border border-border hover:bg-surface-raised"
                  }`}
                  whileTap={{ scale: 0.9 }}
                  transition={springs.tap}
                />
              ))}
            </div>
          )}

          {/* 7-day sparkline */}
          {history.length > 1 && (
            <div className="border-t border-border pt-2">
              <p className="font-mono-label text-text-tertiary mb-1">{t("water.last7days")}</p>
              <ResponsiveContainer width="100%" height={32}>
                <LineChart data={history}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-water)"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
