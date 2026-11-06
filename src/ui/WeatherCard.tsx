import { useEffect, useRef, useState } from 'react';
import { formatDateIt } from '../domain/itinerary';
import type { Stop } from '../domain/types';
import { forecastWindow, WMO_IT, type DayForecast } from '../domain/weather';
import { fetchDayForecast } from '../services/weather/openMeteo';
import { useOnline } from '../state/uiContext';
import { fmtDateTime } from './common';
import { Icon } from './icons';

/**
 * Previsione per la giornata e la località, solo su richiesta e solo nei giorni in cui il fornitore ne dà.
 * È una previsione, non un avviso ufficiale. Senza rete o fuori dall'intervallo non si mostra nulla di inventato.
 */
export function WeatherCard({ date, place, today }: { date: string; place: Stop; today: string }) {
  const win = forecastWindow(date, today);
  const online = useOnline();
  const [state, setState] = useState<{ kind: 'idle' | 'loading' | 'ok' | 'error'; f?: DayForecast; error?: string }>({ kind: 'idle' });
  const ac = useRef<AbortController | null>(null);
  useEffect(() => {
    setState({ kind: 'idle' });
    return () => ac.current?.abort();
  }, [date, place.id]);
  const load = () => {
    ac.current?.abort();
    const c = new AbortController();
    ac.current = c;
    setState({ kind: 'loading' });
    fetchDayForecast({ place: place.name, lat: place.lat, lng: place.lng }, date, c.signal)
      .then((f) => !c.signal.aborted && setState({ kind: 'ok', f }))
      .catch((e: unknown) => {
        if ((e as Error).name !== 'AbortError' && !c.signal.aborted) setState({ kind: 'error', error: (e as Error).message });
      });
  };
  return (
    <section className="t-card weather" aria-labelledby="weather-title">
      <h2 id="weather-title">
        <Icon name="sun" /> Meteo · {place.name}, {formatDateIt(date)}
      </h2>
      {!win.available ? (
        <p className="small muted">
          {win.reason}
          {win.from ? `: per questa giornata dal ${formatDateIt(win.from)}.` : '.'}
        </p>
      ) : state.kind === 'ok' && state.f ? (
        <div role="status">
          <p>
            <strong>{state.f.code !== undefined ? (WMO_IT[state.f.code] ?? `Codice meteo ${state.f.code}`) : 'Condizioni non indicate'}</strong>
            {state.f.tMin !== undefined && state.f.tMax !== undefined && ` · ${Math.round(state.f.tMin)}–${Math.round(state.f.tMax)} °C`}
            {state.f.precipitationMm !== undefined && ` · pioggia ${state.f.precipitationMm.toLocaleString('it-IT')} mm`}
          </p>
          <p className="small muted">
            Previsione, non avviso ufficiale. Fonte: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> (CC BY 4.0), aggiornata {fmtDateTime(state.f.fetchedAt)}, per le coordinate{' '}
            {state.f.lat}, {state.f.lng}.
          </p>
          <button className="btn btn-small" onClick={load}>
            Aggiorna
          </button>
        </div>
      ) : (
        <>
          <p className="small muted">La previsione si scarica da Open-Meteo solo quando lo chiedi: invia le coordinate approssimate della tappa. Non è un avviso ufficiale.</p>
          {state.kind === 'error' && (
            <p className="small error" role="alert">
              {state.error}
            </p>
          )}
          {state.kind === 'loading' ? (
            <p className="small" role="status">
              <span className="spinner" aria-hidden /> Scarico la previsione…
            </p>
          ) : (
            <button className="btn" disabled={!online} onClick={load}>
              {online ? (state.kind === 'error' ? 'Riprova' : 'Mostra la previsione') : 'Serve la rete per la previsione'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
