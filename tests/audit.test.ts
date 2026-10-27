import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DESTINATIONS } from '../src/data/destinations';
import { COASTAL_PORTS_NORTHBOUND } from '../src/data/coastalPorts';
import { computeBudget } from '../src/domain/budget';
import { applySuggestion, computeDayLoads, levelFor, suggestAlternatives } from '../src/domain/dayLoad';
import { createEmptyTrip, normalizeTrip, validateTripShape } from '../src/domain/defaults';
import {
  accommodationChanges,
  computeDays,
  isRoutableLeg,
  legTotals,
  migrateDayKeys,
  moveItem,
  orphanDayKeys,
  syncLegs,
  totalDays,
  tripWarnings,
} from '../src/domain/itinerary';
import { addScenario, ensureScenarios, scenarioKindNotes, scenarioMetrics, switchScenario, tripForScenario } from '../src/domain/scenarios';
import type { Segment, Stop, Trip } from '../src/domain/types';

const stop = (id: string, nights: number, extra: Partial<Stop> = {}): Stop => ({
  id,
  kind: 'luogo',
  name: id,
  lat: 61,
  lng: 7,
  nights,
  notes: '',
  weatherPlanB: '',
  ...extra,
});
const seg = (p: Partial<Segment>): Segment => ({ id: Math.random().toString(36), mode: 'strada', label: 'x', status: 'stimato', costStatus: 'da_verificare', ...p });
function tripWith(stops: Stop[]): Trip {
  const t = createEmptyTrip();
  return { ...t, stops, legs: syncLegs(stops, []) };
}

// ---------- Giorni, notti, casi limite ----------

test('casi limite: nessuna tappa = 0 giorni; tutte da 0 notti = 1 giorno', () => {
  assert.equal(totalDays([]), 0);
  assert.equal(computeDays(tripWith([])).length, 0);
  const t = tripWith([stop('a', 0), stop('b', 0)]);
  assert.equal(totalDays(t.stops), 1);
  const d = computeDays(t);
  assert.equal(d.length, 1);
  assert.equal(d[0]!.legs.length, 1, 'il tratto a→b cade nell\'unico giorno');
});

test('cambi di alloggio: le soste di passaggio non contano', () => {
  assert.equal(accommodationChanges([stop('osl', 0), stop('a', 3), stop('b', 0), stop('c', 2), stop('osl2', 0)]), 1);
});

test('chiave stabile delle giornate: le attività seguono la tappa quando si riordina', () => {
  let t = tripWith([stop('a', 2), stop('b', 2)]);
  const daysBefore = computeDays(t);
  const keyB0 = daysBefore[2]!.key;
  assert.equal(keyB0, 'b#0');
  t = { ...t, days: { [keyB0]: { activities: [{ id: 'x', title: 'Fiordo', costStatus: 'stimato' }], notes: '', planB: '' } } };
  const reordered = { ...t, stops: moveItem(t.stops, 1, 0) };
  const daysAfter = computeDays({ ...reordered, legs: syncLegs(reordered.stops, reordered.legs) });
  assert.equal(daysAfter[0]!.key, 'b#0', 'ora b è la prima tappa');
  assert.equal(reordered.days[daysAfter[0]!.key]!.activities[0]!.title, 'Fiordo');
});

test('migrazione delle vecchie chiavi numeriche e giornate orfane', () => {
  const t = tripWith([stop('a', 2), stop('b', 1)]);
  const old = { ...t, days: { '0': { activities: [{ id: '1', title: 'A0', costStatus: 'stimato' as const }], notes: '', planB: '' }, '9': { activities: [{ id: '2', title: 'perso', costStatus: 'stimato' as const }], notes: '', planB: '' } } };
  const m = migrateDayKeys(old);
  assert.equal(m.days['a#0']!.activities[0]!.title, 'A0');
  assert.ok(m.days['orfana-9'], 'la giornata senza corrispondenza non viene persa');
  assert.deepEqual(orphanDayKeys(m), ['orfana-9']);
});

test('budget: le attività di giornate orfane non sono conteggiate ma segnalate', () => {
  const t = tripWith([stop('a', 1)]);
  t.days = {
    'a#0': { activities: [{ id: '1', title: 'Museo', cost: { amount: 40, currency: 'EUR' }, costStatus: 'stimato' }], notes: '', planB: '' },
    'zzz#0': { activities: [{ id: '2', title: 'Vecchio', cost: { amount: 500, currency: 'EUR' }, costStatus: 'stimato' }], notes: '', planB: '' },
  };
  const b = computeBudget(t);
  assert.equal(b.byCategory.attrazioni, 40);
  assert.ok(b.missing.some((m) => m.includes('non più presenti')));
});

// ---------- Tempi teorici e realistici ----------

test('durata realistica: soste ogni 2 ore e attesa ipotizzata al traghetto', () => {
  const t = legTotals(
    {
      id: 'l',
      fromStopId: 'a',
      toStopId: 'b',
      segments: [seg({ mode: 'strada', durationMin: 250, distanceKm: 200 }), seg({ mode: 'traghetto', durationMin: 20, source: { label: 'OSRM' } })],
    },
    { breakEveryMin: 120, breakMin: 20, defaultFerryWaitMin: 30 },
  );
  assert.equal(t.travelMin, 270);
  assert.equal(t.breakMin, 40, '250 min di guida → 2 soste da 20');
  assert.equal(t.estimatedWaitMin, 30);
  assert.equal(t.realisticMin, 340);
  assert.equal(t.unverifiedCrossings, 1);
});

test('attesa inserita dall\'utente sostituisce quella ipotizzata', () => {
  const t = legTotals({ id: 'l', fromStopId: 'a', toStopId: 'b', segments: [seg({ mode: 'traghetto', durationMin: 20, waitMin: 10, status: 'confermato' })] }, {});
  assert.equal(t.estimatedWaitMin, 0);
  assert.equal(t.realisticMin, 30);
  assert.equal(t.unverifiedCrossings, 0);
});

test('segnala strada + treno nello stesso tratto e traghetti doppi', () => {
  const t = legTotals({
    id: 'l',
    fromStopId: 'a',
    toStopId: 'b',
    segments: [
      seg({ mode: 'strada', durationMin: 60, source: { label: 'OSRM' } }),
      seg({ mode: 'treno', durationMin: 120 }),
      seg({ mode: 'traghetto', durationMin: 20, source: { label: 'OSRM' } }),
      seg({ mode: 'traghetto', durationMin: 20 }),
    ],
  });
  assert.ok(t.mixedModes);
  assert.ok(t.possibleDuplicateFerry);
  const w = tripWarnings({ ...tripWith([stop('a', 1), stop('b', 1)]), legs: [{ id: 'l', fromStopId: 'a', toStopId: 'b', segments: [seg({ mode: 'strada' }), seg({ mode: 'treno' })] }] });
  assert.ok(w.some((x) => /in sequenza/.test(x.text)));
});

test('i tratti verso una notte a bordo non sono calcolabili su strada', () => {
  const stops = [stop('bergen', 1), stop('nave', 1, { kind: 'a_bordo' }), stop('alesund', 1)];
  const legs = syncLegs(stops, []);
  assert.equal(isRoutableLeg(legs[0]!, stops), false);
  assert.equal(isRoutableLeg(legs[1]!, stops), false);
  const w = tripWarnings({ ...tripWith(stops), legs });
  assert.ok(w.some((x) => /notti a bordo/.test(x.text)));
});

test('la giornata pesante usa la durata realistica', () => {
  const t = tripWith([stop('a', 1), stop('b', 1)]);
  t.legs[0]!.segments = [seg({ mode: 'strada', durationMin: 220 })]; // teorici 3h40 < 4h, realistici 4h00 (1 sosta)
  t.settings.maxTravelMinPerDay = 230;
  const d = computeDays(t)[1]!;
  assert.equal(d.travelMin, 220);
  assert.equal(d.realisticTravelMin, 240);
  assert.ok(d.warnings.some((w) => /Giornata pesante/.test(w)));
});

test('avvisi: alloggio con meno posti della famiglia; notti a bordo escluse dai cambi', () => {
  const t = tripWith([stop('a', 1, { accommodationId: 'h' }), stop('n', 1, { kind: 'a_bordo' }), stop('b', 1), stop('c', 2)]);
  t.accommodations = [
    { id: 'h', name: 'Piccola', type: 'hytte', locality: '', capacity: 3, priceStatus: 'stimato', beds: '', bathroom: 'privato', kitchen: 'si', parking: 'si', cancellation: '', status: 'individuata', notes: '' },
  ];
  const w = tripWarnings(t).map((x) => x.text).join('\n');
  assert.match(w, /meno posti letto delle 4 persone/);
  assert.doesNotMatch(w, /cambi di alloggio consecutivi/);
});

// ---------- Carico delle giornate e proposte ----------

test('livelli di carico', () => {
  assert.equal(levelFor(0.5), 'leggera');
  assert.equal(levelFor(0.75), 'equilibrata');
  assert.equal(levelFor(1), 'piena');
  assert.equal(levelFor(1.2), 'eccessiva');
});

test('carico: durata dal catalogo come stima, attività senza durata contate a parte', () => {
  const t = tripWith([stop('flam', 2)]);
  t.days = { 'flam#0': { activities: [{ id: '1', title: 'Treno', destinationId: 'flamsbana', costStatus: 'stimato' }, { id: '2', title: 'Giro', costStatus: 'stimato' }], notes: '', planB: '' } };
  const l = computeDayLoads(t)[0]!;
  assert.equal(l.visitsMin, 120, 'Flåmsbana: 2 ore dal catalogo');
  assert.equal(l.estimatedVisits, 1);
  assert.equal(l.unknownVisits, 1);
  assert.equal(l.totalMin, 210 + Math.round(210 * 0.15));
});

test('proposte: due giornate pesanti di fila → aggiungi una notte; applicarla è una scelta esplicita', () => {
  const t = tripWith([stop('a', 1), stop('b', 1), stop('c', 1)]);
  t.legs[0]!.segments = [seg({ mode: 'strada', durationMin: 420 })];
  t.legs[1]!.segments = [seg({ mode: 'strada', durationMin: 420 })];
  const sgs = suggestAlternatives(t);
  const rest = sgs.find((s) => s.action?.type === 'add_night');
  assert.ok(rest, 'proposta di giorno di riposo');
  assert.equal(t.stops.find((s) => s.id === 'c')!.nights, 1, 'il viaggio non viene modificato dalla proposta');
  const applied = applySuggestion(t, rest!.action!);
  assert.equal(applied.stops.find((s) => s.id === (rest!.action as { stopId: string }).stopId)!.nights, 2);
});

test('proposte: tappa intermedia lungo il percorso calcolato', () => {
  const t = tripWith([stop('bergen', 1, { lat: 60.39, lng: 5.32 }), stop('geiranger', 1, { lat: 62.1, lng: 7.2 })]);
  // tracciato finto che passa vicino a Flåm (60.863, 7.113)
  const geometry: [number, number][] = Array.from({ length: 21 }, (_, i) => [60.39 + (60.86 - 60.39) * Math.min(1, i / 10) + (i > 10 ? (i - 10) * 0.12 : 0), 5.32 + (7.11 - 5.32) * Math.min(1, i / 10)]);
  t.legs[0]!.segments = [seg({ mode: 'strada', durationMin: 480, geometry })];
  const sgs = suggestAlternatives(t);
  const ins = sgs.find((s) => s.action?.type === 'insert_stop');
  assert.ok(ins, 'proposta di tappa intermedia');
  const applied = applySuggestion(t, ins!.action!);
  assert.equal(applied.stops.length, 3);
  assert.equal(applied.stops[1]!.nights, 1);
});

test('proposte: sposta un\'attività in un giorno leggero nella stessa località', () => {
  const t = tripWith([stop('flam', 3)]);
  t.days = {
    'flam#0': {
      activities: [
        { id: 'x', title: 'Escursione lunga', durationMin: 420, costStatus: 'stimato' },
        { id: 'y', title: 'Museo', durationMin: 120, costStatus: 'stimato' },
      ],
      notes: '',
      planB: '',
    },
  };
  const mv = suggestAlternatives(t).find((s) => s.action?.type === 'move_activity');
  assert.ok(mv);
  const applied = applySuggestion(t, mv!.action!);
  assert.equal(applied.days['flam#0']!.activities.length, 1);
  assert.ok(Object.entries(applied.days).some(([k, v]) => k !== 'flam#0' && v.activities.some((a) => a.id === 'x')));
});

// ---------- Scenari ----------

test('scenari: crea copia, cambia scenario, i piani restano separati', () => {
  let t = ensureScenarios(tripWith([stop('a', 3), stop('b', 2)]));
  const mainId = t.activeScenarioId!;
  t = addScenario(t, 'Costiera', 'auto_traghetti_costiera', 'copia');
  const altId = t.scenarios!.find((s) => s.id !== mainId)!.id;
  t = switchScenario(t, altId);
  assert.equal(t.activeScenarioId, altId);
  t = { ...t, stops: [...t.stops, stop('c', 4)] };
  t = { ...t, legs: syncLegs(t.stops, t.legs) };
  t = switchScenario(t, mainId);
  assert.equal(t.stops.length, 2, 'lo scenario principale non vede la tappa aggiunta');
  const alt = tripForScenario(t, altId);
  assert.equal(alt.stops.length, 3);
  assert.equal(scenarioMetrics(alt).days, 10);
  assert.equal(scenarioMetrics(t).days, 6);
});

test('scenari: la selezione delle opzioni costiere è per scenario', () => {
  let t = ensureScenarios(tripWith([stop('a', 1)]));
  t.coastalOptions = [
    { id: 'c1', operator: 'Havila', direction: 'nord', fromPort: 'Bergen', toPort: 'Ålesund', nightsOnboard: 1, cabin: 'cabina', withCar: false, meals: 'nessuno', price: { amount: 700, currency: 'EUR' }, priceStatus: 'stimato', childRules: '', changePolicy: '', notes: '', selected: false },
  ];
  const mainId = t.activeScenarioId!;
  t = addScenario(t, 'Con nave', 'auto_traghetti_costiera', 'copia');
  const altId = t.scenarios!.find((s) => s.id !== mainId)!.id;
  t = switchScenario(t, altId);
  t = { ...t, coastalOptions: t.coastalOptions.map((o) => ({ ...o, selected: true })) };
  assert.equal(computeBudget(t).byCategory.costiera, 700);
  t = switchScenario(t, mainId);
  assert.equal(computeBudget(t).byCategory.costiera, 0);
  assert.equal(computeBudget(tripForScenario(t, altId)).byCategory.costiera, 700);
});

test('scenari: segnala incoerenze tra tipo e contenuto', () => {
  const m = scenarioMetrics(tripWith([stop('a', 1), stop('b', 1)]));
  assert.ok(scenarioKindNotes('auto_traghetti_costiera', m).length > 0);
  assert.ok(scenarioKindNotes('misto_treni', m).length > 0);
  assert.ok(m.toVerify.some((x) => /non calcolati/.test(x)));
});

// ---------- Import e dati ----------

test('import: rifiuta documenti con tappe o importi non validi', () => {
  assert.ok(validateTripShape({ id: 'x', stops: [{ id: 's', lat: 'abc' } as unknown as Stop] }).length > 0);
  assert.throws(() => normalizeTrip({ schemaVersion: 1, id: 'x', stops: [{ id: 's', lat: 61, lng: 7, nights: -2 }] }), /notti/);
  assert.throws(() => normalizeTrip({ schemaVersion: 1, id: 'x', budgetItems: [{ amount: { amount: 'tanto' } }] }), /importo/);
  const ok = normalizeTrip({ schemaVersion: 1, id: 'x', stops: [] });
  assert.ok(ok.activeScenarioId, 'scenario principale creato al caricamento');
});

test('catalogo: identificativi unici, coordinate in Norvegia, fonti per le coordinate verificate', () => {
  const ids = new Set(DESTINATIONS.map((d) => d.id));
  assert.equal(ids.size, DESTINATIONS.length);
  for (const d of [...DESTINATIONS, ...COASTAL_PORTS_NORTHBOUND]) {
    assert.ok(d.lat > 57.9 && d.lat < 71.3 && d.lng > 4.4 && d.lng < 31.3, `fuori dalla Norvegia: ${'name' in d ? d.name : ''}`);
  }
  for (const d of DESTINATIONS.filter((x) => x.coordsStatus === 'verificate')) {
    assert.match(d.sources[0]?.url ?? '', /^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/);
  }
  assert.ok(DESTINATIONS.filter((x) => x.coordsStatus === 'verificate').length >= 60);
});
