import { useMemo, useState } from 'react';
import { BOOKING_GROUP_LABEL, BOOKING_STATE_LABEL, bookingsOverview, type BookingGroup, type BookingState } from '../domain/bookings';
import { useTrip } from '../state/store';
import { Badge, Empty } from './common';
import { Icon, type IconName } from './icons';

const GROUPS: { id: BookingGroup; icon: IconName; href: string; manage: string }[] = [
  { id: 'voli', icon: 'plane', href: '#/voli', manage: 'Cerca e gestisci i voli' },
  { id: 'trasporti', icon: 'ship', href: '#/crociere', manage: 'Gestisci le crociere' },
  { id: 'alloggi', icon: 'bed', href: '#/hytte', manage: 'Cerca e confronta gli alloggi' },
];

const STATE_TONE: Record<BookingState, 'ok' | 'info' | 'warn' | 'neutral'> = { prenotato: 'ok', opzionato: 'info', da_verificare: 'neutral', da_completare: 'warn' };
const STATE_ICON: Record<BookingState, IconName> = { prenotato: 'check', opzionato: 'progress', da_verificare: 'question', da_completare: 'circle' };
const STATES: BookingState[] = ['da_completare', 'da_verificare', 'opzionato', 'prenotato'];

/** Riepilogo unico di voli, trasporti e alloggi. Le schede restano nelle viste Voli, Crociere e Alloggi. */
export function BookingsView() {
  const { trip } = useTrip();
  const o = useMemo(() => bookingsOverview(trip), [trip]);
  const [filter, setFilter] = useState<BookingState | undefined>();

  if (trip.stops.length === 0 && o.rows.length === 0) {
    return (
      <Empty title="Ancora nulla da prenotare">
        Voli e alloggi dipendono dal percorso: <a href="#/pianifica">costruisci prima l'itinerario</a>.
      </Empty>
    );
  }
  const rows = filter ? o.rows.filter((r) => r.state === filter) : o.rows;

  return (
    <div className="bookings">
      {o.first && (
        <section className="ov-next prio-media" aria-labelledby="bk-next">
          <div>
            <h2 id="bk-next" className="ov-prio">
              Da fare per primo
            </h2>
            <p>
              <strong>{o.first.title}</strong>: {o.first.todo ?? o.first.detail}.
            </p>
          </div>
          <a className="btn btn-primary" href={o.first.href}>
            {o.first.cta}
          </a>
        </section>
      )}

      <div className="bk-filters" role="group" aria-label="Filtra per stato">
        <button type="button" className={`bk-filter ${filter ? '' : 'active'}`} aria-pressed={!filter} onClick={() => setFilter(undefined)}>
          Tutti <strong>{o.rows.length}</strong>
        </button>
        {STATES.map((s) => (
          <button key={s} type="button" className={`bk-filter ${filter === s ? 'active' : ''}`} aria-pressed={filter === s} onClick={() => setFilter(filter === s ? undefined : s)}>
            <Icon name={STATE_ICON[s]} /> {BOOKING_STATE_LABEL[s]} <strong>{o.counts[s]}</strong>
          </button>
        ))}
      </div>

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
              <p className="muted small">{filter ? 'Nessun elemento con questo stato.' : 'Nessun elemento.'}</p>
            ) : (
              <ul className="bk-rows">
                {list.map((r) => (
                  <li key={r.id} className={`bk-row bk-${r.state}`}>
                    <div>
                      <strong>{r.title}</strong>
                      <span className="small muted block">{r.detail}</span>
                      {r.todo && <span className="small block">{r.todo}</span>}
                    </div>
                    <div className="bk-row-side">
                      <Badge tone={STATE_TONE[r.state]}>
                        <Icon name={STATE_ICON[r.state]} /> {BOOKING_STATE_LABEL[r.state]}
                      </Badge>
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
      <p className="muted small">L'app non prenota e non controlla la disponibilità: lo stato è quello che hai inserito tu. «Da verificare» indica dati non ancora controllati sulla fonte.</p>
    </div>
  );
}
