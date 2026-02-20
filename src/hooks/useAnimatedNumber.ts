"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion";
import { springs } from "@/lib/animation-config";

export function useAnimatedNumber(value: number) {
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, springs.number);
  const rounded = useTransform(springValue, (v) => Math.round(v));
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      motionValue.set(value);
      return;
    }
    motionValue.set(value);
  }, [value, motionValue]);

  return rounded;
}

export { motion };
