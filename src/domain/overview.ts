import { computeBudget } from './budget';
import { computeDayLoads } from './dayLoad';
import { addDays, computeDays, formatDateIt, formatDuration, isRoutableLeg, legTotals, totalDays, totalNights, TRIP_MAX_DAYS, TRIP_MIN_DAYS } from './itinerary';
import { dayTransfers } from './dayTransfer';
import type { AccommodationStatus, Trip } from './types';
import { accommodationInfo, segmentInfo, type InfoState } from './verification';

// Panoramica del viaggio: tutto è derivato dal documento Trip, nessun valore dimostrativo.

export type StepState = 'fatto' | 'in_corso' | 'da_fare';

export type StepId = 'date' | 'tappe' | 'collegamenti' | 'alloggi' | 'budget' | 'verifiche' | 'prenotazioni';

export interface PlanningStep {
  id: StepId;
  label: string;
  state: StepState;
  detail: string;
  /** Sezione dell'app dove si completa il passaggio */
  href: string;
  /** Passaggi da cui dipende ancora da completare: è un'indicazione, non blocca nulla */
  waitsFor: string[];
}

/** Dipendenze tra le decisioni: indicative, l'utente può procedere in qualsiasi ordine. */
const DEPENDS_ON: Record<StepId, StepId[]> = {
  date: [],
  tappe: [],
  collegamenti: ['tappe'],
  alloggi: ['tappe'],
  budget: ['collegamenti', 'alloggi'],
  verifiche: ['collegamenti', 'alloggi'],
  prenotazioni: ['date', 'verifiche'],
};

export interface NextAction {
  id: string;
  /**
   * Livello di priorità: 1 trasferimenti oltre il limite o non verificabili, 2 informazioni da confermare prima della
   * partenza, 3 prenotazioni necessarie mancanti, 4 verifiche e rifiniture non urgenti.
   */
  tier: 1 | 2 | 3 | 4;
  /** Derivata dal livello: alta (1–2), media (3), bassa (4) */
  priority: 'alta' | 'media' | 'bassa';
  text: string;
  /** Perché conta adesso, in una frase */
  why: string;
  href: string;
  cta: string;
  /** Seconda azione, quando la stessa situazione riguarda anche un'altra sezione (es. alloggio e budget) */
  secondary?: { href: string; cta: string };
  /** La stessa cosa in poche parole, per dire che cosa viene dopo il prossimo passo */
  brief?: string;
}

export interface LegRef {
  legId: string;
  from: string;
  to: string;
}

export interface CrossingRef extends LegRef {
  label: string;
  departureTime?: string;
  state: InfoState;
}

export interface LodgingRow {
  stopId: string;
  stopName: string;
  nights: number;
  /** Nome dell'alloggio scelto, assente se non ancora scelto */
  accommodation?: string;
  status?: AccommodationStatus;
  hasPrice: boolean;
  /** Disponibilità controllata e non scaduta */
  checked: boolean;
}

export interface HeavyDay {
  key: string;
  index: number;
  date: string;
  place?: string;
  level: 'piena' | 'eccessiva';
  ratio: number;
  incomplete: boolean;
}

export interface TripOverview {
  /** Assente finché l'itinerario è vuoto */
  period?: { start: string; end: string; tentative: boolean };
  days: number;
  nights: number;
  /** Tappe dove si dorme almeno una notte (le notti a bordo sono incluse) */
  sleepStops: number;
  inTarget: boolean;
  steps: PlanningStep[];
  budget: {
    total: number;
    /** Confermato da fonte, prenotato o pagato */
    firm: number;
    estimated: number;
    toVerify: number;
    /** Prezzi noti come mancanti (alloggi, traghetti, costiera…): il totale li esclude */
    missingPrices: string[];
    emptyCategories: number;
    perDay?: number;
  };
  uncalculatedLegs: LegRef[];
  /** Tratti verso/da una notte a bordo senza nave collegata */
  shipLegsMissing: LegRef[];
  unverifiedCrossings: CrossingRef[];
  lodging: LodgingRow[];
  heavyDays: HeavyDay[];
  actions: NextAction[];
}

export function tripOverview(trip: Trip): TripOverview {
  const n = totalDays(trip.stops);
  const nights = totalNights(trip.stops);
  const days = computeDays(trip);
  const loads = computeDayLoads(trip, days);
  const budget = computeBudget(trip);
  const nameOf = (id: string) => trip.stops.find((s) => s.id === id)?.name ?? '—';

  const uncalculatedLegs: LegRef[] = [];
  // Tratti con un mezzo inserito ma almeno un segmento senza durata: non sono «calcolati» del tutto
  let legsMissingDuration = 0;
  const shipLegsMissing: LegRef[] = [];
  const unverifiedCrossings: CrossingRef[] = [];
  for (const leg of trip.legs) {
    const ref = { legId: leg.id, from: nameOf(leg.fromStopId), to: nameOf(leg.toStopId) };
    const t = legTotals(leg, trip.settings);
    if (t.hasUncalculated) (isRoutableLeg(leg, trip.stops) ? uncalculatedLegs : shipLegsMissing).push(ref);
    else if (t.partial) legsMissingDuration += 1;
    for (const s of leg.segments) {
      const info = segmentInfo(s, trip.settings);
      if (info && info.state !== 'verificata') unverifiedCrossings.push({ ...ref, label: s.label, departureTime: s.departureTime, state: info.state });
    }
  }

  const lodging: LodgingRow[] = trip.stops
    .filter((s) => s.kind === 'luogo' && s.nights > 0)
    .map((s) => {
      const a = trip.accommodations.find((x) => x.id === s.accommodationId);
      return { stopId: s.id, stopName: s.name, nights: s.nights, accommodation: a?.name, status: a?.status, hasPrice: Boolean(a?.pricePerNight), checked: a ? accommodationInfo(a, trip.settings).state === 'verificata' : false };
    });
  const lodgingAssigned = lodging.filter((l) => l.accommodation && l.status !== 'annullata').length;
  const lodgingBooked = lodging.filter((l) => l.status === 'prenotata').length;

  const heavyDays: HeavyDay[] = loads
    .filter((l) => l.level === 'piena' || l.level === 'eccessiva')
    .map((l) => {
      const d = days[l.index]!;
      return {
        key: l.key,
        index: l.index,
        date: d.date,
        place: (d.sleepStop ?? d.wakeStop)?.name,
        level: l.level as 'piena' | 'eccessiva',
        ratio: l.ratio,
        incomplete: l.incomplete,
      };
    });

  const missingPrices = budget.missing.filter((m) => !m.startsWith('Nessuna voce'));
  const emptyCategories = budget.missing.length - missingPrices.length;
  const firm = budget.byStatus.confermato + budget.byStatus.prenotato + budget.byStatus.pagato;
  const inTarget = n >= TRIP_MIN_DAYS && n <= TRIP_MAX_DAYS;

  // Alloggi scelti, non prenotati, di cui la disponibilità non è controllata (o il controllo è vecchio)
  const lodgingUnchecked = lodging.filter((l) => l.accommodation && l.status !== 'prenotata' && l.status !== 'annullata' && !l.checked).length;
  const toCheck = unverifiedCrossings.length + lodgingUnchecked;

  const raw: Omit<PlanningStep, 'waitsFor'>[] = [
    {
      id: 'date',
      label: 'Periodo del viaggio',
      state: trip.dateTentative ? 'da_fare' : 'fatto',
      detail: trip.dateTentative ? 'Date provvisorie' : 'Date decise',
      href: '#/panoramica',
    },
    {
      id: 'tappe',
      label: 'Tappe e notti',
      state: n === 0 ? 'da_fare' : inTarget ? 'fatto' : 'in_corso',
      detail: n === 0 ? 'Itinerario vuoto' : `${n} giorni su ${TRIP_MIN_DAYS}–${TRIP_MAX_DAYS} previsti`,
      href: '#/pianifica',
    },
    {
      id: 'collegamenti',
      label: 'Trasporti calcolati',
      state: trip.legs.length === 0 ? 'da_fare' : uncalculatedLegs.length + shipLegsMissing.length + legsMissingDuration === 0 ? 'fatto' : 'in_corso',
      detail:
        trip.legs.length === 0
          ? 'Nessun tratto'
          : `${trip.legs.length - uncalculatedLegs.length - shipLegsMissing.length - legsMissingDuration} di ${trip.legs.length} tratti completi${
              legsMissingDuration > 0 ? ` · ${legsMissingDuration} senza durata` : ''
            }`,
      href: '#/pianifica',
    },
    {
      id: 'alloggi',
      label: 'Alloggi scelti',
      state: lodging.length === 0 ? 'da_fare' : lodgingAssigned === lodging.length ? 'fatto' : lodgingAssigned > 0 ? 'in_corso' : 'da_fare',
      detail: lodging.length === 0 ? 'Nessuna tappa con pernottamento' : `${lodgingAssigned} di ${lodging.length} tappe`,
      href: '#/hytte',
    },
    {
      id: 'budget',
      label: 'Costi principali',
      state: budget.lines.length === 0 ? 'da_fare' : missingPrices.length === 0 && emptyCategories === 0 ? 'fatto' : 'in_corso',
      detail:
        budget.lines.length === 0
          ? 'Nessuna voce'
          : missingPrices.length > 0
            ? `${missingPrices.length} ${missingPrices.length === 1 ? 'importo mancante' : 'importi mancanti'}`
            : emptyCategories > 0
              ? `${emptyCategories} categorie senza voci`
              : 'Tutte le categorie hanno voci',
      href: '#/budget',
    },
    {
      id: 'verifiche',
      label: 'Orari e disponibilità',
      state: n === 0 ? 'da_fare' : toCheck === 0 && lodgingAssigned === lodging.length ? 'fatto' : 'in_corso',
      detail:
        n === 0
          ? '—'
          : toCheck > 0
            ? `${toCheck} ${toCheck === 1 ? 'verifica aperta' : 'verifiche aperte'}`
            : lodgingAssigned < lodging.length
              ? `${lodging.length - lodgingAssigned} ${lodging.length - lodgingAssigned === 1 ? 'alloggio' : 'alloggi'} ancora da scegliere e verificare`
              : 'Nessuna verifica aperta',
      href: '#/prenotazioni',
    },
    {
      id: 'prenotazioni',
      label: 'Alloggi prenotati',
      state: lodging.length === 0 ? 'da_fare' : lodgingBooked === lodging.length ? 'fatto' : lodgingBooked > 0 ? 'in_corso' : 'da_fare',
      detail: lodging.length === 0 ? '—' : `${lodgingBooked} di ${lodging.length} tappe`,
      href: '#/prenotazioni',
    },
  ];
  const stateOf = new Map(raw.map((r) => [r.id, r]));
  const steps: PlanningStep[] = raw.map((r) => ({
    ...r,
    waitsFor: r.state === 'fatto' ? [] : DEPENDS_ON[r.id].filter((d) => stateOf.get(d)?.state !== 'fatto').map((d) => stateOf.get(d)!.label),
  }));

  // Prossimi passi: un'unica fonte per Panoramica, Itinerario, Prenotazioni e attivazione di una proposta.
  // Ordine: 1) trasferimenti oltre il limite o non verificabili; 2) informazioni essenziali da confermare prima della
  // partenza; 3) prenotazioni necessarie ancora mancanti; 4) verifiche e rifiniture non urgenti.
  const actions: NextAction[] = [];
  const plural = (k: number, one: string, many: string) => (k === 1 ? one : many);
  const push = (a: Omit<NextAction, 'priority'>) => actions.push({ ...a, priority: a.tier <= 2 ? 'alta' : a.tier === 3 ? 'media' : 'bassa' });
  if (trip.stops.length === 0) {
    push({
      id: 'start',
      tier: 1,
      text: "Costruisci l'itinerario: fatti proporre un percorso da rivedere, oppure aggiungi le tappe a mano.",
      why: 'Senza tappe non si possono calcolare tempi, alloggi e costi.',
      href: '#/configuratore',
      cta: 'Crea una proposta automatica',
      secondary: { href: '#/pianifica', cta: 'Aggiungi le tappe a mano' },
    });
  }

  // 1. Trasferimenti
  const transfers = dayTransfers(trip, days);
  const limit = trip.settings.maxTravelMinPerDay;
  const over = transfers.filter((d) => d.state === 'oltre');
  const firstOverLeg = over[0]?.legs[0];
  if (firstOverLeg) {
    push({
      id: 'over-limit',
      tier: 1,
      text: `${over.length} ${plural(over.length, 'giornata di trasferimento supera', 'giornate di trasferimento superano')} il limite di ${formatDuration(limit)} al giorno che hai impostato. Controlla ${plural(over.length, 'il tratto', 'i tratti')} o aggiungi una tappa intermedia.`,
      why: 'Una giornata così lunga in viaggio con due bambini rischia di far saltare il resto del programma.',
      href: `#/pianifica?sel=leg%3A${encodeURIComponent(firstOverLeg.legId)}`,
      cta: plural(over.length, 'Controlla il trasferimento', 'Controlla i trasferimenti'),
      brief: `controlla ${over.length} ${plural(over.length, 'trasferimento oltre il limite', 'trasferimenti oltre il limite')}`,
    });
  }
  const unknown = transfers.filter((d) => d.state === 'non_verificabile');
  if (uncalculatedLegs.length > 0) {
    push({
      id: 'legs',
      tier: 1,
      text: `Calcola ${uncalculatedLegs.length} ${plural(uncalculatedLegs.length, 'collegamento', 'collegamenti')}${unknown.length > 0 ? `: ${unknown.length} ${plural(unknown.length, 'giornata non è verificabile', 'giornate non sono verificabili')} rispetto al limite` : ''}.`,
      why: 'Senza i tempi non si può dire se le giornate restano entro il limite, e il carico dei giorni è incompleto.',
      href: '#/pianifica?azione=calcola',
      cta: 'Calcola i tratti',
      brief: `calcola ${uncalculatedLegs.length} ${plural(uncalculatedLegs.length, 'tratto', 'tratti')}`,
    });
  }
  if (shipLegsMissing.length > 0) {
    push({
      id: 'ship',
      tier: 1,
      text: `Collega la nave a ${shipLegsMissing.length} ${plural(shipLegsMissing.length, 'tratto', 'tratti')} con notte a bordo.`,
      why: 'Senza la nave quei tratti non hanno orari né tempi: le giornate collegate non sono verificabili.',
      href: '#/crociere',
      cta: 'Apri le crociere',
      brief: 'collega la nave ai tratti con notte a bordo',
    });
  }
  const noDuration = unknown.flatMap((d) => d.missing).filter((m) => m.reason === 'durata di un mezzo non inserita');
  if (noDuration[0]) {
    push({
      id: 'durations',
      tier: 1,
      text: `Inserisci la durata di ${noDuration.length} ${plural(noDuration.length, 'tratto', 'tratti')} con treno, nave o altri mezzi (${noDuration[0].from} → ${noDuration[0].to}${noDuration.length > 1 ? ' e altri' : ''}).`,
      why: 'Un tempo mancante non vale zero: finché manca, la giornata non è verificabile.',
      href: `#/pianifica?sel=leg%3A${encodeURIComponent(noDuration[0].legId)}`,
      cta: 'Apri il tratto',
      brief: 'inserisci le durate mancanti',
    });
  }
  if (trip.stops.length > 0 && !inTarget) {
    push({
      id: 'length',
      tier: 1,
      text: `Il viaggio dura ${n} giorni: l'obiettivo è tra ${TRIP_MIN_DAYS} e ${TRIP_MAX_DAYS}. Aggiungi o togli notti.`,
      why: 'Le date di voli e alloggi dipendono dalla durata: conviene fissarla prima di prenotare.',
      href: '#/pianifica',
      cta: 'Modifica le notti',
      brief: 'sistema la durata del viaggio',
    });
  }

  // 2. Informazioni essenziali da confermare prima della partenza
  if (unverifiedCrossings.length > 0) {
    const stale = unverifiedCrossings.filter((c) => c.state === 'da_ricontrollare').length;
    push({
      id: 'crossings',
      tier: 2,
      text: `Verifica orari di ${unverifiedCrossings.length} ${plural(unverifiedCrossings.length, 'traghetto, nave o mezzo pubblico', 'traghetti, navi o mezzi pubblici')} sul sito dell'operatore${stale > 0 ? ` (${stale} da ricontrollare)` : ''}.`,
      why: 'Un orario sbagliato fa perdere la coincidenza: verificato non vuol dire prenotato, ma serve saperlo prima di partire.',
      href: '#/prenotazioni?verifica=da_fare',
      cta: 'Apri le verifiche',
      brief: 'verifica orari di traghetti e altri mezzi',
    });
  }
  const bookedWithTentative = lodging.filter((l) => l.status === 'prenotata').length;
  if (trip.dateTentative && bookedWithTentative > 0) {
    push({
      id: 'booked-tentative',
      tier: 2,
      text: `${bookedWithTentative} ${plural(bookedWithTentative, 'alloggio risulta prenotato', 'alloggi risultano prenotati')} ma le date del viaggio sono ancora provvisorie: controlla che coincidano.`,
      why: 'Una prenotazione con date diverse dal viaggio va corretta con il fornitore.',
      href: '#/panoramica?sezione=date',
      cta: 'Controlla le date',
      brief: 'controlla le date delle prenotazioni',
    });
  }

  // 3. Prenotazioni necessarie ancora mancanti
  const flights = trip.flights ?? [];
  const missingFlights = trip.stops.length > 0 ? (['andata', 'ritorno'] as const).filter((d) => !flights.some((f) => f.selected && f.direction === d)) : [];
  if (missingFlights.length > 0) {
    push({
      id: 'flights',
      tier: 3,
      text: missingFlights.length === 2 ? 'Scegli i voli di andata e ritorno.' : `Scegli il volo di ${missingFlights[0]}.`,
      why: 'I voli fissano le date del viaggio: alloggi e traghetti dipendono da loro.',
      href: '#/voli',
      cta: 'Apri i voli',
      brief: 'scegli i voli',
    });
  }
  const noBed = lodging.filter((l) => !l.accommodation || l.status === 'annullata');
  if (noBed.length > 0) {
    const tappe = `${noBed.length} ${plural(noBed.length, 'tappa', 'tappe')} con pernottamento`;
    const cov = budget.unchosenLodgingCoverage;
    push({
      id: 'beds',
      tier: 3,
      text:
        cov === 'nessuna'
          ? `Scegli l'alloggio per ${tappe}. Costo da quantificare: non è ancora nel budget.`
          : cov === 'stima'
            ? `Scegli l'alloggio per ${tappe}. Nel budget per ora c'è la tua stima per notte.`
            : `Scegli l'alloggio per ${tappe}. Nel budget ci sono voci manuali di alloggio: controlla che coprano queste tappe.`,
      why: 'In agosto gli alloggi per quattro persone si esauriscono presto.',
      href: `#/hytte?tappa=${encodeURIComponent(noBed[0]!.stopId)}&cerca=1`,
      cta: 'Cerca gli alloggi',
      brief: 'completa gli alloggi delle tappe',
      secondary: cov === 'stima' ? undefined : { href: '#/budget', cta: cov === 'nessuna' ? 'Stima nel budget' : 'Controlla il budget' },
    });
  }

  // 4. Verifiche e rifiniture non urgenti
  const overLoad = heavyDays.filter((h) => h.level === 'eccessiva');
  if (overLoad.length > 0) {
    push({
      id: 'heavy',
      tier: 4,
      text: `${overLoad.length} ${plural(overLoad.length, 'giornata troppo carica', 'giornate troppo cariche')} per due bambini: guarda le proposte per alleggerire.`,
      why: 'Attività e trasferimenti insieme superano il tempo attivo di una giornata con i bambini.',
      href: '#/giornate',
      cta: 'Vedi le giornate',
      brief: 'alleggerisci le giornate troppo cariche',
    });
  }
  if (lodgingUnchecked > 0) {
    push({
      id: 'availability',
      tier: 4,
      text: `Verifica la disponibilità di ${lodgingUnchecked} ${plural(lodgingUnchecked, 'alloggio scelto', 'alloggi scelti')} sul sito del fornitore: individuato non vuol dire disponibile né prenotato.`,
      why: 'Finché non è controllata, la disponibilità per le vostre date è solo un\'ipotesi.',
      href: '#/prenotazioni?verifica=da_fare',
      cta: 'Apri le verifiche',
      brief: 'verifica la disponibilità degli alloggi scelti',
    });
  }
  const otherMissing = missingPrices.length - (budget.unchosenLodgingCoverage === 'nessuna' ? budget.unchosenLodging.length : 0);
  if (otherMissing > 0) {
    push({
      id: 'prices',
      tier: 4,
      text: `${otherMissing} ${plural(otherMissing, 'costo noto non ha', 'costi noti non hanno')} ancora un prezzo: il totale li esclude.`,
      why: 'Un prezzo mancante non vale zero: il totale del budget è parziale.',
      href: '#/budget',
      cta: 'Apri il budget',
      brief: 'inserisci i prezzi mancanti',
    });
  }
  const full = heavyDays.length - overLoad.length;
  if (full > 0) {
    push({
      id: 'full',
      tier: 4,
      text: `${full} ${plural(full, 'giornata piena', 'giornate piene')}: tieni un piano B leggero.`,
      why: 'Con i bambini serve un margine per stanchezza e maltempo.',
      href: '#/giornate',
      cta: 'Vedi le giornate',
      brief: 'tieni un piano B per le giornate piene',
    });
  }
  if (trip.dateTentative) {
    push({
      id: 'dates',
      tier: 4,
      text: `Le date sono provvisorie (partenza ipotizzata ${formatDateIt(trip.startDate)}): fissale quando i voli sono decisi.`,
      why: 'Le date provvisorie spostano tutte le giornate se cambiano.',
      href: '#/panoramica?sezione=date',
      cta: 'Imposta le date',
      brief: 'fissa le date quando i voli sono decisi',
    });
  }

  // Ordine per livello; a parità di livello resta l'ordine logico (sort stabile)
  actions.sort((a, b) => a.tier - b.tier);

  return {
    period: n > 0 ? { start: trip.startDate, end: addDays(trip.startDate, n - 1), tentative: trip.dateTentative } : undefined,
    days: n,
    nights,
    sleepStops: trip.stops.filter((s) => s.nights > 0).length,
    inTarget,
    steps,
    budget: {
      total: budget.total,
      firm,
      estimated: budget.byStatus.stimato,
      toVerify: budget.byStatus.da_verificare,
      missingPrices,
      emptyCategories,
      perDay: budget.perDay,
    },
    uncalculatedLegs,
    shipLegsMissing,
    unverifiedCrossings,
    lodging,
    heavyDays,
    actions,
  };
}

/**
 * Prossimo passo unico per l'itinerario: una sola azione principale e, se c'è, che cosa viene dopo.
 * Non ripete la stessa questione: dopo i trasferimenti oltre il limite non propone le giornate troppo cariche che ne derivano.
 */
export function planStep(o: Pick<TripOverview, 'actions'>): { main?: NextAction; then?: string } {
  // Il prossimo passo per chi ha già tappe non è «inizia»: quello lo mostra la panoramica vuota
  const [main, ...rest] = o.actions;
  if (!main) return {};
  const after = rest.find((a) => a.brief && !(main.id === 'over-limit' && a.id === 'heavy'));
  return { main, then: after?.brief };
}

/** Prossimo passo del viaggio: la stessa risposta in ogni schermata. */
export const nextStep = (trip: Trip) => planStep(tripOverview(trip));
