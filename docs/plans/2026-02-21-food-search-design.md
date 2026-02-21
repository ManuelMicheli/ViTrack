# Ricerca Alimenti Istantanea — Design

## Obiettivo

Aggiungere una barra di ricerca alimenti in cima alla pagina meals della dashboard. L'utente cerca un alimento, vede risultati con valori nutrizionali, seleziona grammi, aggiunge al carrello, e logga tutto come un unico pasto. Stile MFP/FatSecret.

## Flusso UX

1. Barra di ricerca sempre visibile in cima alla pagina meals
2. Digita un alimento → debounce 400ms → dropdown con max 8 risultati (nome + kcal/100g + P/C/F)
3. Clicca risultato → inline: imposta grammi, valori si aggiornano in tempo reale
4. "Aggiungi" → alimento va nel carrello in basso
5. Carrello mostra lista alimenti + macro totali aggregate
6. "Logga pasto" → scegli tipo pasto (colazione/pranzo/cena/snack) → salva

## Architettura

### Nuovo endpoint: `POST /api/foods/search`

- Input: `{ query: string }`
- Cerca in parallelo su USDA, OpenFoodFacts, FatSecret
- Restituisce array di `{ name, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, source }`
- Sfrutta cache per-100g esistente in `nutrition.ts`
- Deduplica risultati simili

### Frontend: componente `FoodSearch`

- Barra di ricerca con debounce (400ms)
- Dropdown risultati con valori per 100g
- Selezione grammi (input numerico, default 100g)
- Carrello locale (useState) con alimenti selezionati
- Al salvataggio: `POST /api/meals` con description aggregata e macro sommate

### Impatto zero su flussi esistenti

- Nessuna modifica a `chat-processor.ts`
- Nessuna modifica al webhook Telegram
- Nessuna modifica a `/api/chat`
- Nessuna modifica a `/api/meals` (usa POST esistente)
- Solo aggiunte: `/api/foods/search` + componente UI
