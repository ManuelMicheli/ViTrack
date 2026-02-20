"use client";

import { motion } from "framer-motion";
import { UtensilsIcon, WaterIcon, DumbbellIcon, ScaleIcon } from "./icons";
import RippleButton from "@/components/RippleButton";
import { staggerContainer, staggerItem } from "@/lib/animation-config";

interface QuickAddBarProps {
  onAddMeal: () => void;
  onAddWater: () => void;
  onAddWorkout: () => void;
  onAddWeight: () => void;
}

export default function QuickAddBar({ onAddMeal, onAddWater, onAddWorkout, onAddWeight }: QuickAddBarProps) {
  const actions = [
    { label: "Pasto", icon: UtensilsIcon, onClick: onAddMeal, color: "from-[#3B82F6]/20 to-[#3B82F6]/5" },
    { label: "Acqua", icon: WaterIcon, onClick: onAddWater, color: "from-[#06B6D4]/20 to-[#06B6D4]/5" },
    { label: "Allenam.", icon: DumbbellIcon, onClick: onAddWorkout, color: "from-[#F59E0B]/20 to-[#F59E0B]/5" },
    { label: "Peso", icon: ScaleIcon, onClick: onAddWeight, color: "from-[#A78BFA]/20 to-[#A78BFA]/5" },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer(0.08)}
      className="grid grid-cols-4 gap-2"
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <motion.div key={action.label} variants={staggerItem}>
            <RippleButton
              onClick={action.onClick}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-gradient-to-b ${action.color} border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200`}
            >
              <motion.span
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Icon className="w-5 h-5" />
              </motion.span>
              <span className="text-xs text-[#A1A1A1]">{action.label}</span>
            </RippleButton>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
