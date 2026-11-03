import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { restorePlanOnly } from '../domain/actuals';
import { formatDateIt, totalNights } from '../domain/itinerary';
import {
  cruiseChoices,
  cruisePortsKnown,
  dayOptions,
  defaultInsertIndex,
  flightIssues,
  insertStop,
  pendingPlacements,
  placeCruise,
  placeFlight,
  routeDiff,
  type CarChoice,
  type OverlapMode,
} from '../domain/placement';
import type { CoastalOption, Flight, Stop, Trip } from '../domain/types';
import { useTrip } from '../state/store';
import { Field, NumberInput } from './common';
import { AUTO_ROUTE_KEY } from './ConfiguratorView';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog ref={ref} className="place-dialog" aria-label={title} onCancel={onClose}>
      <h2>{title}</h2>
      {children}
    </dialog>
  );
}

function RoutePreview({ before, after }: { before: Trip; after: Trip }) {
  const d = useMemo(() => routeDiff(before, after), [before, after]);
  return (
    <section className="place-preview" aria-label="Come diventa il percorso">
      <h3>Come diventa il percorso</h3>
      <p className="small">
        <strong>
          {d.daysBefore} → {d.daysAfter} giorni
        </strong>
        {d.startAfter !== d.startBefore && ` · partenza ${formatDateIt(d.startBefore)} → ${formatDateIt(d.startAfter)}`}
      </p>
      <ol className="place-rows">
        {d.rows.map((r, i) => (
          <li key={i} className={`place-row is-${r.change}`}>
            <span>
              {r.kind === 'a_bordo' ? '🚢 ' : ''}
              {r.name}
            </span>
            <span className="small">
              {r.fromNights !== undefined ? `${r.fromNights} → ${r.nights} notti` : r.nights === 0 ? 'senza notti' : `${r.nights} ${r.nights === 1 ? 'notte' : 'notti'}`}
              {r.change === 'nuova' && ' · nuova'}
            </span>
          </li>
        ))}
      </ol>
      {d.removed.length > 0 && (
        <p className="small place-removed">
          Tolte: {d.removed.map((r) => `${r.name} (${r.nights} ${r.nights === 1 ? 'notte' : 'notti'})`).join(', ')}. Attività e note di quei giorni restano in «Giorno per giorno», tra quelle da ricollocare.
        </p>
      )}
      {d.toCalculate > 0 && <p className="muted small">{d.toCalculate === 1 ? '1 tratto nuovo da calcolare' : `${d.toCalculate} tratti nuovi da calcolare`} in «Tappe e mappa»: km e tempi non sono ancora noti.</p>}
      {d.warnings.map((w) => (
        <p key={w} className="note-warn small">
          {w}
        </p>
      ))}
    </section>
  );
}

/** Conferma comune: applica, offre l'annullamento e porta a vedere il risultato. */
function useApply(onClose: () => void, stayHere: boolean) {
  const { trip, update, toast } = useTrip();
  return (next: Trip, msg: string) => {
    const prev = trip;
    update(() => next);
    toast(msg, 'ok', { label: 'Annulla', run: () => update((cur) => restorePlanOnly(cur, prev)) });
    onClose();
    if (stayHere) return;
    try {
      sessionStorage.setItem(AUTO_ROUTE_KEY, '1');
    } catch {
      /* senza sessionStorage il calcolo dei tratti resta manuale */
    }
    window.location.hash = '#/itinerario';
  };
}

const CAR_LABEL: Record<CarChoice, string> = {
  da_decidere: 'Non ho ancora deciso',
  a_bordo: "L'auto viene a bordo con noi",
  a_terra: "L'auto resta a terra o si riconsegna all'imbarco",
};

export function CruiseDialog({ option, onClose, stayHere = false }: { option: CoastalOption; onClose: () => void; stayHere?: boolean }) {
  const { trip } = useTrip();
  const days = useMemo(() => dayOptions(trip), [trip]);
  // Di partenza si propone il giorno della crociera, se è nel viaggio, altrimenti in fondo: così non si toglie nulla
  const initial = (() => {
    const inTrip = option.date ? Math.round((Date.parse(option.date) - Date.parse(trip.startDate)) / 86_400_000) : -1;
    return days.some((d) => d.day === inTrip) ? inTrip : totalNights(trip.stops);
  })();
  const [day, setDay] = useState(initial);
  const [nights, setNights] = useState(option.nightsOnboard);
  const [mode, setMode] = useState<OverlapMode>('sostituisci');
  const [car, setCar] = useState<CarChoice>(option.withCar ? 'a_bordo' : 'da_decidere');
  const choices = useMemo(() => cruiseChoices(trip, day, nights), [trip, day, nights]);
  const chosen = choices.find((c) => c.mode === mode && !c.disabled) ?? choices.find((c) => !c.disabled) ?? choices[0]!;
  const after = useMemo(() => placeCruise(trip, option, { day, nights, mode: chosen.mode, car }), [trip, option, day, nights, chosen.mode, car]);
  const apply = useApply(onClose, stayHere);
  const title = `${option.operator} ${option.fromPort} → ${option.toPort}`;
  return (
    <Modal title={`Aggiungi al percorso: ${title}`} onClose={onClose}>
      {!cruisePortsKnown(option) ? (
        <p className="note-warn">Non ho le coordinate di uno dei due porti: aggiungi le tappe a mano in «Tappe e mappa».</p>
      ) : (
        <>
          <div className="grid-2">
            <Field label="In quale giorno ti imbarchi?">
              {(id) => (
                <select id={id} value={day} onChange={(e) => setDay(Number(e.target.value))}>
                  {days.map((d) => (
                    <option key={d.day} value={d.day}>
                      {d.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Notti a bordo" hint="Dalla proposta: controllala sul programma">
              {(id) => <NumberInput id={id} value={nights} min={0} step={1} onChange={(v) => setNights(Math.max(0, Math.round(v ?? 0)))} />}
            </Field>
          </div>
          {choices.length > 1 && (
            <fieldset className="place-q">
              <legend>Quei giorni sono già occupati. Cosa vuoi fare?</legend>
              {choices.map((c) => (
                <label key={c.mode} className={`place-opt ${c.disabled ? 'is-disabled' : ''}`}>
                  <input type="radio" name="place-mode" disabled={Boolean(c.disabled)} checked={chosen.mode === c.mode} onChange={() => setMode(c.mode)} />
                  <span>
                    <strong>{c.label}</strong>
                    <span className="small block">{c.disabled ?? c.detail}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {choices.length === 1 && <p className="small muted">{chosen.detail}</p>}
          <Field label="Dove resta l'auto?">
            {(id) => (
              <select id={id} value={car} onChange={(e) => setCar(e.target.value as CarChoice)}>
                {(Object.keys(CAR_LABEL) as CarChoice[]).map((k) => (
                  <option key={k} value={k}>
                    {CAR_LABEL[k]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {after && <RoutePreview before={trip} after={after} />}
        </>
      )}
      <div className="row place-actions">
        <button className="btn btn-primary" disabled={!after} onClick={() => after && apply(after, 'Crociera aggiunta al percorso')}>
          Applica al percorso
        </button>
        <button className="btn" onClick={onClose}>
          Annulla
        </button>
      </div>
    </Modal>
  );
}

export function FlightDialog({ flight, onClose, stayHere = false }: { flight: Flight; onClose: () => void; stayHere?: boolean }) {
  const { trip } = useTrip();
  const [date, setDate] = useState(flight.date ?? '');
  const f = useMemo(() => ({ ...flight, date: date || undefined }), [flight, date]);
  const issues = useMemo(() => flightIssues(trip, f).filter((i) => i.id !== 'no_date'), [trip, f]);
  const [scelte, setScelte] = useState<Record<string, string>>({});
  const pick = (id: string, options: { id: string; disabled?: string }[]) => {
    const c = scelte[id];
    return options.some((o) => o.id === c && !o.disabled) ? c! : options.find((o) => !o.disabled)?.id;
  };
  const resolved = useMemo(() => Object.fromEntries(issues.flatMap((i) => { const c = pick(i.id, i.options); return c ? [[i.id, c]] : []; })), [issues, scelte]); // eslint-disable-line react-hooks/exhaustive-deps
  const after = useMemo(() => placeFlight({ ...trip, flights: (trip.flights ?? []).map((x) => (x.id === f.id ? f : x)) }, f, resolved), [trip, f, resolved]);
  const needsDate = f.direction !== 'interno' && !f.date;
  const blocked = needsDate || issues.some((i) => i.options.length === 0);
  const apply = useApply(onClose, stayHere);
  return (
    <Modal title={`Aggiungi al percorso: volo ${f.fromAirport} → ${f.toAirport}`} onClose={onClose}>
      <Field label="Data del volo">{(id) => <input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
      {needsDate && <p className="note-warn small">Inserisci la data per vedere cosa cambia.</p>}
      {issues.length === 0 && !needsDate && <p className="small">Il volo coincide già con il percorso: non serve cambiare nulla.</p>}
      {issues.map((i) => (
        <fieldset key={i.id} className="place-q">
          <legend>{i.text}</legend>
          {i.options.map((o) => (
            <label key={o.id} className={`place-opt ${o.disabled ? 'is-disabled' : ''}`}>
              <input type="radio" name={`place-${i.id}`} disabled={Boolean(o.disabled)} checked={resolved[i.id] === o.id} onChange={() => setScelte((s) => ({ ...s, [i.id]: o.id }))} />
              <span>
                {o.label}
                {o.disabled && <span className="small block">{o.disabled}</span>}
              </span>
            </label>
          ))}
          {i.note && <p className="note-warn small">{i.note}</p>}
        </fieldset>
      ))}
      {!blocked && <RoutePreview before={trip} after={after} />}
      <div className="row place-actions">
        <button className="btn btn-primary" disabled={blocked} onClick={() => apply(after, 'Volo aggiunto al percorso')}>
          Applica al percorso
        </button>
        <button className="btn" onClick={onClose}>
          Annulla
        </button>
      </div>
    </Modal>
  );
}

export function StopDialog({ stop, onClose }: { stop: Stop; onClose: () => void }) {
  const { trip } = useTrip();
  const [index, setIndex] = useState(defaultInsertIndex(trip.stops));
  const [nights, setNights] = useState(stop.nights);
  const after = useMemo(() => insertStop(trip, { ...stop, nights }, index), [trip, stop, nights, index]);
  const apply = useApply(onClose, true);
  return (
    <Modal title={`Aggiungi al percorso: ${stop.name}`} onClose={onClose}>
      <div className="grid-2">
        <Field label="Dove la inserisco?">
          {(id) => (
            <select id={id} value={index} onChange={(e) => setIndex(Number(e.target.value))}>
              <option value={0}>All'inizio</option>
              {trip.stops.map((s, i) => (
                <option key={s.id} value={i + 1}>
                  Dopo {s.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Notti">{(id) => <NumberInput id={id} value={nights} min={0} step={1} onChange={(v) => setNights(Math.max(0, Math.round(v ?? 0)))} />}</Field>
      </div>
      <RoutePreview before={trip} after={after} />
      <div className="row place-actions">
        <button className="btn btn-primary" onClick={() => apply(after, `${stop.name} aggiunta al percorso`)}>
          Applica al percorso
        </button>
        <button className="btn" onClick={onClose}>
          Annulla
        </button>
      </div>
    </Modal>
  );
}

/** Riquadro in «Tappe e mappa»: ciò che è stato scelto ma non è ancora nel percorso. */
export function PendingPanel() {
  const { trip } = useTrip();
  const p = useMemo(() => pendingPlacements(trip), [trip]);
  const [cruise, setCruise] = useState<CoastalOption | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  if (p.cruises.length + p.flights.length === 0 && !cruise && !flight) return null;
  return (
    <section className="note-warn place-pending" aria-label="Scelti ma non ancora nel percorso">
      <strong>Scelti ma non ancora nel percorso</strong>
      <ul>
        {p.flights.map((f) => (
          <li key={f.id}>
            <span>
              ✈️ Volo {f.fromAirport} → {f.toAirport}
              {f.date ? ` · ${formatDateIt(f.date)}` : ' · data da inserire'}
            </span>
            <button className="btn btn-small" onClick={() => setFlight(f)}>
              Aggiungi al percorso
            </button>
          </li>
        ))}
        {p.cruises.map((o) => (
          <li key={o.id}>
            <span>
              🚢 {o.operator} {o.fromPort} → {o.toPort}
              {o.date ? ` · ${formatDateIt(o.date)}` : ''}
            </span>
            <button className="btn btn-small" onClick={() => setCruise(o)}>
              Aggiungi al percorso
            </button>
          </li>
        ))}
      </ul>
      {cruise && <CruiseDialog option={cruise} stayHere onClose={() => setCruise(null)} />}
      {flight && <FlightDialog flight={flight} stayHere onClose={() => setFlight(null)} />}
    </section>
  );
}
