import { useMemo, useState } from 'react';
import { BOOKING_GROUP_LABEL, BOOKING_STATE_LABEL, bookingsOverview, type BookingGroup, type BookingRow, type BookingState } from '../domain/bookings';
import { INFO_STATE_LABEL, recheckDays, type InfoState } from '../domain/verification';
import { parseRoute } from '../state/route';
import { useTrip } from '../state/store';
import { Badge, Empty } from './common';
import { Icon, type IconName } from './icons';
import { NextStepCard } from './NextStep';
import { InfoBadge, SourceLine } from './Verification';

const GROUPS: { id: BookingGroup; icon: IconName; href: string; manage: string }[] = [
  { id: 'voli', icon: 'plane', href: '#/voli', manage: 'Cerca e gestisci i voli' },
  { id: 'trasporti', icon: 'ship', href: '#/crociere', manage: 'Gestisci le crociere' },
  { id: 'alloggi', icon: 'bed', href: '#/hytte', manage: 'Cerca e confronta gli alloggi' },
];

const BOOKING_TONE: Record<BookingState, 'ok' | 'info' | 'warn' | 'neutral'> = { prenotato: 'ok', opzionato: 'info', individuato: 'neutral', da_cercare: 'warn', annullato: 'warn', non_prenotato: 'neutral' };
const BOOKING_ICON: Record<BookingState, IconName> = { prenotato: 'check', opzionato: 'progress', individuato: 'circle', da_cercare: 'circle', annullato: 'close', non_prenotato: 'circle' };
const BOOKING_FILTERS: BookingState[] = ['da_cercare', 'individuato', 'opzionato', 'prenotato', 'annullato', 'non_prenotato'];
const INFO_FILTERS: InfoState[] = ['da_verificare', 'da_ricontrollare', 'verificata'];
type InfoFilter = InfoState | 'da_fare';

/** Riepilogo unico di voli, trasporti e alloggi: due colonne di stato, prenotazione e verifica, mai mescolate. */
export function BookingsView() {
  const { trip } = useTrip();
  const o = useMemo(() => bookingsOverview(trip), [trip]);
  const [booking, setBooking] = useState<BookingState | undefined>();
  // «Apri le verifiche» dal prossimo passo arriva qui con il filtro già impostato
  const [info, setInfo] = useState<InfoFilter | undefined>(() => (parseRoute(window.location.hash).params.verifica === 'da_fare' ? 'da_fare' : undefined));

  if (trip.stops.length === 0 && o.rows.length === 0) {
    return (
      <Empty title="Ancora nulla da prenotare">
        Voli e alloggi dipendono dal percorso: <a href="#/pianifica">costruisci prima l'itinerario</a>.
      </Empty>
    );
  }
  const matchInfo = (r: BookingRow) => !info || (info === 'da_fare' ? r.info !== undefined && r.info.state !== 'verificata' : r.info?.state === info);
  const rows = o.rows.filter((r) => (!booking || r.booking === booking) && matchInfo(r));
  const filtered = Boolean(booking || info);

  return (
    <div className="bookings">
      <NextStepCard compact />

      <div className="bk-legend small">
        <p>
          <strong>Prenotazione</strong>: che cosa risulta prenotato secondo quello che hai inserito. L'app non prenota.
        </p>
        <p>
          <strong>Verifica</strong>: orari e disponibilità controllati sulla fonte, con la data. <em>Verificata non vuol dire prenotata.</em> Dopo {recheckDays(trip.settings)} giorni una verifica va ricontrollata
          (si cambia in Impostazioni).
        </p>
      </div>

      <div className="bk-filters" role="group" aria-label="Filtra per prenotazione">
        <span className="bk-filter-label small">Prenotazione</span>
        <button type="button" className={`bk-filter ${booking ? '' : 'active'}`} aria-pressed={!booking} onClick={() => setBooking(undefined)}>
          Tutte <strong>{o.rows.length}</strong>
        </button>
        {BOOKING_FILTERS.filter((s) => o.bookingCounts[s] > 0 || booking === s).map((s) => (
          <button key={s} type="button" className={`bk-filter ${booking === s ? 'active' : ''}`} aria-pressed={booking === s} onClick={() => setBooking(booking === s ? undefined : s)}>
            <Icon name={BOOKING_ICON[s]} /> {BOOKING_STATE_LABEL[s]} <strong>{o.bookingCounts[s]}</strong>
          </button>
        ))}
      </div>
      <div className="bk-filters" role="group" aria-label="Filtra per verifica">
        <span className="bk-filter-label small">Verifica</span>
        <button type="button" className={`bk-filter ${info ? '' : 'active'}`} aria-pressed={!info} onClick={() => setInfo(undefined)}>
          Tutte
        </button>
        <button type="button" className={`bk-filter ${info === 'da_fare' ? 'active' : ''}`} aria-pressed={info === 'da_fare'} onClick={() => setInfo(info === 'da_fare' ? undefined : 'da_fare')}>
          Da fare <strong>{o.infoCounts.da_verificare + o.infoCounts.da_ricontrollare}</strong>
        </button>
        {INFO_FILTERS.map((s) => (
          <button key={s} type="button" className={`bk-filter ${info === s ? 'active' : ''}`} aria-pressed={info === s} onClick={() => setInfo(info === s ? undefined : s)}>
            {INFO_STATE_LABEL[s]} <strong>{o.infoCounts[s]}</strong>
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">
        {rows.length} elementi mostrati
      </p>

      {GROUPS.map((g) => {
        const list = rows.filter((r) => r.group === g.id);
        return (
          <section key={g.id} className="panel" aria-labelledby={`bk-${g.id}`}>
            <header className="panel-head">
              <h2 id={`bk-${g.id}`}>
                <Icon name={g.icon} /> {BOOKING_GROUP_LABEL[g.id]}
              </h2>
              <a href={g.href} className="small">
                {g.manage}
              </a>
            </header>
            {list.length === 0 ? (
              <p className="muted small">{filtered ? 'Nessun elemento con questi filtri.' : 'Nessun elemento.'}</p>
            ) : (
              <ul className="bk-rows">
                {list.map((r) => (
                  <li key={r.id} className={`bk-row bk-${r.booking}`}>
                    <div>
                      <strong>{r.title}</strong>
                      <span className="small muted block">{r.detail}</span>
                      {r.info && <SourceLine info={r.info} />}
                      {r.todo && <span className="small block bk-todo">{r.todo}</span>}
                    </div>
                    <div className="bk-row-side">
                      <Badge tone={BOOKING_TONE[r.booking]}>
                        <Icon name={BOOKING_ICON[r.booking]} /> {BOOKING_STATE_LABEL[r.booking]}
                      </Badge>
                      {r.info && <InfoBadge info={r.info} what={r.group === 'alloggi' ? 'Disponibilità' : 'Orario'} />}
                      <a className="btn btn-small" href={r.href} aria-label={`${r.cta}: ${r.title}`}>
                        {r.cta}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
      <p className="muted small">I link di ricerca esterni (Booking, Airbnb, siti degli operatori) aprono una ricerca: non sono una conferma di disponibilità né una prenotazione.</p>
    </div>
  );
}
