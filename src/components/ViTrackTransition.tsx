"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/lib/preferences-context";

export default function ViTrackTransition() {
  const pathname = usePathname();
  const [transitioning, setTransitioning] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const { accentHex } = usePreferences();

  // Detect pathname change during render (React-approved pattern)
  // First render: pathname === prevPathname, no transition fires
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
          transition={{ duration: 0.15 }}
          onAnimationComplete={(definition) => {
            if ((definition as { opacity?: number }).opacity === 1) {
              setTimeout(() => setTransitioning(false), 650);
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.15 }}
          >
            <VTLogo accentColor={accentHex} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VTLogo({ accentColor }: { accentColor: string }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const [phase, setPhase] = useState<"draw" | "glow" | "exit">("draw");

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  useEffect(() => {
    const glowTimer = setTimeout(() => setPhase("glow"), 300);
    const exitTimer = setTimeout(() => setPhase("exit"), 500);
    return () => {
      clearTimeout(glowTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <motion.svg
      width="120"
      height="60"
      viewBox="0 0 120 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={
        phase === "exit"
          ? { scale: 1.05, opacity: 0 }
          : { scale: 1, opacity: 1 }
      }
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={
        phase === "glow"
          ? { filter: `drop-shadow(0 0 20px ${accentColor}) drop-shadow(0 0 40px ${accentColor}40)` }
          : phase === "exit"
            ? { filter: `drop-shadow(0 0 12px ${accentColor}80)` }
            : {}
      }
    >
      {/* VT monogram path */}
      <motion.path
        ref={pathRef}
        d="M 8 12 L 30 48 L 52 12 M 58 12 L 58 48 M 46 12 L 70 12 M 80 12 L 80 48 M 80 12 Q 80 12 92 12 Q 104 12 104 24 Q 104 36 92 36 L 80 36"
        stroke={phase === "glow" || phase === "exit" ? accentColor : "#ffffff"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={pathLength ? { strokeDasharray: pathLength, strokeDashoffset: pathLength } : {}}
        animate={pathLength ? { strokeDashoffset: 0 } : {}}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </motion.svg>
  );
}
