"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart,
  Area,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { springs, staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";

/* -- Animated number (inline) -- */
function AnimatedNum({ value }: { value: number | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const sp = useSpring(mv, springs.number);
  const display = useTransform(sp, (v) => v.toFixed(1));

  useEffect(() => {
    if (value !== null) mv.set(value);
  }, [value, mv]);

  useEffect(() => {
    const unsub = display.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsub;
  }, [display]);

  if (value === null) return <span>{"\u2014"}</span>;
  return <span ref={ref}>{value.toFixed(1)}</span>;
}

interface WeightChartProps {
  userId: string;
  weightGoalKg?: number | null;
  heightCm?: number | null;
  onGoalChange?: (goal: number | null) => void;
}

type Period = 7 | 30 | 90;

interface ChartEntry {
  date: string;
  weight: number;
  avg?: number;
}

export default function WeightChart({
  userId,
  weightGoalKg,
  heightCm,
  onGoalChange,
}: WeightChartProps) {
  const { t, language } = useLanguage();
  const locale = language === "en" ? "en-US" : "it-IT";

  const [data, setData] = useState<ChartEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(30);
  const [weightInput, setWeightInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchWeight = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weight?user_id=${userId}&days=${period}`);
      if (res.ok) {
        const logs = await res.json();
        const chartData: ChartEntry[] = logs
          .reverse()
          .map((log: { weight_kg: number; logged_at: string }) => ({
            date: new Date(log.logged_at).toLocaleDateString(locale, {
              day: "numeric",
              month: "short",
            }),
            weight: log.weight_kg,
          }));

        // Calculate 5-point moving average
        for (let i = 0; i < chartData.length; i++) {
          const window = chartData.slice(Math.max(0, i - 2), i + 3);
          chartData[i].avg =
            Math.round(
              (window.reduce((sum, d) => sum + d.weight, 0) / window.length) * 10
            ) / 10;
        }

        setData(chartData);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [userId, period, locale]);

  useEffect(() => {
    fetchWeight();
  }, [fetchWeight]);

  const handleSaveWeight = async () => {
    if (!weightInput) return;
    setSaving(true);
    try {
      await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          weight_kg: parseFloat(weightInput),
        }),
      });
      setShowInput(false);
      setWeightInput("");
      fetchWeight();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGoal = () => {
    const parsed = parseFloat(goalInput);
    if (parsed > 0 && parsed < 500) {
      setEditingGoal(false);
      onGoalChange?.(parsed);
    }
  };

  // Stats calculations
  const latest = data.length > 0 ? data[data.length - 1].weight : null;
  const previous = data.length > 1 ? data[data.length - 2].weight : null;
  const delta = latest && previous ? latest - previous : null;
  const weights = data.map((d) => d.weight);
  const min = weights.length > 0 ? Math.min(...weights) : null;
  const max = weights.length > 0 ? Math.max(...weights) : null;
  const avg =
    weights.length > 0
      ? Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10
      : null;

  // Weekly trend
  const weeklyTrend =
    data.length >= 7
      ? Math.round(
          (data[data.length - 1].weight - data[Math.max(0, data.length - 8)].weight) * 10
        ) / 10
      : null;

  // BMI calculation
  const bmi =
    latest && heightCm
      ? Math.round((latest / (heightCm / 100) ** 2) * 10) / 10
      : null;

  // Goal progress
  const goalProgress =
    weightGoalKg && latest && data.length > 0
      ? (() => {
          const startWeight = data[0].weight;
          const totalChange = startWeight - weightGoalKg;
          if (totalChange === 0) return 100;
          const currentChange = startWeight - latest;
          return Math.round(Math.min(Math.max((currentChange / totalChange) * 100, 0), 100));
        })()
      : null;

  // Goal direction (gaining or losing)
  const isApproachingGoal =
    weightGoalKg && latest
      ? Math.abs(latest - weightGoalKg) <= (delta ? Math.abs(latest - delta - weightGoalKg) : Infinity)
      : null;

  const tooltipStyle = {
    backgroundColor: "#111111",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    color: "#FFFFFF",
    fontSize: "12px",
  };

  const periods: { label: string; value: Period }[] = [
    { label: t("weight.7d"), value: 7 },
    { label: t("weight.30d"), value: 30 },
    { label: t("weight.90d"), value: 90 },
  ];

  return (
    <div className="glass-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base">&#9878;&#65039;</span>
          <h3 className="text-sm font-medium">{t("weight.title")}</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Current weight */}
          {latest ? (
            <div className="text-right">
              <span className="text-sm font-bold">{latest} kg</span>
              {delta !== null && delta !== 0 && (
                <span
                  className={`text-xs ml-1.5 ${
                    delta > 0 ? "text-[#EF4444]" : "text-[#22C55E]"
                  }`}
                >
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-[#666]">{t("weight.noData")}</span>
          )}
        </div>
      </div>

      {/* Goal + BMI bar */}
      {(weightGoalKg || bmi) && (
        <div className="flex items-center gap-3 mb-3">
          {weightGoalKg && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#666]">{t("weight.goal")}</span>
              <span className="text-xs font-medium text-[#A78BFA]">
                {weightGoalKg} kg
              </span>
              {goalProgress !== null && (
                <span className="text-[10px] text-[#666]">
                  ({goalProgress}%)
                </span>
              )}
            </div>
          )}
          {bmi && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#666]">BMI:</span>
              <span
                className={`text-xs font-medium ${
                  bmi < 18.5
                    ? "text-[#F59E0B]"
                    : bmi < 25
                    ? "text-[#22C55E]"
                    : bmi < 30
                    ? "text-[#F59E0B]"
                    : "text-[#EF4444]"
                }`}
              >
                {bmi}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Goal progress bar */}
      {weightGoalKg && goalProgress !== null && (
        <div className="mb-3">
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                isApproachingGoal ? "bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6]" : "bg-[#EF4444]/50"
              }`}
              animate={{ width: goalProgress + "%" }}
              transition={springs.smooth}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[#666]">
              {data.length > 0 ? data[0].weight : "\u2014"} kg
            </span>
            <span className="text-[10px] text-[#A78BFA]">{weightGoalKg} kg</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-24 shimmer rounded-lg" />
      ) : (
        <>
          {/* Period selector */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex bg-white/[0.04] rounded-lg p-0.5">
              {periods.map((p) => (
                <motion.button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                    period === p.value
                      ? "bg-[#A78BFA]/20 text-[#A78BFA]"
                      : "text-[#666] hover:text-[#999]"
                  }`}
                >
                  {p.label}
                </motion.button>
              ))}
            </div>

            {/* Goal edit / add */}
            {editingGoal ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="kg"
                  className="w-14 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-0.5 text-xs text-white focus:outline-none focus:border-[#A78BFA]/40"
                  autoFocus
                />
                <button
                  onClick={handleSaveGoal}
                  className="text-[10px] text-[#A78BFA] font-medium"
                >
                  OK
                </button>
                <button
                  onClick={() => setEditingGoal(false)}
                  className="text-[10px] text-[#666]"
                >
                  x
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingGoal(true);
                  setGoalInput(weightGoalKg ? String(weightGoalKg) : "");
                }}
                className="text-[10px] text-[#666] hover:text-[#A78BFA] transition-colors"
              >
                {weightGoalKg ? t("weight.editGoal") : t("weight.setGoal")}
              </button>
            )}
          </div>

          {/* Chart */}
          {data.length > 1 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#A78BFA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#666", fontSize: 9 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={["dataMin - 1", "dataMax + 1"]}
                    hide
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#A78BFA"
                    strokeWidth={2}
                    fill="url(#weightGradient)"
                    dot={false}
                    activeDot={{ r: 3, fill: "#A78BFA", strokeWidth: 0 }}
                    name={t("weight.chartName")}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke="#A78BFA"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    dot={false}
                    strokeOpacity={0.4}
                    name={t("weight.avg")}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <p className="text-xs text-[#666] text-center py-6">
              {t("weight.addPrompt")}
            </p>
          )}

          {/* Stats row */}
          {data.length > 1 && (
            <motion.div
              className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/[0.06]"
              variants={staggerContainer()}
              initial="initial"
              animate="animate"
            >
              <motion.div className="text-center" variants={staggerItem}>
                <p className="text-xs font-bold">
                  <AnimatedNum value={min} />
                </p>
                <p className="text-[9px] text-[#666] uppercase tracking-wider">
                  {t("weight.min")}
                </p>
              </motion.div>
              <motion.div className="text-center" variants={staggerItem}>
                <p className="text-xs font-bold">
                  <AnimatedNum value={max} />
                </p>
                <p className="text-[9px] text-[#666] uppercase tracking-wider">
                  {t("weight.max")}
                </p>
              </motion.div>
              <motion.div className="text-center" variants={staggerItem}>
                <p className="text-xs font-bold">
                  <AnimatedNum value={avg} />
                </p>
                <p className="text-[9px] text-[#666] uppercase tracking-wider">
                  {t("weight.avg")}
                </p>
              </motion.div>
              <motion.div className="text-center" variants={staggerItem}>
                {weeklyTrend !== null ? (
                  <p
                    className={`text-xs font-bold ${
                      weeklyTrend > 0
                        ? "text-[#EF4444]"
                        : weeklyTrend < 0
                        ? "text-[#22C55E]"
                        : "text-[#666]"
                    }`}
                  >
                    {weeklyTrend > 0 ? "+" : ""}
                    <AnimatedNum value={weeklyTrend} />
                  </p>
                ) : (
                  <p className="text-xs font-bold text-[#666]">&mdash;</p>
                )}
                <p className="text-[9px] text-[#666] uppercase tracking-wider">
                  {t("weight.perWeek")}
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* Integrated weight input */}
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <AnimatePresence mode="wait">
              {showInput ? (
                <motion.div
                  key="weight-input"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={springs.smooth}
                >
                  <input
                    type="number"
                    step="0.1"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    placeholder={language === "en" ? "e.g. 75.5" : "Es: 75.5"}
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#A78BFA]/40"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSaveWeight()}
                  />
                  <span className="text-xs text-[#666]">kg</span>
                  <button
                    onClick={handleSaveWeight}
                    disabled={saving || !weightInput}
                    className="px-3 py-2 rounded-lg bg-[#A78BFA]/20 text-[#A78BFA] text-xs font-medium hover:bg-[#A78BFA]/30 transition-colors disabled:opacity-30"
                  >
                    {saving ? "..." : t("common.save")}
                  </button>
                  <button
                    onClick={() => {
                      setShowInput(false);
                      setWeightInput("");
                    }}
                    className="text-[#666] text-xs hover:text-white transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="weight-toggle"
                  onClick={() => setShowInput(true)}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={springs.smooth}
                  className="w-full py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-[#666] hover:text-[#A78BFA] hover:border-[#A78BFA]/20 transition-all"
                >
                  {t("weight.addWeight")}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
