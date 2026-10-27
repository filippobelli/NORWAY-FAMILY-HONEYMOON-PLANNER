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

// Server Overpass. Il 27/10/2026 (prova dal PC di Filippo) overpass-api.de rispondeva 502 senza intestazioni CORS
// e i mirror private.coffee e kumi.systems andavano in timeout anche con una richiesta minima: tenerli in catena
// faceva aspettare 40 s prima dell'errore. Ora: Overpass con attesa breve, poi la ricerca Nominatim (stessi dati OSM).
export const OVERPASS_ENDPOINTS = ['https://overpass-api.de/api/interpreter'];
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

export type NearbySource = 'Overpass' | 'Nominatim';
export interface NearbyResult {
  places: NearbyPlace[];
  via: NearbySource;
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number, signal?: AbortSignal): Promise<Response> {
  if (signal?.aborted) throw new DOMException('Annullato', 'AbortError');
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), ms);
  const onAbort = () => timeout.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    return await fetch(url, { ...init, signal: timeout.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

async function viaOverpass(center: { lat: number; lng: number }, radiusKm: number, signal?: AbortSignal): Promise<NearbyPlace[]> {
  const r = Math.round(radiusKm * 1000);
  const query = `[out:json][timeout:25];(nwr["tourism"~"^(chalet|camp_site|guest_house|hostel|apartment)$"](around:${r},${center.lat},${center.lng}););out center tags 80;`;
  let lastError = '';
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetchWithTimeout(endpoint, { method: 'POST', body: new URLSearchParams({ data: query }) }, 12000, signal);
      if (!res.ok) {
        lastError = `errore ${res.status}`;
        continue;
      }
      return parseOverpass((await res.json()) as { elements?: OverpassEl[] }, center);
    } catch (e) {
      if (signal?.aborted) throw e;
      lastError = (e as Error).name === 'AbortError' ? 'tempo scaduto' : 'non raggiungibile';
    }
  }
  throw new Error(lastError);
}

interface NominatimEl {
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name?: string;
  category?: string;
  type?: string;
  extratags?: Record<string, string> | null;
}

/** Converte i risultati Nominatim nello stesso formato di Overpass, tenendo solo le strutture entro il raggio. */
export function parseNominatim(lists: NominatimEl[][], center: { lat: number; lng: number }, radiusKm: number): NearbyPlace[] {
  const els: OverpassEl[] = [];
  const seen = new Set<string>();
  for (const x of lists.flat()) {
    const key = `${x.osm_type}/${x.osm_id}`;
    if (seen.has(key) || x.category !== 'tourism' || !x.name) continue;
    const lat = Number(x.lat);
    const lng = Number(x.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || haversineKm(center, { lat, lng }) > radiusKm) continue;
    seen.add(key);
    els.push({ type: x.osm_type, id: x.osm_id, lat, lon: lng, tags: { ...(x.extratags ?? {}), name: x.name, tourism: x.type ?? 'altro' } });
  }
  return parseOverpass({ elements: els }, center);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function viaNominatim(center: { lat: number; lng: number }, radiusKm: number, signal?: AbortSignal): Promise<NearbyPlace[]> {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180));
  const viewbox = [center.lng - dLng, center.lat + dLat, center.lng + dLng, center.lat - dLat].map((n) => n.toFixed(4)).join(',');
  const lists: NominatimEl[][] = [];
  // Una richiesta al secondo, come chiede la policy d'uso di Nominatim.
  for (const [i, q] of ['chalet', 'camp site', 'guest house', 'hostel', 'apartment'].entries()) {
    if (i > 0) await sleep(1100);
    const url = `${NOMINATIM}?format=jsonv2&q=${encodeURIComponent(q)}&viewbox=${viewbox}&bounded=1&limit=40&extratags=1&accept-language=nb,en`;
    const res = await fetchWithTimeout(url, {}, 12000, signal);
    if (!res.ok) throw new Error(`errore ${res.status}`);
    lists.push((await res.json()) as NominatimEl[]);
  }
  return parseNominatim(lists, center, radiusKm);
}

export async function searchNearbyOsm(center: { lat: number; lng: number }, radiusKm: number, signal?: AbortSignal): Promise<NearbyResult> {
  let first = '';
  try {
    return { places: await viaOverpass(center, radiusKm, signal), via: 'Overpass' };
  } catch (e) {
    if (signal?.aborted) throw e;
    first = (e as Error).message;
  }
  try {
    return { places: await viaNominatim(center, radiusKm, signal), via: 'Nominatim' };
  } catch (e) {
    if (signal?.aborted) throw e;
    const second = (e as Error).name === 'AbortError' ? 'tempo scaduto' : (e as Error).message || 'non raggiungibile';
    throw new Error(
      `Ricerca su OpenStreetMap non disponibile in questo momento (Overpass: ${first}; Nominatim: ${second}). Riprova più tardi o usa i link di ricerca esterni.`,
    );
  }
}
