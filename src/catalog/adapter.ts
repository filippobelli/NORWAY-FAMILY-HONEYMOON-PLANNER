// Adattatore del catalogo: dal JSON di `catalog_bundle(release_id)` (una versione del catalogo di una nazione)
// alle strutture che l'app usa da sempre (Destination, schede delle attrazioni, siti ufficiali, Wikidata,
// crociere, porti, regioni, parametri del configuratore). Le viste non cambiano: cambia solo da dove arrivano i dati.
// Funzioni pure: nessuna rete, nessun archivio.

import type { AttractionInfo, Setting } from '../data/attractions';
import type { CatalogDay, CatalogPrice, CoastalCatalogVoyage } from '../data/coastalCatalog';
import type { CoastalPort } from '../data/coastalPorts';
import type { OfficialKind, OfficialSite } from '../data/officialSites';
import type { County } from '../data/regionShapes';
import type { WikiRef } from '../data/wiki';
import type { Category, CoastalOption, Destination, Region, SourceRef } from '../domain/types';

type Obj = Record<string, unknown>;
type Rows = Obj[];

/** JSON restituito da public.catalog_bundle */
export interface CatalogBundle {
  release: Obj | null;
  country: Obj | null;
  regions: Rows;
  places: Rows;
  place_texts: Rows;
  place_sources: Rows;
  operators: Rows;
  voyages: Rows;
  route_ports: Rows;
  place_links: Rows;
}

/** Dati di una nazione e della versione del catalogo caricata (per le schermate «Nazioni») */
export interface CatalogCountry {
  code: string;
  name: string;
  currency: string;
  timezone: string;
  language: string;
  releaseId: string;
  version: number;
  status: string;
  publishedAt?: string;
  dataCheckedUntil?: string;
  /** Luoghi visibili nel catalogo (porti esclusi) */
  placeCount: number;
  roadFactor?: number;
  avgKmh?: number;
  roadCalibrated: boolean;
  roadNote: string;
  airportRadiusKm?: number;
}

/** Catalogo dell'app: una o più nazioni sommate */
export interface AppCatalog {
  countries: CatalogCountry[];
  destinations: Destination[];
  /** Nazione di ogni luogo (porti compresi) */
  placeCountry: Record<string, string>;
  attractions: Record<string, AttractionInfo>;
  officialSites: Record<string, OfficialSite>;
  wiki: Record<string, WikiRef>;
  voyages: CoastalCatalogVoyage[];
  /** Porti della rotta costiera verso nord */
  ports: CoastalPort[];
  operatorFacts: Record<string, string[]>;
  operatorSources: Record<string, SourceRef[]>;
  counties: County[];
  regionCounties: Record<string, string[]>;
  /** Nazione di ogni regione (nome) */
  regionCountry: Record<string, string>;
  /** Nazione di ogni proposta di crociera */
  voyageCountry: Record<string, string>;
  /** Nazione di ogni porto della rotta costiera (per nome) */
  portCountry: Record<string, string>;
  baseIds: string[];
  notVisits: string[];
  rail: Record<string, { label: string; note: string }>;
}

export class CatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogError';
  }
}

const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const num = (v: unknown): number | undefined => (v === null || v === undefined || v === '' ? undefined : Number(v));
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
/** Toglie le chiavi con valore undefined (come nei file: confronto per JSON) */
function clean<T extends Obj>(o: T): T {
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
  return o;
}

/** Controlla la forma minima di un bundle: un download troncato o una versione inesistente non entrano nell'app */
export function checkBundle(b: unknown): CatalogBundle {
  if (!isObj(b)) throw new CatalogError('Catalogo non leggibile');
  if (!isObj(b.release) || !isObj(b.country)) throw new CatalogError('Versione del catalogo non trovata o non pubblicata');
  for (const k of ['regions', 'places', 'place_texts', 'place_sources', 'operators', 'voyages', 'route_ports', 'place_links']) {
    if (!Array.isArray(b[k])) throw new CatalogError(`Catalogo incompleto: manca «${k}»`);
  }
  if ((b.places as Rows).length === 0) throw new CatalogError('Catalogo vuoto');
  return b as unknown as CatalogBundle;
}

export function countryOf(b: CatalogBundle): CatalogCountry {
  const r = b.release ?? {};
  const c = b.country ?? {};
  return clean({
    code: String(c.code),
    name: String(c.name),
    currency: String(c.currency),
    timezone: String(c.timezone),
    language: String(c.language),
    releaseId: String(r.release_id),
    version: Number(r.version),
    status: String(r.status),
    publishedAt: str(r.published_at),
    dataCheckedUntil: str(r.data_checked_until),
    placeCount: b.places.filter((p) => p.category !== 'porti').length,
    roadFactor: num(r.road_factor),
    avgKmh: num(r.avg_kmh),
    roadCalibrated: Boolean(r.road_calibrated),
    roadNote: String(r.road_note ?? ''),
    airportRadiusKm: num(r.airport_radius_km),
  });
}

const srcRef = (s: Obj): SourceRef => clean({ label: String(s.label), url: str(s.url), checkedAt: str(s.checkedAt ?? s.checked_at) });

/** Converte una versione del catalogo nelle strutture dell'app */
export function adaptBundle(bundle: CatalogBundle): AppCatalog {
  const b = checkBundle(bundle);
  const country = countryOf(b);
  const code = country.code;
  const regionName = new Map(b.regions.map((r) => [String(r.region_key), String(r.name)]));
  const textOf = new Map<string, Obj>();
  for (const t of b.place_texts) if (t.lang === 'it') textOf.set(String(t.place_key), t);
  const sourcesOf = (key: string, field: string) =>
    b.place_sources
      .filter((s) => s.place_key === key && s.field === field)
      .sort((x, y) => Number(x.position) - Number(y.position));

  const placeCountry: Record<string, string> = {};
  const destinations: Destination[] = [];
  const attractions: Record<string, AttractionInfo> = {};
  const officialSites: Record<string, OfficialSite> = {};
  const wiki: Record<string, WikiRef> = {};
  const baseIds: string[] = [];
  const notVisits: string[] = [];
  const byKey = new Map(b.places.map((p) => [String(p.place_key), p]));

  for (const p of b.places) {
    const key = String(p.place_key);
    placeCountry[key] = code;
    if (p.category === 'porti') continue;
    const t = textOf.get(key);
    if (!t) throw new CatalogError(`Manca il testo italiano per ${key}`);
    const min = num(p.visit_hours_min);
    const max = num(p.visit_hours_max);
    destinations.push(
      clean({
        id: key,
        name: String(t.name),
        localName: str(p.local_name),
        category: p.category as Category,
        region: (regionName.get(String(p.region_key)) ?? '') as Region,
        lat: Number(p.lat),
        lng: Number(p.lng),
        coordsStatus: p.coords_status as Destination['coordsStatus'],
        kidScore: Number(p.kid_score) as Destination['kidScore'],
        difficulty: p.difficulty as Destination['difficulty'],
        visitHours: min !== undefined && max !== undefined ? ([min, max] as [number, number]) : undefined,
        description: String(t.description ?? ''),
        access: String(t.access ?? ''),
        season: String(t.season ?? ''),
        augustNote: str(t.august_note),
        officialUrl: str(p.official_url),
        // Le coordinate «stimate» non hanno una fonte da mostrare (nei file: elenco vuoto)
        sources: sourcesOf(key, 'coordinate').filter((s) => s.method !== 'stima').map(srcRef),
        reliability: p.reliability as Destination['reliability'],
      }),
    );
    if (p.is_base) baseIds.push(key);
    if (p.day_visit === false && p.category !== 'aeroporti') notVisits.push(key);
    if (p.official_url) {
      officialSites[key] = { url: String(p.official_url), kind: p.official_kind as OfficialKind, via: p.official_via as OfficialSite['via'] };
    }
    if (p.wikidata_qid) wiki[key] = clean({ qid: String(p.wikidata_qid), it: str(p.wiki_it), en: str(p.wiki_en), image: str(p.commons_image) });
    if (p.base_place_key) {
      attractions[key] = clean({
        base: String(p.base_place_key),
        area: String(t.area ?? ''),
        address: str(p.address),
        setting: (str(p.setting) as Setting | undefined),
        booking: clean({ advice: p.booking_advice as AttractionInfo['booking']['advice'], note: String(t.booking_note ?? ''), url: str(p.booking_url) }),
        hoursPublished: Boolean(p.hours_published),
        seasonal: str(t.seasonal_note),
        outside: t.outside_note ? { note: String(t.outside_note) } : undefined,
        wikidata: String(p.details_wikidata_qid),
        coords: { lat: Number(p.lat), lng: Number(p.lng) },
        sources: sourcesOf(key, 'scheda').map(srcRef),
        checkedAt: String(p.details_checked_at),
      }) as AttractionInfo;
    }
  }

  const operators = new Map(b.operators.map((o) => [String(o.operator_key), o]));
  const operatorFacts: Record<string, string[]> = {};
  const operatorSources: Record<string, SourceRef[]> = {};
  for (const o of [...b.operators].sort((x, y) => Number(x.position) - Number(y.position))) {
    const it = isObj(o.texts) && isObj(o.texts.it) ? o.texts.it : {};
    operatorFacts[String(o.name)] = Array.isArray(it.facts) ? (it.facts as string[]) : [];
    operatorSources[String(o.name)] = Array.isArray(o.sources) ? (o.sources as Obj[]).map(srcRef) : [];
  }

  const voyages: CoastalCatalogVoyage[] = [...b.voyages]
    .sort((x, y) => Number(x.position) - Number(y.position))
    .map((v) => {
      const it = (isObj(v.texts) && isObj(v.texts.it) ? v.texts.it : {}) as Obj;
      const op = operators.get(String(v.operator_key));
      return clean({
        id: String(v.voyage_key),
        operator: String(op?.name ?? v.operator_key) as CoastalOption['operator'],
        title: String(it.title ?? ''),
        route: String(it.route ?? ''),
        direction: v.direction as 'nord' | 'sud',
        fromPort: String(v.from_port),
        toPort: String(v.to_port),
        roundTrip: v.round_trip ? true : undefined,
        days: Number(v.days),
        stops: Number(v.port_calls ?? 0),
        meals: v.meals as CoastalOption['meals'],
        summary: String(it.summary ?? ''),
        highlights: Array.isArray(it.highlights) ? (it.highlights as string[]) : [],
        itinerary: Array.isArray(it.itinerary) ? (it.itinerary as CatalogDay[]) : undefined,
        prices: Array.isArray(v.prices) ? (v.prices as CatalogPrice[]) : [],
        priceBasis: String(it.priceBasis ?? ''),
        priceValidFor: String(v.price_valid_for ?? ''),
        summerPrice: Boolean(v.summer_price),
        summerNotes: Array.isArray(it.summerNotes) ? (it.summerNotes as string[]) : [],
        url: String(v.url),
        checkedAt: String(v.checked_at),
      }) as CoastalCatalogVoyage;
    });

  const ports: CoastalPort[] = b.route_ports
    .filter((r) => r.route_key === 'costiera')
    .sort((x, y) => Number(x.seq) - Number(y.seq))
    .map((r) => {
      const p = byKey.get(String(r.place_key));
      const t = textOf.get(String(r.place_key));
      return clean({
        name: String(t?.name ?? r.place_key),
        lat: Number(p?.lat),
        lng: Number(p?.lng),
        northboundOnly: r.northbound_only ? true : undefined,
        seasonal: r.seasonal ? true : undefined,
      });
    });

  const counties: County[] = [];
  const regionCounties: Record<string, string[]> = {};
  const regionCountry: Record<string, string> = {};
  for (const r of [...b.regions].sort((x, y) => Number(x.position) - Number(y.position))) {
    const areas = Array.isArray(r.areas) ? (r.areas as Obj[]) : [];
    regionCounties[String(r.name)] = areas.map((a) => String(a.code));
    regionCountry[String(r.name)] = code;
    for (const a of areas) counties.push({ nr: String(a.code), name: String(a.name), rings: a.rings as County['rings'] });
  }

  const rail: Record<string, { label: string; note: string }> = {};
  for (const l of b.place_links) if (l.kind === 'treno') rail[[String(l.from_place_key), String(l.to_place_key)].sort().join('|')] = { label: String(l.label), note: String(l.note ?? '') };

  const voyageCountry = Object.fromEntries(voyages.map((v) => [v.id, code]));
  const portCountry = Object.fromEntries(ports.map((p) => [p.name, code]));
  return {
    countries: [country],
    voyageCountry,
    portCountry,
    destinations,
    placeCountry,
    attractions,
    officialSites,
    wiki,
    voyages,
    ports,
    operatorFacts,
    operatorSources,
    counties,
    regionCounties,
    regionCountry,
    baseIds,
    notVisits,
    rail,
  };
}

/** Somma i cataloghi delle nazioni del viaggio, nell'ordine del viaggio. Nessuna regola per nazione nel codice. */
export function combineCatalogs(list: AppCatalog[]): AppCatalog {
  const out: AppCatalog = {
    countries: [], destinations: [], placeCountry: {}, attractions: {}, officialSites: {}, wiki: {}, voyages: [], ports: [],
    operatorFacts: {}, operatorSources: {}, counties: [], regionCounties: {}, regionCountry: {}, voyageCountry: {}, portCountry: {}, baseIds: [], notVisits: [], rail: {},
  };
  for (const c of list) {
    out.countries.push(...c.countries);
    out.destinations.push(...c.destinations);
    out.voyages.push(...c.voyages);
    out.ports.push(...c.ports);
    out.counties.push(...c.counties);
    out.baseIds.push(...c.baseIds);
    out.notVisits.push(...c.notVisits);
    Object.assign(out.placeCountry, c.placeCountry);
    Object.assign(out.attractions, c.attractions);
    Object.assign(out.officialSites, c.officialSites);
    Object.assign(out.wiki, c.wiki);
    Object.assign(out.operatorFacts, c.operatorFacts);
    Object.assign(out.operatorSources, c.operatorSources);
    Object.assign(out.regionCounties, c.regionCounties);
    Object.assign(out.regionCountry, c.regionCountry);
    Object.assign(out.voyageCountry, c.voyageCountry);
    Object.assign(out.portCountry, c.portCountry);
    Object.assign(out.rail, c.rail);
  }
  return out;
}
