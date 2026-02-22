# Workouts Premium Page — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the basic workouts list page into a premium 3-tab experience (Oggi/Storico/Progressi) with web-based workout creation via templates, contribution calendar, and exercise progression charts.

**Architecture:** 3-tab page component with shared data fetching. New API endpoints for POST (create workout), exercise list (autocomplete), and progress (chart data). Workout templates as a static TypeScript file. All charts via Recharts (already installed).

**Tech Stack:** Next.js 16, React 19, Framer Motion 12, Recharts 3, Tailwind CSS 4, Supabase

---

## Task 1: API — POST /api/workouts + GET range param

**Files:**
- Modify: `src/app/api/workouts/route.ts`

**Step 1: Add POST handler to existing route**

Add after the existing DELETE handler:

```ts
export async function POST(request: NextRequest) {
  let body: {
    user_id: string;
    description: string;
    workout_type: string;
    duration_min?: number | null;
    calories_burned?: number | null;
    exercises?: { name: string; sets?: number; reps?: number; weight_kg?: number | null }[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.user_id || !body.description || !body.workout_type) {
    return NextResponse.json({ error: "user_id, description, workout_type required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("workouts")
    .insert({
      user_id: body.user_id,
      description: body.description,
      workout_type: body.workout_type,
      duration_min: body.duration_min ?? null,
      calories_burned: body.calories_burned ?? null,
      exercises: body.exercises ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
```

**Step 2: Add `range` param support to GET**

Update the GET handler: if no `date` param but `range` param exists (e.g. `range=30`), fetch last N days of workouts. This is needed for the History and Progress tabs.

Add after the `if (date)` block:

```ts
const range = request.nextUrl.searchParams.get("range");
if (!date && range) {
  const days = parseInt(range, 10);
  if (!isNaN(days) && days > 0) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    query = query.gte("logged_at", since.toISOString());
  }
}
```

**Step 3: Build and verify**

Run: `npm run build`

**Step 4: Commit**

```
feat: add POST handler and range param to workouts API
```

---

## Task 2: API — Exercise list + Progress endpoints

**Files:**
- Create: `src/app/api/workouts/exercises/route.ts`
- Create: `src/app/api/workouts/progress/route.ts`

**Step 1: Create exercises endpoint**

`GET /api/workouts/exercises?user_id=X` — returns distinct exercise names from the user's workout history. Used for the autocomplete in the Progress tab.

```ts
import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("workouts")
    .select("exercises")
    .eq("user_id", userId)
    .not("exercises", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Extract distinct exercise names from all workouts
  const nameSet = new Set<string>();
  for (const row of data ?? []) {
    const exercises = row.exercises as { name: string }[] | null;
    if (exercises) {
      for (const ex of exercises) {
        if (ex.name) nameSet.add(ex.name);
      }
    }
  }

  return NextResponse.json([...nameSet].sort());
}
```

**Step 2: Create progress endpoint**

`GET /api/workouts/progress?user_id=X&exercise=Panca+Piana` — returns all workout sessions that contain the specified exercise, with date + sets/reps/weight data. Used for the progression chart.

```ts
import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

interface ExerciseEntry {
  name: string;
  sets?: number;
  reps?: number;
  weight_kg?: number | null;
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const exercise = request.nextUrl.searchParams.get("exercise");

  if (!userId || !exercise) {
    return NextResponse.json({ error: "user_id and exercise required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("workouts")
    .select("id, logged_at, exercises")
    .eq("user_id", userId)
    .not("exercises", "is", null)
    .order("logged_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const lowerExercise = exercise.toLowerCase();
  const points: { date: string; weight_kg: number; sets: number; reps: number; volume: number }[] = [];

  for (const row of data ?? []) {
    const exercises = row.exercises as ExerciseEntry[] | null;
    if (!exercises) continue;

    for (const ex of exercises) {
      if (ex.name.toLowerCase() === lowerExercise && ex.weight_kg) {
        const volume = (ex.sets ?? 1) * (ex.reps ?? 1) * (ex.weight_kg ?? 0);
        points.push({
          date: row.logged_at,
          weight_kg: ex.weight_kg,
          sets: ex.sets ?? 0,
          reps: ex.reps ?? 0,
          volume,
        });
      }
    }
  }

  return NextResponse.json(points);
}
```

**Step 3: Build and verify**

Run: `npm run build`

**Step 4: Commit**

```
feat: add exercise list and progress API endpoints
```

---

## Task 3: Workout templates

**Files:**
- Create: `src/lib/workout-templates.ts`

**Step 1: Create templates file**

Define workout templates with pre-populated exercises. Each template has a name, icon, workout_type, and default exercises.

```ts
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
    icon: "💪",
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
    icon: "🏋️",
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
    icon: "🦵",
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
    icon: "💪",
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
    icon: "🦵",
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
    icon: "🔥",
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
    icon: "🏃",
    workout_type: "Cardio",
    exercises: [],
  },
  {
    id: "hiit",
    name_it: "HIIT",
    name_en: "HIIT",
    icon: "⚡",
    workout_type: "HIIT",
    exercises: [],
  },
  {
    id: "custom",
    name_it: "Personalizzato",
    name_en: "Custom",
    icon: "✏️",
    workout_type: "Palestra",
    exercises: [],
  },
];
```

**Step 2: Build and verify**

Run: `npm run build`

**Step 3: Commit**

```
feat: add workout templates (push, pull, legs, upper, lower, fullbody, cardio, hiit)
```

---

## Task 4: Translations

**Files:**
- Modify: `src/lib/translations.ts`

**Step 1: Add all new translation keys**

Add after the existing workouts section:

```ts
// ── Workouts page (premium) ──
"workoutsPage.tabToday": { it: "Oggi", en: "Today" },
"workoutsPage.tabHistory": { it: "Storico", en: "History" },
"workoutsPage.tabProgress": { it: "Progressi", en: "Progress" },
"workoutsPage.addWorkout": { it: "Aggiungi allenamento", en: "Add workout" },
"workoutsPage.streak": { it: "Streak", en: "Streak" },
"workoutsPage.days": { it: "giorni", en: "days" },
"workoutsPage.weeklyVolume": { it: "Volume settimanale", en: "Weekly volume" },
"workoutsPage.selectExercise": { it: "Seleziona esercizio", en: "Select exercise" },
"workoutsPage.maxWeight": { it: "Peso massimo", en: "Max weight" },
"workoutsPage.personalRecord": { it: "Record personale", en: "Personal record" },
"workoutsPage.recentSessions": { it: "Sessioni recenti", en: "Recent sessions" },
"workoutsPage.noData": { it: "Nessun dato disponibile", en: "No data available" },
"workoutsPage.last30": { it: "Ultimi 30 giorni", en: "Last 30 days" },
"workoutsPage.last90": { it: "Ultimi 90 giorni", en: "Last 90 days" },
// ── Add workout modal ──
"addWorkout.title": { it: "Nuovo allenamento", en: "New workout" },
"addWorkout.chooseTemplate": { it: "Scegli template", en: "Choose template" },
"addWorkout.type": { it: "Tipo", en: "Type" },
"addWorkout.duration": { it: "Durata (min)", en: "Duration (min)" },
"addWorkout.exercises": { it: "Esercizi", en: "Exercises" },
"addWorkout.exercise": { it: "Esercizio", en: "Exercise" },
"addWorkout.sets": { it: "Serie", en: "Sets" },
"addWorkout.reps": { it: "Reps", en: "Reps" },
"addWorkout.weight": { it: "Peso (kg)", en: "Weight (kg)" },
"addWorkout.addExercise": { it: "Aggiungi esercizio", en: "Add exercise" },
"addWorkout.save": { it: "Salva allenamento", en: "Save workout" },
"addWorkout.saving": { it: "Salvataggio...", en: "Saving..." },
```

**Step 2: Build and verify**

Run: `npm run build`

**Step 3: Commit**

```
feat: add workout premium translation keys
```

---

## Task 5: AddWorkoutModal component

**Files:**
- Create: `src/components/AddWorkoutModal.tsx`

**Step 1: Build the modal**

Full modal component with two views:
1. Template selection grid (9 templates)
2. Exercise editor (after template selected)

Follow the exact modal pattern from AddMealModal:
- AnimatePresence + overlay + motion.div
- springs.enter for animation
- Sticky header
- Scrollable body

The exercise editor has:
- Workout type (auto-set from template, editable)
- Duration input
- Exercise rows: name (text), sets (number), reps (number), weight_kg (number)
- "+" button to add exercise row
- Trash icon to remove row
- Save button at bottom

**Step 2: Build and verify**

Run: `npm run build`

**Step 3: Commit**

```
feat: add AddWorkoutModal with template selection and exercise editor
```

---

## Task 6: WorkoutCalendar component

**Files:**
- Create: `src/components/WorkoutCalendar.tsx`

**Step 1: Build the contribution heatmap calendar**

A GitHub-style contribution calendar that shows workout days as colored cells.

Props:
```ts
interface WorkoutCalendarProps {
  workoutDates: string[]; // array of YYYY-MM-DD strings where user worked out
  days?: number; // how many days to show (default 90)
}
```

Grid layout: 7 rows (Mon-Sun) x N columns (weeks). Each cell is a small square:
- No workout: `bg-surface` (dark)
- 1 workout: `bg-[var(--color-accent-dynamic)]/30`
- 2+ workouts: `bg-[var(--color-accent-dynamic)]/70`

Show month labels at the top. Use Tailwind grid with `gap-1`.

**Step 2: Build and verify**

Run: `npm run build`

**Step 3: Commit**

```
feat: add WorkoutCalendar contribution heatmap component
```

---

## Task 7: ExerciseProgressChart component

**Files:**
- Create: `src/components/ExerciseProgressChart.tsx`

**Step 1: Build the progress chart**

Uses Recharts LineChart to show weight progression for a selected exercise over time.

Props:
```ts
interface ExerciseProgressChartProps {
  data: { date: string; weight_kg: number; sets: number; reps: number; volume: number }[];
}
```

Features:
- LineChart with weight_kg on Y axis, date on X axis
- Dots on each data point
- Custom tooltip showing date, weight, sets x reps
- PR point highlighted with different color/size
- Use existing Recharts styling patterns (axisStyle, tooltipStyle from stats components)

**Step 2: Build and verify**

Run: `npm run build`

**Step 3: Commit**

```
feat: add ExerciseProgressChart with PR highlighting
```

---

## Task 8: Workouts page — complete rewrite with 3 tabs

**Files:**
- Modify: `src/app/dashboard/workouts/page.tsx`

**Step 1: Rewrite the page**

Complete rewrite with 3-tab layout:

**Tab navigation:** Horizontal tabs at the top with `layoutId` animation (same pattern as stats page period selector).

**Tab "Oggi":**
- DatePicker + stat cards (existing, improved)
- Workout list with expand (existing, improved)
- Floating "+" button → opens AddWorkoutModal
- Empty state with CTA

**Tab "Storico":**
- Streak counter (calculate from workout dates)
- WorkoutCalendar component
- Period selector (30/90 days)
- Weekly volume bar chart (Recharts BarChart)
- Workout list for period

**Tab "Progressi":**
- Exercise selector (dropdown populated from `/api/workouts/exercises`)
- ExerciseProgressChart when exercise selected
- PR badge
- Recent sessions table

Data fetching:
- Today tab: fetch workouts for selected date (existing)
- History tab: fetch last 90 days via `range=90`
- Progress tab: fetch exercise list + progress data on exercise selection

**Step 2: Build and verify**

Run: `npm run build`

**Step 3: Commit**

```
feat: rewrite workouts page with 3-tab premium layout
```

---

## Task 9: Final polish and push

**Step 1: Verify full build**

Run: `npm run build`

**Step 2: Test locally**

Run: `npm run dev` — manually verify:
- Tab navigation works
- Add workout modal opens, template selection works, exercise editing works, save works
- History tab shows calendar and charts
- Progress tab shows exercise selector and chart

**Step 3: Commit any fixes**

**Step 4: Push**

```bash
git push
```
