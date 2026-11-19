import { adaptBundle, checkBundle, combineCatalogs, countryOf, type AppCatalog, type CatalogBundle, type CatalogCountry } from '../../catalog/adapter';
import type { TripCountry } from '../../domain/types';
import type { AsyncStore } from '../storage/dataStore';
import { restJson, rpc, type CloudConfig } from '../storage/supabase';

// Catalogo delle nazioni del viaggio: copia offline per versione (IndexedDB «cataloghi») e download con
// catalog_bundle quando manca. La versione è quella del viaggio; quando ne esce una più recente il viaggio ci passa da solo
// (state/catalog.tsx) e le vecchie vengono cancellate dal database.

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

/**
 * Prepara una versione PRIMA di associarla al viaggio: la prende dalla copia offline o la scarica, controlla che sia
 * completa e leggibile dall'app e solo allora la lascia sul dispositivo. Se qualcosa non va lancia un errore e il
 * viaggio resta sulla versione che aveva.
 */
export async function prepareRelease(store: AsyncStore, tx: CatalogTransport | undefined, releaseId: string): Promise<void> {
  let b = await cachedBundle(store, releaseId);
  if (!b) {
    if (!tx) throw new Error('Per scaricare il catalogo serve essere collegati al cloud.');
    b = await downloadBundle(store, tx, releaseId);
  }
  try {
    adaptBundle(b);
  } catch (e) {
    await store.del('cataloghi', releaseId).catch(() => undefined);
    throw e;
  }
}

/**
 * Versioni da tenere nella copia offline, oppure `undefined` se non è il momento di pulire: finché una nazione del
 * viaggio non ha la sua versione sul dispositivo non si cancella nulla (la precedente resta consultabile), e le
 * versioni usate in questa sessione restano per poter annullare un passaggio senza riscaricare.
 */
export function releasesToKeep(states: Record<string, CatalogLoadState>, current: TripCountry[], seen: Iterable<string>): string[] | undefined {
  if (current.length === 0 || current.some((c) => states[c.code] !== 'sul_dispositivo')) return undefined;
  return [...new Set([...current.map((c) => c.releaseId), ...seen])];
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
