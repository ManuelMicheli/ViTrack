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
          colors: ["#E8E4DE", "#3B82F6", "#22C55E"],
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
