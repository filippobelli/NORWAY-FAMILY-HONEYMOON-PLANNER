import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildNorwayV4, buildNorwayV5, generateSql, seedBundle } from '../scripts/seed-catalog';
import { adaptBundle, type CatalogBundle } from '../src/catalog/adapter';
import { CORRECTIONS_NO5 } from '../src/data/correzioniNO5';

const bundle = (seed: ReturnType<typeof buildNorwayV5>) => JSON.parse(JSON.stringify(seedBundle(seed, { publishedAt: '2026-11-19T00:00:00+00:00' }))) as unknown as Record<string, Record<string, unknown>[]>;
const strip = (rows: Record<string, unknown>[]) => rows.map((r) => JSON.stringify({ ...r, release_id: undefined }));
const PLACE_TABLES = ['places', 'place_texts', 'place_sources', 'place_photos', 'place_tips'];

test('NO-5: stessi luoghi di NO-4; cambiano solo le righe dei luoghi corretti, tutto il resto è identico', () => {
  const v4 = buildNorwayV4();
  const v5 = buildNorwayV5();
  assert.equal(v5.release.version, 5);
  assert.equal(v5.release.previousReleaseId, 'NO-4');
  assert.deepEqual(v5.places.map((p) => p.key), v4.places.map((p) => p.key), 'stesse chiavi, stesso ordine');
  const corrected = new Set(v5.correctedKeys);
  assert.deepEqual([...corrected].sort(), Object.keys(CORRECTIONS_NO5).sort());
  const b4 = bundle(v4);
  const b5 = bundle(v5);
  for (const t of ['regions', 'places', 'place_texts', 'place_sources', 'operators', 'voyages', 'route_ports', 'place_links', 'ferry_sources', 'ferry_routes', 'ferry_route_stops', 'ferry_route_places', 'ferry_fares', 'place_photos', 'place_tips']) {
    const keep = (r: Record<string, unknown>) => !PLACE_TABLES.includes(t) || !corrected.has(String(r.place_key));
    const have = new Set(strip(b5[t]!));
    const missing = strip(b4[t]!.filter(keep)).filter((r) => !have.has(r));
    assert.equal(missing.length, 0, `${t}: righe di NO-4 non corrette ma diverse in NO-5`);
  }
  // Coordinate, categoria e regione dei luoghi corretti non cambiano
  for (const key of corrected) {
    const a = v4.places.find((p) => p.key === key)!;
    const b = v5.places.find((p) => p.key === key)!;
    assert.deepEqual([b.lat, b.lng, b.category, b.regionKey], [a.lat, a.lng, a.category, a.regionKey], `${key}: posizione e categoria invariate`);
    assert.ok(b.sources.testi?.some((s) => /Correzione del 2026-11-19/.test(s.label)), `${key}: la correzione è tra le fonti`);
  }
});

test('NO-5: ogni correzione si vede nel catalogo e nulla di inventato entra', () => {
  const v5 = buildNorwayV5();
  const byKey = new Map(v5.places.map((p) => [p.key, p]));
  for (const [key, c] of Object.entries(CORRECTIONS_NO5)) {
    const p = byKey.get(key)!;
    if (c.texts?.description) assert.equal(p.texts.it!.description, c.texts.description);
    if (c.official === null) {
      assert.equal(p.official, undefined, `${key}: sito tolto`);
      assert.equal(p.sources.sito_ufficiale, undefined);
    } else if (c.official) {
      assert.match(c.official, /^https:\/\//);
      assert.equal(p.official?.url, c.official);
      assert.equal(p.sources.sito_ufficiale?.[0]?.checkedAt, '2026-11-19');
    }
    if (c.photos) {
      assert.ok(c.photos.length <= 3);
      for (const f of c.photos) assert.ok(f.author && /^(CC[ -]BY|CC0|Public domain|PD|Attribution|FAL)/i.test(f.license), `${key}: foto con autore e licenza libera`);
      assert.deepEqual(p.photos ?? [], c.photos);
    }
  }
  // Nessuna affermazione tolta resta nei testi corretti
  const text = (k: string) => v5.places.find((p) => p.key === k)!.texts.it!.description;
  assert.doesNotMatch(text('fredrikstad-gamleby'), /meglio conservata del nord Europa/);
  assert.doesNotMatch(text('midgard'), /più grande raccolta/);
  assert.doesNotMatch(text('vardohus'), /più a nord del mondo/);
  assert.doesNotMatch(text('roros-kirke'), /1\.600/);
  // Il seed dichiara le correzioni e controlla che i luoghi corretti ci siano ancora
  const sql = generateSql(v5);
  assert.match(sql, /Luoghi corretti: attesi 28/);
  assert.match(sql, /place_key not in \('avaldsnes'/);
  // L'app legge NO-5 come le altre versioni
  const app = adaptBundle(JSON.parse(JSON.stringify(seedBundle(v5, { publishedAt: '2026-11-19T00:00:00+00:00' }))) as CatalogBundle);
  assert.equal(app.destinations.length, 358 - 35);
  assert.ok((app.photos.svartisen?.length ?? 0) > 0);
});
