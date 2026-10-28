import assert from 'node:assert/strict';
import { test } from 'node:test';
import { budgetCompleteness, computeBudget } from '../src/domain/budget';
import { createEmptyTrip } from '../src/domain/defaults';
import { syncLegs } from '../src/domain/itinerary';
import { tripOverview } from '../src/domain/overview';
import { scenarioMetrics } from '../src/domain/scenarios';
import type { Accommodation, Segment, Stop, Trip } from '../src/domain/types';

// Fase 4: budget, alloggi e scenari. Solo dati sintetici.

const stop = (id: string, name: string, nights: number, accommodationId?: string): Stop => ({
  id,
  kind: 'luogo',
  name,
  lat: 60,
  lng: 6,
  nights,
  notes: '',
  weatherPlanB: '',
  accommodationId,
});

function base(): Trip {
  const t = { ...createEmptyTrip(), stops: [stop('a', 'Bergen', 2), stop('b', 'Flåm', 2)] };
  return { ...t, legs: syncLegs(t.stops, []) };
}

test('Budget: una voce da 0 € è un dato valido, non una categoria vuota', () => {
  const t = base();
  const key = 'a#0';
  const free: Trip = {
    ...t,
    days: { [key]: { activities: [{ id: 'x', title: 'Parco giochi', cost: { amount: 0, currency: 'EUR' }, costStatus: 'confermato' }], notes: '', planB: '' } },
  };
  const b = computeBudget(free);
  assert.equal(b.byCategory.attrazioni, 0);
  assert.ok(b.lines.some((l) => l.category === 'attrazioni'));
  assert.ok(!b.missing.includes('Nessuna voce per "Attrazioni ed escursioni"'));
  assert.ok(!budgetCompleteness(b).emptyCategories.includes('Attrazioni ed escursioni'));
  // Con voci (anche a 0 €) la media è calcolabile ed è 0: dato reale, non sconosciuto
  assert.equal(b.perDay, 0);
});

test('Budget: senza alcuna voce la media giornaliera non è 0 € ma non calcolabile', () => {
  const b = computeBudget(base());
  assert.equal(b.lines.length, 0);
  assert.ok(b.days > 0);
  assert.equal(b.perDay, undefined);
  assert.equal(tripOverview(base()).budget.perDay, undefined);
});

test('Budget: i costi senza importo sono attribuiti alla loro categoria e non cambiano il totale', () => {
  const t = base();
  const acc: Accommodation = {
    id: 'h',
    name: 'Hytte senza prezzo',
    type: 'hytte',
    locality: '',
    stopId: 'a',
    beds: '',
    priceStatus: 'da_verificare',
    bathroom: 'non_noto',
    kitchen: 'non_noto',
    parking: 'non_noto',
    cancellation: '',
    status: 'individuata',
    notes: '',
  };
  const road: Segment = { id: 'r', mode: 'strada', label: 'Strada', distanceKm: 100, durationMin: 90, status: 'stimato', costStatus: 'da_verificare', source: { label: 'OSRM' } };
  const ferry: Segment = { id: 'f', mode: 'traghetto', label: 'Traghetto X', durationMin: 20, status: 'stimato', costStatus: 'da_verificare' };
  const trip: Trip = {
    ...t,
    stops: [stop('a', 'Bergen', 2, 'h'), stop('b', 'Flåm', 2)],
    accommodations: [acc],
    legs: t.legs.map((l) => ({ ...l, segments: [road, ferry] })),
    settings: { ...t.settings, car: undefined, fuelEurPerKm: undefined },
    budgetItems: [{ id: 'v', category: 'voli', label: 'Voli', amount: { amount: 800, currency: 'EUR' }, status: 'pagato', notes: '' }],
  };
  const b = computeBudget(trip);
  // Alloggi: prezzo mancante a Bergen + alloggio non scelto a Flåm
  assert.deepEqual(b.missingByCategory, { alloggi: 2, traghetti: 1, carburante_pedaggi: 1 });
  assert.ok(b.missing.includes('Alloggio non ancora scelto a Flåm (2 notti)'));
  assert.equal(b.total, 800, 'i costi senza importo non entrano nel totale e non valgono zero altrove');
  assert.equal(b.byCategory.alloggi, 0);
  assert.ok(budgetCompleteness(b).partial);

  // Con una stima per notte, o con voci manuali per gli alloggi, la tappa senza alloggio non è segnalata come sconosciuta
  const withEstimate = computeBudget({ ...trip, settings: { ...trip.settings, estimates: { lodgingPerNight: 150 } } });
  assert.ok(!withEstimate.missing.some((m) => m.startsWith('Alloggio non ancora scelto')));
  const withManual = computeBudget({
    ...trip,
    budgetItems: [...trip.budgetItems, { id: 'm', category: 'alloggi', label: 'Hytte pagata a parte', amount: { amount: 300, currency: 'EUR' }, status: 'pagato', notes: '' }],
  });
  assert.ok(!withManual.missing.some((m) => m.startsWith('Alloggio non ancora scelto')));
});

test('Scenari: trasferimenti contati con le stesse regole (tratti e giornate con spostamento)', () => {
  const t = base();
  const three: Trip = { ...t, stops: [...t.stops, stop('c', 'Geiranger', 1)] };
  const withLegs = { ...three, legs: syncLegs(three.stops, []) };
  const m = scenarioMetrics(withLegs);
  assert.equal(m.transferLegs, 2);
  assert.equal(m.transferDays, 2);
  const empty = scenarioMetrics(createEmptyTrip());
  assert.equal(empty.transferLegs, 0);
  assert.equal(empty.transferDays, 0);
});
