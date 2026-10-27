import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Trip } from '../domain/types';
import {
  CloudError,
  getCloudConfig,
  getCloudTripMeta,
  listCloudTrips,
  loadCloudTrip,
  loadSession,
  saveCloudTripIfUnchanged,
  type CloudConfig,
  type CloudSession,
} from '../services/storage/supabase';
import { useTrip } from './store';

// Sincronizzazione automatica con il cloud:
// - ogni modifica viene salvata nel cloud dopo pochi secondi, senza azioni dell'utente;
// - all'apertura e quando l'app torna in primo piano si scaricano le modifiche fatte da altri dispositivi;
// - se le due versioni sono cambiate entrambe, la sincronizzazione si ferma e l'utente sceglie (nessuna sovrascrittura silenziosa).

export type CloudStatus = 'non_configurato' | 'non_connesso' | 'sincronizzato' | 'in_attesa' | 'in_corso' | 'offline' | 'conflitto';

interface CloudSync {
  config?: CloudConfig;
  session?: CloudSession;
  status: CloudStatus;
  lastSyncAt?: string;
  error?: string;
  conflictRemoteAt?: string;
  setSession: (s: CloudSession | undefined) => void;
  reloadConfig: () => void;
  syncNow: () => void;
  keepLocal: () => void;
  useRemote: () => void;
  loadTrip: (id: string) => Promise<void>;
}

const Ctx = createContext<CloudSync | null>(null);

const SYNC_DELAY_MS = 2500;
const RETRY_MS = 30_000;

function lsGet(k: string): string | undefined {
  try {
    return localStorage.getItem(k) ?? undefined;
  } catch {
    return undefined;
  }
}
function lsSet(k: string, v: string | undefined): void {
  try {
    if (v === undefined) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* storage non disponibile */
  }
}
export const getLastSync = (id: string) => lsGet(`nfhp.cloud.lastSync.${id}`);
const setLastSync = (id: string, v: string) => lsSet(`nfhp.cloud.lastSync.${id}`, v);
const setDirtyFlag = (id: string, v: boolean) => lsSet(`nfhp.cloud.dirty.${id}`, v ? '1' : undefined);

function hasContent(t: Trip): boolean {
  return t.stops.length > 0 || t.coastalOptions.length > 0 || t.accommodations.length > 0 || t.budgetItems.length > 0;
}

/** Ci sono modifiche locali non ancora nel cloud? (prudente: nel dubbio sì, così non si sovrascrive nulla) */
export function hasUnsyncedChanges(t: Trip): boolean {
  if (lsGet(`nfhp.cloud.dirty.${t.id}`)) return true;
  const known = getLastSync(t.id);
  return known ? false : hasContent(t);
}

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const { trip, replace, toast } = useTrip();
  const [config, setConfig] = useState(getCloudConfig);
  const [session, setSessionState] = useState<CloudSession | undefined>(() => (getCloudConfig() ? loadSession() : undefined));
  const [status, setStatus] = useState<CloudStatus>(() => (!getCloudConfig() ? 'non_configurato' : loadSession() ? 'in_corso' : 'non_connesso'));
  const [lastSyncAt, setLastSyncAt] = useState(() => getLastSync(trip.id));
  const [error, setError] = useState<string>();
  const [conflictRemoteAt, setConflict] = useState<string>();

  const tripRef = useRef(trip);
  tripRef.current = trip;
  const initialTrip = useRef(trip);
  const applyingRemote = useRef(false);
  const busy = useRef(false);
  const pending = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const conflictRef = useRef<string | undefined>(undefined);
  conflictRef.current = conflictRemoteAt;

  const fail = useCallback((e: unknown) => {
    if (e instanceof CloudError && e.status === 401) {
      setSessionState(undefined);
      setStatus('non_connesso');
      setError('Sessione scaduta: accedi di nuovo. Le modifiche restano salvate su questo dispositivo.');
      return;
    }
    setStatus('offline');
    setError(e instanceof Error ? e.message : 'Errore di rete');
  }, []);

  const applyRemote = useCallback(
    (t: Trip, at: string) => {
      applyingRemote.current = true;
      replace(t);
      setLastSync(t.id, at);
      setDirtyFlag(t.id, false);
      setLastSyncAt(at);
      setConflict(undefined);
      setStatus('sincronizzato');
      setError(undefined);
    },
    [replace],
  );

  const schedule = useCallback((ms: number, fn: () => void) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(fn, ms);
  }, []);

  const push = useCallback(async (): Promise<void> => {
    if (!config || !loadSession() || conflictRef.current) return;
    if (busy.current) {
      pending.current = true;
      return;
    }
    busy.current = true;
    const t = tripRef.current;
    setStatus('in_corso');
    try {
      const r = await saveCloudTripIfUnchanged(config, t, getLastSync(t.id));
      if (r.kind === 'conflitto') {
        const meta = await getCloudTripMeta(config, t.id);
        if (!meta) {
          // Nel cloud il viaggio non c'è più: lo ricrea con la versione locale
          lsSet(`nfhp.cloud.lastSync.${t.id}`, undefined);
          pending.current = true;
          return;
        }
        setConflict(meta.updated_at);
        setStatus('conflitto');
        return;
      }
      setLastSync(t.id, r.updatedAt);
      setLastSyncAt(r.updatedAt);
      const changedMeanwhile = tripRef.current !== t;
      setDirtyFlag(t.id, changedMeanwhile);
      if (changedMeanwhile) pending.current = true;
      setStatus(changedMeanwhile ? 'in_attesa' : 'sincronizzato');
      setError(undefined);
    } catch (e) {
      fail(e);
      schedule(RETRY_MS, () => void push());
    } finally {
      busy.current = false;
      if (pending.current) {
        pending.current = false;
        schedule(SYNC_DELAY_MS, () => void push());
      }
    }
  }, [config, fail, schedule]);

  /** Scarica le novità dal cloud; carica in automatico solo se qui non ci sono modifiche non salvate. */
  const pull = useCallback(async (): Promise<void> => {
    if (!config || !loadSession() || busy.current || conflictRef.current) return;
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
            setConflict(remote.updated_at);
            setStatus('conflitto');
          }
          return;
        }
        thenPush = dirty;
        setStatus(dirty ? 'in_attesa' : 'sincronizzato');
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
        thenPush = true;
      } else {
        thenPush = true; // viaggio non ancora nel cloud: lo carica
      }
      setError(undefined);
    } catch (e) {
      fail(e);
    } finally {
      busy.current = false;
    }
    if (thenPush) await push();
  }, [config, applyRemote, toast, fail, push]);

  // Ogni modifica locale: segna "da sincronizzare" e programma il salvataggio nel cloud
  useEffect(() => {
    if (trip === initialTrip.current) return;
    if (applyingRemote.current) {
      applyingRemote.current = false;
      return;
    }
    setDirtyFlag(trip.id, true);
    setLastSyncAt(getLastSync(trip.id));
    if (!config || !session || conflictRef.current) return;
    setStatus('in_attesa');
    schedule(SYNC_DELAY_MS, () => void push());
  }, [trip, config, session, push, schedule]);

  // All'avvio e dopo l'accesso: allinea con il cloud
  useEffect(() => {
    if (config && session) void pull();
  }, [config, session, pull]);

  // Torna in primo piano → cerca novità; va in secondo piano → salva subito
  useEffect(() => {
    if (!config || !session) return;
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void pull();
        return;
      }
      const t = tripRef.current;
      if (!conflictRef.current && !busy.current && hasUnsyncedChanges(t)) {
        void saveCloudTripIfUnchanged(config, t, getLastSync(t.id), { keepalive: true })
          .then((r) => {
            if (r.kind === 'salvato') {
              setLastSync(t.id, r.updatedAt);
              if (tripRef.current === t) setDirtyFlag(t.id, false);
            }
          })
          .catch(() => undefined);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onVis);
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
      conflictRemoteAt,
      setSession: (s) => {
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
      keepLocal: () => {
        // L'utente sceglie questa versione: diventa la base e sovrascrive il cloud
        const t = tripRef.current;
        if (conflictRef.current) setLastSync(t.id, conflictRef.current);
        conflictRef.current = undefined;
        setConflict(undefined);
        setDirtyFlag(t.id, true);
        void push();
      },
      useRemote: () => {
        if (!config) return;
        const id = tripRef.current.id;
        void loadCloudTrip(config, id)
          .then((r) => {
            applyRemote(r.trip, r.updatedAt);
            toast('Caricata la versione del cloud');
          })
          .catch(fail);
      },
      loadTrip: async (id: string) => {
        if (!config) return;
        const r = await loadCloudTrip(config, id);
        applyRemote(r.trip, r.updatedAt);
      },
    }),
    [config, session, status, lastSyncAt, error, conflictRemoteAt, push, pull, applyRemote, toast, fail],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCloudSync(): CloudSync {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCloudSync fuori da CloudSyncProvider');
  return c;
}
