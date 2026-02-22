"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animation-config";

interface LifestyleProfileProps {
  goal: string | null;
  activityLevel: string | null;
  weeklyFrequency: string | null;
  sleepHours: string | null;
  stressLevel: string | null;
}

const activityLabels: Record<string, string> = {
  sedentary: "Sedentario",
  light: "Leggermente attivo",
  moderate: "Moderatamente attivo",
  active: "Molto attivo",
  very_active: "Atleta",
};

export default function LifestyleProfile({ goal, activityLevel, weeklyFrequency, sleepHours, stressLevel }: LifestyleProfileProps) {
  const badges = [
    { label: "Obiettivo", value: goal },
    { label: "Attivit\u00e0", value: activityLevel ? activityLabels[activityLevel] || activityLevel : null },
    { label: "Frequenza", value: weeklyFrequency },
    { label: "Sonno", value: sleepHours },
    { label: "Stress", value: stressLevel },
  ].filter((b) => b.value);

  const showAlert = (sleepHours && sleepHours === "Meno di 6h") || (stressLevel && stressLevel === "Alto");

  return (
    <div className="space-y-3">
      <p className="font-mono-label text-text-tertiary">Profilo stile di vita</p>
      <div className="data-card space-y-4">
        <motion.div
          className="flex flex-wrap gap-2"
          variants={staggerContainer(0.05)}
          initial="initial"
          animate="animate"
        >
          {badges.map((badge) => (
            <motion.div
              key={badge.label}
              variants={staggerItem}
              whileHover={{ scale: 1.05 }}
              className="px-3 py-1.5 rounded-full border border-border bg-surface"
            >
              <span className="font-body text-xs text-text-tertiary">{badge.label}: </span>
              <span className="font-body text-xs text-text-primary">{badge.value}</span>
            </motion.div>
          ))}
        </motion.div>

        {showAlert && (
          <div className="rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/5 p-3">
            <div className="flex gap-2">
              <svg className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="font-body text-xs text-[#F59E0B]/90">
                Il sonno e lo stress influenzano il recupero muscolare e il metabolismo. Considera di ottimizzarli per raggiungere prima il tuo obiettivo.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
