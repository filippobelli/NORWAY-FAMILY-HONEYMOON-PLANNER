import { readFileSync } from 'node:fs';
import { buildInternationalV2, INTERNATIONAL_CODES, researchedCountrySeed, type ResearchedCountry } from './build-international';
import { ADDITIONAL_CODES, buildAdditionalLatest } from './build-additional-countries';
import { NORTHERN_ASIA_CODES, buildNorthernAsia } from './build-northern-asia';

export const RANGE_CODES = [...INTERNATIONAL_CODES, ...ADDITIONAL_CODES, ...NORTHERN_ASIA_CODES.filter((c) => c !== 'IN')] as readonly string[];

export function buildBeforeRange(code: string) {
  if ((INTERNATIONAL_CODES as readonly string[]).includes(code)) return buildInternationalV2(code);
  if ((ADDITIONAL_CODES as readonly string[]).includes(code)) return buildAdditionalLatest(code);
  return buildNorthernAsia(code);
}

/** Release additive: ogni scheda, fonte, foto e regione precedente resta identica. */
export function buildCatalogRange(code: string) {
  if (!RANGE_CODES.includes(code)) throw new Error(`Nazione non prevista: ${code}`);
  const previous = buildBeforeRange(code);
  const snapshot = JSON.parse(readFileSync(new URL('../src/data/catalogs/catalog-range-v1.json', import.meta.url), 'utf8')) as Record<string, ResearchedCountry>;
  const addition = snapshot[code];
  if (!addition) throw new Error(`Ricerca mancante: ${code}`);
  const extra = researchedCountrySeed(code, addition, previous.release.version + 1);
  const previousIds = new Set(previous.places.map((p) => p.key));
  const qids = new Set(previous.places.map((p) => p.wiki?.qid));
  if (extra.places.some((p) => previousIds.has(p.key) || qids.has(p.wiki?.qid))) throw new Error(`Duplicato nella ricerca: ${code}`);
  const seed = structuredClone(previous);
  const previousRegions = new Set(seed.regions.map((r) => r.key));
  seed.regions.push(...extra.regions.filter((r) => !previousRegions.has(r.key)));
  seed.places.push(...extra.places);
  if (seed.places.length < 300 || seed.places.length > 400) throw new Error(`Fuori dal range 300–400: ${code}, ${seed.places.length}`);
  seed.release = { ...previous.release, version: extra.release.version, previousReleaseId: `${code}-${previous.release.version}`, dataCheckedUntil: addition.checkedAt, notes: `${previous.release.notes} Ampliamento additivo nel range 300–400: identità, coordinate e categorie da Wikidata; informazioni operative da verificare.`, sourceNotes: [...previous.release.sourceNotes, { label: 'Ampliamento catalogo · ricerca strutturata Wikidata', url: 'https://www.wikidata.org/wiki/Wikidata:Licensing', license: 'CC0-1.0', checkedAt: addition.checkedAt, note: 'Dati strutturati; nessun testo enciclopedico importato. Zone non attribuibili mantenute nell’area nazionale, senza dedurre confini dalla vicinanza.' }] };
  seed.correctedKeys = undefined;
  seed.outFile = `catalogo-${code.toLowerCase()}-v${seed.release.version}.sql`;
  return seed;
}
