import { normalizeTrip } from '../../domain/defaults';
import type { Trip } from '../../domain/types';

const KEY = 'nfhp.trip.v1';
const BACKUP_KEY = 'nfhp.trip.v1.backup';

export interface LocalLoadResult {
  trip?: Trip;
  error?: string;
}

export function loadLocalTrip(): LocalLoadResult {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return { trip: normalizeTrip(JSON.parse(raw)) };
  } catch (e) {
    return { error: `Dati locali non leggibili: ${(e as Error).message}. Nessun dato è stato cancellato.` };
  }
}

export function saveLocalTrip(trip: Trip): boolean {
  try {
    const prev = localStorage.getItem(KEY);
    if (prev) localStorage.setItem(BACKUP_KEY, prev);
    localStorage.setItem(KEY, JSON.stringify(trip));
    return true;
  } catch {
    return false;
  }
}

export function exportTripFile(trip: Trip): void {
  const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `norvegia-2027-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function readTripFile(file: File): Promise<Trip> {
  const text = await file.text();
  return normalizeTrip(JSON.parse(text));
}
