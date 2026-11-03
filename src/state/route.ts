// Indirizzi dell'app: `#/vista?param=valore`. Funzioni pure, testate: i vecchi indirizzi devono continuare a funzionare.

export const VIEWS = [
  'panoramica',
  'pianifica',
  'itinerario',
  'configuratore',
  'catalogo',
  'scenari',
  'voli',
  'crociere',
  'hytte',
  'giornate',
  'budget',
  'impostazioni',
  // Travel Mode
  't/oggi',
  't/itinerario',
  't/mappa',
  't/diario',
  't/altro',
] as const;
export type ViewId = (typeof VIEWS)[number];

/** Vecchi nomi e voci di menù: «viaggio» erano le impostazioni, «costiera» le crociere. */
export const ALIASES: Record<string, ViewId> = {
  viaggio: 'impostazioni',
  costiera: 'crociere',
  percorso: 'pianifica',
  trasporti: 'voli',
};

export interface Route {
  view: ViewId;
  params: Record<string, string>;
}

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');
  const q = raw.indexOf('?');
  const path = (q < 0 ? raw : raw.slice(0, q)).replace(/\/$/, '');
  const params: Record<string, string> = {};
  if (q >= 0) new URLSearchParams(raw.slice(q + 1)).forEach((v, k) => (params[k] = v));
  const view = ALIASES[path] ?? (VIEWS as readonly string[]).find((v) => v === path);
  return { view: (view as ViewId | undefined) ?? 'panoramica', params };
}

export function buildHash(view: ViewId, params: Record<string, string | undefined> = {}): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return `#/${view}${s ? `?${s}` : ''}`;
}

export const isTravelView = (v: ViewId) => v.startsWith('t/');

/** Dove aprire l'app senza un indirizzo. Un link esplicito resta dov'è: qui si decide solo il primo ingresso. */
export function startView(hash: string, mode: 'planning' | 'travel', hasStops: boolean): ViewId | undefined {
  if (hash.replace(/^#\/?/, '')) return undefined;
  if (mode === 'travel') return 't/oggi';
  return hasStops ? 'pianifica' : undefined;
}
