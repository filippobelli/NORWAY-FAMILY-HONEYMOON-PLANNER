import { mkdirSync, writeFileSync } from 'node:fs';
import { RANGE_CODES, buildBeforeRange } from './build-catalog-range';

mkdirSync(new URL('../verify/e2e/out/', import.meta.url), { recursive: true });
const baseline = Object.fromEntries(RANGE_CODES.map((code) => {
  const seed = buildBeforeRange(code);
  return [code, { country: seed.country, version: seed.release.version, regions: seed.regions.map((r) => r.name), places: seed.places.map((p) => ({ key: p.key, name: p.texts.it!.name, qid: p.wiki?.qid, category: p.category, lat: p.lat, lng: p.lng, region: seed.regions.find((r) => r.key === p.regionKey)?.name })) }];
}));
writeFileSync(new URL('../verify/e2e/out/catalog-range-baseline.json', import.meta.url), JSON.stringify(baseline));
console.log('Baseline dei 20 cataloghi da ampliare preparata, senza modificare dati pubblicati.');
