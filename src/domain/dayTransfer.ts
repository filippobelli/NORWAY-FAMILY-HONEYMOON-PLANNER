import { estDriveHours } from './configurator';
import { computeDays, isRoutableLeg, legTotals, type DayInfo } from './itinerary';
import type { Leg, Segment, Trip } from './types';
import { segmentInfo } from './verification';

// Tempi dei trasferimenti con la loro affidabilità, giornata per giornata.
// Regole: un tempo mancante non vale zero; se i tempi noti superano già il limite la giornata è oltre il limite
// anche con tratti sconosciuti; altrimenti, se manca qualcosa, la giornata è «non verificabile».

export type TimingKind = 'calcolato' | 'stimato' | 'da_verificare' | 'non_disponibile';

export const TIMING_LABEL: Record<TimingKind, string> = {
  calcolato: 'Calcolato',
  stimato: 'Stima',
  da_verificare: 'Da verificare',
  non_disponibile: 'Non disponibile',
};

export const TIMING_HELP: Record<TimingKind, string> = {
  calcolato: 'percorso stradale dal servizio OSRM, con le soste ipotizzate',
  stimato: 'tempo inserito a mano o stima di massima, non controllato',
  da_verificare: "durata nota ma orario non controllato sul sito dell'operatore",
  non_disponibile: 'nessun tempo: il tratto non è calcolato o manca la durata',
};

/** Affidabilità del tempo di un segmento. */
export function segmentTiming(s: Segment, trip: Trip): TimingKind {
  if (s.mode === 'non_calcolato' || s.durationMin === undefined) return 'non_disponibile';
  if (s.mode === 'strada') return s.source?.label.includes('OSRM') ? 'calcolato' : 'stimato';
  const info = segmentInfo(s, trip.settings);
  return info?.state === 'verificata' ? 'calcolato' : 'da_verificare';
}

const RANK: Record<TimingKind, number> = { calcolato: 0, stimato: 1, da_verificare: 2, non_disponibile: 3 };

export interface LegTiming {
  legId: string;
  from: string;
  to: string;
  /** La parte meno affidabile del tratto */
  kind: TimingKind;
  /** Minuti realistici delle parti note (soste e attese ipotizzate comprese) */
  knownMin: number;
  /** true se manca almeno una durata */
  missing: boolean;
  /** Perché il tempo manca, se manca */
  reason?: string;
  /** Stima di massima in linea d'aria, solo per i tratti stradali non calcolati: non entra mai nei totali */
  roughMin?: number;
}

export function legTiming(leg: Leg, trip: Trip): LegTiming {
  const nameOf = (id: string) => trip.stops.find((s) => s.id === id)?.name ?? '—';
  const t = legTotals(leg, trip.settings);
  let kind: TimingKind = 'calcolato';
  for (const s of leg.segments) if (RANK[segmentTiming(s, trip)] > RANK[kind]) kind = segmentTiming(s, trip);
  if (leg.segments.length === 0) kind = 'non_disponibile';
  const routable = isRoutableLeg(leg, trip.stops);
  const a = trip.stops.find((s) => s.id === leg.fromStopId);
  const b = trip.stops.find((s) => s.id === leg.toStopId);
  const missing = t.partial || leg.segments.length === 0;
  const reason = !missing
    ? undefined
    : t.hasUncalculated
      ? routable
        ? leg.routingError
          ? `calcolo non riuscito (${leg.routingError.replace(/\.$/, '')})`
          : 'percorso non ancora calcolato'
        : 'nave non collegata'
      : 'durata di un mezzo non inserita';
  return {
    legId: leg.id,
    from: nameOf(leg.fromStopId),
    to: nameOf(leg.toStopId),
    kind,
    knownMin: t.realisticMin,
    missing,
    reason,
    roughMin: t.hasUncalculated && routable && a && b ? Math.round(estDriveHours(a, b) * 60) : undefined,
  };
}

export type DayTransferState = 'nessuno' | 'entro' | 'oltre' | 'non_verificabile';

export const DAY_STATE_LABEL: Record<DayTransferState, string> = {
  nessuno: 'Nessun trasferimento',
  entro: 'Entro il limite',
  oltre: 'Oltre il limite',
  non_verificabile: 'Non verificabile',
};

export interface DayTransfer {
  dayIndex: number;
  dayKey: string;
  state: DayTransferState;
  knownMin: number;
  limitMin: number;
  legs: LegTiming[];
  /** Tratti senza tempo attendibile */
  missing: LegTiming[];
  /** La parte meno affidabile tra i tratti con tempo */
  kind?: TimingKind;
}

export function dayTransfer(trip: Trip, day: DayInfo, limitMin = trip.settings.maxTravelMinPerDay): DayTransfer {
  const legs = day.legs.map((l) => legTiming(l, trip));
  const knownMin = legs.reduce((sum, l) => sum + l.knownMin, 0);
  const missing = legs.filter((l) => l.missing);
  const state: DayTransferState = legs.length === 0 ? 'nessuno' : knownMin > limitMin ? 'oltre' : missing.length > 0 ? 'non_verificabile' : 'entro';
  let kind: TimingKind | undefined;
  for (const l of legs) if (!l.missing && (!kind || RANK[l.kind] > RANK[kind])) kind = l.kind;
  return { dayIndex: day.index, dayKey: day.key, state, knownMin, limitMin, legs, missing, kind };
}

export function dayTransfers(trip: Trip, days: DayInfo[] = computeDays(trip)): DayTransfer[] {
  return days.map((d) => dayTransfer(trip, d));
}

/** Testo breve per i tratti mancanti, senza ripetere lo stesso collegamento. */
export function missingText(missing: LegTiming[]): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const m of missing) {
    const k = `${m.from}→${m.to}`;
    if (seen.has(k)) continue;
    seen.add(k);
    parts.push(`${m.from} → ${m.to}: ${m.reason ?? 'tempo mancante'}`);
  }
  return parts.join('; ');
}
