import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeBudget } from '../src/domain/budget';
import { createEmptyTrip } from '../src/domain/defaults';
import { computeDays, legTotals, syncLegs, totalDays } from '../src/domain/itinerary';
import {
  cruiseChoices,
  cruiseInRoute,
  cruiseOverlap,
  cutIndex,
  defaultInsertIndex,
  flightIssues,
  flightPending,
  insertStop,
  pendingPlacements,
  placeCruise,
  placeFlight,
  removeCruise,
  routeDiff,
} from '../src/domain/placement';
import { addScenario, addScenarioWithPlan, ensureScenarios, switchScenario } from '../src/domain/scenarios';
import type { CoastalOption, Flight, Segment, Stop, Trip } from '../src/domain/types';

const stop = (id: string, name: string, nights: number, lat = 61, lng = 7, destinationId?: string): Stop => ({ id, kind: 'luogo', name, lat, lng, nights, notes: '', weatherPlanB: '', destinationId });
const road: Segment = { id: 'r', mode: 'strada', label: 'Strada', distanceKm: 100, durationMin: 120, status: 'stimato', costStatus: 'da_verificare', source: { label: 'OSRM' } };

function tripWith(stops: Stop[], extra: Partial<Trip> = {}): Trip {
  const base = createEmptyTrip();
  return { ...base, startDate: '2027-08-01', stops, legs: syncLegs(stops, []).map((l) => ({ ...l, segments: [road] })), ...extra };
}
const cruise = (p: Partial<CoastalOption> = {}): CoastalOption => ({
  id: 'c1',
  operator: 'Havila',
  direction: 'nord',
  fromPort: 'Bergen',
  toPort: 'Trondheim',
  nightsOnboard: 2,
  cabin: '',
  withCar: false,
  meals: 'da_definire',
  priceStatus: 'stimato',
  childRules: '',
  changePolicy: '',
  notes: '',
  selected: false,
  ...p,
});
const flight = (p: Partial<Flight> = {}): Flight => ({
  id: 'f1',
  direction: 'andata',
  fromAirport: 'BRI',
  toAirport: 'BGO',
  date: '2027-08-01',
  airline: '',
  flightNumber: '',
  baggage: '',
  priceStatus: 'stimato',
  selected: false,
  notes: '',
  ...p,
});

// A(3) B(2) C(3) + aeroporto finale: notti 0-2, 3-4, 5-7
const route = () => [stop('a', 'Oslo', 3, 59.91, 10.75), stop('b', 'Geiranger', 2, 62.1, 7.2), stop('c', 'Tromsø', 3, 69.65, 18.96), stop('z', 'Aeroporto Tromsø', 0, 69.68, 18.92, 'tos')];

test('Posizione: non spezza una tappa, gli aeroporti finali restano in fondo', () => {
  const s = route();
  assert.equal(cutIndex(s, 0), 0);
  assert.equal(cutIndex(s, 3), 1);
  assert.equal(cutIndex(s, 4), 2, 'a metà di una tappa si passa alla fine');
  assert.equal(cutIndex(s, 8), 3, 'prima dell\'aeroporto finale');
  assert.equal(defaultInsertIndex(s), 3);
  assert.equal(cutIndex([stop('ap', 'Aeroporto', 0), stop('b', 'B', 2)], 0), 1, 'l\'aeroporto iniziale resta prima');
  assert.equal(defaultInsertIndex([]), 0);
});

test('Crociera: sovrapposizioni e scelte possibili', () => {
  const t = tripWith(route());
  assert.deepEqual(cruiseOverlap(t.stops, 4, 2).map((o) => [o.stop.name, o.nights]), [['Geiranger', 1], ['Tromsø', 1]]);
  assert.deepEqual(cruiseOverlap(t.stops, 8, 2), []);
  assert.deepEqual(cruiseChoices(t, 4, 2).map((c) => c.mode), ['sostituisci', 'allunga', 'accorcia']);
  assert.deepEqual(cruiseChoices(t, 8, 2).map((c) => c.mode), ['allunga'], 'in fondo non c\'è nulla da decidere');
  const tight = tripWith([stop('a', 'A', 1), stop('b', 'B', 1)]);
  assert.match(cruiseChoices(tight, 0, 1).find((c) => c.mode === 'accorcia')!.disabled ?? '', /solo 0 notti/);
});

test('Crociera: «allunga» aggiunge porti, notti a bordo e giorni senza togliere nulla', () => {
  const t = tripWith(route(), { coastalOptions: [cruise()] });
  const r = placeCruise(t, cruise(), { day: 3, nights: 2, mode: 'allunga', car: 'a_bordo' })!;
  assert.deepEqual(r.stops.map((s) => [s.name, s.nights]), [['Oslo', 3], ['Bergen', 0], ['Notti a bordo (Bergen → Trondheim)', 2], ['Trondheim', 0], ['Geiranger', 2], ['Tromsø', 3], ['Aeroporto Tromsø', 0]]);
  assert.equal(totalDays(r.stops), totalDays(t.stops) + 2);
  assert.equal(cruiseInRoute(r, 'c1'), true);
  const o = r.coastalOptions[0]!;
  assert.equal(o.selected, true);
  assert.equal(o.date, '2027-08-04');
  assert.equal(o.withCar, true);
  assert.equal(pendingPlacements(r).cruises.length, 0);
  // I tratti verso e dalla nave sono solo in nave; quelli verso i porti restano da calcolare
  const ship = r.stops[2]!;
  assert.deepEqual(r.legs.find((l) => l.toStopId === ship.id)!.segments.map((s) => s.mode), ['costiera']);
  assert.deepEqual(r.legs.find((l) => l.fromStopId === ship.id)!.segments.map((s) => s.mode), ['costiera']);
  assert.equal(legTotals(r.legs.find((l) => l.toStopId === r.stops[1]!.id)!).hasUncalculated, true);
  // Le notti a bordo non contano come trasferimento della giornata
  assert.equal(computeDays(r)[3]!.travelMin, 0);
  // Il costo resta uno solo
  const priced = cruise({ price: { amount: 1000, currency: 'EUR' } });
  const b = computeBudget(placeCruise({ ...t, coastalOptions: [priced] }, priced, { day: 3, nights: 2, mode: 'allunga', car: 'a_terra' })!);
  assert.equal(b.byCategory.costiera, 1000);
});

test('Crociera: «sostituisci» toglie solo le notti sovrapposte e la durata non cambia', () => {
  const stops = route();
  const t = tripWith(stops, { accommodations: [{ id: 'h', name: 'H', type: 'hytte', locality: '', priceStatus: 'stimato', beds: '', bathroom: 'non_noto', kitchen: 'non_noto', parking: 'non_noto', cancellation: '', status: 'individuata', stopId: 'b', notes: '' }] });
  const r = placeCruise(t, cruise(), { day: 3, nights: 3, mode: 'sostituisci', car: 'da_decidere' })!;
  assert.deepEqual(r.stops.map((s) => [s.name, s.nights]), [['Oslo', 3], ['Bergen', 0], ['Notti a bordo (Bergen → Trondheim)', 3], ['Trondheim', 0], ['Tromsø', 2], ['Aeroporto Tromsø', 0]]);
  assert.equal(totalDays(r.stops), totalDays(t.stops));
  assert.equal(r.accommodations[0]!.stopId, undefined, 'l\'alloggio della tappa tolta resta ma scollegato');
  const d = routeDiff(t, r);
  assert.deepEqual(d.removed, [{ name: 'Geiranger', nights: 2 }]);
  assert.equal(d.rows.find((x) => x.name === 'Tromsø')!.fromNights, 3);
  assert.equal(d.daysAfter, d.daysBefore);
});

test('Crociera: tappa a cavallo divisa in due, «accorcia» tiene tutte le tappe', () => {
  const t = tripWith([stop('a', 'Oslo', 5, 59.91, 10.75), stop('b', 'Molde', 2, 62.7, 7.1)]);
  const split = placeCruise(t, cruise(), { day: 1, nights: 2, mode: 'sostituisci', car: 'da_decidere' })!;
  assert.deepEqual(split.stops.map((s) => [s.name, s.nights]).filter(([, n]) => (n as number) > 0), [['Oslo', 1], ['Notti a bordo (Bergen → Trondheim)', 2], ['Oslo', 2], ['Molde', 2]]);
  assert.equal(new Set(split.stops.map((s) => s.id)).size, split.stops.length, 'id diversi');
  const short = placeCruise(t, cruise(), { day: 5, nights: 2, mode: 'accorcia', car: 'da_decidere' })!;
  assert.equal(totalDays(short.stops), totalDays(t.stops));
  assert.ok(['Oslo', 'Molde'].every((n) => short.stops.some((s) => s.name === n)));
});

test('Crociera: porti già presenti non si duplicano; una crociera senza notti sostituisce il tratto stradale', () => {
  const t = tripWith([stop('a', 'Bergen', 2, 60.39, 5.32), stop('b', 'Trondheim', 2, 63.43, 10.4)]);
  const r = placeCruise(t, cruise(), { day: 2, nights: 0, mode: 'allunga', car: 'a_bordo' })!;
  assert.deepEqual(r.stops.map((s) => s.name), ['Bergen', 'Trondheim']);
  assert.deepEqual(r.legs[0]!.segments.map((s) => s.mode), ['costiera']);
  assert.equal(totalDays(r.stops), totalDays(t.stops));
});

test('Crociera: annullabile dal percorso, porto sconosciuto rifiutato, percorso vuoto gestito', () => {
  const t = tripWith(route());
  const r = placeCruise(t, cruise(), { day: 3, nights: 2, mode: 'allunga', car: 'a_bordo' })!;
  const back = removeCruise(r, 'c1');
  assert.deepEqual(back.stops.map((s) => s.name), t.stops.map((s) => s.name));
  assert.equal(cruiseInRoute(back, 'c1'), false);
  assert.equal(placeCruise(t, cruise({ fromPort: 'Oslo' }), { day: 3, nights: 2, mode: 'allunga', car: 'a_bordo' }), undefined);
  const empty = placeCruise(tripWith([]), cruise(), { day: 0, nights: 2, mode: 'allunga', car: 'a_bordo' })!;
  assert.deepEqual(empty.stops.map((s) => s.name), ['Bergen', 'Notti a bordo (Bergen → Trondheim)', 'Trondheim']);
});

test('Volo di andata: data e aeroporto diversi vengono chiesti, nessuna scelta silenziosa', () => {
  const f = flight({ date: '2027-08-03', priceStatus: 'prenotato' });
  const t = tripWith(route(), { flights: [f] });
  const issues = flightIssues(t, f);
  assert.deepEqual(issues.map((i) => i.id), ['date_start', 'airport_first']);
  const moved = placeFlight(t, f, { date_start: 'sposta', airport_first: 'aggiungi' });
  assert.equal(moved.startDate, '2027-08-03');
  assert.equal(moved.dateTentative, false, 'con un volo prenotato le date sono decise');
  assert.equal(moved.stops[0]!.destinationId, 'bgo');
  assert.equal(moved.stops[0]!.nights, 0);
  assert.equal(flightPending(moved, moved.flights![0]!), false);
  // «Lascia così» resta, senza richiederlo; se poi cambia la data si richiede
  const kept = placeFlight(t, f, { date_start: 'tieni', airport_first: 'tieni' });
  assert.equal(kept.startDate, '2027-08-01');
  assert.equal(flightPending(kept, kept.flights![0]!), false);
  assert.equal(flightPending({ ...kept, startDate: '2027-08-02' }, kept.flights![0]!), true);
});

test('Volo di ritorno: allunga o accorcia per far coincidere la fine del viaggio', () => {
  const stops = route();
  const later = flight({ direction: 'ritorno', fromAirport: 'TOS', toAirport: 'BRI', date: '2027-08-11' });
  const t = tripWith(stops, { flights: [later] });
  assert.deepEqual(flightIssues(t, later).map((i) => i.id), ['date_end'], 'aeroporto già ultima tappa');
  const longer = placeFlight(t, later, { date_end: 'allunga' });
  assert.equal(longer.stops.find((s) => s.name === 'Tromsø')!.nights, 5);
  const earlier = flight({ direction: 'ritorno', fromAirport: 'TOS', toAirport: 'BRI', date: '2027-08-07' });
  const shorter = placeFlight({ ...t, flights: [earlier] }, earlier, { date_end: 'accorcia' });
  assert.equal(totalDays(shorter.stops), totalDays(t.stops) - 2);
  assert.equal(flightPending(shorter, shorter.flights![0]!), false);
  assert.match(flightIssues(t, flight({ direction: 'ritorno', fromAirport: 'XXX', toAirport: 'BRI', date: '2027-08-09' }))[0]!.options[0]!.disabled ?? '', /catalogo/);
});

test('Volo interno: sostituisce il tratto scelto senza contare due volte il costo', () => {
  const f = flight({ direction: 'interno', fromAirport: 'BGO', toAirport: 'TOS', date: '2027-08-06', departureTime: '10:00', arrivalTime: '12:30', price: { amount: 500, currency: 'EUR' } });
  const t = tripWith([stop('a', 'Bergen', 5, 60.39, 5.32), stop('b', 'Tromsø', 3, 69.65, 18.96)], { flights: [f] });
  const q = flightIssues(t, f)[0]!;
  assert.equal(q.options[0]!.label, 'Bergen → Tromsø');
  assert.equal(flightPending(t, f), true);
  const r = placeFlight(t, f, { tratto: q.options[0]!.id });
  assert.deepEqual(r.legs[0]!.segments.map((s) => [s.mode, s.durationMin]), [['aereo', 150]]);
  assert.equal(flightPending(r, r.flights![0]!), false);
  assert.equal(computeBudget(r).byCategory.voli, 500);
});

test('Da collocare: solo ciò che è scelto e non ancora nel percorso', () => {
  const inBudget = cruise({ selected: true });
  const alt = cruise({ id: 'c2', selected: false });
  const t = tripWith(route(), { coastalOptions: [inBudget, alt], flights: [flight({ selected: true }), flight({ id: 'f2', selected: false })] });
  const p = pendingPlacements(t);
  assert.deepEqual(p.cruises.map((c) => c.id), ['c1']);
  assert.deepEqual(p.flights.map((f) => f.id), ['f1']);
});

test('Meta dal catalogo: va nella posizione scelta, non dopo l\'aeroporto di ritorno', () => {
  const t = tripWith(route());
  const r = insertStop(t, stop('n', 'Ålesund', 2), defaultInsertIndex(t.stops));
  assert.deepEqual(r.stops.map((s) => s.name), ['Oslo', 'Geiranger', 'Tromsø', 'Ålesund', 'Aeroporto Tromsø']);
});

test('Versioni: ogni versione ha i suoi voli; i piani salvati prima tengono quelli attuali', () => {
  const t = ensureScenarios(tripWith(route(), { flights: [flight()] }));
  const b = addScenario(t, 'B', 'altro', 'copia');
  const bId = b.scenarios![1]!.id;
  const inB = switchScenario(b, bId);
  assert.equal(inB.flights!.length, 1);
  const edited = { ...inB, flights: [...inB.flights!, flight({ id: 'f2' })] };
  const backA = switchScenario(edited, t.activeScenarioId!);
  assert.deepEqual(backA.flights!.map((f) => f.id), ['f1']);
  assert.deepEqual(switchScenario(backA, bId).flights!.map((f) => f.id), ['f1', 'f2']);
  const empty = addScenario(t, 'V', 'altro', 'vuoto');
  assert.deepEqual(switchScenario(empty, empty.scenarios![1]!.id).flights, []);
  const legacy = addScenarioWithPlan(t, 'L', 'altro', { startDate: t.startDate, stops: [], legs: [], days: {}, budgetItems: [], coastalSelected: [] });
  assert.deepEqual(legacy.flights!.map((f) => f.id), ['f1']);
});
