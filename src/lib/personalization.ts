import { getTranslation } from "./translations";
import type { Language } from "./translations";

interface MotivationData {
  calories: number;
  calorieGoal: number;
  streak: number;
  workoutsToday: number;
  mealsToday: number;
}

export function getGreeting(firstName: string | null, lang: Language = "it"): string {
  const name = firstName || getTranslation("common.user", lang);
  const hour = new Date().getHours();

  const key =
    hour >= 5 && hour < 12
      ? "greeting.morning"
      : hour >= 12 && hour < 18
      ? "greeting.afternoon"
      : hour >= 18 && hour < 22
      ? "greeting.evening"
      : "greeting.night";

  return `${getTranslation(key, lang)}, ${name}`;
}

export function getMotivation(data: MotivationData, lang: Language = "it"): string {
  const { calories, calorieGoal, streak, workoutsToday, mealsToday } = data;

  if (calories >= calorieGoal && calorieGoal > 0) {
    return getTranslation("motivation.goalReached", lang);
  }
  if (streak >= 3) {
    return getTranslation("motivation.streak", lang).replace("{count}", String(streak));
  }
  if (calories > 0 && calorieGoal > 0) {
    const remaining = calorieGoal - calories;
    return getTranslation("motivation.remaining", lang).replace("{count}", String(remaining));
  }
  if (workoutsToday > 0) {
    return getTranslation("motivation.workoutDone", lang);
  }
  if (mealsToday === 0) {
    return getTranslation("motivation.firstMeal", lang);
  }
  return getTranslation("motivation.keepTracking", lang);
}
