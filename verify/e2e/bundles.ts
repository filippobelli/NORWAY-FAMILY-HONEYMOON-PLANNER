// Bundle dei cataloghi NO-1 e NO-2 come li restituisce catalog_bundle, per il server cloud finto degli script e2e.
// Uso: npx tsx verify/e2e/bundles.ts <file.json>
import { writeFileSync } from 'node:fs';
import { buildNorway, buildNorwayV2, seedBundle } from '../../scripts/seed-catalog';

const out = process.argv[2];
if (!out) throw new Error('Indica il file di uscita');
const at = { publishedAt: '2026-11-06T00:00:00+00:00' };
writeFileSync(out, JSON.stringify({ 'NO-1': seedBundle(buildNorway(), at), 'NO-2': seedBundle(buildNorwayV2(), at) }));
console.log(`Scritto ${out}`);
process.exit(0);
