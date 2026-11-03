import { activityState, stopState } from './actuals';
import { computeDays, formatDateIt, legTotals, type DayInfo } from './itinerary';
import type { Accommodation, Activity, DataStatus, Leg, Stop, Trip } from './types';

// Schermata «Oggi»: solo lettura del piano e dello stato effettivo. La data non cambia mai il piano.

export type TripPhase = 'vuoto' | 'prima' | 'durante' | 'dopo';

export function tripPhase(trip: Trip, today: string): TripPhase {
  const days = computeDays(trip);
  if (days.length === 0) return 'vuoto';
  if (today < days[0]!.date) return 'prima';
  return today > days[days.length - 1]!.date ? 'dopo' : 'durante';
}

/** Giorno da mostrare all'apertura: quello di oggi durante il viaggio, altrimenti il primo come anteprima. */
export function defaultDayIndex(trip: Trip, today: string): number {
  const i = computeDays(trip).findIndex((d) => d.date === today);
  return i >= 0 ? i : 0;
}

export interface LegInfo {
  leg: Leg;
  from: string;
  to: string;
  uncalculated: boolean;
  partial: boolean;
  theoreticalMin: number;
  realisticMin: number;
}

export interface BookingInfo {
  kind: 'volo' | 'crociera' | 'alloggio' | 'trasporto';
  text: string;
  /** Stato commerciale o di affidabilità del dato: mai dedotto */
  status: DataStatus | Accommodation['status'];
}

export interface NextThing {
  kind: 'attivita' | 'tappa';
  title: string;
  activity?: Activity;
  stop?: Stop;
}

export interface TodayView {
  day: DayInfo;
  index: number;
  total: number;
  place?: Stop;
  sleep?: Stop;
  accommodation?: Accommodation;
  transfers: LegInfo[];
  activities: { activity: Activity; state: ReturnType<typeof activityState> }[];
  next?: NextThing;
  bookings: BookingInfo[];
  notes: string;
  planB: string[];
}

export function todayView(trip: Trip, index: number): TodayView | undefined {
  const days = computeDays(trip);
  const day = days[Math.max(0, Math.min(index, days.length - 1))];
  if (!day) return undefined;
  const sleep = day.sleepStop;
  const place = sleep ?? day.wakeStop;
  const accommodation = sleep?.accommodationId ? trip.accommodations.find((a) => a.id === sleep.accommodationId) : undefined;
  const name = (id: string) => trip.stops.find((s) => s.id === id)?.name ?? '';
  const transfers = day.legs.map((leg) => {
    const t = legTotals(leg, trip.settings);
    return { leg, from: name(leg.fromStopId), to: name(leg.toStopId), uncalculated: t.hasUncalculated, partial: t.partial, theoreticalMin: t.travelMin + t.waitMin, realisticMin: t.realisticMin };
  });
  const plan = trip.days[day.key];
  const activities = (plan?.activities ?? []).map((activity) => ({ activity, state: activityState(trip, activity.id) }));
  const firstOpen = activities.find((a) => a.state === 'da_fare');
  const next: NextThing | undefined = firstOpen
    ? { kind: 'attivita', title: firstOpen.activity.title || 'Attività', activity: firstOpen.activity }
    : place && !['visitata', 'saltata'].includes(stopState(trip, place.id))
      ? { kind: 'tappa', title: place.name, stop: place }
      : undefined;

  const bookings: BookingInfo[] = [];
  for (const f of trip.flights ?? []) {
    if (f.date === day.date && f.selected) {
      bookings.push({ kind: 'volo', text: `Volo ${f.fromAirport} → ${f.toAirport}${f.departureTime ? ` · ${f.departureTime}` : ' · orario da inserire'}${f.flightNumber ? ` · ${f.flightNumber}` : ''}`, status: f.priceStatus });
    }
  }
  for (const o of trip.coastalOptions) {
    if (o.date === day.date && o.selected) bookings.push({ kind: 'crociera', text: `${o.operator} ${o.fromPort} → ${o.toPort}${o.departureTime ? ` · ${o.departureTime}` : ' · orario da verificare'}`, status: o.priceStatus });
  }
  for (const t of transfers) {
    for (const s of t.leg.segments) {
      if (['traghetto', 'treno', 'bus'].includes(s.mode)) bookings.push({ kind: 'trasporto', text: `${s.label}${s.departureTime ? ` · ${s.departureTime}` : ' · orario da verificare'}`, status: s.status });
    }
  }
  if (accommodation) bookings.push({ kind: 'alloggio', text: `${accommodation.name} (${sleep!.name})`, status: accommodation.status });

  return {
    day,
    index: day.index,
    total: days.length,
    place,
    sleep,
    accommodation,
    transfers,
    activities,
    next,
    bookings,
    notes: plan?.notes ?? '',
    planB: [plan?.planB, place?.weatherPlanB].filter((x): x is string => Boolean(x && x.trim())),
  };
}

export function phaseNote(trip: Trip, today: string): string | undefined {
  const days = computeDays(trip);
  switch (tripPhase(trip, today)) {
    case 'prima':
      return `Anteprima: il viaggio inizia il ${formatDateIt(days[0]!.date)}${trip.dateTentative ? ' (data provvisoria)' : ''}.`;
    case 'dopo':
      return 'Il viaggio è terminato: stai rivedendo il piano.';
    default:
      return undefined;
  }
}
