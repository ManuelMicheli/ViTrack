// ---------------------------------------------------------------------------
// Local regex parser for gym exercises — zero AI, <1ms per parse
// ---------------------------------------------------------------------------

export interface ParsedExercise {
  name: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
}

// Alias dictionary — normalizes common Italian gym exercise names
const EXERCISE_ALIASES: Record<string, string> = {
  // Chest
  "panca": "Panca piana",
  "panca piana": "Panca piana",
  "panca inclinata": "Panca inclinata",
  "panca declinata": "Panca declinata",
  "panca manubri": "Panca manubri",
  "chest press": "Chest press",
  "croci": "Croci",
  "croci manubri": "Croci manubri",
  "croci cavi": "Croci ai cavi",
  "pectoral machine": "Pectoral machine",

  // Back
  "lat machine": "Lat machine",
  "lat": "Lat machine",
  "trazioni": "Trazioni",
  "pull up": "Trazioni",
  "pullup": "Trazioni",
  "pull-up": "Trazioni",
  "rematore": "Rematore",
  "rematore bilanciere": "Rematore bilanciere",
  "rematore manubrio": "Rematore manubrio",
  "pulley": "Pulley",
  "pulley basso": "Pulley basso",
  "t-bar": "T-bar row",
  "t bar": "T-bar row",
  "stacco": "Stacco da terra",
  "stacco da terra": "Stacco da terra",
  "stacco rumeno": "Stacco rumeno",
  "deadlift": "Stacco da terra",
  "hyperextension": "Hyperextension",

  // Shoulders
  "military": "Military press",
  "military press": "Military press",
  "lento avanti": "Military press",
  "lento dietro": "Lento dietro",
  "alzate laterali": "Alzate laterali",
  "laterali": "Alzate laterali",
  "alzate frontali": "Alzate frontali",
  "alzate posteriori": "Alzate posteriori",
  "shoulder press": "Shoulder press",
  "arnold": "Arnold press",
  "arnold press": "Arnold press",
  "tirate al mento": "Tirate al mento",
  "facepull": "Face pull",
  "face pull": "Face pull",

  // Biceps
  "curl": "Curl bicipiti",
  "curl bicipiti": "Curl bicipiti",
  "curl bilanciere": "Curl bilanciere",
  "curl manubri": "Curl manubri",
  "curl martello": "Curl a martello",
  "hammer curl": "Curl a martello",
  "curl concentrato": "Curl concentrato",
  "curl panca scott": "Curl panca Scott",
  "scott": "Curl panca Scott",
  "curl cavi": "Curl ai cavi",

  // Triceps
  "french press": "French press",
  "french": "French press",
  "pushdown": "Pushdown tricipiti",
  "push down": "Pushdown tricipiti",
  "pushdown tricipiti": "Pushdown tricipiti",
  "dip": "Dip",
  "dips": "Dip",
  "kick back": "Kick back",
  "kickback": "Kick back",
  "estensioni tricipiti": "Estensioni tricipiti",
  "skull crusher": "Skull crusher",

  // Legs
  "squat": "Squat",
  "front squat": "Front squat",
  "goblet squat": "Goblet squat",
  "pressa": "Leg press",
  "leg press": "Leg press",
  "leg extension": "Leg extension",
  "extension": "Leg extension",
  "leg curl": "Leg curl",
  "affondi": "Affondi",
  "affondi manubri": "Affondi con manubri",
  "bulgarian split squat": "Bulgarian split squat",
  "hip thrust": "Hip thrust",
  "calf raise": "Calf raise",
  "calf": "Calf raise",
  "polpacci": "Calf raise",
  "hack squat": "Hack squat",
  "sumo squat": "Sumo squat",
  "stacco sumo": "Stacco sumo",

  // Core
  "crunch": "Crunch",
  "sit up": "Sit up",
  "plank": "Plank",
  "russian twist": "Russian twist",
  "addominali": "Crunch",
  "ab wheel": "Ab wheel",
  "leg raise": "Leg raise",
  "hanging leg raise": "Hanging leg raise",

  // Cardio / Other
  "burpee": "Burpee",
  "burpees": "Burpee",
  "box jump": "Box jump",
  "rowing": "Rowing",
  "vogatore": "Rowing",
};

/**
 * Parse a single exercise line from text. Returns parsed exercise or error.
 * Typical input: "panca piana 4x8 80kg"
 */
export function parseExerciseLocal(text: string): ParsedExercise | { error: string } {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) {
    return { error: "Non sembra un esercizio. Invia qualcosa come: panca piana 4x8 80kg" };
  }

  let remaining = trimmed;

  // 1. Extract sets x reps pattern: "4x8", "4 x 8", "4X8"
  let sets: number | null = null;
  let reps: number | null = null;
  const setsRepsMatch = remaining.match(/(\d+)\s*[xX×]\s*(\d+)/);
  if (setsRepsMatch) {
    sets = parseInt(setsRepsMatch[1]);
    reps = parseInt(setsRepsMatch[2]);
    remaining = remaining.replace(setsRepsMatch[0], " ");
  }

  // 2. Extract weight: "80kg", "80 kg", "80KG"
  let weight: number | null = null;
  const weightMatch = remaining.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
  if (weightMatch) {
    weight = parseFloat(weightMatch[1].replace(",", "."));
    remaining = remaining.replace(weightMatch[0], " ");
  }

  // 3. Clean up remaining text = exercise name
  let name = remaining
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (!name) {
    return { error: "Non sembra un esercizio. Invia qualcosa come: panca piana 4x8 80kg" };
  }

  // 4. Alias lookup: exact → partial
  let resolvedName: string | null = null;

  // Exact match
  if (EXERCISE_ALIASES[name]) {
    resolvedName = EXERCISE_ALIASES[name];
  }

  // Partial match — find longest matching alias
  if (!resolvedName) {
    let bestMatch = "";
    for (const alias of Object.keys(EXERCISE_ALIASES)) {
      if (name.includes(alias) && alias.length > bestMatch.length) {
        bestMatch = alias;
      }
    }
    if (bestMatch) {
      resolvedName = EXERCISE_ALIASES[bestMatch];
    }
  }

  // 5. Capitalize first letter if no alias found
  if (!resolvedName) {
    resolvedName = name.charAt(0).toUpperCase() + name.slice(1);
  }

  // 6. Apply defaults
  return {
    name: resolvedName,
    sets: sets ?? 3,
    reps: reps ?? 10,
    weight_kg: weight,
  };
}
