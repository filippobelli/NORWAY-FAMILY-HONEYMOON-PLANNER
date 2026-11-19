// Solo API pubbliche Wikimedia. Ripetibile con --resume; nessuna scrittura nel cloud.
// I testi sono originali in cataloghi-internazionali.mjs. Non vengono importati testi di Wikipedia.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { COUNTRIES, PLACES } from './cataloghi-internazionali.mjs';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'src/data/catalogs/international-v1.json');
mkdirSync(resolve(root, 'src/data/catalogs'), { recursive: true });
const saved = process.argv.includes('--resume') && existsSync(output) ? JSON.parse(readFileSync(output, 'utf8')) : {};
const UA = 'family-trip-catalog/1.0 (https://github.com/filippobelli/NORWAY-FAMILY-HONEYMOON-PLANNER)';
const date = new Date().toISOString().slice(0, 10);
// Identità controllata manualmente quando manca la pagina inglese.
const QID_OVERRIDES = { 'dk-experimentarium': 'Q12310799' };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(host, params) {
  const url = new URL(`https://${host}/w/api.php`);
  url.search = new URLSearchParams({ format: 'json', maxlag: '5', ...params }).toString();
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) });
    if (res.status === 429 || res.status === 503) {
      await pause(Number(res.headers.get('retry-after') ?? 5) * 1000 + attempt * 2000);
      continue;
    }
    if (!res.ok) throw new Error(`${host}: HTTP ${res.status}`);
    const j = await res.json();
    if (j.error?.code === 'maxlag') { await pause(5000); continue; }
    if (j.error) throw new Error(JSON.stringify(j.error));
    return j;
  }
  throw new Error(`${host}: troppe richieste, riprovare con --resume`);
}

const values = (entity, prop) => (entity.claims?.[prop] ?? []).filter((c) => c.rank !== 'deprecated').map((c) => c.mainsnak?.datavalue?.value).filter((v) => v !== undefined);
const text = (html) => String(html ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
async function photos(files) {
  if (!files.length) return [];
  const j = await api('commons.wikimedia.org', { action: 'query', titles: files.map((f) => `File:${f}`).join('|'), prop: 'imageinfo', iiprop: 'extmetadata', iilimit: '1' });
  return Object.values(j.query?.pages ?? {}).flatMap((p) => {
    const m = p.imageinfo?.[0]?.extmetadata;
    if (!m) return [];
    const license = text(m.LicenseShortName?.value);
    const author = text(m.Artist?.value);
    // Licenza per singolo file, autore identificabile, nessun media scaricato.
    if (!/^(CC BY(?:-SA)?(?: [\d.]+)?|CC0(?: [\d.]+)?|Public domain)$/i.test(license) || !author || author.length > 220 || /unknown|anonymous|no machine-readable|@/i.test(author)) return [];
    return [{ file: p.title.replace(/^File:/, ''), author, license, licenseUrl: m.LicenseUrl?.value || 'https://commons.wikimedia.org/wiki/Commons:Licensing' }];
  }).slice(0, 3);
}

for (const [code, country] of Object.entries(COUNTRIES)) {
  if (saved[code]?.places.length === PLACES[code].length && PLACES[code].every(([key, title, , , regionIndex, description]) => saved[code].places.some((p) => p.key === `${code.toLowerCase()}-${key}` && p.title === title && p.region === country.regions[regionIndex] && p.description === description))) continue;
  const old = new Map((saved[code]?.places ?? []).map((p) => [p.key, p]));
  const places = [];
  const titles = PLACES[code].map((p) => p[1]);
  const j = await api('www.wikidata.org', { action: 'wbgetentities', sites: 'enwiki', titles: titles.join('|'), props: 'claims|labels|sitelinks', languages: 'it|en' });
  const entities = Object.values(j.entities);
  for (const [key, title, name, category, regionIndex, description] of PLACES[code]) {
    const prior = old.get(`${code.toLowerCase()}-${key}`);
    if (prior?.qid && prior.title === title) { places.push({ ...prior, region: country.regions[regionIndex], description }); continue; }
    let e = entities.find((e) => e.sitelinks?.enwiki?.title === title);
    const override = QID_OVERRIDES[`${code.toLowerCase()}-${key}`];
    if (override) { const r = await api('www.wikidata.org', { action: 'wbgetentities', ids: override, props: 'claims|labels|sitelinks', languages: `it|en|${country.language}` }); e = r.entities[override]; }
    // Segue anche i redirect del titolo inglese (risolti da Wikipedia, nessun testo importato).
    if (!e) {
      const r = await api('en.wikipedia.org', { action: 'query', titles: title, redirects: '1', prop: 'pageprops', ppprop: 'wikibase_item' });
      const qid = Object.values(r.query?.pages ?? {})[0]?.pageprops?.wikibase_item;
      if (qid) { const r = await api('www.wikidata.org', { action: 'wbgetentities', ids: qid, props: 'claims|labels|sitelinks', languages: 'it|en' }); e = r.entities[qid]; }
    }
    const coord = e && values(e, 'P625').find((v) => v.globe === 'http://www.wikidata.org/entity/Q2');
    if (!coord) throw new Error(`${code} ${title}: coordinate terrestri mancanti`);
    const [south, north, west, east] = country.bounds;
    if (coord.latitude < south || coord.latitude > north || coord.longitude < west || coord.longitude > east) throw new Error(`${code} ${title}: coordinate fuori area`);
    const declaredCountries = values(e, 'P17').map((v) => v.id);
    if (declaredCountries.length && !declaredCountries.includes(country.qid)) throw new Error(`${code} ${title}: nazione Wikidata diversa (${declaredCountries})`);
    const files = [...new Set(values(e, 'P18'))].filter((f) => !/\.svg$|map|logo|flag|plan|drawing|painting|portrait|stamp/i.test(f)).slice(0, 3);
    let images = [];
    try { images = await photos(files); } catch (err) { console.warn(`${code} ${key}: foto non disponibile (${err.message})`); }
    const iata = category === 'aeroporti' ? values(e, 'P238').find((v) => /^[A-Z]{3}$/.test(v)) : undefined;
    if (category === 'aeroporti' && !iata) throw new Error(`${code} ${title}: IATA mancante`);
    places.push({ key: `${code.toLowerCase()}-${key}`, name, title, category, region: country.regions[regionIndex], description, qid: e.id, lat: coord.latitude, lng: coord.longitude, localName: e.labels?.[country.language]?.value, iata, official: values(e, 'P856').find((v) => /^https?:\/\//.test(v)), wiki: { it: e.sitelinks?.itwiki?.title, en: e.sitelinks?.enwiki?.title }, photos: images, checkedAt: date });
    saved[code] = { ...country, checkedAt: date, places };
    writeFileSync(output, JSON.stringify(saved, null, 2) + '\n');
    console.log(`${code} ${places.length}/${titles.length} ${name} · ${images.length} foto`);
    await pause(350);
  }
  saved[code] = { ...country, checkedAt: date, places };
  writeFileSync(output, JSON.stringify(saved, null, 2) + '\n');
}
