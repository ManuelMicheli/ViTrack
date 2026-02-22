"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Workout } from "@/lib/types";
import { TrashIcon } from "./icons";
import ConfirmModal from "./ConfirmModal";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";

interface WorkoutListProps {
  workouts: Workout[];
  onDelete?: (workoutId: string) => void;
  compact?: boolean;
}

export default function WorkoutList({ workouts, onDelete, compact }: WorkoutListProps) {
  const { t } = useLanguage();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId || !onDelete) return;
    setDeleting(true);
    onDelete(deleteId);
    setDeleteId(null);
    setDeleting(false);
  };

  if (workouts.length === 0) {
    return (
      <div className="data-card">
        <p className="text-text-tertiary text-sm text-center py-2 font-body">{t("workoutList.noWorkouts")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="data-card !p-0">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <span className="font-mono-label text-text-tertiary">
            {t("workoutList.title")} ({workouts.length})
          </span>
        </div>
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.05)}
          className="divide-y divide-border-subtle"
        >
          <AnimatePresence mode="popLayout">
            {workouts.slice(0, compact ? 3 : undefined).map((workout) => (
              <motion.div
                key={workout.id}
                variants={staggerItem}
                exit={{ opacity: 0, x: -100 }}
                layout
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80 && onDelete) setDeleteId(workout.id);
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="px-5 py-3 hover:bg-surface-raised transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <span className="text-lg">{"\uD83C\uDFCB\uFE0F"}</span>
                    <div>
                      <p className="font-body text-base text-text-primary">{workout.description}</p>
                      <p className="font-mono-label text-text-tertiary">
                        {workout.workout_type}
                        {workout.duration_min && ` \u00B7 ${workout.duration_min} min`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {workout.calories_burned && (
                      <span className="font-mono-label text-text-secondary whitespace-nowrap">
                        -{workout.calories_burned} kcal
                      </span>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => setDeleteId(workout.id)}
                        className="opacity-0 group-hover:opacity-100 text-danger hover:bg-danger/10 rounded p-1 transition-all"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {workout.exercises && workout.exercises.length > 0 && (
                  <div className="mt-2 ml-10 space-y-1">
                    {workout.exercises.map((ex, i) => (
                      <p key={i} className="font-mono-label text-[11px] text-text-secondary">
                        {ex.name}
                        {ex.sets && ex.reps && ` - ${ex.sets}x${ex.reps}`}
                        {ex.weight_kg && ` @ ${ex.weight_kg}kg`}
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

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
    </>
  );
}
