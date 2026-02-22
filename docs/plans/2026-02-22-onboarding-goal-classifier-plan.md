# Onboarding Goal Classifier Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the 4-step onboarding into a 6-step guided flow with goal sub-classification, dynamic calorie/macro calculations from GuidaObiettivi.md, and educational expandable cards.

**Architecture:** New `goal-classifier.ts` centralizes all decision logic (bulk type, deficit type, performance sport category, macro calculations). The onboarding page grows from 4 to 6 steps with conditional branching at Step 5. Both `/api/onboarding` and `/api/recalculate` import from the shared classifier. New DB columns store the sub-classification results.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Supabase (PostgreSQL)

**Design doc:** `docs/plans/2026-02-22-onboarding-goal-classifier-design.md`
**Reference guide:** `GuidaObiettivi.md` (root)

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/010_goal_classification_columns.sql`

**Step 1: Write the migration**

```sql
-- Goal classification columns for enhanced onboarding
-- Stores sub-classification results from goal-classifier.ts

ALTER TABLE users ADD COLUMN IF NOT EXISTS training_experience TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS goal_subtype TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS calorie_surplus_deficit INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS season_phase TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sport_category TEXT;
```

Column values:
- `training_experience`: `'beginner'` | `'intermediate'` | `'advanced'`
- `goal_subtype`: `'lean_bulk'` | `'moderate_bulk'` | `'aggressive_bulk'` | `'conservative_deficit'` | `'moderate_deficit'` | `'aggressive_deficit'` | `'performance_strength'` | `'performance_endurance'` | `'performance_intermittent'` | `'performance_technical'` | `'maintain'` | `'healthy'`
- `calorie_surplus_deficit`: integer (e.g. +200, -450)
- `season_phase`: `'pre_season'` | `'competitive'` | `'off_season'`
- `sport_category`: `'strength'` | `'endurance'` | `'intermittent'` | `'technical'`

**Step 2: Run migration manually in Supabase SQL Editor**

Copy the SQL above and execute it in the Supabase dashboard SQL Editor.

**Step 3: Commit**

```bash
git add supabase/migrations/010_goal_classification_columns.sql
git commit -m "feat: add goal classification columns to users table"
```

---

## Task 2: Core Logic — `goal-classifier.ts`

**Files:**
- Create: `src/lib/goal-classifier.ts`

This is the heart of the feature. It contains ALL decision logic from GuidaObiettivi.md. Both the onboarding API and the frontend Step 5/6 will import from here.

**Step 1: Write the classifier**

The file must export these functions:

```typescript
// === TYPES ===

export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';
export type Gender = 'male' | 'female' | 'other';

export type BulkSubtype = 'lean_bulk' | 'moderate_bulk' | 'aggressive_bulk';
export type CutSubtype = 'conservative_deficit' | 'moderate_deficit' | 'aggressive_deficit';
export type PerformanceSubtype = 'performance_strength' | 'performance_endurance' | 'performance_intermittent' | 'performance_technical';
export type GoalSubtype = BulkSubtype | CutSubtype | PerformanceSubtype | 'maintain' | 'healthy';

export type SportCategory = 'strength' | 'endurance' | 'intermittent' | 'technical';
export type SeasonPhase = 'pre_season' | 'competitive' | 'off_season';

export interface ClassificationInput {
  goal: string;                              // Italian goal string from Step 1
  gender: Gender;
  weight_kg: number;
  height_cm: number;
  age: number;
  body_fat_percentage: number | null;        // From US Navy formula, may be null
  training_experience: TrainingExperience;
  activity_level: string;                    // 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  sport_category?: SportCategory;            // Only for performance goal
  season_phase?: SeasonPhase;                // Only for performance goal
}

export interface ClassificationWarning {
  type: 'bulk_high_bf' | 'cut_low_bf' | 'floor_applied' | 'low_carbs';
  severity: 'info' | 'warning' | 'critical';
  message: string;                           // Italian message
  suggestion?: string;                       // Italian suggestion
}

export interface ClassificationResult {
  goal_subtype: GoalSubtype;
  daily_calorie_target: number;
  calorie_surplus_deficit: number;           // The delta from TDEE (e.g. +200 or -450)
  macro_protein_g: number;
  macro_carbs_g: number;
  macro_fat_g: number;
  protein_per_kg: number;                    // For display (e.g. 2.2)
  fat_per_kg: number;                        // For display (e.g. 0.8)
  carbs_per_kg: number;                      // For display (e.g. 3.5)
  warnings: ClassificationWarning[];
  monitoring: MonitoringInfo;
  education: EducationContent;
}

export interface MonitoringInfo {
  weight_change_target: string;              // e.g. "0.5-1.0% del peso/mese"
  weight_change_direction: 'increase' | 'decrease' | 'stable';
  check_frequency: string;                   // e.g. "Media settimanale"
  adjustment_rule: string;                   // e.g. "Se non aumenti per 2 sett: +100-150 kcal"
}

export interface EducationContent {
  goal_explanation: string;                  // Why this sub-type was chosen
  calorie_explanation: string;               // Why this calorie target
  protein_explanation: string;               // Why this protein level
  carbs_explanation: string;                 // Why this carb level
  fat_explanation: string;                   // Why this fat level
}
```

**Key implementation functions:**

```typescript
// Main entry point
export function classifyGoal(input: ClassificationInput, tdee: number): ClassificationResult

// Internal helpers
function classifyBulk(input, tdee): ClassificationResult
function classifyCut(input, tdee): ClassificationResult
function classifyPerformance(input, tdee): ClassificationResult
function classifyMaintain(input, tdee): ClassificationResult
function classifyHealthy(input, tdee): ClassificationResult

// Utility
export function getGoalCategory(goal: string): 'bulk' | 'cut' | 'performance' | 'maintain' | 'healthy'
function computeMacros(calories: number, weight_kg: number, proteinPerKg: number, fatPerKg: number): macros
function applyCalorieFloor(calories: number, gender: Gender): { calories: number; floorApplied: boolean }
function getIdealWeight(gender: Gender, height_cm: number): number  // For high BF% protein calc
```

**Critical business rules to implement (from GuidaObiettivi.md):**

1. **BULK classification logic:**
   - If BF% > 20% (male) or > 30% (female): warning `bulk_high_bf`, suggest cut first, if proceeding use lean_bulk +150
   - If BF% unavailable: default to moderate_bulk for beginners, lean_bulk for others
   - Beginner: moderate_bulk, surplus midpoint +400
   - Intermediate: lean_bulk, surplus midpoint +225
   - Advanced: lean_bulk, surplus midpoint +225
   - Macros: P 2.0 g/kg, F 1.0 g/kg, C = residual
   - Warning if C < 3 g/kg

2. **CUT classification logic:**
   - If BF% < 12% (male) or < 20% (female): warning `cut_low_bf`
   - BF% > 25% male / > 35% female: aggressive_deficit, midpoint -650
   - BF% 15-25% male / 25-35% female: moderate_deficit, midpoint -450
   - BF% 12-15% male / 22-25% female: conservative_deficit, midpoint -300
   - BF% < 12% male / < 20% female: conservative_deficit, -250
   - If BF% unavailable: default to moderate_deficit -450
   - Calorie floor: male >= 1400, female >= 1200
   - If BF% > 30%: protein on ideal weight (height-100 male, height-110 female)
   - Macros: P 2.2 g/kg (or on ideal weight), F 0.8 g/kg, C = residual
   - Warning if C < 100g total

3. **PERFORMANCE classification logic:**
   - Requires sport_category input
   - Strength: P 2.0 g/kg, F 1.0 g/kg, C 4 g/kg, calories TDEE + 150
   - Endurance: P 1.6 g/kg, F 1.0 g/kg, C 7 g/kg, calories = computed from macros
   - Intermittent: P 2.0 g/kg, F 1.0 g/kg, C 6 g/kg, calories = computed from macros
   - Technical: P 1.8 g/kg, F 1.0 g/kg, C 5 g/kg, calories = computed from macros
   - For endurance/intermittent/technical: calories = P*4 + F*9 + C*4 (no fixed surplus)

4. **MAINTAIN/HEALTHY:** P 2.0 g/kg, F 1.0 g/kg, C = residual from TDEE

5. **Universal:** `calories_bulk`, `calories_maintain`, `calories_cut` fields still computed for CalorieTargets display but using the guide's dynamic logic instead of fixed +300/-400.

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit src/lib/goal-classifier.ts`
Or just: `npm run build` (will catch all errors)

**Step 3: Commit**

```bash
git add src/lib/goal-classifier.ts
git commit -m "feat: add goal-classifier with GuidaObiettivi.md logic"
```

---

## Task 3: Add Training Experience to Step 2

**Files:**
- Modify: `src/app/onboarding/components/Step2Physical.tsx`
- Modify: `src/app/onboarding/page.tsx` (add field to physical state)

**Step 1: Update physical state in page.tsx**

In `src/app/onboarding/page.tsx`, add `training_experience` to the physical state object (line ~27-36):

```typescript
const [physical, setPhysical] = useState({
  age: "",
  gender: "",
  height_cm: "",
  weight_kg: "",
  target_weight_kg: "",
  neck_cm: "",
  waist_cm: "",
  hip_cm: "",
  training_experience: "",  // NEW
});
```

**Step 2: Add training experience UI in Step2Physical.tsx**

Add a new section after the body measurements section (after line ~231), before the closing `</motion.div>`:

```tsx
{/* Training experience */}
<motion.div variants={staggerItem} className="pt-2">
  <div className="border-t border-border-subtle pt-4">
    <label className="font-mono-label text-text-tertiary mb-2 block">
      Esperienza di allenamento
    </label>
    <p className="font-body text-xs text-text-tertiary mb-3">
      Da quanto tempo ti alleni con costanza?
    </p>
    <div className="grid grid-cols-1 gap-2">
      {[
        { value: "beginner", label: "Principiante", desc: "Meno di 1 anno di allenamento costante" },
        { value: "intermediate", label: "Intermedio", desc: "1-3 anni di allenamento costante" },
        { value: "advanced", label: "Avanzato", desc: "Più di 3 anni di allenamento costante" },
      ].map((opt) => {
        const isSelected = data.training_experience === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange("training_experience", opt.value)}
            className={`text-left p-3 rounded-lg border transition-all ${
              isSelected
                ? "border-[var(--color-accent-dynamic)] bg-[var(--color-accent-dynamic)]/10"
                : "border-border bg-surface hover:border-border"
            }`}
          >
            <span className={`font-body text-sm ${isSelected ? "text-text-primary" : "text-text-secondary"}`}>
              {opt.label}
            </span>
            <p className="font-body text-xs text-text-tertiary mt-0.5">{opt.desc}</p>
          </button>
        );
      })}
    </div>
  </div>
</motion.div>
```

Update the `Step2Data` interface to include `training_experience: string`.

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/app/onboarding/page.tsx src/app/onboarding/components/Step2Physical.tsx
git commit -m "feat: add training experience field to onboarding Step 2"
```

---

## Task 4: Step 5 — Goal Sub-Classification Component

**Files:**
- Create: `src/app/onboarding/components/Step5GoalClassification.tsx`

This component receives the user's goal + physical data + computed classification result and renders the appropriate sub-classification UI based on the goal.

**Step 1: Write the component**

The component needs these props:

```typescript
interface Step5Props {
  goal: string;
  classification: ClassificationResult | null;
  // For performance goal — user must select these
  sportCategory: SportCategory | null;
  onSportCategoryChange: (cat: SportCategory) => void;
  seasonPhase: SeasonPhase | null;
  onSeasonPhaseChange: (phase: SeasonPhase) => void;
  // For bulk warning — user can change goal
  onChangeGoal: () => void;
}
```

**UI sections by goal:**

### BULK view:
- Auto-classification card: "In base al tuo profilo, ti consigliamo un **{bulkType}** (+{surplus} kcal/giorno)"
- Green accent for lean_bulk, blue for moderate, orange for aggressive
- If `bulk_high_bf` warning: yellow banner with warning message + two buttons: "Cambia obiettivo" (calls onChangeGoal) and "Procedi comunque"
- Expandable card "Perché questo tipo di bulk?" with `education.goal_explanation`
- Monitoring card showing `monitoring.weight_change_target`

### CUT view:
- Auto-classification card: "Deficit **{deficitType}** ({surplus_deficit} kcal/giorno)"
- Orange accent for moderate, red for aggressive, blue for conservative
- If `floor_applied` warning: red banner
- If `cut_low_bf` warning: yellow banner
- Expandable card "Perché questo deficit?"
- Monitoring card

### PERFORMANCE view:
- 4 sport category cards (user selects one):
  - "Forza e Potenza" — Powerlifting, sprint, lancio
  - "Endurance" — Corsa, ciclismo, nuoto
  - "Sport Intermittenti" — Calcio, basket, MMA, CrossFit
  - "Sport Tecnico-coordinativi" — Ginnastica, arrampicata, danza
- 3 season phase cards (after sport selection):
  - "Pre-stagione" — Costruzione base
  - "Competitiva" — Performance massima
  - "Off-season" — Recupero
- Expandable card explaining sport-specific nutrition

### MAINTAIN/HEALTHY view:
- Simple confirmation card with brief explanation
- No user choices needed

**UI pattern for expandable cards:**

```tsx
function ExpandableCard({ title, content }: { title: string; content: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="data-card">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between">
        <span className="font-mono-label text-text-secondary text-sm">{title}</span>
        <motion.svg animate={{ rotate: isOpen ? 180 : 0 }} /* chevron */ />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <p className="font-body text-sm text-text-tertiary mt-3 pt-3 border-t border-border-subtle">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/app/onboarding/components/Step5GoalClassification.tsx
git commit -m "feat: add Step 5 goal sub-classification component"
```

---

## Task 5: Step 6 — Summary Component

**Files:**
- Create: `src/app/onboarding/components/Step6Summary.tsx`

**Step 1: Write the component**

Props:

```typescript
interface Step6Props {
  classification: ClassificationResult;
  tdee: number;
  weight_kg: number;
  bmr: number;
}
```

Layout (all using framer-motion stagger animations, consistent with other steps):

1. **Header**: "Il tuo piano personalizzato"

2. **Objective card** — accent-colored card showing:
   - Goal subtype label (Italian, e.g. "Lean Bulk")
   - Surplus/deficit (e.g. "+200 kcal/giorno")
   - Weight change target (e.g. "Obiettivo: +0.5-1.0% peso/mese")

3. **Calories card** — data-card showing:
   - Big number: `daily_calorie_target` kcal
   - Subtitle: "TDEE {tdee} + surplus {delta}"
   - ExpandableCard: "Perché questo valore?" → `education.calorie_explanation`

4. **Macros card** — data-card showing:
   - Three rows with colored dots (same pattern as CalorieTargets.tsx):
     - Protein dot + "{protein_g}g ({protein_per_kg} g/kg)"
     - Carbs dot + "{carbs_g}g ({carbs_per_kg} g/kg)"
     - Fat dot + "{fat_g}g ({fat_per_kg} g/kg)"
   - ExpandableCard: "Perché questi rapporti?" → concatenated protein/carbs/fat explanations

5. **Monitoring card** — data-card showing:
   - Icon + "Pesati ogni mattina a digiuno"
   - "Confronta la media settimanale"
   - monitoring.adjustment_rule
   - ExpandableCard: "Piano completo monitoraggio" → full monitoring details

6. **Warnings** — if any warnings exist, show them as colored banners above the disclaimer

7. **Disclaimer note** — subtle text:
   - "Questi numeri sono stime iniziali. Vanno aggiustati dopo 2-3 settimane di monitoraggio del peso reale."

Use the same `ExpandableCard` component from Step5 (extract to a shared component or duplicate — keep it simple, one file is fine).

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/app/onboarding/components/Step6Summary.tsx
git commit -m "feat: add Step 6 summary component with expandable education cards"
```

---

## Task 6: Update Onboarding Page — 4 to 6 Steps

**Files:**
- Modify: `src/app/onboarding/page.tsx`

**Step 1: Update imports and constants**

Add imports at top:

```typescript
import Step5GoalClassification from "./components/Step5GoalClassification";
import Step6Summary from "./components/Step6Summary";
import { classifyGoal, getGoalCategory, type ClassificationInput, type ClassificationResult, type SportCategory, type SeasonPhase } from "@/lib/goal-classifier";
```

Change `TOTAL_STEPS` from 4 to 6.

**Step 2: Add new state variables**

After the existing state declarations (after line ~53):

```typescript
// Step 5 — Performance-specific
const [sportCategory, setSportCategory] = useState<SportCategory | null>(null);
const [seasonPhase, setSeasonPhase] = useState<SeasonPhase | null>(null);

// Computed classification (calculated when entering Step 5)
const [classification, setClassification] = useState<ClassificationResult | null>(null);
const [tdee, setTdee] = useState<number>(0);
const [bmr, setBmr] = useState<number>(0);
```

**Step 3: Add classification computation**

Add a `useEffect` or `useMemo` that runs the classifier when the user reaches Step 5. The classifier needs BMR/TDEE which requires the same calculation as the API:

```typescript
// Compute classification when entering Step 5
useEffect(() => {
  if (step === 5 && goal && physical.weight_kg && physical.height_cm && physical.age && physical.gender) {
    const weight = parseFloat(physical.weight_kg);
    const height = parseInt(physical.height_cm);
    const age = parseInt(physical.age);
    const gender = physical.gender as Gender;

    // BMR (Mifflin-St Jeor)
    const maleBMR = 10 * weight + 6.25 * height - 5 * age + 5;
    const femaleBMR = 10 * weight + 6.25 * height - 5 * age - 161;
    const computedBmr = gender === 'male' ? maleBMR : gender === 'female' ? femaleBMR : (maleBMR + femaleBMR) / 2;

    // TDEE
    const ACTIVITY_MULTIPLIERS: Record<string, number> = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
    };
    const computedTdee = computedBmr * (ACTIVITY_MULTIPLIERS[lifestyle.activity_level] ?? 1.2);

    // Body fat (US Navy)
    let bodyFat: number | null = null;
    // ... same calculation as onboarding API ...

    const input: ClassificationInput = {
      goal: goal,
      gender,
      weight_kg: weight,
      height_cm: height,
      age,
      body_fat_percentage: bodyFat,
      training_experience: (physical.training_experience as TrainingExperience) || 'intermediate',
      activity_level: lifestyle.activity_level,
      sport_category: sportCategory || undefined,
      season_phase: seasonPhase || undefined,
    };

    const result = classifyGoal(input, computedTdee);
    setClassification(result);
    setBmr(Math.round(computedBmr * 10) / 10);
    setTdee(Math.round(computedTdee * 10) / 10);
  }
}, [step, goal, physical, lifestyle.activity_level, sportCategory, seasonPhase]);
```

**Step 4: Update isStepValid()**

```typescript
case 5:
  if (getGoalCategory(goal || '') === 'performance') {
    return sportCategory !== null && seasonPhase !== null;
  }
  return true; // For bulk/cut/maintain/healthy — auto-classified, no user input needed
case 6:
  return true; // Summary is always valid, just needs confirmation
```

**Step 5: Update step rendering in JSX**

Add after Step 4 in the AnimatePresence block:

```tsx
{step === 5 && (
  <Step5GoalClassification
    goal={goal || ''}
    classification={classification}
    sportCategory={sportCategory}
    onSportCategoryChange={setSportCategory}
    seasonPhase={seasonPhase}
    onSeasonPhaseChange={setSeasonPhase}
    onChangeGoal={() => { setDirection(-1); setStep(1); }}
  />
)}
{step === 6 && classification && (
  <Step6Summary
    classification={classification}
    tdee={tdee}
    weight_kg={parseFloat(physical.weight_kg)}
    bmr={bmr}
  />
)}
```

**Step 6: Update handleSubmit to include new fields**

In the payload object, add:

```typescript
training_experience: physical.training_experience || 'intermediate',
sport_category: sportCategory || undefined,
season_phase: seasonPhase || undefined,
goal_subtype: classification?.goal_subtype,
calorie_surplus_deficit: classification?.calorie_surplus_deficit,
```

Change the submit condition: `step === TOTAL_STEPS` (which is now 6).

**Step 7: Verify build**

Run: `npm run build`

**Step 8: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat: expand onboarding from 4 to 6 steps with goal classification"
```

---

## Task 7: Update Onboarding API

**Files:**
- Modify: `src/app/api/onboarding/route.ts`

**Step 1: Import goal-classifier**

```typescript
import { classifyGoal, getGoalCategory, type ClassificationInput, type TrainingExperience, type SportCategory, type SeasonPhase } from "@/lib/goal-classifier";
```

**Step 2: Add new fields to OnboardingRequest interface**

```typescript
interface OnboardingRequest {
  // ... existing fields ...
  training_experience?: string;
  sport_category?: string;
  season_phase?: string;
  goal_subtype?: string;
  calorie_surplus_deficit?: number;
}
```

**Step 3: Replace the fixed calorie calculation logic**

Remove the fixed `+300` / `-400` logic. Instead:

```typescript
// 1. BMR (keep existing calculateBMR)
const bmr = round1(calculateBMR(weight_kg, height_cm, age, gender));

// 2. TDEE (keep existing)
const multiplier = ACTIVITY_MULTIPLIERS[activity_level] ?? 1.2;
const tdee = round1(bmr * multiplier);

// 3. Body fat (keep existing calculation)
// ... existing body fat code ...

// 4. NEW: Use goal-classifier for dynamic calorie/macro calculation
const classInput: ClassificationInput = {
  goal,
  gender,
  weight_kg,
  height_cm,
  age,
  body_fat_percentage,
  training_experience: (body.training_experience as TrainingExperience) || 'intermediate',
  activity_level,
  sport_category: body.sport_category as SportCategory | undefined,
  season_phase: body.season_phase as SeasonPhase | undefined,
};

const classification = classifyGoal(classInput, tdee);

const daily_calorie_target = round1(classification.daily_calorie_target);
const { macro_protein_g: protein_g, macro_carbs_g: carbs_g, macro_fat_g: fat_g } = classification;

// Still compute all 3 targets for CalorieTargets display, but using guide logic:
// calories_cut = TDEE - |moderate deficit midpoint (450)|
// calories_maintain = TDEE
// calories_bulk = TDEE + |lean bulk midpoint (225)|
const calories_cut = round1(tdee - 450);
const calories_maintain = round1(tdee);
const calories_bulk = round1(tdee + 225);
```

**Step 4: Add new fields to updateData**

```typescript
const updateData = {
  // ... existing fields ...

  // NEW goal classification fields
  training_experience: body.training_experience || null,
  goal_subtype: classification.goal_subtype,
  calorie_surplus_deficit: classification.calorie_surplus_deficit,
  sport_category: body.sport_category || null,
  season_phase: body.season_phase || null,
};
```

**Step 5: Verify build**

Run: `npm run build`

**Step 6: Commit**

```bash
git add src/app/api/onboarding/route.ts
git commit -m "feat: use goal-classifier for dynamic calorie/macro calculations in onboarding"
```

---

## Task 8: Update Recalculate API

**Files:**
- Modify: `src/app/api/recalculate/route.ts`

**Step 1: Import goal-classifier**

Same import as Task 7.

**Step 2: Add new fields to RecalculateRequest**

```typescript
interface RecalculateRequest {
  // ... existing fields ...
  training_experience?: string;
  sport_category?: string;
  season_phase?: string;
}
```

**Step 3: Replace fixed calorie calculation**

Same pattern as Task 7 — after computing BMR/TDEE/body_fat, use `classifyGoal()`:

```typescript
const training_experience = body.training_experience ?? currentUser.training_experience ?? 'intermediate';
const sport_category = body.sport_category ?? currentUser.sport_category;
const season_phase = body.season_phase ?? currentUser.season_phase;

const classInput: ClassificationInput = {
  goal,
  gender,
  weight_kg,
  height_cm,
  age,
  body_fat_percentage,
  training_experience: training_experience as TrainingExperience,
  activity_level,
  sport_category: sport_category as SportCategory | undefined,
  season_phase: season_phase as SeasonPhase | undefined,
};

const classification = classifyGoal(classInput, tdee);

const daily_calorie_target = round1(classification.daily_calorie_target);
const protein_g = round1(classification.macro_protein_g);
const carbs_g = round1(classification.macro_carbs_g);
const fat_g = round1(classification.macro_fat_g);

const calories_cut = round1(tdee - 450);
const calories_maintain = round1(tdee);
const calories_bulk = round1(tdee + 225);
```

**Step 4: Add new fields to updateData**

```typescript
// NEW fields
...(body.training_experience !== undefined && { training_experience: body.training_experience }),
...(body.sport_category !== undefined && { sport_category: body.sport_category }),
...(body.season_phase !== undefined && { season_phase: body.season_phase }),
goal_subtype: classification.goal_subtype,
calorie_surplus_deficit: classification.calorie_surplus_deficit,
```

**Step 5: Remove duplicate functions**

Remove the local `MACRO_RATIOS`, `getGoalType`, `computeGoalMacros` functions since the goal-classifier now handles this. Keep `calculateBMR`, `calculateBodyFat`, `ACTIVITY_MULTIPLIERS`, `round1`, `getDailyCalorieTarget` (or refactor — at minimum remove the old macro logic).

Actually: keep `calculateBMR` and `calculateBodyFat` and `ACTIVITY_MULTIPLIERS` in recalculate — they're still needed for the BMR/TDEE/BF computation before passing to the classifier. Only the macro/calorie-target logic moves to the classifier.

**Step 6: Verify build**

Run: `npm run build`

**Step 7: Commit**

```bash
git add src/app/api/recalculate/route.ts
git commit -m "feat: use goal-classifier for dynamic recalculation"
```

---

## Task 9: Update CalorieTargets Component

**Files:**
- Modify: `src/app/dashboard/stats/components/CalorieTargets.tsx`

**Step 1: Remove local macro computation**

The CalorieTargets component currently duplicates macro calculation on the frontend. Since the backend now computes dynamic values, the frontend should receive `macro_protein_g`, `macro_carbs_g`, `macro_fat_g` from the user data and display them.

However, CalorieTargets shows macros for ALL 3 targets (cut/maintain/bulk), not just the active one. Two options:

**Option A (simple):** Keep showing the 3 cards with the backend-computed `calories_cut`, `calories_maintain`, `calories_bulk` values. Keep the frontend macro computation for the non-active cards (those are just reference values) but use the backend macros for the highlighted card.

**Option B (cleaner):** The 3 cards show only calorie numbers (no macro breakdown per card). The active card shows the user's actual macro targets from the DB. This is simpler and avoids misleading the user with approximate macros for non-active goals.

**Go with Option A** — minimal change, keep existing behavior but update the highlighted card's macros to use the user's actual computed macros from the DB.

**Step 2: Add new props**

```typescript
interface CalorieTargetsProps {
  caloriesCut: number | null;
  caloriesMaintain: number | null;
  caloriesBulk: number | null;
  goal: string | null;
  weightKg: number | null;
  // NEW — actual macro targets from goal-classifier
  activeProteinG: number | null;
  activeCarbsG: number | null;
  activeFatG: number | null;
  goalSubtype: string | null;
  calorieSurplusDeficit: number | null;
}
```

**Step 3: Use active macros for highlighted card**

In the highlighted card, instead of computing macros from the fixed ratio, use the props:

```typescript
const highlightedMacros = (activeProteinG && activeCarbsG && activeFatG)
  ? { protein: Math.round(activeProteinG), carbs: Math.round(activeCarbsG), fat: Math.round(activeFatG) }
  : computeMacros(/* fallback */);
```

For the non-highlighted cards, keep the existing `computeMacros` function (it's approximate but fine for reference values).

**Step 4: Update parent component that passes props**

Find where `CalorieTargets` is used in the stats page and pass the new props. Check: `src/app/dashboard/stats/page.tsx`.

Look for where the user data is fetched and passed to CalorieTargets. Add:

```typescript
activeProteinG={user.macro_protein_g}
activeCarbsG={user.macro_carbs_g}
activeFatG={user.macro_fat_g}
goalSubtype={user.goal_subtype}
calorieSurplusDeficit={user.calorie_surplus_deficit}
```

**Step 5: Verify build**

Run: `npm run build`

**Step 6: Commit**

```bash
git add src/app/dashboard/stats/components/CalorieTargets.tsx src/app/dashboard/stats/page.tsx
git commit -m "feat: use dynamic goal-classifier macros in CalorieTargets"
```

---

## Task 10: Final Build Verification

**Files:** None (verification only)

**Step 1: Full build**

Run: `npm run build`

Expected: Build succeeds with zero errors.

**Step 2: Manual testing checklist**

Start dev server: `npm run dev`

Test the following flows manually:

1. **New user — Bulk goal:**
   - Go through onboarding, select "Aumentare massa muscolare"
   - Fill physical data with BF% < 20% → should see lean/moderate bulk
   - Fill physical data with BF% > 20% → should see warning banner
   - Step 6 should show correct macros with expandable cards

2. **New user — Cut goal:**
   - Select "Perdere grasso corporeo"
   - Step 5 should auto-classify deficit based on BF%
   - Check calorie floor if target goes below 1400/1200
   - Step 6 should show correct macros

3. **New user — Performance goal:**
   - Select "Migliorare la performance atletica"
   - Step 5 should show 4 sport category cards
   - Select each and verify macro changes
   - Select season phase

4. **New user — Maintain/Healthy:**
   - These should pass through Step 5 quickly with a simple card

5. **Stats page:**
   - After onboarding, check CalorieTargets shows correct values
   - The highlighted card should show the actual computed macros

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address build/lint issues from goal classifier integration"
```

---

## File Summary

| # | File | Action | Task |
|---|---|---|---|
| 1 | `supabase/migrations/010_goal_classification_columns.sql` | Create | 1 |
| 2 | `src/lib/goal-classifier.ts` | Create | 2 |
| 3 | `src/app/onboarding/components/Step2Physical.tsx` | Modify | 3 |
| 4 | `src/app/onboarding/page.tsx` | Modify | 3, 6 |
| 5 | `src/app/onboarding/components/Step5GoalClassification.tsx` | Create | 4 |
| 6 | `src/app/onboarding/components/Step6Summary.tsx` | Create | 5 |
| 7 | `src/app/api/onboarding/route.ts` | Modify | 7 |
| 8 | `src/app/api/recalculate/route.ts` | Modify | 8 |
| 9 | `src/app/dashboard/stats/components/CalorieTargets.tsx` | Modify | 9 |
| 10 | `src/app/dashboard/stats/page.tsx` | Modify | 9 |

## Task Dependency Order

```
Task 1 (DB migration) — can run independently
Task 2 (goal-classifier.ts) — no dependencies, pure logic
Task 3 (Step 2 training experience) — no dependencies
Task 4 (Step 5 component) — depends on Task 2 (imports goal-classifier types)
Task 5 (Step 6 component) — depends on Task 2 (imports goal-classifier types)
Task 6 (onboarding page.tsx) — depends on Tasks 2, 3, 4, 5
Task 7 (onboarding API) — depends on Task 2
Task 8 (recalculate API) — depends on Task 2
Task 9 (CalorieTargets) — depends on Task 7 (needs new DB fields populated)
Task 10 (verification) — depends on all above
```

Parallel opportunities:
- Tasks 1, 2, 3 can all run in parallel
- Tasks 4, 5 can run in parallel (both depend only on Task 2)
- Tasks 7, 8 can run in parallel (both depend only on Task 2)
