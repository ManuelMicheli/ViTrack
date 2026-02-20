"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { fadeSlideUp } from "@/lib/animation-config";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={fadeSlideUp.initial}
      animate={fadeSlideUp.animate}
      transition={fadeSlideUp.transition}
    >
      {children}
    </motion.div>
  );
}
