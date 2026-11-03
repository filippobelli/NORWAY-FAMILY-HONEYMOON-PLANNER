import { newId } from '../../domain/ids';
import { mergeTrips, type MergeResult } from '../../domain/merge';
import { normalizeTrip } from '../../domain/defaults';
import type { Trip } from '../../domain/types';
import type { ConditionalSaveResult } from './supabase';

// Motore di sincronizzazione: nessuna dipendenza da React, trasporto e archivio si possono simulare nei test.
//
// La coda è per viaggio e tiene una sola modifica in attesa: il documento è sempre inviato intero, quindi le modifiche
// si fondono. Ogni invio porta nel documento `lastMutationId`: se la risposta si perde e il salvataggio era arrivato,
// al tentativo successivo si riconosce la propria scrittura invece di vedere un conflitto o scrivere due volte.

export interface Kv {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export interface RemoteMeta {
  updated_at: string;
  lastMutationId?: string;
}

export interface SyncTransport {
  getMeta(id: string): Promise<RemoteMeta | undefined>;
  load(id: string): Promise<{ trip: Trip; updatedAt: string }>;
  save(trip: Trip, known: string | undefined, opts?: { keepalive?: boolean }): Promise<ConditionalSaveResult>;
}

export interface Pending {
  mutationId: string;
  /** Invii già tentati: uno di questi può essere arrivato anche se la risposta si è persa */
  attempted: string[];
  since: string;
}

const pendingKey = (id: string) => `nfhp.sync.pending.${id}`;
const baseKey = (id: string) => `nfhp.sync.base.${id}`;
const lastSyncKey = (id: string) => `nfhp.cloud.lastSync.${id}`;
const legacyDirtyKey = (id: string) => `nfhp.cloud.dirty.${id}`;

function safeSet(kv: Kv, k: string, v: string): boolean {
  try {
    kv.setItem(k, v);
    return true;
  } catch {
    return false;
  }
}
function safeGet(kv: Kv, k: string): string | null {
  try {
    return kv.getItem(k);
  } catch {
    return null;
  }
}
function safeRemove(kv: Kv, k: string): void {
  try {
    kv.removeItem(k);
  } catch {
    /* storage non disponibile */
  }
}

export const getLastSync = (kv: Kv, id: string) => safeGet(kv, lastSyncKey(id)) ?? undefined;
export const setLastSync = (kv: Kv, id: string, v: string | undefined) => (v === undefined ? safeRemove(kv, lastSyncKey(id)) : void safeSet(kv, lastSyncKey(id), v));

export function readBase(kv: Kv, id: string): Trip | undefined {
  const raw = safeGet(kv, baseKey(id));
  if (!raw) return undefined;
  try {
    return normalizeTrip(JSON.parse(raw));
  } catch {
    return undefined;
  }
}
/** Ultima copia confermata dal cloud. Se non c'è spazio si fa a meno: i conflitti si risolvono allora a mano. */
export const writeBase = (kv: Kv, t: Trip) => void safeSet(kv, baseKey(t.id), JSON.stringify(t));

export function getPending(kv: Kv, id: string): Pending | undefined {
  const raw = safeGet(kv, pendingKey(id));
  if (raw) {
    try {
      return JSON.parse(raw) as Pending;
    } catch {
      /* si ricrea sotto */
    }
  }
  // Modifiche segnate dalla versione precedente dell'app
  if (safeGet(kv, legacyDirtyKey(id))) {
    const p: Pending = { mutationId: newId(), attempted: [], since: new Date().toISOString() };
    if (safeSet(kv, pendingKey(id), JSON.stringify(p))) safeRemove(kv, legacyDirtyKey(id));
    return p;
  }
  return undefined;
}

/** Segna una modifica da inviare. Restituisce false se non è stato possibile renderla durevole. */
export function enqueue(kv: Kv, id: string, now = new Date().toISOString()): boolean {
  const prev = getPending(kv, id);
  const next: Pending = { mutationId: newId(), attempted: prev?.attempted ?? [], since: prev?.since ?? now };
  return safeSet(kv, pendingKey(id), JSON.stringify(next));
}

export function clearSyncState(kv: Kv, id: string): void {
  safeRemove(kv, pendingKey(id));
  safeRemove(kv, baseKey(id));
  safeRemove(kv, lastSyncKey(id));
  safeRemove(kv, legacyDirtyKey(id));
}

function done(kv: Kv, id: string, sent: string): void {
  // Se nel frattempo è arrivata un'altra modifica resta in coda
  if (getPending(kv, id)?.mutationId === sent) safeRemove(kv, pendingKey(id));
}

export type PushResult =
  | { kind: 'niente' }
  | { kind: 'salvato'; updatedAt: string; ownEarlierWrite?: boolean }
  /** Unione senza conflitti: va applicata qui e inviata di nuovo */
  | { kind: 'unito'; merge: MergeResult; remoteUpdatedAt: string }
  | { kind: 'conflitto'; merge: MergeResult; remoteUpdatedAt: string }
  /** Nel cloud il viaggio non c'è più: si può ricreare */
  | { kind: 'assente' }
  /** La riga esiste ma questo account non può vederla: non si riprova all'infinito */
  | { kind: 'inaccessibile' };

export async function pushOnce(kv: Kv, tx: SyncTransport, trip: Trip, opts: { keepalive?: boolean } = {}, depth = 0): Promise<PushResult> {
  const p = getPending(kv, trip.id);
  if (!p) return { kind: 'niente' };
  const doc: Trip = { ...trip, lastMutationId: p.mutationId };
  // Segnato prima dell'invio: se la pagina si chiude subito dopo, al riavvio si sa che può essere arrivato
  const attempted = [...new Set([...p.attempted, p.mutationId])].slice(-20);
  safeSet(kv, pendingKey(trip.id), JSON.stringify({ ...p, attempted }));
  const known = getLastSync(kv, trip.id);
  const r = await tx.save(doc, known, { keepalive: opts.keepalive });
  if (r.kind === 'salvato') {
    setLastSync(kv, trip.id, r.updatedAt);
    writeBase(kv, doc);
    done(kv, trip.id, p.mutationId);
    return { kind: 'salvato', updatedAt: r.updatedAt };
  }
  const meta = await tx.getMeta(trip.id);
  if (!meta) {
    if (known) {
      setLastSync(kv, trip.id, undefined);
      return { kind: 'assente' };
    }
    return { kind: 'inaccessibile' };
  }
  if (meta.lastMutationId && attempted.includes(meta.lastMutationId)) {
    setLastSync(kv, trip.id, meta.updated_at);
    if (meta.lastMutationId === p.mutationId) {
      writeBase(kv, doc);
      done(kv, trip.id, p.mutationId);
      return { kind: 'salvato', updatedAt: meta.updated_at, ownEarlierWrite: true };
    }
    // Era arrivata una nostra modifica precedente: ora si invia quella più recente
    if (depth < 1) return pushOnce(kv, tx, trip, opts, depth + 1);
  }
  const remote = await tx.load(trip.id);
  const merge = mergeTrips(readBase(kv, trip.id), trip, remote.trip);
  return merge.conflicts.length === 0 ? { kind: 'unito', merge, remoteUpdatedAt: remote.updatedAt } : { kind: 'conflitto', merge, remoteUpdatedAt: remote.updatedAt };
}

/** Dopo un'unione o una scelta: la versione remota vista diventa la base e la modifica si rimette in coda. */
export function adoptMerged(kv: Kv, merged: Trip, remote: Trip, remoteUpdatedAt: string): void {
  setLastSync(kv, merged.id, remoteUpdatedAt);
  writeBase(kv, remote);
  enqueue(kv, merged.id);
}

// ---------- Dati del viaggio sul dispositivo ----------

const TRIP_DATA = /^nfhp\.(trip\.|cloud\.dirty\.|cloud\.lastSync\.|sync\.|configurator\.)/;
const OWNER_KEY = 'nfhp.owner';
const HOLD_PREFIX = 'nfhp.hold.';

export function allKeys(kv: Kv & { key?: (i: number) => string | null; length?: number }): string[] {
  const out: string[] = [];
  const n = kv.length ?? 0;
  for (let i = 0; i < n; i++) {
    const k = kv.key?.(i);
    if (k) out.push(k);
  }
  return out;
}

export const getOwner = (kv: Kv) => safeGet(kv, OWNER_KEY) ?? undefined;
export const setOwner = (kv: Kv, id: string | undefined) => (id ? void safeSet(kv, OWNER_KEY, id) : safeRemove(kv, OWNER_KEY));

/** Al logout: niente dati del viaggio per chi accede dopo. Configurazione del cloud e cache pubbliche restano. */
export function purgeTripData(kv: Kv & { key?: (i: number) => string | null; length?: number }): void {
  for (const k of allKeys(kv)) if (TRIP_DATA.test(k)) safeRemove(kv, k);
  safeRemove(kv, OWNER_KEY);
}

/**
 * Accede un altro utente senza che il precedente sia uscito (sessione scaduta): i dati del precedente spariscono
 * dall'app e tornano quando quell'utente rientra. Così modifiche non inviate non si perdono e non si mostrano ad altri.
 */
export function holdForOwner(kv: Kv & { key?: (i: number) => string | null; length?: number }, owner: string): boolean {
  const data: Record<string, string> = {};
  for (const k of allKeys(kv)) {
    if (!TRIP_DATA.test(k)) continue;
    const v = safeGet(kv, k);
    if (v !== null) data[k] = v;
  }
  if (!safeSet(kv, `${HOLD_PREFIX}${owner}`, JSON.stringify(data))) return false;
  for (const k of Object.keys(data)) safeRemove(kv, k);
  return true;
}

export function restoreHold(kv: Kv, owner: string): boolean {
  const raw = safeGet(kv, `${HOLD_PREFIX}${owner}`);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as Record<string, string>;
    for (const [k, v] of Object.entries(data)) if (!safeSet(kv, k, v)) return false;
    safeRemove(kv, `${HOLD_PREFIX}${owner}`);
    return true;
  } catch {
    return false;
  }
}
