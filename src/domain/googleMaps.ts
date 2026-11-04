import type { Leg, Stop } from './types';

// Link "Apri in Google Maps" (Maps URLs, nessuna chiave API): l'app non usa dati Google,
// apre solo Google Maps con partenza e arrivo già impostati.

type LatLng = Pick<Stop, 'lat' | 'lng'>;

const ll = (p: LatLng) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;

export type GoogleTravelMode = 'driving' | 'transit';

/** Mezzi pubblici se il tratto contiene treno o bus, altrimenti auto (Google include i traghetti nel percorso in auto). */
export function googleModeForLeg(leg: Leg): GoogleTravelMode {
  return leg.segments.some((s) => s.mode === 'treno' || s.mode === 'bus') ? 'transit' : 'driving';
}

export function googleDirectionsUrl(from: LatLng, to: LatLng, mode: GoogleTravelMode = 'driving'): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${ll(from)}&destination=${ll(to)}&travelmode=${mode}`;
}

export function googlePlaceUrl(p: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${ll(p)}`;
}
