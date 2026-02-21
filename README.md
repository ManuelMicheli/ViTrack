# ViTrack

Tracker per calorie, valori nutrizionali e allenamenti con bot Telegram e dashboard web. Supporta italiano e inglese.

## Indice

- [Architettura](#architettura)
- [Setup](#setup)
- [Utilizzo](#utilizzo)
- [Dashboard Web](#dashboard-web)
- [API Routes](#api-routes)
- [Pipeline di Elaborazione](#pipeline-di-elaborazione)
- [Database](#database)
- [Componenti Frontend](#componenti-frontend)
- [Personalizzazione](#personalizzazione)
- [Tech Stack](#tech-stack)

## Architettura

```
Telegram Bot ──→ /api/telegram/webhook ──→ chat-processor.ts ──→ Supabase
                                               ↑
Web Chat UI  ──→ /api/chat ────────────────────┘
                                               ↓
Dashboard    ──→ /api/{meals,workouts,water,weight,user,summary} ← Supabase

Nutrizione:  CREA (locale) → USDA + OpenFoodFacts + FatSecret (parallelo)
AI:          OpenAI gpt-5-mini (classificazione) · gpt-4o (vision) · Whisper (audio)
```

### Flusso messaggi

1. L'utente invia un messaggio (Telegram o web chat)
2. `chat-processor.ts` gestisce comandi (`/oggi`, `/sessione`, ecc.) oppure passa il testo libero a OpenAI
3. OpenAI classifica il messaggio come `meal`, `workout`, `need_info` o `chat`
4. Per i pasti: lookup nutrizionale multi-sorgente (CREA locale → USDA/OFF/FatSecret in parallelo) con validazione Atwater
5. Risultato salvato su Supabase

### Fonti nutrizionali

| Sorgente | Tipo | Latenza |
|----------|------|---------|
| CREA/INRAN (~375 cibi italiani) | Database locale | Istantaneo |
| USDA FoodData Central | API | ~1-3s |
| OpenFoodFacts | API | ~1-3s |
| FatSecret | API (OAuth2) | ~1-3s |

Le 3 API esterne vengono interrogate in parallelo con cross-validazione (±15% calorie) e cache 24h per-100g con deduplicazione in-flight.

### Telegram vs Web

| Aspetto | Telegram | Web |
|---------|----------|-----|
| Stato sessione | In-memory (`Map`) | DB (`active_chat_sessions`) |
| Classificazione | Streaming con animazione clessidra (⏳/⌛) | Sincrona via `chat-processor.ts` |
| Messaggi vocali | Whisper trascrizione | Non supportato |
| Foto | GPT-4o Vision (etichette + barcode) | Non supportato |
| Formattazione | HTML (bold, italic, code) | Markdown |
| Processing | Background con `after()` — ACK immediato | Sincrono |
| Codice | `webhook/route.ts` (~1534 righe) | `chat/route.ts` (~103 righe) |

## Setup

### 1. Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Apri il SQL Editor ed esegui le migrazioni in ordine:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_chat_messages.sql
   supabase/migrations/002_water_weight_tables.sql
   supabase/migrations/003_water_weight_goals.sql
   supabase/migrations/004_auth_profiles.sql
   supabase/migrations/005_user_preferences.sql
   supabase/migrations/008_recipes.sql
   ```
3. Copia URL, anon key e service role key dalle impostazioni del progetto

### 2. Telegram Bot

1. Apri [@BotFather](https://t.me/BotFather) su Telegram
2. Crea un nuovo bot con `/newbot`
3. Salva il token del bot
4. Imposta i comandi con `/setcommands`:
   ```
   oggi - Riepilogo giornaliero
   obiettivo - Imposta obiettivo calorico (es. /obiettivo 2000)
   sessione - Avvia sessione palestra
   fine - Termina sessione palestra
   annulla - Annulla sessione palestra
   crearicetta - Crea una ricetta (es. /crearicetta pancake proteico)
   ricetta - Mostra/elimina ricetta (es. /ricetta pancake)
   ricette - Lista ricette salvate
   ```
5. Imposta il webhook verso il tuo dominio:
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<DOMINIO>/api/telegram/webhook
   ```

### 3. API Keys

| Servizio | Dove ottenerla |
|----------|----------------|
| OpenAI API Key | [platform.openai.com](https://platform.openai.com) |
| Telegram Bot Token | [@BotFather](https://t.me/BotFather) |
| Supabase URL + Keys | Dashboard progetto Supabase |
| USDA API Key | [fdc.nal.usda.gov](https://fdc.nal.usda.gov/api-key-signup.html) |
| FatSecret Client ID/Secret | [platform.fatsecret.com](https://platform.fatsecret.com) |

### 4. Installazione

```bash
npm install

# Configura le variabili d'ambiente
cp .env.example .env.local
```

Variabili richieste in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
TELEGRAM_BOT_TOKEN=
USDA_API_KEY=
FATSECRET_CLIENT_ID=
FATSECRET_CLIENT_SECRET=
```

```bash
# Avvia in sviluppo
npm run dev

# Build per produzione
npm run build

# Avvia server produzione
npm start

# Lint
npm run lint
```

### 5. Deploy su Vercel

1. Push del repository su GitHub
2. Importa il progetto su [vercel.com](https://vercel.com)
3. Aggiungi tutte le variabili d'ambiente elencate sopra

## Utilizzo

### Bot Telegram

**Messaggi liberi** — scrivi cosa hai mangiato o che allenamento hai fatto:
- `"Ho mangiato 200g di pasta al pomodoro a pranzo"`
- `"Ho fatto 30 minuti di corsa"`
- `"Colazione: yogurt greco con miele e noci"`

Supporta anche messaggi vocali (trascrizione Whisper) e foto di etichette nutrizionali (analisi GPT-4o Vision con riconoscimento barcode EAN).

**Comandi:**

| Comando | Descrizione |
|---------|-------------|
| `/oggi` | Riepilogo giornaliero (calorie, macro, allenamenti) |
| `/obiettivo 2500` | Imposta obiettivo calorico giornaliero |
| `/sessione` | Avvia sessione palestra — poi invia esercizi come `panca piana 4x8 80kg` |
| `/fine` | Termina sessione e salva allenamento |
| `/annulla` | Annulla sessione senza salvare |
| `/crearicetta <nome>` | Crea una ricetta (l'AI genera gli ingredienti) |
| `/ricetta <nome>` | Mostra o elimina una ricetta salvata |
| `/ricette` | Lista tutte le ricette |

Le ricette salvate vengono riconosciute automaticamente nel testo libero per logging istantaneo (senza chiamata AI). Supporta porzioni: `pancake x3`, `pancake 2 porzioni`.

**Sessione palestra** — durante una sessione attiva, il parser regex locale riconosce 80+ esercizi italiani con risoluzione longest-match:

```
panca piana 4x8 80kg      → Panca Piana: 4×8 @ 80kg
squat 5x5 100              → Squat: 5×5 @ 100kg
curl bilanciere 3x12        → Curl Bilanciere: 3×12 (default sets=3, reps=10)
lat machine 4x10 60kg      → Lat Machine: 4×10 @ 60kg
```

Categorie esercizi: petto, schiena, spalle, bicipiti, tricipiti, gambe, core, cardio.

**Foto** — invia una foto per:
- Riconoscimento etichette nutrizionali (estrae macro per-100g)
- Lettura barcode EAN (lookup su OpenFoodFacts)

### Dashboard Web

1. Registrati con email/password o accedi con Telegram ID
2. Dashboard con riepilogo calorie, macro e allenamenti
3. Chat AI integrata in ogni pagina
4. Pagine: Dashboard, Pasti, Allenamenti, Statistiche, Profilo, Impostazioni

## Dashboard Web

### Pagine

| Pagina | Path | Descrizione |
|--------|------|-------------|
| Home | `/dashboard` | Riepilogo giornaliero: progresso calorie, barra rapida, tracker acqua, pasti, allenamenti, grafico peso. Sezioni riordinabili |
| Pasti | `/dashboard/meals` | Lista pasti raggruppati per tipo (colazione/pranzo/cena/snack), ricerca cibi multi-sorgente con carrello, totali giornalieri con barra macro |
| Allenamenti | `/dashboard/workouts` | Lista allenamenti con dettaglio esercizi, selettore data, drag-to-delete |
| Statistiche | `/dashboard/stats` | Grafico peso con linea di tendenza (7/30/90 giorni), proiezione obiettivo |
| Profilo | `/dashboard/profile` | Avatar (upload su Supabase Storage), info utente |
| Impostazioni | `/dashboard/settings` | Profilo, obiettivi, tema, colore accento, layout, lingua, ordine sezioni, collegamento Telegram, export/reset dati |

### Autenticazione

Autenticazione ibrida:
- **Supabase Auth** (primaria): registrazione email/password + OAuth
- **localStorage** (fallback): per utenti legacy solo Telegram (`vitrack_user_id`, `vitrack_telegram_id`)

Pagine: login (`/`), registrazione (`/register`), password dimenticata (`/forgot-password`), reset password (`/reset-password`).

Il middleware (`src/middleware.ts`) gestisce il refresh della sessione Supabase e reindirizza gli utenti autenticati dalle pagine auth alla dashboard.

### Ricerca Cibi

Ricerca unificata su 4 sorgenti in parallelo con deduplicazione:

1. **CREA** — Database locale italiano (~375 cibi), istantaneo
2. **USDA** — FoodData Central API
3. **OpenFoodFacts** — Database globale (branded + generico)
4. **FatSecret** — API con autenticazione OAuth2

Il componente FoodSearch include: input con debounce 400ms, risultati con badge sorgente, selettore grammi (±10g), anteprima macro scalati, carrello con totali, selettore tipo pasto.

## API Routes

| Route | Metodi | Descrizione |
|-------|--------|-------------|
| `/api/chat` | GET, POST | Storico messaggi chat + invio messaggio |
| `/api/telegram/webhook` | POST | Webhook bot Telegram |
| `/api/meals` | GET, POST, DELETE | CRUD pasti |
| `/api/meals/analyze` | POST | Classificazione testo pasto via OpenAI |
| `/api/workouts` | GET, DELETE | Lettura + eliminazione allenamenti |
| `/api/water` | GET, POST | Logging intake acqua (upsert) |
| `/api/weight` | GET, POST | Logging peso |
| `/api/summary` | GET | Riepilogo giornaliero (pasti + allenamenti + totali) |
| `/api/user` | GET, PATCH | Lettura + aggiornamento profilo utente |
| `/api/user/avatar` | POST | Upload avatar su Supabase Storage |
| `/api/user/export` | POST | Export dati utente in JSON |
| `/api/foods/search` | POST | Ricerca cibi unificata (4 sorgenti) |
| `/api/reset-data` | DELETE | Eliminazione dati utente (pasti/allenamenti/tutto) |
| `/api/auth/callback` | GET | Callback OAuth Supabase |

Tutte le API usano `supabaseAdmin` (service role) per le operazioni DB — nessun auth middleware. L'identificazione utente avviene via Supabase Auth (email) o `telegram_id` (legacy).

## Pipeline di Elaborazione

### Moduli core (`src/lib/`)

| Modulo | Descrizione |
|--------|-------------|
| `chat-processor.ts` | Router centrale messaggi. Gestisce comandi, stato sessione palestra, contesto conversazione, matching ricette, classificazione AI |
| `openai.ts` | Integrazione OpenAI: `classifyMessage()` / `classifyStream()` (gpt-5-mini), `classifyWithContext()` (multi-turn), `generateRecipe()`, `transcribeAudio()` (Whisper), vision (gpt-4o) |
| `nutrition.ts` | Lookup nutrizionale multi-sorgente con cache 24h per-100g, validazione Atwater (ratio 0.55–1.45), cross-validazione quando 2+ API concordano entro il 15%, deduplicazione in-flight, warmup cache |
| `italian-foods.ts` | Database statico CREA/INRAN (~375 cibi italiani con valori per-100g). Cercato prima di qualsiasi API esterna |
| `cooking-factors.ts` | Conversioni peso crudo/cotto: pasta 2.3×, riso 3.0×, carne 0.75×, pesce 0.85×, legumi 2.5× |
| `exercise-parser.ts` | Parser regex per esercizi palestra (zero AI, <1ms). 80+ alias italiani con risoluzione longest-match |
| `recipes.ts` | CRUD ricette + matching fuzzy con estrazione porzioni. Bypass classificazione AI per logging istantaneo |
| `food-search.ts` | Ricerca unificata su 4 sorgenti in parallelo con deduplicazione |
| `vision.ts` | Analisi foto via GPT-4o Vision: etichette nutrizionali (macro per-100g) e barcode EAN (lookup OpenFoodFacts) |
| `user-context.ts` | Costruisce contesto utente (pasti, allenamenti, obiettivi) per il prompt di sistema AI |
| `personalization.ts` | Saluti basati sull'ora + motivazione basata sulla performance |
| `translations.ts` | 340+ chiavi di traduzione (IT/EN) |

### Client API nutrizionali

| Client | File | Dettagli |
|--------|------|----------|
| USDA | `usda.ts` | FoodData Central API, timeout 3s, scoring risultati |
| OpenFoodFacts | `openfoodfacts.ts` | Ricerca branded + generica, timeout 3s |
| FatSecret | `fatsecret.ts` | OAuth2 con cache token, timeout 3s |

### Client Supabase

| File | Uso |
|------|-----|
| `supabase-admin.ts` | Server-side, service role (bypass RLS). Lazy-initialized via Proxy |
| `supabase.ts` | Server-side, anon client. Lazy-initialized via Proxy |
| `supabase-browser.ts` | Browser-only, factory per pagine auth |
| `supabase-server.ts` | Server-side SSR, per middleware |

I client Supabase usano Proxy per lazy-initialization, evitando crash al build quando le env var non sono disponibili.

## Database

### Tabelle

| Tabella | Descrizione |
|---------|-------------|
| `users` | Profilo utente (26 campi): id, telegram_id, email, nome, obiettivi (calorie/macro/acqua/peso), preferenze (tema/accento/layout/lingua/ordine sezioni), dati fisici |
| `meals` | Pasti registrati: descrizione, calorie, macro (proteine/carbs/grassi/fibre), tipo pasto (colazione/pranzo/cena/snack) |
| `workouts` | Allenamenti: descrizione, tipo, durata, calorie bruciate, esercizi (JSONB) |
| `chat_messages` | Storico messaggi: ruolo (user/assistant), contenuto, tipo messaggio, sorgente (telegram/web), metadata JSONB |
| `water_logs` | Intake acqua giornaliero: bicchieri, ml, data |
| `weight_logs` | Registrazioni peso: peso_kg, timestamp |
| `active_chat_sessions` | Sessioni chat attive (web) |
| `recipes` | Ricette utente: nome (unique per utente), ingredienti JSONB, totali macro, tipo pasto |

RLS abilitato su tutte le tabelle con bypass service-role per operazioni backend.

### Migrazioni

Le 7 migrazioni in `supabase/migrations/` devono essere eseguite in ordine nel SQL Editor di Supabase:

1. `001_initial_schema.sql` — Tabelle users, meals, workouts con indici e RLS
2. `002_chat_messages.sql` — Tabella chat_messages
3. `002_water_weight_tables.sql` — Tabelle water_logs e weight_logs
4. `003_water_weight_goals.sql` — Campi water_goal_ml, water_tracking_mode, weight_goal_kg su users
5. `004_auth_profiles.sql` — Campi auth (email, avatar, tema, lingua, macro goals, dati fisici) su users
6. `005_user_preferences.sql` — Campi accent_color, layout_mode, section_order su users
7. `008_recipes.sql` — Tabella recipes con vincolo unique(user_id, lower(name))

## Componenti Frontend

### Componenti (`src/components/`)

| Componente | Descrizione |
|------------|-------------|
| `CalorieProgress` | Contatore calorie hero: correnti/obiettivo, bruciate, rimanenti/eccesso con animazioni |
| `DailySummary` | 4 card macro (proteine/carbs/grassi/fibre) con barre progresso |
| `QuickAddBar` | Griglia 4 bottoni: pasto, acqua, allenamento, peso |
| `WaterTracker` | Logging acqua (modalità bicchieri/ml), sparkline 7 giorni, editor obiettivo |
| `WeightChart` | Grafico peso con linea tendenza (Recharts) |
| `MealList` | Lista pasti con drag-to-delete, raggruppati per tipo |
| `WorkoutList` | Lista allenamenti con dettaglio esercizi, drag-to-delete |
| `AddMealModal` | Modale descrizione pasto, analisi via `/api/meals/analyze`, breakdown macro |
| `FoodSearch` | Ricerca cibi 4 sorgenti, carrello con selettore grammi e totali |
| `ChatPanel` | Pannello chat AI slide-in, storico messaggi, bottoni comandi rapidi |
| `DatePicker` | Navigazione date |
| `StreakCalendar` | Calendario streak acqua/pasti/allenamenti |
| `MacroBar` | Barra macro orizzontale stacked |
| `ConfirmModal` | Dialog di conferma riusabile |
| `Sidebar` | Navigazione desktop con indicatore colore accento |
| `BottomNav` | Barra navigazione mobile (HOME/PASTI/WORKOUT/STATS) |
| `PageTransition` | Animazioni transizione pagina (Framer Motion) |
| `Celebration` | Trigger canvas-confetti (raggiungimento obiettivo calorie) |
| `RippleButton` | Bottone con effetto ripple |
| `VTLogo` | Logo ViTrack |
| `AnimatedList` | Utility animazione lista (Framer Motion) |
| `icons` | Icone SVG (Home, Utensils, Dumbbell, ecc.) |

### Context Providers

| Context | Hook | Funzionalità |
|---------|------|--------------|
| `ChatProvider` | `useChat()` | Stato apertura/chiusura pannello chat |
| `ThemeProvider` | `useTheme()` | Tema dark/light/auto con rilevamento preferenza sistema |
| `LanguageProvider` | `useLanguage()` | Lingua IT/EN con funzione `t(key)` per traduzioni |
| `PreferencesProvider` | `usePreferences()` | Colore accento, modalità layout, ordine sezioni. Persistito su localStorage + API |
| `CelebrationProvider` | `useCelebration()` | Trigger confetti canvas |

Il layout dashboard (`src/app/dashboard/layout.tsx`) wrappa tutte le pagine con i 5 provider.

### Hook personalizzati

| Hook | File | Descrizione |
|------|------|-------------|
| `useAnimatedNumber` | `hooks/useAnimatedNumber.ts` | Anima cambiamenti numerici con spring Framer Motion. Usato in CalorieProgress, DailySummary, WaterTracker |

## Personalizzazione

### Tema

3 modalità: **dark** (default), **light**, **auto** (segue preferenza sistema). Applicato via attributo `data-theme` su `documentElement`.

### Colori accento

| Nome | Colore | Hex |
|------|--------|-----|
| Ivory | Avorio | `#E8E4DE` |
| Red | Rosso segnale | `#E03C32` |
| Blue | Blu freddo (default) | `#6B8CAE` |

Applicato dinamicamente via variabile CSS `--color-accent-dynamic`.

### Layout

2 modalità: **expanded** (default, più padding) e **compact** (spaziatura ridotta).

### Ordine sezioni

Le sezioni della home dashboard sono riordinabili: greeting, quickadd, calories, water-streak, weight, meals, workouts. Configurabile da Impostazioni con drag & drop (Framer Motion Reorder).

### Lingua

Italiano (default) e inglese. 340+ chiavi di traduzione in `src/lib/translations.ts`.

## Tech Stack

| Tecnologia | Versione | Uso |
|------------|----------|-----|
| Next.js | 16.1.6 | App Router, API Routes, React Compiler |
| React | 19.2.3 | UI con React Compiler abilitato |
| TypeScript | 5 | Strict mode, path alias `@/*` → `./src/*` |
| Tailwind CSS | 4 | Styling, dark theme default |
| Supabase | 2.97.0 | PostgreSQL + Auth + Storage + RLS |
| OpenAI | — | gpt-5-mini (classificazione), gpt-4o (vision), Whisper (audio) |
| Framer Motion | 12.34.3 | Animazioni, transizioni pagina, drag-to-delete, reorder |
| Recharts | 3.7.0 | Grafici peso/statistiche con linea tendenza |
| canvas-confetti | 1.9.4 | Celebrazioni raggiungimento obiettivi |
| Telegram Bot API | — | Interfaccia bot con streaming e background processing |

### Pattern architetturali

- **Hybrid Auth**: Supabase Auth (email) + localStorage fallback (utenti legacy Telegram)
- **Service-role bypass**: tutte le API usano `supabaseAdmin`, nessun auth middleware
- **Cache per-100g**: lookup nutrizionali cachati per nome cibo, scalati su richiesta
- **Validazione Atwater**: cross-validazione risultati API entro 15% accuratezza
- **Streaming Telegram**: messaggi mostrano clessidra durante l'elaborazione
- **Async processing**: webhook Telegram fa ACK immediato, processa con `after()`
- **Lazy Supabase**: pattern Proxy previene crash al build senza env var
- **Recipe fast-path**: matching fuzzy ricette bypassa AI per logging istantaneo a costo zero
- **Exercise regex**: parsing locale evita chiamate OpenAI per allenamenti
- **Italian-first**: UI e prompt AI in italiano di default
- **Tipi pasto**: 4 tipi (colazione/pranzo/cena/snack) con auto-detection per ora
