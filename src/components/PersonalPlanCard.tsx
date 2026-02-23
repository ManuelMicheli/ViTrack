"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { User } from "@/lib/types";

const subtypeLabels: Record<string, string> = {
  lean_bulk: "Lean Bulk",
  moderate_bulk: "Bulk Moderato",
  aggressive_bulk: "Bulk Aggressivo",
  conservative_deficit: "Deficit Conservativo",
  moderate_deficit: "Deficit Moderato",
  aggressive_deficit: "Deficit Aggressivo",
  performance_strength: "Performance — Forza",
  performance_endurance: "Performance — Endurance",
  performance_intermittent: "Performance — Sport Intermittenti",
  performance_technical: "Performance — Tecnico",
  maintain: "Mantenimento",
  healthy: "Alimentazione Sana",
};

interface PersonalPlanCardProps {
  user: User;
}

export default function PersonalPlanCard({ user }: PersonalPlanCardProps) {
  // Auto-hide after 14 days from account creation
  const createdAt = new Date(user.created_at);
  const now = new Date();
  const daysSinceCreation = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreation > 14) return null;

  // Need goal_subtype to show anything meaningful
  if (!user.goal_subtype) return null;

  const label = subtypeLabels[user.goal_subtype] ?? user.goal_subtype;
  const delta = user.calorie_surplus_deficit;
  const deltaStr =
    delta != null
      ? delta > 0
        ? `+${delta} kcal/giorno`
        : delta < 0
          ? `${delta} kcal/giorno`
          : "mantenimento"
      : null;

  const calories = user.daily_calorie_target;
  const protein = user.macro_protein_g;
  const carbs = user.macro_carbs_g;
  const fat = user.macro_fat_g;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="data-card border-l-2 p-4"
      style={{ borderLeftColor: "var(--color-accent-dynamic)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm font-bold text-text-primary tracking-wide uppercase">
          Il tuo piano personalizzato
        </h3>
        <Link
          href="/dashboard/stats"
          className="font-mono-label text-xs text-[var(--color-accent-dynamic)] hover:opacity-80 transition-opacity"
        >
          Dettagli &rarr;
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Goal subtype + delta */}
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-text-primary truncate">
            {label}
            {deltaStr && (
              <span className="text-text-tertiary ml-1.5">· {deltaStr}</span>
            )}
          </p>
        </div>

        {/* Calorie target */}
        {calories != null && (
          <div className="text-center sm:text-right shrink-0">
            <span className="font-display text-lg font-bold text-text-primary">
              {Math.round(calories)}
            </span>
            <span className="font-mono-label text-xs text-text-tertiary ml-1">
              kcal
            </span>
          </div>
        )}
      </div>

      {/* Macro row */}
      {protein != null && carbs != null && fat != null && (
        <div className="flex items-center gap-3 sm:gap-4 mt-3 pt-3 border-t border-white/5 flex-wrap">
          <MacroDot
            color="var(--color-protein)"
            label="Proteine"
            grams={Math.round(protein)}
          />
          <MacroDot
            color="var(--color-carbs)"
            label="Carboidrati"
            grams={Math.round(carbs)}
          />
          <MacroDot
            color="var(--color-fat)"
            label="Grassi"
            grams={Math.round(fat)}
          />
        </div>
      )}
    </motion.div>
  );
}

function MacroDot({
  color,
  label,
  grams,
}: {
  color: string;
  label: string;
  grams: number;
}) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="font-mono-label text-[10px] sm:text-xs text-text-secondary truncate">
        {label}
      </span>
      <span className="font-mono-label text-xs font-semibold text-text-primary">
        {grams}g
      </span>
    </div>
  );
}
