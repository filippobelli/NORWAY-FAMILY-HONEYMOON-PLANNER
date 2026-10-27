import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeBudget } from '../src/domain/budget';
import { coastalRoute } from '../src/domain/coastal';
import { createEmptyTrip, normalizeTrip } from '../src/domain/defaults';
import { addDays, computeDays, legTotals, moveItem, syncLegs, totalDays, tripWarnings } from '../src/domain/itinerary';
import type { Stop, Trip } from '../src/domain/types';
import { mergeRoutedForTest, stepsToSegments } from './helpers';
import { parseOverpass, externalSearchLinks } from '../src/services/accommodation/search';

const stop = (id: string, nights: number, kind: Stop['kind'] = 'luogo'): Stop => ({
  id,
  kind,
  name: id,
  lat: 60 + nights,
  lng: 6,
  nights,
  notes: '',
  weatherPlanB: '',
});

function tripWith(stops: Stop[]): Trip {
  const t = createEmptyTrip();
  return { ...t, stops, legs: syncLegs(stops, []) };
}

test('giorni = somma notti + 1 e date consecutive', () => {
  const t = tripWith([stop('bergen', 2), stop('flam', 3), stop('geiranger', 0), stop('alesund', 2)]);
  assert.equal(totalDays(t.stops), 8);
  const days = computeDays(t);
  assert.equal(days.length, 8);
  assert.equal(days[0]!.date, '2027-08-01');
  assert.equal(days[7]!.date, '2027-08-08');
  assert.equal(days[0]!.sleepStop?.id, 'bergen');
  assert.equal(days[2]!.sleepStop?.id, 'flam');
  assert.equal(days[2]!.legs.length, 1, 'trasferimento Bergen→Flåm il giorno 3');
  // Geiranger 0 notti: due trasferimenti nello stesso giorno (Flåm→Geiranger→Ålesund)
  assert.equal(days[5]!.legs.length, 2);
  assert.equal(days[5]!.sleepStop?.id, 'alesund');
  assert.equal(days[7]!.sleepStop, undefined);
  assert.ok(days[7]!.isDepartureDay);
});

test('addDays attraversa i mesi', () => {
  assert.equal(addDays('2027-08-30', 3), '2027-09-02');
});

test('syncLegs riusa i tratti calcolati e crea quelli nuovi non calcolati', () => {
  const s = [stop('a', 1), stop('b', 1), stop('c', 1)];
  const legs = syncLegs(s, []);
  assert.equal(legs.length, 2);
  legs[0]!.segments = [{ id: 'x', mode: 'strada', label: 'r', durationMin: 90, distanceKm: 100, status: 'stimato', costStatus: 'da_verificare' }];
  const reordered = moveItem(s, 2, 1); // a, c, b
  const legs2 = syncLegs(reordered, legs);
  assert.equal(legs2.length, 2);
  assert.ok(legs2.every((l) => l.segments[0]!.mode === 'non_calcolato'), 'coppie nuove non calcolate');
  const back = syncLegs(s, legs);
  assert.equal(back[0]!.segments[0]!.mode, 'strada', 'coppia originale riusata');
});

test('legTotals separa strada e traghetto e segnala i parziali', () => {
  const t = legTotals({
    id: 'l',
    fromStopId: 'a',
    toStopId: 'b',
    segments: [
      { id: '1', mode: 'strada', label: 'r', durationMin: 120, distanceKm: 150, status: 'stimato', costStatus: 'da_verificare' },
      { id: '2', mode: 'traghetto', label: 'f', durationMin: 25, distanceKm: 8, waitMin: 30, status: 'stimato', costStatus: 'da_verificare' },
      { id: '3', mode: 'treno', label: 't', status: 'da_verificare', costStatus: 'da_verificare' },
    ],
  });
  assert.equal(t.roadKm, 150, 'i km del traghetto non sono km stradali');
  assert.equal(t.travelMin, 145);
  assert.equal(t.waitMin, 30);
  assert.equal(t.ferryCount, 1);
  assert.equal(t.partial, true);
});

test('avvisi: durata fuori obiettivo, tratti non calcolati, troppi cambi', () => {
  const t = tripWith([stop('a', 1), stop('b', 1), stop('c', 1), stop('d', 1)]);
  const w = tripWarnings(t).map((x) => x.text).join('\n');
  assert.match(w, /dura 5 giorni/);
  assert.match(w, /3 collegamenti non ancora calcolati/);
  assert.match(w, /4 cambi di alloggio consecutivi/);
});

test('giornata pesante oltre soglia', () => {
  const t = tripWith([stop('a', 1), stop('b', 1)]);
  t.legs[0]!.segments = [{ id: 's', mode: 'strada', label: 'r', durationMin: 300, distanceKm: 280, status: 'stimato', costStatus: 'da_verificare' }];
  const days = computeDays(t);
  assert.match(days[1]!.warnings.join(' '), /Giornata pesante/);
});

test('rotta costiera: ordine dei porti e direzione', () => {
  const n = coastalRoute('nord', 'Bergen', 'Ålesund');
  assert.ok(n.valid);
  assert.deepEqual(
    n.ports.map((p) => p.name),
    ['Bergen', 'Florø', 'Måløy', 'Torvik', 'Ålesund'],
  );
  assert.equal(n.intermediateStops, 3);
  assert.equal(coastalRoute('nord', 'Ålesund', 'Bergen').valid, false);
  const s = coastalRoute('sud', 'Kirkenes', 'Vardø');
  assert.ok(s.valid);
  assert.equal(coastalRoute('sud', 'Vadsø', 'Vardø').valid, false, 'Vadsø solo verso nord');
});

test('budget: alloggio scelto × notti, alternative escluse, conversione NOK', () => {
  const t = tripWith([stop('flam', 3)]);
  t.settings.nokPerEur = 10;
  t.accommodations = [
    {
      id: 'h1', name: 'Hytte A', type: 'hytte', locality: 'Flåm', stopId: 'flam', pricePerNight: { amount: 1500, currency: 'NOK' },
      cleaningFee: { amount: 500, currency: 'NOK' }, priceStatus: 'stimato', beds: '', bathroom: 'privato', kitchen: 'si', parking: 'si',
      cancellation: '', status: 'individuata', notes: '',
    },
    {
      id: 'h2', name: 'Hytte B', type: 'hytte', locality: 'Flåm', stopId: 'flam', pricePerNight: { amount: 9999, currency: 'EUR' },
      priceStatus: 'stimato', beds: '', bathroom: 'privato', kitchen: 'si', parking: 'si', cancellation: '', status: 'individuata', notes: '',
    },
  ];
  t.stops[0]!.accommodationId = 'h1';
  t.budgetItems = [{ id: 'v', category: 'voli', label: 'Voli', amount: { amount: 1200, currency: 'EUR' }, status: 'stimato', notes: '' }];
  const b = computeBudget(t);
  assert.equal(b.byCategory.alloggi, 500); // (1500×3 + 500) / 10
  assert.equal(b.byCategory.voli, 1200);
  assert.equal(b.total, 1700);
  assert.equal(b.days, 4);
  assert.equal(b.perDay, 425);
  assert.equal(b.byStatus.stimato, 1700);
});

test('budget: costiera selezionata contata una sola volta anche se collegata a un tratto', () => {
  const t = tripWith([stop('bergen', 1), stop('alesund', 1)]);
  t.coastalOptions = [
    {
      id: 'c1', operator: 'Hurtigruten', direction: 'nord', fromPort: 'Bergen', toPort: 'Ålesund', nightsOnboard: 1, cabin: 'cabina',
      withCar: false, meals: 'nessuno', price: { amount: 800, currency: 'EUR' }, priceStatus: 'da_verificare', childRules: '',
      changePolicy: '', notes: '', selected: true,
    },
  ];
  t.legs[0]!.segments = [
    { id: 's', mode: 'costiera', label: 'HR', coastalOptionId: 'c1', cost: { amount: 800, currency: 'EUR' }, status: 'stimato', costStatus: 'stimato' },
  ];
  assert.equal(computeBudget(t).byCategory.costiera, 800);
});

test('OSRM: gli step di tipo ferry diventano segmenti traghetto separati', () => {
  const segs = stepsToSegments(
    [
      { mode: 'driving', distance: 50000, duration: 3600, geometry: { coordinates: [[6, 61], [6.1, 61.1]] } },
      { mode: 'driving', distance: 10000, duration: 600 },
      { mode: 'ferry', distance: 5000, duration: 1500, name: 'Lavik–Oppedal' },
      { mode: 'driving', distance: 20000, duration: 1200 },
    ],
    '2026-10-27T00:00:00Z',
    'OSRM test',
  );
  assert.deepEqual(
    segs.map((s) => s.mode),
    ['strada', 'traghetto', 'strada'],
  );
  assert.equal(segs[0]!.distanceKm, 60);
  assert.equal(segs[0]!.durationMin, 70);
  assert.deepEqual(segs[0]!.geometry?.[0], [61, 6], 'geometria convertita in [lat, lng]');
  assert.equal(segs[1]!.label, 'Traghetto Lavik–Oppedal');
  assert.equal(segs[1]!.costStatus, 'da_verificare');
});

test('ricalcolo: mantiene i tratti manuali e i dati inseriti sui traghetti', () => {
  const merged = mergeRoutedForTest();
  assert.deepEqual(
    merged.segments.map((s) => s.mode),
    ['strada', 'traghetto', 'treno'],
  );
  assert.equal(merged.segments[1]!.departureTime, '10:30');
});

test('normalizeTrip rifiuta documenti non validi e completa i campi', () => {
  assert.throws(() => normalizeTrip({ foo: 1 }));
  const t = normalizeTrip({ schemaVersion: 1, id: 'x', title: 'T', stops: [] });
  assert.equal(t.settings.maxTravelMinPerDay, 240);
  assert.deepEqual(t.accommodations, []);
});

test('Overpass: scarta elementi senza nome e ordina hytte prima', () => {
  const r = parseOverpass(
    {
      elements: [
        { type: 'node', id: 1, lat: 60.9, lon: 7.1, tags: { tourism: 'camp_site', name: 'Camping' } },
        { type: 'way', id: 2, center: { lat: 60.86, lon: 7.11 }, tags: { tourism: 'chalet', name: 'Hytte' } },
        { type: 'node', id: 3, lat: 60.86, lon: 7.11, tags: { tourism: 'chalet' } },
      ],
    },
    { lat: 60.863, lng: 7.113 },
  );
  assert.deepEqual(
    r.map((x) => x.name),
    ['Hytte', 'Camping'],
  );
  assert.equal(r[0]!.osmId, 'way/2');
});

test('link di ricerca esterni con date e bambini', () => {
  const links = externalSearchLinks('Flåm', '2027-08-03', 2, { adults: 2, childrenAges: [8, 5] });
  const booking = links.find((l) => l.provider === 'Booking.com')!.url;
  assert.match(booking, /checkin=2027-08-03&checkout=2027-08-05/);
  assert.match(booking, /group_children=2&age=8&age=5/);
});
