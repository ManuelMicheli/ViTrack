# ViTrack Premium UI/UX Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform ViTrack into a premium fitness platform with rich dashboard, MyFitnessPal-style meal input, and comprehensive settings.

**Architecture:** Incremental redesign - update design system first, then backend APIs for new features, then rebuild each page/component with premium styling. All pages are client-side React components using Next.js App Router with Supabase backend.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Supabase, Recharts, OpenAI API

---

### Task 1: Database Migration - Water & Weight Tables

**Files:**
- Create: `supabase/migrations/002_water_weight_tables.sql`

**Step 1: Write the migration SQL**

```sql
-- Water tracking
CREATE TABLE water_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  glasses INT NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, date)
);

-- Weight tracking
CREATE TABLE weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,1) NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_water_user_date ON water_logs(user_id, date);
CREATE INDEX idx_weight_user_logged ON weight_logs(user_id, logged_at);

ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on water_logs"
  ON water_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on weight_logs"
  ON weight_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

**Step 2: Run migration on Supabase**

Execute the SQL in Supabase dashboard SQL editor or via CLI.

**Step 3: Commit**

```bash
git add supabase/migrations/002_water_weight_tables.sql
git commit -m "feat: add water_logs and weight_logs tables"
```

---

### Task 2: TypeScript Types Update

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Add new types at the end of the file**

```typescript
export interface WaterLog {
  id: string;
  user_id: string;
  glasses: number;
  date: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_at: string;
}
```

**Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add WaterLog and WeightLog types"
```

---

### Task 3: New API Routes

**Files:**
- Create: `src/app/api/water/route.ts`
- Create: `src/app/api/weight/route.ts`
- Modify: `src/app/api/meals/route.ts` (add POST and DELETE)
- Modify: `src/app/api/workouts/route.ts` (add DELETE)
- Create: `src/app/api/reset-data/route.ts`

**Step 1: Create water API**

`src/app/api/water/route.ts`:
```typescript
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const date = request.nextUrl.searchParams.get("date");

  if (!userId || !date) {
    return NextResponse.json({ error: "user_id and date required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("water_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || { glasses: 0, date });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, glasses, date } = body;

  if (!user_id || glasses == null || !date) {
    return NextResponse.json({ error: "user_id, glasses, date required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("water_logs")
    .upsert({ user_id, glasses, date }, { onConflict: "user_id,date" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

**Step 2: Create weight API**

`src/app/api/weight/route.ts`:
```typescript
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const limit = request.nextUrl.searchParams.get("limit") || "30";

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(parseInt(limit));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, weight_kg } = body;

  if (!user_id || !weight_kg) {
    return NextResponse.json({ error: "user_id and weight_kg required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("weight_logs")
    .insert({ user_id, weight_kg })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

**Step 3: Add POST and DELETE to meals API**

Add to the existing `src/app/api/meals/route.ts` after the GET function:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, description, calories, protein_g, carbs_g, fat_g, fiber_g, meal_type } = body;

  if (!user_id || !description || calories == null || !meal_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("meals")
    .insert({ user_id, description, calories, protein_g, carbs_g, fat_g, fiber_g, meal_type })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const userId = request.nextUrl.searchParams.get("user_id");

  if (!id || !userId) {
    return NextResponse.json({ error: "id and user_id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("meals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 4: Add DELETE to workouts API**

Add to the existing `src/app/api/workouts/route.ts` after the GET function:

```typescript
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const userId = request.nextUrl.searchParams.get("user_id");

  if (!id || !userId) {
    return NextResponse.json({ error: "id and user_id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 5: Create reset-data API**

`src/app/api/reset-data/route.ts`:
```typescript
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const type = request.nextUrl.searchParams.get("type"); // meals | workouts | all

  if (!userId || !type) {
    return NextResponse.json({ error: "user_id and type required" }, { status: 400 });
  }

  const errors: string[] = [];

  if (type === "meals" || type === "all") {
    const { error } = await supabase.from("meals").delete().eq("user_id", userId);
    if (error) errors.push(`meals: ${error.message}`);
  }

  if (type === "workouts" || type === "all") {
    const { error } = await supabase.from("workouts").delete().eq("user_id", userId);
    if (error) errors.push(`workouts: ${error.message}`);
  }

  if (type === "all") {
    const { error: wErr } = await supabase.from("water_logs").delete().eq("user_id", userId);
    if (wErr) errors.push(`water: ${wErr.message}`);
    const { error: wtErr } = await supabase.from("weight_logs").delete().eq("user_id", userId);
    if (wtErr) errors.push(`weight: ${wtErr.message}`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 6: Commit**

```bash
git add src/app/api/water/route.ts src/app/api/weight/route.ts src/app/api/meals/route.ts src/app/api/workouts/route.ts src/app/api/reset-data/route.ts
git commit -m "feat: add water, weight, reset-data APIs and meal/workout POST/DELETE"
```

---

### Task 4: Design System Update

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Replace entire globals.css with premium design system**

```css
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-geist-sans);

  /* Base colors */
  --color-background: #000000;
  --color-card: #0A0A0A;
  --color-card-alt: #111111;
  --color-card-hover: #141414;
  --color-border: #1A1A1A;
  --color-border-light: #242424;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A1A1A1;
  --color-text-tertiary: #666666;

  /* Macro colors */
  --color-protein: #3B82F6;
  --color-carbs: #F59E0B;
  --color-fat: #EF4444;
  --color-fiber: #22C55E;
  --color-burned: #F59E0B;
  --color-over-goal: #EF4444;

  /* Accent */
  --color-accent: #3B82F6;
  --color-accent-violet: #8B5CF6;
  --color-water: #06B6D4;
  --color-streak: #F59E0B;
  --color-weight: #A78BFA;
  --color-success: #22C55E;
  --color-danger: #EF4444;

  /* Animation */
  --animate-fade-in: fade-in 0.5s ease-out;
  --animate-slide-up: slide-up 0.4s ease-out;
  --animate-scale-in: scale-in 0.3s ease-out;
  --animate-shimmer: shimmer 1.5s infinite;
  --animate-pulse-glow: pulse-glow 2s infinite;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(59, 130, 246, 0.15); }
  50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
}

body {
  background: #000000;
  color: #FFFFFF;
}

/* Premium glassmorphism card utility */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
}

.glass-card-strong {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.5rem;
}

/* Gradient accent text */
.gradient-text {
  background: linear-gradient(135deg, #3B82F6, #8B5CF6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Gradient accent border */
.gradient-border {
  position: relative;
}
.gradient-border::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* Shimmer loading */
.shimmer {
  background: linear-gradient(90deg, #111111 25%, #1a1a1a 50%, #111111 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Dark date input styling */
input[type="date"] {
  color-scheme: dark;
}
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

**Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: premium design system with glassmorphism and animations"
```

---

### Task 5: Icons Update - Add new icons

**Files:**
- Modify: `src/components/icons.tsx`

**Step 1: Add SettingsIcon, PlusIcon, WaterIcon, ScaleIcon, FireIcon at the end of the file**

```typescript
export function SettingsIcon({ className, filled }: IconProps) {
  if (filled) {
    return (
      <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.611 3.611 0 0112 15.6z"/></svg>
    );
  }
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
  );
}

export function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  );
}

export function WaterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
  );
}

export function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3H8a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2z"/><path d="M12 9a2 2 0 100 4 2 2 0 000-4z"/></svg>
  );
}

export function FireIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>
  );
}

export function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
  );
}

export function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  );
}

export function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/icons.tsx
git commit -m "feat: add settings, plus, water, scale, fire, trash, close, edit icons"
```

---

### Task 6: ConfirmModal Component

**Files:**
- Create: `src/components/ConfirmModal.tsx`

**Step 1: Create the modal**

```typescript
"use client";

import { CloseIcon } from "./icons";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  danger = false,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative glass-card-strong p-6 w-full max-w-sm animate-scale-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-[#A1A1A1] hover:text-white transition-colors"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-[#A1A1A1] mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-[#111111] text-[#A1A1A1] text-sm font-medium hover:bg-[#1A1A1A] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
              danger
                ? "bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20"
                : "bg-white text-black hover:bg-white/90"
            }`}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ConfirmModal.tsx
git commit -m "feat: add ConfirmModal component with glassmorphism"
```

---

### Task 7: Navigation Refresh - Sidebar & BottomNav

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/BottomNav.tsx`

**Step 1: Rewrite Sidebar.tsx with premium styling and Settings nav item**

Replace the entire `Sidebar.tsx` content. Key changes:
- Add gradient ViTrack logo
- Add Settings nav item (replacing Profile in nav)
- Glassmorphism background
- Active state with gradient indicator instead of border

**Step 2: Rewrite BottomNav.tsx**

Replace with updated nav items matching sidebar (Dashboard, Pasti, Allenam., Stats, Impostaz.) and premium styling with glass background.

**Step 3: Commit**

```bash
git add src/components/Sidebar.tsx src/components/BottomNav.tsx
git commit -m "feat: premium navigation with glassmorphism and settings route"
```

---

### Task 8: AddMealModal Component - AI-Powered Meal Input

**Files:**
- Create: `src/components/AddMealModal.tsx`

**Step 1: Create the meal input modal**

Key features:
- Meal type tabs (colazione/pranzo/cena/snack) auto-selected by time of day
- Large textarea for AI free-text input
- "Analizza" button that calls `/api/meals/analyze` or uses the existing OpenAI classification
- Results display with individual ingredient cards showing macros
- Edit/delete per ingredient
- Total summary
- "Salva Pasto" button that POSTs to `/api/meals`
- Skeleton shimmer during AI analysis

**Step 2: Create the analyze API endpoint**

Create `src/app/api/meals/analyze/route.ts` that takes a text description and returns parsed meal data using the existing OpenAI `classifyMessage` function from `src/lib/openai.ts`.

**Step 3: Commit**

```bash
git add src/components/AddMealModal.tsx src/app/api/meals/analyze/route.ts
git commit -m "feat: AI-powered meal input modal with ingredient breakdown"
```

---

### Task 9: Dashboard Widgets

**Files:**
- Create: `src/components/QuickAddBar.tsx`
- Create: `src/components/WaterTracker.tsx`
- Create: `src/components/StreakCalendar.tsx`
- Create: `src/components/WeightChart.tsx`
- Modify: `src/components/CalorieProgress.tsx` (premium refresh)
- Modify: `src/components/DailySummary.tsx` (premium refresh)
- Modify: `src/components/MealList.tsx` (premium refresh)
- Modify: `src/components/WorkoutList.tsx` (premium refresh)

**Step 1: Create QuickAddBar**

Sticky bar with 4 action buttons (Pasto, Acqua, Allenamento, Peso). Each opens a relevant modal or inline input. Uses glassmorphism styling, gradient icons.

**Step 2: Create WaterTracker**

Glass card with 8 water glass icons. Click to increment. Shows `X/8 bicchieri`. Uses `/api/water` to persist. Fill animation on each glass.

**Step 3: Create StreakCalendar**

Glass card showing last 30 days as a dot grid. Green dot = day with logged meals/workouts. Shows streak count ("12 giorni consecutivi"). Uses existing summary API to check if data exists per day.

**Step 4: Create WeightChart**

Glass card with mini sparkline (Recharts LineChart). Shows latest weight, weekly delta ("+0.3 kg" or "-0.5 kg" with color). Uses `/api/weight` data.

**Step 5: Update CalorieProgress**

Add glassmorphism card styling, gradient stroke on SVG ring (use `linearGradient` defs), animate-on-mount with CSS transition, luminous shadow on the ring.

**Step 6: Update DailySummary**

Replace flat cards with glass cards, add progress bars under each macro showing % of recommended daily intake, add subtle glow on values.

**Step 7: Update MealList and WorkoutList**

Glass card wrappers, add delete button per item (with ConfirmModal), improved spacing, subtle hover animations.

**Step 8: Commit**

```bash
git add src/components/QuickAddBar.tsx src/components/WaterTracker.tsx src/components/StreakCalendar.tsx src/components/WeightChart.tsx src/components/CalorieProgress.tsx src/components/DailySummary.tsx src/components/MealList.tsx src/components/WorkoutList.tsx
git commit -m "feat: dashboard widgets - quick-add, water, streak, weight + premium refresh"
```

---

### Task 10: Dashboard Page Redesign

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Rewrite dashboard page with new layout**

Layout order:
1. QuickAddBar (sticky)
2. DatePicker
3. Row: CalorieProgress + DailySummary (macro bars)
4. Row: WaterTracker + StreakCalendar
5. Row: WeightChart + MealList (today's meals timeline)
6. WorkoutList (full width)

Add state for AddMealModal (opened by QuickAddBar "Pasto" button).
Fetch water data alongside summary.
Fetch weight data for sparkline.
Add animated fade-in on each section.

**Step 2: Update loading skeleton with shimmer class**

Replace `animate-pulse` with the new `shimmer` class from globals.css.

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: rich dashboard with all premium widgets"
```

---

### Task 11: Meals Page Redesign

**Files:**
- Modify: `src/app/dashboard/meals/page.tsx`

**Step 1: Rewrite meals page**

Key changes:
- Group meals by type (Colazione, Pranzo, Cena, Snack) with section headers
- Subtotals per section
- "+" button per section to add meal directly to that type
- Delete button per meal (with ConfirmModal)
- Daily summary bar at bottom with progress indicator
- Glass card styling throughout
- Remove filter buttons (grouping replaces filtering)
- AddMealModal integration

**Step 2: Commit**

```bash
git add src/app/dashboard/meals/page.tsx
git commit -m "feat: meals page with grouped sections and inline add"
```

---

### Task 12: Workouts Page Refresh

**Files:**
- Modify: `src/app/dashboard/workouts/page.tsx`

**Step 1: Premium refresh**

- Glass card styling
- Delete button per workout (with ConfirmModal)
- Better exercise display with card-style layout
- Empty state with illustration placeholder
- Improved expand animation

**Step 2: Commit**

```bash
git add src/app/dashboard/workouts/page.tsx
git commit -m "feat: premium workouts page with delete and glass cards"
```

---

### Task 13: Stats Page Enhancement

**Files:**
- Modify: `src/app/dashboard/stats/page.tsx`

**Step 1: Premium refresh**

- Glass card styling on all elements
- Gradient accent on summary cards
- Improved chart styling with gradient fills
- Custom tooltip with glassmorphism
- Period selector with premium pill style
- Subtle animation on card load

**Step 2: Commit**

```bash
git add src/app/dashboard/stats/page.tsx
git commit -m "feat: enhanced stats page with premium styling"
```

---

### Task 14: Settings Page (New)

**Files:**
- Create: `src/app/dashboard/settings/page.tsx`

**Step 1: Create settings page**

Sections:
1. **Profilo** - Name, username, calorie goal (editable inline)
2. **Obiettivi** - Water goal (editable), target weight (editable)
3. **Gestione Dati** - Three reset buttons:
   - "Azzera dati dieta" - Deletes all meals (ConfirmModal)
   - "Azzera dati allenamento" - Deletes all workouts (ConfirmModal)
   - "Azzera tutti i dati" - Deletes everything (ConfirmModal with DOUBLE confirm - first modal asks "Sei sicuro?", if confirmed shows second "Questa azione è irreversibile. Digita CONFERMA per procedere" with text input)
4. **Logout** button

Uses `/api/reset-data` DELETE endpoint.
Uses `/api/user` for profile updates (need to add PATCH to user API).

**Step 2: Add PATCH to user API**

Modify `src/app/api/user/route.ts` to add PATCH handler for updating `daily_calorie_goal`.

**Step 3: Commit**

```bash
git add src/app/dashboard/settings/page.tsx src/app/api/user/route.ts
git commit -m "feat: settings page with reset data and editable goals"
```

---

### Task 15: Profile Page Update

**Files:**
- Modify: `src/app/dashboard/profile/page.tsx`

**Step 1: Premium refresh**

- Glassmorphism avatar card with gradient border
- Glass info cards
- Link to Settings page instead of inline logout
- Weight history section (mini chart)
- Member stats (days since joined, total meals logged, total workouts)
- Remove logout (moved to Settings)

**Step 2: Commit**

```bash
git add src/app/dashboard/profile/page.tsx
git commit -m "feat: premium profile page with stats and glass styling"
```

---

### Task 16: Login Page Premium Refresh

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Premium login**

- Gradient ViTrack title
- Glassmorphism form card
- Subtle background gradient or pattern
- Improved input styling with focus glow
- Animated button

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: premium login page with gradient and glassmorphism"
```

---

### Task 17: DatePicker Premium Refresh

**Files:**
- Modify: `src/components/DatePicker.tsx`

**Step 1: Premium styling**

- Glass pill container
- Smoother navigation with fade transitions
- Better "Oggi" button styling
- Larger touch targets

**Step 2: Commit**

```bash
git add src/components/DatePicker.tsx
git commit -m "feat: premium date picker with glass styling"
```

---

### Task 18: Final Verification

**Step 1: Run build**

```bash
npm run build
```

Expected: Build succeeds without errors.

**Step 2: Fix any TypeScript or build errors**

**Step 3: Manual test checklist**

- [ ] Login page loads with premium styling
- [ ] Dashboard shows all widgets (calorie ring, macros, water, streak, weight, meals, workouts)
- [ ] Quick-add bar opens meal modal
- [ ] Meal modal: type text, analyze, see results, save
- [ ] Water tracker: click to increment
- [ ] Meals page: grouped by type, delete works
- [ ] Workouts page: premium cards, delete works
- [ ] Stats page: enhanced charts
- [ ] Settings page: edit calorie goal, reset data works (all 3 options)
- [ ] Navigation: sidebar + bottom nav show Settings

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: resolve build issues from premium UI redesign"
```
