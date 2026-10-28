import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BUDGET_CATEGORIES, categoryBreakdown, computeBudget } from '../src/domain/budget';
import { createEmptyTrip } from '../src/domain/defaults';
import { syncLegs } from '../src/domain/itinerary';
import { externalHref, lodgingComparison } from '../src/domain/lodging';
import { tripOverview } from '../src/domain/overview';
import type { Accommodation, BudgetItem, Stop, Trip } from '../src/domain/types';
import { exportTripFile, readTripFile } from '../src/services/storage/local';

// Fase 4, lacune residue. Solo dati sintetici.

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
const acc = (p: Partial<Accommodation> & Pick<Accommodation, 'id' | 'name'>): Accommodation => ({
  type: 'hytte',
  locality: '',
  beds: '',
  priceStatus: 'stimato',
  bathroom: 'non_noto',
  kitchen: 'non_noto',
  parking: 'non_noto',
  cancellation: '',
  status: 'disponibile',
  notes: '',
  ...p,
});
const item = (id: string, category: BudgetItem['category'], amount: number, status: BudgetItem['status']): BudgetItem => ({
  id,
  category,
  label: id,
  amount: { amount, currency: 'EUR' },
  status,
  notes: '',
});

function trip(stops: Stop[], patch: Partial<Trip> = {}): Trip {
  const t = { ...createEmptyTrip(), stops, ...patch };
  return { ...t, legs: syncLegs(t.stops, []) };
}
const action = (t: Trip, id: string) => tripOverview(t).actions.find((a) => a.id === id);

// ---------- Lacuna A ----------

test('Panoramica: alloggio mancante e costo non quantificato → una sola azione con scelta e budget distinti', () => {
  const t = trip([stop('a', 'Bergen', 2)]);
  const beds = action(t, 'beds')!;
  assert.match(beds.text, /Scegli l'alloggio per 1 tappa/);
  assert.match(beds.text, /Costo da quantificare/);
  assert.equal(beds.href, '#/hytte');
  assert.deepEqual(beds.secondary, { href: '#/budget', cta: 'Stima nel budget' });
  assert.equal(action(t, 'prices'), undefined, 'lo stesso costo non viene ripetuto in un secondo avviso');
  // L'informazione economica resta nel budget della panoramica
  assert.ok(tripOverview(t).budget.missingPrices.some((m) => m.startsWith('Alloggio non ancora scelto a Bergen')));
});

test('Panoramica: alloggio mancante con stima valida → costo non segnalato come mancante', () => {
  const base = trip([stop('a', 'Bergen', 2)]);
  const t = { ...base, settings: { ...base.settings, estimates: { lodgingPerNight: 150 } } };
  const beds = action(t, 'beds')!;
  assert.match(beds.text, /stima per notte/);
  assert.equal(beds.secondary, undefined);
  assert.ok(!tripOverview(t).budget.missingPrices.some((m) => m.startsWith('Alloggio non ancora scelto')));
});

test('Panoramica: alloggio mancante con voci manuali di alloggio → da controllare, non dato per coperto né per mancante', () => {
  const t = trip([stop('a', 'Bergen', 2)], { budgetItems: [item('m', 'alloggi', 300, 'pagato')] });
  const beds = action(t, 'beds')!;
  assert.match(beds.text, /voci manuali di alloggio: controlla/);
  assert.deepEqual(beds.secondary, { href: '#/budget', cta: 'Controlla il budget' });
  assert.ok(!tripOverview(t).budget.missingPrices.some((m) => m.startsWith('Alloggio non ancora scelto')));
});

test('Panoramica: alloggio scelto con costo noto → nessuna azione su alloggio o prezzo', () => {
  const t = trip([stop('a', 'Bergen', 2, 'h')], { accommodations: [acc({ id: 'h', name: 'Hytte', stopId: 'a', pricePerNight: { amount: 100, currency: 'EUR' } })] });
  assert.equal(action(t, 'beds'), undefined);
  assert.equal(action(t, 'prices'), undefined);
});

test('Panoramica: alloggio scelto con costo sconosciuto → solo l\'azione sul prezzo', () => {
  const t = trip([stop('a', 'Bergen', 2, 'h')], { accommodations: [acc({ id: 'h', name: 'Hytte senza prezzo', stopId: 'a' })] });
  assert.equal(action(t, 'beds'), undefined);
  assert.match(action(t, 'prices')!.text, /^1 costo noto non ha ancora un prezzo/);
});

// ---------- Lacuna B ----------

function budgetTrip(items: BudgetItem[], patch: Partial<Trip> = {}) {
  return computeBudget(trip([stop('a', 'Bergen', 2, 'h')], { accommodations: [acc({ id: 'h', name: 'Hytte', stopId: 'a' })], budgetItems: items, ...patch }));
}
const cat = (b: ReturnType<typeof computeBudget>, c: BudgetItem['category']) => categoryBreakdown(b).find((x) => x.category === c)!;

test('Budget per stato: solo confermate, solo stimate, stati diversi e da verificare', () => {
  const b = budgetTrip([
    item('v1', 'voli', 500, 'pagato'),
    item('v2', 'voli', 300, 'confermato'),
    item('p', 'pasti', 400, 'stimato'),
    item('t1', 'treni_bus', 100, 'prenotato'),
    item('t2', 'treni_bus', 80, 'stimato'),
    item('t3', 'treni_bus', 20, 'da_verificare'),
  ]);
  assert.deepEqual(
    { ...cat(b, 'voli'), category: undefined },
    { category: undefined, total: 800, firm: 800, estimated: 0, toVerify: 0, counts: { firm: 2, estimated: 0, toVerify: 0 }, withoutAmount: 0 },
  );
  assert.equal(cat(b, 'pasti').estimated, 400);
  assert.equal(cat(b, 'pasti').counts.firm, 0);
  const tb = cat(b, 'treni_bus');
  assert.deepEqual([tb.firm, tb.estimated, tb.toVerify, tb.total], [100, 80, 20, 200]);
});

test('Budget per stato: importo 0 € visibile come dato e voci senza importo fuori dai subtotali', () => {
  const b = budgetTrip([item('z', 'attrazioni', 0, 'confermato')]);
  const a = cat(b, 'attrazioni');
  assert.equal(a.total, 0);
  assert.equal(a.counts.firm, 1, 'la voce da 0 € conta come voce certa');
  const alloggi = cat(b, 'alloggi');
  assert.equal(alloggi.withoutAmount, 1, 'alloggio scelto senza prezzo');
  assert.deepEqual([alloggi.total, alloggi.counts.firm, alloggi.counts.estimated, alloggi.counts.toVerify], [0, 0, 0, 0], 'nessuno stato inventato per il costo sconosciuto');
});

test('Budget per stato: valori derivati non duplicati e totali coerenti con il totale complessivo', () => {
  const b = budgetTrip([item('m', 'alloggi', 200, 'confermato'), item('v', 'voli', 900, 'stimato')], {
    accommodations: [acc({ id: 'h', name: 'Hytte', stopId: 'a', pricePerNight: { amount: 100, currency: 'EUR' }, status: 'prenotata' })],
    settings: { ...createEmptyTrip().settings, estimates: { foodPerDay: 50 } },
  });
  const br = categoryBreakdown(b);
  for (const c of BUDGET_CATEGORIES) {
    const x = br.find((y) => y.category === c.id)!;
    assert.equal(x.total, b.byCategory[c.id], c.id);
    assert.ok(Math.abs(x.firm + x.estimated + x.toVerify - x.total) < 1e-9, c.id);
  }
  assert.ok(Math.abs(br.reduce((s, x) => s + x.total, 0) - b.total) < 1e-9);
  // Alloggi: voce manuale 200 + hytte prenotata 2 × 100, ciascuna una volta sola
  assert.deepEqual([cat(b, 'alloggi').firm, cat(b, 'alloggi').counts.firm], [400, 2]);
  assert.equal(cat(b, 'pasti').estimated, 3 * 50, 'stima pasti derivata dai giorni, contata una volta');
});

// ---------- Lacuna C ----------

test('Link: solo http/https, nessuna correzione indovinata per indirizzi malformati', () => {
  assert.equal(externalHref('https://example.org/hytte'), 'https://example.org/hytte');
  assert.equal(externalHref('  http://example.org  '), 'http://example.org/');
  assert.equal(externalHref('www.example.org'), undefined, 'senza schema diventerebbe un link relativo alla app');
  assert.equal(externalHref('javascript:alert(1)'), undefined);
  assert.equal(externalHref('ftp://example.org'), undefined);
  assert.equal(externalHref(''), undefined);
  assert.equal(externalHref(undefined), undefined);
  // Il confronto conserva il dato salvato così com'è
  const t = trip([stop('a', 'Bergen', 2)], { accommodations: [acc({ id: 'h', name: 'H', stopId: 'a', url: 'www.example.org' })] });
  assert.equal(lodgingComparison(t)[0]!.options[0]!.acc.url, 'www.example.org');
});

test('Backup JSON: l\'esportazione produce un file leggibile e reimportabile senza perdite (dati sintetici)', async () => {
  const original = trip([stop('a', 'Bergen', 2, 'h'), stop('b', 'Flåm', 1)], {
    title: 'PROVA EXPORT (sintetico)',
    accommodations: [acc({ id: 'h', name: 'Hytte', stopId: 'a', pricePerNight: { amount: 1500, currency: 'NOK' } })],
    budgetItems: [item('z', 'attrazioni', 0, 'confermato')],
  });
  // DOM minimo: si cattura il file che il browser scaricherebbe
  let blob: Blob | undefined;
  let fileName = '';
  const g = globalThis as unknown as { document?: unknown };
  const prevDoc = g.document;
  const prevCreate = URL.createObjectURL;
  const prevRevoke = URL.revokeObjectURL;
  const anchor = { href: '', download: '', click: () => (fileName = anchor.download), remove: () => undefined };
  g.document = { createElement: () => anchor, body: { appendChild: () => undefined } };
  URL.createObjectURL = (b: Blob) => {
    blob = b;
    return 'blob:prova';
  };
  URL.revokeObjectURL = () => undefined;
  try {
    exportTripFile(original);
  } finally {
    g.document = prevDoc;
    URL.createObjectURL = prevCreate;
    URL.revokeObjectURL = prevRevoke;
  }
  assert.ok(blob);
  assert.equal(blob.type, 'application/json');
  assert.match(fileName, /^norvegia-2027-\d{4}-\d{2}-\d{2}\.json$/);
  const text = await blob.text();
  const parsed = JSON.parse(text) as Trip;
  assert.equal(parsed.schemaVersion, 1);
  const back = await readTripFile(new File([text], fileName, { type: 'application/json' }));
  // Confronto nella forma JSON: un campo con valore undefined equivale a un campo assente (è così che viene salvato)
  const asJson = (t: Trip) => JSON.parse(JSON.stringify(t)) as unknown;
  assert.deepEqual(asJson(back), asJson(original), 'nessun campo perso o aggiunto');
  assert.equal(computeBudget(back).total, computeBudget(original).total);
});
