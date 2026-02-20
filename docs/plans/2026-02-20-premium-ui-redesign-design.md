# ViTrack Premium UI/UX Redesign

**Date**: 2026-02-20
**Status**: Approved

## Overview

Complete UI/UX overhaul of ViTrack to achieve a premium fitness platform feel, inspired by MyFitnessPal and Fatsecret for meal input, with a richer dashboard and comprehensive settings.

## Design Decisions

- **Meal input**: AI-powered free text (reuses existing OpenAI integration) with graphical UI
- **Telegram**: Kept as alternative input method alongside web app
- **Theme**: Dark premium - glassmorphism, soft gradients, fluid animations on black (#000) base
- **Dashboard widgets**: Calorie ring, macros, water tracker, streak calendar, weight trend, quick-add bar
- **Settings**: New dedicated page with "reset data" functionality (diet/workouts/all)

## 1. Design System

- Background: #000000 with layers #0A0A0A, #111111
- Glassmorphism: `backdrop-blur-xl`, `border-white/5`, `bg-white/[0.03]`
- Accent gradient: #3B82F6 (blue) to #8B5CF6 (violet)
- Animations: 300ms ease transitions, @keyframes for progress elements
- Typography: varied weights (light for big numbers, semibold for labels)
- Luminous shadows: `shadow-[0_0_15px_rgba(59,130,246,0.1)]`
- Border radius: rounded-2xl standard, rounded-3xl for large cards

## 2. Dashboard

- Quick-Add Bar: sticky top with 4 buttons (meal, water, workout, weight)
- Calorie Ring: animated on load, gradient color changes
- Macro Breakdown: 4 horizontal progress bars with % and grams
- Water Tracker: clickable glasses, fill animation
- Streak Calendar: 30-day dot calendar (green = logged)
- Weight Trend: mini sparkline with weekly delta
- Meals Timeline: grouped by meal type
- Workouts: horizontal cards with duration/calories/type

## 3. Meal Input (MyFitnessPal style)

- Modal overlay with meal type tabs (auto-selected by time of day)
- AI-powered free text input field
- Results display: individual ingredients with editable macros
- Edit/delete per ingredient before saving
- Loading: skeleton shimmer during AI analysis
- Total summary before confirmation

## 4. Meals Page

- Grouped by meal type (colazione/pranzo/cena/snack)
- Subtotals per section
- "+" button to add directly to a section
- Edit/delete per meal
- Daily summary bar at bottom with progress indicator

## 5. Settings Page

- Profile section: name, username, calorie goal (editable)
- Goals section: daily water, target weight
- Data Management section:
  - "Azzera dati dieta" - delete all meals
  - "Azzera dati allenamento" - delete all workouts
  - "Azzera tutti i dati" - delete everything (double confirmation)
- Logout button

## New Database Tables

- `water_logs`: user_id (UUID FK), glasses (INT), date (DATE)
- `weight_logs`: user_id (UUID FK), weight_kg (DECIMAL), logged_at (TIMESTAMPTZ)

## New API Routes

- POST /api/meals - create meal from web
- DELETE /api/meals - delete meal
- POST /api/workouts - create workout from web
- DELETE /api/workouts - delete workout
- GET/POST /api/water - water tracker
- GET/POST /api/weight - weight log
- DELETE /api/reset-data - reset data (type: meals/workouts/all)

## New Components

- QuickAddBar, WaterTracker, StreakCalendar, WeightChart
- AddMealModal, ConfirmModal, SettingsPage
