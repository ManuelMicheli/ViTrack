# Chat Widget Backend Enrichment — Design

**Goal:** Complete the backend support for the 21 rich chat widget UI components, closing all data flow gaps between the AI pipeline and the frontend cards.

**Scope:** suggest_meal tool, daily_summary fix, weekly summary routing, weight trend, system prompt update, conversational confirm/cancel flow.

---

## 1. `suggest_meal` Tool (New)

When the user asks "cosa mangio?" or the coach detects remaining calorie budget, the AI calls `suggest_meal`.

**Tool definition:**
- Parameters: `meal_type` (optional), `num_options` (default 3)
- Execution: queries today's consumed macros, calculates remaining budget, generates meal options via a secondary OpenAI call with a specialized nutrition prompt
- Returns: `MealSuggestionData` — `context`, `options[]` (name, description, kcal, macros), `remaining` budget

**SSE route handling:** When `suggest_meal` is the last successful tool, set `messageType: "meal_suggestion"` with full metadata.

## 2. Fix `get_daily_summary` Data

Current gaps:
- Meals missing `time` field (need to parse `logged_at` to `HH:MM`)
- `streak` hardcoded to 0 (need to count consecutive days with meals)
- `insight` empty (leave to AI text content, no separate field needed)

Changes in `tool-executor.ts`:
- Add `logged_at` to meals query, extract time
- Add streak calculation: count backward from today, days with at least 1 meal

Changes in streaming route:
- Pass computed streak into metadata instead of hardcoded 0

## 3. Conversational Confirm/Cancel Flow

No backend changes needed. The approach:
- System prompt instructs AI to describe parsed food items, show totals, then ask "Conferma?" before calling `log_meal`
- AI first responds with text describing the meal, user confirms, then AI calls `log_meal`
- Frontend MealConfirmCard buttons send text messages ("Conferma"/"Annulla") which the AI interprets naturally
- This is the existing flow but with explicit system prompt guidance

## 4. Weekly Summary Routing

- Add `WeeklySummaryData` interface to `types.ts`
- In streaming route, when `get_weekly_report` is last tool: set `messageType: "weekly_summary"` with structured metadata mapping tool result fields to UI-expected fields
- Ensure meal type labels and workout descriptions flow through

## 5. Weight Trend Enhancement

In streaming route for `weight_logged`:
- Query previous weight log from `weight_logs` table
- Add `previous_kg` and `change_kg` to metadata
- Frontend WeightLoggedCard can show trend arrow

## 6. System Prompt Update

Add section to system prompt covering:
- When to use `suggest_meal` (user asks suggestions, or proactively when budget remaining is good)
- Conversational confirm flow: describe meal first, ask confirmation, then log
- Italian language guidelines for structured responses
- How to produce daily insights in summary responses

---

## Non-Scope

- Barcode scanner backend (P2)
- Photo meal analysis/vision (P2)
- WebSocket proactive messages (P2)
- pending_meals temporary table (rejected in design)
