import { useEffect, useState } from 'react';

// Contesto dell'interfaccia che non fa parte del viaggio: resta nella sessione del browser, non va mai nel cloud.

function read<T>(key: string): T | undefined {
  try {
    const v = sessionStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : undefined;
  } catch {
    return undefined;
  }
}
function write(key: string, value: unknown): void {
  try {
    if (value === undefined) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* senza sessionStorage il contesto vale finché la schermata resta aperta */
  }
}

// ---------- Attivazione di una proposta ----------

export interface ActivationNotice {
  scenarioId: string;
  name: string;
  fromId: string;
  fromName: string;
  /** L'itinerario sostituito non aveva tappe */
  fromEmpty: boolean;
  /** Limite giornaliero prima dell'attivazione, per tornare indietro */
  prevLimit: number;
}

const NOTICE_KEY = 'nfhp.ui.activation';
export const loadNotice = () => read<ActivationNotice>(NOTICE_KEY);
export const saveNotice = (n: ActivationNotice | undefined) => write(NOTICE_KEY, n);

// ---------- Ritorno dalla modalità viaggio ----------

const PLANNING_KEY = 'nfhp.ui.lastPlanning';
export const loadLastPlanning = () => read<string>(PLANNING_KEY) ?? '#/pianifica';
export const saveLastPlanning = (hash: string) => write(PLANNING_KEY, hash);

// ---------- Modalità viaggio: giornata e tappa restano le stesse passando da una schermata all'altra ----------

export interface TravelContext {
  /** Data di oggi quando è stato scelto il giorno: domani si riparte dal giorno giusto */
  on: string;
  dayIndex?: number;
  stopId?: string;
}

const TRAVEL_KEY = 'nfhp.ui.travel';
export const loadTravelContext = (today: string): TravelContext => {
  const c = read<TravelContext>(TRAVEL_KEY);
  return c?.on === today ? c : { on: today };
};
export const saveTravelContext = (c: TravelContext) => write(TRAVEL_KEY, c);

// ---------- Hook ----------

/** Stato della rete secondo il browser: «online» non garantisce che i servizi rispondano, «offline» sì che non rispondono. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', on);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', on);
    };
  }, []);
  return online;
}

export function useMediaQuery(query: string): boolean {
  const [hit, setHit] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const m = window.matchMedia?.(query);
    if (!m) return;
    const on = () => setHit(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return hit;
}
