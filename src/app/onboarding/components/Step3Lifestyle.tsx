"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animation-config";

interface Step3Data {
  activity_level: string;
  workout_types: string[];
  weekly_frequency: string;
  sleep_hours: string;
  stress_level: string;
}

interface Step3LifestyleProps {
  data: Step3Data;
  onChange: (field: keyof Step3Data, value: string | string[]) => void;
}

const activityLevels = [
  { value: "sedentary", label: "Sedentario", desc: "Lavoro da scrivania, poco movimento" },
  { value: "light", label: "Leggermente attivo", desc: "Esercizio leggero 1-3 giorni/sett" },
  { value: "moderate", label: "Moderatamente attivo", desc: "Esercizio moderato 3-5 giorni/sett" },
  { value: "active", label: "Molto attivo", desc: "Esercizio intenso 6-7 giorni/sett" },
  { value: "very_active", label: "Atleta", desc: "Allenamento intenso 2x/giorno" },
];

const workoutTypes = [
  "Pesi in palestra",
  "Cardio",
  "Sport di squadra",
  "Calisthenics",
  "Altro",
];

const frequencyOptions = ["1-2 giorni", "3-4 giorni", "5+ giorni"];
const sleepOptions = ["Meno di 6h", "6-7h", "7-8h", "8h o più"];
const stressOptions = ["Basso", "Medio", "Alto"];

function SingleSelectCards({
  options,
  value,
  onChange,
  showDesc,
}: {
  options: { value: string; label: string; desc?: string }[] | string[];
  value: string;
  onChange: (value: string) => void;
  showDesc?: boolean;
}) {
  const normalized = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  return (
    <div className="grid grid-cols-1 gap-2">
      {normalized.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`text-left p-3 rounded-lg border transition-all ${
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
              {opt.label}
            </span>
            {showDesc && "desc" in opt && opt.desc && (
              <p className="font-body text-xs text-text-tertiary mt-0.5">{opt.desc}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MultiSelectCards({
  options,
  values,
  onChange,
}: {
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (values.includes(opt)) {
      onChange(values.filter((v) => v !== opt));
    } else {
      onChange([...values, opt]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = values.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
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
  );
}

function InlineSelectCards({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
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
  );
}

export default function Step3Lifestyle({ data, onChange }: Step3LifestyleProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Stile di vita
        </h2>
        <p className="font-body text-sm text-text-secondary">
          Raccontaci delle tue abitudini quotidiane per personalizzare i calcoli.
        </p>
      </div>

      <motion.div
        className="space-y-6"
        variants={staggerContainer(0.06)}
        initial="initial"
        animate="animate"
      >
        {/* Activity level */}
        <motion.div variants={staggerItem} className="space-y-2">
          <label className="font-mono-label text-text-tertiary block">
            Livello di attività
          </label>
          <SingleSelectCards
            options={activityLevels}
            value={data.activity_level}
            onChange={(v) => onChange("activity_level", v)}
            showDesc
          />
        </motion.div>

        {/* Workout types */}
        <motion.div variants={staggerItem} className="space-y-2">
          <label className="font-mono-label text-text-tertiary block">
            Tipo di allenamento
          </label>
          <MultiSelectCards
            options={workoutTypes}
            values={data.workout_types}
            onChange={(v) => onChange("workout_types", v)}
          />
        </motion.div>

        {/* Frequency */}
        <motion.div variants={staggerItem} className="space-y-2">
          <label className="font-mono-label text-text-tertiary block">
            Frequenza settimanale
          </label>
          <InlineSelectCards
            options={frequencyOptions}
            value={data.weekly_frequency}
            onChange={(v) => onChange("weekly_frequency", v)}
          />
        </motion.div>

        {/* Sleep */}
        <motion.div variants={staggerItem} className="space-y-2">
          <label className="font-mono-label text-text-tertiary block">
            Ore di sonno
          </label>
          <InlineSelectCards
            options={sleepOptions}
            value={data.sleep_hours}
            onChange={(v) => onChange("sleep_hours", v)}
          />
        </motion.div>

        {/* Stress */}
        <motion.div variants={staggerItem} className="space-y-2">
          <label className="font-mono-label text-text-tertiary block">
            Livello di stress
          </label>
          <InlineSelectCards
            options={stressOptions}
            value={data.stress_level}
            onChange={(v) => onChange("stress_level", v)}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
