// Conversione del documento Trip in righe delle tabelle del viaggio (supabase/migrations/20261106000200_viaggio.sql)
// e ritorno. Funzioni pure, senza rete: le usano la sincronizzazione per riga e il passaggio dal documento.
//
// Regola: fromRows(toRows(t)) ricostruisce t identico (vedi canonical). Per non perdere nulla:
// - i campi sconosciuti di ogni entità vanno in `extra` della riga;
// - in `extra.__nfhp` (metadati di conversione) si annota ciò che le colonne da sole non distinguono:
//   campi assenti (`absent`), valori null (`nulls`), valori che non entrano nella colonna (`raw`: tipo sbagliato,
//   valore fuori elenco, doppioni che violerebbero la chiave) e date con un formato da conservare (`text`).
// Un valore in `raw` è ricostruito com'era; la colonna riceve il valore predefinito e la conversione lo segnala
// in `warnings` (il passaggio dal documento li elenca, non li scarta).

import type { Trip } from './types';

export type Row = Record<string, unknown>;
export type TripRows = Record<string, Row[]>;

/** Ordine delle tabelle: prima i genitori (come public.sync_table_order) */
export const TABLE_ORDER = [
  'trips', 'trip_countries', 'trip_rates', 'trip_versions', 'stops', 'stop_ideas', 'legs', 'segments', 'days',
  'activities', 'budget_items', 'flights', 'accommodations', 'coastal_options', 'favorites', 'diary_entries',
  'diary_attachments', 'visit_states', 'plan_log',
] as const;
export type TableName = (typeof TABLE_ORDER)[number];

/** Chiavi delle tabelle (come public.sync_table_keys) */
export const TABLE_KEYS: Record<TableName, string[]> = {
  trips: ['id'],
  trip_countries: ['trip_id', 'country_code'],
  trip_rates: ['trip_id', 'currency'],
  trip_versions: ['trip_id', 'id'],
  stops: ['trip_id', 'version_id', 'id'],
  stop_ideas: ['trip_id', 'version_id', 'stop_id', 'place_key'],
  legs: ['trip_id', 'version_id', 'id'],
  segments: ['trip_id', 'version_id', 'id'],
  days: ['trip_id', 'version_id', 'day_key'],
  activities: ['trip_id', 'version_id', 'id'],
  budget_items: ['trip_id', 'version_id', 'id'],
  flights: ['trip_id', 'version_id', 'id'],
  accommodations: ['trip_id', 'id'],
  coastal_options: ['trip_id', 'id'],
  favorites: ['trip_id', 'place_key'],
  diary_entries: ['trip_id', 'id'],
  diary_attachments: ['trip_id', 'id'],
  visit_states: ['trip_id', 'target_kind', 'target_id'],
  plan_log: ['trip_id', 'id'],
};

export class RowsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RowsError';
  }
}

// ---------- Specifiche dei campi ----------

const STATUS = ['confermato', 'stimato', 'da_verificare', 'prenotato', 'pagato'] as const;

type Kind =
  | { t: 's' } // testo
  | { t: 'n' } // numero
  | { t: 'i'; min?: number } // intero
  | { t: 'b' } // booleano
  | { t: 'j' } // JSON qualsiasi (jsonb)
  | { t: 'sa' } // elenco di testi (text[])
  | { t: 'e'; values: readonly string[] } // valore di un elenco
  | { t: 'cc' } // codice nazione ISO 3166-1 alfa-2
  | { t: 'cur' } // valuta ISO 4217
  | { t: 'ts' } // data e ora (timestamptz): il testo originale resta nei metadati
  | { t: 'm'; amount: string; currency: string }; // Money in due colonne

interface Field {
  /** Campo del documento */
  k: string;
  /** Colonna (per Money: nome logico) */
  c: string;
  kind: Kind;
  /** Valore della colonna quando il campo manca o non è valido (colonne «not null»); assente = null */
  d?: unknown;
}

const S: Kind = { t: 's' };
const N: Kind = { t: 'n' };
const I: Kind = { t: 'i' };
const B: Kind = { t: 'b' };
const J: Kind = { t: 'j' };
const SA: Kind = { t: 'sa' };
const e = (...values: string[]): Kind => ({ t: 'e', values });
const money = (prefix: string): Kind => ({ t: 'm', amount: `${prefix}_amount`, currency: `${prefix}_currency` });
const f = (k: string, c: string, kind: Kind, d?: unknown): Field => (d === undefined ? { k, c, kind } : { k, c, kind, d });
const status = (k: string, c: string) => f(k, c, e(...STATUS), 'da_verificare');
const verification = f('verification', 'verification', J);
const source = f('source', 'source', J);

const TRIP_FIELDS: Field[] = [
  f('title', 'title', S, 'Viaggio'),
  f('startDate', 'start_date', S),
  f('dateTentative', 'date_tentative', B),
  f('participants', 'participants', J),
  f('usefulInfo', 'useful_info', S),
  f('activeScenarioId', 'active_version_id', S),
  f('updatedAt', 'app_updated_at', S),
  f('schemaVersion', 'schema_version', { t: 'i', min: 1 }, 1),
];
/** Campi del documento che diventano righe di altre tabelle o metadati */
const TRIP_HANDLED = new Set([
  'id', 'settings', 'stops', 'legs', 'days', 'coastalOptions', 'flights', 'accommodations', 'budgetItems', 'favorites',
  'actuals', 'diary', 'planLog', 'scenarios', 'lastMutationId', 'countries', 'rates',
]);
const NOK_SETTINGS = ['nokPerEur', 'nokRateNote', 'nokRateDate', 'nokRateAuto'] as const;

const RATE_FIELDS: Field[] = [
  f('perEur', 'per_eur', N),
  f('date', 'rate_date', S),
  f('note', 'note', S, ''),
  f('source', 'source', S),
  f('auto', 'auto', B, true),
  f('fetchedAt', 'fetched_at', S),
];
/** Cambio NOK: oggi nelle impostazioni del viaggio */
const NOK_FIELDS: Field[] = [
  f('nokPerEur', 'per_eur', N),
  f('nokRateDate', 'rate_date', S),
  f('nokRateNote', 'note', S, ''),
  f('nokRateAuto', 'auto', B, true),
];
const COUNTRY_FIELDS: Field[] = [f('releaseId', 'release_id', S, '')];
const FUEL_FIELDS: Field[] = [
  f('price', 'fuel_price', N),
  f('currency', 'fuel_currency', { t: 'cur' }),
  f('auto', 'fuel_auto', B),
  f('period', 'fuel_period', S),
  f('source', 'fuel_source', S),
  f('fetchedAt', 'fuel_fetched_at', S),
];
const VERSION_FIELDS: Field[] = [
  f('name', 'name', S, ''),
  f('kind', 'kind', e('auto_hytte', 'auto_traghetti_costiera', 'misto_treni', 'altro'), 'altro'),
  f('notes', 'notes', S, ''),
  f('updatedAt', 'app_updated_at', S),
];
const PLAN_FIELDS: Field[] = [f('startDate', 'start_date', S), f('coastalSelected', 'coastal_selected', SA)];
const PLAN_HANDLED = new Set(['startDate', 'coastalSelected', 'stops', 'legs', 'days', 'budgetItems', 'flights']);

const STOP_FIELDS: Field[] = [
  f('kind', 'kind', e('luogo', 'a_bordo'), 'luogo'),
  f('destinationId', 'place_key', S),
  f('countryCode', 'country_code', { t: 'cc' }),
  f('name', 'name', S, ''),
  f('lat', 'lat', N),
  f('lng', 'lng', N),
  f('nights', 'nights', I, 0),
  f('accommodationId', 'accommodation_id', S),
  f('notes', 'notes', S, ''),
  f('weatherPlanB', 'weather_plan_b', S, ''),
  f('placedFrom', 'placed_from', S),
];
const LEG_FIELDS: Field[] = [
  f('fromStopId', 'from_stop_id', S, ''),
  f('toStopId', 'to_stop_id', S, ''),
  f('calculatedAt', 'calculated_at', S),
  f('routingError', 'routing_error', S),
];
const SEGMENT_FIELDS: Field[] = [
  f('mode', 'mode', e('strada', 'traghetto', 'costiera', 'treno', 'bus', 'aereo', 'non_calcolato'), 'non_calcolato'),
  f('label', 'label', S, ''),
  f('distanceKm', 'distance_km', N),
  f('durationMin', 'duration_min', N),
  f('waitMin', 'wait_min', N),
  f('departureTime', 'departure_time', S),
  f('cost', 'cost', money('cost')),
  status('costStatus', 'cost_status'),
  source,
  status('status', 'status'),
  f('coastalOptionId', 'coastal_option_id', S),
  f('flightId', 'flight_id', S),
  f('geometry', 'geometry', J),
  f('note', 'note', S),
  verification,
];
const DAY_FIELDS: Field[] = [f('notes', 'notes', S, ''), f('planB', 'plan_b', S, '')];
const ACTIVITY_FIELDS: Field[] = [
  f('title', 'title', S, ''),
  f('destinationId', 'place_key', S),
  f('durationMin', 'duration_min', N),
  f('cost', 'cost', money('cost')),
  status('costStatus', 'cost_status'),
  verification,
];
const BUDGET_FIELDS: Field[] = [
  f('category', 'category', e('voli', 'bagagli_transfer', 'noleggio_auto', 'carburante_pedaggi', 'traghetti', 'costiera', 'treni_bus', 'alloggi', 'pasti', 'attrazioni', 'extra_imprevisti'), 'extra_imprevisti'),
  f('label', 'label', S, ''),
  // Importo obbligatorio: se non valido la colonna riceve 0 EUR e il valore originale resta nei metadati
  { k: 'amount', c: 'amount', kind: { t: 'm', amount: 'amount', currency: 'currency' }, d: { amount: 0, currency: 'EUR' } },
  status('status', 'status'),
  source,
  f('notes', 'notes', S, ''),
];
const FLIGHT_FIELDS: Field[] = [
  f('direction', 'direction', e('andata', 'ritorno', 'interno'), 'andata'),
  f('fromAirport', 'from_airport', S, ''),
  f('toAirport', 'to_airport', S, ''),
  f('date', 'date', S),
  f('departureTime', 'departure_time', S),
  f('arrivalTime', 'arrival_time', S),
  f('airline', 'airline', S, ''),
  f('flightNumber', 'flight_number', S, ''),
  f('stops', 'stops_count', { t: 'i', min: 0 }),
  f('baggage', 'baggage', S, ''),
  f('price', 'price', money('price')),
  status('priceStatus', 'price_status'),
  f('selected', 'selected', B, false),
  source,
  f('notes', 'notes', S, ''),
  f('keptIssues', 'kept_issues', SA),
  verification,
];
const ACCOMMODATION_FIELDS: Field[] = [
  f('name', 'name', S, ''),
  f('type', 'type', e('hytte', 'hytte_campeggio', 'hotel', 'appartamento', 'altro'), 'altro'),
  f('locality', 'locality', S, ''),
  f('lat', 'lat', N),
  f('lng', 'lng', N),
  f('url', 'url', S),
  f('pricePerNight', 'price_per_night', money('price_per_night')),
  status('priceStatus', 'price_status'),
  f('cleaningFee', 'cleaning_fee', money('cleaning_fee')),
  f('linenFee', 'linen_fee', money('linen_fee')),
  f('capacity', 'capacity', I),
  f('beds', 'beds', S, ''),
  f('bathroom', 'bathroom', e('privato', 'condiviso', 'non_noto'), 'non_noto'),
  f('kitchen', 'kitchen', e('si', 'no', 'non_noto'), 'non_noto'),
  f('parking', 'parking', e('si', 'no', 'non_noto'), 'non_noto'),
  f('cancellation', 'cancellation', S, ''),
  f('status', 'status', e('individuata', 'disponibile', 'opzionata', 'prenotata', 'annullata'), 'individuata'),
  f('stopId', 'stop_id', S),
  source,
  f('notes', 'notes', S, ''),
  verification,
  f('address', 'address', S),
  f('phone', 'phone', S),
];
const COASTAL_FIELDS: Field[] = [
  f('operator', 'operator', S, ''),
  f('direction', 'direction', e('nord', 'sud'), 'nord'),
  f('fromPort', 'from_port', S, ''),
  f('toPort', 'to_port', S, ''),
  f('date', 'date', S),
  f('departureTime', 'departure_time', S),
  f('arrivalTime', 'arrival_time', S),
  f('durationHours', 'duration_hours', N),
  f('nightsOnboard', 'nights_onboard', I, 0),
  f('cabin', 'cabin', S, ''),
  f('withCar', 'with_car', B, false),
  f('meals', 'meals', e('nessuno', 'mezza_pensione', 'pensione_completa', 'a_la_carte', 'da_definire'), 'da_definire'),
  f('price', 'price', money('price')),
  status('priceStatus', 'price_status'),
  f('extras', 'extras', money('extras')),
  f('childRules', 'child_rules', S, ''),
  f('changePolicy', 'change_policy', S, ''),
  f('notes', 'notes', S, ''),
  source,
  verification,
  f('selected', 'selected', B, false),
  f('catalogId', 'catalog_id', S),
];
const DIARY_FIELDS: Field[] = [
  f('createdAt', 'app_created_at', S, ''),
  f('updatedAt', 'app_updated_at', S),
  f('localDate', 'local_date', S),
  f('localTime', 'local_time', S),
  f('tzOffsetMin', 'tz_offset_min', I),
  f('text', 'text', S, ''),
  f('dayDate', 'day_date', S),
  f('stopId', 'stop_id', S),
  f('stopName', 'stop_name', S),
  f('deletedAt', 'app_deleted_at', S),
];
const ATTACHMENT_FIELDS: Field[] = [
  f('name', 'name', S, ''),
  f('type', 'mime_type', S, ''),
  f('size', 'size_bytes', { t: 'i', min: 0 }, 0),
  f('state', 'state', e('solo_dispositivo', 'errore', 'nel_cloud'), 'solo_dispositivo'),
  f('error', 'error', S),
  f('storagePath', 'storage_path', S),
  f('uploadedAt', 'uploaded_at', { t: 'ts' }),
];
const VISIT_FIELDS: Field[] = [f('at', 'at', S)];
const PLANLOG_FIELDS: Field[] = [f('at', 'at', S), f('label', 'label', S, ''), f('from', 'from_version', S), f('to', 'to_version', S)];

/** Colonne di dati scritte da toRows, per tabella (servono a confrontare righe del cloud e del dispositivo) */
function columnsOf(fields: Field[]): string[] {
  return fields.flatMap((x) => (x.kind.t === 'm' ? [x.kind.amount, x.kind.currency] : [x.c]));
}
export const DATA_COLUMNS: Record<TableName, string[]> = {
  trips: ['id', ...columnsOf(TRIP_FIELDS), 'settings', 'base_currency', 'extra'],
  trip_countries: ['trip_id', 'country_code', 'position', ...columnsOf(COUNTRY_FIELDS), ...columnsOf(FUEL_FIELDS), 'extra'],
  trip_rates: ['trip_id', 'currency', ...columnsOf(RATE_FIELDS), 'extra'],
  trip_versions: ['trip_id', 'id', 'position', ...columnsOf(VERSION_FIELDS), ...columnsOf(PLAN_FIELDS), 'plan_has_flights', 'extra'],
  stops: ['trip_id', 'version_id', 'id', 'position', ...columnsOf(STOP_FIELDS), 'extra'],
  stop_ideas: ['trip_id', 'version_id', 'stop_id', 'place_key', 'position', 'extra'],
  legs: ['trip_id', 'version_id', 'id', 'position', ...columnsOf(LEG_FIELDS), 'extra'],
  segments: ['trip_id', 'version_id', 'id', 'leg_id', 'position', ...columnsOf(SEGMENT_FIELDS), 'extra'],
  days: ['trip_id', 'version_id', 'day_key', ...columnsOf(DAY_FIELDS), 'extra'],
  activities: ['trip_id', 'version_id', 'id', 'day_key', 'position', ...columnsOf(ACTIVITY_FIELDS), 'extra'],
  budget_items: ['trip_id', 'version_id', 'id', 'position', ...columnsOf(BUDGET_FIELDS), 'extra'],
  flights: ['trip_id', 'version_id', 'id', 'position', ...columnsOf(FLIGHT_FIELDS), 'extra'],
  accommodations: ['trip_id', 'id', 'position', ...columnsOf(ACCOMMODATION_FIELDS), 'extra'],
  coastal_options: ['trip_id', 'id', 'position', ...columnsOf(COASTAL_FIELDS), 'extra'],
  favorites: ['trip_id', 'place_key', 'position', 'extra'],
  diary_entries: ['trip_id', 'id', 'position', ...columnsOf(DIARY_FIELDS), 'extra'],
  diary_attachments: ['trip_id', 'id', 'entry_id', 'position', ...columnsOf(ATTACHMENT_FIELDS), 'extra'],
  visit_states: ['trip_id', 'target_kind', 'target_id', 'state', ...columnsOf(VISIT_FIELDS), 'extra'],
  plan_log: ['trip_id', 'id', 'position', ...columnsOf(PLANLOG_FIELDS), 'extra'],
};

// ---------- Codifica di un'entità ----------

interface Meta {
  absent?: string[];
  nulls?: string[];
  raw?: Record<string, unknown>;
  text?: Record<string, string>;
  [k: string]: unknown;
}

type Obj = Record<string, unknown>;
const META = '__nfhp';
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const has = (o: Obj, k: string) => Object.prototype.hasOwnProperty.call(o, k) && o[k] !== undefined;

function valid(kind: Kind, v: unknown): boolean {
  switch (kind.t) {
    case 's':
    case 'ts':
      return typeof v === 'string';
    case 'n':
      return typeof v === 'number' && Number.isFinite(v);
    case 'i':
      return typeof v === 'number' && Number.isInteger(v) && Math.abs(v) <= 2_147_483_647 && (kind.min === undefined || v >= kind.min);
    case 'b':
      return typeof v === 'boolean';
    case 'j':
      return true;
    case 'sa':
      return Array.isArray(v) && v.every((x) => typeof x === 'string');
    case 'e':
      return typeof v === 'string' && kind.values.includes(v);
    case 'cc':
      return typeof v === 'string' && /^[A-Z]{2}$/.test(v);
    case 'cur':
      return typeof v === 'string' && /^[A-Z]{3}$/.test(v);
    case 'm':
      return (
        isObj(v) &&
        Object.keys(v).every((k) => k === 'amount' || k === 'currency') &&
        typeof v.amount === 'number' &&
        Number.isFinite(v.amount) &&
        typeof v.currency === 'string' &&
        /^[A-Z]{3}$/.test(v.currency)
      );
  }
}

function setColumn(row: Row, field: Field, v: unknown): void {
  if (field.kind.t === 'm') {
    const m = (v ?? null) as { amount?: unknown; currency?: unknown } | null;
    row[field.kind.amount] = m ? m.amount : null;
    row[field.kind.currency] = m ? m.currency : null;
  } else {
    row[field.c] = v === undefined ? null : v;
  }
}

class Encoder {
  warnings: string[] = [];

  /** Codifica i campi noti di obj in row; restituisce i metadati e i campi sconosciuti (per extra). */
  entity(where: string, obj: Obj, fields: Field[], row: Row, handled: ReadonlySet<string> = new Set(), meta: Meta = {}): Row {
    const known = new Set([...fields.map((x) => x.k), ...handled]);
    for (const field of fields) {
      const { k } = field;
      if (!has(obj, k)) {
        setColumn(row, field, field.d ?? null);
        (meta.absent ??= []).push(k);
        continue;
      }
      const v = obj[k];
      if (v === null) {
        setColumn(row, field, field.d ?? null);
        (meta.nulls ??= []).push(k);
        continue;
      }
      if (!valid(field.kind, v)) {
        setColumn(row, field, field.d ?? null);
        (meta.raw ??= {})[k] = v;
        this.warnings.push(`${where}: valore di «${k}» non previsto, conservato com'era`);
        continue;
      }
      if (field.kind.t === 'ts') (meta.text ??= {})[k] = v as string;
      setColumn(row, field, v);
    }
    const extra: Obj = {};
    for (const [k, v] of Object.entries(obj)) if (!known.has(k) && v !== undefined) extra[k] = v;
    if (Object.keys(meta).length) extra[META] = meta;
    row.extra = extra;
    return row;
  }
}

function decodeEntity(row: Row, fields: Field[], out: Obj = {}): { obj: Obj; meta: Meta } {
  const extra = isObj(row.extra) ? row.extra : {};
  const meta = (isObj(extra[META]) ? extra[META] : {}) as Meta;
  const absent = new Set(meta.absent ?? []);
  const nulls = new Set(meta.nulls ?? []);
  for (const field of fields) {
    const { k } = field;
    if (absent.has(k)) continue;
    if (nulls.has(k)) {
      out[k] = null;
      continue;
    }
    if (meta.raw && Object.prototype.hasOwnProperty.call(meta.raw, k)) {
      out[k] = meta.raw[k];
      continue;
    }
    if (field.kind.t === 'm') {
      const a = row[field.kind.amount];
      const c = row[field.kind.currency];
      if (a !== null && a !== undefined && c !== null && c !== undefined) out[k] = { amount: Number(a), currency: c };
      continue;
    }
    const v = row[field.c];
    if (v === null || v === undefined) continue;
    if (field.kind.t === 'ts' && meta.text?.[k] !== undefined) out[k] = meta.text[k];
    else if (field.kind.t === 'n' || field.kind.t === 'i') out[k] = Number(v);
    else out[k] = v;
  }
  for (const [k, v] of Object.entries(extra)) if (k !== META) out[k] = v;
  return { obj: out, meta };
}

// ---------- Documento → righe ----------

export interface ToRowsResult {
  rows: TripRows;
  /** Valori conservati nei metadati perché non entrano nelle colonne (elencati, non scartati) */
  warnings: string[];
}

const arr = (v: unknown): unknown[] | undefined => (Array.isArray(v) ? v : undefined);

/** Tiene gli elementi con id unico; se ci sono doppioni restituisce undefined (l'elenco va conservato intero nei metadati) */
function uniqueBy(list: unknown[], key: (x: Obj) => unknown, seen: Set<string> = new Set()): boolean {
  const local = new Set<string>();
  for (const x of list) {
    if (!isObj(x)) return false;
    const id = key(x);
    if (typeof id !== 'string' || !id) return false;
    if (local.has(id) || seen.has(id)) return false;
    local.add(id);
  }
  for (const id of local) seen.add(id);
  return true;
}

export function toRows(trip: Trip): ToRowsResult {
  const t = trip as unknown as Obj;
  const tripId = t.id;
  if (typeof tripId !== 'string' || !tripId) throw new RowsError('Viaggio senza identificativo');
  const enc = new Encoder();
  const rows: TripRows = Object.fromEntries(TABLE_ORDER.map((n) => [n, [] as Row[]]));
  const add = (table: TableName, row: Row) => rows[table]!.push(row);
  const tripMeta: Meta = {};

  // Riga del viaggio e impostazioni (senza il cambio NOK, che va in trip_rates)
  const tripRow: Row = { id: tripId, base_currency: 'EUR' };
  const settings = isObj(t.settings) ? { ...t.settings } : undefined;
  if (settings) {
    const nok: Obj = {};
    let hasNok = false;
    for (const k of NOK_SETTINGS) {
      if (Object.prototype.hasOwnProperty.call(settings, k)) {
        if (settings[k] !== undefined) {
          nok[k] = settings[k];
          hasNok = true;
        }
        delete settings[k];
      }
    }
    if (hasNok) add('trip_rates', enc.entity('Cambio NOK', nok, NOK_FIELDS, { trip_id: tripId, currency: 'NOK', fetched_at: null, source: null }, new Set(), { nok: true }));
    tripRow.settings = settings;
  } else {
    tripRow.settings = null;
    if (t.settings !== undefined) (tripMeta.raw ??= {}).settings = t.settings;
    else (tripMeta.absent ??= []).push('settings');
  }

  // Altre valute
  if (isObj(t.rates)) {
    for (const [cur, rate] of Object.entries(t.rates)) {
      if (!/^[A-Z]{3}$/.test(cur) || cur === 'NOK' || !isObj(rate)) {
        ((tripMeta.raw ??= {}).ratesKeys ??= {} as Obj);
        ((tripMeta.raw as Obj).ratesKeys as Obj)[cur] = rate;
        enc.warnings.push(`Cambio «${cur}»: valuta non valida, conservata com'era`);
        continue;
      }
      add('trip_rates', enc.entity(`Cambio ${cur}`, rate, RATE_FIELDS, { trip_id: tripId, currency: cur }));
    }
  } else if (t.rates !== undefined) (tripMeta.raw ??= {}).rates = t.rates;
  else (tripMeta.absent ??= []).push('rates');

  // Nazioni
  const countries = arr(t.countries);
  if (countries && uniqueBy(countries, (x) => (typeof x.code === 'string' && /^[A-Z]{2}$/.test(x.code) ? x.code : undefined))) {
    countries.forEach((c, i) => {
      const co = c as Obj;
      const row: Row = { trip_id: tripId, country_code: co.code, position: i };
      const meta: Meta = {};
      const fuel = co.fuel;
      if (isObj(fuel)) {
        const fuelRow: Row = {};
        enc.entity(`Carburante ${String(co.code)}`, fuel, FUEL_FIELDS, fuelRow);
        Object.assign(row, fuelRow);
        const fx = fuelRow.extra as Obj;
        if (Object.keys(fx).length) meta.fuel = fx;
      } else {
        for (const x of FUEL_FIELDS) row[x.c] = null;
        if (fuel === undefined) meta.noFuel = true;
        else (meta.raw ??= {}).fuel = fuel;
      }
      enc.entity(`Nazione ${String(co.code)}`, co, COUNTRY_FIELDS, row, new Set(['code', 'fuel']), meta);
      add('trip_countries', row);
    });
  } else if (t.countries !== undefined) {
    (tripMeta.raw ??= {}).countries = t.countries;
    enc.warnings.push('Nazioni del viaggio non valide o ripetute: conservate com\'erano');
  } else (tripMeta.absent ??= []).push('countries');

  // Versioni del percorso
  const scenarios = arr(t.scenarios);
  const activeId = t.activeScenarioId;
  if (typeof activeId !== 'string' || !scenarios || !scenarios.some((s) => isObj(s) && s.id === activeId)) {
    throw new RowsError('Il viaggio non ha una versione attiva del percorso: va normalizzato prima della conversione');
  }
  if (!uniqueBy(scenarios, (x) => x.id)) throw new RowsError('Versioni del percorso con identificativi ripetuti');

  const encodePlan = (versionId: string, plan: Obj, flights: unknown) => {
    const seenSeg = new Set<string>();
    const seenAct = new Set<string>();
    const stops = arr(plan.stops) ?? [];
    const stopIdsOk = uniqueBy(stops, (x) => x.id);
    if (!stopIdsOk) throw new RowsError(`Versione ${versionId}: tappe con identificativi ripetuti o non validi`);
    stops.forEach((s, i) => {
      const st = s as Obj;
      const row: Row = { trip_id: tripId, version_id: versionId, id: st.id, position: i };
      const meta: Meta = {};
      const ideas = st.ideas;
      if (ideas === undefined) meta.noIdeas = true;
      else if (Array.isArray(ideas) && ideas.every((x) => typeof x === 'string' && x) && new Set(ideas).size === ideas.length) {
        ideas.forEach((p, j) => add('stop_ideas', { trip_id: tripId, version_id: versionId, stop_id: st.id, place_key: p, position: j, extra: {} }));
      } else {
        (meta.raw ??= {}).ideas = ideas;
        enc.warnings.push(`Tappa ${String(st.name ?? st.id)}: idee ripetute, conservate com'erano`);
      }
      enc.entity(`Tappa ${String(st.name ?? st.id)}`, st, STOP_FIELDS, row, new Set(['id', 'ideas']), meta);
      add('stops', row);
    });
    const legs = arr(plan.legs) ?? [];
    if (!uniqueBy(legs, (x) => x.id)) throw new RowsError(`Versione ${versionId}: tratti con identificativi ripetuti o non validi`);
    legs.forEach((l, i) => {
      const lg = l as Obj;
      const row: Row = { trip_id: tripId, version_id: versionId, id: lg.id, position: i };
      const meta: Meta = {};
      const segs = lg.segments;
      if (Array.isArray(segs) && uniqueBy(segs, (x) => x.id, seenSeg)) {
        segs.forEach((sg, j) => {
          const so = sg as Obj;
          add('segments', enc.entity(`Segmento ${String(so.label ?? so.id)}`, so, SEGMENT_FIELDS, { trip_id: tripId, version_id: versionId, id: so.id, leg_id: lg.id, position: j }, new Set(['id'])));
        });
      } else if (segs === undefined) meta.noSegments = true;
      else {
        (meta.raw ??= {}).segments = segs;
        enc.warnings.push(`Tratto ${String(lg.id)}: segmenti con identificativi ripetuti, conservati com'erano`);
      }
      enc.entity(`Tratto ${String(lg.id)}`, lg, LEG_FIELDS, row, new Set(['id', 'segments']), meta);
      add('legs', row);
    });
    const days = isObj(plan.days) ? plan.days : {};
    for (const [key, d] of Object.entries(days)) {
      const row: Row = { trip_id: tripId, version_id: versionId, day_key: key };
      const meta: Meta = {};
      if (!isObj(d)) {
        for (const x of DAY_FIELDS) row[x.c] = x.d;
        (meta.raw ??= {}).day = d;
        row.extra = { [META]: meta };
        add('days', row);
        continue;
      }
      const acts = d.activities;
      if (Array.isArray(acts) && uniqueBy(acts, (x) => x.id, seenAct)) {
        acts.forEach((a, j) => {
          const ao = a as Obj;
          add('activities', enc.entity(`Attività ${String(ao.title ?? ao.id)}`, ao, ACTIVITY_FIELDS, { trip_id: tripId, version_id: versionId, id: ao.id, day_key: key, position: j }, new Set(['id'])));
        });
      } else if (acts === undefined) meta.noActivities = true;
      else {
        (meta.raw ??= {}).activities = acts;
        enc.warnings.push(`Giornata ${key}: attività con identificativi ripetuti, conservate com'erano`);
      }
      enc.entity(`Giornata ${key}`, d, DAY_FIELDS, row, new Set(['activities']), meta);
      add('days', row);
    }
    const budget = arr(plan.budgetItems) ?? [];
    if (!uniqueBy(budget, (x) => x.id)) throw new RowsError(`Versione ${versionId}: voci di budget con identificativi ripetuti o non validi`);
    budget.forEach((b, i) => {
      const bo = b as Obj;
      add('budget_items', enc.entity(`Voce di budget ${String(bo.label ?? bo.id)}`, bo, BUDGET_FIELDS, { trip_id: tripId, version_id: versionId, id: bo.id, position: i }, new Set(['id'])));
    });
    const fl = arr(flights) ?? [];
    if (!uniqueBy(fl, (x) => x.id)) throw new RowsError(`Versione ${versionId}: voli con identificativi ripetuti o non validi`);
    fl.forEach((x, i) => {
      const fo = x as Obj;
      add('flights', enc.entity(`Volo ${String(fo.flightNumber || fo.id)}`, fo, FLIGHT_FIELDS, { trip_id: tripId, version_id: versionId, id: fo.id, position: i }, new Set(['id'])));
    });
  };

  scenarios.forEach((s, i) => {
    const sc = s as Obj;
    const id = sc.id as string;
    const row: Row = { trip_id: tripId, id, position: i };
    const meta: Meta = {};
    if (id === activeId) {
      for (const x of PLAN_FIELDS) row[x.c] = null;
      row.plan_has_flights = null;
      if (sc.plan !== undefined) (meta.raw ??= {}).plan = sc.plan;
      // Piano attivo: nei campi principali del viaggio
      const plan: Obj = { stops: t.stops, legs: t.legs, days: t.days, budgetItems: t.budgetItems };
      encodePlan(id, plan, t.flights);
    } else if (isObj(sc.plan)) {
      const plan = sc.plan;
      const planRow: Row = {};
      enc.entity(`Versione ${String(sc.name ?? id)}`, plan, PLAN_FIELDS, planRow, PLAN_HANDLED);
      const pe = planRow.extra as Obj;
      delete planRow.extra;
      Object.assign(row, planRow);
      if (Object.keys(pe).length) meta.plan = pe;
      row.plan_has_flights = plan.flights !== undefined;
      if (plan.flights !== undefined && !Array.isArray(plan.flights)) (meta.raw ??= {}).planFlights = plan.flights;
      encodePlan(id, plan, Array.isArray(plan.flights) ? plan.flights : undefined);
    } else {
      for (const x of PLAN_FIELDS) row[x.c] = null;
      row.plan_has_flights = null;
      if (sc.plan === undefined) meta.noPlan = true;
      else (meta.raw ??= {}).plan = sc.plan;
    }
    enc.entity(`Versione ${String(sc.name ?? id)}`, sc, VERSION_FIELDS, row, new Set(['id', 'plan']), meta);
    add('trip_versions', row);
  });
  // Le liste del piano attivo che non sono elenchi (documento rotto) restano com'erano
  for (const k of ['stops', 'legs', 'budgetItems', 'flights'] as const) {
    if (t[k] === undefined) (tripMeta.absent ??= []).push(k);
    else if (!Array.isArray(t[k])) throw new RowsError(`Campo «${k}» non valido`);
  }
  if (t.days === undefined) (tripMeta.absent ??= []).push('days');
  else if (!isObj(t.days)) throw new RowsError('Campo «days» non valido');

  // Elementi condivisi
  const shared = (key: string, table: TableName, fields: Field[], label: (o: Obj) => string) => {
    const list = t[key];
    if (list === undefined) {
      (tripMeta.absent ??= []).push(key);
      return;
    }
    if (!Array.isArray(list) || !uniqueBy(list, (x) => x.id)) {
      (tripMeta.raw ??= {})[key] = list;
      enc.warnings.push(`«${key}»: elenco non valido o con identificativi ripetuti, conservato com'era`);
      return;
    }
    list.forEach((x, i) => {
      const o = x as Obj;
      add(table, enc.entity(label(o), o, fields, { trip_id: tripId, id: o.id, position: i }, new Set(['id'])));
    });
  };
  shared('accommodations', 'accommodations', ACCOMMODATION_FIELDS, (o) => `Alloggio ${String(o.name ?? o.id)}`);
  shared('coastalOptions', 'coastal_options', COASTAL_FIELDS, (o) => `Crociera ${String(o.operator ?? '')} ${String(o.fromPort ?? '')}`);

  // Preferiti
  const fav = t.favorites;
  if (fav === undefined) (tripMeta.absent ??= []).push('favorites');
  else if (Array.isArray(fav) && fav.every((x) => typeof x === 'string' && x) && new Set(fav).size === fav.length) {
    fav.forEach((p, i) => add('favorites', { trip_id: tripId, place_key: p, position: i, extra: {} }));
  } else {
    (tripMeta.raw ??= {}).favorites = fav;
    enc.warnings.push('Preferiti ripetuti: conservati com\'erano');
  }

  // Diario e allegati
  const diary = t.diary;
  if (diary === undefined) (tripMeta.absent ??= []).push('diary');
  else if (!Array.isArray(diary) || !uniqueBy(diary, (x) => x.id)) {
    (tripMeta.raw ??= {}).diary = diary;
    enc.warnings.push('Diario con voci ripetute: conservato com\'era');
  } else {
    const seenAtt = new Set<string>();
    diary.forEach((x, i) => {
      const de = x as Obj;
      const row: Row = { trip_id: tripId, id: de.id, position: i };
      const meta: Meta = {};
      const atts = de.attachments;
      if (atts === undefined) meta.noAttachments = true;
      else if (Array.isArray(atts) && uniqueBy(atts, (a) => a.id, seenAtt)) {
        atts.forEach((a, j) => {
          const ao = a as Obj;
          add('diary_attachments', enc.entity(`Allegato ${String(ao.name ?? ao.id)}`, ao, ATTACHMENT_FIELDS, { trip_id: tripId, id: ao.id, entry_id: de.id, position: j }, new Set(['id'])));
        });
      } else {
        // Es. la copia «…-cloud» di una voce unita: stessi allegati della voce originale
        (meta.raw ??= {}).attachments = atts;
      }
      enc.entity(`Voce del diario ${String(de.id)}`, de, DIARY_FIELDS, row, new Set(['id', 'attachments']), meta);
      add('diary_entries', row);
    });
  }

  // Stati di visita
  const actuals = t.actuals;
  if (actuals === undefined) (tripMeta.absent ??= []).push('actuals');
  else if (!isObj(actuals)) (tripMeta.raw ??= {}).actuals = actuals;
  else {
    const ax: Obj = {};
    for (const [k, v] of Object.entries(actuals)) if (k !== 'stops' && k !== 'activities') ax[k] = v;
    if (Object.keys(ax).length) tripMeta.actualsExtra = ax;
    const kinds: [string, 'tappa' | 'attivita', readonly string[]][] = [
      ['stops', 'tappa', ['in_corso', 'visitata', 'saltata']],
      ['activities', 'attivita', ['fatta', 'saltata']],
    ];
    for (const [key, kind, states] of kinds) {
      const marks = actuals[key];
      if (marks === undefined) {
        (tripMeta.actualsAbsent ??= [] as string[]);
        (tripMeta.actualsAbsent as string[]).push(key);
        continue;
      }
      if (!isObj(marks)) {
        ((tripMeta.raw ??= {}).actuals ??= {});
        ((tripMeta.raw as Obj).actuals as Obj)[key] = marks;
        continue;
      }
      for (const [id, m] of Object.entries(marks)) {
        if (!isObj(m) || typeof m.state !== 'string' || !states.includes(m.state)) {
          const bad = ((tripMeta.badMarks ??= {}) as Obj);
          ((bad[key] ??= {}) as Obj)[id] = m;
          enc.warnings.push(`Stato di visita ${id}: valore non previsto, conservato com'era`);
          continue;
        }
        add('visit_states', enc.entity(`Stato ${id}`, m, VISIT_FIELDS, { trip_id: tripId, target_kind: kind, target_id: id, state: m.state }, new Set(['state'])));
      }
    }
  }

  // Registro delle versioni applicate
  const log = t.planLog;
  if (log === undefined) (tripMeta.absent ??= []).push('planLog');
  else if (!Array.isArray(log) || !uniqueBy(log, (x) => x.id)) (tripMeta.raw ??= {}).planLog = log;
  else log.forEach((x, i) => {
    const lo = x as Obj;
    add('plan_log', enc.entity(`Registro ${String(lo.id)}`, lo, PLANLOG_FIELDS, { trip_id: tripId, id: lo.id, position: i }, new Set(['id'])));
  });

  enc.entity('Viaggio', t, TRIP_FIELDS, tripRow, TRIP_HANDLED, tripMeta);
  rows.trips!.push(tripRow);
  return { rows, warnings: enc.warnings };
}

// ---------- Righe → documento ----------

const byPos = (a: Row, b: Row) => Number(a.position ?? 0) - Number(b.position ?? 0);
const live = (list: Row[] | undefined) => (list ?? []).filter((r) => r.deleted_at === null || r.deleted_at === undefined);
const metaOf = (row: Row): Meta => {
  const x = isObj(row.extra) ? row.extra[META] : undefined;
  return (isObj(x) ? x : {}) as Meta;
};

export function fromRows(input: TripRows): Trip {
  const rows: Record<string, Row[]> = {};
  for (const n of TABLE_ORDER) rows[n] = live(input[n]);
  const tripRow = rows.trips![0];
  if (!tripRow) throw new RowsError('Manca la riga del viaggio');
  const tripId = tripRow.id as string;
  const { obj: trip, meta: tm } = decodeEntity(tripRow, TRIP_FIELDS, { id: tripId });
  const absent = new Set(tm.absent ?? []);
  const raw = tm.raw ?? {};
  const hasRaw = (k: string) => Object.prototype.hasOwnProperty.call(raw, k);

  // Impostazioni e cambi
  let settings: Obj | undefined = isObj(tripRow.settings) ? { ...tripRow.settings } : undefined;
  if (hasRaw('settings')) settings = undefined;
  const rates: Obj = {};
  for (const r of rows.trip_rates!) {
    if (r.currency === 'NOK' && metaOf(r).nok) {
      const { obj } = decodeEntity(r, NOK_FIELDS);
      delete (obj as Obj)[META];
      settings = { ...(settings ?? {}), ...obj };
    } else {
      rates[r.currency as string] = decodeEntity(r, RATE_FIELDS).obj;
    }
  }
  if (hasRaw('settings')) trip.settings = raw.settings;
  else if (settings) trip.settings = settings;
  if (hasRaw('rates')) trip.rates = raw.rates;
  else if (!absent.has('rates') || Object.keys(rates).length) {
    if (isObj(raw.ratesKeys)) Object.assign(rates, raw.ratesKeys);
    trip.rates = rates;
  }

  // Nazioni
  if (hasRaw('countries')) trip.countries = raw.countries;
  else if (!absent.has('countries') || rows.trip_countries!.length) {
    trip.countries = [...rows.trip_countries!].sort(byPos).map((r) => {
      const m = metaOf(r);
      const { obj } = decodeEntity(r, COUNTRY_FIELDS, { code: r.country_code });
      for (const k of ['noFuel', 'fuel']) delete (obj as Obj)[k];
      if (m.raw && Object.prototype.hasOwnProperty.call(m.raw, 'fuel')) obj.fuel = m.raw.fuel;
      else if (!m.noFuel) {
        const fuelRow: Row = { ...r, extra: isObj(m.fuel) ? m.fuel : {} };
        obj.fuel = decodeEntity(fuelRow, FUEL_FIELDS).obj;
      }
      return obj;
    });
  }

  // Piani per versione
  const inVersion = (table: string, v: string) => rows[table]!.filter((r) => r.version_id === v);
  const planOf = (v: string) => {
    const ideas = inVersion('stop_ideas', v);
    const stops = inVersion('stops', v).sort(byPos).map((r) => {
      const m = metaOf(r);
      const { obj } = decodeEntity(r, STOP_FIELDS, { id: r.id });
      if (m.raw && Object.prototype.hasOwnProperty.call(m.raw, 'ideas')) obj.ideas = m.raw.ideas;
      else if (!m.noIdeas) obj.ideas = ideas.filter((x) => x.stop_id === r.id).sort(byPos).map((x) => x.place_key);
      return obj;
    });
    const segs = inVersion('segments', v);
    const legs = inVersion('legs', v).sort(byPos).map((r) => {
      const m = metaOf(r);
      const { obj } = decodeEntity(r, LEG_FIELDS, { id: r.id });
      if (m.raw && Object.prototype.hasOwnProperty.call(m.raw, 'segments')) obj.segments = m.raw.segments;
      else if (!m.noSegments) obj.segments = segs.filter((x) => x.leg_id === r.id).sort(byPos).map((x) => decodeEntity(x, SEGMENT_FIELDS, { id: x.id }).obj);
      return obj;
    });
    const acts = inVersion('activities', v);
    const days: Obj = {};
    for (const r of inVersion('days', v)) {
      const m = metaOf(r);
      if (m.raw && Object.prototype.hasOwnProperty.call(m.raw, 'day')) {
        days[r.day_key as string] = m.raw.day;
        continue;
      }
      const { obj } = decodeEntity(r, DAY_FIELDS);
      if (m.raw && Object.prototype.hasOwnProperty.call(m.raw, 'activities')) obj.activities = m.raw.activities;
      else if (!m.noActivities) obj.activities = acts.filter((x) => x.day_key === r.day_key).sort(byPos).map((x) => decodeEntity(x, ACTIVITY_FIELDS, { id: x.id }).obj);
      days[r.day_key as string] = obj;
    }
    const budgetItems = inVersion('budget_items', v).sort(byPos).map((r) => decodeEntity(r, BUDGET_FIELDS, { id: r.id }).obj);
    const flights = inVersion('flights', v).sort(byPos).map((r) => decodeEntity(r, FLIGHT_FIELDS, { id: r.id }).obj);
    return { stops, legs, days, budgetItems, flights };
  };

  const activeId = trip.activeScenarioId as string;
  const versions = [...rows.trip_versions!].sort(byPos);
  trip.scenarios = versions.map((r) => {
    const m = metaOf(r);
    const { obj } = decodeEntity(r, VERSION_FIELDS, { id: r.id });
    for (const k of ['noPlan', 'plan', 'planFlights']) delete (obj as Obj)[k];
    if (m.raw && Object.prototype.hasOwnProperty.call(m.raw, 'plan')) obj.plan = m.raw.plan;
    if (r.id === activeId || m.noPlan || (m.raw && Object.prototype.hasOwnProperty.call(m.raw, 'plan'))) return obj;
    const p = planOf(r.id as string);
    const planRow: Row = { ...r, extra: isObj(m.plan) ? m.plan : {} };
    const { obj: plan } = decodeEntity(planRow, PLAN_FIELDS);
    plan.stops = p.stops;
    plan.legs = p.legs;
    plan.days = p.days;
    plan.budgetItems = p.budgetItems;
    if (m.raw && Object.prototype.hasOwnProperty.call(m.raw, 'planFlights')) plan.flights = m.raw.planFlights;
    else if (r.plan_has_flights) plan.flights = p.flights;
    obj.plan = plan;
    return obj;
  });
  // Metadati del codificatore della versione (absent/nulls) non devono comparire nell'oggetto
  for (const s of trip.scenarios as Obj[]) delete s[META];

  const active = planOf(activeId);
  if (!absent.has('stops')) trip.stops = active.stops;
  if (!absent.has('legs')) trip.legs = active.legs;
  if (!absent.has('days')) trip.days = active.days;
  if (!absent.has('budgetItems')) trip.budgetItems = active.budgetItems;
  if (!absent.has('flights')) trip.flights = active.flights;

  const shared = (key: string, table: string, fields: Field[]) => {
    if (hasRaw(key)) trip[key] = raw[key];
    else if (!absent.has(key)) trip[key] = [...rows[table]!].sort(byPos).map((r) => decodeEntity(r, fields, { id: r.id }).obj);
  };
  shared('accommodations', 'accommodations', ACCOMMODATION_FIELDS);
  shared('coastalOptions', 'coastal_options', COASTAL_FIELDS);

  if (hasRaw('favorites')) trip.favorites = raw.favorites;
  else if (!absent.has('favorites')) trip.favorites = [...rows.favorites!].sort(byPos).map((r) => r.place_key);

  if (hasRaw('diary')) trip.diary = raw.diary;
  else if (!absent.has('diary')) {
    const atts = rows.diary_attachments!;
    trip.diary = [...rows.diary_entries!].sort(byPos).map((r) => {
      const m = metaOf(r);
      const { obj } = decodeEntity(r, DIARY_FIELDS, { id: r.id });
      if (m.raw && Object.prototype.hasOwnProperty.call(m.raw, 'attachments')) obj.attachments = m.raw.attachments;
      else if (!m.noAttachments) obj.attachments = atts.filter((a) => a.entry_id === r.id).sort(byPos).map((a) => decodeEntity(a, ATTACHMENT_FIELDS, { id: a.id }).obj);
      return obj;
    });
  }

  if (hasRaw('actuals') && !isObj(raw.actuals)) trip.actuals = raw.actuals;
  else if (!absent.has('actuals')) {
    const actuals: Obj = { ...(isObj(tm.actualsExtra) ? tm.actualsExtra : {}) };
    const actualsAbsent = new Set((tm.actualsAbsent as string[] | undefined) ?? []);
    const bad = isObj(tm.badMarks) ? tm.badMarks : {};
    const rawActuals = isObj(raw.actuals) ? raw.actuals : {};
    for (const [key, kind] of [['stops', 'tappa'], ['activities', 'attivita']] as const) {
      if (actualsAbsent.has(key)) continue;
      if (Object.prototype.hasOwnProperty.call(rawActuals, key)) {
        actuals[key] = rawActuals[key];
        continue;
      }
      const marks: Obj = {};
      for (const r of rows.visit_states!.filter((x) => x.target_kind === kind)) {
        marks[r.target_id as string] = decodeEntity(r, VISIT_FIELDS, { state: r.state }).obj;
      }
      if (isObj(bad[key])) Object.assign(marks, bad[key]);
      actuals[key] = marks;
    }
    trip.actuals = actuals;
  }

  if (hasRaw('planLog')) trip.planLog = raw.planLog;
  else if (!absent.has('planLog')) trip.planLog = [...rows.plan_log!].sort(byPos).map((r) => decodeEntity(r, PLANLOG_FIELDS, { id: r.id }).obj);

  for (const k of ['actualsExtra', 'actualsAbsent', 'badMarks']) delete trip[k];
  delete trip[META];
  return trip as unknown as Trip;
}

// ---------- Confronto ----------

/** Elenchi facoltativi in cui «assente» e «vuoto» hanno lo stesso significato */
const EMPTY_EQUALS_ABSENT = new Set(['ideas', 'attachments', 'keptIssues', 'diary', 'planLog']);

/**
 * Forma canonica per il confronto: chiavi ordinate, valori undefined tolti (come in JSON), `lastMutationId` del
 * documento tolto (sostituito dai metadati di sincronizzazione). Con `loose` gli elenchi di EMPTY_EQUALS_ABSENT
 * vuoti valgono come assenti.
 */
export function canonical(v: unknown, opts: { loose?: boolean } = {}, depth = 0): unknown {
  if (Array.isArray(v)) return v.map((x) => (x === undefined ? null : canonical(x, opts, depth + 1)));
  if (!isObj(v)) return v;
  const out: Obj = {};
  for (const k of Object.keys(v).sort()) {
    const x = v[k];
    if (x === undefined) continue;
    if (depth === 0 && k === 'lastMutationId') continue;
    if (opts.loose && EMPTY_EQUALS_ABSENT.has(k) && Array.isArray(x) && x.length === 0) continue;
    out[k] = canonical(x, opts, depth + 1);
  }
  return out;
}

export const sameTrip = (a: unknown, b: unknown, opts: { loose?: boolean } = {}) =>
  JSON.stringify(canonical(a, opts)) === JSON.stringify(canonical(b, opts));

/** Prime differenze tra due documenti (percorso della chiave), per il registro del passaggio */
export function diffPaths(a: unknown, b: unknown, path = '', out: string[] = [], max = 20): string[] {
  if (out.length >= max) return out;
  const ca = canonical(a);
  const cb = canonical(b);
  if (JSON.stringify(ca) === JSON.stringify(cb)) return out;
  if (isObj(ca) && isObj(cb)) {
    for (const k of new Set([...Object.keys(ca), ...Object.keys(cb)])) diffPaths(ca[k], cb[k], path ? `${path}.${k}` : k, out, max);
  } else if (Array.isArray(ca) && Array.isArray(cb) && ca.length === cb.length) {
    ca.forEach((x, i) => diffPaths(x, cb[i], `${path}[${i}]`, out, max));
  } else out.push(path || '(radice)');
  return out;
}

// ---------- Chiavi e confronto delle righe ----------

export function rowKey(table: TableName, row: Row): string {
  return `${table}|${TABLE_KEYS[table].filter((k) => k !== 'trip_id' || table === 'trips').map((k) => String(row[k] ?? '')).join('|')}`;
}

/** Solo le colonne di dati (le colonne di sistema del cloud non contano nel confronto) */
export function dataOf(table: TableName, row: Row): Row {
  const out: Row = {};
  for (const c of DATA_COLUMNS[table]) out[c] = row[c] === undefined ? null : row[c];
  if (!isObj(out.extra)) out.extra = {};
  return out;
}

export const sameRow = (table: TableName, a: Row, b: Row) => JSON.stringify(canonical(dataOf(table, a))) === JSON.stringify(canonical(dataOf(table, b)));

/** Tutte le righe come mappa chiave → { tabella, riga } */
export function indexRows(rows: TripRows): Map<string, { table: TableName; row: Row }> {
  const m = new Map<string, { table: TableName; row: Row }>();
  for (const table of TABLE_ORDER) for (const row of rows[table] ?? []) m.set(rowKey(table, row), { table, row });
  return m;
}

export function countRows(rows: TripRows): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of TABLE_ORDER) {
    const n = live(rows[t]).length;
    if (n) out[t] = n;
  }
  return out;
}
