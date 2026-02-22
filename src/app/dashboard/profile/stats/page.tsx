"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import type { User, WeightLog } from "@/lib/types";
import MetabolicOverview from "./components/MetabolicOverview";
import CalorieTargets from "./components/CalorieTargets";
import MacroChart from "./components/MacroChart";
import BodyComposition from "./components/BodyComposition";
import LifestyleProfile from "./components/LifestyleProfile";
import WeightTracker from "./components/WeightTracker";
import EditStatsForm from "./components/EditStatsForm";

export default function StatsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

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
      // Try Supabase Auth first
      const supabase = createSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();

      let res: Response | null = null;

      if (sessionData?.session?.user?.id) {
        res = await fetch(`/api/user?id=${sessionData.session.user.id}`);
      }

      // Fallback to localStorage
      if (!res || !res.ok) {
        const telegramId = localStorage.getItem("vitrack_telegram_id");
        if (!telegramId) {
          router.push("/");
          return;
        }
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
      if (!telegramId) {
        router.push("/");
        return;
      }
      try {
        const res = await fetch(`/api/user?telegram_id=${encodeURIComponent(telegramId)}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          await fetchWeightLogs(data.id);
        }
      } catch {
        /* ignore */
      }
    } finally {
      setLoading(false);
    }
  }, [router, fetchWeightLogs]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleWeightLogged = () => {
    if (user) {
      fetchWeightLogs(user.id);
    }
  };

  const handleStatsSaved = (updatedUser: User) => {
    setUser(updatedUser);
    if (updatedUser.id) {
      fetchWeightLogs(updatedUser.id);
    }
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-6 max-w-2xl">
        <div className="h-6 w-24 shimmer rounded-lg" />
        <div className="h-8 w-48 shimmer rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 shimmer rounded-lg" />
          ))}
        </div>
        <div className="h-48 shimmer rounded-lg" />
        <div className="h-48 shimmer rounded-lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <motion.div
      className="px-4 md:px-8 py-6 space-y-8 max-w-2xl"
      initial="initial"
      animate="animate"
      variants={staggerContainer(0.08)}
    >
      {/* Back link */}
      <motion.div variants={staggerItem}>
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center gap-1 font-body text-sm text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Profilo
        </Link>
      </motion.div>

      {/* Title */}
      <motion.div variants={staggerItem}>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Le tue statistiche
        </h1>
      </motion.div>

      {/* Metabolic overview */}
      <motion.div variants={staggerItem}>
        <MetabolicOverview
          bmr={user.bmr}
          tdee={user.tdee}
          activityLevel={user.activity_level}
        />
      </motion.div>

      {/* Calorie targets */}
      <motion.div variants={staggerItem}>
        <CalorieTargets
          caloriesCut={user.calories_cut}
          caloriesMaintain={user.calories_maintain}
          caloriesBulk={user.calories_bulk}
          goal={user.goal}
        />
      </motion.div>

      {/* Macro chart */}
      <motion.div variants={staggerItem}>
        <MacroChart
          proteinG={user.macro_protein_g}
          carbsG={user.macro_carbs_g}
          fatG={user.macro_fat_g}
          weightKg={user.weight_kg}
        />
      </motion.div>

      {/* Body composition */}
      <motion.div variants={staggerItem}>
        <BodyComposition
          bodyFatPercentage={user.body_fat_percentage}
          leanMassKg={user.lean_mass_kg}
          weightKg={user.weight_kg}
          gender={user.gender}
        />
      </motion.div>

      {/* Lifestyle */}
      <motion.div variants={staggerItem}>
        <LifestyleProfile
          goal={user.goal}
          activityLevel={user.activity_level}
          weeklyFrequency={user.weekly_frequency}
          sleepHours={user.sleep_hours}
          stressLevel={user.stress_level}
        />
      </motion.div>

      {/* Weight tracker */}
      <motion.div variants={staggerItem}>
        <WeightTracker
          userId={user.id}
          weightLogs={weightLogs}
          startingWeight={user.weight_kg}
          targetWeight={user.target_weight_kg}
          onWeightLogged={handleWeightLogged}
        />
      </motion.div>

      {/* Edit form */}
      <motion.div variants={staggerItem}>
        <EditStatsForm user={user} onSaved={handleStatsSaved} />
      </motion.div>
    </motion.div>
  );
}
