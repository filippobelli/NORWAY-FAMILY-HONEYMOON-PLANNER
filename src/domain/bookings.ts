import { computeDays, formatDateIt } from './itinerary';
import { pendingPlacements } from './placement';
import type { DataStatus, ID, Trip } from './types';

// Prenotazioni: un solo elenco di voli, trasporti e alloggi, con uno stato leggibile per ogni elemento.
// Tutto è derivato dal documento Trip: lo stato dice che cosa risulta inserito, mai che cosa è davvero disponibile.

export type BookingState = 'prenotato' | 'opzionato' | 'da_verificare' | 'da_completare';

export const BOOKING_STATE_LABEL: Record<BookingState, string> = {
  prenotato: 'Prenotato',
  opzionato: 'Opzionato o individuato',
  da_verificare: 'Da verificare',
  da_completare: 'Da completare',
};

export type BookingGroup = 'voli' | 'trasporti' | 'alloggi';

export const BOOKING_GROUP_LABEL: Record<BookingGroup, string> = {
  voli: 'Voli',
  trasporti: 'Navi, traghetti e altri trasporti',
  alloggi: 'Alloggi',
};

export interface BookingRow {
  id: string;
  group: BookingGroup;
  title: string;
  detail: string;
  state: BookingState;
  /** Che cosa fare o sapere, se c'è qualcosa da fare */
  todo?: string;
  /** Dove si gestisce l'elemento */
  href: string;
  cta: string;
}

export interface BookingsOverview {
  rows: BookingRow[];
  counts: Record<BookingState, number>;
  /** Prima cosa da sistemare, nell'ordine in cui conviene farlo */
  first?: BookingRow;
}

/** Stato di un dato inserito: «confermato» vuol dire verificato sulla fonte, non prenotato. */
function fromDataStatus(s: DataStatus): BookingState {
  if (s === 'prenotato' || s === 'pagato') return 'prenotato';
  return s === 'confermato' ? 'opzionato' : 'da_verificare';
}

const STATE_ORDER: BookingState[] = ['da_completare', 'da_verificare', 'opzionato', 'prenotato'];

export function bookingsOverview(trip: Trip): BookingsOverview {
  const rows: BookingRow[] = [];
  const nameOf = (id: ID) => trip.stops.find((s) => s.id === id)?.name ?? '—';

  // Voli: quelli scelti contano, le alternative no. Andata e ritorno mancanti si dicono solo se c'è un percorso
  const flights = trip.flights ?? [];
  const chosen = flights.filter((f) => f.selected);
  if (trip.stops.length > 0) {
    for (const direction of ['andata', 'ritorno'] as const) {
      if (chosen.some((f) => f.direction === direction)) continue;
      const alternatives = flights.filter((f) => f.direction === direction).length;
      rows.push({
        id: `volo-mancante-${direction}`,
        group: 'voli',
        title: `Volo di ${direction}`,
        detail: alternatives > 0 ? `${alternatives} ${alternatives === 1 ? 'alternativa salvata' : 'alternative salvate'}, nessuna scelta` : 'Nessun volo inserito',
        state: 'da_completare',
        todo: alternatives > 0 ? 'Scegli quale volo tenere' : 'Cerca e inserisci il volo',
        href: '#/voli',
        cta: 'Apri i voli',
      });
    }
  }
  for (const f of flights) {
    const state = f.selected ? fromDataStatus(f.priceStatus) : 'opzionato';
    rows.push({
      id: `volo-${f.id}`,
      group: 'voli',
      title: `${f.fromAirport || '—'} → ${f.toAirport || '—'}`,
      detail: [f.date ? formatDateIt(f.date) : 'data da inserire', f.airline, f.selected ? '' : 'alternativa'].filter(Boolean).join(' · '),
      state,
      todo: state === 'da_verificare' ? 'Verifica orario e prezzo sul sito della compagnia' : undefined,
      href: '#/voli',
      cta: 'Apri i voli',
    });
  }

  // Crociere scelte ma non ancora nel percorso, e tratti in nave senza nave collegata
  const pending = pendingPlacements(trip);
  for (const o of pending.cruises) {
    rows.push({
      id: `crociera-${o.id}`,
      group: 'trasporti',
      title: `${o.operator} ${o.fromPort} → ${o.toPort}`,
      detail: 'Scelta ma non ancora nel percorso',
      state: 'da_completare',
      todo: 'Aggiungila al percorso',
      href: '#/crociere',
      cta: 'Apri le crociere',
    });
  }
  for (const leg of trip.legs) {
    const route = `${nameOf(leg.fromStopId)} → ${nameOf(leg.toStopId)}`;
    const touchesShip = trip.stops.some((s) => s.kind === 'a_bordo' && (s.id === leg.fromStopId || s.id === leg.toStopId));
    if (touchesShip && leg.segments.every((s) => s.mode === 'non_calcolato')) {
      rows.push({ id: `nave-${leg.id}`, group: 'trasporti', title: route, detail: 'Tratto con notte a bordo, senza nave collegata', state: 'da_completare', todo: 'Scegli la nave e collegala al percorso', href: '#/crociere', cta: 'Apri le crociere' });
    }
    for (const s of leg.segments) {
      if (s.mode === 'strada' || s.mode === 'non_calcolato' || s.flightId) continue;
      const state = fromDataStatus(s.status);
      rows.push({
        id: `tratto-${s.id}`,
        group: 'trasporti',
        title: s.label,
        detail: `${route}${s.departureTime ? ` · ore ${s.departureTime}` : ''}`,
        state,
        todo: state === 'da_verificare' ? "Verifica orario e stato sul sito dell'operatore" : undefined,
        href: `#/pianifica?sel=leg%3A${encodeURIComponent(leg.id)}`,
        cta: 'Apri il tratto',
      });
    }
  }

  // Alloggi: una riga per ogni tappa in cui si dorme
  const days = computeDays(trip);
  for (const s of trip.stops) {
    if (s.kind !== 'luogo' || s.nights <= 0) continue;
    const a = trip.accommodations.find((x) => x.id === s.accommodationId);
    const checkIn = days.find((d) => d.sleepStop?.id === s.id)?.date;
    const when = `${checkIn ? `Dal ${formatDateIt(checkIn)} · ` : ''}${s.nights} ${s.nights === 1 ? 'notte' : 'notti'}`;
    const href = `#/hytte?tappa=${encodeURIComponent(s.id)}`;
    if (!a) {
      const candidates = trip.accommodations.filter((x) => x.stopId === s.id).length;
      rows.push({
        id: `alloggio-${s.id}`,
        group: 'alloggi',
        title: s.name,
        detail: candidates > 0 ? `${when} · ${candidates} ${candidates === 1 ? 'candidata' : 'candidate'}, nessuna scelta` : when,
        state: 'da_completare',
        todo: candidates > 0 ? 'Confronta e scegli' : 'Cerca un alloggio',
        href,
        cta: candidates > 0 ? 'Confronta' : 'Cerca',
      });
      continue;
    }
    const state: BookingState = a.status === 'prenotata' ? 'prenotato' : a.status === 'individuata' ? 'da_verificare' : 'opzionato';
    rows.push({
      id: `alloggio-${s.id}`,
      group: 'alloggi',
      title: s.name,
      detail: `${when} · ${a.name}`,
      state,
      todo: state === 'da_verificare' ? 'Verifica la disponibilità sul sito del fornitore' : a.pricePerNight ? undefined : 'Prezzo da inserire',
      href,
      cta: 'Apri',
    });
  }

  const counts: Record<BookingState, number> = { prenotato: 0, opzionato: 0, da_verificare: 0, da_completare: 0 };
  for (const r of rows) counts[r.state] += 1;
  const first = STATE_ORDER.slice(0, 2)
    .map((st) => rows.find((r) => r.state === st))
    .find(Boolean);
  return { rows, counts, first };
}
