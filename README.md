# ViTrack

Tracker per calorie, valori nutrizionali e allenamenti con bot Telegram e dashboard web.

## Architettura

```
Utente → Telegram Bot → N8N Workflow → Claude API → Supabase
                                                       ↓
                                         Web Dashboard (Next.js su Vercel)
```

## Setup

### 1. Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Apri il SQL Editor ed esegui il file `supabase/migrations/001_initial_schema.sql`
3. Copia URL e anon key dalle impostazioni del progetto

### 2. Telegram Bot

1. Apri [@BotFather](https://t.me/BotFather) su Telegram
2. Crea un nuovo bot con `/newbot`
3. Salva il token del bot
4. Imposta i comandi con `/setcommands`:
   ```
   start - Registrazione
   oggi - Riepilogo giornaliero
   obiettivo - Imposta obiettivo calorico (es. /obiettivo 2000)
   ```

### 3. N8N

1. Importa il workflow da `n8n/vitrack-workflow.json` nella tua istanza N8N
2. Configura le credenziali:
   - **Telegram Bot API**: inserisci il token del bot
   - **Supabase**: aggiorna URL e API key nei nodi HTTP Request
   - **Anthropic API**: inserisci la tua API key Claude
3. Attiva il workflow

### 4. Dashboard Web

```bash
# Installa dipendenze
npm install

# Configura le variabili d'ambiente
cp .env.example .env.local
# Modifica .env.local con URL e key di Supabase

# Avvia in sviluppo
npm run dev

# Build per produzione
npm run build
```

### 5. Deploy su Vercel

1. Push del repository su GitHub
2. Importa il progetto su [vercel.com](https://vercel.com)
3. Aggiungi le variabili d'ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Utilizzo

### Bot Telegram

- **Messaggi liberi**: scrivi cosa hai mangiato o che allenamento hai fatto
  - `"Ho mangiato 200g di pasta al pomodoro a pranzo"`
  - `"Ho fatto 30 minuti di corsa"`
  - `"Colazione: yogurt greco con miele e noci"`
- **`/start`** - Registra il tuo account
- **`/oggi`** - Mostra il riepilogo del giorno
- **`/obiettivo 2500`** - Imposta l'obiettivo calorico giornaliero

### Dashboard Web

1. Accedi con il tuo Telegram ID
2. Visualizza il riepilogo giornaliero con calorie, macro e allenamenti
3. Naviga tra i giorni con il selettore data

## Credenziali necessarie

| Servizio | Dove ottenerla |
|----------|----------------|
| Telegram Bot Token | [@BotFather](https://t.me/BotFather) |
| Supabase URL + Key | Dashboard progetto Supabase |
| Anthropic API Key | [console.anthropic.com](https://console.anthropic.com) |
| N8N | Istanza self-hosted o [n8n.cloud](https://n8n.cloud) |

## Tech Stack

- **Next.js** - Dashboard web
- **Tailwind CSS** - Styling
- **Supabase** - Database PostgreSQL
- **N8N** - Orchestrazione workflow
- **Claude API** - Interpretazione linguaggio naturale
- **Telegram Bot API** - Interfaccia utente
