// Foto di Wikimedia Commons da categorie indicate a mano, per le correzioni del catalogo (NO-5).
//   node scripts/harvest-foto.mjs            → docs/ricerca-foto-no5.json
// Stesse regole di scripts/harvest-places.mjs: solo JPEG orizzontali larghi almeno 1000 px, licenza libera, autore
// indicato; niente foto d'archivio, carte o riproduzioni. Per ogni luogo si prova un elenco di categorie e si tiene la
// prima che dà almeno una foto utilizzabile. Nessuna categoria esistente → nessuna foto (non si inventa nulla).

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'docs/ricerca-foto-no5.json');
const UA = 'norway-family-planner-catalog/1.0 (https://github.com/filippobelli/NORWAY-FAMILY-HONEYMOON-PLANNER)';
const TODAY = new Date().toISOString().slice(0, 10);

// [chiave del luogo, categorie di Commons da provare in ordine]
const WANTED = [
  ['svartisen', ['Engabreen']],
  ['hermetikkmuseum', ['Norsk Hermetikkmuseum', 'Norwegian Canning Museum']],
  ['flor-og-fjaere', ['Flor og Fjære']],
  ['solastranden', ['Solastranden', 'Sola beach']],
  ['avaldsnes', ['Avaldsnes church', 'Avaldsnes kirke', 'Nordvegen Historiesenter', 'Avaldsnes']],
  ['smelthytta', ['Smelthytta (Røros)', 'Smelthytta', 'Røros Museum']],
  ['jektefartsmuseet', ['Jektefartsmuseet', 'Anna Karoline (ship, 1876)', 'Anna Karoline (ship)']],
  ['blaisvatnet', ['Blåisvatnet', 'Blåvatnet (Lyngen)']],
  ['sapmi-park', ['Sápmi Park', 'Sapmi Park']],
  ['grenselandmuseet', ['Grenselandmuseet', 'Sør-Varanger Museum']],
];

const BAD_FILE = /(digifoto|bldsa|NB MS|Riksantikvaren|an\d{10,}|\b1[89]\d\d\)?\.jpe?g|\b18\d\d\b|map|kart|logo|coat|flag|\.svg|\.png|\.gif|\.tif|plakat|poster|PANO DIST|DISTORTE|Distorted)/i;
const FREE = /^(cc[ -]by|cc0|public domain|pd\b|attribution|fal)/i;
const NO_AUTHOR = /^(unknown|anonymous|see below|no machine-readable|own work$)/i;
const strip = (s) => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const qs = (o) => Object.entries(o).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) return null;
      await sleep(400);
      return await res.json();
    } catch {
      await sleep(2500 * (i + 1));
    }
  }
  return null;
}

async function photosOf(category) {
  const j = await get(`https://commons.wikimedia.org/w/api.php?${qs({ action: 'query', list: 'categorymembers', cmtitle: `Category:${category}`, cmtype: 'file', cmlimit: 60, format: 'json' })}`);
  const names = (j?.query?.categorymembers ?? []).map((m) => String(m.title).replace(/^File:/, '')).filter((n) => !BAD_FILE.test(n));
  if (!names.length) return [];
  const info = await get(`https://commons.wikimedia.org/w/api.php?${qs({ action: 'query', titles: names.slice(0, 40).map((t) => `File:${t}`).join('|'), prop: 'imageinfo', iiprop: 'extmetadata|size|mime', iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|Credit', format: 'json' })}`);
  const out = [];
  for (const p of Object.values(info?.query?.pages ?? {})) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    const m = ii.extmetadata ?? {};
    const author = (strip(m.Artist?.value) || strip(m.Credit?.value)).replace(/^User:/, '').replace(/\s*\(talk\)$/i, '').trim();
    const license = strip(m.LicenseShortName?.value);
    if (ii.mime !== 'image/jpeg' || ii.width < 1000 || ii.width <= ii.height || !FREE.test(license) || !author || NO_AUTHOR.test(author) || author.length > 90 || /@/.test(author)) continue;
    out.push({ file: String(p.title).replace(/^File:/, ''), author, license, ...(m.LicenseUrl?.value ? { licenseUrl: m.LicenseUrl.value.replace(/^http:/, 'https:') } : {}), w: ii.width * ii.height });
  }
  out.sort((a, b) => b.w - a.w);
  // Autori diversi prima: foto più varie
  const picked = [];
  for (const f of [...out.filter((x, i) => out.findIndex((y) => y.author === x.author) === i), ...out]) {
    if (picked.length >= 3) break;
    if (!picked.some((x) => x.file === f.file)) picked.push(f);
  }
  return picked.map(({ w: _w, ...f }) => f);
}

const result = { checkedAt: TODAY, note: 'Generato da scripts/harvest-foto.mjs: foto per le correzioni di NO-5.', places: {} };
for (const [key, cats] of WANTED) {
  let done = false;
  for (const c of cats) {
    const photos = await photosOf(c);
    if (photos.length) {
      result.places[key] = { category: c, photos };
      console.log(`${key.padEnd(20)} ${c}: ${photos.length} foto`);
      done = true;
      break;
    }
  }
  if (!done) console.log(`${key.padEnd(20)} nessuna categoria con foto utilizzabili`);
}
writeFileSync(OUT, `${JSON.stringify(result, null, 1)}\n`);
console.log(`Scritto ${OUT}`);
// Dati per l'app: stesso contenuto, in TypeScript
const photos = Object.fromEntries(Object.entries(result.places).map(([k, v]) => [k, v.photos]));
const TS = resolve(root, 'src/data/fotoNO5.ts');
writeFileSync(
  TS,
  `// GENERATO da docs/ricerca-foto-no5.json (scripts/harvest-foto.mjs): non modificare a mano.\n// Foto di Wikimedia Commons per le correzioni di NO-5, con autore e licenza letti il ${TODAY}.\n\nimport type { PlacePhoto } from './placeExtras';\n\nexport const FOTO_NO5_CHECKED_AT = '${TODAY}';\n\nexport const FOTO_NO5: Record<string, PlacePhoto[]> = ${JSON.stringify(photos, null, 2)};\n`,
);
console.log(`Scritto ${TS}`);
