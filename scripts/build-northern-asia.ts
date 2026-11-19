import { readFileSync } from 'node:fs';
import { researchedCountrySeed, type ResearchedCountry } from './build-international';

export const NORTHERN_ASIA_CODES = ['IS', 'FI', 'GB', 'IE', 'TH', 'KH', 'VN', 'IN'] as const;

/** Scozia e India Nord/Sud sono aree delle nazioni GB/IN, senza duplicare schede o inventare codici ISO. */
export function buildNorthernAsia(code: string) {
  if (!(NORTHERN_ASIA_CODES as readonly string[]).includes(code)) throw new Error(`Nazione non supportata: ${code}`);
  const data = JSON.parse(readFileSync(new URL('../src/data/catalogs/northern-asia-v1.json', import.meta.url), 'utf8')) as Record<string, ResearchedCountry>;
  const country = data[code];
  const minimum: Record<string, number> = { IS: 110, FI: 140, GB: 230, IE: 110, TH: 120, KH: 85, VN: 110, IN: 240 };
  if (!country || country.places.length < (minimum[code] ?? 100)) throw new Error(`Ricerca incompleta per ${code}`);
  return researchedCountrySeed(code, country, 1);
}
