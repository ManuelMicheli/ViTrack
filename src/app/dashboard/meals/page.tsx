"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { Meal } from "@/lib/types";
import DatePicker from "@/components/DatePicker";
import MacroBar from "@/components/MacroBar";
import { PlusIcon, TrashIcon } from "@/components/icons";
import ConfirmModal from "@/components/ConfirmModal";
import AddMealModal from "@/components/AddMealModal";
import { staggerContainer, staggerItem } from "@/lib/animation-config";

const mealTypeOrder = ["colazione", "pranzo", "cena", "snack"] as const;

const mealTypeConfig: Record<string, { label: string }> = {
  colazione: { label: "Colazione" },
  pranzo: { label: "Pranzo" },
  cena: { label: "Cena" },
  snack: { label: "Snack" },
};

export default function MealsPage() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [mealModalType, setMealModalType] = useState<string | undefined>();

  const userId = typeof window !== "undefined" ? localStorage.getItem("vitrack_user_id") : null;

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

  const openAddForType = (type: string) => {
    setMealModalType(type);
    setMealModalOpen(true);
  };

  // Group meals by type
  const grouped = mealTypeOrder.map((type) => ({
    type,
    ...mealTypeConfig[type],
    meals: meals.filter((m) => m.meal_type === type),
    totalCal: meals.filter((m) => m.meal_type === type).reduce((s, m) => s + m.calories, 0),
  }));

  const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + (m.protein_g ?? 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0);
  const totalFat = meals.reduce((s, m) => s + (m.fat_g ?? 0), 0);
  const totalFiber = meals.reduce((s, m) => s + (m.fiber_g ?? 0), 0);

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-4">
        <div className="h-8 w-32 shimmer rounded-lg" />
        <div className="h-10 w-64 shimmer rounded-lg" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 shimmer rounded-2xl" />)}
      </div>
    );
  }

  return (
    <motion.div className="px-4 md:px-8 py-6 space-y-4" initial="initial" animate="animate" variants={staggerContainer(0.08)}>
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Pasti</h2>
        <DatePicker value={date} onChange={setDate} />
      </motion.div>

      {/* Grouped meal sections */}
      {grouped.map(({ type, label, meals: sectionMeals, totalCal }) => (
        <motion.div key={type} variants={staggerItem}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium uppercase tracking-wider text-[#A1A1A1]">{label}</h3>
              {totalCal > 0 && (
                <span className="text-xs text-[#666] ml-1">{totalCal} kcal</span>
              )}
            </div>
            <button
              onClick={() => openAddForType(type)}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#666] hover:text-white transition-all"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>

          {sectionMeals.length === 0 ? (
            <button
              onClick={() => openAddForType(type)}
              className="w-full py-4 rounded-2xl border border-dashed border-white/[0.08] text-[#666] text-sm hover:border-white/[0.15] hover:text-[#A1A1A1] transition-all"
            >
              + Aggiungi {label.toLowerCase()}
            </button>
          ) : (
            <div className="space-y-2">
              {sectionMeals.map((meal) => (
                <div key={meal.id} className="glass-card p-4 group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{meal.description}</p>
                      <p className="text-xs text-[#666] mt-0.5">
                        {new Date(meal.logged_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <div className="flex gap-2 mt-1.5 text-xs">
                        <span className="text-[#3B82F6]">P:{meal.protein_g ?? 0}g</span>
                        <span className="text-[#F59E0B]">C:{meal.carbs_g ?? 0}g</span>
                        <span className="text-[#EF4444]">G:{meal.fat_g ?? 0}g</span>
                        <span className="text-[#22C55E]">F:{meal.fiber_g ?? 0}g</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{meal.calories} kcal</span>
                      <button
                        onClick={() => setDeleteId(meal.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#666] hover:text-[#EF4444] transition-all"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <MacroBar
                      protein={meal.protein_g ?? 0}
                      carbs={meal.carbs_g ?? 0}
                      fat={meal.fat_g ?? 0}
                      fiber={meal.fiber_g ?? 0}
                      height={4}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ))}

      {/* Daily total */}
      {meals.length > 0 && (
        <motion.div variants={staggerItem} className="glass-card-strong p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#666] uppercase tracking-wider font-medium">Totale giornata</span>
            <span className="text-sm font-bold">{totalCalories} kcal</span>
          </div>
          <MacroBar protein={totalProtein} carbs={totalCarbs} fat={totalFat} fiber={totalFiber} showLabels />
        </motion.div>
      )}

      <AddMealModal
        isOpen={mealModalOpen}
        onClose={() => setMealModalOpen(false)}
        onSave={handleSaveMeal}
        defaultMealType={mealModalType}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        title="Elimina pasto"
        message="Vuoi eliminare questo pasto? L'azione è irreversibile."
        confirmLabel="Elimina"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </motion.div>
  );
}
