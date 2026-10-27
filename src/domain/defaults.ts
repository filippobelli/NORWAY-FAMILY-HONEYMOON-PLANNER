import { newId } from './ids';
import { DEFAULT_ASSUMPTIONS, migrateDayKeys } from './itinerary';
import { ensureScenarios } from './scenarios';
import type { Trip } from './types';

export function createEmptyTrip(): Trip {
  return ensureScenarios({
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
      ...DEFAULT_ASSUMPTIONS,
    },
    updatedAt: new Date().toISOString(),
  });
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Controlli strutturali minimi: un file importato rotto non deve mandare in errore l'app. */
export function validateTripShape(t: Partial<Trip>): string[] {
  const errors: string[] = [];
  if (typeof t.id !== 'string' || !t.id) errors.push('identificativo mancante');
  if (t.startDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(t.startDate))) errors.push('data di partenza non valida');
  if (t.stops !== undefined && !Array.isArray(t.stops)) errors.push('tappe non valide');
  (Array.isArray(t.stops) ? t.stops : []).forEach((s, i) => {
    if (!s || typeof s.id !== 'string') errors.push(`tappa ${i + 1}: identificativo mancante`);
    else if (!isNum(s.lat) || !isNum(s.lng) || Math.abs(s.lat) > 90 || Math.abs(s.lng) > 180) errors.push(`tappa ${i + 1}: coordinate non valide`);
    else if (!isNum(s.nights) || s.nights < 0 || s.nights > 60) errors.push(`tappa ${i + 1}: numero di notti non valido`);
  });
  (Array.isArray(t.budgetItems) ? t.budgetItems : []).forEach((b, i) => {
    if (!b || !b.amount || !isNum(b.amount.amount)) errors.push(`voce di budget ${i + 1}: importo non valido`);
  });
  return errors;
}

/** Normalizza un documento caricato (locale, file o cloud) senza perdere campi sconosciuti. */
export function normalizeTrip(raw: unknown): Trip {
  if (!raw || typeof raw !== 'object') throw new Error('Documento non valido');
  const t = raw as Partial<Trip>;
  if (t.schemaVersion !== 1) throw new Error('Versione del documento non supportata');
  const errors = validateTripShape(t);
  if (errors.length) throw new Error(`Documento non valido: ${errors.slice(0, 3).join('; ')}`);
  const base = createEmptyTrip();
  const trip = {
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
  return ensureScenarios(migrateDayKeys(trip));
}
