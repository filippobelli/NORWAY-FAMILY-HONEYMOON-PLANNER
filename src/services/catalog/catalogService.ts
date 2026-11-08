import { adaptBundle, checkBundle, combineCatalogs, countryOf, type AppCatalog, type CatalogBundle, type CatalogCountry } from '../../catalog/adapter';
import type { TripCountry } from '../../domain/types';
import type { AsyncStore } from '../storage/dataStore';
import { restJson, rpc, type CloudConfig } from '../storage/supabase';

// Catalogo delle nazioni del viaggio: copia offline per versione (IndexedDB «cataloghi») e download con
// catalog_bundle quando manca. La versione è quella fissata nel viaggio: una versione più recente nel database
// non cambia nulla (UC4), si segnala soltanto.

export type CatalogLoadState = 'sul_dispositivo' | 'in_download' | 'da_scaricare' | 'errore';

export interface AvailableCountry {
  code: string;
  name: string;
  currency: string;
  timezone: string;
  releaseId: string;
  version: number;
  publishedAt?: string;
  /** Luoghi della versione, se il server li conta */
  placeCount?: number;
}

export interface CatalogTransport {
  bundle(releaseId: string): Promise<unknown>;
  /** Ultima versione pubblicata di ogni nazione */
  available(): Promise<AvailableCountry[]>;
}

export function cloudCatalogTransport(cfg: CloudConfig): CatalogTransport {
  return {
    bundle: (releaseId) => rpc<unknown>(cfg, 'catalog_bundle', { p_release_id: releaseId }),
    available: async () => {
      const rows = await restJson<{ release_id: string; country_code: string; version: number; published_at?: string; countries?: { name: string; currency: string; timezone: string } }[]>(
        cfg,
        'catalog_releases?select=release_id,country_code,version,published_at,countries(name,currency,timezone)&status=eq.pubblicata&order=country_code.asc,version.desc',
      );
      const latest = new Map<string, AvailableCountry>();
      for (const r of rows ?? []) {
        if (latest.has(r.country_code)) continue;
        latest.set(r.country_code, {
          code: r.country_code,
          name: r.countries?.name ?? r.country_code,
          currency: r.countries?.currency ?? '',
          timezone: r.countries?.timezone ?? '',
          releaseId: r.release_id,
          version: r.version,
          publishedAt: r.published_at ?? undefined,
        });
      }
      return [...latest.values()];
    },
  };
}

export interface LoadResult {
  /** Catalogo delle nazioni presenti sul dispositivo (undefined se nessuna) */
  catalog?: AppCatalog;
  states: Record<string, CatalogLoadState>;
  errors: Record<string, string>;
}

/** Bundle della copia offline, se valido */
export async function cachedBundle(store: AsyncStore, releaseId: string): Promise<CatalogBundle | undefined> {
  try {
    const b = await store.get<unknown>('cataloghi', releaseId);
    return b ? checkBundle(b) : undefined;
  } catch {
    return undefined;
  }
}

/** Scarica una versione e la mette nella copia offline (solo se completa e della versione chiesta) */
export async function downloadBundle(store: AsyncStore, tx: CatalogTransport, releaseId: string): Promise<CatalogBundle> {
  const b = checkBundle(await tx.bundle(releaseId));
  if (b.release?.release_id !== releaseId) throw new Error(`Il server ha restituito un'altra versione (${String(b.release?.release_id)})`);
  await store.put('cataloghi', releaseId, b);
  return b;
}

/**
 * Carica i cataloghi delle nazioni del viaggio: prima la copia offline, poi (se c'è il trasporto) il download
 * di quelli mancanti. Restituisce lo stato per nazione; le nazioni non disponibili restano «da scaricare».
 */
export async function loadTripCatalogs(countries: TripCountry[], store: AsyncStore, tx?: CatalogTransport, onState?: (code: string, s: CatalogLoadState) => void): Promise<LoadResult> {
  const states: Record<string, CatalogLoadState> = {};
  const errors: Record<string, string> = {};
  const parts: AppCatalog[] = [];
  for (const c of countries) {
    let b = await cachedBundle(store, c.releaseId);
    if (!b && tx) {
      states[c.code] = 'in_download';
      onState?.(c.code, 'in_download');
      try {
        b = await downloadBundle(store, tx, c.releaseId);
      } catch (e) {
        errors[c.code] = e instanceof Error ? e.message : String(e);
      }
    }
    if (b) {
      try {
        parts.push(adaptBundle(b));
        states[c.code] = 'sul_dispositivo';
      } catch (e) {
        states[c.code] = 'errore';
        errors[c.code] = e instanceof Error ? e.message : String(e);
      }
    } else states[c.code] = errors[c.code] ? 'errore' : 'da_scaricare';
    onState?.(c.code, states[c.code]!);
  }
  return { catalog: parts.length ? combineCatalogs(parts) : undefined, states, errors };
}

/** Toglie dalla copia offline i cataloghi che nessun viaggio sul dispositivo usa più */
export async function pruneCatalogs(store: AsyncStore, keep: string[]): Promise<void> {
  for (const k of await store.keys('cataloghi')) if (!keep.includes(k)) await store.del('cataloghi', k);
}

/** Informazioni della nazione dalla copia offline (per le schermate «Nazioni»), senza adattare tutto il catalogo */
export async function cachedCountryInfo(store: AsyncStore, releaseId: string): Promise<CatalogCountry | undefined> {
  const b = await cachedBundle(store, releaseId);
  return b ? countryOf(b) : undefined;
}
