import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDiaryEntry, activityState, editDiaryEntry, newDiaryEntry, removeDiaryEntry, setActivityState, setStopState, stopState, visibleDiary } from '../src/domain/actuals';
import { computeBudget } from '../src/domain/budget';
import { createEmptyTrip, normalizeTrip } from '../src/domain/defaults';
import { computeDays, syncLegs, totalDays } from '../src/domain/itinerary';
import { CURRENT_SCHEMA, FutureSchemaError, migrateDocument } from '../src/domain/migrations';
import { addScenario, ensureScenarios, switchScenario } from '../src/domain/scenarios';
import { defaultDayIndex, phaseNote, todayView, tripPhase } from '../src/domain/today';
import type { Stop, Trip } from '../src/domain/types';

const stop = (id: string, name: string, nights: number): Stop => ({ id, kind: 'luogo', name, lat: 60, lng: 7, nights, notes: '', weatherPlanB: '' });
function base(): Trip {
  const stops = [stop('a', 'Oslo', 2), stop('b', 'Bergen', 2), stop('c', 'Tromsø', 1)];
  return { ...createEmptyTrip(), startDate: '2027-08-01', stops, legs: syncLegs(stops, []) };
}
const planOf = (t: Trip) => ({ startDate: t.startDate, stops: t.stops, legs: t.legs, days: t.days, budgetItems: t.budgetItems });

test('Migrazione: da v1 a v2, idempotente, conserva i campi sconosciuti', () => {
  const v1 = { schemaVersion: 1, id: 'x', stops: [], campoFuturo: { a: 1 }, days: { 0: { activities: [], notes: 'n', planB: '' } } };
  const once = migrateDocument(v1);
  assert.equal(once.schemaVersion, CURRENT_SCHEMA);
  assert.deepEqual(once.actuals, { stops: {}, activities: {} });
  assert.deepEqual(once.diary, []);
  assert.deepEqual(once.campoFuturo, { a: 1 });
  assert.deepEqual(migrateDocument(once), once, 'seconda passata: nessun cambiamento');
  const t = normalizeTrip(v1);
  assert.equal(t.schemaVersion, 2);
  assert.deepEqual((t as unknown as { campoFuturo: unknown }).campoFuturo, { a: 1 });
});

test('Migrazione: i formati storici restano leggibili', () => {
  const fixtures: unknown[] = [
    { schemaVersion: 1, id: 'minimo' },
    { schemaVersion: 1, id: 'senza-voli', stops: [stop('a', 'A', 1)], legs: [], days: {}, coastalOptions: [], accommodations: [], budgetItems: [], favorites: [] },
    { schemaVersion: 1, id: 'giornate-numeriche', startDate: '2027-08-01', stops: [stop('a', 'A', 2)], days: { 1: { activities: [{ id: 'z', title: 'T', costStatus: 'stimato' }], notes: '', planB: '' } } },
    { schemaVersion: 1, id: 'scenari-senza-voli', stops: [], scenarios: [{ id: 's', name: 'Vecchio', kind: 'altro', notes: '', updatedAt: '', plan: { startDate: '2027-08-01', stops: [], legs: [], days: {}, budgetItems: [], coastalSelected: [] } }, { id: 'att', name: 'Attivo', kind: 'altro', notes: '', updatedAt: '' }], activeScenarioId: 'att', flights: [{ id: 'f' }] },
  ];
  for (const f of fixtures) {
    const t = normalizeTrip(JSON.parse(JSON.stringify(f)));
    assert.equal(t.schemaVersion, 2);
    assert.deepEqual(t.diary, []);
  }
  const numeric = normalizeTrip(fixtures[2]);
  assert.deepEqual(Object.keys(numeric.days), ['a#1'], 'la vecchia chiave numerica migra ancora');
  const legacy = normalizeTrip(fixtures[3]);
  assert.deepEqual(switchScenario(legacy, 's').flights, [{ id: 'f' }], 'un piano vecchio tiene i voli attuali');
});

test('Migrazione: documento più recente rifiutato senza toccarlo', () => {
  assert.throws(() => normalizeTrip({ schemaVersion: 99, id: 'x' }), FutureSchemaError);
  assert.throws(() => normalizeTrip({ schemaVersion: 'due', id: 'x' }), /non supportata/);
  assert.throws(() => normalizeTrip(null), /non valido/);
  assert.throws(() => normalizeTrip({ schemaVersion: 2, id: 'x', diary: 'no' }), /diario non valido/);
});

test('Completamento: segna, Undo e salto non cambiano date, ordine, notti o budget', () => {
  const t = base();
  const visited = setStopState(t, 'b', 'visitata', '2027-08-03T10:00:00Z');
  assert.equal(stopState(visited, 'b'), 'visitata');
  assert.equal(stopState(visited, 'a'), 'pianificata');
  assert.deepEqual(planOf(visited), planOf(t));
  assert.deepEqual(computeBudget(visited).lines, computeBudget(t).lines);
  assert.equal(totalDays(visited.stops), totalDays(t.stops));
  // Undo: torna allo stato precedente e tocca solo quella tappa
  const other = setStopState(visited, 'a', 'in_corso');
  const undone = setStopState(other, 'b', undefined);
  assert.equal(stopState(undone, 'b'), 'pianificata');
  assert.equal(stopState(undone, 'a'), 'in_corso');
  const skipped = setStopState(t, 'c', 'saltata');
  assert.equal(stopState(skipped, 'c'), 'saltata');
  assert.deepEqual(skipped.stops, t.stops, 'una tappa saltata resta nel piano');
  const act = setActivityState(t, 'att', 'fatta');
  assert.equal(activityState(act, 'att'), 'fatta');
  assert.equal(activityState(setActivityState(act, 'att', undefined), 'att'), 'da_fare');
  assert.deepEqual(planOf(act), planOf(t));
});

test('Diario: resta dopo riordino, rimozione tappa e cambio versione', () => {
  const t0 = ensureScenarios(base());
  const e = newDiaryEntry({ text: 'Fiordo bellissimo', dayDate: '2027-08-03', stop: { id: 'b', name: 'Bergen' }, now: new Date('2027-08-03T18:30:00') });
  assert.equal(e.localDate, '2027-08-03');
  assert.equal(e.localTime, '18:30');
  const t = addDiaryEntry(t0, e);
  const reordered: Trip = { ...t, stops: [...t.stops].reverse() };
  assert.deepEqual(visibleDiary(reordered, { stopId: 'b' }), [e], 'riordinare non sposta le voci');
  assert.equal(visibleDiary(reordered, { dayDate: '2027-08-03' })[0]!.stopName, 'Bergen');
  const removed: Trip = { ...t, stops: t.stops.filter((s) => s.id !== 'b') };
  assert.equal(visibleDiary(removed)[0]!.stopName, 'Bergen', 'la voce conserva il nome della tappa');
  const withB = addScenario(t, 'B', 'altro', 'vuoto');
  const inB = switchScenario(withB, withB.scenarios![1]!.id);
  assert.equal(inB.stops.length, 0);
  assert.equal(visibleDiary(inB).length, 1, 'il diario è fuori dal piano');
  // Voce senza giornata né tappa: facoltative
  const free = newDiaryEntry({ text: 'Libera' });
  assert.equal(free.stopId, undefined);
  assert.equal(free.dayDate, undefined);
  const edited = editDiaryEntry(t, e.id, { text: 'Nuovo testo' }, '2027-08-04T00:00:00Z');
  assert.equal(visibleDiary(edited)[0]!.text, 'Nuovo testo');
  const gone = removeDiaryEntry(t, e.id, '2027-08-04T00:00:00Z');
  assert.equal(visibleDiary(gone).length, 0);
  assert.equal(gone.diary!.length, 1, 'resta la traccia per la sincronizzazione');
});

test('Oggi: fase, giorno, prossima cosa, attività, prenotazioni senza dati inventati', () => {
  const t0 = base();
  assert.equal(tripPhase(createEmptyTrip(), '2027-08-01'), 'vuoto');
  assert.equal(todayView(createEmptyTrip(), 0), undefined);
  assert.equal(tripPhase(t0, '2026-11-03'), 'prima');
  assert.match(phaseNote(t0, '2026-11-03')!, /Anteprima/);
  assert.equal(defaultDayIndex(t0, '2026-11-03'), 0, 'prima del viaggio: anteprima del Giorno 1');
  assert.equal(defaultDayIndex(t0, '2027-08-03'), 2);
  assert.equal(tripPhase(t0, '2027-08-03'), 'durante');
  assert.equal(phaseNote(t0, '2027-08-03'), undefined);
  assert.equal(tripPhase(t0, '2027-09-01'), 'dopo');

  const days = computeDays(t0);
  const key = days[2]!.key;
  const t: Trip = {
    ...t0,
    days: { [key]: { activities: [{ id: 'm', title: 'Museo', costStatus: 'stimato' }], notes: 'Portare giacche', planB: 'Acquario' } },
    flights: [{ id: 'f', direction: 'interno', fromAirport: 'BGO', toAirport: 'TOS', date: '2027-08-03', airline: '', flightNumber: 'DY1', baggage: '', priceStatus: 'prenotato', selected: true, notes: '' }, { id: 'g', direction: 'interno', fromAirport: 'X', toAirport: 'Y', date: '2027-08-03', airline: '', flightNumber: '', baggage: '', priceStatus: 'stimato', selected: false, notes: '' }],
  };
  const v = todayView(t, 2)!;
  assert.equal(v.next?.kind, 'attivita');
  assert.equal(v.next?.title, 'Museo');
  assert.equal(v.transfers[0]!.uncalculated, true, 'tratto non calcolato dichiarato, senza tempi inventati');
  assert.deepEqual(v.bookings.map((b) => [b.kind, b.status]), [['volo', 'prenotato']], 'le alternative non compaiono');
  assert.match(v.bookings[0]!.text, /orario da inserire/);
  assert.deepEqual(v.planB, ['Acquario']);
  const done = setActivityState(t, 'm', 'fatta');
  const v2 = todayView(done, 2)!;
  assert.equal(v2.next?.kind, 'tappa');
  assert.equal(v2.next?.title, 'Bergen');
  assert.equal(todayView(setStopState(done, 'b', 'visitata'), 2)!.next, undefined);
  // Fuori intervallo: si resta entro i limiti
  assert.equal(todayView(t, 99)!.index, days.length - 1);
});
