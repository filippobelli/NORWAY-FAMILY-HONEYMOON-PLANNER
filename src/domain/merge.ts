import type { DiaryEntry, Trip } from './types';

// Unione a tre vie tra l'ultima copia sincronizzata, questo dispositivo e il cloud.
// Ciò che è indipendente si unisce; ciò che è cambiato in modo diverso su entrambi resta una scelta dell'utente.

export type Side = 'qui' | 'cloud';

export interface MergeConflict {
  /** Gruppo di dati da scegliere */
  id: string;
  label: string;
  qui: string;
  cloud: string;
}

export interface MergeResult {
  /** Unione provvisoria: nei conflitti aperti contiene la versione di questo dispositivo */
  trip: Trip;
  conflicts: MergeConflict[];
  /** Cosa è stato unito in automatico */
  merged: string[];
  remote: Trip;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const pick = <K extends keyof Trip>(t: Trip, keys: readonly K[]) => Object.fromEntries(keys.map((k) => [k, t[k]])) as Pick<Trip, K>;

function summarizePlan(t: Trip): string {
  const nights = t.stops.reduce((a, s) => a + Math.max(0, s.nights), 0);
  return `${t.stops.length} tappe, ${nights} notti, partenza ${t.startDate}: ${t.stops.map((s) => s.name).join(' → ') || 'percorso vuoto'}. Voli: ${t.flights?.length ?? 0}. Voci di budget: ${t.budgetItems.length}.`;
}

// L'ordine delle tappe e le sostituzioni si scelgono sempre: il piano è un gruppo unico, comprese le versioni salvate
const PLAN_KEYS = ['startDate', 'dateTentative', 'stops', 'legs', 'days', 'budgetItems', 'flights', 'scenarios', 'activeScenarioId', 'planLog'] as const;
const GROUPS: { id: string; label: string; keys: readonly (keyof Trip)[]; summary: (t: Trip) => string }[] = [
  { id: 'piano', label: 'Percorso, date e versioni', keys: PLAN_KEYS, summary: summarizePlan },
  { id: 'alloggi', label: 'Alloggi', keys: ['accommodations'], summary: (t) => `${t.accommodations.length} sistemazioni: ${t.accommodations.map((a) => `${a.name} (${a.status})`).join(', ') || 'nessuna'}.` },
  { id: 'crociere', label: 'Opzioni di crociera', keys: ['coastalOptions'], summary: (t) => `${t.coastalOptions.length} opzioni: ${t.coastalOptions.map((o) => `${o.operator} ${o.fromPort} → ${o.toPort}`).join(', ') || 'nessuna'}.` },
  { id: 'titolo', label: 'Titolo e partecipanti', keys: ['title', 'participants'], summary: (t) => `${t.title} · ${t.participants.adults} adulti, ${t.participants.childrenAges.length} bambini.` },
];

// Dati aggiornati in automatico da ogni dispositivo: non sono una scelta dell'utente
const AUTO_SETTINGS = new Set(['nokPerEur', 'nokRateNote', 'nokRateDate', 'car']);

function mergeDiary(base: DiaryEntry[], local: DiaryEntry[], remote: DiaryEntry[]): { diary: DiaryEntry[]; added: number } {
  const baseById = new Map(base.map((e) => [e.id, e]));
  const remoteById = new Map(remote.map((e) => [e.id, e]));
  const out: DiaryEntry[] = [];
  let added = 0;
  for (const l of local) {
    const r = remoteById.get(l.id);
    remoteById.delete(l.id);
    if (!r || same(l, r)) {
      out.push(l);
      continue;
    }
    const b = baseById.get(l.id);
    const deletedAt = l.deletedAt ?? r.deletedAt;
    if (deletedAt) out.push({ ...l, deletedAt });
    else if (b && same(b, l)) out.push(r);
    else if (b && same(b, r)) out.push(l);
    else {
      // Stessa voce modificata in due modi: si tengono entrambe, nessun testo va perso
      out.push(l, { ...r, id: `${r.id}-cloud`, text: `${r.text}\n(versione dell'altro dispositivo)` });
      added++;
    }
  }
  for (const r of remoteById.values()) {
    out.push(r);
    added++;
  }
  return { diary: out.sort((a, b) => a.createdAt.localeCompare(b.createdAt)), added };
}

export function mergeTrips(base: Trip | undefined, local: Trip, remote: Trip): MergeResult {
  let trip: Trip = { ...local };
  const conflicts: MergeConflict[] = [];
  const merged: string[] = [];

  for (const g of GROUPS) {
    const l = pick(local, g.keys);
    const r = pick(remote, g.keys);
    if (same(l, r)) continue;
    if (base && same(pick(base, g.keys), l)) {
      trip = { ...trip, ...r };
      merged.push(g.label);
    } else if (!(base && same(pick(base, g.keys), r))) {
      conflicts.push({ id: g.id, label: g.label, qui: g.summary(local), cloud: g.summary(remote) });
    }
  }

  // Impostazioni, una per una
  const settings: Record<string, unknown> = { ...local.settings };
  const lS = local.settings as unknown as Record<string, unknown>;
  const rS = remote.settings as unknown as Record<string, unknown>;
  const bS = base?.settings as unknown as Record<string, unknown> | undefined;
  for (const k of new Set([...Object.keys(lS), ...Object.keys(rS)])) {
    if (same(lS[k], rS[k])) continue;
    if (AUTO_SETTINGS.has(k) || (bS && same(bS[k], lS[k]))) settings[k] = rS[k];
    else if (!(bS && same(bS[k], rS[k]))) conflicts.push({ id: `impostazione:${k}`, label: `Impostazione «${k}»`, qui: JSON.stringify(lS[k]) ?? '—', cloud: JSON.stringify(rS[k]) ?? '—' });
  }
  trip = { ...trip, settings: settings as unknown as Trip['settings'] };

  // Preferiti: si uniscono
  trip = { ...trip, favorites: [...new Set([...local.favorites, ...remote.favorites])] };

  // Diario: voci indipendenti si uniscono sempre
  const d = mergeDiary(base?.diary ?? [], local.diary ?? [], remote.diary ?? []);
  trip = { ...trip, diary: d.diary };
  if (d.added > 0) merged.push(`${d.added} ${d.added === 1 ? 'voce' : 'voci'} del diario`);

  // Stati di visita, uno per uno
  const stops = { ...(local.actuals?.stops ?? {}) };
  const activities = { ...(local.actuals?.activities ?? {}) };
  const mergeMarks = <S,>(l: Record<string, S>, r: Record<string, S>, b: Record<string, S>, out: Record<string, S>, kind: string, label: (id: string) => string) => {
    for (const id of new Set([...Object.keys(l), ...Object.keys(r)])) {
      const ls = (l[id] as { state?: string } | undefined)?.state;
      const rs = (r[id] as { state?: string } | undefined)?.state;
      if (ls === rs) continue;
      const bs = (b[id] as { state?: string } | undefined)?.state;
      if (bs === ls) {
        if (r[id] === undefined) delete out[id];
        else out[id] = r[id]!;
      } else if (bs !== rs) {
        conflicts.push({ id: `${kind}:${id}`, label: label(id), qui: ls ?? 'non segnato', cloud: rs ?? 'non segnato' });
      }
    }
  };
  const stopName = (id: string) => local.stops.find((s) => s.id === id)?.name ?? remote.stops.find((s) => s.id === id)?.name ?? id;
  mergeMarks(local.actuals?.stops ?? {}, remote.actuals?.stops ?? {}, base?.actuals?.stops ?? {}, stops, 'tappa', (id) => `Stato della tappa ${stopName(id)}`);
  mergeMarks(local.actuals?.activities ?? {}, remote.actuals?.activities ?? {}, base?.actuals?.activities ?? {}, activities, 'attivita', (id) => `Stato dell'attività ${id}`);
  trip = { ...trip, actuals: { stops, activities } };

  return { trip, conflicts, merged, remote };
}

/** Applica le scelte: ciò che non è indicato resta la versione di questo dispositivo. */
export function resolveConflicts(m: MergeResult, choices: Record<string, Side>): Trip {
  let trip = m.trip;
  for (const c of m.conflicts) {
    if (choices[c.id] !== 'cloud') continue;
    const group = GROUPS.find((g) => g.id === c.id);
    if (group) trip = { ...trip, ...pick(m.remote, group.keys) };
    else if (c.id.startsWith('impostazione:')) {
      const k = c.id.slice('impostazione:'.length);
      trip = { ...trip, settings: { ...trip.settings, [k]: (m.remote.settings as unknown as Record<string, unknown>)[k] } as Trip['settings'] };
    } else if (c.id.startsWith('tappa:') || c.id.startsWith('attivita:')) {
      const [kind, id] = c.id.split(':') as [string, string];
      const field = kind === 'tappa' ? 'stops' : 'activities';
      const map = { ...(trip.actuals?.[field] ?? {}) } as Record<string, unknown>;
      const value = (m.remote.actuals?.[field] as Record<string, unknown> | undefined)?.[id];
      if (value === undefined) delete map[id];
      else map[id] = value;
      trip = { ...trip, actuals: { stops: trip.actuals?.stops ?? {}, activities: trip.actuals?.activities ?? {}, [field]: map } };
    }
  }
  return trip;
}
