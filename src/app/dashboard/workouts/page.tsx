"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { Workout } from "@/lib/types";
import DatePicker from "@/components/DatePicker";
import { TrashIcon } from "@/components/icons";
import ConfirmModal from "@/components/ConfirmModal";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";

export default function WorkoutsPage() {
  const { t } = useLanguage();
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const userId = typeof window !== "undefined" ? localStorage.getItem("vitrack_user_id") : null;

  const fetchWorkouts = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workouts?user_id=${userId}&date=${date}`);
      if (res.ok) setWorkouts(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [userId, date]);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  const handleDelete = async () => {
    if (!deleteId || !userId) return;
    setDeleting(true);
    try {
      await fetch(`/api/workouts?id=${deleteId}&user_id=${userId}`, { method: "DELETE" });
      fetchWorkouts();
    } catch { /* ignore */ } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const totalBurned = workouts.reduce((s, w) => s + (w.calories_burned || 0), 0);
  const totalDuration = workouts.reduce((s, w) => s + (w.duration_min || 0), 0);

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-4">
        <div className="h-8 w-40 shimmer rounded-lg" />
        <div className="h-10 w-64 shimmer rounded-lg" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 shimmer rounded-lg" />)}
      </div>
    );
  }

  return (
    <motion.div className="px-4 md:px-8 py-6 space-y-4" initial="initial" animate="animate" variants={staggerContainer(0.08)}>
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary">{t("workoutsPage.title")}</h1>
        <DatePicker value={date} onChange={setDate} />
      </motion.div>

      {/* Summary cards */}
      {workouts.length > 0 && (
        <motion.div variants={staggerItem} className="grid grid-cols-3 gap-2">
          <div className="data-card text-center">
            <p className="font-mono-label text-[10px] text-text-tertiary">{t("workoutsPage.sessions")}</p>
            <p className="font-display text-xl font-bold mt-1 text-text-primary">{workouts.length}</p>
          </div>
          <div className="data-card text-center">
            <p className="font-mono-label text-[10px] text-text-tertiary">{t("workoutsPage.duration")}</p>
            <p className="font-display text-xl font-bold mt-1 text-[var(--color-accent-dynamic)]">{totalDuration} <span className="text-xs font-normal text-text-tertiary">min</span></p>
          </div>
          <div className="data-card text-center">
            <p className="font-mono-label text-[10px] text-text-tertiary">{t("workoutsPage.burned")}</p>
            <p className="font-display text-xl font-bold mt-1 text-carbs">{totalBurned} <span className="text-xs font-normal text-text-tertiary">kcal</span></p>
          </div>
        </motion.div>
      )}

      {workouts.length === 0 ? (
        <motion.div variants={staggerItem} className="data-card text-center !py-8">
          <span className="text-4xl mb-3 block">{"\uD83C\uDFCB\uFE0F"}</span>
          <p className="text-text-secondary text-sm font-body">{t("workoutsPage.noWorkouts")}</p>
          <p className="text-text-tertiary text-xs font-body mt-1">{t("workoutsPage.useTelegram")}</p>
        </motion.div>
      ) : (
        <motion.div variants={staggerItem} className="space-y-3">
          {workouts.map((workout) => {
            const isExpanded = expandedId === workout.id;
            return (
              <div key={workout.id} className="data-card !p-0 overflow-hidden transition-all duration-300 group relative">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpandedId(isExpanded ? null : workout.id); }}
                  className="w-full p-4 flex items-start justify-between text-left cursor-pointer"
                >
                  <div className="flex gap-3">
                    <span className="text-xl">{"\uD83C\uDFCB\uFE0F"}</span>
                    <div>
                      <p className="font-body text-base text-text-primary">{workout.description}</p>
                      <p className="font-mono-label text-text-tertiary mt-0.5">
                        {workout.workout_type}
                        {workout.duration_min && ` \u00B7 ${workout.duration_min} min`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {workout.calories_burned && (
                      <span className="font-mono-label text-text-secondary">-{workout.calories_burned} kcal</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setDeleteId(workout.id)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-danger hover:bg-danger/10 rounded p-1 transition-all"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>

                {isExpanded && workout.exercises && workout.exercises.length > 0 && (
                  <div className="px-4 pb-4">
                    <div className="bg-surface border border-border rounded-lg divide-y divide-border-subtle">
                      <div className="px-3 py-2">
                        <span className="font-mono-label text-text-tertiary">{t("workoutsPage.exercises")}</span>
                      </div>
                      {workout.exercises.map((ex, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2.5 text-sm">
                          <span className="font-body text-text-primary">{ex.name}</span>
                          <span className="font-mono-label text-[11px] text-text-tertiary">
                            {ex.sets && ex.reps ? `${ex.sets}x${ex.reps}` : ""}
                            {ex.weight_kg ? ` @ ${ex.weight_kg}kg` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title={t("workoutList.deleteTitle")}
        message={t("workoutList.deleteMsg")}
        confirmLabel={t("common.delete")}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </motion.div>
  );
}
