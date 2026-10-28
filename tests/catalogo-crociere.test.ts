import assert from 'node:assert/strict';
import { test } from 'node:test';
import { catalogFor, COASTAL_CATALOG, findCatalogVoyage } from '../src/data/coastalCatalog';
import { computeBudget } from '../src/domain/budget';
import { coastalRoute, optionFromCatalog } from '../src/domain/coastal';
import { createEmptyTrip, normalizeTrip } from '../src/domain/defaults';

test('Catalogo crociere: proposte da 1 a 5 giorni con porti della rotta, fonte e data', () => {
  assert.equal(catalogFor('Hurtigruten').length, 13);
  assert.equal(catalogFor('Havila').length, 11);
  const ids = new Set<string>();
  for (const v of COASTAL_CATALOG) {
    assert.ok(!ids.has(v.id), `id duplicato ${v.id}`);
    ids.add(v.id);
    assert.ok(v.days >= 1 && v.days <= 5, v.id);
    assert.ok(coastalRoute(v.direction, v.fromPort, v.toPort).valid, `porti non validi nella direzione: ${v.id}`);
    assert.ok(v.prices.length > 0 && v.prices.every((p) => p.perPerson > 0), v.id);
    assert.match(v.url, /^https:\/\/www\.(hurtigruten|havilavoyages)\.com\//);
    assert.equal(v.checkedAt, '2026-10-28');
    for (const d of v.itinerary ?? []) assert.ok(d.ports.length > 0, `${v.id} giorno ${d.day}`);
  }
});

test('Catalogo crociere: prezzo estivo solo dove pubblicato per agosto 2027', () => {
  for (const v of catalogFor('Havila')) {
    assert.equal(v.summerPrice, true, v.id);
    assert.equal(v.priceValidFor, 'agosto 2027');
    assert.equal(v.meals, 'pensione_completa');
  }
  for (const v of catalogFor('Hurtigruten')) {
    assert.equal(v.summerPrice, false, v.id);
    assert.ok(/2026|2027/.test(v.priceValidFor) && !/agosto|luglio|giugno/.test(v.priceValidFor), v.id);
  }
});

test('Opzione da catalogo Havila: dettagli precompilati e stima famiglia dichiarata come tale', () => {
  const trip = createEmptyTrip();
  const v = findCatalogVoyage('hv-bergen-trondheim')!;
  const before = JSON.stringify(trip);
  const o = optionFromCatalog(v, trip.participants);
  assert.equal(JSON.stringify(trip), before, 'il viaggio non viene modificato');
  assert.equal(o.operator, 'Havila');
  assert.deepEqual([o.direction, o.fromPort, o.toPort, o.nightsOnboard, o.meals], ['nord', 'Bergen', 'Trondheim', 2, 'pensione_completa']);
  assert.deepEqual(o.price, { amount: 773 * 4, currency: 'EUR' });
  assert.equal(o.priceStatus, 'stimato', 'stima, non preventivo');
  assert.equal(o.selected, false, 'non entra nel budget finché non si sceglie');
  assert.equal(o.catalogId, v.id);
  assert.equal(o.source?.url, v.url);
  assert.match(o.notes, /4 persone × 773 €/);
  assert.match(o.notes, /Giorno 2 — Ålesund e i fiordi: Florø, Måløy/);
  assert.equal(o.date, undefined, 'la data la sceglie l\'utente');
  assert.equal(o.durationHours, undefined, 'durata in ore non pubblicata: non inventata');
});

test('Opzione da catalogo Hurtigruten: nessun prezzo estivo inventato', () => {
  const o = optionFromCatalog(findCatalogVoyage('hr-bergen-trondheim')!, createEmptyTrip().participants);
  assert.equal(o.price, undefined);
  assert.equal(o.priceStatus, 'da_verificare');
  assert.equal(o.meals, 'nessuno');
  assert.match(o.notes, /vale per novembre 2026, non per agosto/);
  // Inclusa nel budget resta un costo senza importo, non zero
  const t = { ...createEmptyTrip(), coastalOptions: [{ ...o, selected: true }] };
  const b = computeBudget(t);
  assert.equal(b.byCategory.costiera, 0);
  assert.ok(b.missing.some((m) => m.startsWith('Prezzo mancante per Hurtigruten Bergen → Trondheim')));
});

test('Compatibilità: le opzioni salvate senza catalogId restano valide e quelle nuove sopravvivono al backup JSON', () => {
  const base = createEmptyTrip();
  const manual = { ...optionFromCatalog(findCatalogVoyage('hv-trondheim-bergen')!, base.participants) };
  delete manual.catalogId;
  const withCatalog = optionFromCatalog(findCatalogVoyage('hv-trondheim-bergen')!, base.participants);
  const back = normalizeTrip(JSON.parse(JSON.stringify({ ...base, coastalOptions: [manual, withCatalog] })));
  assert.equal(back.coastalOptions[0]!.catalogId, undefined);
  assert.equal(back.coastalOptions[1]!.catalogId, 'hv-trondheim-bergen');
});
