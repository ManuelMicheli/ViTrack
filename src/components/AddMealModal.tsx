"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "@/lib/animation-config";
import { CloseIcon } from "./icons";

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

const mealTypes = [
  { value: "colazione", label: "Colazione", icon: "☀️" },
  { value: "pranzo", label: "Pranzo", icon: "🌤️" },
  { value: "cena", label: "Cena", icon: "🌙" },
  { value: "snack", label: "Snack", icon: "🍎" },
];

function getDefaultMealType(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return "colazione";
  if (hour >= 11 && hour < 15) return "pranzo";
  if (hour >= 18 && hour < 22) return "cena";
  return "snack";
}

export default function AddMealModal({ isOpen, onClose, onSave, defaultMealType }: AddMealModalProps) {
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
        setError("Descrivi un pasto per poterlo analizzare.");
      }
    } catch {
      setError("Errore di connessione. Riprova.");
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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={springs.enter}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0A0A0A] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl px-6 pt-6 pb-4 border-b border-white/[0.06] z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Aggiungi Pasto</h2>
                <button onClick={onClose} className="text-[#666] hover:text-white transition-colors">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Meal type tabs */}
              <div className="flex gap-2">
                {mealTypes.map((type) => (
                  <motion.button
                    key={type.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMealType(type.value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                      mealType === type.value
                        ? "bg-white/[0.1] text-white shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                        : "bg-white/[0.03] text-[#666] hover:text-[#A1A1A1]"
                    }`}
                  >
                    <span className="block text-base mb-0.5">{type.icon}</span>
                    {type.label}
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
                  placeholder="Descrivi il tuo pasto...&#10;es: 100g petto di pollo con insalata mista e 10ml olio"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-[#666] text-sm resize-none focus:outline-none focus:border-[#3B82F6]/30 focus:shadow-[0_0_12px_rgba(59,130,246,0.1)] transition-all"
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
                  className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white text-sm font-medium disabled:opacity-40 transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                >
                  {loading ? "Analisi in corso..." : "Analizza"}
                </button>
              </div>

              {/* Loading shimmer */}
              {loading && (
                <div className="space-y-3">
                  <div className="h-16 shimmer rounded-xl" />
                  <div className="h-16 shimmer rounded-xl" />
                  <div className="h-12 shimmer rounded-xl" />
                </div>
              )}

              {/* Need info message */}
              {needInfo && (
                <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                  <p className="text-sm text-[#F59E0B] font-medium mb-1">Informazioni mancanti</p>
                  <p className="text-sm text-[#A1A1A1]">{needInfo}</p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                  <p className="text-sm text-[#EF4444]">{error}</p>
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
                    <p className="text-xs text-[#666] uppercase tracking-wider font-medium">Risultato analisi</p>

                    {/* Items breakdown */}
                    {result.items && result.items.length > 0 && (
                      <div className="space-y-2">
                        {result.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <div>
                              <p className="text-sm text-white capitalize">{item.name}</p>
                              <p className="text-xs text-[#666]">{item.quantity_g}g</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-sm text-white mb-3">{result.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{result.calories}</span>
                        <span className="text-sm text-[#666]">kcal</span>
                      </div>
                    </div>

                    {/* Macro grid */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-3 rounded-xl bg-[#3B82F6]/10 text-center">
                        <p className="text-xs text-[#3B82F6] mb-0.5">Proteine</p>
                        <p className="text-sm font-bold">{result.protein_g}g</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F59E0B]/10 text-center">
                        <p className="text-xs text-[#F59E0B] mb-0.5">Carbo</p>
                        <p className="text-sm font-bold">{result.carbs_g}g</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#EF4444]/10 text-center">
                        <p className="text-xs text-[#EF4444] mb-0.5">Grassi</p>
                        <p className="text-sm font-bold">{result.fat_g}g</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#22C55E]/10 text-center">
                        <p className="text-xs text-[#22C55E] mb-0.5">Fibre</p>
                        <p className="text-sm font-bold">{result.fiber_g}g</p>
                      </div>
                    </div>

                    {/* Save button */}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-50 hover:bg-white/90 transition-all"
                    >
                      {saving ? "Salvataggio..." : "Salva Pasto"}
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
