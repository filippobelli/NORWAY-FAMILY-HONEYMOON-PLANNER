import { DESTINATIONS } from '../data/destinations';
import { airKm } from './configurator';
import { computeDays, syncLegs, totalDays } from './itinerary';
import { newId } from './ids';
import type { Leg, Stop, Trip } from './types';

// Tappe intermedie per spezzare un trasferimento lungo. Sono BOZZE: si calcolano su una copia del viaggio e
// non cambiano nulla finché l'utente non conferma. Si propongono solo luoghi del catalogo vicini al tracciato
// stradale calcolato: senza tracciato non si indovina dove passi la strada.

export type NightsFrom = 'aggiungi' | 'dalla_destinazione';

export interface BreakCandidate {
  destinationId: string;
  name: string;
  /** Distanza in linea d'aria dal tracciato, solo per ordinare le proposte */
  offRouteKm: number;
  /** Posizione lungo il tracciato (0 = partenza, 1 = arrivo) */
  along: number;
}

export interface BreakOptions {
  candidates: BreakCandidate[];
  /** Perché non ci sono proposte, se non ci sono */
  limit?: string;
}

const SLEEP_CATEGORIES = new Set(['citta', 'isole']);

export function breakCandidates(trip: Trip, legId: string, maxKm = 20): BreakOptions {
  const leg = trip.legs.find((l) => l.id === legId);
  if (!leg) return { candidates: [], limit: 'Tratto non trovato.' };
  const pts = leg.segments.filter((s) => s.mode === 'strada').flatMap((s) => s.geometry ?? []);
  if (pts.length < 10) return { candidates: [], limit: 'Il tratto non ha ancora un tracciato stradale calcolato: calcolalo per ricevere proposte lungo la strada, oppure aggiungi una tappa a mano.' };
  const used = new Set(trip.stops.map((s) => s.destinationId).filter(Boolean));
  const out: BreakCandidate[] = [];
  for (const d of DESTINATIONS) {
    if (used.has(d.id) || !SLEEP_CATEGORIES.has(d.category) || d.kidScore < 2) continue;
    let best = Infinity;
    let at = 0;
    pts.forEach(([lat, lng], i) => {
      const km = airKm({ lat, lng }, d);
      if (km < best) {
        best = km;
        at = i / (pts.length - 1);
      }
    });
    // Solo nella parte centrale del tragitto: vicino a partenza o arrivo non spezza nulla
    if (best <= maxKm && at > 0.2 && at < 0.8) out.push({ destinationId: d.id, name: d.name, offRouteKm: Math.round(best), along: at });
  }
  out.sort((a, b) => Math.abs(a.along - 0.5) - Math.abs(b.along - 0.5));
  return out.length ? { candidates: out.slice(0, 5) } : { candidates: [], limit: 'Nessun luogo del catalogo adatto per dormire con bambini è vicino a questo tracciato. Puoi aggiungere un luogo personalizzato a mano.' };
}

/** Bozza con la tappa intermedia: una notte in più al viaggio, oppure presa dalla tappa di arrivo se ne ha più di una. */
export function draftBreak(trip: Trip, legId: string, destinationId: string, nights: NightsFrom): Trip {
  const leg = trip.legs.find((l) => l.id === legId);
  const d = DESTINATIONS.find((x) => x.id === destinationId);
  if (!leg || !d) return trip;
  const idx = trip.stops.findIndex((s) => s.id === leg.toStopId);
  if (idx < 0) return trip;
  const stop: Stop = { id: newId(), kind: 'luogo', destinationId: d.id, name: d.name, lat: d.lat, lng: d.lng, nights: 1, notes: '', weatherPlanB: '' };
  const stops = trip.stops.slice();
  if (nights === 'dalla_destinazione') {
    const dest = stops[idx]!;
    if (dest.nights > 1) stops[idx] = { ...dest, nights: dest.nights - 1 };
  }
  stops.splice(idx, 0, stop);
  return { ...trip, stops, legs: syncLegs(stops, trip.legs) };
}

/** Si può prendere la notte dalla tappa di arrivo? */
export function canTakeNight(trip: Trip, legId: string): boolean {
  const leg = trip.legs.find((l) => l.id === legId);
  const to = trip.stops.find((s) => s.id === leg?.toStopId);
  return Boolean(to && to.kind === 'luogo' && to.nights > 1);
}

/** Tratti nuovi della bozza, ancora da calcolare. */
export const newLegs = (before: Trip, after: Trip): Leg[] => after.legs.filter((l) => !before.legs.some((b) => b.fromStopId === l.fromStopId && b.toStopId === l.toStopId));

export const daysDelta = (before: Trip, after: Trip) => totalDays(after.stops) - totalDays(before.stops);
export const dayOfLeg = (trip: Trip, legId: string) => computeDays(trip).find((d) => d.legs.some((l) => l.id === legId));
