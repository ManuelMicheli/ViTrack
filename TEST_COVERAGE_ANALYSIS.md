# Test Coverage Analysis

## Current State

ViTrack has **zero automated tests**. There is no test framework, no test files, no testing dependencies, and no CI pipeline. The only validation is `npm run build` (TypeScript strict mode) and `npm run lint` (ESLint). This catches type errors and lint violations but cannot catch logic bugs, regressions, or edge cases.

---

## Priority Areas for Testing

### Priority 1 — Pure Logic (No Mocking Required)

These modules contain deterministic, side-effect-free logic that can be tested immediately with no mocking or infrastructure.

#### 1. `src/lib/exercise-parser.ts` — `parseExerciseLocal()`

**Why:** This regex-based parser handles all gym exercise input. A single broken regex silently corrupts every workout logged through both Telegram and the web chat.

**What to test:**
- Standard input: `"panca piana 4x8 80kg"` → name/sets/reps/weight
- Alias resolution: `"pull up 3x10"` → `"Trazioni"`, `"lat 4x12 60kg"` → `"Lat machine"`
- Partial input: `"squat 100kg"` → defaults sets=3, reps=10
- Weight with comma: `"curl 12,5kg"` → 12.5
- Unicode multiply: `"panca 4×8 80kg"` (× vs x)
- No alias match: `"esercizio sconosciuto 3x10"` → capitalized name
- Edge cases: empty string, single character, numbers only, no exercise name after extraction
- Longest-match alias: `"panca inclinata 3x8"` should match `"panca inclinata"` not `"panca"`

**Estimated tests:** ~15–20

---

#### 2. `src/lib/cooking-factors.ts` — `adjustForCooking()`

**Why:** Incorrect cooking conversion silently doubles or halves calorie counts. A user logging "200g pasta cotta" needs accurate raw-weight conversion for the nutrition lookup.

**What to test:**
- Pasta cooked: `("pasta", 200, true)` → `87g raw` (÷ 2.3)
- Rice cooked: `("riso basmati", 300, true)` → `100g raw` (÷ 3.0)
- Meat cooked: `("petto di pollo", 150, true)` → `200g raw` (÷ 0.75)
- Fish cooked: `("salmone", 170, true)` → `200g raw` (÷ 0.85)
- Not cooked: `("pasta", 100, false)` → `100g` unchanged, factor=1
- No match: `("cioccolato", 50, true)` → `50g` unchanged, factor=1
- Keyword within longer name: `("fusilli integrali", 200, true)` → matches "fusilli" → pasta factor
- Case insensitivity: `("RISO", 300, true)` → matches rice factor

**Estimated tests:** ~12–15

---

#### 3. `src/lib/italian-foods.ts` — `lookupItalianFood()`

**Why:** The CREA database is the fastest nutrition source (zero API calls). If lookups break or return wrong data, every meal that hits the local DB gets wrong macros — and the error is invisible because no external API is involved.

**What to test:**
- Exact match: `("petto di pollo", 150)` → scaled from per-100g values
- Alias match: `("pollo", 100)` → same as "petto di pollo"
- English alias: `("chicken breast", 200)` → matches
- No match: `("cibo inventato", 100)` → null
- Gram scaling accuracy: `("uovo", 60)` → 0.6× the per-100g values
- Zero grams: `("pasta", 0)` → all zeros
- Rounding behavior consistency

**Estimated tests:** ~10–12

---

#### 4. `src/lib/nutrition.ts` — `atwaterCheck()` and `scaleResult()`

**Why:** The Atwater check is the gatekeeper for all external nutrition data. If it's too strict, valid foods are rejected; too loose, garbage data gets through. `scaleResult()` is called on every single nutrition lookup.

**What to test (atwaterCheck):**
- Valid result: `{calories: 110, protein_g: 23, carbs_g: 0, fat_g: 2}` → true
- All zeros: `{calories: 0, protein_g: 0, ...}` → true
- Zero calories with non-zero macros: → false
- Edge of range (ratio = 0.55, ratio = 1.45): boundary behavior
- Typical failing data: API returning nonsensical values

**What to test (scaleResult):**
- Scale 100g → 100g: identity
- Scale 100g → 200g: all values doubled
- Scale 100g → 50g: all values halved
- Rounding: `protein_g: 23.3 * 1.5` → correct decimal truncation
- Source field preserved through scaling

**Estimated tests:** ~12–15

> **Note:** `atwaterCheck` and `scaleResult` are not currently exported. They would need to be exported (or tested indirectly through `lookupNutrients`) to unit test directly.

---

### Priority 2 — Business Logic (Requires Mocking DB/APIs)

These modules contain critical business logic but depend on Supabase or external APIs. They need a mocking strategy (e.g., dependency injection or module mocking with Vitest).

#### 5. `src/lib/chat-processor.ts` — Command Routing & State Machine

**Why:** This is the central nervous system. Every message from both Telegram and web flows through `processMessage()`. A routing bug can make an entire command silently stop working.

**What to test:**
- Command dispatch: `/oggi`, `/obiettivo 2000`, `/sessione`, `/fine`, `/annulla`, `/ricetta`, `/ricette`, `/crearicetta` each routes to correct handler
- Unknown command: `/unknown` → error response
- Session state machine: start → add exercises → end produces valid workout
- Session edge cases: `/fine` with no active session, `/sessione` when session already active
- Free-text routing: meal text → AI classification → nutrition enrichment → save
- Recipe matching: text matching saved recipe name → instant log (skips AI)
- Conversation context: follow-up within 30 minutes uses `classifyWithContext`
- `enrichWithNutrition()`: partial failures (some items found, others not) → returns found items + failedItems list
- `resultToMessageType()`: every `ProcessResult.kind` maps to correct DB message type

**Estimated tests:** ~25–35

---

#### 6. `src/lib/recipes.ts` — `findRecipeByName()` Matching Logic

**Why:** Recipe matching determines whether a message triggers instant logging (zero-cost) vs. an AI classification call. Incorrect matching either misses recipes (wasting API calls) or false-matches random text as a recipe.

**What to test:**
- Exact match: `"pancake"` matches recipe named `"pancake"`
- Case insensitive: `"Pancake"` matches `"pancake"`
- Portion extraction: `"pancake 2 porzioni"` → recipe + portions=2
- Portion with x: `"pancake x3"` → portions=3
- Trailing number: `"pancake 2"` → portions=2
- Portion bounds: `"pancake 0"` → portions=1 (below min), `"pancake 25"` → no match (above max 20)
- Contains match: `"il mio pancake"` matches recipe `"pancake"` (searchText includes recipeName)
- Short search text: 2-char search text → no contains match (minimum 3 chars)
- No match: `"cibo random"` → null

**Estimated tests:** ~12–15

---

#### 7. `src/lib/nutrition.ts` — `lookupNutrients()` Orchestration

**Why:** This function coordinates the entire nutrition pipeline: CREA local DB → cache → in-flight dedup → parallel API calls → cross-validation. Bugs here affect every meal logged.

**What to test (with mocked API clients):**
- CREA hit: skips all external APIs
- Cache hit: returns scaled values without API calls
- Cache miss: calls APIs, stores result
- In-flight dedup: two concurrent requests for same food → one API call
- Cross-validation: two APIs within 15% → returns first; two APIs diverging → falls back to priority order
- All APIs fail: returns null, caches the miss
- Branded vs generic: branded routes to `fetchPer100gBranded` with correct priority
- Cooking adjustment integration: cooked=true → grams adjusted before lookup
- TTL expiry: cached entry older than 24h → re-fetches

**Estimated tests:** ~15–20

---

#### 8. `src/lib/food-search.ts` — `searchFoods()` Deduplication

**Why:** The dashboard food search queries 4 sources in parallel and deduplicates results. Deduplication bugs cause duplicates in the UI or missing results.

**What to test:**
- Deduplication: same food from USDA and OFF → single result
- Source attribution: correct source label preserved
- All sources failing: returns empty array
- Partial failures: 2 of 4 sources fail → returns results from working ones

**Estimated tests:** ~8–10

---

### Priority 3 — API Routes (Integration Tests)

#### 9. API Route Input Validation

**Why:** API routes are the public surface. They lack input validation — no schema validation on request bodies, no parameter type checking. Invalid input could cause runtime errors or corrupt data.

**Routes to test:**
- `POST /api/meals` — missing fields, wrong types, negative calories
- `POST /api/chat` — missing user_id, empty message
- `POST /api/water` — negative water amount, non-numeric values
- `POST /api/weight` — future dates, extreme values
- `PUT /api/user` — invalid calorie goals (negative, non-numeric)
- `GET` routes — missing query parameters, malformed dates

**Estimated tests:** ~20–25

---

### Priority 4 — Scoring & Ranking Functions (API Clients)

#### 10. `src/lib/usda.ts` — `scoreFoodMatch()`

**Why:** This scoring function determines which USDA result is selected. Bad scoring means returning "chicken soup" when the user asked for "chicken breast".

**What to test:**
- Exact name match: high score
- Substring match: moderate score
- Word overlap scoring: "petto di pollo" vs "chicken breast boneless skinless"
- Cooking term penalties/bonuses
- Score threshold: results below 10 are filtered

**Estimated tests:** ~10–12

---

#### 11. `src/lib/openfoodfacts.ts` — `scoreProduct()`

**Why:** Same concern as USDA scoring — wrong product selection means wrong nutrition data.

**Estimated tests:** ~8–10

---

## Recommended Test Framework

**Vitest** is the best fit for this project:
- Native ESM and TypeScript support (no config boilerplate)
- Compatible with the existing Next.js + TypeScript setup
- Fast execution with watch mode
- Built-in mocking (`vi.mock`, `vi.fn`) for Supabase and API clients
- Same assertion API as Jest (easy to learn)

### Suggested Setup

```bash
npm install -D vitest @vitest/coverage-v8
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Suggested File Structure

```
src/
  lib/
    __tests__/
      exercise-parser.test.ts    ← Priority 1
      cooking-factors.test.ts    ← Priority 1
      italian-foods.test.ts      ← Priority 1
      nutrition.test.ts           ← Priority 1 (pure) + Priority 2 (orchestration)
      chat-processor.test.ts     ← Priority 2
      recipes.test.ts            ← Priority 2
      food-search.test.ts        ← Priority 2
      usda.test.ts               ← Priority 4
      openfoodfacts.test.ts      ← Priority 4
  app/
    api/
      __tests__/
        meals.test.ts            ← Priority 3
        chat.test.ts             ← Priority 3
        water.test.ts            ← Priority 3
```

---

## Summary

| Priority | Module | Risk if Untested | Tests Needed | Mocking |
|----------|--------|-----------------|--------------|---------|
| **1** | exercise-parser | Workout logging breaks | ~15–20 | None |
| **1** | cooking-factors | Calorie counts off 2–3x | ~12–15 | None |
| **1** | italian-foods | Silent wrong macros | ~10–12 | None |
| **1** | nutrition (pure fns) | Bad data accepted/rejected | ~12–15 | None |
| **2** | chat-processor | Commands stop working | ~25–35 | Supabase + OpenAI |
| **2** | recipes (matching) | Missed/false recipe matches | ~12–15 | Supabase |
| **2** | nutrition (orchestration) | Wrong nutrition source used | ~15–20 | API clients |
| **2** | food-search | Duplicate/missing results | ~8–10 | API clients |
| **3** | API routes | Runtime errors on bad input | ~20–25 | Supabase + HTTP |
| **4** | usda scoring | Wrong food selected | ~10–12 | None (pure) |
| **4** | openfoodfacts scoring | Wrong product selected | ~8–10 | None (pure) |

**Total estimated: ~150–195 tests**

The Priority 1 tests (exercise parser, cooking factors, Italian foods, Atwater/scaling) require zero infrastructure and can be written immediately. They cover the logic most likely to silently produce wrong results.
