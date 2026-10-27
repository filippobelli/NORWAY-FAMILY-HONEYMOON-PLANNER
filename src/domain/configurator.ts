// Configuratore: propone un itinerario plausibile a partire dalle impostazioni scelte.
// Usa solo il catalogo dell'app (destinazioni, durate indicative, idoneità per bambini) e le coordinate.
// Le distanze qui sono STIME DI MASSIMA (linea d'aria × fattore di tortuosità) che servono solo a scegliere
// l'ordine delle tappe e a capire se un tratto è troppo lungo: km e tempi veri si calcolano dopo con il
// servizio di percorsi, come per qualsiasi altra tappa. Nessun prezzo, orario o disponibilità viene inventato.

import { COASTAL_PORTS_NORTHBOUND } from '../data/coastalPorts';
import { DESTINATIONS, findDestination } from '../data/destinations';
import { newId } from './ids';
import { dayKey, syncLegs } from './itinerary';
import type { Activity, DayPlan, Destination, Leg, PlanSnapshot, Region, ScenarioKind, Segment, Stop } from './types';

/** Località adatte a fare da base per dormire (le altre schede diventano visite in giornata). */
export const BASE_IDS = [
  'oslo',
  'bergen',
  'alesund',
  'trondheim',
  'tromso',
  'stavanger',
  'flam',
  'geiranger',
  'balestrand',
  'lillehammer',
  'roros',
  'odda',
  'reine',
  'svolvaer',
  'henningsvaer',
  'andenes',
  'senja',
] as const;

/** Schede che non sono luoghi da visitare in un giorno preciso (fenomeni, aree estese, collegamenti). */
const NOT_VISITS = new Set(['aurora', 'midnight-sun', 'lofoten', 'bodo-moskenes', 'sognefjord', 'hardangerfjord', 'jotunheimen']);

export type Pace = 'tranquillo' | 'equilibrato' | 'intenso';
export const PACE_MIN_NIGHTS: Record<Pace, number> = { tranquillo: 3, equilibrato: 2, intenso: 1 };
/** Ore di visita al giorno previste per ritmo (giornata piena / giornata con trasferimento) */
const PACE_VISIT_MIN: Record<Pace, [number, number]> = { tranquillo: [240, 90], equilibrato: [330, 120], intenso: [420, 180] };

export interface ConfiguratorInput {
  days: number;
  startDate: string;
  arrivalAirportId: string;
  departureAirportId: string;
  kind: Exclude<ScenarioKind, 'altro'>;
  pace: Pace;
  /** Massimo di guida al giorno, in ore (stima) */
  maxDriveHours: number;
  regions: Region[];
  /** Destinazioni da includere per forza (di solito i preferiti) */
  mustSee: string[];
  /** Escludere le attività segnate come poco adatte ai bambini piccoli */
  kidFriendly: boolean;
}

export interface ConfiguratorResult {
  plan: PlanSnapshot;
  /** Cosa ha fatto il configuratore e perché */
  notes: string[];
  /** Problemi da guardare */
  warnings: string[];
  bases: string[];
}

// ---------- geometria (stime) ----------

type P = { lat: number; lng: number };
const R = 6371;
export function airKm(a: P, b: P): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
/**
 * Fattore strada/linea d'aria e velocità media ipotizzati per le strade norvegesi con fiordi e traghetti.
 * Tarati il 27/10/2026 su un tratto calcolato con OSRM: Bergen → Ålesund, circa 236 km in linea d'aria,
 * 419 km di strada con 2 traghetti, 8 h 37 teoriche (fattore 1,78; circa 49 km/h). Restano stime.
 */
export const ROAD_FACTOR = 1.7;
export const AVG_KMH = 52;
/** Ore di guida stimate (solo per pianificare: non è un tempo calcolato). */
export const estDriveHours = (a: P, b: P) => (airKm(a, b) * ROAD_FACTOR) / AVG_KMH;

/** Costo di un percorso: km stimati, più una penalità forte per ogni ora oltre il massimo di guida giornaliero. */
function routeCost(points: P[], maxDrive = Infinity): number {
  let c = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    c += airKm(a, b);
    const over = estDriveHours(a, b) - maxDrive;
    if (over > 0) c += over * AVG_KMH * 4;
  }
  return c;
}

/** Ordina le basi tra partenza e arrivo fissi: vicino più vicino + miglioramento 2-opt. */
export function orderBases<T extends P>(start: P, end: P, bases: T[], maxDrive = Infinity): T[] {
  const left = [...bases];
  const out: T[] = [];
  let cur: P = start;
  while (left.length) {
    // Si preferisce la base vicina che non allontana troppo dall'arrivo
    let best = 0;
    let bestScore = Infinity;
    left.forEach((b, i) => {
      const score = airKm(cur, b) + 0.35 * airKm(b, end);
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    });
    cur = left.splice(best, 1)[0]!;
    out.push(cur as T);
  }
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 200) {
    improved = false;
    for (let i = 0; i < out.length - 1; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const cand = [...out.slice(0, i), ...out.slice(i, j + 1).reverse(), ...out.slice(j + 1)];
        if (routeCost([start, ...cand, end], maxDrive) + 1e-6 < routeCost([start, ...out, end], maxDrive)) {
          out.splice(0, out.length, ...cand);
          improved = true;
        }
      }
    }
  }
  return out;
}

// ---------- scelta delle basi ----------

interface Base {
  d: Destination;
  lat: number;
  lng: number;
  visits: Destination[];
  must: boolean;
  score: number;
  nights: number;
}

const VISIT_RADIUS_KM = 75;

function isVisit(d: Destination, kidFriendly: boolean): boolean {
  if (d.category === 'aeroporti' || NOT_VISITS.has(d.id)) return false;
  if (kidFriendly && d.kidScore === 1) return false;
  return true;
}

function nearestPort(p: P): { name: string; km: number } | undefined {
  let best: { name: string; km: number } | undefined;
  for (const port of COASTAL_PORTS_NORTHBOUND) {
    if (port.seasonal) continue;
    const km = airKm(p, port);
    if (!best || km < best.km) best = { name: port.name, km };
  }
  return best;
}

export function configureItinerary(input: ConfiguratorInput): ConfiguratorResult {
  const notes: string[] = [];
  const warnings: string[] = [];
  const arr = findDestination(input.arrivalAirportId);
  const dep = findDestination(input.departureAirportId);
  if (!arr || !dep) throw new Error('Aeroporti non validi');
  const totalNights = Math.max(1, Math.round(input.days) - 1);
  const minNights = PACE_MIN_NIGHTS[input.pace];
  const maxDrive = Math.max(1, input.maxDriveHours);

  const all = BASE_IDS.map((id) => findDestination(id)).filter((d): d is Destination => Boolean(d));
  const bases: Base[] = all.map((d) => ({ d, lat: d.lat, lng: d.lng, visits: [], must: false, score: 0, nights: 0 }));
  const byId = new Map(bases.map((b) => [b.d.id, b]));

  // Ogni visita va alla base più vicina (entro il raggio di una gita in giornata)
  const mustSet = new Set(input.mustSee);
  const unreachable: string[] = [];
  for (const v of DESTINATIONS) {
    if (byId.has(v.id) || !isVisit(v, input.kidFriendly)) continue;
    let best: Base | undefined;
    let bestKm = Infinity;
    for (const b of bases) {
      const km = airKm(b, v);
      if (km < bestKm) {
        bestKm = km;
        best = b;
      }
    }
    if (best && bestKm <= VISIT_RADIUS_KM) best.visits.push(v);
    else if (mustSet.has(v.id)) unreachable.push(v.name);
  }

  // Basi obbligatorie: quelle scelte o che contengono una destinazione scelta
  for (const id of input.mustSee) {
    const direct = byId.get(id);
    if (direct) direct.must = true;
    else for (const b of bases) if (b.visits.some((v) => v.id === id)) b.must = true;
    const d = findDestination(id);
    if (d && input.kidFriendly && d.kidScore === 1) warnings.push(`${d.name} è segnata come poco adatta ai bambini piccoli: l'ho tenuta perché è tra quelle scelte.`);
  }
  // Le destinazioni scelte ma poco adatte ai bambini restano comunque come visite
  if (input.kidFriendly) {
    for (const id of input.mustSee) {
      const d = findDestination(id);
      if (!d || d.kidScore !== 1 || byId.has(id)) continue;
      const b = [...bases].sort((x, y) => airKm(x, d) - airKm(y, d))[0];
      if (b && airKm(b, d) <= VISIT_RADIUS_KM && !b.visits.includes(d)) {
        b.visits.push(d);
        b.must = true;
      }
    }
  }
  if (unreachable.length) warnings.push(`Troppo lontane da qualsiasi base per una gita in giornata: ${unreachable.join(', ')}.`);

  // Le regioni degli aeroporti sono sempre comprese: lì si arriva e da lì si riparte
  const regions = new Set<Region>([...input.regions, arr.region, dep.region]);
  const directKm = airKm(arr, dep);
  for (const b of bases) {
    const visitScore = b.visits.reduce((s, v) => s + v.kidScore + (mustSet.has(v.id) ? 6 : 0), 0);
    const detour = airKm(arr, b) + airKm(b, dep) - directKm;
    b.score = b.d.kidScore * 2 + visitScore + (b.must ? 100 : 0) + (regions.has(b.d.region) ? 8 : -30) - detour / 120;
  }

  // Quante basi ci stanno con il ritmo scelto
  // Si lascia circa un quinto delle notti libero per tappe intermedie, navigazione e notti in più dove c'è molto da vedere
  const maxBases = Math.max(1, Math.floor((totalNights * 0.8) / minNights));
  const pool = bases.filter((b) => b.must || regions.has(b.d.region)).sort((a, b) => b.score - a.score);
  let chosen = pool.slice(0, maxBases);
  const droppedMust = pool.slice(maxBases).filter((b) => b.must);
  if (droppedMust.length) {
    warnings.push(
      `Con ${totalNights} notti e almeno ${minNights} notti per tappa non ci stanno: ${droppedMust.map((b) => b.d.name).join(', ')}. Aumenta i giorni o scegli un ritmo più intenso.`,
    );
  }
  if (chosen.length === 0) chosen = [bases.sort((a, b) => airKm(a, arr) - airKm(b, arr))[0]!];

  let order = orderBases(arr, dep, chosen, maxDrive);

  // Tratti troppo lunghi: si inserisce una base intermedia (togliendo una notte a chi ne ha di più)
  const legsOf = (o: Base[]): [P, P][] => {
    const pts: P[] = [arr, ...o, dep];
    return pts.slice(1).map((p, i) => [pts[i]!, p]);
  };
  const coastal = input.kind === 'auto_traghetti_costiera';
  const sailable = (a: P, b: P) => {
    const pa = nearestPort(a);
    const pb = nearestPort(b);
    return pa && pb && pa.km < 40 && pb.km < 40 && pa.name !== pb.name;
  };
  const transit = new Set<string>();
  const isCruise = (o: Base[], i: number) => {
    const [a, b] = legsOf(o)[i]!;
    return coastal && i > 0 && i < o.length && estDriveHours(a, b) > maxDrive * 1.5 && Boolean(sailable(a, b));
  };
  for (let guard = 0; guard < 10; guard++) {
    const legs = legsOf(order);
    const fixedNights = (order.length - transit.size) * minNights + transit.size;
    if (fixedNights + 1 > totalNights) break;
    const used = new Set(order.map((o) => o.d.id));
    // Per ogni tratto troppo lungo si cerca la base che lo spezza meglio; si inserisce la prima che funziona
    let inserted = false;
    for (const [idx, [a, b]] of legs.entries()) {
      if (estDriveHours(a, b) <= maxDrive * 1.15 || isCruise(order, idx)) continue;
      let best: Base | undefined;
      let bestWorst = Infinity;
      for (const c of bases) {
        if (used.has(c.d.id)) continue;
        const worst = Math.max(estDriveHours(a, c), estDriveHours(c, b));
        if (worst < bestWorst && worst < estDriveHours(a, b) * 0.8) {
          bestWorst = worst;
          best = c;
        }
      }
      if (!best) continue;
      notes.push(`Aggiunta ${best.d.name} come tappa intermedia per spezzare un trasferimento stimato di circa ${Math.round(estDriveHours(a, b))} h.`);
      transit.add(best.d.id);
      // Si rimette in ordine tutto il giro: con la tappa nuova può convenire una sequenza diversa
      const spliced = [...order.slice(0, idx), best, ...order.slice(idx)];
      const reordered = orderBases(arr, dep, spliced, maxDrive);
      order = routeCost([arr, ...reordered, dep], maxDrive) < routeCost([arr, ...spliced, dep], maxDrive) ? reordered : spliced;
      inserted = true;
      break;
    }
    if (!inserted) break;
  }

  // Notti: il minimo a ogni base (1 alle tappe intermedie), il resto a chi ha più cose da vedere (massimo 4)
  let nightsLeft = totalNights;
  const cruiseLegs: number[] = [];
  legsOf(order).forEach((_, i) => {
    if (isCruise(order, i)) cruiseLegs.push(i);
  });
  const cruiseNights = cruiseLegs.map((i) => {
    const [a, b] = legsOf(order)[i]!;
    return Math.min(3, Math.max(1, Math.round(airKm(a, b) / 450)));
  });
  nightsLeft -= cruiseNights.reduce((s, n) => s + n, 0);
  for (const b of order) b.nights = transit.has(b.d.id) ? 1 : minNights;
  nightsLeft -= order.reduce((s, b) => s + b.nights, 0);
  // Se le notti non bastano si tolgono prima alle basi con meno cose da vedere (mai sotto 1)
  for (let guard = 0; nightsLeft < 0 && guard < 100; guard++) {
    const t = [...order].filter((b) => b.nights > 1).sort((a, b) => a.visits.length - b.visits.length)[0];
    if (!t) break;
    t.nights--;
    nightsLeft++;
  }
  const richness = (b: Base) => (b.visits.length + (b.must ? 2 : 0) + 1) / b.nights;
  for (let guard = 0; nightsLeft > 0 && guard < 100; guard++) {
    const target = [...order].filter((b) => !transit.has(b.d.id) && b.nights < 4).sort((a, b) => richness(b) - richness(a))[0] ?? order[0]!;
    target.nights++;
    nightsLeft--;
  }
  if (nightsLeft < 0) warnings.push('Le notti non bastano per tutte le tappe scelte: riduci le tappe o aumenta i giorni.');

  // ---------- costruzione del piano ----------
  const mk = (d: Destination, nights: number): Stop => ({ id: newId(), kind: 'luogo', destinationId: d.id, name: d.name, lat: d.lat, lng: d.lng, nights, notes: '', weatherPlanB: '' });
  const stops: Stop[] = [mk(arr, 0)];
  const cruiseAt = new Map(cruiseLegs.map((legIdx, k) => [legIdx, cruiseNights[k]!]));
  const cruiseLabel = new Map<string, string>();
  order.forEach((b, i) => {
    const n = cruiseAt.get(i);
    const prev = stops[stops.length - 1]!;
    if (n) {
      const pa = nearestPort(prev)!;
      const pb = nearestPort(b)!;
      const shipId = newId();
      cruiseLabel.set(shipId, `${pa.name} → ${pb.name}`);
      stops.push({
        id: shipId,
        kind: 'a_bordo',
        name: `Notte a bordo (${pa.name} → ${pb.name})`,
        lat: (prev.lat + b.lat) / 2,
        lng: (prev.lng + b.lng) / 2,
        nights: n,
        notes: 'Proposta dal configuratore: verifica orari, porti e disponibilità nella sezione Crociere.',
        weatherPlanB: '',
      });
      notes.push(`Tratto ${pa.name} → ${pb.name} in nave costiera (${n === 1 ? '1 notte' : `${n} notti`} a bordo da verificare sull'orario).`);
    }
    stops.push(mk(b.d, b.nights));
  });
  stops.push(mk(dep, 0));

  let legs: Leg[] = syncLegs(stops, []);
  legs = legs.map((leg) => {
    const a = stops.find((s) => s.id === leg.fromStopId)!;
    const b = stops.find((s) => s.id === leg.toStopId)!;
    if (a.kind === 'a_bordo' || b.kind === 'a_bordo') {
      const ship = a.kind === 'a_bordo' ? a : b;
      const seg: Segment = {
        id: newId(),
        mode: 'costiera',
        label: `Navigazione costiera ${cruiseLabel.get(ship.id) ?? ''}`.trim(),
        costStatus: 'da_verificare',
        status: 'da_verificare',
        note: "Da collegare a un'opzione Hurtigruten/Havila nella sezione Crociere",
      };
      return { ...leg, segments: [seg] };
    }
    if (input.kind === 'misto_treni') {
      const ids = [a.destinationId, b.destinationId].sort().join('-');
      const train =
        ids === 'bergen-oslo'
          ? { label: 'Treno Oslo–Bergen (Bergensbanen)', note: 'Durata e orari da verificare su vy.no' }
          : ids === 'flam-oslo'
            ? { label: 'Treno Oslo–Myrdal–Flåm (Bergensbanen + Flåmsbana)', note: 'Cambio a Myrdal; durata e orari da verificare su vy.no' }
            : ids === 'bergen-flam'
              ? { label: 'Treno Flåm–Myrdal–Bergen (Flåmsbana + Bergensbanen)', note: 'Cambio a Myrdal; durata e orari da verificare su vy.no' }
              : undefined;
      if (train) {
        const seg: Segment = { id: newId(), mode: 'treno', label: train.label, costStatus: 'da_verificare', status: 'da_verificare', note: train.note };
        notes.push(`${train.label}: durata e orari da verificare.`);
        return { ...leg, segments: [seg] };
      }
    }
    return leg;
  });

  // Visite nelle giornate di ogni base: prima le scelte, poi le più adatte ai bambini
  const [fullDay, travelDay] = PACE_VISIT_MIN[input.pace];
  const days: Record<string, DayPlan> = {};
  for (const stop of stops) {
    if (stop.kind !== 'luogo' || stop.nights === 0) continue;
    const base = order.find((b) => b.d.id === stop.destinationId);
    if (!base) continue;
    const visits = [...base.visits].sort(
      (x, y) => Number(mustSet.has(y.id)) - Number(mustSet.has(x.id)) || y.kidScore - x.kidScore || (x.visitHours?.[0] ?? 2) - (y.visitHours?.[0] ?? 2),
    );
    const cap = Array.from({ length: stop.nights }, (_, k) => (k === 0 ? travelDay : fullDay));
    // Giorno 0 = arrivo con trasferimento: solo cose brevi. L'ultima tappa prima del volo ha l'ultimo giorno libero.
    const order2 = Array.from({ length: stop.nights }, (_, k) => k).sort((x, y) => (x === 0 ? 1 : 0) - (y === 0 ? 1 : 0));
    for (const v of visits) {
      const dur = Math.round((v.visitHours?.[0] ?? 2) * 60);
      if (dur >= 24 * 60) continue; // aree da più giorni: restano come base, non come attività
      const k = order2.find((i) => cap[i]! >= dur);
      if (k === undefined) continue;
      cap[k]! -= dur;
      const key = dayKey(stop.id, k);
      const act: Activity = { id: newId(), title: v.name, destinationId: v.id, durationMin: dur, costStatus: 'da_verificare' };
      days[key] = days[key] ?? { activities: [], notes: '', planB: '' };
      days[key]!.activities.push(act);
    }
  }

  // Controlli finali sui tratti stimati
  for (const leg of legs) {
    if (leg.segments.some((s) => s.mode === 'costiera' || s.mode === 'treno')) continue;
    const a = stops.find((s) => s.id === leg.fromStopId)!;
    const b = stops.find((s) => s.id === leg.toStopId)!;
    const h = estDriveHours(a, b);
    if (h > maxDrive * 1.15) {
      warnings.push(
        `${a.name} → ${b.name}: circa ${Math.round(h)} h di guida stimate, oltre il massimo scelto.${
          input.kind === 'auto_hytte' ? ' Valuta lo scenario con navigazione costiera o un volo interno.' : ''
        }`,
      );
    }
  }
  if (input.days < 15 || input.days > 20) notes.push(`Durata di ${input.days} giorni, fuori dall'obiettivo di 15–20.`);
  notes.push('Distanze e tempi usati per scegliere l\'ordine sono stime di massima: i km e i tempi reali si calcolano con «Calcola tratti mancanti».');
  if (dep.id !== arr.id) notes.push(`Arrivo a ${arr.name}, ripartenza da ${dep.name}: verifica il costo del noleggio con riconsegna in un'altra città.`);

  return {
    plan: { startDate: input.startDate, stops, legs, days, budgetItems: [], coastalSelected: [] },
    notes,
    warnings,
    bases: order.map((b) => b.d.id),
  };
}
