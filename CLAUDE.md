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

ViTrack is an Italian-language fitness/nutrition tracker with two input channels (Telegram bot + web dashboard) sharing a common backend.

### Data Flow

```
Telegram Bot ──→ /api/telegram/webhook ──→ chat-processor.ts ──→ Supabase
Web Chat UI  ──→ /api/chat             ──→ chat-processor.ts ──→ Supabase
Dashboard    ──→ /api/{meals,workouts,water,weight,user}      ←─ Supabase
```

### Core Processing Pipeline

1. **`src/lib/chat-processor.ts`** — Central message router. Both Telegram webhook and web chat API call `processMessage()` which handles commands (`/oggi`, `/obiettivo`, `/sessione`, `/fine`, `/annulla`), active gym session state, follow-up context from `chat_messages`, and free-text AI classification.

2. **`src/lib/openai.ts`** — OpenAI integration (gpt-5-mini). `classifyMessage()` / `classifyStream()` parse natural language into structured JSON (`meal` | `workout` | `need_info` | `chat` | `error`). The system prompt includes an Italian nutritional database for accurate macro calculation. `parseExercise()` handles gym exercise parsing. `transcribeAudio()` uses Whisper for voice messages.

3. **`src/lib/nutrition.ts`** — Multi-source nutrition lookup with 24h per-100g cache. Queries USDA, OpenFoodFacts, and FatSecret in parallel, validates results with Atwater formula, scales to requested grams. Includes in-flight deduplication and background cache warmup for common Italian foods.

4. **Nutrition API clients** (`src/lib/usda.ts`, `src/lib/openfoodfacts.ts`, `src/lib/fatsecret.ts`) — Each returns `NutrientResult` for a food name and gram amount.

### Telegram vs Web Differences

- **Telegram** (`src/app/api/telegram/webhook/route.ts`): Uses `after()` for background processing, in-memory session state (`Map`s for `activeSessions`, `pendingWorkouts`, `pendingMeals`), streaming classification with progressive message editing (hourglass animation), HTML formatting, voice message transcription.
- **Web** (`src/app/api/chat/route.ts`): Delegates entirely to `chat-processor.ts`, stores all messages in `chat_messages` table, uses DB-backed sessions (`active_chat_sessions` table).

### Frontend

- **Auth**: localStorage-based (`vitrack_user_id`, `vitrack_telegram_id`). Login page (`src/app/page.tsx`) accepts Telegram ID.
- **Dashboard layout** (`src/app/dashboard/layout.tsx`): Client component wrapping all dashboard pages. Sidebar (desktop) + BottomNav (mobile) + floating ChatPanel.
- **ChatPanel** (`src/components/ChatPanel.tsx`): Slide-in AI chat panel available across all dashboard pages, managed via `ChatProvider` context (`src/lib/chat-context.tsx`).
- **Styling**: Tailwind CSS v4, dark theme (black background), no component library.
- **Charts**: Recharts for weight history chart.

### Database (Supabase)

Tables: `users`, `meals`, `workouts`, `chat_messages`, `water_logs`, `weight_logs`, `active_chat_sessions`. Migrations in `supabase/migrations/` (run manually in SQL Editor). RLS enabled with service_role bypass for backend operations.

Supabase clients are lazy-initialized via Proxy to prevent build-time crashes when env vars are unavailable:
- `src/lib/supabase-admin.ts` — Server-side admin client (service role key, bypasses RLS)
- `src/lib/supabase.ts` — Client-side anon client

### Environment Variables

Required in `.env.local` (all needed for full functionality):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (for GPT classification + Whisper transcription)
- `TELEGRAM_BOT_TOKEN` (for sending messages via Bot API)
- `USDA_API_KEY`, `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET`

### Key Patterns

- All API routes use `supabaseAdmin` (service role) for DB operations — no auth middleware.
- User identification flows through `telegram_id` (login) → `users.id` (UUID, used as `user_id` everywhere).
- Italian language throughout UI and AI prompts. Meal types: `colazione`, `pranzo`, `cena`, `snack`.
- Path alias: `@/*` maps to `./src/*`.
