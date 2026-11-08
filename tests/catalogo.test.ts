import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildNorway, seedBundle, type CatalogSeed } from '../scripts/seed-catalog';
import { adaptBundle, checkBundle, combineCatalogs, type CatalogBundle } from '../src/catalog/adapter';
import { catalogState, installCatalog, installFileCatalog, placeCountry } from '../src/catalog/registry';
import { ATTRACTION_INFO } from '../src/data/attractions';
import { COASTAL_CATALOG } from '../src/data/coastalCatalog';
import { COASTAL_FACTS, COASTAL_PORTS_NORTHBOUND, COASTAL_SOURCES } from '../src/data/coastalPorts';
import { DESTINATIONS, findDestination } from '../src/data/destinations';
import { OFFICIAL_SITES } from '../src/data/officialSites';
import { COUNTIES, REGION_COUNTIES } from '../src/data/regionShapes';
import { WIKI } from '../src/data/wiki';
import { BASE_IDS, NOT_VISITS, railFor } from '../src/domain/configurator';
import { canonical } from '../src/domain/rows';

const json = (v: unknown) => JSON.stringify(canonical(JSON.parse(JSON.stringify(v))));
const bundleNO = () => JSON.parse(JSON.stringify(seedBundle(buildNorway(), { publishedAt: '2026-11-06T00:00:00+00:00' }))) as CatalogBundle;

/** Nazione di prova (solo nei test): valuta XTS, codice ISO riservato alle prove */
export function testCountrySeed(): CatalogSeed {
  return {
    country: { code: 'XT', name: 'Nazione di prova', names: {}, currency: 'XTS', timezone: 'Europe/Stockholm', language: 'sv' },
    release: { version: 1, dataCheckedUntil: '2026-11-06', notes: 'prova', sourceNotes: [], roadCalibrated: false, roadNote: 'non tarata' },
    regions: [{ key: 'xt-sud', name: 'Sud di prova', areas: [], sources: [] }],
    places: [
      { key: 'xt-citta', category: 'citta', regionKey: 'xt-sud', lat: 59.33, lng: 18.06, coordsStatus: 'approssimative', reliability: 'da_verificare', isBase: true, dayVisit: true, difficulty: 'facile', kidScore: 3, texts: { it: { name: 'Città di prova', description: 'd', access: 'a', season: 's' } }, sources: { coordinate: [{ label: 'stima', method: 'stima' }] } },
      { key: 'xt-museo', category: 'musei', regionKey: 'xt-sud', lat: 59.32, lng: 18.07, coordsStatus: 'approssimative', reliability: 'da_verificare', isBase: false, dayVisit: true, difficulty: 'facile', kidScore: 2, texts: { it: { name: 'Museo di prova', description: 'd', access: 'a', season: 's' } }, sources: {} },
    ],
    operators: [],
    voyages: [],
    routePorts: [],
    links: [],
    outFile: 'prova.sql',
  };
}

test('Catalogo: dal bundle di NO-1 le stesse strutture dei file (82 luoghi, stesse fonti)', () => {
  const c = adaptBundle(bundleNO());
  assert.equal(c.destinations.length, DESTINATIONS.length);
  assert.equal(c.destinations.length, 82);
  const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : 1);
  assert.equal(json([...c.destinations].sort(byId)), json([...DESTINATIONS].sort(byId)), 'luoghi identici, comprese le fonti delle coordinate');
  assert.equal(json(c.officialSites), json(OFFICIAL_SITES));
  assert.equal(json(c.wiki), json(WIKI));
  assert.equal(json(c.voyages), json(COASTAL_CATALOG));
  assert.equal(json(c.ports), json(COASTAL_PORTS_NORTHBOUND));
  assert.equal(json(c.operatorFacts), json(COASTAL_FACTS));
  assert.equal(json(c.operatorSources), json(COASTAL_SOURCES));
  const byNr = (a: { nr: string }, b: { nr: string }) => (a.nr < b.nr ? -1 : 1);
  assert.equal(json([...c.counties].sort(byNr)), json([...COUNTIES].sort(byNr)));
  assert.equal(json(c.regionCounties), json(REGION_COUNTIES));
  assert.deepEqual([...c.baseIds].sort(), [...BASE_IDS].sort());
  assert.deepEqual([...c.notVisits].sort(), [...NOT_VISITS].sort());
  assert.equal(railFor('oslo', 'bergen')?.label, c.rail['bergen|oslo']?.label);
  // Schede delle attrazioni: tutti i campi usati dall'app; le coordinate sono quelle del luogo
  assert.deepEqual(Object.keys(c.attractions).sort(), Object.keys(ATTRACTION_INFO).sort());
  for (const [k, a] of Object.entries(ATTRACTION_INFO)) {
    const rest: Partial<typeof a> = { ...a };
    delete rest.coords;
    const { coords, ...got } = c.attractions[k]!;
    assert.equal(json(got), json(rest), k);
    const d = findDestination(k)!;
    assert.deepEqual(coords, { lat: d.lat, lng: d.lng });
  }
  assert.equal(c.countries[0]!.currency, 'NOK');
  assert.equal(c.countries[0]!.timezone, 'Europe/Oslo');
  assert.equal(c.countries[0]!.placeCount, 82);
});

test('Catalogo: bundle incompleto o versione inesistente rifiutati', () => {
  assert.throws(() => checkBundle({ release: null, country: null }), /non trovata/);
  const b = bundleNO() as unknown as Record<string, unknown>;
  delete b.places;
  assert.throws(() => checkBundle(b), /incompleto/);
});

test('Catalogo: una seconda nazione si somma senza modifiche al codice; il registro sostituisce e ripristina', () => {
  const no = adaptBundle(bundleNO());
  const xt = adaptBundle(JSON.parse(JSON.stringify(seedBundle(testCountrySeed()))) as CatalogBundle);
  const both = combineCatalogs([no, xt]);
  assert.equal(both.destinations.length, 84);
  assert.deepEqual(both.countries.map((c) => c.currency), ['NOK', 'XTS']);
  assert.equal(xt.countries[0]!.roadCalibrated, false);
  try {
    installCatalog(both);
    assert.equal(DESTINATIONS.length, 84, 'le strutture importate dalle viste vedono il catalogo nuovo');
    assert.equal(findDestination('xt-museo')?.name, 'Museo di prova');
    assert.ok(BASE_IDS.includes('xt-citta'));
    assert.equal(placeCountry('xt-museo'), 'XT');
    assert.equal(placeCountry('oslo'), 'NO');
    assert.equal(catalogState().source, 'cloud');
    installCatalog(xt);
    assert.equal(findDestination('oslo'), undefined, 'togliendo la Norvegia i suoi luoghi non si vedono');
  } finally {
    installFileCatalog();
  }
  assert.equal(DESTINATIONS.length, 82);
  assert.equal(catalogState().source, 'file');
  assert.ok(findDestination('oslo'));
});

import { loadTripCatalogs, pruneCatalogs, type CatalogTransport } from '../src/services/catalog/catalogService';
import { memoryStore } from '../src/services/storage/dataStore';
import { tripCountries } from '../src/domain/countries';

function fakeTransport(bundles: Record<string, unknown>, log: string[] = []): CatalogTransport {
  return {
    bundle: async (id) => {
      log.push(id);
      if (!(id in bundles)) throw new Error('Server cloud non raggiungibile');
      return JSON.parse(JSON.stringify(bundles[id]));
    },
    available: async () => [],
  };
}

test('Catalogo: download una volta, poi copia offline; senza rete resta «da scaricare»', async () => {
  const store = memoryStore();
  const log: string[] = [];
  const tx = fakeTransport({ 'NO-1': bundleNO(), 'XT-1': seedBundle(testCountrySeed()) }, log);
  const countries = [{ code: 'NO', releaseId: 'NO-1' }, { code: 'XT', releaseId: 'XT-1' }];
  const first = await loadTripCatalogs(countries, store, tx);
  assert.deepEqual(first.states, { NO: 'sul_dispositivo', XT: 'sul_dispositivo' });
  assert.equal(first.catalog?.destinations.length, 84);
  const offline = await loadTripCatalogs(countries, store, undefined);
  assert.equal(offline.catalog?.destinations.length, 84, 'senza rete dalla copia offline');
  assert.deepEqual(log, ['NO-1', 'XT-1'], 'nessun secondo download');
  const missing = await loadTripCatalogs([{ code: 'YY', releaseId: 'YY-1' }], store, fakeTransport({}));
  assert.equal(missing.states.YY, 'errore');
  assert.match(missing.errors.YY!, /raggiungibile/);
  assert.equal((await loadTripCatalogs([{ code: 'YY', releaseId: 'YY-1' }], store)).states.YY, 'da_scaricare');
  await pruneCatalogs(store, ['NO-1']);
  assert.deepEqual(await store.keys('cataloghi'), ['NO-1']);
});

test('Catalogo: il viaggio resta sulla sua versione anche se ne esce una più recente', async () => {
  const store = memoryStore();
  const v2 = JSON.parse(JSON.stringify(bundleNO()));
  v2.release.release_id = 'NO-2';
  v2.release.version = 2;
  const tx = fakeTransport({ 'NO-1': bundleNO(), 'NO-2': v2 });
  const r = await loadTripCatalogs(tripCountries({}), store, tx);
  assert.equal(r.catalog?.countries[0]?.releaseId, 'NO-1', 'viaggio vecchio: Norvegia versione 1');
  // Un server che risponde con un'altra versione non entra nella copia offline
  const wrong = fakeTransport({ 'NO-3': v2 });
  const bad = await loadTripCatalogs([{ code: 'NO', releaseId: 'NO-3' }], memoryStore(), wrong);
  assert.equal(bad.states.NO, 'errore');
});
