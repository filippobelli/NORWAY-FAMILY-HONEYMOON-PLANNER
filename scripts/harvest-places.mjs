// Raccolta dei dati di base per le schede nuove del catalogo (zona nord, NO-3).
//   node scripts/harvest-places.mjs            → docs/ricerca-luoghi-nord.json
//   node scripts/harvest-places.mjs --only nusfjord,ramberg   (aggiorna solo alcune voci)
//
// Per ogni candidato (nome + punto indicativo, usato SOLO per scegliere l'elemento giusto, mai salvato come coordinata):
// - cerca l'elemento Wikidata per nome e tiene quello con coordinate P625 entro il raggio dal punto indicativo;
// - se Wikidata non ha nulla, cerca su OpenStreetMap (Nominatim) con la stessa regola;
// - legge voci di Wikipedia (it/en/nb), sito ufficiale (P856), foto principale (P18) e categoria di Commons (P373);
// - sceglie fino a 3 foto di Commons con licenza libera e ne salva autore e licenza;
// - salva l'inizio delle voci di Wikipedia come materiale di lettura per scrivere le schede (NON finisce nel catalogo).
// Nessun valore è inventato: un candidato senza riscontro resta con `match: null`.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'docs/ricerca-luoghi-nord.json');
const UA = 'norway-family-planner-catalog/1.0 (https://github.com/filippobelli/NORWAY-FAMILY-HONEYMOON-PLANNER)';
const TODAY = new Date().toISOString().slice(0, 10);

// [chiave, nome da cercare, lat, lng indicativi, raggio km, nomi alternativi]
const CANDIDATES = [
  // Bodø e Salten
  ['bodo', 'Bodø', 67.28, 14.4, 8, ['Bodø (town)']],
  ['kjerringoy', 'Kjerringøy', 67.52, 14.76, 12, []],
  ['luftfartsmuseum', 'Norsk Luftfartsmuseum', 67.277, 14.41, 5, ['Norwegian Aviation Museum']],
  ['mjelle', 'Mjelle', 67.41, 14.63, 8, []],
  ['keiservarden', 'Keiservarden', 67.31, 14.48, 6, []],
  // Lofoten
  ['moskenes', 'Moskenes', 67.9, 13.05, 6, ['Moskenes (village)']],
  ['sorvagen', 'Sørvågen', 67.89, 13.03, 5, []],
  ['reinebringen', 'Reinebringen', 67.93, 13.07, 5, []],
  ['kvalvika', 'Kvalvika', 68.07, 13.0, 8, ['Kvalvika Beach']],
  ['ryten', 'Ryten', 68.09, 13.02, 8, []],
  ['fredvang', 'Fredvang', 68.08, 13.17, 6, []],
  ['ramberg', 'Ramberg', 68.09, 13.23, 5, ['Ramberg, Nordland', 'Rambergstranda']],
  ['flakstad-kirke', 'Flakstad kirke', 68.1, 13.29, 6, ['Flakstad Church']],
  ['skagsanden', 'Skagsanden', 68.1, 13.29, 6, []],
  ['vikten', 'Vikten', 68.14, 13.26, 6, []],
  ['ballstad', 'Ballstad', 68.07, 13.53, 6, []],
  ['leknes', 'Leknes', 68.15, 13.61, 6, []],
  ['uttakleiv', 'Uttakleiv', 68.21, 13.5, 6, [], 'Utakleiv'],
  ['unstad', 'Unstad', 68.27, 13.58, 6, []],
  ['eggum', 'Eggum', 68.31, 13.65, 6, []],
  ['borg-lofoten', 'Borg', 68.24, 13.75, 6, ['Borg, Nordland', 'Bøstad']],
  ['stamsund', 'Stamsund', 68.12, 13.84, 6, []],
  ['gimsoy', 'Gimsøya', 68.3, 14.15, 10, ['Gimsøy']],
  ['kabelvag', 'Kabelvåg', 68.21, 14.48, 5, []],
  ['lofotakvariet', 'Lofotakvariet', 68.2, 14.44, 5, ['Lofoten Aquarium']],
  ['lofotmuseet', 'Lofotmuseet', 68.2, 14.45, 5, ['Lofoten Museum']],
  ['lofotkatedralen', 'Vågan kirke', 68.22, 14.49, 5, ['Vågan Church', 'Lofotkatedralen']],
  ['svolvaergeita', 'Svolværgeita', 68.25, 14.57, 5, []],
  ['krigsminnemuseum', 'Lofoten Krigsminnemuseum', 68.23, 14.57, 5, ['Lofoten War Memorial Museum']],
  ['trollfjord', 'Trollfjorden', 68.36, 14.97, 10, ['Trollfjord']],
  ['skrova', 'Skrova', 68.16, 14.65, 6, []],
  ['laukvik', 'Laukvik', 68.39, 14.4, 8, []],
  ['vaeroy', 'Værøy', 67.66, 12.69, 12, []],
  ['rost', 'Røst', 67.52, 12.1, 15, []],
  ['fiskevaersmuseum', 'Norsk Fiskeværsmuseum', 67.88, 12.98, 4, ['Norwegian Fishing Village Museum']],
  ['torrfiskmuseum', 'Lofoten Tørrfiskmuseum', 67.88, 12.98, 4, ['Lofoten Stockfish Museum']],
  ['galleri-espolin', 'Galleri Espolin', 68.2, 14.44, 5, []],
  // Vesterålen e Harstad
  ['sortland', 'Sortland', 68.69, 15.41, 6, ['Sortland (town)']],
  ['stokmarknes', 'Stokmarknes', 68.56, 14.91, 6, []],
  ['hurtigrutemuseet', 'Hurtigrutemuseet', 68.57, 14.91, 5, ['Hurtigruten Museum']],
  ['melbu', 'Melbu', 68.5, 14.8, 6, []],
  ['nyksund', 'Nyksund', 68.99, 15.01, 6, []],
  ['sto', 'Stø', 69.02, 15.11, 6, ['Stø, Nordland']],
  ['bleik', 'Bleik', 69.28, 15.96, 6, []],
  ['bleiksoya', 'Bleiksøya', 69.28, 15.88, 6, []],
  ['andenes-fyr', 'Andenes fyr', 69.32, 16.12, 4, ['Andenes Lighthouse']],
  ['spaceship-aurora', 'Andøya Space', 69.29, 16.02, 6, ['Andøya Space Center', 'Andøya Rocket Range']],
  ['moysalen', 'Møysalen nasjonalpark', 68.52, 15.45, 20, ['Møysalen National Park']],
  ['harstad', 'Harstad', 68.8, 16.54, 6, ['Harstad (town)']],
  ['trondenes-kirke', 'Trondenes kirke', 68.82, 16.56, 5, ['Trondenes Church']],
  ['trondenes-senter', 'Trondenes Historiske Senter', 68.82, 16.56, 5, ['Trondenes Historical Center']],
  // Narvik
  ['narvik', 'Narvik', 68.44, 17.43, 6, ['Narvik (town)']],
  ['narvik-krigsmuseum', 'Narvik Krigsmuseum', 68.438, 17.427, 4, ['Narvik War Museum']],
  ['ofotbanen', 'Ofotbanen', 68.44, 17.8, 40, ['Ofoten Line']],
  // Senja
  ['gryllefjord', 'Gryllefjord', 69.36, 17.05, 5, []],
  ['torsken', 'Torsken', 69.35, 17.1, 8, ['Torsken (village)']],
  ['hamn-i-senja', 'Hamn i Senja', 69.42, 17.16, 6, ['Hamn, Senja', 'Hamn']],
  ['skaland', 'Skaland', 69.45, 17.3, 6, []],
  ['tungeneset', 'Tungeneset', 69.489, 17.33, 5, [], 'Tungeneset'],
  ['okshornan', 'Okshornan', 69.5, 17.35, 6, []],
  ['ersfjord-senja', 'Ersfjord', 69.48, 17.4, 5, ['Ersfjordstranda', 'Ersfjord, Senja']],
  ['bergsbotn', 'Bergsbotn', 69.44, 17.42, 5, [], 'Bergsbotn'],
  ['mefjordvaer', 'Mefjordvær', 69.52, 17.43, 5, []],
  ['senjahopen', 'Senjahopen', 69.5, 17.5, 5, []],
  ['segla', 'Segla', 69.5, 17.6, 6, []],
  ['fjordgard', 'Fjordgård', 69.51, 17.63, 5, []],
  ['husoy', 'Husøy', 69.54, 17.66, 5, ['Husøy, Senja', 'Husøy i Senja']],
  ['botnhamn', 'Botnhamn', 69.51, 17.9, 5, []],
  ['finnsnes', 'Finnsnes', 69.23, 17.98, 6, []],
  ['anderdalen', 'Ånderdalen nasjonalpark', 69.2, 17.3, 20, ['Ånderdalen National Park']],
  // Tromsø e dintorni
  ['brensholmen', 'Brensholmen', 69.6, 18.04, 5, []],
  ['sommaroy', 'Sommarøy', 69.63, 18.01, 6, ['Sommarøya']],
  ['kvaloya', 'Kvaløya', 69.67, 18.5, 30, ['Kvaløya (Tromsø)']],
  ['ersfjordbotn', 'Ersfjordbotn', 69.69, 18.63, 5, []],
  ['ishavskatedralen', 'Ishavskatedralen', 69.648, 18.987, 3, ['Arctic Cathedral']],
  ['fjellheisen', 'Fjellheisen', 69.64, 18.99, 3, []],
  ['polarmuseet', 'Polarmuseet', 69.652, 18.963, 3, ['Polar Museum (Tromsø)', 'Polar Museum']],
  ['tromso-museum', 'Norges arktiske universitetsmuseum', 69.635, 18.91, 4, ['Tromsø Museum', 'Tromsø University Museum']],
  ['botanisk-hage', 'Tromsø arktisk-alpine botaniske hage', 69.676, 18.975, 4, ['Arctic-Alpine Botanic Garden']],
  ['tromso-domkirke', 'Tromsø domkirke', 69.649, 18.957, 3, ['Tromsø Cathedral']],
  ['vitensenter', 'Nordnorsk vitensenter', 69.68, 18.97, 4, ['Science Centre of Northern Norway']],
  ['lyngsalpene', 'Lyngsalpene', 69.6, 20.0, 40, ['Lyngen Alps']],
  ['lyngseidet', 'Lyngseidet', 69.58, 20.22, 6, []],
  ['malselvfossen', 'Målselvfossen', 69.03, 18.65, 8, []],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
      if (res.status === 429 || res.status >= 500) {
        const wait = Number(res.headers.get('retry-after')) || 0;
        if (wait) await sleep(Math.min(wait, 60) * 1000);
        throw new Error(`HTTP ${res.status}`);
      }
      if (!res.ok) return null;
      await sleep(700);
      return await res.json();
    } catch (e) {
      if (process.env.DEBUG) console.error('  riprovo', i, url.slice(0, 90), String(e));
      await sleep(3000 * (i + 1));
      if (i === 4) console.error('  errore', url.slice(0, 120), String(e));
    }
  }
  return null;
}
const qs = (o) => Object.entries(o).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
const km = (a, b, c, d) => {
  const R = 6371, r = Math.PI / 180;
  const x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
const strip = (s) => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function searchIds(name) {
  const ids = [];
  for (const lang of ['nb', 'en']) {
    const j = await get(`https://www.wikidata.org/w/api.php?${qs({ action: 'wbsearchentities', search: name, language: lang, uselang: lang, type: 'item', limit: 8, format: 'json' })}`);
    for (const s of j?.search ?? []) if (!ids.includes(s.id)) ids.push(s.id);
  }
  return ids;
}

async function entities(ids) {
  if (!ids.length) return {};
  const j = await get(`https://www.wikidata.org/w/api.php?${qs({ action: 'wbgetentities', ids: ids.slice(0, 40).join('|'), props: 'claims|sitelinks|labels|descriptions', languages: 'it|en|nb', sitefilter: 'itwiki|enwiki|nowiki|commonswiki', format: 'json' })}`);
  return j?.entities ?? {};
}
const claim = (e, p) => e.claims?.[p]?.[0]?.mainsnak?.datavalue?.value;

// Foto d'archivio, carte nautiche e riproduzioni: non descrivono il luogo com'è oggi
const BAD_FILE = /(Riksantikvaren|Kanstadsamlingen|fo\d{8,}|Admiralty|S-1602U3|NMF\d|map|kart|locator|location|logo|coat|våpen|vapen|komm|flag|\.svg|\.png|\.gif|\.tif|\.webm|\.ogv|\.pdf|panoramio.*\(\d+\)|aerial|satellite|plan\b|skilt|sign\b)/i;
const FREE = /^(cc[ -]by|cc0|public domain|pd\b|attribution|fal)/i;

async function fileInfo(titles) {
  const out = [];
  for (let i = 0; i < titles.length; i += 40) {
    const j = await get(`https://commons.wikimedia.org/w/api.php?${qs({ action: 'query', titles: titles.slice(i, i + 40).map((t) => `File:${t}`).join('|'), prop: 'imageinfo', iiprop: 'extmetadata|size|mime', iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|Assessments|Credit', format: 'json' })}`);
    for (const p of Object.values(j?.query?.pages ?? {})) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const m = ii.extmetadata ?? {};
      out.push({
        file: String(p.title).replace(/^File:/, ''),
        width: ii.width, height: ii.height, mime: ii.mime,
        author: strip(m.Artist?.value) || strip(m.Credit?.value) || '',
        license: strip(m.LicenseShortName?.value),
        licenseUrl: m.LicenseUrl?.value || undefined,
        assessed: Boolean(m.Assessments?.value),
      });
    }
  }
  return out;
}
const usable = (f) => f.mime === 'image/jpeg' && f.width >= 1000 && FREE.test(f.license) && f.author && f.author.length < 160;

async function photosFor(p18, category) {
  const picked = [];
  if (p18) {
    const [main] = await fileInfo([p18]);
    if (main && FREE.test(main.license) && main.author) picked.push(main);
  }
  if (category) {
    const j = await get(`https://commons.wikimedia.org/w/api.php?${qs({ action: 'query', list: 'categorymembers', cmtitle: `Category:${category}`, cmtype: 'file', cmlimit: 80, format: 'json' })}`);
    const names = (j?.query?.categorymembers ?? []).map((m) => String(m.title).replace(/^File:/, '')).filter((n) => !BAD_FILE.test(n) && n !== p18);
    const infos = (await fileInfo(names)).filter((f) => usable(f) && f.width > f.height);
    infos.sort((a, b) => Number(b.assessed) - Number(a.assessed) || b.width * b.height - a.width * a.height);
    const authors = new Set(picked.map((x) => x.author));
    // Prima autori diversi (foto più varie), poi il resto
    for (const f of [...infos.filter((x) => !authors.has(x.author)), ...infos]) {
      if (picked.length >= 3) break;
      if (picked.some((x) => x.file === f.file)) continue;
      picked.push(f);
    }
  }
  return picked.slice(0, 3).map(({ file, author, license, licenseUrl, width, height }) => ({ file, author, license, licenseUrl, width, height }));
}

async function intro(site, title) {
  if (!title) return undefined;
  const j = await get(`https://${site}.wikipedia.org/w/api.php?${qs({ action: 'query', prop: 'extracts', exintro: 1, explaintext: 1, exchars: 900, redirects: 1, titles: title, format: 'json' })}`);
  const p = Object.values(j?.query?.pages ?? {})[0];
  return p?.extract ? strip(p.extract) : undefined;
}

async function nominatim(name, lat, lng, radius) {
  const d = 0.4;
  const j = await get(`https://nominatim.openstreetmap.org/search?${qs({ q: name, format: 'jsonv2', limit: 8, countrycodes: 'no', viewbox: `${lng - d * 2.5},${lat + d},${lng + d * 2.5},${lat - d}`, bounded: 1 })}`);
  await sleep(1100);
  const hits = (j ?? []).map((h) => ({ ...h, dist: km(lat, lng, Number(h.lat), Number(h.lon)) })).filter((h) => h.dist <= radius).sort((a, b) => a.dist - b.dist);
  const h = hits[0];
  return h ? { lat: Number(Number(h.lat).toFixed(5)), lng: Number(Number(h.lon).toFixed(5)), osm: `${h.osm_type}/${h.osm_id}`, name: h.name, kind: `${h.category}/${h.type}`, distKm: Number(h.dist.toFixed(1)) } : null;
}

// `forcedCategory`: categoria di Commons indicata a mano per i luoghi senza elemento Wikidata (solo per le foto)
async function harvest([key, name, lat, lng, radius, alts, forcedCategory]) {
  const ids = [];
  for (const n of [name, ...alts]) for (const id of await searchIds(n)) if (!ids.includes(id)) ids.push(id);
  const ents = await entities(ids);
  const near = Object.values(ents)
    .map((e) => ({ e, c: claim(e, 'P625') }))
    .filter((x) => x.c)
    .map((x) => ({ ...x, dist: km(lat, lng, x.c.latitude, x.c.longitude) }))
    .filter((x) => x.dist <= radius)
    // a parità di zona, l'elemento con più voci e foto è quello descritto meglio
    .sort((a, b) => (Object.keys(b.e.sitelinks ?? {}).length + (claim(b.e, 'P18') ? 1 : 0)) - (Object.keys(a.e.sitelinks ?? {}).length + (claim(a.e, 'P18') ? 1 : 0)) || a.dist - b.dist);
  const osm = await nominatim(name, lat, lng, radius);
  const base = { key, query: name, checkedAt: TODAY, osm };
  if (!near.length) return { ...base, match: null, photoCategory: forcedCategory, photos: forcedCategory ? await photosFor(undefined, forcedCategory) : [] };
  const { e, c, dist } = near[0];
  const sl = e.sitelinks ?? {};
  const category = claim(e, 'P373') ?? (sl.commonswiki?.title?.startsWith('Category:') ? sl.commonswiki.title.slice(9) : undefined);
  const p18 = claim(e, 'P18');
  const it = sl.itwiki?.title, en = sl.enwiki?.title, nb = sl.nowiki?.title;
  return {
    ...base,
    match: {
      qid: e.id,
      label: e.labels?.nb?.value ?? e.labels?.en?.value,
      description: e.descriptions?.en?.value ?? e.descriptions?.nb?.value,
      lat: Number(c.latitude.toFixed(5)),
      lng: Number(c.longitude.toFixed(5)),
      distKm: Number(dist.toFixed(1)),
      it, en, nb,
      official: claim(e, 'P856'),
      commonsCategory: category,
      others: near.slice(1, 4).map((x) => `${x.e.id} ${x.e.labels?.nb?.value ?? x.e.labels?.en?.value ?? ''} (${x.dist.toFixed(1)} km)`),
    },
    photoCategory: forcedCategory,
    photos: await photosFor(forcedCategory ? undefined : p18, forcedCategory ?? category),
    reading: { it: await intro('it', it), en: await intro('en', en), nb: it || en ? undefined : await intro('no', nb) },
  };
}

const onlyArg = process.argv.indexOf('--only');
const only = onlyArg > 0 ? new Set(process.argv[onlyArg + 1].split(',')) : null;
const resume = process.argv.includes('--resume');
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { places: [] };
const byKey = new Map(prev.places.map((p) => [p.key, p]));

// Luoghi già nel catalogo (zona nord): solo le foto, dall'elemento Wikidata già abbinato in src/data/wiki.ts
const EXISTING = [
  ['tromso', 'Q26087'], ['reine', 'Q593597'], ['henningsvaer', 'Q1605649'], ['a-lofoten', 'Q258490'], ['svolvaer', 'Q145948'],
  ['nusfjord', 'Q1783413'], ['hamnoy', 'Q1776894'], ['andenes', 'Q167305'], ['senja', 'Q56249968'], ['saltstraumen', 'Q3470260'],
  ['polaria', 'Q28888'], ['lofotr', 'Q893523'], ['polar-park', 'Q1779978'], ['lofoten', 'Q186822'],
];
if (process.argv.includes('--existing')) {
  const existing = [];
  for (const [key, qid] of EXISTING) {
    const e = (await entities([qid]))[qid];
    if (!e) { console.log(`${key.padEnd(20)} elemento non letto`); continue; }
    const sl = e.sitelinks ?? {};
    const category = claim(e, 'P373') ?? (sl.commonswiki?.title?.startsWith('Category:') ? sl.commonswiki.title.slice(9) : undefined);
    const photos = await photosFor(claim(e, 'P18'), category);
    existing.push({ key, qid, checkedAt: TODAY, commonsCategory: category, photos });
    console.log(`${key.padEnd(20)} ${qid}, ${photos.length} foto`);
  }
  writeFileSync(OUT, `${JSON.stringify({ ...prev, existing }, null, 1)}\n`);
  process.exit(0);
}
for (const c of CANDIDATES) {
  if (only && !only.has(c[0])) continue;
  if (resume && byKey.get(c[0])?.match) continue;
  const r = await harvest(c);
  byKey.set(c[0], r);
  // salvataggio a ogni voce: un'interruzione non butta via il lavoro fatto
  writeFileSync(OUT, `${JSON.stringify({ generatedAt: TODAY, partial: true, places: CANDIDATES.map((x) => byKey.get(x[0])).filter(Boolean) }, null, 1)}\n`);
  console.log(`${c[0].padEnd(20)} ${r.match ? `${r.match.qid} ${r.match.distKm} km, ${r.photos.length} foto` : r.osm ? `solo OSM ${r.osm.osm}` : 'NESSUN RISCONTRO'}`);
}
const places = CANDIDATES.map((c) => byKey.get(c[0])).filter(Boolean);
writeFileSync(OUT, `${JSON.stringify({ generatedAt: TODAY, note: 'Generato da scripts/harvest-places.mjs. `reading` è materiale di lettura (Wikipedia, CC BY-SA), non entra nel catalogo.', places, existing: prev.existing ?? [] }, null, 1)}\n`);
console.log(`Scritto ${OUT}: ${places.length} candidati, ${places.filter((p) => p.match).length} con Wikidata.`);
