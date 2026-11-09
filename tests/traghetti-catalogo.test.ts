// Catalogo NO-2 con i traghetti: adattatore (chiavi ferry_* facoltative), registro, versione del catalogo da file,
// passaggio esplicito del viaggio da NO-1 a NO-2 senza perdere nulla (architettura §16.3).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildNorway, buildNorwayV2, seedBundle } from '../scripts/seed-catalog';
import { adaptBundle, checkBundle, combineCatalogs, type CatalogBundle } from '../src/catalog/adapter';
import { catalogState, installCatalog, installFileCatalog } from '../src/catalog/registry';
import { FILE_COUNTRY } from '../src/data/country';
import { FERRY_ROUTES, FERRY_SOURCES } from '../src/data/ferryRoutes';
import { addCountry, ensureCountries, releaseVersion, tripCountries, upgradeCatalog } from '../src/domain/countries';
import { createEmptyTrip } from '../src/domain/defaults';
import { tripFerryRoutes } from '../src/domain/ferries';
import { syncLegs } from '../src/domain/itinerary';
import { canonical, fromRows, toRows } from '../src/domain/rows';
import type { Stop, Trip } from '../src/domain/types';

const json = (v: unknown) => JSON.stringify(canonical(JSON.parse(JSON.stringify(v))));
const bundle = (seed: ReturnType<typeof buildNorway>) => JSON.parse(JSON.stringify(seedBundle(seed, { publishedAt: '2026-11-09T00:00:00+00:00' }))) as CatalogBundle;

test('Adattatore: dal bundle di NO-2 le stesse tratte e fonti del file (58 tratte, canonico)', () => {
  const c = adaptBundle(bundle(buildNorwayV2()));
  assert.equal(c.ferryRoutes.length, 58);
  assert.equal(json(c.ferryRoutes), json(FERRY_ROUTES), 'tratte identiche: tappe, tariffe, luoghi, fonti');
  assert.equal(json(c.ferrySources), json(FERRY_SOURCES));
  assert.equal(c.countries[0]!.releaseId, 'NO-2');
  assert.ok(Object.values(c.ferryRelease).every((r) => r === 'NO-2'));
  // NO-2 contiene NO-1: stessi luoghi e crociere
  const v1 = adaptBundle(bundle(buildNorway()));
  assert.equal(json(c.destinations), json(v1.destinations));
  assert.equal(json(c.voyages), json(v1.voyages));
});

test('Adattatore: NO-1 e copie offline senza chiavi ferry_* accettate, nessuna tratta', () => {
  const b = bundle(buildNorway());
  const old = { ...b } as Record<string, unknown>;
  for (const k of ['ferry_sources', 'ferry_routes', 'ferry_route_stops', 'ferry_route_places', 'ferry_fares']) delete old[k];
  const checked = checkBundle(old);
  const c = adaptBundle(checked);
  assert.deepEqual(c.ferryRoutes, []);
  assert.deepEqual(c.ferrySources, {});
  assert.equal(adaptBundle(b).ferryRoutes.length, 0, 'NO-1 ha le tabelle vuote');
  assert.equal(combineCatalogs([c, adaptBundle(bundle(buildNorwayV2()))]).ferryRoutes.length, 58);
});

test('Registro: il catalogo installato sostituisce le tratte; i file valgono come NO-2', () => {
  assert.equal(FILE_COUNTRY.releaseId, 'NO-2');
  assert.equal(FILE_COUNTRY.version, 2);
  installFileCatalog();
  assert.equal(catalogState().ferryRelease['bergen-flam-express'], 'NO-2');
  // Il seed legge l'array dei file: il bundle NO-2 si prepara prima di sostituirlo
  const v2 = adaptBundle(bundle(buildNorwayV2()));
  installCatalog(adaptBundle(bundle(buildNorway())));
  assert.equal(FERRY_ROUTES.length, 0, 'catalogo NO-1 dal cloud: nessuna tratta');
  assert.deepEqual(catalogState().ferryRelease, {});
  installCatalog(v2);
  assert.equal(FERRY_ROUTES.length, 58);
  installFileCatalog();
  assert.equal(FERRY_ROUTES.length, 58, 'ritorno ai file: tratte di nuovo presenti');
});

test('Tratte visibili solo con il viaggio su NO-2 (anche senza cloud: conta la versione del viaggio)', () => {
  installFileCatalog();
  const t = createEmptyTrip();
  const release = catalogState().ferryRelease;
  assert.equal(tripFerryRoutes({ countries: undefined }, FERRY_ROUTES, release).length, 0, 'viaggio vecchio = NO-1');
  assert.equal(tripFerryRoutes({ ...t, countries: [{ code: 'NO', releaseId: 'NO-1' }] }, FERRY_ROUTES, release).length, 0);
  assert.equal(tripFerryRoutes({ ...t, countries: [{ code: 'NO', releaseId: 'NO-2' }] }, FERRY_ROUTES, release).length, 58);
});

const stop = (id: string, dest: string): Stop => ({ id, kind: 'luogo', name: id, destinationId: dest, lat: 60, lng: 10, nights: 2, notes: '', weatherPlanB: '', ideas: ['fram'] });

test('upgradeCatalog: NO-1 → NO-2 esplicito, nulla si perde; viaggi senza «countries» resi espliciti; ritorno possibile', () => {
  const stops = [stop('a', 'bergen'), stop('b', 'flam')];
  const legacy: Trip = { ...createEmptyTrip(), stops, legs: syncLegs(stops, []), favorites: ['oslo'] };
  delete (legacy as Partial<Trip>).countries;
  assert.equal(tripCountries(legacy)[0]!.releaseId, 'NO-1');
  const up = upgradeCatalog(legacy, 'NO', 'NO-2');
  assert.deepEqual(up.countries, [{ code: 'NO', releaseId: 'NO-2' }]);
  const { countries: _a, ...restUp } = up;
  const { countries: _b, ...restOld } = legacy;
  void _a;
  void _b;
  assert.equal(json(restUp), json(restOld), 'tappe, tratti, idee, preferiti invariati');
  assert.deepEqual(upgradeCatalog(up, 'NO', 'NO-1').countries, [{ code: 'NO', releaseId: 'NO-1' }], 'si torna indietro con la stessa funzione');
  assert.equal(upgradeCatalog(legacy, 'XT', 'XT-2'), legacy, 'nazione assente: nessun cambiamento');
  // Più nazioni: cambia solo quella scelta, l'ordine resta
  const two = addCountry(ensureCountries(legacy), 'XT', 'XT-1');
  assert.deepEqual(upgradeCatalog(two, 'NO', 'NO-2').countries, [
    { code: 'NO', releaseId: 'NO-2' },
    { code: 'XT', releaseId: 'XT-1' },
  ]);
  assert.equal(releaseVersion('NO-2'), 2);
  assert.equal(releaseVersion('strano'), undefined);
});

test('Tratto traghetto salvato: campi facoltativi conservati nel viaggio a righe (segments.extra) e nel documento', () => {
  const stops = [stop('a', 'geiranger'), stop('b', 'alesund')];
  const t: Trip = { ...createEmptyTrip(), countries: [{ code: 'NO', releaseId: 'NO-2' }], stops, legs: syncLegs(stops, []), hiddenFerrySuggestions: [{ legId: 'x', ferryRouteId: 'bergen-flam-express' }] };
  t.legs[0]!.segments = [
    { id: 's1', mode: 'traghetto', label: 'Geiranger ferjekai → Hellesylt ferjekai', durationMin: 65, cost: { amount: 1650, currency: 'NOK' }, costStatus: 'da_verificare', status: 'da_verificare', ferryRouteId: 'geiranger-hellesylt', ferryReleaseId: 'NO-2', ferryBoardStop: 1, ferryAlightStop: 2, withCar: true },
  ];
  const back = fromRows(JSON.parse(JSON.stringify(toRows(t).rows)));
  assert.equal(json(back.legs), json(t.legs));
  assert.deepEqual(back.hiddenFerrySuggestions, t.hiddenFerrySuggestions);
});
