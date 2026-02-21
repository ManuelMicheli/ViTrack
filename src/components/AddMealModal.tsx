"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "@/lib/animation-config";
import { CloseIcon } from "./icons";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/translations";

interface MealResult {
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  meal_type: string;
  items?: { name: string; quantity_g: number }[];
}

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: {
    description: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    meal_type: string;
  }) => void;
  defaultMealType?: string;
}

const mealTypeKeys: { value: string; labelKey: TranslationKey; icon: string }[] = [
  { value: "colazione", labelKey: "meal.colazione", icon: "\u2600\uFE0F" },
  { value: "pranzo", labelKey: "meal.pranzo", icon: "\uD83C\uDF24\uFE0F" },
  { value: "cena", labelKey: "meal.cena", icon: "\uD83C\uDF19" },
  { value: "snack", labelKey: "meal.snack", icon: "\uD83C\uDF4E" },
];

function getDefaultMealType(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return "colazione";
  if (hour >= 11 && hour < 15) return "pranzo";
  if (hour >= 18 && hour < 22) return "cena";
  return "snack";
}

export default function AddMealModal({ isOpen, onClose, onSave, defaultMealType }: AddMealModalProps) {
  const { t } = useLanguage();
  const [mealType, setMealType] = useState(defaultMealType || getDefaultMealType());
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<MealResult | null>(null);
  const [error, setError] = useState("");
  const [needInfo, setNeedInfo] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMealType(defaultMealType || getDefaultMealType());
      setText("");
      setResult(null);
      setError("");
      setNeedInfo("");
    }
  }, [isOpen, defaultMealType]);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setNeedInfo("");
    setResult(null);

    try {
      const res = await fetch("/api/meals/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      const data = await res.json();

      if (data.type === "meal") {
        setResult({
          description: data.description,
          calories: data.calories,
          protein_g: data.protein_g,
          carbs_g: data.carbs_g,
          fat_g: data.fat_g,
          fiber_g: data.fiber_g,
          meal_type: data.meal_type || mealType,
          items: data.items,
        });
      } else if (data.type === "need_info") {
        setNeedInfo(data.message);
      } else if (data.type === "error") {
        setError(data.message);
      } else {
        setError(t("addMeal.describeError"));
      }
    } catch {
      setError(t("error.connection"));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      onSave({
        description: result.description,
        calories: result.calories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fat_g: result.fat_g,
        fiber_g: result.fiber_g,
        meal_type: mealType,
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-text-primary">{t("addMeal.title")}</h2>
                <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Meal type tabs */}
              <div className="flex gap-2">
                {mealTypeKeys.map((type) => (
                  <motion.button
                    key={type.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMealType(type.value)}
                    className={`flex-1 py-2 rounded-lg font-mono-label transition-all ${
                      mealType === type.value
                        ? "bg-surface-raised text-text-primary border border-border"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    <span className="block text-base mb-0.5">{type.icon}</span>
                    {t(type.labelKey)}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Text input */}
              <div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t("addMeal.placeholder")}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-transparent border border-border text-text-primary placeholder-text-tertiary font-body text-sm resize-none focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAnalyze();
                    }
                  }}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !text.trim()}
                  className="w-full mt-2 py-2.5 rounded-lg bg-[var(--color-accent-dynamic)] text-black font-mono-label disabled:opacity-40 transition-all hover:opacity-90"
                >
                  {loading ? t("addMeal.analyzing") : t("addMeal.analyze")}
                </button>
              </div>

              {/* Loading shimmer */}
              {loading && (
                <div className="space-y-3">
                  <div className="h-16 shimmer rounded-lg" />
                  <div className="h-16 shimmer rounded-lg" />
                  <div className="h-12 shimmer rounded-lg" />
                </div>
              )}

              {/* Need info message */}
              {needInfo && (
                <div className="p-4 rounded-lg bg-carbs/10 border border-carbs/20">
                  <p className="font-mono-label text-carbs mb-1">{t("addMeal.needInfo")}</p>
                  <p className="font-body text-sm text-text-secondary">{needInfo}</p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="p-4 rounded-lg bg-danger/10 border border-danger/20">
                  <p className="font-body text-sm text-danger">{error}</p>
                </div>
              )}

              {/* Results */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <p className="font-mono-label text-text-tertiary">{t("addMeal.analysisResult")}</p>

                    {/* Items breakdown */}
                    {result.items && result.items.length > 0 && (
                      <div className="space-y-2">
                        {result.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                            <div>
                              <p className="font-body text-sm text-text-primary capitalize">{item.name}</p>
                              <p className="font-mono-label text-text-tertiary">{item.quantity_g}g</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    <div className="p-4 rounded-lg border border-border">
                      <p className="font-body text-sm text-text-primary mb-3">{result.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-display text-2xl font-bold text-text-primary">{result.calories}</span>
                        <span className="font-mono-label text-text-tertiary">kcal</span>
                      </div>
                    </div>

                    {/* Macro grid */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-3 rounded-lg bg-protein/10 text-center">
                        <p className="font-mono-label text-protein mb-0.5">{t("macro.proteinShort")}</p>
                        <p className="font-display text-sm font-bold text-text-primary">{result.protein_g}g</p>
                      </div>
                      <div className="p-3 rounded-lg bg-carbs/10 text-center">
                        <p className="font-mono-label text-carbs mb-0.5">{t("macro.carbsShort")}</p>
                        <p className="font-display text-sm font-bold text-text-primary">{result.carbs_g}g</p>
                      </div>
                      <div className="p-3 rounded-lg bg-fat/10 text-center">
                        <p className="font-mono-label text-fat mb-0.5">{t("macro.fat")}</p>
                        <p className="font-display text-sm font-bold text-text-primary">{result.fat_g}g</p>
                      </div>
                      <div className="p-3 rounded-lg bg-fiber/10 text-center">
                        <p className="font-mono-label text-fiber mb-0.5">{t("macro.fiber")}</p>
                        <p className="font-display text-sm font-bold text-text-primary">{result.fiber_g}g</p>
                      </div>
                    </div>

                    {/* Save button */}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full py-3 rounded-lg bg-[var(--color-accent-dynamic)] text-black font-mono-label disabled:opacity-50 hover:opacity-90 transition-all"
                    >
                      {saving ? t("common.saving") : t("addMeal.saveMeal")}
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
