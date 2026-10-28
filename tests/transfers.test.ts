import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeDayLoads, loadFactors } from '../src/domain/dayLoad';
import { createEmptyTrip } from '../src/domain/defaults';
import { computeDays, legSummary, syncLegs } from '../src/domain/itinerary';
import { tripOverview } from '../src/domain/overview';
import type { Leg, Segment, Stop, Trip } from '../src/domain/types';

const stop = (id: string, name: string, nights: number): Stop => ({ id, kind: 'luogo', name, lat: 60, lng: 6, nights, notes: '', weatherPlanB: '' });
const osrm = { label: 'OSRM (test)' };
const seg = (p: Partial<Segment> & Pick<Segment, 'mode'>): Segment => ({ id: Math.random().toString(36), label: p.mode, status: 'stimato', costStatus: 'da_verificare', ...p });
const leg = (segments: Segment[]): Leg => ({ id: 'l', fromStopId: 'a', toStopId: 'b', segments });

test('Tratto: guida e traversate separate, totale solo se tutte le durate sono note', () => {
  const s = legSummary(
    leg([
      seg({ mode: 'strada', distanceKm: 26, durationMin: 25, source: osrm }),
      seg({ mode: 'traghetto', distanceKm: 3, durationMin: 13, source: osrm }),
      seg({ mode: 'strada', distanceKm: 80, durationMin: 85, source: osrm }),
    ]),
  );
  assert.equal(s.state, 'calcolato');
  assert.equal(s.roadKm, 106, 'i km del traghetto non sono km stradali');
  assert.equal(s.driveMin, 110);
  assert.equal(s.otherMin, 13);
  assert.equal(s.totalMin, 123);
  // Realistico = teorico + attesa ipotizzata al traghetto (30 min predefiniti), nessuna sosta sotto le 2 h di guida
  assert.equal(s.realisticMin, 153);
  assert.equal(s.toVerify, 1);
});

test('Tratto: un segmento senza durata rende il totale non calcolabile invece di sommare zero', () => {
  const s = legSummary(leg([seg({ mode: 'strada', distanceKm: 120, durationMin: 100, source: osrm }), seg({ mode: 'treno', label: 'Flåmsbana' })]));
  assert.equal(s.state, 'misto');
  assert.equal(s.totalMin, undefined);
  assert.equal(s.realisticMin, undefined);
  assert.equal(s.missingDuration, 1);
  assert.equal(s.toVerify, 1, 'il treno ha l\'orario da verificare');

  const firm = legSummary(leg([seg({ mode: 'treno', durationMin: 60, status: 'confermato' })]));
  assert.equal(firm.state, 'manuale');
  assert.equal(firm.totalMin, 60);
  assert.equal(firm.toVerify, 0);

  const none = legSummary(leg([{ id: 'x', mode: 'non_calcolato', label: '', status: 'da_verificare', costStatus: 'da_verificare' }]));
  assert.equal(none.state, 'da_calcolare');
  assert.equal(none.totalMin, undefined);
});

function tripWithLeg(segments: Segment[], patch: Partial<Trip> = {}): Trip {
  const t = { ...createEmptyTrip(), stops: [stop('a', 'Bergen', 1), stop('b', 'Flåm', 2)], ...patch };
  const legs = syncLegs(t.stops, []).map((l) => ({ ...l, segments }));
  return { ...t, legs };
}

test('Carico: ogni fattore rilevante porta una verifica o una riduzione, senza modificare il viaggio', () => {
  const t = tripWithLeg([seg({ mode: 'strada', durationMin: 200, source: osrm }), seg({ mode: 'traghetto', durationMin: 20, source: osrm }), seg({ mode: 'bus', durationMin: 30 })]);
  const before = JSON.stringify(t);
  const days = computeDays(t);
  const f = loadFactors(t, days[1]!, computeDayLoads(t, days)[1]!);
  const byStart = (p: string) => f.find((x) => x.text.startsWith(p));
  assert.ok(byStart('Attese ai traghetti ipotizzate (30 min)')?.hint);
  assert.ok(byStart('2 traghetti, navi o mezzi pubblici con orario da verificare')?.hint, 'anche il bus va verificato');
  assert.ok(byStart('Cambio di alloggio')?.hint);
  assert.equal(JSON.stringify(t), before, 'nessuna modifica al viaggio');

  // Giorno di arrivo: segnalato che gli orari del volo non sono inclusi
  const f0 = loadFactors(t, days[0]!, computeDayLoads(t, days)[0]!);
  assert.ok(f0.some((x) => x.text.startsWith('Giorno di arrivo')));
});

test('Carico: la soglia dei trasferimenti è quella impostata nel viaggio', () => {
  const t = tripWithLeg([seg({ mode: 'strada', durationMin: 150, source: osrm })]);
  const days = computeDays(t);
  const loads = computeDayLoads(t, days);
  const strict = { ...t, settings: { ...t.settings, maxTravelMinPerDay: 120 } };
  assert.ok(!loadFactors(t, days[1]!, loads[1]!).some((x) => x.text.includes('oltre la soglia')));
  assert.ok(loadFactors(strict, days[1]!, loads[1]!).some((x) => x.text.includes('oltre la soglia di 2 h')));
});

test('Panoramica: treni e bus con orario da verificare compaiono tra le verifiche', () => {
  const o = tripOverview(tripWithLeg([seg({ mode: 'treno', label: 'Bergensbanen', durationMin: 120 })]));
  assert.deepEqual(
    o.unverifiedCrossings.map((c) => c.label),
    ['Bergensbanen'],
  );
});
