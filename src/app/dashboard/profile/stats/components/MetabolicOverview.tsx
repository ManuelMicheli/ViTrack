"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animation-config";

interface MetabolicOverviewProps {
  bmr: number | null;
  tdee: number | null;
  activityLevel: string | null;
}

const activityLabels: Record<string, string> = {
  sedentary: "Sedentario",
  light: "Leggermente attivo",
  moderate: "Moderatamente attivo",
  active: "Molto attivo",
  very_active: "Atleta",
};

export default function MetabolicOverview({
  bmr,
  tdee,
  activityLevel,
}: MetabolicOverviewProps) {
  const metrics = [
    {
      label: "Metabolismo basale",
      value: bmr ? `${Math.round(bmr)}` : "--",
      unit: "kcal/giorno",
    },
    {
      label: "Dispendio totale giornaliero",
      value: tdee ? `${Math.round(tdee)}` : "--",
      unit: "kcal/giorno",
    },
    {
      label: "Livello attività",
      value: activityLevel ? activityLabels[activityLevel] || activityLevel : "--",
      unit: "",
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-3 gap-3"
      variants={staggerContainer(0.06)}
      initial="initial"
      animate="animate"
    >
      {metrics.map((metric) => (
        <motion.div key={metric.label} variants={staggerItem} className="data-card text-center">
          <p className="font-display text-xl font-bold text-text-primary">
            {metric.value}
          </p>
          {metric.unit && (
            <p className="font-body text-xs text-text-tertiary mt-0.5">{metric.unit}</p>
          )}
          <p className="font-mono-label text-text-tertiary mt-2">{metric.label}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
