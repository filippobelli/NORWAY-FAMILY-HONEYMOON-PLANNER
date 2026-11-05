import { estDriveHours } from './configurator';
import { addDays, computeDays, isRoutableLeg, legTotals, totalDays, totalNights, TRIP_MAX_DAYS, TRIP_MIN_DAYS } from './itinerary';
import type { Leg, Trip } from './types';

// Revisione di una proposta automatica prima di attivarla. Tre gradi di affidabilità, sempre dichiarati:
// - calcolato: percorso stradale ottenuto dal servizio di percorsi (i tempi restano teorici più le soste ipotizzate);
// - stimato: linea d'aria × fattore di tortuosità, usata solo per scegliere l'ordine delle tappe;
// - da verificare: treni, navi, voli o tratti senza durata nota: nessun tempo viene inventato.

export type TransferKind = 'calcolato' | 'stimato' | 'da_verificare';

export const TRANSFER_KIND_LABEL: Record<TransferKind, string> = {
  calcolato: 'Calcolato',
  stimato: 'Stima di massima',
  da_verificare: 'Da verificare',
};

export interface ProposalTransfer {
  legId: string;
  from: string;
  to: string;
  kind: TransferKind;
  /** Minuti: realistici se calcolato, stima di massima se stimato, assente se non noti */
  minutes?: number;
  roadKm?: number;
  /** Mezzi diversi dalla strada (treno, nave, traghetto…) con i loro nomi */
  labels: string[];
}

export interface LimitViolation {
  dayIndex: number;
  from: string;
  to: string;
  minutes: number;
  /** calcolato se tutti i tratti del giorno sono calcolati, altrimenti almeno in parte stimato */
  kind: 'calcolato' | 'stimato';
}

export interface ProposalCrossing {
  legId: string;
  label: string;
  from: string;
  to: string;
  departureTime?: string;
}

export interface ProposalReview {
  start?: string;
  end?: string;
  days: number;
  nights: number;
  inTarget: boolean;
  stops: { id: string; name: string; nights: number; aboard: boolean; activities: string[] }[];
  transfers: ProposalTransfer[];
  counts: Record<TransferKind, number>;
  /** Limite con cui sono state controllate le giornate, in minuti */
  limitMin: number;
  violations: LimitViolation[];
  /** Tappe con pernottamento senza alloggio scelto */
  lodgingMissing: string[];
  crossings: ProposalCrossing[];
  activities: number;
  /** Cose da completare dopo l'attivazione, generate dai dati */
  toComplete: string[];
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function legMinutes(leg: Leg, trip: Trip): { kind: TransferKind; minutes?: number; roadKm?: number } {
  const t = legTotals(leg, trip.settings);
  if (t.hasUncalculated) {
    const a = trip.stops.find((s) => s.id === leg.fromStopId);
    const b = trip.stops.find((s) => s.id === leg.toStopId);
    if (a && b && isRoutableLeg(leg, trip.stops)) return { kind: 'stimato', minutes: Math.round(estDriveHours(a, b) * 60) };
    return { kind: 'da_verificare' };
  }
  if (t.partial) return { kind: 'da_verificare' };
  return { kind: 'calcolato', minutes: t.realisticMin, roadKm: t.roadKm > 0 ? Math.round(t.roadKm) : undefined };
}

export function reviewProposal(trip: Trip, limitMin = trip.settings.maxTravelMinPerDay): ProposalReview {
  const n = totalDays(trip.stops);
  const days = computeDays(trip);
  const nameOf = (id: string) => trip.stops.find((s) => s.id === id)?.name ?? '—';

  const stops = trip.stops.map((s) => ({
    id: s.id,
    name: s.name,
    nights: s.nights,
    aboard: s.kind === 'a_bordo',
    activities: Object.entries(trip.days)
      .filter(([k]) => k.startsWith(`${s.id}#`))
      .flatMap(([, d]) => d.activities.map((a) => a.title || 'Attività')),
  }));

  const transfers: ProposalTransfer[] = trip.legs.map((leg) => ({
    legId: leg.id,
    from: nameOf(leg.fromStopId),
    to: nameOf(leg.toStopId),
    ...legMinutes(leg, trip),
    labels: leg.segments.filter((s) => s.mode !== 'strada' && s.mode !== 'non_calcolato').map((s) => s.label),
  }));
  const counts: Record<TransferKind, number> = { calcolato: 0, stimato: 0, da_verificare: 0 };
  for (const t of transfers) counts[t.kind] += 1;

  // Il limite vale per la giornata: più tratti nello stesso giorno si sommano. I tempi non noti non si contano
  const byLeg = new Map(transfers.map((t) => [t.legId, t]));
  const violations: LimitViolation[] = [];
  for (const d of days) {
    const list = d.legs.map((l) => byLeg.get(l.id)).filter((t): t is ProposalTransfer => Boolean(t));
    const minutes = list.reduce((sum, t) => sum + (t.minutes ?? 0), 0);
    if (list.length > 0 && minutes > limitMin) {
      violations.push({ dayIndex: d.index, from: list[0]!.from, to: list[list.length - 1]!.to, minutes, kind: list.every((t) => t.kind === 'calcolato') ? 'calcolato' : 'stimato' });
    }
  }

  const lodgingMissing = trip.stops.filter((s) => s.kind === 'luogo' && s.nights > 0 && !s.accommodationId).map((s) => s.name);

  const crossings: ProposalCrossing[] = [];
  for (const leg of trip.legs) {
    for (const s of leg.segments) {
      if (s.mode === 'strada' || s.mode === 'non_calcolato' || ['confermato', 'prenotato', 'pagato'].includes(s.status)) continue;
      crossings.push({ legId: leg.id, label: s.label, from: nameOf(leg.fromStopId), to: nameOf(leg.toStopId), departureTime: s.departureTime });
    }
  }

  const activities = stops.reduce((sum, s) => sum + s.activities.length, 0);
  const toComplete: string[] = [];
  if (counts.stimato > 0) toComplete.push(`Calcolare ${plural(counts.stimato, 'trasferimento', 'trasferimenti')} ancora stimati`);
  if (lodgingMissing.length > 0) toComplete.push(`Scegliere l'alloggio per ${plural(lodgingMissing.length, 'tappa', 'tappe')}`);
  if (crossings.length > 0) toComplete.push(`Verificare orari e stato di ${plural(crossings.length, 'traghetto, nave o altro mezzo', 'traghetti, navi o altri mezzi')}`);
  if (activities > 0) toComplete.push(`Controllare ${plural(activities, 'attività proposta', 'attività proposte')}: durate indicative, orari e prezzi da verificare`);

  return {
    start: n > 0 ? trip.startDate : undefined,
    end: n > 0 ? addDays(trip.startDate, n - 1) : undefined,
    days: n,
    nights: totalNights(trip.stops),
    inTarget: n >= TRIP_MIN_DAYS && n <= TRIP_MAX_DAYS,
    stops,
    transfers,
    counts,
    limitMin,
    violations,
    lodgingMissing,
    crossings,
    activities,
    toComplete,
  };
}
