import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { buildNorthernAsia, NORTHERN_ASIA_CODES } from '../scripts/build-northern-asia';
import { generateSql, seedBundle } from '../scripts/seed-catalog';
import { adaptBundle, checkBundle, combineCatalogs } from '../src/catalog/adapter';
import { installCatalog, installFileCatalog, placeCountry } from '../src/catalog/registry';
import { CATALOG_AREAS, configureArea, destinationInArea } from '../src/domain/catalogAreas';
import { configureItinerary, initialConfigurator } from '../src/domain/configurator';
import { createEmptyTrip } from '../src/domain/defaults';
import { tripToIcs } from '../src/domain/exportFormats';
import { defaultDestinationNights } from '../src/domain/placement';
import { fromRows, toRows } from '../src/domain/rows';
import type { Trip } from '../src/domain/types';

const counts = { IS: 127, FI: 177, GB: 273, IE: 147, TH: 156, KH: 101, VN: 134, IN: 302 };
const seeds = NORTHERN_ASIA_CODES.map(buildNorthernAsia);
const catalogs = seeds.map((s) => adaptBundle(checkBundle(seedBundle(s))));

test('Otto cataloghi: schede univoche, provenienza, licenze e SQL riproducibile', () => {
  for (const seed of seeds) {
    const count = counts[seed.country.code as keyof typeof counts];
    assert.equal(seed.places.length, count);
    assert.equal(new Set(seed.places.map((p) => p.key)).size, count);
    assert.equal(new Set(seed.places.map((p) => p.wiki?.qid)).size, count);
    assert.equal(generateSql(seed), readFileSync(new URL(`../supabase/seed/${seed.outFile}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n'));
    for (const p of seed.places) {
      assert.ok(Number.isFinite(p.lat) && Number.isFinite(p.lng));
      assert.ok(seed.regions.some((r) => r.key === p.regionKey));
      assert.equal(p.reliability, 'da_verificare');
      assert.equal(p.coordsStatus, 'verificate');
      assert.equal(p.visitHours, undefined);
      assert.equal(p.kidScore, undefined);
      assert.ok(p.sources.coordinate?.every((s) => s.url?.includes(p.wiki!.qid!) && s.checkedAt && s.license === 'CC0-1.0'));
      if (p.category === 'aeroporti') assert.match(p.iata!, /^[A-Z]{3}$/);
      for (const photo of p.photos ?? []) assert.ok(photo.author && photo.license && /^https?:\/\//.test(photo.licenseUrl ?? ''));
    }
  }
});

test('Scozia e India Nord/Sud sono aree disgiunte senza nazioni o schede duplicate', () => {
  const catalog = combineCatalogs(catalogs);
  assert.equal(catalog.countries.length, 8);
  assert.equal(new Set(catalog.destinations.map((d) => d.id)).size, 1417);
  for (const [code, expected] of [['GB', [122, 151]], ['IN', [150, 152]]] as const) {
    const areas = CATALOG_AREAS.filter((a) => a.countryCode === code);
    const destinations = catalog.destinations.filter((d) => catalog.placeCountry[d.id] === code);
    assert.deepEqual(areas.map((a) => destinations.filter((d) => destinationInArea(d, code, a.id)).length), expected);
    assert.ok(destinations.every((d) => areas.filter((a) => destinationInArea(d, code, a.id)).length === 1));
    assert.ok(destinations.every((d) => !destinationInArea(d, 'NO', areas[0]!.id)));
  }
  assert.equal(catalog.countries.find((c) => c.code === 'GB')?.currency, 'GBP');
  assert.equal(catalog.countries.find((c) => c.code === 'IN')?.timezone, 'Asia/Kolkata');
});

test('Proposte delle aree: aeroporti, tappe e visite restano nel perimetro; preferiti e viaggio intatti', () => {
  const catalog = combineCatalogs(catalogs);
  try {
    installCatalog(catalog);
    const trip: Trip = { ...createEmptyTrip(), countries: catalog.countries.map((c) => ({ code: c.code, releaseId: c.releaseId })), favorites: catalog.destinations.filter((d) => d.category === 'citta').map((d) => d.id) };
    const before = JSON.stringify(trip);
    const initial = initialConfigurator(trip);
    for (const area of CATALOG_AREAS) {
      const input = configureArea(initial, area.id, catalog.destinations, placeCountry);
      assert.equal(input.days, initial.days);
      assert.equal(input.startDate, initial.startDate);
      assert.ok(input.mustSee.every((id) => input.scopePlaceIds!.includes(id)));
      // Una scelta contenuta evita di obbligare centinaia di basi nella fixture.
      const result = configureItinerary({ ...input, mustSee: input.mustSee.slice(0, 1) });
      const ids = [...result.plan.stops.map((s) => s.destinationId), ...Object.values(result.plan.days).flatMap((d) => d.activities.map((a) => a.destinationId))].filter(Boolean);
      assert.ok(ids.length >= 2);
      assert.ok(ids.every((id) => input.scopePlaceIds!.includes(id!)));
      const restored = initialConfigurator(trip, input);
      assert.deepEqual(restored.scopePlaceIds, input.scopePlaceIds);
      assert.ok(restored.mustSee.every((id) => input.scopePlaceIds!.includes(id)));
      assert.equal(JSON.stringify(trip), before);
    }
    assert.throws(() => configureArea(initial, 'unknown', catalog.destinations, placeCountry), /Nessun aeroporto/);
  } finally { installFileCatalog(); }
});

test('Nodi logistici e configuratore: nessuna visita o notte automatica in stazione, aeroporto o porto', () => {
  try {
    for (const catalog of catalogs) {
      installCatalog(catalog);
      const trip = { ...createEmptyTrip(), countries: catalog.countries.map((c) => ({ code: c.code, releaseId: c.releaseId })) };
      const result = configureItinerary(initialConfigurator(trip));
      const logistics = catalog.destinations.filter((d) => d.transportPoint || ['aeroporti', 'porti'].includes(d.category));
      assert.ok(logistics.every((d) => defaultDestinationNights(d) === 0));
      assert.ok(Object.values(result.plan.days).flatMap((d) => d.activities).every((a) => !logistics.some((d) => d.id === a.destinationId)));
      if (catalog.countries[0]!.code === 'IS') assert.equal(catalog.destinations.filter((d) => d.category === 'treni').length, 0);
    }
  } finally { installFileCatalog(); }
});

test('Valute e cataloghi sopravvivono a esportazione e ripristino, senza cambi inventati', () => {
  const catalog = combineCatalogs(catalogs);
  const trip = { ...createEmptyTrip(), countries: catalog.countries.map((c) => ({ code: c.code, releaseId: c.releaseId })) };
  const back = fromRows(JSON.parse(JSON.stringify(toRows(trip).rows)));
  assert.deepEqual(back.countries, trip.countries);
  for (const code of ['ISK', 'GBP', 'THB', 'KHR', 'VND', 'INR']) {
    assert.ok(catalog.countries.some((c) => c.currency === code));
    assert.equal(back.rates?.[code], undefined);
  }
});

test('Calendario: India a UTC+05:30, Islanda UTC; orari assenti non inventati', () => {
  const flight = { id: 'f', direction: 'andata' as const, fromAirport: 'DEL', toAirport: 'KEF', date: '2027-08-01', departureTime: '12:00', airline: '', flightNumber: '', baggage: '', selected: true, priceStatus: 'da_verificare' as const, notes: '' };
  const trip = { ...createEmptyTrip(), flights: [flight] };
  const zones = { stops: {}, airports: { DEL: 'Asia/Kolkata', KEF: 'Atlantic/Reykjavik' } };
  assert.ok(tripToIcs(trip, undefined, 'Asia/Kolkata', zones).includes('DTSTART:20270801T063000Z'));
  assert.ok(tripToIcs({ ...trip, flights: [{ ...flight, fromAirport: 'KEF', toAirport: 'DEL' }] }, undefined, 'Atlantic/Reykjavik', zones).includes('DTSTART:20270801T120000Z'));
  assert.ok(!tripToIcs({ ...trip, flights: [{ ...flight, departureTime: '' }] }, undefined, 'Asia/Kolkata', zones).includes('T063000Z'));
});
