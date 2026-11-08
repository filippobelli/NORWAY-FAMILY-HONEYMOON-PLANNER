import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { installCatalog, useCatalog, type CatalogState } from '../catalog/registry';
import { tripCountries } from '../domain/countries';
import { cloudCatalogTransport, loadTripCatalogs, pruneCatalogs, type AvailableCountry, type CatalogLoadState } from '../services/catalog/catalogService';
import { deviceStore } from '../services/storage/dataStore';
import { useCloudSync } from './cloudSync';
import { useTrip } from './store';

// Catalogo delle nazioni del viaggio nell'app:
// - con il cloud configurato: copia offline per versione, download con catalog_bundle se manca;
// - senza cloud (solo sviluppo e test, D1): catalogo di prova dai file di src/data.
// Finché un catalogo non arriva resta in uso quello precedente (all'avvio, i file: per la Norvegia sono la versione 1).

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
}

const Ctx = createContext<CatalogCtx | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { trip } = useTrip();
  const { config, session } = useCloudSync();
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
      if (list.length) void pruneCatalogs(deviceStore(), list.map((c) => c.releaseId)).catch(() => undefined);
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

  const value = useMemo<CatalogCtx>(
    () => ({ state, fileMode, states, errors, retry: () => setAttempt((n) => n + 1), available, availableError, loadAvailable }),
    [state, fileMode, states, errors, available, availableError, loadAvailable],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTripCatalog(): CatalogCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTripCatalog fuori da CatalogProvider');
  return c;
}
