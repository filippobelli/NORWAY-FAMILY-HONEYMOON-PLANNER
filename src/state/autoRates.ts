import { useEffect, useRef } from 'react';
import { fetchEurNok, fetchFuelPrice } from '../services/rates';
import type { CloudStatus } from './cloudSync';
import { useTrip } from './store';

const CHECK_KEY = 'nfhp.rates.checkedAt';
const EVERY_MS = 6 * 3600 * 1000;

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

/**
 * All'apertura (al massimo ogni 6 ore) aggiorna il cambio e il prezzo medio del carburante.
 * Aspetta che la sincronizzazione cloud sia ferma, così l'aggiornamento non si sovrappone al download.
 * Non tocca i valori che l'utente ha scelto di impostare a mano.
 */
export function useAutoRates(cloudStatus: CloudStatus): void {
  const { trip, update } = useTrip();
  const done = useRef(false);
  const latest = useRef(trip);
  latest.current = trip;

  useEffect(() => {
    if (done.current) return;
    if (cloudStatus === 'in_corso' || cloudStatus === 'in_attesa' || cloudStatus === 'conflitto') return;
    done.current = true;
    try {
      const last = Number(localStorage.getItem(CHECK_KEY) ?? 0);
      if (Date.now() - last < EVERY_MS) return;
    } catch {
      /* senza storage si controlla a ogni apertura */
    }
    void (async () => {
      const s = latest.current.settings;
      let ok = false;
      if (s.nokRateAuto !== false) {
        try {
          const r = await fetchEurNok();
          ok = true;
          if (Math.abs(r.nokPerEur - s.nokPerEur) > 0.00005 || r.date !== s.nokRateDate) {
            update((t) =>
              t.settings.nokRateAuto === false
                ? t
                : {
                    ...t,
                    settings: { ...t.settings, nokPerEur: r.nokPerEur, nokRateDate: r.date, nokRateNote: `${r.source}, cambio del ${fmtDate(r.date)} (aggiornato in automatico).` },
                  },
            );
          }
        } catch {
          /* resta il valore salvato */
        }
      }
      const car = latest.current.settings.car;
      if (car && car.priceAuto && car.fuel !== 'elettrica') {
        try {
          const p = await fetchFuelPrice(car.fuel);
          ok = true;
          if (p.nokPerLitre !== car.priceNok || p.period !== car.pricePeriod) {
            update((t) =>
              !t.settings.car || !t.settings.car.priceAuto || t.settings.car.fuel !== car.fuel
                ? t
                : { ...t, settings: { ...t.settings, car: { ...t.settings.car, priceNok: p.nokPerLitre, pricePeriod: p.period, priceSource: p.source } } },
            );
          }
        } catch {
          /* resta il valore salvato */
        }
      }
      if (ok) {
        try {
          localStorage.setItem(CHECK_KEY, String(Date.now()));
        } catch {
          /* niente */
        }
      }
    })();
  }, [cloudStatus, update]);
}

/** Aggiornamento richiesto a mano (pulsante "Aggiorna ora"). */
export async function refreshRatesNow(fuel?: 'benzina' | 'diesel'): Promise<{ rate?: Awaited<ReturnType<typeof fetchEurNok>>; fuel?: Awaited<ReturnType<typeof fetchFuelPrice>> }> {
  const [rate, price] = await Promise.allSettled([fetchEurNok(), fuel ? fetchFuelPrice(fuel) : Promise.reject(new Error('n/a'))]);
  return { rate: rate.status === 'fulfilled' ? rate.value : undefined, fuel: price.status === 'fulfilled' ? price.value : undefined };
}

export { fmtDate as formatRateDate };
