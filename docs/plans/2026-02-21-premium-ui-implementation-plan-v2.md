# Premium UI Redesign v2 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform ViTrack from a glassmorphism dark theme into an editorial typography-first design using ITC Orbon + Sohne + IBM Plex Mono, pure black/white palette, and bordered-data/borderless-section card system.

**Architecture:** Bottom-up approach — lay CSS foundation first (fonts, tokens), then rebuild navigation shell, then each page surface. Every task produces a buildable state (`npm run build` must pass after each commit). No test framework; validation is TypeScript strict build.

**Tech Stack:** Next.js 16, Tailwind CSS v4 (@theme inline), Framer Motion, Recharts, self-hosted .woff2 fonts

**Prerequisite:** User must place font files in `public/fonts/` before Task 1:
- `ITC-Orbon-Bold.woff2`
- `Sohne-Book.woff2` (or `Sohne-Buch.woff2` depending on foundry naming)
- `IBMPlexMono-Regular.woff2` (downloadable from Google Fonts / IBM)

Adjust filenames in Task 1 if actual files differ.

---

## Task 1: CSS Foundation — Fonts & Design Tokens

**Files:**
- Create: `public/fonts/` directory (user places font files here)
- Modify: `src/app/globals.css` (full rewrite of tokens + font-face)
- Modify: `src/app/layout.tsx` (remove Geist Sans, add font CSS vars)

**Step 1: Create fonts directory**

```bash
mkdir -p public/fonts
```

Verify the user has placed font files there. If IBM Plex Mono is missing, download it:
```bash
# IBM Plex Mono is open source — can be fetched from Google Fonts CDN
# or downloaded from https://github.com/IBM/plex/releases
```

**Step 2: Rewrite `src/app/globals.css`**

Replace the entire file with the new design system. Key changes:
- Add `@font-face` declarations for all 3 fonts
- Replace all `--color-*` tokens with new editorial palette
- Remove glassmorphism classes (`.glass-card`, `.glass-card-strong`)
- Remove `.gradient-text`, `.gradient-border`
- Add new utility classes: `.font-display`, `.font-body`, `.font-mono`, `.data-card`, `.section-label`
- Keep `.shimmer` but update colors
- Keep scrollbar styles but update colors
- Keep keyframe animations
- Update light theme variables

New `@theme inline` tokens:
```css
/* Fonts */
--font-display: 'ITC Orbon', Georgia, serif;
--font-body: 'Sohne', system-ui, -apple-system, sans-serif;
--font-mono: 'IBM Plex Mono', 'Menlo', monospace;

/* Base palette */
--color-background: #000000;
--color-surface: #0A0A0A;
--color-surface-raised: #111111;
--color-border: #1A1A1A;
--color-border-subtle: #141414;
--color-text-primary: #FFFFFF;
--color-text-secondary: #A0A0A0;
--color-text-tertiary: #585858;

/* Accent (default: ivory) */
--color-accent: #E8E4DE;
--color-accent-dynamic: #E8E4DE;

/* Data colors (keep) */
--color-protein: #3B82F6;
--color-carbs: #F59E0B;
--color-fat: #EF4444;
--color-fiber: #22C55E;
--color-water: #06B6D4;
--color-success: #22C55E;
--color-danger: #EF4444;
```

Remove these tokens entirely:
- `--color-card`, `--color-card-alt`, `--color-card-hover` (replaced by `--color-surface`, `--color-surface-raised`)
- `--color-border-light` (replaced by `--color-border-subtle`)
- `--color-accent-violet`, `--color-streak`, `--color-weight`, `--color-burned`, `--color-over-goal`

Add new utility layer after @theme:
```css
/* Editorial utility classes */
.font-display {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}
.font-body {
  font-family: var(--font-body);
}
.font-mono-label {
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 11px;
}
.data-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
}
```

**Step 3: Update `src/app/layout.tsx`**

Remove:
```tsx
import { Geist } from "next/font/google";
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
```

Update body className:
```tsx
<body className="font-body antialiased bg-background text-text-primary">
```

Remove `${geistSans.variable}` from className.

**Step 4: Verify build**

```bash
npm run build
```

Expected: PASS (may have warnings about unused old CSS class references — those get fixed in later tasks)

**Step 5: Commit**

```bash
git add public/fonts/ src/app/globals.css src/app/layout.tsx
git commit -m "feat: replace design system with editorial typography foundation

Add @font-face for ITC Orbon, Sohne, IBM Plex Mono.
Replace glassmorphism tokens with pure black/white editorial palette.
Remove glass-card, gradient-text, gradient-border utilities.
Add font-display, font-body, font-mono-label, data-card utilities."
```

---

## Task 2: Preferences Context — Reduce Accent Colors to 3

**Files:**
- Modify: `src/lib/preferences-context.tsx`

**Step 1: Update ACCENT_COLORS and AccentColor type**

Replace:
```tsx
export type AccentColor = "blue" | "violet" | "cyan" | "green" | "orange" | "pink";

const ACCENT_COLORS: Record<AccentColor, string> = {
  blue: "#3B82F6",
  violet: "#8B5CF6",
  cyan: "#06B6D4",
  green: "#22C55E",
  orange: "#F59E0B",
  pink: "#EC4899",
};
```

With:
```tsx
export type AccentColor = "ivory" | "red" | "blue";

const ACCENT_COLORS: Record<AccentColor, string> = {
  ivory: "#E8E4DE",
  red: "#E03C32",
  blue: "#6B8CAE",
};
```

**Step 2: Update default fallback**

Replace all `"blue"` defaults with `"ivory"` in `loadAccentColor` and the context default.

**Step 3: Verify build**

```bash
npm run build
```

Expected: May show type errors in settings page where old accent color names are referenced. Note them — they'll be fixed in Task 8.

If build fails with type errors in settings, temporarily widen the type or add a migration comment. Preferred: fix the settings references now to keep the build green.

**Step 4: Commit**

```bash
git add src/lib/preferences-context.tsx
git commit -m "feat: reduce accent colors to 3 curated editorial options

Ivory (default), Signal Red, Cold Blue — designed for B/W aesthetic."
```

---

## Task 3: Sidebar — Editorial Redesign

**Files:**
- Modify: `src/components/Sidebar.tsx`

**Step 1: Rewrite Sidebar component**

Key changes:
- Width: `w-60` → `w-[220px]`
- Background: remove `bg-card/80 backdrop-blur-xl`, use `bg-black border-r border-border`
- Logo: Replace VTLogo icon + "ViTrack" with just `<h1 className="font-display text-lg font-bold uppercase tracking-tight">VITRACK</h1>`
- Remove VTLogoIcon import
- Nav items: Keep icons but make them 16px stroke-only (#585858). Change text to `font-body text-sm`.
- Active state: white text + 4px accent dot left, remove `bg-white/[0.08]` and box-shadow
- Hover: `text-[#A0A0A0]`, no background change
- Remove chat button gradient glow
- User section: Name in `font-mono-label` (Plex Mono uppercase), email in `font-body text-xs text-text-tertiary`
- Remove avatar gradient fallback, use plain `bg-surface` circle with text
- Remove all `rounded-xl` from items, use no rounding on nav links (plain block)

Active indicator pattern:
```tsx
{isActive && (
  <motion.div
    layoutId="sidebar-indicator"
    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
    style={{ backgroundColor: accentHex }}
    transition={springs.smooth}
  />
)}
```

**Step 2: Update dashboard layout margin**

In `src/app/dashboard/layout.tsx`, if the sidebar width changed from `w-60` (240px) to `w-[220px]`, update the main content margin:
- `md:ml-60` → `md:ml-[220px]`

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/components/Sidebar.tsx src/app/dashboard/layout.tsx
git commit -m "feat: redesign sidebar with editorial typography style

VITRACK in Orbon, text nav with minimal stroke icons, accent dot indicator.
Remove glassmorphism, reduce width to 220px."
```

---

## Task 4: Bottom Nav — Text-Only Editorial

**Files:**
- Modify: `src/components/BottomNav.tsx`

**Step 1: Rewrite BottomNav component**

Key changes:
- Remove FAB (floating action button for chat) entirely
- Remove all icon imports and rendering
- Nav items: Plex Mono 10px uppercase with tracking (`font-mono-label text-[10px]`)
- Active: white text + dot underneath (accent color)
- Inactive: `text-text-tertiary`
- Add chat item as last entry: `...` text that triggers `toggleChat`
- Background: `bg-black border-t border-border` (no blur, no transparency)
- Remove `backdrop-blur-xl`

New nav items array:
```tsx
const navItems = [
  { href: "/dashboard", label: "HOME" },
  { href: "/dashboard/meals", label: "PASTI" },
  { href: "/dashboard/workouts", label: "WORKOUT" },
  { href: "/dashboard/stats", label: "STATS" },
];
```

Plus a chat toggle button rendering `···`.

Layout: flex justify-around, each item is a flex-col with text + optional dot.

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat: redesign bottom nav as text-only typographic strip

Plex Mono uppercase labels, no icons, no FAB. Chat via ellipsis item."
```

---

## Task 5: Login Page — Editorial Redesign

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Rewrite login page**

Key changes:
- Remove background gradient blobs (`bg-[#3B82F6]/[0.04]` circles)
- Title: `<h1 className="font-display text-5xl font-bold">VITRACK</h1>` — floats above card
- Form wrapper: `data-card` class (surface bg, border, rounded-lg) instead of `glass-card-strong`
- Tagline: `<p className="font-body text-sm text-text-tertiary">Track. Train. Transform.</p>`
- Tab switcher: `font-mono-label` text, active tab has underline in accent color
- Inputs: `bg-transparent border border-border rounded-lg` with focus `border-[var(--color-accent-dynamic)]`
- Remove `focus:shadow-[0_0_15px...]` glow effects
- CTA button: `bg-[var(--color-accent-dynamic)] text-black font-mono-label tracking-widest` — solid accent, no gradient
- Remove `bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]` everywhere
- Links below: `text-text-tertiary hover:text-text-primary` — no blue links
- Add decorative line: a `<div>` with decreasing-width spans in accent color below the form
- Input rounded: `rounded-xl` → `rounded-lg`
- Remove `animate-fade-in` from wrapper, add Framer Motion fade

Tab style function — replace gradient borderImage with solid accent underline:
```tsx
const tabStyle = (tab: Tab) =>
  activeTab === tab
    ? { borderBottomColor: 'var(--color-accent-dynamic)' }
    : undefined;
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redesign login page with editorial typography

Orbon title, surface card form, solid accent CTA, decorative typographic line.
Remove gradient blobs and glassmorphism."
```

---

## Task 6: Chat Panel — Editorial Redesign

**Files:**
- Modify: `src/components/ChatPanel.tsx`

**Step 1: Rewrite ChatPanel**

Key changes:
- Panel: remove `backdrop-blur-xl`, use `bg-black border-l border-border`
- Width: `md:w-[400px]` → `md:w-[380px]`
- Header: Remove gradient avatar circle. Replace with `<h2 className="font-mono-label text-text-secondary">ASSISTENTE</h2>`. Remove subtitle. Add close button.
- Remove `border-white/[0.06]` → `border-border`
- Quick commands: `font-mono-label text-[10px]` pill buttons with `border border-border rounded-lg hover:bg-surface-raised`. Remove `rounded-full` → `rounded-lg`.
- Message bubbles: `rounded-2xl rounded-bl-sm` → `rounded-lg` everywhere
- User messages: remove `bg-[#3B82F6]`, use `bg-[var(--color-accent-dynamic)]/10 text-text-primary`
- Assistant messages: `bg-surface border border-border rounded-lg`
- Meal saved: keep green tint but use `border-success/20`
- Error: keep red tint but use `border-danger/20`
- Loading dots: `bg-text-tertiary/30` instead of `bg-white/30`
- Input bar: remove `bg-white/[0.06] rounded-2xl` wrapper, use `border border-border rounded-lg bg-transparent`
- Send button: `bg-[var(--color-accent-dynamic)] text-black` instead of `bg-[#3B82F6]`
- Empty state: font-mono-label for title, font-body for subtitle
- Backdrop mobile: `bg-black/80` instead of `bg-black/60`

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/ChatPanel.tsx
git commit -m "feat: redesign chat panel with editorial style

Mono-label header, bordered messages, accent-tinted user bubbles.
Remove glassmorphism, gradient avatar, rounded-full elements."
```

---

## Task 7: Dashboard Home — Editorial Layout

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/CalorieProgress.tsx`
- Modify: `src/components/DailySummary.tsx`

**Step 1: Update dashboard page**

Key changes to `page.tsx`:
- Greeting section: `<h2 className="font-display text-2xl font-bold">DASHBOARD</h2>` replacing dynamic greeting as page title. Move user greeting below: `<p className="font-body text-base text-text-secondary">{getGreeting(...)}</p>`
- Section labels (meals, workouts headers): `font-mono-label text-text-tertiary` — already close, just ensure Plex Mono class
- Loading skeleton: replace `rounded-2xl` → `rounded-lg`, update shimmer bg colors
- Remove all `rounded-2xl` → `rounded-lg`
- Section spacing: `space-y-4` → `space-y-6` for expanded mode

**Step 2: Update CalorieProgress component**

Read current file first, then apply:
- Wrap in `data-card` class
- Hero number: `font-display text-4xl font-bold` for the calorie count
- "kcal su X" label: `font-body text-sm text-text-tertiary`
- Progress bar: `h-0.5 bg-border` track, accent fill with transition
- Percentage badge: `font-mono-label`
- Macro breakdown: `font-mono-label` with macro colors

**Step 3: Update DailySummary component**

Read current file first, then apply:
- Wrap in `data-card` class
- Macro labels: `font-mono-label`
- Values: `font-display text-lg font-bold`
- Remove any gradient or glassmorphism references

**Step 4: Verify build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx src/components/CalorieProgress.tsx src/components/DailySummary.tsx
git commit -m "feat: redesign dashboard home with editorial layout

Orbon title, data-card wrappers, 2px progress bars, mono-label sections."
```

---

## Task 8: Settings Page — Editorial + Fix Accent References

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

**Step 1: Fix accent color references**

Update the accent color picker section to use the new 3 colors (`ivory`, `red`, `blue`) instead of the old 6. Find all references to old AccentColor values and update them.

The settings page renders accent color swatches — update the iteration over `ACCENT_COLORS` to reflect the new 3 options. Update any label translations if needed.

**Step 2: Apply editorial styling**

- Page title: `<h1 className="font-display text-2xl font-bold">IMPOSTAZIONI</h1>` (or use translation key)
- Section headings: `font-mono-label text-text-tertiary` (e.g., "ACCOUNT", "OBIETTIVI", "PERSONALIZZAZIONE")
- Inputs: `rounded-xl` → `rounded-lg`, remove focus glow, use `focus:border-[var(--color-accent-dynamic)]`
- Buttons: remove gradient CTAs, use solid accent for primary, `border border-border` for secondary
- Danger section (reset data): wrap in card with `border-danger/20`
- Remove all `glass-card` / `glass-card-strong` references if any
- Remove `bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]` from any button
- Section spacing: `space-y-6` → `space-y-10` for more generous editorial spacing
- Theme selector buttons: update styling to use border/surface pattern
- Layout mode toggle: same pattern

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/dashboard/settings/page.tsx
git commit -m "feat: redesign settings page with editorial style

Update accent color picker to 3 curated options, mono-label section headers,
remove gradient CTAs and glassmorphism."
```

---

## Task 9: Meals Page — Editorial Redesign

**Files:**
- Modify: `src/app/dashboard/meals/page.tsx`
- Modify: `src/components/MealList.tsx`

**Step 1: Read current meals page and MealList component**

Read both files to understand current structure.

**Step 2: Update meals page**

- Title: `<h1 className="font-display text-2xl font-bold">PASTI</h1>`
- Date subtitle: `font-body text-sm text-text-tertiary`
- Category labels (COLAZIONE, PRANZO, etc.): `font-mono-label text-text-tertiary`
- Daily total summary: wrap in `data-card`, total kcal in `font-display text-2xl font-bold`
- Macro breakdown: `font-mono-label` with colors

**Step 3: Update MealList component**

- Meal items: wrap in `data-card` per category group
- Item rows: separated by `border-b border-border-subtle`
- Meal name: `font-body text-[15px]`
- Kcal value: `font-mono-label text-text-secondary`
- Macro breakdown per item: `font-mono-label text-[11px]` with macro colors
- Remove any `rounded-xl/2xl` → `rounded-lg`
- Remove glassmorphism/gradient references

**Step 4: Verify build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/app/dashboard/meals/page.tsx src/components/MealList.tsx
git commit -m "feat: redesign meals page with editorial typography

Orbon title, category labels in Plex Mono, data-card grouped items."
```

---

## Task 10: Workouts Page — Editorial Redesign

**Files:**
- Modify: `src/app/dashboard/workouts/page.tsx`
- Modify: `src/components/WorkoutList.tsx`

**Step 1: Read current files**

Read both to understand structure.

**Step 2: Apply editorial pattern**

Same approach as meals:
- Title: Orbon Bold `ALLENAMENTI`
- Summary stat cards: `data-card` with Orbon numbers, Plex Mono labels
- Workout items: borderless section with Sohne 16px name, Plex Mono details
- Exercise details (sets/reps/weight): `font-mono-label`
- Remove all gradient/glassmorphism
- `rounded-xl/2xl` → `rounded-lg`

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/dashboard/workouts/page.tsx src/components/WorkoutList.tsx
git commit -m "feat: redesign workouts page with editorial typography

Orbon title, data-card stats, mono-label exercise details."
```

---

## Task 11: Stats Page — Editorial Redesign

**Files:**
- Modify: `src/app/dashboard/stats/page.tsx`

**Step 1: Read current file**

**Step 2: Apply editorial pattern**

- Title: `font-display text-2xl font-bold` — "STATISTICHE"
- Period toggle (7G / 30G): `font-mono-label` pill buttons with `border border-border rounded-lg`
- 4 stat cards: `data-card` wrapper, numbers in `font-display text-xl font-bold`, labels in `font-mono-label text-[10px]`
- Chart section labels: `font-mono-label text-text-tertiary`
- Recharts customization: update axis tick font to IBM Plex Mono (via Recharts `tick` prop style), use accent color for main line, `#1A1A1A` for reference/grid lines
- Remove glassmorphism, gradient references
- `rounded-xl/2xl` → `rounded-lg`

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/dashboard/stats/page.tsx
git commit -m "feat: redesign stats page with editorial typography

Orbon numbers, mono-label pill toggle, accent chart lines."
```

---

## Task 12: Profile Page — Editorial Redesign

**Files:**
- Modify: `src/app/dashboard/profile/page.tsx`

**Step 1: Read current file**

**Step 2: Apply editorial pattern**

- Title: Orbon Bold "PROFILO"
- Section labels: `font-mono-label text-text-tertiary` (INFORMAZIONI, OBIETTIVI, DIETA)
- Form labels: `font-mono-label text-[11px] text-text-tertiary`
- Inputs: `rounded-lg border border-border bg-transparent focus:border-[var(--color-accent-dynamic)]`
- Save buttons: solid accent bg, text black, `font-mono-label`
- Avatar: remove gradient background, use `bg-surface border border-border`
- Stats section: `data-card` with Orbon numbers
- Remove glassmorphism, gradient refs
- Spacing between sections: 40px+ (`space-y-10`)

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/dashboard/profile/page.tsx
git commit -m "feat: redesign profile page with editorial typography

Orbon title, generous spacing, mono-label form labels, surface avatar."
```

---

## Task 13: Remaining Components — Editorial Polish

**Files:**
- Modify: `src/components/WaterTracker.tsx`
- Modify: `src/components/StreakCalendar.tsx`
- Modify: `src/components/WeightChart.tsx`
- Modify: `src/components/QuickAddBar.tsx`
- Modify: `src/components/AddMealModal.tsx`
- Modify: `src/components/ConfirmModal.tsx`
- Modify: `src/components/DatePicker.tsx`

**Step 1: Read each component file**

**Step 2: Apply editorial pattern to each**

Common changes across all:
- Replace `glass-card` / `glass-card-strong` with `data-card`
- Replace `rounded-xl` / `rounded-2xl` → `rounded-lg`
- Replace gradient buttons with solid accent buttons
- Replace `bg-white/[0.0X]` patterns with `bg-surface` or `bg-surface-raised`
- Replace `border-white/[0.0X]` with `border-border`
- Replace `text-white/XX` opacity patterns with `text-text-secondary` or `text-text-tertiary`
- Remove `backdrop-blur-*` from any component
- Ensure font-display for hero numbers, font-mono-label for labels
- WaterTracker: accent fill for water progress
- WeightChart: accent line color for chart, Plex Mono axis labels
- QuickAddBar: `font-mono-label` button labels, `border border-border rounded-lg`
- Modals: `bg-black` backdrop, `data-card` for modal body, Orbon for modal titles

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/components/WaterTracker.tsx src/components/StreakCalendar.tsx src/components/WeightChart.tsx src/components/QuickAddBar.tsx src/components/AddMealModal.tsx src/components/ConfirmModal.tsx src/components/DatePicker.tsx
git commit -m "feat: apply editorial design to all remaining components

Replace glassmorphism with data-cards, accent fills, mono-label typography."
```

---

## Task 14: Light Theme Update

**Files:**
- Modify: `src/app/globals.css` (light theme variables section)

**Step 1: Update `[data-theme="light"]` variables**

The light theme needs to follow the same editorial philosophy with inverted values:
```css
[data-theme="light"] {
  --color-background: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-surface-raised: #F5F5F5;
  --color-border: #E5E5E5;
  --color-border-subtle: #EEEEEE;
  --color-text-primary: #0A0A0A;
  --color-text-secondary: #585858;
  --color-text-tertiary: #A0A0A0;
}
```

Also update light-theme-specific selectors:
- `.shimmer` light variant colors
- `input[type="date"]` color scheme
- Scrollbar thumb colors

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: update light theme for editorial design system"
```

---

## Task 15: Cleanup Pass — Remove Unused Code

**Files:**
- Possibly modify: `src/components/VTLogo.tsx` (may be unused after sidebar change)
- Possibly modify: `src/components/ViTrackTransition.tsx`
- Modify: `src/components/icons.tsx` (remove unused icon variants if any)
- Grep for: any remaining `glass-card`, `gradient-text`, `gradient-border`, `bg-gradient-to-r from-[#3B82F6]`, `#8B5CF6`, `#3B82F6` hardcoded references

**Step 1: Search for leftover old design references**

```bash
grep -r "glass-card\|gradient-text\|gradient-border\|from-\[#3B82F6\]\|to-\[#8B5CF6\]\|backdrop-blur" src/ --include="*.tsx" --include="*.ts" -l
```

**Step 2: Fix any remaining references**

Replace hardcoded color values with CSS variable references or new tokens.

**Step 3: Check for unused imports**

Look for VTLogoIcon, gradient-related imports that are no longer used.

**Step 4: Verify build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove leftover glassmorphism and gradient references

Clean up unused imports, hardcoded colors, and deprecated CSS classes."
```

---

## Task 16: Final Build Verification

**Step 1: Full clean build**

```bash
rm -rf .next && npm run build
```

Expected: PASS with zero errors.

**Step 2: Visual check list (manual)**

Start dev server (`npm run dev`) and visually verify:
- [ ] Login page: Orbon title, surface card, accent CTA, decorative line
- [ ] Dashboard: Orbon "DASHBOARD", data-card calorie progress, borderless meal/workout sections
- [ ] Sidebar: text nav with stroke icons, accent dot, VITRACK in Orbon
- [ ] Bottom nav: Plex Mono uppercase text, no icons
- [ ] Chat panel: ASSISTENTE header, bordered messages, accent send button
- [ ] Meals page: category labels, data-card groups
- [ ] Workouts page: stat cards, exercise details
- [ ] Stats page: Orbon numbers, chart with accent line
- [ ] Settings: 3 accent colors, mono-label sections
- [ ] Profile: generous spacing, Orbon title
- [ ] Light theme: inverted correctly
- [ ] Mobile responsive: bottom nav works, chat opens from `...`

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: visual polish from final verification pass"
```

---

## Summary

| Task | Component | Files Modified |
|------|-----------|---------------|
| 1 | CSS Foundation | globals.css, layout.tsx |
| 2 | Preferences | preferences-context.tsx |
| 3 | Sidebar | Sidebar.tsx, layout.tsx |
| 4 | Bottom Nav | BottomNav.tsx |
| 5 | Login | page.tsx (root) |
| 6 | Chat Panel | ChatPanel.tsx |
| 7 | Dashboard | page.tsx, CalorieProgress, DailySummary |
| 8 | Settings | settings/page.tsx |
| 9 | Meals | meals/page.tsx, MealList.tsx |
| 10 | Workouts | workouts/page.tsx, WorkoutList.tsx |
| 11 | Stats | stats/page.tsx |
| 12 | Profile | profile/page.tsx |
| 13 | Remaining Components | 7 component files |
| 14 | Light Theme | globals.css |
| 15 | Cleanup | grep + fix leftovers |
| 16 | Verification | build + visual check |

Total: ~25 files modified across 16 tasks.
