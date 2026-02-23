# ViTrack AI Assistant - Professional Design Document

> Design for upgrading ViTrack's AI assistant from a JSON classifier to a professional nutritionist/trainer coach with full function calling.

## Decisions

- **AI Model**: Keep OpenAI (gpt-5-mini), no provider migration
- **Architecture**: Full function calling via OpenAI tools API
- **Channels**: Both Telegram + Web simultaneously
- **Profile data**: Add all missing DB fields from spec
- **Streaming**: SSE streaming for web ChatPanel
- **Language**: Italian throughout

## Architecture Overview

### Current Flow (being replaced)
```
User text -> AI classifies (JSON) -> Backend routes -> DB save -> Format response
```

### New Flow
```
User text -> AI reasons + invokes tools -> Backend executes tools -> Results to AI -> AI coaching response
```

## Components

### 1. System Prompt (`src/ai/system-prompt.ts`)

Dynamic builder assembling modules:
- **Identity**: ViTrack Coach persona (nutrizionista sportivo + PT)
- **Goal coaching**: Cut/Maintain/Bulk specific behavior and priorities
- **User context**: Full profile, today's meals/workouts, 7-day trends, weight trend
- **Knowledge base**: Nutrition science, training principles, Italian portions
- **Rules**: Allergy enforcement, restriction respect, pattern detection
- **Time awareness**: Proactive suggestions based on current time of day

### 2. Tool Definitions (`src/ai/tools.ts`)

OpenAI function calling tools:
- `log_meal` - Parse and save meal with nutrition lookup
- `log_workout` - Save workout with exercises
- `log_water` - Log water intake
- `log_weight` - Log daily weight
- `search_food` - Query nutritional info
- `get_daily_summary` - Today's complete data
- `get_weekly_report` - 7-day analysis
- `update_meal` / `delete_meal` - Edit logged meals

### 3. Tool Executor (`src/ai/tool-executor.ts`)

Executes tool calls against DB/nutrition APIs:
- Meal logging: nutrition lookup -> DB insert -> return summary
- Workout logging: DB insert -> return summary
- Food search: multi-source lookup -> return nutrition data
- Reports: aggregate queries -> return formatted data

### 4. AI Client (`src/ai/ai-client.ts`)

OpenAI API integration:
- Streaming responses with tool call handling
- Multi-turn tool execution loop
- Token-by-token text streaming for UX

### 5. Context Builder (`src/ai/context-builder.ts`)

Enhanced user context replacing `user-context.ts`:
- Full profile with new fields (allergies, equipment, injuries, etc.)
- Today's individual meals (not just totals)
- 7-day averages (calories, protein, workout count)
- Streak tracking, adherence percentage
- Water intake, weight trend with direction

### 6. Streaming API (`src/app/api/chat/stream/route.ts`)

SSE endpoint for progressive responses:
- Events: `delta` (text), `tool_call` (tool invoked), `tool_result` (completed), `done`
- Tool call indicators ("Cerco i valori nutrizionali...")

### 7. ChatPanel Updates

- Streaming token display
- Tool call status indicators
- Keep quick commands as fast-path shortcuts

### 8. Database Migration

New columns on `users` table:
- `cooking_skill`, `allergies`, `disliked_foods`, `preferred_cuisine`
- `available_equipment`, `injuries_or_limitations`
- `training_days_per_week`, `preferred_training_time`

## Goal Differentiation

### Cut (fat_loss)
- Protein 2.2g/kg, deficit adherence tracking
- Satiety-focused food suggestions
- Warn if <1200 kcal (men) / <1000 kcal (women)
- Resistance training priority

### Maintain
- Protein 2.0g/kg, balanced approach
- Consistency focus, habit building
- Flexible surplus/deficit tolerance

### Bulk (muscle_gain)
- Protein 2.0g/kg, controlled surplus +200-400 kcal
- Calorie-dense food suggestions
- Progressive overload tracking
- Deload recommendations

## Knowledge Base Scope

### Nutrition
- Italian standard portions, compound dish decomposition
- Macro requirements by goal/weight
- Pre/post workout nutrition timing
- Fiber, hydration, micronutrient basics
- Metabolic adaptation, reverse dieting concepts

### Training
- Progressive overload, periodization basics
- Volume by goal (hypertrophy 10-20 sets/week/muscle)
- RPE/RIR self-regulation
- Common splits, exercise substitutions
- Deload indicators, recovery principles

### Pattern Detection
- Low calorie warnings (>3 days below minimums)
- Low protein alerts (<60% target)
- Training gap detection (>5 days no workout)
- Rapid weight change flags
- Over-training indicators
