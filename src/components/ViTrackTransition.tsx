"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function ViTrackTransition() {
  const pathname = usePathname();
  const [transitioning, setTransitioning] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setTransitioning(true);
  }

  if (!transitioning) return null;

  return (
    <AnimatePresence>
      {transitioning && (
        <motion.div
          key="vitrack-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onAnimationComplete={(definition) => {
            if ((definition as { opacity?: number }).opacity === 1) {
              setTimeout(() => setTransitioning(false), 550);
            }
          }}
        >
          <VTLogo />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Path lengths (geometric calculation):
// V: two diagonals ~37.7 each = ~76
// T crossbar: 40
// T stem: 32
const V_LEN = 80;
const T_BAR_LEN = 45;
const T_STEM_LEN = 35;

const strokeProps = {
  stroke: "#ffffff",
  strokeWidth: 4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};

export function VTLogo() {
  return (
    <motion.svg
      width="96"
      height="48"
      viewBox="0 0 96 48"
      fill="none"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.05, opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* V */}
      <motion.path
        d="M 4 8 L 24 40 L 44 8"
        {...strokeProps}
        initial={{ strokeDasharray: V_LEN, strokeDashoffset: V_LEN }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
      {/* T crossbar */}
      <motion.path
        d="M 52 8 L 92 8"
        {...strokeProps}
        initial={{ strokeDasharray: T_BAR_LEN, strokeDashoffset: T_BAR_LEN }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 0.2, ease: "easeOut", delay: 0.15 }}
      />
      {/* T stem */}
      <motion.path
        d="M 72 8 L 72 40"
        {...strokeProps}
        initial={{ strokeDasharray: T_STEM_LEN, strokeDashoffset: T_STEM_LEN }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 0.2, ease: "easeOut", delay: 0.25 }}
      />
    </motion.svg>
  );
}
