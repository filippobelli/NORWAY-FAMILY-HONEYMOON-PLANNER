import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyTrip } from '../src/domain/defaults';
import { computeDays, inTripTarget, syncLegs, targetLabel, transferBreakdown, tripTarget, tripWarnings } from '../src/domain/itinerary';
import { tripOverview } from '../src/domain/overview';
import { hasRouteTrack, passDay, planAttraction, routeDistanceKm, stopDays, stopThings } from '../src/domain/thingsToDo';
import { todayView } from '../src/domain/today';
import type { Leg, Segment, Trip } from '../src/domain/types';
import { stop } from './fixtures';

// Revisione UX del 15/11/2026, punti 4–9: trasferimenti, prossimo passo, Oggi, soste e luoghi lungo il percorso.

const seg = (id: string, mode: Segment['mode'], extra: Partial<Segment> = {}): Segment => ({ id, mode, label: mode, status: 'stimato', costStatus: 'da_verificare', ...extra });

function trip(nightsB = 0): Trip {
  const stops = [stop('a', 'Bergen', 2, { lat: 60.39, lng: 5.32 }), stop('b', 'Flåm', nightsB, { lat: 60.86, lng: 7.11 }), stop('c', 'Geiranger', 3, { lat: 62.1, lng: 7.2 })];
  const legs: Leg[] = syncLegs(stops, []).map((l, i) => ({
    ...l,
    calculatedAt: '2026-11-15T10:00:00.000Z',
    segments:
      i === 0
        ? [seg('s1', 'strada', { durationMin: 150, distanceKm: 166.4, geometry: [[60.39, 5.32], [60.63, 6.42], [60.86, 7.11]] })]
        : [seg('s2', 'strada', { durationMin: 200, distanceKm: 250 }), seg('s3', 'traghetto', { label: 'Hellesylt–Geiranger', durationMin: 65, departureTime: '14:00', status: 'da_verificare', note: 'Operatore di prova', source: { label: 'Sito operatore', url: 'https://example.org/orari' } })],
  }));
  return { ...createEmptyTrip(), startDate: '2027-08-01', stops, legs };
}

test('Riepilogo del trasferimento: guida, traversata, attesa e totale separati; i tempi mancanti restano mancanti', () => {
  const t = trip();
  const road = transferBreakdown(t.legs[0]!, t.settings);
  assert.equal(road.state, 'completo');
  assert.equal(road.driveMin, 150);
  assert.equal(road.roadKm, 166);
  assert.equal(road.crossingMin, 0);
  assert.deepEqual(road.crossings, []);
  const mixed = transferBreakdown(t.legs[1]!, t.settings);
  assert.equal(mixed.driveMin, 200);
  assert.equal(mixed.crossingMin, 65);
  assert.ok(mixed.waitMin > 0 && mixed.waitAssumed, "senza attesa inserita vale l'ipotesi delle impostazioni, dichiarata");
  assert.equal(mixed.totalMin, mixed.driveMin + mixed.crossingMin + mixed.waitMin + mixed.breakMin);
  assert.equal(mixed.unverifiedCrossings, 1);
  assert.deepEqual(
    mixed.crossings.map((c) => [c.label, c.departureTime, c.status, c.note, c.source?.url]),
    [['Hellesylt–Geiranger', '14:00', 'da_verificare', 'Operatore di prova', 'https://example.org/orari']],
  );
  const none = transferBreakdown({ ...t.legs[0]!, segments: [seg('n', 'non_calcolato')] }, t.settings);
  assert.equal(none.state, 'non_calcolato');
  assert.equal(none.totalMin, 0);
  const partial = transferBreakdown({ ...t.legs[1]!, segments: [seg('s2', 'strada', { durationMin: 60 }), seg('t', 'treno')] }, t.settings);
  assert.equal(partial.state, 'parziale', 'un treno senza durata non vale zero');
});

test('Durata obiettivo e voli sono preferenze del viaggio; i viaggi già salvati restano a 15–20 con voli', () => {
  const base = createEmptyTrip();
  assert.deepEqual(tripTarget(base.settings), { min: 15, max: 20 });
  assert.equal(targetLabel(base.settings), '15–20');
  assert.equal(inTripTarget(6, base.settings), false);
  const short = { ...base.settings, targetDaysMin: 5, targetDaysMax: 7 };
  assert.equal(inTripTarget(6, short), true);
  assert.deepEqual(tripTarget({ targetDaysMin: 9, targetDaysMax: 3 }), { min: 9, max: 9 }, 'il massimo non scende sotto il minimo');
  const t = trip();
  assert.ok(tripWarnings(t).some((w) => /obiettivo è tra 15 e 20/.test(w.text)));
  assert.ok(!tripWarnings({ ...t, settings: { ...t.settings, targetDaysMin: 5, targetDaysMax: 7 } }).some((w) => /obiettivo/.test(w.text)));
  assert.ok(tripOverview(t).actions.some((a) => a.id === 'flights'), 'senza preferenza i voli si chiedono');
  const noFlights = tripOverview({ ...t, settings: { ...t.settings, flightsNeeded: false } });
  assert.ok(!noFlights.actions.some((a) => a.id === 'flights'));
  assert.ok(!tripOverview({ ...t, settings: { ...t.settings, targetDaysMin: 5, targetDaysMax: 7 } }).actions.some((a) => a.id === 'length'));
});

test('Prossimo passo: se è la somma dei tratti a superare il limite si apre la giornata, non il primo tratto', () => {
  const t = trip();
  // Flåm è di passaggio: i due tratti cadono nello stesso giorno e insieme superano il limite
  const o = tripOverview({ ...t, settings: { ...t.settings, maxTravelMinPerDay: 300 } });
  const over = o.actions.find((a) => a.id === 'over-limit');
  assert.ok(over, 'giornata oltre il limite segnalata');
  assert.match(over.href, /sel=day%3A/, 'collegamento alla giornata');
  assert.match(over.cta, /Apri il giorno \d+/);
  // Con una notte a Flåm i tratti sono in giorni diversi: resta il collegamento al tratto
  const split = tripOverview({ ...trip(1), settings: { ...t.settings, maxTravelMinPerDay: 240 } }).actions.find((a) => a.id === 'over-limit');
  assert.ok(split);
  assert.match(split.href, /sel=leg%3A/);
  // Una sola verifica aperta: si apre direttamente quel tratto
  const check = o.actions.find((a) => a.id === 'crossings');
  assert.ok(check);
  assert.match(check.href, /sel=leg%3A/);
});

test('Oggi: le partenze con orario inserito sono in evidenza, in ordine di orario', () => {
  const t = trip();
  const days = computeDays(t);
  const i = days.findIndex((d) => d.legs.length > 0);
  const v = todayView(t, i)!;
  assert.deepEqual(v.departures.map((d) => [d.time, d.status]), [['14:00', 'da_verificare']]);
  assert.match(v.departures[0]!.text, /Hellesylt–Geiranger/);
  assert.deepEqual(todayView(t, 0)!.departures, i === 0 ? v.departures : []);
});

test('Sosta senza pernottamento: si pianifica nel giorno in cui si passa di lì', () => {
  const t = trip();
  const days = computeDays(t);
  const pass = passDay(t, 'b', days);
  assert.ok(pass, 'Flåm ha un giorno di passaggio');
  assert.ok(pass.legs.some((l) => l.toStopId === 'b'));
  assert.deepEqual(stopDays(t, 'b').map((d) => d.key), [pass.key]);
  assert.equal(passDay(t, 'a', days), undefined, 'una tappa con notti non è di passaggio');
  assert.ok(stopDays(t, 'a').every((d) => d.sleepStop?.id === 'a'));
  // La visita entra in quella giornata e si ritrova tra le cose della sosta
  const after = planAttraction(t, 'b', 'flamsbana', pass.key);
  assert.notEqual(after, t);
  assert.ok(after.days[pass.key]!.activities.some((a) => a.destinationId === 'flamsbana'));
  assert.deepEqual(stopThings(after, 'b').planned.map((p) => p.activity.destinationId), ['flamsbana']);
  // Le attività dell'altra tappa nella stessa giornata non diventano cose della sosta
  assert.equal(stopThings(after, 'b').personal.length, 0);
});

test('Lungo il percorso: solo dove esiste un tracciato; la distanza è in linea d\'aria e non un tempo', () => {
  const t = trip();
  assert.equal(hasRouteTrack(t), true);
  assert.equal(hasRouteTrack({ ...t, legs: t.legs.map((l) => ({ ...l, segments: l.segments.map((s) => ({ ...s, geometry: undefined })) })) }), false);
  const voss = routeDistanceKm(t, { lat: 60.63, lng: 6.42 });
  assert.equal(voss, 0, 'Voss è sul tracciato');
  const far = routeDistanceKm(t, { lat: 69.65, lng: 18.96 });
  assert.ok(far !== undefined && far > 900, 'Tromsø è lontana dal tracciato');
  assert.equal(routeDistanceKm({ ...t, legs: [] }, { lat: 60, lng: 6 }), undefined, 'senza tracciato non si dice nulla');
});
