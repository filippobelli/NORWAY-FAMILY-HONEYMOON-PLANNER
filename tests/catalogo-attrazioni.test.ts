import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildNorwayV3, buildNorwayV4, generateSql, seedBundle } from '../scripts/seed-catalog';
import { adaptBundle, type CatalogBundle } from '../src/catalog/adapter';
import { ATTR_PLACES } from '../src/data/placesAttrazioni';

const bundle = (seed: ReturnType<typeof buildNorwayV4>) => JSON.parse(JSON.stringify(seedBundle(seed, { publishedAt: '2026-11-12T00:00:00+00:00' }))) as CatalogBundle;
const strip = (rows: Record<string, unknown>[]) => rows.map((r) => JSON.stringify({ ...r, release_id: undefined }));

test('NO-4 contiene tutta NO-3: stesse righe per luoghi, testi, fonti, traghetti, foto e consigli', () => {
  const b3 = bundle(buildNorwayV3()) as unknown as Record<string, Record<string, unknown>[]>;
  const b4 = bundle(buildNorwayV4()) as unknown as Record<string, Record<string, unknown>[]>;
  for (const t of ['regions', 'places', 'place_texts', 'place_sources', 'operators', 'voyages', 'route_ports', 'place_links', 'ferry_sources', 'ferry_routes', 'ferry_route_stops', 'ferry_route_places', 'ferry_fares', 'place_photos', 'place_tips']) {
    const have = new Set(strip(b4[t]!));
    const missing = strip(b3[t]!).filter((r) => !have.has(r));
    assert.equal(missing.length, 0, `${t}: righe di NO-3 assenti o diverse in NO-4`);
  }
});

test('NO-4: musei, parchi e attrazioni con coordinate da una fonte, dentro la Norvegia, senza chiavi doppie', () => {
  const seed = buildNorwayV4();
  assert.equal(seed.release.version, 4);
  assert.equal(seed.release.previousReleaseId, 'NO-3');
  assert.ok(ATTR_PLACES.length >= 120, `almeno 120 luoghi nuovi, trovati ${ATTR_PLACES.length}`);
  const keys = seed.places.map((p) => p.key);
  assert.equal(new Set(keys).size, keys.length);
  // Riquadri larghi per regione: un abbinamento sbagliato (omonimo in un'altra zona) finisce fuori
  const BOX: Record<string, [number, number, number, number]> = {
    'Oslo e Østlandet': [58.8, 61.3, 7.5, 12.2],
    'Innlandet e montagne': [60.0, 62.8, 7.4, 12.9],
    'Fiordi occidentali': [59.4, 63.6, 4.4, 9.3],
    'Sørlandet e Rogaland': [57.9, 59.9, 4.8, 9.6],
    'Trøndelag': [62.2, 65.5, 8.0, 14.4],
    'Nordland e Lofoten': [64.9, 69.4, 10.5, 18.2],
    'Troms e Finnmark': [68.3, 71.3, 15.5, 31.3],
  };
  for (const n of ATTR_PLACES) {
    const p = seed.places.find((x) => x.key === n.key)!;
    assert.equal(p.coordsStatus, 'verificate');
    const src = p.sources.coordinate?.[0];
    assert.ok(src?.url && /wikidata\.org|openstreetmap\.org/.test(src.url), `${n.key}: fonte delle coordinate`);
    assert.ok(src.checkedAt, `${n.key}: data di lettura`);
    const box = BOX[n.region]!;
    assert.ok(n.lat >= box[0] && n.lat <= box[1] && n.lng >= box[2] && n.lng <= box[3], `${n.key}: coordinate fuori dalla regione ${n.region} (${n.lat}, ${n.lng})`);
    assert.ok(n.description.length > 40 && n.access.length > 10 && n.season.length > 3, `${n.key}: scheda incompleta`);
    assert.doesNotMatch(`${n.description} ${n.access} ${n.season} ${n.augustNote ?? ''}`, /\b(NOK|kr|€|EUR|euro|corone)\b/i, `${n.key}: niente prezzi nelle schede`);
    assert.equal(p.reliability, 'da_verificare');
  }
});

test('NO-4: foto solo con autore e licenza libera, al massimo 3; le foto di NO-3 non cambiano', () => {
  const seed = buildNorwayV4();
  const v3 = new Map(buildNorwayV3().places.map((p) => [p.key, p]));
  let nuove = 0;
  for (const p of seed.places) {
    assert.ok((p.photos?.length ?? 0) <= 3, `${p.key}: più di 3 foto`);
    for (const f of p.photos ?? []) {
      assert.ok(f.file && f.author, `${p.key}: foto senza autore`);
      assert.doesNotMatch(f.author, /^(unknown|anonymous)/i, `${p.key}: autore sconosciuto`);
      assert.match(f.license, /^(CC[ -]BY|CC0|Public domain|PD|Attribution|FAL)/i, `${p.key}: licenza ${f.license}`);
    }
    const old = v3.get(p.key);
    if (old?.photos?.length) assert.deepEqual(p.photos, old.photos, `${p.key}: foto di NO-3 cambiate`);
    else nuove += p.photos?.length ?? 0;
  }
  assert.ok(nuove > 250, `foto nuove: ${nuove}`);
  const sql = generateSql(seed);
  assert.match(sql, /place_photos: % righe di NO-3 mancano/);
  assert.match(sql, /Catalogo NO-4 pubblicato e controllato/);
});

test('Adattatore: da NO-4 arrivano i luoghi nuovi con le loro foto', () => {
  const c = adaptBundle(bundle(buildNorwayV4()));
  const capo = c.destinations.find((d) => d.id === 'alta-museum');
  assert.ok(capo, 'Museo di Alta nel catalogo');
  assert.equal(capo.coordsStatus, 'verificate');
  assert.ok((c.photos['alta-museum']?.length ?? 0) > 0, 'foto del museo di Alta');
  assert.ok(c.destinations.some((d) => d.id === 'tungeneset'), 'i luoghi di NO-3 restano');
  assert.ok((c.photos.nordkapp?.length ?? 0) > 0, 'foto anche per un luogo che non ne aveva (Capo Nord)');
  assert.ok((c.tips.tungeneset?.length ?? 0) > 0, 'i consigli di NO-3 restano');
});
