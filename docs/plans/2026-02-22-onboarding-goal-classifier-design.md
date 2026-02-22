# Design: Onboarding Potenziato con Goal Classifier

**Data**: 2026-02-22
**Stato**: Approvato
**Riferimento**: GuidaObiettivi.md

---

## Obiettivo

Trasformare l'onboarding da un flusso lineare a 4 step in un flusso guidato a 6 step con branching condizionale, integrando completamente la logica della GuidaObiettivi.md per sotto-classificare gli obiettivi e calcolare calorie/macro dinamicamente.

## Decisioni di design

| Decisione | Scelta |
|---|---|
| Dove integrare la guida | Onboarding potenziato (non chat, non pagina educativa separata) |
| Livello di intelligenza | Flusso guidato completo con branching per obiettivo |
| Calcoli | Adottare la guida completamente (sostituire TDEE-400/+300 fissi) |
| Performance | Tutte e 4 le categorie sportive |
| Esperienza utente | Domanda diretta nell'onboarding (3 livelli) |
| Contenuto educativo | Card espandibili "Perché?" con spiegazioni dalla guida |

---

## Struttura del flusso

```
Step 1: Obiettivo principale (5 opzioni — invariato)
Step 2: Dati fisici (+ campo "esperienza allenamento")
Step 3: Lifestyle (invariato)
Step 4: Nutrizione (invariato)
Step 5: [NUOVO] Sotto-classificazione obiettivo (condizionale per goal)
Step 6: [NUOVO] Riepilogo personalizzato + card educative + conferma
```

### Step 5 — Sotto-classificazione

#### Per BULK ("Aumentare massa muscolare")

Il sistema analizza BF%, genere ed esperienza per determinare automaticamente:

- **Lean Bulk** (+150/+300 kcal): intermedi/avanzati, BF% < 18% uomini / < 28% donne
- **Bulk moderato** (+300/+500 kcal): principianti (< 1-2 anni), hardgainer
- **Bulk aggressivo** (+500/+750 kcal): SOLO atleti forza avanzati, periodi brevi

**Avviso critico**: se BF% > 20% (uomini) o > 30% (donne), il sistema SCONSIGLIA il bulk e propone cut/ricomposizione con spiegazione. L'utente può procedere comunque (lean bulk forzato).

Macro bulk:
- Proteine: 1.6-2.2 g/kg (target 2.0), mai > 2.5 g/kg
- Grassi: 0.8-1.2 g/kg (target 1.0), minimo 0.7 g/kg
- Carboidrati: residuo (tipico 4-7 g/kg), se < 3 g/kg → rivalutare

#### Per CUT ("Perdere grasso corporeo")

Classificazione automatica del deficit basata su BF%:

| BF% (uomini/donne) | Tipo deficit | Range |
|---|---|---|
| > 25% / > 35% | Aggressivo | -550 / -750 kcal |
| 20-25% / 30-35% | Moderato | -350 / -550 kcal |
| 15-20% / 25-30% | Moderato | -350 / -550 kcal |
| 12-15% / 22-25% | Conservativo | -250 / -350 kcal |
| < 12% / < 20% | Warning + minimo | -250 kcal |

**Pavimento calorico**: uomini ≥ 1400 kcal, donne ≥ 1200 kcal. Mai sotto.

**Per BF% > 30%**: proteine calcolate su peso ideale (altezza-100 uomini, altezza-110 donne).

Macro cut:
- Proteine: 2.0-2.7 g/kg (target 2.2), mai sotto 1.8 g/kg — MACRO PRIORITARIO
- Grassi: 0.6-1.0 g/kg (target 0.8), minimo assoluto 0.5 g/kg
- Carboidrati: residuo (tipico 2-4 g/kg), se < 100g/giorno → warning

#### Per PERFORMANCE ("Migliorare la performance atletica")

Selezione manuale della categoria sportiva (4 card):

| Categoria | Esempi | P g/kg | F g/kg | C g/kg | Calorie |
|---|---|---|---|---|---|
| A - Forza/Potenza | Powerlifting, sprint | 1.8-2.4 | 0.8-1.2 | 3-5 | TDEE ± 0/300 |
| B - Endurance | Corsa, ciclismo, nuoto | 1.4-1.8 | 0.8-1.2 | 5-12 | TDEE (alto) |
| C - Sport Intermittenti | Calcio, basket, MMA | 1.8-2.2 | 0.8-1.2 | 5-8 | TDEE |
| D - Tecnico-coordinativi | Ginnastica, arrampicata | 1.6-2.0 | 0.8-1.2 | 4-7 | TDEE |

Selezione fase stagione: Pre-stagione / Competitiva / Off-season.

#### Per MAINTAIN e HEALTHY EATING

Logica semplice: TDEE mantenimento, macro standard (P 2.0, F 1.0, C residuo).

### Step 6 — Riepilogo personalizzato

Layout con card informative:
1. **Card obiettivo**: tipo + surplus/deficit specifico
2. **Card calorie**: target giornaliero con breakdown TDEE + delta
3. **Card macronutrienti**: grammi per macro con g/kg
4. **Card monitoraggio**: indicazioni chiave per il monitoraggio
5. **Nota disclaimer**: "Questi numeri sono stime iniziali, vanno aggiustati dopo 2-3 settimane"

Ogni card ha un toggle espandibile "Perché questo valore?" con contenuto educativo dalla guida.

---

## Modifiche tecniche

### File nuovi

| File | Scopo |
|---|---|
| `src/lib/goal-classifier.ts` | Logica decisionale completa: classificazione, calcolo surplus/deficit dinamico, macro per obiettivo, avvisi, pavimento calorico |
| `src/app/onboarding/components/Step5GoalClassification.tsx` | UI sotto-classificazione condizionale |
| `src/app/onboarding/components/Step6Summary.tsx` | UI riepilogo finale con card espandibili |
| `supabase/migrations/XXX_goal_classification_columns.sql` | Migrazione nuove colonne |

### File modificati

| File | Modifica |
|---|---|
| `src/app/onboarding/page.tsx` | 4→6 step, nuovo state, branching |
| `src/app/onboarding/components/Step2Physical.tsx` | Campo "esperienza allenamento" |
| `src/app/api/onboarding/route.ts` | Nuovi campi, usa goal-classifier.ts |
| `src/app/api/recalculate/route.ts` | Stessa logica goal-classifier |
| `src/app/dashboard/stats/components/CalorieTargets.tsx` | Usa valori DB dinamici |

### Nuove colonne DB (tabella `users`)

```sql
training_experience TEXT       -- 'beginner' | 'intermediate' | 'advanced'
goal_subtype TEXT              -- sotto-tipo obiettivo (lean_bulk, moderate_deficit, ecc.)
calorie_surplus_deficit INT    -- delta calorie effettivo (+200, -450, ecc.)
season_phase TEXT              -- fase stagione (solo performance)
```

---

## Fuori scope

- Integrazione chat processor con logica della guida
- Modifica al prompt OpenAI per awareness obiettivo
- Pagina educativa standalone
- Strategie anti-plateau (refeed, diet break, reverse dieting) — funzionalità futura
- Supplementi e idratazione — funzionalità futura
