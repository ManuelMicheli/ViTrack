# Settings Fix: Persistence, Theme & i18n

## Problem
1. Settings page save buttons don't work (objectives, theme, language)
2. Theme setting saves to DB but has no visual effect (CSS is hardcoded dark)
3. Language setting saves to DB but has no effect (no i18n system)

## Solution

### Part 1: Fix Settings Persistence

**Root cause**: Silent validation failures and missing error feedback.

- Add success toast on every save operation
- Show error when validation fails (e.g. invalid number range)
- Ensure `user.id` is always available before save attempts
- Make save buttons show loading state consistently

### Part 2: Theme System

**Approach**: CSS custom properties with `data-theme` attribute on `<html>`.

- `ThemeProvider` context reads user's theme preference
- Sets `data-theme="dark|light"` on `<html>` element
- CSS vars defined per-theme in `globals.css`
- "auto" mode uses `prefers-color-scheme` media query
- Light theme: white/gray background, dark text, adapted glassmorphism

**Light theme palette**:
- Background: #F5F5F5
- Card: #FFFFFF
- Card alt: #FAFAFA
- Border: #E5E5E5
- Text primary: #171717
- Text secondary: #525252
- Text tertiary: #A3A3A3

### Part 3: i18n System

**Approach**: Lightweight context-based translations (no external library).

- `src/lib/translations.ts` — dictionary with `it` and `en` keys
- `LanguageProvider` context provides `t(key)` function
- All hardcoded Italian strings replaced with `t()` calls
- Covers: settings, dashboard, sidebar, bottom nav, chat panel

**Files to modify**:
- `src/app/globals.css` — theme CSS variables
- `src/lib/theme-context.tsx` — new ThemeProvider
- `src/lib/translations.ts` — new translation dictionary
- `src/lib/language-context.tsx` — new LanguageProvider
- `src/app/dashboard/layout.tsx` — wrap with providers
- `src/app/dashboard/settings/page.tsx` — fix saves + use t()
- `src/app/dashboard/page.tsx` — use t()
- `src/components/Sidebar.tsx` — use t()
- `src/components/BottomNav.tsx` — use t()
- `src/components/ChatPanel.tsx` — use t()
