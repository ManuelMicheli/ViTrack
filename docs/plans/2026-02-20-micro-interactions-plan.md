# Micro-Interazioni, Animazioni e Personalizzazione — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add framer-motion animations, micro-interactions, personalization (greetings, celebrations), and visual preferences (accent color, layout mode, section reorder) to every ViTrack dashboard component.

**Architecture:** Install framer-motion + canvas-confetti. Create shared animation hooks/components (`useAnimatedNumber`, `PageTransition`, `AnimatedList`, `RippleButton`, `Celebration`). Add personalization helpers. Update each existing component in-place. Add preference controls to Settings page.

**Tech Stack:** framer-motion ^11, canvas-confetti ^1.9, React 19, Next.js 16, Tailwind v4

---

### Task 1: Install dependencies and create animation config

**Files:**
- Modify: `package.json`
- Create: `src/lib/animation-config.ts`

**Step 1: Install framer-motion and canvas-confetti**

Run: `npm install framer-motion canvas-confetti && npm install -D @types/canvas-confetti`

**Step 2: Create animation config with spring presets**

Create `src/lib/animation-config.ts`:

```ts
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
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/animation-config.ts
git commit -m "feat: install framer-motion + canvas-confetti, add animation config"
```

---

### Task 2: Create useAnimatedNumber hook

**Files:**
- Create: `src/hooks/useAnimatedNumber.ts`

**Step 1: Create the hook**

Create `src/hooks/useAnimatedNumber.ts`:

```ts
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
```

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/hooks/useAnimatedNumber.ts
git commit -m "feat: add useAnimatedNumber hook with spring physics"
```

---

### Task 3: Create PageTransition component and wire into layout

**Files:**
- Create: `src/components/PageTransition.tsx`
- Modify: `src/app/dashboard/layout.tsx`

**Step 1: Create PageTransition**

Create `src/components/PageTransition.tsx`:

```tsx
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
```

**Step 2: Wire into dashboard layout**

In `src/app/dashboard/layout.tsx`:
- Import `PageTransition`
- Wrap `{children}` inside `<main>` with `<PageTransition>{children}</PageTransition>`

The layout `<main>` block changes from:
```tsx
<main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
  {children}
</main>
```
to:
```tsx
<main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
  <PageTransition>{children}</PageTransition>
</main>
```

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/components/PageTransition.tsx src/app/dashboard/layout.tsx
git commit -m "feat: add page transition animations to dashboard layout"
```

---

### Task 4: Create AnimatedList component

**Files:**
- Create: `src/components/AnimatedList.tsx`

**Step 1: Create AnimatedList**

Create `src/components/AnimatedList.tsx`:

```tsx
"use client";

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
        {children.map((child, i) => (
          <motion.div
            key={(child as React.ReactElement)?.key ?? i}
            variants={staggerItem}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            layout
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/AnimatedList.tsx
git commit -m "feat: add AnimatedList component with staggered entrance and exit"
```

---

### Task 5: Create RippleButton component

**Files:**
- Create: `src/components/RippleButton.tsx`

**Step 1: Create RippleButton**

Create `src/components/RippleButton.tsx`:

```tsx
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
```

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/RippleButton.tsx
git commit -m "feat: add RippleButton component with ripple effect and spring tap"
```

---

### Task 6: Create personalization helpers

**Files:**
- Create: `src/lib/personalization.ts`

**Step 1: Create personalization helpers**

Create `src/lib/personalization.ts`:

```ts
interface MotivationData {
  calories: number;
  calorieGoal: number;
  streak: number;
  workoutsToday: number;
  mealsToday: number;
}

export function getGreeting(firstName: string | null): string {
  const name = firstName || "Utente";
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return `Buongiorno, ${name}`;
  if (hour >= 12 && hour < 18) return `Buon pomeriggio, ${name}`;
  if (hour >= 18 && hour < 22) return `Buonasera, ${name}`;
  return `Buonanotte, ${name}`;
}

export function getMotivation(data: MotivationData): string {
  const { calories, calorieGoal, streak, workoutsToday, mealsToday } = data;

  if (calories >= calorieGoal && calorieGoal > 0) {
    return "Obiettivo raggiunto! Ottimo lavoro";
  }
  if (streak >= 3) {
    return `Sei in streak da ${streak} giorni, continua cosi!`;
  }
  if (calories > 0 && calorieGoal > 0) {
    const remaining = calorieGoal - calories;
    return `Ancora ${remaining}kcal per completare la giornata`;
  }
  if (workoutsToday > 0) {
    return "Allenamento completato, bravo!";
  }
  if (mealsToday === 0) {
    return "Inizia registrando il tuo primo pasto";
  }
  return "Continua a tracciare la tua giornata";
}
```

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/lib/personalization.ts
git commit -m "feat: add personalization helpers (greeting, motivation)"
```

---

### Task 7: Create Celebration context and component

**Files:**
- Create: `src/lib/celebration-context.tsx`
- Create: `src/components/Celebration.tsx`

**Step 1: Create celebration context**

Create `src/lib/celebration-context.tsx`:

```tsx
"use client";

import { createContext, useContext, useCallback } from "react";

type CelebrationType = "calorie_goal" | "streak_milestone" | "workout_done" | "first_meal";

interface CelebrationContextType {
  celebrate: (type: CelebrationType) => void;
}

const CelebrationContext = createContext<CelebrationContextType>({
  celebrate: () => {},
});

export function useCelebration() {
  return useContext(CelebrationContext);
}

export function CelebrationProvider({
  children,
  onCelebrate,
}: {
  children: React.ReactNode;
  onCelebrate: (type: CelebrationType) => void;
}) {
  const celebrate = useCallback(
    (type: CelebrationType) => {
      // Prevent duplicate calorie_goal celebrations per session
      if (type === "calorie_goal") {
        const key = `vitrack_celebrated_${type}_${new Date().toISOString().split("T")[0]}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      }
      onCelebrate(type);
    },
    [onCelebrate]
  );

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
    </CelebrationContext.Provider>
  );
}
```

**Step 2: Create Celebration component**

Create `src/components/Celebration.tsx`:

```tsx
"use client";

import { useCallback, useState } from "react";
import { CelebrationProvider } from "@/lib/celebration-context";

type CelebrationType = "calorie_goal" | "streak_milestone" | "workout_done" | "first_meal";

export default function Celebration({ children }: { children: React.ReactNode }) {
  const [, setTrigger] = useState(0);

  const handleCelebrate = useCallback(async (type: CelebrationType) => {
    const confetti = (await import("canvas-confetti")).default;

    switch (type) {
      case "calorie_goal":
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#3B82F6", "#8B5CF6", "#22C55E"],
        });
        break;
      case "streak_milestone":
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.6 },
          colors: ["#F59E0B", "#FCD34D", "#FBBF24"],
        });
        break;
      case "workout_done":
        confetti({
          particleCount: 20,
          spread: 40,
          origin: { y: 0.8 },
          colors: ["#3B82F6", "#60A5FA", "#93C5FD"],
        });
        break;
      case "first_meal":
        // No confetti, just trigger a re-render for any visual effect
        setTrigger((t) => t + 1);
        break;
    }
  }, []);

  return (
    <CelebrationProvider onCelebrate={handleCelebrate}>
      {children}
    </CelebrationProvider>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/lib/celebration-context.tsx src/components/Celebration.tsx
git commit -m "feat: add celebration system with confetti effects"
```

---

### Task 8: Create preferences context

**Files:**
- Create: `src/lib/preferences-context.tsx`

**Step 1: Create preferences context**

Create `src/lib/preferences-context.tsx`:

```tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type AccentColor = "blue" | "violet" | "cyan" | "green" | "orange" | "pink";
export type LayoutMode = "compact" | "expanded";

const ACCENT_COLORS: Record<AccentColor, string> = {
  blue: "#3B82F6",
  violet: "#8B5CF6",
  cyan: "#06B6D4",
  green: "#22C55E",
  orange: "#F59E0B",
  pink: "#EC4899",
};

const DEFAULT_SECTION_ORDER = [
  "greeting",
  "quickadd",
  "calories",
  "water-streak",
  "weight",
  "meals",
  "workouts",
];

interface PreferencesContextType {
  accentColor: AccentColor;
  accentHex: string;
  setAccentColor: (color: AccentColor) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  sectionOrder: string[];
  setSectionOrder: (order: string[]) => void;
}

const PreferencesContext = createContext<PreferencesContextType>({
  accentColor: "blue",
  accentHex: "#3B82F6",
  setAccentColor: () => {},
  layoutMode: "expanded",
  setLayoutMode: () => {},
  sectionOrder: DEFAULT_SECTION_ORDER,
  setSectionOrder: () => {},
});

export function usePreferences() {
  return useContext(PreferencesContext);
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>("blue");
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>("expanded");
  const [sectionOrder, setSectionOrderState] = useState<string[]>(DEFAULT_SECTION_ORDER);

  // Load from localStorage on mount
  useEffect(() => {
    const savedAccent = localStorage.getItem("vitrack_accent_color") as AccentColor | null;
    if (savedAccent && ACCENT_COLORS[savedAccent]) setAccentColorState(savedAccent);

    const savedLayout = localStorage.getItem("vitrack_layout_mode") as LayoutMode | null;
    if (savedLayout === "compact" || savedLayout === "expanded") setLayoutModeState(savedLayout);

    const savedOrder = localStorage.getItem("vitrack_dashboard_order");
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        if (Array.isArray(parsed)) setSectionOrderState(parsed);
      } catch { /* ignore */ }
    }
  }, []);

  // Apply accent color as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty("--color-accent-dynamic", ACCENT_COLORS[accentColor]);
  }, [accentColor]);

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem("vitrack_accent_color", color);
  }, []);

  const setLayoutMode = useCallback((mode: LayoutMode) => {
    setLayoutModeState(mode);
    localStorage.setItem("vitrack_layout_mode", mode);
  }, []);

  const setSectionOrder = useCallback((order: string[]) => {
    setSectionOrderState(order);
    localStorage.setItem("vitrack_dashboard_order", JSON.stringify(order));
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        accentColor,
        accentHex: ACCENT_COLORS[accentColor],
        setAccentColor,
        layoutMode,
        setLayoutMode,
        sectionOrder,
        setSectionOrder,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export { ACCENT_COLORS, DEFAULT_SECTION_ORDER };
```

**Step 2: Wire PreferencesProvider into dashboard layout**

In `src/app/dashboard/layout.tsx`, import and wrap:

```tsx
import { PreferencesProvider } from "@/lib/preferences-context";
```

Wrap the entire return inside `<PreferencesProvider>`:

```tsx
return (
  <PreferencesProvider>
    <ChatProvider>
      ...existing layout...
    </ChatProvider>
  </PreferencesProvider>
);
```

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/lib/preferences-context.tsx src/app/dashboard/layout.tsx
git commit -m "feat: add preferences context (accent color, layout mode, section order)"
```

---

### Task 9: Wire Celebration into layout and update CalorieProgress

**Files:**
- Modify: `src/app/dashboard/layout.tsx` — wrap with `<Celebration>`
- Modify: `src/components/CalorieProgress.tsx` — spring SVG, animated number, dynamic color

**Step 1: Wrap layout with Celebration**

In `src/app/dashboard/layout.tsx`, add Celebration wrapper inside PreferencesProvider:

```tsx
import Celebration from "@/components/Celebration";

// In the return:
<PreferencesProvider>
  <Celebration>
    <ChatProvider>
      ...
    </ChatProvider>
  </Celebration>
</PreferencesProvider>
```

**Step 2: Update CalorieProgress**

Rewrite `src/components/CalorieProgress.tsx` to use:
- `motion.circle` for animated stroke-dashoffset with spring transition
- `useAnimatedNumber` for the central number and the 3 stat numbers
- Dynamic color based on percentage (green < 80%, yellow 80-100%, red > 100%)
- Pulse glow animation when goal is reached

Key changes:
- Import `motion` from framer-motion, `useAnimatedNumber` from hooks
- Replace the static `<circle>` with `<motion.circle>` using `animate={{ strokeDashoffset: offset }}` and `transition={springs.smooth}`
- Replace `<span className="text-3xl...">{current}</span>` with `<motion.span>` using the animated number hook
- Add a `motion.div` pulse glow ring that appears when `percentage >= 100`

The color logic:
```ts
const progressColor = percentage >= 100 ? "#EF4444" : percentage >= 80 ? "#F59E0B" : "#3B82F6";
const progressColorEnd = percentage >= 100 ? "#DC2626" : percentage >= 80 ? "#F59E0B" : "#8B5CF6";
```

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/app/dashboard/layout.tsx src/components/CalorieProgress.tsx
git commit -m "feat: animate CalorieProgress with spring SVG and dynamic colors"
```

---

### Task 10: Update DailySummary with animated numbers and spring progress

**Files:**
- Modify: `src/components/DailySummary.tsx`

**Step 1: Update DailySummary**

Changes to `src/components/DailySummary.tsx`:
- Import `motion` from framer-motion, `useAnimatedNumber` from hooks, `staggerContainer`/`staggerItem` from animation-config
- Wrap the grid with `motion.div` using `staggerContainer(0.08)` variants
- Each macro card becomes a `motion.div` with `staggerItem` variants
- Replace the static `{value}` text with a component that uses `useAnimatedNumber(value)` and renders `<motion.span>`
- Replace the CSS `transition-all duration-700` on progress bar with `motion.div` using `animate={{ width: pct + "%" }}` and `transition={springs.smooth}`

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/DailySummary.tsx
git commit -m "feat: animate DailySummary with spring progress bars and number counters"
```

---

### Task 11: Update MealList with staggered entrance, swipe-to-delete, exit animation

**Files:**
- Modify: `src/components/MealList.tsx`

**Step 1: Update MealList**

Changes to `src/components/MealList.tsx`:
- Import `motion`, `AnimatePresence` from framer-motion, `staggerContainer`, `staggerItem` from animation-config
- Wrap the meal items container (`<div className="space-y-2">`) with `motion.div` using stagger variants, initial="initial" animate="animate"
- Each meal item `<div key={meal.id}>` becomes `<motion.div>` with:
  - `variants={staggerItem}` for entrance
  - `exit={{ opacity: 0, x: -100 }}` for exit animation
  - `layout` for smooth reflow when items are removed
  - `drag="x"` with `dragConstraints={{ left: -100, right: 0 }}` for swipe
  - `onDragEnd` handler: if drag offset < -80px, trigger delete
- Wrap all meal items with `<AnimatePresence mode="popLayout">`
- The transition uses `springs.enter`

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/MealList.tsx
git commit -m "feat: animate MealList with staggered entrance and swipe-to-delete"
```

---

### Task 12: Update WorkoutList with same animation pattern

**Files:**
- Modify: `src/components/WorkoutList.tsx`

**Step 1: Update WorkoutList**

Apply identical animation pattern as MealList (Task 11):
- Import motion, AnimatePresence, stagger variants
- Wrap items with stagger container
- Each workout item becomes motion.div with entrance, exit, drag, layout
- Swipe-to-delete with same threshold

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/WorkoutList.tsx
git commit -m "feat: animate WorkoutList with staggered entrance and swipe-to-delete"
```

---

### Task 13: Update QuickAddBar with RippleButton

**Files:**
- Modify: `src/components/QuickAddBar.tsx`

**Step 1: Update QuickAddBar**

Changes to `src/components/QuickAddBar.tsx`:
- Import `RippleButton` from `@/components/RippleButton`
- Import `motion` from framer-motion, `staggerContainer`, `staggerItem` from animation-config
- Wrap the grid with `motion.div` using stagger variants
- Replace each `<button>` with `<RippleButton onClick={action.onClick} className={...existing classes minus hover:scale/active:scale (RippleButton handles those)...}>`
- Wrap icons with `motion.span` that has `whileHover={{ y: -2 }}` with `springs.bounce`

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/QuickAddBar.tsx
git commit -m "feat: add ripple effect and spring animations to QuickAddBar"
```

---

### Task 14: Update ChatPanel with spring slide-in and message animations

**Files:**
- Modify: `src/components/ChatPanel.tsx`

**Step 1: Update ChatPanel**

Changes to `src/components/ChatPanel.tsx`:
- Import `motion`, `AnimatePresence` from framer-motion, `springs` from animation-config
- Replace the panel's CSS `transition-transform duration-300` with framer-motion:
  - Wrap the entire panel + backdrop in `<AnimatePresence>`
  - The backdrop becomes `<motion.div>` with `initial={{ opacity: 0 }}` `animate={{ opacity: 1 }}` `exit={{ opacity: 0 }}`
  - The panel becomes `<motion.div>` with `initial={{ x: "100%" }}` `animate={{ x: 0 }}` `exit={{ x: "100%" }}` and `transition={springs.enter}`
  - Remove `if (!isChatOpen) return null;` — let AnimatePresence handle mount/unmount
- Each message in the messages list becomes `<motion.div>` with fade-in + slide-up via `initial={{ opacity: 0, y: 10 }}` `animate={{ opacity: 1, y: 0 }}`
- Typing indicator: replace the 3 bounce dots with a wave animation using `motion.span` with staggered `animate={{ y: [0, -4, 0] }}` and `transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}`
- Quick command buttons: wrap with `motion.button` using `whileTap={{ scale: 0.95 }}` with `springs.tap`

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/ChatPanel.tsx
git commit -m "feat: animate ChatPanel with spring slide-in and message animations"
```

---

### Task 15: Update BottomNav with animated active indicator

**Files:**
- Modify: `src/components/BottomNav.tsx`

**Step 1: Update BottomNav**

Changes to `src/components/BottomNav.tsx`:
- Import `motion` from framer-motion, `springs` from animation-config
- Replace the static active indicator dot with `<motion.div layoutId="bottomnav-indicator">` — this makes the dot smoothly animate between nav items using framer-motion's layout animation
- The FAB chat button becomes `<motion.button>` with `whileTap={{ scale: 0.9 }}` and `whileHover={{ scale: 1.05 }}` using `springs.tap`
- Each nav icon gets `<motion.div whileTap={{ scale: 0.85 }}>` for a subtle press feedback

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat: animate BottomNav with layout-animated active indicator"
```

---

### Task 16: Update Sidebar with animated active indicator

**Files:**
- Modify: `src/components/Sidebar.tsx`

**Step 1: Update Sidebar**

Changes to `src/components/Sidebar.tsx`:
- Import `motion` from framer-motion, `springs` from animation-config
- Replace the static active indicator dot (the `<div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />`) with `<motion.div layoutId="sidebar-indicator" ...>` for smooth animation between active items
- Add `whileTap={{ scale: 0.98 }}` to nav links
- The chat button gets `whileTap={{ scale: 0.98 }}`

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: animate Sidebar with layout-animated active indicator"
```

---

### Task 17: Update WaterTracker with spring animations

**Files:**
- Modify: `src/components/WaterTracker.tsx`

**Step 1: Update WaterTracker**

Changes to `src/components/WaterTracker.tsx`:
- Import `motion` from framer-motion, `useAnimatedNumber` from hooks, `springs` from animation-config
- Replace the SVG circle CSS `transition-all duration-700` with `motion.circle` using `animate={{ strokeDashoffset: offset }}` with `springs.smooth`
- Replace the percentage number with animated number using `useAnimatedNumber(Math.round(percentage))`
- The glass buttons: each `<button>` for toggling becomes `<motion.button>` with `whileTap={{ scale: 0.9 }}` using `springs.tap`
- The quick add buttons (+1, -1, +150, etc.): wrap with `motion.button` with `whileTap={{ scale: 0.95 }}`
- When the celebration pulse fires (`celebrated` state), replace the `animate-ping` with a `motion.div` that has `animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0] }}` for a smoother pulse

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/WaterTracker.tsx
git commit -m "feat: animate WaterTracker with spring SVG and animated numbers"
```

---

### Task 18: Update WeightChart with entry animations

**Files:**
- Modify: `src/components/WeightChart.tsx`

**Step 1: Update WeightChart**

Changes to `src/components/WeightChart.tsx`:
- Import `motion` from framer-motion, `useAnimatedNumber` from hooks, `staggerContainer`, `staggerItem`, `springs` from animation-config
- Wrap the stats row grid with `motion.div` stagger container; each stat cell becomes `motion.div` with stagger item
- The stat numbers (min, max, avg, weekly trend) use `useAnimatedNumber` for count-up
- The goal progress bar: replace CSS `transition-all duration-700` with `motion.div` using `animate={{ width: goalProgress + "%" }}` and `springs.smooth`
- The weight input section: add `AnimatePresence` so the input appears with slide-down and disappears with slide-up
- The period selector buttons: `motion.button` with `whileTap={{ scale: 0.95 }}`
- Wrap the chart in a `motion.div` with `initial={{ opacity: 0 }}` `animate={{ opacity: 1 }}` for a smooth entrance

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/WeightChart.tsx
git commit -m "feat: animate WeightChart with entry animations and animated numbers"
```

---

### Task 19: Update Dashboard page with personalization and staggered layout

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Add greeting and motivation**

Changes to `src/app/dashboard/page.tsx`:
- Import `motion` from framer-motion, `staggerContainer`, `staggerItem` from animation-config
- Import `getGreeting`, `getMotivation` from `@/lib/personalization`
- Import `useCelebration` from `@/lib/celebration-context`
- Import `usePreferences` from `@/lib/preferences-context`

Replace the header `<h2>Dashboard</h2>` with:
```tsx
<div>
  <h2 className="text-xl font-bold">{getGreeting(user?.first_name ?? null)}</h2>
  {summary && (
    <p className="text-sm text-[#A1A1A1] mt-0.5">
      {getMotivation({
        calories: summary.totals.calories,
        calorieGoal: summary.calorie_goal,
        streak: 0, // streak data not available here yet
        workoutsToday: summary.totals.workouts_count,
        mealsToday: summary.totals.meals_count,
      })}
    </p>
  )}
</div>
```

**Step 2: Wrap the main content with staggered animation**

Replace the outer `<div className="px-4 ... animate-fade-in">` with:
```tsx
<motion.div
  className="px-4 md:px-8 py-6 space-y-4"
  initial="initial"
  animate="animate"
  variants={staggerContainer(0.08)}
>
```

Wrap each major section (header, QuickAddBar, calories grid, water-streak grid, weight chart, meals, workouts) with `<motion.div variants={staggerItem}>`.

**Step 3: Add celebration triggers**

After the summary loads, check conditions and fire celebrations:
```tsx
useEffect(() => {
  if (!summary) return;
  const { celebrate } = celebrationContext;
  if (summary.totals.calories >= summary.calorie_goal && summary.calorie_goal > 0) {
    celebrate("calorie_goal");
  }
}, [summary]);
```

**Step 4: Remove the old `animate-fade-in` class** from the outer div (framer-motion handles it now).

**Step 5: Verify build**

Run: `npm run build`

**Step 6: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add personalized greeting, motivation, staggered dashboard layout"
```

---

### Task 20: Update ConfirmModal and AddMealModal with framer-motion

**Files:**
- Modify: `src/components/ConfirmModal.tsx`
- Modify: `src/components/AddMealModal.tsx`

**Step 1: Update ConfirmModal**

Changes to `src/components/ConfirmModal.tsx`:
- Import `motion`, `AnimatePresence` from framer-motion, `springs` from animation-config
- Wrap the entire component in `<AnimatePresence>` based on `isOpen`
- The backdrop becomes `<motion.div>` with fade in/out
- The modal card becomes `<motion.div>` with `initial={{ opacity: 0, scale: 0.95, y: 10 }}` `animate={{ opacity: 1, scale: 1, y: 0 }}` `exit={{ opacity: 0, scale: 0.95 }}` using `springs.enter`
- Remove the CSS `animate-scale-in` class

**Step 2: Update AddMealModal**

Changes to `src/components/AddMealModal.tsx`:
- Import `motion`, `AnimatePresence` from framer-motion, `springs` from animation-config
- Same AnimatePresence pattern as ConfirmModal
- The modal slides up with `initial={{ opacity: 0, y: 50 }}` `animate={{ opacity: 1, y: 0 }}` `exit={{ opacity: 0, y: 50 }}`
- Meal type tabs: `motion.button` with `whileTap={{ scale: 0.95 }}`
- Result appearance: wrap the result section in AnimatePresence with fade-in
- Remove CSS `animate-slide-up` and `animate-fade-in` classes

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/components/ConfirmModal.tsx src/components/AddMealModal.tsx
git commit -m "feat: animate modals with framer-motion entrance/exit"
```

---

### Task 21: Update StreakCalendar with staggered grid

**Files:**
- Modify: `src/components/StreakCalendar.tsx`

**Step 1: Update StreakCalendar**

Changes to `src/components/StreakCalendar.tsx`:
- Import `motion` from framer-motion, `staggerContainer`, `staggerItem` from animation-config
- Wrap the grid of day cells with `motion.div` stagger container (staggerDelay 0.02 — fast for 30 items)
- Each day cell becomes `<motion.div variants={staggerItem}>` for staggered entrance
- The streak count number: wrap with animated number effect
- Active day cells get a subtle `whileHover={{ scale: 1.2 }}` with `springs.tap`

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/StreakCalendar.tsx
git commit -m "feat: animate StreakCalendar with staggered grid entrance"
```

---

### Task 22: Add personalization settings to Settings page

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

**Step 1: Add accent color picker and layout mode toggle**

Changes to `src/app/dashboard/settings/page.tsx`:
- Import `usePreferences`, `ACCENT_COLORS`, `AccentColor` from `@/lib/preferences-context`
- Import `motion` from framer-motion
- After the "Obiettivi" section, add a new "Personalizzazione" section:

```tsx
{/* Personalizzazione section */}
<div>
  <h3 className="text-xs text-[#666] uppercase tracking-wider font-medium mb-3">Personalizzazione</h3>
  <div className="glass-card divide-y divide-white/[0.06]">
    {/* Accent color */}
    <div className="p-4">
      <span className="text-sm text-[#A1A1A1] block mb-3">Colore accento</span>
      <div className="flex gap-3">
        {(Object.entries(ACCENT_COLORS) as [AccentColor, string][]).map(([key, hex]) => (
          <motion.button
            key={key}
            onClick={() => setAccentColor(key)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              accentColor === key ? "border-white scale-110" : "border-transparent"
            }`}
            style={{ backgroundColor: hex }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>
    </div>

    {/* Layout mode */}
    <div className="p-4 flex justify-between items-center">
      <div>
        <span className="text-sm text-[#A1A1A1]">Layout</span>
        <p className="text-[10px] text-[#666] mt-0.5">Compatto o espanso</p>
      </div>
      <div className="flex bg-white/[0.04] rounded-lg p-0.5">
        <button
          onClick={() => setLayoutMode("compact")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            layoutMode === "compact" ? "bg-white/[0.1] text-white" : "text-[#666] hover:text-[#999]"
          }`}
        >
          Compatto
        </button>
        <button
          onClick={() => setLayoutMode("expanded")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            layoutMode === "expanded" ? "bg-white/[0.1] text-white" : "text-[#666] hover:text-[#999]"
          }`}
        >
          Espanso
        </button>
      </div>
    </div>
  </div>
</div>
```

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/app/dashboard/settings/page.tsx
git commit -m "feat: add accent color and layout mode preferences to settings"
```

---

### Task 23: Add dashboard section reorder to Settings page

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

**Step 1: Add section reorder UI**

In the "Personalizzazione" section of settings, after the layout mode toggle, add:

```tsx
{/* Section order */}
<div className="p-4">
  <span className="text-sm text-[#A1A1A1] block mb-3">Ordine sezioni dashboard</span>
  <Reorder.Group
    axis="y"
    values={sectionOrder}
    onReorder={setSectionOrder}
    className="space-y-1.5"
  >
    {sectionOrder.map((section) => (
      <Reorder.Item
        key={section}
        value={section}
        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-grab active:cursor-grabbing"
      >
        <span className="text-[#666]">⠿</span>
        <span className="text-sm">{sectionLabels[section]}</span>
      </Reorder.Item>
    ))}
  </Reorder.Group>
</div>
```

Add `Reorder` import from framer-motion and the label map:
```ts
import { Reorder } from "framer-motion";

const sectionLabels: Record<string, string> = {
  greeting: "Saluto",
  quickadd: "Azioni rapide",
  calories: "Calorie e Macro",
  "water-streak": "Acqua e Streak",
  weight: "Peso",
  meals: "Pasti",
  workouts: "Allenamenti",
};
```

**Step 2: Update Dashboard page to use section order**

In `src/app/dashboard/page.tsx`, use `usePreferences().sectionOrder` to dynamically render sections in the stored order. Create a `sections` map of section key → JSX, then render `sectionOrder.map(key => sections[key])`.

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/app/dashboard/settings/page.tsx src/app/dashboard/page.tsx
git commit -m "feat: add drag-and-drop dashboard section reorder"
```

---

### Task 24: Update other dashboard pages with PageTransition animations

**Files:**
- Modify: `src/app/dashboard/meals/page.tsx`
- Modify: `src/app/dashboard/workouts/page.tsx`
- Modify: `src/app/dashboard/stats/page.tsx`
- Modify: `src/app/dashboard/profile/page.tsx`

**Step 1: Add motion stagger to each page**

For each page:
- Import `motion` from framer-motion, `staggerContainer`, `staggerItem` from animation-config
- Wrap the outer container with `motion.div` using stagger container variants
- Wrap each major section with `motion.div variants={staggerItem}`
- Remove any existing `animate-fade-in` classes (PageTransition handles page entry)

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/app/dashboard/meals/page.tsx src/app/dashboard/workouts/page.tsx src/app/dashboard/stats/page.tsx src/app/dashboard/profile/page.tsx
git commit -m "feat: add staggered entry animations to all dashboard pages"
```

---

### Task 25: Apply compact layout mode

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/CalorieProgress.tsx`
- Modify: `src/components/DailySummary.tsx`

**Step 1: Apply compact mode conditionally**

In `src/app/dashboard/page.tsx`:
```tsx
const { layoutMode } = usePreferences();
const isCompact = layoutMode === "compact";
```

Then apply conditional classes:
- Outer container: `space-y-4` → `space-y-${isCompact ? 2 : 4}`
- Padding: `py-6` → `py-${isCompact ? 3 : 6}`

In CalorieProgress, reduce the SVG `size` from 180 to 140 when compact.

In DailySummary, reduce card padding from `p-3` to `p-2` when compact.

Pass `compact={isCompact}` as a prop to these components.

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx src/components/CalorieProgress.tsx src/components/DailySummary.tsx
git commit -m "feat: apply compact layout mode to dashboard components"
```

---

### Task 26: Final cleanup and loading state enhancements

**Files:**
- Modify: `src/app/globals.css` — add CSS variable for dynamic accent color
- Modify: `src/app/dashboard/layout.tsx` — improve loading state

**Step 1: Add dynamic accent CSS variable**

In `src/app/globals.css`, in the `@theme inline` block, add:
```css
--color-accent-dynamic: #3B82F6;
```

**Step 2: Improve loading state in layout**

Replace the plain "Caricamento..." text in the layout loading state with an animated skeleton:
```tsx
if (!authChecked) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-[#A1A1A1]"
      >
        Caricamento...
      </motion.div>
    </div>
  );
}
```

(Import `motion` at the top of the layout file.)

**Step 3: Verify full build**

Run: `npm run build`
Expected: Build succeeds with zero errors

**Step 4: Commit**

```bash
git add src/app/globals.css src/app/dashboard/layout.tsx
git commit -m "feat: add dynamic accent CSS variable and animated loading state"
```

---

### Task 27: Final verification

**Step 1: Full build check**

Run: `npm run build`
Expected: Build succeeds with zero errors

**Step 2: Lint check**

Run: `npm run lint`
Expected: No new lint errors

**Step 3: Dev server smoke test**

Run: `npm run dev`
Navigate to http://localhost:3000 and verify:
- [ ] Page transitions work when navigating between pages
- [ ] Dashboard shows personalized greeting
- [ ] Numbers animate (count up) when data loads
- [ ] CalorieProgress circle animates with spring
- [ ] Macro progress bars animate with spring
- [ ] MealList items enter with stagger
- [ ] QuickAddBar buttons have ripple effect
- [ ] ChatPanel slides in with spring overshoot
- [ ] BottomNav active indicator animates between tabs
- [ ] Settings page shows accent color picker and layout mode
- [ ] Section reorder works via drag

**Step 4: Final commit if any fixes needed**
