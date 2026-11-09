// Indirizzi dell'app: `#/vista?param=valore`. Funzioni pure, testate: i vecchi indirizzi devono continuare a funzionare.

export const VIEWS = [
  'panoramica',
  'pianifica',
  'configuratore',
  'catalogo',
  'scenari',
  'prenotazioni',
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

/**
 * Vecchi nomi e voci di menù: «viaggio» erano le impostazioni, «costiera» le crociere; «mare» = Trasporti via mare.
 * «itinerario» era la vista «Tappe e mappa», ora unita all'area di lavoro dell'itinerario: i link salvati continuano a funzionare.
 */
export const ALIASES: Record<string, ViewId> = {
  viaggio: 'impostazioni',
  costiera: 'crociere',
  // «Trasporti via mare»: crociere e traghetti (parte=traghetti)
  mare: 'crociere',
  percorso: 'pianifica',
  trasporti: 'voli',
  itinerario: 'pianifica',
  alloggi: 'hytte',
  giorni: 'giornate',
};

/** Dove porta ogni vista, detto con le parole del menù: serve a dichiarare la destinazione di un'azione. */
export const VIEW_PLACE: Record<ViewId, string> = {
  panoramica: 'Viaggio',
  pianifica: 'Itinerario',
  configuratore: 'Itinerario › Proposta automatica',
  catalogo: 'Itinerario › Catalogo dei luoghi',
  scenari: 'Itinerario › Versioni del percorso',
  prenotazioni: 'Prenotazioni',
  voli: 'Prenotazioni › Voli',
  crociere: 'Prenotazioni › Trasporti via mare',
  hytte: 'Prenotazioni › Alloggi',
  giornate: 'Giornate',
  budget: 'Budget',
  impostazioni: 'Impostazioni',
  't/oggi': 'Modalità viaggio › Oggi',
  't/itinerario': 'Modalità viaggio › Itinerario',
  't/mappa': 'Modalità viaggio › Mappa',
  't/diario': 'Modalità viaggio › Diario',
  't/altro': 'Modalità viaggio › Altro',
};

/** Nome della destinazione di un link interno, es. `#/hytte?tappa=x` → «Prenotazioni › Alloggi». */
export const placeOf = (href: string): string => VIEW_PLACE[parseRoute(href).view];

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
