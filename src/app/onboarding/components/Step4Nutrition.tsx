"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animation-config";

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-lg bg-transparent border border-border text-text-primary placeholder-text-tertiary text-sm font-body focus:outline-none focus:border-[var(--color-accent-dynamic)] transition-all";

interface Step4Data {
  diet_type: string;
  intolerances: string[];
  meals_per_day: string;
  supplements: string[];
}

interface Step4NutritionProps {
  data: Step4Data;
  onChange: (field: keyof Step4Data, value: string | string[]) => void;
}

const dietTypes = ["Onnivoro", "Vegetariano", "Vegano", "Senza glutine", "Altro"];
const presetIntolerances = ["Glutine", "Lattosio", "Uova", "Frutta a guscio", "Soia", "Pesce"];
const mealsPerDay = ["2", "3", "4", "5 o più"];
const supplementOptions = [
  "Whey Protein",
  "Creatina",
  "Vitamine/Minerali",
  "Pre-workout",
  "Nessuno",
];

export default function Step4Nutrition({ data, onChange }: Step4NutritionProps) {
  const [customIntolerance, setCustomIntolerance] = useState("");

  const toggleIntolerance = (item: string) => {
    if (data.intolerances.includes(item)) {
      onChange(
        "intolerances",
        data.intolerances.filter((i) => i !== item)
      );
    } else {
      onChange("intolerances", [...data.intolerances, item]);
    }
  };

  const addCustomIntolerance = () => {
    const trimmed = customIntolerance.trim();
    if (trimmed && !data.intolerances.includes(trimmed)) {
      onChange("intolerances", [...data.intolerances, trimmed]);
      setCustomIntolerance("");
    }
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomIntolerance();
    }
  };

  const toggleSupplement = (item: string) => {
    if (item === "Nessuno") {
      // If selecting "Nessuno", clear all others
      if (data.supplements.includes("Nessuno")) {
        onChange("supplements", []);
      } else {
        onChange("supplements", ["Nessuno"]);
      }
      return;
    }
    // If selecting something else, remove "Nessuno"
    const withoutNessuno = data.supplements.filter((s) => s !== "Nessuno");
    if (withoutNessuno.includes(item)) {
      onChange(
        "supplements",
        withoutNessuno.filter((s) => s !== item)
      );
    } else {
      onChange("supplements", [...withoutNessuno, item]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Alimentazione
        </h2>
        <p className="font-body text-sm text-text-secondary">
          Le tue preferenze alimentari ci aiutano a darti consigli più mirati.
        </p>
      </div>

      <motion.div
        className="space-y-6"
        variants={staggerContainer(0.06)}
        initial="initial"
        animate="animate"
      >
        {/* Diet type */}
        <motion.div variants={staggerItem} className="space-y-2">
          <label className="font-mono-label text-text-tertiary block">
            Preferenze alimentari
          </label>
          <div className="flex flex-wrap gap-2">
            {dietTypes.map((type) => {
              const isSelected = data.diet_type === type;
              return (
                <button
                  key={type}
                  onClick={() => onChange("diet_type", type)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    isSelected
                      ? "border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/10"
                      : "border-border bg-surface hover:border-border"
                  }`}
                >
                  <span
                    className={`font-body text-sm ${
                      isSelected ? "text-text-primary" : "text-text-secondary"
                    }`}
                  >
                    {type}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Intolerances */}
        <motion.div variants={staggerItem} className="space-y-3">
          <label className="font-mono-label text-text-tertiary block">
            Intolleranze
          </label>
          <div className="flex flex-wrap gap-2">
            {presetIntolerances.map((item) => {
              const isSelected = data.intolerances.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleIntolerance(item)}
                  className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
                    isSelected
                      ? "border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/10 text-text-primary"
                      : "border-border bg-surface text-text-secondary hover:border-border"
                  }`}
                >
                  {isSelected && (
                    <span className="mr-1">
                      <svg
                        className="w-3 h-3 inline -mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                  {item}
                </button>
              );
            })}
            {/* Custom added intolerances */}
            {data.intolerances
              .filter((i) => !presetIntolerances.includes(i))
              .map((item) => (
                <button
                  key={item}
                  onClick={() => toggleIntolerance(item)}
                  className="px-3 py-1.5 rounded-full border border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/10 text-text-primary text-xs transition-all"
                >
                  <svg
                    className="w-3 h-3 inline -mt-0.5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {item}
                </button>
              ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customIntolerance}
              onChange={(e) => setCustomIntolerance(e.target.value)}
              onKeyDown={handleCustomKeyDown}
              placeholder="Aggiungi intolleranza..."
              className={INPUT_CLASS + " flex-1"}
            />
            <button
              onClick={addCustomIntolerance}
              disabled={!customIntolerance.trim()}
              className="px-4 py-2 rounded-lg border border-border bg-surface text-text-secondary font-body text-sm hover:border-[var(--color-accent-dynamic)] transition-all disabled:opacity-30"
            >
              +
            </button>
          </div>
        </motion.div>

        {/* Meals per day */}
        <motion.div variants={staggerItem} className="space-y-2">
          <label className="font-mono-label text-text-tertiary block">
            Pasti al giorno
          </label>
          <div className="flex flex-wrap gap-2">
            {mealsPerDay.map((opt) => {
              const isSelected = data.meals_per_day === opt;
              return (
                <button
                  key={opt}
                  onClick={() => onChange("meals_per_day", opt)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    isSelected
                      ? "border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/10"
                      : "border-border bg-surface hover:border-border"
                  }`}
                >
                  <span
                    className={`font-body text-sm ${
                      isSelected ? "text-text-primary" : "text-text-secondary"
                    }`}
                  >
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Supplements */}
        <motion.div variants={staggerItem} className="space-y-2">
          <label className="font-mono-label text-text-tertiary block">
            Integratori
          </label>
          <div className="flex flex-wrap gap-2">
            {supplementOptions.map((opt) => {
              const isSelected = data.supplements.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggleSupplement(opt)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    isSelected
                      ? "border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/10"
                      : "border-border bg-surface hover:border-border"
                  }`}
                >
                  <span
                    className={`font-body text-sm ${
                      isSelected ? "text-text-primary" : "text-text-secondary"
                    }`}
                  >
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
