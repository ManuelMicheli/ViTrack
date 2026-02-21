# ViTrack

Tracker per calorie, valori nutrizionali e allenamenti con bot Telegram e dashboard web. Supporta italiano e inglese.

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

### 4. Dashboard Web

```bash
# Installa dipendenze
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

Supporta anche messaggi vocali (trascrizione Whisper) e foto di etichette nutrizionali (analisi GPT-4o Vision).

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

Le ricette salvate vengono riconosciute automaticamente nel testo libero per logging istantaneo (senza chiamata AI).

### Dashboard Web

1. Registrati con email/password o accedi con Telegram ID
2. Dashboard con riepilogo calorie, macro e allenamenti
3. Chat AI integrata in ogni pagina
4. Pagine: Dashboard, Pasti, Allenamenti, Statistiche, Profilo, Impostazioni

## Tech Stack

- **Next.js 16** — App Router, API Routes, React 19
- **Tailwind CSS v4** — Dark theme
- **Supabase** — PostgreSQL + Auth + RLS
- **OpenAI** — gpt-5-mini (classificazione NL), gpt-4o (vision), Whisper (trascrizione)
- **Recharts** — Grafici peso/statistiche
- **Framer Motion** — Animazioni
- **Telegram Bot API** — Interfaccia bot
