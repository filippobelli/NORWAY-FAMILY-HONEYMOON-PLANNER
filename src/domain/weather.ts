// Previsioni meteo: utili solo quando il fornitore ne dà di sensate. Open-Meteo (gratuito per uso non commerciale,
// senza chiave, licenza CC BY 4.0, verificato il 06/11/2026) arriva fino a 16 giorni da oggi.
// Una previsione non è un avviso ufficiale: gli avvisi (es. MET Norway) non sono integrati.

export const FORECAST_HORIZON_DAYS = 16;

export type ForecastWindow = { available: true; daysAhead: number } | { available: false; reason: string; from?: string };

const DAY = 86_400_000;
const utc = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);

/** La giornata `date` ha una previsione sensata se è tra oggi e l'orizzonte del fornitore. */
export function forecastWindow(date: string, today: string, horizon = FORECAST_HORIZON_DAYS): ForecastWindow {
  const ahead = Math.round((utc(date) - utc(today)) / DAY);
  if (!Number.isFinite(ahead)) return { available: false, reason: 'Data non valida' };
  if (ahead < 0) return { available: false, reason: 'Giornata già passata: nessuna previsione' };
  if (ahead > horizon - 1) {
    const from = new Date(utc(date) - (horizon - 1) * DAY).toISOString().slice(0, 10);
    return { available: false, reason: `Previsione disponibile solo negli ultimi ${horizon} giorni prima`, from };
  }
  return { available: true, daysAhead: ahead };
}

/** Codici meteo WMO usati da Open-Meteo, in italiano. */
export const WMO_IT: Record<number, string> = {
  0: 'Sereno',
  1: 'Prevalentemente sereno',
  2: 'Parzialmente nuvoloso',
  3: 'Coperto',
  45: 'Nebbia',
  48: 'Nebbia con brina',
  51: 'Pioviggine leggera',
  53: 'Pioviggine',
  55: 'Pioviggine intensa',
  56: 'Pioviggine gelata',
  57: 'Pioviggine gelata intensa',
  61: 'Pioggia debole',
  63: 'Pioggia',
  65: 'Pioggia forte',
  66: 'Pioggia gelata',
  67: 'Pioggia gelata forte',
  71: 'Neve debole',
  73: 'Neve',
  75: 'Neve forte',
  77: 'Granelli di neve',
  80: 'Rovesci deboli',
  81: 'Rovesci',
  82: 'Rovesci violenti',
  85: 'Rovesci di neve',
  86: 'Rovesci di neve forti',
  95: 'Temporale',
  96: 'Temporale con grandine',
  99: 'Temporale con grandine forte',
};

export interface DayForecast {
  date: string;
  /** Località a cui si riferisce */
  place: string;
  lat: number;
  lng: number;
  tMax?: number;
  tMin?: number;
  precipitationMm?: number;
  code?: number;
  /** Quando la previsione è stata scaricata */
  fetchedAt: string;
  source: 'Open-Meteo';
}

/** Legge la risposta di Open-Meteo per una data; restituisce undefined se la data non c'è. */
export function parseOpenMeteo(json: unknown, date: string, meta: { place: string; lat: number; lng: number; fetchedAt: string }): DayForecast | undefined {
  const d = (json as { daily?: Record<string, unknown[]> })?.daily;
  const times = d?.time as string[] | undefined;
  const i = times?.indexOf(date) ?? -1;
  if (!d || i < 0) return undefined;
  const at = (k: string) => {
    const v = (d[k] as (number | null)[] | undefined)?.[i];
    return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
  };
  return { date, ...meta, tMax: at('temperature_2m_max'), tMin: at('temperature_2m_min'), precipitationMm: at('precipitation_sum'), code: at('weather_code'), source: 'Open-Meteo' };
}
