// Leaflet viene caricato da CDN (unpkg, versione fissata) al primo uso della mappa.
// Così il provider della mappa resta isolato qui: per passare a un pacchetto npm o a un altro
// motore basta cambiare questo file. Tipi minimi limitati alle API usate dall'app.

const LEAFLET_VERSION = '1.9.4';
const CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

export interface LLayer {
  addTo(target: LMap | LLayerGroup): LLayer;
  remove(): void;
  bindTooltip(content: string, opts?: Record<string, unknown>): LLayer;
  bindPopup(content: string | HTMLElement): LLayer;
  on(event: string, fn: () => void): LLayer;
}
export interface LLayerGroup {
  addTo(map: LMap): LLayerGroup;
  clearLayers(): void;
}
export interface LBounds {
  isValid(): boolean;
}
export interface LMap {
  setView(center: [number, number], zoom: number): LMap;
  fitBounds(b: LBounds, opts?: Record<string, unknown>): LMap;
  invalidateSize(): void;
  remove(): void;
}
export interface LeafletApi {
  map(el: HTMLElement, opts?: Record<string, unknown>): LMap;
  tileLayer(url: string, opts: Record<string, unknown>): LLayer;
  layerGroup(): LLayerGroup;
  circleMarker(ll: [number, number], opts: Record<string, unknown>): LLayer;
  marker(ll: [number, number], opts: Record<string, unknown>): LLayer;
  divIcon(opts: Record<string, unknown>): unknown;
  polyline(lls: [number, number][], opts: Record<string, unknown>): LLayer;
  latLngBounds(lls: [number, number][]): LBounds;
}

let loading: Promise<LeafletApi> | null = null;

export function loadLeaflet(timeoutMs = 15000): Promise<LeafletApi> {
  const w = window as unknown as { L?: LeafletApi };
  if (w.L) return Promise.resolve(w.L);
  if (loading) return loading;
  loading = new Promise<LeafletApi>((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = CSS_URL;
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = JS_URL;
    script.async = true;
    const timer = window.setTimeout(() => reject(new Error('Timeout nel caricamento della mappa')), timeoutMs);
    script.onload = () => {
      window.clearTimeout(timer);
      if (w.L) resolve(w.L);
      else reject(new Error('Libreria mappa non disponibile'));
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('Impossibile scaricare la libreria della mappa (connessione assente o bloccata)'));
    };
    document.head.appendChild(script);
  }).catch((e: unknown) => {
    loading = null;
    throw e;
  });
  return loading;
}

export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">contributori OpenStreetMap</a>';
