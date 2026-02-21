import type { NutrientResult } from "./nutrition";

// ---------------------------------------------------------------------------
// Static CREA/INRAN database — ~375 common Italian foods, values per 100g raw
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
  // -- Proteine: more fish --
  { names: ["acciughe", "alici", "acciuga"], per100g: { calories: 131, protein_g: 20.4, carbs_g: 0, fat_g: 4.8, fiber_g: 0 } },
  { names: ["sardine", "sardina", "sarde"], per100g: { calories: 169, protein_g: 20.8, carbs_g: 0, fat_g: 9.4, fiber_g: 0 } },
  { names: ["pesce spada"], per100g: { calories: 144, protein_g: 19.8, carbs_g: 0, fat_g: 6.7, fiber_g: 0 } },
  { names: ["trota"], per100g: { calories: 119, protein_g: 20.5, carbs_g: 0, fat_g: 3.5, fiber_g: 0 } },
  { names: ["sogliola"], per100g: { calories: 83, protein_g: 17.0, carbs_g: 0, fat_g: 1.4, fiber_g: 0 } },
  { names: ["calamari", "calamaro", "totani"], per100g: { calories: 92, protein_g: 15.6, carbs_g: 3.1, fat_g: 1.4, fiber_g: 0 } },
  { names: ["polpo", "polipo"], per100g: { calories: 82, protein_g: 14.9, carbs_g: 2.2, fat_g: 1.0, fiber_g: 0 } },
  { names: ["cozze", "mitili"], per100g: { calories: 86, protein_g: 11.9, carbs_g: 3.7, fat_g: 2.2, fiber_g: 0 } },
  { names: ["vongole"], per100g: { calories: 72, protein_g: 12.8, carbs_g: 2.6, fat_g: 1.0, fiber_g: 0 } },
  { names: ["seppia", "seppie"], per100g: { calories: 79, protein_g: 16.2, carbs_g: 0.8, fat_g: 0.7, fiber_g: 0 } },
  { names: ["baccala", "baccalà", "stoccafisso"], per100g: { calories: 95, protein_g: 21.8, carbs_g: 0, fat_g: 0.7, fiber_g: 0 } },
  // -- Proteine: more meats --
  { names: ["agnello", "carne di agnello", "costolette di agnello"], per100g: { calories: 206, protein_g: 20.0, carbs_g: 0, fat_g: 13.5, fiber_g: 0 } },
  { names: ["coniglio", "carne di coniglio"], per100g: { calories: 136, protein_g: 21.5, carbs_g: 0, fat_g: 5.0, fiber_g: 0 } },
  { names: ["anatra", "carne di anatra"], per100g: { calories: 201, protein_g: 18.3, carbs_g: 0, fat_g: 13.9, fiber_g: 0 } },
  { names: ["fegato", "fegato di vitello", "fegato di pollo"], per100g: { calories: 140, protein_g: 20.4, carbs_g: 3.8, fat_g: 4.7, fiber_g: 0 } },
  { names: ["cotoletta", "cotoletta impanata", "cotoletta di pollo"], per100g: { calories: 215, protein_g: 17.0, carbs_g: 12.0, fat_g: 11.0, fiber_g: 0.5 } },
  { names: ["arrosto di vitello", "arrosto"], per100g: { calories: 143, protein_g: 25.0, carbs_g: 0, fat_g: 4.5, fiber_g: 0 } },
  { names: ["spezzatino", "spezzatino di manzo"], per100g: { calories: 130, protein_g: 20.0, carbs_g: 2.0, fat_g: 4.5, fiber_g: 0.3 } },
  { names: ["coscia di pollo", "sovracoscia"], per100g: { calories: 177, protein_g: 17.3, carbs_g: 0, fat_g: 11.7, fiber_g: 0 } },
  { names: ["ali di pollo", "alette di pollo"], per100g: { calories: 191, protein_g: 17.5, carbs_g: 0, fat_g: 13.2, fiber_g: 0 } },
  // -- Proteine: more salumi --
  { names: ["mortadella"], per100g: { calories: 317, protein_g: 14.7, carbs_g: 1.5, fat_g: 28.1, fiber_g: 0 } },
  { names: ["coppa", "capocollo"], per100g: { calories: 398, protein_g: 20.3, carbs_g: 0, fat_g: 35.3, fiber_g: 0 } },
  { names: ["salame"], per100g: { calories: 392, protein_g: 22.0, carbs_g: 1.2, fat_g: 33.1, fiber_g: 0 } },
  { names: ["speck"], per100g: { calories: 303, protein_g: 28.3, carbs_g: 0.5, fat_g: 20.8, fiber_g: 0 } },
  { names: ["porchetta"], per100g: { calories: 250, protein_g: 19.0, carbs_g: 0, fat_g: 19.5, fiber_g: 0 } },
  { names: ["wurstel", "würstel", "frankfurter"], per100g: { calories: 274, protein_g: 11.2, carbs_g: 2.8, fat_g: 24.0, fiber_g: 0 } },
  { names: ["pancetta affumicata", "bacon"], per100g: { calories: 541, protein_g: 11.6, carbs_g: 0.7, fat_g: 55.0, fiber_g: 0 } },
  // -- Proteine: vegetali --
  { names: ["tempeh"], per100g: { calories: 192, protein_g: 20.3, carbs_g: 7.6, fat_g: 10.8, fiber_g: 0 } },
  { names: ["proteine in polvere", "whey", "proteine whey"], per100g: { calories: 370, protein_g: 80.0, carbs_g: 6.0, fat_g: 3.0, fiber_g: 0 } },

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
  // -- Carboidrati: more bread --
  { names: ["focaccia"], per100g: { calories: 271, protein_g: 7.0, carbs_g: 36.0, fat_g: 11.0, fiber_g: 1.8 } },
  { names: ["piadina"], per100g: { calories: 312, protein_g: 8.0, carbs_g: 46.0, fat_g: 10.5, fiber_g: 1.9 } },
  { names: ["ciabatta"], per100g: { calories: 271, protein_g: 9.0, carbs_g: 50.0, fat_g: 3.6, fiber_g: 2.0 } },
  { names: ["panino"], per100g: { calories: 280, protein_g: 9.0, carbs_g: 50.5, fat_g: 4.5, fiber_g: 2.5 } },
  { names: ["pane di segale", "pane segale"], per100g: { calories: 259, protein_g: 8.5, carbs_g: 48.3, fat_g: 3.3, fiber_g: 5.8 } },
  { names: ["pane carasau", "carasau"], per100g: { calories: 370, protein_g: 11.5, carbs_g: 72.0, fat_g: 3.5, fiber_g: 3.5 } },
  { names: ["taralli"], per100g: { calories: 440, protein_g: 9.5, carbs_g: 58.0, fat_g: 18.0, fiber_g: 2.5 } },
  // -- Carboidrati: more cereals --
  { names: ["orzo", "orzo perlato"], per100g: { calories: 319, protein_g: 10.6, carbs_g: 64.0, fat_g: 1.6, fiber_g: 9.2 } },
  { names: ["miglio"], per100g: { calories: 356, protein_g: 10.6, carbs_g: 72.9, fat_g: 3.5, fiber_g: 3.2 } },
  { names: ["amaranto"], per100g: { calories: 371, protein_g: 13.6, carbs_g: 65.3, fat_g: 7.0, fiber_g: 6.7 } },
  { names: ["corn flakes", "cereali corn flakes"], per100g: { calories: 372, protein_g: 7.0, carbs_g: 84.0, fat_g: 0.9, fiber_g: 3.3 } },
  { names: ["muesli"], per100g: { calories: 369, protein_g: 9.7, carbs_g: 66.2, fat_g: 7.8, fiber_g: 7.6 } },
  { names: ["cereali integrali"], per100g: { calories: 345, protein_g: 10.0, carbs_g: 68.0, fat_g: 3.5, fiber_g: 10.0 } },
  // -- Carboidrati: pasta ripiena --
  { names: ["tortellini"], per100g: { calories: 291, protein_g: 12.0, carbs_g: 42.0, fat_g: 8.0, fiber_g: 1.5 } },
  { names: ["ravioli"], per100g: { calories: 258, protein_g: 10.5, carbs_g: 36.0, fat_g: 7.5, fiber_g: 1.4 } },
  { names: ["lasagne sfoglia", "sfoglia per lasagne", "sfoglia"], per100g: { calories: 340, protein_g: 11.8, carbs_g: 65.0, fat_g: 3.2, fiber_g: 2.5 } },
  { names: ["gnocchi di patate"], per100g: { calories: 133, protein_g: 3.0, carbs_g: 30.0, fat_g: 0.5, fiber_g: 1.5 } },
  { names: ["pasta di legumi", "pasta di ceci", "pasta di lenticchie"], per100g: { calories: 339, protein_g: 21.0, carbs_g: 47.0, fat_g: 6.0, fiber_g: 11.0 } },

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
  // -- Latticini: more cheeses --
  { names: ["gorgonzola"], per100g: { calories: 353, protein_g: 19.4, carbs_g: 0, fat_g: 30.6, fiber_g: 0 } },
  { names: ["fontina"], per100g: { calories: 343, protein_g: 25.6, carbs_g: 1.6, fat_g: 25.6, fiber_g: 0 } },
  { names: ["asiago"], per100g: { calories: 356, protein_g: 24.6, carbs_g: 1.5, fat_g: 28.0, fiber_g: 0 } },
  { names: ["provolone"], per100g: { calories: 351, protein_g: 26.3, carbs_g: 2.1, fat_g: 26.6, fiber_g: 0 } },
  { names: ["scamorza", "scamorza affumicata"], per100g: { calories: 334, protein_g: 25.0, carbs_g: 1.0, fat_g: 25.6, fiber_g: 0 } },
  { names: ["emmental", "emmenthal"], per100g: { calories: 380, protein_g: 28.5, carbs_g: 0.4, fat_g: 29.7, fiber_g: 0 } },
  { names: ["edamer", "edam"], per100g: { calories: 357, protein_g: 24.9, carbs_g: 1.4, fat_g: 27.8, fiber_g: 0 } },
  { names: ["brie"], per100g: { calories: 334, protein_g: 20.8, carbs_g: 0.5, fat_g: 27.7, fiber_g: 0 } },
  { names: ["camembert"], per100g: { calories: 299, protein_g: 19.8, carbs_g: 0.5, fat_g: 24.3, fiber_g: 0 } },
  { names: ["mascarpone"], per100g: { calories: 429, protein_g: 4.8, carbs_g: 3.5, fat_g: 44.0, fiber_g: 0 } },
  { names: ["fiocchi di latte"], per100g: { calories: 98, protein_g: 11.1, carbs_g: 3.4, fat_g: 4.3, fiber_g: 0 } },
  { names: ["ricotta di bufala"], per100g: { calories: 180, protein_g: 9.5, carbs_g: 4.0, fat_g: 14.0, fiber_g: 0 } },
  { names: ["taleggio"], per100g: { calories: 315, protein_g: 19.0, carbs_g: 0.7, fat_g: 26.2, fiber_g: 0 } },
  { names: ["caciotta"], per100g: { calories: 364, protein_g: 23.4, carbs_g: 0.8, fat_g: 30.0, fiber_g: 0 } },
  // -- Latticini: more milk variants --
  { names: ["latte parzialmente scremato"], per100g: { calories: 46, protein_g: 3.2, carbs_g: 4.9, fat_g: 1.6, fiber_g: 0 } },
  { names: ["latte di soia", "bevanda di soia"], per100g: { calories: 33, protein_g: 2.8, carbs_g: 1.2, fat_g: 1.7, fiber_g: 0.4 } },
  { names: ["latte di mandorla", "bevanda di mandorla"], per100g: { calories: 24, protein_g: 0.5, carbs_g: 3.0, fat_g: 1.1, fiber_g: 0.2 } },
  { names: ["latte di avena", "bevanda di avena"], per100g: { calories: 43, protein_g: 0.3, carbs_g: 6.7, fat_g: 1.5, fiber_g: 0.8 } },
  { names: ["latte di riso", "bevanda di riso"], per100g: { calories: 47, protein_g: 0.3, carbs_g: 9.2, fat_g: 1.0, fiber_g: 0 } },
  { names: ["latte di cocco", "bevanda di cocco"], per100g: { calories: 197, protein_g: 2.0, carbs_g: 2.8, fat_g: 19.5, fiber_g: 0 } },
  // -- Latticini: panna --
  { names: ["panna", "panna fresca", "panna da cucina"], per100g: { calories: 292, protein_g: 2.0, carbs_g: 3.2, fat_g: 30.0, fiber_g: 0 } },
  { names: ["panna montata"], per100g: { calories: 257, protein_g: 3.2, carbs_g: 12.5, fat_g: 22.2, fiber_g: 0 } },

  // === LEGUMI (secchi) ===
  { names: ["lenticchie"], per100g: { calories: 325, protein_g: 25.0, carbs_g: 51.1, fat_g: 2.5, fiber_g: 13.8 } },
  { names: ["ceci"], per100g: { calories: 320, protein_g: 20.5, carbs_g: 46.9, fat_g: 6.0, fiber_g: 13.6 } },
  { names: ["fagioli", "fagioli borlotti"], per100g: { calories: 310, protein_g: 20.2, carbs_g: 47.5, fat_g: 2.0, fiber_g: 17.0 } },
  { names: ["fagioli cannellini"], per100g: { calories: 311, protein_g: 23.4, carbs_g: 45.5, fat_g: 1.6, fiber_g: 17.6 } },
  { names: ["piselli"], per100g: { calories: 81, protein_g: 5.4, carbs_g: 14.5, fat_g: 0.4, fiber_g: 5.1 } },
  { names: ["edamame", "soia"], per100g: { calories: 122, protein_g: 11.9, carbs_g: 8.9, fat_g: 5.2, fiber_g: 5.2 } },
  // -- Legumi: new --
  { names: ["fave", "fave secche"], per100g: { calories: 305, protein_g: 21.3, carbs_g: 49.8, fat_g: 2.0, fiber_g: 14.0 } },
  { names: ["lupini"], per100g: { calories: 114, protein_g: 16.4, carbs_g: 7.2, fat_g: 2.9, fiber_g: 2.8 } },
  { names: ["lenticchie rosse", "lenticchie decorticate"], per100g: { calories: 318, protein_g: 24.6, carbs_g: 56.3, fat_g: 1.1, fiber_g: 10.8 } },
  { names: ["fagioli neri"], per100g: { calories: 339, protein_g: 21.6, carbs_g: 62.4, fat_g: 0.9, fiber_g: 15.5 } },
  { names: ["azuki", "fagioli azuki"], per100g: { calories: 329, protein_g: 19.9, carbs_g: 62.9, fat_g: 0.5, fiber_g: 12.7 } },
  { names: ["hummus"], per100g: { calories: 166, protein_g: 8.0, carbs_g: 14.3, fat_g: 9.6, fiber_g: 6.0 } },

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
  // -- Verdure: cavoli --
  { names: ["cavolo", "cavolo cappuccio"], per100g: { calories: 25, protein_g: 1.3, carbs_g: 5.8, fat_g: 0.1, fiber_g: 2.5 } },
  { names: ["cavolo nero", "kale"], per100g: { calories: 49, protein_g: 4.3, carbs_g: 8.8, fat_g: 0.9, fiber_g: 3.6 } },
  { names: ["verza"], per100g: { calories: 27, protein_g: 2.0, carbs_g: 4.3, fat_g: 0.3, fiber_g: 2.5 } },
  { names: ["cavoletti di bruxelles", "cavolini di bruxelles"], per100g: { calories: 43, protein_g: 3.4, carbs_g: 8.9, fat_g: 0.3, fiber_g: 3.8 } },
  // -- Verdure: insalate e foglie --
  { names: ["sedano"], per100g: { calories: 16, protein_g: 0.7, carbs_g: 3.0, fat_g: 0.2, fiber_g: 1.6 } },
  { names: ["rucola"], per100g: { calories: 25, protein_g: 2.6, carbs_g: 3.7, fat_g: 0.7, fiber_g: 1.6 } },
  { names: ["radicchio"], per100g: { calories: 23, protein_g: 1.4, carbs_g: 4.5, fat_g: 0.3, fiber_g: 0.9 } },
  { names: ["bietola", "bieta", "bieta erbetta"], per100g: { calories: 19, protein_g: 1.8, carbs_g: 3.7, fat_g: 0.2, fiber_g: 1.6 } },
  // -- Verdure: other --
  { names: ["cetriolo", "cetrioli"], per100g: { calories: 12, protein_g: 0.7, carbs_g: 1.8, fat_g: 0.1, fiber_g: 0.7 } },
  { names: ["mais", "granoturco", "mais dolce"], per100g: { calories: 86, protein_g: 3.3, carbs_g: 19.0, fat_g: 1.2, fiber_g: 2.7 } },
  { names: ["olive", "olive verdi", "olive nere", "olive miste"], per100g: { calories: 145, protein_g: 1.0, carbs_g: 3.8, fat_g: 15.3, fiber_g: 3.3 } },
  { names: ["capperi"], per100g: { calories: 23, protein_g: 2.4, carbs_g: 1.7, fat_g: 0.9, fiber_g: 3.2 } },
  { names: ["zucca"], per100g: { calories: 26, protein_g: 1.0, carbs_g: 6.5, fat_g: 0.1, fiber_g: 0.5 } },
  { names: ["rape", "rapa"], per100g: { calories: 28, protein_g: 0.9, carbs_g: 6.4, fat_g: 0.1, fiber_g: 1.8 } },
  { names: ["ravanelli", "ravanello", "rapanelli"], per100g: { calories: 16, protein_g: 0.7, carbs_g: 3.4, fat_g: 0.1, fiber_g: 1.6 } },
  { names: ["porro", "porri"], per100g: { calories: 29, protein_g: 2.1, carbs_g: 5.2, fat_g: 0.3, fiber_g: 1.3 } },
  { names: ["patate fritte", "patatine fritte"], per100g: { calories: 274, protein_g: 3.4, carbs_g: 36.0, fat_g: 14.5, fiber_g: 3.8 } },
  { names: ["cime di rapa", "broccoletti"], per100g: { calories: 22, protein_g: 2.9, carbs_g: 2.0, fat_g: 0.3, fiber_g: 2.7 } },
  { names: ["funghi porcini", "porcini"], per100g: { calories: 26, protein_g: 3.7, carbs_g: 1.0, fat_g: 0.5, fiber_g: 2.0 } },
  { names: ["peperoncino", "peperoncino fresco"], per100g: { calories: 40, protein_g: 1.9, carbs_g: 8.8, fat_g: 0.4, fiber_g: 1.5 } },

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
  // -- Frutta: agrumi e altro --
  { names: ["mandarino", "mandarini", "clementine", "clementina"], per100g: { calories: 53, protein_g: 0.8, carbs_g: 13.3, fat_g: 0.3, fiber_g: 1.8 } },
  { names: ["pompelmo"], per100g: { calories: 32, protein_g: 0.6, carbs_g: 8.1, fat_g: 0.1, fiber_g: 1.1 } },
  { names: ["limone", "limoni"], per100g: { calories: 29, protein_g: 1.1, carbs_g: 9.3, fat_g: 0.3, fiber_g: 2.8 } },
  { names: ["lime"], per100g: { calories: 30, protein_g: 0.7, carbs_g: 10.5, fat_g: 0.2, fiber_g: 2.8 } },
  { names: ["albicocca", "albicocche"], per100g: { calories: 28, protein_g: 0.4, carbs_g: 6.8, fat_g: 0.1, fiber_g: 1.5 } },
  { names: ["prugna", "prugne", "susina", "susine"], per100g: { calories: 42, protein_g: 0.5, carbs_g: 10.5, fat_g: 0.1, fiber_g: 1.4 } },
  { names: ["fichi", "fico"], per100g: { calories: 47, protein_g: 0.9, carbs_g: 11.2, fat_g: 0.2, fiber_g: 2.0 } },
  { names: ["melograno"], per100g: { calories: 68, protein_g: 1.0, carbs_g: 17.2, fat_g: 0.3, fiber_g: 0.6 } },
  { names: ["ciliegie", "ciliegia"], per100g: { calories: 38, protein_g: 0.8, carbs_g: 9.0, fat_g: 0.1, fiber_g: 1.3 } },
  { names: ["cocco", "noce di cocco", "cocco fresco", "cocco rapè", "cocco grattugiato"], per100g: { calories: 354, protein_g: 3.3, carbs_g: 6.2, fat_g: 33.5, fiber_g: 9.0 } },
  // -- Frutta: frutti di bosco e frutta secca --
  { names: ["lamponi"], per100g: { calories: 34, protein_g: 1.0, carbs_g: 6.5, fat_g: 0.3, fiber_g: 7.4 } },
  { names: ["more"], per100g: { calories: 36, protein_g: 1.4, carbs_g: 6.2, fat_g: 0.4, fiber_g: 5.3 } },
  { names: ["datteri", "dattero"], per100g: { calories: 277, protein_g: 1.8, carbs_g: 75.0, fat_g: 0.2, fiber_g: 6.7 } },
  { names: ["fichi secchi"], per100g: { calories: 249, protein_g: 3.3, carbs_g: 63.9, fat_g: 0.9, fiber_g: 9.8 } },
  { names: ["prugne secche"], per100g: { calories: 240, protein_g: 2.2, carbs_g: 63.9, fat_g: 0.4, fiber_g: 7.1 } },
  { names: ["uvetta", "uva passa", "uva sultanina"], per100g: { calories: 299, protein_g: 3.1, carbs_g: 79.2, fat_g: 0.5, fiber_g: 3.7 } },
  // -- Frutta: anguria e melone --
  { names: ["anguria", "cocomero"], per100g: { calories: 30, protein_g: 0.6, carbs_g: 7.6, fat_g: 0.2, fiber_g: 0.4 } },
  { names: ["melone"], per100g: { calories: 34, protein_g: 0.8, carbs_g: 8.2, fat_g: 0.2, fiber_g: 0.9 } },
  { names: ["cachi", "caco", "kaki"], per100g: { calories: 65, protein_g: 0.6, carbs_g: 15.3, fat_g: 0.3, fiber_g: 2.5 } },

  // === GRASSI E FRUTTA SECCA ===
  { names: ["olio d'oliva", "olio di oliva", "olio evo", "olio"], per100g: { calories: 884, protein_g: 0, carbs_g: 0, fat_g: 100, fiber_g: 0 } },
  { names: ["mandorle"], per100g: { calories: 603, protein_g: 22.0, carbs_g: 4.6, fat_g: 55.3, fiber_g: 12.2 } },
  { names: ["noci"], per100g: { calories: 654, protein_g: 15.2, carbs_g: 5.6, fat_g: 65.2, fiber_g: 6.7 } },
  { names: ["arachidi", "noccioline"], per100g: { calories: 567, protein_g: 25.8, carbs_g: 7.6, fat_g: 49.2, fiber_g: 8.5 } },
  { names: ["avocado"], per100g: { calories: 160, protein_g: 2.0, carbs_g: 1.8, fat_g: 14.7, fiber_g: 6.7 } },
  { names: ["burro di arachidi", "burro d'arachidi"], per100g: { calories: 588, protein_g: 25.1, carbs_g: 8.5, fat_g: 50.4, fiber_g: 6.0 } },
  { names: ["semi di chia", "chia"], per100g: { calories: 486, protein_g: 16.5, carbs_g: 7.7, fat_g: 30.7, fiber_g: 34.4 } },
  // -- Grassi: more frutta secca --
  { names: ["nocciole"], per100g: { calories: 628, protein_g: 14.9, carbs_g: 6.0, fat_g: 60.8, fiber_g: 9.7 } },
  { names: ["pistacchi"], per100g: { calories: 562, protein_g: 20.2, carbs_g: 17.9, fat_g: 45.3, fiber_g: 10.6 } },
  { names: ["pinoli"], per100g: { calories: 673, protein_g: 13.7, carbs_g: 3.6, fat_g: 68.4, fiber_g: 3.7 } },
  { names: ["anacardi"], per100g: { calories: 553, protein_g: 18.2, carbs_g: 26.9, fat_g: 43.9, fiber_g: 3.3 } },
  { names: ["noci di macadamia", "macadamia"], per100g: { calories: 718, protein_g: 7.9, carbs_g: 5.2, fat_g: 75.8, fiber_g: 8.6 } },
  { names: ["noci pecan", "pecan"], per100g: { calories: 691, protein_g: 9.2, carbs_g: 4.3, fat_g: 72.0, fiber_g: 9.6 } },
  { names: ["semi di lino", "lino"], per100g: { calories: 534, protein_g: 18.3, carbs_g: 1.6, fat_g: 42.2, fiber_g: 27.3 } },
  { names: ["semi di zucca"], per100g: { calories: 559, protein_g: 30.2, carbs_g: 4.7, fat_g: 49.1, fiber_g: 6.0 } },
  { names: ["semi di girasole"], per100g: { calories: 584, protein_g: 20.8, carbs_g: 11.4, fat_g: 51.5, fiber_g: 8.6 } },
  { names: ["semi di sesamo", "sesamo"], per100g: { calories: 573, protein_g: 17.7, carbs_g: 10.2, fat_g: 49.7, fiber_g: 11.8 } },
  // -- Grassi: oli e altro --
  { names: ["olio di semi", "olio di semi di girasole", "olio di girasole"], per100g: { calories: 884, protein_g: 0, carbs_g: 0, fat_g: 100, fiber_g: 0 } },
  { names: ["olio di cocco"], per100g: { calories: 862, protein_g: 0, carbs_g: 0, fat_g: 100, fiber_g: 0 } },
  { names: ["tahina", "tahini", "crema di sesamo"], per100g: { calories: 595, protein_g: 17.0, carbs_g: 11.9, fat_g: 53.8, fiber_g: 9.3 } },
  // -- Grassi: cioccolato --
  { names: ["cioccolato al latte"], per100g: { calories: 545, protein_g: 7.6, carbs_g: 56.5, fat_g: 31.8, fiber_g: 1.5 } },
  { names: ["cioccolato bianco"], per100g: { calories: 539, protein_g: 5.9, carbs_g: 59.2, fat_g: 32.1, fiber_g: 0 } },

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
  { names: ["polenta"], per100g: { calories: 64, protein_g: 1.4, carbs_g: 13.7, fat_g: 0.3, fiber_g: 0.7 } },
  { names: ["crackers", "cracker"], per100g: { calories: 455, protein_g: 9.4, carbs_g: 68.0, fat_g: 15.0, fiber_g: 2.5 } },
  { names: ["grissini"], per100g: { calories: 412, protein_g: 12.3, carbs_g: 68.4, fat_g: 10.0, fiber_g: 3.0 } },
  { names: ["tonno sott'olio", "tonno in olio"], per100g: { calories: 198, protein_g: 25.2, carbs_g: 0, fat_g: 10.4, fiber_g: 0 } },
  { names: ["tofu"], per100g: { calories: 76, protein_g: 8.1, carbs_g: 1.9, fat_g: 4.8, fiber_g: 0.3 } },
  { names: ["seitan"], per100g: { calories: 122, protein_g: 21.2, carbs_g: 3.7, fat_g: 1.9, fiber_g: 0.6 } },

  // === CONDIMENTI E SALSE ===
  { names: ["maionese"], per100g: { calories: 680, protein_g: 1.0, carbs_g: 0.6, fat_g: 75.0, fiber_g: 0 } },
  { names: ["ketchup"], per100g: { calories: 112, protein_g: 1.7, carbs_g: 25.8, fat_g: 0.1, fiber_g: 0.3 } },
  { names: ["senape", "mostarda"], per100g: { calories: 66, protein_g: 4.4, carbs_g: 5.3, fat_g: 3.3, fiber_g: 3.3 } },
  { names: ["salsa di soia", "soia salsa"], per100g: { calories: 53, protein_g: 5.6, carbs_g: 4.9, fat_g: 0.1, fiber_g: 0.8 } },
  { names: ["aceto balsamico", "balsamico"], per100g: { calories: 88, protein_g: 0.5, carbs_g: 17.0, fat_g: 0, fiber_g: 0 } },
  { names: ["aceto di mele"], per100g: { calories: 21, protein_g: 0, carbs_g: 0.9, fat_g: 0, fiber_g: 0 } },
  { names: ["aceto", "aceto di vino"], per100g: { calories: 18, protein_g: 0, carbs_g: 0.6, fat_g: 0, fiber_g: 0 } },
  { names: ["besciamella", "salsa besciamella"], per100g: { calories: 120, protein_g: 4.0, carbs_g: 8.5, fat_g: 7.5, fiber_g: 0.2 } },
  { names: ["ragu", "ragù di carne", "ragù bolognese", "ragu bolognese"], per100g: { calories: 102, protein_g: 7.5, carbs_g: 4.0, fat_g: 6.0, fiber_g: 0.8 } },
  { names: ["concentrato di pomodoro"], per100g: { calories: 82, protein_g: 4.3, carbs_g: 17.0, fat_g: 0.5, fiber_g: 3.9 } },
  { names: ["pomodori secchi"], per100g: { calories: 258, protein_g: 14.1, carbs_g: 43.5, fat_g: 3.0, fiber_g: 12.3 } },
  { names: ["pomodori pelati"], per100g: { calories: 24, protein_g: 1.0, carbs_g: 4.0, fat_g: 0.2, fiber_g: 1.2 } },
  { names: ["zucchero", "zucchero bianco"], per100g: { calories: 400, protein_g: 0, carbs_g: 100, fat_g: 0, fiber_g: 0 } },
  { names: ["zucchero di canna"], per100g: { calories: 380, protein_g: 0, carbs_g: 98.1, fat_g: 0, fiber_g: 0 } },
  { names: ["sciroppo d'acero", "sciroppo di acero", "maple syrup"], per100g: { calories: 260, protein_g: 0, carbs_g: 67.0, fat_g: 0.1, fiber_g: 0 } },
  { names: ["pesto rosso"], per100g: { calories: 301, protein_g: 4.0, carbs_g: 10.0, fat_g: 27.0, fiber_g: 2.5 } },
  { names: ["salsa tonnata"], per100g: { calories: 210, protein_g: 10.0, carbs_g: 2.5, fat_g: 18.0, fiber_g: 0 } },

  // === PIATTI PRONTI / PREPARATI ===
  // -- Pizza --
  { names: ["pizza margherita", "margherita"], per100g: { calories: 237, protein_g: 10.2, carbs_g: 30.0, fat_g: 8.5, fiber_g: 1.8 } },
  { names: ["pizza marinara"], per100g: { calories: 199, protein_g: 5.8, carbs_g: 33.5, fat_g: 4.8, fiber_g: 2.0 } },
  { names: ["pizza quattro formaggi", "pizza 4 formaggi"], per100g: { calories: 275, protein_g: 12.8, carbs_g: 26.0, fat_g: 13.5, fiber_g: 1.2 } },
  { names: ["pizza capricciosa"], per100g: { calories: 230, protein_g: 10.5, carbs_g: 28.0, fat_g: 8.5, fiber_g: 1.5 } },
  { names: ["pizza diavola", "pizza salame piccante"], per100g: { calories: 260, protein_g: 11.5, carbs_g: 28.0, fat_g: 11.5, fiber_g: 1.5 } },
  { names: ["pizza prosciutto e funghi"], per100g: { calories: 220, protein_g: 11.0, carbs_g: 28.5, fat_g: 7.0, fiber_g: 1.8 } },
  { names: ["pizza bianca"], per100g: { calories: 280, protein_g: 7.5, carbs_g: 38.0, fat_g: 11.0, fiber_g: 1.5 } },
  // -- Pasta al forno --
  { names: ["lasagna", "lasagne"], per100g: { calories: 140, protein_g: 8.5, carbs_g: 12.5, fat_g: 6.5, fiber_g: 0.8 } },
  { names: ["cannelloni"], per100g: { calories: 138, protein_g: 7.8, carbs_g: 12.0, fat_g: 6.8, fiber_g: 0.7 } },
  { names: ["pasta al forno"], per100g: { calories: 155, protein_g: 8.0, carbs_g: 16.0, fat_g: 6.5, fiber_g: 1.0 } },
  // -- Risotti --
  { names: ["risotto", "risotto base", "risotto in bianco"], per100g: { calories: 130, protein_g: 2.8, carbs_g: 21.0, fat_g: 3.8, fiber_g: 0.3 } },
  { names: ["risotto ai funghi"], per100g: { calories: 125, protein_g: 3.2, carbs_g: 20.0, fat_g: 3.5, fiber_g: 0.5 } },
  { names: ["risotto alla milanese"], per100g: { calories: 140, protein_g: 3.0, carbs_g: 21.5, fat_g: 4.5, fiber_g: 0.2 } },
  // -- Zuppe --
  { names: ["minestrone"], per100g: { calories: 38, protein_g: 1.8, carbs_g: 6.0, fat_g: 0.8, fiber_g: 1.5 } },
  { names: ["zuppa di verdure"], per100g: { calories: 35, protein_g: 1.5, carbs_g: 5.5, fat_g: 0.8, fiber_g: 1.3 } },
  { names: ["zuppa di legumi"], per100g: { calories: 75, protein_g: 4.5, carbs_g: 11.0, fat_g: 1.5, fiber_g: 3.5 } },
  { names: ["passato di verdure"], per100g: { calories: 40, protein_g: 1.5, carbs_g: 5.8, fat_g: 1.2, fiber_g: 1.2 } },
  { names: ["vellutata", "crema di verdure"], per100g: { calories: 48, protein_g: 1.2, carbs_g: 6.0, fat_g: 2.2, fiber_g: 1.0 } },
  // -- Secondi preparati --
  { names: ["cotoletta alla milanese"], per100g: { calories: 245, protein_g: 18.0, carbs_g: 11.0, fat_g: 14.5, fiber_g: 0.4 } },
  { names: ["pollo arrosto"], per100g: { calories: 167, protein_g: 25.0, carbs_g: 0, fat_g: 7.5, fiber_g: 0 } },
  { names: ["pollo alla piastra", "pollo grigliato"], per100g: { calories: 150, protein_g: 26.0, carbs_g: 0, fat_g: 4.8, fiber_g: 0 } },
  { names: ["caprese", "insalata caprese"], per100g: { calories: 170, protein_g: 10.5, carbs_g: 2.5, fat_g: 13.5, fiber_g: 0.5 } },
  { names: ["bruschetta"], per100g: { calories: 180, protein_g: 4.5, carbs_g: 24.0, fat_g: 7.5, fiber_g: 1.8 } },
  { names: ["crostini"], per100g: { calories: 380, protein_g: 10.0, carbs_g: 58.0, fat_g: 12.5, fiber_g: 2.8 } },
  { names: ["supli", "supplì", "supplì di riso"], per100g: { calories: 220, protein_g: 7.5, carbs_g: 24.0, fat_g: 10.5, fiber_g: 0.8 } },
  { names: ["arancini", "arancino", "arancine"], per100g: { calories: 230, protein_g: 6.5, carbs_g: 28.0, fat_g: 10.0, fiber_g: 1.0 } },
  { names: ["parmigiana di melanzane", "parmigiana", "melanzane alla parmigiana"], per100g: { calories: 155, protein_g: 6.5, carbs_g: 8.0, fat_g: 11.0, fiber_g: 1.8 } },
  { names: ["pasta e fagioli"], per100g: { calories: 95, protein_g: 4.5, carbs_g: 14.0, fat_g: 2.5, fiber_g: 3.0 } },
  { names: ["pasta e ceci"], per100g: { calories: 110, protein_g: 5.0, carbs_g: 16.5, fat_g: 3.0, fiber_g: 2.5 } },
  { names: ["carbonara", "pasta alla carbonara"], per100g: { calories: 172, protein_g: 8.0, carbs_g: 18.0, fat_g: 7.8, fiber_g: 0.7 } },
  { names: ["amatriciana", "pasta all'amatriciana"], per100g: { calories: 155, protein_g: 5.5, carbs_g: 19.0, fat_g: 6.5, fiber_g: 1.0 } },
  { names: ["cacio e pepe", "pasta cacio e pepe"], per100g: { calories: 185, protein_g: 8.5, carbs_g: 20.0, fat_g: 8.0, fiber_g: 0.8 } },
  { names: ["polpette"], per100g: { calories: 195, protein_g: 14.5, carbs_g: 7.0, fat_g: 12.0, fiber_g: 0.5 } },
  { names: ["polpettone"], per100g: { calories: 180, protein_g: 15.0, carbs_g: 6.5, fat_g: 10.5, fiber_g: 0.5 } },
  { names: ["frittata", "frittata di uova"], per100g: { calories: 160, protein_g: 10.5, carbs_g: 1.5, fat_g: 12.5, fiber_g: 0.3 } },
  { names: ["insalata di riso"], per100g: { calories: 145, protein_g: 3.0, carbs_g: 22.0, fat_g: 5.0, fiber_g: 1.0 } },
  { names: ["tramezzino"], per100g: { calories: 230, protein_g: 8.5, carbs_g: 25.0, fat_g: 11.0, fiber_g: 1.2 } },
  { names: ["panino con prosciutto e formaggio", "panino imbottito"], per100g: { calories: 260, protein_g: 14.0, carbs_g: 28.0, fat_g: 10.5, fiber_g: 1.5 } },
  { names: ["wrap", "piadina farcita", "wrap farcito"], per100g: { calories: 240, protein_g: 10.0, carbs_g: 28.0, fat_g: 9.5, fiber_g: 1.8 } },
  { names: ["pasta al pesto"], per100g: { calories: 190, protein_g: 6.5, carbs_g: 24.0, fat_g: 7.5, fiber_g: 1.5 } },
  { names: ["pasta al pomodoro"], per100g: { calories: 135, protein_g: 4.5, carbs_g: 23.0, fat_g: 3.0, fiber_g: 1.5 } },
  { names: ["pasta alle vongole", "spaghetti alle vongole"], per100g: { calories: 130, protein_g: 6.5, carbs_g: 18.0, fat_g: 3.5, fiber_g: 0.8 } },
  { names: ["gnocchi al pomodoro"], per100g: { calories: 110, protein_g: 3.0, carbs_g: 20.0, fat_g: 2.0, fiber_g: 1.5 } },
  { names: ["pesce al forno", "filetto di pesce al forno"], per100g: { calories: 105, protein_g: 19.0, carbs_g: 1.5, fat_g: 2.5, fiber_g: 0 } },
  { names: ["involtini", "involtini di carne"], per100g: { calories: 180, protein_g: 16.0, carbs_g: 3.0, fat_g: 11.5, fiber_g: 0.3 } },
  { names: ["saltimbocca alla romana", "saltimbocca"], per100g: { calories: 185, protein_g: 22.0, carbs_g: 1.0, fat_g: 10.5, fiber_g: 0 } },
  { names: ["vitello tonnato"], per100g: { calories: 170, protein_g: 18.0, carbs_g: 1.5, fat_g: 10.0, fiber_g: 0 } },
  { names: ["caponata"], per100g: { calories: 65, protein_g: 1.2, carbs_g: 7.5, fat_g: 3.5, fiber_g: 2.0 } },
  { names: ["peperonata"], per100g: { calories: 55, protein_g: 1.0, carbs_g: 6.0, fat_g: 3.0, fiber_g: 1.5 } },
  { names: ["verdure grigliate", "verdure alla griglia"], per100g: { calories: 50, protein_g: 1.5, carbs_g: 5.0, fat_g: 3.0, fiber_g: 2.0 } },

  // === DOLCI E SNACK ===
  { names: ["cornetto", "brioche"], per100g: { calories: 360, protein_g: 6.0, carbs_g: 48.0, fat_g: 16.0, fiber_g: 1.5 } },
  { names: ["cornetto alla crema"], per100g: { calories: 340, protein_g: 7.5, carbs_g: 43.0, fat_g: 15.5, fiber_g: 1.0 } },
  { names: ["cornetto al cioccolato"], per100g: { calories: 380, protein_g: 7.0, carbs_g: 47.0, fat_g: 18.0, fiber_g: 1.8 } },
  { names: ["biscotti secchi", "biscotti"], per100g: { calories: 416, protein_g: 7.0, carbs_g: 72.0, fat_g: 10.5, fiber_g: 2.0 } },
  { names: ["biscotti frollini", "frollini"], per100g: { calories: 475, protein_g: 6.5, carbs_g: 65.0, fat_g: 20.0, fiber_g: 1.8 } },
  { names: ["biscotti integrali"], per100g: { calories: 440, protein_g: 8.0, carbs_g: 65.0, fat_g: 16.0, fiber_g: 5.0 } },
  { names: ["tiramisu", "tiramisù"], per100g: { calories: 283, protein_g: 6.5, carbs_g: 28.0, fat_g: 16.0, fiber_g: 0.5 } },
  { names: ["panna cotta"], per100g: { calories: 230, protein_g: 3.0, carbs_g: 25.0, fat_g: 13.5, fiber_g: 0 } },
  { names: ["budino"], per100g: { calories: 120, protein_g: 3.2, carbs_g: 19.0, fat_g: 3.5, fiber_g: 0 } },
  { names: ["gelato alla crema", "gelato crema"], per100g: { calories: 210, protein_g: 3.8, carbs_g: 24.0, fat_g: 11.0, fiber_g: 0 } },
  { names: ["gelato alla frutta", "gelato frutta", "sorbetto alla frutta"], per100g: { calories: 130, protein_g: 1.5, carbs_g: 28.0, fat_g: 1.5, fiber_g: 0.5 } },
  { names: ["sorbetto"], per100g: { calories: 105, protein_g: 0.3, carbs_g: 26.5, fat_g: 0, fiber_g: 0.3 } },
  { names: ["gelato al cioccolato"], per100g: { calories: 216, protein_g: 3.8, carbs_g: 28.0, fat_g: 10.0, fiber_g: 1.0 } },
  { names: ["torta di mele"], per100g: { calories: 265, protein_g: 3.5, carbs_g: 38.0, fat_g: 11.0, fiber_g: 1.5 } },
  { names: ["crostata", "crostata di marmellata"], per100g: { calories: 340, protein_g: 4.5, carbs_g: 52.0, fat_g: 13.0, fiber_g: 1.2 } },
  { names: ["torta al cioccolato"], per100g: { calories: 370, protein_g: 5.5, carbs_g: 45.0, fat_g: 19.0, fiber_g: 2.0 } },
  { names: ["cheesecake"], per100g: { calories: 321, protein_g: 5.5, carbs_g: 26.0, fat_g: 22.5, fiber_g: 0.5 } },
  { names: ["merendina", "merendine"], per100g: { calories: 410, protein_g: 5.5, carbs_g: 58.0, fat_g: 18.0, fiber_g: 1.2 } },
  { names: ["crostatina"], per100g: { calories: 380, protein_g: 4.5, carbs_g: 55.0, fat_g: 16.0, fiber_g: 1.0 } },
  { names: ["barretta di cereali", "barretta cereali"], per100g: { calories: 390, protein_g: 6.0, carbs_g: 65.0, fat_g: 12.0, fiber_g: 4.0 } },
  { names: ["barretta proteica"], per100g: { calories: 350, protein_g: 30.0, carbs_g: 30.0, fat_g: 10.0, fiber_g: 5.0 } },
  { names: ["ciambella", "donut", "ciambellone"], per100g: { calories: 397, protein_g: 5.0, carbs_g: 51.0, fat_g: 19.5, fiber_g: 1.0 } },
  { names: ["muffin"], per100g: { calories: 340, protein_g: 5.5, carbs_g: 48.0, fat_g: 14.5, fiber_g: 1.2 } },
  { names: ["pancake"], per100g: { calories: 227, protein_g: 6.4, carbs_g: 28.5, fat_g: 10.0, fiber_g: 0.8 } },
  { names: ["wafer"], per100g: { calories: 498, protein_g: 5.0, carbs_g: 62.0, fat_g: 25.5, fiber_g: 0.8 } },
  { names: ["plumcake"], per100g: { calories: 360, protein_g: 5.0, carbs_g: 50.0, fat_g: 16.0, fiber_g: 1.0 } },
  { names: ["torrone"], per100g: { calories: 479, protein_g: 10.0, carbs_g: 52.0, fat_g: 26.0, fiber_g: 2.5 } },
  { names: ["panettone"], per100g: { calories: 360, protein_g: 7.0, carbs_g: 52.0, fat_g: 14.0, fiber_g: 1.5 } },
  { names: ["pandoro"], per100g: { calories: 415, protein_g: 8.0, carbs_g: 52.0, fat_g: 19.5, fiber_g: 1.0 } },
  { names: ["colomba", "colomba pasquale"], per100g: { calories: 380, protein_g: 7.5, carbs_g: 52.0, fat_g: 16.0, fiber_g: 1.5 } },
  { names: ["cannolo", "cannoli", "cannolo siciliano"], per100g: { calories: 310, protein_g: 8.0, carbs_g: 32.0, fat_g: 17.5, fiber_g: 0.5 } },
  { names: ["sfogliatella"], per100g: { calories: 345, protein_g: 6.5, carbs_g: 42.0, fat_g: 17.5, fiber_g: 0.8 } },
  { names: ["baba", "babà", "babà al rum"], per100g: { calories: 268, protein_g: 5.5, carbs_g: 38.0, fat_g: 10.0, fiber_g: 0.5 } },
  { names: ["patatine", "patatine in busta", "chips"], per100g: { calories: 536, protein_g: 6.5, carbs_g: 52.0, fat_g: 34.0, fiber_g: 4.5 } },
  { names: ["pop corn", "popcorn"], per100g: { calories: 387, protein_g: 12.9, carbs_g: 77.8, fat_g: 4.5, fiber_g: 14.5 } },

  // === BEVANDE ===
  { names: ["succo d'arancia", "succo di arancia", "spremuta d'arancia", "spremuta"], per100g: { calories: 45, protein_g: 0.7, carbs_g: 10.4, fat_g: 0.2, fiber_g: 0.2 } },
  { names: ["succo di frutta"], per100g: { calories: 46, protein_g: 0.3, carbs_g: 11.0, fat_g: 0.1, fiber_g: 0.2 } },
  { names: ["coca cola", "cola"], per100g: { calories: 42, protein_g: 0, carbs_g: 10.6, fat_g: 0, fiber_g: 0 } },
  { names: ["aranciata", "fanta"], per100g: { calories: 42, protein_g: 0, carbs_g: 10.3, fat_g: 0, fiber_g: 0 } },
  { names: ["te freddo", "tè freddo", "the freddo"], per100g: { calories: 28, protein_g: 0, carbs_g: 7.0, fat_g: 0, fiber_g: 0 } },
  { names: ["energy drink", "bevanda energetica", "redbull", "red bull"], per100g: { calories: 46, protein_g: 0, carbs_g: 11.3, fat_g: 0, fiber_g: 0 } },
  { names: ["birra"], per100g: { calories: 43, protein_g: 0.3, carbs_g: 3.6, fat_g: 0, fiber_g: 0 } },
  { names: ["vino rosso"], per100g: { calories: 83, protein_g: 0.1, carbs_g: 2.6, fat_g: 0, fiber_g: 0 } },
  { names: ["vino bianco"], per100g: { calories: 82, protein_g: 0.1, carbs_g: 2.6, fat_g: 0, fiber_g: 0 } },
  { names: ["prosecco"], per100g: { calories: 75, protein_g: 0.1, carbs_g: 1.5, fat_g: 0, fiber_g: 0 } },
  { names: ["spritz", "aperol spritz"], per100g: { calories: 90, protein_g: 0, carbs_g: 7.0, fat_g: 0, fiber_g: 0 } },
  { names: ["aperol"], per100g: { calories: 110, protein_g: 0, carbs_g: 15.0, fat_g: 0, fiber_g: 0 } },
  { names: ["caffe", "caffè", "espresso", "caffé"], per100g: { calories: 2, protein_g: 0.1, carbs_g: 0, fat_g: 0, fiber_g: 0 } },
  { names: ["cappuccino"], per100g: { calories: 45, protein_g: 2.0, carbs_g: 4.5, fat_g: 2.0, fiber_g: 0 } },
  { names: ["latte macchiato", "caffelatte"], per100g: { calories: 48, protein_g: 2.5, carbs_g: 4.8, fat_g: 2.0, fiber_g: 0 } },
  { names: ["caffe latte", "caffè latte", "caffellatte"], per100g: { calories: 40, protein_g: 2.2, carbs_g: 4.5, fat_g: 1.5, fiber_g: 0 } },
  { names: ["te", "tè", "the", "tè verde", "tè nero"], per100g: { calories: 1, protein_g: 0, carbs_g: 0.3, fat_g: 0, fiber_g: 0 } },
  { names: ["tisana", "infuso"], per100g: { calories: 1, protein_g: 0, carbs_g: 0.2, fat_g: 0, fiber_g: 0 } },
  { names: ["camomilla"], per100g: { calories: 1, protein_g: 0, carbs_g: 0.2, fat_g: 0, fiber_g: 0 } },
  { names: ["acqua tonica"], per100g: { calories: 34, protein_g: 0, carbs_g: 8.8, fat_g: 0, fiber_g: 0 } },
  { names: ["ginger ale", "ginger beer"], per100g: { calories: 34, protein_g: 0, carbs_g: 8.7, fat_g: 0, fiber_g: 0 } },
  { names: ["limonata"], per100g: { calories: 40, protein_g: 0, carbs_g: 10.0, fat_g: 0, fiber_g: 0 } },
  { names: ["succo di mela"], per100g: { calories: 46, protein_g: 0.1, carbs_g: 11.3, fat_g: 0.1, fiber_g: 0.1 } },
  { names: ["smoothie", "frullato di frutta"], per100g: { calories: 55, protein_g: 0.8, carbs_g: 12.5, fat_g: 0.3, fiber_g: 0.8 } },

  // === COLAZIONE SPECIFICA ===
  { names: ["cereali con latte"], per100g: { calories: 165, protein_g: 4.5, carbs_g: 30.0, fat_g: 2.5, fiber_g: 2.0 } },
  { names: ["porridge", "porridge di avena"], per100g: { calories: 71, protein_g: 2.5, carbs_g: 12.0, fat_g: 1.5, fiber_g: 1.7 } },
  { names: ["overnight oats"], per100g: { calories: 120, protein_g: 4.0, carbs_g: 18.0, fat_g: 3.5, fiber_g: 2.5 } },
  { names: ["pancake proteici"], per100g: { calories: 160, protein_g: 18.0, carbs_g: 12.0, fat_g: 4.5, fiber_g: 1.0 } },
  { names: ["yogurt con frutta"], per100g: { calories: 85, protein_g: 3.5, carbs_g: 14.0, fat_g: 1.5, fiber_g: 0.5 } },
  { names: ["yogurt con cereali", "yogurt e cereali", "yogurt e muesli"], per100g: { calories: 120, protein_g: 4.5, carbs_g: 18.5, fat_g: 3.0, fiber_g: 1.5 } },
  { names: ["frullato proteico", "shake proteico", "protein shake"], per100g: { calories: 80, protein_g: 12.0, carbs_g: 5.0, fat_g: 1.5, fiber_g: 0.3 } },
  { names: ["pane e marmellata"], per100g: { calories: 260, protein_g: 4.5, carbs_g: 55.0, fat_g: 1.8, fiber_g: 2.0 } },
  { names: ["pane e nutella"], per100g: { calories: 380, protein_g: 7.0, carbs_g: 53.0, fat_g: 15.5, fiber_g: 2.2 } },
  { names: ["pane burro e marmellata"], per100g: { calories: 310, protein_g: 4.0, carbs_g: 48.0, fat_g: 12.0, fiber_g: 1.8 } },
  { names: ["yogurt greco con miele"], per100g: { calories: 100, protein_g: 7.5, carbs_g: 13.5, fat_g: 0.8, fiber_g: 0 } },

  // === EXTRA / VARIE ===
  { names: ["farina 00", "farina"], per100g: { calories: 340, protein_g: 11.0, carbs_g: 72.0, fat_g: 1.0, fiber_g: 2.7 } },
  { names: ["farina integrale"], per100g: { calories: 339, protein_g: 13.2, carbs_g: 61.5, fat_g: 2.5, fiber_g: 10.7 } },
  { names: ["cacao amaro", "cacao in polvere"], per100g: { calories: 228, protein_g: 19.6, carbs_g: 13.7, fat_g: 13.7, fiber_g: 33.2 } },
  { names: ["formaggio fuso", "sottiletta", "sottilette"], per100g: { calories: 280, protein_g: 16.5, carbs_g: 5.5, fat_g: 21.5, fiber_g: 0 } },
  { names: ["yogurt alla frutta"], per100g: { calories: 82, protein_g: 3.2, carbs_g: 13.5, fat_g: 1.6, fiber_g: 0.2 } },
  { names: ["skyr"], per100g: { calories: 63, protein_g: 11.0, carbs_g: 3.8, fat_g: 0.2, fiber_g: 0 } },
  { names: ["kefir"], per100g: { calories: 55, protein_g: 3.3, carbs_g: 4.5, fat_g: 2.5, fiber_g: 0 } },
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
