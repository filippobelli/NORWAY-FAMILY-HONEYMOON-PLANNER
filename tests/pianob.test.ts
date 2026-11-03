import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDiaryEntry, newDiaryEntry, restorePlanOnly, setStopState, stopState, visibleDiary } from '../src/domain/actuals';
import { createEmptyTrip } from '../src/domain/defaults';
import { computeDays, syncLegs, totalDays } from '../src/domain/itinerary';
import { applyVersion, draftMoveStop, draftRemoveStop, draftSetNights, planImpact, previewVersion, saveAlternative, undoVersion } from '../src/domain/planImpact';
import { ensureScenarios } from '../src/domain/scenarios';
import type { Accommodation, Flight, Stop, Trip } from '../src/domain/types';

const stop = (id: string, name: string, nights: number, accommodationId?: string): Stop => ({ id, kind: 'luogo', name, lat: 60 + nights, lng: 7, nights, notes: '', weatherPlanB: '', accommodationId });
const acc = (p: Partial<Accommodation>): Accommodation => ({ id: 'h', name: 'Hytte', type: 'hytte', locality: '', pricePerNight: { amount: 100, currency: 'EUR' }, priceStatus: 'stimato', beds: '', bathroom: 'non_noto', kitchen: 'non_noto', parking: 'non_noto', cancellation: '', status: 'individuata', notes: '', ...p });
const flight = (p: Partial<Flight>): Flight => ({ id: 'f', direction: 'ritorno', fromAirport: 'TOS', toAirport: 'BRI', date: '2027-08-07', airline: '', flightNumber: '', baggage: '', priceStatus: 'pagato', selected: true, notes: '', ...p });

function base(extra: Partial<Trip> = {}): Trip {
  const stops = [stop('a', 'Oslo', 2), stop('b', 'Bergen', 2), stop('c', 'Tromsø', 2)];
  return ensureScenarios({ ...createEmptyTrip(), startDate: '2027-08-01', stops, legs: syncLegs(stops, []), ...extra });
}

test('Bozza: salta tappa, sposta, notti; il viaggio originale resta intatto', () => {
  const t = base();
  const snapshot = JSON.stringify(t);
  const moved = draftRemoveStop(t, 'b', 'alla_precedente');
  assert.deepEqual(moved.stops.map((s) => [s.name, s.nights]), [['Oslo', 4], ['Tromsø', 2]]);
  assert.equal(totalDays(moved.stops), totalDays(t.stops));
  const shorter = draftRemoveStop(t, 'b', 'togli');
  assert.equal(totalDays(shorter.stops), totalDays(t.stops) - 2);
  assert.deepEqual(draftMoveStop(t, 'a', 1).stops.map((s) => s.id), ['b', 'a', 'c']);
  assert.equal(draftMoveStop(t, 'a', -1), t, 'oltre il limite non cambia nulla');
  assert.equal(draftSetNights(t, 'a', 3).stops[0]!.nights, 3);
  assert.equal(JSON.stringify(t), snapshot, 'una proposta non modifica il viaggio');
});

test('Impatto: tappe, ordine, date, notti, attività non assegnate, tempi e budget', () => {
  const t0 = base();
  const day = computeDays(t0).find((d) => d.sleepStop?.id === 'b')!;
  const t: Trip = { ...t0, days: { [day.key]: { activities: [{ id: 'x', title: 'Fløibanen', cost: { amount: 50, currency: 'EUR' }, costStatus: 'stimato' }], notes: '', planB: '' } } };
  const i = planImpact(t, draftRemoveStop(t, 'b', 'togli'));
  assert.deepEqual(i.route.removed, [{ name: 'Bergen', nights: 2 }]);
  assert.equal(i.orderChanged, false);
  assert.deepEqual(i.nights, { before: 6, after: 4 });
  assert.equal(i.end.before, '2027-08-07');
  assert.equal(i.end.after, '2027-08-05');
  assert.deepEqual(i.unassigned, ['Fløibanen']);
  assert.equal(i.budget.before - i.budget.after, 50);
  assert.deepEqual(i.budget.rows.map((r) => [r.category, r.before, r.after]).filter(([c]) => String(c).startsWith('Attrazioni')), [['Attrazioni ed escursioni', 50, 0]]);
  assert.equal(i.times.complete, false, 'tratti non calcolati: tempi dichiarati parziali');
  assert.match(i.missing.join(), /non (è calcolato|sono calcolati)/);
  assert.equal(i.needsBookingConfirm, false);
  assert.equal(planImpact(t, draftMoveStop(t, 'a', 1)).orderChanged, true);
});

test('Impatto su una prenotazione: conferma richiesta per alloggi, voli e costi', () => {
  const stops = [stop('a', 'Oslo', 2), stop('b', 'Bergen', 2, 'h'), stop('c', 'Tromsø', 2)];
  const t = base({ stops, legs: syncLegs(stops, []), accommodations: [acc({ stopId: 'b', status: 'prenotata' })], flights: [flight({})], budgetItems: [{ id: 'm', category: 'attrazioni', label: 'Biglietti', amount: { amount: 10, currency: 'EUR' }, status: 'pagato', notes: '' }] });
  assert.equal(planImpact(t, t).needsBookingConfirm, false, 'senza cambiamenti nessuna conferma');
  const removed = planImpact(t, draftRemoveStop(t, 'b', 'alla_precedente'));
  assert.equal(removed.needsBookingConfirm, true);
  assert.deepEqual(removed.booked.map((b) => [b.kind, b.effect]), [['alloggio', 'tappa tolta dal percorso']]);
  const shifted = planImpact(t, draftSetNights(t, 'a', 3));
  assert.deepEqual(shifted.booked.map((b) => b.kind).sort(), ['alloggio', 'volo'], 'l\'arrivo slitta e il volo non coincide più');
  assert.match(shifted.booked.find((b) => b.kind === 'alloggio')!.effect, /arrivo dal/);
  assert.match(shifted.booked.find((b) => b.kind === 'volo')!.effect, /finirebbe il/);
  const nights = planImpact(t, draftSetNights(t, 'b', 1));
  assert.match(nights.booked.find((b) => b.kind === 'alloggio')!.effect, /notti da 2 a 1/);
  // Una versione vuota: voli e costi pagati non ci sono
  const empty: Trip = { ...t, stops: [], legs: [], flights: [], budgetItems: [] };
  assert.deepEqual(planImpact(t, empty).booked.map((b) => b.kind).sort(), ['alloggio', 'costo', 'volo']);
});

test('Salva, applica e annulla: solo su conferma, senza toccare diario e stati di visita', () => {
  let t = base({ flights: [flight({ priceStatus: 'stimato' })] });
  const e = newDiaryEntry({ text: 'Ricordo', stop: { id: 'b', name: 'Bergen' } });
  t = setStopState(addDiaryEntry(t, e), 'b', 'visitata');
  const originalStops = t.stops;
  const draft = draftRemoveStop(t, 'b', 'togli');
  const saved = saveAlternative(t, 'Pioggia', draft);
  assert.deepEqual(saved.trip.stops, originalStops, 'salvare non applica');
  assert.equal(saved.trip.activeScenarioId, t.activeScenarioId);
  assert.deepEqual(previewVersion(saved.trip, saved.id).stops.map((s) => s.id), ['a', 'c']);
  const from = saved.trip.activeScenarioId!;
  const applied = applyVersion(saved.trip, saved.id, 'Pioggia', '2027-08-02T00:00:00Z');
  assert.deepEqual(applied.stops.map((s) => s.id), ['a', 'c']);
  assert.equal(applied.planLog!.length, 1);
  assert.deepEqual(visibleDiary(applied), [e], 'il diario non cambia');
  assert.equal(stopState(applied, 'b'), 'visitata', 'lo stato resta anche se la tappa è fuori dal piano');
  // Il diario scritto dopo l'applicazione sopravvive all'annullamento
  const e2 = newDiaryEntry({ text: 'Dopo' });
  const later = addDiaryEntry(applied, e2);
  const undone = undoVersion(later, from, 'Pioggia');
  assert.deepEqual(undone.stops.map((s) => s.id), ['a', 'b', 'c']);
  assert.equal(visibleDiary(undone).length, 2);
  assert.equal(undone.planLog!.length, 2);
  assert.match(undone.planLog![1]!.label, /Annullato/);
  assert.deepEqual(undone.flights, t.flights);
  // Un'alternativa già salvata non si perde dopo l'annullamento
  assert.ok(undone.scenarios!.some((s) => s.id === saved.id));
});

test('Undo delle proposte e degli inserimenti: ripristina il piano, non il diario', () => {
  const t = base();
  const prev = t;
  const changed = addDiaryEntry(setStopState(draftSetNights(t, 'a', 5), 'a', 'in_corso'), newDiaryEntry({ text: 'Scritta dopo' }));
  const r = restorePlanOnly(changed, prev);
  assert.equal(r.stops[0]!.nights, 2);
  assert.equal(visibleDiary(r).length, 1);
  assert.equal(stopState(r, 'a'), 'in_corso');
});
