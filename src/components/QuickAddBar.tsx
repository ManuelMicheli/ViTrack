"use client";

import { motion } from "framer-motion";
import { UtensilsIcon, WaterIcon, DumbbellIcon, ScaleIcon } from "./icons";
import RippleButton from "@/components/RippleButton";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/translations";

interface QuickAddBarProps {
  onAddMeal: () => void;
  onAddWater: () => void;
  onAddWorkout: () => void;
  onAddWeight: () => void;
}

const actionKeys: { labelKey: TranslationKey; icon: typeof UtensilsIcon; actionProp: keyof QuickAddBarProps }[] = [
  { labelKey: "quickAdd.meal", icon: UtensilsIcon, actionProp: "onAddMeal" },
  { labelKey: "quickAdd.water", icon: WaterIcon, actionProp: "onAddWater" },
  { labelKey: "quickAdd.workout", icon: DumbbellIcon, actionProp: "onAddWorkout" },
  { labelKey: "quickAdd.weight", icon: ScaleIcon, actionProp: "onAddWeight" },
];

export default function QuickAddBar({ onAddMeal, onAddWater, onAddWorkout, onAddWeight }: QuickAddBarProps) {
  const { t } = useLanguage();

  const handlers: Record<string, () => void> = {
    onAddMeal,
    onAddWater,
    onAddWorkout,
    onAddWeight,
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer(0.08)}
      className="grid grid-cols-4 gap-2"
    >
      {actionKeys.map((action) => {
        const Icon = action.icon;
        const label = t(action.labelKey);
        return (
          <motion.div key={action.labelKey} variants={staggerItem}>
            <RippleButton
              onClick={handlers[action.actionProp]}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border border-border hover:border-border hover:bg-surface-raised transition-all duration-200"
            >
              <motion.span
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Icon className="w-5 h-5 text-text-tertiary" />
              </motion.span>
              <span className="font-mono-label text-text-tertiary">{label}</span>
            </RippleButton>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
