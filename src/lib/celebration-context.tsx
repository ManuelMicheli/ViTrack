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
