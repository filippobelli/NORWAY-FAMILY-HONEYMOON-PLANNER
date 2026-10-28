import { newId } from './ids';
import type { Leg, Segment, Stop, Trip, TripSettings } from './types';

export const TRIP_MIN_DAYS = 15;
export const TRIP_MAX_DAYS = 20;

export function uncalculatedSegment(): Segment {
  return {
    id: newId(),
    mode: 'non_calcolato',
    label: 'Collegamento non ancora calcolato',
    status: 'da_verificare',
    costStatus: 'da_verificare',
  };
}

/** Allinea i tratti all'ordine delle tappe, riusando quelli già calcolati per la stessa coppia. */
export function syncLegs(stops: Stop[], legs: Leg[]): Leg[] {
  const out: Leg[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i]!;
    const to = stops[i + 1]!;
    const existing = legs.find((l) => l.fromStopId === from.id && l.toStopId === to.id);
    out.push(existing ?? { id: newId(), fromStopId: from.id, toStopId: to.id, segments: [uncalculatedSegment()] });
  }
  return out;
}

/** Ipotesi di pianificazione usate per le stime realistiche (modificabili in Salvataggio → Viaggio). */
export const DEFAULT_ASSUMPTIONS = {
  breakEveryMin: 120,
  breakMin: 20,
  defaultFerryWaitMin: 30,
  activeDayMin: 600,
  mealBreaksMin: 90,
  marginPct: 15,
} as const;

export type Assumptions = { [K in keyof typeof DEFAULT_ASSUMPTIONS]: number };

export function assumptions(s?: Partial<TripSettings>): Assumptions {
  return {
    breakEveryMin: s?.breakEveryMin ?? DEFAULT_ASSUMPTIONS.breakEveryMin,
    breakMin: s?.breakMin ?? DEFAULT_ASSUMPTIONS.breakMin,
    defaultFerryWaitMin: s?.defaultFerryWaitMin ?? DEFAULT_ASSUMPTIONS.defaultFerryWaitMin,
    activeDayMin: s?.activeDayMin ?? DEFAULT_ASSUMPTIONS.activeDayMin,
    mealBreaksMin: s?.mealBreaksMin ?? DEFAULT_ASSUMPTIONS.mealBreaksMin,
    marginPct: s?.marginPct ?? DEFAULT_ASSUMPTIONS.marginPct,
  };
}

const isAutoSeg = (s: Segment) => Boolean(s.source?.label.startsWith('OSRM'));

export interface LegTotals {
  /** Somma delle durate inserite o calcolate (teorica, senza soste né attese stimate) */
  travelMin: number;
  /** Attese inserite dall'utente */
  waitMin: number;
  /** Minuti di guida teorici */
  driveMin: number;
  /** Soste stimate durante la guida (ipotesi) */
  breakMin: number;
  /** Attese ai traghetti stimate perché non inserite (ipotesi) */
  estimatedWaitMin: number;
  /** Durata realistica stimata = teorica + attese inserite + soste + attese stimate */
  realisticMin: number;
  roadKm: number;
  ferryCount: number;
  hasUncalculated: boolean;
  /** true se almeno un segmento non ha la durata: il totale è parziale */
  partial: boolean;
  /** Strada sommata a treno/bus/aereo/nave nello stesso tratto: da verificare che siano in sequenza */
  mixedModes: boolean;
  /** Traghetto calcolato e traghetto inserito a mano nello stesso tratto: possibile doppio conteggio */
  possibleDuplicateFerry: boolean;
  /** Traghetti o navi senza dati confermati (orario/stato) */
  unverifiedCrossings: number;
}

export function legTotals(leg: Leg, settings?: Partial<TripSettings>): LegTotals {
  const a = assumptions(settings);
  let travelMin = 0;
  let waitMin = 0;
  let driveMin = 0;
  let estimatedWaitMin = 0;
  let roadKm = 0;
  let ferryCount = 0;
  let hasUncalculated = false;
  let partial = false;
  let unverifiedCrossings = 0;
  for (const s of leg.segments) {
    if (s.mode === 'non_calcolato') {
      hasUncalculated = true;
      partial = true;
      continue;
    }
    if (s.durationMin === undefined) partial = true;
    travelMin += s.durationMin ?? 0;
    waitMin += s.waitMin ?? 0;
    if (s.mode === 'strada') {
      roadKm += s.distanceKm ?? 0;
      driveMin += s.durationMin ?? 0;
    }
    if (s.mode === 'traghetto') {
      ferryCount += 1;
      if (s.waitMin === undefined) estimatedWaitMin += a.defaultFerryWaitMin;
    }
    if ((s.mode === 'traghetto' || s.mode === 'costiera') && !['confermato', 'prenotato', 'pagato'].includes(s.status)) {
      unverifiedCrossings += 1;
    }
  }
  const breakMin = driveMin > a.breakEveryMin ? Math.floor(driveMin / a.breakEveryMin) * a.breakMin : 0;
  const modes = new Set(leg.segments.map((s) => s.mode));
  const mixedModes = modes.has('strada') && (modes.has('treno') || modes.has('bus') || modes.has('aereo') || modes.has('costiera'));
  const ferries = leg.segments.filter((s) => s.mode === 'traghetto');
  const possibleDuplicateFerry = ferries.some(isAutoSeg) && ferries.some((s) => !isAutoSeg(s));
  return {
    travelMin,
    waitMin,
    driveMin,
    breakMin,
    estimatedWaitMin,
    realisticMin: travelMin + waitMin + breakMin + estimatedWaitMin,
    roadKm,
    ferryCount,
    hasUncalculated,
    partial,
    mixedModes,
    possibleDuplicateFerry,
    unverifiedCrossings,
  };
}

export type LegState = 'da_calcolare' | 'calcolato' | 'manuale' | 'misto';

export interface LegSummary {
  /** Da dove arrivano i dati del tratto */
  state: LegState;
  roadKm: number;
  /** Guida teorica (solo segmenti stradali) */
  driveMin: number;
  /** Durate dei segmenti non stradali (traghetti, nave, treno, bus, aereo) */
  otherMin: number;
  /** Attese inserite dall'utente */
  enteredWaitMin: number;
  /** Totale teorico: assente se anche un solo segmento non ha la durata (non si somma un dato mancante) */
  totalMin?: number;
  /** Totale realistico con soste e attese ipotizzate: assente come sopra */
  realisticMin?: number;
  /** Segmenti senza durata */
  missingDuration: number;
  /** Segmenti non stradali con orario o operatività ancora da verificare */
  toVerify: number;
}

/** Riepilogo di un tratto che tiene separati guida, traversate e attese; non somma dati mancanti. */
export function legSummary(leg: Leg, settings?: Partial<TripSettings>): LegSummary {
  const t = legTotals(leg, settings);
  const real = leg.segments.filter((s) => s.mode !== 'non_calcolato');
  const auto = real.filter(isAutoSeg).length;
  const state: LegState = real.length === 0 ? 'da_calcolare' : auto === real.length ? 'calcolato' : auto === 0 ? 'manuale' : 'misto';
  const missingDuration = real.filter((s) => s.durationMin === undefined).length;
  const complete = real.length > 0 && !t.hasUncalculated && missingDuration === 0;
  const toVerify = real.filter((s) => s.mode !== 'strada' && !['confermato', 'prenotato', 'pagato'].includes(s.status)).length;
  return {
    state,
    roadKm: t.roadKm,
    driveMin: t.driveMin,
    otherMin: t.travelMin - t.driveMin,
    enteredWaitMin: t.waitMin,
    totalMin: complete ? t.travelMin + t.waitMin : undefined,
    realisticMin: complete ? t.realisticMin : undefined,
    missingDuration,
    toVerify,
  };
}

/** Il calcolo stradale non ha senso se uno dei due estremi è una notte a bordo. */
export function isRoutableLeg(leg: Leg, stops: Stop[]): boolean {
  const a = stops.find((s) => s.id === leg.fromStopId);
  const b = stops.find((s) => s.id === leg.toStopId);
  return Boolean(a && b && a.kind === 'luogo' && b.kind === 'luogo');
}

export function addDays(isoDate: string, n: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 2027, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function formatDateIt(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 2027, (m ?? 1) - 1, d ?? 1));
  return dt.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export interface DayInfo {
  index: number;
  /** Chiave stabile della giornata: segue la tappa anche se l'itinerario viene riordinato */
  key: string;
  date: string;
  /** Dove si dorme la notte di questo giorno (assente l'ultimo giorno) */
  sleepStop?: Stop;
  /** Notte n-esima nella stessa tappa (0 = prima notte) */
  nightIndex: number;
  /** Tappa in cui ci si trova al mattino */
  wakeStop?: Stop;
  legs: Leg[];
  isArrivalDay: boolean;
  isDepartureDay: boolean;
  /** Trasferimenti: durata teorica (con attese inserite) */
  travelMin: number;
  /** Trasferimenti: durata realistica stimata (con soste e attese ipotizzate) */
  realisticTravelMin: number;
  travelPartial: boolean;
  warnings: string[];
}

export function dayKey(stopId: string | undefined, nightIndex: number): string {
  return stopId ? `${stopId}#${nightIndex}` : 'partenza';
}

export function totalDays(stops: Stop[]): number {
  if (stops.length === 0) return 0;
  return stops.reduce((acc, s) => acc + Math.max(0, s.nights), 0) + 1;
}

export function totalNights(stops: Stop[]): number {
  return stops.reduce((acc, s) => acc + Math.max(0, s.nights), 0);
}

/** Cambi di alloggio: quante volte si cambia letto (le notti a bordo contano come un cambio). */
export function accommodationChanges(stops: Stop[]): number {
  const sleeps = stops.filter((s) => s.nights > 0);
  return Math.max(0, sleeps.length - 1);
}

export function computeDays(trip: Trip): DayInfo[] {
  const { stops } = trip;
  const n = totalDays(stops);
  if (n === 0) return [];
  const days: DayInfo[] = Array.from({ length: n }, (_, index) => ({
    index,
    key: 'partenza',
    date: addDays(trip.startDate, index),
    nightIndex: 0,
    legs: [],
    isArrivalDay: index === 0,
    isDepartureDay: index === n - 1,
    travelMin: 0,
    realisticTravelMin: 0,
    travelPartial: false,
    warnings: [],
  }));

  let d = 0;
  stops.forEach((stop, i) => {
    if (i > 0) {
      const leg = trip.legs.find((l) => l.fromStopId === stops[i - 1]!.id && l.toStopId === stop.id);
      if (leg) days[Math.min(d, n - 1)]!.legs.push(leg);
    }
    for (let k = 0; k < stop.nights; k++) {
      const day = days[d + k];
      if (day) {
        day.sleepStop = stop;
        day.nightIndex = k;
        day.key = dayKey(stop.id, k);
      }
      const next = days[d + k + 1];
      if (next) next.wakeStop = stop;
    }
    d += Math.max(0, stop.nights);
  });

  for (const day of days) {
    for (const leg of day.legs) {
      const t = legTotals(leg, trip.settings);
      day.travelMin += t.travelMin + t.waitMin;
      day.realisticTravelMin += t.realisticMin;
      if (t.partial) day.travelPartial = true;
    }
    if (day.realisticTravelMin > trip.settings.maxTravelMinPerDay) {
      day.warnings.push(
        `Giornata pesante: circa ${formatDuration(day.realisticTravelMin)} di trasferimenti con soste e attese (teorici ${formatDuration(day.travelMin)}; soglia ${formatDuration(trip.settings.maxTravelMinPerDay)}).`,
      );
    }
    if (day.travelPartial) day.warnings.push('Tempi di trasferimento incompleti: ci sono tratti non calcolati o senza durata.');
  }
  return days;
}

/**
 * Converte le giornate salvate con la vecchia chiave numerica (indice del giorno) nella chiave stabile
 * legata alla tappa. Le giornate che non trovano corrispondenza restano con la chiave originale: non si perde nulla.
 */
export function migrateDayKeys(trip: Trip): Trip {
  const numeric = Object.keys(trip.days).filter((k) => /^\d+$/.test(k));
  if (numeric.length === 0) return trip;
  const days = computeDays(trip);
  const next: Trip['days'] = {};
  for (const [k, v] of Object.entries(trip.days)) {
    if (!/^\d+$/.test(k)) {
      next[k] = v;
      continue;
    }
    const d = days[Number(k)];
    const nk = d ? d.key : `orfana-${k}`;
    const prev = next[nk];
    next[nk] = prev
      ? { activities: [...prev.activities, ...v.activities], notes: [prev.notes, v.notes].filter(Boolean).join('\n'), planB: [prev.planB, v.planB].filter(Boolean).join('\n') }
      : v;
  }
  return { ...trip, days: next };
}

/** Giornate salvate che non corrispondono più a nessun giorno dell'itinerario (es. tappa rimossa). */
export function orphanDayKeys(trip: Trip): string[] {
  const keys = new Set(computeDays(trip).map((d) => d.key));
  return Object.entries(trip.days)
    .filter(([k, v]) => !keys.has(k) && (v.activities.length > 0 || v.notes || v.planB))
    .map(([k]) => k);
}

export interface TripWarning {
  level: 'info' | 'attenzione';
  text: string;
}

export function tripWarnings(trip: Trip): TripWarning[] {
  const out: TripWarning[] = [];
  const n = totalDays(trip.stops);
  if (n > 0 && (n < TRIP_MIN_DAYS || n > TRIP_MAX_DAYS)) {
    out.push({ level: 'attenzione', text: `Il viaggio dura ${n} giorni: l'obiettivo è tra ${TRIP_MIN_DAYS} e ${TRIP_MAX_DAYS}.` });
  }
  const uncalculated = trip.legs.filter((l) => legTotals(l).hasUncalculated).length;
  if (uncalculated > 0) out.push({ level: 'attenzione', text: uncalculated === 1 ? '1 collegamento non ancora calcolato.' : `${uncalculated} collegamenti non ancora calcolati.` });

  const unverified = trip.legs.reduce((acc, l) => acc + legTotals(l).unverifiedCrossings, 0);
  if (unverified > 0) {
    out.push({
      level: 'info',
      text: `${unverified === 1 ? '1 traghetto o nave' : `${unverified} traghetti o navi`} con orari non confermati: verifica sul sito dell'operatore e segna lo stato come "Confermato".`,
    });
  }

  const mixed = trip.legs.filter((l) => legTotals(l).mixedModes).length;
  if (mixed > 0) {
    out.push({ level: 'attenzione', text: `${mixed === 1 ? '1 tratto somma' : `${mixed} tratti sommano`} strada e treno/nave/aereo: controlla che siano in sequenza e non alternative, altrimenti i tempi sono gonfiati.` });
  }
  const dupFerry = trip.legs.filter((l) => legTotals(l).possibleDuplicateFerry).length;
  if (dupFerry > 0) {
    out.push({ level: 'attenzione', text: `${dupFerry === 1 ? '1 tratto ha' : `${dupFerry} tratti hanno`} un traghetto calcolato e uno inserito a mano: probabile doppio conteggio.` });
  }

  const noBed = trip.stops.filter((s) => s.kind === 'luogo' && s.nights > 0 && !s.accommodationId).length;
  if (noBed > 0) out.push({ level: 'info', text: noBed === 1 ? '1 tappa con pernottamento senza alloggio associato.' : `${noBed} tappe con pernottamento senza alloggio associato.` });

  const family = trip.participants.adults + trip.participants.childrenAges.length;
  const small = trip.stops.filter((s) => {
    const a = trip.accommodations.find((x) => x.id === s.accommodationId);
    return a?.capacity !== undefined && a.capacity < family && s.nights > 0;
  }).length;
  if (small > 0) out.push({ level: 'attenzione', text: `${small === 1 ? '1 alloggio scelto ha' : `${small} alloggi scelti hanno`} meno posti letto delle ${family} persone.` });

  const unroutable = trip.legs.filter((l) => !isRoutableLeg(l, trip.stops) && l.segments.every((s) => s.mode === 'non_calcolato')).length;
  if (unroutable > 0) {
    out.push({ level: 'attenzione', text: `${unroutable === 1 ? '1 tratto verso o da una notte a bordo' : `${unroutable} tratti verso o da notti a bordo`} senza nave collegata: aggiungi l'opzione costiera al tratto.` });
  }

  let run = 0;
  let maxRun = 0;
  for (const s of trip.stops) {
    run = s.nights === 1 && s.kind === 'luogo' ? run + 1 : 0;
    maxRun = Math.max(maxRun, run);
  }
  if (maxRun >= 3) {
    out.push({ level: 'attenzione', text: `${maxRun} cambi di alloggio consecutivi da una sola notte: valuta di accorpare.` });
  }
  return out;
}

export function formatDuration(min: number): string {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r === 0 ? `${h} h` : `${h} h ${String(r).padStart(2, '0')}`;
}

export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const copy = arr.slice();
  const [it] = copy.splice(from, 1);
  copy.splice(to, 0, it as T);
  return copy;
}
