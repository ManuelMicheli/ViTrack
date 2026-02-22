"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@/lib/types";

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-lg bg-transparent border border-border text-text-primary placeholder-text-tertiary text-sm font-body focus:outline-none focus:border-[var(--color-accent-dynamic)] transition-all";

interface EditStatsFormProps {
  user: User;
  onSaved: (updatedUser: User) => void;
}

const activityOptions = [
  { value: "sedentary", label: "Sedentario", desc: "Lavoro da scrivania, poco movimento" },
  { value: "light", label: "Leggermente attivo", desc: "Esercizio leggero 1-3 giorni/sett" },
  { value: "moderate", label: "Moderatamente attivo", desc: "Esercizio moderato 3-5 giorni/sett" },
  { value: "active", label: "Molto attivo", desc: "Esercizio intenso 6-7 giorni/sett" },
  { value: "very_active", label: "Atleta", desc: "Allenamento intenso 2x/giorno" },
];

const goalOptions = [
  "Aumentare massa muscolare",
  "Perdere grasso corporeo",
  "Mantenere il peso",
  "Migliorare la performance atletica",
  "Mangiare più sano",
];

export default function EditStatsForm({ user, onSaved }: EditStatsFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [weightKg, setWeightKg] = useState(user.weight_kg?.toString() ?? "");
  const [neckCm, setNeckCm] = useState(user.neck_cm?.toString() ?? "");
  const [waistCm, setWaistCm] = useState(user.waist_cm?.toString() ?? "");
  const [hipCm, setHipCm] = useState(user.hip_cm?.toString() ?? "");
  const [activityLevel, setActivityLevel] = useState(user.activity_level || "sedentary");
  const [goal, setGoal] = useState(user.goal || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        user_id: user.id,
      };

      const wk = parseFloat(weightKg);
      if (!isNaN(wk) && wk !== user.weight_kg) payload.weight_kg = wk;

      const nc = parseFloat(neckCm);
      if (!isNaN(nc)) payload.neck_cm = nc;
      else if (neckCm === "" && user.neck_cm) payload.neck_cm = null;

      const wc = parseFloat(waistCm);
      if (!isNaN(wc)) payload.waist_cm = wc;
      else if (waistCm === "" && user.waist_cm) payload.waist_cm = null;

      const hc = parseFloat(hipCm);
      if (!isNaN(hc)) payload.hip_cm = hc;
      else if (hipCm === "" && user.hip_cm) payload.hip_cm = null;

      if (activityLevel !== user.activity_level) payload.activity_level = activityLevel;
      if (goal !== user.goal) payload.goal = goal;

      const res = await fetch("/api/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        onSaved(updated);
        setIsOpen(false);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full data-card flex items-center justify-between hover:border-[var(--color-accent-dynamic)]/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
          <span className="font-mono-label text-text-tertiary">Modifica dati</span>
        </div>
        <svg
          className={`w-4 h-4 text-text-tertiary transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="data-card space-y-5 mt-1">
              {/* Weight */}
              <div>
                <label className="font-mono-label text-text-tertiary mb-2 block">
                  Peso attuale
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="75.0"
                    className={INPUT_CLASS + " pr-12"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">
                    kg
                  </span>
                </div>
              </div>

              {/* Neck */}
              <div>
                <label className="font-mono-label text-text-tertiary mb-2 block">
                  Circonferenza collo
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={neckCm}
                    onChange={(e) => setNeckCm(e.target.value)}
                    placeholder="38"
                    className={INPUT_CLASS + " pr-12"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">
                    cm
                  </span>
                </div>
              </div>

              {/* Waist */}
              <div>
                <label className="font-mono-label text-text-tertiary mb-2 block">
                  Circonferenza vita
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={waistCm}
                    onChange={(e) => setWaistCm(e.target.value)}
                    placeholder="82"
                    className={INPUT_CLASS + " pr-12"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">
                    cm
                  </span>
                </div>
              </div>

              {/* Hip */}
              <div>
                <label className="font-mono-label text-text-tertiary mb-2 block">
                  Circonferenza fianchi
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={hipCm}
                    onChange={(e) => setHipCm(e.target.value)}
                    placeholder="95"
                    className={INPUT_CLASS + " pr-12"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">
                    cm
                  </span>
                </div>
              </div>

              {/* Activity level */}
              <div>
                <label className="font-mono-label text-text-tertiary mb-2 block">
                  Livello di attività
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {activityOptions.map((opt) => {
                    const isSelected = activityLevel === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setActivityLevel(opt.value as User["activity_level"])}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? "border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/10"
                            : "border-border bg-surface"
                        }`}
                      >
                        <span
                          className={`font-body text-sm ${
                            isSelected ? "text-text-primary" : "text-text-secondary"
                          }`}
                        >
                          {opt.label}
                        </span>
                        <p className="font-body text-xs text-text-tertiary mt-0.5">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className="font-mono-label text-text-tertiary mb-2 block">
                  Obiettivo
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {goalOptions.map((opt) => {
                    const isSelected = goal === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setGoal(opt)}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? "border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/10"
                            : "border-border bg-surface"
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
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-lg bg-[var(--color-accent-dynamic)] text-black text-sm font-mono-label hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Ricalcolo...
                  </>
                ) : (
                  "Salva e ricalcola"
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
