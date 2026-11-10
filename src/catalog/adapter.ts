// Adattatore del catalogo: dal JSON di `catalog_bundle(release_id)` (una versione del catalogo di una nazione)
// alle strutture che l'app usa da sempre (Destination, schede delle attrazioni, siti ufficiali, Wikidata,
// crociere, porti, regioni, parametri del configuratore). Le viste non cambiano: cambia solo da dove arrivano i dati.
// Funzioni pure: nessuna rete, nessun archivio.

import type { AttractionInfo, Setting } from '../data/attractions';
import type { CatalogDay, CatalogPrice, CoastalCatalogVoyage } from '../data/coastalCatalog';
import type { CoastalPort } from '../data/coastalPorts';
import type { FerryCall, FerryDataStatus, FerryFare, FerryMode, FerryPassengerRule, FerryRoute, FerrySource, FerryStop } from '../data/ferryTypes';
import type { OfficialKind, OfficialSite } from '../data/officialSites';
import type { PlacePhoto, PlaceTip } from '../data/placeExtras';
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
  /** Tabelle dei traghetti (da NO-2). Facoltative: le copie offline di NO-1 scaricate prima della migrazione non le hanno */
  ferry_sources?: Rows;
  ferry_routes?: Rows;
  ferry_route_stops?: Rows;
  ferry_route_places?: Rows;
  ferry_fares?: Rows;
  /** Foto e consigli dei luoghi (da NO-3). Facoltative: le versioni precedenti e le copie offline vecchie non le hanno */
  place_photos?: Rows;
  place_tips?: Rows;
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
  /** Tratte traghetto (vuoto nelle versioni senza traghetti, es. NO-1) */
  ferryRoutes: FerryRoute[];
  ferrySources: Record<string, FerrySource>;
  /** Versione del catalogo di ogni tratta (route_key → release_id): il viaggio vede solo quelle della sua versione */
  ferryRelease: Record<string, string>;
  /** Foto dei luoghi con autore e licenza (vuoto nelle versioni senza foto, es. NO-1 e NO-2) */
  photos: Record<string, PlacePhoto[]>;
  /** Consigli dei luoghi con fonte e data (vuoto nelle versioni senza consigli) */
  tips: Record<string, PlaceTip[]>;
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

const rowsOf = (v: unknown): Rows => (Array.isArray(v) ? (v as Rows) : []);
const nullable = <T,>(v: unknown, f: (x: unknown) => T): T | undefined => (v === null || v === undefined ? undefined : f(v));
const byPos = (k: string) => (x: Obj, y: Obj) => Number(x[k]) - Number(y[k]);

/**
 * Tratte traghetto dalle righe ferry_* (inverso di ferryRows in scripts/seed-catalog.ts). Chiavi facoltative:
 * senza tabelle (NO-1, copie offline vecchie) nessuna tratta e nessun errore.
 */
export function adaptFerries(b: CatalogBundle, regionName: Map<string, string>): { routes: FerryRoute[]; sources: Record<string, FerrySource> } {
  const sources: Record<string, FerrySource> = {};
  for (const r of [...rowsOf(b.ferry_sources)].sort(byPos('position'))) {
    sources[String(r.source_key)] = { key: String(r.source_key), title: String(r.title), url: String(r.url), checkedAt: String(r.checked_at) };
  }
  const group = (rows: Rows) => {
    const m = new Map<string, Rows>();
    for (const x of rows) m.set(String(x.route_key), [...(m.get(String(x.route_key)) ?? []), x]);
    return m;
  };
  const stops = group(rowsOf(b.ferry_route_stops));
  const places = group(rowsOf(b.ferry_route_places));
  const fares = group(rowsOf(b.ferry_fares));
  const S = (v: unknown) => nullable(v, String);
  const N = (v: unknown) => nullable(v, Number);
  const routes = [...rowsOf(b.ferry_routes)].sort(byPos('position')).map((r): FerryRoute => {
    const key = String(r.route_key);
    const pl = [...(places.get(key) ?? [])].sort(byPos('position'));
    return clean({
      key,
      name: String(r.name),
      operator: String(r.operator_name),
      mode: r.mode as FerryMode,
      zone: String(r.zone),
      region: (regionName.get(String(r.region_key)) ?? String(r.region_key)) as Region,
      road: S(r.road),
      carriesCar: Boolean(r.carries_car),
      roundTrip: Boolean(r.round_trip),
      fromName: String(r.from_name),
      toName: String(r.to_name),
      stops: [...(stops.get(key) ?? [])]
        .sort(byPos('seq'))
        .map((s): FerryStop => clean({ seq: Number(s.seq), name: String(s.name), minutesMin: N(s.minutes_min), minutesMax: N(s.minutes_max), call: s.call_type as FerryCall, nsrId: S(s.nsr_id), lat: N(s.lat), lng: N(s.lng) })),
      duration: clean({ min: N(r.duration_min), max: N(r.duration_max), status: r.duration_status as FerryDataStatus, note: S(r.duration_note), sourceKey: S(r.duration_source_key) }),
      summerFrequency: clean({ text: String(r.frequency_text ?? ''), status: r.frequency_status as FerryDataStatus, sourceKey: S(r.frequency_source_key), year: N(r.frequency_year) }),
      season: clean({ text: String(r.season_text ?? ''), status: r.season_status as FerryDataStatus, sourceKey: S(r.season_source_key) }),
      fare: clean({
        status: r.fare_status as FerryDataStatus,
        year: N(r.fare_year),
        yearLabel: S(r.fare_year_label),
        validFrom: S(r.fare_valid_from),
        period: S(r.fare_period),
        sourceKey: S(r.fare_source_key),
        note: S(r.fare_note),
        verifyForTripYear: Boolean(r.fare_verify_for_trip_year),
        passengerRule: r.passenger_rule as FerryPassengerRule,
        passengersText: S(r.passengers_text),
        freeUnderAge: N(r.free_under_age),
        childAgeText: S(r.child_age_text),
        adultAgeText: S(r.adult_age_text),
        childCapNok: N(r.child_cap_amount),
        returnDiscountPct: N(r.return_discount_pct),
        rules: Array.isArray(r.fare_rules) ? (r.fare_rules as string[]) : [],
        generalRules: S(r.fare_general_rules),
        fares: [...(fares.get(key) ?? [])].sort(byPos('position')).map((x): FerryFare => {
          const vehicle = x.category === 'veicolo' || x.category === 'pacchetto_veicolo';
          return clean({
            category: x.category as FerryFare['category'],
            amountNok: x.amount === null || x.amount === undefined ? null : Number(x.amount),
            trip: x.trip_kind as FerryFare['trip'],
            ageMin: N(x.age_min),
            ageMax: N(x.age_max),
            ageText: S(x.age_text),
            vehicleClass: S(x.vehicle_class) as FerryFare['vehicleClass'],
            // null = «la fonte non lo dice» per i veicoli; per le altre voci il campo non esiste
            driverIncluded: x.driver_included === null || x.driver_included === undefined ? (vehicle ? null : undefined) : Boolean(x.driver_included),
            passengersIncluded: N(x.passengers_included),
            adultsIncluded: N(x.adults_included),
            childrenIncluded: N(x.children_included),
            fromStop: S(x.from_stop),
            toStop: S(x.to_stop),
            dayType: S(x.day_type) as FerryFare['dayType'],
            period: S(x.period),
            optional: x.optional ? true : undefined,
            year: N(x.fare_year),
            status: x.status as FerryDataStatus,
            sourceKey: S(x.source_key),
            note: S(x.note),
          });
        }),
      }),
      places: {
        ...clean({ from: S(pl.find((x) => x.role === 'partenza')?.place_key), to: S(pl.find((x) => x.role === 'arrivo')?.place_key) }),
        along: pl.filter((x) => x.role === 'lungo').map((x) => String(x.place_key)),
      },
      sourceKeys: Array.isArray(r.source_keys) ? (r.source_keys as string[]) : [],
      notes: Array.isArray(r.notes) ? (r.notes as string[]) : [],
      enturLine: isObj(r.entur_line) ? (r.entur_line as unknown as FerryRoute['enturLine']) : undefined,
      checkedAt: String(r.checked_at),
    });
  });
  return { routes, sources };
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

  const ferries = adaptFerries(b, regionName);
  const photos: Record<string, PlacePhoto[]> = {};
  for (const r of [...rowsOf(b.place_photos)].sort(byPos('position'))) {
    (photos[String(r.place_key)] ??= []).push(clean({ file: String(r.commons_file), author: String(r.author), license: String(r.license), licenseUrl: str(r.license_url) }));
  }
  const tips: Record<string, PlaceTip[]> = {};
  for (const r of [...rowsOf(b.place_tips)].filter((x) => x.lang === 'it').sort(byPos('position'))) {
    (tips[String(r.place_key)] ??= []).push({ text: String(r.body), source: String(r.source_label), url: String(r.source_url), checkedAt: String(r.checked_at) });
  }
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
    ferryRoutes: ferries.routes,
    ferrySources: ferries.sources,
    ferryRelease: Object.fromEntries(ferries.routes.map((r) => [r.key, country.releaseId])),
    photos,
    tips,
  };
}

/** Somma i cataloghi delle nazioni del viaggio, nell'ordine del viaggio. Nessuna regola per nazione nel codice. */
export function combineCatalogs(list: AppCatalog[]): AppCatalog {
  const out: AppCatalog = {
    countries: [], destinations: [], placeCountry: {}, attractions: {}, officialSites: {}, wiki: {}, voyages: [], ports: [],
    operatorFacts: {}, operatorSources: {}, counties: [], regionCounties: {}, regionCountry: {}, voyageCountry: {}, portCountry: {}, baseIds: [], notVisits: [], rail: {},
    ferryRoutes: [], ferrySources: {}, ferryRelease: {}, photos: {}, tips: {},
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
    out.ferryRoutes.push(...c.ferryRoutes);
    Object.assign(out.ferrySources, c.ferrySources);
    Object.assign(out.ferryRelease, c.ferryRelease);
    Object.assign(out.photos, c.photos ?? {});
    Object.assign(out.tips, c.tips ?? {});
  }
  return out;
}
