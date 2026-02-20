"use client";

import { useEffect, useState } from "react";
import type { DailySummary } from "@/lib/types";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

type Period = 7 | 30;

interface DayData {
  date: string; label: string; calories: number; protein: number;
  carbs: number; fat: number; fiber: number; burned: number;
  workouts: number; goal: number;
}

export default function StatsPage() {
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
          date, label: d.toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
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
  }, [userId, period]);

  const avgCalories = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.calories, 0) / data.length) : 0;
  const totalWorkouts = data.reduce((s, d) => s + d.workouts, 0);
  const avgProtein = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.protein, 0) / data.length) : 0;
  const totalBurned = data.reduce((s, d) => s + d.burned, 0);
  const calorieGoal = data.length > 0 ? data[data.length - 1].goal : 0;

  const tooltipStyle = {
    backgroundColor: "rgba(17,17,17,0.95)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    color: "#FFFFFF",
    fontSize: "12px",
    backdropFilter: "blur(20px)",
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-4">
        <div className="h-8 w-36 shimmer rounded-lg" />
        <div className="flex gap-2">
          <div className="h-9 w-24 shimmer rounded-full" />
          <div className="h-9 w-24 shimmer rounded-full" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 shimmer rounded-2xl" />)}
        </div>
        <div className="h-64 shimmer rounded-2xl" />
        <div className="h-64 shimmer rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">Statistiche</h2>

      <div className="flex gap-2">
        {([7, 30] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              period === p
                ? "bg-white text-black"
                : "glass-card text-[#A1A1A1] hover:text-white"
            }`}
          >
            {p} giorni
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Media calorie", value: `${avgCalories}`, unit: "kcal", color: "" },
          { label: "Allenamenti", value: `${totalWorkouts}`, unit: "", color: "" },
          { label: "Media proteine", value: `${avgProtein}`, unit: "g", color: "text-[#3B82F6]" },
          { label: "Calorie bruciate", value: `${totalBurned}`, unit: "kcal", color: "text-[#F59E0B]" },
        ].map((card) => (
          <div key={card.label} className="glass-card p-4">
            <p className="text-[10px] text-[#666] uppercase tracking-wider">{card.label}</p>
            <p className={`text-xl font-bold mt-1 ${card.color}`}>
              {card.value} {card.unit && <span className="text-xs font-normal text-[#666]">{card.unit}</span>}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-xs text-[#666] uppercase tracking-wider font-medium mb-4">Trend calorie</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              {calorieGoal > 0 && (
                <ReferenceLine y={calorieGoal} stroke="#666" strokeDasharray="5 5"
                  label={{ value: "Obiettivo", position: "insideTopRight", fill: "#666", fontSize: 11 }} />
              )}
              <Line type="monotone" dataKey="calories" stroke="url(#lineGradient)" strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#8B5CF6" }} name="Calorie" />
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-xs text-[#666] uppercase tracking-wider font-medium mb-4">Distribuzione macro</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} width={40} unit="g" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="protein" stackId="macro" fill="#3B82F6" name="Proteine" radius={[0, 0, 0, 0]} />
              <Bar dataKey="carbs" stackId="macro" fill="#F59E0B" name="Carboidrati" />
              <Bar dataKey="fat" stackId="macro" fill="#EF4444" name="Grassi" />
              <Bar dataKey="fiber" stackId="macro" fill="#22C55E" name="Fibre" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
