export const springs = {
  tap: { type: "spring" as const, stiffness: 400, damping: 25 },
  enter: { type: "spring" as const, stiffness: 200, damping: 20 },
  number: { type: "spring" as const, stiffness: 100, damping: 30 },
  bounce: { type: "spring" as const, stiffness: 300, damping: 15 },
  smooth: { type: "spring" as const, stiffness: 150, damping: 25 },
};

export const fadeSlideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

export const staggerContainer = (staggerDelay = 0.05) => ({
  animate: { transition: { staggerChildren: staggerDelay } },
});

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};
