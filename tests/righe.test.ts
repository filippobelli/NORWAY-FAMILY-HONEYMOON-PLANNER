import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyTrip, normalizeTrip } from '../src/domain/defaults';
import { canonical, countRows, DATA_COLUMNS, diffPaths, fromRows, sameTrip, TABLE_ORDER, toRows, type TripRows } from '../src/domain/rows';
import type { Trip } from '../src/domain/types';
import { fullTrip, stop } from './fixtures';

function roundTrip(t: Trip): Trip {
  // Come nel cloud: le righe passano per JSON
  const rows = JSON.parse(JSON.stringify(toRows(t).rows)) as TripRows;
  return fromRows(rows);
}

test('Righe: documento con tutti i campi ricostruito identico', () => {
  const t = fullTrip();
  const back = roundTrip(t);
  assert.deepEqual(diffPaths(back, t), []);
  assert.ok(sameTrip(back, t));
  const { rows, warnings } = toRows(t);
  const n = countRows(rows);
  assert.equal(n.trips, 1);
  assert.equal(n.trip_versions, 3);
  assert.equal(n.stops, 3 + 3 + 1, 'tappe di tutte le versioni');
  assert.equal(n.trip_rates, 2, 'NOK dalle impostazioni e XTS');
  assert.equal(n.trip_countries, 2);
  assert.equal(n.diary_attachments, 2, 'gli allegati ripetuti della copia «-cloud» restano nei metadati, senza doppioni');
  assert.equal(n.visit_states, 2);
  assert.deepEqual(warnings, []);
});

test('Righe: campi sconosciuti in extra, colonne solo quelle dello schema', () => {
  const { rows } = toRows(fullTrip());
  const trip = rows.trips![0]!;
  assert.deepEqual((trip.extra as Record<string, unknown>).campoFuturoViaggio, { v: 1 });
  assert.equal((trip.settings as Record<string, unknown>).nokPerEur, undefined, 'il cambio NOK esce dalle impostazioni');
  assert.equal((trip.settings as Record<string, unknown>).impostazioneFutura, 'x');
  const c = rows.stops!.find((s) => s.id === 'c')!;
  assert.deepEqual((c.extra as Record<string, unknown>).campoFuturoTappa, { x: [1, 2] });
  for (const table of TABLE_ORDER) {
    for (const r of rows[table] ?? []) {
      for (const k of Object.keys(r)) assert.ok(DATA_COLUMNS[table].includes(k), `${table}.${k} non è una colonna prevista`);
    }
  }
  const nok = rows.trip_rates!.find((r) => r.currency === 'NOK')!;
  assert.equal(nok.per_eur, 11.2);
  assert.equal(nok.auto, false);
  const seg = rows.segments!.find((s) => s.cost_amount === 250)!;
  assert.equal(seg.cost_currency, 'NOK');
});

test('Righe: viaggi di esempio e formati storici ricostruiti identici', () => {
  const fixtures: unknown[] = [
    { schemaVersion: 1, id: 'minimo' },
    { schemaVersion: 1, id: 'giornate-numeriche', startDate: '2027-08-01', stops: [stop('a', 'A', 2)], days: { 1: { activities: [{ id: 'z', title: 'T', costStatus: 'stimato' }], notes: '', planB: '' } } },
    { schemaVersion: 1, id: 'scenari-senza-voli', stops: [], scenarios: [{ id: 's', name: 'Vecchio', kind: 'altro', notes: '', updatedAt: '', plan: { startDate: '2027-08-01', stops: [], legs: [], days: {}, budgetItems: [], coastalSelected: [] } }, { id: 'att', name: 'Attivo', kind: 'altro', notes: '', updatedAt: '' }], activeScenarioId: 'att', flights: [{ id: 'f' }] },
  ];
  for (const f of fixtures) {
    const t = normalizeTrip(JSON.parse(JSON.stringify(f)));
    assert.deepEqual(diffPaths(roundTrip(t), t), [], String((f as { id: string }).id));
  }
  const empty = createEmptyTrip();
  assert.deepEqual(diffPaths(roundTrip(empty), empty), []);
});

test('Righe: valori fuori elenco, null e doppioni conservati nei metadati e segnalati', () => {
  const t = fullTrip();
  const odd = {
    ...t,
    stops: [{ ...t.stops[0]!, kind: 'astronave', nights: 'due', ideas: ['oslo', 'oslo'], accommodationId: null }, ...t.stops.slice(1)],
    favorites: ['oslo', 'oslo'],
    budgetItems: [{ id: 'b9', category: 'sconosciuta', label: 'X', amount: { amount: 'tanto', currency: 'EUR' }, status: 'stimato', notes: '' }],
    actuals: { stops: { a: { state: 'boh', at: '' } }, activities: {} },
  } as unknown as Trip;
  const { rows, warnings } = toRows(odd);
  assert.ok(warnings.length >= 4, warnings.join('\n'));
  const s = rows.stops!.find((r) => r.id === 'a' && r.version_id === t.activeScenarioId)!;
  assert.equal(s.kind, 'luogo', 'la colonna riceve un valore ammesso');
  assert.equal(s.nights, 0);
  assert.equal(rows.favorites!.length, 0);
  assert.equal(rows.budget_items!.find((b) => b.id === 'b9')!.category, 'extra_imprevisti');
  assert.deepEqual(diffPaths(roundTrip(odd), odd), [], 'il documento torna com\'era');
});

test('Righe: versione attiva obbligatoria, identificativi ripetuti delle tappe rifiutati', () => {
  const t = fullTrip();
  assert.throws(() => toRows({ ...t, activeScenarioId: 'inesistente' }), /versione attiva/);
  assert.throws(() => toRows({ ...t, stops: [t.stops[0]!, t.stops[0]!] }), /tappe con identificativi ripetuti/);
});

test('Righe: le righe cancellate (tombstone) non tornano nel documento', () => {
  const t = fullTrip();
  const rows = JSON.parse(JSON.stringify(toRows(t).rows)) as TripRows;
  rows.favorites![0]!.deleted_at = '2027-01-01T00:00:00Z';
  const back = fromRows(rows);
  assert.deepEqual(back.favorites, ['fram']);
});

test('Righe: canonical ignora ordine delle chiavi, undefined e lastMutationId; loose tratta come uguali elenchi vuoti e assenti', () => {
  assert.ok(sameTrip({ a: 1, b: { c: 2, d: undefined } }, { b: { c: 2 }, a: 1 }));
  assert.ok(sameTrip({ a: 1, lastMutationId: 'x' }, { a: 1 }));
  assert.ok(!sameTrip({ a: { ideas: [] } }, { a: {} }));
  assert.ok(sameTrip({ a: { ideas: [] } }, { a: {} }, { loose: true }));
  assert.deepEqual(canonical({ z: [1, undefined] }), { z: [1, null] });
});
