import { airKm } from './configurator';
import type { Destination } from './types';

// Proposta di collegamento tra una tappa messa a mano e una scheda del catalogo.
// La distanza è in linea d'aria e serve SOLO a riconoscere lo stesso luogo: non è una distanza di viaggio.
// L'app propone; il collegamento lo conferma l'utente.

export interface PlaceMatch {
  dest: Destination;
  /** Distanza in linea d'aria tra il punto della tappa e la scheda, in km */
  km: number;
  /** Il nome della tappa e quello della scheda coincidono (senza accenti e maiuscole) */
  sameName: boolean;
}

/** Con lo stesso nome basta essere nella stessa zona; con un nome diverso il punto deve essere quasi lo stesso */
export const MATCH_KM_SAME_NAME = 8;
export const MATCH_KM_NEAR = 1;

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/å/g, 'a')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function sameName(stopName: string, d: Destination): boolean {
  const s = norm(stopName);
  if (!s) return false;
  const names = [d.name, d.localName ?? ''].map(norm).filter(Boolean);
  // «Ersfjord Beach» ↔ «Ersfjord (Senja)», «Rambergstranda» ↔ «Ramberg»: confronto sulla prima parola
  const first = (x: string) => x.split(' ')[0] ?? '';
  return names.some((n) => n === s || (first(n).length >= 4 && first(s).length >= 4 && (first(s).startsWith(first(n)) || first(n).startsWith(first(s)))));
}

// Ordine di preferenza: stesso nome e stesso punto; poi un'altra scheda nello stesso punto («Flakstadveien» messa
// a Ramberg è Ramberg, non la chiesa di Flakstad a 3 km); poi lo stesso nome nella zona.
const tier = (m: PlaceMatch) => (m.km <= MATCH_KM_NEAR ? (m.sameName ? 0 : 1) : 2);

/** La scheda del catalogo che con buona probabilità descrive la tappa, oppure nulla */
export function matchPlace(stop: { name: string; lat: number; lng: number }, destinations: Destination[]): PlaceMatch | undefined {
  let best: PlaceMatch | undefined;
  for (const d of destinations) {
    if (d.category === 'aeroporti' || d.category === 'stagionali') continue;
    const km = airKm(stop, d);
    if (km > MATCH_KM_SAME_NAME) continue;
    const same = sameName(stop.name, d);
    if (!same && km > MATCH_KM_NEAR) continue;
    const cand = { dest: d, km, sameName: same };
    if (!best || tier(cand) < tier(best) || (tier(cand) === tier(best) && km < best.km)) best = cand;
  }
  return best;
}
