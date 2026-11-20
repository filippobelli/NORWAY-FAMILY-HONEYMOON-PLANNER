// Ricerca pubblica riprendibile. Nessun account, nessun dato di viaggio, nessuna scrittura cloud.
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { COUNTRIES_V2 as first } from './international-expansion.mjs';
import { COUNTRIES as second } from './additional-countries.mjs';
import { COUNTRIES as third } from './northern-asia-countries.mjs';

const root = new URL('../', import.meta.url);
const baseline = JSON.parse(readFileSync(new URL('verify/e2e/out/catalog-range-baseline.json', root), 'utf8'));
const target = 320;
const sources = { ...first, ...second, ...third };
const file = new URL('src/data/catalogs/catalog-range-v1.json', root);
const auditFile = new URL('src/data/catalogs/catalog-range-v1-audit.json', root);
const cacheFile = new URL('verify/e2e/out/catalog-range-research-cache.json', root);
const data = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
const audits = existsSync(auditFile) ? JSON.parse(readFileSync(auditFile, 'utf8')) : {};
const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : { queries: {}, entities: {} };
const neededClaims = new Set(['P625', 'P17', 'P31', 'P576', 'P3999', 'P131', 'P18', 'P856']);
function compactEntity(e) {
  return { id: e.id, missing: e.missing, lastrevid: e.lastrevid, labels: e.labels,
    claims: Object.fromEntries(Object.entries(e.claims ?? {}).filter(([key]) => neededClaims.has(key))),
    sitelinks: Object.fromEntries(Object.entries(e.sitelinks ?? {}).filter(([key]) => ['itwiki', 'enwiki'].includes(key))) };
}
for (const [id, e] of Object.entries(cache.entities)) cache.entities[id] = compactEntity(e);
const date = new Date().toISOString().slice(0, 10);
const UA = 'family-trip-catalog/3.0 (https://github.com/filippobelli/NORWAY-FAMILY-HONEYMOON-PLANNER)';
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const batches = (a, n = 40) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, (i + 1) * n));
const values = (e, prop) => (e?.claims?.[prop] ?? []).filter((c) => c.rank !== 'deprecated').map((c) => c.mainsnak?.datavalue?.value).filter((v) => v !== undefined);
const ids = (e, prop) => values(e, prop).map((v) => v.id).filter(Boolean);
const clean = (s) => String(s ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, ' ').trim();
const norm = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const classes = [
  ['Q33506', 'musei', 'Museo', 65], ['Q46169', 'natura', 'Parco nazionale', 35],
  ['Q43501', 'fauna', 'Giardino zoologico', 15], ['Q167346', 'parchi', 'Orto botanico', 20],
  ['Q23413', 'musei', 'Castello', 40], ['Q34038', 'natura', 'Cascata', 35],
  ['Q194195', 'parchi', 'Parco divertimenti', 20], ['Q839954', 'musei', 'Sito archeologico', 55],
  ['Q35509', 'natura', 'Grotta', 30], ['Q3957', 'citta', 'Località', 45],
  ['Q23442', 'isole', 'Isola', 25], ['Q473972', 'natura', 'Area protetta', 45],
  ['Q44539', 'musei', 'Edificio religioso', 55], ['Q515', 'citta', 'Città', 30],
  ['Q55488', 'treni', 'Stazione ferroviaria', 15], ['Q44613', 'musei', 'Monastero', 25],
  ['Q177380', 'natura', 'Sorgente termale', 20], ['Q8072', 'natura', 'Vulcano', 15],
  ['Q35666', 'natura', 'Ghiacciaio', 15], ['Q22698', 'parchi', 'Parco', 30],
  ['Q16560', 'musei', 'Palazzo', 30], ['Q8502', 'natura', 'Montagna', 15],
  ['Q23397', 'natura', 'Lago', 35], ['Q40080', 'natura', 'Spiaggia', 25],
  ['Q57821', 'musei', 'Fortificazione', 20], ['Q39715', 'musei', 'Faro', 15],
  ['Q1107656', 'parchi', 'Giardino', 20], ['Q6017969', 'natura', 'Belvedere', 15],
  ['Q532', 'citta', 'Villaggio', 60],
];
// Due interrogazioni SPARQL al massimo; quattro nazioni possono preparare dati e foto in parallelo.
const queryLanes = [Promise.resolve(), Promise.resolve()];
let queryTurn = 0;
function querySlot(task) {
  const lane = queryTurn++ % queryLanes.length;
  const result = queryLanes[lane].then(task);
  queryLanes[lane] = result.catch(() => undefined);
  return result;
}
function atomicWrite(file, text) {
  const temporary = new URL(`${file.href}.tmp`);
  for (let attempt = 0; attempt < 5; attempt++) {
    try { writeFileSync(temporary, text); renameSync(temporary, file); return; }
    catch (e) { if (attempt === 4) throw e; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200 * (attempt + 1)); }
  }
}
function save() {
  atomicWrite(file, JSON.stringify(data, null, 2) + '\n');
  atomicWrite(auditFile, JSON.stringify(audits, null, 2) + '\n');
  atomicWrite(cacheFile, JSON.stringify(cache));
}
async function fetchJson(url, timeout = 35000) {
  let last;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(timeout) });
      if ([429, 503].includes(response.status)) { await pause(Math.min(30000, Math.max(2, Number(response.headers.get('retry-after') ?? 5)) * 1000)); continue; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.error) throw new Error(result.error.code ?? 'Errore della fonte');
      await pause(450);
      return result;
    } catch (e) { last = e; if (url.hostname === 'query.wikidata.org') break; await pause(1500 * (attempt + 1)); }
  }
  throw last ?? new Error('Fonte non disponibile');
}
function api(host, params) {
  const url = new URL(`https://${host}/w/api.php`);
  url.search = new URLSearchParams({ action: 'wbgetentities', format: 'json', maxlag: '5', ...params });
  return fetchJson(url);
}
async function entities(keys) {
  const missing = [...new Set(keys)].filter((id) => /^Q\d+$/.test(id) && !cache.entities[id]);
  for (const batch of batches(missing)) {
    const result = await api('www.wikidata.org', { ids: batch.join('|'), props: 'info|claims|labels|sitelinks', languages: 'it|en|de|fr|ja|nl|da|sv|sl|es|pt|hr|el|tr|is|fi|th|km|vi' });
    for (const [id, e] of Object.entries(result.entities)) cache.entities[id] = compactEntity(e);
  }
}
async function discover(code, cls) {
  const singleSource = process.argv.includes('--single-source');
  const key = `${code}:${cls[0]}${singleSource ? ':single' : ''}`;
  if (cache.queries[key]) return cache.queries[key];
  // Per le nazioni meno documentate è ammesso un solo collegamento Wikimedia;
  // restano obbligatori identità, nazione, coordinate e categoria verificabili.
  const minimum = cls[0] === 'Q8502' ? (singleSource ? 4 : 8) : (singleSource ? 1 : 2);
  const query = `SELECT DISTINCT ?item ?links WHERE { hint:Query hint:optimizer "None". ?item wdt:P17 wd:${sources[code].qid}; wdt:P625 ?coord; wikibase:sitelinks ?links. FILTER(?links >= ${minimum}) ?item wdt:P31/wdt:P279* wd:${cls[0]}. hint:Prior hint:gearing "forward". } ORDER BY DESC(?links) LIMIT 260`;
  const url = new URL('https://query.wikidata.org/sparql');
  url.search = new URLSearchParams({ query, format: 'json' });
  try {
    const result = await querySlot(() => fetchJson(url, 35000));
    const found = [...new Map(result.results.bindings.map((r) => [r.item.value.split('/').at(-1), { qid: r.item.value.split('/').at(-1), links: Number(r.links.value) }])).values()];
    cache.queries[key] = found;
    audits[code].queries.push({ type: cls[0], category: cls[1], count: found.length, checkedAt: date, minimumSitelinks: minimum });
    return found;
  } catch (e) {
    audits[code].failures.push({ type: cls[0], reason: e.message });
    console.log(`${code}: ricerca ${cls[2]} non disponibile, passo alla categoria seguente`);
    return [];
  }
}
async function photos(places) {
  const files = [...new Set(places.flatMap((p) => p.imageFiles))];
  const credits = new Map();
  for (const batch of batches(files)) {
    try {
      const result = await api('commons.wikimedia.org', { action: 'query', titles: batch.map((f) => `File:${f}`).join('|'), redirects: '1', prop: 'imageinfo', iiprop: 'extmetadata' });
      const resolved = new Map();
      for (const page of Object.values(result.query?.pages ?? {})) {
        const m = page.imageinfo?.[0]?.extmetadata; if (!m) continue;
        const license = clean(m.LicenseShortName?.value); const author = clean(m.Artist?.value); const licenseUrl = m.LicenseUrl?.value;
        if (!/^(CC BY(?:-SA)?(?: [\d.]+)?|CC0(?: [\d.]+)?|Public domain)$/i.test(license) || !author || author.length > 220 || /unknown|anonymous|no machine-readable|@/i.test(author) || (licenseUrl && !/^https?:\/\//.test(licenseUrl))) continue;
        resolved.set(page.title, { file: page.title.replace(/^File:/, ''), author, license, licenseUrl: licenseUrl || 'https://commons.wikimedia.org/wiki/Commons:Licensing' });
      }
      const redirects = new Map([...(result.query?.normalized ?? []), ...(result.query?.redirects ?? [])].map((r) => [r.from, r.to]));
      for (const f of batch) { let key = `File:${f}`; const seen = new Set(); while (redirects.has(key) && !seen.has(key)) { seen.add(key); key = redirects.get(key); } if (resolved.has(key)) credits.set(f, resolved.get(key)); }
    } catch { console.log('Foto non disponibili: conservo il segnaposto, senza attribuzioni inventate.'); }
  }
  for (const p of places) { p.photos = p.imageFiles.map((f) => credits.get(f)).filter(Boolean); delete p.imageFiles; }
}

async function researchCountry([code, base]) {
  const country = sources[code];
  const audit = audits[code] ??= { checkedAt: date, queries: [], failures: [], rejected: [], missingPhotos: [] };
  const output = data[code] ??= { ...country, regions: [...base.regions], checkedAt: date, places: [] };
  if (base.places.length + output.places.length >= target) { console.log(`${code}: ${base.places.length + output.places.length} schede, già completo`); return; }
  const seen = new Set([...base.places, ...output.places].map((p) => p.qid));
  const anchors = new Map(base.places.filter((p) => p.category === 'citta' && p.qid && p.region).map((p) => [p.qid, p.region]));
  const names = new Set([...base.places, ...output.places].map((p) => norm(p.name)));
  for (const cls of classes) {
    const needed = target - base.places.length - output.places.length; if (needed <= 0) break;
    const quota = cls[3] - output.places.filter((p) => p.classification?.qid === cls[0]).length;
    if (quota <= 0) continue;
    const results = (await discover(code, cls)).filter((p) => !seen.has(p.qid));
    await entities(results.map((r) => r.qid));
    const prospective = [];
    for (const item of results) {
      const e = cache.entities[item.qid]; if (!e || e.missing !== undefined) continue;
      const reject = (reason) => audit.rejected.push({ qid: e.id, type: cls[0], reason });
      const coord = values(e, 'P625').find((v) => v.globe === 'http://www.wikidata.org/entity/Q2');
      if (!coord || !Number.isFinite(coord.latitude) || !Number.isFinite(coord.longitude)) { reject('Coordinate terrestri mancanti'); continue; }
      const [south, north, west, east] = country.bounds;
      if (coord.latitude < south || coord.latitude > north || coord.longitude < west || coord.longitude > east || !ids(e, 'P17').includes(country.qid)) { reject('Fuori ambito geografico o nazione diversa'); continue; }
      if (values(e, 'P576').length || values(e, 'P3999').length) { reject('Chiusura o cessazione dichiarata: escluso dalla scoperta'); continue; }
      if (values(e, 'P31').some((v) => ['Q4167410', 'Q4167836', 'Q13406463'].includes(v.id))) { reject('Disambigua, categoria o lista'); continue; }
      const name = e.labels?.it?.value ?? e.labels?.en?.value ?? e.labels?.[country.language]?.value;
      if (e.id === country.qid || (name && [country.name, country.en].some((n) => norm(name) === norm(n)))) { reject('Nazione o isola nazionale, non una tappa puntuale'); continue; }
      if (!name || /^Q\d+$/.test(name) || names.has(norm(name))) { reject('Nome assente o già presente'); continue; }
      prospective.push({ e, name, coord, links: item.links });
    }
    // Prima gli elementi con più riscontri, senza confondere popolarità con accessibilità o disponibilità.
    const selected = prospective.slice(0, Math.min(needed, quota));
    let frontier = selected.map((p) => p.e.id); const visited = new Set();
    for (let depth = 0; depth < 5; depth++) {
      const parents = [...new Set(frontier.flatMap((id) => ids(cache.entities[id], 'P131')))].filter((id) => !visited.has(id) && !Object.values(sources).some((c) => c.qid === id));
      for (const id of parents) visited.add(id);
      await entities(parents); frontier = parents; if (!frontier.length) break;
    }
    const added = [];
    for (const { e, name, coord, links } of selected) {
      const ancestry = []; let queue = ids(e, 'P131'); const walked = new Set();
      for (let depth = 0; depth < 6 && queue.length; depth++) { const next = []; for (const id of queue) { if (walked.has(id)) continue; walked.add(id); ancestry.push(id); next.push(...ids(cache.entities[id], 'P131')); } queue = next; }
      const anchor = ancestry.find((id) => anchors.has(id));
      let region = anchor ? anchors.get(anchor) : `Altre località · ${country.name}`;
      if (code === 'GB' && !anchor) {
        if (ancestry.includes('Q22')) region = 'Scozia — altre località';
        else if (ancestry.includes('Q26')) region = 'Irlanda del Nord';
        else if (ancestry.includes('Q25')) region = 'Galles';
        else if (ancestry.includes('Q21')) region = 'Inghilterra — altre località';
        else { audit.rejected.push({ qid: e.id, reason: 'Nazione costitutiva britannica non attribuibile con certezza' }); continue; }
      }
      if (!output.regions.includes(region)) output.regions.push(region);
      const parent = ids(e, 'P131').map((id) => cache.entities[id]).find((p) => p?.labels?.it?.value || p?.labels?.en?.value);
      const locality = parent?.labels?.it?.value ?? parent?.labels?.en?.value;
      const operational = cls[1] === 'treni' ? ' Servizi attivi, accessi, orari e coincidenze da verificare con il gestore; nessuna tratta o tariffa implicita.' : ' Accessi, condizioni di visita e necessità di prenotazione da verificare.';
      const imageFiles = [...new Set(values(e, 'P18'))].filter((f) => !/\.svg$|map|logo|flag|plan|drawing|painting|portrait|stamp/i.test(f)).slice(0, 3);
      const p = { key: `${code.toLowerCase()}-wd-${e.id.toLowerCase()}`, name, localName: e.labels?.[country.language]?.value, title: e.sitelinks?.enwiki?.title ?? name, category: cls[1], region, description: `${cls[2]}${locality ? ` nel territorio di ${locality}` : ` in ${country.name}`}.${operational}`, qid: e.id, revision: e.lastrevid, lat: coord.latitude, lng: coord.longitude, official: values(e, 'P856').find((v) => /^https?:\/\//.test(v)), wiki: { it: e.sitelinks?.itwiki?.title, en: e.sitelinks?.enwiki?.title }, checkedAt: date, photos: [], imageFiles, classification: { qid: cls[0], label: cls[2], links, method: 'Wikidata P31/P279; controllo entità, P17 e P625' }, regionEvidence: anchor ? `Catena P131 verso ${anchor}, località già presente nel catalogo.` : 'Nessuna zona editoriale dedotta dalla distanza; area nazionale o nazione costitutiva britannica verificata tramite P131.' };
      added.push(p); seen.add(e.id); names.add(norm(name));
    }
    await photos(added);
    output.places.push(...added); audit.missingPhotos.push(...added.filter((p) => !p.photos.length).map((p) => p.key));
    save(); console.log(`${code}: ${base.places.length + output.places.length}/${target} · aggiunte ${added.length} schede (${cls[2]})`);
  }
  save(); console.log(`${code}: FINALE ${base.places.length + output.places.length} schede`);
}
const queue = Object.entries(baseline);
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) await researchCountry(queue.shift());
}));
