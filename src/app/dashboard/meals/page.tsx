"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { Meal } from "@/lib/types";
import DatePicker from "@/components/DatePicker";
import MacroBar from "@/components/MacroBar";
import DailyRingChart from "@/components/DailyRingChart";
import MacroProgressBars from "@/components/MacroProgressBars";
import MealCard from "@/components/MealCard";
import QuickAddPills from "@/components/QuickAddPills";
import FoodSearch from "@/components/FoodSearch";
import ConfirmModal from "@/components/ConfirmModal";
import AddMealModal from "@/components/AddMealModal";
import { PlusIcon } from "@/components/icons";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";
import { useUser } from "@/lib/user-provider";
import { addToRecent, incrementFrequency } from "@/lib/food-history";
import type { FoodItem } from "@/lib/food-database/types";
import type { TranslationKey } from "@/lib/translations";

const mealTypeOrder = ["colazione", "pranzo", "cena", "snack"] as const;

function scale(value: number, grams: number): number {
  return Math.round((value * grams) / 100);
}
function scaleDecimal(value: number, grams: number): number {
  return parseFloat(((value * grams) / 100).toFixed(1));
}

export default function MealsPage() {
  const { t, language } = useLanguage();
  const locale = language === "en" ? "en-US" : "it-IT";

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [mealModalType, setMealModalType] = useState<string | undefined>();
  const [foodSearchOpen, setFoodSearchOpen] = useState(false);

  const { user } = useUser();
  const userId = user?.id ?? (typeof window !== "undefined" ? localStorage.getItem("vitrack_user_id") : null);

  const getMealTypeLabel = (type: string) => {
    const key = `meal.${type}` as TranslationKey;
    return t(key);
  };

  const fetchMeals = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/meals?user_id=${userId}&date=${date}`);
      if (res.ok) setMeals(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [userId, date]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const handleDelete = async () => {
    if (!deleteId || !userId) return;
    setDeleting(true);
    try {
      await fetch(`/api/meals?id=${deleteId}&user_id=${userId}`, { method: "DELETE" });
      fetchMeals();
    } catch { /* ignore */ } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

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
      fetchMeals();
    } catch { /* ignore */ }
  };

  const handleQuickAdd = (food: FoodItem, grams: number) => {
    const hour = new Date().getHours();
    let mealType = "snack";
    if (hour >= 6 && hour < 10) mealType = "colazione";
    else if (hour >= 11 && hour < 15) mealType = "pranzo";
    else if (hour >= 18 && hour < 22) mealType = "cena";

    handleSaveMeal({
      description: `${food.name_it}(${grams}g)`,
      calories: scale(food.calories_per_100g, grams),
      protein_g: scaleDecimal(food.protein_per_100g, grams),
      carbs_g: scaleDecimal(food.carbs_per_100g, grams),
      fat_g: scaleDecimal(food.fat_per_100g, grams),
      fiber_g: scaleDecimal(food.fiber_per_100g, grams),
      meal_type: mealType,
    });

    addToRecent(food);
    incrementFrequency(food.id);
  };

  const openAddForType = (type: string) => {
    setMealModalType(type);
    setMealModalOpen(true);
  };

  // Group meals by type
  const grouped = mealTypeOrder.map((type) => ({
    type,
    label: getMealTypeLabel(type),
    meals: meals.filter((m) => m.meal_type === type),
    totalCal: meals.filter((m) => m.meal_type === type).reduce((s, m) => s + m.calories, 0),
  }));

  const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + (m.protein_g ?? 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0);
  const totalFat = meals.reduce((s, m) => s + (m.fat_g ?? 0), 0);
  const totalFiber = meals.reduce((s, m) => s + (m.fiber_g ?? 0), 0);

  const calorieGoal = user?.daily_calorie_target ?? user?.daily_calorie_goal ?? 2000;
  const proteinGoal = user?.macro_protein_g ?? user?.protein_goal ?? 150;
  const carbsGoal = user?.macro_carbs_g ?? user?.carbs_goal ?? 200;
  const fatGoal = user?.macro_fat_g ?? user?.fat_goal ?? 65;

  const mealTypeEmojis: Record<string, string> = {
    colazione: "\u2600\uFE0F",
    pranzo: "\uD83C\uDF24\uFE0F",
    cena: "\uD83C\uDF19",
    snack: "\uD83C\uDF4E",
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-4">
        <div className="h-8 w-32 shimmer rounded-lg" />
        <div className="h-10 w-64 shimmer rounded-lg" />
        <div className="flex justify-center py-8">
          <div className="h-40 w-40 shimmer rounded-full" />
        </div>
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 shimmer rounded-lg" />)}
      </div>
    );
  }

  return (
    <motion.div className="px-4 md:px-8 py-6 space-y-5" initial="initial" animate="animate" variants={staggerContainer(0.08)}>
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <h1 className="hidden md:block font-display text-2xl font-bold text-text-primary">{t("mealsPage.title")}</h1>
        <DatePicker value={date} onChange={setDate} />
      </motion.div>

      {/* SECTION 1: Hero Daily Summary */}
      <motion.div variants={staggerItem} className="data-card">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <DailyRingChart consumed={totalCalories} goal={calorieGoal} />
          <div className="flex-1 w-full">
            <MacroProgressBars
              protein={{ current: totalProtein, goal: proteinGoal }}
              carbs={{ current: totalCarbs, goal: carbsGoal }}
              fat={{ current: totalFat, goal: fatGoal }}
            />
          </div>
        </div>
      </motion.div>

      {/* SECTION 2: Quick Add Pills */}
      <motion.div variants={staggerItem}>
        <QuickAddPills onQuickAdd={handleQuickAdd} />
      </motion.div>

      {/* SECTION 3: Meal Sections */}
      {grouped.map(({ type, label, meals: sectionMeals, totalCal }) => (
        <motion.div key={type} variants={staggerItem}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{mealTypeEmojis[type]}</span>
              <span className="font-mono-label text-text-tertiary">{label}</span>
              {totalCal > 0 && (
                <span className="font-mono-label text-text-tertiary ml-1">{totalCal} kcal</span>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setFoodSearchOpen(true)}
              className="p-2.5 -m-1 rounded-lg hover:bg-surface-raised text-text-tertiary hover:text-text-primary transition-all"
            >
              <PlusIcon className="w-4 h-4" />
            </motion.button>
          </div>

          {sectionMeals.length === 0 ? (
            <motion.button
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setFoodSearchOpen(true)}
              className="w-full py-6 rounded-lg border border-dashed border-border text-text-tertiary text-sm hover:border-[var(--color-accent-dynamic)]/30 hover:text-text-secondary active:bg-surface/50 transition-all font-body"
            >
              + {t("mealsPage.addType")} {label.toLowerCase()}
            </motion.button>
          ) : (
            <div className="data-card !p-0 divide-y divide-border-subtle overflow-hidden">
              {sectionMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  locale={locale}
                  onDelete={(id) => setDeleteId(id)}
                />
              ))}
            </div>
          )}
        </motion.div>
      ))}

      {/* SECTION 5: Daily Total */}
      {meals.length > 0 && (
        <motion.div variants={staggerItem} className="data-card">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-label text-text-tertiary">{t("mealsPage.dailyTotal")}</span>
            <span className="font-display text-2xl font-bold text-text-primary">{totalCalories} kcal</span>
          </div>
          <MacroBar protein={totalProtein} carbs={totalCarbs} fat={totalFat} fiber={totalFiber} showLabels />
        </motion.div>
      )}

      {/* Floating Add Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setFoodSearchOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 w-14 h-14 rounded-full bg-[var(--color-accent-dynamic)] text-black shadow-lg shadow-[var(--color-accent-dynamic)]/25 flex items-center justify-center"
      >
        <PlusIcon className="w-6 h-6" />
      </motion.button>

      {/* Full-screen food search overlay */}
      <FoodSearch
        isOpen={foodSearchOpen}
        onClose={() => setFoodSearchOpen(false)}
        onSave={handleSaveMeal}
        dailyIntake={{
          protein_g: totalProtein,
          carbs_g: totalCarbs,
          fat_g: totalFat,
        }}
        goals={user ? {
          protein_g: user.macro_protein_g ?? user.protein_goal,
          carbs_g: user.macro_carbs_g ?? user.carbs_goal,
          fat_g: user.macro_fat_g ?? user.fat_goal,
        } : undefined}
      />

      <AddMealModal
        isOpen={mealModalOpen}
        onClose={() => setMealModalOpen(false)}
        onSave={handleSaveMeal}
        defaultMealType={mealModalType}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        title={t("mealList.deleteTitle")}
        message={t("mealList.deleteMsg")}
        confirmLabel={t("common.delete")}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </motion.div>
  );
}
