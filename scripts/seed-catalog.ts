// Seed del catalogo di una nazione: dai file dell'app a SQL ripetibile per Supabase.
//
//   npx tsx scripts/seed-catalog.ts                 → supabase/seed/catalogo-norvegia-v1.sql
//   npx tsx scripts/seed-catalog.ts --country NO --out percorso.sql
//
// Nessuna chiamata di rete, nessuna chiave: legge solo src/data/* (e poche costanti di src/domain) e scrive un file.
// Il file generato è deterministico (nessuna data di generazione): rieseguire lo script non cambia nulla se i dati non cambiano.
//
// Il file SQL è idempotente:
// - nazione, versione (in bozza), chiavi dei luoghi e aeroporti di casa con «on conflict do nothing»;
// - il contenuto della versione si scrive solo se la versione è ancora in bozza;
// - poi la versione diventa «pubblicata» e un controllo finale confronta i conteggi con quelli attesi.
// Se una versione pubblicata ha contenuti diversi da quelli dei file, il controllo fallisce: serve una versione nuova
// (incrementare `release.version` in buildNorway), mai la modifica di quella pubblicata.
//
// MODELLO PER UNA NAZIONE NUOVA
// 1. Scrivere una funzione buildXx(): CatalogSeed (vedi buildNorway) che legge i dati della nazione da file
//    (TypeScript o JSON). Chiavi dei luoghi con prefisso ISO minuscolo: 'se-stoccolma', 'se-porto-goteborg'.
// 2. Registrarla in BUILDERS con il codice ISO.
// 3. Eseguire `npx tsx scripts/seed-catalog.ts --country XX` e rivedere il file generato.
// Nessuna modifica allo schema né al codice dell'app: valuta, fuso, lingua, regioni e parametri vengono dai dati.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ATTRACTION_INFO } from '../src/data/attractions';
import { COASTAL_CATALOG } from '../src/data/coastalCatalog';
import { COASTAL_FACTS, COASTAL_PORTS_NORTHBOUND, COASTAL_SOURCES } from '../src/data/coastalPorts';
import { COORDS_CHECKED_AT, VERIFIED_COORDS } from '../src/data/coordVerification';
import { FILE_COUNTRY } from '../src/data/country';
import { DESTINATIONS } from '../src/data/destinations';
import { OFFICIAL_CHECKED_AT, OFFICIAL_KIND_LABEL, OFFICIAL_SITES } from '../src/data/officialSites';
import { COUNTIES, REGION_COUNTIES } from '../src/data/regionShapes';
import { WIKI } from '../src/data/wiki';
import { AIRPORT_RADIUS_KM, AVG_KMH, BASE_IDS, ROAD_FACTOR, railFor } from '../src/domain/configurator';
import { DEFAULT_HOME_AIRPORTS, ITALIAN_AIRPORTS } from '../src/domain/flightAdvisor';

// ---------- Modello di una nazione ----------

export interface SourceSeed {
  label: string;
  url?: string;
  checkedAt?: string;
  license?: string;
  method?: string;
  note?: string;
}

export interface PlaceSeed {
  key: string;
  category: string;
  regionKey?: string;
  lat: number;
  lng: number;
  coordsStatus: 'approssimative' | 'verificate';
  localName?: string;
  visitHours?: [number, number];
  difficulty?: string;
  kidScore?: number;
  reliability: 'da_verificare' | 'verificato';
  isBase: boolean;
  dayVisit: boolean;
  iata?: string;
  official?: { url: string; kind: string; via: string };
  wiki?: { qid: string; it?: string; en?: string; image?: string };
  details?: {
    base: string;
    address?: string;
    setting?: string;
    bookingAdvice: string;
    bookingUrl?: string;
    hoursPublished: boolean;
    wikidata: string;
    checkedAt: string;
  };
  /** Testi per lingua: 'it' obbligatorio */
  texts: Record<string, {
    name: string;
    description: string;
    access: string;
    season: string;
    augustNote?: string;
    area?: string;
    bookingNote?: string;
    seasonalNote?: string;
    outsideNote?: string;
  }>;
  /** Fonti per campo */
  sources: Partial<Record<'coordinate' | 'scheda' | 'sito_ufficiale' | 'wikidata' | 'testi' | 'generale', SourceSeed[]>>;
}

export interface CatalogSeed {
  country: { code: string; name: string; names: Record<string, string>; currency: string; timezone: string; language: string };
  release: {
    version: number;
    dataCheckedUntil: string;
    notes: string;
    sourceNotes: SourceSeed[];
    roadFactor?: number;
    avgKmh?: number;
    roadCalibrated: boolean;
    roadNote: string;
    airportRadiusKm?: number;
  };
  regions: { key: string; name: string; areas: unknown[]; sources: SourceSeed[] }[];
  places: PlaceSeed[];
  operators: { key: string; name: string; kind: string; url?: string; sources: unknown[]; texts: Record<string, unknown> }[];
  voyages: {
    key: string;
    operatorKey: string;
    direction: string;
    fromPort: string;
    toPort: string;
    fromPlaceKey?: string;
    toPlaceKey?: string;
    roundTrip: boolean;
    days: number;
    portCalls?: number;
    meals: string;
    priceCurrency: string;
    prices: unknown[];
    priceValidFor: string;
    summerPrice: boolean;
    url: string;
    checkedAt: string;
    texts: Record<string, unknown>;
  }[];
  routePorts: { routeKey: string; seq: number; placeKey: string; northboundOnly: boolean; seasonal: boolean }[];
  links: { kind: string; from: string; to: string; label: string; note: string; sources: unknown[] }[];
  /** Aeroporti di partenza da casa: dato globale, non della nazione (facoltativo) */
  homeAirports?: { iata: string; name: string; countryCode: string; defaultRank?: number }[];
  /** Nome del file generato */
  outFile: string;
}

// ---------- Utilità ----------

/** Chiave stabile da un nome: minuscole, senza accenti, trattini. «Ålesund» → «alesund», «Bodø» → «bodo». */
export function slug(s: string): string {
  return s
    .replace(/[Øø]/g, 'o')
    .replace(/[Ææ]/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const lic = (url?: string): string | undefined =>
  url?.includes('openstreetmap.org') ? 'ODbL 1.0' : url?.includes('wikidata.org') ? 'CC0 1.0' : undefined;

// ---------- Norvegia, versione 1 (dai file attuali) ----------

/**
 * Schede che non sono luoghi da visitare in un giorno preciso. COPIA di NOT_VISITS in src/domain/configurator.ts
 * (costante non esportata): va tenuta allineata finché il configuratore non legge `places.day_visit` dal catalogo.
 */
const NOT_VISITS_COPY = new Set(['aurora', 'midnight-sun', 'lofoten', 'bodo-moskenes', 'sognefjord', 'hardangerfjord', 'jotunheimen']);

/** Date scritte solo nei commenti dei file sorgente (nessuna costante esportata). */
const WIKI_CHECKED_AT = '2026-10-27'; // src/data/wiki.ts, intestazione
const REGIONS_CHECKED_AT = '2026-10-27'; // src/data/regionShapes.ts, intestazione

export function buildNorway(): CatalogSeed {
  const regionNames = Object.keys(REGION_COUNTIES) as (keyof typeof REGION_COUNTIES)[];
  const regionKey = new Map(regionNames.map((n) => [n as string, slug(n)]));

  const regions = regionNames.map((name) => ({
    key: slug(name),
    name,
    areas: REGION_COUNTIES[name].map((nr) => {
      const c = COUNTIES.find((x) => x.nr === nr);
      if (!c) throw new Error(`Contea ${nr} assente in regionShapes.ts`);
      return { code: c.nr, name: c.name, rings: c.rings };
    }),
    sources: [
      {
        label: 'Kartverket, API kommuneinfo: confini delle contee (suddivisione 2024), semplificati (~2,5 km); comprendono il mare territoriale',
        url: 'https://api.kartverket.no/kommuneinfo/v1/fylker',
        checkedAt: REGIONS_CHECKED_AT,
        note: 'Solo per mostrare le regioni sulla mappa, non per misurare distanze. Licenza da verificare.',
      },
    ],
  }));

  const places: PlaceSeed[] = DESTINATIONS.map((d) => {
    const v = VERIFIED_COORDS[d.id];
    const a = ATTRACTION_INFO[d.id];
    const off = OFFICIAL_SITES[d.id];
    const w = WIKI[d.id];
    const rk = regionKey.get(d.region);
    if (!rk) throw new Error(`Regione sconosciuta per ${d.id}: ${d.region}`);

    // Data di verifica del sito ufficiale: se la scheda dell'attrazione cita lo stesso indirizzo, vale la sua data (più recente)
    const officialChecked = off
      ? (a?.sources.find((s) => s.url === off.url)?.checkedAt ?? OFFICIAL_CHECKED_AT)
      : undefined;

    const coordSources: SourceSeed[] = d.sources.map((s) => ({
      label: s.label,
      url: s.url,
      checkedAt: s.checkedAt,
      license: lic(s.url),
      method: v ? `Nominatim: ${v.kind}` : a ? 'Wikidata P625' : undefined,
    }));
    if (coordSources.length === 0) {
      coordSources.push({ label: 'Coordinate approssimative, non verificate', method: 'stima' });
    }

    return {
      key: d.id,
      category: d.category,
      regionKey: rk,
      lat: d.lat,
      lng: d.lng,
      coordsStatus: d.coordsStatus,
      localName: d.localName,
      visitHours: d.visitHours,
      difficulty: d.difficulty,
      kidScore: d.kidScore,
      reliability: d.reliability,
      isBase: (BASE_IDS as readonly string[]).includes(d.id),
      dayVisit: !NOT_VISITS_COPY.has(d.id),
      iata: d.category === 'aeroporti' ? d.id.toUpperCase() : undefined,
      official: off ? { url: off.url, kind: off.kind, via: off.via } : undefined,
      wiki: w ? { qid: w.qid, it: w.it, en: w.en, image: w.image } : undefined,
      details: a
        ? {
            base: a.base,
            address: a.address,
            setting: a.setting,
            bookingAdvice: a.booking.advice,
            bookingUrl: a.booking.url,
            hoursPublished: a.hoursPublished,
            wikidata: a.wikidata,
            checkedAt: a.checkedAt,
          }
        : undefined,
      texts: {
        it: {
          name: d.name,
          description: d.description,
          access: d.access,
          season: d.season,
          augustNote: d.augustNote,
          area: a?.area,
          bookingNote: a?.booking.note,
          seasonalNote: a?.seasonal,
          outsideNote: a?.outside?.note,
        },
      },
      sources: {
        coordinate: coordSources,
        scheda: a?.sources.map((s) => ({ label: s.label, url: s.url, checkedAt: s.checkedAt, license: lic(s.url) })),
        sito_ufficiale: off
          ? [{ label: OFFICIAL_KIND_LABEL[off.kind], url: off.url, checkedAt: officialChecked, method: off.via, note: 'Solo il collegamento: nessun contenuto copiato' }]
          : undefined,
        wikidata: w
          ? [{
              label: `Wikidata ${w.qid}`,
              url: `https://www.wikidata.org/wiki/${w.qid}`,
              checkedAt: WIKI_CHECKED_AT,
              license: 'CC0 1.0',
              method: 'Abbinamento per nome e distanza (20 km; 80 km per fiordi, parchi, isole e ferrovie)',
              note: 'Testi e foto di Wikipedia/Commons non copiati: letti al momento con autore e licenza',
            }]
          : undefined,
        testi: [{ label: 'Testi scritti per l\'app (conoscenza generale), da verificare', method: 'redazione' }],
      },
    };
  });

  // Porti della rotta costiera
  const portKey = (name: string) => `porto-${slug(name)}`;
  const portSources: SourceSeed[] = [COASTAL_SOURCES.Havila[1], COASTAL_SOURCES.Hurtigruten[0]].map((s) => ({
    label: s.label,
    url: s.url,
    checkedAt: 'checkedAt' in s ? s.checkedAt : undefined,
    method: 'ordine dei porti',
  }));
  for (const p of COASTAL_PORTS_NORTHBOUND) {
    places.push({
      key: portKey(p.name),
      category: 'porti',
      lat: p.lat,
      lng: p.lng,
      coordsStatus: 'approssimative',
      reliability: 'da_verificare',
      isBase: false,
      dayVisit: false,
      texts: { it: { name: p.name, description: '', access: '', season: p.seasonal ? 'Scalo stagionale: da verificare per la data scelta' : '' } },
      sources: {
        coordinate: [{ label: 'Coordinate approssimative del centro abitato, non la posizione del molo', method: 'stima' }],
        scheda: portSources,
      },
    });
  }

  const keys = new Set<string>();
  for (const p of places) {
    if (keys.has(p.key)) throw new Error(`Chiave duplicata: ${p.key}`);
    keys.add(p.key);
  }

  const operators = (['Hurtigruten', 'Havila'] as const).map((name) => ({
    key: slug(name),
    name,
    kind: 'nave_costiera',
    sources: COASTAL_SOURCES[name].map((s) => ({ ...s })),
    texts: { it: { facts: COASTAL_FACTS[name] } },
  }));

  const voyages = COASTAL_CATALOG.map((v) => {
    const from = portKey(v.fromPort);
    const to = portKey(v.toPort);
    return {
      key: v.id,
      operatorKey: slug(v.operator),
      direction: v.direction,
      fromPort: v.fromPort,
      toPort: v.toPort,
      fromPlaceKey: keys.has(from) ? from : undefined,
      toPlaceKey: keys.has(to) ? to : undefined,
      roundTrip: Boolean(v.roundTrip),
      days: v.days,
      portCalls: v.stops,
      meals: v.meals,
      priceCurrency: 'EUR',
      prices: v.prices,
      priceValidFor: v.priceValidFor,
      summerPrice: v.summerPrice,
      url: v.url,
      checkedAt: v.checkedAt,
      texts: {
        it: {
          title: v.title,
          route: v.route,
          summary: v.summary,
          highlights: v.highlights,
          itinerary: v.itinerary ?? null,
          priceBasis: v.priceBasis,
          summerNotes: v.summerNotes,
        },
      },
    };
  });

  const routePorts = COASTAL_PORTS_NORTHBOUND.map((p, i) => ({
    routeKey: 'costiera',
    seq: i + 1,
    placeKey: portKey(p.name),
    northboundOnly: Boolean(p.northboundOnly),
    seasonal: Boolean(p.seasonal),
  }));

  // Treni: ricostruiti dalla funzione esportata railFor su tutte le coppie di luoghi
  const ids = DESTINATIONS.map((d) => d.id).sort();
  const links: CatalogSeed['links'] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const r = railFor(ids[i], ids[j]);
      if (r) {
        links.push({
          kind: 'treno',
          from: ids[i]!,
          to: ids[j]!,
          label: r.label,
          note: r.note,
          sources: [{ label: 'Linee della rete Vy / SJ Nord / Go-Ahead (configuratore): durata, orari e prezzi da verificare', url: 'https://www.vy.no/' }],
        });
      }
    }
  }

  return {
    country: { code: FILE_COUNTRY.code, name: FILE_COUNTRY.name, names: { ...FILE_COUNTRY.names }, currency: FILE_COUNTRY.currency, timezone: FILE_COUNTRY.timezone, language: FILE_COUNTRY.language },
    release: {
      version: 1,
      dataCheckedUntil: '2026-11-06',
      notes: 'Prima versione, generata dai file dell\'app (src/data) con scripts/seed-catalog.ts.',
      sourceNotes: [
        { label: 'Coordinate: OpenStreetMap (Nominatim)', checkedAt: COORDS_CHECKED_AT, license: 'ODbL 1.0' },
        { label: 'Schede delle attrazioni: siti ufficiali e Wikidata P625', checkedAt: '2026-11-06', license: 'CC0 1.0 (Wikidata)' },
        { label: 'Siti ufficiali: Wikidata P856 e verifica manuale', checkedAt: OFFICIAL_CHECKED_AT },
        { label: 'Riferimenti Wikidata/Wikipedia/Commons', checkedAt: WIKI_CHECKED_AT, license: 'CC0 1.0 (Wikidata)' },
        { label: 'Confini delle contee: Kartverket', checkedAt: REGIONS_CHECKED_AT, note: 'licenza da verificare' },
        { label: 'Porti della rotta costiera: Havila e Hurtigruten', checkedAt: '2026-10-27', note: 'coordinate approssimative' },
        { label: 'Proposte di crociera: siti Havila e Hurtigruten', checkedAt: '2026-10-28', note: 'prezzi e date come pubblicati, non tariffe garantite' },
      ],
      roadFactor: ROAD_FACTOR,
      avgKmh: AVG_KMH,
      roadCalibrated: true,
      roadNote: 'Tarati il 2026-10-27 su Bergen → Ålesund calcolato con OSRM. Restano stime.',
      airportRadiusKm: AIRPORT_RADIUS_KM,
    },
    regions,
    places,
    operators,
    voyages,
    routePorts,
    links,
    homeAirports: ITALIAN_AIRPORTS.map((a) => {
      const rank = DEFAULT_HOME_AIRPORTS.indexOf(a.code);
      return { iata: a.code, name: a.name, countryCode: 'IT', defaultRank: rank >= 0 ? rank + 1 : undefined };
    }),
    outFile: 'catalogo-norvegia-v1.sql',
  };
}

const BUILDERS: Record<string, () => CatalogSeed> = { NO: buildNorway };

// ---------- Generazione SQL ----------

const DO_TAG = '$seed$';

function q(s: string): string {
  if (s.includes(DO_TAG)) throw new Error(`Il testo contiene ${DO_TAG}: cambiare il delimitatore`);
  return `'${s.replace(/'/g, "''")}'`;
}

type Val = string | number | boolean | null | undefined | { json: unknown } | { textArray: string[] };

function lit(v: Val): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error(`Numero non valido: ${v}`);
    return String(v);
  }
  if (typeof v === 'string') return q(v);
  if ('json' in v) return `${q(JSON.stringify(v.json))}::jsonb`;
  return v.textArray.length ? `array[${v.textArray.map(q).join(', ')}]::text[]` : `'{}'::text[]`;
}

function insert(table: string, cols: string[], rows: Val[][], conflict: string): string {
  if (rows.length === 0) return `-- ${table}: nessuna riga\n`;
  const values = rows.map((r) => {
    if (r.length !== cols.length) throw new Error(`Colonne errate per ${table}`);
    return `  (${r.map(lit).join(', ')})`;
  });
  return `insert into public.${table} (${cols.join(', ')}) values\n${values.join(',\n')}\n${conflict};\n`;
}

const src = (s: SourceSeed) => ({ label: s.label, url: s.url, checkedAt: s.checkedAt, license: s.license, note: s.note });

export function generateSql(c: CatalogSeed): string {
  const rel = `${c.country.code}-${c.release.version}`;
  const R = q(rel);
  const out: string[] = [];
  const texts = c.places.flatMap((p) => Object.entries(p.texts).map(([lang, t]) => ({ key: p.key, lang, t })));
  const sources = c.places.flatMap((p) =>
    Object.entries(p.sources).flatMap(([field, list]) => (list ?? []).map((s, i) => ({ key: p.key, field, i, s }))),
  );

  for (const p of c.places) {
    if (!p.texts.it) throw new Error(`Manca il testo italiano per ${p.key}`);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(p.key)) throw new Error(`Chiave non valida: ${p.key}`);
  }

  out.push(`-- Catalogo ${c.country.name}, versione ${c.release.version} (${rel}).`);
  out.push('-- GENERATO da scripts/seed-catalog.ts: non modificare a mano, rigenerare con `npx tsx scripts/seed-catalog.ts`.');
  out.push('-- Prerequisito: migrazioni supabase/migrations/20261106000100 … 20261106000500.');
  out.push('-- Idempotente: con la versione già pubblicata non scrive nulla e controlla solo i conteggi.');
  out.push('-- Tocca solo le tabelle del catalogo: nessun viaggio, nessun dato di auth.');
  out.push('');
  out.push('begin;');
  out.push('');
  out.push(insert('countries', ['code', 'name', 'names', 'currency', 'timezone', 'language'],
    [[c.country.code, c.country.name, { json: c.country.names }, c.country.currency, c.country.timezone, c.country.language]],
    'on conflict (code) do nothing'));
  out.push(insert('catalog_releases',
    ['release_id', 'country_code', 'version', 'status', 'data_checked_until', 'notes', 'source_notes', 'road_factor', 'avg_kmh', 'road_calibrated', 'road_note', 'airport_radius_km'],
    [[rel, c.country.code, c.release.version, 'bozza', c.release.dataCheckedUntil, c.release.notes, { json: c.release.sourceNotes.map(src) },
      c.release.roadFactor, c.release.avgKmh, c.release.roadCalibrated, c.release.roadNote, c.release.airportRadiusKm]],
    'on conflict (release_id) do nothing'));
  out.push(insert('place_keys', ['place_key', 'country_code'], c.places.map((p) => [p.key, c.country.code]), 'on conflict (place_key) do nothing'));
  if (c.homeAirports?.length) {
    out.push(insert('home_airports', ['iata', 'name', 'country_code', 'position', 'default_rank'],
      c.homeAirports.map((a, i) => [a.iata, a.name, a.countryCode, i, a.defaultRank]), 'on conflict (iata) do nothing'));
  }

  const body: string[] = [];
  body.push(insert('regions', ['release_id', 'region_key', 'position', 'name', 'areas', 'sources'],
    c.regions.map((r, i) => [rel, r.key, i, r.name, { json: r.areas }, { json: r.sources.map(src) }]), ''));
  body.push(insert('places', [
    'release_id', 'place_key', 'category', 'region_key', 'lat', 'lng', 'coords_status', 'local_name', 'visit_hours_min', 'visit_hours_max',
    'difficulty', 'kid_score', 'reliability', 'is_base', 'day_visit', 'iata', 'official_url', 'official_kind', 'official_via',
    'wikidata_qid', 'wiki_it', 'wiki_en', 'commons_image', 'base_place_key', 'address', 'setting', 'booking_advice', 'booking_url',
    'hours_published', 'details_wikidata_qid', 'details_checked_at'],
    c.places.map((p) => [rel, p.key, p.category, p.regionKey, p.lat, p.lng, p.coordsStatus, p.localName, p.visitHours?.[0], p.visitHours?.[1],
      p.difficulty, p.kidScore, p.reliability, p.isBase, p.dayVisit, p.iata, p.official?.url, p.official?.kind, p.official?.via,
      p.wiki?.qid, p.wiki?.it, p.wiki?.en, p.wiki?.image, p.details?.base, p.details?.address, p.details?.setting, p.details?.bookingAdvice,
      p.details?.bookingUrl, p.details?.hoursPublished, p.details?.wikidata, p.details?.checkedAt]), ''));
  body.push(insert('place_texts', ['release_id', 'place_key', 'lang', 'name', 'description', 'access', 'season', 'august_note', 'area', 'booking_note', 'seasonal_note', 'outside_note'],
    texts.map(({ key, lang, t }) => [rel, key, lang, t.name, t.description, t.access, t.season, t.augustNote, t.area, t.bookingNote, t.seasonalNote, t.outsideNote]), ''));
  body.push(insert('place_sources', ['release_id', 'place_key', 'field', 'position', 'label', 'url', 'checked_at', 'license', 'method', 'note'],
    sources.map(({ key, field, i, s }) => [rel, key, field, i, s.label, s.url, s.checkedAt, s.license, s.method, s.note]), ''));
  body.push(insert('operators', ['release_id', 'operator_key', 'position', 'name', 'kind', 'url', 'sources', 'texts'],
    c.operators.map((o, i) => [rel, o.key, i, o.name, o.kind, o.url, { json: o.sources }, { json: o.texts }]), ''));
  body.push(insert('voyages', ['release_id', 'voyage_key', 'position', 'operator_key', 'direction', 'from_port', 'to_port', 'from_place_key', 'to_place_key',
    'round_trip', 'days', 'port_calls', 'meals', 'price_currency', 'prices', 'price_valid_for', 'summer_price', 'url', 'checked_at', 'texts'],
    c.voyages.map((v, i) => [rel, v.key, i, v.operatorKey, v.direction, v.fromPort, v.toPort, v.fromPlaceKey, v.toPlaceKey, v.roundTrip, v.days, v.portCalls,
      v.meals, v.priceCurrency, { json: v.prices }, v.priceValidFor, v.summerPrice, v.url, v.checkedAt, { json: v.texts }]), ''));
  body.push(insert('route_ports', ['release_id', 'route_key', 'seq', 'place_key', 'northbound_only', 'seasonal'],
    c.routePorts.map((r) => [rel, r.routeKey, r.seq, r.placeKey, r.northboundOnly, r.seasonal]), ''));
  body.push(insert('place_links', ['release_id', 'kind', 'from_place_key', 'to_place_key', 'label', 'note', 'sources'],
    c.links.map((l) => [rel, l.kind, l.from, l.to, l.label, l.note, { json: l.sources }]), ''));

  out.push(`-- Contenuto della versione: si scrive solo se è ancora in bozza`);
  out.push(`do ${DO_TAG}`);
  out.push('begin');
  out.push(`  if not exists (select 1 from public.catalog_releases where release_id = ${R} and status = 'bozza') then`);
  out.push(`    raise notice 'Versione ${rel} già pubblicata: nessuna scrittura, solo controllo';`);
  out.push('    return;');
  out.push('  end if;');
  out.push(body.map((s) => s.replace(/\n;\n$/, ';\n')).join('\n'));
  out.push(`end ${DO_TAG};`);
  out.push('');
  out.push(`update public.catalog_releases set status = 'pubblicata', published_at = now() where release_id = ${R} and status = 'bozza';`);
  out.push('');

  const expect: [string, string, number][] = [
    ['regions', `release_id = ${R}`, c.regions.length],
    ['places', `release_id = ${R}`, c.places.length],
    ['place_texts', `release_id = ${R}`, texts.length],
    ['place_sources', `release_id = ${R}`, sources.length],
    ['operators', `release_id = ${R}`, c.operators.length],
    ['voyages', `release_id = ${R}`, c.voyages.length],
    ['route_ports', `release_id = ${R}`, c.routePorts.length],
    ['place_links', `release_id = ${R}`, c.links.length],
    ['places', `release_id = ${R} and category = 'porti'`, c.places.filter((p) => p.category === 'porti').length],
    ['places', `release_id = ${R} and coords_status = 'verificate'`, c.places.filter((p) => p.coordsStatus === 'verificate').length],
    ['places', `release_id = ${R} and official_url is not null`, c.places.filter((p) => p.official).length],
    ['places', `release_id = ${R} and wikidata_qid is not null`, c.places.filter((p) => p.wiki).length],
    ['places', `release_id = ${R} and base_place_key is not null`, c.places.filter((p) => p.details).length],
  ];

  out.push('-- Controllo finale: se fallisce, la transazione si annulla');
  out.push('do $check$');
  out.push('declare');
  out.push('  v_n bigint;');
  out.push('begin');
  out.push(`  if not exists (select 1 from public.countries where code = ${q(c.country.code)} and currency = ${q(c.country.currency)} and timezone = ${q(c.country.timezone)} and language = ${q(c.country.language)}) then`);
  out.push(`    raise exception 'Nazione ${c.country.code}: valuta, fuso o lingua diversi da quelli del seed';`);
  out.push('  end if;');
  out.push(`  perform now() at time zone ${q(c.country.timezone)};`);
  out.push(`  if not exists (select 1 from public.catalog_releases where release_id = ${R} and status = 'pubblicata') then`);
  out.push(`    raise exception 'Versione ${rel} non pubblicata';`);
  out.push('  end if;');
  for (const [t, where, n] of expect) {
    out.push(`  select count(*) into v_n from public.${t} where ${where};`);
    out.push(`  if v_n <> ${n} then raise exception '${t} (${where.replace(/'/g, "''")}): attese ${n} righe, trovate %', v_n; end if;`);
  }
  out.push(`  select count(*) into v_n from public.places p join public.place_keys k on k.place_key = p.place_key where p.release_id = ${R} and k.country_code <> ${q(c.country.code)};`);
  out.push(`  if v_n <> 0 then raise exception 'Chiavi di luogo registrate per un''altra nazione: %', v_n; end if;`);
  out.push(`  select count(*) into v_n from public.places p where p.release_id = ${R} and not exists (select 1 from public.place_texts t where t.release_id = p.release_id and t.place_key = p.place_key and t.lang = 'it');`);
  out.push(`  if v_n <> 0 then raise exception 'Luoghi senza testo italiano: %', v_n; end if;`);
  out.push(`  raise notice 'Catalogo ${rel} pubblicato e controllato: ${c.places.length} luoghi, ${c.voyages.length} crociere, ${c.routePorts.length} porti in rotta';`);
  out.push('end $check$;');
  out.push('');
  out.push('commit;');
  out.push('');
  return out.join('\n');
}

// ---------- Catalogo come lo restituisce public.catalog_bundle (per i test e per la modalità senza cloud) ----------

const nn = <T,>(v: T | undefined): T | null => (v === undefined ? null : v);
const srcRow = (s: SourceSeed) => ({ label: s.label, url: nn(s.url), checkedAt: nn(s.checkedAt), license: nn(s.license), note: nn(s.note) });

/**
 * Stessa forma del JSON di `catalog_bundle(release_id)` (righe con tutte le colonne, null dove manca un valore),
 * senza le colonne di sistema (`created_at`). Serve a provare l'adattatore dell'app senza rete e a confrontare
 * il catalogo caricato nel database con quello generato dai file.
 */
export function seedBundle(c: CatalogSeed, opts: { status?: string; publishedAt?: string } = {}): Record<string, unknown> {
  const rel = `${c.country.code}-${c.release.version}`;
  const texts = c.places.flatMap((p) => Object.entries(p.texts).map(([lang, t]) => ({ key: p.key, lang, t })));
  const sources = c.places.flatMap((p) =>
    Object.entries(p.sources).flatMap(([field, list]) => (list ?? []).map((s, i) => ({ key: p.key, field, i, s }))),
  );
  const byKey = (a: { key: string }, b: { key: string }) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  return {
    release: {
      release_id: rel,
      country_code: c.country.code,
      version: c.release.version,
      status: opts.status ?? 'pubblicata',
      data_checked_until: c.release.dataCheckedUntil,
      published_at: opts.publishedAt ?? null,
      notes: c.release.notes,
      source_notes: c.release.sourceNotes.map(srcRow),
      road_factor: nn(c.release.roadFactor),
      avg_kmh: nn(c.release.avgKmh),
      road_calibrated: c.release.roadCalibrated,
      road_note: c.release.roadNote,
      airport_radius_km: nn(c.release.airportRadiusKm),
      previous_release_id: null,
    },
    country: { ...c.country },
    regions: c.regions.map((r, i) => ({ release_id: rel, region_key: r.key, position: i, name: r.name, texts: {}, areas: r.areas, sources: r.sources.map(srcRow) })),
    places: [...c.places].sort(byKey).map((p) => ({
      release_id: rel,
      place_key: p.key,
      category: p.category,
      region_key: nn(p.regionKey),
      lat: p.lat,
      lng: p.lng,
      coords_status: p.coordsStatus,
      local_name: nn(p.localName),
      visit_hours_min: nn(p.visitHours?.[0]),
      visit_hours_max: nn(p.visitHours?.[1]),
      difficulty: nn(p.difficulty),
      kid_score: nn(p.kidScore),
      reliability: p.reliability,
      is_base: p.isBase,
      day_visit: p.dayVisit,
      iata: nn(p.iata),
      official_url: nn(p.official?.url),
      official_kind: nn(p.official?.kind),
      official_via: nn(p.official?.via),
      wikidata_qid: nn(p.wiki?.qid),
      wiki_it: nn(p.wiki?.it),
      wiki_en: nn(p.wiki?.en),
      commons_image: nn(p.wiki?.image),
      base_place_key: nn(p.details?.base),
      address: nn(p.details?.address),
      setting: nn(p.details?.setting),
      booking_advice: nn(p.details?.bookingAdvice),
      booking_url: nn(p.details?.bookingUrl),
      hours_published: nn(p.details?.hoursPublished),
      details_wikidata_qid: nn(p.details?.wikidata),
      details_checked_at: nn(p.details?.checkedAt),
    })),
    place_texts: [...texts].sort((a, b) => byKey(a, b) || (a.lang < b.lang ? -1 : 1)).map(({ key, lang, t }) => ({
      release_id: rel,
      place_key: key,
      lang,
      name: t.name,
      description: t.description,
      access: t.access,
      season: t.season,
      august_note: nn(t.augustNote),
      area: nn(t.area),
      booking_note: nn(t.bookingNote),
      seasonal_note: nn(t.seasonalNote),
      outside_note: nn(t.outsideNote),
    })),
    place_sources: [...sources]
      .sort((a, b) => byKey(a, b) || (a.field < b.field ? -1 : a.field > b.field ? 1 : a.i - b.i))
      .map(({ key, field, i, s }) => ({
        release_id: rel,
        place_key: key,
        field,
        position: i,
        label: s.label,
        url: nn(s.url),
        checked_at: nn(s.checkedAt),
        license: nn(s.license),
        method: nn(s.method),
        note: nn(s.note),
      })),
    operators: c.operators.map((o, i) => ({ release_id: rel, operator_key: o.key, position: i, name: o.name, kind: o.kind, url: nn(o.url), sources: o.sources, texts: o.texts })),
    voyages: c.voyages.map((v, i) => ({
      release_id: rel,
      voyage_key: v.key,
      position: i,
      operator_key: v.operatorKey,
      direction: v.direction,
      from_port: v.fromPort,
      to_port: v.toPort,
      from_place_key: nn(v.fromPlaceKey),
      to_place_key: nn(v.toPlaceKey),
      round_trip: v.roundTrip,
      days: v.days,
      port_calls: nn(v.portCalls),
      meals: v.meals,
      price_currency: v.priceCurrency,
      prices: v.prices,
      price_valid_for: v.priceValidFor,
      summer_price: v.summerPrice,
      url: v.url,
      checked_at: v.checkedAt,
      texts: v.texts,
    })),
    route_ports: c.routePorts.map((r) => ({ release_id: rel, route_key: r.routeKey, seq: r.seq, place_key: r.placeKey, northbound_only: r.northboundOnly, seasonal: r.seasonal })),
    place_links: c.links.map((l) => ({ release_id: rel, kind: l.kind, from_place_key: l.from, to_place_key: l.to, label: l.label, note: l.note, sources: l.sources })),
  };
}

// ---------- Esecuzione ----------

function main(): void {
  const args = process.argv.slice(2);
  const opt = (name: string) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const code = (opt('--country') ?? 'NO').toUpperCase();
  const build = BUILDERS[code];
  if (!build) throw new Error(`Nessun catalogo per ${code}. Disponibili: ${Object.keys(BUILDERS).join(', ')}`);
  const seed = build();
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  if (args.includes('--bundle')) {
    // Catalogo in JSON (forma di catalog_bundle), es. per il server simulato degli script nel browser
    const out = resolve(root, opt('--out') ?? `verify/e2e/catalogo-${code.toLowerCase()}-${seed.release.version}.json`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(seedBundle(seed, { publishedAt: '2026-11-06T00:00:00+00:00' })), 'utf8');
    console.log(`Scritto ${out}`);
    return;
  }
  const outPath = resolve(root, opt('--out') ?? `supabase/seed/${seed.outFile}`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, generateSql(seed), 'utf8');
  console.log(`Scritto ${outPath}: ${seed.places.length} luoghi, ${seed.regions.length} regioni, ${seed.voyages.length} crociere, ${seed.routePorts.length} porti in rotta, ${seed.links.length} collegamenti in treno.`);
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();
