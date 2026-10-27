import { computeBudget } from './budget';
import { computeDayLoads } from './dayLoad';
import { newId } from './ids';
import {
  accommodationChanges,
  computeDays,
  legTotals,
  syncLegs,
  totalDays,
  totalNights,
  TRIP_MAX_DAYS,
  TRIP_MIN_DAYS,
} from './itinerary';
import type { PlanSnapshot, Scenario, ScenarioKind, Trip } from './types';

export const SCENARIO_KIND_LABEL: Record<ScenarioKind, string> = {
  auto_hytte: 'Auto e hytte',
  auto_traghetti_costiera: 'Auto, traghetti e navigazione costiera',
  misto_treni: 'Misto con treni e trasporti pubblici',
  altro: 'Altro',
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function snapshotPlan(trip: Trip): PlanSnapshot {
  return clone({
    startDate: trip.startDate,
    stops: trip.stops,
    legs: trip.legs,
    days: trip.days,
    budgetItems: trip.budgetItems,
    coastalSelected: trip.coastalOptions.filter((o) => o.selected).map((o) => o.id),
  });
}

function applyPlan(trip: Trip, plan: PlanSnapshot): Trip {
  return {
    ...trip,
    startDate: plan.startDate,
    stops: plan.stops,
    legs: syncLegs(plan.stops, plan.legs),
    days: plan.days,
    budgetItems: plan.budgetItems,
    coastalOptions: trip.coastalOptions.map((o) => ({ ...o, selected: plan.coastalSelected.includes(o.id) })),
  };
}

/** Garantisce che esista almeno lo scenario attivo (quello in modifica). */
export function ensureScenarios(trip: Trip): Trip {
  if (trip.scenarios && trip.scenarios.length > 0 && trip.activeScenarioId && trip.scenarios.some((s) => s.id === trip.activeScenarioId)) return trip;
  const id = newId();
  const base: Scenario = { id, name: 'Scenario principale', kind: 'altro', notes: '', updatedAt: new Date().toISOString() };
  return { ...trip, scenarios: [base, ...(trip.scenarios ?? []).filter((s) => s.plan)], activeScenarioId: id };
}

/** Vista del viaggio con il piano di uno scenario (senza modificare il viaggio). */
export function tripForScenario(trip: Trip, scenarioId: string): Trip {
  const t = ensureScenarios(trip);
  if (scenarioId === t.activeScenarioId) return t;
  const sc = t.scenarios!.find((s) => s.id === scenarioId);
  return sc?.plan ? applyPlan(t, sc.plan) : t;
}

export function switchScenario(trip: Trip, scenarioId: string): Trip {
  const t = ensureScenarios(trip);
  if (scenarioId === t.activeScenarioId) return t;
  const target = t.scenarios!.find((s) => s.id === scenarioId);
  if (!target?.plan) return t;
  const now = new Date().toISOString();
  const scenarios = t.scenarios!.map((s) => {
    if (s.id === t.activeScenarioId) return { ...s, plan: snapshotPlan(t), updatedAt: now };
    if (s.id === scenarioId) return { ...s, plan: undefined };
    return s;
  });
  return { ...applyPlan(t, target.plan), scenarios, activeScenarioId: scenarioId };
}

export function addScenario(trip: Trip, name: string, kind: ScenarioKind, from: 'copia' | 'vuoto'): Trip {
  const t = ensureScenarios(trip);
  const plan: PlanSnapshot =
    from === 'copia'
      ? snapshotPlan(t)
      : { startDate: t.startDate, stops: [], legs: [], days: {}, budgetItems: [], coastalSelected: [] };
  const sc: Scenario = { id: newId(), name: name.trim() || SCENARIO_KIND_LABEL[kind], kind, notes: '', updatedAt: new Date().toISOString(), plan };
  return { ...t, scenarios: [...t.scenarios!, sc] };
}

export function updateScenarioMeta(trip: Trip, id: string, patch: Partial<Pick<Scenario, 'name' | 'kind' | 'notes'>>): Trip {
  const t = ensureScenarios(trip);
  return { ...t, scenarios: t.scenarios!.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
}

/** Elimina uno scenario non attivo. */
export function removeScenario(trip: Trip, id: string): Trip {
  const t = ensureScenarios(trip);
  if (id === t.activeScenarioId) return t;
  return { ...t, scenarios: t.scenarios!.filter((s) => s.id !== id) };
}

export interface ScenarioMetrics {
  days: number;
  nights: number;
  inTarget: boolean;
  accommodationChanges: number;
  roadKm: number;
  transferTheoreticalMin: number;
  transferRealisticMin: number;
  maxDayTransferMin: number;
  ferries: number;
  coastalSegments: number;
  nightsOnboard: number;
  publicTransportSegments: number;
  costTotal: number;
  costFirm: number;
  costEstimated: number;
  heavyDays: number;
  /** Informazioni ancora da verificare o mancanti */
  toVerify: string[];
}

export function scenarioMetrics(view: Trip): ScenarioMetrics {
  const days = computeDays(view);
  const loads = computeDayLoads(view, days);
  const budget = computeBudget(view);
  let roadKm = 0;
  let theo = 0;
  let real = 0;
  let ferries = 0;
  let coastal = 0;
  let pt = 0;
  let uncalculated = 0;
  let unverified = 0;
  for (const leg of view.legs) {
    const t = legTotals(leg, view.settings);
    roadKm += t.roadKm;
    theo += t.travelMin + t.waitMin;
    real += t.realisticMin;
    ferries += t.ferryCount;
    if (t.hasUncalculated) uncalculated++;
    unverified += t.unverifiedCrossings;
    coastal += leg.segments.filter((s) => s.mode === 'costiera').length;
    pt += leg.segments.filter((s) => s.mode === 'treno' || s.mode === 'bus').length;
  }
  const toVerify: string[] = [];
  if (view.stops.length === 0) toVerify.push('Itinerario vuoto');
  if (uncalculated) toVerify.push(`${uncalculated} collegamenti non calcolati`);
  if (unverified) toVerify.push(`${unverified} traghetti/navi con orari non confermati`);
  const noBed = view.stops.filter((s) => s.kind === 'luogo' && s.nights > 0 && !s.accommodationId).length;
  if (noBed) toVerify.push(`${noBed} tappe senza alloggio`);
  const missingPrices = budget.missing.filter((m) => !m.startsWith('Nessuna voce')).length;
  if (missingPrices) toVerify.push(`${missingPrices} prezzi mancanti`);
  const emptyCats = budget.missing.filter((m) => m.startsWith('Nessuna voce')).length;
  if (emptyCats) toVerify.push(`${emptyCats} categorie di budget senza voci`);
  const n = totalDays(view.stops);
  return {
    days: n,
    nights: totalNights(view.stops),
    inTarget: n >= TRIP_MIN_DAYS && n <= TRIP_MAX_DAYS,
    accommodationChanges: accommodationChanges(view.stops),
    roadKm: Math.round(roadKm),
    transferTheoreticalMin: theo,
    transferRealisticMin: real,
    maxDayTransferMin: Math.max(0, ...days.map((d) => d.realisticTravelMin)),
    ferries,
    coastalSegments: coastal,
    nightsOnboard: view.stops.filter((s) => s.kind === 'a_bordo').reduce((a, s) => a + s.nights, 0),
    publicTransportSegments: pt,
    costTotal: budget.total,
    costFirm: budget.byStatus.confermato + budget.byStatus.prenotato + budget.byStatus.pagato,
    costEstimated: budget.byStatus.stimato + budget.byStatus.da_verificare,
    heavyDays: loads.filter((l) => l.level === 'piena' || l.level === 'eccessiva').length,
    toVerify,
  };
}

/** Controlli di coerenza tra il tipo di scenario e il suo contenuto. */
export function scenarioKindNotes(kind: ScenarioKind, m: ScenarioMetrics): string[] {
  const out: string[] = [];
  if (kind === 'auto_traghetti_costiera' && m.coastalSegments === 0) out.push('Nessun tratto di navigazione costiera inserito.');
  if (kind === 'auto_hytte' && m.coastalSegments > 0) out.push('Contiene navigazione costiera: è davvero uno scenario solo auto?');
  if (kind === 'misto_treni' && m.publicTransportSegments === 0) out.push('Nessun tratto in treno o autobus inserito.');
  return out;
}
