import { computeBudget, type BudgetLine } from './budget';
import type { DayInfo } from './itinerary';
import type { Trip } from './types';

// Selezione dell'area di lavoro: identifica una tappa, un tratto o una giornata con id stabili, non con la posizione.

export type Selection = { kind: 'stop' | 'leg' | 'day'; id: string };

export function parseSelection(v: string | undefined): Selection | undefined {
  const m = /^(stop|leg|day):(.+)$/.exec(v ?? '');
  return m ? { kind: m[1] as Selection['kind'], id: m[2]! } : undefined;
}

export const formatSelection = (s: Selection | undefined) => (s ? `${s.kind}:${s.id}` : undefined);

/** La selezione esiste ancora? Dopo un riordino resta valida, dopo una rimozione no. */
export function selectionExists(trip: Trip, days: DayInfo[], s: Selection): boolean {
  if (s.kind === 'stop') return trip.stops.some((x) => x.id === s.id);
  if (s.kind === 'leg') return trip.legs.some((x) => x.id === s.id);
  return days.some((d) => d.key === s.id);
}

/** Tappa da evidenziare sulla mappa per la selezione corrente. */
export function selectionStopId(trip: Trip, days: DayInfo[], s: Selection | undefined): string | undefined {
  if (!s) return undefined;
  if (s.kind === 'stop') return s.id;
  if (s.kind === 'leg') return trip.legs.find((l) => l.id === s.id)?.toStopId;
  const d = days.find((x) => x.key === s.id);
  return (d?.sleepStop ?? d?.wakeStop)?.id;
}

/** Righe di budget che riguardano la selezione. Sono le stesse del Budget: nessun calcolo duplicato. */
export function selectionCosts(trip: Trip, s: Selection | undefined): BudgetLine[] {
  const lines = computeBudget(trip).lines;
  if (!s) return lines;
  if (s.kind === 'day') return lines.filter((l) => l.key.startsWith(`d-${s.id}-`));
  if (s.kind === 'stop') {
    const stop = trip.stops.find((x) => x.id === s.id);
    return lines.filter((l) => l.key === `e-lodging-${s.id}` || (stop?.accommodationId !== undefined && l.key === `a-${stop.accommodationId}`));
  }
  const leg = trip.legs.find((l) => l.id === s.id);
  const keys = new Set((leg?.segments ?? []).flatMap((x) => [`s-${x.id}`, ...(x.coastalOptionId ? [`c-${x.coastalOptionId}`] : []), ...(x.flightId ? [`f-${x.flightId}`] : [])]));
  return lines.filter((l) => keys.has(l.key));
}
