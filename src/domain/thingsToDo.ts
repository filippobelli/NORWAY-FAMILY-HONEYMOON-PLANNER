import { ATTRACTION_INFO, type AttractionInfo } from '../data/attractions';
import { DESTINATIONS, findDestination } from '../data/destinations';
import { airKm } from './configurator';
import { computeDayLoads } from './dayLoad';
import { newId } from './ids';
import { computeDays, type DayInfo } from './itinerary';
import type { Activity, Category, Destination, ID, Stop, Trip } from './types';

// «Cosa fare» per tappa. Concetti distinti, senza un secondo sistema di attività:
// - tappa: Stop del viaggio;
// - scheda del luogo: voce del catalogo (Destination) con, se verificata, la scheda editoriale ATTRACTION_INFO;
// - idea salvata: id della scheda in `stop.ideas`, nessun giorno, nessun cambiamento al programma;
// - attività pianificata: Activity in una giornata con `destinationId` → resta collegata alla scheda;
// - attività personale: Activity senza `destinationId`, scritta dall'utente.
// Una scheda non è mai insieme idea e attività pianificata della stessa tappa: pianificarla la toglie dalle idee,
// toglierla dal giorno la rimette tra le idee. Salvare o pianificare non vuol dire prenotare, verificare o visitare.

/** Categorie del catalogo che sono luoghi da visitare (non città, fiordi, trasporti o aeroporti). */
export const ATTRACTION_CATEGORIES: Category[] = ['musei', 'parchi', 'natura', 'fauna'];

export const ATTRACTION_CATEGORY_LABEL: Partial<Record<Category, string>> = {
  musei: 'Musei',
  parchi: 'Parchi divertimento',
  natura: 'Natura e parchi',
  fauna: 'Animali e natura',
};

/** Raggio entro cui un luogo del catalogo si propone per la tappa (in linea d'aria) */
export const NEAR_KM = 30;
/** Oltre questa distanza dal centro della tappa il luogo è indicato come «fuori città» */
export const IN_CITY_KM = 10;

export interface StopAttraction {
  d: Destination;
  /** Scheda editoriale verificata, se esiste */
  info?: AttractionInfo;
  /** Distanza in linea d'aria dal centro della tappa, non stradale */
  km: number;
  outside: boolean;
}

export function attractionsForStop(trip: Trip, stopId: ID): StopAttraction[] {
  const stop = trip.stops.find((s) => s.id === stopId);
  if (!stop) return [];
  const out: StopAttraction[] = [];
  for (const d of DESTINATIONS) {
    if (!ATTRACTION_CATEGORIES.includes(d.category) || d.id === stop.destinationId) continue;
    const info = ATTRACTION_INFO[d.id];
    const km = airKm(stop, d);
    const linked = info && stop.destinationId === info.base;
    if (!linked && km > NEAR_KM) continue;
    out.push({ d, info, km: Math.round(km * 10) / 10, outside: Boolean(info?.outside) || km > IN_CITY_KM });
  }
  // Prima le schede verificate, poi le più vicine
  return out.sort((a, b) => Number(Boolean(b.info)) - Number(Boolean(a.info)) || a.km - b.km);
}

export interface AttractionFilter {
  q?: string;
  categories?: Category[];
  indoor?: boolean;
  kids?: boolean;
  inCity?: boolean;
}

/** Ricerca su nome, nome locale, descrizione e zona; filtri combinabili. I filtri usano solo dati presenti. */
export function filterAttractions(list: StopAttraction[], f: AttractionFilter): StopAttraction[] {
  const q = f.q?.trim().toLowerCase();
  return list.filter((a) => {
    if (q && !`${a.d.name} ${a.d.localName ?? ''} ${a.d.description} ${a.info?.area ?? ''}`.toLowerCase().includes(q)) return false;
    if (f.categories?.length && !f.categories.includes(a.d.category)) return false;
    if (f.indoor && a.info?.setting !== 'al_coperto' && a.info?.setting !== 'misto') return false;
    if (f.kids && a.d.kidScore !== 3) return false;
    if (f.inCity && a.outside) return false;
    return true;
  });
}

/**
 * Giornate della tappa: quelle in cui si dorme lì. Il giorno della partenza appartiene alla tappa successiva
 * (le giornate sono legate alla notte): così una visita compare una sola volta, nella tappa giusta.
 */
export function stopDays(trip: Trip, stopId: ID, days: DayInfo[] = computeDays(trip)): DayInfo[] {
  return days.filter((d) => d.sleepStop?.id === stopId);
}

export interface PlannedVisit {
  activity: Activity;
  day: DayInfo;
}

export interface StopThings {
  days: DayInfo[];
  /** Idee della tappa non ancora pianificate */
  ideas: Destination[];
  /** Attività dal catalogo nelle giornate della tappa */
  planned: PlannedVisit[];
  /** Attività scritte dall'utente nelle giornate della tappa */
  personal: PlannedVisit[];
}

export function stopThings(trip: Trip, stopId: ID): StopThings {
  const days = stopDays(trip, stopId);
  const stop = trip.stops.find((s) => s.id === stopId);
  const planned: PlannedVisit[] = [];
  const personal: PlannedVisit[] = [];
  for (const day of days) {
    for (const a of trip.days[day.key]?.activities ?? []) (a.destinationId ? planned : personal).push({ activity: a, day });
  }
  const plannedIds = new Set(planned.map((p) => p.activity.destinationId));
  const ideas = (stop?.ideas ?? []).filter((id) => !plannedIds.has(id)).map((id) => findDestination(id)).filter((d): d is Destination => Boolean(d));
  return { days, ideas, planned, personal };
}

/** Dove è pianificata una scheda nelle giornate della tappa, se lo è. */
export function plannedOf(trip: Trip, stopId: ID, destinationId: ID): PlannedVisit | undefined {
  return stopThings(trip, stopId).planned.find((p) => p.activity.destinationId === destinationId);
}

const setStop = (trip: Trip, stopId: ID, fn: (s: Stop) => Stop): Trip => ({ ...trip, stops: trip.stops.map((s) => (s.id === stopId ? fn(s) : s)) });

/** Salva tra le idee. Non tocca giornate, date o notti; se c'è già (o è già pianificata) non cambia nulla. */
export function saveIdea(trip: Trip, stopId: ID, destinationId: ID): Trip {
  const stop = trip.stops.find((s) => s.id === stopId);
  if (!stop || !findDestination(destinationId) || stop.ideas?.includes(destinationId) || plannedOf(trip, stopId, destinationId)) return trip;
  return setStop(trip, stopId, (s) => ({ ...s, ideas: [...(s.ideas ?? []), destinationId] }));
}

export function removeIdea(trip: Trip, stopId: ID, destinationId: ID): Trip {
  const stop = trip.stops.find((s) => s.id === stopId);
  if (!stop?.ideas?.includes(destinationId)) return trip;
  return setStop(trip, stopId, (s) => ({ ...s, ideas: (s.ideas ?? []).filter((x) => x !== destinationId) }));
}

/**
 * Pianifica una scheda in una giornata della tappa. Se è già pianificata in un'altra giornata la sposta
 * (una sola visita per tappa); toglie la scheda dalle idee. La durata resta vuota: il carico usa la stima del catalogo.
 */
export function planAttraction(trip: Trip, stopId: ID, destinationId: ID, dayKey: string): Trip {
  const d = findDestination(destinationId);
  if (!d || !stopDays(trip, stopId).some((x) => x.key === dayKey)) return trip;
  const existing = plannedOf(trip, stopId, destinationId);
  if (existing?.day.key === dayKey) return trip;
  let days = { ...trip.days };
  let activity: Activity = { id: newId(), title: d.name, destinationId: d.id, costStatus: 'da_verificare' };
  if (existing) {
    // Cambia giornata: la stessa attività, con durata, costo e verifica già inseriti
    activity = existing.activity;
    const from = days[existing.day.key]!;
    days = { ...days, [existing.day.key]: { ...from, activities: from.activities.filter((a) => a.id !== activity.id) } };
  }
  const to = days[dayKey] ?? { activities: [], notes: '', planB: '' };
  days = { ...days, [dayKey]: { ...to, activities: [...to.activities, activity] } };
  return removeIdea({ ...trip, days }, stopId, destinationId);
}

/** Toglie una visita dal giorno. La scheda non si cancella: torna tra le idee della tappa. */
export function unplanActivity(trip: Trip, stopId: ID, activityId: ID): Trip {
  const hit = stopThings(trip, stopId)
    .planned.concat(stopThings(trip, stopId).personal)
    .find((p) => p.activity.id === activityId);
  if (!hit) return trip;
  const plan = trip.days[hit.day.key]!;
  const next = { ...trip, days: { ...trip.days, [hit.day.key]: { ...plan, activities: plan.activities.filter((a) => a.id !== activityId) } } };
  return hit.activity.destinationId ? saveIdea(next, stopId, hit.activity.destinationId) : next;
}

/** Attività personale: solo il testo dell'utente, nessuna scheda e nessuna fonte inventata. */
export function addPersonalActivity(trip: Trip, dayKey: string, title: string, durationMin?: number): Trip {
  const t = title.trim();
  if (!t) return trip;
  const to = trip.days[dayKey] ?? { activities: [], notes: '', planB: '' };
  const a: Activity = { id: newId(), title: t, costStatus: 'da_verificare', ...(durationMin ? { durationMin } : {}) };
  return { ...trip, days: { ...trip.days, [dayKey]: { ...to, activities: [...to.activities, a] } } };
}

/** Carico della giornata prima e dopo: serve a mostrare l'impatto prima della conferma. */
export function dayLoadChange(before: Trip, after: Trip, dayKey: string): { before?: number; after?: number; levelAfter?: string } {
  const b = computeDayLoads(before).find((l) => l.key === dayKey);
  const a = computeDayLoads(after).find((l) => l.key === dayKey);
  return { before: b ? Math.round(b.ratio * 100) : undefined, after: a ? Math.round(a.ratio * 100) : undefined, levelAfter: a?.level };
}

/** Che cosa manca nella scheda prima di pianificarla (dati da verificare o assenti). */
export function missingInfo(a: StopAttraction): string[] {
  const out: string[] = [];
  if (!a.info) out.push('scheda non ancora verificata sulle fonti ufficiali');
  if (!a.d.visitHours) out.push('durata indicativa non disponibile');
  if (a.info?.hoursPublished) out.push('orari pubblicati sul sito: da controllare per la data');
  else out.push('orari da verificare');
  out.push('prezzi non inseriti');
  if (a.info?.seasonal) out.push('apertura stagionale');
  if (a.outside) out.push('trasferimento da verificare');
  return out;
}
