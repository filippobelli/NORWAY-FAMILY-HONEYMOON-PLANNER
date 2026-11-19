import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ADDITIONAL_CODES, ADDITIONAL_PATCH_CODES, buildAdditionalCountry, buildAdditionalCountryV2, buildAdditionalLatest } from '../scripts/build-additional-countries';
import { buildInternationalV2, INTERNATIONAL_CODES } from '../scripts/build-international';
import { generateSql, seedBundle } from '../scripts/seed-catalog';
import { adaptBundle, checkBundle, combineCatalogs } from '../src/catalog/adapter';
import { installCatalog, installFileCatalog } from '../src/catalog/registry';
import { initialConfigurator, configureItinerary } from '../src/domain/configurator';
import { createEmptyTrip } from '../src/domain/defaults';
import { geographicTimezone } from '../src/domain/geographicTimezone';
import { airportCode, flightAdvice } from '../src/domain/flightAdvisor';
import { defaultDestinationNights } from '../src/domain/placement';
import { tripToIcs } from '../src/domain/exportFormats';
import { toRows, fromRows } from '../src/domain/rows';
import type { Trip } from '../src/domain/types';

const counts = { SI: 140, AT: 187, ES: 235, PT: 171, HR: 162, GR: 205, TR: 213 };
const seeds = ADDITIONAL_CODES.map(buildAdditionalLatest);

test('Correzioni editoriali versionate: solo le due schede dichiarate cambiano zona e testo', () => {
  for (const code of ADDITIONAL_PATCH_CODES) {
    const first = buildAdditionalCountry(code);
    const next = buildAdditionalCountryV2(code);
    assert.equal(next.release.previousReleaseId, `${code}-1`);
    assert.deepEqual(next.regions, first.regions);
    assert.equal(next.places.length, first.places.length);
    for (const place of first.places) {
      const after = next.places.find((p) => p.key === place.key)!;
      if (!next.correctedKeys?.includes(place.key)) assert.deepEqual(after, place);
      else { assert.notEqual(after.regionKey, place.regionKey); assert.deepEqual(after.photos, place.photos); assert.equal(after.lat, place.lat); assert.equal(after.lng, place.lng); }
    }
  }
});

test('Sette nazioni: schede con provenienza, nodi logistici e nessun dato operativo inventato', () => {
  for (const seed of seeds) {
    const code = seed.country.code as keyof typeof counts;
    assert.equal(seed.places.length, counts[code]);
    assert.equal(new Set(seed.places.map((p) => p.key)).size, counts[code]);
    assert.equal(new Set(seed.places.map((p) => p.wiki?.qid)).size, counts[code]);
    assert.ok(seed.places.filter((p) => p.category === 'musei').length >= 30);
    assert.ok(seed.places.filter((p) => p.category === 'treni').length >= 8);
    assert.ok(seed.places.filter((p) => p.category === 'aeroporti').length >= 3);
    if (code === 'AT') assert.equal(seed.places.filter((p) => p.category === 'porti').length, 0);
    for (const p of seed.places) {
      assert.ok(p.key.startsWith(`${code.toLowerCase()}-`));
      assert.ok(Number.isFinite(p.lat) && Number.isFinite(p.lng));
      assert.equal(p.coordsStatus, 'verificate');
      assert.equal(p.reliability, 'da_verificare');
      assert.equal(p.visitHours, undefined);
      assert.equal(p.kidScore, undefined);
      assert.ok(p.sources.coordinate?.every((s) => s.url?.includes(p.wiki!.qid!) && s.license === 'CC0-1.0' && s.checkedAt));
      assert.ok(seed.regions.some((r) => r.key === p.regionKey));
      assert.ok(p.texts.it?.description && !/Candidato/.test(p.texts.it.description));
      if (p.category === 'aeroporti') assert.match(p.iata!, /^[A-Z]{3}$/);
      for (const photo of p.photos ?? []) assert.ok(photo.author && photo.license && /^https?:\/\//.test(photo.licenseUrl ?? ''));
    }
    assert.equal(generateSql(seed), readFileSync(new URL(`../supabase/seed/${seed.outFile}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n'));
  }
});

test('Configuratore e voli: nuovi aeroporti, nessuna stazione proposta come attrazione', () => {
  try {
    for (const seed of seeds) {
      const catalog = adaptBundle(checkBundle(seedBundle(seed)));
      installCatalog(catalog);
      assert.equal(catalog.destinations.length, seed.places.length);
      const trip = { ...createEmptyTrip(), countries: [{ code: seed.country.code, releaseId: `${seed.country.code}-${seed.release.version}` }] };
      const input = initialConfigurator(trip, { arrivalAirportId: 'bgo', departureAirportId: 'osl' });
      const result = configureItinerary(input);
      assert.ok(result.plan.stops.length >= 2);
      const logistics = catalog.destinations.filter((d) => d.transportPoint || d.category === 'porti' || d.category === 'aeroporti');
      assert.ok(logistics.every((d) => defaultDestinationNights(d) === 0));
      assert.ok(Object.values(result.plan.days).flatMap((d) => d.activities).every((a) => !logistics.some((d) => d.id === a.destinationId)));
      const airport = catalog.destinations.find((d) => d.id === input.arrivalAirportId)!;
      const t: Trip = { ...trip, stops: [{ id: 'a', kind: 'luogo', name: airport.name, destinationId: airport.id, lat: airport.lat, lng: airport.lng, nights: 0, notes: '', weatherPlanB: '' }] };
      assert.equal(flightAdvice(t).arrival?.options[0]?.code, airportCode(airport));
    }
  } finally { installFileCatalog(); }
});

test('Tredici nazioni insieme: riferimenti, valuta TRY e serializzazione compatibili', () => {
  const catalog = combineCatalogs([...seeds, ...INTERNATIONAL_CODES.map(buildInternationalV2)].map((s) => adaptBundle(checkBundle(seedBundle(s)))));
  assert.equal(catalog.countries.length, 13);
  assert.equal(new Set(catalog.destinations.map((d) => d.id)).size, catalog.destinations.length);
  assert.equal(catalog.countries.find((c) => c.code === 'TR')?.currency, 'TRY');
  const trip: Trip = { ...createEmptyTrip(), countries: catalog.countries.map((c) => ({ code: c.code, releaseId: c.releaseId })), rates: { TRY: { perEur: 40, auto: false, note: 'Solo fixture di test' } } };
  const back = fromRows(JSON.parse(JSON.stringify(toRows(trip).rows)));
  assert.deepEqual(back.countries, trip.countries);
  assert.deepEqual(back.rates, trip.rates);
});

test('Iberia e isole: il calendario usa il fuso locale senza attribuire quello della terraferma', () => {
  const canary = geographicTimezone('ES', { lat: 28.05, lng: -16.57 }, 'Europe/Madrid');
  const azores = geographicTimezone('PT', { lat: 37.74, lng: -25.67 }, 'Europe/Lisbon');
  assert.equal(canary, 'Atlantic/Canary');
  assert.equal(azores, 'Atlantic/Azores');
  assert.equal(geographicTimezone('PT', { lat: 32.7, lng: -16.77 }, 'Europe/Lisbon'), 'Atlantic/Madeira');
  assert.equal(geographicTimezone('ES', { lat: 40.4, lng: -3.7 }, 'Europe/Madrid'), 'Europe/Madrid');
  assert.equal(geographicTimezone('TR', { lat: 41, lng: 29 }, 'Europe/Istanbul'), 'Europe/Istanbul');
  assert.equal(geographicTimezone('PT', {}, 'Europe/Lisbon'), 'Europe/Lisbon');
  assert.equal(geographicTimezone(undefined, { lat: 28, lng: -16 }, 'UTC'), 'UTC');
  const flight = { id: 'f', direction: 'andata' as const, fromAirport: 'TFS', toAirport: 'PDL', date: '2027-08-01', departureTime: '12:00', airline: '', flightNumber: '', baggage: '', selected: true, priceStatus: 'da_verificare' as const, notes: '' };
  const trip = { ...createEmptyTrip(), flights: [flight] };
  const ics = tripToIcs(trip, new Date('2026-11-19T12:00:00Z'), 'Europe/Madrid', { stops: {}, airports: { TFS: canary, PDL: azores } });
  assert.ok(ics.includes('DTSTART:20270801T110000Z'));
  const back = tripToIcs({ ...trip, flights: [{ ...flight, fromAirport: 'PDL', toAirport: 'TFS' }] }, undefined, 'Europe/Lisbon', { stops: {}, airports: { TFS: canary, PDL: azores } });
  assert.ok(back.includes('DTSTART:20270801T120000Z'));
});
