import { italianStyle, withoutLabels } from '../src/services/map/baseStyle';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeBudget } from '../src/domain/budget';
import { createEmptyTrip } from '../src/domain/defaults';
import { computeDays, moveStopTo, removeStops, syncLegs } from '../src/domain/itinerary';
import { upsertAccommodation } from '../src/domain/lodging';
import { addScenario, clearScenario, tripForScenario } from '../src/domain/scenarios';
import { parseSelection, formatSelection, selectionCosts, selectionExists, selectionStopId } from '../src/domain/selection';
import type { Accommodation, BudgetItem, Flight, Stop, Trip } from '../src/domain/types';
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

test('Fondo mappa: nomi in italiano o locali, mai in inglese; sigle delle strade intatte', () => {
  const nameField = ['coalesce', ['get', 'name_en'], ['get', 'name']];
  const style = {
    version: 8,
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#000' } },
      { id: 'label_town', type: 'symbol', layout: { 'text-field': nameField, 'text-size': 12 } },
      { id: 'shield', type: 'symbol', layout: { 'text-field': ['to-string', ['get', 'ref']] } },
      { id: 'road', type: 'line', paint: { 'line-color': '#111' } },
    ],
  };
  const out = italianStyle(style);
  assert.deepEqual(out.layers[1]?.layout, { 'text-field': ['coalesce', ['get', 'name:it'], ['get', 'name']], 'text-size': 12 });
  assert.equal(out.layers[2], style.layers[2]);
  assert.equal(out.layers[3], style.layers[3]);
  assert.equal(out.layers[0]?.paint?.['background-color'], '#f5f7fa');
  assert.deepEqual(style.layers[1]?.layout?.['text-field'], nameField, 'lo stile scaricato non si tocca');
  assert.deepEqual(withoutLabels(style).layers.map((l) => l.id), ['background', 'road']);
});

test('Eliminare più tappe: tratti riallineati, alloggi sganciati, attività senza giornata conservate', () => {
  const stop = (id: string): Stop => ({ id, kind: 'luogo', name: id, lat: 60, lng: 7, nights: 2, notes: '', weatherPlanB: '' });
  const stops = [stop('a'), stop('b'), stop('c')];
  const trip: Trip = {
    ...createEmptyTrip(),
    stops,
    legs: syncLegs(stops, []),
    days: { 'b#0': { activities: [], notes: 'da conservare' } as unknown as Trip['days'][string] },
    accommodations: [{ id: 'h', stopId: 'b' } as Accommodation],
  };
  const out = removeStops(trip, ['a', 'b']);
  assert.deepEqual(out.stops.map((s) => s.id), ['c']);
  assert.equal(out.legs.length, 0);
  assert.equal(out.accommodations[0]?.stopId, undefined);
  assert.ok(out.days['b#0'], 'le note e le attività non si perdono');
  assert.equal(removeStops(trip, ['nessuna']), trip);
});

test('Svuotare uno scenario: attivo o salvato, gli altri restano; voli e costi solo su richiesta', () => {
  const stop = (id: string): Stop => ({ id, kind: 'luogo', name: id, lat: 60, lng: 7, nights: 2, notes: '', weatherPlanB: '' });
  const stops = [stop('a'), stop('b')];
  const flight = { id: 'f', priceStatus: 'pagato' } as Flight;
  const item = { id: 'i', category: 'attrazioni', label: 'Ingresso', amount: { amount: 10, currency: 'EUR' }, status: 'pagato', notes: '' } as BudgetItem;
  const trip = addScenario({ ...createEmptyTrip(), stops, legs: syncLegs(stops, []), flights: [flight], budgetItems: [item] }, 'Copia', 'altro', 'copia');
  const activeId = trip.activeScenarioId!;
  const copyId = trip.scenarios!.find((s) => s.id !== activeId)!.id;

  const a = clearScenario(trip, activeId);
  assert.equal(a.stops.length, 0);
  assert.equal(a.legs.length, 0);
  assert.equal(a.flights?.length, 1, 'i voli restano');
  assert.equal(a.budgetItems.length, 1, 'i costi restano');
  assert.equal(a.scenarios!.find((s) => s.id === copyId)?.plan?.stops.length, 2, "l'altro scenario non cambia");

  const c = clearScenario(trip, copyId);
  assert.equal(c.stops.length, 2, 'lo scenario attivo non cambia');
  assert.equal(tripForScenario(c, copyId).stops.length, 0);
  assert.equal(tripForScenario(c, copyId).flights?.length, 1);

  const all = clearScenario(trip, activeId, { costs: true });
  assert.equal(all.flights?.length, 0);
  assert.equal(all.budgetItems.length, 0);
  assert.equal(tripForScenario(clearScenario(trip, copyId, { costs: true }), copyId).budgetItems.length, 0);
});
