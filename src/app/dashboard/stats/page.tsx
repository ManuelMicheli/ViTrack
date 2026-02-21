"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { DailySummary } from "@/lib/types";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";

type Period = 7 | 30;

interface DayData {
  date: string; label: string; calories: number; protein: number;
  carbs: number; fat: number; fiber: number; burned: number;
  workouts: number; goal: number;
}

export default function StatsPage() {
  const { t, language } = useLanguage();
  const locale = language === "en" ? "en-US" : "it-IT";

  const [period, setPeriod] = useState<Period>(7);
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = typeof window !== "undefined" ? localStorage.getItem("vitrack_user_id") : null;

  useEffect(() => {
    if (!userId) return;
    const fetchStats = async () => {
      setLoading(true);
      const days: string[] = [];
      const today = new Date();
      for (let i = period - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
      }
      const results = await Promise.allSettled(
        days.map((date) =>
          fetch(`/api/summary?user_id=${userId}&date=${date}`).then(
            (r) => (r.ok ? r.json() : null) as Promise<DailySummary | null>
          )
        )
      );
      const dayData: DayData[] = days.map((date, i) => {
        const result = results[i];
        const summary = result.status === "fulfilled" ? result.value : null;
        const d = new Date(date + "T12:00:00");
        return {
          date, label: d.toLocaleDateString(locale, { day: "numeric", month: "short" }),
          calories: summary?.totals.calories ?? 0, protein: summary?.totals.protein_g ?? 0,
          carbs: summary?.totals.carbs_g ?? 0, fat: summary?.totals.fat_g ?? 0,
          fiber: summary?.totals.fiber_g ?? 0, burned: summary?.totals.calories_burned ?? 0,
          workouts: summary?.totals.workouts_count ?? 0, goal: summary?.calorie_goal ?? 0,
        };
      });
      setData(dayData);
      setLoading(false);
    };
    fetchStats();
  }, [userId, period, locale]);

  const avgCalories = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.calories, 0) / data.length) : 0;
  const totalWorkouts = data.reduce((s, d) => s + d.workouts, 0);
  const avgProtein = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.protein, 0) / data.length) : 0;
  const totalBurned = data.reduce((s, d) => s + d.burned, 0);
  const calorieGoal = data.length > 0 ? data[data.length - 1].goal : 0;

  const axisStyle = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    fill: '#585858',
  };

  const tooltipStyle = {
    backgroundColor: "#0A0A0A",
    border: "1px solid #1A1A1A",
    borderRadius: "8px",
    color: "#FFFFFF",
    fontSize: "12px",
    fontFamily: "'IBM Plex Mono', monospace",
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-4">
        <div className="h-8 w-36 shimmer rounded-lg" />
        <div className="flex gap-2">
          <div className="h-9 w-24 shimmer rounded-lg" />
          <div className="h-9 w-24 shimmer rounded-lg" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 shimmer rounded-lg" />)}
        </div>
        <div className="h-64 shimmer rounded-lg" />
        <div className="h-64 shimmer rounded-lg" />
      </div>
    );
  }

  return (
    <motion.div className="px-4 md:px-8 py-6 space-y-4" initial="initial" animate="animate" variants={staggerContainer(0.08)}>
      <motion.div variants={staggerItem}>
        <h1 className="font-display text-2xl font-bold text-text-primary">{t("statsPage.title")}</h1>
      </motion.div>

      <motion.div variants={staggerItem} className="flex gap-2">
        {([7, 30] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`font-mono-label border rounded-lg px-3 py-1.5 transition-all ${
              period === p
                ? "border-[var(--color-accent-dynamic)] text-text-primary"
                : "border-border text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {p} {t("common.days")}
          </button>
        ))}
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t("statsPage.avgCalories"), value: `${avgCalories}`, unit: "kcal", color: "text-text-primary" },
          { label: t("statsPage.workouts"), value: `${totalWorkouts}`, unit: "", color: "text-text-primary" },
          { label: t("statsPage.avgProtein"), value: `${avgProtein}`, unit: "g", color: "text-protein" },
          { label: t("statsPage.caloriesBurned"), value: `${totalBurned}`, unit: "kcal", color: "text-carbs" },
        ].map((card) => (
          <div key={card.label} className="data-card">
            <p className="font-mono-label text-[10px] text-text-tertiary">{card.label}</p>
            <p className={`font-display text-xl font-bold mt-1 ${card.color}`}>
              {card.value} {card.unit && <span className="text-xs font-normal text-text-tertiary">{card.unit}</span>}
            </p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="data-card">
          <span className="font-mono-label text-text-tertiary mb-4 block">{t("statsPage.calorieTrend")}</span>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid stroke="#1A1A1A" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#585858" style={axisStyle} tickLine={false} axisLine={false} />
              <YAxis stroke="#585858" style={axisStyle} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              {calorieGoal > 0 && (
                <ReferenceLine y={calorieGoal} stroke="#1A1A1A" strokeDasharray="5 5"
                  label={{ value: t("weight.objective"), position: "insideTopRight", fill: "#585858", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} />
              )}
              <Line type="monotone" dataKey="calories" stroke="#E8E4DE" strokeWidth={2}
                dot={{ fill: "#E8E4DE", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#E8E4DE" }} name={t("statsPage.calories")} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="data-card">
          <span className="font-mono-label text-text-tertiary mb-4 block">{t("statsPage.macroDistribution")}</span>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid stroke="#1A1A1A" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#585858" style={axisStyle} tickLine={false} axisLine={false} />
              <YAxis stroke="#585858" style={axisStyle} tickLine={false} axisLine={false} width={40} unit="g" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="protein" stackId="macro" fill="var(--color-protein)" name={t("macro.protein")} radius={[0, 0, 0, 0]} />
              <Bar dataKey="carbs" stackId="macro" fill="var(--color-carbs)" name={t("macro.carbs")} />
              <Bar dataKey="fat" stackId="macro" fill="var(--color-fat)" name={t("macro.fat")} />
              <Bar dataKey="fiber" stackId="macro" fill="var(--color-fiber)" name={t("macro.fiber")} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
