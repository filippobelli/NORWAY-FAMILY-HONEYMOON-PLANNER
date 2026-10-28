import assert from 'node:assert/strict';
import { test } from 'node:test';
import { budgetOverlaps, computeBudget } from '../src/domain/budget';
import { createEmptyTrip } from '../src/domain/defaults';
import { legTotals, syncLegs, tripWarnings } from '../src/domain/itinerary';
import { lodgingComparison } from '../src/domain/lodging';
import { tripOverview } from '../src/domain/overview';
import { comparability, scenarioMetrics } from '../src/domain/scenarios';
import type { Accommodation, Segment, Stop, Trip } from '../src/domain/types';

// Regressioni trovate nell'audit integrato delle fasi 1–3.

const stop = (id: string, name: string, nights: number): Stop => ({ id, kind: 'luogo', name, lat: 60, lng: 6, nights, notes: '', weatherPlanB: '' });
const road: Segment = { id: 'r', mode: 'strada', label: 'Strada', distanceKm: 100, durationMin: 90, status: 'stimato', costStatus: 'da_verificare', source: { label: 'OSRM' } };

function tripWith(segments: Segment[]): Trip {
  const t = { ...createEmptyTrip(), stops: [stop('a', 'Bergen', 2), stop('b', 'Flåm', 2)] };
  return { ...t, legs: syncLegs(t.stops, []).map((l) => ({ ...l, segments })) };
}

test('Audit: treni e bus da verificare contati allo stesso modo in itinerario, scenari e panoramica', () => {
  const t = tripWith([road, { id: 't', mode: 'treno', label: 'Flåmsbana', durationMin: 60, status: 'da_verificare', costStatus: 'da_verificare' }]);
  assert.equal(legTotals(t.legs[0]!).unverifiedCrossings, 1);
  assert.ok(tripWarnings(t).some((w) => w.text.startsWith('1 traghetto, nave o mezzo pubblico')));
  assert.ok(scenarioMetrics(t).toVerify.some((x) => x.includes('mezzi pubblici')));
  assert.equal(tripOverview(t).unverifiedCrossings.length, 1);
});

test('Audit: un tratto con un segmento senza durata rende parziali scenari e panoramica', () => {
  const t = tripWith([road, { id: 't', mode: 'treno', label: 'Treno', status: 'da_verificare', costStatus: 'da_verificare' }]);
  const m = scenarioMetrics(t);
  assert.equal(m.uncalculatedLegs, 0);
  assert.equal(m.incompleteLegs, 1);
  assert.notEqual(m.completeness.level, 'completo');
  assert.ok(m.completeness.needs.some((n) => n.startsWith('Inserire la durata mancante')));
  const full = scenarioMetrics(tripWith([road]));
  assert.equal(comparability('tratti', [m, full]).ok, false, 'niente «migliore» su tempi sottostimati');
  const step = tripOverview(t).steps.find((s) => s.id === 'collegamenti')!;
  assert.equal(step.state, 'in_corso');
  assert.match(step.detail, /1 senza durata/);
});

test('Audit: la capienza totale non basta a confermare i letti per la famiglia', () => {
  const base = tripWith([road]);
  const acc: Accommodation = {
    id: 'h',
    name: 'Hytte',
    type: 'hytte',
    locality: '',
    stopId: 'a',
    capacity: 4,
    beds: '',
    priceStatus: 'stimato',
    bathroom: 'non_noto',
    kitchen: 'non_noto',
    parking: 'non_noto',
    cancellation: '',
    status: 'disponibile',
    notes: '',
  };
  const opt = lodgingComparison({ ...base, accommodations: [acc] })[0]!.options[0]!;
  assert.equal(opt.fitsFamily, true);
  assert.ok(opt.missing.includes('configurazione dei letti'));
  const withBeds = lodgingComparison({ ...base, accommodations: [{ ...acc, beds: '1 matrimoniale + castello' }] })[0]!.options[0]!;
  assert.ok(!withBeds.missing.includes('configurazione dei letti'));
  // Backup JSON vecchio o modificato a mano senza il campo «beds»: niente errore, dato segnalato come mancante
  const legacy = { ...acc } as Partial<Accommodation>;
  delete legacy.beds;
  const old = lodgingComparison({ ...base, accommodations: [legacy as Accommodation] })[0]!.options[0]!;
  assert.ok(old.missing.includes('configurazione dei letti'));
});

test('Audit: stime di alloggio o attività sommate a voci manuali della stessa categoria vengono segnalate, senza cambiare importi', () => {
  const t = tripWith([road]);
  const withEst: Trip = {
    ...t,
    settings: { ...t.settings, estimates: { lodgingPerNight: 150 } },
    budgetItems: [{ id: 'm', category: 'alloggi', label: 'Hytte Bergen pagata a parte', amount: { amount: 300, currency: 'EUR' }, status: 'pagato', notes: '' }],
  };
  const b = computeBudget(withEst);
  const alloggi = b.lines.filter((l) => l.category === 'alloggi');
  assert.equal(alloggi.reduce((s, l) => s + l.eur, 0), 300 + 2 * 150 + 2 * 150, 'gli importi restano quelli calcolati');
  const o = budgetOverlaps(b);
  assert.equal(o.length, 1);
  assert.match(o[0]!.text, /stime da parametri/);
});
