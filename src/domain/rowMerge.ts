// Sincronizzazione per riga, parte pura (architettura §7): differenze da inviare e unione a tre vie per riga
// tra la base (righe confermate dal cloud), questo dispositivo e il cloud.
// - riga cambiata da una sola parte → vince quella parte, senza domande;
// - uguale sui due lati → nessun conflitto;
// - cambiata in modo diverso sui due lati, o cancellata da una parte e modificata dall'altra → conflitto per riga;
// - ordine delle tappe di una versione: un elenco unico, una sola scelta «Ordine delle tappe»;
// - impostazioni del viaggio: per chiave; cambio e carburante aggiornati in automatico: vince il più recente;
// - diario: la stessa voce modificata in due modi si tiene doppia (regola di sempre);
// - se il percorso unito non torna (tratti incoerenti), i cambi di quella versione diventano un'unica scelta.

import { syncLegs } from './itinerary';
import type { MergeConflict, Side } from './merge';
import { canonical, dataOf, fromRows, rowKey, TABLE_KEYS, TABLE_ORDER, type Row, type TableName, type TripRows } from './rows';
import type { Trip } from './types';

export interface BaseRow {
  table: TableName;
  row: Row;
  rev: number;
}
/** Base: righe confermate dal cloud, per chiave */
export type BaseRows = Record<string, BaseRow>;

export interface Change {
  table: TableName;
  op: 'upsert' | 'delete';
  base_rev: number | null;
  row: Row;
}

type Entry = { table: TableName; row: Row };
type Index = Map<string, Entry>;

const enc = (v: unknown) => JSON.stringify(canonical(v));

export function indexOf(rows: TripRows): Index {
  const m: Index = new Map();
  for (const table of TABLE_ORDER) {
    for (const row of rows[table] ?? []) {
      if (row.deleted_at) continue;
      m.set(rowKey(table, row), { table, row: dataOf(table, row) });
    }
  }
  return m;
}

const sameData = (a: Entry | undefined, b: Entry | undefined) =>
  (a === undefined && b === undefined) || (a !== undefined && b !== undefined && enc(a.row) === enc(b.row));

/** Modifiche da inviare: righe nuove o cambiate rispetto alla base, cancellazioni (tombstone) di quelle sparite */
export function diffRows(local: TripRows, base: BaseRows): Change[] {
  const l = indexOf(local);
  const out: Change[] = [];
  for (const [k, e] of l) {
    const b = base[k];
    if (!b) out.push({ table: e.table, op: 'upsert', base_rev: null, row: e.row });
    else if (enc(b.row) !== enc(e.row)) out.push({ table: e.table, op: 'upsert', base_rev: b.rev, row: e.row });
  }
  for (const [k, b] of Object.entries(base)) {
    if (!l.has(k)) out.push({ table: b.table, op: 'delete', base_rev: b.rev, row: keyOnly(b.table, b.row) });
  }
  const order = (t: TableName) => TABLE_ORDER.indexOf(t);
  return out.sort((a, b) => order(a.table) - order(b.table));
}

function keyOnly(table: TableName, row: Row): Row {
  return Object.fromEntries(TABLE_KEYS[table].map((c) => [c, row[c]]));
}

/** Divide le modifiche in lotti (massimo 1000 righe e circa maxBytes di JSON), rispettando l'ordine genitori → figli */
export function batches(changes: Change[], maxRows = 1000, maxBytes = 900_000): Change[][] {
  const out: Change[][] = [];
  let cur: Change[] = [];
  let size = 0;
  for (const c of changes) {
    const s = JSON.stringify(c).length;
    if (cur.length && (cur.length >= maxRows || size + s > maxBytes)) {
      out.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(c);
    size += s;
  }
  if (cur.length) out.push(cur);
  return out;
}

// ---------- Unione a tre vie ----------

export interface RowConflict extends MergeConflict {
  /** Righe coinvolte: scelte insieme */
  keys: string[];
}

export interface RowMergeResult {
  /** Unione provvisoria: nei conflitti aperti contiene la versione di questo dispositivo */
  trip: Trip;
  conflicts: RowConflict[];
  merged: string[];
  /** Righe del cloud (nuova base) */
  remote: Index;
  /** Righe unite (provvisorie), per applicare le scelte */
  rows: Index;
  local: Index;
}

const TABLE_LABEL: Record<TableName, string> = {
  trips: 'Viaggio',
  trip_countries: 'Nazione',
  trip_rates: 'Cambio',
  trip_versions: 'Versione del percorso',
  stops: 'Tappa',
  stop_ideas: 'Idea',
  legs: 'Tratto',
  segments: 'Segmento',
  days: 'Giornata',
  activities: 'Attività',
  budget_items: 'Voce di budget',
  flights: 'Volo',
  accommodations: 'Alloggio',
  coastal_options: 'Opzione di crociera',
  favorites: 'Preferito',
  diary_entries: 'Voce del diario',
  diary_attachments: 'Allegato',
  visit_states: 'Stato di visita',
  plan_log: 'Registro',
};

const COLUMN_LABEL: Record<string, string> = {
  nights: 'notti', name: 'nome', notes: 'note', title: 'titolo', label: 'descrizione', amount: 'importo', status: 'stato',
  date: 'data', departure_time: 'partenza', arrival_time: 'arrivo', price_amount: 'prezzo', selected: 'scelto', text: 'testo',
  state: 'stato', start_date: 'data di partenza', plan_b: 'piano B', weather_plan_b: 'piano B meteo', duration_min: 'durata',
  cost_amount: 'costo', place_key: 'luogo', accommodation_id: 'alloggio', lat: 'latitudine', lng: 'longitudine', position: 'ordine',
};

function rowName(e: Entry): string {
  const r = e.row;
  const n = r.name ?? r.title ?? r.label ?? r.day_key ?? r.place_key ?? r.target_id ?? r.currency ?? r.country_code ?? r.id;
  return `${TABLE_LABEL[e.table]} ${String(n ?? '')}`.trim();
}

function describe(side: Entry | undefined, other: Entry | undefined): string {
  if (!side) return 'eliminata';
  if (!other) return 'presente';
  const diffs: string[] = [];
  for (const k of Object.keys(side.row)) {
    if (k === 'extra' || enc(side.row[k]) === enc(other.row[k])) continue;
    diffs.push(`${COLUMN_LABEL[k] ?? k.replace(/_/g, ' ')}: ${fmt(side.row[k])}`);
  }
  if (!diffs.length && enc(side.row.extra) !== enc(other.row.extra)) diffs.push('altri dettagli');
  return diffs.slice(0, 4).join(', ') || 'uguale';
}
const fmt = (v: unknown) => (v === null || v === undefined ? '—' : typeof v === 'string' ? (v.length > 40 ? `${v.slice(0, 40)}…` : v) : JSON.stringify(v));

/** Impostazioni aggiornate in automatico da ogni dispositivo: non sono una scelta dell'utente */
const AUTO_SETTINGS = new Set(['car']);

const stamp = (r: Row) => String(r.fetched_at ?? r.rate_date ?? '');

function mergeTripRow(b: Entry | undefined, l: Entry, r: Entry, conflicts: RowConflict[], key: string): Entry {
  const out: Row = { ...l.row };
  for (const col of Object.keys(r.row)) {
    if (col === 'settings') continue;
    const lv = enc(l.row[col]);
    const rv = enc(r.row[col]);
    if (lv === rv) continue;
    const bv = b ? enc(b.row[col]) : undefined;
    if (bv === lv) out[col] = r.row[col];
    else if (bv !== rv) conflicts.push({ id: `viaggio:${col}`, label: `Viaggio: ${COLUMN_LABEL[col] ?? col.replace(/_/g, ' ')}`, qui: fmt(l.row[col]), cloud: fmt(r.row[col]), keys: [key] });
  }
  const ls = (l.row.settings ?? {}) as Row;
  const rs = (r.row.settings ?? {}) as Row;
  const bs = ((b?.row.settings ?? undefined) as Row | undefined) ?? undefined;
  const settings: Row = { ...ls };
  for (const k of new Set([...Object.keys(ls), ...Object.keys(rs)])) {
    if (enc(ls[k]) === enc(rs[k])) continue;
    if (AUTO_SETTINGS.has(k) || (bs && enc(bs[k]) === enc(ls[k]))) {
      if (rs[k] === undefined) delete settings[k];
      else settings[k] = rs[k];
    } else if (!(bs && enc(bs[k]) === enc(rs[k]))) {
      conflicts.push({ id: `impostazione:${k}`, label: `Impostazione «${k}»`, qui: fmt(ls[k]), cloud: fmt(rs[k]), keys: [key] });
    }
  }
  out.settings = settings;
  return { table: 'trips', row: out };
}

/**
 * Unione a tre vie per riga. `base` = righe note prima, `local` = questo dispositivo, `remote` = cloud adesso.
 * Restituisce il viaggio unito (nei conflitti: la versione di qui) e i conflitti da scegliere.
 */
export function mergeRows(base: BaseRows, localRows: TripRows, remote: Index): RowMergeResult {
  const local = indexOf(localRows);
  const b = new Map(Object.entries(base).map(([k, v]) => [k, { table: v.table, row: v.row } as Entry]));
  const rows: Index = new Map();
  const conflicts: RowConflict[] = [];
  const mergedTables = new Set<string>();
  const diaryCopies: Entry[] = [];
  const keys = new Set([...b.keys(), ...local.keys(), ...remote.keys()]);

  // Ordine delle tappe: le posizioni si confrontano come elenco per versione
  const order = (ix: Map<string, Entry>, v: string) =>
    [...ix.values()].filter((e) => e.table === 'stops' && e.row.version_id === v).sort((x, y) => Number(x.row.position) - Number(y.row.position)).map((e) => String(e.row.id));
  const versions = new Set([...keys].map((k) => (b.get(k) ?? local.get(k) ?? remote.get(k))!).filter((e) => e.table === 'stops').map((e) => String(e.row.version_id)));
  const stopOrder = new Map<string, { side: 'qui' | 'cloud' | 'conflitto'; qui: string[]; cloud: string[] }>();
  for (const v of versions) {
    const bo = order(b, v).join('|');
    const lo = order(local, v);
    const ro = order(remote, v);
    const lj = lo.join('|');
    const rj = ro.join('|');
    if (lj === rj || bo === rj) stopOrder.set(v, { side: 'qui', qui: lo, cloud: ro });
    else if (bo === lj) stopOrder.set(v, { side: 'cloud', qui: lo, cloud: ro });
    else stopOrder.set(v, { side: 'conflitto', qui: lo, cloud: ro });
  }
  const noPos = (e: Entry | undefined): Entry | undefined => (e && e.table === 'stops' ? { table: e.table, row: { ...e.row, position: 0 } } : e);

  for (const k of keys) {
    const be = b.get(k);
    const le = local.get(k);
    const re = remote.get(k);
    const [bn, ln, rn] = [noPos(be), noPos(le), noPos(re)];
    let take: Entry | undefined;
    if (sameData(ln, rn)) take = le ?? re;
    else if (sameData(ln, bn)) {
      take = re;
      mergedTables.add(TABLE_LABEL[(re ?? be ?? le)!.table]);
    } else if (sameData(rn, bn)) take = le;
    else {
      const e = (le ?? re)!;
      if (le && re && e.table === 'trips') take = mergeTripRow(be, le, re, conflicts, k);
      else if (le && re && e.table === 'trip_rates') take = stamp(re.row) > stamp(le.row) ? re : le;
      else if (le && re && e.table === 'diary_entries') {
        // Stessa voce modificata in due modi: si tengono entrambe, nessun testo va perso
        take = le;
        diaryCopies.push({ table: 'diary_entries', row: { ...re.row, id: `${String(re.row.id)}-cloud`, text: `${String(re.row.text ?? '')}\n(versione dell'altro dispositivo)` } });
        mergedTables.add(TABLE_LABEL.diary_entries);
      } else {
        take = le;
        conflicts.push({ id: `riga:${k}`, label: rowName(e), qui: describe(le, re), cloud: describe(re, le), keys: [k] });
      }
    }
    if (take) {
      // La posizione delle tappe segue l'ordine scelto per la versione
      rows.set(k, take);
    }
  }
  for (const c of diaryCopies) rows.set(rowKey('diary_entries', c.row), c);

  // Posizioni delle tappe
  for (const [v, o] of stopOrder) {
    const list = o.side === 'cloud' ? o.cloud : o.qui;
    applyOrder(rows, v, list);
    if (o.side === 'conflitto') {
      conflicts.push({
        id: `ordine:${v}`,
        label: 'Ordine delle tappe',
        qui: names(local, v, o.qui),
        cloud: names(remote, v, o.cloud),
        keys: [...rows.keys()].filter((k) => rows.get(k)!.table === 'stops' && rows.get(k)!.row.version_id === v),
      });
    } else if (o.side === 'cloud') mergedTables.add('Ordine delle tappe');
  }

  let trip = build(rows);
  // Coerenza del percorso: se le tappe e i tratti uniti non tornano, la versione diventa una scelta unica
  if (!coherent(trip)) {
    const v = String(firstTrip(rows)?.row.active_version_id ?? '');
    const planTables = new Set<TableName>(['stops', 'stop_ideas', 'legs', 'segments', 'days', 'activities', 'budget_items', 'flights']);
    const inPlan = (e: Entry) => planTables.has(e.table) && e.row.version_id === v;
    const groupKeys = [...new Set([...local.keys(), ...remote.keys()])].filter((k) => inPlan((local.get(k) ?? remote.get(k))!));
    for (const k of groupKeys) {
      const le = local.get(k);
      if (le) rows.set(k, le);
      else rows.delete(k);
    }
    for (let i = conflicts.length - 1; i >= 0; i--) if (conflicts[i]!.keys.some((k) => groupKeys.includes(k))) conflicts.splice(i, 1);
    conflicts.push({ id: `percorso:${v}`, label: 'Percorso, date e scenari', qui: summarize(local, v), cloud: summarize(remote, v), keys: groupKeys });
    trip = build(rows);
  }
  return { trip, conflicts, merged: [...mergedTables], remote, rows, local };
}

function firstTrip(ix: Index): Entry | undefined {
  for (const e of ix.values()) if (e.table === 'trips') return e;
  return undefined;
}

function applyOrder(rows: Index, v: string, list: string[]): void {
  const pos = new Map(list.map((id, i) => [id, i]));
  let next = list.length;
  const stops = [...rows.entries()].filter(([, e]) => e.table === 'stops' && e.row.version_id === v).sort((a, b) => Number(a[1].row.position) - Number(b[1].row.position));
  for (const [k, e] of stops) {
    const p = pos.get(String(e.row.id)) ?? next++;
    rows.set(k, { table: e.table, row: { ...e.row, position: p } });
  }
}

function names(ix: Index, v: string, ids: string[]): string {
  const byId = new Map([...ix.values()].filter((e) => e.table === 'stops' && e.row.version_id === v).map((e) => [String(e.row.id), String(e.row.name)]));
  return ids.map((id) => byId.get(id) ?? id).join(' → ') || 'nessuna tappa';
}

function summarize(ix: Index, v: string): string {
  const stops = [...ix.values()].filter((e) => e.table === 'stops' && e.row.version_id === v).sort((a, b) => Number(a.row.position) - Number(b.row.position));
  const nights = stops.reduce((a, e) => a + Math.max(0, Number(e.row.nights ?? 0)), 0);
  return `${stops.length} tappe, ${nights} notti: ${stops.map((e) => e.row.name).join(' → ') || 'percorso vuoto'}.`;
}

function toTripRows(ix: Index): TripRows {
  const out: TripRows = Object.fromEntries(TABLE_ORDER.map((t) => [t, [] as Row[]]));
  for (const e of ix.values()) out[e.table]!.push(e.row);
  return out;
}

function build(ix: Index): Trip {
  return fromRows(toTripRows(ix));
}

function coherent(t: Trip): boolean {
  try {
    const legs = syncLegs(t.stops, t.legs);
    return JSON.stringify(legs.map((l) => [l.fromStopId, l.toStopId])) === JSON.stringify(t.legs.map((l) => [l.fromStopId, l.toStopId]));
  } catch {
    return false;
  }
}

/** Applica le scelte: ciò che non è indicato resta la versione di questo dispositivo */
export function resolveRowConflicts(m: RowMergeResult, choices: Record<string, Side>): { trip: Trip; rows: Index } {
  const rows: Index = new Map(m.rows);
  for (const c of m.conflicts) {
    if (choices[c.id] !== 'cloud') continue;
    if (c.id.startsWith('viaggio:') || c.id.startsWith('impostazione:')) {
      const key = c.keys[0]!;
      const cur = rows.get(key)!;
      const re = m.remote.get(key)!;
      if (c.id.startsWith('viaggio:')) {
        const col = c.id.slice('viaggio:'.length);
        rows.set(key, { table: cur.table, row: { ...cur.row, [col]: re.row[col] } });
      } else {
        const k = c.id.slice('impostazione:'.length);
        const s = { ...((cur.row.settings ?? {}) as Row) };
        const rv = ((re.row.settings ?? {}) as Row)[k];
        if (rv === undefined) delete s[k];
        else s[k] = rv;
        rows.set(key, { table: cur.table, row: { ...cur.row, settings: s } });
      }
      continue;
    }
    if (c.id.startsWith('ordine:')) {
      const v = c.id.slice('ordine:'.length);
      const list = [...m.remote.values()].filter((e) => e.table === 'stops' && e.row.version_id === v).sort((a, b) => Number(a.row.position) - Number(b.row.position)).map((e) => String(e.row.id));
      applyOrder(rows, v, list);
      continue;
    }
    for (const k of c.keys) {
      const re = m.remote.get(k);
      if (re) rows.set(k, re);
      else rows.delete(k);
    }
  }
  return { trip: build(rows), rows };
}

export { toTripRows };
