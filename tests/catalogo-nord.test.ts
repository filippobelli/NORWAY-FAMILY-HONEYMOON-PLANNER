import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildNorwayV2, buildNorwayV3, generateSql, seedBundle } from '../scripts/seed-catalog';
import { adaptBundle, type CatalogBundle } from '../src/catalog/adapter';
import { installCatalog, installFileCatalog } from '../src/catalog/registry';
import { DESTINATIONS } from '../src/data/destinations';
import { PLACE_PHOTOS, PLACE_TIPS } from '../src/data/placeExtras';
import { NORD_PLACES } from '../src/data/placesNord';
import { matchPlace } from '../src/domain/placeMatch';
import type { Destination } from '../src/domain/types';

const bundle = (seed: ReturnType<typeof buildNorwayV3>) => JSON.parse(JSON.stringify(seedBundle(seed, { publishedAt: '2026-11-10T00:00:00+00:00' }))) as CatalogBundle;
const strip = (rows: Record<string, unknown>[]) => rows.map((r) => JSON.stringify({ ...r, release_id: undefined }));

test('NO-3 contiene tutta NO-2: stesse righe per luoghi, testi, fonti e traghetti', () => {
  const b2 = bundle(buildNorwayV2()) as unknown as Record<string, Record<string, unknown>[]>;
  const b3 = bundle(buildNorwayV3()) as unknown as Record<string, Record<string, unknown>[]>;
  for (const t of ['regions', 'places', 'place_texts', 'place_sources', 'operators', 'voyages', 'route_ports', 'place_links', 'ferry_sources', 'ferry_routes', 'ferry_route_stops', 'ferry_route_places', 'ferry_fares']) {
    const have = new Set(strip(b3[t]!));
    const missing = strip(b2[t]!).filter((r) => !have.has(r));
    assert.equal(missing.length, 0, `${t}: righe di NO-2 assenti o diverse in NO-3`);
  }
  assert.deepEqual(b2.place_photos, [], 'NO-2 senza foto aggiuntive');
  assert.deepEqual(b2.place_tips, [], 'NO-2 senza consigli');
});

test('NO-3: i luoghi del nord hanno coordinate con una fonte, nessuna chiave doppia, regioni note', () => {
  const seed = buildNorwayV3();
  assert.equal(seed.release.version, 3);
  assert.equal(seed.release.previousReleaseId, 'NO-2');
  assert.ok(NORD_PLACES.length >= 60, `almeno 60 luoghi nuovi, trovati ${NORD_PLACES.length}`);
  const keys = seed.places.map((p) => p.key);
  assert.equal(new Set(keys).size, keys.length);
  for (const n of NORD_PLACES) {
    const p = seed.places.find((x) => x.key === n.key)!;
    assert.equal(p.coordsStatus, 'verificate');
    const src = p.sources.coordinate?.[0];
    assert.ok(src?.url && /wikidata\.org|openstreetmap\.org/.test(src.url), `${n.key}: fonte delle coordinate`);
    assert.ok(src.checkedAt, `${n.key}: data di lettura`);
    // Zona nord: fra Bodø e Lyngen
    assert.ok(n.lat > 66.9 && n.lat < 70.2 && n.lng > 11.5 && n.lng < 21, `${n.key}: coordinate fuori zona (${n.lat}, ${n.lng})`);
    assert.ok(n.description.length > 40 && n.access.length > 10, `${n.key}: scheda incompleta`);
    assert.equal(p.reliability, 'da_verificare');
  }
});

test('NO-3: foto solo con autore e licenza libera, al massimo 3; consigli solo con fonte https e data', () => {
  const seed = buildNorwayV3();
  let photos = 0;
  let tips = 0;
  for (const p of seed.places) {
    assert.ok((p.photos?.length ?? 0) <= 3, `${p.key}: più di 3 foto`);
    for (const f of p.photos ?? []) {
      photos++;
      assert.ok(f.file && f.author, `${p.key}: foto senza autore`);
      assert.match(f.license, /^(CC[ -]BY|CC0|Public domain|PD|Attribution|FAL)/i, `${p.key}: licenza ${f.license}`);
    }
    for (const t of p.tips ?? []) {
      tips++;
      assert.match(t.url, /^https:\/\//, `${p.key}: fonte del consiglio`);
      assert.match(t.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(t.source && t.text.length > 15);
      assert.doesNotMatch(t.text, /\b(NOK|kr|€|EUR)\b/, `${p.key}: niente prezzi nei consigli`);
    }
  }
  assert.ok(photos > 150, `foto: ${photos}`);
  assert.ok(tips > 10, `consigli: ${tips}`);
  const sql = generateSql(seed);
  assert.match(sql, /insert into public\.place_photos/);
  assert.match(sql, /insert into public\.place_tips/);
  assert.match(sql, /ferry_routes: % righe di NO-2 mancano/);
  // Il seed di NO-2 non parla delle tabelle nuove
  assert.doesNotMatch(generateSql(buildNorwayV2()), /place_photos|place_tips/);
});

test('Adattatore e registro: da NO-3 arrivano luoghi, foto e consigli; con i file (NO-2) non ci sono', () => {
  const c = adaptBundle(bundle(buildNorwayV3()));
  assert.equal(c.destinations.length, 82 + NORD_PLACES.length);
  const tung = c.destinations.find((d) => d.id === 'tungeneset');
  assert.ok(tung, 'Tungeneset nel catalogo');
  assert.equal(tung.coordsStatus, 'verificate');
  assert.ok(tung.sources[0]?.url);
  assert.ok((c.tips.tungeneset?.length ?? 0) > 0, 'consigli di Tungeneset');
  assert.ok((c.photos.nusfjord?.length ?? 0) >= 2, 'più foto per un luogo già presente');
  try {
    installCatalog(c);
    assert.ok(DESTINATIONS.some((d) => d.id === 'tungeneset'));
    assert.ok(PLACE_TIPS.tungeneset?.[0]?.url.startsWith('https://'));
    assert.ok(PLACE_PHOTOS.nusfjord?.[0]?.author);
  } finally {
    installFileCatalog();
  }
  assert.equal(DESTINATIONS.length, 82);
  assert.deepEqual(PLACE_PHOTOS, {});
  assert.deepEqual(PLACE_TIPS, {});
});

test('Collega alla scheda: stesso nome nella zona, oppure punto quasi uguale; mai aeroporti o schede lontane', () => {
  const d = (id: string, name: string, lat: number, lng: number, category: Destination['category'] = 'natura'): Destination =>
    ({ id, name, lat, lng, category, region: 'Troms e Finnmark', description: '', coordsStatus: 'verificate', difficulty: 'facile', kidScore: 3, access: '', season: '', sources: [], reliability: 'da_verificare' }) as Destination;
  const list = [d('tungeneset', 'Tungeneset', 69.4889, 17.3341), d('ersfjord-senja', 'Ersfjord (Senja)', 69.48, 17.4), d('tos', 'Aeroporto di Tromsø', 69.68, 18.92, 'aeroporti'), d('bodo', 'Bodø', 67.283, 14.383, 'citta')];
  assert.equal(matchPlace({ name: 'Tungeneset', lat: 69.4895, lng: 17.335 }, list)?.dest.id, 'tungeneset');
  assert.equal(matchPlace({ name: 'Ersfjord Beach', lat: 69.5, lng: 17.45 }, list)?.dest.id, 'ersfjord-senja', 'stesso nome, entro 8 km');
  assert.equal(matchPlace({ name: 'Sosta foto', lat: 69.4891, lng: 17.3345 }, list)?.dest.id, 'tungeneset', 'nome diverso ma stesso punto');
  assert.equal(matchPlace({ name: 'Sosta foto', lat: 69.52, lng: 17.33 }, list), undefined, 'nome diverso a più di 1 km');
  assert.equal(matchPlace({ name: 'Bodø', lat: 68.2, lng: 14.5 }, list), undefined, 'stesso nome ma lontano');
  assert.equal(matchPlace({ name: 'Ersfjordveien', lat: 69.4892, lng: 17.3343 }, list)?.dest.id, 'tungeneset', 'una scheda nello stesso punto vince su un nome simile più lontano');
  assert.equal(matchPlace({ name: 'Aeroporto di Tromsø', lat: 69.68, lng: 18.92 }, list), undefined, 'gli aeroporti non si propongono');
});
