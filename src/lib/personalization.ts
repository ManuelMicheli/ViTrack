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
