// Server simulato con le regole di public.sync_push / public.sync_pull (supabase/migrations/20261106000400_sincronizzazione.sql):
// lotto tutto-o-niente, rev per riga, seq per viaggio, registro degli invii, tentativi precedenti, tombstone.
import type { Change } from '../src/domain/rowMerge';
import { TABLE_KEYS, TABLE_ORDER, type Row, type TableName } from '../src/domain/rows';
import type { PullResponse, PushResponse, RowTransport } from '../src/services/storage/rowSync';

const SYSTEM = ['rev', 'seq', 'created_at', 'updated_at', 'updated_by', 'owner_id', 'data', 'last_mutation_id', 'device_id'];

export class FakeSyncServer {
  rows = new Map<string, { table: TableName; row: Row }>();
  seq = new Map<string, number>();
  mutations = new Map<string, PushResponse>();
  pushes = 0;
  /** Il prossimo invio viene applicato ma la risposta si perde */
  loseNextResponse = false;
  offline = false;

  private key(table: TableName, row: Row) {
    return `${table}|${TABLE_KEYS[table].map((k) => String(row[k])).join('|')}`;
  }
  private nextSeq(trip: string) {
    const n = (this.seq.get(trip) ?? 0) + 1;
    this.seq.set(trip, n);
    return n;
  }

  push(tripId: string, mutationId: string, changes: Change[], attempted: string[], deviceId: string): PushResponse {
    if (this.offline) throw new Error('Server cloud non raggiungibile');
    this.pushes++;
    const prev = this.mutations.get(`${tripId}|${mutationId}`);
    if (prev) return { ...prev, stato: 'gia_applicato' };
    const sorted = [...changes].sort((a, b) => TABLE_ORDER.indexOf(a.table) - TABLE_ORDER.indexOf(b.table));
    const conflitti: NonNullable<PushResponse['conflitti']> = [];
    const prepared = sorted.map((c) => {
      const row: Row = { ...c.row, ...(c.table === 'trips' ? { id: tripId } : { trip_id: tripId }) };
      for (const s of SYSTEM) delete row[s];
      const k = this.key(c.table, row);
      const cur = this.rows.get(k);
      const key = Object.fromEntries(TABLE_KEYS[c.table].map((x) => [x, row[x]]));
      if (!cur) {
        if (c.base_rev !== null && c.base_rev !== undefined) conflitti.push({ table: c.table, key, tipo: 'assente', server: null });
      } else if (c.base_rev !== cur.row.rev && !(cur.row.last_mutation_id && attempted.includes(String(cur.row.last_mutation_id)))) {
        conflitti.push({ table: c.table, key, tipo: 'cambiata', server: { ...cur.row } });
      }
      return { c, row, k, key, cur };
    });
    if (conflitti.length) return { stato: 'conflitto', conflitti, seq: this.seq.get(tripId) ?? 0 };
    const righe: NonNullable<PushResponse['righe']> = [];
    for (const { c, row, k, key, cur } of prepared) {
      if (c.op === 'delete') {
        if (!cur) continue;
        cur.row = { ...cur.row, deleted_at: '2027-01-01T00:00:00Z', rev: Number(cur.row.rev) + 1, seq: this.nextSeq(tripId), last_mutation_id: mutationId, device_id: deviceId };
        righe.push({ table: c.table, key, rev: Number(cur.row.rev) });
        continue;
      }
      let rev = cur ? Number(cur.row.rev) + 1 : 1;
      let seq: number | undefined;
      const merged = { ...(cur?.row ?? {}), ...row };
      if (c.table === 'trips') {
        // Come private.sync_stamp_trip: il timbro vale solo per i viaggi a righe
        if (!cur) Object.assign(merged, { storage_format: 'righe', data: { schemaVersion: 3, formato: 'righe' } });
        if (merged.storage_format !== 'righe') {
          rev = Number(cur?.row.rev ?? 1);
          seq = Number(cur?.row.seq ?? 0);
        } else if (cur && cur.row.storage_format !== 'righe') rev = Number(cur.row.rev ?? 1);
      }
      const next = { ...merged, deleted_at: null, rev, seq: seq ?? this.nextSeq(tripId), last_mutation_id: mutationId, device_id: deviceId };
      this.rows.set(k, { table: c.table, row: next });
      righe.push({ table: c.table, key, rev });
    }
    const result: PushResponse = { stato: 'applicato', righe, seq: this.seq.get(tripId) ?? 0 };
    this.mutations.set(`${tripId}|${mutationId}`, result);
    if (this.loseNextResponse) {
      this.loseNextResponse = false;
      throw new Error('Risposta persa');
    }
    return result;
  }

  pull(tripId: string, since: number): PullResponse {
    if (this.offline) throw new Error('Server cloud non raggiungibile');
    const righe: PullResponse['righe'] = {};
    for (const { table, row } of this.rows.values()) {
      const t = table === 'trips' ? row.id : row.trip_id;
      if (t !== tripId || Number(row.seq) <= since) continue;
      (righe[table] ??= []).push(JSON.parse(JSON.stringify(row)));
    }
    return { seq: this.seq.get(tripId) ?? 0, righe };
  }

  /** Modifica fatta da un altro dispositivo direttamente sul server */
  edit(table: TableName, match: (r: Row) => boolean, patch: Partial<Row> | null, tripId: string): void {
    for (const e of this.rows.values()) {
      if (e.table !== table || !match(e.row)) continue;
      e.row = patch === null
        ? { ...e.row, deleted_at: '2027-01-01T00:00:00Z', rev: Number(e.row.rev) + 1, seq: this.nextSeq(tripId), last_mutation_id: 'altro' }
        : { ...e.row, ...patch, rev: Number(e.row.rev) + 1, seq: this.nextSeq(tripId), last_mutation_id: 'altro' };
    }
  }

  /** Viaggio salvato dall'app di oggi: documento in data, nessuna riga */
  addDocumentTrip(id: string, data: unknown): void {
    this.rows.set(`trips|${id}`, { table: 'trips', row: { id, data, storage_format: 'documento', rev: 1, seq: 0 } });
  }

  /** L'app vecchia salva il documento */
  saveDocument(id: string, data: unknown): void {
    const e = this.rows.get(`trips|${id}`)!;
    if (e.row.storage_format === 'righe') throw new Error('Questo viaggio usa il nuovo formato');
    e.row = { ...e.row, data };
  }

  imports: Record<string, unknown>[] = [];

  importTransport(): import('../src/services/storage/importRows').ImportTransport {
    return {
      ...this.transport(),
      readTrip: async (id) => {
        const e = this.rows.get(`trips|${id}`);
        return e ? JSON.parse(JSON.stringify(e.row)) : undefined;
      },
      recordImport: async (row) => {
        this.imports.push(row);
      },
    };
  }

  count(table: TableName): number {
    return [...this.rows.values()].filter((e) => e.table === table && !e.row.deleted_at).length;
  }

  transport(): RowTransport {
    return {
      push: async (t, m, c, a, d) => this.push(t, m, JSON.parse(JSON.stringify(c)), a, d),
      pull: async (t, s) => this.pull(t, s),
    };
  }
}

export function memoryKv() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    get length() {
      return m.size;
    },
    key: (i: number) => [...m.keys()][i] ?? null,
  };
}
