import { normalizeTrip } from '../../domain/defaults';
import { FutureSchemaError } from '../../domain/migrations';
import type { Trip } from '../../domain/types';

const KEY = 'nfhp.trip.v1';
const BACKUP_KEY = 'nfhp.trip.v1.backup';
const QUARANTINE_KEY = 'nfhp.trip.v1.illeggibile';

export interface LocalLoadResult {
  trip?: Trip;
  error?: string;
  /** Documento di una versione più recente dell'app: non va sovrascritto */
  readOnly?: boolean;
}

export function loadLocalTrip(): LocalLoadResult {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return { trip: normalizeTrip(JSON.parse(raw)) };
  } catch (e) {
    if (e instanceof FutureSchemaError) return { error: e.message, readOnly: true };
    // Copia intatta del documento illeggibile: le modifiche successive non possono cancellarla
    try {
      if (raw && !localStorage.getItem(QUARANTINE_KEY)) localStorage.setItem(QUARANTINE_KEY, raw);
    } catch {
      /* senza spazio resta il documento originale finché non si modifica qualcosa */
    }
    return { error: `Dati locali non leggibili: ${(e as Error).message}. Una copia è stata conservata; nessun dato è stato cancellato.` };
  }
}

/** Prima il viaggio, poi la copia precedente. Se manca spazio si rinuncia a copia e cache, mai al viaggio. */
export function saveLocalTrip(trip: Trip): boolean {
  let prev: string | null = null;
  try {
    prev = localStorage.getItem(KEY);
  } catch {
    return false;
  }
  const doc = JSON.stringify(trip);
  try {
    localStorage.setItem(KEY, doc);
  } catch {
    try {
      localStorage.removeItem(BACKUP_KEY);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith('nfhp.wiki.')) localStorage.removeItem(k);
      }
      localStorage.setItem(KEY, doc);
    } catch {
      return false;
    }
  }
  try {
    if (prev) localStorage.setItem(BACKUP_KEY, prev);
  } catch {
    /* il viaggio è salvato: manca solo la copia precedente */
  }
  return true;
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
