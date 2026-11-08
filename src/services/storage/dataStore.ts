// Archivio del dispositivo per la copia offline che non entra comodamente in localStorage (architettura §8):
// IndexedDB «nfhp-dati» con gli archivi
// - base: righe del viaggio come le ha confermate il cloud, con rev, e seq noto (sincronizzazione per riga);
// - cataloghi: risultato di catalog_bundle per versione (chiave release_id);
// - meta: piccoli dati di lavoro.
// Senza IndexedDB (browser vecchi, test) si usa la memoria: la base manca al riavvio e i conflitti si risolvono a mano.

export type StoreName = 'base' | 'cataloghi' | 'meta';

export interface AsyncStore {
  get<T>(store: StoreName, key: string): Promise<T | undefined>;
  put(store: StoreName, key: string, value: unknown): Promise<void>;
  del(store: StoreName, key: string): Promise<void>;
  keys(store: StoreName): Promise<string[]>;
  clear(store: StoreName): Promise<void>;
}

export function memoryStore(): AsyncStore {
  const data: Record<StoreName, Map<string, unknown>> = { base: new Map(), cataloghi: new Map(), meta: new Map() };
  // Copia profonda: come IndexedDB, chi legge non modifica ciò che è salvato
  const copy = <T,>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));
  return {
    get: async <T,>(s: StoreName, k: string) => copy(data[s].get(k) as T | undefined),
    put: async (s, k, v) => void data[s].set(k, copy(v)),
    del: async (s, k) => void data[s].delete(k),
    keys: async (s) => [...data[s].keys()],
    clear: async (s) => data[s].clear(),
  };
}

const DB = 'nfhp-dati';
const STORES: StoreName[] = ['base', 'cataloghi', 'meta'];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => {
      for (const s of STORES) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s);
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error ?? new Error('Archivio dati non disponibile'));
  });
}

function idbStore(): AsyncStore {
  let dbp: Promise<IDBDatabase> | undefined;
  const db = () => (dbp ??= openDb());
  const run = <T,>(s: StoreName, mode: IDBTransactionMode, fn: (o: IDBObjectStore) => IDBRequest<T>): Promise<T> =>
    db().then(
      (d) =>
        new Promise<T>((resolve, reject) => {
          const tx = d.transaction(s, mode);
          const req = fn(tx.objectStore(s));
          tx.oncomplete = () => resolve(req.result);
          tx.onerror = tx.onabort = () => reject(tx.error ?? new Error('Archivio dati non disponibile'));
        }),
    );
  return {
    get: <T,>(s: StoreName, k: string) => run<T | undefined>(s, 'readonly', (o) => o.get(k) as IDBRequest<T | undefined>),
    put: (s, k, v) => run(s, 'readwrite', (o) => o.put(v, k)).then(() => undefined),
    del: (s, k) => run(s, 'readwrite', (o) => o.delete(k)).then(() => undefined),
    keys: (s) => run(s, 'readonly', (o) => o.getAllKeys()).then((ks) => ks.map(String)),
    clear: (s) => run(s, 'readwrite', (o) => o.clear()).then(() => undefined),
  };
}

let shared: AsyncStore | undefined;

/** Archivio del dispositivo (IndexedDB se disponibile, altrimenti memoria) */
export function deviceStore(): AsyncStore {
  if (!shared) shared = typeof indexedDB === 'undefined' ? memoryStore() : idbStore();
  return shared;
}

/** Solo per i test */
export function setDeviceStore(s: AsyncStore | undefined): void {
  shared = s;
}

// ---------- Cambio utente senza uscita (come holdForOwner per localStorage) ----------
// La base per riga è un dato del viaggio dell'utente: si mette da parte e torna quando quell'utente rientra.
// I cataloghi restano: sono dati di riferimento pubblicati, uguali per tutti.

const holdKey = (owner: string) => `hold.${owner}`;

/** Mette da parte la base di sincronizzazione dell'utente precedente e la toglie dall'archivio in uso */
export async function holdStore(store: AsyncStore, owner: string): Promise<void> {
  const keys = await store.keys('base');
  if (!keys.length) return;
  const prev = (await store.get<Record<string, unknown>>('meta', holdKey(owner))) ?? {};
  const data: Record<string, unknown> = { ...prev };
  for (const k of keys) data[k] = await store.get('base', k);
  await store.put('meta', holdKey(owner), data);
  await store.clear('base');
}

/** Riporta la base messa da parte per questo utente */
export async function restoreStore(store: AsyncStore, owner: string): Promise<void> {
  const data = await store.get<Record<string, unknown>>('meta', holdKey(owner));
  if (!data) return;
  for (const [k, v] of Object.entries(data)) await store.put('base', k, v);
  await store.del('meta', holdKey(owner));
}
