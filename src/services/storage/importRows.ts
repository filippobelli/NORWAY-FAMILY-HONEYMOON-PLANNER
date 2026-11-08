// Passaggio di un viaggio dal documento (trips.data) alle righe (architettura §9.2), sul dispositivo.
// Idempotente e ripetibile: le chiavi delle righe sono quelle del documento; un secondo giro non scrive righe nuove.
// Mai cancella `data`: resta come copia (più la copia privata private.trips_backup_20261106).
//
// 1. Il chiamante invia prima le modifiche in coda con il flusso del documento (qui: se ce ne sono, si aspetta).
// 2. Legge il viaggio; se è già a righe: fatto.
// 3. Documento più recente dell'app: si ferma.
// 4. normalizeTrip → nazioni esplicite (Norvegia, NO-1) = documento «preparato».
// 5. trip_imports «in_corso» con l'impronta SHA-256 di data.
// 6. toRows; i riferimenti al catalogo non trovati si elencano in trip_imports.unresolved, senza scartarli.
// 7. Invio a lotti (solo righe nuove o diverse; righe che il documento non ha più: tombstone).
// 8. Verifica: righe del cloud → fromRows uguale al documento preparato; altrimenti «fallita», resta documento.
// 9. Se nel frattempo `data` è cambiato (app vecchia su un altro dispositivo) si ricomincia; poi storage_format = 'righe'.

import { ensureCountries } from '../../domain/countries';
import { normalizeTrip } from '../../domain/defaults';
import { newId } from '../../domain/ids';
import { FutureSchemaError } from '../../domain/migrations';
import { batches, indexOf, type Change } from '../../domain/rowMerge';
import { countRows, diffPaths, fromRows, sameTrip, toRows, type Row, type TripRows } from '../../domain/rows';
import type { Trip } from '../../domain/types';
import type { AsyncStore } from './dataStore';
import { applyPulled, baseToRows, saveBase, type RowTransport } from './rowSync';

export interface CloudTripRecord {
  data: unknown;
  storage_format?: string | null;
  rev?: number | null;
  /** Colonne di dati della riga trips (titolo, impostazioni, extra…) */
  [col: string]: unknown;
}

export interface ImportTransport extends RowTransport {
  readTrip(id: string): Promise<CloudTripRecord | undefined>;
  recordImport(row: Record<string, unknown>): Promise<void>;
}

export interface CatalogRefs {
  places: Set<string>;
  voyages: Set<string>;
}

export type ImportOutcome =
  | { kind: 'gia_fatto' }
  | { kind: 'fatto'; trip: Trip; warnings: string[]; unresolved: string[]; rows: Record<string, number> }
  | { kind: 'fallita'; error: string; differences?: string[] }
  | { kind: 'assente' };

/** Impronta del documento (SHA-256 del JSON come arriva dal server) */
export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Documento preparato per le righe. Un documento senza versioni del percorso riceve un identificativo stabile
 * (derivato dal viaggio), così ripetere il passaggio non crea una versione nuova a ogni giro.
 */
export function prepareDocument(data: unknown): Trip {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const sc = Array.isArray(d.scenarios) ? (d.scenarios as { id?: unknown }[]) : [];
    if (!sc.some((s) => s && s.id === d.activeScenarioId) && typeof d.id === 'string') {
      const id = `${d.id}-principale`;
      data = { ...d, scenarios: [{ id, name: 'Scenario principale', kind: 'altro', notes: '', updatedAt: '' }, ...sc.filter((s) => s && (s as { plan?: unknown }).plan)], activeScenarioId: id };
    }
  }
  return ensureCountries(normalizeTrip(JSON.parse(JSON.stringify(data))));
}

/** Riferimenti al catalogo che la versione caricata non contiene: si elencano, non si scartano */
export function unresolvedRefs(t: Trip, refs: CatalogRefs): string[] {
  const out = new Set<string>();
  const place = (k: string | undefined, where: string) => {
    if (k && !refs.places.has(k)) out.add(`${where}: ${k}`);
  };
  const plans = [{ stops: t.stops, days: t.days }, ...(t.scenarios ?? []).filter((s) => s.plan).map((s) => s.plan!)];
  for (const p of plans) {
    for (const s of p.stops) {
      place(s.destinationId, 'tappa');
      for (const i of s.ideas ?? []) place(i, 'idea');
    }
    for (const d of Object.values(p.days)) for (const a of d.activities ?? []) place(a.destinationId, 'attività');
  }
  for (const f of t.favorites) place(f, 'preferito');
  for (const o of t.coastalOptions) if (o.catalogId && !refs.voyages.has(o.catalogId)) out.add(`crociera: ${o.catalogId}`);
  return [...out].sort();
}

const enc = (v: unknown) => JSON.stringify(v);

async function sendAll(tx: RowTransport, tripId: string, changes: Change[], attempted: string[], deviceId: string): Promise<void> {
  for (const batch of batches(changes)) {
    const id = newId();
    attempted.push(id);
    const res = await tx.push(tripId, id, batch, attempted.slice(-50), deviceId);
    if (res.stato === 'conflitto') {
      const what = (res.conflitti ?? []).slice(0, 3).map((c) => `${c.table} ${enc(c.key)}`).join(', ');
      throw new Error(`Il viaggio è stato modificato durante la conversione (${what}): riprova`);
    }
  }
}

function tripRowOf(rec: CloudTripRecord): Row {
  const r: Row = {};
  for (const [k, v] of Object.entries(rec)) if (k !== 'data') r[k] = v;
  return r;
}

export async function importTrip(
  tx: ImportTransport,
  store: AsyncStore,
  tripId: string,
  opts: { deviceId: string; refs?: CatalogRefs; appVersion?: string; maxRounds?: number },
): Promise<ImportOutcome> {
  const attempted: string[] = [];
  for (let round = 0; round < (opts.maxRounds ?? 3); round++) {
    const rec = await tx.readTrip(tripId);
    if (!rec) return { kind: 'assente' };
    if (rec.storage_format === 'righe') return { kind: 'gia_fatto' };
    const raw = enc(rec.data);
    const hash = await sha256(raw);
    let prepared: Trip;
    try {
      prepared = prepareDocument(rec.data);
    } catch (e) {
      const error = e instanceof FutureSchemaError ? e.message : `Documento non convertibile: ${(e as Error).message}`;
      await tx.recordImport({ trip_id: tripId, status: 'fallita', error, source_sha256: hash }).catch(() => undefined);
      return { kind: 'fallita', error };
    }
    const { rows, warnings } = toRows(prepared);
    const unresolved = opts.refs ? unresolvedRefs(prepared, opts.refs) : [];
    const srcVersion = (rec.data as { schemaVersion?: unknown })?.schemaVersion;
    await tx.recordImport({
      trip_id: tripId,
      status: 'in_corso',
      source_schema_version: typeof srcVersion === 'number' ? srcVersion : null,
      source_sha256: hash,
      app_version: opts.appVersion ?? null,
      row_counts: countRows(rows),
      unresolved: [...unresolved, ...warnings.map((w) => `valore conservato: ${w}`)],
      error: null,
    });

    // Righe già presenti (un giro precedente interrotto): si riscrivono solo quelle diverse
    const existing = applyPulled({}, (await tx.pull(tripId, 0)).righe);
    const local = indexOf(rows);
    const changes: Change[] = [];
    for (const [k, e] of local) {
      if (e.table === 'trips') {
        // La riga del viaggio si scrive sempre (resta «documento» fino alla verifica)
        changes.push({ table: 'trips', op: 'upsert', base_rev: Number(rec.rev ?? 1), row: e.row });
        continue;
      }
      const b = existing[k];
      if (!b) changes.push({ table: e.table, op: 'upsert', base_rev: null, row: e.row });
      else if (enc(b.row) !== enc(e.row)) changes.push({ table: e.table, op: 'upsert', base_rev: b.rev, row: e.row });
    }
    for (const [k, b] of Object.entries(existing)) {
      if (!local.has(k)) changes.push({ table: b.table, op: 'delete', base_rev: b.rev, row: b.row });
    }
    try {
      await sendAll(tx, tripId, changes, attempted, opts.deviceId);
    } catch (e) {
      await tx.recordImport({ trip_id: tripId, status: 'fallita', error: (e as Error).message }).catch(() => undefined);
      return { kind: 'fallita', error: (e as Error).message };
    }

    // Verifica di uguaglianza
    const after = await tx.readTrip(tripId);
    if (!after) return { kind: 'assente' };
    const pulled = (await tx.pull(tripId, 0)).righe as TripRows;
    const rebuiltRows: TripRows = { ...pulled, trips: [tripRowOf(after)] };
    let rebuilt: Trip | undefined;
    let differences: string[] = [];
    try {
      rebuilt = fromRows(rebuiltRows);
      differences = sameTrip(rebuilt, prepared) ? [] : diffPaths(rebuilt, prepared);
    } catch (e) {
      differences = [(e as Error).message];
    }
    if (differences.length || !rebuilt) {
      const error = `Il viaggio ricostruito dalle righe non è uguale al documento: ${differences.slice(0, 5).join(', ')}`;
      await tx.recordImport({ trip_id: tripId, status: 'fallita', error, finished_at: new Date().toISOString() }).catch(() => undefined);
      return { kind: 'fallita', error, differences };
    }
    // L'app vecchia ha salvato nel frattempo: si ricomincia con il documento nuovo
    if ((await sha256(enc(after.data))) !== hash) continue;

    const res = await tx.push(tripId, newId(), [{ table: 'trips', op: 'upsert', base_rev: Number(after.rev ?? 1), row: { id: tripId, storage_format: 'righe', imported_at: new Date().toISOString() } }], attempted.slice(-50), opts.deviceId);
    if (res.stato === 'conflitto') continue;
    const now = new Date().toISOString();
    await tx.recordImport({ trip_id: tripId, status: 'verificata', finished_at: now, verified_at: now }).catch(() => undefined);
    // Base del dispositivo: le righe come sono nel cloud adesso
    const full = await tx.pull(tripId, 0);
    const base = applyPulled({}, full.righe);
    await saveBase(store, tripId, { seq: full.seq, rows: base });
    const trip = fromRows(baseToRows(base));
    return { kind: 'fatto', trip, warnings, unresolved, rows: countRows(rows) };
  }
  return { kind: 'fallita', error: 'Il viaggio continua a cambiare durante la conversione: riprova quando gli altri dispositivi sono fermi.' };
}
