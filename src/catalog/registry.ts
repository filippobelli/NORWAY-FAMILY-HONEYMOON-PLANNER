// Catalogo attivo dell'app. Le viste e il dominio leggono da sempre le strutture di src/data/* e alcune costanti del
// configuratore: qui il loro contenuto si sostituisce sul posto con il catalogo delle nazioni del viaggio
// (scaricato con catalog_bundle e tenuto nella copia offline). Così nessuna vista cambia.
//
// All'avvio, prima che arrivi un catalogo, restano i dati dei file (riserva per sviluppo e test, D1, e base del seed):
// per la Norvegia sono gli stessi della versione NO-1, generata da quei file.

import { useSyncExternalStore } from 'react';
import { ATTRACTION_INFO } from '../data/attractions';
import { COASTAL_CATALOG } from '../data/coastalCatalog';
import { COASTAL_FACTS, COASTAL_PORTS_NORTHBOUND, COASTAL_SOURCES } from '../data/coastalPorts';
import { FILE_COUNTRY } from '../data/country';
import { DESTINATIONS } from '../data/destinations';
import { OFFICIAL_SITES } from '../data/officialSites';
import { COUNTIES, REGION_COUNTIES } from '../data/regionShapes';
import { WIKI } from '../data/wiki';
import { BASE_IDS, NOT_VISITS, RAIL } from '../domain/configurator';
import type { AppCatalog, CatalogCountry } from './adapter';

export type CatalogSource = 'file' | 'cloud';

export interface CatalogState {
  /** Da dove arriva il catalogo in uso */
  source: CatalogSource;
  countries: CatalogCountry[];
  placeCountry: Record<string, string>;
  regionCountry: Record<string, string>;
  voyageCountry: Record<string, string>;
  portCountry: Record<string, string>;
  /** Cresce a ogni sostituzione: serve a ridisegnare le viste */
  version: number;
}

function replaceArray<T>(target: T[], items: T[]): void {
  target.splice(0, target.length, ...items);
}
function replaceRecord<T>(target: Record<string, T>, items: Record<string, T>): void {
  for (const k of Object.keys(target)) delete target[k];
  Object.assign(target, items);
}

/** Copia dei dati dei file, per tornare alla riserva (test, uscita) */
const FILE_SNAPSHOT = {
  destinations: [...DESTINATIONS],
  attractions: { ...ATTRACTION_INFO },
  officialSites: { ...OFFICIAL_SITES },
  wiki: { ...WIKI },
  voyages: [...COASTAL_CATALOG],
  ports: [...COASTAL_PORTS_NORTHBOUND],
  facts: { ...COASTAL_FACTS } as Record<string, string[]>,
  sources: { ...COASTAL_SOURCES } as unknown as Record<string, unknown[]>,
  counties: [...COUNTIES],
  regionCounties: { ...REGION_COUNTIES } as Record<string, string[]>,
  baseIds: [...BASE_IDS],
  notVisits: [...NOT_VISITS],
  rail: { ...RAIL },
};

const fileState = (): CatalogState => ({
  source: 'file',
  countries: [
    {
      code: FILE_COUNTRY.code,
      name: FILE_COUNTRY.name,
      currency: FILE_COUNTRY.currency,
      timezone: FILE_COUNTRY.timezone,
      language: FILE_COUNTRY.language,
      releaseId: FILE_COUNTRY.releaseId,
      version: FILE_COUNTRY.version,
      status: 'file',
      placeCount: FILE_SNAPSHOT.destinations.length,
      roadCalibrated: true,
      roadNote: '',
    },
  ],
  placeCountry: Object.fromEntries(FILE_SNAPSHOT.destinations.map((d) => [d.id, FILE_COUNTRY.code])),
  regionCountry: Object.fromEntries(Object.keys(FILE_SNAPSHOT.regionCounties).map((r) => [r, FILE_COUNTRY.code])),
  voyageCountry: Object.fromEntries(FILE_SNAPSHOT.voyages.map((v) => [v.id, FILE_COUNTRY.code])),
  portCountry: Object.fromEntries(FILE_SNAPSHOT.ports.map((p) => [p.name, FILE_COUNTRY.code])),
  version: 0,
});

let state: CatalogState = fileState();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Mette in uso un catalogo (una o più nazioni sommate) */
export function installCatalog(c: AppCatalog): void {
  replaceArray(DESTINATIONS, c.destinations);
  replaceRecord(ATTRACTION_INFO, c.attractions);
  replaceRecord(OFFICIAL_SITES, c.officialSites);
  replaceRecord(WIKI, c.wiki);
  replaceArray(COASTAL_CATALOG, c.voyages);
  replaceArray(COASTAL_PORTS_NORTHBOUND, c.ports);
  replaceRecord(COASTAL_FACTS as Record<string, string[]>, c.operatorFacts);
  replaceRecord(COASTAL_SOURCES as unknown as Record<string, unknown>, c.operatorSources);
  replaceArray(COUNTIES, c.counties);
  replaceRecord(REGION_COUNTIES as Record<string, string[]>, c.regionCounties);
  replaceArray(BASE_IDS, c.baseIds);
  NOT_VISITS.clear();
  for (const id of c.notVisits) NOT_VISITS.add(id);
  replaceRecord(RAIL, c.rail);
  state = { source: 'cloud', countries: c.countries, placeCountry: c.placeCountry, regionCountry: c.regionCountry, voyageCountry: c.voyageCountry, portCountry: c.portCountry, version: state.version + 1 };
  emit();
}

/** Torna ai dati dei file (modalità senza cloud, D1) */
export function installFileCatalog(): void {
  const s = FILE_SNAPSHOT;
  replaceArray(DESTINATIONS, s.destinations);
  replaceRecord(ATTRACTION_INFO, s.attractions);
  replaceRecord(OFFICIAL_SITES, s.officialSites);
  replaceRecord(WIKI, s.wiki);
  replaceArray(COASTAL_CATALOG, s.voyages);
  replaceArray(COASTAL_PORTS_NORTHBOUND, s.ports);
  replaceRecord(COASTAL_FACTS as Record<string, string[]>, s.facts);
  replaceRecord(COASTAL_SOURCES as unknown as Record<string, unknown>, s.sources);
  replaceArray(COUNTIES, s.counties);
  replaceRecord(REGION_COUNTIES as Record<string, string[]>, s.regionCounties);
  replaceArray(BASE_IDS, s.baseIds);
  NOT_VISITS.clear();
  for (const id of s.notVisits) NOT_VISITS.add(id);
  replaceRecord(RAIL, s.rail);
  state = { ...fileState(), version: state.version + 1 };
  emit();
}

export const catalogState = (): CatalogState => state;

/** Dati di una nazione del catalogo in uso (valuta, fuso, versione) */
export const countryInfo = (code: string | undefined): CatalogCountry | undefined => state.countries.find((c) => c.code === code);

/** Nazione di un luogo del catalogo in uso */
export const placeCountry = (placeKey: string | undefined): string | undefined => (placeKey ? state.placeCountry[placeKey] : undefined);

export function subscribeCatalog(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useCatalog(): CatalogState {
  return useSyncExternalStore(subscribeCatalog, catalogState, catalogState);
}
