import { tripTitle } from './tripTitle';
import { ACCOMMODATION_STATUS_LABEL, BOOKING_STATE_LABEL, bookingsOverview } from './bookings';
import { DAY_STATE_LABEL, dayTransfers, missingText, TIMING_LABEL } from './dayTransfer';
import { addDays, computeDays, formatDateIt, formatDuration, totalDays } from './itinerary';
import type { Trip } from './types';
import { accommodationInfo, INFO_STATE_LABEL } from './verification';
import { visibleDiary } from './actuals';
import { DESTINATIONS } from '../data/destinations';

// Riepilogo del viaggio in sezioni di testo: la stessa base per il PDF e per il pacchetto offline.
// Contiene solo dati del viaggio aperto, così come sono stati inseriti: nessuna informazione inventata.

export interface SummaryItem {
  title: string;
  lines: string[];
}
export interface SummarySection {
  id: 'viaggio' | 'giornate' | 'tappe' | 'alloggi' | 'prenotazioni' | 'note' | 'diario';
  heading: string;
  items: SummaryItem[];
  /** Testo al posto degli elementi quando la sezione è vuota */
  empty?: string;
}
export interface TripSummary {
  title: string;
  subtitle: string;
  generatedAt: string;
  sections: SummarySection[];
}

export interface SummaryOptions {
  /** Diario incluso solo se l'utente lo sceglie */
  diary?: boolean;
  now?: Date;
}

const coord = (n: number) => (Number.isFinite(n) ? n.toFixed(5) : '—');
export const hasCoords = (p: { lat?: number; lng?: number }) =>
  typeof p.lat === 'number' && typeof p.lng === 'number' && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;

export function tripSummary(trip: Trip, opts: SummaryOptions = {}): TripSummary {
  const now = opts.now ?? new Date();
  const n = totalDays(trip.stops);
  const days = computeDays(trip);
  const transfers = dayTransfers(trip, days);
  const people = `${trip.participants.adults} adulti, ${trip.participants.childrenAges.length} bambini${trip.participants.childrenAges.length ? ` (${trip.participants.childrenAges.join(' e ')} anni)` : ''}`;
  const period = n > 0 ? `${formatDateIt(trip.startDate)} → ${formatDateIt(addDays(trip.startDate, n - 1))} · ${n} giorni${trip.dateTentative ? ' · date provvisorie' : ''}` : 'Itinerario ancora vuoto';
  const sections: SummarySection[] = [];

  sections.push({
    id: 'viaggio',
    heading: 'Il viaggio',
    items: [{ title: tripTitle(trip), lines: [period, people, `Dati aggiornati al ${new Date(trip.updatedAt).toLocaleString('it-IT')}`] }],
  });

  sections.push({
    id: 'giornate',
    heading: 'Giornate',
    empty: 'Nessuna giornata: aggiungi le tappe nell’itinerario.',
    items: days.map((d, i) => {
      const t = transfers[i]!;
      const plan = trip.days[d.key];
      const acc = d.sleepStop ? trip.accommodations.find((a) => a.id === d.sleepStop!.accommodationId) : undefined;
      const lines: string[] = [];
      for (const l of t.legs) {
        lines.push(`Trasferimento ${l.from} → ${l.to}: ${l.missing ? `tempo non disponibile (${l.reason})` : `circa ${formatDuration(l.knownMin)} · ${TIMING_LABEL[l.kind].toLowerCase()}`}`);
      }
      if (t.state === 'oltre' || t.state === 'non_verificabile') lines.push(`${DAY_STATE_LABEL[t.state]} (limite ${formatDuration(t.limitMin)})${t.missing.length ? ` · manca: ${missingText(t.missing)}` : ''}`);
      for (const l of d.legs) {
        for (const s of l.segments) if (s.mode !== 'strada' && s.mode !== 'non_calcolato') lines.push(`${s.label}${s.departureTime ? ` · ore ${s.departureTime}` : ' · orario non inserito'}`);
      }
      for (const f of trip.flights ?? []) if (f.selected && f.date === d.date) lines.push(`Volo ${f.fromAirport} → ${f.toAirport}${f.departureTime ? ` · ore ${f.departureTime}` : ' · orario non inserito'}${f.flightNumber ? ` · ${f.airline} ${f.flightNumber}` : ''}`);
      for (const a of plan?.activities ?? []) lines.push(`Attività: ${a.title || 'senza titolo'}`);
      if (plan?.notes) lines.push(`Note: ${plan.notes}`);
      if (plan?.planB) lines.push(`Piano B: ${plan.planB}`);
      lines.push(d.sleepStop ? `Notte: ${d.sleepStop.kind === 'a_bordo' ? 'a bordo della nave' : `${d.sleepStop.name}${acc ? ` · ${acc.name} (${ACCOMMODATION_STATUS_LABEL[acc.status].toLowerCase()})` : ' · alloggio da scegliere'}`}` : 'Ultimo giorno: nessun pernottamento');
      return { title: `Giorno ${d.index + 1} · ${formatDateIt(d.date)}${(d.sleepStop ?? d.wakeStop) ? ` · ${(d.sleepStop ?? d.wakeStop)!.name}` : ''}`, lines };
    }),
  });

  sections.push({
    id: 'tappe',
    heading: 'Tappe e coordinate',
    empty: 'Nessuna tappa.',
    items: trip.stops.map((s, i) => ({
      title: `${i + 1}. ${s.name}`,
      lines: [
        s.nights === 0 ? 'Di passaggio, senza notti' : `${s.nights} ${s.nights === 1 ? 'notte' : 'notti'}${s.kind === 'a_bordo' ? ' a bordo' : ''}`,
        hasCoords(s) ? `Coordinate: ${coord(s.lat)}, ${coord(s.lng)}` : 'Coordinate non disponibili',
        ...(s.ideas?.length ? [`Idee salvate (non pianificate): ${s.ideas.map((id) => DESTINATIONS.find((d) => d.id === id)?.name ?? id).join(', ')}`] : []),
        ...(s.notes ? [`Note: ${s.notes}`] : []),
        ...(s.weatherPlanB ? [`In caso di maltempo: ${s.weatherPlanB}`] : []),
      ],
    })),
  });

  const sleepStops = trip.stops.filter((s) => s.kind === 'luogo' && s.nights > 0);
  sections.push({
    id: 'alloggi',
    heading: 'Alloggi',
    empty: 'Nessuna tappa con pernottamento.',
    items: sleepStops.map((s) => {
      const a = trip.accommodations.find((x) => x.id === s.accommodationId);
      if (!a) return { title: s.name, lines: ['Alloggio non ancora scelto'] };
      const info = accommodationInfo(a, trip.settings, now);
      return {
        title: `${s.name} · ${a.name}`,
        lines: [
          `Prenotazione: ${ACCOMMODATION_STATUS_LABEL[a.status]} · disponibilità: ${INFO_STATE_LABEL[info.state].toLowerCase()}`,
          ...(a.address ? [`Indirizzo: ${a.address}`] : []),
          ...(a.phone ? [`Telefono: ${a.phone}`] : []),
          ...(hasCoords(a) ? [`Coordinate: ${coord(a.lat!)}, ${coord(a.lng!)}`] : []),
          ...(a.url ? [`Link: ${a.url}`] : []),
          ...(a.cancellation ? [`Cancellazione: ${a.cancellation}`] : []),
          ...(a.notes ? [`Note: ${a.notes}`] : []),
        ],
      };
    }),
  });

  const bk = bookingsOverview(trip, now);
  sections.push({
    id: 'prenotazioni',
    heading: 'Prenotazioni e verifiche',
    empty: 'Nessun volo, trasporto o alloggio inserito.',
    items: bk.rows.map((r) => ({
      title: r.title,
      lines: [r.detail, `Prenotazione: ${BOOKING_STATE_LABEL[r.booking]}${r.info ? ` · informazione: ${INFO_STATE_LABEL[r.info.state].toLowerCase()} (${r.info.why})` : ''}`, ...(r.info?.source?.url ? [`Fonte: ${r.info.source.url}`] : [])],
    })),
  });

  sections.push({
    id: 'note',
    heading: 'Numeri utili e note di viaggio',
    empty: 'Nessuna nota: puoi scriverle in Impostazioni › Esportazioni.',
    items: trip.usefulInfo?.trim() ? [{ title: 'Note', lines: trip.usefulInfo.trim().split(/\r?\n/) }] : [],
  });

  if (opts.diary) {
    sections.push({
      id: 'diario',
      heading: 'Diario',
      empty: 'Nessuna voce nel diario.',
      items: visibleDiary(trip).map((e) => ({ title: `${e.localDate} ${e.localTime}${e.stopName ? ` · ${e.stopName}` : ''}`, lines: e.text ? e.text.split(/\r?\n/) : ['(solo allegati, non inclusi)'] })),
    });
  }

  return { title: tripTitle(trip), subtitle: `${period} · ${people}`, generatedAt: now.toISOString(), sections };
}
