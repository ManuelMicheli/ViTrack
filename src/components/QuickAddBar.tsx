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

const actionKeys: { labelKey: TranslationKey; icon: typeof UtensilsIcon; actionProp: keyof QuickAddBarProps; color: string }[] = [
  { labelKey: "quickAdd.meal", icon: UtensilsIcon, actionProp: "onAddMeal", color: "from-[#3B82F6]/20 to-[#3B82F6]/5" },
  { labelKey: "quickAdd.water", icon: WaterIcon, actionProp: "onAddWater", color: "from-[#06B6D4]/20 to-[#06B6D4]/5" },
  { labelKey: "quickAdd.workout", icon: DumbbellIcon, actionProp: "onAddWorkout", color: "from-[#F59E0B]/20 to-[#F59E0B]/5" },
  { labelKey: "quickAdd.weight", icon: ScaleIcon, actionProp: "onAddWeight", color: "from-[#A78BFA]/20 to-[#A78BFA]/5" },
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
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-gradient-to-b ${action.color} border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200`}
            >
              <motion.span
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Icon className="w-5 h-5" />
              </motion.span>
              <span className="text-xs text-[#A1A1A1]">{label}</span>
            </RippleButton>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
