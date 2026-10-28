import { DESTINATIONS } from '../data/destinations';
import { newId } from './ids';
import { assumptions, computeDays, formatDuration, type DayInfo } from './itinerary';
import type { DayPlan, Stop, Trip } from './types';

// Carico delle giornate per una famiglia con bambini piccoli.
// Tutti i parametri sono IPOTESI modificabili (Impostazioni → Viaggio), non dati verificati.

export type LoadLevel = 'leggera' | 'equilibrata' | 'piena' | 'eccessiva';

export interface DayLoad {
  key: string;
  index: number;
  transferMin: number;
  visitsMin: number;
  /** Attività la cui durata è presa dal catalogo (stima) */
  estimatedVisits: number;
  /** Attività senza durata né stima */
  unknownVisits: number;
  mealsMin: number;
  marginMin: number;
  totalMin: number;
  capacityMin: number;
  ratio: number;
  level: LoadLevel;
  /** Ci sono trasferimenti non calcolati: il carico reale è più alto */
  incomplete: boolean;
}

export type SuggestionAction =
  | { type: 'add_night'; stopId: string }
  | { type: 'move_activity'; fromKey: string; toKey: string; activityId: string }
  | { type: 'insert_stop'; destinationId: string; beforeStopId: string };

export interface Suggestion {
  id: string;
  dayKey: string;
  text: string;
  action?: SuggestionAction;
}

const emptyPlan = (): DayPlan => ({ activities: [], notes: '', planB: '' });

export function levelFor(ratio: number): LoadLevel {
  if (ratio < 0.6) return 'leggera';
  if (ratio < 0.9) return 'equilibrata';
  if (ratio <= 1) return 'piena';
  return 'eccessiva';
}

export function computeDayLoads(trip: Trip, days: DayInfo[] = computeDays(trip)): DayLoad[] {
  const a = assumptions(trip.settings);
  return days.map((d) => {
    const plan = trip.days[d.key] ?? emptyPlan();
    let visitsMin = 0;
    let estimatedVisits = 0;
    let unknownVisits = 0;
    for (const act of plan.activities) {
      if (act.durationMin !== undefined) {
        visitsMin += act.durationMin;
        continue;
      }
      const dest = DESTINATIONS.find((x) => x.id === act.destinationId);
      if (dest?.visitHours) {
        visitsMin += dest.visitHours[0] * 60;
        estimatedVisits++;
      } else {
        unknownVisits++;
      }
    }
    const transferMin = d.realisticTravelMin;
    const mealsMin = a.mealBreaksMin;
    const sub = transferMin + visitsMin + mealsMin;
    const marginMin = Math.round((sub * a.marginPct) / 100);
    const totalMin = sub + marginMin;
    const capacityMin = a.activeDayMin;
    const ratio = capacityMin > 0 ? totalMin / capacityMin : 0;
    return {
      key: d.key,
      index: d.index,
      transferMin,
      visitsMin,
      estimatedVisits,
      unknownVisits,
      mealsMin,
      marginMin,
      totalMin,
      capacityMin,
      ratio,
      level: levelFor(ratio),
      incomplete: d.travelPartial,
    };
  });
}

function distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Destinazioni del catalogo vicine alla parte centrale del percorso calcolato (per spezzare un trasferimento lungo). */
export function midRouteCandidates(trip: Trip, day: DayInfo, maxKm = 15): { destinationId: string; beforeStopId: string; name: string }[] {
  const out: { destinationId: string; beforeStopId: string; name: string }[] = [];
  const used = new Set(trip.stops.map((s) => s.destinationId));
  for (const leg of day.legs) {
    const pts = leg.segments.filter((s) => s.mode === 'strada').flatMap((s) => s.geometry ?? []);
    if (pts.length < 10) continue;
    const middle = pts.slice(Math.floor(pts.length * 0.3), Math.ceil(pts.length * 0.7));
    for (const d of DESTINATIONS) {
      // Solo località dove ha senso dormire (città, villaggi, isole)
      if (used.has(d.id) || (d.category !== 'citta' && d.category !== 'isole') || d.kidScore < 2) continue;
      const near = middle.some(([lat, lng]) => distKm({ lat, lng }, d) <= maxKm);
      if (near && !out.some((o) => o.destinationId === d.id)) out.push({ destinationId: d.id, beforeStopId: leg.toStopId, name: d.name });
    }
  }
  return out.slice(0, 3);
}

/** Proposte di alleggerimento. Non modificano nulla: l'utente decide se applicarle. */
export function suggestAlternatives(trip: Trip): Suggestion[] {
  const days = computeDays(trip);
  const loads = computeDayLoads(trip, days);
  const out: Suggestion[] = [];

  loads.forEach((l, i) => {
    const day = days[i]!;
    if (l.level !== 'eccessiva' && l.level !== 'piena') return;

    // 1) Trasferimento lungo: spezzarlo con una tappa intermedia
    if (l.transferMin > trip.settings.maxTravelMinPerDay) {
      const cands = midRouteCandidates(trip, day);
      for (const c of cands) {
        out.push({
          id: `ins-${day.key}-${c.destinationId}`,
          dayKey: day.key,
          text: `Spezza il trasferimento con una notte a ${c.name}, lungo il percorso.`,
          action: { type: 'insert_stop', destinationId: c.destinationId, beforeStopId: c.beforeStopId },
        });
      }
      if (cands.length === 0) {
        out.push({ id: `long-${day.key}`, dayKey: day.key, text: 'Trasferimento lungo: valuta una tappa intermedia (calcola il percorso per ricevere proposte lungo la strada).' });
      }
    }

    // 2) Troppe attività: spostare la più lunga in un giorno più leggero nella stessa località
    const plan = trip.days[day.key];
    if (plan && plan.activities.length > 0 && l.level === 'eccessiva') {
      const place = day.sleepStop?.id ?? day.wakeStop?.id;
      const target = loads.find((o, j) => {
        const dj = days[j]!;
        return j !== i && o.level === 'leggera' && (dj.sleepStop?.id === place || dj.wakeStop?.id === place);
      });
      if (target) {
        const longest = plan.activities.slice().sort((x, y) => (y.durationMin ?? 0) - (x.durationMin ?? 0))[0]!;
        out.push({
          id: `mv-${day.key}-${longest.id}`,
          dayKey: day.key,
          text: `Sposta "${longest.title || 'attività'}" al giorno ${target.index + 1}, nella stessa località e più leggero (${Math.round(target.ratio * 100)}%).`,
          action: { type: 'move_activity', fromKey: day.key, toKey: target.key, activityId: longest.id },
        });
      }
    }
  });

  // 3) Due giorni pieni di fila: aggiungere una notte per un giorno di riposo
  for (let i = 1; i < loads.length; i++) {
    const prev = loads[i - 1]!;
    const cur = loads[i]!;
    const stop = days[i]!.sleepStop;
    if (stop && stop.kind === 'luogo' && (prev.level === 'piena' || prev.level === 'eccessiva') && (cur.level === 'piena' || cur.level === 'eccessiva')) {
      out.push({
        id: `rest-${days[i]!.key}`,
        dayKey: days[i]!.key,
        text: `Due giornate impegnative di fila: aggiungi una notte a ${stop.name} per una giornata tranquilla.`,
        action: { type: 'add_night', stopId: stop.id },
      });
    }
  }

  // 4) Lunghe sequenze senza giornate leggere
  let run = 0;
  loads.forEach((l, i) => {
    run = l.level === 'leggera' ? 0 : run + 1;
    if (run === 5) {
      out.push({ id: `seq-${days[i]!.key}`, dayKey: days[i]!.key, text: '5 giornate di fila senza una giornata leggera: con bambini di 5 e 8 anni conviene prevederne una.' });
    }
  });
  return out;
}

export function applySuggestion(trip: Trip, action: SuggestionAction): Trip {
  switch (action.type) {
    case 'add_night':
      return { ...trip, stops: trip.stops.map((s) => (s.id === action.stopId ? { ...s, nights: Math.min(14, s.nights + 1) } : s)) };
    case 'move_activity': {
      const from = trip.days[action.fromKey];
      const act = from?.activities.find((a) => a.id === action.activityId);
      if (!from || !act) return trip;
      const to = trip.days[action.toKey] ?? emptyPlan();
      return {
        ...trip,
        days: {
          ...trip.days,
          [action.fromKey]: { ...from, activities: from.activities.filter((a) => a.id !== act.id) },
          [action.toKey]: { ...to, activities: [...to.activities, act] },
        },
      };
    }
    case 'insert_stop': {
      const d = DESTINATIONS.find((x) => x.id === action.destinationId);
      const idx = trip.stops.findIndex((s) => s.id === action.beforeStopId);
      if (!d || idx < 0) return trip;
      const stop: Stop = { id: newId(), kind: 'luogo', destinationId: d.id, name: d.name, lat: d.lat, lng: d.lng, nights: 1, notes: '', weatherPlanB: '' };
      const stops = trip.stops.slice();
      stops.splice(idx, 0, stop);
      return { ...trip, stops };
    }
  }
}

export interface LoadFactor {
  /** true se il fattore da solo rende la giornata faticosa */
  strong: boolean;
  text: string;
}

/** Spiega da cosa dipende il carico di una giornata, con i soli dati presenti (nessuna stima nuova). */
export function loadFactors(trip: Trip, day: DayInfo, load: DayLoad): LoadFactor[] {
  const out: LoadFactor[] = [];
  const max = trip.settings.maxTravelMinPerDay;
  if (load.transferMin > 0) {
    const over = load.transferMin > max;
    out.push({
      strong: over,
      text: `Trasferimenti ~${formatDuration(load.transferMin)} con soste e attese${over ? `, oltre la soglia di ${formatDuration(max)}` : ''}`,
    });
  }
  const acts = trip.days[day.key]?.activities.length ?? 0;
  if (acts > 0) {
    out.push({ strong: load.visitsMin > load.capacityMin / 2, text: `${acts} attività per ~${formatDuration(load.visitsMin)} di visite` });
  }
  if (day.legs.length > 0 && day.sleepStop && day.wakeStop && day.sleepStop.id !== day.wakeStop.id) {
    out.push({ strong: false, text: `Cambio di alloggio: da ${day.wakeStop.name} a ${day.sleepStop.name} (bagagli e check-in)` });
  }
  if (load.incomplete) out.push({ strong: true, text: 'Tratti non calcolati: il carico reale è più alto di quello mostrato' });
  const unconfirmed = day.legs.flatMap((l) => l.segments).filter((s) => (s.mode === 'traghetto' || s.mode === 'costiera') && !['confermato', 'prenotato', 'pagato'].includes(s.status)).length;
  if (unconfirmed > 0) out.push({ strong: false, text: `${unconfirmed} ${unconfirmed === 1 ? 'traversata' : 'traversate'} con orario da verificare` });
  if (load.unknownVisits > 0) out.push({ strong: false, text: `${load.unknownVisits} attività senza durata: non conteggiate` });
  return out;
}

export function describeLoad(l: DayLoad): string {
  return `${formatDuration(l.totalMin)} su ${formatDuration(l.capacityMin)} disponibili (${Math.round(l.ratio * 100)}%)`;
}
