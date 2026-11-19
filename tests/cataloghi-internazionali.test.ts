import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { buildInternational, INTERNATIONAL_CODES } from '../scripts/build-international';
import { buildNorwayV5, generateSql, seedBundle } from '../scripts/seed-catalog';
import { adaptBundle, checkBundle, combineCatalogs } from '../src/catalog/adapter';
import { installCatalog, installFileCatalog } from '../src/catalog/registry';
import { DESTINATIONS } from '../src/data/destinations';
import { computeBudget } from '../src/domain/budget';
import { configureItinerary, initialConfigurator } from '../src/domain/configurator';
import { createEmptyTrip } from '../src/domain/defaults';
import { tripToIcs } from '../src/domain/exportFormats';
import { flightAdvice, norwayAirports } from '../src/domain/flightAdvisor';
import { syncLegs } from '../src/domain/itinerary';
import { fromRows, toRows } from '../src/domain/rows';
import { attractionsForStop, planAttraction, saveIdea, stopDays } from '../src/domain/thingsToDo';
import type { Trip } from '../src/domain/types';

const seeds = INTERNATIONAL_CODES.map(buildInternational);
const norway = buildNorwayV5();

test('Calendario: fuso dell’aeroporto di partenza e nessuna data di arrivo inventata', () => {
  const t: Trip = { ...createEmptyTrip(), flights: [{ id: 'flight', direction: 'andata', fromAirport: 'HND', toAirport: 'CDG', date: '2027-08-01', departureTime: '10:00', arrivalTime: '18:00', airline: '', flightNumber: '', baggage: '', priceStatus: 'da_verificare', selected: true, notes: '' }] };
  const ics = tripToIcs(t, new Date('2026-11-19T00:00:00Z'), 'Europe/Paris', { stops: {}, airports: { HND: 'Asia/Tokyo', CDG: 'Europe/Paris' } });
  assert.ok(ics.includes('DTSTART:20270801T010000Z'));
  assert.ok(!ics.includes('DTEND:'));
});
const bounds: Record<string, [number, number, number, number]> = {
  DE: [47, 55.2, 5.5, 15.5], FR: [41, 51.2, -5.5, 10], JP: [24, 46, 122, 146],
  NL: [50.7, 53.7, 3, 7.3], DK: [54.4, 58, 7.7, 15.3], SE: [55, 69.2, 10.5, 24.5],
};

test('Sei cataloghi con chiavi globali, coordinate con fonte e metadati incompleti dichiarati', () => {
  const keys = new Set<string>();
  for (const seed of seeds) {
    assert.equal(seed.places.length, 30);
    assert.ok(seed.regions.length >= 5);
    const [south, north, west, east] = bounds[seed.country.code]!;
    assert.ok(seed.places.filter((p) => p.isBase).length >= 8);
    assert.equal(seed.places.filter((p) => p.iata).length, 3);
    for (const p of seed.places) {
      assert.ok(!keys.has(p.key)); keys.add(p.key);
      assert.ok(p.key.startsWith(`${seed.country.code.toLowerCase()}-`));
      assert.ok(p.lat >= south && p.lat <= north && p.lng >= west && p.lng <= east, p.key);
      assert.match(p.sources.coordinate![0]!.url!, /wikidata.org\/wiki\/Q\d+/);
      assert.equal(p.sources.coordinate![0]!.license, 'CC0-1.0');
      assert.equal(p.reliability, 'da_verificare');
      assert.equal(p.kidScore, undefined);
      assert.equal(p.visitHours, undefined);
      assert.match(p.texts.it!.season, /verificare/);
      for (const photo of p.photos ?? []) {
        assert.ok(photo.file && photo.author && photo.licenseUrl);
        assert.match(photo.license, /^(CC BY|CC0|Public domain)/);
      }
    }
    assert.equal(generateSql(seed), readFileSync(new URL(`../supabase/seed/${seed.outFile}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n'));
  }
  assert.equal(keys.size, 180);
});

test('Adattatore e combinazione: sette nazioni senza collisioni, IATA e dati ignoti preservati', () => {
  const all = [norway, ...seeds].map((s) => adaptBundle(checkBundle(seedBundle(s))));
  const c = combineCatalogs(all);
  assert.equal(c.countries.length, 7);
  assert.equal(new Set(c.destinations.map((d) => d.id)).size, c.destinations.length);
  assert.equal(c.destinations.find((d) => d.id === 'jp-hnd')?.iata, 'HND');
  assert.equal(c.destinations.find((d) => d.id === 'de-berlino')?.kidScore, undefined);
  assert.equal(c.destinations.find((d) => d.id === 'de-berlino')?.difficulty, undefined);
  assert.equal(c.countries.find((s) => s.code === 'JP')?.timezone, 'Asia/Tokyo');
  assert.deepEqual(c.countries.filter((s) => ['JP', 'DK', 'SE'].includes(s.code)).map((s) => s.currency), ['JPY', 'DKK', 'SEK']);
});

test('Ogni nazione funziona dal configuratore e dai consigli voli con le chiavi degli aeroporti prefissate', () => {
  try {
    for (const seed of seeds) {
      installCatalog(adaptBundle(checkBundle(seedBundle(seed))));
      const base = { ...createEmptyTrip(), countries: [{ code: seed.country.code, releaseId: `${seed.country.code}-1` }] };
      const input = initialConfigurator(base, { arrivalAirportId: 'bgo', regions: ['Fiordi occidentali'], modes: ['nave'] });
      assert.ok(input.arrivalAirportId.startsWith(seed.country.code.toLowerCase()));
      assert.deepEqual(input.modes, ['auto']);
      assert.ok(!input.regions.includes('Fiordi occidentali'));
      const result = configureItinerary(input);
      assert.ok(result.plan.stops.length >= 2);
      assert.ok(result.plan.stops.every((s) => s.destinationId?.startsWith(`${seed.country.code.toLowerCase()}-`)));
      assert.ok(Object.values(result.plan.days).every((d) => d.activities.every((a) => a.durationMin === undefined)), 'durate ignote non trasformate in tempi certi');
      const airport = DESTINATIONS.find((d) => d.id === input.arrivalAirportId)!;
      const t: Trip = { ...base, stops: [{ id: 's', kind: 'luogo', destinationId: airport.id, name: airport.name, lat: airport.lat, lng: airport.lng, nights: 1, notes: '', weatherPlanB: '' }] };
      assert.equal(norwayAirports().find((a) => a.destinationId === airport.id)?.code, airport.iata);
      assert.equal(flightAdvice(t).arrival?.options[0]?.code, airport.iata);
    }
  } finally { installFileCatalog(); }
});

test('Attività e serializzazione: idea senza programma, visita esplicita, riferimenti e valute nel round-trip', () => {
  try {
    installCatalog(combineCatalogs(seeds.map((s) => adaptBundle(checkBundle(seedBundle(s))))));
    const city = DESTINATIONS.find((d) => d.id === 'jp-tokyo')!;
    let t: Trip = { ...createEmptyTrip(), countries: seeds.map((s) => ({ code: s.country.code, releaseId: `${s.country.code}-1` })), rates: { JPY: { perEur: 160, auto: false, note: 'Fixture' } }, stops: [{ id: 'tokyo', kind: 'luogo', destinationId: city.id, name: city.name, lat: city.lat, lng: city.lng, nights: 3, notes: '', weatherPlanB: '' }] };
    assert.ok(attractionsForStop(t, 'tokyo').some((a) => a.d.id === 'jp-ueno'));
    t = saveIdea(t, 'tokyo', 'jp-ueno');
    assert.deepEqual(t.days, {});
    t = planAttraction(t, 'tokyo', 'jp-ueno', stopDays(t, 'tokyo')[0]!.key);
    const back = fromRows(JSON.parse(JSON.stringify(toRows(t).rows)));
    assert.deepEqual(back.countries, t.countries);
    assert.deepEqual(back.rates, t.rates);
    assert.equal(Object.values(back.days).flatMap((d) => d.activities).filter((a) => a.destinationId === 'jp-ueno').length, 1);
    assert.equal(Object.values(back.days)[0]!.activities[0]!.costStatus, 'da_verificare');
  } finally { installFileCatalog(); }
});

test('Prezzo carburante norvegese escluso dai tratti di altre nazioni', () => {
  const stops: Trip['stops'] = [{ id: 'a', kind: 'luogo', name: 'Berlino', destinationId: 'de-berlino', lat: 52, lng: 13, nights: 2, notes: '', weatherPlanB: '' }, { id: 'b', kind: 'luogo', name: 'Potsdam', destinationId: 'de-potsdam', lat: 52, lng: 13, nights: 2, notes: '', weatherPlanB: '' }];
  const t: Trip = { ...createEmptyTrip(), countries: [{ code: 'DE', releaseId: 'DE-1' }], stops, legs: syncLegs(stops, []).map((l) => ({ ...l, segments: [{ id: 's', mode: 'strada', label: 'Fixture', distanceKm: 30, durationMin: 45, status: 'stimato', costStatus: 'stimato' }] })) };
  const b = computeBudget(t);
  assert.ok(!b.lines.some((l) => l.key === 'fuel'));
  assert.ok(b.missing.some((s) => s.includes('fuori dalla Norvegia')));
});
