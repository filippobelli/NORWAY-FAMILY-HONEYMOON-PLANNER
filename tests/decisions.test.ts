import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BUDGET_CATEGORIES, budgetCompleteness, budgetOverlaps, computeBudget } from '../src/domain/budget';
import { createEmptyTrip } from '../src/domain/defaults';
import { syncLegs } from '../src/domain/itinerary';
import { lodgingComparison } from '../src/domain/lodging';
import { tripOverview } from '../src/domain/overview';
import { addScenario, comparability, ensureScenarios, scenarioMetrics, tripForScenario } from '../src/domain/scenarios';
import type { Accommodation, BudgetItem, Stop, Trip } from '../src/domain/types';

const stop = (id: string, name: string, nights: number, lat = 60, lng = 6): Stop => ({ id, kind: 'luogo', name, lat, lng, nights, notes: '', weatherPlanB: '' });
const acc = (p: Partial<Accommodation> & Pick<Accommodation, 'id' | 'name'>): Accommodation => ({
  type: 'hytte',
  locality: '',
  priceStatus: 'stimato',
  beds: '',
  bathroom: 'non_noto',
  kitchen: 'non_noto',
  parking: 'non_noto',
  cancellation: '',
  status: 'individuata',
  notes: '',
  ...p,
});
const item = (category: BudgetItem['category'], amount: number, status: BudgetItem['status'] = 'stimato'): BudgetItem => ({
  id: `b-${category}`,
  category,
  label: category,
  amount: { amount, currency: 'EUR' },
  status,
  notes: '',
});

/** Viaggio con tratti calcolati e una voce per ogni categoria di spesa: costi «completi». */
function completeTrip(nightsA: number): Trip {
  const base = createEmptyTrip();
  const stops = [stop('a', 'Bergen', nightsA), stop('b', 'Flåm', 2)];
  const legs = syncLegs(stops, []).map((l) => ({
    ...l,
    segments: [{ id: 'r', mode: 'strada' as const, label: 'Strada', distanceKm: 170, durationMin: 170, status: 'stimato' as const, costStatus: 'da_verificare' as const, source: { label: 'OSRM' } }],
  }));
  return {
    ...base,
    stops,
    legs,
    budgetItems: BUDGET_CATEGORIES.map((c) => item(c.id, 100)),
    settings: { ...base.settings, car: undefined, fuelEurPerKm: 0.2 },
  };
}

test('Scenario con dati completi: totale non parziale e costo al giorno calcolabile', () => {
  const m = scenarioMetrics(completeTrip(3));
  assert.equal(m.costPartial, false);
  assert.equal(m.completeness.level, 'completo');
  assert.deepEqual(m.completeness.needs, []);
  assert.equal(m.days, 6);
  assert.ok(m.costPerDay !== undefined && Math.abs(m.costPerDay - m.costTotal / 6) < 1e-9);
});

test('Scenario con costi mancanti: totale parziale, niente costo al giorno, elenco di cosa serve', () => {
  const t = completeTrip(3);
  const withFerry: Trip = {
    ...t,
    legs: t.legs.map((l) => ({ ...l, segments: [...l.segments, { id: 'f', mode: 'traghetto' as const, label: 'Traghetto X', durationMin: 20, status: 'stimato' as const, costStatus: 'da_verificare' as const }] })),
  };
  const m = scenarioMetrics(withFerry);
  assert.equal(m.costPartial, true);
  assert.equal(m.costPerDay, undefined);
  assert.equal(m.completeness.level, 'parziale');
  assert.ok(m.missingCosts.some((x) => x.includes('Traghetto X')), 'il traghetto senza prezzo non vale zero');
  assert.ok(m.completeness.needs.some((x) => x.startsWith('Inserire 1 prezzo mancante')));
});

test('Confronto: con durate diverse il costo totale non indica un migliore, il costo al giorno sì', () => {
  const a = scenarioMetrics(completeTrip(3));
  const b = scenarioMetrics(completeTrip(5));
  assert.notEqual(a.days, b.days);
  assert.equal(comparability('costi_stessa_durata', [a, b]).ok, false);
  assert.match(comparability('costi_stessa_durata', [a, b]).reason ?? '', /durate diverse/);
  assert.equal(comparability('costi', [a, b]).ok, true);
  // Uno scenario con costi parziali blocca ogni confronto di costo
  const partial = scenarioMetrics({ ...completeTrip(3), budgetItems: [] });
  assert.equal(comparability('costi', [a, partial]).ok, false);
  // Un solo scenario con itinerario: nessun confronto
  assert.equal(comparability('nessuno', [a, scenarioMetrics(createEmptyTrip())]).ok, false);
});

test('Scenari: calcolare il confronto non modifica il viaggio attivo', () => {
  const t = addScenario(ensureScenarios(completeTrip(3)), 'Vuoto', 'altro', 'vuoto');
  const before = JSON.stringify(t);
  for (const s of t.scenarios!) scenarioMetrics(tripForScenario(t, s.id));
  assert.equal(JSON.stringify(t), before);
  const empty = t.scenarios!.find((s) => s.name === 'Vuoto')!;
  assert.equal(scenarioMetrics(tripForScenario(t, empty.id)).completeness.level, 'vuoto');
});

test('Alloggi: totale soggiorno da prezzo per notte × notti + extra, differenza rispetto alla scelta', () => {
  const base = createEmptyTrip();
  const t: Trip = {
    ...base,
    stops: [{ ...stop('a', 'Flåm', 3, 60.86, 7.11), accommodationId: 'h1' }, stop('b', 'Geiranger', 2)],
    accommodations: [
      acc({ id: 'h1', name: 'Scelta', stopId: 'a', pricePerNight: { amount: 100, currency: 'EUR' }, cleaningFee: { amount: 50, currency: 'EUR' }, capacity: 4, status: 'disponibile', lat: 60.87, lng: 7.12, url: 'https://example.org' }),
      acc({ id: 'h2', name: 'Alternativa', stopId: 'a', pricePerNight: { amount: 120, currency: 'EUR' }, capacity: 3 }),
      acc({ id: 'h3', name: 'Senza prezzo', stopId: 'a' }),
    ],
  };
  const before = JSON.stringify(t);
  const [flam, geiranger] = lodgingComparison(t);
  assert.equal(flam!.options[0]!.acc.id, 'h1', 'la scelta è in testa');
  const [h1, h2, h3] = flam!.options;
  assert.equal(h1!.stayEur, 350);
  assert.equal(h1!.decision, 'scelta', 'scelto non vuol dire prenotato');
  assert.equal(h1!.fitsFamily, true);
  assert.ok(h1!.airKmFromStop !== undefined && h1!.airKmFromStop < 2);
  assert.equal(h2!.stayEur, 360);
  assert.equal(h2!.diffVsChosenEur, 10);
  assert.equal(h2!.fitsFamily, false);
  assert.equal(h3!.stayEur, undefined);
  assert.equal(h3!.fitsFamily, undefined, 'capienza non inserita: non si presume');
  assert.ok(h3!.missing.includes('prezzo per notte') && h3!.missing.includes('posti letto') && h3!.missing.includes('disponibilità per le date'));
  assert.equal(h3!.decision, 'da_verificare');
  assert.equal(geiranger!.toSearch, true);
  assert.equal(JSON.stringify(t), before, 'nessuna scelta automatica');
});

test('Budget: totale parziale, stati separati e doppi conteggi solo segnalati', () => {
  const base = createEmptyTrip();
  const t: Trip = {
    ...base,
    stops: [{ ...stop('a', 'Flåm', 2), accommodationId: 'h1' }],
    accommodations: [acc({ id: 'h1', name: 'Hytte', stopId: 'a', pricePerNight: { amount: 100, currency: 'EUR' }, status: 'prenotata' })],
    budgetItems: [item('alloggi', 500, 'confermato'), item('voli', 900, 'pagato'), item('pasti', 300, 'stimato')],
  };
  const b = computeBudget(t);
  assert.equal(b.total, 500 + 900 + 300 + 200, 'nessun importo tolto o corretto');
  assert.equal(b.byStatus.stimato, 300);
  assert.equal(b.byStatus.prenotato, 200);
  const c = budgetCompleteness(b);
  assert.equal(c.partial, true);
  assert.ok(c.emptyCategories.length > 0);
  const o = budgetOverlaps(b);
  assert.equal(o.length, 1);
  assert.equal(o[0]!.category, 'alloggi');
  // Stato vuoto
  const e = computeBudget(createEmptyTrip());
  assert.equal(budgetCompleteness(e).partial, true);
  assert.deepEqual(budgetOverlaps(e), []);
});

test('Decisioni: dipendenze indicative, verifica disponibilità e prenotazioni con date provvisorie', () => {
  const base = createEmptyTrip();
  const t: Trip = {
    ...base,
    stops: [
      { ...stop('a', 'Bergen', 2), accommodationId: 'h1' },
      { ...stop('b', 'Flåm', 2), accommodationId: 'h2' },
    ],
    accommodations: [acc({ id: 'h1', name: 'Scelta non verificata', stopId: 'a' }), acc({ id: 'h2', name: 'Prenotata', stopId: 'b', status: 'prenotata' })],
  };
  const o = tripOverview({ ...t, legs: syncLegs(t.stops, []) });
  const step = (id: string) => o.steps.find((s) => s.id === id)!;
  assert.deepEqual(
    o.steps.map((s) => s.id),
    ['date', 'tappe', 'collegamenti', 'alloggi', 'budget', 'verifiche', 'prenotazioni'],
  );
  assert.equal(step('alloggi').state, 'fatto');
  assert.equal(step('prenotazioni').state, 'in_corso', 'una sola prenotata');
  assert.ok(step('prenotazioni').waitsFor.includes('Periodo del viaggio'));
  assert.ok(step('budget').waitsFor.includes('Trasporti calcolati'));
  assert.deepEqual(step('date').waitsFor, []);
  const ids = o.actions.map((a) => a.id);
  assert.ok(ids.includes('booked-tentative') && ids.includes('availability'));
  assert.ok(!ids.includes('beds'), 'decisione già presa: non è urgente');
  const ranks = o.actions.map((a) => ({ alta: 0, media: 1, bassa: 2 })[a.priority]);
  assert.deepEqual(ranks, [...ranks].sort((x, y) => x - y));
});

test('Stato vuoto: nessun confronto alloggi e nessuna dipendenza inventata per le decisioni senza prerequisiti', () => {
  const e = createEmptyTrip();
  assert.deepEqual(lodgingComparison(e), []);
  const o = tripOverview(e);
  assert.deepEqual(o.steps.find((s) => s.id === 'tappe')!.waitsFor, []);
});
