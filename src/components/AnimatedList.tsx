"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animation-config";

interface AnimatedListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export default function AnimatedList({ children, className, staggerDelay = 0.05 }: AnimatedListProps) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={staggerContainer(staggerDelay)}
    >
      <AnimatePresence mode="popLayout">
        {children.map((child, i) => {
          const key = React.isValidElement(child) ? (child.key ?? i) : i;
          return (
            <motion.div
              key={key}
              variants={staggerItem}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              layout
            >
              {child}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
