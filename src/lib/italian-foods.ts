import type { NutrientResult } from "./nutrition";

// ---------------------------------------------------------------------------
// Static CREA/INRAN database — ~100 common Italian foods, values per 100g raw
// Source: CREA (Centro di Ricerca Alimenti e Nutrizione)
// ---------------------------------------------------------------------------

interface FoodEntry {
  names: string[]; // primary name + aliases
  per100g: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number };
}

export const FOODS: FoodEntry[] = [
  // === PROTEINE ===
  { names: ["petto di pollo", "pollo", "chicken breast"], per100g: { calories: 110, protein_g: 23.3, carbs_g: 0, fat_g: 1.9, fiber_g: 0 } },
  { names: ["petto di tacchino", "tacchino", "turkey breast"], per100g: { calories: 107, protein_g: 24.1, carbs_g: 0, fat_g: 1.2, fiber_g: 0 } },
  { names: ["manzo macinato", "carne macinata", "macinato"], per100g: { calories: 170, protein_g: 20.0, carbs_g: 0, fat_g: 10.0, fiber_g: 0 } },
  { names: ["manzo", "bistecca", "filetto di manzo"], per100g: { calories: 131, protein_g: 22.0, carbs_g: 0, fat_g: 5.0, fiber_g: 0 } },
  { names: ["maiale", "lonza", "lonza di maiale"], per100g: { calories: 146, protein_g: 21.3, carbs_g: 0, fat_g: 6.8, fiber_g: 0 } },
  { names: ["vitello", "scaloppina", "fettina di vitello"], per100g: { calories: 107, protein_g: 21.0, carbs_g: 0, fat_g: 2.7, fiber_g: 0 } },
  { names: ["bresaola"], per100g: { calories: 151, protein_g: 33.1, carbs_g: 0, fat_g: 2.0, fiber_g: 0 } },
  { names: ["prosciutto crudo"], per100g: { calories: 224, protein_g: 28.0, carbs_g: 0, fat_g: 12.0, fiber_g: 0 } },
  { names: ["prosciutto cotto"], per100g: { calories: 132, protein_g: 19.8, carbs_g: 1.0, fat_g: 5.0, fiber_g: 0 } },
  { names: ["tonno", "tonno in scatola", "tonno al naturale"], per100g: { calories: 103, protein_g: 23.3, carbs_g: 0, fat_g: 0.8, fiber_g: 0 } },
  { names: ["salmone"], per100g: { calories: 185, protein_g: 20.4, carbs_g: 0, fat_g: 11.0, fiber_g: 0 } },
  { names: ["merluzzo"], per100g: { calories: 82, protein_g: 17.8, carbs_g: 0, fat_g: 0.7, fiber_g: 0 } },
  { names: ["orata"], per100g: { calories: 100, protein_g: 20.7, carbs_g: 0, fat_g: 2.0, fiber_g: 0 } },
  { names: ["branzino", "spigola"], per100g: { calories: 97, protein_g: 18.4, carbs_g: 0, fat_g: 2.5, fiber_g: 0 } },
  { names: ["sgombro"], per100g: { calories: 205, protein_g: 18.6, carbs_g: 0, fat_g: 13.9, fiber_g: 0 } },
  { names: ["gamberi"], per100g: { calories: 85, protein_g: 18.1, carbs_g: 0.9, fat_g: 0.8, fiber_g: 0 } },
  { names: ["uovo", "uova"], per100g: { calories: 143, protein_g: 12.4, carbs_g: 0.7, fat_g: 9.9, fiber_g: 0 } },
  { names: ["albume", "albumi"], per100g: { calories: 43, protein_g: 9.8, carbs_g: 0.7, fat_g: 0.1, fiber_g: 0 } },
  { names: ["salsiccia"], per100g: { calories: 304, protein_g: 15.4, carbs_g: 0.4, fat_g: 26.7, fiber_g: 0 } },
  { names: ["hamburger", "burger"], per100g: { calories: 170, protein_g: 20.0, carbs_g: 0, fat_g: 10.0, fiber_g: 0 } },

  // === CARBOIDRATI ===
  { names: ["pasta", "spaghetti", "penne", "fusilli", "rigatoni", "linguine", "maccheroni", "farfalle", "orecchiette", "bucatini", "fettuccine", "tagliatelle"], per100g: { calories: 353, protein_g: 12.5, carbs_g: 71.2, fat_g: 1.8, fiber_g: 2.7 } },
  { names: ["pasta integrale", "spaghetti integrali", "penne integrali"], per100g: { calories: 348, protein_g: 13.4, carbs_g: 66.2, fat_g: 2.5, fiber_g: 7.0 } },
  { names: ["riso", "riso bianco"], per100g: { calories: 360, protein_g: 6.7, carbs_g: 80.4, fat_g: 0.4, fiber_g: 1.0 } },
  { names: ["riso integrale", "riso brown"], per100g: { calories: 337, protein_g: 7.5, carbs_g: 72.0, fat_g: 2.2, fiber_g: 3.5 } },
  { names: ["riso basmati"], per100g: { calories: 350, protein_g: 7.1, carbs_g: 78.0, fat_g: 0.6, fiber_g: 0.7 } },
  { names: ["pane", "pane bianco"], per100g: { calories: 265, protein_g: 8.8, carbs_g: 49.0, fat_g: 3.2, fiber_g: 2.7 } },
  { names: ["pane integrale"], per100g: { calories: 247, protein_g: 10.0, carbs_g: 44.0, fat_g: 3.5, fiber_g: 6.5 } },
  { names: ["patate", "patata"], per100g: { calories: 77, protein_g: 2.0, carbs_g: 17.5, fat_g: 0.1, fiber_g: 1.8 } },
  { names: ["patate dolci", "patata dolce", "patata americana"], per100g: { calories: 86, protein_g: 1.6, carbs_g: 20.1, fat_g: 0.1, fiber_g: 3.0 } },
  { names: ["avena", "fiocchi d'avena", "fiocchi di avena"], per100g: { calories: 389, protein_g: 16.9, carbs_g: 66.3, fat_g: 6.9, fiber_g: 10.6 } },
  { names: ["farro"], per100g: { calories: 335, protein_g: 15.1, carbs_g: 67.1, fat_g: 2.5, fiber_g: 6.8 } },
  { names: ["cous cous", "couscous"], per100g: { calories: 356, protein_g: 12.8, carbs_g: 72.4, fat_g: 0.6, fiber_g: 2.0 } },
  { names: ["quinoa"], per100g: { calories: 368, protein_g: 14.1, carbs_g: 64.2, fat_g: 6.1, fiber_g: 7.0 } },
  { names: ["gallette di riso", "gallette"], per100g: { calories: 387, protein_g: 8.0, carbs_g: 81.0, fat_g: 2.8, fiber_g: 3.4 } },
  { names: ["fette biscottate"], per100g: { calories: 408, protein_g: 11.3, carbs_g: 75.0, fat_g: 6.0, fiber_g: 3.5 } },

  // === LATTICINI ===
  { names: ["mozzarella"], per100g: { calories: 253, protein_g: 18.7, carbs_g: 0.7, fat_g: 19.5, fiber_g: 0 } },
  { names: ["mozzarella di bufala", "bufala"], per100g: { calories: 288, protein_g: 16.7, carbs_g: 0.4, fat_g: 24.4, fiber_g: 0 } },
  { names: ["parmigiano", "parmigiano reggiano", "grana"], per100g: { calories: 392, protein_g: 33.0, carbs_g: 0, fat_g: 28.4, fiber_g: 0 } },
  { names: ["pecorino", "pecorino romano"], per100g: { calories: 387, protein_g: 25.5, carbs_g: 0.2, fat_g: 32.0, fiber_g: 0 } },
  { names: ["ricotta"], per100g: { calories: 146, protein_g: 8.8, carbs_g: 3.5, fat_g: 10.9, fiber_g: 0 } },
  { names: ["yogurt greco", "yogurt greco 0"], per100g: { calories: 59, protein_g: 10.2, carbs_g: 3.6, fat_g: 0.7, fiber_g: 0 } },
  { names: ["yogurt", "yogurt bianco"], per100g: { calories: 61, protein_g: 3.5, carbs_g: 4.7, fat_g: 3.3, fiber_g: 0 } },
  { names: ["latte intero"], per100g: { calories: 64, protein_g: 3.3, carbs_g: 4.9, fat_g: 3.6, fiber_g: 0 } },
  { names: ["latte scremato", "latte"], per100g: { calories: 36, protein_g: 3.5, carbs_g: 5.0, fat_g: 0.2, fiber_g: 0 } },
  { names: ["burro"], per100g: { calories: 717, protein_g: 0.9, carbs_g: 0.1, fat_g: 81.1, fiber_g: 0 } },
  { names: ["philadelphia", "formaggio spalmabile"], per100g: { calories: 253, protein_g: 5.4, carbs_g: 4.1, fat_g: 24.0, fiber_g: 0 } },
  { names: ["stracchino", "crescenza"], per100g: { calories: 300, protein_g: 18.5, carbs_g: 0, fat_g: 25.0, fiber_g: 0 } },

  // === LEGUMI (secchi) ===
  { names: ["lenticchie"], per100g: { calories: 325, protein_g: 25.0, carbs_g: 51.1, fat_g: 2.5, fiber_g: 13.8 } },
  { names: ["ceci"], per100g: { calories: 320, protein_g: 20.5, carbs_g: 46.9, fat_g: 6.0, fiber_g: 13.6 } },
  { names: ["fagioli", "fagioli borlotti"], per100g: { calories: 310, protein_g: 20.2, carbs_g: 47.5, fat_g: 2.0, fiber_g: 17.0 } },
  { names: ["fagioli cannellini"], per100g: { calories: 311, protein_g: 23.4, carbs_g: 45.5, fat_g: 1.6, fiber_g: 17.6 } },
  { names: ["piselli"], per100g: { calories: 81, protein_g: 5.4, carbs_g: 14.5, fat_g: 0.4, fiber_g: 5.1 } },
  { names: ["edamame", "soia"], per100g: { calories: 122, protein_g: 11.9, carbs_g: 8.9, fat_g: 5.2, fiber_g: 5.2 } },

  // === VERDURE ===
  { names: ["pomodori", "pomodoro"], per100g: { calories: 19, protein_g: 1.0, carbs_g: 3.5, fat_g: 0.2, fiber_g: 1.0 } },
  { names: ["zucchine", "zucchina"], per100g: { calories: 16, protein_g: 1.3, carbs_g: 2.0, fat_g: 0.4, fiber_g: 1.1 } },
  { names: ["spinaci"], per100g: { calories: 23, protein_g: 2.9, carbs_g: 2.9, fat_g: 0.3, fiber_g: 2.2 } },
  { names: ["broccoli", "broccolo"], per100g: { calories: 34, protein_g: 2.8, carbs_g: 4.4, fat_g: 0.6, fiber_g: 3.3 } },
  { names: ["carote", "carota"], per100g: { calories: 35, protein_g: 0.8, carbs_g: 7.6, fat_g: 0.2, fiber_g: 3.1 } },
  { names: ["insalata", "lattuga", "insalata mista"], per100g: { calories: 15, protein_g: 1.4, carbs_g: 2.2, fat_g: 0.2, fiber_g: 1.5 } },
  { names: ["peperoni", "peperone"], per100g: { calories: 22, protein_g: 0.9, carbs_g: 4.2, fat_g: 0.3, fiber_g: 1.4 } },
  { names: ["melanzane", "melanzana"], per100g: { calories: 24, protein_g: 1.0, carbs_g: 2.6, fat_g: 0.4, fiber_g: 2.5 } },
  { names: ["funghi", "champignon"], per100g: { calories: 22, protein_g: 3.1, carbs_g: 0.8, fat_g: 0.3, fiber_g: 1.4 } },
  { names: ["cavolfiore"], per100g: { calories: 25, protein_g: 1.9, carbs_g: 2.7, fat_g: 0.3, fiber_g: 2.1 } },
  { names: ["fagiolini"], per100g: { calories: 31, protein_g: 2.1, carbs_g: 5.3, fat_g: 0.2, fiber_g: 3.2 } },
  { names: ["asparagi"], per100g: { calories: 24, protein_g: 3.6, carbs_g: 2.0, fat_g: 0.2, fiber_g: 2.0 } },
  { names: ["finocchi", "finocchio"], per100g: { calories: 15, protein_g: 1.2, carbs_g: 2.3, fat_g: 0.2, fiber_g: 2.4 } },
  { names: ["carciofi", "carciofo"], per100g: { calories: 22, protein_g: 2.7, carbs_g: 2.5, fat_g: 0.2, fiber_g: 5.5 } },
  { names: ["cipolla"], per100g: { calories: 26, protein_g: 1.0, carbs_g: 5.7, fat_g: 0.1, fiber_g: 1.0 } },

  // === FRUTTA ===
  { names: ["mela", "mele"], per100g: { calories: 52, protein_g: 0.3, carbs_g: 13.8, fat_g: 0.2, fiber_g: 2.4 } },
  { names: ["banana", "banane"], per100g: { calories: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3, fiber_g: 2.6 } },
  { names: ["arancia", "arance"], per100g: { calories: 47, protein_g: 0.9, carbs_g: 11.8, fat_g: 0.1, fiber_g: 2.4 } },
  { names: ["fragole"], per100g: { calories: 30, protein_g: 0.9, carbs_g: 5.3, fat_g: 0.4, fiber_g: 1.6 } },
  { names: ["kiwi"], per100g: { calories: 44, protein_g: 1.0, carbs_g: 9.1, fat_g: 0.6, fiber_g: 2.3 } },
  { names: ["pera", "pere"], per100g: { calories: 35, protein_g: 0.3, carbs_g: 8.8, fat_g: 0.1, fiber_g: 3.8 } },
  { names: ["uva"], per100g: { calories: 61, protein_g: 0.5, carbs_g: 15.6, fat_g: 0.1, fiber_g: 1.5 } },
  { names: ["pesca", "pesche"], per100g: { calories: 27, protein_g: 0.8, carbs_g: 6.1, fat_g: 0.1, fiber_g: 1.6 } },
  { names: ["ananas"], per100g: { calories: 40, protein_g: 0.5, carbs_g: 10.0, fat_g: 0.1, fiber_g: 1.0 } },
  { names: ["mirtilli"], per100g: { calories: 25, protein_g: 0.9, carbs_g: 5.1, fat_g: 0.2, fiber_g: 3.1 } },

  // === GRASSI ===
  { names: ["olio d'oliva", "olio di oliva", "olio evo", "olio"], per100g: { calories: 884, protein_g: 0, carbs_g: 0, fat_g: 100, fiber_g: 0 } },
  { names: ["mandorle"], per100g: { calories: 603, protein_g: 22.0, carbs_g: 4.6, fat_g: 55.3, fiber_g: 12.2 } },
  { names: ["noci"], per100g: { calories: 654, protein_g: 15.2, carbs_g: 5.6, fat_g: 65.2, fiber_g: 6.7 } },
  { names: ["arachidi", "noccioline"], per100g: { calories: 567, protein_g: 25.8, carbs_g: 7.6, fat_g: 49.2, fiber_g: 8.5 } },
  { names: ["avocado"], per100g: { calories: 160, protein_g: 2.0, carbs_g: 1.8, fat_g: 14.7, fiber_g: 6.7 } },
  { names: ["burro di arachidi", "burro d'arachidi"], per100g: { calories: 588, protein_g: 25.1, carbs_g: 8.5, fat_g: 50.4, fiber_g: 6.0 } },
  { names: ["cocco", "cocco rapè"], per100g: { calories: 354, protein_g: 3.3, carbs_g: 6.2, fat_g: 33.5, fiber_g: 9.0 } },
  { names: ["semi di chia", "chia"], per100g: { calories: 486, protein_g: 16.5, carbs_g: 7.7, fat_g: 30.7, fiber_g: 34.4 } },

  // === STAPLES ITALIANI ===
  { names: ["sugo", "sugo di pomodoro", "passata", "passata di pomodoro"], per100g: { calories: 26, protein_g: 1.2, carbs_g: 4.2, fat_g: 0.3, fiber_g: 1.3 } },
  { names: ["pesto", "pesto alla genovese"], per100g: { calories: 460, protein_g: 4.8, carbs_g: 4.5, fat_g: 46.0, fiber_g: 1.5 } },
  { names: ["guanciale"], per100g: { calories: 655, protein_g: 8.9, carbs_g: 0, fat_g: 69.6, fiber_g: 0 } },
  { names: ["pancetta"], per100g: { calories: 458, protein_g: 14.4, carbs_g: 0, fat_g: 45.0, fiber_g: 0 } },
  { names: ["nutella"], per100g: { calories: 539, protein_g: 6.3, carbs_g: 57.5, fat_g: 30.9, fiber_g: 1.8 } },
  { names: ["miele"], per100g: { calories: 304, protein_g: 0.3, carbs_g: 82.4, fat_g: 0, fiber_g: 0 } },
  { names: ["marmellata", "confettura"], per100g: { calories: 250, protein_g: 0.3, carbs_g: 60.0, fat_g: 0.1, fiber_g: 1.0 } },
  { names: ["cioccolato fondente", "cioccolato"], per100g: { calories: 535, protein_g: 5.0, carbs_g: 52.4, fat_g: 33.3, fiber_g: 7.0 } },
  { names: ["prosciutto e mozzarella", "toast"], per100g: { calories: 240, protein_g: 14.0, carbs_g: 20.0, fat_g: 12.0, fiber_g: 1.0 } },
  { names: ["gnocchi"], per100g: { calories: 133, protein_g: 3.0, carbs_g: 30.0, fat_g: 0.5, fiber_g: 1.5 } },
  { names: ["polenta"], per100g: { calories: 64, protein_g: 1.4, carbs_g: 13.7, fat_g: 0.3, fiber_g: 0.7 } },
  { names: ["crackers", "cracker"], per100g: { calories: 455, protein_g: 9.4, carbs_g: 68.0, fat_g: 15.0, fiber_g: 2.5 } },
  { names: ["grissini"], per100g: { calories: 412, protein_g: 12.3, carbs_g: 68.4, fat_g: 10.0, fiber_g: 3.0 } },
  { names: ["tonno sott'olio", "tonno in olio"], per100g: { calories: 198, protein_g: 25.2, carbs_g: 0, fat_g: 10.4, fiber_g: 0 } },
  { names: ["tofu"], per100g: { calories: 76, protein_g: 8.1, carbs_g: 1.9, fat_g: 4.8, fiber_g: 0.3 } },
  { names: ["seitan"], per100g: { calories: 122, protein_g: 21.2, carbs_g: 3.7, fat_g: 1.9, fiber_g: 0.6 } },
];

// Build lookup indexes for fast matching
const exactMap = new Map<string, FoodEntry>();
const allNames: { name: string; entry: FoodEntry }[] = [];

for (const entry of FOODS) {
  for (const name of entry.names) {
    const lower = name.toLowerCase();
    exactMap.set(lower, entry);
    allNames.push({ name: lower, entry });
  }
}

/**
 * Look up an Italian food by name. Returns scaled NutrientResult or null.
 * Priority: exact match → alias match → partial match.
 */
export function lookupItalianFood(name: string, grams: number): NutrientResult | null {
  const lower = name.toLowerCase().trim();

  // 1. Exact match
  let entry = exactMap.get(lower);

  // 2. Partial match — food name contains or is contained in query
  if (!entry) {
    for (const item of allNames) {
      if (lower.includes(item.name) || item.name.includes(lower)) {
        entry = item.entry;
        break;
      }
    }
  }

  if (!entry) return null;

  const s = grams / 100;
  return {
    calories: Math.round(entry.per100g.calories * s),
    protein_g: parseFloat((entry.per100g.protein_g * s).toFixed(1)),
    carbs_g: parseFloat((entry.per100g.carbs_g * s).toFixed(1)),
    fat_g: parseFloat((entry.per100g.fat_g * s).toFixed(1)),
    fiber_g: parseFloat((entry.per100g.fiber_g * s).toFixed(1)),
    source: "crea",
  };
}
