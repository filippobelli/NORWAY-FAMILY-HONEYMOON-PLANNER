import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bookingsOverview } from '../src/domain/bookings';
import { configureItinerary, type ConfiguratorInput } from '../src/domain/configurator';
import { createEmptyTrip } from '../src/domain/defaults';
import { syncLegs } from '../src/domain/itinerary';
import { planStep, tripOverview } from '../src/domain/overview';
import { applyVersion, planImpact, saveAlternative, undoVersion } from '../src/domain/planImpact';
import { reviewProposal } from '../src/domain/proposal';
import { addScenarioWithPlan, ensureScenarios } from '../src/domain/scenarios';
import type { Accommodation, Flight, Leg, Stop, Trip } from '../src/domain/types';
import { parseRoute, placeOf } from '../src/state/route';
import { syncView } from '../src/state/syncLabel';

const stop = (id: string, name: string, nights: number, kind: Stop['kind'] = 'luogo', lat = 60, lng = 6): Stop => ({ id, kind, name, lat, lng, nights, notes: '', weatherPlanB: '' });

function tripWith(stops: Stop[], patch: Partial<Trip> = {}): Trip {
  const t = { ...createEmptyTrip(), stops, ...patch };
  return { ...t, legs: syncLegs(t.stops, t.legs) };
}

const road = (minutes: number): Leg['segments'][number] => ({ id: `r${minutes}`, mode: 'strada', label: 'Percorso stradale', distanceKm: minutes, durationMin: minutes, status: 'stimato', costStatus: 'da_verificare', source: { label: 'OSRM' } });
const acc = (p: Partial<Accommodation>): Accommodation => ({ id: 'h', name: 'Hytte', type: 'hytte', locality: '', priceStatus: 'stimato', beds: '', bathroom: 'non_noto', kitchen: 'non_noto', parking: 'non_noto', cancellation: '', status: 'individuata', notes: '', ...p });
const flight = (p: Partial<Flight>): Flight => ({ id: 'f', direction: 'andata', fromAirport: 'BRI', toAirport: 'BGO', airline: '', flightNumber: '', baggage: '', priceStatus: 'stimato', selected: true, notes: '', ...p });

// ---------- Prossimo passo ----------

test('Viaggio vuoto: una sola azione iniziale, con la costruzione manuale come alternativa', () => {
  const o = tripOverview(createEmptyTrip());
  assert.equal(o.actions[0]?.id, 'start');
  assert.equal(parseRoute(o.actions[0]!.href).view, 'configuratore');
  assert.equal(parseRoute(o.actions[0]!.secondary!.href).view, 'pianifica');
});

test('Prossimo passo: i trasferimenti oltre il limite vengono prima degli alloggi e portano al tratto', () => {
  const t0 = tripWith([stop('a', 'Bergen', 9), stop('b', 'Flåm', 8), stop('c', 'Oslo', 0)], { startDate: '2027-08-03' });
  const t: Trip = { ...t0, settings: { ...t0.settings, maxTravelMinPerDay: 120 }, legs: t0.legs.map((l) => ({ ...l, segments: [road(300)] })) };
  const { main, then } = planStep(tripOverview(t));
  assert.equal(main?.id, 'over-limit');
  assert.match(main!.text, /2 giornate di trasferimento superano il limite di 2 h/);
  assert.equal(parseRoute(main!.href).view, 'pianifica');
  assert.equal(parseRoute(main!.href).params.sel, `leg:${t.legs[0]!.id}`);
  // Dopo non torna sulla stessa questione: va agli alloggi
  assert.equal(then, 'completa gli alloggi delle tappe');
});

test('Prossimo passo: ogni azione porta alla schermata dove si completa, senza indirizzi vecchi', () => {
  const t = tripWith([stop('a', 'Bergen', 3), stop('b', 'Flåm', 2)], { accommodations: [] });
  const o = tripOverview(t);
  const beds = o.actions.find((a) => a.id === 'beds')!;
  assert.equal(parseRoute(beds.href).params.tappa, 'a');
  assert.equal(placeOf(beds.href), 'Prenotazioni › Alloggi');
  assert.equal(parseRoute(o.actions.find((a) => a.id === 'legs')!.href).params.azione, 'calcola');
  for (const href of [...o.actions.map((a) => a.href), ...o.steps.map((s) => s.href)]) assert.ok(!href.includes('itinerario'), href);
});

// ---------- Prenotazioni ----------

test('Prenotazioni: ogni elemento ha uno stato e una destinazione; gli alloggi distinguono i quattro casi', () => {
  const t = tripWith([stop('a', 'Bergen', 2), stop('b', 'Flåm', 2), stop('c', 'Odda', 2), stop('d', 'Oslo', 2)], {
    accommodations: [acc({ id: 'h1', name: 'Uno', status: 'prenotata', stopId: 'a' }), acc({ id: 'h2', name: 'Due', status: 'opzionata', stopId: 'b' }), acc({ id: 'h3', name: 'Tre', status: 'individuata', stopId: 'c' })],
  });
  const withAcc = { ...t, stops: t.stops.map((s, i) => ({ ...s, accommodationId: ['h1', 'h2', 'h3', undefined][i] })) };
  const rows = bookingsOverview(withAcc).rows.filter((r) => r.group === 'alloggi');
  assert.deepEqual(rows.map((r) => r.state), ['prenotato', 'opzionato', 'da_verificare', 'da_completare']);
  assert.equal(parseRoute(rows[3]!.href).view, 'hytte');
  assert.equal(parseRoute(rows[3]!.href).params.tappa, 'd');
});

test('Prenotazioni: voli mancanti da completare, alternative non contate come scelte, nessun volo richiesto a viaggio vuoto', () => {
  assert.equal(bookingsOverview(createEmptyTrip()).rows.length, 0);
  const t = tripWith([stop('a', 'Bergen', 2), stop('b', 'Oslo', 0)], { flights: [flight({ id: 'f1', priceStatus: 'pagato' }), flight({ id: 'f2', direction: 'ritorno', selected: false })] });
  const o = bookingsOverview(t);
  const fl = o.rows.filter((r) => r.group === 'voli');
  assert.equal(fl.find((r) => r.id === 'volo-f1')?.state, 'prenotato');
  assert.equal(fl.find((r) => r.id === 'volo-f2')?.state, 'opzionato');
  assert.equal(fl.find((r) => r.id === 'volo-mancante-ritorno')?.state, 'da_completare');
  assert.equal(fl.find((r) => r.id === 'volo-mancante-andata'), undefined);
  assert.equal(o.counts.da_completare, o.rows.filter((r) => r.state === 'da_completare').length);
  assert.equal(o.first?.state, 'da_completare');
});

test('Prenotazioni: un traghetto stimato è da verificare, uno confermato non risulta prenotato', () => {
  const t0 = tripWith([stop('a', 'Bergen', 2), stop('b', 'Flåm', 2)]);
  const ferry = (status: 'stimato' | 'confermato' | 'pagato'): Leg['segments'][number] => ({ id: `s-${status}`, mode: 'traghetto', label: 'Traghetto X', status, costStatus: 'da_verificare' });
  const run = (status: 'stimato' | 'confermato' | 'pagato') => bookingsOverview({ ...t0, legs: t0.legs.map((l) => ({ ...l, segments: [ferry(status)] })) }).rows.find((r) => r.group === 'trasporti')?.state;
  assert.equal(run('stimato'), 'da_verificare');
  assert.equal(run('confermato'), 'opzionato');
  assert.equal(run('pagato'), 'prenotato');
});

// ---------- Revisione della proposta ----------

const INPUT: ConfiguratorInput = {
  days: 16,
  startDate: '2027-08-03',
  arrivalAirportId: 'bgo',
  departureAirportId: 'bgo',
  modes: ['auto'],
  pace: 'equilibrato',
  maxDriveHours: 4,
  regions: ['Fiordi occidentali'],
  mustSee: [],
  kidFriendly: true,
};

test('Revisione: appena creata i tempi sono stime dichiarate e il viaggio vero non cambia', () => {
  const trip = createEmptyTrip();
  const r = configureItinerary(INPUT);
  const draft = addScenarioWithPlan(trip, 'Bozza', 'auto_hytte', { ...r.plan, coastalSelected: [] });
  assert.equal(trip.stops.length, 0);
  const rv = reviewProposal(draft, 240);
  assert.equal(rv.days, 16);
  assert.equal(rv.nights, 15);
  assert.equal(rv.start, '2027-08-03');
  assert.ok(rv.transfers.length > 0);
  assert.equal(rv.counts.calcolato, 0);
  assert.ok(rv.counts.stimato > 0);
  assert.ok(rv.transfers.every((t) => t.kind !== 'stimato' || (t.minutes ?? 0) > 0));
  assert.equal(rv.lodgingMissing.length, rv.stops.filter((s) => s.nights > 0 && !s.aboard).length);
  assert.ok(rv.toComplete.some((x) => x.startsWith('Calcolare')));
});

test('Revisione: distingue calcolato, stimato e da verificare; il limite vale per la giornata', () => {
  const t0 = tripWith([stop('a', 'Bergen', 2), stop('b', 'Flåm', 2, 'luogo', 60.8, 7.1), stop('c', 'Geiranger', 2, 'luogo', 62.1, 7.2), stop('d', 'Oslo', 0, 'luogo', 59.9, 10.7)]);
  const train: Leg['segments'][number] = { id: 't', mode: 'treno', label: 'Treno Oslo–Bergen', status: 'da_verificare', costStatus: 'da_verificare' };
  const t: Trip = { ...t0, legs: t0.legs.map((l, i) => (i === 0 ? { ...l, segments: [road(400)] } : i === 2 ? { ...l, segments: [train] } : l)) };
  const rv = reviewProposal(t, 120);
  assert.deepEqual(rv.transfers.map((x) => x.kind), ['calcolato', 'stimato', 'da_verificare']);
  assert.equal(rv.transfers[2]!.minutes, undefined, 'nessun tempo inventato per il treno');
  assert.ok(rv.violations.some((v) => v.kind === 'calcolato' && v.from === 'Bergen'));
  assert.ok(rv.violations.every((v) => v.kind !== 'calcolato' || v.minutes > 120));
  assert.deepEqual(rv.crossings.map((c) => c.label), ['Treno Oslo–Bergen']);
});

// ---------- Attivazione e ritorno ----------

test('Attivazione: la proposta diventa attiva, la versione precedente resta e si può tornare indietro', () => {
  const trip = ensureScenarios(tripWith([stop('a', 'Bergen', 16), stop('b', 'Oslo', 0)]));
  const prev = trip.activeScenarioId!;
  const r = configureItinerary(INPUT);
  const draft = addScenarioWithPlan(trip, 'Bozza', 'auto_hytte', { ...r.plan, coastalSelected: [] });
  const saved = saveAlternative(trip, 'Proposta', draft, 'nota', 'auto_hytte');
  assert.equal(saved.trip.activeScenarioId, prev, 'salvare non cambia il percorso attivo');
  assert.equal(saved.trip.stops[0]?.name, 'Bergen');
  const active = applyVersion(saved.trip, saved.id, 'Proposta');
  assert.equal(active.activeScenarioId, saved.id);
  assert.ok(active.scenarios!.find((s) => s.id === prev)?.plan?.stops.some((s) => s.name === 'Bergen'), 'la versione precedente è conservata');
  assert.equal(active.scenarios!.find((s) => s.id === saved.id)?.kind, 'auto_hytte');
  const back = undoVersion(active, prev, 'Proposta');
  assert.equal(back.activeScenarioId, prev);
  assert.equal(back.stops[0]?.name, 'Bergen');
  assert.ok(back.scenarios!.some((s) => s.id === saved.id), 'la proposta resta tra le versioni');
});

test('Impatto: tappe visitate e attività fatte che escono dal percorso richiedono conferma, e lo stato resta', () => {
  const before = tripWith([stop('a', 'Bergen', 2), stop('b', 'Flåm', 2)], {
    days: { 'b#0': { activities: [{ id: 'x', title: 'Flåmsbana', costStatus: 'da_verificare' } as never], notes: '', planB: '' } },
    actuals: { stops: { b: { state: 'visitata', at: '2027-08-05T10:00:00Z' } }, activities: { x: { state: 'fatta', at: '2027-08-05T10:00:00Z' } } },
  });
  const after = tripWith([stop('a', 'Bergen', 4)], { days: before.days, actuals: before.actuals });
  const i = planImpact(before, after);
  assert.equal(i.needsBookingConfirm, true);
  assert.deepEqual(i.booked.filter((b) => b.kind === 'visita').map((b) => b.label), ['Flåm', 'Flåmsbana']);
  assert.equal(planImpact(before, before).needsBookingConfirm, false);
});

// ---------- Stato del salvataggio ----------

test('Stato dei dati: «sincronizzato» solo se il cloud ha confermato, e nessun invio finto senza rete', () => {
  assert.equal(syncView('salvato', 'non_configurato').label, 'Salvato su questo dispositivo');
  assert.equal(syncView('salvato', 'offline', undefined, false).canRetry, false);
  assert.equal(syncView('salvato', 'offline', undefined, true).canRetry, true);
  assert.equal(syncView('salvato', 'errore').canRetry, true);
  assert.equal(syncView('errore', 'sincronizzato').tone, 'problema');
  assert.doesNotMatch(syncView('in_attesa', 'sincronizzato').label, /Sincronizzato/);
  assert.match(syncView('salvato', 'sincronizzato', '2027-08-03T10:15:00Z').label, /^Sincronizzato alle/);
  for (const c of ['non_connesso', 'in_attesa', 'in_corso', 'offline', 'errore', 'conflitto'] as const) assert.doesNotMatch(syncView('salvato', c).label, /Sincronizzato/);
});
