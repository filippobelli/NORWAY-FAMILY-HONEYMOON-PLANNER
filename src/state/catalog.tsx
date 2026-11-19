import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { installCatalog, useCatalog, type CatalogState } from '../catalog/registry';
import { FILE_COUNTRY } from '../data/country';
import { catalogNews, pendingUpgrades, releaseVersion, tripCountries, upgradeCatalog, type LatestRelease } from '../domain/countries';
import { cloudCatalogTransport, loadTripCatalogs, prepareRelease, pruneCatalogs, releasesToKeep, type AvailableCountry, type CatalogLoadState } from '../services/catalog/catalogService';
import { deviceStore } from '../services/storage/dataStore';
import { useCloudSync } from './cloudSync';
import { useTrip } from './store';

// Catalogo delle nazioni del viaggio nell'app:
// - con il cloud configurato: copia offline per versione, download con catalog_bundle se manca;
// - senza cloud (solo sviluppo e test, D1): catalogo di prova dai file di src/data.
// Finché un catalogo non arriva resta in uso quello precedente (all'avvio, i file: per la Norvegia sono la versione 1).
// Regola del 19/11/2026: il viaggio passa da solo all'ultima versione pubblicata (scaricata e controllata prima), e le
// versioni vecchie vengono cancellate dal database. Il passaggio avviene a viaggio allineato con il cloud.

interface CatalogCtx {
  state: CatalogState;
  /** Modalità di prova senza cloud: catalogo dai file */
  fileMode: boolean;
  /** Stato del catalogo per nazione del viaggio */
  states: Record<string, CatalogLoadState>;
  errors: Record<string, string>;
  /** Scarica di nuovo i cataloghi mancanti */
  retry: () => void;
  /** Nazioni con un catalogo pubblicato (ultima versione); undefined finché non sono state chieste */
  available?: AvailableCountry[];
  availableError?: string;
  loadAvailable: () => Promise<AvailableCountry[] | undefined>;
  /**
   * Prepara una versione prima di associarla al viaggio: «app» se è già contenuta nei file dell'app (senza cloud o senza
   * accesso), «dispositivo» se è stata scaricata e controllata. Lancia un errore se non riesce.
   */
  prepare: (releaseId: string) => Promise<'app' | 'dispositivo'>;
  /** Aggiornamento automatico all'ultima versione: in corso o non riuscito (si riprova da solo) */
  autoUpgrade?: { phase: 'in_corso' | 'errore'; releaseId: string; error?: string };
}

const Ctx = createContext<CatalogCtx | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { trip, update, toast, readOnly } = useTrip();
  const { config, session, status, pending } = useCloudSync();
  const [autoUpgrade, setAutoUpgrade] = useState<CatalogCtx['autoUpgrade']>();
  const upgrading = useRef(false);
  const state = useCatalog();
  const [states, setStates] = useState<Record<string, CatalogLoadState>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [available, setAvailable] = useState<AvailableCountry[]>();
  const [availableError, setAvailableError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const countries = tripCountries(trip);
  const signature = countries.map((c) => `${c.code}:${c.releaseId}`).join(',');
  const fileMode = !config;
  const loaded = useRef('');
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    const list = signature ? signature.split(',').map((x) => ({ code: x.split(':')[0]!, releaseId: x.split(':')[1]! })) : [];
    const tx = session ? cloudCatalogTransport(config) : undefined;
    void loadTripCatalogs(list, deviceStore(), tx, (code, s) => {
      if (!cancelled) setStates((p) => ({ ...p, [code]: s }));
    }).then((r) => {
      if (cancelled) return;
      setStates(r.states);
      setErrors(r.errors);
      const key = `${signature}|${Object.entries(r.states).filter(([, s]) => s === 'sul_dispositivo').map(([c]) => c).join(',')}`;
      if (r.catalog && loaded.current !== key) {
        loaded.current = key;
        installCatalog(r.catalog);
      }
      for (const c of list) seen.current.add(c.releaseId);
      // Si pulisce solo quando tutte le versioni del viaggio sono sul dispositivo: mai lasciare il viaggio senza catalogo
      const keep = releasesToKeep(r.states, list, seen.current);
      if (keep) void pruneCatalogs(deviceStore(), keep).catch(() => undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [signature, fileMode, config, session, attempt]);

  // Senza rete i download riprovano da soli al ritorno della connessione
  useEffect(() => {
    if (fileMode) return;
    const on = () => setAttempt((n) => n + 1);
    window.addEventListener('online', on);
    return () => window.removeEventListener('online', on);
  }, [fileMode]);

  const loadAvailable = useCallback(async () => {
    if (!config || !session) {
      setAvailableError('Accedi al cloud per vedere le nazioni disponibili.');
      return undefined;
    }
    try {
      const a = await cloudCatalogTransport(config).available();
      setAvailable(a);
      setAvailableError(undefined);
      return a;
    } catch (e) {
      setAvailableError(e instanceof Error ? e.message : String(e));
      return undefined;
    }
  }, [config, session]);

  const prepare = useCallback(
    async (releaseId: string): Promise<'app' | 'dispositivo'> => {
      // Senza cloud, o senza accesso, l'app usa i propri file: la versione che contengono è già pronta
      if (!config || (!session && releaseId === FILE_COUNTRY.releaseId)) return 'app';
      seen.current.add(releaseId);
      await prepareRelease(deviceStore(), session ? cloudCatalogTransport(config) : undefined, releaseId);
      return 'dispositivo';
    },
    [config, session],
  );

  // Passaggio automatico all'ultima versione. Con l'accesso al cloud l'elenco viene dal server e si aspetta che il
  // viaggio sia allineato (niente modifiche in sospeso, nessun conflitto); senza accesso vale la versione contenuta nei
  // file dell'app. Prima si scarica e si controlla la versione nuova: se non riesce il viaggio resta com'è e si riprova
  // al prossimo tentativo (rete che torna, «Riprova»).
  // Con il cloud configurato ma senza accesso, un viaggio ancora vuoto non si tocca: su un dispositivo nuovo, all'accesso,
  // si apre il viaggio del cloud e un viaggio vuoto non va caricato solo per la versione del catalogo.
  const hasStops = trip.stops.length > 0;
  const ready = !readOnly && (session ? status === 'sincronizzato' && !pending : !config || hasStops);
  useEffect(() => {
    if (!ready || upgrading.current) return;
    let cancelled = false;
    upgrading.current = true;
    void (async () => {
      try {
        let latest: LatestRelease[];
        if (config && session) {
          const a = await cloudCatalogTransport(config).available();
          if (!cancelled) setAvailable(a);
          latest = a;
        } else latest = [{ code: FILE_COUNTRY.code, releaseId: FILE_COUNTRY.releaseId, version: FILE_COUNTRY.version }];
        const todo = pendingUpgrades({ countries: signature ? signature.split(',').map((x) => ({ code: x.split(':')[0]!, releaseId: x.split(':')[1]! })) : undefined }, latest);
        for (const u of todo) {
          if (cancelled) return;
          setAutoUpgrade({ phase: 'in_corso', releaseId: u.to.releaseId });
          try {
            await prepare(u.to.releaseId);
          } catch (e) {
            if (!cancelled) setAutoUpgrade({ phase: 'errore', releaseId: u.to.releaseId, error: e instanceof Error ? e.message : String(e) });
            return;
          }
          if (cancelled) return;
          update((t) => upgradeCatalog(t, u.code, u.to.releaseId));
          const news = catalogNews(u.code, releaseVersion(u.from) ?? 1, u.to.version);
          toast(`Catalogo aggiornato alla versione ${u.to.version}${news.length ? `: ${news.join('; ')}` : ''}`);
        }
        if (!cancelled) setAutoUpgrade(undefined);
      } catch (e) {
        // Elenco delle versioni non disponibile (rete): si riprova al prossimo tentativo
        if (!cancelled) setAvailableError(e instanceof Error ? e.message : String(e));
      } finally {
        upgrading.current = false;
      }
    })();
    return () => {
      cancelled = true;
      upgrading.current = false;
    };
  }, [ready, signature, config, session, attempt, prepare, update, toast]);

  const value = useMemo<CatalogCtx>(
    () => ({ state, fileMode, states, errors, retry: () => setAttempt((n) => n + 1), available, availableError, loadAvailable, prepare, autoUpgrade }),
    [state, fileMode, states, errors, available, availableError, loadAvailable, prepare, autoUpgrade],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTripCatalog(): CatalogCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTripCatalog fuori da CatalogProvider');
  return c;
}
