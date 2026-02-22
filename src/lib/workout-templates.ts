export interface WorkoutTemplate {
  id: string;
  name_it: string;
  name_en: string;
  icon: string;
  workout_type: string;
  exercises: { name: string; sets: number; reps: number; weight_kg: number | null }[];
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "push",
    name_it: "Push",
    name_en: "Push",
    icon: "\uD83D\uDCAA",
    workout_type: "Palestra",
    exercises: [
      { name: "Panca piana", sets: 4, reps: 8, weight_kg: null },
      { name: "Panca inclinata manubri", sets: 3, reps: 10, weight_kg: null },
      { name: "Croci ai cavi", sets: 3, reps: 12, weight_kg: null },
      { name: "Military press", sets: 4, reps: 8, weight_kg: null },
      { name: "Alzate laterali", sets: 3, reps: 15, weight_kg: null },
      { name: "Pushdown tricipiti", sets: 3, reps: 12, weight_kg: null },
    ],
  },
  {
    id: "pull",
    name_it: "Pull",
    name_en: "Pull",
    icon: "\uD83C\uDFCB\uFE0F",
    workout_type: "Palestra",
    exercises: [
      { name: "Trazioni", sets: 4, reps: 8, weight_kg: null },
      { name: "Rematore bilanciere", sets: 4, reps: 8, weight_kg: null },
      { name: "Lat machine", sets: 3, reps: 10, weight_kg: null },
      { name: "Pulley basso", sets: 3, reps: 12, weight_kg: null },
      { name: "Curl bilanciere", sets: 3, reps: 10, weight_kg: null },
      { name: "Curl manubri alternato", sets: 3, reps: 12, weight_kg: null },
    ],
  },
  {
    id: "legs",
    name_it: "Gambe",
    name_en: "Legs",
    icon: "\uD83E\uDDB5",
    workout_type: "Palestra",
    exercises: [
      { name: "Squat", sets: 4, reps: 8, weight_kg: null },
      { name: "Leg press", sets: 4, reps: 10, weight_kg: null },
      { name: "Affondi", sets: 3, reps: 12, weight_kg: null },
      { name: "Leg extension", sets: 3, reps: 12, weight_kg: null },
      { name: "Leg curl", sets: 3, reps: 12, weight_kg: null },
      { name: "Calf raise", sets: 4, reps: 15, weight_kg: null },
    ],
  },
  {
    id: "upper",
    name_it: "Upper Body",
    name_en: "Upper Body",
    icon: "\uD83D\uDCAA",
    workout_type: "Palestra",
    exercises: [
      { name: "Panca piana", sets: 4, reps: 8, weight_kg: null },
      { name: "Rematore bilanciere", sets: 4, reps: 8, weight_kg: null },
      { name: "Military press", sets: 3, reps: 10, weight_kg: null },
      { name: "Lat machine", sets: 3, reps: 10, weight_kg: null },
      { name: "Curl bilanciere", sets: 3, reps: 10, weight_kg: null },
      { name: "Pushdown tricipiti", sets: 3, reps: 12, weight_kg: null },
    ],
  },
  {
    id: "lower",
    name_it: "Lower Body",
    name_en: "Lower Body",
    icon: "\uD83E\uDDB5",
    workout_type: "Palestra",
    exercises: [
      { name: "Squat", sets: 4, reps: 8, weight_kg: null },
      { name: "Stacco rumeno", sets: 4, reps: 8, weight_kg: null },
      { name: "Leg press", sets: 3, reps: 10, weight_kg: null },
      { name: "Hip thrust", sets: 3, reps: 10, weight_kg: null },
      { name: "Leg curl", sets: 3, reps: 12, weight_kg: null },
      { name: "Calf raise", sets: 4, reps: 15, weight_kg: null },
    ],
  },
  {
    id: "fullbody",
    name_it: "Full Body",
    name_en: "Full Body",
    icon: "\uD83D\uDD25",
    workout_type: "Palestra",
    exercises: [
      { name: "Squat", sets: 3, reps: 8, weight_kg: null },
      { name: "Panca piana", sets: 3, reps: 8, weight_kg: null },
      { name: "Rematore bilanciere", sets: 3, reps: 8, weight_kg: null },
      { name: "Military press", sets: 3, reps: 10, weight_kg: null },
      { name: "Affondi", sets: 3, reps: 12, weight_kg: null },
      { name: "Plank", sets: 3, reps: 60, weight_kg: null },
    ],
  },
  {
    id: "cardio",
    name_it: "Cardio",
    name_en: "Cardio",
    icon: "\uD83C\uDFC3",
    workout_type: "Cardio",
    exercises: [],
  },
  {
    id: "hiit",
    name_it: "HIIT",
    name_en: "HIIT",
    icon: "\u26A1",
    workout_type: "HIIT",
    exercises: [],
  },
  {
    id: "custom",
    name_it: "Personalizzato",
    name_en: "Custom",
    icon: "\u270F\uFE0F",
    workout_type: "Palestra",
    exercises: [],
  },
];
