// Dalla ricerca (docs/ricerca-luoghi-nord.json, scritta da scripts/harvest-places.mjs) al file dei dati di base
// src/data/nordFonti.ts: coordinate con la loro fonte, riferimenti Wikidata/Wikipedia, sito ufficiale, foto con crediti.
//   node scripts/build-nord.mjs
//   node scripts/build-nord.mjs attrazioni   → docs/ricerca-luoghi-attrazioni.json → src/data/attrazioniFonti.ts (NO-4)
// ATTENZIONE: src/data/nordFonti.ts è il dato pubblicato in NO-3 e non va rigenerato (il seed di NO-3 deve restare identico).
// I testi delle schede NON sono qui: stanno in src/data/nordSchede.ts, scritti a mano.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SET = process.argv[2] ?? 'nord';
if (!/^[a-z]+$/.test(SET)) throw new Error('Nome del gruppo non valido');
const j = JSON.parse(readFileSync(resolve(root, `docs/ricerca-luoghi-${SET}.json`), 'utf8'));

// Foto d'archivio, carte, riproduzioni e file senza un autore vero: fuori
const BAD_FILE = /(Riksantikvaren|Kanstadsamlingen|fo\d{8,}|Admiralty|S-1602U3|NMF\d|Himmler|Gedenktafel|anti-aircraft|^USS |Cottongrass|Dogwood|Zeekoet|zeekoet|Distorted panoramic|NASAMS|digifoto|malmutskipningskai|^Leaving Bod|Frøyblikk|Le Boreal|Angler fish|Tromsø 20160301194858|Schaduw|Hurtigruten 2015)/i;
// Esclusioni del gruppo «attrazioni», scelte guardando l'elenco dei file raccolti
const BAD_FILE_ATTR = /(\bkart\b|\bmap\b|plakat|poster|an\d{10,}|\b1[89]\d\d\)?\.jpe?g|in 19[0-4]\d|RP-F-|drawing|tegning|maleri|painting|litografi|stamp|frimerke|Marta Kos|LaserJet|BlackBerry|Cycle route|Motorcycle|Signs warning|Earth from Space|plastic-foil|under bygging|Rfid|Noticeboard|Magedans|Carsten Smith|sametingsrepresentanter|Minister of|library|Tempo Extra|ski poles|Costa Pacifica)/i;
const BAD_AUTHOR = /^(own work|unknown|unknown author.*|anonymous|see below.*|no machine-readable.*)$/i;
function cleanAuthor(a) {
  return String(a ?? '')
    .replace(/\s*\(Please credit.*$/i, '')
    .replace(/\s*\d{1,2}:\d{2}, \d{1,2} \w+ \d{4} \(UTC\)$/, '')
    .replace(/^User:/, '')
    .replace(/\s*\(talk\)$/i, '')
    .trim();
}
function photos(list) {
  const out = [];
  for (const f of list ?? []) {
    // Nel gruppo «attrazioni» si tolgono anche le formule di Commons intorno al nome (e i recapiti fra parentesi quadre)
    const author = SET === 'nord'
      ? cleanAuthor(f.author)
      : cleanAuthor(f.author).replace(/^(?:The )?original uploader was (.+?) at .*$/i, '$1').replace(/\s*\[user:.*\]$/i, '').replace(/^Photo © \d{4} by /i, '').trim();
    if (BAD_FILE.test(f.file) || (SET !== 'nord' && (BAD_FILE_ATTR.test(f.file) || /@/.test(author))) || !author || BAD_AUTHOR.test(author) || author.length > 90) continue;
    out.push({ file: f.file, author, license: f.license, ...(f.licenseUrl ? { licenseUrl: f.licenseUrl.replace(/^http:/, 'https:') } : {}) });
  }
  return out.slice(0, 3);
}

const fonti = {};
for (const p of j.places) {
  const m = p.match;
  fonti[p.key] = {
    ...(m ? { wd: { qid: m.qid, label: m.label, lat: m.lat, lng: m.lng, ...(m.it ? { it: m.it } : {}), ...(m.en ? { en: m.en } : {}), ...(m.official ? { official: m.official.replace(/^http:/, 'https:') } : {}) } } : {}),
    ...(p.osm ? { osm: { id: p.osm.osm, name: p.osm.name, kind: p.osm.kind, lat: p.osm.lat, lng: p.osm.lng } } : {}),
    ...(p.photoCategory ? { photosOwn: true } : {}),
    photos: photos(p.photos),
  };
}
const esistenti = {};
for (const e of j.existing ?? []) {
  const list = photos(e.photos);
  if (list.length) esistenti[e.key] = list;
}

const outNord = `// GENERATO da scripts/build-nord.mjs a partire da docs/ricerca-luoghi-nord.json: non modificare a mano.
// Dati di base dei luoghi della zona nord (catalogo NO-3): coordinate con la loro fonte (Wikidata P625 oppure
// OpenStreetMap/Nominatim), riferimenti a Wikidata e Wikipedia, sito ufficiale (Wikidata P856), foto di Wikimedia
// Commons con autore e licenza. Abbinamento: per nome E per distanza da un punto indicativo (mai salvato).

import type { PlacePhoto } from './placeExtras';

export interface NordFonte {
  wd?: { qid: string; label: string; lat: number; lng: number; it?: string; en?: string; official?: string };
  osm?: { id: string; name: string; kind: string; lat: number; lng: number };
  /** Foto prese da una categoria di Commons del luogo indicata a mano (luoghi senza elemento Wikidata adatto) */
  photosOwn?: true;
  photos: PlacePhoto[];
}

/** Data di lettura di coordinate, riferimenti, foto e licenze */
export const NORD_CHECKED_AT = '${j.generatedAt}';

export const NORD_FONTI: Record<string, NordFonte> = ${JSON.stringify(fonti, null, 2)};

/** Foto in più per luoghi già presenti nel catalogo (stesso elemento Wikidata di src/data/wiki.ts) */
export const NORD_FOTO_ESISTENTI: Record<string, PlacePhoto[]> = ${JSON.stringify(esistenti, null, 2)};
`;
const P = SET.slice(0, 4).toUpperCase();
const outOther = `// GENERATO da scripts/build-nord.mjs ${SET} a partire da docs/ricerca-luoghi-${SET}.json: non modificare a mano.
// Dati di base del gruppo «${SET}»: coordinate con la loro fonte (Wikidata P625 oppure OpenStreetMap/Nominatim),
// riferimenti a Wikidata e Wikipedia, sito ufficiale (Wikidata P856), foto di Wikimedia Commons con autore e licenza.
// Abbinamento: per nome E per distanza da un punto indicativo (mai salvato).

import type { NordFonte } from './nordFonti';
import type { PlacePhoto } from './placeExtras';

/** Data di lettura di coordinate, riferimenti, foto e licenze */
export const ${P}_CHECKED_AT = '${j.generatedAt}';

export const ${P}_FONTI: Record<string, NordFonte> = ${JSON.stringify(fonti, null, 2)};

/** Foto in più per luoghi già presenti nel catalogo (stesso elemento Wikidata di src/data/wiki.ts) */
export const ${P}_FOTO_ESISTENTI: Record<string, PlacePhoto[]> = ${JSON.stringify(esistenti, null, 2)};
`;
const file = `src/data/${SET}Fonti.ts`;
if (SET === 'nord' && !process.argv.includes('--forza')) throw new Error('nordFonti.ts è il dato pubblicato in NO-3: non va rigenerato (usa --forza solo sapendo cosa cambia).');
writeFileSync(resolve(root, file), SET === 'nord' ? outNord : outOther);
console.log(`Scritto ${file}: ${Object.keys(fonti).length} luoghi, ${Object.values(fonti).reduce((n, f) => n + f.photos.length, 0)} foto; ${Object.keys(esistenti).length} luoghi esistenti con foto.`);
