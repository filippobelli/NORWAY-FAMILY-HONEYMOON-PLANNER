import { italianStyle, withoutLabels, type MapStyle } from './baseStyle';

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
  getZoom(): number;
  fitBounds(b: LBounds, opts?: Record<string, unknown>): LMap;
  invalidateSize(): void;
  getContainer(): HTMLElement;
  remove(): void;
  stop(): LMap;
}
export interface LeafletApi {
  map(el: HTMLElement, opts?: Record<string, unknown>): LMap;
  tileLayer(url: string, opts: Record<string, unknown>): LLayer;
  /** Presente dopo il caricamento del fondo vettoriale */
  maplibreGL?(opts: Record<string, unknown>): LLayer;
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

// Fondo vettoriale con i nomi in italiano (OpenFreeMap: dati OpenStreetMap, nessuna chiave). Le immagini di OSM hanno le
// scritte già disegnate e non si possono tradurre. Se qualcosa non va si torna allo sfondo qui sopra.
const MAPLIBRE_VERSION = '5.24.0';
const BRIDGE_VERSION = '0.1.4';
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const VECTOR_TIMEOUT_MS = 10000;
const VECTOR_ATTRIBUTION =
  '<a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a>, dati &copy; <a href="https://www.openstreetmap.org/copyright">contributori OpenStreetMap</a>';
// Impronte SHA-384 calcolate il 04/11/2026 sui file serviti da unpkg
const MAPLIBRE_CSS = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`;
const MAPLIBRE_CSS_SRI = 'sha384-uTttxo/aOKbdE5RlD/SPzSDoDmNvGlUYPjONi2MN/b7c9HPSvW07OIuyP7uL6jxK';
const MAPLIBRE_JS = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`;
const MAPLIBRE_JS_SRI = 'sha384-5+cfbwT0iiub6VsQAdn6yz16nr6sDiQoHx6tm4O8OVYXHYOxcffFmCJBL0dgdvGp';
const BRIDGE_JS = `https://unpkg.com/@maplibre/maplibre-gl-leaflet@${BRIDGE_VERSION}/leaflet-maplibre-gl.js`;
const BRIDGE_JS_SRI = 'sha384-tXYNKOHx4T02jMP7YYCtBxPIv1B5gaA5mcVPBzqMp6d7VzWzxJgI2aWF/nJLrQdS';

function addScript(src: string, integrity: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.integrity = integrity;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Impossibile scaricare il fondo vettoriale'));
    document.head.appendChild(script);
  });
}

let vectorLibs: Promise<MapStyle> | null = null;

function loadVector(): Promise<MapStyle> {
  if (vectorLibs) return vectorLibs;
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = MAPLIBRE_CSS;
  css.integrity = MAPLIBRE_CSS_SRI;
  css.crossOrigin = 'anonymous';
  document.head.appendChild(css);
  const work = Promise.all([
    addScript(MAPLIBRE_JS, MAPLIBRE_JS_SRI).then(() => addScript(BRIDGE_JS, BRIDGE_JS_SRI)),
    fetch(STYLE_URL).then((r) => {
      if (!r.ok) throw new Error(`Stile della mappa non disponibile (${r.status})`);
      return r.json() as Promise<MapStyle>;
    }),
  ]).then(([, style]) => italianStyle(style));
  const timeout = new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('Timeout nel caricamento del fondo vettoriale')), VECTOR_TIMEOUT_MS));
  vectorLibs = Promise.race([work, timeout]).catch((e: unknown) => {
    vectorLibs = null;
    throw e;
  });
  return vectorLibs;
}

/** Fondo della mappa: vettoriale in italiano; senza WebGL, senza rete verso il servizio o da file locale, lo sfondo classico. */
export async function addBaseMap(L: LeafletApi, map: LMap, isGone: () => boolean, opts: { labels?: boolean } = {}): Promise<void> {
  try {
    if (isFile || !document.createElement('canvas').getContext('webgl2')) throw new Error('Fondo vettoriale non utilizzabile');
    const style = await loadVector();
    if (isGone()) return;
    if (!L.maplibreGL) throw new Error('Libreria del fondo vettoriale non disponibile');
    L.maplibreGL({ style: opts.labels === false ? withoutLabels(style) : style, attributionControl: { customAttribution: VECTOR_ATTRIBUTION } }).addTo(map);
    map.getContainer().classList.add('map-vector');
  } catch {
    if (!isGone()) L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);
  }
}
