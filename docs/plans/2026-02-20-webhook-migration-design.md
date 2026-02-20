# ViTrack: Migrate from n8n to Next.js Webhook

## Decision
Replace n8n workflow with a Next.js API route webhook for Telegram bot integration.

## Architecture
```
Telegram Bot → POST /api/telegram/webhook → OpenAI gpt-4o-mini → Supabase
Browser → localhost:3000/dashboard → /api/* routes → Supabase
```

## Changes

### Remove
- `n8n/` folder

### Add
- `src/app/api/telegram/webhook/route.ts` — Telegram webhook handler
- `src/lib/telegram.ts` — Telegram API helper (sendMessage)
- `src/lib/openai.ts` — OpenAI classification helper

### Update
- `.env.local` — add TELEGRAM_BOT_TOKEN, OPENAI_API_KEY
- DB migration: remove telegram_id from meals/workouts (added for n8n, not needed now)

### Keep as-is
- Dashboard page, all components, existing API routes, types, supabase client

## Webhook Commands
| Input | Action |
|-------|--------|
| `/start` | Upsert user, send welcome |
| `/oggi` | Query daily summary, send recap |
| `/obiettivo N` | Update calorie goal |
| Free text | OpenAI classify → save meal or workout → confirm |

## Data Flow
1. Telegram sends message to webhook
2. Webhook looks up user by telegram_id → gets user_id (UUID)
3. For meals/workouts: OpenAI classifies → insert with user_id FK
4. Dashboard reads same tables via existing API routes

## AI Provider
OpenAI gpt-4o-mini with structured JSON output for meal/workout classification.
