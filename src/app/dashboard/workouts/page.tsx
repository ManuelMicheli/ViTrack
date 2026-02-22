"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { Workout } from "@/lib/types";
import DatePicker from "@/components/DatePicker";
import { TrashIcon, PlusIcon } from "@/components/icons";
import ConfirmModal from "@/components/ConfirmModal";
import AddWorkoutModal from "@/components/AddWorkoutModal";
import WorkoutCalendar from "@/components/WorkoutCalendar";
import ExerciseProgressChart from "@/components/ExerciseProgressChart";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";

type Tab = "today" | "history" | "progress";

const axisStyle = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10,
  fill: '#585858',
};

const tooltipStyle = {
  backgroundColor: "#0A0A0A",
  border: "1px solid #1A1A1A",
  borderRadius: "8px",
  color: "#FFFFFF",
  fontSize: "12px",
  fontFamily: "'IBM Plex Mono', monospace",
};

export default function WorkoutsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("today");

  // ── Today tab state ──
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // ── History tab state ──
  const [historyRange, setHistoryRange] = useState<30 | 90>(90);
  const [historyWorkouts, setHistoryWorkouts] = useState<Workout[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Progress tab state ──
  const [exerciseList, setExerciseList] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [progressData, setProgressData] = useState<{ date: string; weight_kg: number; sets: number; reps: number; volume: number }[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);

  const userId = typeof window !== "undefined" ? localStorage.getItem("vitrack_user_id") : null;

  // ── Today: fetch workouts ──
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

  // ── History: fetch range ──
  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/workouts?user_id=${userId}&range=${historyRange}`);
      if (res.ok) setHistoryWorkouts(await res.json());
    } catch { /* ignore */ } finally {
      setHistoryLoading(false);
    }
  }, [userId, historyRange]);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab, fetchHistory]);

  // ── Progress: fetch exercise list ──
  const fetchExerciseList = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/workouts/exercises?user_id=${userId}`);
      if (res.ok) {
        const list = await res.json();
        setExerciseList(list);
        if (list.length > 0 && !selectedExercise) setSelectedExercise(list[0]);
      }
    } catch { /* ignore */ }
  }, [userId, selectedExercise]);

  useEffect(() => {
    if (activeTab === "progress") fetchExerciseList();
  }, [activeTab, fetchExerciseList]);

  // ── Progress: fetch data for selected exercise ──
  const fetchProgressData = useCallback(async () => {
    if (!userId || !selectedExercise) return;
    setProgressLoading(true);
    try {
      const res = await fetch(`/api/workouts/progress?user_id=${userId}&exercise=${encodeURIComponent(selectedExercise)}`);
      if (res.ok) setProgressData(await res.json());
    } catch { /* ignore */ } finally {
      setProgressLoading(false);
    }
  }, [userId, selectedExercise]);

  useEffect(() => {
    if (activeTab === "progress" && selectedExercise) fetchProgressData();
  }, [activeTab, selectedExercise, fetchProgressData]);

  // ── Handlers ──
  const handleDelete = async () => {
    if (!deleteId || !userId) return;
    setDeleting(true);
    try {
      await fetch(`/api/workouts?id=${deleteId}&user_id=${userId}`, { method: "DELETE" });
      fetchWorkouts();
      if (activeTab === "history") fetchHistory();
    } catch { /* ignore */ } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleSaveWorkout = async (workout: {
    description: string;
    workout_type: string;
    duration_min: number | null;
    calories_burned: number | null;
    exercises: { name: string; sets: number; reps: number; weight_kg: number | null }[];
  }) => {
    if (!userId) return;
    try {
      await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ...workout }),
      });
      fetchWorkouts();
      if (activeTab === "history") fetchHistory();
    } catch { /* ignore */ }
  };

  // ── Computed: today stats ──
  const totalBurned = workouts.reduce((s, w) => s + (w.calories_burned || 0), 0);
  const totalDuration = workouts.reduce((s, w) => s + (w.duration_min || 0), 0);

  // ── Computed: history ──
  const workoutDates = useMemo(() =>
    historyWorkouts.map((w) => w.logged_at.split("T")[0]),
    [historyWorkouts]
  );

  // Streak: consecutive days with workouts ending today (or most recent workout day)
  const streak = useMemo(() => {
    const dateSet = new Set(workoutDates);
    if (dateSet.size === 0) return 0;
    let count = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    // Allow streak to start from today or yesterday
    const todayStr = cursor.toISOString().split("T")[0];
    if (!dateSet.has(todayStr)) {
      cursor.setDate(cursor.getDate() - 1);
      if (!dateSet.has(cursor.toISOString().split("T")[0])) return 0;
    }
    while (dateSet.has(cursor.toISOString().split("T")[0])) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [workoutDates]);

  // Weekly volume for bar chart
  const weeklyVolume = useMemo(() => {
    const weeks = new Map<string, number>();
    for (const w of historyWorkouts) {
      const d = new Date(w.logged_at);
      // Get Monday of the week
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      const key = monday.toISOString().split("T")[0];
      weeks.set(key, (weeks.get(key) || 0) + 1);
    }
    return [...weeks.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, count]) => {
        const d = new Date(weekStart);
        return {
          label: d.toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
          workouts: count,
        };
      });
  }, [historyWorkouts]);

  // ── Computed: progress ──
  const prWeight = useMemo(() => {
    if (progressData.length === 0) return 0;
    return Math.max(...progressData.map((p) => p.weight_kg));
  }, [progressData]);

  // ── Tab definitions ──
  const tabs: { key: Tab; label: string }[] = [
    { key: "today", label: t("workoutsPage.tabToday") },
    { key: "history", label: t("workoutsPage.tabHistory") },
    { key: "progress", label: t("workoutsPage.tabProgress") },
  ];

  // ── Loading state ──
  if (loading && activeTab === "today") {
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
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary">{t("workoutsPage.title")}</h1>
        {activeTab === "today" && <DatePicker value={date} onChange={setDate} />}
      </motion.div>

      {/* Tab bar */}
      <motion.div variants={staggerItem} className="flex gap-2 relative">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative font-mono-label border rounded-lg px-4 py-2 transition-all ${
              activeTab === tab.key
                ? "border-[var(--color-accent-dynamic)] text-text-primary"
                : "border-border text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="workout-tab-indicator"
                className="absolute inset-0 rounded-lg border border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/5"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "today" && (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Summary cards */}
            {workouts.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
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
              </div>
            )}

            {/* Workout list */}
            {workouts.length === 0 ? (
              <div className="data-card text-center !py-10">
                <span className="text-4xl mb-3 block">{"\uD83C\uDFCB\uFE0F"}</span>
                <p className="text-text-secondary text-sm font-body">{t("workoutsPage.emptyState")}</p>
                <p className="text-text-tertiary text-xs font-body mt-1">{t("workoutsPage.emptyStateDesc")}</p>
              </div>
            ) : (
              <div className="space-y-3">
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
              </div>
            )}

            {/* Floating + button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAddModal(true)}
              className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-[var(--color-accent-dynamic)] text-black shadow-lg flex items-center justify-center z-40 hover:opacity-90 transition-opacity"
            >
              <PlusIcon className="w-6 h-6" />
            </motion.button>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {historyLoading ? (
              <div className="space-y-4">
                <div className="h-20 shimmer rounded-lg" />
                <div className="h-32 shimmer rounded-lg" />
                <div className="h-48 shimmer rounded-lg" />
              </div>
            ) : (
              <>
                {/* Streak + total stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="data-card text-center">
                    <p className="font-mono-label text-[10px] text-text-tertiary">{t("workoutsPage.streak")}</p>
                    <p className="font-display text-xl font-bold mt-1 text-[var(--color-accent-dynamic)]">
                      {streak} <span className="text-xs font-normal text-text-tertiary">{t("workoutsPage.days")}</span>
                    </p>
                  </div>
                  <div className="data-card text-center">
                    <p className="font-mono-label text-[10px] text-text-tertiary">{t("workoutsPage.sessions")}</p>
                    <p className="font-display text-xl font-bold mt-1 text-text-primary">{historyWorkouts.length}</p>
                  </div>
                  <div className="data-card text-center">
                    <p className="font-mono-label text-[10px] text-text-tertiary">{t("workoutsPage.duration")}</p>
                    <p className="font-display text-xl font-bold mt-1 text-carbs">
                      {historyWorkouts.reduce((s, w) => s + (w.duration_min || 0), 0)} <span className="text-xs font-normal text-text-tertiary">min</span>
                    </p>
                  </div>
                </div>

                {/* Period selector */}
                <div className="flex gap-2">
                  {([30, 90] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setHistoryRange(range)}
                      className={`relative font-mono-label border rounded-lg px-4 py-2 transition-all ${
                        historyRange === range
                          ? "border-[var(--color-accent-dynamic)] text-text-primary"
                          : "border-border text-text-tertiary hover:text-text-secondary"
                      }`}
                    >
                      {historyRange === range && (
                        <motion.div
                          layoutId="history-range-indicator"
                          className="absolute inset-0 rounded-lg border border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/5"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">
                        {range === 30 ? t("workoutsPage.last30") : t("workoutsPage.last90")}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Contribution calendar */}
                <div className="data-card">
                  <WorkoutCalendar workoutDates={workoutDates} days={historyRange} />
                </div>

                {/* Weekly volume chart */}
                {weeklyVolume.length > 0 && (
                  <div className="data-card">
                    <span className="font-mono-label text-text-tertiary mb-4 block">{t("workoutsPage.weeklyVolume")}</span>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={weeklyVolume}>
                        <CartesianGrid stroke="#1A1A1A" strokeDasharray="3 3" />
                        <XAxis dataKey="label" stroke="#585858" style={axisStyle} tickLine={false} axisLine={false} />
                        <YAxis stroke="#585858" style={axisStyle} tickLine={false} axisLine={false} width={30} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="workouts" fill="var(--color-accent-dynamic)" radius={[4, 4, 0, 0]} animationDuration={800} name={t("workoutsPage.sessions")} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Workout list for the period */}
                {historyWorkouts.length > 0 ? (
                  <div className="space-y-2">
                    {[...historyWorkouts].reverse().map((workout) => (
                      <div key={workout.id} className="data-card !py-3 flex items-center justify-between group relative">
                        <div className="flex gap-3 items-center">
                          <span className="text-lg">{"\uD83C\uDFCB\uFE0F"}</span>
                          <div>
                            <p className="font-body text-sm text-text-primary">{workout.description}</p>
                            <p className="font-mono-label text-text-tertiary text-[11px]">
                              {new Date(workout.logged_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                              {workout.duration_min && ` \u00B7 ${workout.duration_min} min`}
                            </p>
                          </div>
                        </div>
                        {workout.calories_burned && (
                          <span className="font-mono-label text-text-tertiary text-xs">-{workout.calories_burned} kcal</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="data-card text-center !py-8">
                    <p className="text-text-tertiary font-body text-sm">{t("workoutsPage.noData")}</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {activeTab === "progress" && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Exercise selector */}
            {exerciseList.length > 0 ? (
              <>
                <div>
                  <label className="font-mono-label text-text-tertiary text-xs block mb-1.5">{t("workoutsPage.selectExercise")}</label>
                  <select
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-transparent border border-border text-text-primary font-body text-sm focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 transition-all"
                  >
                    {exerciseList.map((ex) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>

                {/* Chart */}
                {progressLoading ? (
                  <div className="h-64 shimmer rounded-lg" />
                ) : (
                  <ExerciseProgressChart data={progressData} />
                )}

                {/* PR badge */}
                {prWeight > 0 && (
                  <div className="data-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-accent-dynamic)]/10 border border-[var(--color-accent-dynamic)]/20 flex items-center justify-center">
                      <span className="text-lg">{"\uD83C\uDFC6"}</span>
                    </div>
                    <div>
                      <p className="font-mono-label text-text-tertiary text-xs">{t("workoutsPage.personalRecord")}</p>
                      <p className="font-display text-lg font-bold text-text-primary">{prWeight} kg</p>
                    </div>
                  </div>
                )}

                {/* Recent sessions table */}
                {progressData.length > 0 && (
                  <div>
                    <span className="font-mono-label text-text-tertiary text-xs block mb-2">{t("workoutsPage.recentSessions")}</span>
                    <div className="data-card !p-0 overflow-hidden">
                      <div className="grid grid-cols-4 gap-2 px-4 py-2.5 border-b border-border">
                        <span className="font-mono-label text-text-tertiary text-[10px]">Data</span>
                        <span className="font-mono-label text-text-tertiary text-[10px] text-center">{t("addWorkout.sets")} x {t("addWorkout.reps")}</span>
                        <span className="font-mono-label text-text-tertiary text-[10px] text-center">{t("addWorkout.weight")}</span>
                        <span className="font-mono-label text-text-tertiary text-[10px] text-right">Volume</span>
                      </div>
                      {[...progressData].reverse().slice(0, 10).map((p, i) => {
                        const isPR = p.weight_kg === prWeight;
                        return (
                          <div key={i} className={`grid grid-cols-4 gap-2 px-4 py-2.5 ${i > 0 ? "border-t border-border-subtle" : ""}`}>
                            <span className="font-mono-label text-text-secondary text-xs">
                              {new Date(p.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                            </span>
                            <span className="font-mono-label text-text-primary text-xs text-center">{p.sets}x{p.reps}</span>
                            <span className={`font-mono-label text-xs text-center ${isPR ? "text-[var(--color-accent-dynamic)] font-bold" : "text-text-primary"}`}>
                              {p.weight_kg}kg {isPR ? "PR" : ""}
                            </span>
                            <span className="font-mono-label text-text-tertiary text-xs text-right">{p.volume}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="data-card text-center !py-8">
                <span className="text-4xl mb-3 block">{"\uD83D\uDCCA"}</span>
                <p className="text-text-secondary text-sm font-body">{t("workoutsPage.noData")}</p>
                <p className="text-text-tertiary text-xs font-body mt-1">{t("workoutsPage.emptyStateDesc")}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddWorkoutModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveWorkout}
      />

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
