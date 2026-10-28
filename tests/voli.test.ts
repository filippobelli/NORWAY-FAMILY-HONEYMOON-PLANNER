import assert from 'node:assert/strict';
import { test } from 'node:test';
import { budgetOverlaps, computeBudget } from '../src/domain/budget';
import { createEmptyTrip, normalizeTrip } from '../src/domain/defaults';
import { DEFAULT_HOME_AIRPORTS, flightAdvice } from '../src/domain/flightAdvisor';
import { syncLegs } from '../src/domain/itinerary';
import type { Flight, Segment, Stop, Trip } from '../src/domain/types';
import { flightSearchLinks, openJawLink } from '../src/services/flights/links';

const family = { adults: 2, childrenAges: [8, 5] };
const stop = (id: string, name: string, nights: number, lat: number, lng: number, destinationId?: string): Stop => ({
  id,
  kind: 'luogo',
  name,
  lat,
  lng,
  nights,
  notes: '',
  weatherPlanB: '',
  destinationId,
});
const flight = (p: Partial<Flight>): Flight => ({
  id: 'f',
  direction: 'andata',
  fromAirport: 'BRI',
  toAirport: 'BGO',
  airline: '',
  flightNumber: '',
  baggage: '',
  priceStatus: 'stimato',
  selected: true,
  notes: '',
  ...p,
});

test('Link voli: Kayak con tratta, date e passeggeri; Google con tratta e date', () => {
  const [kayak, google, sky] = flightSearchLinks({ from: 'bri', to: 'BGO', depart: '2027-08-01', ret: '2027-08-18' }, family);
  assert.equal(kayak!.url, 'https://www.kayak.it/flights/BRI-BGO/2027-08-01/2027-08-18/2adults/children-8-5?sort=bestflight_a');
  assert.match(decodeURIComponent(google!.url), /q=Flights from BRI to BGO on 2027-08-01 through 2027-08-18/);
  assert.match(google!.note, /imposta i passeggeri sul sito/);
  assert.match(sky!.url, /\/bri\/bgo\/270801\/270818\/\?adultsv2=2&cabinclass=economy&rtn=1&childrenv2=8%7C5$/);
  const [oneWay] = flightSearchLinks({ from: 'TOS', to: 'BRI', depart: '2027-08-18' }, family);
  assert.equal(oneWay!.url, 'https://www.kayak.it/flights/TOS-BRI/2027-08-18/2adults/children-8-5?sort=bestflight_a');
  const oj = openJawLink({ from: 'BRI', to: 'BGO', depart: '2027-08-01' }, { from: 'TOS', to: 'BRI', depart: '2027-08-18' }, family);
  assert.equal(oj.url, 'https://www.kayak.it/flights/BRI-BGO/2027-08-01/TOS-BRI/2027-08-18/2adults/children-8-5?sort=bestflight_a');
});

test('Consigli voli: itinerario vuoto, aeroporti di casa predefiniti e personalizzati', () => {
  const empty = flightAdvice(createEmptyTrip());
  assert.deepEqual(empty.home, DEFAULT_HOME_AIRPORTS);
  assert.deepEqual(DEFAULT_HOME_AIRPORTS, ['BRI', 'FCO']);
  assert.equal(empty.arrival, undefined);
  const t = createEmptyTrip();
  assert.deepEqual(flightAdvice({ ...t, settings: { ...t.settings, homeAirports: ['FCO'] } }).home, ['FCO']);
});

test('Consigli voli: arrivo sull\'aeroporto se è la prima tappa, altrimenti i più vicini; multi-città se i due estremi differiscono', () => {
  const base = createEmptyTrip();
  const stops = [stop('a', 'Aeroporto Bergen Flesland', 0, 60.293, 5.218, 'bgo'), stop('b', 'Geiranger', 3, 62.1008, 7.2059, 'geiranger'), stop('c', 'Tromsø', 3, 69.6496, 18.956)];
  const trip: Trip = { ...base, startDate: '2027-08-01', stops, legs: syncLegs(stops, []) };
  const a = flightAdvice(trip);
  assert.deepEqual(a.arrival!.options.map((o) => [o.code, o.isStop, o.airKm]), [['BGO', true, 0]]);
  assert.equal(a.arrival!.date, '2027-08-01');
  assert.equal(a.departure!.options[0]!.code, 'TOS');
  assert.ok(a.departure!.options[0]!.airKm < 20);
  assert.equal(a.departure!.date, '2027-08-07', 'ultimo giorno = partenza + notti');
  assert.equal(a.openJaw, true);
  assert.equal(a.legsToCalculate, 2, 'tratti non calcolati: nessun volo interno valutato a occhio');
  assert.deepEqual(a.internal, []);
});

test('Consigli voli: volo interno solo per trasferimenti calcolati oltre il doppio del massimo di guida', () => {
  const base = createEmptyTrip();
  const stops = [stop('a', 'Bergen', 2, 60.3913, 5.3221), stop('b', 'Tromsø', 2, 69.6496, 18.956)];
  const road = (min: number): Segment => ({ id: 'r', mode: 'strada', label: 'Strada', distanceKm: 1500, durationMin: min, status: 'stimato', costStatus: 'da_verificare', source: { label: 'OSRM' } });
  const make = (min: number): Trip => ({ ...base, stops, legs: syncLegs(stops, []).map((l) => ({ ...l, segments: [road(min)] })) });
  const long = flightAdvice(make(1300));
  assert.equal(long.internal.length, 1);
  assert.deepEqual([long.internal[0]!.fromAirport.code, long.internal[0]!.toAirport.code], ['BGO', 'TOS']);
  assert.equal(long.internal[0]!.thresholdMin, 2 * base.settings.maxTravelMinPerDay);
  assert.equal(flightAdvice(make(300)).internal.length, 0, 'sotto la soglia nessun suggerimento');
  // Tratto già previsto in aereo
  const planned: Trip = { ...make(1300), legs: make(1300).legs.map((l) => ({ ...l, segments: [{ id: 'x', mode: 'aereo', label: 'Volo', status: 'da_verificare', costStatus: 'da_verificare' }] })) };
  assert.equal(flightAdvice(planned).internal.length, 0);
  assert.equal(flightAdvice(planned).plannedInternal.length, 1);
});

test('Budget voli: solo i voli inclusi, prezzo mancante non vale zero, doppio conteggio segnalato', () => {
  const t = createEmptyTrip();
  const b = computeBudget({
    ...t,
    flights: [
      flight({ id: 'a', price: { amount: 900, currency: 'EUR' }, priceStatus: 'confermato' }),
      flight({ id: 'b', price: { amount: 700, currency: 'EUR' }, selected: false }),
      flight({ id: 'c', direction: 'ritorno', fromAirport: 'TOS', toAirport: 'BRI' }),
    ],
  });
  assert.equal(b.byCategory.voli, 900, 'l\'alternativa non incluso non è conteggiata');
  assert.equal(b.byStatus.confermato, 900);
  assert.equal(b.missingByCategory.voli, 1);
  assert.ok(b.missing.some((m) => m.startsWith('Prezzo mancante: Volo TOS → BRI')));
  const withManual = computeBudget({
    ...t,
    flights: [flight({ price: { amount: 900, currency: 'EUR' } })],
    budgetItems: [{ id: 'm', category: 'voli', label: 'Voli', amount: { amount: 1000, currency: 'EUR' }, status: 'stimato', notes: '' }],
  });
  assert.equal(withManual.byCategory.voli, 1900, 'nessun importo tolto');
  assert.match(budgetOverlaps(withManual)[0]!.text, /sezione Voli/);
});

test('Compatibilità: viaggio salvato senza voli e voli nel backup JSON', () => {
  const old = JSON.parse(JSON.stringify(createEmptyTrip())) as Partial<Trip>;
  delete old.flights;
  assert.deepEqual(normalizeTrip(old).flights, []);
  const t = { ...createEmptyTrip(), flights: [flight({ price: { amount: 1, currency: 'NOK' } })] };
  assert.deepEqual(normalizeTrip(JSON.parse(JSON.stringify(t))).flights, t.flights);
  // Un viaggio senza voli calcola il budget come prima
  assert.equal(computeBudget(old as Trip).byCategory.voli, 0);
});
