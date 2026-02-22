"use client";

import { useAnimatedNumber, motion } from "@/hooks/useAnimatedNumber";
import { springs } from "@/lib/animation-config";

interface TDEEHeroProps {
  bmr: number | null;
  tdee: number | null;
  activityLevel: string | null;
}

const activityMultipliers: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const activityLabels: Record<string, string> = {
  sedentary: "Sedentario",
  light: "Leggermente attivo",
  moderate: "Moderatamente attivo",
  active: "Molto attivo",
  very_active: "Atleta",
};

export default function TDEEHero({ bmr, tdee, activityLevel }: TDEEHeroProps) {
  const animBmr = useAnimatedNumber(bmr ?? 0);
  const animTdee = useAnimatedNumber(tdee ?? 0);
  const multiplier = activityLevel ? activityMultipliers[activityLevel] ?? 1.2 : 1.2;

  if (!bmr && !tdee) {
    return (
      <div className="data-card text-center py-8">
        <p className="font-body text-sm text-text-tertiary">
          Completa il profilo per calcolare BMR e TDEE
        </p>
      </div>
    );
  }

  return (
    <div className="data-card overflow-hidden">
      {/* Desktop: horizontal flow, Mobile: vertical stack */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 py-2">
        {/* BMR */}
        <div className="text-center">
          <p className="font-mono-label text-text-tertiary mb-1">BMR</p>
          <p className="font-display text-3xl md:text-4xl font-bold text-text-primary">
            <motion.span>{animBmr}</motion.span>
          </p>
          <p className="font-body text-xs text-text-tertiary">kcal/giorno</p>
        </div>

        {/* Connector + multiplier */}
        <div className="flex items-center gap-2 md:gap-3">
          <motion.div
            className="h-px md:w-12 w-8 bg-border"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ ...springs.smooth, delay: 0.3 }}
            style={{ originX: 0 }}
          />
          <motion.div
            className="px-3 py-1 rounded-full border border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/10"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springs.smooth, delay: 0.5 }}
          >
            <span className="font-mono-label text-[var(--color-accent-dynamic)]">
              x{multiplier}
            </span>
          </motion.div>
          <motion.div
            className="h-px md:w-12 w-8 bg-border"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ ...springs.smooth, delay: 0.7 }}
            style={{ originX: 0 }}
          />
        </div>

        {/* TDEE */}
        <div className="text-center">
          <p className="font-mono-label text-text-tertiary mb-1">TDEE</p>
          <p className="font-display text-3xl md:text-4xl font-bold text-[var(--color-accent-dynamic)]">
            <motion.span>{animTdee}</motion.span>
          </p>
          <p className="font-body text-xs text-text-tertiary">kcal/giorno</p>
        </div>
      </div>

      {/* Activity level label */}
      {activityLevel && (
        <motion.p
          className="text-center font-body text-xs text-text-tertiary mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {activityLabels[activityLevel] || activityLevel}
        </motion.p>
      )}
    </div>
  );
}
