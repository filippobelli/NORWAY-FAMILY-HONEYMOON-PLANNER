import { portsFor, type CoastalPort } from '../data/coastalPorts';
import type { CoastalOption, Money, TripSettings } from './types';

export interface CoastalRoute {
  ports: CoastalPort[];
  /** Numero di scali intermedi (esclusi imbarco e sbarco) */
  intermediateStops: number;
  valid: boolean;
  error?: string;
}

export function coastalRoute(direction: 'nord' | 'sud', from: string, to: string): CoastalRoute {
  const list = portsFor(direction);
  const a = list.findIndex((p) => p.name === from);
  const b = list.findIndex((p) => p.name === to);
  if (a < 0 || b < 0) return { ports: [], intermediateStops: 0, valid: false, error: 'Porto non servito in questa direzione' };
  if (a >= b) {
    return {
      ports: [],
      intermediateStops: 0,
      valid: false,
      error: `Con direzione ${direction} il porto di sbarco deve venire dopo quello di imbarco`,
    };
  }
  const ports = list.slice(a, b + 1);
  return { ports, intermediateStops: ports.length - 2, valid: true };
}

export function toEur(m: Money | undefined, settings: TripSettings): number {
  if (!m) return 0;
  return m.currency === 'EUR' ? m.amount : m.amount / settings.nokPerEur;
}

export function coastalTotalEur(o: CoastalOption, settings: TripSettings): number | undefined {
  if (!o.price) return undefined;
  return toEur(o.price, settings) + toEur(o.extras, settings);
}

/** Punteggio semplice di "valore per la famiglia" usato solo per ordinare il confronto. */
export function familyValueNotes(o: CoastalOption): string[] {
  const notes: string[] = [];
  if (o.nightsOnboard > 0 && !/cabin|cabina/i.test(o.cabin)) notes.push('Tratto notturno senza cabina indicata');
  if (o.durationHours !== undefined && o.durationHours > 23 && o.operator === 'Hurtigruten') {
    notes.push('Oltre 23 ore: con Hurtigruten la cabina è obbligatoria');
  }
  if (o.meals === 'da_definire') notes.push('Pasti da definire');
  if (o.priceStatus === 'da_verificare' || o.priceStatus === 'stimato') notes.push('Prezzo non confermato');
  if (o.withCar) notes.push('Con auto: verificare disponibilità posto auto nei porti scelti');
  return notes;
}
