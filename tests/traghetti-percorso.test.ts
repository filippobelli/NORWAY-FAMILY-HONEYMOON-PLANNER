// Traghetti nel percorso: suggerimenti «alternativa all'auto» (solo per id, solo battelli), tratto a sé con attesa
// e orario dell'utente, mai distanza stradale, righe nel Budget, ricerca e filtri dell'elenco.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FERRY_ROUTES } from '../src/data/ferryRoutes';
import type { FerryRoute } from '../src/data/ferryTypes';
import { computeBudget } from '../src/domain/budget';
import { createEmptyTrip } from '../src/domain/defaults';
import {
  applyFerry,
  choiceFromSegment,
  defaultStops,
  ferryCost,
  ferrySegment,
  ferrySuggestions,
  groupByZone,
  hideSuggestion,
  insertRoadParts,
  legDate,
  legHasRoute,
  linkedLegs,
  matchesFerry,
  proposeCar,
  showHiddenSuggestions,
  tripYear,
  zonesOf,
} from '../src/domain/ferries';
import { legTotals, syncLegs } from '../src/domain/itinerary';
import type { Segment, Stop, Trip } from '../src/domain/types';

const route = (key: string): FerryRoute => FERRY_ROUTES.find((x) => x.key === key)!;
const stop = (id: string, dest: string | undefined, nights = 2): Stop => ({ id, kind: 'luogo', name: id, destinationId: dest, lat: 60, lng: 10, nights, notes: '', weatherPlanB: '' });
const road = (id: string): Segment => ({ id, mode: 'strada', label: 'Percorso stradale', distanceKm: 280, durationMin: 330, status: 'stimato', costStatus: 'da_verificare', source: { label: 'OSRM (test)' } });

function trip(dests: (string | undefined)[], withRoad = true): Trip {
  const stops = dests.map((d, i) => stop(`s${i}`, d));
  const legs = syncLegs(stops, []).map((l, i) => (withRoad ? { ...l, segments: [road(`r${i}`)] } : l));
  return { ...createEmptyTrip(), startDate: '2027-08-01', countries: [{ code: 'NO', releaseId: 'NO-2' }], stops, legs };
}

test('Suggerimenti: Bergen → Flåm in auto propone il battello veloce; mai un traghetto per auto; solo per id', () => {
  const t = trip(['bergen', 'flam', 'geiranger']);
  const s = ferrySuggestions(t, FERRY_ROUTES);
  assert.ok(s.some((x) => x.route.key === 'bergen-flam-express' && x.legId === t.legs[0]!.id && !x.reversed));
  assert.ok(s.every((x) => x.route.mode !== 'ferje'), 'i traghetti per auto sono parte della strada');
  assert.ok(s.every((x) => !x.route.roundTrip));
  // Flåm → Geiranger: nessuna tratta collega entrambi gli id
  assert.ok(!s.some((x) => x.legId === t.legs[1]!.id));
  // Eidsdal–Linge è collegata a Geiranger ma è un traghetto per auto: mai suggerita
  const g = ferrySuggestions(trip(['geiranger', 'trollstigen']), FERRY_ROUTES);
  assert.equal(g.length, 0);
});

test('Suggerimenti: verso opposto riconosciuto; senza strada nel collegamento o senza luogo del catalogo nessuna proposta', () => {
  const back = ferrySuggestions(trip(['flam', 'bergen']), FERRY_ROUTES);
  assert.ok(back.some((x) => x.route.key === 'bergen-flam-express' && x.reversed));
  assert.equal(ferrySuggestions(trip(['bergen', 'flam'], false), FERRY_ROUTES).length, 0, 'collegamento non in auto');
  assert.equal(ferrySuggestions(trip(['bergen', undefined]), FERRY_ROUTES).length, 0, 'tappa senza luogo: nessun confronto per distanza');
});

test('Suggerimenti nascosti: «Non mi interessa» salvato nel viaggio e reversibile', () => {
  const t = trip(['bergen', 'flam']);
  const legId = t.legs[0]!.id;
  const hidden = hideSuggestion(t, legId, 'bergen-flam-express');
  assert.ok(!ferrySuggestions(hidden, FERRY_ROUTES).some((x) => x.route.key === 'bergen-flam-express'));
  assert.ok(ferrySuggestions(hidden, FERRY_ROUTES, { includeHidden: true }).some((x) => x.route.key === 'bergen-flam-express'));
  assert.equal(hideSuggestion(hidden, legId, 'bergen-flam-express'), hidden, 'nessun doppione');
  assert.equal(showHiddenSuggestions(hidden).hiddenFerrySuggestions, undefined);
});

test('Tratto traghetto: segmento a sé con durata della tratta, attesa e orario dell\'utente, nessun km, linea solo tra moli NSR', () => {
  const t = trip(['geiranger', 'alesund']);
  const r = route('geiranger-hellesylt');
  const leg = t.legs[0]!;
  assert.ok(proposeCar(r, leg), 'collegamento in auto e tratta che porta l\'auto: proposta con auto');
  const cost = ferryCost({ route: r, participants: t.participants, withCar: true, tripYear: tripYear(t), date: legDate(t, leg) });
  const seg = ferrySegment({ route: r, releaseId: 'NO-2', board: 1, alight: 2, withCar: true, departureTime: '10:00', waitMin: 30 }, cost);
  assert.equal(seg.mode, 'traghetto');
  assert.equal(seg.durationMin, 65);
  assert.equal(seg.waitMin, 30);
  assert.equal(seg.departureTime, '10:00');
  assert.equal(seg.distanceKm, undefined, 'mai distanza stradale per il tratto via mare');
  assert.deepEqual(seg.cost, { amount: 1650, currency: 'NOK' });
  assert.equal(seg.costStatus, 'da_verificare');
  assert.equal(seg.ferryRouteId, 'geiranger-hellesylt');
  assert.equal(seg.withCar, true);
  assert.equal(seg.geometry?.length, 2, 'linea tra i due moli (coordinate NSR)');
  assert.ok(!seg.source?.label.startsWith('OSRM'), 'non è un tratto calcolato: il ricalcolo della strada lo conserva');

  // Lascia la strada: si aggiunge; i km su strada restano quelli della strada
  const kept = applyFerry(t, leg.id, seg, 'lascia');
  const l1 = kept.legs[0]!;
  assert.deepEqual(l1.segments.map((s) => s.mode), ['strada', 'traghetto']);
  assert.equal(legTotals(l1).roadKm, 280);
  assert.equal(legTotals(l1).ferryCount, 1);
  assert.ok(legHasRoute(l1, 'geiranger-hellesylt', 1, 2));
  // Notti e tappe invariate
  assert.deepEqual(kept.stops, t.stops);

  // Ricalcola: via i tratti calcolati, poi la strada fino al molo e dal molo attorno al traghetto
  const re = applyFerry(t, leg.id, seg, 'ricalcola');
  assert.deepEqual(re.legs[0]!.segments.map((s) => s.mode), ['traghetto']);
  const withRoads = insertRoadParts(re.legs[0]!, seg.id, [road('a')], [road('b')]);
  assert.deepEqual(withRoads.segments.map((s) => s.id), ['a', seg.id, 'b']);
});

test('Senza auto: «il traghetto sostituisce la strada»; costo non calcolabile = nessun importo e «prezzo da cercare» nel Budget', () => {
  const t = trip(['bergen', 'flam']);
  const r = route('bergen-flam-express');
  const leg = t.legs[0]!;
  assert.deepEqual(linkedLegs(t, r)[0], { legId: leg.id, both: true });
  assert.deepEqual(defaultStops(r, 'bergen', 'flam'), { board: 1, alight: 14 });
  assert.deepEqual(defaultStops(r, 'flam', 'bergen'), { board: 14, alight: 1 });
  const cost = ferryCost({ route: r, participants: t.participants, withCar: false, tripYear: 2027, date: legDate(t, leg) });
  const seg = ferrySegment({ route: r, releaseId: 'NO-2', board: 1, alight: 14, withCar: false }, cost);
  const next = applyFerry(t, leg.id, seg, 'sostituisci');
  assert.deepEqual(next.legs[0]!.segments.map((s) => s.mode), ['traghetto']);
  assert.equal(seg.costStatus, 'confermato', 'prezzo 2027 per un viaggio 2027');
  const b = computeBudget(next);
  const line = b.lines.find((l) => l.key === `s-${seg.id}`)!;
  assert.equal(line.category, 'traghetti');
  assert.equal(line.origin, 'trasporti');
  assert.match(line.label, /^Traghetto .* · senza auto$/);
  assert.equal(Math.round(line.eur * next.settings.nokPerEur), 3107);
  assert.equal(line.legId, leg.id);

  // Tratta senza prezzo: nessun importo, nessuno zero, voce tra i costi da cercare
  const r2 = route('bodo-svolvaer-express');
  const c2 = ferryCost({ route: r2, participants: t.participants, withCar: false, tripYear: 2027 });
  const s2 = ferrySegment({ route: r2, board: 1, alight: 8, withCar: false }, c2);
  assert.equal(s2.cost, undefined);
  const b2 = computeBudget(applyFerry(t, leg.id, s2, 'lascia'));
  assert.ok(!b2.lines.some((l) => l.key === `s-${s2.id}`));
  assert.ok(b2.missing.includes(`Traghetto ${s2.label}: prezzo da cercare`));
});

test('Passeggeri gratis senza auto: voce a 0 NOK presente nel Budget (non è una dimenticanza)', () => {
  const t = trip(['bergen', 'flam']);
  const r = route('bodo-moskenes');
  const c = ferryCost({ route: r, participants: t.participants, withCar: false, tripYear: 2027 });
  const seg = ferrySegment({ route: r, board: 1, alight: 2, withCar: false }, c);
  assert.deepEqual(seg.cost, { amount: 0, currency: 'NOK' });
  const b = computeBudget(applyFerry(t, t.legs[0]!.id, seg, 'lascia'));
  assert.equal(b.lines.find((l) => l.key === `s-${seg.id}`)?.eur, 0);
});

test('Aggiornare il tratto: stesso id e posto; prezzo inserito a mano vince sul calcolo; «prenotato» non torna indietro', () => {
  const t = trip(['geiranger', 'alesund']);
  const r = route('geiranger-hellesylt');
  const c = ferryCost({ route: r, participants: t.participants, withCar: true, tripYear: 2027 });
  const seg = ferrySegment({ route: r, board: 1, alight: 2, withCar: true }, c);
  const t1 = applyFerry(t, t.legs[0]!.id, seg, 'lascia');
  const paid = { ...seg, costStatus: 'prenotato' as const };
  const c2 = ferryCost({ route: r, participants: t.participants, withCar: false, tripYear: 2027 });
  const upd = ferrySegment({ ...choiceFromSegment(paid, r), withCar: false }, c2, paid);
  assert.equal(upd.id, seg.id);
  assert.equal(upd.costStatus, 'prenotato');
  assert.deepEqual(upd.cost, { amount: 1260, currency: 'NOK' });
  const t2 = applyFerry(t1, t.legs[0]!.id, upd, 'lascia', seg.id);
  assert.equal(t2.legs[0]!.segments.length, 2);
  const manual = ferrySegment({ ...choiceFromSegment(upd, r), manualCost: { amount: 1500, currency: 'NOK' }, manualCostStatus: 'confermato', manualSourceUrl: 'https://example.org' }, c2, upd);
  assert.equal(manual.costByUser, true);
  assert.deepEqual(manual.cost, { amount: 1500, currency: 'NOK' });
  assert.equal(choiceFromSegment(manual, r).manualCost?.amount, 1500);
});

test('Data del collegamento: dalla partenza e dalle notti delle tappe precedenti', () => {
  const t = trip(['bergen', 'flam', 'geiranger']);
  assert.equal(legDate(t, t.legs[0]!), '2027-08-03');
  assert.equal(legDate(t, t.legs[1]!), '2027-08-05');
  assert.equal(tripYear(t), 2027);
});

test('Elenco: ricerca senza accenti, filtri combinabili, zone (Andenes–Gryllefjord in Nordland e Troms)', () => {
  const none = new Set<string>();
  const find = (q: string) => FERRY_ROUTES.filter((r) => matchesFerry(r, { q }, none)).map((r) => r.key);
  assert.ok(find('flam').includes('bergen-flam-express'));
  assert.ok(find('tromso').includes('tromso-harstad-express'));
  assert.ok(find('finnsnes').includes('tromso-harstad-express'), 'cerca anche nelle tappe intermedie');
  const combo = FERRY_ROUTES.filter((r) => matchesFerry(r, { zone: 'Troms', car: 'passeggeri', modes: ['hurtigbat'], withPrice: true }, none));
  assert.ok(combo.length > 0 && combo.every((r) => !r.carriesCar && r.mode === 'hurtigbat' && zonesOf(r).includes('Troms')));
  assert.deepEqual(zonesOf(route('andenes-gryllefjord')), ['Nordland', 'Troms']);
  const linked = FERRY_ROUTES.filter((r) => matchesFerry(r, { linked: true }, new Set(['geiranger'])));
  assert.ok(linked.some((r) => r.key === 'eidsdal-linge'), '«collegata» per id del catalogo, non «tocca»');
  const groups = groupByZone(FERRY_ROUTES, new Set(['geiranger']));
  assert.equal(groups.map((g) => g.zone).join(','), 'Vestland,Rogaland,Møre og Romsdal,Nordland,Troms,Finnmark');
  const more = groups.find((g) => g.zone === 'Møre og Romsdal')!;
  assert.ok(['geiranger-hellesylt', 'eidsdal-linge', 'alesund-geiranger'].includes(more.routes[0]!.key), 'prima le tratte collegate alle tappe');
  assert.equal(new Set(groups.flatMap((g) => g.routes.map((r) => r.key))).size, 58);
});
