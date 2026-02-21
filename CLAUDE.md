# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start Next.js dev server (http://localhost:3000)
npm run build    # Production build (strict TypeScript — must pass)
npm run lint     # ESLint check
npm start        # Start production server
```

No test framework is configured. Validate changes with `npm run build`.

## Architecture

ViTrack is a fitness/nutrition tracker (Italian + English) with two input channels (Telegram bot + web dashboard) sharing a common backend.

### Data Flow

```
Telegram Bot ──→ /api/telegram/webhook ──→ chat-processor.ts ──→ Supabase
Web Chat UI  ──→ /api/chat             ──→ chat-processor.ts ──→ Supabase
Dashboard    ──→ /api/{meals,workouts,water,weight,user,summary} ←─ Supabase
Food Search  ──→ /api/foods/search     ──→ food-search.ts    ←─ CREA/USDA/OFF/FS
```

### Core Processing Pipeline

1. **`src/lib/chat-processor.ts`** — Central message router. Both Telegram webhook and web chat API call `processMessage()` which handles commands (`/oggi`, `/obiettivo`, `/sessione`, `/fine`, `/annulla`, `/crearicetta`, `/ricetta`, `/ricette`), active gym session state, follow-up context from `chat_messages`, recipe matching, and free-text AI classification.

2. **`src/lib/openai.ts`** — OpenAI integration (gpt-5-mini for classification, gpt-4o for vision). `classifyMessage()` / `classifyStream()` parse natural language into structured JSON (`meal` | `workout` | `need_info` | `chat` | `error`). `classifyWithContext()` handles multi-turn conversations. `generateRecipe()` creates recipes from names. `transcribeAudio()` uses Whisper for voice messages. `buildSystemPrompt()` dynamically injects user context (daily intake, macro goals).

3. **`src/lib/nutrition.ts`** — Multi-source nutrition lookup with 24h per-100g cache. Tries CREA local DB first (instant, zero API calls), then queries USDA, OpenFoodFacts, and FatSecret in parallel. Validates with Atwater formula, cross-validates when 2+ APIs agree within 15% on calories. Includes in-flight deduplication and background cache warmup for 20 common Italian foods.

4. **Nutrition API clients** (`src/lib/usda.ts`, `src/lib/openfoodfacts.ts`, `src/lib/fatsecret.ts`) — Each returns `NutrientResult` for a food name and gram amount. All have 3s timeouts and scoring functions for result ranking.

5. **`src/lib/italian-foods.ts`** — Static CREA/INRAN database (~375 common Italian foods with per-100g values). Zero-cost instant lookup, checked before any external API call.

6. **`src/lib/cooking-factors.ts`** — Raw/cooked weight conversions (pasta 2.3x, rice 3.0x, meat 0.75x, fish 0.85x, legumes 2.5x). Applied when AI marks food as `is_cooked`.

7. **`src/lib/exercise-parser.ts`** — Local regex-based gym exercise parser (zero AI, <1ms). Parses "panca piana 4x8 80kg" into structured data. 80+ Italian exercise aliases with longest-match resolution. Defaults: sets=3, reps=10.

8. **`src/lib/recipes.ts`** — Recipe CRUD + fuzzy name matching with portion extraction ("pancake x3", "pancake 2 porzioni"). Recipe matches bypass AI classification entirely for zero-cost instant meal logging.

9. **`src/lib/vision.ts`** — Photo analysis via GPT-4o Vision. Detects nutrition labels (extracts per-100g macros) and EAN barcodes (looks up via OpenFoodFacts). Used by Telegram webhook for photo messages.

10. **`src/lib/food-search.ts`** — Unified food search across 4 sources (CREA, USDA, OFF, FatSecret) in parallel with deduplication. Powers the dashboard food picker.

### Telegram vs Web Differences

- **Telegram** (`src/app/api/telegram/webhook/route.ts`, ~1534 lines): Uses `after()` for background processing, in-memory session state (`Map`s for `activeSessions`, `pendingWorkouts`, `pendingMeals`), streaming classification with progressive message editing (hourglass animation), HTML formatting, voice message transcription, photo analysis (nutrition labels + barcodes).
- **Web** (`src/app/api/chat/route.ts`, ~103 lines): Delegates entirely to `chat-processor.ts`, stores all messages in `chat_messages` table, uses DB-backed sessions (`active_chat_sessions` table).

### Frontend

- **Auth**: Hybrid — Supabase Auth (email/password registration + OAuth) primary, with localStorage fallback for legacy Telegram-only users (`vitrack_user_id`, `vitrack_telegram_id`). Pages: login (`/`), register (`/register`), forgot/reset password.
- **Dashboard layout** (`src/app/dashboard/layout.tsx`): Client component wrapping all dashboard pages. Wraps children with `ChatProvider`, `ThemeProvider`, `LanguageProvider`, `PreferencesProvider`, `CelebrationProvider`. Renders Sidebar (desktop) + BottomNav (mobile) + floating ChatPanel + PageTransition + Celebration.
- **Dashboard pages**: Home (daily summary + quick add), Meals, Workouts, Stats (weight chart), Profile (avatar), Settings (goals, preferences, appearance, language, data export/reset).
- **ChatPanel** (`src/components/ChatPanel.tsx`): Slide-in AI chat panel available across all dashboard pages.
- **i18n**: Italian + English via `src/lib/translations.ts` (~340 translation keys) + `LanguageProvider` context.
- **Theming**: Dark/light/auto theme (`ThemeProvider`), accent colors (ivory/red/blue), layout modes (compact/expanded) via `PreferencesProvider`.
- **Styling**: Tailwind CSS v4, dark theme default, no component library.
- **Animations**: Framer Motion throughout (page transitions, lists, celebrations with canvas-confetti).
- **Charts**: Recharts for weight history with trend line.

### API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/chat` | GET, POST | Chat message history + send message |
| `/api/telegram/webhook` | POST | Telegram bot webhook |
| `/api/meals` | GET, POST, DELETE | Meal CRUD |
| `/api/meals/analyze` | POST | Classify meal text via OpenAI |
| `/api/workouts` | GET, DELETE | Workout read + delete |
| `/api/water` | GET, POST | Water intake logging |
| `/api/weight` | GET, POST | Weight logging |
| `/api/summary` | GET | Daily summary (meals + workouts + totals) |
| `/api/user` | GET, PATCH | User profile read + update |
| `/api/user/avatar` | POST | Avatar upload to Supabase Storage |
| `/api/user/export` | POST | User data export |
| `/api/foods/search` | POST | Unified food search (4 sources) |
| `/api/reset-data` | DELETE | Delete user data (meals/workouts/all) |
| `/api/auth/callback` | GET | Supabase OAuth callback |

### Database (Supabase)

Tables: `users`, `meals`, `workouts`, `chat_messages`, `water_logs`, `weight_logs`, `active_chat_sessions`, `recipes`. Migrations in `supabase/migrations/` (7 files, run manually in SQL Editor). RLS enabled with service_role bypass for backend operations.

Supabase clients are lazy-initialized via Proxy to prevent build-time crashes when env vars are unavailable:
- `src/lib/supabase-admin.ts` — Server-side admin client (service role key, bypasses RLS)
- `src/lib/supabase.ts` — Client-side anon client
- `src/lib/supabase-browser.ts` — Browser-only client factory (for auth pages)
- `src/lib/supabase-server.ts` — Server-side SSR client (for middleware)

### Context Providers

- `ChatProvider` (`chat-context.tsx`) — Chat panel open/close state
- `ThemeProvider` (`theme-context.tsx`) — Dark/light/auto theme
- `LanguageProvider` (`language-context.tsx`) — IT/EN language
- `PreferencesProvider` (`preferences-context.tsx`) — Accent color, layout mode, section order (persisted to localStorage + API)
- `CelebrationProvider` (`celebration-context.tsx`) — Confetti trigger

### Environment Variables

Required in `.env.local` (all needed for full functionality):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (for GPT classification + Vision + Whisper transcription)
- `TELEGRAM_BOT_TOKEN` (for sending messages via Bot API)
- `USDA_API_KEY`, `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET`

### Key Patterns

- All API routes use `supabaseAdmin` (service role) for DB operations — no auth middleware.
- Middleware (`src/middleware.ts`) handles Supabase session refresh and redirects authenticated users from auth pages.
- User identification: Supabase Auth (email) or `telegram_id` (legacy) → `users.id` (UUID, used as `user_id` everywhere).
- Italian language default throughout UI and AI prompts. Meal types: `colazione`, `pranzo`, `cena`, `snack`.
- Path alias: `@/*` maps to `./src/*`.
- React Compiler enabled via `babel-plugin-react-compiler`.
