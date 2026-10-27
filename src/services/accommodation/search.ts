import { addDays } from '../../domain/itinerary';
import type { Participants } from '../../domain/types';

// Ricerca sistemazioni.
// 1) Link di ricerca esterni precompilati (nessuna disponibilità verificata dall'app).
// 2) Strutture vicine da OpenStreetMap via Overpass API (dati reali ma senza prezzi né disponibilità).

export interface ExternalSearchLink {
  provider: string;
  url: string;
  note: string;
}

export function externalSearchLinks(
  place: string,
  checkIn: string | undefined,
  nights: number,
  p: Participants,
): ExternalSearchLink[] {
  const q = encodeURIComponent(place);
  const checkOut = checkIn ? addDays(checkIn, Math.max(1, nights)) : undefined;
  const ages = p.childrenAges.map((a) => `&age=${a}`).join('');
  const booking =
    `https://www.booking.com/searchresults.html?ss=${q}&group_adults=${p.adults}&group_children=${p.childrenAges.length}${ages}` +
    (checkIn && checkOut ? `&checkin=${checkIn}&checkout=${checkOut}` : '');
  const airbnb =
    `https://www.airbnb.com/s/${q}/homes?adults=${p.adults}&children=${p.childrenAges.length}` +
    (checkIn && checkOut ? `&checkin=${checkIn}&checkout=${checkOut}` : '');
  return [
    { provider: 'Google Maps', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`hytte ${place}`)}`, note: 'Mappa e recensioni' },
    { provider: 'Booking.com', url: booking, note: 'Filtra per "chalet" / "case vacanza"' },
    { provider: 'Airbnb', url: airbnb, note: 'Cerca "cabin"' },
  ];
}

export interface NearbyPlace {
  osmId: string;
  name: string;
  kind: string;
  lat: number;
  lng: number;
  website?: string;
  phone?: string;
  distanceKm: number;
}

const KIND_LABEL: Record<string, string> = {
  chalet: 'Chalet / hytte',
  camp_site: 'Campeggio (spesso con hytter)',
  guest_house: 'Guest house',
  hostel: 'Ostello',
  apartment: 'Appartamento',
  hotel: 'Hotel',
};

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

interface OverpassEl {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export function parseOverpass(json: { elements?: OverpassEl[] }, center: { lat: number; lng: number }): NearbyPlace[] {
  const out: NearbyPlace[] = [];
  for (const el of json.elements ?? []) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    const tags = el.tags ?? {};
    if (lat === undefined || lng === undefined || !tags.name) continue;
    const kind = tags.tourism ?? 'altro';
    out.push({
      osmId: `${el.type}/${el.id}`,
      name: tags.name,
      kind: KIND_LABEL[kind] ?? kind,
      lat,
      lng,
      website: tags.website ?? tags['contact:website'],
      phone: tags.phone ?? tags['contact:phone'],
      distanceKm: Math.round(haversineKm(center, { lat, lng }) * 10) / 10,
    });
  }
  // Prima le hytte vere e proprie, poi i campeggi, poi il resto; a parità, la più vicina.
  const rank = (k: string) => (k.startsWith('Chalet') ? 0 : k.startsWith('Campeggio') ? 1 : 2);
  return out.sort((a, b) => rank(a.kind) - rank(b.kind) || a.distanceKm - b.distanceKm).slice(0, 40);
}

// Server Overpass pubblici, provati in ordine. Il 27/10/2026 il principale rispondeva 502 e i mirror
// andavano in timeout: il servizio è utile ma non affidabile, per questo l'errore rimanda ai link esterni.
export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export async function searchNearbyOsm(center: { lat: number; lng: number }, radiusKm: number, signal?: AbortSignal): Promise<NearbyPlace[]> {
  const r = Math.round(radiusKm * 1000);
  const query = `[out:json][timeout:25];(nwr["tourism"~"^(chalet|camp_site|guest_house|hostel|apartment)$"](around:${r},${center.lat},${center.lng}););out center tags 80;`;
  let lastError = '';
  for (const endpoint of OVERPASS_ENDPOINTS) {
    if (signal?.aborted) throw new DOMException('Annullato', 'AbortError');
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), 20000);
    const onAbort = () => timeout.abort();
    signal?.addEventListener('abort', onAbort);
    try {
      const res = await fetch(endpoint, { method: 'POST', body: new URLSearchParams({ data: query }), signal: timeout.signal });
      if (!res.ok) {
        lastError = `errore ${res.status}`;
        continue;
      }
      return parseOverpass((await res.json()) as { elements?: OverpassEl[] }, center);
    } catch (e) {
      if (signal?.aborted) throw e;
      lastError = (e as Error).name === 'AbortError' ? 'tempo scaduto' : 'non raggiungibile';
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }
  throw new Error(
    `Ricerca su OpenStreetMap non disponibile in questo momento (${lastError}). Riprova più tardi o usa i link di ricerca esterni.`,
  );
}
