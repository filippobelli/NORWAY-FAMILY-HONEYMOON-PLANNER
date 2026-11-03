import { COASTAL_PORTS_NORTHBOUND, type CoastalPort } from '../data/coastalPorts';
import { DESTINATIONS, findDestination } from '../data/destinations';
import { airKm } from './configurator';
import { airportLabel, norwayAirports } from './flightAdvisor';
import { newId } from './ids';
import { addDays, computeDays, formatDateIt, isRoutableLeg, legTotals, syncLegs, totalDays, totalNights, TRIP_MAX_DAYS, TRIP_MIN_DAYS, uncalculatedSegment } from './itinerary';
import type { CoastalOption, Flight, Leg, Segment, Stop, Trip } from './types';

// Inserimento nel percorso di ciò che si decide altrove (crociere, voli, mete).
// Funzioni pure: restituiscono un nuovo viaggio e non applicano nulla da sole. L'interfaccia mostra
// prima e dopo, chiede cosa fare in caso di sovrapposizioni e applica solo dopo la conferma.

const norm = (s: string) => s.trim().toLowerCase();
const nightsLabel = (n: number) => `${n} ${n === 1 ? 'notte' : 'notti'}`;

// ---------- Posizione nel percorso ----------

/**
 * Indice della tappa prima della quale inserire qualcosa che inizia nella notte `day` (0 = prima notte).
 * Se `day` cade a metà di una tappa si passa alla fine di quella tappa, senza spezzarla.
 * Le tappe iniziali senza notti restano prima, gli aeroporti finali senza notti restano dopo.
 */
export function cutIndex(stops: Stop[], day: number): number {
  let cum = 0;
  let last = -1;
  for (let i = 0; i < stops.length; i++) {
    const n = Math.max(0, stops[i]!.nights);
    if (cum >= day && n > 0) return i;
    cum += n;
    if (n > 0) last = i;
  }
  if (last >= 0) return last + 1;
  return stops.length > 1 ? 1 : stops.length;
}

/** Posizione predefinita per una nuova meta: dopo l'ultima tappa con notti, prima degli aeroporti finali. */
export function defaultInsertIndex(stops: Stop[]): number {
  return cutIndex(stops, Number.POSITIVE_INFINITY);
}

/** Notti già assegnate prima della tappa `index`. */
function nightsBefore(stops: Stop[], index: number): number {
  return stops.slice(0, index).reduce((a, s) => a + Math.max(0, s.nights), 0);
}

export interface DayOption {
  /** Notte da cui si parte (0 = primo giorno) */
  day: number;
  label: string;
}

/** Giorni tra cui scegliere: tutti quelli del viaggio, più quello subito dopo l'ultima notte. */
export function dayOptions(trip: Trip): DayOption[] {
  const days = computeDays(trip);
  if (days.length === 0) return [{ day: 0, label: `Giorno 1 · ${formatDateIt(trip.startDate)}` }];
  return days.map((d, i) => ({
    day: i,
    label: `Giorno ${i + 1} · ${formatDateIt(d.date)} · ${d.sleepStop ? `notte a ${d.sleepStop.name}` : 'ultimo giorno'}`,
  }));
}

function unlinkRemoved(trip: Trip, stops: Stop[]): Trip['accommodations'] {
  const kept = new Set(stops.map((s) => s.id));
  return trip.accommodations.map((a) => (a.stopId && !kept.has(a.stopId) ? { ...a, stopId: undefined } : a));
}

/** Toglie `amount` notti dalle tappe più lunghe, lasciandone almeno una. Preferisce quelle in `prefer`. Restituisce le notti non tolte. */
function shaveNights(stops: Stop[], amount: number, prefer: (s: Stop) => boolean): number {
  let left = amount;
  while (left > 0) {
    const can = stops.filter((s) => s.kind === 'luogo' && s.nights > 1);
    if (can.length === 0) break;
    const pool = can.some(prefer) ? can.filter(prefer) : can;
    const pick = pool.reduce((m, s) => (s.nights > m.nights ? s : m));
    pick.nights -= 1;
    left -= 1;
  }
  return left;
}

const shaveCapacity = (stops: Stop[]) => stops.filter((s) => s.kind === 'luogo' && s.nights > 1).reduce((a, s) => a + s.nights - 1, 0);

// ---------- Crociere ----------

export type OverlapMode = 'sostituisci' | 'allunga' | 'accorcia';
export type CarChoice = 'a_bordo' | 'a_terra' | 'da_decidere';

export interface CruisePlacement {
  /** Notte in cui ci si imbarca (0 = primo giorno) */
  day: number;
  nights: number;
  mode: OverlapMode;
  car: CarChoice;
}

export interface OverlapChoice {
  mode: OverlapMode;
  label: string;
  detail: string;
  /** Motivo per cui non si può scegliere */
  disabled?: string;
}

export function cruiseInRoute(trip: Trip, optionId: string): boolean {
  return trip.legs.some((l) => l.segments.some((s) => s.coastalOptionId === optionId));
}

function findPort(name: string): CoastalPort | undefined {
  return COASTAL_PORTS_NORTHBOUND.find((p) => norm(p.name) === norm(name));
}

/** Porti senza coordinate note non si inseriscono: le coordinate non si inventano. */
export function cruisePortsKnown(o: CoastalOption): boolean {
  return Boolean(findPort(o.fromPort) && findPort(o.toPort));
}

function samePlace(s: Stop | undefined, port: CoastalPort): boolean {
  return Boolean(s && s.kind === 'luogo' && (norm(s.name) === norm(port.name) || airKm(s, port) < 5));
}

function portStop(port: CoastalPort, optionId: string): Stop {
  const d = DESTINATIONS.find((x) => norm(x.name) === norm(port.name) && x.category !== 'aeroporti');
  return {
    id: newId(),
    kind: 'luogo',
    destinationId: d?.id,
    name: d?.name ?? port.name,
    lat: d?.lat ?? port.lat,
    lng: d?.lng ?? port.lng,
    nights: 0,
    notes: 'Porto della crociera: posizione approssimativa (centro abitato), non il molo.',
    weatherPlanB: '',
    placedFrom: optionId,
  };
}

/** Tappe e notti che si sovrappongono alle notti a bordo scelte. */
export function cruiseOverlap(stops: Stop[], day: number, nights: number): { stop: Stop; nights: number }[] {
  const out: { stop: Stop; nights: number }[] = [];
  let cum = 0;
  for (const s of stops) {
    const n = Math.max(0, s.nights);
    const common = Math.min(cum + n, day + nights) - Math.max(cum, day);
    if (common > 0) out.push({ stop: s, nights: common });
    cum += n;
  }
  return out;
}

/** Scelte possibili per una crociera nel giorno indicato. Senza sovrapposizioni resta solo l'inserimento. */
export function cruiseChoices(trip: Trip, day: number, nights: number): OverlapChoice[] {
  const overlap = cruiseOverlap(trip.stops, day, nights);
  const c = cutIndex(trip.stops, day);
  const startsAt = nightsBefore(trip.stops, c);
  const slip = startsAt > day ? ` L'imbarco slitta al giorno ${startsAt + 1}, alla fine di ${trip.stops[c - 1]?.name ?? 'quella tappa'}.` : '';
  if (overlap.length === 0) {
    return [{ mode: 'allunga', label: 'Inserisci nel percorso', detail: nights > 0 ? `Il viaggio si allunga di ${nightsLabel(nights)}.${slip}` : `Non aggiunge notti: si passa da una tappa all'altra in nave.${slip}` }];
  }
  const taken = overlap.map((o) => (o.nights >= o.stop.nights ? `${o.stop.name} (tutta, ${nightsLabel(o.nights)})` : `${nightsLabel(o.nights)} di ${o.stop.name}`)).join(', ');
  const capacity = shaveCapacity(trip.stops);
  return [
    { mode: 'sostituisci', label: 'Sostituisci quelle tappe', detail: `Toglie ${taken}. La durata del viaggio non cambia.` },
    { mode: 'allunga', label: `Allunga il viaggio di ${nightsLabel(nights)}`, detail: `Nessuna tappa perde notti: le successive si spostano più avanti.${slip}` },
    {
      mode: 'accorcia',
      label: 'Tieni tutte le tappe e accorciale',
      detail: `Toglie ${nightsLabel(nights)} in totale dalle tappe più lunghe, lasciandone almeno una per tappa. La durata del viaggio non cambia.${slip}`,
      disabled: capacity < nights ? `Si possono togliere solo ${nightsLabel(capacity)} senza eliminare tappe.` : undefined,
    },
  ];
}

function cruiseSegments(o: CoastalOption, nights: number, car: CarChoice): { first: Segment; disembark: Segment } {
  const route = `${o.operator} ${o.fromPort} → ${o.toPort}`;
  const carNote =
    car === 'a_bordo'
      ? 'Auto a bordo: disponibilità del posto auto da verificare.'
      : car === 'a_terra'
        ? `Auto non a bordo: da organizzare il noleggio o il recupero dell'auto tra ${o.fromPort} e ${o.toPort}.`
        : "Dove resta l'auto è da decidere: incide su noleggio e trasferimenti.";
  const base = {
    mode: 'costiera' as const,
    status: o.priceStatus === 'prenotato' || o.priceStatus === 'pagato' ? ('confermato' as const) : ('da_verificare' as const),
    costStatus: o.priceStatus,
    coastalOptionId: o.id,
    source: o.source,
  };
  return {
    first: {
      ...base,
      id: newId(),
      label: nights > 0 ? `Imbarco: ${route}` : route,
      // Con notti a bordo il tempo in nave non è un trasferimento della giornata: conta nelle notti
      durationMin: nights > 0 ? 0 : o.durationHours !== undefined ? Math.round(o.durationHours * 60) : undefined,
      departureTime: o.departureTime,
      note: `${nights > 0 ? `${nightsLabel(nights)} a bordo. ` : ''}Il costo è conteggiato nel budget dalla sezione Crociere. ${carNote}`,
    },
    disembark: { ...base, id: newId(), label: `Sbarco a ${o.toPort}: ${route}`, durationMin: 0, note: 'Il tempo in nave è conteggiato nelle notti a bordo. Orario di sbarco da verificare.' },
  };
}

/** Inserisce la crociera nel percorso. Restituisce undefined se un porto non ha coordinate note. */
export function placeCruise(trip: Trip, o: CoastalOption, p: CruisePlacement): Trip | undefined {
  const from = findPort(o.fromPort);
  const to = findPort(o.toPort);
  if (!from || !to) return undefined;
  const k = Math.max(0, Math.round(p.nights));
  const hasOverlap = cruiseOverlap(trip.stops, p.day, k).length > 0;

  let before: Stop[] = [];
  let after: Stop[] = [];
  if (p.mode === 'sostituisci' && hasOverlap) {
    const lastWithNights = trip.stops.reduce((m, s, i) => (s.nights > 0 ? i : m), -1);
    let cum = 0;
    trip.stops.forEach((s, i) => {
      const n = Math.max(0, s.nights);
      const end = cum + n;
      if (n === 0) {
        if (i > lastWithNights || cum >= p.day + k) after.push(s);
        else if (cum <= p.day) before.push(s);
      } else {
        const keepBefore = Math.min(n, Math.max(0, p.day - cum));
        const keepAfter = Math.min(n, Math.max(0, end - (p.day + k)));
        if (keepBefore > 0) before.push({ ...s, nights: keepBefore });
        // Tappa a cavallo della crociera: si torna lì dopo lo sbarco, come tappa a sé
        if (keepAfter > 0) after.push(keepBefore > 0 ? { ...s, id: newId(), nights: keepAfter } : { ...s, nights: keepAfter });
      }
      cum = end;
    });
  } else {
    const c = cutIndex(trip.stops, p.day);
    before = trip.stops.slice(0, c).map((s) => ({ ...s }));
    after = trip.stops.slice(c).map((s) => ({ ...s }));
  }

  const prev = before[before.length - 1];
  const next = after[0];
  const boarding = samePlace(prev, from) ? undefined : portStop(from, o.id);
  const landing = samePlace(next, to) ? undefined : portStop(to, o.id);
  const aboard: Stop | undefined =
    k > 0
      ? {
          id: newId(),
          kind: 'a_bordo',
          name: `Notti a bordo (${o.fromPort} → ${o.toPort})`,
          lat: (from.lat + to.lat) / 2,
          lng: (from.lng + to.lng) / 2,
          nights: k,
          notes: `${o.operator}: orari e cabina da verificare. La posizione sulla mappa è solo indicativa.`,
          weatherPlanB: '',
          placedFrom: o.id,
        }
      : undefined;

  if (p.mode === 'accorcia' && hasOverlap) {
    const later = new Set(after.map((s) => s.id));
    shaveNights([...before, ...after], k, (s) => later.has(s.id));
  }

  const firstStop = boarding ?? prev;
  const lastStop = landing ?? next;
  const stops = [...before, ...(boarding ? [boarding] : []), ...(aboard ? [aboard] : []), ...(landing ? [landing] : []), ...after];
  const { first, disembark } = cruiseSegments(o, k, p.car);
  const legs = syncLegs(stops, trip.legs).map((l) => {
    if (aboard) {
      if (l.toStopId === aboard.id) return { ...l, segments: [first] };
      if (l.fromStopId === aboard.id) return { ...l, segments: [disembark] };
    } else if (firstStop && lastStop && l.fromStopId === firstStop.id && l.toStopId === lastStop.id) {
      return { ...l, segments: [first] };
    }
    return l;
  });
  // Giorno effettivo di imbarco: può slittare o anticipare se si accorciano le tappe prima
  const effective = nightsBefore(stops, stops.indexOf(aboard ?? firstStop ?? stops[0]!));
  return {
    ...trip,
    stops,
    legs,
    accommodations: unlinkRemoved(trip, stops),
    coastalOptions: trip.coastalOptions.map((x) => (x.id === o.id ? { ...x, selected: true, date: addDays(trip.startDate, effective), nightsOnboard: k, withCar: p.car === 'a_bordo' } : x)),
  };
}

function refillEmpty(legs: Leg[]): Leg[] {
  return legs.map((l) => (l.segments.length === 0 ? { ...l, segments: [uncalculatedSegment()] } : l));
}

/** Toglie la crociera dal percorso: tappe create per lei e tratti collegati. Le notti che aveva sostituito non tornano da sole. */
export function removeCruise(trip: Trip, optionId: string): Trip {
  const stops = trip.stops.filter((s) => s.placedFrom !== optionId);
  const legs = refillEmpty(trip.legs.map((l) => ({ ...l, segments: l.segments.filter((s) => s.coastalOptionId !== optionId) })));
  return { ...trip, stops, legs: syncLegs(stops, legs) };
}

// ---------- Voli ----------

export interface FlightOption {
  id: string;
  label: string;
  disabled?: string;
}

export interface FlightIssue {
  /** Tipo di domanda: `date_start`, `airport_first`, `date_end`, `airport_last`, `tratto` */
  id: string;
  /** Identifica questa precisa differenza: se l'utente l'ha lasciata così non viene richiesta */
  key: string;
  text: string;
  options: FlightOption[];
  /** Avviso senza scelta */
  note?: string;
}

const KEEP = 'tieni';

function airportDestination(code: string) {
  const d = findDestination(norm(code));
  return d?.category === 'aeroporti' ? d : undefined;
}

function stopIsAirport(s: Stop | undefined, code: string): boolean {
  return Boolean(s && (norm(s.destinationId ?? '') === norm(code) || norm(s.name) === norm(airportLabel(code))));
}

function airportStopFor(code: string): Stop | undefined {
  const d = airportDestination(code);
  return d ? { id: newId(), kind: 'luogo', destinationId: d.id, name: d.name, lat: d.lat, lng: d.lng, nights: 0, notes: '', weatherPlanB: '' } : undefined;
}

function airportIssue(id: 'airport_first' | 'airport_last', code: string, s: Stop | undefined): FlightIssue {
  const name = airportLabel(code);
  const where = id === 'airport_first' ? 'prima' : 'ultima';
  const known = Boolean(airportDestination(code));
  const replaceable = s && s.nights === 0 && findDestination(s.destinationId)?.category === 'aeroporti';
  return {
    id,
    key: `${id}:${code}:${s?.id ?? ''}`,
    text: s ? `Il volo ${id === 'airport_first' ? 'arriva a' : 'parte da'} ${name}, ma la ${where} tappa è ${s.name}.` : `Il percorso è vuoto: ${name} può essere la ${where} tappa.`,
    options: [
      ...(replaceable ? [{ id: 'sostituisci', label: `Sostituisci ${s.name} con ${name}`, disabled: known ? undefined : 'Aeroporto non presente nel catalogo' }] : []),
      { id: 'aggiungi', label: `Aggiungi ${name} come ${where} tappa, senza notti`, disabled: known ? undefined : 'Aeroporto non presente nel catalogo: aggiungilo a mano come tappa' },
      { id: KEEP, label: 'Lascia il percorso com\'è' },
    ],
  };
}

function nearestLeg(trip: Trip, f: Flight): Leg | undefined {
  const airports = norwayAirports();
  const a = airports.find((x) => x.code === f.fromAirport.trim().toUpperCase());
  const b = airports.find((x) => x.code === f.toAirport.trim().toUpperCase());
  if (!a || !b) return trip.legs[0];
  let best: { leg: Leg; km: number } | undefined;
  for (const leg of trip.legs) {
    const x = trip.stops.find((s) => s.id === leg.fromStopId);
    const y = trip.stops.find((s) => s.id === leg.toStopId);
    if (!x || !y) continue;
    const km = airKm(x, a) + airKm(y, b);
    if (!best || km < best.km) best = { leg, km };
  }
  return best?.leg;
}

export function flightInRoute(trip: Trip, flightId: string): boolean {
  return trip.legs.some((l) => l.segments.some((s) => s.flightId === flightId));
}

/** Domande da fare per portare il volo nel percorso. Non include ciò che l'utente ha già deciso di lasciare così. */
export function flightIssues(trip: Trip, f: Flight): FlightIssue[] {
  const out: FlightIssue[] = [];
  const stops = trip.stops;
  if (f.direction === 'interno') {
    if (flightInRoute(trip, f.id)) return [];
    if (trip.legs.length === 0) return [{ id: 'tratto', key: 'tratto:vuoto', text: 'Per un volo interno servono almeno due tappe nel percorso.', options: [] }];
    const near = nearestLeg(trip, f);
    const name = (id: string) => stops.find((s) => s.id === id)?.name ?? '';
    const ordered = [...trip.legs].sort((a, b) => Number(b.id === near?.id) - Number(a.id === near?.id));
    const legDay = near ? computeDays(trip).find((d) => d.legs.some((l) => l.id === near.id)) : undefined;
    return [
      {
        id: 'tratto',
        key: `tratto:${f.id}`,
        text: `Quale tratto sostituisce il volo ${f.fromAirport} → ${f.toAirport}?`,
        options: [...ordered.map((l) => ({ id: l.id, label: `${name(l.fromStopId)} → ${name(l.toStopId)}` })), { id: KEEP, label: 'Nessuno: lo tengo fuori dal percorso' }],
        note: f.date && legDay && legDay.date !== f.date ? `Il tratto proposto cade il ${formatDateIt(legDay.date)}, il volo è il ${formatDateIt(f.date)}: controlla le notti delle tappe.` : undefined,
      },
    ];
  }
  if (!f.date) out.push({ id: 'no_date', key: 'no_date', text: 'Manca la data del volo.', options: [] });
  if (f.direction === 'andata') {
    if (f.date && f.date !== trip.startDate) {
      out.push({
        id: 'date_start',
        key: `date_start:${f.date}:${trip.startDate}`,
        text: `Il volo è il ${formatDateIt(f.date)}, il viaggio parte il ${formatDateIt(trip.startDate)}.`,
        options: [
          { id: 'sposta', label: `Sposta la partenza al ${formatDateIt(f.date)}: tutte le date seguono` },
          { id: KEEP, label: `Lascia la partenza al ${formatDateIt(trip.startDate)}` },
        ],
      });
    }
    if (!stopIsAirport(stops[0], f.toAirport)) out.push(airportIssue('airport_first', f.toAirport, stops[0]));
  } else {
    if (f.date && stops.length > 0) {
      const end = addDays(trip.startDate, totalNights(stops));
      if (f.date !== end) {
        const delta = Math.round((Date.parse(f.date) - Date.parse(end)) / 86_400_000);
        const n = Math.abs(delta);
        const lastSleep = [...stops].reverse().find((s) => s.kind === 'luogo' && s.nights > 0);
        out.push({
          id: 'date_end',
          key: `date_end:${f.date}:${end}`,
          text: `Il volo è il ${formatDateIt(f.date)}, ma il percorso finisce il ${formatDateIt(end)}.`,
          options: [
            delta > 0
              ? { id: 'allunga', label: `Aggiungi ${nightsLabel(n)} a ${lastSleep?.name ?? 'una tappa'}`, disabled: lastSleep ? undefined : 'Nessuna tappa con notti' }
              : { id: 'accorcia', label: `Togli ${nightsLabel(n)} dalle tappe più lunghe`, disabled: shaveCapacity(stops) < n ? `Si possono togliere solo ${nightsLabel(shaveCapacity(stops))} senza eliminare tappe` : undefined },
            { id: KEEP, label: 'Lascia il percorso com\'è' },
          ],
        });
      }
    }
    if (!stopIsAirport(stops[stops.length - 1], f.fromAirport)) out.push(airportIssue('airport_last', f.fromAirport, stops[stops.length - 1]));
  }
  return out;
}

/** Volo da portare ancora nel percorso: restano domande a cui l'utente non ha risposto. */
export function flightPending(trip: Trip, f: Flight): boolean {
  const kept = new Set(f.keptIssues ?? []);
  return flightIssues(trip, f).some((i) => !kept.has(i.key));
}

function flightSegment(f: Flight): Segment {
  const [dh, dm] = (f.departureTime ?? '').split(':').map(Number);
  const [ah, am] = (f.arrivalTime ?? '').split(':').map(Number);
  const minutes = f.departureTime && f.arrivalTime ? (ah! - dh!) * 60 + (am! - dm!) : undefined;
  return {
    id: newId(),
    mode: 'aereo',
    label: `Volo ${f.fromAirport} → ${f.toAirport}`,
    // Oltre la mezzanotte non si deduce: la durata resta da inserire
    durationMin: minutes !== undefined && minutes > 0 ? minutes : undefined,
    departureTime: f.departureTime,
    status: f.priceStatus === 'prenotato' || f.priceStatus === 'pagato' ? 'confermato' : 'da_verificare',
    costStatus: f.priceStatus,
    flightId: f.id,
    source: f.source,
    note: 'Il costo è conteggiato dalla sezione Voli. Trasferimenti da e per gli aeroporti non inclusi.',
  };
}

/** Applica le risposte alle domande (`scelte`: id domanda → id opzione). Il volo entra nel budget del viaggio. */
export function placeFlight(trip: Trip, f: Flight, scelte: Record<string, string>): Trip {
  const issues = flightIssues(trip, f);
  let t: Trip = { ...trip };
  let stops = trip.stops.map((s) => ({ ...s }));
  const kept = new Set(f.keptIssues ?? []);
  for (const i of issues) {
    const c = scelte[i.id] ?? (i.options.length > 0 ? i.options[0]!.id : undefined);
    if (c === undefined) continue;
    if (c === KEEP) {
      kept.add(i.key);
    } else if (i.id === 'date_start') {
      t = { ...t, startDate: f.date!, dateTentative: f.priceStatus === 'prenotato' || f.priceStatus === 'pagato' ? false : t.dateTentative };
    } else if (i.id === 'airport_first' || i.id === 'airport_last') {
      const st = airportStopFor(i.id === 'airport_first' ? f.toAirport : f.fromAirport);
      if (st) {
        if (i.id === 'airport_first') stops = c === 'sostituisci' ? [st, ...stops.slice(1)] : [st, ...stops];
        else stops = c === 'sostituisci' ? [...stops.slice(0, -1), st] : [...stops, st];
      }
    } else if (i.id === 'date_end') {
      const end = addDays(t.startDate, totalNights(stops));
      const n = Math.abs(Math.round((Date.parse(f.date!) - Date.parse(end)) / 86_400_000));
      if (c === 'allunga') {
        const last = [...stops].reverse().find((s) => s.kind === 'luogo' && s.nights > 0);
        if (last) last.nights += n;
      } else if (c === 'accorcia') {
        shaveNights(stops, n, () => true);
      }
    } else if (i.id === 'tratto') {
      t = { ...t, legs: t.legs.map((l) => (l.id === c ? { ...l, segments: [flightSegment(f)] } : l)) };
    }
  }
  return {
    ...t,
    stops,
    legs: syncLegs(stops, t.legs),
    accommodations: unlinkRemoved(t, stops),
    flights: (t.flights ?? []).map((x) => (x.id === f.id ? { ...f, selected: true, keptIssues: kept.size ? [...kept] : undefined } : x)),
  };
}

/** Toglie dal percorso i tratti aerei di un volo. Le tappe restano: sono del percorso. */
export function removeFlightFromRoute(trip: Trip, flightId: string): Trip {
  return { ...trip, legs: refillEmpty(trip.legs.map((l) => ({ ...l, segments: l.segments.filter((s) => s.flightId !== flightId) }))) };
}

// ---------- Cosa manca e anteprima ----------

export interface PendingPlacements {
  cruises: CoastalOption[];
  flights: Flight[];
}

/** Scelti (inclusi nel budget) ma non ancora nel percorso. Le alternative non contano. */
export function pendingPlacements(trip: Trip): PendingPlacements {
  return {
    cruises: trip.coastalOptions.filter((o) => o.selected && !cruiseInRoute(trip, o.id)),
    flights: (trip.flights ?? []).filter((f) => f.selected && flightPending(trip, f)),
  };
}

export interface RouteRow {
  name: string;
  nights: number;
  kind: Stop['kind'];
  change: 'uguale' | 'nuova' | 'cambiata';
  /** Notti prima della modifica */
  fromNights?: number;
}

export interface RouteDiff {
  rows: RouteRow[];
  removed: { name: string; nights: number }[];
  daysBefore: number;
  daysAfter: number;
  startBefore: string;
  startAfter: string;
  /** Tratti stradali nuovi ancora da calcolare */
  toCalculate: number;
  warnings: string[];
}

/** Differenze tra il percorso attuale e quello proposto, per l'anteprima prima/dopo. */
export function routeDiff(before: Trip, after: Trip): RouteDiff {
  const old = new Map(before.stops.map((s) => [s.id, s]));
  const stillThere = new Set(after.stops.map((s) => s.id));
  const rows: RouteRow[] = after.stops.map((s) => {
    const o = old.get(s.id);
    if (!o) {
      // Seconda parte di una tappa spezzata: è nuova solo come posizione
      return { name: s.name, nights: s.nights, kind: s.kind, change: 'nuova' };
    }
    return { name: s.name, nights: s.nights, kind: s.kind, change: o.nights === s.nights ? 'uguale' : 'cambiata', fromNights: o.nights === s.nights ? undefined : o.nights };
  });
  const removed = before.stops.filter((s) => !stillThere.has(s.id)).map((s) => ({ name: s.name, nights: s.nights }));
  const daysAfter = totalDays(after.stops);
  const warnings: string[] = [];
  if (daysAfter > TRIP_MAX_DAYS) warnings.push(`Il viaggio arriva a ${daysAfter} giorni, oltre l'obiettivo di ${TRIP_MAX_DAYS}.`);
  else if (daysAfter > 0 && daysAfter < TRIP_MIN_DAYS && totalDays(before.stops) >= TRIP_MIN_DAYS) warnings.push(`Il viaggio scende a ${daysAfter} giorni, sotto l'obiettivo di ${TRIP_MIN_DAYS}.`);
  return {
    rows,
    removed,
    daysBefore: totalDays(before.stops),
    daysAfter,
    startBefore: before.startDate,
    startAfter: after.startDate,
    toCalculate: after.legs.filter((l) => isRoutableLeg(l, after.stops) && legTotals(l, after.settings).hasUncalculated && !before.legs.some((b) => b.id === l.id)).length,
    warnings,
  };
}

// ---------- Mete ----------

/** Inserisce una nuova tappa nella posizione scelta: il viaggio si allunga delle sue notti. */
export function insertStop(trip: Trip, stop: Stop, index: number): Trip {
  const i = Math.max(0, Math.min(index, trip.stops.length));
  const stops = [...trip.stops.slice(0, i), stop, ...trip.stops.slice(i)];
  return { ...trip, stops, legs: syncLegs(stops, trip.legs) };
}
