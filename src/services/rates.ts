// Cambio EUR/NOK e prezzo medio nazionale dei carburanti, letti da fonti ufficiali con API pubbliche (CORS abilitato).
// Verificati il 27/10/2026 dal browser:
// - Norges Bank, serie EXR B.EUR.NOK.SP (cambio di riferimento giornaliero) → 10,3885 il 27/10/2026;
//   riserva: Frankfurter (tassi di riferimento BCE).
// - Statistics Norway (SSB), tabella 09654 "Priser på drivstoff", media nazionale mensile in NOK per litro
//   (031 = benzina senza piombo 95, 035 = diesel). Ultimo mese disponibile al 27/10/2026: settembre 2026.

export interface RateResult {
  nokPerEur: number;
  date: string;
  source: string;
}

async function getJson(url: string, init?: RequestInit, timeoutMs = 10000): Promise<unknown> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ac.signal });
    if (!res.ok) throw new Error(`errore ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

interface SdmxJson {
  data?: {
    dataSets?: { series?: Record<string, { observations?: Record<string, [string, ...unknown[]]> }> }[];
    structure?: { dimensions?: { observation?: { values?: { id: string }[] }[] } };
  };
}

export function parseNorgesBank(j: SdmxJson): RateResult | undefined {
  const series = Object.values(j.data?.dataSets?.[0]?.series ?? {})[0];
  const obs = series?.observations ?? {};
  const keys = Object.keys(obs).sort((a, b) => Number(a) - Number(b));
  const last = keys[keys.length - 1];
  if (last === undefined) return undefined;
  const v = Number(obs[last]?.[0]);
  const date = j.data?.structure?.dimensions?.observation?.[0]?.values?.[Number(last)]?.id;
  if (!Number.isFinite(v) || v <= 0 || !date) return undefined;
  return { nokPerEur: v, date, source: 'Norges Bank' };
}

export async function fetchEurNok(): Promise<RateResult> {
  try {
    const j = (await getJson('https://data.norges-bank.no/api/data/EXR/B.EUR.NOK.SP?format=sdmx-json&lastNObservations=1&locale=en')) as SdmxJson;
    const r = parseNorgesBank(j);
    if (r) return r;
  } catch {
    /* si prova la fonte di riserva */
  }
  const j = (await getJson('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=NOK')) as { date?: string; rates?: { NOK?: number } };
  const v = j.rates?.NOK;
  if (!v || !j.date) throw new Error('Cambio non disponibile');
  return { nokPerEur: v, date: j.date, source: 'BCE (via Frankfurter)' };
}

export interface FuelPrice {
  nokPerLitre: number;
  /** es. "2026M09" */
  period: string;
  source: string;
}

interface JsonStat2 {
  value?: (number | null)[];
  dimension?: { Tid?: { category?: { index?: Record<string, number> } } };
}

export function parseSsbFuel(j: JsonStat2): FuelPrice | undefined {
  const idx = j.dimension?.Tid?.category?.index ?? {};
  const periods = Object.entries(idx).sort((a, b) => a[1] - b[1]);
  // Ultimo mese con un valore
  for (let i = periods.length - 1; i >= 0; i--) {
    const [period, pos] = periods[i]!;
    const v = j.value?.[pos];
    if (typeof v === 'number' && v > 0) return { nokPerLitre: v, period, source: 'Statistics Norway (SSB), tabella 09654' };
  }
  return undefined;
}

export async function fetchFuelPrice(fuel: 'benzina' | 'diesel'): Promise<FuelPrice> {
  const body = {
    query: [
      { code: 'PetroleumProd', selection: { filter: 'item', values: [fuel === 'benzina' ? '031' : '035'] } },
      { code: 'Tid', selection: { filter: 'top', values: ['3'] } },
    ],
    response: { format: 'json-stat2' },
  };
  const j = (await getJson('https://data.ssb.no/api/v0/no/table/09654', { method: 'POST', body: JSON.stringify(body) })) as JsonStat2;
  const r = parseSsbFuel(j);
  if (!r) throw new Error('Prezzo carburante non disponibile');
  return r;
}
