import type { Stop, Trip, TripCountry } from './types';

// Nazioni del viaggio. I viaggi salvati prima del catalogo per nazione non hanno `countries`: per loro vale la
// Norvegia con la versione 1 del catalogo, generata dagli stessi file su cui il viaggio è stato costruito
// (architettura §3, «v2to3»). È una regola di lettura dei viaggi vecchi, non una nazione predefinita per i nuovi.

export const LEGACY_COUNTRY: TripCountry = { code: 'NO', releaseId: 'NO-1' };

/** Nazioni del viaggio, nell'ordine di aggiunta */
export function tripCountries(t: Pick<Trip, 'countries'>): TripCountry[] {
  return Array.isArray(t.countries) ? t.countries : [{ ...LEGACY_COUNTRY }];
}

/** Rende esplicite le nazioni di un viaggio vecchio (passaggio alle righe): nessun altro campo cambia */
export function ensureCountries(t: Trip): Trip {
  return Array.isArray(t.countries) ? t : { ...t, countries: [{ ...LEGACY_COUNTRY }] };
}

/** Nazione proposta per una tappa senza luogo del catalogo (D4): la prima del viaggio */
export function defaultCountry(t: Pick<Trip, 'countries'>): string | undefined {
  return tripCountries(t)[0]?.code;
}

/** Nazione di un luogo del catalogo in uso (fornita da chi chiama: il dominio non legge il catalogo da solo) */
export type PlaceCountryOf = (placeKey: string | undefined) => string | undefined;

/** Nazione di una tappa (D4): scelta esplicita, poi luogo del catalogo, poi la prima nazione del viaggio */
export function stopCountry(t: Pick<Trip, 'countries'>, s: Stop, placeCountry: PlaceCountryOf): string | undefined {
  return s.countryCode ?? placeCountry(s.destinationId) ?? defaultCountry(t);
}

export interface CountryUsage {
  stops: Stop[];
  ideas: number;
  favorites: number;
  activities: number;
  coastal: number;
  flights: number;
}

/**
 * Cosa usa una nazione nel viaggio (UC3): tappe, idee e preferiti del suo catalogo, attività pianificate,
 * opzioni di crociera del suo catalogo, voli con un aeroporto della nazione.
 */
export function countryUsage(t: Trip, code: string, placeCountry: PlaceCountryOf, opts: { voyageKeys?: Set<string>; airportCodes?: Set<string> } = {}): CountryUsage {
  const inCountry = (k?: string) => Boolean(k) && placeCountry(k) === code;
  const stops = t.stops.filter((s) => stopCountry(t, s, placeCountry) === code);
  const ideas = t.stops.reduce((n, s) => n + (s.ideas ?? []).filter((i) => inCountry(i)).length, 0);
  const favorites = t.favorites.filter((f) => inCountry(f)).length;
  const activities = Object.values(t.days).reduce((n, d) => n + d.activities.filter((a) => inCountry(a.destinationId)).length, 0);
  const coastal = t.coastalOptions.filter((o) => o.catalogId && opts.voyageKeys?.has(o.catalogId)).length;
  const air = opts.airportCodes ?? new Set<string>();
  const flights = (t.flights ?? []).filter((f) => air.has(f.fromAirport.toUpperCase()) || air.has(f.toAirport.toUpperCase())).length;
  return { stops, ideas, favorites, activities, coastal, flights };
}

export const usageEmpty = (u: CountryUsage) => !u.stops.length && !u.ideas && !u.favorites && !u.activities && !u.coastal && !u.flights;

/** Aggiunge una nazione con la versione del catalogo scelta (ordine: in fondo) */
export function addCountry(t: Trip, code: string, releaseId: string): Trip {
  const list = tripCountries(t);
  if (list.some((c) => c.code === code)) return t;
  return { ...t, countries: [...list, { code, releaseId }] };
}

/**
 * Toglie una nazione (D3, dubbio 1 del design): le sue tappe si tolgono con le regole di sempre (attività e note
 * restano senza giornata, si può annullare); idee, preferiti, voli e crociere restano salvati. L'ultima non si toglie.
 */
export function removeCountry(t: Trip, code: string, stopIds: string[], removeStops: (t: Trip, ids: string[]) => Trip): Trip {
  const list = tripCountries(t);
  if (list.length <= 1 || !list.some((c) => c.code === code)) return t;
  const next = stopIds.length ? removeStops(t, stopIds) : t;
  return { ...next, countries: list.filter((c) => c.code !== code) };
}

/** Numero di versione da un id del catalogo («NO-2» → 2); undefined se non si legge */
export function releaseVersion(releaseId: string | undefined): number | undefined {
  const m = releaseId?.match(/-(\d+)$/);
  return m ? Number(m[1]) : undefined;
}

/**
 * Cambia la versione del catalogo di una nazione (architettura §16.3), solo su richiesta esplicita dell'utente.
 * Nulla si perde: la nuova versione contiene la vecchia (stesse chiavi). Tappe, idee, preferiti, attività e tratti
 * restano come sono; un viaggio senza `countries` li rende espliciti. Il ritorno alla versione precedente è la
 * stessa funzione.
 */
export function upgradeCatalog(t: Trip, code: string, releaseId: string): Trip {
  const list = tripCountries(t);
  if (!list.some((c) => c.code === code)) return t;
  return { ...t, countries: list.map((c) => (c.code === code ? { ...c, releaseId } : c)) };
}
