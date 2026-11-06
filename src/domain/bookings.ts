import { computeDays, formatDateIt } from './itinerary';
import { pendingPlacements } from './placement';
import type { AccommodationStatus, DataStatus, ID, Trip } from './types';
import { accommodationInfo, coastalInfo, flightInfo, segmentInfo, type InfoState, type InfoStatus } from './verification';

// Prenotazioni: un solo elenco di voli, trasporti e alloggi con due informazioni distinte per ogni elemento:
// - stato di prenotazione: che cosa risulta prenotato (lo dice l'utente, l'app non prenota);
// - verifica dell'informazione: orari e disponibilità controllati sulla fonte, con data. Verificato non è prenotato.

export type BookingState = 'da_cercare' | 'individuato' | 'opzionato' | 'prenotato' | 'annullato' | 'non_prenotato';

export const BOOKING_STATE_LABEL: Record<BookingState, string> = {
  da_cercare: 'Da cercare',
  individuato: 'Individuato, non prenotato',
  opzionato: 'Opzionato',
  prenotato: 'Prenotato',
  annullato: 'Annullato',
  non_prenotato: 'Non prenotato',
};

/** Etichette dello stato di prenotazione degli alloggi, uguali in tutte le schermate. */
export const ACCOMMODATION_STATUS_LABEL: Record<AccommodationStatus, string> = {
  individuata: 'Individuata, non prenotata',
  disponibile: 'Individuata, non prenotata',
  opzionata: 'Opzionata',
  prenotata: 'Prenotata',
  annullata: 'Annullata',
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
  booking: BookingState;
  /** Verifica dell'informazione, se l'elemento ha informazioni che cambiano */
  info?: InfoStatus;
  /** Che cosa fare, se c'è qualcosa da fare */
  todo?: string;
  /** Dove si gestisce l'elemento */
  href: string;
  cta: string;
}

export interface BookingsOverview {
  rows: BookingRow[];
  bookingCounts: Record<BookingState, number>;
  infoCounts: Record<InfoState, number>;
}

const isPaid = (s: DataStatus) => s === 'prenotato' || s === 'pagato';

export function accommodationBooking(status: AccommodationStatus): BookingState {
  if (status === 'prenotata') return 'prenotato';
  if (status === 'opzionata') return 'opzionato';
  if (status === 'annullata') return 'annullato';
  return 'individuato';
}

export function bookingsOverview(trip: Trip, now = new Date()): BookingsOverview {
  const rows: BookingRow[] = [];
  const nameOf = (id: ID) => trip.stops.find((s) => s.id === id)?.name ?? '—';
  const st = trip.settings;

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
        booking: 'da_cercare',
        todo: alternatives > 0 ? 'Scegli quale volo tenere' : 'Cerca e inserisci il volo',
        href: '#/voli',
        cta: 'Apri i voli',
      });
    }
  }
  for (const f of flights) {
    const booking: BookingState = f.selected && isPaid(f.priceStatus) ? 'prenotato' : 'individuato';
    const info = flightInfo(f, st, now);
    rows.push({
      id: `volo-${f.id}`,
      group: 'voli',
      title: `${f.fromAirport || '—'} → ${f.toAirport || '—'}`,
      detail: [f.date ? formatDateIt(f.date) : 'data da inserire', f.airline, f.selected ? 'scelto' : 'alternativa'].filter(Boolean).join(' · '),
      booking,
      info,
      todo: booking === 'prenotato' ? undefined : info.state !== 'verificata' ? 'Verifica orario e prezzo sul sito della compagnia' : f.selected ? 'Da prenotare con la compagnia' : undefined,
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
      booking: isPaid(o.priceStatus) ? 'prenotato' : 'individuato',
      info: coastalInfo(o, st, now),
      todo: 'Aggiungila al percorso',
      href: '#/crociere',
      cta: 'Apri le crociere',
    });
  }
  for (const leg of trip.legs) {
    const route = `${nameOf(leg.fromStopId)} → ${nameOf(leg.toStopId)}`;
    const touchesShip = trip.stops.some((s) => s.kind === 'a_bordo' && (s.id === leg.fromStopId || s.id === leg.toStopId));
    if (touchesShip && leg.segments.every((s) => s.mode === 'non_calcolato')) {
      rows.push({ id: `nave-${leg.id}`, group: 'trasporti', title: route, detail: 'Tratto con notte a bordo, senza nave collegata', booking: 'da_cercare', todo: 'Scegli la nave e collegala al percorso', href: '#/crociere', cta: 'Apri le crociere' });
    }
    for (const s of leg.segments) {
      if (s.flightId) continue;
      const info = segmentInfo(s, st, now);
      if (!info) continue;
      const booking: BookingState = isPaid(s.costStatus) || isPaid(s.status) ? 'prenotato' : 'non_prenotato';
      rows.push({
        id: `tratto-${s.id}`,
        group: 'trasporti',
        title: s.label,
        detail: `${route}${s.departureTime ? ` · ore ${s.departureTime}` : ''}`,
        booking,
        info,
        todo: info.state === 'da_verificare' ? "Verifica l'orario sul sito dell'operatore" : info.state === 'da_ricontrollare' ? "Ricontrolla l'orario: la verifica è vecchia" : undefined,
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
    if (!a || a.status === 'annullata') {
      const candidates = trip.accommodations.filter((x) => x.stopId === s.id).length;
      rows.push({
        id: `alloggio-${s.id}`,
        group: 'alloggi',
        title: s.name,
        detail: a ? `${when} · ${a.name}` : candidates > 0 ? `${when} · ${candidates} ${candidates === 1 ? 'candidata' : 'candidate'}, nessuna scelta` : when,
        booking: a ? 'annullato' : 'da_cercare',
        todo: a ? 'Prenotazione annullata: cerca un altro alloggio' : candidates > 0 ? 'Confronta e scegli' : 'Cerca un alloggio',
        href: candidates > 0 && !a ? href : `${href}&cerca=1`,
        cta: candidates > 0 && !a ? 'Confronta' : 'Cerca',
      });
      continue;
    }
    const booking = accommodationBooking(a.status);
    const info = accommodationInfo(a, st, now);
    rows.push({
      id: `alloggio-${s.id}`,
      group: 'alloggi',
      title: s.name,
      detail: `${when} · ${a.name}`,
      booking,
      info,
      todo:
        booking === 'prenotato'
            ? a.pricePerNight
              ? undefined
              : 'Prezzo da inserire'
            : info.state !== 'verificata'
              ? 'Verifica la disponibilità sul sito del fornitore'
              : 'Disponibilità verificata: da prenotare con il fornitore',
      href,
      cta: 'Apri',
    });
  }

  const bookingCounts: Record<BookingState, number> = { da_cercare: 0, individuato: 0, opzionato: 0, prenotato: 0, annullato: 0, non_prenotato: 0 };
  const infoCounts: Record<InfoState, number> = { da_verificare: 0, verificata: 0, da_ricontrollare: 0 };
  for (const r of rows) {
    bookingCounts[r.booking] += 1;
    if (r.info) infoCounts[r.info.state] += 1;
  }
  return { rows, bookingCounts, infoCounts };
}
