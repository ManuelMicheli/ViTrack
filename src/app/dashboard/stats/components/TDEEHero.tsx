"use client";

import { useAnimatedNumber, motion } from "@/hooks/useAnimatedNumber";
import { springs } from "@/lib/animation-config";

interface TDEEHeroProps {
  bmr: number | null;
  tdee: number | null;
  activityLevel: string | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
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

export default function TDEEHero({ bmr, tdee, activityLevel, proteinG, carbsG, fatG }: TDEEHeroProps) {
  const animBmr = useAnimatedNumber(bmr ?? 0);
  const animTdee = useAnimatedNumber(tdee ?? 0);
  const animProtein = useAnimatedNumber(proteinG ? Math.round(proteinG) : 0);
  const animCarbs = useAnimatedNumber(carbsG ? Math.round(carbsG) : 0);
  const animFat = useAnimatedNumber(fatG ? Math.round(fatG) : 0);
  const multiplier = activityLevel ? activityMultipliers[activityLevel] ?? 1.2 : 1.2;
  const hasMacros = proteinG || carbsG || fatG;

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
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 py-4">
        {/* BMR */}
        <div className="text-center flex-1 md:max-w-[240px]">
          <p className="font-mono-label text-[var(--color-accent-dynamic)] mb-1">BMR</p>
          <p className="font-display text-3xl md:text-4xl font-bold text-text-primary">
            <motion.span>{animBmr}</motion.span>
          </p>
          <p className="font-body text-xs text-text-tertiary mt-1">kcal/giorno</p>
          <motion.p
            className="font-body text-[11px] text-text-tertiary mt-2 leading-relaxed"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Il tuo metabolismo basale: le calorie che il corpo brucia a riposo per mantenere le funzioni vitali.
          </motion.p>
        </div>

        {/* Connector + multiplier */}
        <div className="flex md:flex-col items-center gap-2 md:gap-1.5">
          <motion.div
            className="h-px w-8 md:w-px md:h-6 bg-border"
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
            className="h-px w-8 md:w-px md:h-6 bg-border"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ ...springs.smooth, delay: 0.7 }}
            style={{ originX: 0 }}
          />
        </div>

        {/* TDEE */}
        <div className="text-center flex-1 md:max-w-[240px]">
          <p className="font-mono-label text-[var(--color-accent-dynamic)] mb-1">TDEE</p>
          <p className="font-display text-3xl md:text-4xl font-bold text-[var(--color-accent-dynamic)]">
            <motion.span>{animTdee}</motion.span>
          </p>
          <p className="font-body text-xs text-text-tertiary mt-1">kcal/giorno</p>
          <motion.p
            className="font-body text-[11px] text-text-tertiary mt-2 leading-relaxed"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            Il tuo dispendio energetico totale: quante calorie consumi ogni giorno includendo la tua attivit&agrave;.
          </motion.p>
        </div>
      </div>

      {/* Macro breakdown */}
      {hasMacros && (
        <motion.div
          className="mt-2 pt-4 border-t border-border-subtle"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <p className="font-mono-label text-text-tertiary text-center mb-3">Macro giornalieri consigliati</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center rounded-lg border border-border-subtle p-3">
              <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ backgroundColor: "var(--color-protein)" }} />
              <p className="font-display text-lg font-bold text-text-primary">
                <motion.span>{animProtein}</motion.span><span className="text-xs font-normal text-text-tertiary">g</span>
              </p>
              <p className="font-mono-label text-text-tertiary">Proteine</p>
            </div>
            <div className="text-center rounded-lg border border-border-subtle p-3">
              <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ backgroundColor: "var(--color-carbs)" }} />
              <p className="font-display text-lg font-bold text-text-primary">
                <motion.span>{animCarbs}</motion.span><span className="text-xs font-normal text-text-tertiary">g</span>
              </p>
              <p className="font-mono-label text-text-tertiary">Carboidrati</p>
            </div>
            <div className="text-center rounded-lg border border-border-subtle p-3">
              <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ backgroundColor: "var(--color-fat)" }} />
              <p className="font-display text-lg font-bold text-text-primary">
                <motion.span>{animFat}</motion.span><span className="text-xs font-normal text-text-tertiary">g</span>
              </p>
              <p className="font-mono-label text-text-tertiary">Grassi</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Activity level label */}
      {activityLevel && (
        <motion.div
          className="text-center mt-3 pt-3 border-t border-border-subtle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <p className="font-mono-label text-text-tertiary">
            {activityLabels[activityLevel] || activityLevel}
          </p>
          <p className="font-body text-[11px] text-text-tertiary mt-1">
            Il TDEE si calcola moltiplicando il BMR per il fattore di attivit&agrave;. Aggiorna il tuo livello nel profilo per un calcolo pi&ugrave; preciso.
          </p>
        </motion.div>
      )}
    </div>
  );
}
