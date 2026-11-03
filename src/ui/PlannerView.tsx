import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { restorePlanOnly, stopState, STOP_STATE_LABEL } from '../domain/actuals';
import { BUDGET_CATEGORIES, computeBudget, formatEur, ORIGIN_NAME } from '../domain/budget';
import { computeDayLoads, suggestAlternatives, applySuggestion, type Suggestion } from '../domain/dayLoad';
import { newId } from '../domain/ids';
import { computeDays, formatDateIt, formatDuration, legTotals, TRIP_MAX_DAYS, TRIP_MIN_DAYS, totalDays } from '../domain/itinerary';
import { upsertAccommodation } from '../domain/lodging';
import { defaultInsertIndex, insertStop } from '../domain/placement';
import { formatSelection, parseSelection, selectionCosts, selectionExists, selectionStopId, type Selection } from '../domain/selection';
import type { Accommodation, BudgetCategory, BudgetItem, DataStatus, Money, Stop } from '../domain/types';
import { buildHash, parseRoute } from '../state/route';
import { useTrip } from '../state/store';
import { Empty, Field, MoneyInput, MODE_ICON, StatusBadge, StatusSelect } from './common';
import { DayCard } from './DaysView';
import { AccommodationForm, blankAccommodation } from './HytteView';
import { LegCard, StopCard, StopPicker, useLegRouting } from './ItineraryView';
import { MapView } from './MapView';
import { PendingPanel } from './PlacementDialog';
import { PlanBDialog } from './PlanBDialog';

// Area di lavoro: outline a sinistra, mappa o timeline al centro, dettagli a destra.
// Selezione, filtro e posizione si conservano quando si apre una vista completa e si torna qui.

type Center = 'mappa' | 'timeline';
const UI_KEY = 'nfhp.planner.ui';

interface UiState {
  sel?: string;
  center?: Center;
  filter?: string;
  scroll?: number;
}

function loadUi(): UiState {
  try {
    return JSON.parse(sessionStorage.getItem(UI_KEY) ?? '{}') as UiState;
  } catch {
    return {};
  }
}
function saveUi(s: UiState): void {
  try {
    sessionStorage.setItem(UI_KEY, JSON.stringify(s));
  } catch {
    /* senza sessionStorage la selezione non si conserva al ritorno */
  }
}

export function PlannerView() {
  const { trip, update, toast } = useTrip();
  const days = useMemo(() => computeDays(trip), [trip]);
  const [ui] = useState(loadUi);
  const route = parseRoute(window.location.hash);
  const [sel, setSel] = useState<Selection | undefined>(() => parseSelection(route.params.sel ?? ui.sel));
  const [center, setCenter] = useState<Center>(() => (route.params.centro === 'timeline' || ui.center === 'timeline' ? 'timeline' : 'mappa'));
  const [filter, setFilter] = useState(ui.filter ?? '');
  const outlineRef = useRef<HTMLElement>(null);
  const routing = useLegRouting();
  const [planB, setPlanB] = useState(false);

  // Una selezione rimasta su un elemento rimosso si azzera, senza errori
  const current = sel && selectionExists(trip, days, sel) ? sel : undefined;

  useEffect(() => {
    saveUi({ sel: formatSelection(current), center, filter, scroll: outlineRef.current?.scrollTop });
    // replaceState: la selezione è nell'indirizzo ma non riempie la cronologia e non ricarica la vista
    window.history.replaceState(null, '', buildHash('pianifica', { sel: formatSelection(current), centro: center === 'timeline' ? center : undefined }));
  }, [current, center, filter]);

  useLayoutEffect(() => {
    if (outlineRef.current && ui.scroll) outlineRef.current.scrollTop = ui.scroll;
  }, [ui.scroll]);

  const addStop = (s: Stop | undefined) => {
    if (!s) return;
    update((t) => insertStop(t, s, defaultInsertIndex(t.stops)));
    setSel({ kind: 'stop', id: s.id });
    toast(`Aggiunta tappa: ${s.name}`);
  };

  return (
    <div className="planner">
      {planB && <PlanBDialog onClose={() => setPlanB(false)} />}
      <Outline trip={trip} days={days} sel={current} onSelect={setSel} filter={filter} setFilter={setFilter} refEl={outlineRef} onAddStop={addStop} onScroll={() => saveUi({ sel: formatSelection(current), center, filter, scroll: outlineRef.current?.scrollTop })} />
      <section className="planner-center" aria-label="Mappa e timeline">
        <div className="segmented" role="group" aria-label="Vista centrale">
          {(['mappa', 'timeline'] as const).map((c) => (
            <button key={c} className={center === c ? 'active' : ''} aria-pressed={center === c} onClick={() => setCenter(c)}>
              {c === 'mappa' ? 'Mappa' : 'Timeline'}
            </button>
          ))}
          {trip.stops.length > 0 && (
            <button className="btn btn-small planb-open" onClick={() => setPlanB(true)}>
              Prepara un piano B
            </button>
          )}
          <button className="btn btn-small" onClick={routing.calcAll} disabled={trip.legs.length === 0 || Boolean(routing.busy)}>
            {routing.busy ? 'Calcolo…' : 'Calcola tratti mancanti'}
          </button>
        </div>
        {center === 'mappa' ? (
          <MapView trip={trip} selectedStopId={selectionStopId(trip, days, current)} onSelectStop={(id) => setSel({ kind: 'stop', id })} />
        ) : (
          <Timeline days={days} sel={current} onSelect={setSel} />
        )}
      </section>
      <Inspector sel={current} onClear={() => setSel(undefined)} routing={routing} />
    </div>
  );
}

function Outline({
  trip,
  days,
  sel,
  onSelect,
  filter,
  setFilter,
  refEl,
  onAddStop,
  onScroll,
}: {
  trip: ReturnType<typeof useTrip>['trip'];
  days: ReturnType<typeof computeDays>;
  sel?: Selection;
  onSelect: (s: Selection) => void;
  filter: string;
  setFilter: (v: string) => void;
  refEl: RefObject<HTMLElement | null>;
  onAddStop: (s: Stop | undefined) => void;
  onScroll: () => void;
}) {
  const n = totalDays(trip.stops);
  const q = filter.trim().toLowerCase();
  const shown = trip.stops.filter((s) => !q || s.name.toLowerCase().includes(q));
  const is = (kind: Selection['kind'], id: string) => sel?.kind === kind && sel.id === id;

  // Frecce su e giù tra le voci dell'outline
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button.ol-item')];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    items[Math.max(0, Math.min(items.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]?.focus();
  };

  return (
    <aside className="planner-outline" aria-label="Giorni e tappe" ref={refEl} onScroll={onScroll}>
      <p className="small muted">
        {n === 0 ? 'Nessuna tappa' : `${n} giorni · ${trip.stops.length} ${trip.stops.length === 1 ? 'tappa' : 'tappe'}`} · obiettivo {TRIP_MIN_DAYS}–{TRIP_MAX_DAYS} giorni
      </p>
      <StopPicker onAdd={onAddStop} />
      <PendingPanel />
      {trip.stops.length > 3 && <input className="ol-filter" type="search" placeholder="Filtra le tappe" aria-label="Filtra le tappe" value={filter} onChange={(e) => setFilter(e.target.value)} />}
      <div className="ol-scroll" onKeyDown={onKey}>
        {trip.stops.length === 0 ? (
          <Empty title="Inizia dall'arrivo">Aggiungi come prima tappa l'aeroporto o la città di arrivo, poi le località dove dormire.</Empty>
        ) : shown.length === 0 ? (
          <p className="muted small">Nessuna tappa corrisponde al filtro.</p>
        ) : (
          <ol className="ol-list">
            {shown.map((s) => {
              const i = trip.stops.indexOf(s);
              const leg = trip.legs.find((l) => l.fromStopId === s.id);
              const stopDays = days.filter((d) => d.sleepStop?.id === s.id);
              const totals = leg ? legTotals(leg, trip.settings) : undefined;
              return (
                <li key={s.id}>
                  <button className={`ol-item ol-stop ${is('stop', s.id) ? 'active' : ''}`} aria-current={is('stop', s.id) ? 'true' : undefined} onClick={() => onSelect({ kind: 'stop', id: s.id })}>
                    <span className="ol-num">{s.kind === 'a_bordo' ? '🚢' : i + 1}</span>
                    <span className="ol-name">{s.name}</span>
                    <span className="small muted">
                      {s.nights === 0 ? 'di passaggio' : `${s.nights} ${s.nights === 1 ? 'notte' : 'notti'}`}
                      {stopState(trip, s.id) !== 'pianificata' && ` · ${STOP_STATE_LABEL[stopState(trip, s.id)]}`}
                    </span>
                  </button>
                  {stopDays.length > 0 && (
                    <ul className="ol-days">
                      {stopDays.map((d) => {
                        const acts = trip.days[d.key]?.activities.length ?? 0;
                        return (
                          <li key={d.key}>
                            <button className={`ol-item ol-day ${is('day', d.key) ? 'active' : ''}`} aria-current={is('day', d.key) ? 'true' : undefined} onClick={() => onSelect({ kind: 'day', id: d.key })}>
                              Giorno {d.index + 1} · {formatDateIt(d.date)}
                              {acts > 0 && <span className="muted"> · {acts} {acts === 1 ? 'attività' : 'attività'}</span>}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {leg && i < trip.stops.length - 1 && (
                    <button className={`ol-item ol-leg ${is('leg', leg.id) ? 'active' : ''}`} aria-current={is('leg', leg.id) ? 'true' : undefined} onClick={() => onSelect({ kind: 'leg', id: leg.id })}>
                      {leg.segments.map((x) => MODE_ICON[x.mode]).join(' ')} {totals?.hasUncalculated ? 'Tratto non calcolato' : totals?.partial ? 'Durata da inserire' : formatDuration(totals?.realisticMin ?? 0)}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </aside>
  );
}

function Timeline({ days, sel, onSelect }: { days: ReturnType<typeof computeDays>; sel?: Selection; onSelect: (s: Selection) => void }) {
  const { trip } = useTrip();
  if (days.length === 0) return <Empty title="Nessuna giornata">Le giornate si generano dalle notti delle tappe.</Empty>;
  return (
    <ol className="timeline">
      {days.map((d) => {
        const acts = trip.days[d.key]?.activities ?? [];
        const place = d.sleepStop?.name ?? d.wakeStop?.name ?? '';
        const active = (sel?.kind === 'day' && sel.id === d.key) || (sel?.kind === 'stop' && sel.id === d.sleepStop?.id);
        return (
          <li key={d.key} className={active ? 'active' : ''}>
            <button className="tl-day" onClick={() => onSelect({ kind: 'day', id: d.key })} aria-current={active ? 'true' : undefined}>
              <strong>
                Giorno {d.index + 1} · {formatDateIt(d.date)}
              </strong>
              <span className="small">{d.sleepStop ? `Notte a ${place}` : `Ultimo giorno${place ? `, da ${place}` : ''}`}</span>
              {d.legs.length > 0 && <span className="small muted">{d.travelPartial ? 'Trasferimento: tempi incompleti' : `Trasferimento: circa ${formatDuration(d.realisticTravelMin)}`}</span>}
              {acts.length > 0 && <span className="small muted">{acts.map((a) => a.title || 'attività').join(' · ')}</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Inspector({ sel, onClear, routing }: { sel?: Selection; onClear: () => void; routing: ReturnType<typeof useLegRouting> }) {
  const { trip, update, toast } = useTrip();
  const days = useMemo(() => computeDays(trip), [trip]);
  const loads = useMemo(() => computeDayLoads(trip, days), [trip, days]);
  const suggestions = useMemo(() => suggestAlternatives(trip), [trip]);
  const [draftAcc, setDraftAcc] = useState<Accommodation | null>(null);

  const applySg = (sg: Suggestion) => {
    if (!sg.action) return;
    const action = sg.action;
    const before = trip;
    update((t) => applySuggestion(t, action));
    toast('Proposta applicata', 'ok', { label: 'Annulla', run: () => update((cur) => restorePlanOnly(cur, before)) });
  };

  let body = null;
  if (sel?.kind === 'stop') {
    const i = trip.stops.findIndex((s) => s.id === sel.id);
    const stop = trip.stops[i]!;
    body = (
      <>
        <StopCard stop={stop} index={i} count={trip.stops.length} checkIn={days.find((d) => d.sleepStop?.id === stop.id)?.date} selected={false} onShowOnMap={() => undefined} expanded />
        {stop.kind === 'luogo' && stop.nights > 0 && (
          <div className="insp-block">
            <h3>Alloggio</h3>
            {draftAcc ? (
              <AccommodationForm
                value={draftAcc}
                onSave={(a) => {
                  update((t) => upsertAccommodation(t, a));
                  setDraftAcc(null);
                  toast('Sistemazione salvata (non è una prenotazione)');
                }}
                onCancel={() => setDraftAcc(null)}
              />
            ) : (
              <button className="btn btn-small" onClick={() => setDraftAcc(blankAccommodation({ stopId: stop.id, locality: stop.name }))}>
                + Nuova sistemazione per {stop.name}
              </button>
            )}
          </div>
        )}
      </>
    );
  } else if (sel?.kind === 'leg') {
    const leg = trip.legs.find((l) => l.id === sel.id)!;
    const i = trip.stops.findIndex((s) => s.id === leg.fromStopId);
    body = <LegCard leg={leg} fromNum={i + 1} day={days.find((d) => d.legs.some((l) => l.id === leg.id))} busy={routing.busy === leg.id} onCalc={() => routing.calcOne(leg)} expanded />;
  } else if (sel?.kind === 'day') {
    const d = days.find((x) => x.key === sel.id)!;
    body = <DayCard day={d} load={loads[d.index]!} suggestions={suggestions.filter((sg) => sg.dayKey === d.key)} onApply={applySg} expanded />;
  }

  return (
    <aside className="planner-inspector" aria-label="Dettagli della selezione" onKeyDown={(e) => e.key === 'Escape' && sel && !(e.target as HTMLElement).closest('dialog') && onClear()}>
      {sel ? (
        <>
          <div className="insp-head">
            <h2>{sel.kind === 'stop' ? 'Tappa' : sel.kind === 'leg' ? 'Trasferimento' : 'Giornata'}</h2>
            <button className="btn btn-small" onClick={onClear}>
              Chiudi
            </button>
          </div>
          {body}
        </>
      ) : (
        <h2>Riepilogo del viaggio</h2>
      )}
      <CostPanel sel={sel} />
    </aside>
  );
}

function CostPanel({ sel }: { sel?: Selection }) {
  const { trip, update, toast } = useTrip();
  const b = useMemo(() => computeBudget(trip), [trip]);
  const lines = useMemo(() => selectionCosts(trip, sel), [trip, sel]);
  const [cat, setCat] = useState<BudgetCategory>('attrazioni');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState<Money | undefined>();
  const [status, setStatus] = useState<DataStatus>('stimato');
  const firm = b.byStatus.confermato + b.byStatus.prenotato + b.byStatus.pagato;
  const add = () => {
    if (!amount || !label.trim()) return;
    const item: BudgetItem = { id: newId(), category: cat, label: label.trim(), amount, status, notes: '' };
    update((t) => ({ ...t, budgetItems: [...t.budgetItems, item] }));
    setLabel('');
    setAmount(undefined);
    toast('Costo aggiunto al budget');
  };
  return (
    <section className="insp-block" aria-label="Costi">
      <h3>Costi</h3>
      <p className="small">
        Totale con importo: <strong>{formatEur(b.total)}</strong> · già certo {formatEur(firm)} · stimato {formatEur(b.byStatus.stimato)}
        {b.missing.length > 0 && ` · ${b.missing.length} ${b.missing.length === 1 ? 'dato mancante' : 'dati mancanti'}`}
      </p>
      {sel &&
        (lines.length === 0 ? (
          <p className="muted small">Nessun costo con importo per questa selezione.</p>
        ) : (
          <ul className="insp-costs small">
            {lines.map((l) => (
              <li key={l.key}>
                <span>
                  {l.label} <span className="muted">({ORIGIN_NAME[l.origin]})</span>
                </span>
                <span>
                  {formatEur(l.eur)} <StatusBadge status={l.status} />
                </span>
              </li>
            ))}
          </ul>
        ))}
      <details className="more-fields">
        <summary>Aggiungi un costo</summary>
        <div className="grid-2">
          <Field label="Categoria">
            {(id) => (
              <select id={id} value={cat} onChange={(e) => setCat(e.target.value as BudgetCategory)}>
                {BUDGET_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Descrizione">{(id) => <input id={id} value={label} onChange={(e) => setLabel(e.target.value)} />}</Field>
          <Field label="Importo">{(id) => <MoneyInput id={id} value={amount} onChange={setAmount} />}</Field>
          <Field label="Stato">{(id) => <StatusSelect id={id} value={status} onChange={setStatus} />}</Field>
        </div>
        <button className="btn btn-small btn-primary" disabled={!amount || !label.trim()} onClick={add}>
          Aggiungi costo
        </button>
      </details>
    </section>
  );
}
