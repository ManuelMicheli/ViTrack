# ViTrack Premium UI Redesign v2

**Date:** 2026-02-21
**Direction:** Editorial typography-first, Kinfolk magazine meets Nike Training
**Scope:** Full platform — login, dashboard, all pages, sidebar, bottom nav, chat panel

---

## 1. Typography System

Three-tier hierarchy using premium typefaces:

| Level | Font | Usage | Specs |
|-------|------|-------|-------|
| **Display** | ITC Orbon Bold | H1, H2, hero numbers, page titles | 28-48px, letter-spacing: -0.02em |
| **Body** | Sohne Book | Paragraphs, descriptions, UI text, nav labels | 14-18px, line-height: 1.5 |
| **Mono** | IBM Plex Mono Regular | Tags, numeric labels, categories, metadata | 11-13px, uppercase, letter-spacing: +0.1em |

**Rules:**
- Orbon never below 20px (loses legibility)
- Sohne never above 20px for body text
- Plex Mono always uppercase with wide tracking when used as label
- Large numbers (total calories, weight, percentages) use Orbon for visual impact

**Font loading:** Self-hosted .woff2 files in `public/fonts/`, loaded via `@font-face` in globals.css.

**CSS Variables:**
```css
--font-display: 'ITC Orbon', serif;
--font-body: 'Sohne', sans-serif;
--font-mono: 'IBM Plex Mono', monospace;
```

---

## 2. Color System

### Base Palette — Pure Editorial Black

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#000000` | Page background |
| `--surface` | `#0A0A0A` | Bordered data cards |
| `--surface-raised` | `#111111` | Hover states, elevated elements |
| `--border` | `#1A1A1A` | Card borders |
| `--border-subtle` | `#141414` | Light separators |
| `--text-primary` | `#FFFFFF` | Titles, hero numbers, CTA text |
| `--text-secondary` | `#A0A0A0` | Body text, descriptions |
| `--text-tertiary` | `#585858` | Placeholder, metadata, inactive labels |

### 3 Curated Accent Colors

| Name | Hex | Vibe |
|------|-----|------|
| **Ivory** (default) | `#E8E4DE` | Warm white, editorial, elegant |
| **Signal Red** | `#E03C32` | Bold, statement |
| **Cold Blue** | `#6B8CAE` | Desaturated, calm, tech |

Accent applies to: primary CTAs, progress bar fill, active nav indicator, link hover, focus border.

### Data Colors (unchanged, required for readability)

| Data | Hex |
|------|-----|
| Protein | `#3B82F6` |
| Carbs | `#F59E0B` |
| Fat | `#EF4444` |
| Fiber | `#22C55E` |
| Water | `#06B6D4` |
| Success | `#22C55E` |
| Error | `#EF4444` |

**Key rule:** Data colors appear ONLY inside bordered containers. App chrome (nav, headers, spacing) stays strictly B/W + accent.

---

## 3. Card & Container System

### Two container types:

**Bordered Data Cards:**
- Border: 1px `#1A1A1A`
- Background: `#0A0A0A`
- Border-radius: 8px (rounded-lg, more technical)
- Padding: 20px
- Progress bars: 2px height, accent fill, bg `#1A1A1A`

**Borderless Sections:**
- No visible container
- Separation via spacing (24px gap between items)
- Optional divider: 1px `#141414` between items
- Section labels in Plex Mono 11px, #585858, uppercase

---

## 4. Navigation

### Sidebar (Desktop)
- Width: 220px
- Background: `#000` (same as page bg, separated by right border `#1A1A1A`)
- Logo: "VITRACK" in Orbon Bold 18px, white, uppercase
- Nav items: Sohne 14px with minimal stroke-only icons (16px, #585858)
- Active state: white text + 4px dot (accent color) left of text
- Hover: text `#A0A0A0`
- User info at bottom: name in Plex Mono 11px uppercase, email in Sohne 12px #585858

### Bottom Nav (Mobile)
- Text-only: Plex Mono 10px uppercase with tracking
- No icons, no FAB
- Active: white text + dot underneath (accent)
- Inactive: `#585858`
- Chat accessed via last item `...` or gesture

---

## 5. Login Page
- Title "VITRACK" in Orbon Bold 48px floats above
- Form contained in surface card (#0A0A0A, border #1A1A1A, rounded-lg)
- Tagline "Track. Train. Transform." in Sohne 14px #585858
- Tab switcher: Plex Mono 11px, active = underline accent
- Inputs: bg transparent, border 1px #1A1A1A, focus = accent border
- CTA "ACCEDI": bg accent, text #000, Plex Mono 12px uppercase
- Decorative typographic line below (decreasing dashes in accent color)
- Centered layout, max-width 360px

---

## 6. Chat Panel
- Width: 380px desktop, full-screen mobile
- Header: "ASSISTENTE" in Plex Mono 11px uppercase, border-bottom #1A1A1A
- Message bubbles: rounded-lg (8px), not rounded-full
  - User: bg accent/10, text white
  - Assistant: bg #0A0A0A, border #1A1A1A
  - Meal saved: Plex Mono status + macro breakdown
- Quick commands: pill buttons, border #1A1A1A, Plex Mono 10px uppercase
- Input: Sohne 14px, border #1A1A1A, focus accent

---

## 7. Page Designs

### Dashboard Home
- Title: Orbon Bold 28px "DASHBOARD"
- Greeting: Sohne 16px #A0A0A0
- Calorie card (bordered): Orbon Bold 40px hero number, 2px progress bar
- Water + Streak: 2-column grid, bordered cards, Orbon Bold 28px numbers
- Weight section (bordered): Orbon Bold 32px, chart with accent line
- Meals today (borderless): Sohne 15px items, Plex Mono numbers
- Workouts (borderless): Sohne 15px items

### Meals Page
- Title: Orbon Bold 28px "PASTI", date in Sohne 14px #585858
- Category labels: Plex Mono 11px uppercase
- Meal items in bordered cards, grouped by category
- Per-item: Sohne 15px name + Plex Mono kcal, macro breakdown in colors
- Daily total: bordered summary, Orbon Bold 28px total kcal

### Stats Page
- Title: Orbon Bold 28px "STATISTICHE"
- Period toggle: Plex Mono 11px pills (7G / 30G)
- 4 stat cards: Orbon Bold 24px numbers, Plex Mono 10px labels
- Charts: accent color lines, Plex Mono 10px axes, dashed reference lines

### Settings & Profile
- Same patterns: Orbon titles, Plex Mono form labels (uppercase), bordered inputs
- Sections separated by generous spacing (40px+)
- Destructive actions in bordered card with #EF4444/20 border

---

## 8. Animations & Interactions
- Maintain Framer Motion for page transitions and micro-interactions
- Reduce animation intensity: prefer opacity fades over scale transforms
- Progress bars: smooth 0.6s ease transitions
- whileTap: scale(0.98) on interactive elements
- Stagger animations: 50ms delay between list items

---

## 9. Responsive Breakpoints
- Mobile-first approach maintained
- Desktop breakpoint: md (768px)
- Sidebar: hidden mobile, visible desktop
- Bottom nav: visible mobile, hidden desktop
- Content padding: px-5 mobile, px-8 desktop

---

## 10. Migration Notes
- Remove: glassmorphism classes (.glass-card, .glass-card-strong)
- Remove: gradient-text, gradient-border utilities
- Remove: Geist Sans font
- Replace: 6 accent colors → 3 curated accents
- Replace: blue-violet gradient CTAs → solid accent CTAs
- Keep: macro data colors, Framer Motion, Recharts
- Add: @font-face declarations for Orbon, Sohne, Plex Mono
- Update: all CSS variables to new token names
- Update: rounded-xl/2xl → rounded-lg (8px) on cards
