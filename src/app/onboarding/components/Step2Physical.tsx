"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animation-config";

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-lg bg-transparent border border-border text-text-primary placeholder-text-tertiary text-sm font-body focus:outline-none focus:border-[var(--color-accent-dynamic)] transition-all";

interface Step2Data {
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  target_weight_kg: string;
  neck_cm: string;
  waist_cm: string;
  hip_cm: string;
}

interface Step2PhysicalProps {
  data: Step2Data;
  goal: string;
  onChange: (field: keyof Step2Data, value: string) => void;
}

const genderOptions = [
  { value: "male", label: "Uomo" },
  { value: "female", label: "Donna" },
  { value: "other", label: "Preferisco non specificare" },
];

export default function Step2Physical({ data, goal, onChange }: Step2PhysicalProps) {
  const showTargetWeight = goal !== "Mantenere il peso";
  const showHip = data.gender === "female";

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Dati fisici
        </h2>
        <p className="font-body text-sm text-text-secondary">
          Questi dati ci servono per calcolare il tuo metabolismo basale e i tuoi obiettivi.
        </p>
      </div>

      <motion.div
        className="space-y-5"
        variants={staggerContainer(0.05)}
        initial="initial"
        animate="animate"
      >
        {/* Eta */}
        <motion.div variants={staggerItem}>
          <label className="font-mono-label text-text-tertiary mb-2 block">Età</label>
          <input
            type="number"
            min={14}
            max={100}
            value={data.age}
            onChange={(e) => onChange("age", e.target.value)}
            placeholder="25"
            className={INPUT_CLASS}
          />
        </motion.div>

        {/* Sesso */}
        <motion.div variants={staggerItem}>
          <label className="font-mono-label text-text-tertiary mb-2 block">Sesso</label>
          <div className="grid grid-cols-3 gap-2">
            {genderOptions.map((opt) => {
              const isSelected = data.gender === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onChange("gender", opt.value)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    isSelected
                      ? "border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/10"
                      : "border-border bg-surface hover:border-border"
                  }`}
                >
                  <span
                    className={`font-body text-xs ${
                      isSelected ? "text-text-primary" : "text-text-secondary"
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Altezza */}
        <motion.div variants={staggerItem}>
          <label className="font-mono-label text-text-tertiary mb-2 block">Altezza</label>
          <div className="relative">
            <input
              type="number"
              min={100}
              max={250}
              value={data.height_cm}
              onChange={(e) => onChange("height_cm", e.target.value)}
              placeholder="175"
              className={INPUT_CLASS + " pr-12"}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">
              cm
            </span>
          </div>
        </motion.div>

        {/* Peso attuale */}
        <motion.div variants={staggerItem}>
          <label className="font-mono-label text-text-tertiary mb-2 block">Peso attuale</label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min={30}
              max={300}
              value={data.weight_kg}
              onChange={(e) => onChange("weight_kg", e.target.value)}
              placeholder="75.0"
              className={INPUT_CLASS + " pr-12"}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">
              kg
            </span>
          </div>
        </motion.div>

        {/* Peso obiettivo */}
        {showTargetWeight && (
          <motion.div variants={staggerItem}>
            <label className="font-mono-label text-text-tertiary mb-2 block">Peso obiettivo</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min={30}
                max={300}
                value={data.target_weight_kg}
                onChange={(e) => onChange("target_weight_kg", e.target.value)}
                placeholder="70.0"
                className={INPUT_CLASS + " pr-12"}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">
                kg
              </span>
            </div>
          </motion.div>
        )}

        {/* Body measurements (optional) */}
        <motion.div variants={staggerItem} className="pt-2">
          <div className="border-t border-border-subtle pt-4">
            <p className="font-body text-xs text-text-tertiary mb-4">
              Per una stima più precisa del grasso corporeo (opzionale)
            </p>

            <div className="space-y-4">
              {/* Collo */}
              <div>
                <label className="font-mono-label text-text-tertiary mb-2 block">
                  Circonferenza collo
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={20}
                    max={60}
                    value={data.neck_cm}
                    onChange={(e) => onChange("neck_cm", e.target.value)}
                    placeholder="38"
                    className={INPUT_CLASS + " pr-12"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">
                    cm
                  </span>
                </div>
              </div>

              {/* Vita */}
              <div>
                <label className="font-mono-label text-text-tertiary mb-2 block">
                  Circonferenza vita
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={40}
                    max={200}
                    value={data.waist_cm}
                    onChange={(e) => onChange("waist_cm", e.target.value)}
                    placeholder="82"
                    className={INPUT_CLASS + " pr-12"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">
                    cm
                  </span>
                </div>
              </div>

              {/* Fianchi (only for female) */}
              {showHip && (
                <div>
                  <label className="font-mono-label text-text-tertiary mb-2 block">
                    Circonferenza fianchi
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={50}
                      max={200}
                      value={data.hip_cm}
                      onChange={(e) => onChange("hip_cm", e.target.value)}
                      placeholder="95"
                      className={INPUT_CLASS + " pr-12"}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">
                      cm
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
