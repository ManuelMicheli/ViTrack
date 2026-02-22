# Workouts Premium Page Design

## Date: 2026-02-22

## Summary

Complete redesign of the workouts page from a basic list view into a premium 3-tab experience with workout creation, historical calendar, and exercise progression tracking.

## Structure: 3 Tabs

### Tab 1: "Oggi" (Today)

- Header: title + DatePicker (existing)
- 3 stat cards: Sessions, Duration, Calories burned — upgraded design
- Workout list with expandable exercise details (improved visuals)
- Floating "+" button → opens add workout modal
- Empty state with motivational message + quick-add CTA

### Tab 2: "Storico" (History)

- Contribution-style calendar grid (GitHub heatmap) showing workout days
- Streak counter (consecutive days trained)
- Weekly volume bar chart (Recharts — already in project deps)
- Workout list filtered by period (last 7/30 days)

### Tab 3: "Progressi" (Progress)

- Exercise selector dropdown (autocomplete, populated from user's exercise history)
- Line chart showing max weight progression over time for selected exercise
- Personal Record (PR) badge highlighted
- Table of recent sessions for that exercise

## Add Workout Flow (Modal)

### Step 1: Choose Template

Templates: Push, Pull, Legs, Upper, Lower, Full Body, Cardio, HIIT, Custom (empty).
Each template has pre-populated exercises list.

### Step 2: Customize Exercises

- Editable exercise list: name, sets, reps, weight_kg
- "+" button to add row
- Swipe/button to delete row
- Workout type and duration inputs at top

### Step 3: Save

Review summary → save to database.

## Technical Details

### No New DB Tables

Existing `workouts` table with `exercises` JSONB column is sufficient.

### New API Endpoint

`POST /api/workouts` — saves workout from web (currently only Telegram creates workouts).

### New Files

- `src/lib/workout-templates.ts` — static template definitions
- `src/components/AddWorkoutModal.tsx` — modal with template selection + exercise editor
- `src/components/WorkoutCalendar.tsx` — contribution-style heatmap calendar
- `src/components/ExerciseProgressChart.tsx` — Recharts line chart for exercise progression

### Modified Files

- `src/app/dashboard/workouts/page.tsx` — complete rewrite with 3-tab layout
- `src/app/api/workouts/route.ts` — add POST handler
- `src/lib/translations.ts` — new translation keys for all new UI elements

### API Changes

- `GET /api/workouts` — add optional `range` param for history (last 30/90 days)
- `POST /api/workouts` — new, accepts { user_id, description, workout_type, duration_min, exercises[] }
- `GET /api/workouts/exercises` — new, returns distinct exercise names for the user (for autocomplete)
- `GET /api/workouts/progress` — new, returns all sessions containing a specific exercise (for chart)
