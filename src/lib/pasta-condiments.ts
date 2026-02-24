// ---------------------------------------------------------------------------
// Pasta Condiments Database — valori nutrizionali per porzione standard
// ---------------------------------------------------------------------------
// Quando l'utente dice "ho mangiato pasta alla X", il bot usa questi valori
// di default senza chiedere i grammi di ogni ingrediente.
// I valori sono riferiti a UNA porzione standard di condimento per ~80g di pasta secca.
// I valori della pasta stessa (80g cruda ~ 284 kcal, P:10g, C:57g, F:1.5g) vanno sommati.
// ---------------------------------------------------------------------------

export interface PastaCondiment {
  id: string;
  names: string[];
  description: string;
  per_serving: {
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  notes?: string;
  category:
    | "pomodoro"
    | "crema"
    | "olio"
    | "pesce"
    | "carne"
    | "verdure"
    | "forno";
}

// ---------------------------------------------------------------------------
// Portion multipliers
// ---------------------------------------------------------------------------

export const PORTION_MULTIPLIERS: Record<string, number> = {
  "mezza porzione": 0.5,
  mezza: 0.5,
  piccola: 0.7,
  normale: 1.0,
  standard: 1.0,
  abbondante: 1.3,
  grande: 1.3,
  doppia: 2.0,
  "doppia porzione": 2.0,
};

// ---------------------------------------------------------------------------
// Standard dry pasta base (80g cruda)
// ---------------------------------------------------------------------------

const PASTA_BASE_80G = {
  kcal: 284,
  protein_g: 10,
  carbs_g: 57,
  fat_g: 1.5,
};

// ---------------------------------------------------------------------------
// Condiment database
// ---------------------------------------------------------------------------

export const PASTA_CONDIMENTS: PastaCondiment[] = [
  // ── SUGHI A BASE DI POMODORO ──────────────────────────────────────────

  {
    id: "pomodoro",
    names: [
      "al pomodoro",
      "al sugo",
      "con sugo di pomodoro",
      "alla marinara",
      "con la salsa",
    ],
    description: "Sugo di pomodoro, aglio, basilico, olio EVO",
    per_serving: {
      kcal: 95,
      protein_g: 2,
      carbs_g: 8,
      fat_g: 6,
      fiber_g: 2,
    },
    category: "pomodoro",
  },
  {
    id: "arrabbiata",
    names: ["all'arrabbiata", "arrabbiata"],
    description: "Sugo di pomodoro, aglio, peperoncino, olio EVO",
    per_serving: {
      kcal: 100,
      protein_g: 2,
      carbs_g: 8,
      fat_g: 7,
      fiber_g: 2,
    },
    category: "pomodoro",
  },
  {
    id: "amatriciana",
    names: ["all'amatriciana", "amatriciana", "alla matriciana"],
    description: "Guanciale, pomodoro, pecorino romano, pepe",
    per_serving: {
      kcal: 295,
      protein_g: 12,
      carbs_g: 8,
      fat_g: 24,
      fiber_g: 1,
    },
    notes: "Guanciale ~40g, pecorino ~20g",
    category: "pomodoro",
  },
  {
    id: "puttanesca",
    names: ["alla puttanesca", "puttanesca"],
    description: "Pomodoro, olive, capperi, acciughe, aglio",
    per_serving: {
      kcal: 145,
      protein_g: 5,
      carbs_g: 10,
      fat_g: 10,
      fiber_g: 2,
    },
    category: "pomodoro",
  },
  {
    id: "ragu_bolognese",
    names: [
      "al ragu",
      "al ragù",
      "alla bolognese",
      "ragu",
      "ragù",
      "bolognese",
      "con il ragu",
      "con il ragù",
      "ragu di carne",
      "ragù di carne",
    ],
    description: "Ragu di carne bovina, soffritto, pomodoro, vino",
    per_serving: {
      kcal: 220,
      protein_g: 16,
      carbs_g: 6,
      fat_g: 14,
      fiber_g: 1,
    },
    notes: "Carne ~80g, soffritto, pomodoro. Alta proteina.",
    category: "carne",
  },
  {
    id: "ragu_salsiccia",
    names: [
      "al ragu di salsiccia",
      "al ragù di salsiccia",
      "con salsiccia e pomodoro",
      "salsiccia e sugo",
    ],
    description: "Salsiccia sbriciolata, pomodoro, cipolla",
    per_serving: {
      kcal: 260,
      protein_g: 14,
      carbs_g: 6,
      fat_g: 20,
      fiber_g: 1,
    },
    category: "carne",
  },
  {
    id: "pomodoro_fresco",
    names: [
      "al pomodoro fresco",
      "pomodorini",
      "con pomodorini",
      "pomodoro e basilico fresco",
      "con pomodorini freschi",
    ],
    description: "Pomodorini freschi, basilico, aglio, olio EVO",
    per_serving: {
      kcal: 110,
      protein_g: 2,
      carbs_g: 10,
      fat_g: 7,
      fiber_g: 2,
    },
    category: "pomodoro",
  },
  {
    id: "norma",
    names: ["alla norma", "norma"],
    description: "Pomodoro, melanzane fritte, ricotta salata, basilico",
    per_serving: {
      kcal: 230,
      protein_g: 7,
      carbs_g: 12,
      fat_g: 17,
      fiber_g: 3,
    },
    category: "pomodoro",
  },
  {
    id: "vongole_rosso",
    names: ["alle vongole rosso", "vongole in rosso"],
    description: "Vongole, pomodoro, aglio, prezzemolo, olio",
    per_serving: {
      kcal: 170,
      protein_g: 14,
      carbs_g: 8,
      fat_g: 9,
      fiber_g: 1,
    },
    category: "pesce",
  },

  // ── SUGHI A BASE DI CREMA / UOVA ─────────────────────────────────────

  {
    id: "carbonara",
    names: ["alla carbonara", "carbonara"],
    description: "Guanciale, uova, pecorino romano, pepe nero",
    per_serving: {
      kcal: 380,
      protein_g: 18,
      carbs_g: 2,
      fat_g: 32,
      fiber_g: 0,
    },
    notes:
      "Guanciale ~40g, 1 tuorlo + 1 uovo intero, pecorino ~25g. Piatto calorico ma ricco di proteine.",
    category: "crema",
  },
  {
    id: "cacio_pepe",
    names: ["cacio e pepe", "alla cacio e pepe"],
    description: "Pecorino romano, pepe nero",
    per_serving: {
      kcal: 210,
      protein_g: 12,
      carbs_g: 1,
      fat_g: 17,
      fiber_g: 0,
    },
    notes: "Pecorino ~40g. Semplice ma calorica per via del formaggio.",
    category: "crema",
  },
  {
    id: "gricia",
    names: ["alla gricia", "gricia"],
    description: "Guanciale, pecorino romano, pepe nero",
    per_serving: {
      kcal: 320,
      protein_g: 14,
      carbs_g: 1,
      fat_g: 28,
      fiber_g: 0,
    },
    notes:
      "Come un'amatriciana senza pomodoro. Guanciale ~40g, pecorino ~25g.",
    category: "crema",
  },
  {
    id: "panna_prosciutto",
    names: [
      "panna e prosciutto",
      "alla panna",
      "con la panna",
      "panna e funghi",
      "prosciutto e panna",
    ],
    description: "Panna da cucina, prosciutto cotto (o funghi)",
    per_serving: {
      kcal: 310,
      protein_g: 10,
      carbs_g: 4,
      fat_g: 28,
      fiber_g: 0,
    },
    notes: "Panna ~80ml, prosciutto ~40g. Alto in grassi saturi.",
    category: "crema",
  },
  {
    id: "quattro_formaggi",
    names: [
      "ai 4 formaggi",
      "ai quattro formaggi",
      "4 formaggi",
      "quattro formaggi",
    ],
    description: "Gorgonzola, fontina, parmigiano, emmentaler (o simili)",
    per_serving: {
      kcal: 350,
      protein_g: 16,
      carbs_g: 2,
      fat_g: 30,
      fiber_g: 0,
    },
    notes: "Formaggi totali ~60-80g. Molto calorica.",
    category: "crema",
  },
  {
    id: "gorgonzola_noci",
    names: [
      "gorgonzola e noci",
      "al gorgonzola",
      "con gorgonzola e noci",
    ],
    description: "Gorgonzola, noci, panna (opzionale)",
    per_serving: {
      kcal: 340,
      protein_g: 12,
      carbs_g: 3,
      fat_g: 30,
      fiber_g: 1,
    },
    category: "crema",
  },

  // ── SUGHI A BASE DI OLIO ─────────────────────────────────────────────

  {
    id: "aglio_olio",
    names: [
      "aglio olio e peperoncino",
      "aglio e olio",
      "ajo e ojo",
      "aglio olio",
    ],
    description: "Olio EVO, aglio, peperoncino, prezzemolo",
    per_serving: {
      kcal: 130,
      protein_g: 1,
      carbs_g: 2,
      fat_g: 14,
      fiber_g: 0,
    },
    notes: "Olio ~15ml. Leggera come condimento, pochi macro.",
    category: "olio",
  },
  {
    id: "pesto_genovese",
    names: [
      "al pesto",
      "pesto",
      "al pesto genovese",
      "pesto genovese",
      "con il pesto",
    ],
    description: "Basilico, pinoli, parmigiano, pecorino, aglio, olio EVO",
    per_serving: {
      kcal: 240,
      protein_g: 6,
      carbs_g: 3,
      fat_g: 22,
      fiber_g: 1,
    },
    notes:
      "Pesto ~40g. Calorico per l'olio e i pinoli ma ricco di grassi buoni.",
    category: "olio",
  },
  {
    id: "pesto_rosso",
    names: [
      "al pesto rosso",
      "pesto rosso",
      "pesto di pomodori secchi",
    ],
    description: "Pomodori secchi, mandorle/noci, parmigiano, olio",
    per_serving: {
      kcal: 200,
      protein_g: 5,
      carbs_g: 6,
      fat_g: 17,
      fiber_g: 2,
    },
    category: "olio",
  },
  {
    id: "olio_parmigiano",
    names: [
      "in bianco",
      "olio e parmigiano",
      "bianca",
      "pasta bianca",
      "burro e parmigiano",
      "al burro",
    ],
    description: "Olio EVO (o burro), parmigiano grattugiato",
    per_serving: {
      kcal: 160,
      protein_g: 7,
      carbs_g: 1,
      fat_g: 14,
      fiber_g: 0,
    },
    notes: "Comfort food. Se con burro: grassi saturi piu alti.",
    category: "olio",
  },

  // ── SUGHI DI PESCE ───────────────────────────────────────────────────

  {
    id: "vongole_bianco",
    names: ["alle vongole", "vongole", "con le vongole"],
    description: "Vongole, aglio, olio, prezzemolo, vino bianco",
    per_serving: {
      kcal: 155,
      protein_g: 14,
      carbs_g: 4,
      fat_g: 9,
      fiber_g: 0,
    },
    notes: "Ottimo rapporto calorie/proteine. Ricco di ferro e B12.",
    category: "pesce",
  },
  {
    id: "tonno",
    names: [
      "al tonno",
      "tonno",
      "con il tonno",
      "tonno e pomodoro",
    ],
    description: "Tonno in scatola, pomodoro (opzionale), olio, cipolla",
    per_serving: {
      kcal: 185,
      protein_g: 20,
      carbs_g: 4,
      fat_g: 10,
      fiber_g: 1,
    },
    notes:
      "Tonno sgocciolato ~80g. Ottima fonte proteica economica e veloce.",
    category: "pesce",
  },
  {
    id: "frutti_mare",
    names: [
      "ai frutti di mare",
      "frutti di mare",
      "allo scoglio",
      "con frutti di mare",
      "mare",
    ],
    description: "Mix cozze, vongole, gamberi, calamari, pomodoro, aglio",
    per_serving: {
      kcal: 195,
      protein_g: 18,
      carbs_g: 6,
      fat_g: 10,
      fiber_g: 1,
    },
    notes:
      "Varia molto per composizione. Ricco di proteine e micronutrienti.",
    category: "pesce",
  },
  {
    id: "salmone",
    names: [
      "al salmone",
      "salmone",
      "con salmone",
      "salmone e panna",
      "salmone affumicato",
    ],
    description: "Salmone fresco o affumicato, panna (opzionale), aneto",
    per_serving: {
      kcal: 260,
      protein_g: 16,
      carbs_g: 2,
      fat_g: 20,
      fiber_g: 0,
    },
    notes: "Se con panna: +100 kcal circa. Ricco di omega-3.",
    category: "pesce",
  },
  {
    id: "gamberi",
    names: [
      "ai gamberi",
      "gamberetti",
      "con gamberi",
      "con gamberetti",
      "gamberi e zucchine",
    ],
    description:
      "Gamberi, aglio, olio, prezzemolo (+ zucchine se specificato)",
    per_serving: {
      kcal: 160,
      protein_g: 16,
      carbs_g: 3,
      fat_g: 9,
      fiber_g: 0,
    },
    notes: "Gamberi ~100g. Basso in calorie, alto in proteine.",
    category: "pesce",
  },
  {
    id: "bottarga",
    names: ["alla bottarga", "bottarga", "con bottarga"],
    description:
      "Bottarga di muggine grattugiata, aglio, olio, prezzemolo",
    per_serving: {
      kcal: 175,
      protein_g: 12,
      carbs_g: 2,
      fat_g: 13,
      fiber_g: 0,
    },
    category: "pesce",
  },

  // ── SUGHI DI VERDURE ─────────────────────────────────────────────────

  {
    id: "zucchine",
    names: ["alle zucchine", "con zucchine", "zucchine"],
    description:
      "Zucchine trifolate, aglio, olio, parmigiano (opzionale)",
    per_serving: {
      kcal: 115,
      protein_g: 4,
      carbs_g: 6,
      fat_g: 8,
      fiber_g: 2,
    },
    category: "verdure",
  },
  {
    id: "broccoli",
    names: [
      "con broccoli",
      "ai broccoli",
      "broccoli",
      "broccoletti",
      "con i broccoletti",
      "orecchiette e cime di rapa",
    ],
    description: "Broccoli/cime di rapa, aglio, olio, peperoncino",
    per_serving: {
      kcal: 120,
      protein_g: 5,
      carbs_g: 8,
      fat_g: 8,
      fiber_g: 4,
    },
    notes: "Ottimo per fibre. Con acciughe aggiungere +30 kcal.",
    category: "verdure",
  },
  {
    id: "funghi",
    names: [
      "ai funghi",
      "con funghi",
      "funghi",
      "ai porcini",
      "con i funghi porcini",
    ],
    description:
      "Funghi (champignon o porcini), aglio, olio, prezzemolo",
    per_serving: {
      kcal: 110,
      protein_g: 4,
      carbs_g: 5,
      fat_g: 8,
      fiber_g: 2,
    },
    notes:
      "Con porcini: piu saporiti, stessi valori circa. Con panna: +120 kcal.",
    category: "verdure",
  },
  {
    id: "melanzane",
    names: ["alle melanzane", "con melanzane", "melanzane"],
    description: "Melanzane a cubetti, pomodoro, olio, basilico",
    per_serving: {
      kcal: 140,
      protein_g: 3,
      carbs_g: 10,
      fat_g: 10,
      fiber_g: 3,
    },
    notes: "Le melanzane assorbono molto olio in cottura.",
    category: "verdure",
  },
  {
    id: "primavera",
    names: [
      "primavera",
      "alle verdure",
      "con verdure",
      "verdure miste",
      "ortolana",
    ],
    description:
      "Mix verdure di stagione (zucchine, peperoni, carote, piselli), olio",
    per_serving: {
      kcal: 130,
      protein_g: 4,
      carbs_g: 12,
      fat_g: 7,
      fiber_g: 4,
    },
    notes: "Ottimo per fibre e micronutrienti. Leggera.",
    category: "verdure",
  },
  {
    id: "carciofi",
    names: ["ai carciofi", "con carciofi", "carciofi"],
    description: "Carciofi trifolati, aglio, prezzemolo, olio",
    per_serving: {
      kcal: 115,
      protein_g: 4,
      carbs_g: 8,
      fat_g: 8,
      fiber_g: 4,
    },
    category: "verdure",
  },
  {
    id: "pomodorini_olive",
    names: [
      "pomodorini e olive",
      "olive e pomodorini",
      "alla mediterranea",
    ],
    description: "Pomodorini, olive, capperi, origano, olio",
    per_serving: {
      kcal: 135,
      protein_g: 2,
      carbs_g: 8,
      fat_g: 11,
      fiber_g: 2,
    },
    category: "verdure",
  },

  // ── SUGHI DI CARNE ───────────────────────────────────────────────────

  {
    id: "salsiccia_funghi",
    names: ["salsiccia e funghi", "con salsiccia e funghi"],
    description: "Salsiccia sbriciolata, funghi, olio, vino bianco",
    per_serving: {
      kcal: 280,
      protein_g: 15,
      carbs_g: 4,
      fat_g: 22,
      fiber_g: 1,
    },
    category: "carne",
  },
  {
    id: "pancetta",
    names: ["con pancetta", "alla pancetta", "bacon"],
    description: "Pancetta rosolata, olio (+ cipolla opzionale)",
    per_serving: {
      kcal: 210,
      protein_g: 10,
      carbs_g: 1,
      fat_g: 18,
      fiber_g: 0,
    },
    category: "carne",
  },
  {
    id: "speck",
    names: [
      "con speck",
      "allo speck",
      "speck e panna",
      "speck e radicchio",
    ],
    description:
      "Speck a listarelle, eventualmente panna o radicchio",
    per_serving: {
      kcal: 195,
      protein_g: 14,
      carbs_g: 2,
      fat_g: 14,
      fiber_g: 0,
    },
    notes:
      "Se con panna: +100 kcal. Se con radicchio: +15 kcal.",
    category: "carne",
  },

  // ── AL FORNO (piatti completi — NON sommare pasta base) ──────────────

  {
    id: "lasagna",
    names: ["lasagna", "lasagne", "lasagna alla bolognese"],
    description:
      "Sfoglie, ragu, besciamella, parmigiano — 1 porzione (~300g)",
    per_serving: {
      kcal: 520,
      protein_g: 24,
      carbs_g: 42,
      fat_g: 28,
      fiber_g: 2,
    },
    notes:
      "Porzione da ristorante/casa ~300g. Piatto completo, non serve aggiungere pasta.",
    category: "forno",
  },
  {
    id: "pasta_forno",
    names: [
      "pasta al forno",
      "al forno",
      "timballo",
      "pasticcio",
    ],
    description:
      "Pasta con ragu, mozzarella, besciamella, parmigiano — 1 porzione (~300g)",
    per_serving: {
      kcal: 480,
      protein_g: 22,
      carbs_g: 48,
      fat_g: 22,
      fiber_g: 2,
    },
    notes:
      "Piatto completo, include gia la pasta. Non sommare pasta base.",
    category: "forno",
  },
  {
    id: "cannelloni",
    names: ["cannelloni", "cannelloni ricotta e spinaci"],
    description:
      "Cannelloni ripieni di ricotta e spinaci (o ragu), besciamella — 1 porzione (3-4 cannelloni)",
    per_serving: {
      kcal: 450,
      protein_g: 20,
      carbs_g: 38,
      fat_g: 24,
      fiber_g: 2,
    },
    notes:
      "Piatto completo. Se ripieni di carne: +40 kcal, +6g proteine.",
    category: "forno",
  },

  // ── FORMATI SPECIALI (piatti completi — NON sommare pasta base) ──────

  {
    id: "gnocchi_pomodoro",
    names: [
      "gnocchi",
      "gnocchi al pomodoro",
      "gnocchi al sugo",
      "gnocchi al ragu",
      "gnocchi al ragù",
      "gnocchi al pesto",
    ],
    description: "Gnocchi di patate (200g porzione) + condimento",
    per_serving: {
      kcal: 380,
      protein_g: 10,
      carbs_g: 62,
      fat_g: 10,
      fiber_g: 3,
    },
    notes:
      "Gnocchi ~200g. Se al ragu: +80 kcal. Se al pesto: +100 kcal. Se ai 4 formaggi: +150 kcal.",
    category: "pomodoro",
  },
  {
    id: "risotto",
    names: [
      "risotto",
      "risotto alla parmigiana",
      "risotto allo zafferano",
      "risotto alla milanese",
    ],
    description:
      "Risotto base con parmigiano e burro — 1 porzione (80g riso crudo)",
    per_serving: {
      kcal: 420,
      protein_g: 12,
      carbs_g: 62,
      fat_g: 14,
      fiber_g: 1,
    },
    notes:
      "Il risotto include gia burro e parmigiano nella mantecatura. Ai funghi: +20 kcal. Al tartufo: stessi valori. Alla marinara: simile.",
    category: "crema",
  },
];

// IDs of complete dishes — do NOT add pasta base values
const COMPLETE_DISH_IDS = new Set([
  "lasagna",
  "pasta_forno",
  "cannelloni",
  "gnocchi_pomodoro",
  "risotto",
]);

// ---------------------------------------------------------------------------
// Lookup — find condiment by user input
// ---------------------------------------------------------------------------

export function findCondiment(userInput: string): PastaCondiment | null {
  const normalized = userInput
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .trim();

  for (const condiment of PASTA_CONDIMENTS) {
    for (const name of condiment.names) {
      if (normalized.includes(name.toLowerCase())) {
        return condiment;
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Parse portion size from user input
// ---------------------------------------------------------------------------

export function parsePortionSize(userInput: string): {
  multiplier: number;
  label: string;
} {
  const normalized = userInput.toLowerCase().trim();

  // Check longer phrases first to avoid partial matches
  const sortedKeys = Object.keys(PORTION_MULTIPLIERS).sort(
    (a, b) => b.length - a.length
  );

  for (const key of sortedKeys) {
    if (normalized.includes(key)) {
      return { multiplier: PORTION_MULTIPLIERS[key], label: key };
    }
  }

  return { multiplier: 1.0, label: "normale" };
}

// ---------------------------------------------------------------------------
// Calculate full dish macros
// ---------------------------------------------------------------------------

export interface PastaPortionResult {
  pasta: {
    quantity_g: number;
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  condiment: PastaCondiment;
  multiplier: number;
  isCompleteDish: boolean;
  totals: {
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
}

export function calculatePastaDish(
  pastaGrams: number = 80,
  condiment: PastaCondiment,
  portionSize: string = "normale"
): PastaPortionResult {
  const multiplier = PORTION_MULTIPLIERS[portionSize] || 1.0;
  const isCompleteDish = COMPLETE_DISH_IDS.has(condiment.id);

  // Scaled condiment
  const cond = condiment.per_serving;
  const scaledCond = {
    kcal: Math.round(cond.kcal * multiplier),
    protein_g: Math.round(cond.protein_g * multiplier),
    carbs_g: Math.round(cond.carbs_g * multiplier),
    fat_g: Math.round(cond.fat_g * multiplier),
    fiber_g: Math.round(cond.fiber_g * multiplier),
  };

  if (isCompleteDish) {
    // Complete dishes already include everything
    return {
      pasta: { quantity_g: 0, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      condiment,
      multiplier,
      isCompleteDish: true,
      totals: scaledCond,
    };
  }

  // Standard pasta + condiment
  const pastaRatio = pastaGrams / 80;
  const pasta = {
    quantity_g: pastaGrams,
    kcal: Math.round(PASTA_BASE_80G.kcal * pastaRatio),
    protein_g: Math.round(PASTA_BASE_80G.protein_g * pastaRatio),
    carbs_g: Math.round(PASTA_BASE_80G.carbs_g * pastaRatio),
    fat_g: Math.round(PASTA_BASE_80G.fat_g * pastaRatio),
  };

  return {
    pasta,
    condiment,
    multiplier,
    isCompleteDish: false,
    totals: {
      kcal: pasta.kcal + scaledCond.kcal,
      protein_g: pasta.protein_g + scaledCond.protein_g,
      carbs_g: pasta.carbs_g + scaledCond.carbs_g,
      fat_g: pasta.fat_g + scaledCond.fat_g,
      fiber_g: scaledCond.fiber_g,
    },
  };
}

// ---------------------------------------------------------------------------
// Convenience: full pipeline from raw user text
// ---------------------------------------------------------------------------

export function parsePastaDish(
  userInput: string,
  pastaGrams?: number
): PastaPortionResult | null {
  const condiment = findCondiment(userInput);
  if (!condiment) return null;

  const { label } = parsePortionSize(userInput);
  return calculatePastaDish(pastaGrams ?? 80, condiment, label);
}
