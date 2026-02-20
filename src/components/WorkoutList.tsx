"use client";

import { useState } from "react";
import type { Workout } from "@/lib/types";
import { TrashIcon } from "./icons";
import ConfirmModal from "./ConfirmModal";

interface WorkoutListProps {
  workouts: Workout[];
  onDelete?: (workoutId: string) => void;
  compact?: boolean;
}

export default function WorkoutList({ workouts, onDelete, compact }: WorkoutListProps) {
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
      <div className="glass-card p-6">
        <p className="text-[#666] text-sm text-center py-2">Nessun allenamento registrato</p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs text-[#666] uppercase tracking-wider font-medium">
            Allenamenti ({workouts.length})
          </h3>
        </div>
        <div className="space-y-2">
          {workouts.slice(0, compact ? 3 : undefined).map((workout) => (
            <div key={workout.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition-colors group">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <span className="text-lg">🏋️</span>
                  <div>
                    <p className="font-medium text-white text-sm">{workout.description}</p>
                    <p className="text-xs text-[#666]">
                      {workout.workout_type}
                      {workout.duration_min && ` · ${workout.duration_min} min`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {workout.calories_burned && (
                    <span className="text-sm font-semibold text-[#F59E0B] whitespace-nowrap">
                      -{workout.calories_burned} kcal
                    </span>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => setDeleteId(workout.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#666] hover:text-[#EF4444] transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {workout.exercises && workout.exercises.length > 0 && (
                <div className="mt-2 ml-10 space-y-1">
                  {workout.exercises.map((ex, i) => (
                    <p key={i} className="text-xs text-[#666]">
                      {ex.name}
                      {ex.sets && ex.reps && ` - ${ex.sets}x${ex.reps}`}
                      {ex.weight_kg && ` @ ${ex.weight_kg}kg`}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Elimina allenamento"
        message="Vuoi eliminare questo allenamento? L'azione è irreversibile."
        confirmLabel="Elimina"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
