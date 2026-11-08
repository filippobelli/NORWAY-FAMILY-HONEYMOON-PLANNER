import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyTrip } from '../src/domain/defaults';
import { syncLegs } from '../src/domain/itinerary';
import { batches, diffRows } from '../src/domain/rowMerge';
import { diffPaths } from '../src/domain/rows';
import type { Stop, Trip } from '../src/domain/types';
import { memoryStore } from '../src/services/storage/dataStore';
import { adoptResolution, loadBase, loadTripFromRows, pullRows, pushRows, rowsOf } from '../src/services/storage/rowSync';
import { enqueue, getPending } from '../src/services/storage/syncEngine';
import { FakeSyncServer, memoryKv } from './fakeSync';

const stop = (id: string, name: string, nights: number): Stop => ({ id, kind: 'luogo', name, lat: 60, lng: 7, nights, notes: '', weatherPlanB: '' });
function trip(): Trip {
  const stops = [stop('a', 'Oslo', 2), stop('b', 'Bergen', 2), stop('c', 'Flåm', 1)];
  return {
    ...createEmptyTrip(),
    id: '00000000-0000-4000-8000-000000000001',
    startDate: '2027-08-01',
    stops,
    legs: syncLegs(stops, []),
    countries: [{ code: 'NO', releaseId: 'NO-1' }],
    diary: [{ id: 'd1', createdAt: '2027-08-01T20:00:00Z', updatedAt: '2027-08-01T20:00:00Z', localDate: '2027-08-01', localTime: '22:00', tzOffsetMin: -120, text: 'Primo giorno' }],
    updatedAt: '2026-11-06T10:00:00.000Z',
  };
}

/** Un dispositivo: archivio della base, segno delle modifiche, documento */
function device(srv: FakeSyncServer, t: Trip) {
  const d = { kv: memoryKv(), store: memoryStore(), trip: t, tx: srv.transport() };
  return {
    ...d,
    edit(fn: (t: Trip) => Trip) {
      d.trip = fn(d.trip);
      enqueue(d.kv, d.trip.id);
    },
    get trip() {
      return d.trip;
    },
    set trip(v: Trip) {
      d.trip = v;
    },
  };
}

async function setup() {
  const srv = new FakeSyncServer();
  const a = device(srv, trip());
  enqueue(a.kv, a.trip.id);
  const r = await pushRows(a.kv, a.store, a.tx, a.trip, 'dispositivo-a');
  assert.equal(r.kind, 'salvato');
  const b = device(srv, await loadTripFromRows(memoryStore(), srv.transport(), a.trip.id));
  // b ha una base sua
  b.trip = await loadTripFromRows(b.store, b.tx, a.trip.id);
  return { srv, a, b };
}

test('Righe: primo invio, nessun invio se non cambia nulla, secondo dispositivo ritrova il viaggio identico', async () => {
  const { srv, a, b } = await setup();
  assert.equal(srv.count('stops'), 3);
  assert.equal(srv.count('trips'), 1);
  assert.equal(getPending(a.kv, a.trip.id), undefined, 'coda vuota dopo la conferma');
  const pushes = srv.pushes;
  enqueue(a.kv, a.trip.id);
  assert.equal((await pushRows(a.kv, a.store, a.tx, a.trip, 'a')).kind, 'salvato');
  assert.equal(srv.pushes, pushes, 'niente da inviare: nessuna richiesta');
  assert.deepEqual(diffPaths(b.trip, a.trip), []);
});

test('Righe: risposta persa e reinvio → una sola riga, nessun conflitto (anche con una modifica nel frattempo)', async () => {
  const { srv, a } = await setup();
  a.edit((t) => ({ ...t, stops: [...t.stops, stop('d', 'Ålesund', 1)] }));
  srv.loseNextResponse = true;
  await assert.rejects(() => pushRows(a.kv, a.store, a.tx, a.trip, 'a'), /persa/);
  assert.equal(srv.count('stops'), 4, 'il server aveva applicato');
  assert.ok(getPending(a.kv, a.trip.id), 'la modifica resta in coda');
  const r = await pushRows(a.kv, a.store, a.tx, a.trip, 'a');
  assert.equal(r.kind, 'salvato');
  assert.equal(r.kind === 'salvato' && r.ownEarlierWrite, true, 'riconosciuto come già applicato');
  assert.equal(srv.count('stops'), 4, 'nessun doppione');
  // Risposta persa e poi un'altra modifica prima del reinvio
  a.edit((t) => ({ ...t, title: 'Uno' }));
  srv.loseNextResponse = true;
  await assert.rejects(() => pushRows(a.kv, a.store, a.tx, a.trip, 'a'));
  a.edit((t) => ({ ...t, title: 'Due', stops: t.stops.map((s) => (s.id === 'd' ? { ...s, nights: 3 } : s)) }));
  assert.equal((await pushRows(a.kv, a.store, a.tx, a.trip, 'a')).kind, 'salvato', 'la propria scrittura precedente non è un conflitto');
  assert.equal(srv.count('stops'), 4);
  assert.equal([...srv.rows.values()].find((e) => e.table === 'trips')!.row.title, 'Due');
  assert.deepEqual(diffRows(rowsOf(a.trip), (await loadBase(a.store, a.trip.id)).rows), [], 'base allineata');
});

test('Righe: modifiche indipendenti su due dispositivi si uniscono da sole', async () => {
  const { srv, a, b } = await setup();
  a.edit((t) => ({ ...t, stops: t.stops.map((s) => (s.id === 'a' ? { ...s, notes: 'museo' } : s)) }));
  await pushRows(a.kv, a.store, a.tx, a.trip, 'a');
  b.edit((t) => ({ ...t, title: 'Titolo da B' }));
  // Righe diverse: il server accetta senza conflitto
  assert.equal((await pushRows(b.kv, b.store, b.tx, b.trip, 'b')).kind, 'salvato');
  const pb = await pullRows(b.store, b.tx, b.trip);
  assert.equal(pb.kind, 'aggiornato');
  if (pb.kind !== 'aggiornato') return;
  assert.equal(pb.trip.title, 'Titolo da B');
  assert.equal(pb.trip.stops.find((s) => s.id === 'a')!.notes, 'museo');
  assert.equal(pb.local, false, 'nulla da rinviare');
  const p = await pullRows(a.store, a.tx, a.trip);
  assert.equal(p.kind, 'aggiornato');
  assert.equal(p.kind === 'aggiornato' && p.trip.title, 'Titolo da B');
  assert.equal(srv.count('stops'), 3);
});

test('Righe: stessa tappa cambiata in modo diverso → conflitto per riga, nulla sovrascritto finché non si sceglie', async () => {
  const { srv, a, b } = await setup();
  a.edit((t) => ({ ...t, stops: t.stops.map((s) => (s.id === 'c' ? { ...s, nights: 2 } : s)) }));
  await pushRows(a.kv, a.store, a.tx, a.trip, 'a');
  b.edit((t) => ({ ...t, stops: t.stops.map((s) => (s.id === 'c' ? { ...s, nights: 3 } : s)) }));
  const r = await pushRows(b.kv, b.store, b.tx, b.trip, 'b');
  assert.equal(r.kind, 'conflitto');
  if (r.kind !== 'conflitto') return;
  assert.equal(r.merge.conflicts.length, 1);
  const c = r.merge.conflicts[0]!;
  assert.equal(c.label, 'Tappa Flåm');
  assert.match(c.qui, /notti: 3/);
  assert.match(c.cloud, /notti: 2/);
  const cloudStop = [...srv.rows.values()].find((e) => e.table === 'stops' && e.row.id === 'c')!;
  assert.equal(cloudStop.row.nights, 2, 'cloud non sovrascritto');
  // Scelta «cloud»
  b.trip = await adoptResolution(b.store, r.merge, r.remote, { [c.id]: 'cloud' }, b.trip.id);
  assert.equal(b.trip.stops.find((s) => s.id === 'c')!.nights, 2);
  enqueue(b.kv, b.trip.id);
  assert.equal((await pushRows(b.kv, b.store, b.tx, b.trip, 'b')).kind, 'salvato');
});

test('Righe: cancellata da una parte e modificata dall\'altra → conflitto, nessuna eliminazione silenziosa', async () => {
  const { srv, a, b } = await setup();
  a.edit((t) => ({ ...t, diary: [] }));
  await pushRows(a.kv, a.store, a.tx, a.trip, 'a');
  assert.equal(srv.count('diary_entries'), 0, 'tombstone sul server');
  b.edit((t) => ({ ...t, diary: t.diary!.map((d) => ({ ...d, text: 'modificata' })) }));
  const r = await pushRows(b.kv, b.store, b.tx, b.trip, 'b');
  assert.equal(r.kind, 'conflitto');
  if (r.kind !== 'conflitto') return;
  assert.ok(r.merge.conflicts.some((c) => /eliminata/.test(c.cloud)));
  const kept = await adoptResolution(b.store, r.merge, r.remote, {}, b.trip.id);
  assert.equal(kept.diary!.length, 1, 'senza scelta resta la versione di qui');
});

test('Righe: ordine delle tappe cambiato sui due lati → una scelta unica', async () => {
  const { a, b } = await setup();
  const reorder = (ids: string[]) => (t: Trip) => {
    const stops = ids.map((id) => t.stops.find((s) => s.id === id)!);
    return { ...t, stops, legs: syncLegs(stops, t.legs) };
  };
  a.edit(reorder(['b', 'a', 'c']));
  await pushRows(a.kv, a.store, a.tx, a.trip, 'a');
  b.edit(reorder(['a', 'c', 'b']));
  const r = await pushRows(b.kv, b.store, b.tx, b.trip, 'b');
  assert.equal(r.kind, 'conflitto');
  if (r.kind !== 'conflitto') return;
  const labels = r.merge.conflicts.map((c) => c.label);
  assert.equal(labels.filter((l) => l === 'Ordine delle tappe' || l === 'Percorso, date e scenari').length, 1, labels.join(' | '));
  const chosen = await adoptResolution(b.store, r.merge, r.remote, Object.fromEntries(r.merge.conflicts.map((c) => [c.id, 'cloud'])), b.trip.id);
  assert.deepEqual(chosen.stops.map((s) => s.id), ['b', 'a', 'c']);
});

test('Righe: diario modificato in due modi → si tengono entrambe le versioni', async () => {
  const { a, b } = await setup();
  a.edit((t) => ({ ...t, diary: t.diary!.map((d) => ({ ...d, text: 'versione A' })) }));
  await pushRows(a.kv, a.store, a.tx, a.trip, 'a');
  b.edit((t) => ({ ...t, diary: t.diary!.map((d) => ({ ...d, text: 'versione B' })) }));
  const r = await pushRows(b.kv, b.store, b.tx, b.trip, 'b');
  assert.equal(r.kind, 'unito');
  if (r.kind !== 'unito') return;
  const texts = r.trip.diary!.map((d) => d.text).sort();
  assert.deepEqual(texts, ['versione A\n(versione dell\'altro dispositivo)', 'versione B']);
});

test('Righe: un lotto con un conflitto non scrive nulla; lotti divisi per numero di righe', async () => {
  const srv = new FakeSyncServer();
  const { a } = await (async () => {
    const x = device(srv, trip());
    enqueue(x.kv, x.trip.id);
    await pushRows(x.kv, x.store, x.tx, x.trip, 'x');
    return { a: x };
  })();
  srv.edit('stops', (r) => r.id === 'a', { nights: 9 }, a.trip.id);
  const before = JSON.stringify([...srv.rows.values()]);
  const res = srv.push(a.trip.id, '00000000-0000-4000-8000-0000000000ff', [
    { table: 'trips', op: 'upsert', base_rev: 1, row: { id: a.trip.id, title: 'X' } },
    { table: 'stops', op: 'upsert', base_rev: 1, row: { trip_id: a.trip.id, version_id: a.trip.activeScenarioId, id: 'a', nights: 1 } },
  ], [], 'x');
  assert.equal(res.stato, 'conflitto');
  assert.equal(JSON.stringify([...srv.rows.values()]), before, 'tutto o niente');
  const many = Array.from({ length: 2500 }, (_, i) => ({ table: 'favorites' as const, op: 'upsert' as const, base_rev: null, row: { place_key: `p${i}` } }));
  assert.deepEqual(batches(many).map((b) => b.length), [1000, 1000, 500]);
});

test('Righe: senza rete l\'invio fallisce e la modifica resta in coda; al ritorno arriva una volta', async () => {
  const { srv, a } = await setup();
  a.edit((t) => ({ ...t, stops: [...t.stops, stop('z', 'Tromsø', 2)] }));
  srv.offline = true;
  await assert.rejects(() => pushRows(a.kv, a.store, a.tx, a.trip, 'a'), /raggiungibile/);
  assert.ok(getPending(a.kv, a.trip.id));
  srv.offline = false;
  assert.equal((await pushRows(a.kv, a.store, a.tx, a.trip, 'a')).kind, 'salvato');
  assert.equal(srv.count('stops'), 4);
  assert.equal(getPending(a.kv, a.trip.id), undefined);
});
