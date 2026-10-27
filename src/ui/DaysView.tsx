import { useMemo, useState } from 'react';
import { DESTINATIONS, findDestination } from '../data/destinations';
import { haversineKm } from '../services/accommodation/search';
import { newId } from '../domain/ids';
import { computeDays, formatDateIt, formatDuration, legTotals } from '../domain/itinerary';
import type { Activity, DayPlan } from '../domain/types';
import { useTrip } from '../state/store';
import { Badge, Empty, Field, fmtMoney, MODE_ICON, MoneyInput, NumberInput, StatusSelect } from './common';

const emptyDay = (): DayPlan => ({ activities: [], notes: '', planB: '' });

export function DaysView() {
  const { trip } = useTrip();
  const days = useMemo(() => computeDays(trip), [trip]);
  if (days.length === 0) return <Empty title="Nessuna giornata">Aggiungi le tappe nella sezione Itinerario: le giornate si generano dalle notti.</Empty>;
  return (
    <div className="days">
      {trip.dateTentative && (
        <p className="note-info">Date provvisorie: la partenza è impostata al {formatDateIt(trip.startDate)} e si può cambiare in Viaggio e salvataggio.</p>
      )}
      {days.map((d) => (
        <DayCard key={d.index} dayIndex={d.index} />
      ))}
    </div>
  );
}

function DayCard({ dayIndex }: { dayIndex: number }) {
  const { trip, update } = useTrip();
  const day = computeDays(trip)[dayIndex];
  const plan = trip.days[String(dayIndex)] ?? emptyDay();
  const [title, setTitle] = useState('');
  if (!day) return null;
  const setPlan = (fn: (p: DayPlan) => DayPlan) => update((t) => ({ ...t, days: { ...t.days, [String(dayIndex)]: fn(t.days[String(dayIndex)] ?? emptyDay()) } }));
  const here = day.sleepStop ?? day.wakeStop;
  const nearby = here
    ? DESTINATIONS.filter((x) => x.category !== 'aeroporti' && haversineKm(x, here) < 60 && x.id !== here.destinationId).slice(0, 6)
    : [];
  const addActivity = (a: Partial<Activity>) =>
    setPlan((p) => ({ ...p, activities: [...p.activities, { id: newId(), title: a.title ?? '', costStatus: 'da_verificare', ...a }] }));

  const from = day.legs[0] ? trip.stops.find((s) => s.id === day.legs[0]!.fromStopId) : undefined;
  return (
    <article className={`day ${day.warnings.length ? 'day-warn' : ''}`}>
      <header className="day-head">
        <div>
          <span className="day-num">Giorno {day.index + 1}</span> <span className="muted">{formatDateIt(day.date)}</span>
        </div>
        <div className="day-route">
          {day.isArrivalDay && <Badge tone="info">Arrivo</Badge>}
          {day.isDepartureDay && <Badge tone="info">Rientro</Badge>}
          {from && day.sleepStop ? (
            <span>
              {from.name} → <strong>{day.sleepStop.name}</strong>
            </span>
          ) : day.sleepStop ? (
            <strong>{day.sleepStop.name}</strong>
          ) : (
            day.wakeStop && <span>Partenza da {day.wakeStop.name}</span>
          )}
        </div>
      </header>

      {day.legs.length > 0 && (
        <ul className="day-legs">
          {day.legs.map((l) => {
            const t = legTotals(l);
            return (
              <li key={l.id}>
                {l.segments.map((s) => MODE_ICON[s.mode]).join(' ')} {t.roadKm > 0 && `${Math.round(t.roadKm)} km · `}
                {t.travelMin > 0 ? formatDuration(t.travelMin + t.waitMin) : 'tempo non calcolato'}
                {l.segments
                  .filter((s) => s.mode === 'traghetto' || s.mode === 'costiera')
                  .map((s) => (
                    <span key={s.id} className="muted">
                      {' '}
                      · {s.label} {s.departureTime ? `ore ${s.departureTime}` : '(orario da verificare)'}
                    </span>
                  ))}
              </li>
            );
          })}
        </ul>
      )}
      {day.warnings.map((w) => (
        <p key={w} className="note-warn small">
          ⚠️ {w}
        </p>
      ))}
      {day.sleepStop?.kind === 'luogo' && !day.sleepStop.accommodationId && <p className="muted small">Alloggio non ancora scelto.</p>}

      <ul className="activities">
        {plan.activities.map((a) => (
          <li key={a.id} className="activity">
            <input
              aria-label="Attività"
              value={a.title}
              onChange={(e) => setPlan((p) => ({ ...p, activities: p.activities.map((x) => (x.id === a.id ? { ...x, title: e.target.value } : x)) }))}
            />
            <NumberInput
              value={a.durationMin}
              placeholder="min"
              onChange={(v) => setPlan((p) => ({ ...p, activities: p.activities.map((x) => (x.id === a.id ? { ...x, durationMin: v } : x)) }))}
            />
            <MoneyInput
              value={a.cost}
              onChange={(m) => setPlan((p) => ({ ...p, activities: p.activities.map((x) => (x.id === a.id ? { ...x, cost: m } : x)) }))}
            />
            <StatusSelect
              value={a.costStatus}
              onChange={(v) => setPlan((p) => ({ ...p, activities: p.activities.map((x) => (x.id === a.id ? { ...x, costStatus: v } : x)) }))}
            />
            <button
              className="icon-btn danger"
              aria-label={`Rimuovi ${a.title || 'attività'}`}
              onClick={() => setPlan((p) => ({ ...p, activities: p.activities.filter((x) => x.id !== a.id) }))}
            >
              ✕
            </button>
            {a.destinationId && findDestination(a.destinationId)?.augustNote && (
              <span className="note-warn small">⚠️ {findDestination(a.destinationId)?.augustNote}</span>
            )}
          </li>
        ))}
      </ul>
      <div className="row">
        <input placeholder="Nuova attività (es. battello sul fiordo, parco giochi, riposo)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button
          className="btn btn-small"
          disabled={!title.trim()}
          onClick={() => {
            addActivity({ title: title.trim() });
            setTitle('');
          }}
        >
          Aggiungi
        </button>
      </div>
      {nearby.length > 0 && (
        <div className="chips">
          <span className="muted small">Nei dintorni (entro ~60 km in linea d'aria):</span>
          {nearby.map((x) => (
            <button key={x.id} className="chip" onClick={() => addActivity({ title: x.name, destinationId: x.id })} title={x.description}>
              + {x.name}
            </button>
          ))}
        </div>
      )}
      <details>
        <summary>Note e piano B {plan.activities.some((a) => a.cost) && `· ${plan.activities.filter((a) => a.cost).map((a) => fmtMoney(a.cost)).join(' + ')}`}</summary>
        <div className="grid-2">
          <Field label="Note operative">{(id) => <textarea id={id} rows={2} value={plan.notes} onChange={(e) => setPlan((p) => ({ ...p, notes: e.target.value }))} />}</Field>
          <Field label="Se piove">{(id) => <textarea id={id} rows={2} value={plan.planB} onChange={(e) => setPlan((p) => ({ ...p, planB: e.target.value }))} />}</Field>
        </div>
      </details>
    </article>
  );
}
