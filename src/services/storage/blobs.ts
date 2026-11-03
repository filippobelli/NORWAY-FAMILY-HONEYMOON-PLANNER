// Allegati del diario: file sul dispositivo (IndexedDB), separati dal documento del viaggio.
// Non vanno nel cloud: la voce conserva solo nome, tipo, dimensione e stato.

const DB = 'nfhp-allegati';
const STORE = 'files';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Archivio file non disponibile su questo browser'));
      return;
    }
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error ?? new Error('Archivio file non disponibile'));
  });
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(req.result);
        };
        tx.onerror = tx.onabort = () => {
          db.close();
          reject(tx.error ?? new Error('Salvataggio del file non riuscito'));
        };
      }),
  );
}

export const putBlob = (id: string, file: Blob) => run('readwrite', (s) => s.put(file, id)).then(() => undefined);
export const getBlob = (id: string) => run<Blob | undefined>('readonly', (s) => s.get(id) as IDBRequest<Blob | undefined>);
export const deleteBlob = (id: string) => run('readwrite', (s) => s.delete(id)).then(() => undefined);
export const clearBlobs = () => run('readwrite', (s) => s.clear()).then(() => undefined);
