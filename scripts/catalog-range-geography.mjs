// Rifinitura offline: applicare alla ricerca completata, prima di congelare/pubblicare il catalogo.
import { readFileSync, writeFileSync } from 'node:fs';
import { regionFromAncestry } from './catalog-range-regions.mjs';
const root = new URL('../', import.meta.url);
const file = new URL('src/data/catalogs/catalog-range-v1.json', root);
const data = JSON.parse(readFileSync(file, 'utf8'));
const baseline = JSON.parse(readFileSync(new URL('verify/e2e/out/catalog-range-baseline.json', root), 'utf8'));
const { entities } = JSON.parse(readFileSync(new URL('verify/e2e/out/catalog-range-research-cache.json', root), 'utf8'));
const auditFile = new URL('src/data/catalogs/catalog-range-v1-audit.json', root);
const audit = JSON.parse(readFileSync(auditFile, 'utf8'));
const norm = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const parentIds = (id) => (entities[id]?.claims?.P131 ?? []).filter((c) => c.rank !== 'deprecated').map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
for (const [code, base] of Object.entries(baseline)) {
  const country = data[code];
  if (!country || base.places.length + country.places.length < 300) throw new Error(`Ricerca incompleta: ${code}`);
  const names = [country.name, country.en].map(norm);
  const excluded = country.places.filter((p) => p.qid === country.qid || names.includes(norm(p.name)));
  country.places = country.places.filter((p) => !excluded.includes(p));
  audit[code].editorialExcluded = [...new Map([...(audit[code].editorialExcluded ?? []), ...excluded.map((p) => ({ qid: p.qid, name: p.name, reason: 'Nazione o isola nazionale, non una tappa puntuale' }))].map((p) => [p.qid, p])).values()];
  const grouped = new Map();
  for (const p of country.places) { const key = norm(p.name); grouped.set(key, [...(grouped.get(key) ?? []), p]); }
  for (const repeated of grouped.values()) if (repeated.length > 1) {
    for (const p of repeated) {
      const locality = p.description.split(' nel territorio di ')[1]?.split('. Accessi')[0]?.split('. Servizi')[0];
      p.name = `${p.name} · ${locality ?? p.wiki.en ?? p.qid}`;
    }
  }
  let assigned = 0;
  for (const p of country.places) {
    if (p.classification.qid === 'Q532') p.planningBase = false;
    if (p.classification.qid === 'Q44539') { p.classification.label = 'Edificio religioso'; p.description = p.description.replace(/^Tempio/, 'Edificio religioso'); }
    if (!p.region.startsWith('Altre località ·')) continue;
    let queue = parentIds(p.qid); const ancestors = new Set();
    for (let depth = 0; depth < 6 && queue.length; depth++) {
      const next = [];
      for (const id of queue) { if (ancestors.has(id)) continue; ancestors.add(id); next.push(...parentIds(id)); }
      queue = next;
    }
    const found = regionFromAncestry(code, [...ancestors], entities, base.regions);
    if (!found) continue;
    p.region = found.region;
    p.regionEvidence = `Catena P131 verso ${found.qid} (${found.label}); raggruppamento editoriale della suddivisione nominata, senza inferenza per distanza.`;
    assigned++;
  }
  country.regions = [...base.regions, ...new Set(country.places.map((p) => p.region).filter((r) => !base.regions.includes(r)))];
  if (base.places.length + country.places.length < 300) throw new Error(`Dopo il controllo editoriale servono altre schede per ${code}`);
  console.log(`${code}: ${assigned} schede attribuite tramite suddivisione verificabile; ${country.places.filter((p) => p.region.startsWith('Altre località ·')).length} nell’area nazionale`);
}
writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
writeFileSync(auditFile, JSON.stringify(audit, null, 2) + '\n');
