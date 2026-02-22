"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import {
  type ClassificationResult,
  type SportCategory,
  type SeasonPhase,
  getGoalCategory,
} from "@/lib/goal-classifier";

// =============================================================================
// Props
// =============================================================================

interface Step5Props {
  goal: string;
  classification: ClassificationResult | null;
  sportCategory: SportCategory | null;
  onSportCategoryChange: (cat: SportCategory) => void;
  seasonPhase: SeasonPhase | null;
  onSeasonPhaseChange: (phase: SeasonPhase) => void;
  onChangeGoal: () => void;
}

// =============================================================================
// Inline SVG Icons
// =============================================================================

function StrengthIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h2l1-3h2l1 3h6l1-3h2l1 3h2M6 9V7a1 1 0 011-1h1M18 9V7a1 1 0 00-1-1h-1" />
    </svg>
  );
}

function EnduranceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function IntermittentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function TechnicalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
    </svg>
  );
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

// =============================================================================
// ExpandableCard (inline helper)
// =============================================================================

function ExpandableCard({ title, content }: { title: string; content: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="data-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3"
      >
        <span className="font-mono-label text-text-secondary text-sm">{title}</span>
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
            <p className="font-body text-sm text-text-tertiary mt-3 pt-3 border-t border-border-subtle leading-relaxed">
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
  showActions,
  onChangeGoal,
  onDismiss,
}: {
  severity: "warning" | "critical";
  message: string;
  suggestion?: string;
  showActions?: boolean;
  onChangeGoal?: () => void;
  onDismiss?: () => void;
}) {
  const borderColor =
    severity === "critical"
      ? "border-amber-500/40"
      : "border-red-500/40";
  const bgColor =
    severity === "critical"
      ? "bg-amber-500/5"
      : "bg-red-500/5";
  const iconColor =
    severity === "critical"
      ? "text-amber-400"
      : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border ${borderColor} ${bgColor} p-4`}
    >
      <div className="flex gap-3">
        <WarningIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
        <div className="space-y-2 flex-1">
          <p className="font-body text-sm text-text-primary leading-relaxed">
            {message}
          </p>
          {suggestion && (
            <p className="font-body text-sm text-text-secondary leading-relaxed">
              {suggestion}
            </p>
          )}
          {showActions && (
            <div className="flex gap-3 mt-3">
              <button
                onClick={onChangeGoal}
                className="px-4 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 font-body text-sm transition-all hover:bg-amber-500/20"
              >
                Cambia obiettivo
              </button>
              <button
                onClick={onDismiss}
                className="px-4 py-2 rounded-lg border border-border bg-surface text-text-secondary font-body text-sm transition-all hover:border-border"
              >
                Procedi comunque
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Sport category and season phase data
// =============================================================================

const sportCategories: {
  value: SportCategory;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "strength",
    label: "Forza e Potenza",
    desc: "Powerlifting, sprint, lancio, Olympic lifting",
    icon: <StrengthIcon className="w-6 h-6" />,
  },
  {
    value: "endurance",
    label: "Endurance",
    desc: "Corsa, ciclismo, nuoto, triathlon",
    icon: <EnduranceIcon className="w-6 h-6" />,
  },
  {
    value: "intermittent",
    label: "Sport Intermittenti",
    desc: "Calcio, basket, MMA, CrossFit, tennis",
    icon: <IntermittentIcon className="w-6 h-6" />,
  },
  {
    value: "technical",
    label: "Sport Tecnico-coordinativi",
    desc: "Ginnastica, arrampicata, danza, pattinaggio",
    icon: <TechnicalIcon className="w-6 h-6" />,
  },
];

const seasonPhases: {
  value: SeasonPhase;
  label: string;
  desc: string;
}[] = [
  { value: "pre_season", label: "Pre-stagione", desc: "Costruzione della base" },
  { value: "competitive", label: "Competitiva", desc: "Performance massima" },
  { value: "off_season", label: "Off-season", desc: "Recupero e rigenerazione" },
];

// =============================================================================
// Subtype display labels
// =============================================================================

function getBulkSubtypeLabel(subtype: string): string {
  switch (subtype) {
    case "lean_bulk":
      return "Lean Bulk";
    case "moderate_bulk":
      return "Bulk Moderato";
    case "aggressive_bulk":
      return "Bulk Aggressivo";
    default:
      return "Bulk";
  }
}

function getCutSubtypeLabel(subtype: string): string {
  switch (subtype) {
    case "conservative_deficit":
      return "Deficit Conservativo";
    case "moderate_deficit":
      return "Deficit Moderato";
    case "aggressive_deficit":
      return "Deficit Aggressivo";
    default:
      return "Deficit";
  }
}

function getCutAccentColor(subtype: string): string {
  switch (subtype) {
    case "conservative_deficit":
      return "border-blue-500/50";
    case "moderate_deficit":
      return "border-orange-500/50";
    case "aggressive_deficit":
      return "border-red-500/50";
    default:
      return "border-[var(--color-accent-dynamic)]";
  }
}

// =============================================================================
// BULK View
// =============================================================================

function BulkView({
  classification,
  onChangeGoal,
}: {
  classification: ClassificationResult | null;
  onChangeGoal: () => void;
}) {
  const [warningDismissed, setWarningDismissed] = useState(false);

  if (!classification) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-[var(--color-accent-dynamic)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const bulkHighBfWarning = classification.warnings.find(
    (w) => w.type === "bulk_high_bf"
  );

  return (
    <motion.div
      className="space-y-4"
      variants={staggerContainer(0.06)}
      initial="initial"
      animate="animate"
    >
      {/* Warning banner */}
      {bulkHighBfWarning && !warningDismissed && (
        <motion.div variants={staggerItem}>
          <WarningBanner
            severity="critical"
            message={bulkHighBfWarning.message}
            suggestion={bulkHighBfWarning.suggestion}
            showActions
            onChangeGoal={onChangeGoal}
            onDismiss={() => setWarningDismissed(true)}
          />
        </motion.div>
      )}

      {/* Result card */}
      <motion.div
        variants={staggerItem}
        className="rounded-lg border border-l-4 border-green-500/50 bg-surface p-4 space-y-1"
      >
        <div className="flex items-center gap-2">
          <ArrowUpIcon className="w-5 h-5 text-green-400" />
          <span className="font-display text-base font-semibold text-text-primary">
            {getBulkSubtypeLabel(classification.goal_subtype)}
          </span>
          <span className="font-mono-label text-sm text-green-400">
            +{classification.calorie_surplus_deficit} kcal/giorno
          </span>
        </div>
        <p className="font-body text-sm text-text-tertiary">
          Target: {classification.daily_calorie_target} kcal/giorno
        </p>
      </motion.div>

      {/* Monitoring mini-card */}
      <motion.div
        variants={staggerItem}
        className="rounded-lg border border-border bg-surface p-3 flex items-center gap-3"
      >
        <ScaleIcon className="w-4 h-4 text-text-tertiary flex-shrink-0" />
        <div>
          <span className="font-mono-label text-xs text-text-tertiary">Aumento target</span>
          <p className="font-body text-sm text-text-secondary">
            {classification.monitoring.weight_change_target}
          </p>
        </div>
      </motion.div>

      {/* Education */}
      <motion.div variants={staggerItem}>
        <ExpandableCard
          title="Perch\u00e9 questo tipo di bulk?"
          content={classification.education.goal_explanation}
        />
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// CUT View
// =============================================================================

function CutView({
  classification,
  onChangeGoal,
}: {
  classification: ClassificationResult | null;
  onChangeGoal: () => void;
}) {
  if (!classification) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-[var(--color-accent-dynamic)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const floorWarning = classification.warnings.find(
    (w) => w.type === "floor_applied"
  );
  const lowBfWarning = classification.warnings.find(
    (w) => w.type === "cut_low_bf"
  );

  const accentBorder = getCutAccentColor(classification.goal_subtype);

  return (
    <motion.div
      className="space-y-4"
      variants={staggerContainer(0.06)}
      initial="initial"
      animate="animate"
    >
      {/* Warnings */}
      {floorWarning && (
        <motion.div variants={staggerItem}>
          <WarningBanner
            severity="warning"
            message={floorWarning.message}
            suggestion={floorWarning.suggestion}
          />
        </motion.div>
      )}
      {lowBfWarning && (
        <motion.div variants={staggerItem}>
          <WarningBanner
            severity="critical"
            message={lowBfWarning.message}
            suggestion={lowBfWarning.suggestion}
            showActions
            onChangeGoal={onChangeGoal}
            onDismiss={() => {/* warning stays visible but no action needed */}}
          />
        </motion.div>
      )}

      {/* Result card */}
      <motion.div
        variants={staggerItem}
        className={`rounded-lg border border-l-4 ${accentBorder} bg-surface p-4 space-y-1`}
      >
        <div className="flex items-center gap-2">
          <ArrowDownIcon className="w-5 h-5 text-orange-400" />
          <span className="font-display text-base font-semibold text-text-primary">
            {getCutSubtypeLabel(classification.goal_subtype)}
          </span>
          <span className="font-mono-label text-sm text-orange-400">
            {classification.calorie_surplus_deficit} kcal/giorno
          </span>
        </div>
        <p className="font-body text-sm text-text-tertiary">
          Target: {classification.daily_calorie_target} kcal/giorno
        </p>
      </motion.div>

      {/* Monitoring mini-card */}
      <motion.div
        variants={staggerItem}
        className="rounded-lg border border-border bg-surface p-3 flex items-center gap-3"
      >
        <ScaleIcon className="w-4 h-4 text-text-tertiary flex-shrink-0" />
        <div>
          <span className="font-mono-label text-xs text-text-tertiary">Perdita target</span>
          <p className="font-body text-sm text-text-secondary">
            {classification.monitoring.weight_change_target}
          </p>
        </div>
      </motion.div>

      {/* Education */}
      <motion.div variants={staggerItem}>
        <ExpandableCard
          title="Perch\u00e9 questo deficit?"
          content={classification.education.goal_explanation}
        />
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// PERFORMANCE View
// =============================================================================

function PerformanceView({
  classification,
  sportCategory,
  onSportCategoryChange,
  seasonPhase,
  onSeasonPhaseChange,
}: {
  classification: ClassificationResult | null;
  sportCategory: SportCategory | null;
  onSportCategoryChange: (cat: SportCategory) => void;
  seasonPhase: SeasonPhase | null;
  onSeasonPhaseChange: (phase: SeasonPhase) => void;
}) {
  return (
    <motion.div
      className="space-y-5"
      variants={staggerContainer(0.06)}
      initial="initial"
      animate="animate"
    >
      {/* Sport category selection */}
      <motion.div variants={staggerItem} className="space-y-2">
        <label className="font-mono-label text-text-tertiary block text-sm">
          Categoria sportiva
        </label>
        <div className="space-y-3">
          {sportCategories.map((cat) => {
            const isSelected = sportCategory === cat.value;
            return (
              <motion.button
                key={cat.value}
                onClick={() => onSportCategoryChange(cat.value)}
                className={`w-full text-left p-4 rounded-lg border transition-all flex items-center gap-4 ${
                  isSelected
                    ? "border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/10"
                    : "border-border bg-surface hover:border-border"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={`flex-shrink-0 ${
                    isSelected ? "text-[var(--color-accent-dynamic)]" : "text-text-tertiary"
                  }`}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`font-body text-sm block ${
                      isSelected ? "text-text-primary" : "text-text-secondary"
                    }`}
                  >
                    {cat.label}
                  </span>
                  <span className="font-body text-xs text-text-tertiary block mt-0.5">
                    {cat.desc}
                  </span>
                </div>
                {isSelected && (
                  <div className="ml-auto flex-shrink-0">
                    <CheckIcon className="w-5 h-5 text-[var(--color-accent-dynamic)]" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Season phase selection (shown after sport category is selected) */}
      <AnimatePresence>
        {sportCategory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              <label className="font-mono-label text-text-tertiary block text-sm">
                Fase della stagione
              </label>
              <div className="flex flex-wrap gap-2">
                {seasonPhases.map((phase) => {
                  const isSelected = seasonPhase === phase.value;
                  return (
                    <button
                      key={phase.value}
                      onClick={() => onSeasonPhaseChange(phase.value)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        isSelected
                          ? "border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/10"
                          : "border-border bg-surface hover:border-border"
                      }`}
                    >
                      <span
                        className={`font-body text-sm block ${
                          isSelected ? "text-text-primary" : "text-text-secondary"
                        }`}
                      >
                        {phase.label}
                      </span>
                      <span className="font-body text-xs text-text-tertiary block">
                        {phase.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Education (shown after both selections and classification available) */}
      <AnimatePresence>
        {sportCategory && seasonPhase && classification && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Result summary */}
            <div className="rounded-lg border border-l-4 border-[var(--color-accent-dynamic)] bg-surface p-4 space-y-1">
              <div className="flex items-center gap-2">
                <IntermittentIcon className="w-5 h-5 text-[var(--color-accent-dynamic)]" />
                <span className="font-display text-base font-semibold text-text-primary">
                  {classification.daily_calorie_target} kcal/giorno
                </span>
              </div>
              <p className="font-body text-sm text-text-tertiary">
                P {classification.macro_protein_g}g / C {classification.macro_carbs_g}g / F {classification.macro_fat_g}g
              </p>
            </div>

            <ExpandableCard
              title="Come cambia la nutrizione per il tuo sport?"
              content={classification.education.goal_explanation}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// MAINTAIN View
// =============================================================================

function MaintainView({
  classification,
}: {
  classification: ClassificationResult | null;
}) {
  if (!classification) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-[var(--color-accent-dynamic)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      variants={staggerContainer(0.06)}
      initial="initial"
      animate="animate"
    >
      {/* Result card */}
      <motion.div
        variants={staggerItem}
        className="rounded-lg border border-l-4 border-[var(--color-accent-dynamic)] bg-surface p-4 space-y-1"
      >
        <div className="flex items-center gap-2">
          <HeartIcon className="w-5 h-5 text-[var(--color-accent-dynamic)]" />
          <span className="font-display text-base font-semibold text-text-primary">
            Mantenimento calorico
          </span>
          <span className="font-mono-label text-sm text-[var(--color-accent-dynamic)]">
            {classification.daily_calorie_target} kcal/giorno
          </span>
        </div>
      </motion.div>

      {/* Brief text */}
      <motion.div variants={staggerItem}>
        <p className="font-body text-sm text-text-secondary leading-relaxed">
          Il tuo piano \u00e8 impostato per mantenere il peso attuale con una distribuzione
          equilibrata dei macronutrienti.
        </p>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// HEALTHY View
// =============================================================================

function HealthyView({
  classification,
}: {
  classification: ClassificationResult | null;
}) {
  if (!classification) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-[var(--color-accent-dynamic)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      variants={staggerContainer(0.06)}
      initial="initial"
      animate="animate"
    >
      {/* Result card */}
      <motion.div
        variants={staggerItem}
        className="rounded-lg border border-l-4 border-emerald-500/50 bg-surface p-4 space-y-1"
      >
        <div className="flex items-center gap-2">
          <LeafIcon className="w-5 h-5 text-emerald-400" />
          <span className="font-display text-base font-semibold text-text-primary">
            Alimentazione bilanciata
          </span>
          <span className="font-mono-label text-sm text-emerald-400">
            {classification.daily_calorie_target} kcal/giorno
          </span>
        </div>
      </motion.div>

      {/* Brief text */}
      <motion.div variants={staggerItem}>
        <p className="font-body text-sm text-text-secondary leading-relaxed">
          Il focus \u00e8 sulla qualit\u00e0 nutrizionale: alimenti densi di nutrienti,
          cereali integrali, proteine magre, grassi sani.
        </p>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function Step5GoalClassification({
  goal,
  classification,
  sportCategory,
  onSportCategoryChange,
  seasonPhase,
  onSeasonPhaseChange,
  onChangeGoal,
}: Step5Props) {
  const category = getGoalCategory(goal);

  const titles: Record<string, string> = {
    bulk: "Il tuo percorso di massa",
    cut: "Il tuo percorso di definizione",
    performance: "Il tuo profilo atletico",
    maintain: "Il tuo equilibrio",
    healthy: "La tua alimentazione sana",
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          {titles[category]}
        </h2>
        <p className="font-body text-sm text-text-secondary">
          {category === "performance"
            ? "Seleziona il tuo sport e la fase della stagione per personalizzare la nutrizione."
            : "Ecco il piano personalizzato in base ai tuoi dati."}
        </p>
      </div>

      {category === "bulk" && (
        <BulkView classification={classification} onChangeGoal={onChangeGoal} />
      )}
      {category === "cut" && (
        <CutView classification={classification} onChangeGoal={onChangeGoal} />
      )}
      {category === "performance" && (
        <PerformanceView
          classification={classification}
          sportCategory={sportCategory}
          onSportCategoryChange={onSportCategoryChange}
          seasonPhase={seasonPhase}
          onSeasonPhaseChange={onSeasonPhaseChange}
        />
      )}
      {category === "maintain" && (
        <MaintainView classification={classification} />
      )}
      {category === "healthy" && (
        <HealthyView classification={classification} />
      )}
    </div>
  );
}
