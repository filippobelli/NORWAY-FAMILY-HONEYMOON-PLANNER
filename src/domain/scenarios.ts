import { computeBudget } from './budget';
import { computeDayLoads } from './dayLoad';
import { newId } from './ids';
import {
  accommodationChanges,
  computeDays,
  formatDuration,
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

/** Aggiunge uno scenario con un piano già pronto (es. dal configuratore) e lo rende attivo. Il piano attuale resta salvato. */
export function addScenarioWithPlan(trip: Trip, name: string, kind: ScenarioKind, plan: PlanSnapshot, notes = ''): Trip {
  const t = ensureScenarios(trip);
  const sc: Scenario = { id: newId(), name: name.trim() || SCENARIO_KIND_LABEL[kind], kind, notes, updatedAt: new Date().toISOString(), plan };
  return switchScenario({ ...t, scenarios: [...t.scenarios!, sc] }, sc.id);
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
  /** Trasferimenti: tratti tra tappe consecutive */
  transferLegs: number;
  /** Giornate con almeno un trasferimento */
  transferDays: number;
  /** Tratti senza percorso né mezzo inserito */
  uncalculatedLegs: number;
  /** Tratti non calcolati o con almeno un segmento senza durata: km e tempi sono parziali */
  incompleteLegs: number;
  /** Segmenti con durata mancante o orario non confermato */
  unverifiedSegments: number;
  /** Costi noti come esistenti ma senza importo (es. traghetto senza prezzo): esclusi dal totale */
  missingCosts: string[];
  /** Categorie di budget senza alcuna voce né stima */
  emptyCostCategories: number;
  /** true se il totale non rappresenta l'intero viaggio (costi mancanti o categorie vuote) */
  costPartial: boolean;
  /** Costo al giorno solo se il totale non è parziale */
  costPerDay?: number;
  completeness: ScenarioCompleteness;
  /** Osservazioni per una famiglia con bambini, derivate dai dati (nessun punteggio) */
  familyNotes: string[];
}

export interface ScenarioCompleteness {
  level: 'vuoto' | 'insufficiente' | 'parziale' | 'completo';
  /** Cosa serve per completare il confronto */
  needs: string[];
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
  let incomplete = 0;
  let unverified = 0;
  for (const leg of view.legs) {
    const t = legTotals(leg, view.settings);
    roadKm += t.roadKm;
    theo += t.travelMin + t.waitMin;
    real += t.realisticMin;
    ferries += t.ferryCount;
    if (t.hasUncalculated) uncalculated++;
    if (t.partial) incomplete++;
    unverified += t.unverifiedCrossings;
    coastal += leg.segments.filter((s) => s.mode === 'costiera').length;
    pt += leg.segments.filter((s) => s.mode === 'treno' || s.mode === 'bus').length;
  }
  const toVerify: string[] = [];
  if (view.stops.length === 0) toVerify.push('Itinerario vuoto');
  if (uncalculated) toVerify.push(`${uncalculated} collegamenti non calcolati`);
  if (unverified) toVerify.push(`${unverified} traghetti, navi o mezzi pubblici con orari non confermati`);
  const noBed = view.stops.filter((s) => s.kind === 'luogo' && s.nights > 0 && !s.accommodationId).length;
  if (noBed) toVerify.push(`${noBed} tappe senza alloggio`);
  const missingPrices = budget.missing.filter((m) => !m.startsWith('Nessuna voce')).length;
  if (missingPrices) toVerify.push(`${missingPrices} prezzi mancanti`);
  const emptyCats = budget.missing.filter((m) => m.startsWith('Nessuna voce')).length;
  if (emptyCats) toVerify.push(`${emptyCats} categorie di budget senza voci`);
  const n = totalDays(view.stops);
  const missingCosts = budget.missing.filter((m) => !m.startsWith('Nessuna voce'));
  const costPartial = missingCosts.length > 0 || emptyCats > 0 || budget.total === 0;
  const unverifiedSegments = view.legs.reduce(
    (acc, l) =>
      acc +
      l.segments.filter(
        (s) => s.mode !== 'non_calcolato' && (s.durationMin === undefined || (s.mode !== 'strada' && !['confermato', 'prenotato', 'pagato'].includes(s.status))),
      ).length,
    0,
  );
  const maxDay = Math.max(0, ...days.map((d) => d.realisticTravelMin));
  const heavyDays = loads.filter((l) => l.level === 'piena' || l.level === 'eccessiva').length;
  const onboard = view.stops.filter((s) => s.kind === 'a_bordo').reduce((a, s) => a + s.nights, 0);

  // Completezza: cosa manca perché il confronto sia affidabile
  const needs: string[] = [];
  if (n === 0) needs.push('Aggiungere tappe e notti');
  if (uncalculated) needs.push(`Calcolare ${uncalculated} ${uncalculated === 1 ? 'tratto' : 'tratti'} (distanze e tempi)`);
  const missingDur = incomplete - uncalculated;
  if (missingDur > 0) needs.push(`Inserire la durata mancante in ${missingDur} ${missingDur === 1 ? 'tratto' : 'tratti'}`);
  if (missingCosts.length) needs.push(`Inserire ${missingCosts.length} ${missingCosts.length === 1 ? 'prezzo mancante' : 'prezzi mancanti'}`);
  if (emptyCats) needs.push(`Aggiungere voci o stime per ${emptyCats} ${emptyCats === 1 ? 'categoria' : 'categorie'} di spesa`);
  const level: ScenarioCompleteness['level'] =
    n === 0 ? 'vuoto' : incomplete > 0 || budget.total === 0 ? 'insufficiente' : needs.length > 0 ? 'parziale' : 'completo';

  // Osservazioni per la famiglia: fatti misurati, non giudizi
  const familyNotes: string[] = [];
  if (n > 0) {
    if (maxDay > view.settings.maxTravelMinPerDay) {
      familyNotes.push(`Giornata di trasferimento più lunga ~${formatDuration(maxDay)}, oltre la soglia di ${formatDuration(view.settings.maxTravelMinPerDay)} impostata`);
    }
    if (heavyDays > 0) familyNotes.push(`${heavyDays} ${heavyDays === 1 ? 'giornata piena o troppo carica' : 'giornate piene o troppo cariche'}`);
    const changes = accommodationChanges(view.stops);
    const nightsTot = totalNights(view.stops);
    if (nightsTot > 0) familyNotes.push(`${changes} ${changes === 1 ? 'cambio' : 'cambi'} di alloggio in ${nightsTot} notti`);
    if (onboard > 0) familyNotes.push(`${onboard} ${onboard === 1 ? 'notte' : 'notti'} a bordo: cabina per 4 da verificare con l'operatore`);
    if (ferries + coastal > 0) familyNotes.push(`${ferries + coastal} ${ferries + coastal === 1 ? 'traversata' : 'traversate'}: orari e attese da verificare`);
    if (pt > 0) familyNotes.push(`${pt} ${pt === 1 ? 'tratto' : 'tratti'} in treno o bus: bagagli e orari con bambini da verificare`);
  }

  return {
    transferLegs: view.legs.length,
    transferDays: days.filter((d) => d.legs.length > 0).length,
    uncalculatedLegs: uncalculated,
    incompleteLegs: incomplete,
    unverifiedSegments,
    missingCosts,
    emptyCostCategories: emptyCats,
    costPartial,
    costPerDay: !costPartial && n > 0 ? budget.total / n : undefined,
    completeness: { level, needs },
    familyNotes,
    days: n,
    nights: totalNights(view.stops),
    inTarget: n >= TRIP_MIN_DAYS && n <= TRIP_MAX_DAYS,
    accommodationChanges: accommodationChanges(view.stops),
    roadKm: Math.round(roadKm),
    transferTheoreticalMin: theo,
    transferRealisticMin: real,
    maxDayTransferMin: maxDay,
    ferries,
    coastalSegments: coastal,
    nightsOnboard: onboard,
    publicTransportSegments: pt,
    costTotal: budget.total,
    costFirm: budget.byStatus.confermato + budget.byStatus.prenotato + budget.byStatus.pagato,
    costEstimated: budget.byStatus.stimato + budget.byStatus.da_verificare,
    heavyDays,
    toVerify,
  };
}

/**
 * Su quali dati poggia una riga del confronto:
 * - nessuno: dato sempre noto (giorni, notti, cambi di alloggio);
 * - tratti: richiede tutti i tratti calcolati (km, tempi, giornate pesanti);
 * - costi: richiede costi non parziali (costo al giorno);
 * - costi_stessa_durata: come sopra e durate uguali (costo totale).
 */
export type CompareBasis = 'nessuno' | 'tratti' | 'costi' | 'costi_stessa_durata';

/** Dice se un valore si può confrontare tra gli scenari con itinerario; se no, spiega perché. Non sceglie mai un vincitore con dati incompleti. */
export function comparability(basis: CompareBasis, all: ScenarioMetrics[]): { ok: boolean; reason?: string } {
  const ms = all.filter((m) => m.days > 0);
  if (ms.length < 2) return { ok: false, reason: 'servono almeno due scenari con itinerario' };
  if (basis === 'nessuno') return { ok: true };
  if (basis === 'tratti') {
    return ms.every((m) => m.incompleteLegs === 0) ? { ok: true } : { ok: false, reason: 'tratti non calcolati o senza durata in almeno uno scenario' };
  }
  if (ms.some((m) => m.costPartial)) return { ok: false, reason: 'costi incompleti in almeno uno scenario' };
  if (basis === 'costi_stessa_durata' && ms.some((m) => m.days !== ms[0]!.days)) return { ok: false, reason: 'durate diverse: confronta il costo al giorno' };
  return { ok: true };
}

/** Controlli di coerenza tra il tipo di scenario e il suo contenuto. */
export function scenarioKindNotes(kind: ScenarioKind, m: ScenarioMetrics): string[] {
  const out: string[] = [];
  if (kind === 'auto_traghetti_costiera' && m.coastalSegments === 0) out.push('Nessun tratto di navigazione costiera inserito.');
  if (kind === 'auto_hytte' && m.coastalSegments > 0) out.push('Contiene navigazione costiera: è davvero uno scenario solo auto?');
  if (kind === 'misto_treni' && m.publicTransportSegments === 0) out.push('Nessun tratto in treno o autobus inserito.');
  return out;
}
