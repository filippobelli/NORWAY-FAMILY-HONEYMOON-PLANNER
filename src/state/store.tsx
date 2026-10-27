import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createEmptyTrip } from '../domain/defaults';
import { syncLegs } from '../domain/itinerary';
import type { Trip } from '../domain/types';
import { loadLocalTrip, saveLocalTrip } from '../services/storage/local';

export type LocalSaveState = 'salvato' | 'in_attesa' | 'errore';

interface Store {
  trip: Trip;
  update: (fn: (t: Trip) => Trip) => void;
  replace: (t: Trip) => void;
  localState: LocalSaveState;
  loadError?: string;
  toast: (msg: string, kind?: 'ok' | 'errore', action?: ToastAction) => void;
  dismissToast: (id: number) => void;
  toasts: Toast[];
}

export interface ToastAction {
  label: string;
  run: () => void;
}
export interface Toast {
  id: number;
  msg: string;
  kind: 'ok' | 'errore';
  action?: ToastAction;
}

const Ctx = createContext<Store | null>(null);

function initial(): { trip: Trip; error?: string } {
  const r = loadLocalTrip();
  return { trip: r.trip ?? createEmptyTrip(), error: r.error };
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [init] = useState(initial);
  const [trip, setTrip] = useState<Trip>(init.trip);
  const [localState, setLocalState] = useState<LocalSaveState>('salvato');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const first = useRef(true);
  // Se i dati locali erano illeggibili non sovrascriverli finché l'utente non modifica qualcosa.
  const blockedWrite = useRef(Boolean(init.error));

  const update = useCallback((fn: (t: Trip) => Trip) => {
    blockedWrite.current = false;
    setTrip((prev) => {
      const next = fn(prev);
      if (next === prev) return prev;
      const legs = next.stops !== prev.stops || next.legs !== prev.legs ? syncLegs(next.stops, next.legs) : next.legs;
      return { ...next, legs, updatedAt: new Date().toISOString() };
    });
  }, []);

  const replace = useCallback((t: Trip) => {
    blockedWrite.current = false;
    setTrip({ ...t, legs: syncLegs(t.stops, t.legs) });
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (blockedWrite.current) return;
    setLocalState('in_attesa');
    const h = window.setTimeout(() => setLocalState(saveLocalTrip(trip) ? 'salvato' : 'errore'), 400);
    return () => window.clearTimeout(h);
  }, [trip]);

  // Salva subito se la pagina viene chiusa o ricaricata durante l'attesa del salvataggio.
  const latest = useRef(trip);
  latest.current = trip;
  useEffect(() => {
    const flush = () => {
      if (!blockedWrite.current) saveLocalTrip(latest.current);
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((msg: string, kind: 'ok' | 'errore' = 'ok', action?: ToastAction) => {
    const id = Date.now() + Math.random();
    // Al massimo 2 avvisi visibili: su smartphone non devono coprire lo schermo
    setToasts((t) => [...t.slice(-1), { id, msg, kind, action }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 8000 : kind === 'errore' ? 7000 : 3000);
  }, []);

  const value = useMemo<Store>(
    () => ({ trip, update, replace, localState, loadError: init.error, toast, dismissToast, toasts }),
    [trip, update, replace, localState, init.error, toast, dismissToast, toasts],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrip(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useTrip fuori da TripProvider');
  return s;
}
