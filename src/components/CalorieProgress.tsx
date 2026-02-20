"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { springs } from "@/lib/animation-config";

interface CalorieProgressProps {
  current: number;
  goal: number;
  burned: number;
  compact?: boolean;
}

function AnimatedNum({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, springs.number);
  const display = useTransform(spring, (v) => Math.round(v));
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      mv.set(value);
      return;
    }
    mv.set(value);
  }, [value, mv]);

  return <motion.span>{display}</motion.span>;
}

export default function CalorieProgress({ current, goal, burned, compact }: CalorieProgressProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  const isOver = current > goal;
  const remaining = Math.max(goal - current, 0);

  const size = compact ? 140 : 180;
  const strokeWidth = compact ? 10 : 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Dynamic colors based on percentage
  const progressColor = isOver ? "#EF4444" : percentage >= 80 ? "#F59E0B" : "#3B82F6";
  const progressColorEnd = isOver ? "#DC2626" : percentage >= 80 ? "#F59E0B" : "#8B5CF6";

  return (
    <div className={`glass-card ${compact ? "p-4" : "p-6"}`}>
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <defs>
              <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={progressColor} />
                <stop offset="100%" stopColor={progressColorEnd} />
              </linearGradient>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
            <motion.circle
              cx={size / 2} cy={size / 2} r={radius} fill="none"
              stroke="url(#calorieGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: offset }}
              transition={springs.smooth}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-light"><AnimatedNum value={current} /></span>
            <span className="text-xs text-[#666]">/ {goal} kcal</span>
          </div>

          {/* Pulse glow when goal reached */}
          {percentage >= 100 && (
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 0px rgba(34,197,94,0)",
                  "0 0 20px rgba(34,197,94,0.3)",
                  "0 0 0px rgba(34,197,94,0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        <div className="grid grid-cols-3 gap-6 mt-5 w-full text-center">
          <div>
            <p className="text-lg font-bold"><AnimatedNum value={current} /></p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider">Assunte</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[#F59E0B]"><AnimatedNum value={burned} /></p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider">Bruciate</p>
          </div>
          <div>
            <p className={`text-lg font-bold ${isOver ? "text-[#EF4444]" : "text-[#22C55E]"}`}>
              {isOver ? "+" : ""}<AnimatedNum value={isOver ? current - goal : remaining} />
            </p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider">
              {isOver ? "Eccesso" : "Rimaste"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
