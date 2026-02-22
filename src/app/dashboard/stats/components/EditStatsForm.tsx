"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@/lib/types";

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-lg bg-transparent border border-border text-text-primary placeholder-text-tertiary text-sm font-body focus:outline-none focus:border-[var(--color-accent-dynamic)] transition-all";

const SELECT_CLASS =
  "w-full px-4 py-3 rounded-lg bg-transparent border border-border text-text-primary text-sm font-body focus:outline-none focus:border-[var(--color-accent-dynamic)] transition-all appearance-none";

interface EditStatsFormProps {
  user: User;
  onSaved: (updatedUser: User) => void;
}

const goalOptions = [
  "Perdere grasso corporeo",
  "Mantenere il peso",
  "Mangiare pi\u00f9 sano",
  "Aumentare massa muscolare",
  "Migliorare la performance atletica",
];

const activityOptions = [
  { value: "sedentary", label: "Sedentario" },
  { value: "light", label: "Leggermente attivo" },
  { value: "moderate", label: "Moderatamente attivo" },
  { value: "active", label: "Molto attivo" },
  { value: "very_active", label: "Atleta" },
];

export default function EditStatsForm({ user, onSaved }: EditStatsFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [weightKg, setWeightKg] = useState(user.weight_kg != null ? String(user.weight_kg) : "");
  const [neckCm, setNeckCm] = useState(user.neck_cm != null ? String(user.neck_cm) : "");
  const [waistCm, setWaistCm] = useState(user.waist_cm != null ? String(user.waist_cm) : "");
  const [hipCm, setHipCm] = useState(user.hip_cm != null ? String(user.hip_cm) : "");
  const [activityLevel, setActivityLevel] = useState<string>(user.activity_level || "sedentary");
  const [goal, setGoal] = useState(user.goal || "");

  const handleRecalculate = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          weight_kg: weightKg ? parseFloat(weightKg) : undefined,
          neck_cm: neckCm ? parseFloat(neckCm) : undefined,
          waist_cm: waistCm ? parseFloat(waistCm) : undefined,
          hip_cm: hipCm ? parseFloat(hipCm) : undefined,
          activity_level: activityLevel,
          goal: goal || undefined,
        }),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        onSaved(updatedUser);
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setIsOpen(false);
        }, 1500);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono-label text-text-tertiary">Modifica e ricalcola</p>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="font-mono-label text-[var(--color-accent-dynamic)] hover:opacity-80 transition-opacity"
        >
          {isOpen ? "Chiudi" : "Modifica"}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="data-card space-y-4">
              <p className="font-body text-xs text-text-tertiary">
                Aggiorna le misure per ricalcolare BMR, TDEE, macro e composizione corporea.
              </p>

              {/* Weight */}
              <div>
                <label className="font-mono-label text-text-tertiary mb-2 block">Peso</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="75.0"
                    className={INPUT_CLASS + " pr-12"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">kg</span>
                </div>
              </div>

              {/* Body measurements row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-mono-label text-text-tertiary mb-2 block">Collo</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={neckCm}
                      onChange={(e) => setNeckCm(e.target.value)}
                      placeholder="38"
                      className={INPUT_CLASS + " pr-10"}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary text-xs">cm</span>
                  </div>
                </div>
                <div>
                  <label className="font-mono-label text-text-tertiary mb-2 block">Vita</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={waistCm}
                      onChange={(e) => setWaistCm(e.target.value)}
                      placeholder="82"
                      className={INPUT_CLASS + " pr-10"}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary text-xs">cm</span>
                  </div>
                </div>
                <div>
                  <label className="font-mono-label text-text-tertiary mb-2 block">Fianchi</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={hipCm}
                      onChange={(e) => setHipCm(e.target.value)}
                      placeholder="95"
                      className={INPUT_CLASS + " pr-10"}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary text-xs">cm</span>
                  </div>
                </div>
              </div>

              {/* Activity level */}
              <div>
                <label className="font-mono-label text-text-tertiary mb-2 block">Livello di attivit&agrave;</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className={SELECT_CLASS}
                >
                  {activityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Goal */}
              <div>
                <label className="font-mono-label text-text-tertiary mb-2 block">Obiettivo</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="">Seleziona...</option>
                  {goalOptions.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Save button */}
              <button
                onClick={handleRecalculate}
                disabled={saving}
                className="w-full py-3 rounded-lg bg-[var(--color-accent-dynamic)] text-black text-sm font-mono-label hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "Ricalcolo in corso..." : saved ? "Salvato!" : "Ricalcola tutto"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
