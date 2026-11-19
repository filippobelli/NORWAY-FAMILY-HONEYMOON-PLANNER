import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildNorway, buildNorwayV2, seedBundle } from '../scripts/seed-catalog';
import { createEmptyTrip } from '../src/domain/defaults';
import { syncLegs } from '../src/domain/itinerary';
import { draftChanges, draftMoveStop, draftRemoveStop, draftSetNights, removalPreview } from '../src/domain/planImpact';
import type { Trip } from '../src/domain/types';
import { cachedBundle, loadTripCatalogs, prepareRelease, pruneCatalogs, releasesToKeep, type CatalogTransport } from '../src/services/catalog/catalogService';
import { memoryStore } from '../src/services/storage/dataStore';
import { stop } from './fixtures';

// Revisione UX del 15/11/2026: bozza della proposta, rimozione di una tappa, passaggio di catalogo.

function draft(): Trip {
  const stops = [stop('a', 'Bergen', 2), stop('b', 'Flåm', 0), stop('c', 'Geiranger', 3), stop('d', 'Ålesund', 2)];
  return { ...createEmptyTrip(), startDate: '2027-08-01', stops, legs: syncLegs(stops, []) };
}

test('Bozza della proposta: le modifiche fatte a mano si riconoscono, i tratti calcolati no', () => {
  const start = draft();
  assert.deepEqual(draftChanges(start, start), []);
  const routed = { ...start, legs: start.legs.map((l) => ({ ...l, notes: 'calcolato' })) };
  assert.deepEqual(draftChanges(start, routed), [], 'i calcoli dei percorsi non sono modifiche da perdere');
  const nights = draftSetNights(start, 'b', 1);
  assert.deepEqual(draftChanges(start, nights), ['Notti a Flåm: da 0 a 1']);
  const moved = draftMoveStop(nights, 'c', 1);
  assert.deepEqual(draftChanges(start, moved), ['Notti a Flåm: da 0 a 1', 'Ordine delle tappe cambiato']);
  const removed = draftRemoveStop(start, 'c', 'alla_precedente');
  const list = draftChanges(start, removed);
  assert.ok(list.includes('Geiranger tolta dalla proposta'));
  assert.ok(!list.includes('Ordine delle tappe cambiato'), 'togliere una tappa non è un cambio di ordine');
});

test('Togliere una tappa: dove vanno le notti e quali date cambiano, prima di farlo', () => {
  const t = draft();
  // Le notti passano alla tappa precedente con pernottamento possibile: durata invariata, date successive invariate
  const give = removalPreview(t, 'c', 'alla_precedente')!;
  assert.equal(give.nights, 3);
  assert.deepEqual(give.receiver, { name: 'Flåm', before: 0, after: 3 });
  assert.equal(give.daysBefore, 8);
  assert.equal(give.daysAfter, 8);
  assert.equal(give.endBefore, give.endAfter);
  assert.deepEqual(give.dateChanges, [], 'Ålesund arriva lo stesso giorno');
  // Le notti si tolgono: il viaggio si accorcia e le tappe dopo anticipano
  const drop = removalPreview(t, 'c', 'togli')!;
  assert.equal(drop.receiver, undefined);
  assert.equal(drop.daysAfter, 5);
  assert.equal(drop.endBefore, '2027-08-08');
  assert.equal(drop.endAfter, '2027-08-05');
  assert.deepEqual(drop.dateChanges, [{ name: 'Ålesund', before: '2027-08-06', after: '2027-08-03' }]);
  // L'anteprima descrive esattamente quello che fa la rimozione
  const after = draftRemoveStop(t, 'c', 'alla_precedente');
  assert.equal(after.stops.find((s) => s.id === 'b')!.nights, 3);
  // Tappa di passaggio: nessuna notte da spostare, nessuna data cambia
  const pass = removalPreview(t, 'b', 'alla_precedente')!;
  assert.equal(pass.nights, 0);
  assert.equal(pass.receiver, undefined);
  assert.deepEqual(pass.dateChanges, []);
  assert.equal(removalPreview(t, 'zz', 'togli'), undefined);
});

const bundle = (b: ReturnType<typeof buildNorway>) => JSON.parse(JSON.stringify(seedBundle(b, { publishedAt: '2026-11-06T00:00:00+00:00' })));
function transport(bundles: Record<string, unknown>, log: string[] = []): CatalogTransport {
  return {
    bundle: async (id) => {
      log.push(id);
      if (!(id in bundles)) throw new Error('Server cloud non raggiungibile');
      return JSON.parse(JSON.stringify(bundles[id]));
    },
    available: async () => [],
  };
}

test('Passaggio di catalogo: la versione nuova si scarica e si controlla prima; se fallisce resta la precedente', async () => {
  const store = memoryStore();
  const ok = transport({ 'NO-1': bundle(buildNorway()), 'NO-2': bundle(buildNorwayV2()) });
  await loadTripCatalogs([{ code: 'NO', releaseId: 'NO-1' }], store, ok);
  // Rete assente: errore, nessuna copia della versione nuova, la precedente è ancora lì e si carica
  await assert.rejects(prepareRelease(store, transport({}), 'NO-2'), /raggiungibile/);
  await assert.rejects(prepareRelease(store, undefined, 'NO-2'), /collegati al cloud/);
  assert.deepEqual(await store.keys('cataloghi'), ['NO-1']);
  const still = await loadTripCatalogs([{ code: 'NO', releaseId: 'NO-1' }], store, undefined);
  assert.equal(still.states.NO, 'sul_dispositivo');
  // Il server risponde con un'altra versione: non entra nella copia offline
  await assert.rejects(prepareRelease(store, transport({ 'NO-2': bundle(buildNorway()) }), 'NO-2'), /altra versione/);
  assert.equal(await cachedBundle(store, 'NO-2'), undefined);
  // Riprova riuscita: la versione è sul dispositivo prima che il viaggio cambi, e una seconda volta non riscarica
  const log: string[] = [];
  await prepareRelease(store, transport({ 'NO-2': bundle(buildNorwayV2()) }, log), 'NO-2');
  await prepareRelease(store, transport({}, log), 'NO-2');
  assert.deepEqual(log, ['NO-2']);
  assert.deepEqual((await store.keys('cataloghi')).sort(), ['NO-1', 'NO-2']);
});

test('Pulizia della copia offline: mai finché la versione del viaggio non è sul dispositivo', async () => {
  const trip = [{ code: 'NO', releaseId: 'NO-2' }];
  assert.equal(releasesToKeep({ NO: 'errore' }, trip, ['NO-1']), undefined, 'download fallito: non si cancella nulla');
  assert.equal(releasesToKeep({ NO: 'in_download' }, trip, []), undefined);
  assert.equal(releasesToKeep({}, [], ['NO-1']), undefined, 'nessuna nazione: non si pulisce');
  assert.deepEqual(releasesToKeep({ NO: 'sul_dispositivo' }, trip, ['NO-1', 'NO-2']), ['NO-2', 'NO-1'], 'le versioni usate nella sessione restano per poter annullare');
  const store = memoryStore();
  await store.put('cataloghi', 'NO-1', { x: 1 });
  await store.put('cataloghi', 'NO-2', { x: 2 });
  await store.put('cataloghi', 'XX-9', { x: 3 });
  await pruneCatalogs(store, releasesToKeep({ NO: 'sul_dispositivo' }, trip, ['NO-1'])!);
  assert.deepEqual((await store.keys('cataloghi')).sort(), ['NO-1', 'NO-2']);
});
