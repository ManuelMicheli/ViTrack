"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Tip {
  phase: string;
  tag: string;
  tagColor: string;
  title: string;
  summary: string;
  detail: string;
}

interface PhaseBlock {
  id: string;
  startHour: number;
  endHour: number;
  tips: Tip[];
}

// ── Tip data (from ROUTINE_PROTOCOL_1.md) ──────────────────────────

const WAKE_TIPS: Tip[] = [
  {
    phase: "Risveglio",
    tag: "Priorita #1",
    tagColor: "#E03C32",
    title: "Idratazione immediata",
    summary: "Bevi 400-500ml di acqua con un pizzico di sale integrale appena sveglio.",
    detail: "Dopo il sonno il corpo e in deficit idrico del 2-3%, sufficiente a ridurre la performance cognitiva e il metabolismo basale. L'aggiunta di sale integrale (sodio) migliora l'assorbimento intestinale dell'acqua tramite il co-trasporto sodio-glucosio. Reidratarsi prima di qualsiasi altra cosa ripristina il volume plasmatico e attiva i processi metabolici.",
  },
  {
    phase: "Risveglio",
    tag: "Circadian Reset",
    tagColor: "#F59E0B",
    title: "Esposizione alla luce naturale",
    summary: "Almeno 10 minuti di luce solare diretta (non attraverso vetri).",
    detail: "La luce solare mattutina (>10.000 lux) sopprime la melatonina residua, innalza il cortisolo al suo picco fisiologico mattutino e sincronizza il nucleo soprachiasmatico (SCN) — il master clock circadiano. Questo migliora energia e focus diurno e la qualita del sonno la notte successiva.",
  },
  {
    phase: "Risveglio",
    tag: "Attivazione",
    tagColor: "#10B981",
    title: "Movimento leggero di attivazione",
    summary: "5-10 minuti di camminata, stretching dinamico o mobilita articolare.",
    detail: "Serve ad attivare il sistema nervoso simpatico, aumentare il flusso ematico periferico e ridurre la rigidita muscolare accumulata durante il sonno. Anche una breve camminata mattutina aumenta il BDNF (Brain-Derived Neurotrophic Factor), migliorando le funzioni cognitive per le ore successive.",
  },
];

const BREAKFAST_TIPS: Tip[] = [
  {
    phase: "Primo pasto",
    tag: "Fondamentale",
    tagColor: "#E03C32",
    title: "Proteine come priorita",
    summary: "Inizia con 30-40g di proteine ad alto valore biologico (uova, skyr, whey, pesce).",
    detail: "La leucina contenuta nelle proteine di alta qualita attiva il pathway mTOR e avvia la sintesi proteica muscolare (MPS) dopo il digiuno notturno. Servono almeno 2.5g di leucina per raggiungere la soglia di attivazione — equivalenti a circa 30g di proteine da fonti animali o whey. Le proteine al primo pasto aumentano anche la sazieta tramite PYY e GLP-1.",
  },
  {
    phase: "Primo pasto",
    tag: "Adattivo",
    tagColor: "#6B8CAE",
    title: "Carboidrati adattivi",
    summary: "Includi carboidrati complessi: avena, pane integrale, frutta. Il glicogeno epatico si e ridotto del 50-80% durante la notte.",
    detail: "Il glicogeno epatico si depleta del 50-80% durante il digiuno notturno (il cervello consuma ~5g/h di glucosio). Ripristinarlo al primo pasto garantisce substrato energetico disponibile. Nei giorni di rest, la priorita si sposta su fibre, grassi essenziali e micronutrienti.",
  },
  {
    phase: "Primo pasto",
    tag: "Timing",
    tagColor: "#F59E0B",
    title: "Caffeina strategica",
    summary: "Ritarda la caffeina di 60-90 minuti dal risveglio per massimizzarne l'effetto.",
    detail: "Il cortisolo ha un picco naturale nei primi 30-60 minuti dal risveglio (Cortisol Awakening Response). Assumere caffeina durante questo picco ne riduce l'effetto ergogenico. Ritardandola di 60-90 minuti, si sfrutta il calo fisiologico del cortisolo e si ottiene un effetto stimolante piu pulito e prolungato.",
  },
];

const MIDDAY_TIPS: Tip[] = [
  {
    phase: "Fase produttiva",
    tag: "Nutrienti chiave",
    tagColor: "#10B981",
    title: "Vitamina D3 + K2",
    summary: "Momento ideale per Vitamina D3 (2000-4000 UI) + K2 con il pasto.",
    detail: "La biodisponibilita della vitamina D3 aumenta fino al 50% quando assunta con un pasto contenente grassi. La K2 (menachinone) dirige il calcio mobilizzato dalla D3 verso le ossa anziche le arterie. La dose di 2000-4000 UI/giorno corregge la carenza cronica presente nel 40-60% della popolazione europea.",
  },
  {
    phase: "Fase produttiva",
    tag: "Ongoing",
    tagColor: "#6B8CAE",
    title: "Idratazione costante",
    summary: "Target: 35-40ml per kg di peso corporeo al giorno. Non aspettare la sete.",
    detail: "Quando percepisci la sete, sei gia in deficit dell'1-2% del peso corporeo in acqua. Un deficit del 2% riduce la performance cognitiva del 10-20% e la forza muscolare fino al 10%. Formula pratica: peso corporeo (kg) x 0.035 = litri base + 500ml per ogni ora di allenamento.",
  },
  {
    phase: "Fase produttiva",
    tag: "NEAT",
    tagColor: "#F59E0B",
    title: "Movimento anti-sedentarieta",
    summary: "Ogni 60-90 minuti: 5 minuti di camminata o movimento leggero.",
    detail: "La sedentarieta prolungata (>60 minuti) riduce la sensibilita insulinica muscolare indipendentemente da quanto ci si allena. Il NEAT (Non-Exercise Activity Thermogenesis) puo rappresentare il 15-30% del dispendio calorico totale e varia enormemente tra individui.",
  },
];

const PREWORKOUT_TIPS: Tip[] = [
  {
    phase: "Pre-Allenamento",
    tag: "2-3h prima",
    tagColor: "#E03C32",
    title: "Pasto pre-workout",
    summary: "0.4g/kg carboidrati + 0.3g/kg proteine, grassi bassi. Energia senza pesantezza.",
    detail: "I grassi rallentano lo svuotamento gastrico (4-6h vs 2-3h per carb+proteine) e possono causare disagio durante l'allenamento. I carboidrati complessi 2-3h prima garantiscono glicogeno muscolare pieno. Le proteine pre-workout iniziano l'aminoacidemia gia durante l'allenamento.",
  },
  {
    phase: "Pre-Allenamento",
    tag: "Opzionale",
    tagColor: "#6B8CAE",
    title: "Caffeina pre-workout",
    summary: "150-200mg di caffeina (1 espresso doppio). Picco in 45-60 min.",
    detail: "La caffeina a 3-6mg/kg migliora la forza massimale (+3-5%), la resistenza (+2-4%), il focus e riduce la percezione della fatica (RPE). Non superare 400mg/giorno totali. Stop caffeina 8-10h prima di dormire.",
  },
  {
    phase: "Pre-Allenamento",
    tag: "Daily",
    tagColor: "#10B981",
    title: "Creatina monoidrato",
    summary: "5g di creatina monoidrato al giorno. La costanza conta piu del timing.",
    detail: "L'integratore sportivo piu studiato (700+ studi). Aumenta le riserve di fosfocreatina muscolare (+20-30%), migliorando la performance in sforzi ad alta intensita. +5-10% forza, +1-2kg massa magra in 4-12 settimane. Non serve la fase di carico — 5g/giorno raggiungono la saturazione in 3-4 settimane.",
  },
];

const POSTWORKOUT_TIPS: Tip[] = [
  {
    phase: "Post-Allenamento",
    tag: "Recovery",
    tagColor: "#E03C32",
    title: "Proteine + Carboidrati rapidi",
    summary: "0.4-0.5g/kg proteine + 0.8-1.2g/kg carboidrati. Rapporto carb:proteine 3:1.",
    detail: "Il rapporto 3:1 carboidrati:proteine massimizza la risposta insulinica e l'uptake aminoacidico muscolare. I carboidrati ad alto IG accelerano il replenishment del glicogeno muscolare del 50% rispetto a carb a basso IG. La sintesi proteica muscolare ha il picco nelle prime 2h post-workout.",
  },
  {
    phase: "Post-Allenamento",
    tag: "Critico",
    tagColor: "#F59E0B",
    title: "Reidratazione post-workout",
    summary: "Per ogni kg perso durante l'allenamento, 1.5L di acqua con elettroliti.",
    detail: "La disidratazione post-workout ritarda il recovery, riduce la sintesi proteica muscolare e compromette la performance nelle sessioni successive. Servono elettroliti (sodio 1-1.5g/L e potassio) per trattenere i liquidi. Stima ~500-1000ml extra per ogni ora di allenamento.",
  },
  {
    phase: "Post-Allenamento",
    tag: "Avanzato",
    tagColor: "#6B8CAE",
    title: "Anti-DOMS",
    summary: "3-5g taurina + cibi ricchi di antiossidanti (frutti di bosco, melagrana). Evita FANS.",
    detail: "La taurina (3-5g) riduce i DOMS e i marcatori di danno muscolare (CK, LDH) nelle successive 48-72h. Evitare FANS (ibuprofene) post-workout: bloccano la cascata infiammatoria che e parte del segnale di adattamento muscolare, riducendo ipertrofia e forza nel lungo termine.",
  },
];

const EVENING_TIPS: Tip[] = [
  {
    phase: "Sera",
    tag: "Nutrizione",
    tagColor: "#10B981",
    title: "Carboidrati serali",
    summary: "I carboidrati alla sera favoriscono il sonno. Se in deficit e con fame, caseina o skyr greco.",
    detail: "I carboidrati serali aumentano la disponibilita di triptofano cerebrale, favorendo la conversione triptofano -> serotonina -> melatonina e migliorando la qualita del sonno. I carboidrati la sera NON fanno ingrassare piu di quelli al mattino — il bilancio calorico totale e cio che conta.",
  },
  {
    phase: "Sera",
    tag: "Integratore chiave",
    tagColor: "#6B8CAE",
    title: "Magnesio bisglicinato",
    summary: "300-400mg la sera. Migliora sonno profondo e recovery muscolare.",
    detail: "Il magnesio bisglicinato agisce come modulatore positivo del recettore GABA-A, producendo un effetto calmante. Migliora la qualita del sonno profondo (Slow Wave Sleep), la fase in cui avviene la maggior parte del rilascio di GH e del recovery muscolare. Carenze subcliniche sono presenti nel 50-80% della popolazione.",
  },
  {
    phase: "Sera",
    tag: "Non negoziabile",
    tagColor: "#E03C32",
    title: "Igiene del sonno",
    summary: "Stop caffeina 8-10h prima. Luci blu ridotte 60-90 min prima. Temperatura 18-19°C.",
    detail: "Il sonno e il singolo fattore piu impattante su recovery, composizione corporea e performance. Sotto le 6h a notte: testosterone -15%, cortisolo +30%, sensibilita insulinica -40%, leptina -18%, GH -70%. La luce blu sopprime la melatonina del 50-60%.",
  },
  {
    phase: "Sera",
    tag: "Avanzato",
    tagColor: "#F59E0B",
    title: "Stack pre-sleep",
    summary: "Glicina 3g + ZMA (zinco, magnesio, B6) prima di dormire.",
    detail: "La glicina abbassa la temperatura corporea core di 0.3-0.5°C tramite vasodilatazione periferica, accelerando l'addormentamento. Lo ZMA supporta la produzione endogena di testosterone durante il sonno — utile per chi si allena ad alta intensita o e in deficit calorico.",
  },
];

// ── Schedule builder ────────────────────────────────────────────────

/** Derive workout hour from user's preferred_training_time */
function getWorkoutHour(pref: string | null | undefined): number {
  switch (pref) {
    case "mattina":
    case "morning":
      return 8;
    case "tarda mattina":
    case "late_morning":
      return 11;
    case "pranzo":
    case "midday":
      return 13;
    case "pomeriggio":
    case "afternoon":
      return 15;
    case "sera":
    case "evening":
      return 18;
    case "tarda sera":
    case "late_evening":
      return 20;
    default:
      return 17; // default pomeriggio
  }
}

/**
 * Build a daily phase schedule adapted to user's routine.
 *
 * Fixed phases: wake, breakfast, evening (anchored to sleep/wake cycle)
 * Floating phases: midday, pre-workout, post-workout (shift with workout time)
 *
 * If hasWorkoutToday is false (rest day), pre/post workout phases are replaced
 * with an extended midday productive phase.
 */
function buildSchedule(
  workoutHour: number,
  hasWorkoutToday: boolean,
): PhaseBlock[] {
  // Wake and breakfast are always early
  const phases: PhaseBlock[] = [
    { id: "wake", startHour: 5, endHour: 9, tips: WAKE_TIPS },
    { id: "breakfast", startHour: 9, endHour: 11, tips: BREAKFAST_TIPS },
  ];

  if (hasWorkoutToday) {
    // Pre-workout: 3h window ending at workout time
    const preStart = Math.max(11, workoutHour - 3);
    const preEnd = workoutHour;
    // Post-workout: 2h window after workout
    const postStart = workoutHour;
    const postEnd = Math.min(workoutHour + 2, 22);

    // Midday fills the gap between breakfast and pre-workout
    if (preStart > 11) {
      phases.push({ id: "midday", startHour: 11, endHour: preStart, tips: MIDDAY_TIPS });
    }
    phases.push({ id: "preworkout", startHour: preStart, endHour: preEnd, tips: PREWORKOUT_TIPS });
    phases.push({ id: "postworkout", startHour: postStart, endHour: postEnd, tips: POSTWORKOUT_TIPS });
    // Evening starts after post-workout
    phases.push({ id: "evening", startHour: postEnd, endHour: 5, tips: EVENING_TIPS });
  } else {
    // Rest day: midday extends, no workout phases
    phases.push({ id: "midday", startHour: 11, endHour: 20, tips: MIDDAY_TIPS });
    phases.push({ id: "evening", startHour: 20, endHour: 5, tips: EVENING_TIPS });
  }

  return phases;
}

function findCurrentPhase(phases: PhaseBlock[]): PhaseBlock {
  const hour = new Date().getHours();
  for (const phase of phases) {
    if (phase.startHour < phase.endHour) {
      if (hour >= phase.startHour && hour < phase.endHour) return phase;
    } else {
      // Wrap-around (evening 20–5)
      if (hour >= phase.startHour || hour < phase.endHour) return phase;
    }
  }
  return phases[phases.length - 1];
}

function getTipIndex(tipsCount: number): number {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const hourBracket = Math.floor(now.getHours() / 3);
  return (dayOfYear + hourBracket) % tipsCount;
}

// ── Component ───────────────────────────────────────────────────────

interface DailyTipCardProps {
  preferredTrainingTime?: string | null;
  hasWorkoutToday?: boolean;
}

export default function DailyTipCard({
  preferredTrainingTime,
  hasWorkoutToday = false,
}: DailyTipCardProps) {
  const [expanded, setExpanded] = useState(false);

  const { tip, phaseName } = useMemo(() => {
    const workoutHour = getWorkoutHour(preferredTrainingTime);
    const schedule = buildSchedule(workoutHour, hasWorkoutToday);
    const phase = findCurrentPhase(schedule);
    const idx = getTipIndex(phase.tips.length);
    return { tip: phase.tips[idx], phaseName: phase.tips[0].phase };
  }, [preferredTrainingTime, hasWorkoutToday]);

  return (
    <div className="data-card p-4">
      {/* Header: phase label + tag */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-text-tertiary shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5C8.35 12.26 8.82 13.02 9 14" />
          </svg>
          <span className="font-mono-label text-[10px] text-text-tertiary uppercase tracking-wider">
            {phaseName}
          </span>
        </div>
        <span
          className="font-mono-label text-[10px] px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${tip.tagColor}20`,
            color: tip.tagColor,
          }}
        >
          {tip.tag}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-display text-sm font-bold text-text-primary mb-1">
        {tip.title}
      </h3>

      {/* Summary */}
      <p className="font-body text-sm text-text-secondary leading-relaxed">
        {tip.summary}
      </p>

      {/* Expandable detail */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="font-mono-label text-[11px] text-[var(--color-accent-dynamic)] hover:opacity-80 transition-opacity mt-2 flex items-center gap-1"
      >
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-block"
        >
          &rsaquo;
        </motion.span>
        Perche?
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="font-body text-xs text-text-tertiary leading-relaxed mt-2 pt-2 border-t border-white/5">
              {tip.detail}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
