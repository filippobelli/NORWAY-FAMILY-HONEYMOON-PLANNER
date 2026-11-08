import assert from 'node:assert/strict';
import { test } from 'node:test';
import { memoryKv } from './fakeSync';

const ls = memoryKv();
const ss = memoryKv();
Object.assign(globalThis, { localStorage: ls, sessionStorage: ss });

const { applyRemoteContext, contextToRow, getContext, markContextSent, reloadContext, resetContext, rowToContext, setContext } = await import('../src/state/workContext');
const { loadLastPlanning, loadTravelContext, saveLastPlanning, saveTravelContext } = await import('../src/state/uiContext');
const { holdForOwner, purgeTripData, restoreHold } = await import('../src/services/storage/syncEngine');

test('Contesto: i valori della versione precedente (sessione e configuratore) passano nella copia nuova', () => {
  resetContext();
  ss.setItem('nfhp.ui.lastPlanning', JSON.stringify('#/budget'));
  ss.setItem('nfhp.planner.ui', JSON.stringify({ sel: 'tappa:a', center: 'mappa' }));
  ls.setItem('nfhp.configurator.v1', JSON.stringify({ days: 15 }));
  reloadContext();
  const c = getContext();
  assert.equal(c.lastPlanning, '#/budget');
  assert.equal(c.plannerSel, 'tappa:a');
  assert.deepEqual(c.configurator, { days: 15 });
  assert.equal(c.dirty, true, 'da inviare al cloud');
});

test('Contesto: modifica qui → da inviare; copia del cloud non sovrascrive modifiche non inviate', () => {
  resetContext();
  saveLastPlanning('#/giornate');
  saveTravelContext({ on: '2027-08-03', dayIndex: 2, stopId: 'b' });
  assert.equal(loadLastPlanning(), '#/giornate');
  assert.equal(loadTravelContext('2027-08-03').dayIndex, 2);
  assert.equal(loadTravelContext('2027-08-04').dayIndex, undefined, 'domani si riparte dal giorno giusto');
  assert.equal(applyRemoteContext({ lastPlanning: '#/altro' }, '2027-01-01T00:00:00Z'), false);
  markContextSent(getContext().updatedAt, '2027-01-01T00:00:01Z');
  assert.equal(getContext().dirty, false);
  // Secondo dispositivo ha scritto dopo: si applica
  assert.equal(applyRemoteContext({ lastPlanning: '#/budget', lastTripId: 't2' }, '2027-01-02T00:00:00Z'), true);
  assert.equal(loadLastPlanning(), '#/budget');
  assert.equal(getContext().lastTripId, 't2');
  // Copia più vecchia: ignorata
  assert.equal(applyRemoteContext({ lastPlanning: '#/vecchia' }, '2026-01-01T00:00:00Z'), false);
});

test('Contesto: righe user_context ↔ contesto', () => {
  const c = { lastPlanning: '#/budget', plannerSel: 'x', configurator: { a: 1 }, travel: { on: 'd' }, activation: { name: 'n' }, lastTripId: 't' };
  const row = contextToRow(c, 'u', 'dispositivo-1');
  assert.equal(row.user_id, 'u');
  assert.deepEqual(rowToContext(row), c);
});

test('Contesto: uscita e cambio utente lo trattano come i dati del viaggio', () => {
  resetContext();
  setContext({ lastPlanning: '#/crociere' });
  assert.ok(ls.getItem('nfhp.contesto.v1'));
  assert.ok(holdForOwner(ls, 'u1'));
  assert.equal(ls.getItem('nfhp.contesto.v1'), null, 'messo da parte per u1');
  assert.ok(restoreHold(ls, 'u1'));
  reloadContext();
  assert.equal(loadLastPlanning(), '#/crociere');
  purgeTripData(ls);
  reloadContext();
  assert.equal(getContext().lastPlanning, undefined);
});

test('Archivio del dispositivo: la base per riga si mette da parte al cambio utente e torna al rientro', async () => {
  const { holdStore, memoryStore, restoreStore } = await import('../src/services/storage/dataStore');
  const st = memoryStore();
  await st.put('base', 'viaggio-u1', { seq: 3, rows: { a: 1 } });
  await st.put('cataloghi', 'NO-1', { release: {} });
  await holdStore(st, 'u1');
  assert.deepEqual(await st.keys('base'), [], 'chi entra non trova la base di u1');
  assert.deepEqual(await st.keys('cataloghi'), ['NO-1'], 'i cataloghi restano');
  await st.put('base', 'viaggio-u2', { seq: 1, rows: {} });
  await holdStore(st, 'u2');
  await restoreStore(st, 'u1');
  assert.deepEqual(await st.keys('base'), ['viaggio-u1']);
  assert.deepEqual(await st.get('base', 'viaggio-u1'), { seq: 3, rows: { a: 1 } });
  assert.equal(await st.get('meta', 'hold.u1'), undefined);
  await restoreStore(st, 'u2');
  assert.deepEqual((await st.keys('base')).sort(), ['viaggio-u1', 'viaggio-u2']);
});
