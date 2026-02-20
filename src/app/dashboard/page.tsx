"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { DailySummary, User } from "@/lib/types";
import CalorieProgress from "@/components/CalorieProgress";
import DailySummaryCard from "@/components/DailySummary";
import MealList from "@/components/MealList";
import WorkoutList from "@/components/WorkoutList";
import DatePicker from "@/components/DatePicker";
import QuickAddBar from "@/components/QuickAddBar";
import WaterTracker from "@/components/WaterTracker";
import StreakCalendar from "@/components/StreakCalendar";
import WeightChart from "@/components/WeightChart";
import AddMealModal from "@/components/AddMealModal";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import { getGreeting, getMotivation } from "@/lib/personalization";
import { useCelebration } from "@/lib/celebration-context";

export default function DashboardPage() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const { celebrate } = useCelebration();

  const userId = typeof window !== "undefined" ? localStorage.getItem("vitrack_user_id") : null;

  // Celebration trigger for calorie goal
  useEffect(() => {
    if (!summary) return;
    if (summary.totals.calories >= summary.calorie_goal && summary.calorie_goal > 0) {
      celebrate("calorie_goal");
    }
  }, [summary, celebrate]);

  // Fetch user settings
  useEffect(() => {
    const telegramId = typeof window !== "undefined" ? localStorage.getItem("vitrack_telegram_id") : null;
    if (!telegramId) return;
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/user?telegram_id=${encodeURIComponent(telegramId)}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch { /* ignore */ }
    };
    fetchUser();
  }, []);

  const fetchSummary = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/summary?user_id=${userId}&date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [userId, date]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const handleSaveMeal = async (meal: {
    description: string; calories: number; protein_g: number;
    carbs_g: number; fat_g: number; fiber_g: number; meal_type: string;
  }) => {
    if (!userId) return;
    try {
      await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ...meal }),
      });
      fetchSummary();
    } catch { /* ignore */ }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!userId) return;
    try {
      await fetch(`/api/meals?id=${mealId}&user_id=${userId}`, { method: "DELETE" });
      fetchSummary();
    } catch { /* ignore */ }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!userId) return;
    try {
      await fetch(`/api/workouts?id=${workoutId}&user_id=${userId}`, { method: "DELETE" });
      fetchSummary();
    } catch { /* ignore */ }
  };

  const updateUserSettings = async (updates: Record<string, unknown>) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/user?id=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
      }
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-4">
        <div className="h-8 w-48 shimmer rounded-lg" />
        <div className="h-10 w-64 shimmer rounded-lg" />
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 shimmer rounded-2xl" />)}
        </div>
        <div className="h-64 shimmer rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 shimmer rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="px-4 md:px-8 py-6 space-y-4"
      initial="initial"
      animate="animate"
      variants={staggerContainer(0.08)}
    >
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{getGreeting(user?.first_name ?? null)}</h2>
          {summary && (
            <p className="text-sm text-[#A1A1A1] mt-0.5">
              {getMotivation({
                calories: summary.totals.calories,
                calorieGoal: summary.calorie_goal,
                streak: 0,
                workoutsToday: summary.totals.workouts_count,
                mealsToday: summary.totals.meals_count,
              })}
            </p>
          )}
        </div>
        <DatePicker value={date} onChange={setDate} />
      </motion.div>

      {/* Quick Add Bar - removed weight since it's now in the widget */}
      <motion.div variants={staggerItem}>
        <QuickAddBar
          onAddMeal={() => setMealModalOpen(true)}
          onAddWater={() => {}}
          onAddWorkout={() => {}}
          onAddWeight={() => {}}
        />
      </motion.div>

      {summary && (
        <>
          {/* Calories + Macros */}
          <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <CalorieProgress current={summary.totals.calories} goal={summary.calorie_goal} burned={summary.totals.calories_burned} />
            <div className="lg:col-span-2">
              <DailySummaryCard totals={summary.totals} />
            </div>
          </motion.div>

          {/* Water + Streak */}
          {userId && (
            <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <WaterTracker
                userId={userId}
                date={date}
                waterGoalMl={user?.water_goal_ml ?? 2000}
                trackingMode={user?.water_tracking_mode ?? "glasses"}
                onSettingsChange={(settings) => updateUserSettings(settings)}
              />
              <StreakCalendar userId={userId} />
            </motion.div>
          )}

          {/* Weight */}
          {userId && (
            <motion.div variants={staggerItem}>
              <WeightChart
                userId={userId}
                weightGoalKg={user?.weight_goal_kg}
                heightCm={user?.height_cm}
                onGoalChange={(goal) => updateUserSettings({ weight_goal_kg: goal })}
              />
            </motion.div>
          )}

          {/* Meals */}
          <motion.div variants={staggerItem}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs text-[#666] uppercase tracking-wider font-medium">Pasti di oggi</h3>
              <Link href="/dashboard/meals" className="text-xs text-[#666] hover:text-white transition-colors">
                Vedi tutti →
              </Link>
            </div>
            <MealList meals={summary.meals.slice(0, 3)} onDelete={handleDeleteMeal} compact />
          </motion.div>

          {/* Workouts */}
          <motion.div variants={staggerItem}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs text-[#666] uppercase tracking-wider font-medium">Allenamenti di oggi</h3>
              <Link href="/dashboard/workouts" className="text-xs text-[#666] hover:text-white transition-colors">
                Vedi tutti →
              </Link>
            </div>
            <WorkoutList workouts={summary.workouts.slice(0, 3)} onDelete={handleDeleteWorkout} compact />
          </motion.div>
        </>
      )}

      <AddMealModal
        isOpen={mealModalOpen}
        onClose={() => setMealModalOpen(false)}
        onSave={handleSaveMeal}
      />
    </motion.div>
  );
}
