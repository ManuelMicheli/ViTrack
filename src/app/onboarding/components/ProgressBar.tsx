"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono-label text-text-tertiary">
          {currentStep} / {totalSteps}
        </span>
      </div>
      <div className="w-full h-1 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[var(--color-accent-dynamic)] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
