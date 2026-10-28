import { computeBudget } from './budget';
import { computeDayLoads } from './dayLoad';
import { addDays, computeDays, formatDateIt, isRoutableLeg, legTotals, totalDays, totalNights, TRIP_MAX_DAYS, TRIP_MIN_DAYS } from './itinerary';
import type { AccommodationStatus, Trip } from './types';

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
  /** alta = può far saltare o rendere faticoso il viaggio; media = da sistemare; bassa = rifinitura */
  priority: 'alta' | 'media' | 'bassa';
  text: string;
  href: string;
  cta: string;
  /** Seconda azione, quando la stessa situazione riguarda anche un'altra sezione (es. alloggio e budget) */
  secondary?: { href: string; cta: string };
}

export interface LegRef {
  legId: string;
  from: string;
  to: string;
}

export interface CrossingRef extends LegRef {
  label: string;
  departureTime?: string;
}

export interface LodgingRow {
  stopId: string;
  stopName: string;
  nights: number;
  /** Nome dell'alloggio scelto, assente se non ancora scelto */
  accommodation?: string;
  status?: AccommodationStatus;
  hasPrice: boolean;
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

const FIRM = ['confermato', 'prenotato', 'pagato'];

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
      if (s.mode !== 'strada' && s.mode !== 'non_calcolato' && !FIRM.includes(s.status)) {
        unverifiedCrossings.push({ ...ref, label: s.label, departureTime: s.departureTime });
      }
    }
  }

  const lodging: LodgingRow[] = trip.stops
    .filter((s) => s.kind === 'luogo' && s.nights > 0)
    .map((s) => {
      const a = trip.accommodations.find((x) => x.id === s.accommodationId);
      return { stopId: s.id, stopName: s.name, nights: s.nights, accommodation: a?.name, status: a?.status, hasPrice: Boolean(a?.pricePerNight) };
    });
  const lodgingAssigned = lodging.filter((l) => l.accommodation).length;
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

  // Alloggi scelti di cui non si è ancora verificata la disponibilità (stato «individuata»)
  const lodgingUnchecked = lodging.filter((l) => l.accommodation && l.status === 'individuata').length;
  const toCheck = unverifiedCrossings.length + lodgingUnchecked;

  const raw: Omit<PlanningStep, 'waitsFor'>[] = [
    {
      id: 'date',
      label: 'Periodo del viaggio',
      state: trip.dateTentative ? 'da_fare' : 'fatto',
      detail: trip.dateTentative ? 'Date provvisorie' : 'Date decise',
      href: '#/viaggio',
    },
    {
      id: 'tappe',
      label: 'Tappe e notti',
      state: n === 0 ? 'da_fare' : inTarget ? 'fatto' : 'in_corso',
      detail: n === 0 ? 'Itinerario vuoto' : `${n} giorni su ${TRIP_MIN_DAYS}–${TRIP_MAX_DAYS} previsti`,
      href: '#/itinerario',
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
      href: '#/itinerario',
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
      href: unverifiedCrossings.length > 0 ? '#/itinerario' : '#/hytte',
    },
    {
      id: 'prenotazioni',
      label: 'Alloggi prenotati',
      state: lodging.length === 0 ? 'da_fare' : lodgingBooked === lodging.length ? 'fatto' : lodgingBooked > 0 ? 'in_corso' : 'da_fare',
      detail: lodging.length === 0 ? '—' : `${lodgingBooked} di ${lodging.length} tappe`,
      href: '#/hytte',
    },
  ];
  const stateOf = new Map(raw.map((r) => [r.id, r]));
  const steps: PlanningStep[] = raw.map((r) => ({
    ...r,
    waitsFor: r.state === 'fatto' ? [] : DEPENDS_ON[r.id].filter((d) => stateOf.get(d)?.state !== 'fatto').map((d) => stateOf.get(d)!.label),
  }));

  const actions: NextAction[] = [];
  const plural = (k: number, one: string, many: string) => (k === 1 ? one : many);
  if (trip.stops.length === 0) {
    actions.push({ id: 'start', priority: 'alta', text: 'Costruisci l\'itinerario: aggiungi le tappe o fatti proporre un percorso.', href: '#/configuratore', cta: 'Apri il configuratore' });
  } else if (!inTarget) {
    actions.push({
      id: 'length',
      priority: 'alta',
      text: `Il viaggio dura ${n} giorni: l'obiettivo è tra ${TRIP_MIN_DAYS} e ${TRIP_MAX_DAYS}. Aggiungi o togli notti.`,
      href: '#/itinerario',
      cta: 'Modifica le notti',
    });
  }
  if (uncalculatedLegs.length > 0) {
    actions.push({
      id: 'legs',
      priority: 'alta',
      text: `Calcola ${uncalculatedLegs.length} ${plural(uncalculatedLegs.length, 'collegamento', 'collegamenti')}: senza, tempi e carico delle giornate sono incompleti.`,
      href: '#/itinerario',
      cta: 'Calcola i tratti',
    });
  }
  if (shipLegsMissing.length > 0) {
    actions.push({
      id: 'ship',
      priority: 'alta',
      text: `Collega la nave a ${shipLegsMissing.length} ${plural(shipLegsMissing.length, 'tratto', 'tratti')} con notte a bordo.`,
      href: '#/crociere',
      cta: 'Apri Crociere',
    });
  }
  const over = heavyDays.filter((h) => h.level === 'eccessiva');
  if (over.length > 0) {
    actions.push({
      id: 'heavy',
      priority: 'alta',
      text: `${over.length} ${plural(over.length, 'giornata troppo carica', 'giornate troppo cariche')} per due bambini: guarda le proposte per alleggerire.`,
      href: '#/giornate',
      cta: 'Vedi le giornate',
    });
  }
  const noBed = lodging.filter((l) => !l.accommodation).length;
  // Tappe senza alloggio: una sola azione che distingue la scelta (pianificazione) dal costo (budget)
  if (noBed > 0) {
    const tappe = `${noBed} ${plural(noBed, 'tappa', 'tappe')} con pernottamento`;
    const cov = budget.unchosenLodgingCoverage;
    actions.push({
      id: 'beds',
      priority: 'media',
      text:
        cov === 'nessuna'
          ? `Scegli l'alloggio per ${tappe}. Costo da quantificare: non è ancora nel budget.`
          : cov === 'stima'
            ? `Scegli l'alloggio per ${tappe}. Nel budget per ora c'è la tua stima per notte.`
            : `Scegli l'alloggio per ${tappe}. Nel budget ci sono voci manuali di alloggio: controlla che coprano queste tappe.`,
      href: '#/hytte',
      cta: 'Cerca hytte',
      secondary: cov === 'stima' ? undefined : { href: '#/budget', cta: cov === 'nessuna' ? 'Stima nel budget' : 'Controlla il budget' },
    });
  }
  const bookedWithTentative = lodging.filter((l) => l.status === 'prenotata').length;
  if (trip.dateTentative && bookedWithTentative > 0) {
    actions.push({
      id: 'booked-tentative',
      priority: 'alta',
      text: `${bookedWithTentative} ${plural(bookedWithTentative, 'alloggio risulta prenotato', 'alloggi risultano prenotati')} ma le date del viaggio sono ancora provvisorie: controlla che coincidano.`,
      href: '#/viaggio',
      cta: 'Controlla le date',
    });
  }
  if (lodgingUnchecked > 0) {
    actions.push({
      id: 'availability',
      priority: 'media',
      text: `Verifica la disponibilità di ${lodgingUnchecked} ${plural(lodgingUnchecked, 'alloggio scelto', 'alloggi scelti')} sul sito del fornitore: scelto non vuol dire prenotato.`,
      href: '#/hytte',
      cta: 'Apri gli alloggi',
    });
  }
  if (unverifiedCrossings.length > 0) {
    actions.push({
      id: 'crossings',
      priority: 'media',
      text: `Verifica orari e stato di ${unverifiedCrossings.length} ${plural(unverifiedCrossings.length, 'traghetto, nave o mezzo pubblico', 'traghetti, navi o mezzi pubblici')} sul sito dell'operatore.`,
      href: '#/itinerario',
      cta: 'Apri i tratti',
    });
  }
  // Costi senza prezzo diversi dagli alloggi non scelti (già nell'azione sopra): es. alloggio scelto senza prezzo, traghetto
  const otherMissing = missingPrices.length - (budget.unchosenLodgingCoverage === 'nessuna' ? budget.unchosenLodging.length : 0);
  if (otherMissing > 0) {
    actions.push({
      id: 'prices',
      priority: 'media',
      text: `${otherMissing} ${plural(otherMissing, 'costo noto non ha', 'costi noti non hanno')} ancora un prezzo: il totale li esclude.`,
      href: '#/budget',
      cta: 'Apri il budget',
    });
  }
  const full = heavyDays.length - over.length;
  if (full > 0) {
    actions.push({
      id: 'full',
      priority: 'bassa',
      text: `${full} ${plural(full, 'giornata piena', 'giornate piene')}: tieni un piano B leggero.`,
      href: '#/giornate',
      cta: 'Vedi le giornate',
    });
  }
  if (trip.dateTentative) {
    actions.push({ id: 'dates', priority: 'bassa', text: `Le date sono provvisorie (partenza ipotizzata ${formatDateIt(trip.startDate)}): fissale quando i voli sono decisi.`, href: '#/viaggio', cta: 'Imposta le date' });
  }

  // Prima le priorità alte; a parità di priorità resta l'ordine logico delle decisioni (sort stabile)
  const rank = { alta: 0, media: 1, bassa: 2 } as const;
  actions.sort((a, b) => rank[a.priority] - rank[b.priority]);

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
