import { useEffect, useState } from 'react';

import { getContext, setContext } from './workContext';

// Contesto di lavoro: nel cloud per utente (user_context) con la copia sul dispositivo per l'uso senza rete
// (state/workContext.ts). Prima stava solo nella sessione del browser.

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

export const loadNotice = () => getContext().activation as ActivationNotice | undefined;
export const saveNotice = (n: ActivationNotice | undefined) => setContext({ activation: n });

// ---------- Ritorno dalla modalità viaggio ----------

export const loadLastPlanning = () => getContext().lastPlanning ?? '#/pianifica';
export const saveLastPlanning = (hash: string) => setContext({ lastPlanning: hash });

// ---------- Modalità viaggio: giornata e tappa restano le stesse passando da una schermata all'altra ----------

export interface TravelContext {
  /** Data di oggi quando è stato scelto il giorno: domani si riparte dal giorno giusto */
  on: string;
  dayIndex?: number;
  stopId?: string;
}

export const loadTravelContext = (today: string): TravelContext => {
  const c = getContext().travel as TravelContext | undefined;
  return c?.on === today ? c : { on: today };
};
export const saveTravelContext = (c: TravelContext) => setContext({ travel: c });

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
