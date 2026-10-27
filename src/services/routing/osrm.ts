import { newId } from '../../domain/ids';
import type { Segment } from '../../domain/types';
import { RoutingError, type LatLng, type RouteResult, type RoutingProvider } from './types';

// Server OSRM pubblico della FOSSGIS (dati OpenStreetMap).
// Regole d'uso (verificate il 27/10/2026, https://routing.openstreetmap.de/about.html):
// max 1 richiesta al secondo, niente uso massivo, attribuzione obbligatoria.
// Per un uso più intenso conviene un provider con chiave (GraphHopper, OpenRouteService) via backend.
const DEFAULT_BASE = 'https://routing.openstreetmap.de/routed-car';

interface OsrmStep {
  mode: string;
  distance: number;
  duration: number;
  name?: string;
  geometry?: { coordinates: [number, number][] };
}
interface OsrmResponse {
  code: string;
  message?: string;
  routes?: { distance: number; duration: number; legs: { steps: OsrmStep[] }[] }[];
}

/** Raggruppa gli step OSRM consecutivi per modalità (driving / ferry) in segmenti del planner. */
export function stepsToSegments(steps: OsrmStep[], checkedAt: string, providerLabel: string): Segment[] {
  const groups: { mode: 'strada' | 'traghetto'; steps: OsrmStep[] }[] = [];
  for (const st of steps) {
    const mode = st.mode === 'ferry' ? 'traghetto' : 'strada';
    const last = groups[groups.length - 1];
    if (last && last.mode === mode) last.steps.push(st);
    else groups.push({ mode, steps: [st] });
  }
  return groups
    .map((g): Segment => {
      const distance = g.steps.reduce((a, s) => a + s.distance, 0);
      const duration = g.steps.reduce((a, s) => a + s.duration, 0);
      const geometry: [number, number][] = [];
      for (const s of g.steps) for (const [lng, lat] of s.geometry?.coordinates ?? []) geometry.push([lat, lng]);
      const ferryName = g.steps.find((s) => s.name)?.name;
      const isFerry = g.mode === 'traghetto';
      return {
        id: newId(),
        mode: g.mode,
        label: isFerry ? `Traghetto${ferryName ? ` ${ferryName}` : ''}` : 'Percorso stradale',
        distanceKm: Math.round((distance / 1000) * 10) / 10,
        durationMin: Math.round(duration / 60),
        geometry,
        status: 'stimato',
        costStatus: 'da_verificare',
        source: { label: providerLabel, checkedAt },
        note: isFerry
          ? 'Durata della traversata da OpenStreetMap: attesa, imbarco, orari e prezzo NON inclusi. Verificare con l\'operatore.'
          : 'Tempo di guida teorico senza soste.',
      };
    })
    .filter((s) => (s.distanceKm ?? 0) > 0 || (s.durationMin ?? 0) > 0);
}

let lastCall = 0;
async function throttle(): Promise<void> {
  const wait = lastCall + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
}

export function createOsrmProvider(base = DEFAULT_BASE): RoutingProvider {
  const providerLabel = 'OSRM (routing.openstreetmap.de) — © contributori OpenStreetMap';
  return {
    name: 'OSRM FOSSGIS',
    async route(from: LatLng, to: LatLng, signal?: AbortSignal): Promise<RouteResult> {
      await throttle();
      const url = `${base}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false&steps=true&geometries=geojson`;
      let res: Response;
      try {
        res = await fetch(url, { signal });
      } catch (e) {
        if ((e as Error).name === 'AbortError') throw e;
        throw new RoutingError('Servizio di calcolo percorsi non raggiungibile. Riprova più tardi.', 'rete');
      }
      if (res.status === 429) throw new RoutingError('Troppe richieste al servizio di routing: attendi qualche secondo.', 'limite');
      if (!res.ok) throw new RoutingError(`Il servizio di routing ha risposto con errore ${res.status}.`, 'rete');
      let data: OsrmResponse;
      try {
        data = (await res.json()) as OsrmResponse;
      } catch {
        throw new RoutingError('Risposta del servizio di routing non leggibile.', 'risposta_non_valida');
      }
      if (data.code !== 'Ok' || !data.routes?.[0]) {
        throw new RoutingError(
          data.code === 'NoRoute' ? 'Nessun percorso stradale trovato tra queste tappe.' : `Calcolo non riuscito (${data.code}).`,
          data.code === 'NoRoute' ? 'nessun_percorso' : 'risposta_non_valida',
        );
      }
      const steps = data.routes[0].legs.flatMap((l) => l.steps);
      const segments = stepsToSegments(steps, new Date().toISOString(), providerLabel);
      return { segments, providerName: 'OSRM', attribution: providerLabel };
    },
  };
}
