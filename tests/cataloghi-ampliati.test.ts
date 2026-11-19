import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { buildInternational, buildInternationalV2, INTERNATIONAL_CODES } from '../scripts/build-international';
import { generateSql, seedBundle } from '../scripts/seed-catalog';
import { adaptBundle, checkBundle, combineCatalogs } from '../src/catalog/adapter';
import { installCatalog, installFileCatalog } from '../src/catalog/registry';
import { configureItinerary, initialConfigurator } from '../src/domain/configurator';
import { createEmptyTrip } from '../src/domain/defaults';
import { defaultDestinationNights } from '../src/domain/placement';
import { matchPlace } from '../src/domain/placeMatch';
import { RAIL_PLANNERS } from '../src/data/railPlanners';
import { toRows, fromRows } from '../src/domain/rows';
import type { Trip } from '../src/domain/types';

const expanded = INTERNATIONAL_CODES.map(buildInternationalV2);
const totals = { DE: 200, FR: 203, JP: 213, NL: 205, DK: 207, SE: 210 };

test('Sei cataloghi ampliati: copertura, fonti, unicità e prime versioni conservate', () => {
  let count = 0;
  for (const code of INTERNATIONAL_CODES) {
    const first = buildInternational(code);
    const next = buildInternationalV2(code);
    assert.equal(next.places.length, totals[code]);
    assert.equal(next.release.previousReleaseId, `${code}-1`);
    assert.deepEqual(next.places.slice(0, first.places.length), first.places);
    assert.deepEqual(next.regions.slice(0, first.regions.length), first.regions);
    assert.equal(new Set(next.places.map((p) => p.key)).size, next.places.length);
    assert.equal(new Set(next.places.map((p) => p.wiki?.qid)).size, next.places.length);
    assert.ok(next.places.filter((p) => p.category === 'musei').length >= 45);
    assert.ok(next.places.filter((p) => p.category === 'citta').length >= 50);
    assert.ok(next.places.filter((p) => p.category === 'aeroporti').length >= 5);
    assert.ok(next.places.filter((p) => p.category === 'treni').length >= 25);
    assert.ok(next.places.filter((p) => p.category === 'porti').length >= 4);
    for (const p of next.places) {
      assert.ok(Number.isFinite(p.lat) && Number.isFinite(p.lng), p.key);
      assert.ok(p.sources.coordinate?.every((s) => s.checkedAt && s.url && s.license === 'CC0-1.0'));
      assert.equal(p.reliability, 'da_verificare');
      assert.ok(p.texts.it?.description);
      assert.ok(next.regions.some((r) => r.key === p.regionKey));
      for (const photo of p.photos ?? []) assert.ok(photo.author && photo.license && /^https?:\/\//.test(photo.licenseUrl ?? ''), p.key);
    }
    assert.equal(generateSql(next), readFileSync(new URL(`../supabase/seed/${next.outFile}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n'));
    count += next.places.length;
  }
  assert.equal(count, 1238);
});

test('Porti, stazioni e aeroporti restano punti logistici, senza visite o notti automatiche', () => {
  try {
    for (const seed of expanded) {
      const catalog = adaptBundle(checkBundle(seedBundle(seed)));
      installCatalog(catalog);
      assert.equal(catalog.destinations.length, seed.places.length);
      assert.equal(catalog.countries[0]?.placeCount, seed.places.length);
      const points = catalog.destinations.filter((d) => d.category === 'porti' || d.category === 'treni' || d.category === 'aeroporti');
      for (const p of points) {
        assert.equal(defaultDestinationNights(p), 0, p.id);
        if (p.category !== 'aeroporti') assert.ok(catalog.notVisits.includes(p.id));
      }
      const station = points.find((d) => d.category === 'treni')!;
      assert.equal(station.transportPoint, true);
      assert.equal(matchPlace(station, [station]), undefined, 'una località libera non viene collegata automaticamente a una stazione');
      const trip = { ...createEmptyTrip(), countries: [{ code: seed.country.code, releaseId: `${seed.country.code}-2` }] };
      const input = { ...initialConfigurator(trip), kidFriendly: false, mustSee: [station.id] };
      const proposal = configureItinerary(input);
      assert.ok(Object.values(proposal.plan.days).flatMap((d) => d.activities).every((a) => !points.some((p) => p.id === a.destinationId)));
      assert.ok(!proposal.plan.stops.some((s) => s.destinationId === station.id));
      const port = points.find((d) => d.category === 'porti')!;
      assert.match(port.description, /terminal|accessi/);
      assert.ok(seed.places.find((p) => p.key === port.id)?.sources.coordinate?.some((s) => s.note?.includes('non al molo')));
      assert.ok(RAIL_PLANNERS[seed.country.code]?.checkedAt);
    }
  } finally { installFileCatalog(); }
});

test('Nuovi nodi logistici conservano i riferimenti nella serializzazione multinazione', () => {
  const catalog = combineCatalogs(expanded.map((s) => adaptBundle(checkBundle(seedBundle(s)))));
  const points = catalog.destinations.filter((d) => d.transportPoint || d.category === 'porti');
  const trip: Trip = { ...createEmptyTrip(), countries: expanded.map((s) => ({ code: s.country.code, releaseId: `${s.country.code}-2` })), stops: points.map((d, i) => ({ id: `logistica-${i}`, kind: 'luogo', name: d.name, destinationId: d.id, lat: d.lat, lng: d.lng, nights: 0, notes: '', weatherPlanB: '', countryCode: catalog.placeCountry[d.id] })) };
  const back = fromRows(JSON.parse(JSON.stringify(toRows(trip).rows)));
  assert.deepEqual(back.countries, trip.countries);
  assert.deepEqual(back.stops.map((s) => [s.destinationId, s.nights, s.countryCode]), trip.stops.map((s) => [s.destinationId, s.nights, s.countryCode]));
});
