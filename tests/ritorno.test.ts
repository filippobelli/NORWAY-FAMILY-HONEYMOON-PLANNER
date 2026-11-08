import assert from 'node:assert/strict';
import { test } from 'node:test';
import { documentFromExport, maxSeq, rollbackSql, type Export } from '../scripts/ritorno-documento';
import { diffPaths, type Row, type TripRows } from '../src/domain/rows';
import type { Trip } from '../src/domain/types';
import { memoryStore } from '../src/services/storage/dataStore';
import { importTrip, prepareDocument } from '../src/services/storage/importRows';
import { pushRows } from '../src/services/storage/rowSync';
import { enqueue } from '../src/services/storage/syncEngine';
import { FakeSyncServer, memoryKv } from './fakeSync';
import { fullTrip } from './fixtures';

/** Come la query di supabase/rollback/20261108_ritorno_documento_esporta.sql: tutte le righe, tombstone compresi */
function exportOf(srv: FakeSyncServer, tripId: string): Export {
  const righe: TripRows = {};
  for (const { table, row } of srv.rows.values()) {
    const t = table === 'trips' ? row.id : row.trip_id;
    if (t !== tripId) continue;
    const r: Row = { ...row };
    if (table === 'trips') delete r.data;
    (righe[table] ??= []).push(JSON.parse(JSON.stringify(r)));
  }
  return { trip_id: tripId, storage_format: String(srv.rows.get(`trips|${tripId}`)!.row.storage_format), righe };
}

test('Ritorno al documento: dalle righe (anche dopo modifiche e cancellazioni) il documento torna completo', async () => {
  const srv = new FakeSyncServer();
  const t = fullTrip();
  const data = JSON.parse(JSON.stringify(t));
  delete data.countries;
  srv.addDocumentTrip(t.id, data);
  const store = memoryStore();
  const r = await importTrip(srv.importTransport(), store, t.id, { deviceId: 'd' });
  assert.equal(r.kind, 'fatto');
  if (r.kind !== 'fatto') return;
  // Modifiche fatte dopo il passaggio: una tappa in più, un preferito tolto (tombstone)
  const kv = memoryKv();
  const edited: Trip = { ...r.trip, title: 'Dopo il passaggio', favorites: ['oslo'], stops: [...r.trip.stops, { ...r.trip.stops[0]!, id: 'nuova', name: 'Ålesund' }] };
  enqueue(kv, t.id);
  assert.equal((await pushRows(kv, store, srv.transport(), edited, 'd')).kind, 'salvato');
  const e = exportOf(srv, t.id);
  const doc = documentFromExport(e);
  assert.deepEqual(diffPaths(doc, edited), [], 'documento = viaggio con le modifiche fatte dopo il passaggio');
  assert.equal((doc as { lastMutationId?: string }).lastMutationId, undefined);
  assert.deepEqual(doc.favorites, ['oslo'], 'le righe cancellate non tornano');
  assert.ok(prepareDocument(JSON.parse(JSON.stringify(doc))), 'l\'app di oggi lo legge (normalizeTrip)');
  const sql = rollbackSql(e, doc);
  assert.match(sql, /set local nfhp\.permetti_documento = 'on';/);
  assert.match(sql, /storage_format = 'documento'/);
  assert.match(sql, new RegExp(`seq diverso da ${maxSeq(e)}`));
  assert.match(sql, /^begin;$/m);
  assert.match(sql, /^commit;$/m);
});

test('Ritorno al documento: rifiuta un viaggio non a righe; testo con il delimitatore protetto', () => {
  assert.throws(() => documentFromExport({ trip_id: 'x', storage_format: 'documento', righe: {} }), /solo ai viaggi «righe»/);
  const doc = { ...fullTrip(), title: 'Nota con $doc$ dentro' };
  const sql = rollbackSql({ trip_id: doc.id, storage_format: 'righe', righe: {} }, doc);
  assert.ok(sql.includes('$doc0$'), 'delimitatore diverso se il testo contiene $doc$');
  assert.throws(() => rollbackSql({ trip_id: "x'; drop table trips; --", storage_format: 'righe', righe: {} }, doc), /Id del viaggio non valido/);
});
