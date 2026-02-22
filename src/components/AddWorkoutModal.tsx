"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "@/lib/animation-config";
import { CloseIcon, TrashIcon, PlusIcon } from "./icons";
import { useLanguage } from "@/lib/language-context";
import { WORKOUT_TEMPLATES, type WorkoutTemplate } from "@/lib/workout-templates";

interface ExerciseRow {
  name: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
}

interface AddWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workout: {
    description: string;
    workout_type: string;
    duration_min: number | null;
    calories_burned: number | null;
    exercises: ExerciseRow[];
  }) => void;
}

export default function AddWorkoutModal({ isOpen, onClose, onSave }: AddWorkoutModalProps) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<"template" | "editor">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [workoutType, setWorkoutType] = useState("Palestra");
  const [description, setDescription] = useState("");
  const [durationMin, setDurationMin] = useState<string>("");
  const [caloriesBurned, setCaloriesBurned] = useState<string>("");
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep("template");
      setSelectedTemplate(null);
      setWorkoutType("Palestra");
      setDescription("");
      setDurationMin("");
      setCaloriesBurned("");
      setExercises([]);
      setSaving(false);
    }
  }, [isOpen]);

  const handleTemplateSelect = (template: WorkoutTemplate) => {
    setSelectedTemplate(template);
    setWorkoutType(template.workout_type);
    setDescription(language === "it" ? template.name_it : template.name_en);
    setExercises(
      template.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight_kg: ex.weight_kg,
      }))
    );
    setStep("editor");
  };

  const addExercise = () => {
    setExercises((prev) => [...prev, { name: "", sets: 3, reps: 10, weight_kg: null }]);
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof ExerciseRow, value: string | number | null) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  const handleSave = async () => {
    if (!description.trim()) return;
    setSaving(true);
    try {
      onSave({
        description: description.trim(),
        workout_type: workoutType,
        duration_min: durationMin ? parseInt(durationMin, 10) : null,
        calories_burned: caloriesBurned ? parseInt(caloriesBurned, 10) : null,
        exercises: exercises.filter((ex) => ex.name.trim()),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={springs.enter}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background border border-border rounded-t-lg sm:rounded-lg"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background px-6 pt-6 pb-4 border-b border-border z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {step === "editor" && (
                    <button
                      onClick={() => setStep("template")}
                      className="text-text-tertiary hover:text-text-primary transition-colors font-mono-label text-sm"
                    >
                      {t("addWorkout.back")}
                    </button>
                  )}
                  <h2 className="font-display text-xl font-bold text-text-primary">
                    {step === "template" ? t("addWorkout.chooseTemplate") : t("addWorkout.title")}
                  </h2>
                </div>
                <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              <AnimatePresence mode="wait">
                {step === "template" ? (
                  <motion.div
                    key="template"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-3 gap-3"
                  >
                    {WORKOUT_TEMPLATES.map((template) => (
                      <motion.button
                        key={template.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTemplateSelect(template)}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-[var(--color-accent-dynamic)]/40 hover:bg-surface-raised/50 transition-all"
                      >
                        <span className="text-2xl">{template.icon}</span>
                        <span className="font-mono-label text-text-primary text-xs">
                          {language === "it" ? template.name_it : template.name_en}
                        </span>
                        {template.exercises.length > 0 && (
                          <span className="font-mono-label text-text-tertiary text-[10px]">
                            {template.exercises.length} {t("workoutsPage.exercises").toLowerCase()}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="editor"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Description */}
                    <div>
                      <label className="font-mono-label text-text-tertiary text-xs block mb-1.5">{t("addWorkout.description")}</label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-transparent border border-border text-text-primary font-body text-sm focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 transition-all"
                      />
                    </div>

                    {/* Type + Duration + Calories row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="font-mono-label text-text-tertiary text-xs block mb-1.5">{t("addWorkout.type")}</label>
                        <select
                          value={workoutType}
                          onChange={(e) => setWorkoutType(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-transparent border border-border text-text-primary font-body text-sm focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 transition-all"
                        >
                          <option value="Palestra">Palestra</option>
                          <option value="Cardio">Cardio</option>
                          <option value="HIIT">HIIT</option>
                          <option value="Calisthenics">Calisthenics</option>
                          <option value="Altro">Altro</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-mono-label text-text-tertiary text-xs block mb-1.5">{t("addWorkout.duration")}</label>
                        <input
                          type="number"
                          value={durationMin}
                          onChange={(e) => setDurationMin(e.target.value)}
                          placeholder="60"
                          className="w-full px-3 py-2.5 rounded-lg bg-transparent border border-border text-text-primary font-body text-sm focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 transition-all"
                        />
                      </div>
                      <div>
                        <label className="font-mono-label text-text-tertiary text-xs block mb-1.5">{t("addWorkout.calories")}</label>
                        <input
                          type="number"
                          value={caloriesBurned}
                          onChange={(e) => setCaloriesBurned(e.target.value)}
                          placeholder="300"
                          className="w-full px-3 py-2.5 rounded-lg bg-transparent border border-border text-text-primary font-body text-sm focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 transition-all"
                        />
                      </div>
                    </div>

                    {/* Exercises */}
                    {exercises.length > 0 && (
                      <div>
                        <label className="font-mono-label text-text-tertiary text-xs block mb-2">{t("addWorkout.exercises")}</label>
                        <div className="space-y-2">
                          {/* Header */}
                          <div className="grid grid-cols-[1fr_50px_50px_60px_28px] gap-2 px-1">
                            <span className="font-mono-label text-text-tertiary text-[10px]">{t("addWorkout.exercise")}</span>
                            <span className="font-mono-label text-text-tertiary text-[10px] text-center">{t("addWorkout.sets")}</span>
                            <span className="font-mono-label text-text-tertiary text-[10px] text-center">{t("addWorkout.reps")}</span>
                            <span className="font-mono-label text-text-tertiary text-[10px] text-center">{t("addWorkout.weight")}</span>
                            <span />
                          </div>
                          {exercises.map((ex, i) => (
                            <div key={i} className="grid grid-cols-[1fr_50px_50px_60px_28px] gap-2 items-center">
                              <input
                                type="text"
                                value={ex.name}
                                onChange={(e) => updateExercise(i, "name", e.target.value)}
                                placeholder={t("addWorkout.exercise")}
                                className="px-2 py-2 rounded-lg bg-transparent border border-border text-text-primary font-body text-xs focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 transition-all"
                              />
                              <input
                                type="number"
                                value={ex.sets}
                                onChange={(e) => updateExercise(i, "sets", parseInt(e.target.value) || 0)}
                                className="px-1 py-2 rounded-lg bg-transparent border border-border text-text-primary font-body text-xs text-center focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 transition-all"
                              />
                              <input
                                type="number"
                                value={ex.reps}
                                onChange={(e) => updateExercise(i, "reps", parseInt(e.target.value) || 0)}
                                className="px-1 py-2 rounded-lg bg-transparent border border-border text-text-primary font-body text-xs text-center focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 transition-all"
                              />
                              <input
                                type="number"
                                value={ex.weight_kg ?? ""}
                                onChange={(e) => updateExercise(i, "weight_kg", e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="kg"
                                className="px-1 py-2 rounded-lg bg-transparent border border-border text-text-primary font-body text-xs text-center focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 transition-all"
                              />
                              <button
                                onClick={() => removeExercise(i)}
                                className="text-danger/60 hover:text-danger transition-colors p-1"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add exercise button */}
                    <button
                      onClick={addExercise}
                      className="w-full py-2.5 rounded-lg border border-dashed border-border text-text-tertiary hover:text-text-secondary hover:border-text-tertiary font-mono-label text-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <PlusIcon className="w-4 h-4" />
                      {t("addWorkout.addExercise")}
                    </button>

                    {/* Save button */}
                    <button
                      onClick={handleSave}
                      disabled={saving || !description.trim()}
                      className="w-full py-3 rounded-lg bg-[var(--color-accent-dynamic)] text-black font-mono-label disabled:opacity-40 hover:opacity-90 transition-all"
                    >
                      {saving ? t("addWorkout.saving") : t("addWorkout.save")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
