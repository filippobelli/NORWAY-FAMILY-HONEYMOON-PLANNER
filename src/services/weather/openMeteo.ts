import { parseOpenMeteo, type DayForecast } from '../../domain/weather';

// Open-Meteo, API gratuita per uso non commerciale, senza chiave (termini letti il 06/11/2026: https://open-meteo.com/en/terms).
// Dati con licenza CC BY 4.0: l'attribuzione è mostrata accanto alla previsione. Si chiama solo su richiesta dell'utente;
// la risposta resta nella sessione del browser per non ripetere richieste uguali.

const BASE = 'https://api.open-meteo.com/v1/forecast';
const CACHE_KEY = 'nfhp.weather.v1';
const CACHE_MS = 3 * 60 * 60 * 1000;

type Cache = Record<string, DayForecast>;
function readCache(): Cache {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? '{}') as Cache;
  } catch {
    return {};
  }
}

export class WeatherError extends Error {}

export async function fetchDayForecast(p: { place: string; lat: number; lng: number }, date: string, signal?: AbortSignal): Promise<DayForecast> {
  // Coordinate arrotondate: bastano per la previsione e non rivelano un indirizzo preciso
  const lat = Math.round(p.lat * 100) / 100;
  const lng = Math.round(p.lng * 100) / 100;
  const key = `${lat},${lng},${date}`;
  const cached = readCache()[key];
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < CACHE_MS) return cached;
  const url = `${BASE}?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=Europe%2FOslo&start_date=${date}&end_date=${date}`;
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new WeatherError('Servizio meteo non raggiungibile: controlla la connessione e riprova.');
  }
  if (!res.ok) throw new WeatherError(`Il servizio meteo ha risposto con errore ${res.status}.`);
  const f = parseOpenMeteo(await res.json(), date, { place: p.place, lat, lng, fetchedAt: new Date().toISOString() });
  if (!f) throw new WeatherError('Il servizio meteo non ha restituito una previsione per questa data.');
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...readCache(), [key]: f }));
  } catch {
    /* senza sessionStorage la previsione si scarica di nuovo */
  }
  return f;
}
