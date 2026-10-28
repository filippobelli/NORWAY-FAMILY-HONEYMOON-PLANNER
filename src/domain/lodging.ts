import { toEur } from './coastal';
import { computeDays } from './itinerary';
import type { Accommodation, Currency, DataStatus, SourceRef, Stop, Trip } from './types';

// Confronto delle sistemazioni candidate per ogni tappa. Nessun dato inventato:
// prezzo totale solo se c'è il prezzo per notte, capienza solo se inserita, distanza solo in linea d'aria.

/**
 * Stato della decisione, derivato dai campi esistenti (nessun campo nuovo nel modello):
 * - da_verificare: individuata (es. da OpenStreetMap), disponibilità non controllata;
 * - valutata: disponibile per le date o opzionata;
 * - scelta: è l'alloggio associato alla tappa, ma non ancora prenotato;
 * - prenotata: stato «prenotata».
 */
export type LodgingDecision = 'da_verificare' | 'valutata' | 'scelta' | 'prenotata';

export interface LodgingOption {
  acc: Accommodation;
  decision: LodgingDecision;
  chosen: boolean;
  /** Prezzo per notte convertito in EUR */
  nightlyEur?: number;
  /** Notti × prezzo per notte + pulizia + biancheria; assente se manca il prezzo per notte */
  stayEur?: number;
  currency?: Currency;
  priceStatus: DataStatus;
  /** true = posti sufficienti, false = insufficienti, undefined = capienza non inserita */
  fitsFamily?: boolean;
  /** Distanza in linea d'aria dalla tappa (non è una distanza stradale) */
  airKmFromStop?: number;
  /** Differenza di costo del soggiorno rispetto all'alloggio scelto (se entrambi hanno il prezzo) */
  diffVsChosenEur?: number;
  source?: SourceRef;
  /** Informazioni che mancano per decidere */
  missing: string[];
}

export interface StopLodging {
  stop: Stop;
  checkIn?: string;
  nights: number;
  options: LodgingOption[];
  /** Nessuna sistemazione candidata: da cercare */
  toSearch: boolean;
}

function airKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function decisionFor(a: Accommodation, chosen: boolean): LodgingDecision {
  if (a.status === 'prenotata') return 'prenotata';
  if (chosen) return 'scelta';
  return a.status === 'individuata' ? 'da_verificare' : 'valutata';
}

/** Costo del soggiorno con le stesse regole del budget (alloggio scelto × notti + extra). */
export function stayCostEur(a: Accommodation, nights: number, trip: Trip): number | undefined {
  if (!a.pricePerNight) return undefined;
  return toEur(a.pricePerNight, trip.settings) * nights + toEur(a.cleaningFee, trip.settings) + toEur(a.linenFee, trip.settings);
}

export function lodgingComparison(trip: Trip): StopLodging[] {
  const days = computeDays(trip);
  const family = trip.participants.adults + trip.participants.childrenAges.length;
  return trip.stops
    .filter((s) => s.kind === 'luogo' && s.nights > 0)
    .map((stop) => {
      const candidates = trip.accommodations.filter((a) => a.stopId === stop.id || a.id === stop.accommodationId);
      const chosenAcc = candidates.find((a) => a.id === stop.accommodationId);
      const chosenStay = chosenAcc ? stayCostEur(chosenAcc, stop.nights, trip) : undefined;
      const options = candidates.map((acc): LodgingOption => {
        const chosen = acc.id === stop.accommodationId;
        const stayEur = stayCostEur(acc, stop.nights, trip);
        const missing: string[] = [];
        if (!acc.pricePerNight) missing.push('prezzo per notte');
        else if (acc.priceStatus === 'da_verificare') missing.push('prezzo da verificare');
        if (acc.capacity === undefined) missing.push('posti letto');
        if (acc.status === 'individuata') missing.push('disponibilità per le date');
        if (acc.lat === undefined || acc.lng === undefined) missing.push('posizione');
        if (!acc.url && !acc.source?.url) missing.push('link alla fonte');
        return {
          acc,
          chosen,
          decision: decisionFor(acc, chosen),
          nightlyEur: acc.pricePerNight ? toEur(acc.pricePerNight, trip.settings) : undefined,
          stayEur,
          currency: acc.pricePerNight?.currency,
          priceStatus: acc.priceStatus,
          fitsFamily: acc.capacity === undefined ? undefined : acc.capacity >= family,
          airKmFromStop: acc.lat !== undefined && acc.lng !== undefined ? Math.round(airKm(stop, { lat: acc.lat, lng: acc.lng }) * 10) / 10 : undefined,
          diffVsChosenEur: !chosen && stayEur !== undefined && chosenStay !== undefined ? stayEur - chosenStay : undefined,
          source: acc.source,
          missing,
        };
      });
      // La scelta per prima, poi le altre nell'ordine in cui sono state inserite: nessun ordinamento per prezzo
      options.sort((x, y) => Number(y.chosen) - Number(x.chosen));
      return { stop, checkIn: days.find((d) => d.sleepStop?.id === stop.id)?.date, nights: stop.nights, options, toSearch: options.length === 0 };
    });
}
