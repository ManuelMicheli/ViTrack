# Bot Precision Enhancement — Design Document

**Date:** 2026-02-21
**Goal:** Transform the Telegram bot into an ultra-precise nutritional tracker where AI serves as parser only and all nutritional data comes from verified API sources.

## Core Principle

**GPT = Parser. APIs = Source of Truth. Never invent nutritional values.**

## 1. GPT Role Change: Parser, Not Calculator

### Current
GPT classifies messages AND calculates macros using a hardcoded nutritional database in the system prompt. API enrichment replaces values when available, falls back to AI estimates.

### New
GPT only parses user messages into structured data. No nutritional database in the prompt. No calorie/macro calculation.

**New meal output format:**
```json
{
  "type": "meal",
  "items": [
    {
      "name": "yogurt müller alla fragola",
      "name_en": "strawberry yogurt",
      "brand": "Müller",
      "quantity_g": 200,
      "is_branded": true
    }
  ],
  "meal_type": "snack"
}
```

Key changes:
- No `calories`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g` in GPT output
- New `brand` field (string | null) — extracted when user mentions a brand
- New `is_branded` field (boolean) — routing flag for lookup pipeline
- Nutritional database removed from system prompt
- All other types (chat, workout, need_info, error) remain identical

## 2. Enhanced Nutrition Lookup Pipeline

### Path A — Generic Food (`is_branded: false`)
Priority: USDA → FatSecret → OpenFoodFacts
Same as current, but with strict no-fallback: if all APIs fail, ask user for photo.

### Path B — Branded Product (`is_branded: true`)
Priority: OpenFoodFacts (brand+name search) → FatSecret → USDA

OpenFoodFacts improvements:
- Search with `brand` and `product_name` as separate parameters
- Support barcode lookup via `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`

### Cross-validation
When 2+ APIs return results:
- If calories agree within ±15% → use highest-scored source
- If they disagree by more → use the one with cleanest Atwater validation

### Strict Fallback
When all APIs fail → return `null` → bot asks user for photo of nutritional label or barcode.

## 3. Photo Support (Labels + Barcode) via GPT-4o Vision

### New file: `src/lib/vision.ts`

**`analyzeNutritionLabel(imageBuffer: Buffer)`**
- Sends image to GPT-4o Vision API
- Extracts: calories, protein_g, carbs_g, fat_g, fiber_g (all per 100g), product_name
- Returns structured NutrientResult or null

**`extractBarcode(imageBuffer: Buffer)`**
- Sends image to GPT-4o Vision API
- Looks for EAN/barcode number
- Returns barcode string or null

**`lookupByBarcode(barcode: string)`**
- Direct OpenFoodFacts lookup: `/api/v0/product/{barcode}.json`
- Returns NutrientResult or null

### Photo Flow in Telegram Webhook

Handles `message.photo`:
1. Download largest photo via Telegram Bot API
2. Analyze with GPT-4o Vision
3. If barcode detected → OFF lookup by EAN → use those values
4. If nutrition label detected → extract per-100g values
5. If caption has quantity → calculate and save
6. If no quantity → ask "Quanti grammi?"

### "Awaiting Photo" State

When API lookup fails and bot asks for photo:
- New state in `pendingMeals` Map: `{ type: "awaiting_photo", items, missing_index }`
- Next photo from user → process for that specific item
- Next text from user → treat as new message (cancel wait)
- Auto-cleanup after 5 minutes

## 4. End-to-End Decision Flow

```
Message received (text or photo)
├── PHOTO → vision.ts
│   ├── Barcode found → OFF lookup by EAN → values found → save meal
│   ├── Label read → extract per-100g → ask quantity if missing → save
│   └── Unreadable → "Non riesco a leggere, prova con un'altra foto"
│
└── TEXT → GPT parses (name, quantity, brand, is_branded)
    ├── is_branded: true → OFF(brand+name) → FatSecret → USDA
    │   ├── APIs find it → save with API values
    │   └── APIs fail → "Prodotto non trovato. Mandami foto etichetta o barcode"
    │
    ├── is_branded: false → USDA → OFF → FatSecret
    │   ├── APIs find it → save with API values
    │   └── APIs fail → "Non ho trovato [cibo]. Mandami foto etichetta"
    │
    └── need_info → ask quantity (as today)
```

## 5. What Does NOT Change

- Telegram command flow (/oggi, /sessione, /fine, /annulla, /obiettivo)
- Gym session management
- Workout tracking
- Chat/conversation handling
- Web chat API (uses chat-processor.ts which also benefits from these changes)
- Database schema (meals table stores same fields)
- Message formatting and UI
