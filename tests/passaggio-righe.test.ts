import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ensureCountries } from '../src/domain/countries';
import { normalizeTrip } from '../src/domain/defaults';
import { diffPaths, sameTrip } from '../src/domain/rows';
import type { Trip } from '../src/domain/types';
import { memoryStore } from '../src/services/storage/dataStore';
import { importTrip, prepareDocument, unresolvedRefs } from '../src/services/storage/importRows';
import { loadBase, pullRows, pushRows } from '../src/services/storage/rowSync';
import { enqueue } from '../src/services/storage/syncEngine';
import { FakeSyncServer, memoryKv } from './fakeSync';
import { fullTrip } from './fixtures';

const refs = { places: new Set(['oslo', 'bergen', 'fram', 'folkemuseum']), voyages: new Set<string>() };

function docOf(t: Trip): Record<string, unknown> {
  // Come nel cloud oggi: documento senza nazioni, con lastMutationId
  const d = JSON.parse(JSON.stringify(t)) as Record<string, unknown>;
  delete d.countries;
  d.lastMutationId = 'aaaaaaaa-0000-4000-8000-000000000000';
  return d;
}

test('Passaggio: documento → righe verificato, poi formato «righe»; data intatto; secondo giro senza righe nuove', async () => {
  const srv = new FakeSyncServer();
  const t = fullTrip();
  const data = docOf(t);
  srv.addDocumentTrip(t.id, data);
  const store = memoryStore();
  const r = await importTrip(srv.importTransport(), store, t.id, { deviceId: 'dispositivo-1', refs });
  assert.equal(r.kind, 'fatto', JSON.stringify(r));
  if (r.kind !== 'fatto') return;
  const tripRow = srv.rows.get(`trips|${t.id}`)!.row;
  assert.equal(tripRow.storage_format, 'righe');
  assert.deepEqual(tripRow.data, data, 'la colonna data non cambia');
  assert.ok(sameTrip(r.trip, prepareDocument(data)), diffPaths(r.trip, prepareDocument(data)).join(', '));
  assert.deepEqual(r.trip.countries, [{ code: 'NO', releaseId: 'NO-1' }], 'viaggio vecchio: Norvegia, catalogo NO-1');
  assert.ok(r.unresolved.includes('preferito: fram') === false);
  assert.ok(r.unresolved.some((u) => u.startsWith('crociera: hv-bergen-alesund')), 'riferimento mancante elencato, non scartato');
  assert.deepEqual(srv.imports.at(-1)!.status, 'verificata');
  const stops = srv.count('stops');
  // Seconda esecuzione: già fatto, nessuna riga nuova
  const pushes = srv.pushes;
  assert.equal((await importTrip(srv.importTransport(), store, t.id, { deviceId: 'dispositivo-1', refs })).kind, 'gia_fatto');
  assert.equal(srv.pushes, pushes);
  assert.equal(srv.count('stops'), stops);
  // Dopo il passaggio la sincronizzazione per riga parte dalla base salvata: nulla da inviare
  const kv = memoryKv();
  enqueue(kv, t.id);
  assert.equal((await pushRows(kv, store, srv.transport(), r.trip, 'dispositivo-1')).kind, 'salvato');
  assert.equal(srv.pushes, pushes, 'base allineata: nessun invio');
  assert.equal((await pullRows(store, srv.transport(), r.trip)).kind, 'invariato');
  // L'app vecchia non può più scrivere il documento
  assert.throws(() => srv.saveDocument(t.id, { ...data, title: 'x' }), /nuovo formato/);
});

test('Passaggio interrotto e ripreso: le righe del primo giro non si duplicano', async () => {
  const srv = new FakeSyncServer();
  const t = fullTrip();
  srv.addDocumentTrip(t.id, docOf(t));
  const tx = srv.importTransport();
  // Primo giro: si interrompe alla verifica (rete persa)
  let reads = 0;
  const flaky = { ...tx, readTrip: async (id: string) => (++reads === 2 ? Promise.reject(new Error('rete persa')) : tx.readTrip(id)) };
  await assert.rejects(() => importTrip(flaky, memoryStore(), t.id, { deviceId: 'd' }));
  assert.equal(srv.rows.get(`trips|${t.id}`)!.row.storage_format, 'documento', 'non verificato: resta documento');
  const stops = srv.count('stops');
  assert.ok(stops > 0);
  const pushes = srv.pushes;
  const r = await importTrip(tx, memoryStore(), t.id, { deviceId: 'd' });
  assert.equal(r.kind, 'fatto');
  assert.equal(srv.count('stops'), stops, 'nessun doppione');
  assert.equal(srv.pushes - pushes, 2, 'secondo giro: solo la riga del viaggio e il cambio di formato');
});

test('Passaggio: se l\'app vecchia salva durante la conversione si ricomincia con il documento nuovo', async () => {
  const srv = new FakeSyncServer();
  const t = fullTrip();
  srv.addDocumentTrip(t.id, docOf(t));
  const tx = srv.importTransport();
  let n = 0;
  const racing = {
    ...tx,
    readTrip: async (id: string) => {
      n++;
      if (n === 2) srv.saveDocument(id, { ...docOf(t), title: 'Salvato dall\'app vecchia' });
      return tx.readTrip(id);
    },
  };
  const r = await importTrip(racing, memoryStore(), t.id, { deviceId: 'd' });
  assert.equal(r.kind, 'fatto');
  assert.equal(r.kind === 'fatto' && r.trip.title, 'Salvato dall\'app vecchia');
});

test('Passaggio: documento di una versione più recente → nessuna scrittura', async () => {
  const srv = new FakeSyncServer();
  srv.addDocumentTrip('x', { schemaVersion: 99, id: 'x' });
  const r = await importTrip(srv.importTransport(), memoryStore(), 'x', { deviceId: 'd' });
  assert.equal(r.kind, 'fallita');
  assert.equal(srv.pushes, 0);
  assert.equal(srv.rows.get('trips|x')!.row.storage_format, 'documento');
});

test('Passaggio: documento senza versioni del percorso → identificativo stabile tra due giri', () => {
  const d = { schemaVersion: 1, id: 'v', stops: [] };
  const a = prepareDocument(d);
  const b = prepareDocument(d);
  assert.equal(a.activeScenarioId, 'v-principale');
  assert.equal(a.activeScenarioId, b.activeScenarioId);
  assert.deepEqual(unresolvedRefs(ensureCountries(normalizeTrip({ schemaVersion: 2, id: 'w', favorites: ['nessuno'] })), refs), ['preferito: nessuno']);
});

test('Passaggio: la base del dispositivo dopo il passaggio ha le revisioni del cloud', async () => {
  const srv = new FakeSyncServer();
  const t = fullTrip();
  srv.addDocumentTrip(t.id, docOf(t));
  const store = memoryStore();
  await importTrip(srv.importTransport(), store, t.id, { deviceId: 'd' });
  const base = await loadBase(store, t.id);
  assert.ok(base.seq > 0);
  assert.ok(Object.values(base.rows).every((r) => r.rev >= 1));
});

import { newTripInRows, parseConversionMode } from '../src/state/conversionMode';

test('Passaggio: senza VITE_PASSAGGIO_RIGHE il pulsante non c\'è; solo «pulsante» o «auto» lo mostrano', () => {
  assert.equal(parseConversionMode(undefined), 'nascosto');
  assert.equal(parseConversionMode(''), 'nascosto');
  assert.equal(parseConversionMode('si'), 'nascosto', 'valori non previsti: nascosto');
  assert.equal(parseConversionMode('pulsante'), 'pulsante');
  assert.equal(parseConversionMode(' AUTO '), 'auto');
});

test('Viaggio nuovo: nel formato a righe solo con il cloud collegato e VITE_PASSAGGIO_RIGHE=pulsante|auto', () => {
  assert.equal(newTripInRows(true, 'nascosto'), false, 'senza la variabile: formato documento di sempre');
  assert.equal(newTripInRows(true, 'pulsante'), true);
  assert.equal(newTripInRows(true, 'auto'), true);
  assert.equal(newTripInRows(false, 'auto'), false, 'senza cloud: documento');
  assert.equal(newTripInRows(true, parseConversionMode(undefined)), false);
});
