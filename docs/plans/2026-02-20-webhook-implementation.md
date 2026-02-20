# ViTrack Webhook Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace n8n with a Next.js API route webhook for Telegram bot, keeping the existing dashboard working.

**Architecture:** Single POST endpoint `/api/telegram/webhook` receives Telegram updates, routes commands, classifies free text via OpenAI gpt-4o-mini, saves to Supabase, responds via Telegram API. Dashboard reads from same Supabase tables.

**Tech Stack:** Next.js 16 API Routes, Supabase JS client, OpenAI REST API, Telegram Bot API

---

### Task 1: Clean up n8n and DB

**Files:**
- Delete: `n8n/` folder
- Modify: `.env.local` (add TELEGRAM_BOT_TOKEN, OPENAI_API_KEY)

**Step 1: Delete n8n folder**

```bash
rm -rf n8n/
```

**Step 2: Apply DB migration to remove telegram_id from meals/workouts**

Use Supabase MCP `apply_migration` with:
```sql
ALTER TABLE meals DROP COLUMN IF EXISTS telegram_id;
ALTER TABLE workouts DROP COLUMN IF EXISTS telegram_id;
```

**Step 3: Update .env.local**

Add to `.env.local`:
```
TELEGRAM_BOT_TOKEN=<user-provides>
OPENAI_API_KEY=<user-provides>
```

**Step 4: Commit**

```bash
git add -A && git commit -m "chore: remove n8n, add env vars for webhook"
```

---

### Task 2: Create Telegram helper

**Files:**
- Create: `src/lib/telegram.ts`

**Step 1: Write telegram.ts**

```typescript
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMessage(chatId: number, text: string): Promise<void> {
  await fetch(`${BASE_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}
```

**Step 2: Commit**

```bash
git add src/lib/telegram.ts && git commit -m "feat: add Telegram API helper"
```

---

### Task 3: Create OpenAI classification helper

**Files:**
- Create: `src/lib/openai.ts`

**Step 1: Write openai.ts**

The function calls OpenAI gpt-4o-mini with a system prompt that classifies user messages as meal or workout, returning structured JSON with calories/macros estimates.

System prompt (same as the n8n workflow had):
- If meal → return `{type, description, calories, protein_g, carbs_g, fat_g, fiber_g, meal_type}`
- If workout → return `{type, description, workout_type, duration_min, calories_burned, exercises}`

Parse the response, strip markdown fences, JSON.parse. On failure return `{type: "error"}`.

**Step 2: Commit**

```bash
git add src/lib/openai.ts && git commit -m "feat: add OpenAI classification helper"
```

---

### Task 4: Create webhook route

**Files:**
- Create: `src/app/api/telegram/webhook/route.ts`

**Step 1: Write the webhook route**

POST handler that:
1. Parses Telegram Update from request body
2. Extracts `message.text`, `message.from.id`, `message.chat.id`
3. Routes based on text:
   - `/start` → upsert user in Supabase, send welcome message
   - `/oggi` → fetch today's meals+workouts+goal, calculate summary, send formatted message
   - `/obiettivo N` → parse number, update user's daily_calorie_goal, confirm
   - Anything else → call OpenAI classify → if meal: insert in meals table → confirm with macros; if workout: insert in workouts table → confirm with details
4. Always returns 200 OK to Telegram (even on errors, to prevent retries)

Key implementation details:
- Upsert user: use `.upsert()` with `onConflict: "telegram_id"`
- For meals/workouts: first lookup user_id from telegram_id, then insert with user_id FK
- Summary: reuse same aggregation logic as `/api/summary` but format as Telegram HTML message
- Error handling: catch all, send friendly error message to user, return 200

**Step 2: Commit**

```bash
git add src/app/api/telegram/webhook/route.ts && git commit -m "feat: add Telegram webhook API route"
```

---

### Task 5: Register webhook with Telegram

**Step 1: Set webhook URL**

The user needs to expose localhost via ngrok or similar for development, then call:
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<domain>/api/telegram/webhook"
```

For local development, guide user through ngrok setup.

**Step 2: Test the bot**

- Send `/start` → should get welcome message
- Send "Ho mangiato una pizza margherita" → should get meal confirmation
- Send `/oggi` → should get daily summary
- Check dashboard at localhost:3000 → data should appear

---
