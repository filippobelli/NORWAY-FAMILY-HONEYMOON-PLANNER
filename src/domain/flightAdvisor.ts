import { DESTINATIONS } from '../data/destinations';
import { AIRPORT_RADIUS_KM, airKm } from './configurator';
import { addDays, computeDays, legTotals, totalDays } from './itinerary';
import type { Stop, Trip } from './types';

// Suggerimenti di tratte aeree ricavati dalle tappe. Non conosce prezzi, orari né voli diretti:
// indica gli aeroporti più vicini (in linea d'aria) e dove un volo interno può evitare un trasferimento lungo.
// Prezzi e collegamenti si verificano con i link di ricerca.

/** Partenza dall'Italia indicata da Filippo il 28/10/2026: Bari preferita, al massimo Roma. Modificabile nella sezione Voli. */
export const DEFAULT_HOME_AIRPORTS = ['BRI', 'FCO'];

/** Principali aeroporti italiani (codice IATA e nome), per scegliere la partenza. */
export const ITALIAN_AIRPORTS: { code: string; name: string }[] = [
  { code: 'BRI', name: 'Bari' },
  { code: 'BDS', name: 'Brindisi' },
  { code: 'NAP', name: 'Napoli' },
  { code: 'FCO', name: 'Roma Fiumicino' },
  { code: 'CIA', name: 'Roma Ciampino' },
  { code: 'PSR', name: 'Pescara' },
  { code: 'BLQ', name: 'Bologna' },
  { code: 'PSA', name: 'Pisa' },
  { code: 'FLR', name: 'Firenze' },
  { code: 'VCE', name: 'Venezia' },
  { code: 'TSF', name: 'Treviso' },
  { code: 'VRN', name: 'Verona' },
  { code: 'BGY', name: 'Bergamo' },
  { code: 'MXP', name: 'Milano Malpensa' },
  { code: 'LIN', name: 'Milano Linate' },
  { code: 'TRN', name: 'Torino' },
  { code: 'GOA', name: 'Genova' },
  { code: 'CTA', name: 'Catania' },
  { code: 'PMO', name: 'Palermo' },
  { code: 'CAG', name: 'Cagliari' },
];

export interface NorwayAirport {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

/** Aeroporti norvegesi del catalogo: l'id della scheda è il codice IATA. */
export function norwayAirports(): NorwayAirport[] {
  return DESTINATIONS.filter((d) => d.category === 'aeroporti').map((d) => ({ code: d.id.toUpperCase(), name: d.name, lat: d.lat, lng: d.lng }));
}

export function airportLabel(code: string): string {
  const c = code.trim().toUpperCase();
  return ITALIAN_AIRPORTS.find((a) => a.code === c)?.name ?? norwayAirports().find((a) => a.code === c)?.name ?? c;
}

export interface AirportPick {
  code: string;
  name: string;
  /** Distanza in linea d'aria dalla tappa (non stradale); 0 se la tappa è l'aeroporto */
  airKm: number;
  /** La tappa è proprio questo aeroporto */
  isStop: boolean;
  /** Oltre il raggio usato anche dal configuratore (110 km): il trasferimento va valutato */
  far: boolean;
}

export interface EndpointAdvice {
  stop: Stop;
  date: string;
  /** Al più due aeroporti, il primo è il consigliato */
  options: AirportPick[];
}

export interface InternalAdvice {
  legId: string;
  from: Stop;
  to: Stop;
  fromAirport: AirportPick;
  toAirport: AirportPick;
  date: string;
  /** Trasferimento realistico calcolato (strada + traversate + soste) */
  realisticMin: number;
  /** Soglia usata: il doppio del massimo di guida giornaliero impostato */
  thresholdMin: number;
}

export interface FlightAdvice {
  home: string[];
  arrival?: EndpointAdvice;
  departure?: EndpointAdvice;
  /** Aeroporto consigliato di arrivo diverso da quello di ripartenza: conviene un biglietto multi-città */
  openJaw: boolean;
  internal: InternalAdvice[];
  /** Tratti già previsti in aereo nell'itinerario */
  plannedInternal: { from: Stop; to: Stop }[];
  /** Tratti da calcolare prima di poter valutare un volo interno */
  legsToCalculate: number;
}

function picksFor(stop: Stop): AirportPick[] {
  const all = norwayAirports();
  const own = stop.destinationId ? all.find((a) => a.code.toLowerCase() === stop.destinationId) : undefined;
  if (own) return [{ code: own.code, name: own.name, airKm: 0, isStop: true, far: false }];
  const byDistance = all
    .map((a) => ({ code: a.code, name: a.name, airKm: Math.round(airKm(stop, a)), isStop: false, far: false }))
    .sort((x, y) => x.airKm - y.airKm)
    .map((p) => ({ ...p, far: p.airKm > AIRPORT_RADIUS_KM }));
  const near = byDistance.filter((p) => !p.far).slice(0, 2);
  return near.length > 0 ? near : byDistance.slice(0, 1);
}

export function flightAdvice(trip: Trip): FlightAdvice {
  const home = trip.settings.homeAirports?.length ? trip.settings.homeAirports : DEFAULT_HOME_AIRPORTS;
  const n = totalDays(trip.stops);
  const advice: FlightAdvice = { home, openJaw: false, internal: [], plannedInternal: [], legsToCalculate: 0 };
  if (trip.stops.length === 0) return advice;

  const first = trip.stops[0]!;
  const last = trip.stops[trip.stops.length - 1]!;
  advice.arrival = { stop: first, date: trip.startDate, options: picksFor(first) };
  advice.departure = { stop: last, date: addDays(trip.startDate, Math.max(0, n - 1)), options: picksFor(last) };
  advice.openJaw = trip.stops.length > 1 && advice.arrival.options[0]?.code !== advice.departure.options[0]?.code;

  const days = computeDays(trip);
  const threshold = 2 * trip.settings.maxTravelMinPerDay;
  for (const leg of trip.legs) {
    const from = trip.stops.find((s) => s.id === leg.fromStopId);
    const to = trip.stops.find((s) => s.id === leg.toStopId);
    if (!from || !to) continue;
    if (leg.segments.some((s) => s.mode === 'aereo')) {
      advice.plannedInternal.push({ from, to });
      continue;
    }
    const t = legTotals(leg, trip.settings);
    if (t.partial) {
      advice.legsToCalculate += 1;
      continue;
    }
    if (t.realisticMin <= threshold) continue;
    const a = picksFor(from)[0];
    const b = picksFor(to)[0];
    if (!a || !b || a.far || b.far || a.code === b.code) continue;
    const day = days.find((d) => d.legs.some((l) => l.id === leg.id));
    advice.internal.push({ legId: leg.id, from, to, fromAirport: a, toAirport: b, date: day?.date ?? trip.startDate, realisticMin: t.realisticMin, thresholdMin: threshold });
  }
  return advice;
}
