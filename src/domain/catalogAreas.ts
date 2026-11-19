import type { Destination } from './types';
import type { ConfiguratorInput } from './configurator';

/** Aree editoriali del catalogo: non sono nazioni, valute o archivi di viaggio separati. */
export interface CatalogArea {
  id: string;
  countryCode: string;
  label: string;
  regionPrefix: string;
  invert?: boolean;
}

export const CATALOG_AREAS: readonly CatalogArea[] = [
  { id: 'gb-scotland', countryCode: 'GB', label: 'Scozia', regionPrefix: 'Scozia —' },
  { id: 'gb-other', countryCode: 'GB', label: 'Regno Unito · Inghilterra, Galles e Irlanda del Nord', regionPrefix: 'Scozia —', invert: true },
  { id: 'in-north', countryCode: 'IN', label: 'India del Nord', regionPrefix: 'India del Nord —' },
  { id: 'in-south', countryCode: 'IN', label: 'India del Sud', regionPrefix: 'India del Sud —' },
];

export function areaContains(area: CatalogArea, region: string, countryCode?: string): boolean {
  if (countryCode !== area.countryCode) return false;
  const matches = region.startsWith(area.regionPrefix);
  return area.invert ? !matches : matches;
}

export function destinationInArea(d: Destination, countryCode: string | undefined, areaId: string): boolean {
  const area = CATALOG_AREAS.find((a) => a.id === areaId);
  return Boolean(area && areaContains(area, d.region, countryCode));
}

/** Cambia solo le impostazioni della proposta, mai il viaggio o i suoi preferiti. */
export function configureArea(input: ConfiguratorInput, areaId: string, destinations: readonly Destination[], countryOf: (id: string) => string | undefined): ConfiguratorInput {
  const within = destinations.filter((d) => destinationInArea(d, countryOf(d.id), areaId));
  const airports = within.filter((d) => d.category === 'aeroporti');
  if (!airports.length) throw new Error('Nessun aeroporto verificabile disponibile in questa area. Scegli le tappe manualmente.');
  const arrival = airports.find((d) => d.id === input.arrivalAirportId) ?? airports[0]!;
  const departure = airports.find((d) => d.id === input.departureAirportId) ?? arrival;
  const keys = new Set(within.map((d) => d.id));
  return { ...input, scopePlaceIds: [...keys], arrivalAirportId: arrival.id, departureAirportId: departure.id, regions: [...new Set(within.map((d) => d.region))], excludedAirportRegions: [], mustSee: input.mustSee.filter((id) => keys.has(id)) };
}
