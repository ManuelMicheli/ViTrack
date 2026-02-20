# Micro-Interazioni, Animazioni e Personalizzazione — Design

**Data**: 2026-02-20
**Approccio**: Framer Motion All-In
**Librerie**: `framer-motion` (^11) + `canvas-confetti` (^1.9)

---

## 1. Infrastruttura Animazioni

### Componenti Core

**`<PageTransition>`** — Wrapper per ogni pagina dashboard.
AnimatePresence + motion.div con fade + slide-up (opacity 0→1, y 20→0, 300ms ease-out).
Applicato nel layout.tsx come wrapper dei children.

**`<AnimatedList>`** — Lista con ingresso staggered.
Ogni item entra con 50ms di delay incrementale, fade-in + slide-up.
Usato in MealList, WorkoutList, e qualsiasi lista dati.

**`<AnimatedNumber>`** — Counter animato.
Hook `useAnimatedNumber(value, duration)` basato su useSpring + useTransform.
Interpola dal valore precedente al nuovo con spring physics.
Usato per calorie, macro, acqua, peso.

**`<RippleButton>`** — Bottone con feedback tattile.
Ripple effect al click (cerchio che si espande dal punto di tocco).
Scale spring: 1 → 0.97 → 1 al press. Glow subtile sull'hover.
Sostituisce bottoni in QuickAddBar, BottomNav, ChatPanel.

### Configurazione Spring

| Contesto | Stiffness | Damping | Uso |
|----------|-----------|---------|-----|
| tap | 400 | 25 | snap rapido per click/tap |
| enter | 200 | 20 | entrata morbida elementi |
| number | 100 | 30 | conteggio fluido numeri |

---

## 2. Micro-Interazioni per Componente

### Dashboard (page.tsx)
- Saluto personalizzato basato su ora + nome utente
- Messaggio motivazionale contestuale (streak, calorie, obiettivi)
- Card grid con ingresso staggered (80ms delay per card)
- Tutti i numeri animati con AnimatedNumber

### CalorieProgress (cerchio SVG)
- Stroke-dashoffset animato con spring physics
- Colore dinamico: verde (<80%), giallo (80-100%), rosso (>100%)
- Pulse glow al 100%
- Count-up del numero centrale

### DailySummary (macro cards)
- Progress bar con spring animation
- Numeri animati per g proteine/carb/grassi/fibre
- Colore progress che si anima smoothly

### MealList / WorkoutList
- Ingresso staggered: slide-up + fade (50ms delay tra items)
- Swipe-to-delete con drag gesture orizzontale
- Exit animation: slide-left + fade-out
- Layout animation: ricompattamento smooth degli item rimanenti

### QuickAddBar
- Bottoni con RippleButton: ripple + scale spring
- Icone con bounce leggero all'hover (translateY -2px con spring)

### ChatPanel
- Slide-in con spring physics (leggero overshoot naturale)
- Messaggi con ingresso slide-up + fade staggered
- Typing indicator: wave pulse fluido
- Quick commands: scale spring al tap

### BottomNav / Sidebar
- Active indicator animato con layout animation
- Icon bounce leggero al tap su nav attiva
- Badge notifica con scale-in spring

### WaterTracker
- Fill animation dell'acqua con spring
- Splash effect al bottone +
- Numeri animati per ml/obiettivo

### WeightChart
- Draw animation: grafico si disegna da sinistra a destra
- Dots con scale-in staggered dopo che la linea li raggiunge

---

## 3. Personalizzazione

### Saluti Contestuali

Logica oraria in helper `getGreeting(firstName)`:
- 5:00–12:00 → "Buongiorno, {nome}"
- 12:00–18:00 → "Buon pomeriggio, {nome}"
- 18:00–22:00 → "Buonasera, {nome}"
- 22:00–5:00 → "Buonanotte, {nome}"

Messaggi motivazionali in helper `getMotivation(userData)`, priorita a cascata:
1. Obiettivo calorie raggiunto → "Obiettivo raggiunto! Ottimo lavoro"
2. Streak >= 3 giorni → "Sei in streak da X giorni, continua cosi!"
3. Calorie registrate > 0 → "Ancora Xkcal per completare la giornata"
4. Workout fatto oggi → "Allenamento completato, bravo!"
5. Default → "Inizia registrando il tuo primo pasto"

### Celebrazioni (canvas-confetti)

Trigger automatici:
- **Obiettivo calorie**: 30 particelle, spread 60, 1x/giorno (flag sessionStorage)
- **Streak milestone** (7,14,30,60,100): 100 particelle, colori oro
- **Primo pasto del giorno**: icona check verde scale-in (no confetti)
- **Workout completato**: burst particelle blu

Componente `<Celebration>` montato nella dashboard, ascolta context/event per trigger.

### Preferenze Visive (Settings page)

**Accent Color** — 6 opzioni: Blu (default), Viola, Ciano, Verde, Arancione, Rosa.
Salvato in localStorage `vitrack_accent_color`, applicato via CSS variable `--color-primary`.
Transizione smooth 300ms al cambio.

**Layout Mode** — 2 opzioni: Compatto (card piccole, meno padding) / Espanso (default, layout attuale).

**Ordine Sezioni Dashboard** — Drag-and-drop con framer-motion Reorder.
Sezioni riordinabili: Saluto, Calorie, Macro, Pasti recenti, Acqua, Peso.
Salvato in localStorage `vitrack_dashboard_order`.
