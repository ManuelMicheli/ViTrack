"use client";

import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { springs } from "@/lib/animation-config";

interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function RippleButton({ children, onClick, className = "", disabled = false }: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);

    onClick?.();
  }, [onClick]);

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className={`relative overflow-hidden ${className}`}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      transition={springs.tap}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/20 pointer-events-none"
          style={{ left: ripple.x, top: ripple.y, width: 0, height: 0, transform: "translate(-50%, -50%)" }}
          animate={{ width: 200, height: 200, opacity: [0.4, 0] }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </motion.button>
  );
}
