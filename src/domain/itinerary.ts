import { newId } from './ids';
import type { Leg, Segment, Stop, Trip } from './types';

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

export interface LegTotals {
  travelMin: number;
  waitMin: number;
  roadKm: number;
  ferryCount: number;
  hasUncalculated: boolean;
  /** true se almeno un segmento non ha la durata: il totale è parziale */
  partial: boolean;
}

export function legTotals(leg: Leg): LegTotals {
  let travelMin = 0;
  let waitMin = 0;
  let roadKm = 0;
  let ferryCount = 0;
  let hasUncalculated = false;
  let partial = false;
  for (const s of leg.segments) {
    if (s.mode === 'non_calcolato') {
      hasUncalculated = true;
      partial = true;
      continue;
    }
    if (s.durationMin === undefined) partial = true;
    travelMin += s.durationMin ?? 0;
    waitMin += s.waitMin ?? 0;
    if (s.mode === 'strada') roadKm += s.distanceKm ?? 0;
    if (s.mode === 'traghetto') ferryCount += 1;
  }
  return { travelMin, waitMin, roadKm, ferryCount, hasUncalculated, partial };
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
  date: string;
  /** Dove si dorme la notte di questo giorno (assente l'ultimo giorno) */
  sleepStop?: Stop;
  /** Tappa in cui ci si trova al mattino */
  wakeStop?: Stop;
  legs: Leg[];
  isArrivalDay: boolean;
  isDepartureDay: boolean;
  travelMin: number;
  travelPartial: boolean;
  warnings: string[];
}

export function totalDays(stops: Stop[]): number {
  if (stops.length === 0) return 0;
  return stops.reduce((acc, s) => acc + Math.max(0, s.nights), 0) + 1;
}

export function computeDays(trip: Trip): DayInfo[] {
  const { stops } = trip;
  const n = totalDays(stops);
  if (n === 0) return [];
  const days: DayInfo[] = Array.from({ length: n }, (_, index) => ({
    index,
    date: addDays(trip.startDate, index),
    legs: [],
    isArrivalDay: index === 0,
    isDepartureDay: index === n - 1,
    travelMin: 0,
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
      if (day) day.sleepStop = stop;
      const next = days[d + k + 1];
      if (next) next.wakeStop = stop;
    }
    d += Math.max(0, stop.nights);
  });

  for (const day of days) {
    for (const leg of day.legs) {
      const t = legTotals(leg);
      day.travelMin += t.travelMin + t.waitMin;
      if (t.partial) day.travelPartial = true;
    }
    if (day.travelMin > trip.settings.maxTravelMinPerDay) {
      day.warnings.push(
        `Giornata pesante: ${formatDuration(day.travelMin)} di trasferimenti (soglia ${formatDuration(trip.settings.maxTravelMinPerDay)}).`,
      );
    }
    if (day.travelPartial) day.warnings.push('Tempi di trasferimento incompleti: ci sono tratti non calcolati o senza durata.');
  }
  return days;
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

  const ferriesNoTime = trip.legs.flatMap((l) => l.segments).filter((s) => s.mode === 'traghetto' && !s.departureTime).length;
  if (ferriesNoTime > 0) {
    out.push({ level: 'info', text: `${ferriesNoTime === 1 ? '1 traghetto' : `${ferriesNoTime} traghetti`} senza orario verificato: controlla gli orari dell'operatore.` });
  }

  const noBed = trip.stops.filter((s) => s.kind === 'luogo' && s.nights > 0 && !s.accommodationId).length;
  if (noBed > 0) out.push({ level: 'info', text: noBed === 1 ? '1 tappa con pernottamento senza alloggio associato.' : `${noBed} tappe con pernottamento senza alloggio associato.` });

  let run = 0;
  let maxRun = 0;
  for (const s of trip.stops) {
    run = s.nights === 1 ? run + 1 : 0;
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
