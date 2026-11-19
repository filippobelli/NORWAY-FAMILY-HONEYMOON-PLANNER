import { readFileSync } from 'node:fs';
import { researchedCountrySeed, type ResearchedCountry } from './build-international';

export const ADDITIONAL_CODES = ['SI', 'AT', 'ES', 'PT', 'HR', 'GR', 'TR'] as const;
export const ADDITIONAL_PATCH_CODES = ['SI', 'AT'] as const;

/** Dati locali congelati, caricati solo dal seed e dai test: nessun catalogo aggiunto al bundle frontend. */
export function buildAdditionalCountry(code: string) {
  if (!(ADDITIONAL_CODES as readonly string[]).includes(code)) throw new Error(`Nazione non supportata: ${code}`);
  const data = JSON.parse(readFileSync(new URL('../src/data/catalogs/additional-countries-v1.json', import.meta.url), 'utf8')) as Record<string, ResearchedCountry>;
  const country = data[code];
  if (!country || country.places.length < (code === 'SI' ? 120 : 140)) throw new Error(`Ricerca incompleta per ${code}`);
  if (code === 'HR') country.tourismChecked = false;
  return researchedCountrySeed(code, country, 1);
}

/** Correzioni editoriali finali: le prime release già caricate restano immutabili. */
export function buildAdditionalCountryV2(code: string) {
  if (!(ADDITIONAL_PATCH_CODES as readonly string[]).includes(code)) throw new Error(`Nessuna seconda versione per ${code}`);
  const seed = structuredClone(buildAdditionalCountry(code));
  const correction = code === 'SI'
    ? { key: 'si-kostanjevica-monastery', region: 'si-r3', description: 'Monastero francescano di Kostanjevica presso Nova Gorica, distinto dal monastero di Kostanjevica na Krki. Visite e accessi da verificare.', url: 'https://www.samostan-kostanjevica.si/en/about-monastery' }
    : { key: 'at-familypark-neusiedlersee', region: 'at-r8', description: 'Parco divertimenti a Sankt Margarethen nel Burgenland. Calendario, biglietti, limiti delle attrazioni e servizi da verificare.', url: 'https://www.familypark.at/en/contact/' };
  const place = seed.places.find((p) => p.key === correction.key);
  if (!place) throw new Error(`Scheda da correggere assente: ${correction.key}`);
  place.regionKey = correction.region;
  place.texts.it!.description = correction.description;
  place.sources.scheda = [...(place.sources.scheda ?? []), { label: 'Fonte ufficiale: verifica della posizione e identità della struttura', url: correction.url, checkedAt: '2026-11-19', note: 'Controllata l’attribuzione geografica; non sono confermati orari, tariffe o disponibilità.' }];
  seed.release.version = 2;
  seed.release.previousReleaseId = `${code}-1`;
  seed.release.notes += ' Corretta l’attribuzione di una scheda alla sua zona di viaggio sulla fonte ufficiale.';
  seed.correctedKeys = [correction.key];
  seed.outFile = `catalogo-${code.toLowerCase()}-v2.sql`;
  return seed;
}

export function buildAdditionalLatest(code: string) {
  return (ADDITIONAL_PATCH_CODES as readonly string[]).includes(code) ? buildAdditionalCountryV2(code) : buildAdditionalCountry(code);
}
