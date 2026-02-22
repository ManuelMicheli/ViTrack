# Guida Operativa per Agente AI: Gestione Obiettivi Nutrizionali

## Scopo di questo documento

Questo documento è un manuale operativo destinato a un agente AI che deve creare piani nutrizionali personalizzati. Contiene regole precise, alberi decisionali, parametri numerici e protocolli specifici per ogni tipo di obiettivo. L'agente deve seguire queste istruzioni come riferimento primario durante la generazione di qualsiasi piano alimentare.

---

## Regole Universali (valide per TUTTI gli obiettivi)

Prima di procedere con qualsiasi obiettivo, l'agente DEVE:

1. **Raccogliere TUTTI i dati obbligatori** prima di generare qualsiasi piano:
   - Sesso biologico
   - Età (anni)
   - Peso corporeo attuale (kg)
   - Altezza (cm)
   - Livello di attività quotidiana NON sportiva (lavoro, passi, stile di vita)
   - Tipo, frequenza, durata e intensità dell'allenamento
   - Eventuali intolleranze, allergie o restrizioni alimentari
   - Obiettivo dichiarato dall'utente
   - Timeline desiderata (se presente)

2. **Calcolare sempre il BMR con Mifflin-St Jeor**:
   - Uomini: `BMR = (10 × peso_kg) + (6.25 × altezza_cm) - (5 × età) + 5`
   - Donne: `BMR = (10 × peso_kg) + (6.25 × altezza_cm) - (5 × età) - 161`

3. **Assegnare il fattore di attività con criterio conservativo**:
   - L'agente deve valutare il fattore basandosi PRINCIPALMENTE sull'attività NON sportiva (lavoro, passi quotidiani, stile di vita) e NON sulla frequenza di allenamento isolata.
   - Nel dubbio tra due fattori, scegliere SEMPRE quello più basso.
   - Un impiegato che si allena 4 volte a settimana ma fa 4.000 passi/giorno è un **1.375**, NON un 1.55.

4. **Comunicare sempre che i numeri sono stime iniziali** e che andranno aggiustati dopo 2-3 settimane di monitoraggio del peso reale.

---

## OBIETTIVO 1: MASSA MUSCOLARE (Bulk)

### 1.1 — Classificazione del tipo di bulk

L'agente deve identificare quale tipo di bulk è appropriato. La scelta NON è lasciata all'utente ma determinata dall'agente in base al profilo:

| Tipo | Surplus | Chi è adatto | Chi NON è adatto |
|---|---|---|---|
| **Lean Bulk** | +150 / +300 kcal | Intermedi/avanzati, chi ha BF% < 18% (uomini) o < 28% (donne), chi vuole minimizzare il grasso acquisito | — |
| **Bulk moderato** | +300 / +500 kcal | Principianti nei primi 1-2 anni di allenamento serio, hardgainer, adolescenti in crescita | Chi ha BF% > 20% (uomini) o > 30% (donne) |
| **Bulk aggressivo** | +500 / +750 kcal | SOLO atleti di forza avanzati in preparazione, SOLO su periodi brevi (4-8 settimane), SOLO con supervisione | Tutti gli altri |

**Regola critica**: se l'utente ha una percentuale di grasso corporeo stimata superiore al 20% (uomini) o 30% (donne), l'agente deve SCONSIGLIARE il bulk e proporre prima una fase di dimagrimento o ricomposizione corporea. L'agente deve spiegare che fare massa partendo da una BF% alta porta a: peggior partizionamento calorico (più grasso, meno muscolo), resistenza insulinica, peggior profilo ormonale per l'anabolismo.

### 1.2 — Impostazione dei macronutrienti per la massa

#### Proteine

```
Range: 1.6 — 2.2 g/kg di peso corporeo
Target standard: 2.0 g/kg
```

**Logica**: in surplus calorico, il fabbisogno proteico è INFERIORE rispetto al deficit perché il surplus stesso è anti-catabolico. Non serve spingere le proteine oltre 2.2 g/kg — è uno spreco calorico che toglie spazio ai carboidrati, che sono più funzionali alla performance e alla crescita in questa fase.

L'agente NON deve mai impostare proteine > 2.5 g/kg in bulk, nemmeno se l'utente lo richiede. In tal caso, spiegare il razionale.

#### Grassi

```
Range: 0.8 — 1.2 g/kg di peso corporeo
Target standard: 1.0 g/kg
Minimo assoluto: 0.7 g/kg
```

**Logica**: i grassi in bulk devono essere sufficienti a sostenere la produzione ormonale (testosterone, IGF-1), cruciale per la crescita muscolare. Non eccedere perché i grassi sono caloricamente densi e tolgono spazio ai carboidrati.

#### Carboidrati

```
Calcolo: (Calorie totali - kcal proteine - kcal grassi) ÷ 4
Risultato tipico: 4 — 7 g/kg di peso corporeo
```

**Logica**: i carboidrati sono il MACRO PRIORITARIO in fase di massa. Devono essere il più alti possibile. I carboidrati alimentano gli allenamenti ad alta intensità (glicogeno muscolare), stimolano l'insulina (ormone anabolico), favoriscono il recupero e riducono il cortisolo post-allenamento. Se i carboidrati risultano < 3 g/kg, l'agente deve rivalutare il piano.

### 1.3 — Distribuzione temporale per la massa

L'agente deve fornire indicazioni sulla distribuzione dei pasti attorno all'allenamento:

**Pre-workout (1.5-3 ore prima)**:
- Pasto misto con carboidrati complessi (riso, avena, patate) + proteine + grassi moderati
- Obiettivo: 30-50g carboidrati, 25-40g proteine
- Evitare pasti troppo ricchi di grassi o fibre che rallentano la digestione

**Intra-workout (durante — opzionale, per sessioni > 75 minuti)**:
- 20-40g carboidrati rapidi (maltodestrine, destrosio, bevanda sportiva)
- Utile solo per sessioni lunghe o ad altissimo volume

**Post-workout (entro 2 ore)**:
- Pasto con carboidrati ad alto IG + proteine ad assorbimento rapido
- Obiettivo: 40-80g carboidrati, 30-50g proteine
- Grassi bassi in questo pasto (rallentano l'assorbimento)

**Resto della giornata**:
- Distribuire proteine in modo omogeneo: 3-5 pasti da 25-50g di proteine ciascuno
- Distribuire carboidrati in base alla vicinanza all'allenamento (più vicino = più carboidrati)

### 1.4 — Monitoraggio e aggiustamenti in massa

L'agente deve istruire l'utente su come monitorare e quando aggiustare:

**Cosa monitorare**:
- Peso corporeo: media settimanale pesandosi ogni mattina a digiuno
- Misure corporee: vita, petto, braccia, cosce (ogni 2-4 settimane)
- Performance in palestra: forza e volume di allenamento
- Foto: ogni 2-4 settimane, stesse condizioni di luce e orario

**Velocità di aumento peso target**:

| Livello | Aumento mensile target | Razionale |
|---|---|---|
| Principiante (< 1 anno) | 1.0 — 1.5% del peso corporeo/mese | Alto potenziale di crescita muscolare (~0.7-1.0 kg muscolo/mese possibili) |
| Intermedio (1-3 anni) | 0.5 — 1.0% del peso corporeo/mese | Crescita muscolare rallenta (~0.3-0.5 kg muscolo/mese) |
| Avanzato (3+ anni) | 0.25 — 0.5% del peso corporeo/mese | Crescita muscolare molto lenta (~0.1-0.25 kg muscolo/mese) |

**Albero decisionale per aggiustamenti**:

```
SE media settimanale del peso NON aumenta per 2+ settimane consecutive:
  → Aggiungere +100/150 kcal (preferibilmente da carboidrati)

SE media settimanale del peso aumenta troppo velocemente:
  → Ridurre di -100/150 kcal (preferibilmente da carboidrati)

SE la vita aumenta significativamente (>2 cm/mese) 
   MENTRE il peso aumenta in linea:
  → L'aumento è prevalentemente grasso
  → Ridurre surplus di 100-200 kcal
  → Rivalutare il tipo di bulk

SE la forza in palestra NON progredisce nonostante surplus e sonno adeguati:
  → Verificare il programma di allenamento (non un problema nutrizionale)
  → Verificare la qualità del sonno
  → Verificare lo stress
```

### 1.5 — Durata e transizione

- **Durata consigliata del bulk**: 3-6 mesi (o fino a raggiungere ~18% BF uomini / ~28% BF donne)
- **Mai fare bulk indefiniti**: l'accumulo progressivo di grasso peggiora il partizionamento calorico nel tempo
- **Transizione bulk → cut**: inserire 2-4 settimane di mantenimento calorico tra le due fasi per stabilizzare il metabolismo, gli ormoni e il set point del peso

---

## OBIETTIVO 2: DIMAGRIMENTO (Cut)

### 2.1 — Classificazione del tipo di deficit

L'agente deve determinare l'entità del deficit basandosi sulla BF% stimata, sulla massa muscolare dell'utente e sulla timeline:

| Tipo | Deficit | Chi è adatto | Durata max consigliata |
|---|---|---|---|
| **Deficit conservativo** | -250 / -350 kcal | Persone già relativamente magre (uomini <15% BF, donne <25% BF), chi ha molta massa muscolare da preservare, atleti in preparazione | 12-20 settimane |
| **Deficit moderato** | -350 / -550 kcal | La maggior parte delle persone, chi ha 5-15 kg da perdere | 8-16 settimane |
| **Deficit aggressivo** | -550 / -750 kcal | Persone con significativo sovrappeso (uomini >25% BF, donne >35% BF), SOLO nelle fasi iniziali | 4-8 settimane, poi ridurre il deficit |
| **PSMF / Crash diet** | > -750 kcal | **L'agente NON deve MAI proporre questo approccio.** Se l'utente lo chiede, l'agente deve spiegare i rischi (perdita muscolare massiva, crash metabolico, disturbi ormonali, binge eating, effetto yo-yo) e proporre un deficit aggressivo come alternativa massima. |

**Regola critica del pavimento calorico**: l'agente non deve MAI impostare calorie totali inferiori a:
- **Uomini**: 1400 kcal/giorno
- **Donne**: 1200 kcal/giorno

Se il calcolo porta sotto queste soglie, l'agente deve aumentare il target calorico fino al pavimento e compensare con un aumento dell'attività fisica (più passi, cardio leggero).

### 2.2 — Impostazione dei macronutrienti per il dimagrimento

#### Proteine — IL MACRO PIÙ IMPORTANTE IN CUT

```
Range: 2.0 — 2.7 g/kg di peso corporeo
Target standard: 2.2 g/kg

Per persone con BF% > 30%: calcolare su peso ideale stimato o massa magra stimata
Formula peso ideale rapida (uomini): altezza_cm - 100
Formula peso ideale rapida (donne): altezza_cm - 110
```

**Logica**: le proteine in deficit sono NON NEGOZIABILI ai livelli alti. La ricerca è chiara:
- Proteine alte in deficit preservano fino al 95%+ della massa muscolare
- Proteine basse in deficit causano perdita muscolare significativa, che riduce il BMR, peggiora la composizione corporea e rende il mantenimento futuro più difficile
- Le proteine sono il macro più saziante — cruciale per l'aderenza in deficit
- L'alto TEF delle proteine (20-35%) crea un "vantaggio metabolico" effettivo

L'agente deve assegnare le proteine PRIMA di tutto il resto e non scendere MAI sotto 1.8 g/kg in deficit.

#### Grassi

```
Range: 0.6 — 1.0 g/kg di peso corporeo
Target standard: 0.8 g/kg
Minimo assoluto: 0.5 g/kg (solo per brevi periodi, max 4-6 settimane)
```

**Logica**: in deficit è tentante tagliare i grassi drasticamente perché sono caloricamente densi (9 kcal/g). Ma grassi troppo bassi per troppo tempo causano:
- Crollo di testosterone (uomini) e irregolarità mestruali (donne)
- Pelle secca, capelli fragili
- Peggioramento dell'umore e della funzione cognitiva
- Malassorbimento di vitamine A, D, E, K

L'agente deve monitorare che i grassi non scendano sotto il minimo assoluto. Se le calorie totali sono molto basse e non c'è spazio, è meglio ridurre i carboidrati piuttosto che i grassi.

#### Carboidrati

```
Calcolo: (Calorie totali - kcal proteine - kcal grassi) ÷ 4
Risultato tipico in cut: 2 — 4 g/kg di peso corporeo
```

**Logica**: i carboidrati sono la "variabile di aggiustamento" in cut. Vengono calcolati per ultimi e sono i primi ad essere ridotti quando serve aumentare il deficit. Tuttavia, l'agente deve sapere che:
- Carboidrati troppo bassi (< 100g/giorno per periodi prolungati) peggiorano le prestazioni, l'umore, la funzione tiroidea e l'aderenza
- I carboidrati vanno concentrati attorno all'allenamento per massimizzare la performance (che è ciò che preserva la massa muscolare)
- Se i carboidrati risultano < 100g/giorno, l'agente deve considerare di ridurre leggermente i grassi o accettare un deficit meno aggressivo

### 2.3 — Gestione della distribuzione in cut

**Regola prioritaria**: i carboidrati disponibili vanno allocati PRIORITARIAMENTE attorno all'allenamento.

```
Distribuzione carboidrati consigliata:
- Pre-workout:  30-40% dei carboidrati giornalieri
- Post-workout: 30-40% dei carboidrati giornalieri
- Resto:        20-40% dei carboidrati giornalieri

Se i carboidrati totali sono molto bassi (<150g):
- Pre-workout:  40-50% 
- Post-workout: 40-50%
- Resto:        minimo indispensabile (verdure)
```

**Proteine**: distribuite uniformemente in 3-5 pasti da minimo 25g ciascuno per massimizzare la sintesi proteica muscolare durante l'arco della giornata.

**Pasto serale**: l'agente deve sfatare il mito che "mangiare la sera fa ingrassare". In cut, un pasto serale soddisfacente (proteine + verdure + eventuale quota carboidrati) migliora il sonno e l'aderenza. La caseina o le proteine a lento rilascio prima di dormire possono avere benefici sul recupero e sulla sazietà notturna.

### 2.4 — Strategie anti-plateau in cut

L'agente deve conoscere e proporre queste strategie quando il progresso si blocca:

#### Refeed Day

```
Quando introdurlo: dopo 5-10+ giorni consecutivi di deficit
Frequenza: 1 volta ogni 7-14 giorni (più frequente se più magri)
Come impostarlo:
  - Calorie: portare al TDEE di mantenimento (o leggermente sopra)
  - Proteine: mantenere invariate
  - Grassi: mantenere invariati o ridurre leggermente
  - Carboidrati: AUMENTARE significativamente (tutti i carboidrati extra)
Razionale: il refeed ripristina la leptina, ripristina il glicogeno muscolare,
migliora la funzione tiroidea, dà una pausa psicologica dal deficit
```

#### Diet Break

```
Quando introdurla: dopo 6-12 settimane consecutive di deficit
Durata: 1-2 settimane a calorie di mantenimento
Come impostarla:
  - Calorie: TDEE di mantenimento (ricalcolato sul peso attuale)
  - Proteine: mantenere a ~2.0 g/kg
  - Grassi e carboidrati: distribuire liberamente le calorie extra
Razionale: la diet break ripristina gli adattamenti metabolici al deficit,
normalizza gli ormoni (leptina, grelina, cortisolo, ormoni tiroidei),
riduce il rischio di binge eating e migliora la sostenibilità a lungo termine
```

#### Reverse Dieting (post-cut)

```
Quando: SEMPRE dopo la fine di un cut
Durata: 4-8 settimane
Procedura:
  - Settimana 1-2: aumentare di +100/150 kcal (da carboidrati)
  - Settimana 3-4: aumentare di ulteriori +100/150 kcal
  - Continuare fino a raggiungere il TDEE di mantenimento stimato
  - Il peso aumenterà di 1-3 kg: è NORMALE (glicogeno, acqua, contenuto intestinale)
Razionale: il reverse evita l'effetto rebound, permette al metabolismo 
di risalire gradualmente e stabilizza il nuovo peso
```

**Regola critica**: l'agente deve SEMPRE includere un piano di uscita dal cut. Non esiste cut senza reverse o transizione al mantenimento. Un cut senza piano di uscita è un fallimento programmato.

### 2.5 — Monitoraggio e aggiustamenti in cut

**Velocità di perdita peso target**:

| BF% stimata | Perdita settimanale target | Note |
|---|---|---|
| > 30% (uomini) / > 40% (donne) | 0.7 — 1.0% del peso/settimana | Possono tollerare deficit aggressivi inizialmente |
| 20-30% (uomini) / 30-40% (donne) | 0.5 — 0.7% del peso/settimana | Range standard |
| 15-20% (uomini) / 25-30% (donne) | 0.5% del peso/settimana | Rallentare per preservare muscolo |
| 12-15% (uomini) / 22-25% (donne) | 0.3 — 0.5% del peso/settimana | Deficit conservativo obbligatorio |
| < 12% (uomini) / < 22% (donne) | 0.2 — 0.3% del peso/settimana | Estrema cautela, proteine altissime |

**Albero decisionale per aggiustamenti**:

```
SE il peso medio settimanale NON diminuisce per 2+ settimane consecutive
   E l'utente è stato aderente al piano:
  → PRIMA: verificare che l'utente stia tracciando accuratamente (pesando il cibo)
  → POI: aumentare l'attività (aggiungere 1500-2000 passi/giorno)
  → INFINE: ridurre calorie di -100/150 kcal (prima da carboidrati, poi da grassi)
  → MAI: ridurre le proteine

SE il peso scende troppo velocemente (> velocità target per 2+ settimane):
  → Aggiungere +100/150 kcal (prima a carboidrati)
  → Rischio: perdita muscolare, adattamento metabolico eccessivo

SE la forza in palestra crolla significativamente (>10% su più esercizi):
  → Probabilmente il deficit è troppo aggressivo
  → Aggiungere +100/200 kcal (da carboidrati, pre-workout)
  → Considerare un refeed o una diet break

SE si verificano sintomi di deficit eccessivo:
  (fame costante insopportabile, insonnia, irritabilità marcata,
   perdita di libido, estremità fredde, capelli che cadono)
  → Diet break immediata di 1-2 settimane
  → Ricalcolare il deficit a un livello più sostenibile
  → Verificare il pavimento calorico

SE l'utente riporta episodi di binge eating:
  → Aumentare le calorie di 200-300 kcal
  → Aumentare la frequenza dei refeed
  → Verificare che proteine e fibre siano adeguate
  → Il binge è SEMPRE un segnale che il deficit è insostenibile
```

### 2.6 — Regole speciali per il cut

1. **Mai tagliare le proteine per ridurre le calorie.** Le proteine sono l'ultima cosa da toccare. Sempre.
2. **Priorità dei tagli**: prima carboidrati (lontani dall'allenamento) → poi grassi (fino al minimo) → poi carboidrati (vicini all'allenamento). Mai proteine.
3. **Il cardio è uno STRUMENTO, non la base del deficit.** Il deficit deve venire primariamente dall'alimentazione. Il cardio serve per creare margine calorico senza ridurre troppo il cibo. Il LISS (camminata, cyclette blanda) è preferibile al HIIT in cut perché non interferisce con il recupero dall'allenamento con i pesi.
4. **L'allenamento con i pesi NON va ridotto in cut.** Mantenere intensità (carichi) e ridurre semmai il volume (serie) è la strategia corretta. Il segnale meccanico sui muscoli è ciò che dice al corpo "questa massa magra serve, non degradarla".
5. **Il sonno diventa ancora più critico in cut.** La deprivazione del sonno aumenta la grelina (fame), riduce la leptina (sazietà), aumenta il cortisolo (catabolismo) e peggiora il partizionamento calorico. L'agente deve ricordarlo.

---

## OBIETTIVO 3: MIGLIORAMENTO DELLA PERFORMANCE ATLETICA

### 3.1 — Principi fondamentali

L'approccio nutrizionale per la performance è **radicalmente diverso** da quello per l'estetica. Le priorità cambiano completamente:

```
Priorità in ESTETICA (massa/cut):
1. Calorie totali
2. Macronutrienti
3. Distribuzione temporale
4. Qualità degli alimenti
5. Supplementi

Priorità in PERFORMANCE:
1. Calorie totali (sufficienti, MAI in deficit cronico)
2. Carboidrati (la variabile chiave)
3. Timing nutrizionale (attorno a sessioni e gare)
4. Idratazione ed elettroliti
5. Proteine per il recupero
6. Qualità e densità nutrizionale
7. Supplementi specifici per performance
```

La differenza chiave: nella performance, i carboidrati NON sono la "variabile residua" — sono il **macro primario** attorno a cui si costruisce tutto il piano.

### 3.2 — Classificazione per tipo di sport

L'agente deve adattare il piano in base alla categoria sportiva dell'utente. NON esiste un piano "performance" generico.

#### Categoria A — Sport di forza e potenza
*Powerlifting, Olympic weightlifting, strongman, sprint (<60 sec), salto, lancio*

```
Sistema energetico primario: ATP-CP / glicolitico anaerobico
Fabbisogno calorico: TDEE + 0/300 kcal (mantenimento o leggero surplus)
Proteine: 1.8 — 2.4 g/kg
Grassi: 0.8 — 1.2 g/kg
Carboidrati: 3 — 5 g/kg
Pasti giornalieri: 3-5

Note specifiche:
- La creatina (3-5g/giorno) è il supplemento più supportato dalla letteratura
- Il timing dei carboidrati è meno critico che negli sport di endurance
- Il peso corporeo e la categoria di peso sono spesso vincoli importanti
- Se l'atleta deve stare in una categoria di peso: gestire con cut controllato
  nelle 8-12 settimane precedenti la gara, MAI water cut estremi senza supervisione medica
```

#### Categoria B — Sport di resistenza (endurance)
*Corsa (> 5km), ciclismo, nuoto (distanza), triathlon, sci di fondo, canottaggio*

```
Sistema energetico primario: aerobico (ossidativo)
Fabbisogno calorico: TDEE di mantenimento (spesso molto alto, 3000-5000+ kcal)
Proteine: 1.4 — 1.8 g/kg
Grassi: 0.8 — 1.2 g/kg  
Carboidrati: 5 — 12 g/kg (il range più alto di tutti gli sport)
Pasti giornalieri: 4-6+ (può essere necessario mangiare molto frequentemente)

Tabella carboidrati per volume di allenamento:
┌──────────────────────────────────────────────────────────┐
│  Volume giornaliero         │  Carboidrati g/kg          │
├──────────────────────────────────────────────────────────┤
│  Leggero (<1h/giorno)      │  5 — 6 g/kg                │
│  Moderato (1-2h/giorno)    │  6 — 8 g/kg                │
│  Alto (2-3h/giorno)        │  8 — 10 g/kg               │
│  Molto alto (3-5h/giorno)  │  10 — 12 g/kg              │
└──────────────────────────────────────────────────────────┘

Note specifiche:
- Il deficit calorico CRONICO è il nemico #1 della performance di endurance
- RED-S (Relative Energy Deficiency in Sport) è un rischio concreto:
  sintomi includono calo di performance, amenorrea, fratture da stress,
  immunodepressione, depressione. L'agente deve monitorare i segnali.
- La periodizzazione dei carboidrati (alta nei giorni di allenamento lungo,
  moderata nei giorni di recupero) è una strategia avanzata efficace
- L'idratazione è CRITICA: perdite di >2% del peso corporeo in sudore
  riducono la performance del 10-20%
```

#### Categoria C — Sport intermittenti ad alta intensità
*Calcio, basket, rugby, hockey, tennis, MMA, CrossFit, sport di combattimento*

```
Sistema energetico: misto (aerobico + anaerobico, alternati)
Fabbisogno calorico: TDEE (tipicamente 2800-4500 kcal)
Proteine: 1.8 — 2.2 g/kg
Grassi: 0.8 — 1.2 g/kg
Carboidrati: 5 — 8 g/kg
Pasti giornalieri: 4-5

Note specifiche:
- Questi sport richiedono sia capacità aerobica che esplosività
- I carboidrati devono sostenere sia il glicogeno muscolare che la capacità di recupero
  tra sessioni di allenamento ravvicinate
- Per sport con categorie di peso (MMA, boxe, lotta):
  il periodo di cut pre-gara va gestito con estrema attenzione
  → l'agente deve proporre timeline di 8-12+ settimane, mai crash diet
  → mantenere carboidrati il più alti possibile fino alla settimana della gara
  → la manipolazione dell'acqua nei giorni pre-pesata è un ambito medico,
    l'agente non deve fornire protocolli di water cut
```

#### Categoria D — Sport tecnico-coordinativi
*Ginnastica, arrampicata, pattinaggio artistico, tuffi, danza sportiva*

```
Sistema energetico: misto con componente tecnica dominante
Fabbisogno calorico: TDEE (attenzione: spesso sottostimato per la componente tecnica)
Proteine: 1.6 — 2.0 g/kg
Grassi: 0.8 — 1.2 g/kg
Carboidrati: 4 — 7 g/kg
Pasti giornalieri: 4-5

Note specifiche:
- Questi sport hanno spesso una forte pressione sul peso corporeo e sull'estetica
- L'agente deve essere PARTICOLARMENTE attento a segnali di disturbi alimentari
- MAI proporre deficit aggressivi. La priorità è la salute e la performance tecnica.
- Il rapporto peso/potenza è importante ma deve essere ottimizzato 
  attraverso la costruzione di forza, NON la restrizione alimentare estrema
- La densità nutrizionale è cruciale: con calorie relativamente contenute,
  ogni pasto deve essere ricco di micronutrienti
```

### 3.3 — Timing nutrizionale per la performance

Il timing è MOLTO più importante per la performance che per l'estetica. L'agente deve fornire protocolli specifici.

#### Pre-allenamento / Pre-gara

```
3-4 ore prima (pasto completo):
  - 1-2 g/kg carboidrati complessi (riso, pasta, avena, patate)
  - 0.3-0.5 g/kg proteine magre
  - Grassi moderati/bassi
  - Fibre moderate (evitare eccessi per prevenire disturbi GI)
  - Buona idratazione (400-600ml acqua)

1-2 ore prima (snack, se necessario):
  - 0.5-1 g/kg carboidrati facilmente digeribili (banana, pane bianco, marmellata)
  - Pochi grassi e fibre
  - 200-300ml acqua

30-60 minuti prima (opzionale, solo se necessario):
  - 20-30g carboidrati rapidi (gel, bevanda sportiva, miele)
  - Solo se la sessione sarà lunga o molto intensa
```

#### Durante l'attività

```
Sessioni < 60 minuti:
  - Solo acqua, nessuna necessità di nutrizione intra-workout

Sessioni 60-90 minuti:
  - 30-60g/ora di carboidrati rapidi (gel, bevanda sportiva)
  - 400-800ml/ora di fluidi (dipende dalla sudorazione)

Sessioni > 90 minuti:
  - 60-90g/ora di carboidrati (mix glucosio:fruttosio 2:1 per massimizzare l'assorbimento)
  - 400-800ml/ora di fluidi con elettroliti (sodio 500-1000mg/L)
  - Questo va ALLENATO in allenamento, mai testato per la prima volta in gara
```

#### Post-allenamento / Post-gara

```
Entro 30-60 minuti:
  - 1.0-1.5 g/kg carboidrati ad alto IG (per ripristinare il glicogeno)
  - 0.3-0.5 g/kg proteine (whey, latte, pollo)
  - Sodio e fluidi per reidratazione (1.5L per ogni kg perso in sudore)

Entro 2-4 ore:
  - Pasto completo con carboidrati, proteine, grassi, micronutrienti
  - Se c'è un'altra sessione entro 8 ore: PRIORITÀ MASSIMA alla reidratazione
    e al ripristino del glicogeno (carboidrati alti, ogni 2 ore)
```

### 3.4 — Periodizzazione nutrizionale per la performance

L'agente deve adattare il piano in base alla fase della stagione/preparazione:

```
FASE: Pre-stagione / Base building
Obiettivo: costruire la base aerobica e la forza
Calorie: mantenimento o leggero surplus
Carboidrati: moderati-alti
Note: è l'unico periodo in cui è accettabile un leggero deficit 
      per ottimizzare la composizione corporea (se necessario)

FASE: Pre-competitiva / Build
Obiettivo: intensificare l'allenamento specifico
Calorie: mantenimento o leggero surplus
Carboidrati: alti
Note: iniziare a praticare le strategie nutrizionali di gara in allenamento

FASE: Competitiva / Race season
Obiettivo: performance massima
Calorie: mantenimento, MAI in deficit
Carboidrati: massimi
Note: nessun esperimento nutrizionale. Solo strategie testate in allenamento.
      Carb loading pre-gara se applicabile (36-48h, 8-12 g/kg/giorno carboidrati)

FASE: Off-season / Recupero
Obiettivo: rigenerazione fisica e mentale
Calorie: mantenimento
Carboidrati: moderati (ridotti rispetto alla stagione per il minor volume)
Note: momento per affrontare eventuali carenze nutrizionali,
      migliorare la composizione corporea se necessario,
      sperimentare nuovi alimenti e strategie
```

### 3.5 — Idratazione ed elettroliti

L'agente deve SEMPRE includere indicazioni sull'idratazione per gli obiettivi di performance:

```
Idratazione basale giornaliera:
  - 35-45 ml per kg di peso corporeo (es. 80kg → 2.8-3.6L/giorno)
  - Aumentare in giornate calde o ad alta quota

Prima dell'attività:
  - 400-600ml nelle 2-3 ore precedenti
  - 200-300ml nei 15-30 minuti precedenti

Durante l'attività:
  - 400-800ml/ora (personalizzare in base al tasso di sudorazione)
  - Test pratico: pesarsi prima e dopo l'allenamento. 
    Ogni kg perso = ~1L di fluidi da reintegrare.
  - Per attività > 60 min: aggiungere elettroliti (sodio 500-1000mg/L)

Dopo l'attività:
  - 1.25-1.5L per ogni kg di peso perso durante l'attività
  - Includere sodio per favorire la ritenzione idrica
  - Il colore delle urine è un indicatore pratico: giallo chiaro/paglierino = ok

Elettroliti chiave:
  - Sodio: il più importante, perso in grandi quantità col sudore (200-1500mg/L)
  - Potassio: banane, patate, avocado, spinaci
  - Magnesio: 300-400mg/giorno, integrare se necessario (citrato o bisglicinato)
  - Calcio: latticini, verdure a foglia verde
```

### 3.6 — Supplementi evidence-based per la performance

L'agente può suggerire SOLO supplementi con solida evidenza scientifica:

```
TIER 1 — Forte evidenza (l'agente può raccomandare attivamente):

Creatina monoidrato:
  - Dose: 3-5 g/giorno, ogni giorno (loading non necessario ma possibile: 20g/giorno x 5 giorni)
  - Benefici: +5-10% forza, potenza, capacità di lavoro ad alta intensità
  - Sicuro per uso cronico. Il più studiato in assoluto.
  - Nota: causa ritenzione idrica intracellulare (+1-2kg), non è grasso

Caffeina:
  - Dose: 3-6 mg/kg, 30-60 minuti prima dell'attività
  - Benefici: migliora la resistenza, la potenza, la concentrazione, riduce la percezione della fatica
  - Nota: sviluppa tolleranza. Ciclizzare o usare strategicamente.
  - Non consigliare a chi è sensibile, ha problemi cardiaci o ansia

Beta-alanina:
  - Dose: 3.2-6.4 g/giorno (divisi in 2+ dosi per ridurre il formicolio)
  - Benefici: migliora la capacità di buffer dell'acido lattico, utile per sforzi di 1-10 minuti
  - Effetto dopo 4+ settimane di assunzione costante

TIER 2 — Buona evidenza (l'agente può menzionare se pertinente):

Nitrati (succo di barbabietola):
  - Dose: 300-600mg nitrati (~500ml succo), 2-3 ore prima
  - Benefici: migliora l'efficienza cardiovascolare, utile in endurance

Bicarbonato di sodio:
  - Dose: 0.2-0.3 g/kg, 60-90 minuti prima (attenzione: causa spesso disturbi GI)
  - Benefici: buffer extracellulare, utile per sforzi intensi di 1-7 minuti

TIER 3 — L'agente NON deve raccomandare:
Qualsiasi altro supplemento (BCAAs, glutammina, CLA, HMB, tribulus, la maggior parte
dei pre-workout commerciali, testosterone booster, ecc.) non ha evidenza sufficiente
per giustificare la spesa o ha efficacia trascurabile per chi ha già una buona alimentazione.
L'agente deve comunicare che una buona alimentazione rende questi supplementi inutili.
```

### 3.7 — Monitoraggio della performance

L'agente deve guidare l'utente a monitorare indicatori specifici per la performance, DIVERSI da quelli per l'estetica:

```
Indicatori primari:
  - Output di allenamento: watt (ciclismo), pace (corsa), carichi (forza), tempi
  - RPE (Rate of Perceived Exertion) durante le sessioni
  - Capacità di completare le sessioni pianificate
  - Tempi di recupero tra le sessioni

Indicatori secondari:
  - Qualità del sonno (ore, risvegli notturni, sensazione al risveglio)
  - Umore e motivazione
  - HRV (Heart Rate Variability) se l'utente ha un tracker
  - Frequenza cardiaca a riposo (aumento = segnale di sovrallenamento/sotto-recupero)

Segnali di allarme (richiedono intervento immediato):
  - Performance in calo costante per 2+ settimane nonostante riposo adeguato
  - Frequenza cardiaca a riposo elevata persistentemente (+5-10 bpm)
  - Malattie frequenti (raffreddori, infezioni)
  - Perdita di appetito prolungata
  - Insonnia cronica
  - Perdita di peso non intenzionale
  - Nelle donne: irregolarità mestruali

→ Questi segnali spesso indicano RED-S o sovrallenamento.
   L'agente deve aumentare immediatamente le calorie (specialmente carboidrati),
   ridurre il carico di allenamento e suggerire una consulenza medico-sportiva.
```

---

## Albero decisionale generale per l'agente

Quando l'utente comunica il proprio obiettivo, l'agente deve seguire questo flusso:

```
UTENTE DICHIARA OBIETTIVO
│
├── "Voglio mettere massa / fare bulk"
│   ├── BF% stimata > 20% (uomini) o > 30% (donne)?
│   │   ├── SÌ → Proporre prima un cut o ricomp, spiegare il perché
│   │   └── NO → Procedere con protocollo MASSA (sezione 1)
│   └── Determinare tipo di bulk in base a livello ed esperienza
│
├── "Voglio dimagrire / perdere peso / definirmi"
│   ├── BF% stimata < 12% (uomini) o < 20% (donne)?
│   │   ├── SÌ → Avvisare dei rischi, proporre deficit minimo, verificare motivazioni
│   │   └── NO → Procedere con protocollo DIMAGRIMENTO (sezione 2)
│   ├── Ha massa muscolare da preservare?
│   │   ├── SÌ → Proteine più alte (2.2-2.7 g/kg), deficit moderato
│   │   └── NO → Proteine standard (2.0 g/kg), deficit può essere più aggressivo
│   └── Calcolare durata stimata e pianificare la strategia di uscita (reverse)
│
├── "Voglio migliorare le mie prestazioni sportive"
│   ├── Identificare la categoria sportiva (A, B, C, D)
│   ├── Identificare la fase della stagione
│   ├── L'utente è in deficit?
│   │   ├── SÌ → Se non necessario per la categoria di peso: ELIMINARE il deficit
│   │   └── NO → Bene, procedere con protocollo PERFORMANCE (sezione 3)
│   └── Il timing e la periodizzazione diventano prioritari
│
└── Obiettivo non chiaro o multiplo
    ├── Chiedere chiarimenti: "Qual è la tua priorità principale?"
    ├── Se "voglio essere più forte E più magro":
    │   → Determinare la priorità e suggerire di affrontare un obiettivo alla volta
    │   → Eccezione: principianti possono fare ricomposizione corporea
    │     (mantenimento calorico con proteine alte e allenamento progressivo)
    └── Se l'utente insiste su obiettivi contraddittori:
        → Spiegare perché non si possono ottimizzare due obiettivi opposti
          contemporaneamente (massa + cut è fisiologicamente inefficiente
          per non-principianti) e proporre una periodizzazione degli obiettivi
```

---

## Riepilogo rapido: tabella comparativa macro per obiettivo

| Parametro | Massa | Dimagrimento | Performance Forza | Performance Endurance | Performance Sport Misti |
|---|---|---|---|---|---|
| **Calorie** | TDEE + 150/500 | TDEE - 250/750 | TDEE ± 0/300 | TDEE (alto) | TDEE |
| **Proteine** | 1.6-2.2 g/kg | 2.0-2.7 g/kg | 1.8-2.4 g/kg | 1.4-1.8 g/kg | 1.8-2.2 g/kg |
| **Grassi** | 0.8-1.2 g/kg | 0.6-1.0 g/kg | 0.8-1.2 g/kg | 0.8-1.2 g/kg | 0.8-1.2 g/kg |
| **Carboidrati** | 4-7 g/kg | 2-4 g/kg | 3-5 g/kg | 5-12 g/kg | 5-8 g/kg |
| **Macro prioritario** | Carboidrati | Proteine | Proteine | Carboidrati | Carboidrati |
| **Timing critico** | Moderato | Pre/post workout | Moderato | MOLTO critico | Critico |
| **Idratazione** | Standard | Standard | Standard | CRITICA | Importante |
| **Refeed/Diet break** | N/A | Ogni 7-14 giorni / 6-12 settimane | Se in cut | N/A (non in deficit) | Se in cut |

---

> **Nota per l'agente**: questo documento è un riferimento operativo, non un piano da leggere all'utente. L'agente deve interiorizzare questi principi e applicarli nella generazione dei piani, comunicando le raccomandazioni in modo naturale, personalizzato e motivante. Le regole critiche (pavimento calorico, proteine minime, segnali di allarme) sono NON negoziabili e devono essere rispettate anche se l'utente insiste diversamente.
