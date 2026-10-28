import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeDayLoads, loadFactors } from '../src/domain/dayLoad';
import { createEmptyTrip } from '../src/domain/defaults';
import { computeDays, syncLegs } from '../src/domain/itinerary';
import { tripOverview } from '../src/domain/overview';
import type { Stop, Trip } from '../src/domain/types';

const stop = (id: string, name: string, nights: number, kind: Stop['kind'] = 'luogo'): Stop => ({ id, kind, name, lat: 60, lng: 6, nights, notes: '', weatherPlanB: '' });

function tripWith(stops: Stop[], patch: Partial<Trip> = {}): Trip {
  const t = { ...createEmptyTrip(), stops, ...patch };
  return { ...t, legs: syncLegs(t.stops, t.legs) };
}

test('Panoramica: itinerario vuoto → periodo da definire e prima azione sul configuratore', () => {
  const o = tripOverview(createEmptyTrip());
  assert.equal(o.period, undefined);
  assert.equal(o.days, 0);
  assert.equal(o.actions[0]?.href, '#/configuratore');
  assert.ok(o.steps.every((s) => s.state === 'da_fare'));
  assert.equal(o.budget.total, 0);
});

test('Panoramica: periodo, notti, tratti non calcolati e alloggi derivati dal viaggio', () => {
  const t = tripWith([stop('a', 'Bergen', 3), stop('b', 'Flåm', 2), stop('c', 'Geiranger', 0)], { startDate: '2027-08-03', dateTentative: false });
  const o = tripOverview(t);
  assert.deepEqual(o.period, { start: '2027-08-03', end: '2027-08-08', tentative: false });
  assert.equal(o.days, 6);
  assert.equal(o.nights, 5);
  assert.equal(o.sleepStops, 2);
  assert.equal(o.inTarget, false);
  assert.deepEqual(
    o.uncalculatedLegs.map((l) => `${l.from}>${l.to}`),
    ['Bergen>Flåm', 'Flåm>Geiranger'],
  );
  // Solo le tappe con pernottamento contano per gli alloggi; nessuno scelto
  assert.equal(o.lodging.length, 2);
  assert.ok(o.lodging.every((l) => !l.accommodation));
  assert.equal(o.steps.find((s) => s.id === 'date')?.state, 'fatto');
  assert.equal(o.steps.find((s) => s.id === 'collegamenti')?.detail, '0 di 2 tratti');
  const ids = o.actions.map((a) => a.id);
  assert.ok(ids.includes('length') && ids.includes('legs') && ids.includes('beds'));
  assert.ok(!ids.includes('dates'));
  // Le azioni ad alta priorità vengono prima
  const firstLow = ids.findIndex((id) => o.actions.find((a) => a.id === id)?.priority !== 'alta');
  assert.ok(o.actions.slice(firstLow).every((a) => a.priority !== 'alta'));
});

test('Panoramica: traversate non confermate, nave da collegare e budget certo/stimato separati', () => {
  const base = tripWith([stop('a', 'Bodø', 1), stop('s', 'Notte a bordo', 1, 'a_bordo'), stop('b', 'Tromsø', 1)]);
  const legs = base.legs.map((l, i) =>
    i === 0
      ? l
      : {
          ...l,
          segments: [
            { id: 'f', mode: 'traghetto' as const, label: 'Traghetto test', durationMin: 30, status: 'stimato' as const, costStatus: 'da_verificare' as const },
          ],
        },
  );
  const t: Trip = {
    ...base,
    legs,
    budgetItems: [
      { id: 'v', category: 'voli', label: 'Voli', amount: { amount: 1000, currency: 'EUR' }, status: 'pagato', notes: '' },
      { id: 'p', category: 'pasti', label: 'Pasti', amount: { amount: 500, currency: 'EUR' }, status: 'stimato', notes: '' },
    ],
  };
  const o = tripOverview(t);
  assert.equal(o.shipLegsMissing.length, 1, 'tratto verso la notte a bordo senza nave');
  assert.equal(o.uncalculatedLegs.length, 0, 'la notte a bordo non è un tratto stradale da calcolare');
  assert.equal(o.unverifiedCrossings.length, 1);
  assert.equal(o.budget.firm, 1000);
  assert.equal(o.budget.estimated, 500);
  // Le notti a bordo non chiedono un alloggio
  assert.deepEqual(
    o.lodging.map((l) => l.stopName),
    ['Bodø', 'Tromsø'],
  );
  // Il traghetto senza costo compare tra i costi non quantificati (non come zero)
  assert.ok(o.budget.missingPrices.some((m) => m.includes('Traghetto test')));
});

test('Carico: i fattori spiegano trasferimento oltre soglia, cambio alloggio e tratti non calcolati', () => {
  const base = tripWith([stop('a', 'Bergen', 1), stop('b', 'Ålesund', 2)]);
  const legs = base.legs.map((l) => ({
    ...l,
    segments: [{ id: 'r', mode: 'strada' as const, label: 'Strada', distanceKm: 400, durationMin: 400, status: 'stimato' as const, costStatus: 'da_verificare' as const, source: { label: 'OSRM' } }],
  }));
  const t: Trip = { ...base, legs };
  const days = computeDays(t);
  const loads = computeDayLoads(t, days);
  const f = loadFactors(t, days[1]!, loads[1]!);
  assert.ok(f.some((x) => x.strong && x.text.includes('oltre la soglia')));
  assert.ok(f.some((x) => x.text.startsWith('Cambio di alloggio: da Bergen a Ålesund')));

  const f0 = loadFactors(base, computeDays(base)[1]!, computeDayLoads(base)[1]!);
  assert.ok(f0.some((x) => x.strong && x.text.startsWith('Tratti non calcolati')));
  // Giornata senza trasferimenti: nessun fattore inventato
  assert.deepEqual(loadFactors(t, days[2]!, loads[2]!), []);
});
