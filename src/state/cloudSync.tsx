import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createEmptyTrip } from '../domain/defaults';
import { resolveConflicts, type MergeResult, type Side } from '../domain/merge';
import { FutureSchemaError } from '../domain/migrations';
import type { Trip } from '../domain/types';
import { clearBlobs } from '../services/storage/blobs';
import { loadLocalTrip } from '../services/storage/local';
import {
  CloudError,
  getCloudConfig,
  getCloudTripMeta,
  listCloudTrips,
  loadCloudTrip,
  loadSession,
  saveCloudTripIfUnchanged,
  signOut,
  type CloudConfig,
  type CloudSession,
} from '../services/storage/supabase';
import {
  adoptMerged,
  enqueue,
  getLastSync as kvLastSync,
  getOwner,
  getPending,
  holdForOwner,
  purgeTripData,
  pushOnce,
  restoreHold,
  setLastSync as kvSetLastSync,
  setOwner,
  writeBase,
  type PushResult,
  type SyncTransport,
} from '../services/storage/syncEngine';
import { useTrip } from './store';

// Sincronizzazione automatica con il cloud:
// - ogni modifica si salva prima sul dispositivo e resta in coda finché il cloud non la conferma;
// - si riprova all'apertura, al ritorno in primo piano, al ritorno della rete e ogni 30 secondi;
// - voci di diario e dati indipendenti si uniscono; se la stessa cosa è cambiata in modo diverso, sceglie l'utente.

export type CloudStatus = 'non_configurato' | 'non_connesso' | 'sincronizzato' | 'in_attesa' | 'in_corso' | 'offline' | 'errore' | 'conflitto';

export interface CloudConflict {
  merge: MergeResult;
  remoteUpdatedAt: string;
}

interface CloudSync {
  config?: CloudConfig;
  session?: CloudSession;
  status: CloudStatus;
  lastSyncAt?: string;
  error?: string;
  conflict?: CloudConflict;
  /** Modifiche non ancora confermate dal cloud */
  pending: boolean;
  setSession: (s: CloudSession | undefined) => void;
  reloadConfig: () => void;
  syncNow: () => void;
  resolve: (choices: Record<string, Side>) => void;
  loadTrip: (id: string) => Promise<void>;
  /** Esce e toglie i dati del viaggio dal dispositivo */
  logout: () => Promise<void>;
}

const Ctx = createContext<CloudSync | null>(null);

const SYNC_DELAY_MS = 2500;
const RETRY_MS = 30_000;

const kv = (): Storage => localStorage;

export const getLastSync = (id: string) => {
  try {
    return kvLastSync(kv(), id);
  } catch {
    return undefined;
  }
};

function hasContent(t: Trip): boolean {
  return (
    t.stops.length > 0 ||
    t.coastalOptions.length > 0 ||
    t.accommodations.length > 0 ||
    t.budgetItems.length > 0 ||
    (t.flights?.length ?? 0) > 0 ||
    (t.diary?.length ?? 0) > 0 ||
    Object.keys(t.days).length > 0 ||
    Object.keys(t.actuals?.stops ?? {}).length > 0 ||
    Object.keys(t.actuals?.activities ?? {}).length > 0
  );
}

/** Ci sono modifiche locali non ancora nel cloud? (prudente: nel dubbio sì, così non si sovrascrive nulla) */
export function hasUnsyncedChanges(t: Trip): boolean {
  try {
    if (getPending(kv(), t.id)) return true;
    return getLastSync(t.id) ? false : hasContent(t);
  } catch {
    return true;
  }
}

function transportFor(config: CloudConfig): SyncTransport {
  return {
    getMeta: async (id) => {
      const m = await getCloudTripMeta(config, id);
      return m ? { updated_at: m.updated_at, lastMutationId: m.last_mutation ?? undefined } : undefined;
    },
    load: (id) => loadCloudTrip(config, id),
    save: (t, known, opts) => saveCloudTripIfUnchanged(config, t, known, opts),
  };
}

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const { trip, replace, toast, readOnly } = useTrip();
  const [config, setConfig] = useState(getCloudConfig);
  const [session, setSessionState] = useState<CloudSession | undefined>(() => (getCloudConfig() ? loadSession() : undefined));
  const [status, setStatus] = useState<CloudStatus>(() => (!getCloudConfig() ? 'non_configurato' : loadSession() ? 'in_corso' : 'non_connesso'));
  const [lastSyncAt, setLastSyncAt] = useState(() => getLastSync(trip.id));
  const [error, setError] = useState<string>();
  const [conflict, setConflictState] = useState<CloudConflict>();
  const [pending, setPending] = useState(() => {
    try {
      return Boolean(getPending(kv(), trip.id));
    } catch {
      return false;
    }
  });

  const tripRef = useRef(trip);
  tripRef.current = trip;
  const lastSeenTrip = useRef(trip);
  const applyingRemote = useRef(false);
  const busy = useRef(false);
  const again = useRef(false);
  const recreated = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const conflictRef = useRef<CloudConflict | undefined>(undefined);
  const setConflict = useCallback((c: CloudConflict | undefined) => {
    conflictRef.current = c;
    setConflictState(c);
  }, []);

  const fail = useCallback((e: unknown) => {
    if (e instanceof CloudError && e.status === 401) {
      setSessionState(undefined);
      setStatus('non_connesso');
      setError('Sessione scaduta: accedi di nuovo. Le modifiche restano salvate su questo dispositivo.');
      return;
    }
    // Senza codice HTTP è un problema di rete; con un codice è un errore da leggere, non «offline»
    const network = e instanceof CloudError && e.status === undefined;
    setStatus(network ? 'offline' : 'errore');
    setError(e instanceof FutureSchemaError ? e.message : e instanceof Error ? e.message : 'Errore di rete');
  }, []);

  const applyRemote = useCallback(
    (t: Trip, at: string) => {
      applyingRemote.current = true;
      replace(t);
      kvSetLastSync(kv(), t.id, at);
      writeBase(kv(), t);
      setLastSyncAt(at);
      setPending(false);
      setConflict(undefined);
      setStatus('sincronizzato');
      setError(undefined);
    },
    [replace, setConflict],
  );

  const schedule = useCallback((ms: number, fn: () => void) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(fn, ms);
  }, []);

  /** Applica l'esito di un invio. Restituisce true se serve un altro invio. */
  const handle = useCallback(
    (r: PushResult, sent: Trip): boolean => {
      switch (r.kind) {
        case 'niente':
          setPending(false);
          setStatus('sincronizzato');
          return false;
        case 'salvato': {
          recreated.current = false;
          setLastSyncAt(r.updatedAt);
          const still = Boolean(getPending(kv(), sent.id));
          setPending(still);
          setStatus(still ? 'in_attesa' : 'sincronizzato');
          setError(undefined);
          return still;
        }
        case 'unito':
          applyingRemote.current = true;
          replace(r.merge.trip);
          adoptMerged(kv(), r.merge.trip, r.merge.remote, r.remoteUpdatedAt);
          setPending(true);
          toast(`Unito con le modifiche di un altro dispositivo${r.merge.merged.length ? `: ${r.merge.merged.join(', ')}` : ''}`);
          return true;
        case 'conflitto':
          setConflict({ merge: r.merge, remoteUpdatedAt: r.remoteUpdatedAt });
          setStatus('conflitto');
          return false;
        case 'assente':
          if (recreated.current) {
            setStatus('errore');
            setError('Il viaggio non si può ricreare nel cloud. Le modifiche restano su questo dispositivo: esporta un backup.');
            return false;
          }
          recreated.current = true;
          toast('Il viaggio non era più nel cloud: viene ricreato da questo dispositivo');
          return true;
        case 'inaccessibile':
          setStatus('errore');
          setError('Questo viaggio nel cloud non è accessibile con questo account. Le modifiche restano su questo dispositivo: esporta un backup.');
          return false;
      }
    },
    [replace, toast, setConflict],
  );

  const push = useCallback(async (): Promise<void> => {
    if (readOnly || !config || !loadSession() || conflictRef.current) return;
    if (busy.current) {
      again.current = true;
      return;
    }
    busy.current = true;
    const t = tripRef.current;
    setStatus('in_corso');
    try {
      if (handle(await pushOnce(kv(), transportFor(config), t), t)) again.current = true;
    } catch (e) {
      fail(e);
      schedule(RETRY_MS, () => void push());
    } finally {
      busy.current = false;
      if (again.current) {
        again.current = false;
        schedule(SYNC_DELAY_MS, () => void push());
      }
    }
  }, [config, fail, handle, readOnly, schedule]);

  /** Scarica le novità dal cloud; carica in automatico solo se qui non ci sono modifiche in attesa. */
  const pull = useCallback(async (): Promise<void> => {
    if (readOnly || !config || !loadSession() || busy.current || conflictRef.current) return;
    busy.current = true;
    let thenPush = false;
    try {
      const t = tripRef.current;
      const dirty = hasUnsyncedChanges(t);
      const remote = await getCloudTripMeta(config, t.id);
      const known = getLastSync(t.id);
      if (remote) {
        if (!known || remote.updated_at > known) {
          if (!dirty) {
            const r = await loadCloudTrip(config, t.id);
            applyRemote(r.trip, r.updatedAt);
            if (known) toast('Viaggio aggiornato con le modifiche fatte su un altro dispositivo');
          } else {
            // Il motore riconosce le proprie scritture e unisce ciò che è indipendente
            if (!getPending(kv(), t.id)) enqueue(kv(), t.id);
            thenPush = true;
          }
        } else {
          thenPush = dirty;
          setStatus(dirty ? 'in_attesa' : 'sincronizzato');
        }
      } else if (!hasContent(t)) {
        // Dispositivo nuovo con viaggio vuoto: apre il viaggio più recente del cloud, se esiste
        const rows = await listCloudTrips(config);
        const latest = rows[0];
        if (latest) {
          const r = await loadCloudTrip(config, latest.id);
          applyRemote(r.trip, r.updatedAt);
          toast(`Aperto dal cloud: ${r.trip.title}`);
          return;
        }
        thenPush = dirty;
        if (!dirty) setStatus('sincronizzato');
      } else {
        if (!getPending(kv(), t.id)) enqueue(kv(), t.id); // viaggio non ancora nel cloud: lo carica
        thenPush = true;
      }
      setError(undefined);
    } catch (e) {
      fail(e);
      // Aperta senza rete: riprova da sola anche se la pagina resta in primo piano
      if (loadSession()) schedule(RETRY_MS, () => void pull());
    } finally {
      busy.current = false;
    }
    if (thenPush) await push();
  }, [readOnly, config, applyRemote, toast, fail, push, schedule]);

  // Ogni modifica locale: in coda in modo durevole, poi il salvataggio nel cloud
  useEffect(() => {
    // Reagisce solo a modifiche reali del viaggio, non al cambio di sessione o configurazione
    const changed = trip !== lastSeenTrip.current;
    lastSeenTrip.current = trip;
    if (!changed) return;
    if (applyingRemote.current) {
      applyingRemote.current = false;
      return;
    }
    enqueue(kv(), trip.id);
    setPending(true);
    setLastSyncAt(getLastSync(trip.id));
    if (!config || !session || conflictRef.current) return;
    setStatus('in_attesa');
    schedule(SYNC_DELAY_MS, () => void push());
  }, [trip, config, session, push, schedule]);

  // All'avvio e dopo l'accesso: allinea con il cloud
  useEffect(() => {
    if (config && session) void pull();
  }, [config, session, pull]);

  // Torna in primo piano o torna la rete → riprova; va in secondo piano → invia subito
  useEffect(() => {
    if (!config || !session) return;
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void pull();
        return;
      }
      const t = tripRef.current;
      if (conflictRef.current || busy.current || !getPending(kv(), t.id)) return;
      busy.current = true;
      void pushOnce(kv(), transportFor(config), t, { keepalive: true })
        .then((r) => {
          if (r.kind === 'salvato') {
            setLastSyncAt(r.updatedAt);
            setPending(Boolean(getPending(kv(), t.id)));
          }
        })
        .catch(() => undefined)
        .finally(() => {
          busy.current = false;
        });
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onVis);
    window.addEventListener('pageshow', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onVis);
      window.removeEventListener('pageshow', onVis);
    };
  }, [config, session, pull]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const value = useMemo<CloudSync>(
    () => ({
      config,
      session,
      status,
      lastSyncAt,
      error,
      conflict,
      pending,
      setSession: (s) => {
        if (s) {
          const owner = getOwner(kv());
          // Accede un altro utente: i dati del precedente non restano visibili e tornano quando quell'utente rientra
          if (owner && owner !== s.userId) {
            if (!holdForOwner(kv(), owner)) {
              setStatus('errore');
              setError('Spazio esaurito sul dispositivo: esporta un backup e riprova ad accedere.');
              return;
            }
            restoreHold(kv(), s.userId);
            applyingRemote.current = true;
            replace(loadLocalTrip().trip ?? createEmptyTrip());
            setPending(false);
          } else if (!owner) {
            restoreHold(kv(), s.userId);
          }
          setOwner(kv(), s.userId);
        }
        setSessionState(s);
        setError(undefined);
        setStatus(s ? 'in_corso' : 'non_connesso');
      },
      reloadConfig: () => {
        const c = getCloudConfig();
        setConfig(c);
        setSessionState(c ? loadSession() : undefined);
        setStatus(!c ? 'non_configurato' : loadSession() ? 'in_corso' : 'non_connesso');
      },
      syncNow: () => {
        window.clearTimeout(timer.current);
        void (hasUnsyncedChanges(tripRef.current) ? push() : pull());
      },
      resolve: (choices) => {
        const c = conflictRef.current;
        if (!c) return;
        const t = tripRef.current;
        // Copia di sicurezza di questo dispositivo prima di applicare le scelte
        try {
          kv().setItem(`nfhp.sync.copia.${t.id}`, JSON.stringify(t));
        } catch {
          /* senza spazio resta il backup su file */
        }
        const merged = resolveConflicts(c.merge, choices);
        applyingRemote.current = true;
        replace(merged);
        adoptMerged(kv(), merged, c.merge.remote, c.remoteUpdatedAt);
        setConflict(undefined);
        setPending(true);
        setStatus('in_attesa');
        schedule(200, () => void push());
      },
      loadTrip: async (id: string) => {
        if (!config) return;
        const r = await loadCloudTrip(config, id);
        applyRemote(r.trip, r.updatedAt);
      },
      logout: async () => {
        window.clearTimeout(timer.current);
        if (config) await signOut(config, loadSession());
        purgeTripData(kv());
        try {
          sessionStorage.clear();
        } catch {
          /* niente da togliere */
        }
        await clearBlobs().catch(() => undefined);
        setConflict(undefined);
        setPending(false);
        setSessionState(undefined);
        setLastSyncAt(undefined);
        setError(undefined);
        setStatus(config ? 'non_connesso' : 'non_configurato');
        applyingRemote.current = true;
        replace(createEmptyTrip());
      },
    }),
    [config, session, status, lastSyncAt, error, conflict, pending, push, pull, applyRemote, replace, schedule, setConflict],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCloudSync(): CloudSync {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCloudSync fuori da CloudSyncProvider');
  return c;
}
