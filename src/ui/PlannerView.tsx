import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { restorePlanOnly, stopState, STOP_STATE_LABEL } from '../domain/actuals';
import { BUDGET_CATEGORIES, computeBudget, formatEur, ORIGIN_NAME } from '../domain/budget';
import { computeDayLoads, suggestAlternatives, applySuggestion, type Suggestion } from '../domain/dayLoad';
import { newId } from '../domain/ids';
import { findDestination } from '../data/destinations';
import { googlePlaceUrl } from '../domain/googleMaps';
import { addDays, computeDays, formatDateIt, formatDuration, legTotals, moveStopTo, TRIP_MAX_DAYS, TRIP_MIN_DAYS, totalDays, type DayInfo } from '../domain/itinerary';
import { upsertAccommodation } from '../domain/lodging';
import { planImpact } from '../domain/planImpact';
import { defaultInsertIndex, insertStop } from '../domain/placement';
import { formatSelection, parseSelection, selectionCosts, selectionExists, selectionStopId, type Selection } from '../domain/selection';
import type { Accommodation, BudgetCategory, BudgetItem, DataStatus, Leg, Money, Stop, Trip } from '../domain/types';
import { buildHash, parseRoute } from '../state/route';
import { useTrip } from '../state/store';
import { Empty, Field, MoneyInput, ModeIcon, StatusBadge, StatusSelect } from './common';
import { Icon } from './icons';
import { DayCard } from './DaysView';
import { AccommodationForm, blankAccommodation } from './HytteView';
import { LegCard, shortDate, StopCard, StopLodgingSelect, StopPicker, useLegRouting } from './ItineraryView';
import { OfficialLink } from './OfficialLink';
import { MapView } from './MapView';
import { PendingPanel } from './PlacementDialog';
import { PlanBDialog, RemoveStopsDialog } from './PlanBDialog';
import { useStopDrag } from './useStopDrag';

// Percorso: in alto la linea del viaggio (tutte le tappe e i tratti), sotto l'elenco con il dettaglio
// della selezione aperto in linea e, a destra, la mappa (o la timeline dei giorni) che resta ferma.
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
    // Solo se l'indirizzo è ancora questo: durante un cambio di modalità non deve riportare qui
    if (parseRoute(window.location.hash).view === 'pianifica') {
      window.history.replaceState(null, '', buildHash('pianifica', { sel: formatSelection(current), centro: center === 'timeline' ? center : undefined }));
    }
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

  const moveStop = (id: string, to: number) => {
    const from = trip.stops.findIndex((s) => s.id === id);
    const name = trip.stops[from]?.name ?? 'Tappa';
    // Le date di quello che segue cambiano: se tocca qualcosa di prenotato o pagato va detto subito
    const booked = planImpact(trip, moveStopTo(trip, id, to)).booked.length;
    update((t) => moveStopTo(t, id, to));
    toast(booked > 0 ? `${name} spostata. Controlla ${booked} ${booked === 1 ? 'voce prenotata o pagata' : 'voci prenotate o pagate'}: le date non coincidono più` : `${name} spostata`, 'ok', {
      label: 'Annulla',
      run: () => update((t) => moveStopTo(t, id, from)),
    });
  };

  // Scelta dalla linea in alto o dalla mappa: porta in vista il dettaglio aperto nell'elenco
  const selKey = formatSelection(current);
  useEffect(() => {
    if (!selKey) return;
    requestAnimationFrame(() => document.querySelector('.planner-b .ol-detail')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }, [selKey]);

  const n = totalDays(trip.stops);
  const inspector = <Inspector sel={current} onSelect={setSel} onClear={() => setSel(undefined)} routing={routing} />;

  return (
    <div className="planner planner-b">
      {planB && <PlanBDialog onClose={() => setPlanB(false)} />}
      <section className="planner-top" aria-label="Linea del percorso">
        <div className="planner-toolbar">
          <p className="small muted">
            {n === 0 ? 'Nessuna tappa' : `${n} giorni · ${trip.stops.length} ${trip.stops.length === 1 ? 'tappa' : 'tappe'}`} · obiettivo {TRIP_MIN_DAYS}–{TRIP_MAX_DAYS} giorni
          </p>
          <div className="row wrap">
            {trip.stops.length > 0 && (
              <button className="btn btn-small planb-open" onClick={() => setPlanB(true)}>
                Prepara un piano B
              </button>
            )}
            <button className="btn btn-small btn-primary" onClick={routing.calcAll} disabled={trip.legs.length === 0 || Boolean(routing.busy)}>
              {routing.busy ? 'Calcolo…' : 'Calcola tratti mancanti'}
            </button>
          </div>
        </div>
        {trip.stops.length > 0 && <RouteLine trip={trip} days={days} sel={current} onSelect={setSel} onMove={moveStop} />}
      </section>
      <div className="planner-cols">
        <Outline
          onMove={moveStop}
          trip={trip}
          days={days}
          sel={current}
          onSelect={setSel}
          filter={filter}
          setFilter={setFilter}
          refEl={outlineRef}
          onAddStop={addStop}
          onScroll={() => saveUi({ sel: formatSelection(current), center, filter, scroll: outlineRef.current?.scrollTop })}
          detail={current ? inspector : undefined}
          summary={current ? undefined : inspector}
        />
        <section className="planner-center" aria-label="Mappa e timeline">
          <div className="segmented" role="group" aria-label="Vista a destra">
            {(['mappa', 'timeline'] as const).map((c) => (
              <button key={c} className={center === c ? 'active' : ''} aria-pressed={center === c} onClick={() => setCenter(c)}>
                {c === 'mappa' ? 'Mappa' : 'Giorni'}
              </button>
            ))}
          </div>
          {center === 'mappa' ? (
            <MapView trip={trip} selectedStopId={selectionStopId(trip, days, current)} onSelectStop={(id) => setSel({ kind: 'stop', id })} />
          ) : (
            <Timeline days={days} sel={current} onSelect={setSel} />
          )}
        </section>
      </div>
    </div>
  );
}

/** Riassunto breve di un tratto per la linea del percorso */
function legLabel(leg: Leg, trip: Trip): string {
  const t = legTotals(leg, trip.settings);
  if (t.hasUncalculated) return 'da calcolare';
  if (t.partial) return 'durata da inserire';
  return formatDuration(t.realisticMin);
}

/** Linea del percorso (stile metropolitana): panoramica di tutto il viaggio e scelta rapida di tappe e tratti */
function RouteLine({ trip, days, sel, onSelect, onMove }: { trip: Trip; days: DayInfo[]; sel?: Selection; onSelect: (s: Selection) => void; onMove: (id: string, to: number) => void }) {
  const { readOnly } = useTrip();
  const drag = useStopDrag({ axis: 'x', disabled: readOnly, onDrop: onMove });
  const activeStop = selectionStopId(trip, days, sel);
  const navRef = useRef<HTMLElement>(null);
  // Solo scorrimento orizzontale della linea, senza spostare la pagina
  useEffect(() => {
    const nav = navRef.current;
    const el = nav?.querySelector<HTMLElement>('li.is-selected, .route-leg.is-selected');
    if (!nav || !el) return;
    const left = el.offsetLeft; // la linea è position: relative, quindi è il riferimento di offsetLeft
    if (left < nav.scrollLeft || left + el.offsetWidth > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = Math.max(0, left - nav.clientWidth / 2 + el.offsetWidth / 2);
  }, [activeStop, sel?.kind, sel?.id]);
  // Arrivo di ogni tappa: inizio del viaggio + notti delle tappe precedenti
  let c = 0;
  const arrivals = trip.stops.map((s) => {
    const d = addDays(trip.startDate, c);
    c += s.nights;
    return d;
  });
  return (
    <nav className="route-line" aria-label="Tappe del viaggio" ref={navRef}>
      {drag.ghost}
      <ol data-stop-list>
        {trip.stops.map((s, i) => {
          const leg = i < trip.stops.length - 1 ? trip.legs.find((l) => l.fromStopId === s.id) : undefined;
          const on = s.id === activeStop && sel?.kind !== 'leg';
          const legOn = leg !== undefined && sel?.kind === 'leg' && sel.id === leg.id;
          return (
            <li key={s.id} data-stop-id={s.id} className={`${on ? 'is-selected' : ''} ${s.kind === 'a_bordo' ? 'is-ship' : ''} ${drag.rowClass(s.id)}`}>
              <button type="button" className="route-station" aria-current={on ? 'step' : undefined} onPointerDown={(e) => drag.press(e, s.id, s.name)} onClick={() => onSelect({ kind: 'stop', id: s.id })}>
                <span className="route-dot">{s.kind === 'a_bordo' ? <Icon name="ship" label="Notti a bordo" /> : i + 1}</span>
                <span className="route-name">{s.name}</span>
                <span className="route-meta">
                  {shortDate(arrivals[i] ?? trip.startDate)}
                  {s.nights > 0 ? ` · ${s.nights} ${s.nights === 1 ? 'notte' : 'notti'}` : ''}
                </span>
              </button>
              {leg && (
                <button
                  type="button"
                  className={`route-leg ${legOn ? 'is-selected' : ''}`}
                  aria-current={legOn ? 'step' : undefined}
                  aria-label={`Tratto ${s.name} → ${trip.stops[i + 1]?.name ?? ''}: ${legLabel(leg, trip)}`}
                  onClick={() => onSelect({ kind: 'leg', id: leg.id })}
                >
                  {leg.segments.filter((x) => x.mode !== 'non_calcolato').map((x) => (
                    <ModeIcon key={x.id} mode={x.mode} />
                  ))}{' '}
                  {legLabel(leg, trip)}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Outline({
  onMove,
  trip,
  days,
  sel,
  onSelect,
  filter,
  setFilter,
  refEl,
  onAddStop,
  onScroll,
  detail,
  summary,
}: {
  onMove: (id: string, to: number) => void;
  trip: ReturnType<typeof useTrip>['trip'];
  days: ReturnType<typeof computeDays>;
  sel?: Selection;
  onSelect: (s: Selection) => void;
  filter: string;
  setFilter: (v: string) => void;
  refEl: RefObject<HTMLElement | null>;
  onAddStop: (s: Stop | undefined) => void;
  onScroll: () => void;
  /** Dettaglio della selezione, aperto subito sotto la voce scelta */
  detail?: ReactNode;
  /** Riepilogo del viaggio in fondo all'elenco quando non c'è una selezione */
  summary?: ReactNode;
}) {
  const q = filter.trim().toLowerCase();
  const shown = trip.stops.filter((s) => !q || s.name.toLowerCase().includes(q));
  const is = (kind: Selection['kind'], id: string) => sel?.kind === kind && sel.id === id;
  const { readOnly } = useTrip();
  // Selezione di più tappe da eliminare insieme: finché è aperta le righe si spuntano e non si trascinano
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const chosen = trip.stops.filter((s) => picked.includes(s.id));
  const allShown = shown.length > 0 && shown.every((s) => picked.includes(s.id));
  const stopPicking = () => {
    setPicking(false);
    setPicked([]);
    setConfirming(false);
  };
  // Con il filtro attivo le posizioni visibili non sono quelle del viaggio
  const canDrag = !q && !readOnly && !picking && trip.stops.length > 1;
  const drag = useStopDrag({ axis: 'y', disabled: !canDrag, onDrop: onMove });

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
      <StopPicker onAdd={onAddStop} />
      <PendingPanel />
      {trip.stops.length > 3 && <input className="ol-filter" type="search" placeholder="Filtra le tappe" aria-label="Filtra le tappe" value={filter} onChange={(e) => setFilter(e.target.value)} />}
      {trip.stops.length > 0 && !readOnly &&
        (picking ? (
          <div className="row wrap ol-pick-bar">
            <button className="btn btn-small" onClick={() => setPicked(allShown ? [] : shown.map((s) => s.id))}>
              {allShown ? 'Deseleziona tutte' : 'Seleziona tutte'}
            </button>
            <button className="btn btn-small danger" disabled={chosen.length === 0} onClick={() => setConfirming(true)}>
              Elimina{chosen.length > 0 && ` (${chosen.length})`}
            </button>
            <button className="btn btn-small btn-ghost" onClick={stopPicking}>
              Fine
            </button>
          </div>
        ) : (
          <div className="ol-pick-bar">
            <button className="btn btn-small" onClick={() => setPicking(true)}>
              Seleziona tappe da eliminare
            </button>
          </div>
        ))}
      {confirming && <RemoveStopsDialog stops={chosen} onClose={() => setConfirming(false)} onDone={stopPicking} />}
      {canDrag && <p className="small muted">Tieni premuta una tappa e trascinala per cambiare l'ordine.</p>}
      {drag.ghost}
      <div className="ol-scroll" onKeyDown={onKey}>
        {trip.stops.length === 0 ? (
          <Empty title="Inizia dall'arrivo">Aggiungi come prima tappa l'aeroporto o la città di arrivo, poi le località dove dormire.</Empty>
        ) : shown.length === 0 ? (
          <p className="muted small">Nessuna tappa corrisponde al filtro.</p>
        ) : picking ? (
          <ol className="ol-list">
            {shown.map((s) => (
              <li key={s.id}>
                <label className="ol-item ol-stop ol-pick">
                  <input type="checkbox" checked={picked.includes(s.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, s.id] : picked.filter((x) => x !== s.id))} />
                  <span className="ol-num">{s.kind === 'a_bordo' ? <Icon name="ship" label="Notti a bordo" /> : trip.stops.indexOf(s) + 1}</span>
                  <span className="ol-name">{s.name}</span>
                  <span className="small muted">{s.nights === 0 ? 'di passaggio' : `${s.nights} ${s.nights === 1 ? 'notte' : 'notti'}`}</span>
                </label>
              </li>
            ))}
          </ol>
        ) : (
          <ol className="ol-list" data-stop-list>
            {shown.map((s) => {
              const i = trip.stops.indexOf(s);
              const leg = trip.legs.find((l) => l.fromStopId === s.id);
              const stopDays = days.filter((d) => d.sleepStop?.id === s.id);
              const totals = leg ? legTotals(leg, trip.settings) : undefined;
              return (
                <li key={s.id} data-stop-id={s.id} className={drag.rowClass(s.id)}>
                  <button className={`ol-item ol-stop ${is('stop', s.id) ? 'active' : ''}`} aria-current={is('stop', s.id) ? 'true' : undefined} onPointerDown={(e) => drag.press(e, s.id, s.name)} onClick={() => onSelect({ kind: 'stop', id: s.id })}>
                    {canDrag && (
                      <span className="ol-grip">
                        <Icon name="grip" />
                      </span>
                    )}
                    <span className="ol-num">{s.kind === 'a_bordo' ? <Icon name="ship" label="Notti a bordo" /> : i + 1}</span>
                    <span className="ol-name">{s.name}</span>
                    <span className="small muted">
                      {s.nights === 0 ? 'di passaggio' : `${s.nights} ${s.nights === 1 ? 'notte' : 'notti'}`}
                      {stopState(trip, s.id) !== 'pianificata' && ` · ${STOP_STATE_LABEL[stopState(trip, s.id)]}`}
                    </span>
                  </button>
                  {is('stop', s.id) && detail}
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
                            {is('day', d.key) && detail}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {leg && i < trip.stops.length - 1 && (
                    <button className={`ol-item ol-leg ${is('leg', leg.id) ? 'active' : ''}`} aria-current={is('leg', leg.id) ? 'true' : undefined} onClick={() => onSelect({ kind: 'leg', id: leg.id })}>
                      {leg.segments.map((x) => <ModeIcon key={x.id} mode={x.mode} />)} {totals?.hasUncalculated ? 'Tratto non calcolato' : totals?.partial ? 'Durata da inserire' : formatDuration(totals?.realisticMin ?? 0)}
                    </button>
                  )}
                  {leg && i < trip.stops.length - 1 && is('leg', leg.id) && detail}
                </li>
              );
            })}
          </ol>
        )}
      </div>
      {summary}
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

type StopTab = 'panoramica' | 'giornate' | 'alloggio' | 'costi' | 'note';

function Inspector({ sel, onSelect, onClear, routing }: { sel?: Selection; onSelect: (s: Selection) => void; onClear: () => void; routing: ReturnType<typeof useLegRouting> }) {
  const { trip, update, toast } = useTrip();
  const days = useMemo(() => computeDays(trip), [trip]);
  const loads = useMemo(() => computeDayLoads(trip, days), [trip, days]);
  const suggestions = useMemo(() => suggestAlternatives(trip), [trip]);
  const [draftAcc, setDraftAcc] = useState<Accommodation | null>(null);
  const [tab, setTab] = useState<StopTab>('panoramica');

  const applySg = (sg: Suggestion) => {
    if (!sg.action) return;
    const action = sg.action;
    const before = trip;
    update((t) => applySuggestion(t, action));
    toast('Proposta applicata', 'ok', { label: 'Annulla', run: () => update((cur) => restorePlanOnly(cur, before)) });
  };

  if (!sel) {
    return (
      <section className="planner-summary" aria-label="Riepilogo del viaggio">
        <h2>Riepilogo del viaggio</h2>
        <p className="small muted">Scegli una tappa, un giorno o un tratto: il dettaglio si apre qui nell'elenco.</p>
        <CostPanel />
      </section>
    );
  }

  let body: ReactNode = null;
  if (sel.kind === 'stop') {
    const i = trip.stops.findIndex((s) => s.id === sel.id);
    const stop = trip.stops[i]!;
    const dest = findDestination(stop.destinationId);
    const setStop = (patch: Partial<Stop>) => update((t) => ({ ...t, stops: t.stops.map((s) => (s.id === stop.id ? { ...s, ...patch } : s)) }));
    const stopDays = days.filter((d) => d.sleepStop?.id === stop.id);
    const prevLeg = i > 0 ? trip.legs.find((l) => l.toStopId === stop.id) : undefined;
    const nextLeg = i < trip.stops.length - 1 ? trip.legs.find((l) => l.fromStopId === stop.id) : undefined;
    const hasLodging = stop.kind === 'luogo' && stop.nights > 0;
    const tabs: { id: StopTab; label: string }[] = [
      { id: 'panoramica', label: 'Panoramica' },
      { id: 'giornate', label: `Giornate (${stopDays.length})` },
      ...(hasLodging ? [{ id: 'alloggio' as const, label: stop.accommodationId ? 'Alloggio ✓' : 'Alloggio' }] : []),
      { id: 'costi', label: 'Costi' },
      { id: 'note', label: stop.notes || stop.weatherPlanB ? 'Note e piano B ✓' : 'Note e piano B' },
    ];
    const cur = tabs.some((t) => t.id === tab) ? tab : 'panoramica';
    const tid = `insp-${stop.id}`;
    body = (
      <>
        <StopCard stop={stop} index={i} count={trip.stops.length} checkIn={stopDays[0]?.date} selected={false} onShowOnMap={() => undefined} expanded hideDetails />
        <div className="stop-tabs" role="tablist" aria-label={`Dettagli di ${stop.name}`}>
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" id={`${tid}-${t.id}`} aria-selected={cur === t.id} aria-controls={`${tid}-panel`} className={cur === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="stop-panel" role="tabpanel" id={`${tid}-panel`} aria-labelledby={`${tid}-${cur}`}>
          {cur === 'panoramica' && (
            <>
              <dl className="stop-facts">
                <div>
                  <dt>Tratto in arrivo</dt>
                  <dd>
                    {prevLeg ? (
                      <button type="button" className="link-btn" onClick={() => onSelect({ kind: 'leg', id: prevLeg.id })}>
                        {legLabel(prevLeg, trip)}
                      </button>
                    ) : (
                      'inizio del viaggio'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Tratto successivo</dt>
                  <dd>
                    {nextLeg ? (
                      <button type="button" className="link-btn" onClick={() => onSelect({ kind: 'leg', id: nextLeg.id })}>
                        {legLabel(nextLeg, trip)}
                      </button>
                    ) : (
                      'fine del viaggio'
                    )}
                  </dd>
                </div>
              </dl>
              <div className="row wrap">
                <a className="btn btn-small" href={googlePlaceUrl(stop)} target="_blank" rel="noreferrer">
                  <Icon name="map" /> Vedi su Google Maps ↗
                </a>
                {dest && <OfficialLink id={dest.id} />}
              </div>
            </>
          )}
          {cur === 'giornate' &&
            (stopDays.length === 0 ? (
              <p className="muted small">Sosta di passaggio: nessuna giornata in questa tappa.</p>
            ) : (
              <ul className="stop-days">
                {stopDays.map((d) => {
                  const acts = trip.days[d.key]?.activities ?? [];
                  return (
                    <li key={d.key}>
                      <button type="button" className="ol-item" onClick={() => onSelect({ kind: 'day', id: d.key })}>
                        <strong>
                          Giorno {d.index + 1} · {formatDateIt(d.date)}
                        </strong>
                        <span className="small muted">
                          {acts.length === 0 ? (d.nightIndex === 0 ? 'arrivo, nessuna attività' : 'nessuna attività') : acts.map((a) => a.title || 'attività').join(' · ')}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ))}
          {cur === 'alloggio' && hasLodging && (
            <>
              <StopLodgingSelect stop={stop} />
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
            </>
          )}
          {cur === 'costi' && <CostPanel sel={sel} bare />}
          {cur === 'note' && (
            <div className="grid-2">
              <Field label="Note">{(id) => <textarea id={id} rows={3} value={stop.notes} onChange={(e) => setStop({ notes: e.target.value })} />}</Field>
              <Field label="Alternativa in caso di maltempo">
                {(id) => <textarea id={id} rows={3} value={stop.weatherPlanB} onChange={(e) => setStop({ weatherPlanB: e.target.value })} />}
              </Field>
            </div>
          )}
        </div>
      </>
    );
  } else if (sel.kind === 'leg') {
    const leg = trip.legs.find((l) => l.id === sel.id)!;
    const i = trip.stops.findIndex((s) => s.id === leg.fromStopId);
    body = (
      <>
        <LegCard leg={leg} fromNum={i + 1} day={days.find((d) => d.legs.some((l) => l.id === leg.id))} busy={routing.busy === leg.id} onCalc={() => routing.calcOne(leg)} expanded />
        <CostPanel sel={sel} />
      </>
    );
  } else {
    const d = days.find((x) => x.key === sel.id)!;
    body = (
      <>
        <DayCard day={d} load={loads[d.index]!} suggestions={suggestions.filter((sg) => sg.dayKey === d.key)} onApply={applySg} expanded />
        <CostPanel sel={sel} />
      </>
    );
  }

  return (
    <div className="ol-detail" role="region" aria-label="Dettagli della selezione" onKeyDown={(e) => e.key === 'Escape' && !(e.target as HTMLElement).closest('dialog') && onClear()}>
      <div className="insp-head">
        <h2>{sel.kind === 'stop' ? 'Tappa' : sel.kind === 'leg' ? 'Trasferimento' : 'Giornata'}</h2>
        <button className="btn btn-small" onClick={onClear}>
          Chiudi
        </button>
      </div>
      {body}
    </div>
  );
}

function CostPanel({ sel, bare }: { sel?: Selection; bare?: boolean }) {
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
    <section className={bare ? '' : 'insp-block'} aria-label="Costi">
      {!bare && <h3>Costi</h3>}
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
