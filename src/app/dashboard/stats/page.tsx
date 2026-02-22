"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";
import type { User, WeightLog, DailySummary } from "@/lib/types";

import TDEEHero from "./components/TDEEHero";
import CalorieTargets from "./components/CalorieTargets";
import MacroChart from "./components/MacroChart";
import BodyComposition from "./components/BodyComposition";
import SummaryCards from "./components/SummaryCards";
import TrackingCharts from "./components/TrackingCharts";
import WeightTracker from "./components/WeightTracker";
import LifestyleProfile from "./components/LifestyleProfile";
import EditStatsForm from "./components/EditStatsForm";

type Period = 7 | 30 | 90;

interface DayData {
  date: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  burned: number;
  workouts: number;
  goal: number;
}

export default function StatsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const locale = language === "en" ? "en-US" : "it-IT";

  const [user, setUser] = useState<User | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(7);
  const [trendData, setTrendData] = useState<DayData[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  const fetchWeightLogs = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/weight?user_id=${userId}&limit=90`);
      if (res.ok) {
        const data = await res.json();
        setWeightLogs(data);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      let res: Response | null = null;

      if (sessionData?.session?.user?.id) {
        res = await fetch(`/api/user?id=${sessionData.session.user.id}`);
      }

      if (!res || !res.ok) {
        const telegramId = localStorage.getItem("vitrack_telegram_id");
        if (!telegramId) { router.push("/"); return; }
        res = await fetch(`/api/user?telegram_id=${encodeURIComponent(telegramId)}`);
      }

      if (res.ok) {
        const data = await res.json();
        setUser(data);
        await fetchWeightLogs(data.id);
      } else {
        router.push("/");
      }
    } catch {
      const telegramId = localStorage.getItem("vitrack_telegram_id");
      if (!telegramId) { router.push("/"); return; }
      try {
        const res = await fetch(`/api/user?telegram_id=${encodeURIComponent(telegramId)}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          await fetchWeightLogs(data.id);
        }
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, [router, fetchWeightLogs]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  // Fetch trend data
  const userId = typeof window !== "undefined" ? localStorage.getItem("vitrack_user_id") : null;

  useEffect(() => {
    if (!userId) return;
    const fetchTrends = async () => {
      setTrendLoading(true);
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
          date,
          label: d.toLocaleDateString(locale, { day: "numeric", month: "short" }),
          calories: summary?.totals.calories ?? 0,
          protein: summary?.totals.protein_g ?? 0,
          carbs: summary?.totals.carbs_g ?? 0,
          fat: summary?.totals.fat_g ?? 0,
          fiber: summary?.totals.fiber_g ?? 0,
          burned: summary?.totals.calories_burned ?? 0,
          workouts: summary?.totals.workouts_count ?? 0,
          goal: summary?.calorie_goal ?? 0,
        };
      });
      setTrendData(dayData);
      setTrendLoading(false);
    };
    fetchTrends();
  }, [userId, period, locale]);

  const handleWeightLogged = () => { if (user) fetchWeightLogs(user.id); };
  const handleStatsSaved = (updatedUser: User) => {
    setUser(updatedUser);
    if (updatedUser.id) fetchWeightLogs(updatedUser.id);
  };

  // Parse Supabase DECIMAL strings to numbers
  const num = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  // Trend aggregates
  const avgCalories = trendData.length > 0 ? Math.round(trendData.reduce((s, d) => s + d.calories, 0) / trendData.length) : 0;
  const totalWorkouts = trendData.reduce((s, d) => s + d.workouts, 0);
  const avgProtein = trendData.length > 0 ? Math.round(trendData.reduce((s, d) => s + d.protein, 0) / trendData.length) : 0;
  const totalBurned = trendData.reduce((s, d) => s + d.burned, 0);

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-6 max-w-4xl">
        <div className="h-8 w-48 shimmer rounded-lg" />
        <div className="h-32 shimmer rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 shimmer rounded-lg" />)}
        </div>
        <div className="h-48 shimmer rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 shimmer rounded-lg" />)}
        </div>
        <div className="h-64 shimmer rounded-lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <motion.div
      className="px-4 md:px-8 py-6 space-y-8 max-w-4xl"
      initial="initial"
      animate="animate"
      variants={staggerContainer(0.08)}
    >
      {/* Title */}
      <motion.div variants={staggerItem}>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          {t("statsPage.title").toUpperCase()}
        </h1>
      </motion.div>

      {/* 1. TDEE Hero */}
      <motion.div variants={staggerItem}>
        <TDEEHero bmr={num(user.bmr)} tdee={num(user.tdee)} activityLevel={user.activity_level} />
      </motion.div>

      {/* 2. Calorie Targets */}
      <motion.div variants={staggerItem}>
        <CalorieTargets
          caloriesCut={num(user.calories_cut)}
          caloriesMaintain={num(user.calories_maintain)}
          caloriesBulk={num(user.calories_bulk)}
          goal={user.goal}
        />
      </motion.div>

      {/* 3. Macro Donut */}
      <motion.div variants={staggerItem}>
        <MacroChart
          proteinG={num(user.macro_protein_g)}
          carbsG={num(user.macro_carbs_g)}
          fatG={num(user.macro_fat_g)}
          weightKg={num(user.weight_kg)}
        />
      </motion.div>

      {/* 4. Body Composition */}
      <motion.div variants={staggerItem}>
        <BodyComposition
          bodyFatPercentage={num(user.body_fat_percentage)}
          leanMassKg={num(user.lean_mass_kg)}
          weightKg={num(user.weight_kg)}
          gender={user.gender}
        />
      </motion.div>

      {/* 5. Period Selector */}
      <motion.div variants={staggerItem} className="flex gap-2 relative">
        {([7, 30, 90] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`relative font-mono-label border rounded-lg px-4 py-2 transition-all ${
              period === p
                ? "border-[var(--color-accent-dynamic)] text-text-primary"
                : "border-border text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {period === p && (
              <motion.div
                layoutId="period-indicator"
                className="absolute inset-0 rounded-lg border border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/5"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{p} {t("common.days")}</span>
          </button>
        ))}
      </motion.div>

      {/* 6. Summary Cards */}
      <motion.div variants={staggerItem}>
        {trendLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 shimmer rounded-lg" />)}
          </div>
        ) : (
          <SummaryCards
            avgCalories={avgCalories}
            totalWorkouts={totalWorkouts}
            avgProtein={avgProtein}
            totalBurned={totalBurned}
          />
        )}
      </motion.div>

      {/* 7. Tracking Charts */}
      <motion.div variants={staggerItem}>
        {trendLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-80 shimmer rounded-lg" />
            <div className="h-80 shimmer rounded-lg" />
          </div>
        ) : (
          <TrackingCharts data={trendData} />
        )}
      </motion.div>

      {/* 8. Weight Tracker */}
      <motion.div variants={staggerItem}>
        <WeightTracker
          userId={user.id}
          weightLogs={weightLogs}
          startingWeight={num(user.weight_kg)}
          targetWeight={num(user.target_weight_kg)}
          onWeightLogged={handleWeightLogged}
        />
      </motion.div>

      {/* 9. Lifestyle Badges */}
      <motion.div variants={staggerItem}>
        <LifestyleProfile
          goal={user.goal}
          activityLevel={user.activity_level}
          weeklyFrequency={user.weekly_frequency}
          sleepHours={user.sleep_hours}
          stressLevel={user.stress_level}
        />
      </motion.div>

      {/* 10. Edit/Recalculate Form */}
      <motion.div variants={staggerItem}>
        <EditStatsForm user={user} onSaved={handleStatsSaved} />
      </motion.div>
    </motion.div>
  );
}
