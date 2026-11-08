// Motore della sincronizzazione per riga (architettura §7). Nessuna dipendenza da React: trasporto, archivio della
// base e segno delle modifiche si simulano nei test.
//
// - Base: righe come le ha confermate il cloud, con rev, e seq noto → archivio «base» (IndexedDB nfhp-dati).
// - Modifiche: non si salva un secondo documento: si calcola diff(toRows(documento), base).
// - Segno «da inviare»: nfhp.sync.pending.<id> in localStorage (lo stesso della sincronizzazione per documento).
// - Invio con sync_push a lotti; ogni lotto ha un identificativo proprio, annotato in `attempted` PRIMA dell'invio:
//   una risposta persa non produce doppioni (stesso id → «gia_applicato»; righe scritte da un id tentato → non conflitto).
// - Lettura con sync_pull dopo il seq noto; unione a tre vie per riga con i conflitti da scegliere.

import { ensureCountries } from '../../domain/countries';
import { newId } from '../../domain/ids';
import { batches, diffRows, indexOf, mergeRows, resolveRowConflicts, type BaseRows, type Change, type RowMergeResult } from '../../domain/rowMerge';
import type { Side } from '../../domain/merge';
import { dataOf, fromRows, rowKey, TABLE_ORDER, toRows, type Row, type TableName, type TripRows } from '../../domain/rows';
import type { Trip } from '../../domain/types';
import type { AsyncStore } from './dataStore';
import { getPending, type Kv, type Pending } from './syncEngine';

export interface PushResponse {
  stato: 'applicato' | 'gia_applicato' | 'conflitto';
  seq?: number;
  righe?: { table: TableName; key: Row; rev: number }[];
  conflitti?: { table: TableName; key: Row; tipo: 'cambiata' | 'assente'; server: Row | null }[];
}

export interface PullResponse {
  seq: number;
  righe: Partial<Record<TableName, Row[]>>;
}

export interface RowTransport {
  push(tripId: string, mutationId: string, changes: Change[], attempted: string[], deviceId: string, opts?: { keepalive?: boolean }): Promise<PushResponse>;
  pull(tripId: string, since: number): Promise<PullResponse>;
}

export interface BaseState {
  seq: number;
  rows: BaseRows;
}

const pendingKey = (id: string) => `nfhp.sync.pending.${id}`;
type RowPending = Pending & { rowBatchId?: string };

function savePending(kv: Kv, id: string, p: RowPending): void {
  try {
    kv.setItem(pendingKey(id), JSON.stringify(p));
  } catch {
    /* senza spazio: il reinvio resta possibile, al massimo un conflitto da scegliere */
  }
}

export async function loadBase(store: AsyncStore, tripId: string): Promise<BaseState> {
  try {
    const b = await store.get<BaseState>('base', tripId);
    if (b && typeof b.seq === 'number' && b.rows && typeof b.rows === 'object') return b;
  } catch {
    /* archivio non disponibile: si riparte dalla base vuota (conflitti da scegliere a mano) */
  }
  return { seq: 0, rows: {} };
}

export async function saveBase(store: AsyncStore, tripId: string, b: BaseState): Promise<void> {
  try {
    await store.put('base', tripId, b);
  } catch {
    /* come sopra */
  }
}

/** Applica alla base le righe ricevute dal cloud (le cancellate escono) */
export function applyPulled(base: BaseRows, righe: PullResponse['righe']): BaseRows {
  const out: BaseRows = { ...base };
  for (const table of TABLE_ORDER) {
    for (const r of righe[table] ?? []) {
      const k = rowKey(table, r);
      if (r.deleted_at) delete out[k];
      else out[k] = { table, row: dataOf(table, r), rev: Number(r.rev ?? 0) };
    }
  }
  return out;
}

const remoteIndex = (rows: BaseRows) => new Map(Object.entries(rows).map(([k, v]) => [k, { table: v.table, row: v.row }]));

export function baseToRows(rows: BaseRows): TripRows {
  const out: TripRows = Object.fromEntries(TABLE_ORDER.map((t) => [t, [] as Row[]]));
  for (const e of Object.values(rows)) out[e.table]!.push(e.row);
  return out;
}

/** Documento del viaggio pronto per le righe: le nazioni sono sempre esplicite */
export const rowsOf = (t: Trip) => toRows(ensureCountries(t)).rows;

export type RowPushResult =
  | { kind: 'niente' }
  | { kind: 'salvato'; ownEarlierWrite?: boolean }
  /** Unione senza conflitti con le modifiche del cloud: va applicata qui e inviata di nuovo */
  | { kind: 'unito'; trip: Trip; merged: string[] }
  | { kind: 'conflitto'; merge: RowMergeResult; remote: BaseState };

/**
 * Invia le modifiche di questo dispositivo. In caso di conflitto sul server legge le novità e unisce per riga.
 */
export async function pushRows(kv: Kv, store: AsyncStore, tx: RowTransport, trip: Trip, deviceId: string, opts: { keepalive?: boolean } = {}): Promise<RowPushResult> {
  const id = trip.id;
  const p0 = getPending(kv, id) as RowPending | undefined;
  if (!p0) return { kind: 'niente' };
  const startMutation = p0.mutationId;
  const base = await loadBase(store, id);
  const changes = diffRows(rowsOf(trip), base.rows);
  let gia = false;
  for (const batch of batches(changes)) {
    const p = (getPending(kv, id) as RowPending | undefined) ?? p0;
    const batchId = p.rowBatchId ?? newId();
    const attempted = [...new Set([...p.attempted, batchId])].slice(-50);
    // Annotato prima dell'invio: se la pagina si chiude subito dopo, al riavvio si sa che può essere arrivato
    savePending(kv, id, { ...p, attempted, rowBatchId: batchId });
    const res = await tx.push(id, batchId, batch, attempted, deviceId, opts);
    if (res.stato === 'conflitto') return mergeFromCloud(store, tx, trip);
    if (res.stato === 'gia_applicato') gia = true;
    const revs = new Map((res.righe ?? []).map((r) => [rowKey(r.table, r.key), Number(r.rev)]));
    for (const c of batch) {
      const k = rowKey(c.table, c.row);
      if (c.op === 'delete') delete base.rows[k];
      else base.rows[k] = { table: c.table, row: c.row, rev: revs.get(k) ?? (c.base_rev ?? 0) + 1 };
    }
    await saveBase(store, id, base);
    const after = (getPending(kv, id) as RowPending | undefined) ?? p;
    // L'identificativo di un lotto confermato non si riusa per contenuti diversi
    savePending(kv, id, { ...after, rowBatchId: undefined });
  }
  const now = getPending(kv, id);
  if (now?.mutationId === startMutation) {
    try {
      kv.removeItem(pendingKey(id));
    } catch {
      /* resta in coda: al prossimo giro non ci sono differenze */
    }
  }
  return { kind: 'salvato', ownEarlierWrite: gia || undefined };
}

export type RowPullResult =
  | { kind: 'invariato' }
  /** Novità dal cloud unite a questo dispositivo senza conflitti; `local` = c'erano modifiche di qui da inviare */
  | { kind: 'aggiornato'; trip: Trip; merged: string[]; local: boolean }
  | { kind: 'conflitto'; merge: RowMergeResult; remote: BaseState };

/** Legge le novità dal cloud e le unisce a questo dispositivo */
export async function pullRows(store: AsyncStore, tx: RowTransport, trip: Trip): Promise<RowPullResult> {
  const base = await loadBase(store, trip.id);
  const res = await tx.pull(trip.id, base.seq);
  const changed = Object.values(res.righe ?? {}).some((l) => (l?.length ?? 0) > 0);
  if (!changed) {
    if (res.seq !== base.seq) await saveBase(store, trip.id, { ...base, seq: res.seq });
    return { kind: 'invariato' };
  }
  const remote: BaseState = { seq: res.seq, rows: applyPulled(base.rows, res.righe) };
  const merge = mergeRows(base.rows, rowsOf(trip), remoteIndex(remote.rows));
  if (merge.conflicts.length) return { kind: 'conflitto', merge, remote };
  await saveBase(store, trip.id, remote);
  const local = diffRows(rowsOf(merge.trip), remote.rows).length > 0;
  return { kind: 'aggiornato', trip: merge.trip, merged: merge.merged, local };
}

async function mergeFromCloud(store: AsyncStore, tx: RowTransport, trip: Trip): Promise<RowPushResult> {
  const r = await pullRows(store, tx, trip);
  if (r.kind === 'conflitto') return r;
  if (r.kind === 'aggiornato') return { kind: 'unito', trip: r.trip, merged: r.merged };
  // Nessuna novità leggibile ma il server ha rifiutato: la base era vecchia. Si rilegge tutto da capo.
  const full = await tx.pull(trip.id, 0);
  const remote: BaseState = { seq: full.seq, rows: applyPulled({}, full.righe) };
  const merge = mergeRows({}, rowsOf(trip), remoteIndex(remote.rows));
  if (merge.conflicts.length) return { kind: 'conflitto', merge, remote };
  await saveBase(store, trip.id, remote);
  return { kind: 'unito', trip: merge.trip, merged: merge.merged };
}

/** Dopo la scelta dell'utente: la versione del cloud vista diventa la base, il risultato si invia */
export async function adoptResolution(store: AsyncStore, m: RowMergeResult, remote: BaseState, choices: Record<string, Side>, tripId: string): Promise<Trip> {
  const { trip } = resolveRowConflicts(m, choices);
  await saveBase(store, tripId, remote);
  return trip;
}

/** Scarica un viaggio intero (dispositivo nuovo) e ne fa la base */
export async function loadTripFromRows(store: AsyncStore, tx: RowTransport, tripId: string): Promise<Trip> {
  const full = await tx.pull(tripId, 0);
  const rows = applyPulled({}, full.righe);
  const trip = fromRows(baseToRows(rows));
  await saveBase(store, tripId, { seq: full.seq, rows });
  return trip;
}

/** Righe locali in attesa di invio (per l'avviso all'uscita) */
export async function pendingRowCount(store: AsyncStore, trip: Trip): Promise<number> {
  return diffRows(rowsOf(trip), (await loadBase(store, trip.id)).rows).length;
}

export { indexOf };

/**
 * Il viaggio è passato al formato a righe (su questo o su un altro dispositivo) mentre qui c'era la copia del
 * documento. La base per l'unione è l'ultima copia del documento confermata dal cloud (se c'è): così le modifiche
 * fatte qui e non ancora inviate si uniscono riga per riga invece di diventare tutte conflitti.
 */
export async function adoptRowsFormat(store: AsyncStore, tx: RowTransport, trip: Trip, docBase: Trip | undefined): Promise<RowPullResult & { changed?: boolean }> {
  const full = await tx.pull(trip.id, 0);
  const remote: BaseState = { seq: full.seq, rows: applyPulled({}, full.righe) };
  const base: BaseRows = {};
  if (docBase) {
    for (const [k, e] of indexOf(rowsOf(docBase))) base[k] = { table: e.table, row: e.row, rev: 0 };
  }
  const merge = mergeRows(base, rowsOf(trip), remoteIndex(remote.rows));
  if (merge.conflicts.length) return { kind: 'conflitto', merge, remote };
  await saveBase(store, trip.id, remote);
  const local = diffRows(rowsOf(merge.trip), remote.rows).length > 0;
  return { kind: 'aggiornato', trip: merge.trip, merged: merge.merged, local };
}

/** Trasporto verso Supabase: RPC sync_push / sync_pull */
export function cloudRowTransport(rpcCall: <T>(fn: string, args: Record<string, unknown>, opts?: { keepalive?: boolean }) => Promise<T>): RowTransport {
  return {
    push: (tripId, mutationId, changes, attempted, deviceId, opts) =>
      rpcCall<PushResponse>('sync_push', { p_trip_id: tripId, p_mutation_id: mutationId, p_changes: changes, p_attempted: attempted, p_device_id: deviceId }, opts),
    pull: (tripId, since) => rpcCall<PullResponse>('sync_pull', { p_trip_id: tripId, p_since: since }),
  };
}
