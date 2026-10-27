import assert from 'node:assert/strict';
import { test } from 'node:test';
import { capStatus, computeBudget, formatPeriod, fuelCostPerKm } from '../src/domain/budget';
import { configureItinerary, orderBases, railFor, scenarioKindFor, type ConfiguratorInput } from '../src/domain/configurator';
import { createEmptyTrip } from '../src/domain/defaults';
import { computeDays, totalDays } from '../src/domain/itinerary';
import { addScenarioWithPlan } from '../src/domain/scenarios';
import { parseNorgesBank, parseSsbFuel } from '../src/services/rates';

const base: ConfiguratorInput = {
  days: 18,
  startDate: '2027-08-01',
  arrivalAirportId: 'bgo',
  departureAirportId: 'bgo',
  modes: ['auto'],
  pace: 'equilibrato',
  maxDriveHours: 4,
  regions: ['Fiordi occidentali'],
  mustSee: ['geirangerfjord', 'flamsbana'],
  kidFriendly: true,
};

test('Configuratore: giorni esatti, aeroporti agli estremi, scelte incluse', () => {
  const r = configureItinerary(base);
  const stops = r.plan.stops;
  assert.equal(totalDays(stops), 18);
  assert.equal(stops[0]?.destinationId, 'bgo');
  assert.equal(stops[stops.length - 1]?.destinationId, 'bgo');
  assert.equal(stops[0]?.nights, 0);
  assert.ok(stops.some((s) => s.destinationId === 'geiranger'), 'Geiranger come base per il Geirangerfjord');
  assert.ok(stops.some((s) => s.destinationId === 'flam'), 'Flåm come base per la Flåmsbana');
  const acts = Object.values(r.plan.days).flatMap((d) => d.activities.map((a) => a.destinationId));
  assert.ok(acts.includes('geirangerfjord') && acts.includes('flamsbana'));
  // Le attività stanno in giornate esistenti
  const live = new Set(computeDays({ ...createEmptyTrip(), ...r.plan }).map((d) => d.key));
  for (const k of Object.keys(r.plan.days)) assert.ok(live.has(k), k);
  // Nessun dato inventato: niente costi né durate sui tratti
  assert.ok(r.plan.legs.every((l) => l.segments.every((s) => !s.cost && !s.distanceKm)));
});

test('Configuratore: ritmo tranquillo = almeno 3 notti per tappa, niente attività poco adatte se escluse', () => {
  const r = configureItinerary({ ...base, pace: 'tranquillo', mustSee: [] });
  for (const s of r.plan.stops.filter((x) => x.kind === 'luogo' && x.nights > 0)) {
    const intermedia = r.notes.some((n) => n.includes(`Aggiunta ${s.name} come tappa intermedia`));
    assert.ok(intermedia || s.nights >= 3, `${s.name} ${s.nights}`);
  }
  const acts = Object.values(r.plan.days).flatMap((d) => d.activities.map((a) => a.destinationId));
  assert.ok(!acts.includes('trolltunga') && !acts.includes('preikestolen'));
});

test('Configuratore: con navigazione costiera i tratti lunghi lungo la costa diventano notti a bordo', () => {
  const r = configureItinerary({ ...base, days: 20, arrivalAirportId: 'osl', departureAirportId: 'tos', modes: ['auto', 'nave'], regions: ['Fiordi occidentali', 'Nordland e Lofoten'], mustSee: ['reine'] });
  assert.equal(totalDays(r.plan.stops), 20);
  assert.ok(r.plan.stops.some((s) => s.kind === 'a_bordo'));
  assert.ok(r.plan.legs.some((l) => l.segments.some((s) => s.mode === 'costiera' && s.status === 'da_verificare')));
});

test('Configuratore: lo scenario nuovo diventa attivo e quello vecchio resta salvato', () => {
  const t0 = createEmptyTrip();
  const r = configureItinerary(base);
  const t1 = addScenarioWithPlan(t0, 'Prova', 'auto_hytte', r.plan);
  assert.equal(t1.scenarios?.length, 2);
  assert.equal(t1.stops.length, r.plan.stops.length);
  assert.ok(t1.scenarios?.find((s) => s.id !== t1.activeScenarioId)?.plan, 'piano precedente salvato');
});

test('Ordine delle basi: niente zig-zag', () => {
  const pts = [
    { id: 'c', lat: 62, lng: 6 },
    { id: 'a', lat: 60, lng: 6 },
    { id: 'b', lat: 61, lng: 6 },
  ];
  assert.deepEqual(orderBases({ lat: 59, lng: 6 }, { lat: 63, lng: 6 }, pts).map((p) => p.id), ['a', 'b', 'c']);
});

test('Carburante: consumo × prezzo medio / cambio', () => {
  const t = createEmptyTrip();
  const s = { ...t.settings, nokPerEur: 10, car: { fuel: 'benzina' as const, consumption: 7, priceNok: 20, priceAuto: true, pricePeriod: '2026M09' } };
  const f = fuelCostPerKm(s);
  assert.ok(f && Math.abs(f.eurPerKm - 0.14) < 1e-9);
  assert.match(f!.basis, /set 2026/);
  assert.equal(fuelCostPerKm({ ...s, car: { ...s.car, priceNok: undefined } }), undefined);
  assert.equal(formatPeriod('2026M09'), 'set 2026');
});

test('Budget: stime solo dove mancano dati, tetto superato segnalato', () => {
  const t = createEmptyTrip();
  const trip = {
    ...t,
    stops: [
      { id: 'a', kind: 'luogo' as const, name: 'A', lat: 60, lng: 5, nights: 3, notes: '', weatherPlanB: '' },
      { id: 'b', kind: 'luogo' as const, name: 'B', lat: 61, lng: 6, nights: 2, notes: '', weatherPlanB: '' },
    ],
    budgetItems: [{ id: 'x', category: 'pasti' as const, label: 'Spesa', amount: { amount: 100, currency: 'EUR' as const }, status: 'stimato' as const, notes: '' }],
    settings: { ...t.settings, estimates: { lodgingPerNight: 150, foodPerDay: 80, contingencyPct: 10 } },
  };
  const b = computeBudget(trip);
  assert.equal(b.lines.filter((l) => l.origin === 'stime' && l.category === 'alloggi').reduce((s, l) => s + l.eur, 0), 750);
  assert.ok(!b.lines.some((l) => l.key === 'e-food'), 'pasti già presenti: niente stima');
  const extra = b.lines.find((l) => l.key === 'e-extra');
  assert.equal(extra?.eur, 85);
  const cs = capStatus(900, b.total);
  assert.ok(cs?.over && Math.round(cs.left) === -35);
});

test('Fonti: parsing Norges Bank e SSB', () => {
  const nb = parseNorgesBank({
    data: { dataSets: [{ series: { '0:0:0:0': { observations: { '0': ['10.3885'] } } } }], structure: { dimensions: { observation: [{ values: [{ id: '2026-10-27' }] }] } } },
  });
  assert.deepEqual(nb, { nokPerEur: 10.3885, date: '2026-10-27', source: 'Norges Bank' });
  const f = parseSsbFuel({ value: [21.1, 22.2, null], dimension: { Tid: { category: { index: { '2026M07': 0, '2026M08': 1, '2026M09': 2 } } } } });
  assert.equal(f?.nokPerLitre, 22.2);
  assert.equal(f?.period, '2026M08');
});

test('Configuratore: mezzi a scelta libera', () => {
  // Solo treno e bus, senza auto: Oslo–Bergen in treno, nessun tratto stradale da calcolare
  const r = configureItinerary({ ...base, arrivalAirportId: 'osl', departureAirportId: 'bgo', modes: ['treno', 'bus'], regions: ['Oslo e Østlandet', 'Fiordi occidentali'], mustSee: ['flamsbana'] });
  const segs = r.plan.legs.flatMap((l) => l.segments);
  assert.ok(segs.every((s) => s.mode !== 'non_calcolato'), 'senza auto non restano tratti stradali');
  assert.ok(segs.some((s) => s.mode === 'treno'));
  assert.ok(segs.every((s) => s.status === 'da_verificare'));
  // Auto + volo: il tratto lunghissimo verso le Lofoten diventa un volo interno
  const v = configureItinerary({ ...base, days: 18, arrivalAirportId: 'bgo', departureAirportId: 'eve', pace: 'intenso', maxDriveHours: 5, modes: ['auto', 'volo'], regions: ['Fiordi occidentali', 'Trøndelag', 'Nordland e Lofoten'], mustSee: [] });
  assert.ok(v.plan.legs.some((l) => l.segments.some((s) => s.mode === 'aereo')));
  assert.equal(railFor('oslo', 'bergen')?.label, railFor('bergen', 'oslo')?.label);
  assert.equal(scenarioKindFor(['auto']), 'auto_hytte');
  assert.equal(scenarioKindFor(['auto', 'nave']), 'auto_traghetti_costiera');
  assert.equal(scenarioKindFor(['treno', 'bus']), 'misto_treni');
});
