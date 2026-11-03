import { newId } from './ids';
import type { ActivityDoneState, Actuals, DiaryEntry, ID, StopVisitState, Trip } from './types';

// Stato effettivo del viaggio e diario: stanno fuori dal piano. Segnare una tappa come visitata non cambia
// date, ordine, pernottamenti o budget. «Prenotato» e «Pagato» restano stati commerciali, non stati di visita.

const EMPTY: Actuals = { stops: {}, activities: {} };
export const actualsOf = (t: Trip): Actuals => t.actuals ?? EMPTY;

export const STOP_STATE_LABEL: Record<StopVisitState | 'pianificata', string> = { pianificata: 'Pianificata', in_corso: 'In corso', visitata: 'Visitata', saltata: 'Saltata' };
export const ACTIVITY_STATE_LABEL: Record<ActivityDoneState | 'da_fare', string> = { da_fare: 'Da fare', fatta: 'Fatta', saltata: 'Saltata' };

export const stopState = (t: Trip, id: ID): StopVisitState | 'pianificata' => actualsOf(t).stops[id]?.state ?? 'pianificata';
export const activityState = (t: Trip, id: ID): ActivityDoneState | 'da_fare' => actualsOf(t).activities[id]?.state ?? 'da_fare';

function withMark<S>(map: Record<ID, { state: S; at: string }>, id: ID, state: S | undefined, at: string) {
  const next = { ...map };
  if (state === undefined) delete next[id];
  else next[id] = { state, at };
  return next;
}

/** `undefined` riporta a Pianificata. Tocca solo `actuals`. */
export function setStopState(t: Trip, id: ID, state: StopVisitState | undefined, at = new Date().toISOString()): Trip {
  const a = actualsOf(t);
  return { ...t, actuals: { ...a, stops: withMark(a.stops, id, state, at) } };
}

/** `undefined` riporta a Da fare. Tocca solo `actuals`. */
export function setActivityState(t: Trip, id: ID, state: ActivityDoneState | undefined, at = new Date().toISOString()): Trip {
  const a = actualsOf(t);
  return { ...t, actuals: { ...a, activities: withMark(a.activities, id, state, at) } };
}

/** Annulla tornando a una copia precedente, senza toccare stato effettivo, diario e registro attuali. */
export function restorePlanOnly(current: Trip, previous: Trip): Trip {
  return { ...previous, actuals: current.actuals, diary: current.diary, planLog: current.planLog };
}

// ---------- Diario ----------

const pad = (n: number) => String(n).padStart(2, '0');

export function newDiaryEntry(p: { text: string; dayDate?: string; stop?: { id: ID; name: string }; now?: Date }): DiaryEntry {
  const now = p.now ?? new Date();
  const iso = now.toISOString();
  return {
    id: newId(),
    createdAt: iso,
    updatedAt: iso,
    // Data e ora locali del dispositivo, come le ha viste chi scrive
    localDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    localTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    tzOffsetMin: now.getTimezoneOffset(),
    text: p.text,
    dayDate: p.dayDate,
    stopId: p.stop?.id,
    // Il nome resta anche se la tappa viene tolta dal percorso
    stopName: p.stop?.name,
  };
}

const diaryOf = (t: Trip) => t.diary ?? [];

export const addDiaryEntry = (t: Trip, e: DiaryEntry): Trip => ({ ...t, diary: [...diaryOf(t), e] });

export function editDiaryEntry(t: Trip, id: ID, patch: Partial<Pick<DiaryEntry, 'text' | 'dayDate' | 'stopId' | 'stopName' | 'attachments'>>, at = new Date().toISOString()): Trip {
  return { ...t, diary: diaryOf(t).map((e) => (e.id === id ? { ...e, ...patch, updatedAt: at } : e)) };
}

/** Eliminazione scelta dall'utente: la voce resta come traccia, così la sincronizzazione non la fa ricomparire. */
export function removeDiaryEntry(t: Trip, id: ID, at = new Date().toISOString()): Trip {
  return { ...t, diary: diaryOf(t).map((e) => (e.id === id ? { ...e, deletedAt: at, updatedAt: at } : e)) };
}

/** Voci visibili, dalla più recente. */
export function visibleDiary(t: Trip, filter: { dayDate?: string; stopId?: ID } = {}): DiaryEntry[] {
  return diaryOf(t)
    .filter((e) => !e.deletedAt && (!filter.dayDate || e.dayDate === filter.dayDate) && (!filter.stopId || e.stopId === filter.stopId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
