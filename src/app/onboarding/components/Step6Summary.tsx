"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import type { ClassificationResult } from "@/lib/goal-classifier";

// =============================================================================
// Props
// =============================================================================

interface Step6Props {
  classification: ClassificationResult;
  tdee: number;
  weight_kg: number;
  bmr: number;
}

// =============================================================================
// Subtype labels mapping
// =============================================================================

const subtypeLabels: Record<string, string> = {
  lean_bulk: "Lean Bulk",
  moderate_bulk: "Bulk Moderato",
  aggressive_bulk: "Bulk Aggressivo",
  conservative_deficit: "Deficit Conservativo",
  moderate_deficit: "Deficit Moderato",
  aggressive_deficit: "Deficit Aggressivo",
  performance_strength: "Performance — Forza",
  performance_endurance: "Performance — Endurance",
  performance_intermittent: "Performance — Sport Misti",
  performance_technical: "Performance — Sport Tecnici",
  maintain: "Mantenimento",
  healthy: "Alimentazione Sana",
};

// =============================================================================
// Inline SVG Icons
// =============================================================================

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"
      />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function InfoWarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  );
}

// =============================================================================
// ExpandableCard (inline helper)
// =============================================================================

function ExpandableCard({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="data-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3"
      >
        <span className="font-mono-label text-text-secondary text-sm">
          {title}
        </span>
        <motion.div
          className="flex-shrink-0"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="w-4 h-4 text-text-tertiary" />
        </motion.div>
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
            <p className="font-body text-sm text-text-tertiary mt-3 pt-3 border-t border-border-subtle leading-relaxed whitespace-pre-line">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Warning Banner
// =============================================================================

function WarningBanner({
  severity,
  message,
  suggestion,
}: {
  severity: "info" | "warning" | "critical";
  message: string;
  suggestion?: string;
}) {
  const styles = {
    critical: {
      border: "border-red-500/40",
      bg: "bg-red-500/5",
      icon: "text-red-400",
    },
    warning: {
      border: "border-amber-500/40",
      bg: "bg-amber-500/5",
      icon: "text-amber-400",
    },
    info: {
      border: "border-blue-500/40",
      bg: "bg-blue-500/5",
      icon: "text-blue-400",
    },
  };

  const s = styles[severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border ${s.border} ${s.bg} p-4`}
    >
      <div className="flex gap-3">
        <WarningIcon
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${s.icon}`}
        />
        <div className="space-y-1 flex-1">
          <p className="font-body text-sm text-text-primary leading-relaxed">
            {message}
          </p>
          {suggestion && (
            <p className="font-body text-sm text-text-secondary leading-relaxed">
              {suggestion}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Surplus/deficit display helper
// =============================================================================

function formatSurplusDeficit(value: number): string {
  if (value === 0) return "Mantenimento";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value} kcal/giorno`;
}

// =============================================================================
// Main Component
// =============================================================================

export default function Step6Summary({
  classification,
  tdee,
}: Step6Props) {
  const surplusDeficit = classification.calorie_surplus_deficit;

  const macroExplanation = [
    classification.education.protein_explanation,
    classification.education.carbs_explanation,
    classification.education.fat_explanation,
  ].join("\n\n");

  const monitoringDetails = [
    classification.monitoring.adjustment_rule,
    `Frequenza: ${classification.monitoring.check_frequency}`,
  ].join("\n\n");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Il tuo piano personalizzato
        </h2>
        <p className="font-body text-sm text-text-secondary">
          Ecco il piano calcolato in base al tuo profilo e obiettivo.
        </p>
      </div>

      <motion.div
        className="space-y-4"
        variants={staggerContainer(0.06)}
        initial="initial"
        animate="animate"
      >
        {/* Warnings section */}
        {classification.warnings.length > 0 &&
          classification.warnings.map((warning, i) => (
            <motion.div key={i} variants={staggerItem}>
              <WarningBanner
                severity={warning.severity}
                message={warning.message}
                suggestion={warning.suggestion}
              />
            </motion.div>
          ))}

        {/* Objective card */}
        <motion.div
          variants={staggerItem}
          className="rounded-lg border border-l-4 border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/5 p-4 space-y-2"
        >
          <span className="font-display text-base font-semibold text-text-primary">
            {subtypeLabels[classification.goal_subtype] ??
              classification.goal_subtype}
          </span>
          <div className="flex items-center gap-3">
            <span className="font-mono-label text-sm text-[var(--color-accent-dynamic)]">
              {formatSurplusDeficit(surplusDeficit)}
            </span>
          </div>
          <p className="font-body text-sm text-text-tertiary">
            Obiettivo peso: {classification.monitoring.weight_change_target}
          </p>
        </motion.div>

        {/* Calories card */}
        <motion.div variants={staggerItem} className="space-y-3">
          <div className="data-card space-y-2">
            <div className="flex items-baseline gap-2">
              <motion.span
                className="font-display text-3xl font-bold text-text-primary"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {classification.daily_calorie_target}
              </motion.span>
              <span className="font-mono-label text-sm text-text-tertiary">
                kcal/giorno
              </span>
            </div>
            <p className="font-body text-sm text-text-tertiary">
              TDEE {Math.round(tdee)}{" "}
              {surplusDeficit > 0 ? "+" : ""}
              {surplusDeficit !== 0 ? `${surplusDeficit} kcal` : ""}
            </p>
          </div>
          <ExpandableCard
            title="Perch\u00e9 questo valore?"
            content={classification.education.calorie_explanation}
          />
        </motion.div>

        {/* Macros card */}
        <motion.div variants={staggerItem} className="space-y-3">
          <div className="data-card">
            <div className="space-y-3">
              {/* Protein row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: "var(--color-protein)" }}
                  />
                  <span className="font-body text-sm text-text-primary">
                    Proteine
                  </span>
                </div>
                <span className="font-mono-label text-text-secondary">
                  {Math.round(classification.macro_protein_g)}g (
                  {classification.protein_per_kg} g/kg)
                </span>
              </div>
              {/* Carbs row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: "var(--color-carbs)" }}
                  />
                  <span className="font-body text-sm text-text-primary">
                    Carboidrati
                  </span>
                </div>
                <span className="font-mono-label text-text-secondary">
                  {Math.round(classification.macro_carbs_g)}g (
                  {classification.carbs_per_kg} g/kg)
                </span>
              </div>
              {/* Fat row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: "var(--color-fat)" }}
                  />
                  <span className="font-body text-sm text-text-primary">
                    Grassi
                  </span>
                </div>
                <span className="font-mono-label text-text-secondary">
                  {Math.round(classification.macro_fat_g)}g (
                  {classification.fat_per_kg} g/kg)
                </span>
              </div>
            </div>
          </div>
          <ExpandableCard
            title="Perch\u00e9 questi rapporti?"
            content={macroExplanation}
          />
        </motion.div>

        {/* Monitoring card */}
        <motion.div variants={staggerItem} className="space-y-3">
          <div className="data-card">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ScaleIcon className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                <span className="font-body text-sm text-text-primary">
                  Pesati ogni mattina a digiuno
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ChartIcon className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                <span className="font-body text-sm text-text-primary">
                  Confronta la media settimanale
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TargetIcon className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                <span className="font-body text-sm text-text-primary">
                  Obiettivo: {classification.monitoring.weight_change_target}
                </span>
              </div>
            </div>
          </div>
          <ExpandableCard
            title="Piano completo monitoraggio"
            content={monitoringDetails}
          />
        </motion.div>

        {/* Disclaimer note */}
        <motion.div variants={staggerItem}>
          <div className="p-4 rounded-lg bg-surface border border-border-subtle">
            <div className="flex gap-2">
              <InfoWarningIcon className="w-4 h-4 text-text-tertiary flex-shrink-0 mt-0.5" />
              <p className="font-body text-xs text-text-tertiary leading-relaxed">
                Questi numeri sono stime iniziali basate sui tuoi dati. Vanno
                aggiustati dopo 2-3 settimane di monitoraggio del peso reale. I
                risultati variano in base a genetica, aderenza al piano e altri
                fattori individuali.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
