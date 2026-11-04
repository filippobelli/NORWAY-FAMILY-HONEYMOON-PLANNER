import { BUDGET_CATEGORIES, computeBudget } from './budget';
import { addDays, computeDays, formatDateIt, isRoutableLeg, legTotals, orphanDayKeys, syncLegs, totalNights } from './itinerary';
import { routeDiff, type RouteDiff } from './placement';
import { ensureScenarios, snapshotPlan, switchScenario, tripForScenario } from './scenarios';
import { scenarioMetrics } from './scenarios';
import { newId } from './ids';
import type { DataStatus, ID, Trip } from './types';

// Piano B: una variante resta una proposta finché non viene applicata. L'impatto si calcola solo con le funzioni
// di dominio esistenti. L'applicazione cambia il piano, mai il diario né gli stati di visita, e si può annullare.

const COMMERCIAL: DataStatus[] = ['prenotato', 'pagato'];
const isCommercial = (s: DataStatus) => COMMERCIAL.includes(s);

export interface BookedItem {
  kind: 'alloggio' | 'volo' | 'crociera' | 'trasporto' | 'attività' | 'costo';
  label: string;
  status: string;
  effect: string;
}

export interface BudgetDelta {
  category: string;
  before: number;
  after: number;
}

export interface PlanImpact {
  route: RouteDiff;
  orderChanged: boolean;
  end: { before?: string; after?: string };
  nights: { before: number; after: number };
  /** Attività che restano senza giornata: non si cancellano */
  unassigned: string[];
  transport: { added: string[]; removed: string[]; toCalculate: number };
  lodging: string[];
  booked: BookedItem[];
  times: { theoreticalBefore: number; theoreticalAfter: number; realisticBefore: number; realisticAfter: number; complete: boolean };
  budget: { before: number; after: number; rows: BudgetDelta[]; missingBefore: number; missingAfter: number };
  /** Dati che servono per giudicare e non sono disponibili */
  missing: string[];
  /** Serve la conferma aggiuntiva: l'app non annulla prenotazioni */
  needsBookingConfirm: boolean;
}

const lastDay = (t: Trip) => (t.stops.length ? addDays(t.startDate, totalNights(t.stops)) : undefined);

function checkIns(t: Trip): Map<ID, string> {
  const map = new Map<ID, string>();
  for (const d of computeDays(t)) if (d.sleepStop && d.nightIndex === 0) map.set(d.sleepStop.id, d.date);
  return map;
}

function segmentKeys(t: Trip): Map<string, string> {
  const name = (id: ID) => t.stops.find((s) => s.id === id)?.name ?? '';
  const out = new Map<string, string>();
  for (const l of t.legs) {
    for (const s of l.segments) {
      if (s.mode !== 'non_calcolato' && s.mode !== 'strada') out.set(s.id, `${s.label} (${name(l.fromStopId)} → ${name(l.toStopId)})`);
    }
  }
  return out;
}

export function planImpact(before: Trip, after: Trip): PlanImpact {
  const route = routeDiff(before, after);
  const beforeIds = before.stops.map((s) => s.id);
  const stillThere = new Set(after.stops.map((s) => s.id));
  const keptOrder = after.stops.map((s) => s.id).filter((id) => beforeIds.includes(id));
  const orderChanged = keptOrder.join() !== beforeIds.filter((id) => stillThere.has(id)).join();

  const known = new Set(orphanDayKeys(before));
  const unassigned = orphanDayKeys(after)
    .filter((k) => !known.has(k))
    .flatMap((k) => after.days[k]?.activities.map((a) => a.title || 'Attività') ?? []);

  const segsBefore = segmentKeys(before);
  const segsAfter = segmentKeys(after);
  const added = [...segsAfter].filter(([k]) => !segsBefore.has(k)).map(([, v]) => v);
  const removed = [...segsBefore].filter(([k]) => !segsAfter.has(k)).map(([, v]) => v);
  const toCalculate = after.legs.filter((l) => isRoutableLeg(l, after.stops) && legTotals(l, after.settings).hasUncalculated).length;

  // Alloggi scelti e cosa succede loro
  const checkBefore = checkIns(before);
  const checkAfter = checkIns(after);
  const lodging: string[] = [];
  const booked: BookedItem[] = [];
  for (const s of before.stops) {
    if (!s.accommodationId) continue;
    const acc = before.accommodations.find((a) => a.id === s.accommodationId);
    if (!acc) continue;
    const now = after.stops.find((x) => x.id === s.id);
    const changed = !now ? 'tappa tolta dal percorso' : now.accommodationId !== s.accommodationId ? 'alloggio non più scelto' : now.nights !== s.nights ? `notti da ${s.nights} a ${now.nights}` : checkBefore.get(s.id) !== checkAfter.get(s.id) ? `arrivo dal ${formatDateIt(checkBefore.get(s.id) ?? after.startDate)} al ${checkAfter.get(s.id) ? formatDateIt(checkAfter.get(s.id)!) : 'non previsto'}` : undefined;
    if (!changed) continue;
    lodging.push(`${acc.name} (${s.name}): ${changed}`);
    if (acc.status === 'prenotata' || isCommercial(acc.priceStatus)) booked.push({ kind: 'alloggio', label: `${acc.name} (${s.name})`, status: acc.status === 'prenotata' ? 'Prenotata' : acc.priceStatus, effect: changed });
  }

  // Voli prenotati o pagati che spariscono o non coincidono più
  for (const f of before.flights ?? []) {
    if (!isCommercial(f.priceStatus)) continue;
    const label = `Volo ${f.fromAirport} → ${f.toAirport}${f.date ? ` del ${formatDateIt(f.date)}` : ''}`;
    if (!(after.flights ?? []).some((x) => x.id === f.id)) booked.push({ kind: 'volo', label, status: f.priceStatus, effect: 'non è in questo scenario' });
    else if (f.direction === 'andata' && f.date && f.date !== after.startDate) booked.push({ kind: 'volo', label, status: f.priceStatus, effect: `il viaggio partirebbe il ${formatDateIt(after.startDate)}` });
    else if (f.direction === 'ritorno' && f.date && f.date !== lastDay(after)) booked.push({ kind: 'volo', label, status: f.priceStatus, effect: lastDay(after) ? `il percorso finirebbe il ${formatDateIt(lastDay(after)!)}` : 'percorso vuoto' });
  }
  for (const o of before.coastalOptions) {
    if (!isCommercial(o.priceStatus)) continue;
    const wasIn = before.legs.some((l) => l.segments.some((s) => s.coastalOptionId === o.id));
    const nowIn = after.legs.some((l) => l.segments.some((s) => s.coastalOptionId === o.id));
    if (wasIn && !nowIn) booked.push({ kind: 'crociera', label: `${o.operator} ${o.fromPort} → ${o.toPort}`, status: o.priceStatus, effect: 'esce dal percorso' });
  }
  for (const l of before.legs) {
    for (const s of l.segments) {
      if (isCommercial(s.costStatus) && !s.coastalOptionId && !s.flightId && !segsAfter.has(s.id)) booked.push({ kind: 'trasporto', label: s.label, status: s.costStatus, effect: 'esce dal percorso' });
    }
  }
  for (const k of orphanDayKeys(after)) {
    if (known.has(k)) continue;
    for (const a of after.days[k]?.activities ?? []) if (isCommercial(a.costStatus)) booked.push({ kind: 'attività', label: a.title || 'Attività', status: a.costStatus, effect: 'resta senza giornata' });
  }
  for (const b of before.budgetItems) {
    if (isCommercial(b.status) && !after.budgetItems.some((x) => x.id === b.id)) booked.push({ kind: 'costo', label: b.label, status: b.status, effect: 'non è in questo scenario' });
  }

  const mB = scenarioMetrics(before);
  const mA = scenarioMetrics(after);
  const bB = computeBudget(before);
  const bA = computeBudget(after);
  const rows = BUDGET_CATEGORIES.map((c) => ({ category: c.label, before: bB.byCategory[c.id], after: bA.byCategory[c.id] })).filter((r) => Math.abs(r.before - r.after) >= 0.5);

  const missing: string[] = [];
  if (toCalculate > 0) missing.push(`${toCalculate} ${toCalculate === 1 ? 'tratto non è calcolato' : 'tratti non sono calcolati'}: tempi e carburante sono incompleti.`);
  if (bA.missing.length > bB.missing.length) missing.push(`${bA.missing.length - bB.missing.length} dati di costo in più da completare: il budget dopo la modifica è parziale.`);

  return {
    route,
    orderChanged,
    end: { before: lastDay(before), after: lastDay(after) },
    nights: { before: totalNights(before.stops), after: totalNights(after.stops) },
    unassigned,
    transport: { added, removed, toCalculate },
    lodging,
    booked,
    times: { theoreticalBefore: mB.transferTheoreticalMin, theoreticalAfter: mA.transferTheoreticalMin, realisticBefore: mB.transferRealisticMin, realisticAfter: mA.transferRealisticMin, complete: toCalculate === 0 },
    budget: { before: bB.total, after: bA.total, rows, missingBefore: bB.missing.length, missingAfter: bA.missing.length },
    missing,
    needsBookingConfirm: booked.length > 0,
  };
}

// ---------- Modifiche alla bozza ----------

/** Toglie una tappa dalla bozza. Le sue notti si perdono o passano alla tappa precedente con notti. */
export function draftRemoveStop(t: Trip, stopId: ID, nights: 'togli' | 'alla_precedente'): Trip {
  const i = t.stops.findIndex((s) => s.id === stopId);
  const gone = t.stops[i];
  if (!gone) return t;
  const stops = t.stops.filter((s) => s.id !== stopId);
  if (nights === 'alla_precedente' && gone.nights > 0) {
    const prev = [...stops.slice(0, i)].reverse().find((s) => s.kind === 'luogo') ?? stops.find((s) => s.kind === 'luogo');
    if (prev) stops[stops.indexOf(prev)] = { ...prev, nights: prev.nights + gone.nights };
  }
  return { ...t, stops, legs: syncLegs(stops, t.legs) };
}

export function draftMoveStop(t: Trip, stopId: ID, delta: -1 | 1): Trip {
  const i = t.stops.findIndex((s) => s.id === stopId);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= t.stops.length) return t;
  const stops = [...t.stops];
  [stops[i], stops[j]] = [stops[j]!, stops[i]!];
  return { ...t, stops, legs: syncLegs(stops, t.legs) };
}

export function draftSetNights(t: Trip, stopId: ID, nights: number): Trip {
  return { ...t, stops: t.stops.map((s) => (s.id === stopId ? { ...s, nights: Math.max(0, Math.min(60, Math.round(nights))) } : s)) };
}

// ---------- Salvataggio, applicazione, annullamento ----------

/** Salva la bozza come alternativa, senza applicarla. */
export function saveAlternative(trip: Trip, name: string, draft: Trip, notes = ''): { trip: Trip; id: ID } {
  const t = ensureScenarios(trip);
  const id = newId();
  const scenario = { id, name: name.trim() || 'Piano B', kind: 'altro' as const, notes, updatedAt: new Date().toISOString(), plan: snapshotPlan(draft) };
  return { trip: { ...t, scenarios: [...t.scenarios!, scenario] }, id };
}

export const previewVersion = (trip: Trip, id: ID): Trip => tripForScenario(trip, id);

/** Applica una versione. Il piano precedente resta salvato e la modifica è registrata. */
export function applyVersion(trip: Trip, id: ID, label: string, at = new Date().toISOString()): Trip {
  const t = ensureScenarios(trip);
  const from = t.activeScenarioId!;
  const next = switchScenario(t, id);
  if (next === t) return t;
  return { ...next, planLog: [...(next.planLog ?? []), { id: newId(), at, label, from, to: id }].slice(-50) };
}

/** Torna alla versione precedente: cambia solo il piano, diario e stati di visita restano. */
export function undoVersion(trip: Trip, from: ID, label: string, at = new Date().toISOString()): Trip {
  return applyVersion(trip, from, `Annullato: ${label}`, at);
}
