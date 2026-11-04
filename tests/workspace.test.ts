import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeBudget } from '../src/domain/budget';
import { createEmptyTrip } from '../src/domain/defaults';
import { computeDays, moveStopTo, syncLegs } from '../src/domain/itinerary';
import { upsertAccommodation } from '../src/domain/lodging';
import { parseSelection, formatSelection, selectionCosts, selectionExists, selectionStopId } from '../src/domain/selection';
import type { Accommodation, Stop, Trip } from '../src/domain/types';
import { getRoutingProvider, RoutingError } from '../src/services/routing';
import { buildHash, parseRoute, startView } from '../src/state/route';

const stop = (id: string, name: string, nights: number): Stop => ({ id, kind: 'luogo', name, lat: 60, lng: 7, nights, notes: '', weatherPlanB: '' });

test('Indirizzi: viste attuali, alias legacy, parametri e indirizzi sconosciuti', () => {
  for (const v of ['panoramica', 'itinerario', 'configuratore', 'catalogo', 'scenari', 'voli', 'crociere', 'hytte', 'giornate', 'budget', 'impostazioni']) {
    assert.equal(parseRoute(`#/${v}`).view, v);
  }
  assert.equal(parseRoute('#/viaggio').view, 'impostazioni');
  assert.equal(parseRoute('#/costiera').view, 'crociere');
  assert.equal(parseRoute('#/percorso').view, 'pianifica');
  assert.equal(parseRoute('#/trasporti').view, 'voli');
  assert.equal(parseRoute('').view, 'panoramica');
  assert.equal(parseRoute('#/nonesiste').view, 'panoramica');
  assert.equal(parseRoute('#itinerario').view, 'itinerario');
  const r = parseRoute('#/pianifica?sel=stop%3Aabc&centro=timeline');
  assert.equal(r.view, 'pianifica');
  assert.deepEqual(r.params, { sel: 'stop:abc', centro: 'timeline' });
  assert.equal(buildHash('pianifica', { sel: 'stop:abc', centro: undefined }), '#/pianifica?sel=stop%3Aabc');
  assert.deepEqual(parseRoute(buildHash('pianifica', { sel: 'day:a#1' })).params, { sel: 'day:a#1' });
  assert.equal(parseRoute('#/t/oggi').view, 't/oggi');
});

test('Selezione: resta valida dopo un riordino, decade se l\'elemento è rimosso', () => {
  const stops = [stop('a', 'A', 2), stop('b', 'B', 1)];
  const t: Trip = { ...createEmptyTrip(), stops, legs: syncLegs(stops, []) };
  assert.equal(parseSelection(undefined), undefined);
  assert.equal(parseSelection('boh:1'), undefined);
  const s = parseSelection('stop:a')!;
  assert.equal(formatSelection(s), 'stop:a');
  const reordered: Trip = { ...t, stops: [stops[1]!, stops[0]!] };
  assert.equal(selectionExists(reordered, computeDays(reordered), s), true);
  const removed: Trip = { ...t, stops: [stops[1]!] };
  assert.equal(selectionExists(removed, computeDays(removed), s), false);
  const days = computeDays(t);
  assert.equal(selectionStopId(t, days, { kind: 'day', id: days[0]!.key }), 'a');
  assert.equal(selectionStopId(t, days, { kind: 'leg', id: t.legs[0]!.id }), 'b');
});

test('Costi della selezione: sono le stesse righe del Budget, senza nuovi calcoli', () => {
  const stops = [stop('a', 'A', 2), stop('b', 'B', 1)];
  const acc: Accommodation = { id: 'h', name: 'H', type: 'hytte', locality: '', pricePerNight: { amount: 100, currency: 'EUR' }, priceStatus: 'stimato', beds: '', bathroom: 'non_noto', kitchen: 'non_noto', parking: 'non_noto', cancellation: '', status: 'individuata', stopId: 'a', notes: '' };
  let t: Trip = { ...createEmptyTrip(), stops, legs: syncLegs(stops, []) };
  t = upsertAccommodation(t, acc);
  assert.equal(t.stops[0]!.accommodationId, 'h', 'la tappa adotta la sistemazione');
  const days = computeDays(t);
  t = { ...t, days: { [days[0]!.key]: { activities: [{ id: 'x', title: 'Museo', cost: { amount: 30, currency: 'EUR' }, costStatus: 'confermato' }], notes: '', planB: '' } } };
  const all = computeBudget(t).lines;
  assert.deepEqual(selectionCosts(t, undefined).map((l) => l.key), all.map((l) => l.key));
  assert.deepEqual(selectionCosts(t, { kind: 'stop', id: 'a' }).map((l) => l.eur), [200]);
  assert.deepEqual(selectionCosts(t, { kind: 'day', id: days[0]!.key }).map((l) => l.eur), [30]);
  assert.deepEqual(selectionCosts(t, { kind: 'leg', id: t.legs[0]!.id }), []);
});

test('Routing non disponibile: errore dichiarato, nessun tempo inventato, il piano resta usabile', async () => {
  const real = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new TypeError('rete assente');
  }) as typeof fetch;
  try {
    const a = stop('a', 'A', 1);
    const b = stop('b', 'B', 1);
    await assert.rejects(getRoutingProvider().route(a, b), RoutingError);
    const t: Trip = { ...createEmptyTrip(), stops: [a, b], legs: syncLegs([a, b], []) };
    assert.equal(computeDays(t)[1]!.travelPartial, true, 'la giornata risulta incompleta, non leggera');
  } finally {
    globalThis.fetch = real;
  }
});

test('Primo ingresso: area di lavoro se ci sono tappe, Oggi in viaggio, i link espliciti non si toccano', () => {
  assert.equal(startView('', 'planning', true), 'pianifica');
  assert.equal(startView('#/', 'planning', true), 'pianifica');
  assert.equal(startView('', 'planning', false), undefined, 'viaggio vuoto: resta «Il viaggio»');
  assert.equal(startView('', 'travel', false), 't/oggi');
  assert.equal(startView('#/panoramica', 'planning', true), undefined);
  assert.equal(startView('#/budget', 'travel', true), undefined);
});

test('Trascinamento: la tappa arriva nella posizione scelta, i tratti si riallineano e si può annullare', () => {
  const stops = [stop('a', 'PROVA A', 1), stop('b', 'PROVA B', 2), stop('c', 'PROVA C', 1)];
  const t: Trip = { ...createEmptyTrip(), stops, legs: syncLegs(stops, []) };
  const moved = moveStopTo(t, 'c', 0);
  assert.deepEqual(moved.stops.map((s) => s.id), ['c', 'a', 'b']);
  assert.deepEqual(moved.legs.map((l) => [l.fromStopId, l.toStopId]), [['c', 'a'], ['a', 'b']]);
  assert.deepEqual(moveStopTo(moved, 'c', 2).stops.map((s) => s.id), ['a', 'b', 'c']);
  assert.equal(moveStopTo(t, 'a', 0), t, 'stessa posizione: nessuna modifica');
  assert.equal(moveStopTo(t, 'x', 1), t, 'tappa inesistente: nessuna modifica');
});
