import { newId } from './ids';
import type { Trip } from './types';

export function createEmptyTrip(): Trip {
  return {
    schemaVersion: 1,
    id: newId(),
    title: 'Norvegia, agosto 2027',
    // Data provvisoria: modificabile, segnalata come non decisa.
    startDate: '2027-08-01',
    dateTentative: true,
    participants: { adults: 2, childrenAges: [8, 5] },
    stops: [],
    legs: [],
    days: {},
    coastalOptions: [],
    accommodations: [],
    budgetItems: [],
    favorites: [],
    settings: {
      nokPerEur: 11.8,
      nokRateNote: 'Cambio indicativo di fine ottobre 2026 (circa 11,8 NOK per 1 EUR). Da aggiornare prima dei pagamenti.',
      maxTravelMinPerDay: 240,
      fuelEurPerKm: undefined,
      showCatalogOnMap: true,
    },
    updatedAt: new Date().toISOString(),
  };
}

/** Normalizza un documento caricato (locale, file o cloud) senza perdere campi sconosciuti. */
export function normalizeTrip(raw: unknown): Trip {
  if (!raw || typeof raw !== 'object') throw new Error('Documento non valido');
  const t = raw as Partial<Trip>;
  if (t.schemaVersion !== 1) throw new Error('Versione del documento non supportata');
  const base = createEmptyTrip();
  return {
    ...base,
    ...t,
    participants: { ...base.participants, ...(t.participants ?? {}) },
    settings: { ...base.settings, ...(t.settings ?? {}) },
    stops: t.stops ?? [],
    legs: t.legs ?? [],
    days: t.days ?? {},
    coastalOptions: t.coastalOptions ?? [],
    accommodations: t.accommodations ?? [],
    budgetItems: t.budgetItems ?? [],
    favorites: t.favorites ?? [],
  } as Trip;
}
