import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { RANGE_CODES, buildCatalogRange, buildBeforeRange } from '../scripts/build-catalog-range';
import { buildNorthernAsia } from '../scripts/build-northern-asia';
import { buildNorwayV5, generateSql, seedBundle } from '../scripts/seed-catalog';
import { adaptBundle, checkBundle, combineCatalogs } from '../src/catalog/adapter';
import { installCatalog, installFileCatalog, placeCountry } from '../src/catalog/registry';
import { CATALOG_AREAS, configureArea } from '../src/domain/catalogAreas';
import { configureItinerary, initialConfigurator } from '../src/domain/configurator';
import { createEmptyTrip } from '../src/domain/defaults';
import { upgradeCatalog } from '../src/domain/countries';
import { fromRows, toRows } from '../src/domain/rows';

const seeds = RANGE_CODES.map(buildCatalogRange);

test('Tutte le 22 nazioni nel range 300–400; nessun archivio fittizio per le aree', () => {
  const all = [...seeds, buildNorthernAsia('IN'), buildNorwayV5()];
  assert.equal(all.length, 22);
  assert.equal(new Set(all.map((s) => s.country.code)).size, 22);
  for (const seed of all) assert.ok(seed.places.length >= 300 && seed.places.length <= 400, `${seed.country.code}: ${seed.places.length}`);
  const catalog = combineCatalogs(all.map((s) => adaptBundle(checkBundle(seedBundle(s)))));
  assert.equal(catalog.countries.length, 22);
  assert.equal(new Set(catalog.destinations.map((d) => d.id)).size, catalog.destinations.length);
});

test('Release additive: le vecchie schede, foto, fonti e regioni restano identiche', () => {
  for (const code of RANGE_CODES) {
    const before = buildBeforeRange(code); const next = buildCatalogRange(code);
    assert.equal(next.release.version, before.release.version + 1);
    assert.equal(next.release.previousReleaseId, `${code}-${before.release.version}`);
    assert.deepEqual(next.country, before.country);
    assert.deepEqual(next.places.slice(0, before.places.length), before.places);
    assert.deepEqual(next.regions.slice(0, before.regions.length), before.regions);
    assert.equal(new Set(next.places.map((p) => p.wiki?.qid)).size, next.places.length);
    assert.equal(generateSql(next), readFileSync(new URL(`../supabase/seed/${next.outFile}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n'));
  }
});

test('Nuove schede: identificativi, categorie, coordinate, foto licenziate e incertezza esplicita', () => {
  for (const seed of seeds) {
    const previous = buildBeforeRange(seed.country.code);
    for (const p of seed.places.slice(previous.places.length)) {
      assert.match(p.key, new RegExp(`^${seed.country.code.toLowerCase()}-wd-q\\d+$`));
      assert.equal(p.coordsStatus, 'verificate');
      assert.equal(p.reliability, 'da_verificare');
      assert.ok(Number.isFinite(p.lat) && Number.isFinite(p.lng));
      assert.ok(seed.regions.some((r) => r.key === p.regionKey));
      assert.ok(p.sources.scheda?.some((s) => /P31\/P279/.test(s.note ?? '')));
      assert.equal(p.visitHours, undefined);
      assert.equal(p.kidScore, undefined);
      assert.equal(p.difficulty, undefined);
      for (const photo of p.photos ?? []) assert.ok(photo.author && photo.license && photo.licenseUrl?.startsWith('http'));
      if (p.category === 'treni') assert.equal(p.dayVisit, false);
      if (p.sources.scheda?.some((s) => s.note?.includes('classe Q532'))) assert.equal(p.isBase, false, 'Un villaggio non verificato per gli alloggi non deve diventare una base automatica');
      assert.match(p.texts.it!.description, /da verificare/);
      assert.ok(!['Q183', 'Q142', 'Q17', 'Q55', 'Q35', 'Q34', 'Q215', 'Q40', 'Q29', 'Q45', 'Q224', 'Q41', 'Q43', 'Q189', 'Q33', 'Q145', 'Q27', 'Q869', 'Q424', 'Q881'].includes(p.wiki?.qid ?? ''));
      assert.notEqual(p.texts.it!.name.toLowerCase(), seed.country.name.toLowerCase());
    }
  }
});

test('Scozia e India mantengono il perimetro delle proposte anche con nuove regioni', () => {
  const catalog = combineCatalogs([...seeds, buildNorthernAsia('IN')].map((s) => adaptBundle(checkBundle(seedBundle(s)))));
  try {
    installCatalog(catalog);
    const trip = { ...createEmptyTrip(), countries: catalog.countries.map((c) => ({ code: c.code, releaseId: c.releaseId })) };
    for (const area of CATALOG_AREAS) {
      const input = configureArea(initialConfigurator(trip), area.id, catalog.destinations, placeCountry);
      const result = configureItinerary(input);
      assert.ok(result.plan.stops.every((s) => !s.destinationId || input.scopePlaceIds!.includes(s.destinationId)));
      assert.ok(Object.values(result.plan.days).flatMap((d) => d.activities).every((a) => !a.destinationId || input.scopePlaceIds!.includes(a.destinationId)));
    }
  } finally { installFileCatalog(); }
});

test('Aggiornare il catalogo non aggiunge tappe o attività e conserva idee e riferimenti nei backup', () => {
  for (const seed of seeds) {
    const before = buildBeforeRange(seed.country.code);
    const key = before.places[0]!.key;
    const trip = { ...createEmptyTrip(), countries: [{ code: seed.country.code, releaseId: `${seed.country.code}-${before.release.version}` }], favorites: [key] };
    const next = upgradeCatalog(trip, seed.country.code, `${seed.country.code}-${seed.release.version}`);
    assert.equal(next.stops, trip.stops); assert.equal(next.days, trip.days); assert.equal(next.favorites, trip.favorites);
    assert.deepEqual(fromRows(JSON.parse(JSON.stringify(toRows(next).rows))).countries, next.countries);
    assert.ok(seed.places.some((p) => p.key === key));
  }
});
