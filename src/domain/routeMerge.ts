import type { Leg, Segment } from './types';

const AUTO_SOURCE = 'OSRM';

/** Segmento creato dal calcolo automatico (strada o traghetto rilevato da OSRM). */
export const isAutoSegment = (s: Segment): boolean =>
  (s.mode === 'strada' || s.mode === 'traghetto') && Boolean(s.source?.label.startsWith(AUTO_SOURCE));

/**
 * Sostituisce i segmenti automatici del tratto con quelli appena calcolati.
 * Mantiene i segmenti inseriti a mano (treno, nave, traghetti manuali) e riporta sui traghetti
 * ricalcolati i dati inseriti dall'utente (orario, attesa, costo).
 */
export function mergeRouted(leg: Leg, routed: Segment[]): Leg {
  const oldFerries = leg.segments.filter((s) => s.mode === 'traghetto' && isAutoSegment(s));
  const kept = leg.segments.filter((s) => s.mode !== 'non_calcolato' && !isAutoSegment(s));
  const fresh = routed.map((s) => {
    if (s.mode !== 'traghetto') return s;
    const prev = oldFerries.find((o) => o.label === s.label);
    return prev ? { ...s, departureTime: prev.departureTime, waitMin: prev.waitMin, cost: prev.cost, costStatus: prev.costStatus } : s;
  });
  return { ...leg, segments: [...fresh, ...kept], calculatedAt: new Date().toISOString(), routingError: undefined };
}
