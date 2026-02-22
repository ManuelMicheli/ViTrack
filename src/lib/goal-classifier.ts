// =============================================================================
// goal-classifier.ts — Central decision engine for nutrition goal classification
// Implements ALL logic from GuidaObiettivi.md
// Pure TypeScript, no external dependencies, all text in Italian
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';
export type Gender = 'male' | 'female' | 'other';
export type BulkSubtype = 'lean_bulk' | 'moderate_bulk' | 'aggressive_bulk';
export type CutSubtype = 'conservative_deficit' | 'moderate_deficit' | 'aggressive_deficit';
export type PerformanceSubtype = 'performance_strength' | 'performance_endurance' | 'performance_intermittent' | 'performance_technical';
export type GoalSubtype = BulkSubtype | CutSubtype | PerformanceSubtype | 'maintain' | 'healthy';
export type SportCategory = 'strength' | 'endurance' | 'intermittent' | 'technical';
export type SeasonPhase = 'pre_season' | 'competitive' | 'off_season';

export interface ClassificationInput {
  goal: string;
  gender: Gender;
  weight_kg: number;
  height_cm: number;
  age: number;
  body_fat_percentage: number | null;
  training_experience: TrainingExperience;
  activity_level: string;
  sport_category?: SportCategory;
  season_phase?: SeasonPhase;
}

export interface ClassificationWarning {
  type: 'bulk_high_bf' | 'cut_low_bf' | 'floor_applied' | 'low_carbs';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestion?: string;
}

export interface ClassificationResult {
  goal_subtype: GoalSubtype;
  daily_calorie_target: number;
  calorie_surplus_deficit: number;
  macro_protein_g: number;
  macro_carbs_g: number;
  macro_fat_g: number;
  protein_per_kg: number;
  fat_per_kg: number;
  carbs_per_kg: number;
  warnings: ClassificationWarning[];
  monitoring: MonitoringInfo;
  education: EducationContent;
}

export interface MonitoringInfo {
  weight_change_target: string;
  weight_change_direction: 'increase' | 'decrease' | 'stable';
  check_frequency: string;
  adjustment_rule: string;
}

export interface EducationContent {
  goal_explanation: string;
  calorie_explanation: string;
  protein_explanation: string;
  carbs_explanation: string;
  fat_explanation: string;
}

// -----------------------------------------------------------------------------
// Utility: getGoalCategory
// -----------------------------------------------------------------------------

export function getGoalCategory(goal: string): 'bulk' | 'cut' | 'performance' | 'maintain' | 'healthy' {
  if (goal === 'Aumentare massa muscolare') return 'bulk';
  if (goal === 'Perdere grasso corporeo') return 'cut';
  if (goal === 'Migliorare la performance atletica') return 'performance';
  if (goal === 'Mangiare più sano') return 'healthy';
  return 'maintain';
}

// -----------------------------------------------------------------------------
// Internal helpers (not exported)
// -----------------------------------------------------------------------------

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function computeMacros(
  calories: number,
  weight_kg: number,
  proteinPerKg: number,
  fatPerKg: number
): { protein_g: number; fat_g: number; carbs_g: number } {
  const protein_g = round1(weight_kg * proteinPerKg);
  const fat_g = round1(weight_kg * fatPerKg);
  const carbs_g = round1(Math.max(0, (calories - protein_g * 4 - fat_g * 9) / 4));
  return { protein_g, fat_g, carbs_g };
}

function applyCalorieFloor(
  calories: number,
  gender: Gender
): { calories: number; floorApplied: boolean; originalCalories: number } {
  const floor = gender === 'female' ? 1200 : 1400;
  if (calories < floor) {
    return { calories: floor, floorApplied: true, originalCalories: calories };
  }
  return { calories, floorApplied: false, originalCalories: calories };
}

function getIdealWeight(gender: Gender, height_cm: number): number {
  return gender === 'female' ? height_cm - 110 : height_cm - 100;
}

// -----------------------------------------------------------------------------
// BULK classification
// -----------------------------------------------------------------------------

function classifyBulk(input: ClassificationInput, tdee: number): ClassificationResult {
  const { gender, weight_kg, body_fat_percentage, training_experience } = input;
  const warnings: ClassificationWarning[] = [];

  const isMale = gender !== 'female';
  const highBfThreshold = isMale ? 20 : 30;

  let goalSubtype: BulkSubtype;
  let surplus: number;

  // Check BF% and determine bulk type
  const hasHighBf = body_fat_percentage !== null && body_fat_percentage > highBfThreshold;

  if (hasHighBf) {
    // High BF%: warn and force lean_bulk with minimum surplus
    warnings.push({
      type: 'bulk_high_bf',
      severity: 'critical',
      message: `Il tuo livello di grasso corporeo è elevato (${body_fat_percentage}%). Consigliamo prima una fase di dimagrimento per migliorare il partizionamento calorico.`,
      suggestion: `Considera di iniziare con un deficit moderato per scendere sotto il ${isMale ? 18 : 28}% (${isMale ? 'uomini' : 'donne'}), poi procedere con la massa.`,
    });
    goalSubtype = 'lean_bulk';
    surplus = 150;
  } else {
    // Normal path: determine by training experience
    switch (training_experience) {
      case 'beginner':
        goalSubtype = 'moderate_bulk';
        surplus = 400; // midpoint of 300-500
        break;
      case 'intermediate':
      case 'advanced':
      default:
        goalSubtype = 'lean_bulk';
        surplus = 225; // midpoint of 150-300
        break;
    }
  }

  const target = Math.round(tdee + surplus);
  const { protein_g, fat_g, carbs_g } = computeMacros(target, weight_kg, 2.0, 1.0);

  // Check low carbs
  const carbsPerKg = round1(carbs_g / weight_kg);
  if (carbsPerKg < 3) {
    warnings.push({
      type: 'low_carbs',
      severity: 'warning',
      message: `I carboidrati risultano bassi (${carbs_g}g, ${carbsPerKg} g/kg). In fase di massa i carboidrati dovrebbero essere almeno 3 g/kg per performance e crescita ottimali.`,
    });
  }

  // Monitoring
  let weightChangeTarget: string;
  let adjustmentRule: string;
  switch (training_experience) {
    case 'beginner':
      weightChangeTarget = '1.0-1.5% del peso corporeo/mese';
      adjustmentRule = 'Se non aumenti per 2+ settimane: +100-150 kcal da carboidrati';
      break;
    case 'intermediate':
      weightChangeTarget = '0.5-1.0% del peso corporeo/mese';
      adjustmentRule = 'Se non aumenti per 2+ settimane: +100-150 kcal da carboidrati';
      break;
    case 'advanced':
    default:
      weightChangeTarget = '0.25-0.5% del peso corporeo/mese';
      adjustmentRule = 'Se non aumenti per 2+ settimane: +100-150 kcal da carboidrati';
      break;
  }

  const monitoring: MonitoringInfo = {
    weight_change_target: weightChangeTarget,
    weight_change_direction: 'increase',
    check_frequency: 'Media settimanale del peso',
    adjustment_rule: adjustmentRule,
  };

  // Education
  const bulkExplanations: Record<BulkSubtype, string> = {
    lean_bulk: `Il lean bulk è un approccio controllato che minimizza l'accumulo di grasso. Con un surplus di ${surplus} kcal, il tuo corpo ha abbastanza energia per costruire muscolo senza eccedere.`,
    moderate_bulk: `Il bulk moderato con un surplus di ${surplus} kcal è ideale per i principianti, che hanno il maggior potenziale di crescita muscolare. Il surplus più generoso garantisce abbastanza energia per sfruttare al massimo la fase iniziale di adattamento.`,
    aggressive_bulk: `Il bulk aggressivo con un surplus di ${surplus} kcal è riservato ad atleti avanzati in preparazione. È efficace ma porta a un maggior accumulo di grasso.`,
  };
  const goalExplanation = bulkExplanations[goalSubtype];

  const education: EducationContent = {
    goal_explanation: goalExplanation,
    calorie_explanation: `Il tuo TDEE è di ${Math.round(tdee)} kcal. Con un surplus di +${surplus} kcal, il tuo target è ${target} kcal/giorno. Questo surplus moderato favorisce la crescita muscolare limitando l'accumulo di grasso.`,
    protein_explanation: `In fase di massa, 2.0 g/kg di proteine sono sufficienti. Il surplus calorico è già anti-catabolico, quindi non serve spingerle oltre. Proteine troppo alte tolgono spazio ai carboidrati, più importanti per performance e crescita.`,
    carbs_explanation: `I carboidrati sono il macro PRIORITARIO in fase di massa. Alimentano gli allenamenti ad alta intensità, stimolano l'insulina (ormone anabolico) e favoriscono il recupero. ${carbs_g}g ti danno ${carbsPerKg} g/kg.`,
    fat_explanation: `1.0 g/kg di grassi sostiene la produzione ormonale (testosterone, IGF-1), cruciale per la crescita muscolare, senza togliere spazio ai carboidrati.`,
  };

  return {
    goal_subtype: goalSubtype,
    daily_calorie_target: target,
    calorie_surplus_deficit: surplus,
    macro_protein_g: protein_g,
    macro_carbs_g: carbs_g,
    macro_fat_g: fat_g,
    protein_per_kg: 2.0,
    fat_per_kg: 1.0,
    carbs_per_kg: carbsPerKg,
    warnings,
    monitoring,
    education,
  };
}

// -----------------------------------------------------------------------------
// CUT classification
// -----------------------------------------------------------------------------

function classifyCut(input: ClassificationInput, tdee: number): ClassificationResult {
  const { gender, weight_kg, height_cm, body_fat_percentage } = input;
  const warnings: ClassificationWarning[] = [];

  const isMale = gender !== 'female';
  const bf = body_fat_percentage;

  // Step 1: Determine cut subtype and deficit based on BF%
  let goalSubtype: CutSubtype;
  let deficit: number; // negative value

  if (bf === null) {
    // BF% unavailable: default moderate
    goalSubtype = 'moderate_deficit';
    deficit = -450;
  } else {
    // Check low BF% warning
    const lowBfThreshold = isMale ? 12 : 20;
    if (bf < lowBfThreshold) {
      warnings.push({
        type: 'cut_low_bf',
        severity: 'warning',
        message: `La tua percentuale di grasso è già bassa (${bf}%). Un ulteriore deficit comporta rischi per la salute e la performance.`,
      });
    }

    if (isMale) {
      if (bf > 25) {
        goalSubtype = 'aggressive_deficit';
        deficit = -650; // midpoint of -550 to -750
      } else if (bf >= 15 && bf <= 25) {
        goalSubtype = 'moderate_deficit';
        deficit = -450; // midpoint of -350 to -550
      } else if (bf >= 12 && bf < 15) {
        goalSubtype = 'conservative_deficit';
        deficit = -300; // midpoint of -250 to -350
      } else {
        // bf < 12
        goalSubtype = 'conservative_deficit';
        deficit = -250;
      }
    } else {
      // female (or other, treated as female thresholds)
      if (bf > 35) {
        goalSubtype = 'aggressive_deficit';
        deficit = -650;
      } else if (bf >= 25 && bf <= 35) {
        goalSubtype = 'moderate_deficit';
        deficit = -450;
      } else if (bf >= 22 && bf < 25) {
        // BF% 22-25% female: conservative deficit (per GuidaObiettivi.md)
        goalSubtype = 'conservative_deficit';
        deficit = -300;
      } else {
        // bf < 22
        goalSubtype = 'conservative_deficit';
        deficit = -250;
      }
    }
  }

  // Step 2: Compute target with calorie floor
  let computedTarget = Math.round(tdee + deficit);
  const { calories: target, floorApplied, originalCalories } = applyCalorieFloor(computedTarget, gender);

  if (floorApplied) {
    const floor = gender === 'female' ? 1200 : 1400;
    warnings.push({
      type: 'floor_applied',
      severity: 'warning',
      message: `Il calcolo portava a ${originalCalories} kcal, ma abbiamo alzato a ${floor} kcal (minimo sicuro per ${gender === 'female' ? 'donne' : 'uomini'}). Compensa con più attività fisica.`,
    });
  }

  // Recalculate actual deficit after floor
  const actualDeficit = target - Math.round(tdee);

  // Step 3: Macros
  // Protein weight basis: if BF% > 30%, use ideal weight; otherwise actual
  const useIdealWeight = bf !== null && bf > 30;
  const proteinBasisWeight = useIdealWeight ? getIdealWeight(gender, height_cm) : weight_kg;

  const proteinPerKg = 2.2;
  const fatPerKg = 0.8;
  const protein_g = round1(proteinBasisWeight * proteinPerKg);
  const fat_g = round1(weight_kg * fatPerKg); // fat always on actual weight
  const carbs_g = round1(Math.max(0, (target - protein_g * 4 - fat_g * 9) / 4));

  const carbsPerKg = round1(carbs_g / weight_kg);

  // Check low carbs
  if (carbs_g < 100) {
    warnings.push({
      type: 'low_carbs',
      severity: 'warning',
      message: `I carboidrati sono molto bassi (${carbs_g}g). Cerca di concentrarli attorno all'allenamento per mantenere la performance.`,
    });
  }

  // Step 4: Monitoring
  let weightChangeTarget: string;
  if (bf === null) {
    weightChangeTarget = '0.5-0.7% del peso/settimana';
  } else if (isMale) {
    if (bf > 25) weightChangeTarget = '0.7-1.0% del peso/settimana';
    else if (bf > 20) weightChangeTarget = '0.5-0.7% del peso/settimana';
    else if (bf > 15) weightChangeTarget = '0.5% del peso/settimana';
    else if (bf >= 12) weightChangeTarget = '0.3-0.5% del peso/settimana';
    else weightChangeTarget = '0.2-0.3% del peso/settimana';
  } else {
    if (bf > 35) weightChangeTarget = '0.7-1.0% del peso/settimana';
    else if (bf > 30) weightChangeTarget = '0.5-0.7% del peso/settimana';
    else if (bf > 25) weightChangeTarget = '0.5% del peso/settimana';
    else if (bf >= 20) weightChangeTarget = '0.3-0.5% del peso/settimana';
    else weightChangeTarget = '0.2-0.3% del peso/settimana';
  }

  const monitoring: MonitoringInfo = {
    weight_change_target: weightChangeTarget,
    weight_change_direction: 'decrease',
    check_frequency: 'Media settimanale del peso',
    adjustment_rule: 'Se il peso non scende per 2+ settimane: prima verifica il tracking, poi aggiungi 1500-2000 passi/giorno, infine riduci di -100/-150 kcal',
  };

  // Step 5: Education
  let goalExplanation: string;
  switch (goalSubtype) {
    case 'conservative_deficit':
      goalExplanation = `Un deficit conservativo di ${Math.abs(actualDeficit)} kcal è studiato per preservare al massimo la massa muscolare. È indicato quando la percentuale di grasso è già relativamente bassa e la priorità è mantenere forza e performance.`;
      break;
    case 'moderate_deficit':
      goalExplanation = `Un deficit moderato di ${Math.abs(actualDeficit)} kcal è il punto ideale per la perdita di grasso con buona preservazione muscolare. È sostenibile a lungo termine e permette di mantenere buone prestazioni in palestra.`;
      break;
    case 'aggressive_deficit':
      goalExplanation = `Un deficit aggressivo di ${Math.abs(actualDeficit)} kcal è indicato quando c'è una quantità significativa di grasso da perdere. La perdita sarà più rapida, ma è importante monitorare attentamente la performance e la massa muscolare.`;
      break;
  }

  const education: EducationContent = {
    goal_explanation: goalExplanation,
    calorie_explanation: `Il tuo TDEE è di ${Math.round(tdee)} kcal. Con un deficit di ${actualDeficit} kcal, il tuo target è ${target} kcal/giorno.`,
    protein_explanation: `Le proteine sono il macro PIÙ IMPORTANTE in deficit. A 2.2 g/kg, preservano fino al 95%+ della massa muscolare, aumentano la sazietà e hanno un alto effetto termico (20-35% delle calorie proteiche viene bruciato nella digestione).`,
    carbs_explanation: `I carboidrati sono la variabile di aggiustamento in deficit. ${carbs_g}g vanno concentrati attorno all'allenamento per massimizzare la performance, che è ciò che preserva il muscolo.`,
    fat_explanation: `0.8 g/kg di grassi è il minimo per sostenere la produzione ormonale e l'assorbimento delle vitamine A, D, E, K. Non scendere sotto per periodi prolungati.`,
  };

  return {
    goal_subtype: goalSubtype,
    daily_calorie_target: target,
    calorie_surplus_deficit: actualDeficit,
    macro_protein_g: protein_g,
    macro_carbs_g: carbs_g,
    macro_fat_g: fat_g,
    protein_per_kg: proteinPerKg,
    fat_per_kg: fatPerKg,
    carbs_per_kg: carbsPerKg,
    warnings,
    monitoring,
    education,
  };
}

// -----------------------------------------------------------------------------
// PERFORMANCE classification
// -----------------------------------------------------------------------------

function classifyPerformance(input: ClassificationInput, tdee: number): ClassificationResult {
  const { weight_kg, sport_category } = input;
  const warnings: ClassificationWarning[] = [];

  const category = sport_category ?? 'strength';
  const goalSubtype: PerformanceSubtype = `performance_${category}` as PerformanceSubtype;

  let proteinPerKg: number;
  let fatPerKg: number;
  let carbsPerKg: number;
  let target: number;
  let surplusDeficit: number;

  switch (category) {
    case 'strength':
      proteinPerKg = 2.0;
      fatPerKg = 1.0;
      carbsPerKg = 4.0;
      target = Math.round(tdee + 150);
      surplusDeficit = 150;
      break;
    case 'endurance':
      proteinPerKg = 1.6;
      fatPerKg = 1.0;
      carbsPerKg = 7.0;
      target = Math.round(
        weight_kg * proteinPerKg * 4 +
        weight_kg * fatPerKg * 9 +
        weight_kg * carbsPerKg * 4
      );
      surplusDeficit = target - Math.round(tdee);
      break;
    case 'intermittent':
      proteinPerKg = 2.0;
      fatPerKg = 1.0;
      carbsPerKg = 6.0;
      target = Math.round(
        weight_kg * proteinPerKg * 4 +
        weight_kg * fatPerKg * 9 +
        weight_kg * carbsPerKg * 4
      );
      surplusDeficit = target - Math.round(tdee);
      break;
    case 'technical':
    default:
      proteinPerKg = 1.8;
      fatPerKg = 1.0;
      carbsPerKg = 5.0;
      target = Math.round(
        weight_kg * proteinPerKg * 4 +
        weight_kg * fatPerKg * 9 +
        weight_kg * carbsPerKg * 4
      );
      surplusDeficit = target - Math.round(tdee);
      break;
  }

  // For strength, compute carbs from residual; for others, use g/kg directly
  let protein_g: number;
  let fat_g: number;
  let carbs_g: number;

  if (category === 'strength') {
    const macros = computeMacros(target, weight_kg, proteinPerKg, fatPerKg);
    protein_g = macros.protein_g;
    fat_g = macros.fat_g;
    carbs_g = macros.carbs_g;
    carbsPerKg = round1(carbs_g / weight_kg);
  } else {
    protein_g = round1(weight_kg * proteinPerKg);
    fat_g = round1(weight_kg * fatPerKg);
    carbs_g = round1(weight_kg * carbsPerKg);
  }

  // Monitoring
  const monitoring: MonitoringInfo = {
    weight_change_target: 'Stabile (\u00b10.5 kg/settimana)',
    weight_change_direction: 'stable',
    check_frequency: 'Performance di allenamento + media peso settimanale',
    adjustment_rule: 'Se la performance cala per 2+ settimane: aumenta carboidrati di +50g/giorno. Se il peso cala non intenzionalmente: aumenta le calorie di +200 kcal.',
  };

  // Education
  let goalExplanation: string;
  let proteinExplanation: string;
  let carbsExplanation: string;

  switch (category) {
    case 'strength':
      goalExplanation = `Per gli sport di forza, la nutrizione supporta la produzione di energia esplosiva e il recupero. Un leggero surplus garantisce che i muscoli abbiano abbastanza substrato per adattarsi.`;
      proteinExplanation = `Per la forza, 2.0 g/kg supporta la sintesi proteica e il recupero muscolare tra le sessioni pesanti.`;
      carbsExplanation = `3-5 g/kg per la forza è sufficiente per ripristinare il glicogeno. I carboidrati sono importanti ma non dominanti come nell'endurance.`;
      break;
    case 'endurance':
      goalExplanation = `Per gli sport di resistenza, i carboidrati sono il carburante primario. Il tuo fabbisogno di carboidrati (${carbsPerKg} g/kg) è alto per sostenere il glicogeno muscolare e le prestazioni aerobiche.`;
      proteinExplanation = `Nell'endurance, 1.6 g/kg è sufficiente per il recupero. Il focus nutrizionale è sui carboidrati, non sulle proteine.`;
      carbsExplanation = `I carboidrati sono il macro CHIAVE nell'endurance. ${carbsPerKg} g/kg sostiene il glicogeno muscolare per sessioni lunghe. Meno di 5 g/kg compromette la performance.`;
      break;
    case 'intermittent':
      goalExplanation = `Gli sport intermittenti richiedono sia capacità aerobica che esplosività. I carboidrati alti (${carbsPerKg} g/kg) sostengono sia il glicogeno che il recupero tra sessioni ravvicinate.`;
      proteinExplanation = `Per gli sport intermittenti, 2.0 g/kg supporta il recupero muscolare e la sintesi proteica tra sessioni ad alta intensità.`;
      carbsExplanation = `Con ${carbsPerKg} g/kg di carboidrati, hai abbastanza substrato per sostenere sia lo sforzo esplosivo che il recupero rapido tipico degli sport intermittenti.`;
      break;
    case 'technical':
    default:
      goalExplanation = `Gli sport tecnico-coordinativi richiedono concentrazione e precisione. L'alimentazione deve essere nutriente e bilanciata, con attenzione alla densità dei micronutrienti.`;
      proteinExplanation = `Per gli sport tecnici, 1.8 g/kg è un buon compromesso che supporta il recupero senza eccessivo focus sulla massa muscolare.`;
      carbsExplanation = `${carbsPerKg} g/kg di carboidrati sostiene le funzioni cognitive e la concentrazione, fondamentali per gli sport tecnico-coordinativi.`;
      break;
  }

  const education: EducationContent = {
    goal_explanation: goalExplanation,
    calorie_explanation: `Il tuo target calorico è ${target} kcal, calcolato in base ai macro necessari per il tuo sport. In performance, le calorie NON vanno mai in deficit cronico.`,
    protein_explanation: proteinExplanation,
    carbs_explanation: carbsExplanation,
    fat_explanation: `1.0 g/kg di grassi garantisce una corretta produzione ormonale e un buon assorbimento dei micronutrienti.`,
  };

  return {
    goal_subtype: goalSubtype,
    daily_calorie_target: target,
    calorie_surplus_deficit: surplusDeficit,
    macro_protein_g: protein_g,
    macro_carbs_g: carbs_g,
    macro_fat_g: fat_g,
    protein_per_kg: proteinPerKg,
    fat_per_kg: fatPerKg,
    carbs_per_kg: carbsPerKg,
    warnings,
    monitoring,
    education,
  };
}

// -----------------------------------------------------------------------------
// MAINTAIN classification
// -----------------------------------------------------------------------------

function classifyMaintain(input: ClassificationInput, tdee: number): ClassificationResult {
  const { weight_kg } = input;
  const warnings: ClassificationWarning[] = [];

  const target = Math.round(tdee);
  const { protein_g, fat_g, carbs_g } = computeMacros(target, weight_kg, 2.0, 1.0);
  const carbsPerKg = round1(carbs_g / weight_kg);

  const monitoring: MonitoringInfo = {
    weight_change_target: 'Stabile (\u00b10.5 kg/settimana)',
    weight_change_direction: 'stable',
    check_frequency: 'Peso settimanale',
    adjustment_rule: 'Se il peso varia di \u00b11 kg in un mese: aggiusta di \u00b1100-150 kcal',
  };

  const education: EducationContent = {
    goal_explanation: `Il mantenimento è l'equilibrio tra entrate e uscite caloriche. Con ${target} kcal/giorno dovresti mantenere il peso stabile.`,
    calorie_explanation: `Il tuo TDEE è di ${Math.round(tdee)} kcal. Il tuo target è pari al TDEE: ${target} kcal/giorno. Nessun surplus o deficit applicato.`,
    protein_explanation: `2.0 g/kg di proteine mantengono la massa muscolare e supportano il recupero dall'allenamento, anche senza surplus calorico.`,
    carbs_explanation: `I carboidrati (${carbs_g}g, ${carbsPerKg} g/kg) alimentano l'attività fisica quotidiana e gli allenamenti, mantenendo buone prestazioni.`,
    fat_explanation: `1.0 g/kg di grassi sostiene la salute ormonale e l'assorbimento dei nutrienti essenziali.`,
  };

  return {
    goal_subtype: 'maintain',
    daily_calorie_target: target,
    calorie_surplus_deficit: 0,
    macro_protein_g: protein_g,
    macro_carbs_g: carbs_g,
    macro_fat_g: fat_g,
    protein_per_kg: 2.0,
    fat_per_kg: 1.0,
    carbs_per_kg: carbsPerKg,
    warnings,
    monitoring,
    education,
  };
}

// -----------------------------------------------------------------------------
// HEALTHY classification
// -----------------------------------------------------------------------------

function classifyHealthy(input: ClassificationInput, tdee: number): ClassificationResult {
  const { weight_kg } = input;
  const warnings: ClassificationWarning[] = [];

  const target = Math.round(tdee);
  const { protein_g, fat_g, carbs_g } = computeMacros(target, weight_kg, 2.0, 1.0);
  const carbsPerKg = round1(carbs_g / weight_kg);

  const monitoring: MonitoringInfo = {
    weight_change_target: 'Stabile (\u00b10.5 kg/settimana)',
    weight_change_direction: 'stable',
    check_frequency: 'Peso settimanale',
    adjustment_rule: 'Se il peso varia di \u00b11 kg in un mese: aggiusta di \u00b1100-150 kcal',
  };

  const education: EducationContent = {
    goal_explanation: `L'obiettivo 'mangiare più sano' si concentra sulla qualità nutrizionale dei cibi. I macro targets sono impostati per un equilibrio ottimale, ma la priorità è scegliere alimenti densi di nutrienti: verdure, frutta, proteine magre, cereali integrali, grassi sani.`,
    calorie_explanation: `Il tuo target calorico è ${target} kcal/giorno, basato sul tuo TDEE di ${Math.round(tdee)} kcal. L'obiettivo non è creare surplus o deficit, ma nutrirsi in modo equilibrato.`,
    protein_explanation: `2.0 g/kg di proteine garantiscono un buon apporto di aminoacidi essenziali. Privilegia fonti di qualità: pesce, legumi, uova, carni magre, latticini.`,
    carbs_explanation: `${carbs_g}g di carboidrati (${carbsPerKg} g/kg) provenienti da cereali integrali, frutta e verdura forniscono energia sostenuta e micronutrienti essenziali.`,
    fat_explanation: `1.0 g/kg di grassi da fonti sane (olio extravergine, frutta secca, pesce azzurro) supporta la salute cardiovascolare e l'assorbimento delle vitamine liposolubili.`,
  };

  return {
    goal_subtype: 'healthy',
    daily_calorie_target: target,
    calorie_surplus_deficit: 0,
    macro_protein_g: protein_g,
    macro_carbs_g: carbs_g,
    macro_fat_g: fat_g,
    protein_per_kg: 2.0,
    fat_per_kg: 1.0,
    carbs_per_kg: carbsPerKg,
    warnings,
    monitoring,
    education,
  };
}

// -----------------------------------------------------------------------------
// Main entry point: classifyGoal
// -----------------------------------------------------------------------------

export function classifyGoal(input: ClassificationInput, tdee: number): ClassificationResult {
  const category = getGoalCategory(input.goal);

  switch (category) {
    case 'bulk':
      return classifyBulk(input, tdee);
    case 'cut':
      return classifyCut(input, tdee);
    case 'performance':
      return classifyPerformance(input, tdee);
    case 'maintain':
      return classifyMaintain(input, tdee);
    case 'healthy':
      return classifyHealthy(input, tdee);
  }
}
