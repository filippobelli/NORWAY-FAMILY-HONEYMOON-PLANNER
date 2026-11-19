// Acquisizione controllata e riprendibile; nessuna scrittura cloud e nessun testo Wikipedia importato.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CANDIDATES_V2, COUNTRIES_V2 } from './international-expansion.mjs';

const root = resolve(import.meta.dirname, '..');
const file = resolve(root, 'src/data/catalogs/international-v2.json');
const reportFile = resolve(root, 'src/data/catalogs/international-v2-audit.json');
const v1 = JSON.parse(readFileSync(resolve(root, 'src/data/catalogs/international-v1.json'), 'utf8'));
const saved = process.argv.includes('--resume') && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
const reports = process.argv.includes('--resume') && existsSync(reportFile) ? JSON.parse(readFileSync(reportFile, 'utf8')) : {};
const date = new Date().toISOString().slice(0, 10);
const UA = 'family-trip-catalog/2.0 (https://github.com/filippobelli/NORWAY-FAMILY-HONEYMOON-PLANNER)';
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const chunks = (a, size = 40) => Array.from({ length: Math.ceil(a.length / size) }, (_, i) => a.slice(i * size, (i + 1) * size));
const values = (e, prop) => (e.claims?.[prop] ?? []).filter((c) => c.rank !== 'deprecated').map((c) => c.mainsnak?.datavalue?.value).filter((v) => v !== undefined);
const cleanText = (s) => String(s ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, ' ').trim();
async function api(host, params) {
  const url = new URL(`https://${host}/w/api.php`);
  url.search = new URLSearchParams({ format: 'json', maxlag: '5', ...params }).toString();
  let error;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (r.status === 429 || r.status === 503) { await pause(Math.min(60000, Number(r.headers.get('retry-after') ?? 5) * 1000 + attempt * 2000)); continue; }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (j.error?.code === 'maxlag') { await pause(5000); continue; }
      if (j.error) throw new Error(JSON.stringify(j.error));
      await pause(400);
      return j;
    } catch (e) { error = e; await pause((attempt + 1) * 1500); }
  }
  throw new Error(`${host}: ${error?.message ?? 'richiesta non riuscita'}`);
}

const kind = { citta: 'Località da usare come base di esplorazione', musei: 'Luogo culturale', natura: 'Luogo di interesse naturale', isole: 'Isola o località insulare', parchi: 'Parco o attrazione ricreativa', fauna: 'Luogo dedicato alla fauna', treni: 'Stazione ferroviaria', aeroporti: 'Aeroporto', porti: 'Area portuale' };
for (const [code, country] of Object.entries(COUNTRIES_V2)) {
  const places = saved[code]?.places ?? structuredClone(v1[code].places);
  const inherited = new Set(v1[code].places.map((p) => p.key));
  const selections = new Map(CANDIDATES_V2[code].map((p) => [p.key, p]));
  for (const p of places) {
    const c = selections.get(p.key);
    if (!c || inherited.has(p.key)) continue;
    p.region = country.regions[c.regionIndex];
    const operational = ['aeroporti', 'porti', 'treni'].includes(c.category) ? ' Servizi attivi, terminal, accessi, orari e coincidenze da verificare con il gestore; nessuna tratta o tariffa implicita.' : '';
    p.description = (c.description ?? `${kind[c.category]} nella zona di viaggio ${p.region}.`) + operational;
  }
  const keys = new Set(places.map((p) => p.key));
  const qids = new Set(places.map((p) => p.qid));
  const report = reports[code] ?? { rejected: [], duplicates: [], missingPhotos: [], checkedAt: date };
  // --retry-rejected consente correzioni dei titoli senza riscaricare le schede già acquisite.
  const done = new Set(process.argv.includes('--retry-rejected') ? [] : [...report.rejected, ...report.duplicates].map((x) => x.key));
  const pending = CANDIDATES_V2[code].filter((c) => !keys.has(c.key) && !done.has(c.key));
  for (const batch of chunks(pending)) {
    const pages = await api('en.wikipedia.org', { action: 'query', titles: batch.map((p) => p.title).join('|'), redirects: '1', prop: 'pageprops', ppprop: 'wikibase_item|disambiguation' });
    const alias = new Map([...(pages.query?.normalized ?? []), ...(pages.query?.redirects ?? [])].map((x) => [x.from, x.to]));
    const canonical = (t) => { const seen = new Set(); while (alias.has(t) && !seen.has(t)) { seen.add(t); t = alias.get(t); } return t; };
    const pageMap = new Map(Object.values(pages.query?.pages ?? {}).map((p) => [p.title, p]));
    // Alcuni musei/stazioni hanno una scheda Wikidata ma nessuna voce inglese.
    // Accettiamo la ricerca solo con etichetta o alias esatto, mai il primo risultato per somiglianza.
    const norm = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    const fallback = new Map();
    for (const c of batch) {
      const p = pageMap.get(canonical(c.title));
      if (p?.pageprops?.wikibase_item && p.pageprops?.disambiguation === undefined) continue;
      const search = await api('www.wikidata.org', { action: 'wbsearchentities', search: c.title, language: 'en', limit: '5', type: 'item' });
      const matches = (search.search ?? []).filter((r) => [r.label, ...(r.aliases ?? []), r.match?.text].filter(Boolean).some((s) => [c.title, c.name].filter(Boolean).some((t) => norm(s) === norm(t))));
      if (matches.length === 1) fallback.set(c.key, matches[0].id);
    }
    const ids = [...new Set([...pageMap.values()].filter((p) => p.pageprops?.disambiguation === undefined).map((p) => p.pageprops?.wikibase_item).filter(Boolean).concat([...fallback.values()]))];
    const entities = ids.length ? (await api('www.wikidata.org', { action: 'wbgetentities', ids: ids.join('|'), props: 'info|claims|labels|sitelinks', languages: `it|en|${country.language}` })).entities : {};
    const accepted = [];
    for (const c of batch) {
      const p = pageMap.get(canonical(c.title));
      const e = entities[fallback.get(c.key) ?? p?.pageprops?.wikibase_item];
      const reject = (reason) => report.rejected.push({ key: c.key, title: c.title, reason });
      if ((!fallback.has(c.key) && p?.pageprops?.disambiguation !== undefined) || !e || e.missing !== undefined) { reject('Entità non risolta o pagina disambigua'); continue; }
      if (qids.has(e.id)) { report.duplicates.push({ key: c.key, title: c.title, qid: e.id }); report.rejected = report.rejected.filter((r) => r.key !== c.key); continue; }
      const coord = values(e, 'P625').find((v) => v.globe === 'http://www.wikidata.org/entity/Q2');
      if (!coord) { reject('Coordinate terrestri mancanti'); continue; }
      const [south, north, west, east] = country.bounds;
      if (coord.latitude < south || coord.latitude > north || coord.longitude < west || coord.longitude > east) { reject('Coordinate fuori ambito geografico'); continue; }
      const nations = values(e, 'P17').map((v) => v.id);
      if (nations.length && !nations.includes(country.qid)) { reject(`Nazione dichiarata diversa: ${nations.join(',')}`); continue; }
      const iata = c.category === 'aeroporti' ? values(e, 'P238').find((v) => /^[A-Z]{3}$/.test(v)) : undefined;
      if (c.category === 'aeroporti' && !iata) { reject('IATA non disponibile'); continue; }
      // Un punto logistico non dimostra servizi attivi, accessibilità, terminal o orari.
      const name = c.name ?? e.labels?.it?.value ?? e.labels?.[country.language]?.value ?? c.title;
      const region = country.regions[c.regionIndex];
      if (!region) throw new Error(`Zona mancante: ${code} ${c.regionIndex}`);
      const operational = ['aeroporti', 'porti', 'treni'].includes(c.category) ? ' Servizi attivi, terminal, accessi, orari e coincidenze da verificare con il gestore; nessuna tratta o tariffa implicita.' : '';
      const description = (c.description ?? `${kind[c.category]} nella zona di viaggio ${region}.`) + operational;
      const imageFiles = [...new Set(values(e, 'P18'))].filter((f) => !/\.svg$|map|logo|flag|plan|drawing|painting|portrait|stamp/i.test(f)).slice(0, 3);
      accepted.push({ key: c.key, name, title: c.title, category: c.category, region, description, qid: e.id, revision: e.lastrevid, lat: coord.latitude, lng: coord.longitude, localName: e.labels?.[country.language]?.value, iata, official: values(e, 'P856').find((v) => /^https?:\/\//.test(v)), wiki: { it: e.sitelinks?.itwiki?.title, en: e.sitelinks?.enwiki?.title }, photos: [], checkedAt: date, imageFiles });
      qids.add(e.id); keys.add(c.key);
    }
    const allFiles = [...new Set(accepted.flatMap((p) => p.imageFiles))];
    const credits = new Map();
    for (const imageBatch of chunks(allFiles, 40)) {
      const j = await api('commons.wikimedia.org', { action: 'query', titles: imageBatch.map((f) => `File:${f}`).join('|'), redirects: '1', prop: 'imageinfo', iiprop: 'extmetadata', iilimit: '1' });
      const resolved = new Map();
      for (const page of Object.values(j.query?.pages ?? {})) {
        const m = page.imageinfo?.[0]?.extmetadata;
        if (!m) continue;
        const license = cleanText(m.LicenseShortName?.value);
        const author = cleanText(m.Artist?.value);
        const licenseUrl = m.LicenseUrl?.value;
        if (!/^(CC BY(?:-SA)?(?: [\d.]+)?|CC0(?: [\d.]+)?|Public domain)$/i.test(license) || !author || author.length > 220 || /unknown|anonymous|no machine-readable|@/i.test(author) || (licenseUrl && !/^https?:\/\//.test(licenseUrl))) continue;
        resolved.set(page.title, { file: page.title.replace(/^File:/, ''), author, license, licenseUrl: licenseUrl || 'https://commons.wikimedia.org/wiki/Commons:Licensing' });
      }
      for (const f of imageBatch) {
        const redirects = new Map([...(j.query?.normalized ?? []), ...(j.query?.redirects ?? [])].map((x) => [x.from, x.to]));
        let title = `File:${f}`; const seen = new Set();
        while (redirects.has(title) && !seen.has(title)) { seen.add(title); title = redirects.get(title); }
        if (resolved.has(title)) credits.set(f, resolved.get(title));
      }
    }
    for (const p of accepted) { p.photos = p.imageFiles.map((f) => credits.get(f)).filter(Boolean); delete p.imageFiles; if (!p.photos.length) report.missingPhotos.push(p.key); places.push(p); }
    report.rejected = [...new Map(report.rejected.filter((r) => !keys.has(r.key)).map((r) => [r.key, r])).values()];
    report.duplicates = [...new Map(report.duplicates.map((r) => [r.key, r])).values()];
    saved[code] = { ...country, checkedAt: date, places };
    reports[code] = report;
    writeFileSync(file, JSON.stringify(saved, null, 2) + '\n');
    writeFileSync(reportFile, JSON.stringify(reports, null, 2) + '\n');
    console.log(`${code}: ${places.length} schede, ${report.rejected.length} esclusioni, ${report.duplicates.length} duplicati evitati`);
  }
  saved[code] = { ...country, checkedAt: date, places }; reports[code] = report;
  writeFileSync(file, JSON.stringify(saved, null, 2) + '\n');
  writeFileSync(reportFile, JSON.stringify(reports, null, 2) + '\n');
}
