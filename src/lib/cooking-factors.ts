// ---------------------------------------------------------------------------
// Cooking conversion factors — raw/cooked weight adjustments
// ---------------------------------------------------------------------------

interface CookingFactor {
  keywords: string[];
  rawToCookedRatio: number; // e.g. pasta: 2.3 means 100g raw → 230g cooked
}

const COOKING_FACTORS: CookingFactor[] = [
  { keywords: ["pasta", "spaghetti", "penne", "fusilli", "rigatoni", "linguine", "fettuccine", "tagliatelle", "bucatini", "maccheroni", "farfalle", "orecchiette"], rawToCookedRatio: 2.3 },
  { keywords: ["riso", "rice", "risotto", "riso basmati", "riso integrale"], rawToCookedRatio: 3.0 },
  { keywords: ["farro", "orzo", "cous cous", "couscous", "quinoa", "bulgur"], rawToCookedRatio: 2.5 },
  { keywords: ["pollo", "tacchino", "manzo", "maiale", "vitello", "agnello", "bresaola", "petto di pollo", "petto di tacchino", "carne"], rawToCookedRatio: 0.75 },
  { keywords: ["pesce", "salmone", "tonno", "merluzzo", "orata", "branzino", "sgombro", "platessa", "sogliola", "gamberi"], rawToCookedRatio: 0.85 },
  { keywords: ["lenticchie", "ceci", "fagioli", "piselli secchi", "fave secche", "legumi"], rawToCookedRatio: 2.5 },
];

/**
 * Adjusts gram weight based on cooking state.
 * If `isCooked` is true, converts cooked grams back to raw equivalent for nutritional lookup.
 * Nutritional databases store values per 100g RAW, so cooked weights need conversion.
 */
export function adjustForCooking(
  foodName: string,
  grams: number,
  isCooked: boolean
): { adjustedGrams: number; factor: number } {
  if (!isCooked) {
    return { adjustedGrams: grams, factor: 1 };
  }

  const lower = foodName.toLowerCase();

  for (const entry of COOKING_FACTORS) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) {
        const adjustedGrams = Math.round(grams / entry.rawToCookedRatio);
        console.log(
          `[Cooking] "${foodName}" ${grams}g cotto → ${adjustedGrams}g crudo (÷${entry.rawToCookedRatio})`
        );
        return { adjustedGrams, factor: entry.rawToCookedRatio };
      }
    }
  }

  // No match — return unchanged
  return { adjustedGrams: grams, factor: 1 };
}
