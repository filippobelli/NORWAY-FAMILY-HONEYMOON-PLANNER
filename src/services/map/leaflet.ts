// Leaflet viene caricato da CDN (unpkg, versione fissata) al primo uso della mappa.
// Così il provider della mappa resta isolato qui: per passare a un pacchetto npm o a un altro
// motore basta cambiare questo file. Tipi minimi limitati alle API usate dall'app.

const LEAFLET_VERSION = '1.9.4';
const CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
// Impronte SHA-384 calcolate il 27/10/2026 sui file serviti da unpkg: se il file cambiasse, il browser lo rifiuterebbe.
const CSS_SRI = 'sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H';
const JS_SRI = 'sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH';

export interface LLayer {
  addTo(target: LMap | LLayerGroup): LLayer;
  remove(): void;
  bindTooltip(content: string, opts?: Record<string, unknown>): LLayer;
  bindPopup(content: string | HTMLElement): LLayer;
  on(event: string, fn: () => void): LLayer;
}
export interface LPath extends LLayer {
  setStyle(style: Record<string, unknown>): LPath;
  bringToFront(): LPath;
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
  polygon(lls: [number, number][][], opts: Record<string, unknown>): LPath;
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
    css.integrity = CSS_SRI;
    css.crossOrigin = 'anonymous';
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = JS_URL;
    script.integrity = JS_SRI;
    script.crossOrigin = 'anonymous';
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

// Sfondo mappa (verificato il 27/10/2026 dal PC di Filippo):
// - pagina servita via http(s): tile OpenStreetMap standard (il browser invia il Referer richiesto dalla policy OSM);
// - file aperto con doppio clic (file://): niente Referer → OSM risponde con un'immagine di blocco e CARTO ora chiede
//   una chiave; si usa Esri World Topo Map, che risponde correttamente anche senza Referer.
const isFile = typeof window !== 'undefined' && window.location.protocol === 'file:';

export const TILE_URL = isFile
  ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
  : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const TILE_OPTIONS = isFile
  ? { maxZoom: 19, attribution: 'Tiles &copy; Esri &mdash; fonti: Esri, HERE, Garmin, &copy; contributori OpenStreetMap' }
  : { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">contributori OpenStreetMap</a>' };
