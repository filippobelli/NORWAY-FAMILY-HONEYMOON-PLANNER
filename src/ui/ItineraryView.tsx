import { useEffect, useMemo, useRef, useState } from 'react';
import { COASTAL_PORTS_NORTHBOUND } from '../data/coastalPorts';
import { DESTINATIONS, findDestination } from '../data/destinations';
import { newId } from '../domain/ids';
import {
  addDays,
  computeDays,
  formatDateIt,
  formatDuration,
  isRoutableLeg,
  legSummary,
  legTotals,
  type DayInfo,
  type LegState,
  moveItem,
  totalDays,
  tripWarnings,
  TRIP_MAX_DAYS,
  TRIP_MIN_DAYS,
  uncalculatedSegment,
} from '../domain/itinerary';
import { isAutoSegment, mergeRouted } from '../domain/routeMerge';
import type { Leg, Segment, Stop, TransportMode, Trip } from '../domain/types';
import { getRoutingProvider, RoutingError } from '../services/routing';
import { useTrip } from '../state/store';
import { Badge, Empty, Field, fmtDateTime, MODE_ICON, MODE_LABEL, MoneyInput, NumberInput, StatusBadge, StatusSelect } from './common';
import { AUTO_ROUTE_KEY } from './ConfiguratorView';
import { MapView } from './MapView';

export function stopFromDestination(destinationId: string): Stop | undefined {
  const d = findDestination(destinationId);
  if (!d) return undefined;
  // Gli aeroporti sono punti di arrivo/partenza: di norma non ci si dorme
  const nights = d.category === 'aeroporti' ? 0 : 1;
  return { id: newId(), kind: 'luogo', destinationId: d.id, name: d.name, lat: d.lat, lng: d.lng, nights, notes: '', weatherPlanB: '' };
}

export function ItineraryView() {
  const { trip, update, toast } = useTrip();
  const days = useMemo(() => computeDays(trip), [trip]);
  const warnings = useMemo(() => tripWarnings(trip), [trip]);
  const n = totalDays(trip.stops);
  const [busy, setBusy] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  // Tappa selezionata: collega scheda e mappa (clic sul numero o sul segnaposto)
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const selectStop = (id: string, from: 'lista' | 'mappa') => {
    setSelected(id);
    if (from === 'mappa') document.getElementById(`stop-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    else if (window.matchMedia('(max-width: 1099px)').matches) document.querySelector('.map-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const addStop = (s: Stop | undefined) => {
    if (!s) return;
    update((t) => ({ ...t, stops: [...t.stops, s] }));
    toast(`Aggiunta tappa: ${s.name}`);
  };

  const routeLeg = async (leg: Leg, t: Trip, signal: AbortSignal): Promise<void> => {
    const a = t.stops.find((s) => s.id === leg.fromStopId);
    const b = t.stops.find((s) => s.id === leg.toStopId);
    if (!a || !b) return;
    try {
      const r = await getRoutingProvider().route(a, b, signal);
      update((cur) => ({ ...cur, legs: cur.legs.map((l) => (l.id === leg.id ? mergeRouted(l, r.segments) : l)) }));
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      const msg = e instanceof RoutingError ? e.message : 'Errore imprevisto nel calcolo del percorso.';
      update((cur) => ({ ...cur, legs: cur.legs.map((l) => (l.id === leg.id ? { ...l, routingError: msg } : l)) }));
      throw e;
    }
  };

  const calcOne = async (leg: Leg) => {
    if (!isRoutableLeg(leg, trip.stops)) {
      toast('Questo tratto arriva o parte da una notte a bordo: collega l\'opzione di navigazione costiera invece del percorso stradale.', 'errore');
      return;
    }
    const manual = leg.segments.filter((sg) => ['treno', 'bus', 'aereo', 'costiera'].includes(sg.mode));
    if (
      manual.length > 0 &&
      !window.confirm(
        `Il tratto contiene già ${manual.map((m) => MODE_LABEL[m.mode].toLowerCase()).join(', ')}. Il percorso stradale verrà AGGIUNTO in sequenza: continua solo se si guida anche. Procedere?`,
      )
    ) {
      return;
    }
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setBusy(leg.id);
    try {
      await routeLeg(leg, trip, ac.signal);
      toast('Percorso calcolato');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast((e as Error).message, 'errore');
    } finally {
      setBusy(null);
    }
  };

  const calcAll = async () => {
    const pending = trip.legs.filter((l) => legTotals(l).hasUncalculated);
    const todo = pending.filter((l) => isRoutableLeg(l, trip.stops));
    const skipped = pending.length - todo.length;
    if (skipped > 0) {
      update((cur) => ({
        ...cur,
        legs: cur.legs.map((l) =>
          pending.includes(l) && !isRoutableLeg(l, cur.stops)
            ? { ...l, routingError: 'Tratto con notte a bordo: collega la navigazione costiera (sezione Crociere → Collega a un tratto).' }
            : l,
        ),
      }));
    }
    if (todo.length === 0) return toast(skipped ? 'Restano solo tratti in nave da collegare alla navigazione costiera' : 'Tutti i tratti sono già calcolati');
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    let ok = 0;
    let ko = 0;
    for (const leg of todo) {
      if (ac.signal.aborted) break;
      setBusy(leg.id);
      try {
        await routeLeg(leg, trip, ac.signal);
        ok++;
      } catch (e) {
        if ((e as Error).name === 'AbortError') break;
        ko++;
      }
    }
    setBusy(null);
    toast(`Calcolati ${ok} tratti${ko ? `, ${ko} non riusciti` : ''}${skipped ? `, ${skipped} in nave da collegare` : ''}`, ko ? 'errore' : 'ok');
  };

  // Dopo il configuratore: calcolo automatico dei tratti del nuovo scenario (una sola volta)
  useEffect(() => {
    let pending = false;
    try {
      pending = sessionStorage.getItem(AUTO_ROUTE_KEY) === '1';
      if (pending) sessionStorage.removeItem(AUTO_ROUTE_KEY);
    } catch {
      pending = false;
    }
    if (pending) void calcAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="itinerary">
      <section className="panel">
        <header className="panel-head">
          <div>
            <h2>Tappe</h2>
            <p className="muted">
              {n === 0 ? 'Nessuna tappa' : `${n} giorni · ${trip.stops.length} ${trip.stops.length === 1 ? 'tappa' : 'tappe'}`} · obiettivo {TRIP_MIN_DAYS}–{TRIP_MAX_DAYS} giorni
            </p>
          </div>
          <div className="row">
            {busy ? (
              <button className="btn" onClick={() => abort.current?.abort()}>
                Interrompi calcolo
              </button>
            ) : (
              <button className="btn btn-primary" onClick={calcAll} disabled={trip.legs.length === 0}>
                Calcola tratti mancanti
              </button>
            )}
          </div>
        </header>

        {warnings.length > 0 && (
          <ul className="warnings">
            {warnings.map((w) => (
              <li key={w.text} className={`warn-${w.level}`}>
                {w.text}
              </li>
            ))}
          </ul>
        )}

        <StopPicker onAdd={addStop} />

        {trip.stops.length === 0 ? (
          <Empty title="Inizia dall'arrivo">
            Aggiungi come prima tappa l'aeroporto o la città di arrivo, poi le località dove dormire. Puoi anche cliccare un punto sulla mappa.
          </Empty>
        ) : (
          <ol className="stops">
            {trip.stops.map((s, i) => {
              const leg = trip.legs.find((l) => l.fromStopId === s.id);
              const day = days.find((d) => d.sleepStop?.id === s.id);
              return (
                <li key={s.id} id={`stop-${s.id}`}>
                  <StopCard
                    stop={s}
                    index={i}
                    count={trip.stops.length}
                    checkIn={day?.date}
                    selected={selected === s.id}
                    onShowOnMap={() => selectStop(s.id, 'lista')}
                  />
                  {leg && i < trip.stops.length - 1 && (
                    <LegCard
                      leg={leg}
                      fromNum={i + 1}
                      day={days.find((d) => d.legs.some((l) => l.id === leg.id))}
                      busy={busy === leg.id}
                      onCalc={() => calcOne(leg)}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="panel map-panel">
        <MapView
          trip={trip}
          onAddDestination={(id) => addStop(stopFromDestination(id))}
          selectedStopId={selected}
          onSelectStop={(id) => selectStop(id, 'mappa')}
        />
        <p className="muted small">
          Mappa © contributori OpenStreetMap (o Esri aprendo il file locale). Percorsi: OSRM (routing.openstreetmap.de). Coordinate del catalogo approssimative. Le linee
          tratteggiate sottili indicano collegamenti senza tracciato e non rappresentano distanze.
        </p>
      </section>
    </div>
  );
}

function StopPicker({ onAdd }: { onAdd: (s: Stop | undefined) => void }) {
  const [q, setQ] = useState('');
  const [custom, setCustom] = useState(false);
  const [c, setC] = useState<{ name: string; lat?: number; lng?: number }>({ name: '' });
  const results = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (qq.length < 2) return [];
    return DESTINATIONS.filter((d) => `${d.name} ${d.localName ?? ''} ${d.region}`.toLowerCase().includes(qq)).slice(0, 8);
  }, [q]);

  return (
    <div className="picker">
      <div className="row">
        <input
          type="search"
          placeholder="Cerca una località del catalogo (es. Geiranger, Flåm, Bergen)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Cerca località"
        />
        <button className="btn" onClick={() => setCustom((v) => !v)} aria-expanded={custom}>
          Luogo personalizzato
        </button>
        <button
          className="btn"
          title="Notte a bordo della nave costiera: non serve un alloggio"
          onClick={() =>
            onAdd({ id: newId(), kind: 'a_bordo', name: 'Notte a bordo (nave costiera)', lat: 66.5, lng: 12.8, nights: 1, notes: '', weatherPlanB: '' })
          }
        >
          + Notte a bordo
        </button>
      </div>
      {results.length > 0 && (
        <ul className="suggestions" role="listbox">
          {results.map((d) => (
            <li key={d.id}>
              <button
                onClick={() => {
                  onAdd(stopFromDestination(d.id));
                  setQ('');
                }}
              >
                <strong>{d.name}</strong> <span className="muted">{d.region}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.trim().length >= 2 && results.length === 0 && <p className="muted small">Nessuna località trovata nel catalogo: usa "Luogo personalizzato".</p>}
      {custom && (
        <div className="custom-place grid-3">
          <Field label="Nome">{(id) => <input id={id} value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />}</Field>
          <Field label="Latitudine" hint="Da Google Maps: clic destro sul punto">
            {(id) => <NumberInput id={id} value={c.lat} onChange={(v) => setC({ ...c, lat: v })} />}
          </Field>
          <Field label="Longitudine">{(id) => <NumberInput id={id} value={c.lng} onChange={(v) => setC({ ...c, lng: v })} />}</Field>
          <button
            className="btn btn-primary"
            disabled={!c.name.trim() || c.lat === undefined || c.lng === undefined || Math.abs(c.lat) > 90 || Math.abs(c.lng) > 180}
            onClick={() => {
              onAdd({ id: newId(), kind: 'luogo', name: c.name.trim(), lat: c.lat!, lng: c.lng!, nights: 1, notes: '', weatherPlanB: '' });
              setC({ name: '' });
              setCustom(false);
            }}
          >
            Aggiungi luogo
          </button>
        </div>
      )}
    </div>
  );
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const ACC_STATUS_LABEL = { individuata: 'individuata', disponibile: 'disponibile', opzionata: 'opzionata', prenotata: 'prenotata' } as const;

function StopCard({
  stop,
  index,
  count,
  checkIn,
  selected,
  onShowOnMap,
}: {
  stop: Stop;
  index: number;
  count: number;
  checkIn?: string;
  selected: boolean;
  onShowOnMap: () => void;
}) {
  const { trip, update } = useTrip();
  const dest = findDestination(stop.destinationId);
  const setStop = (patch: Partial<Stop>) => update((t) => ({ ...t, stops: t.stops.map((s) => (s.id === stop.id ? { ...s, ...patch } : s)) }));
  const move = (to: number) => update((t) => ({ ...t, stops: moveItem(t.stops, index, to) }));
  const accs = trip.accommodations.filter((a) => !a.stopId || a.stopId === stop.id);
  const acc = trip.accommodations.find((a) => a.id === stop.accommodationId);

  return (
    <article className={`stop ${stop.kind === 'a_bordo' ? 'stop-ship' : ''} ${selected ? 'stop-selected' : ''}`}>
      <div className="stop-head">
        <button className="stop-num" onClick={onShowOnMap} aria-label={`Mostra ${stop.name} sulla mappa`} aria-pressed={selected} title="Mostra sulla mappa">
          {index + 1}
        </button>
        <div className="stop-title">
          <strong>
            {stop.name}
            {selected && <span className="sel-tag">◉ sulla mappa</span>}
          </strong>
          <span className="muted small">
            {dest ? dest.region : stop.kind === 'a_bordo' ? 'Pernottamento in nave' : 'Luogo personalizzato'}
          </span>
          <span className="stop-meta small">
            {checkIn && stop.nights > 0 ? (
              <span className="stop-dates">
                {shortDate(checkIn)} → {shortDate(addDays(checkIn, stop.nights))}
              </span>
            ) : stop.nights === 0 ? (
              <span className="muted">Sosta di passaggio, senza pernottamento</span>
            ) : null}
            {stop.kind === 'luogo' && stop.nights > 0 &&
              (acc ? (
                <Badge tone={acc.status === 'prenotata' ? 'ok' : 'info'}>
                  🛏 {acc.name} · {ACC_STATUS_LABEL[acc.status]}
                </Badge>
              ) : (
                <Badge tone="warn">🛏 Alloggio da scegliere</Badge>
              ))}
          </span>
        </div>
        <div className="stepper" aria-label="Notti">
          <button aria-label="Una notte in meno" onClick={() => setStop({ nights: Math.max(0, stop.nights - 1) })}>
            −
          </button>
          <span>
            {stop.nights} {stop.nights === 1 ? 'notte' : 'notti'}
          </span>
          <button aria-label="Una notte in più" onClick={() => setStop({ nights: Math.min(14, stop.nights + 1) })}>
            +
          </button>
        </div>
        <div className="row tight">
          <button className="icon-btn" aria-label="Sposta su" disabled={index === 0} onClick={() => move(index - 1)}>
            ↑
          </button>
          <button className="icon-btn" aria-label="Sposta giù" disabled={index === count - 1} onClick={() => move(index + 1)}>
            ↓
          </button>
          <button
            className="icon-btn danger"
            aria-label={`Rimuovi ${stop.name}`}
            onClick={() => {
              if (window.confirm(`Rimuovere la tappa "${stop.name}"? I tratti calcolati verso questa tappa verranno ricalcolati.`)) {
                update((t) => ({
                  ...t,
                  stops: t.stops.filter((s) => s.id !== stop.id),
                  accommodations: t.accommodations.map((a) => (a.stopId === stop.id ? { ...a, stopId: undefined } : a)),
                }));
              }
            }}
          >
            ✕
          </button>
        </div>
      </div>
      {stop.kind === 'a_bordo' && (
        <div className="row wrap small">
          <label htmlFor={`port-${stop.id}`} className="muted">
            Porto di imbarco (posizione sulla mappa):
          </label>
          <select
            id={`port-${stop.id}`}
            value={COASTAL_PORTS_NORTHBOUND.find((p) => p.lat === stop.lat && p.lng === stop.lng)?.name ?? ''}
            onChange={(e) => {
              const p = COASTAL_PORTS_NORTHBOUND.find((x) => x.name === e.target.value);
              if (p) setStop({ lat: p.lat, lng: p.lng, name: `Notte a bordo da ${p.name}` });
            }}
          >
            <option value="">— scegli —</option>
            {COASTAL_PORTS_NORTHBOUND.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {dest?.augustNote && <p className="note-warn small">⚠️ {dest.augustNote}</p>}
      <details>
        <summary>
          Alloggio, note e piano B{stop.notes || stop.weatherPlanB ? ' · compilati' : ''}
        </summary>
        <div className="grid-2">
          {stop.kind === 'luogo' && (
            <Field label="Alloggio" hint="Le sistemazioni si gestiscono nella sezione Alloggi">
              {(id) => (
                <select
                  id={id}
                  value={stop.accommodationId ?? ''}
                  onChange={(e) => {
                    const accommodationId = e.target.value || undefined;
                    update((t) => ({
                      ...t,
                      stops: t.stops.map((s) => (s.id === stop.id ? { ...s, accommodationId } : s)),
                      accommodations: t.accommodations.map((a) =>
                        a.id === accommodationId ? { ...a, stopId: stop.id } : a.id === stop.accommodationId ? { ...a, stopId: undefined } : a,
                      ),
                    }));
                  }}
                >
                  <option value="">— nessuno —</option>
                  {accs.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.status})
                    </option>
                  ))}
                </select>
              )}
            </Field>
          )}
          <Field label="Note">{(id) => <textarea id={id} rows={2} value={stop.notes} onChange={(e) => setStop({ notes: e.target.value })} />}</Field>
          <Field label="Alternativa in caso di maltempo">
            {(id) => <textarea id={id} rows={2} value={stop.weatherPlanB} onChange={(e) => setStop({ weatherPlanB: e.target.value })} />}
          </Field>
        </div>
      </details>
    </article>
  );
}

const LEG_STATE: Record<LegState, string> = {
  da_calcolare: '❔ Da calcolare',
  calcolato: '✓ Calcolato (OSRM)',
  manuale: '✎ Inserito a mano',
  misto: '✓ Calcolato + ✎ a mano',
};
const FIRM_STATUS = ['confermato', 'prenotato', 'pagato'];

function LegCard({ leg, fromNum, day, busy, onCalc }: { leg: Leg; fromNum: number; day?: DayInfo; busy: boolean; onCalc: () => void }) {
  const { trip, update } = useTrip();
  const t = legTotals(leg, trip.settings);
  const sum = legSummary(leg, trip.settings);
  const fromStop = trip.stops.find((s) => s.id === leg.fromStopId);
  const toStop = trip.stops.find((s) => s.id === leg.toStopId);
  const routable = isRoutableLeg(leg, trip.stops);
  const setLeg = (fn: (l: Leg) => Leg) => update((tr) => ({ ...tr, legs: tr.legs.map((l) => (l.id === leg.id ? fn(l) : l)) }));
  const [addMode, setAddMode] = useState<TransportMode | ''>('');

  const addSegment = (mode: TransportMode) => {
    const seg: Segment = { id: newId(), mode, label: MODE_LABEL[mode], status: 'da_verificare', costStatus: 'da_verificare' };
    setLeg((l) => ({ ...l, segments: [...l.segments.filter((s) => s.mode !== 'non_calcolato'), seg] }));
  };

  const real = leg.segments.filter((s) => s.mode !== 'non_calcolato');
  return (
    <div className={`leg leg-${sum.state}`} aria-busy={busy}>
      <div className="leg-head">
        <span className="leg-line" aria-hidden />
        <div className="leg-summary">
          <div className="leg-route">
            <span className="leg-ends">
              <span className="leg-num">{fromNum}</span> {fromStop?.name ?? '—'} → <span className="leg-num">{fromNum + 1}</span> {toStop?.name ?? '—'}
            </span>
            {day && (
              <span className="muted small">
                giorno {day.index + 1} · {formatDateIt(day.date)}
              </span>
            )}
            <span className={`leg-state state-${sum.state}`}>{LEG_STATE[sum.state]}</span>
          </div>
          {real.length === 0 ? (
            <span className="muted">❔ Collegamento non calcolato: distanza e durata non disponibili</span>
          ) : (
            <span className="leg-totals">
              {sum.roadKm > 0 && (
                <>
                  <strong>{Math.round(sum.roadKm)} km su strada</strong> · guida {formatDuration(sum.driveMin)}
                </>
              )}
              {t.ferryCount > 0 && (
                <>
                  {sum.roadKm > 0 && ' · '}
                  {t.ferryCount} traghett{t.ferryCount === 1 ? 'o' : 'i'}
                </>
              )}
              {sum.otherMin > 0 && (
                <>
                  {' · '}
                  {real.every((s) => s.mode === 'strada' || s.mode === 'traghetto') ? 'traversate' : 'traversate e altri mezzi'} {formatDuration(sum.otherMin)}
                </>
              )}
              {sum.totalMin !== undefined ? (
                <>
                  {' · '}totale teorico {formatDuration(sum.totalMin)}
                  {sum.realisticMin !== undefined && sum.realisticMin > sum.totalMin && (
                    <span title="Con soste durante la guida e attese ai traghetti non inserite: ipotesi modificabili in Salvataggio → Viaggio">
                      {' · '}
                      <strong>realistici ~{formatDuration(sum.realisticMin)}</strong>
                    </span>
                  )}
                </>
              ) : (
                <>
                  {' · '}
                  <Badge tone="warn">
                    totale non calcolabile: {sum.missingDuration} {sum.missingDuration === 1 ? 'segmento' : 'segmenti'} senza durata
                  </Badge>
                </>
              )}
            </span>
          )}
          {real.length > 0 && (
            <ul className="seg-chips" aria-label="Componenti del tratto">
              {real.map((s) => (
                <li key={s.id} className={`seg-chip seg-${s.mode}`}>
                  <span aria-hidden>{MODE_ICON[s.mode]}</span> {s.mode === 'strada' ? MODE_LABEL.strada : s.label}
                  {s.distanceKm !== undefined ? ` · ${Math.round(s.distanceKm)} km` : s.mode === 'strada' ? ' · distanza da inserire' : ''}
                  {s.durationMin !== undefined ? ` · ${formatDuration(s.durationMin)}` : <em> · durata da inserire</em>}
                  {s.waitMin !== undefined && ` + attesa ${formatDuration(s.waitMin)}`}
                  {s.mode !== 'strada' && (
                    <em>{FIRM_STATUS.includes(s.status) ? (s.departureTime ? ` · ore ${s.departureTime}` : ' · confermato') : ' · orario da verificare'}</em>
                  )}
                  <span className="seg-src">{isAutoSegment(s) ? 'calcolato' : 'inserito a mano'}</span>
                </li>
              ))}
            </ul>
          )}
          {t.estimatedWaitMin > 0 && (
            <span className="muted small">Attesa ai traghetti ipotizzata ({formatDuration(t.estimatedWaitMin)}): inserisci quella reale con l'orario.</span>
          )}
          {t.mixedModes && <span className="note-warn small">Strada e treno/nave/aereo nello stesso tratto: tienili solo se sono in sequenza.</span>}
          {t.possibleDuplicateFerry && <span className="note-warn small">Traghetto calcolato e traghetto manuale insieme: probabile doppio conteggio.</span>}
          {!routable && t.hasUncalculated && (
            <span className="muted small">Tratto in nave: collegalo a un'opzione nella sezione Crociere oppure aggiungi un tratto "Navigazione costiera".</span>
          )}
          {leg.routingError && (
            <span className="error small" role="alert">
              {leg.routingError}
            </span>
          )}
        </div>
        {routable && (
          <button className="btn btn-small" onClick={onCalc} disabled={busy}>
            {busy ? 'Calcolo…' : leg.calculatedAt ? 'Ricalcola strada' : 'Calcola strada'}
          </button>
        )}
      </div>
      <details className="leg-details">
        <summary>Dettaglio tratti{leg.calculatedAt ? ` · calcolato ${fmtDateTime(leg.calculatedAt)}` : ''}</summary>
        {leg.segments.map((s) => (
          <SegmentEditor
            key={s.id}
            seg={s}
            trip={trip}
            onChange={(patch) => setLeg((l) => ({ ...l, segments: l.segments.map((x) => (x.id === s.id ? { ...x, ...patch } : x)) }))}
            onRemove={() =>
              setLeg((l) => {
                const rest = l.segments.filter((x) => x.id !== s.id);
                return { ...l, segments: rest.length ? rest : [uncalculatedSegment()] };
              })
            }
          />
        ))}
        <div className="row">
          <select value={addMode} onChange={(e) => setAddMode(e.target.value as TransportMode | '')} aria-label="Tipo di tratto da aggiungere">
            <option value="">Aggiungi tratto manuale…</option>
            {(['traghetto', 'costiera', 'treno', 'bus', 'aereo', 'strada'] as const).map((m) => (
              <option key={m} value={m}>
                {MODE_ICON[m]} {MODE_LABEL[m]}
              </option>
            ))}
          </select>
          <button
            className="btn btn-small"
            disabled={!addMode}
            onClick={() => {
              if (addMode) addSegment(addMode);
              setAddMode('');
            }}
          >
            Aggiungi
          </button>
        </div>
      </details>
    </div>
  );
}

function SegmentEditor({ seg, trip, onChange, onRemove }: { seg: Segment; trip: Trip; onChange: (p: Partial<Segment>) => void; onRemove: () => void }) {
  if (seg.mode === 'non_calcolato') {
    return <p className="muted small">Nessun tratto: usa "Calcola strada" o aggiungi un tratto manuale (traghetto, treno, nave…).</p>;
  }
  const auto = isAutoSegment(seg);
  return (
    <div className="segment">
      <div className="segment-head">
        <span>
          {MODE_ICON[seg.mode]} <strong>{seg.label}</strong> <StatusBadge status={seg.status} />
        </span>
        <button className="icon-btn danger" aria-label="Rimuovi tratto" onClick={onRemove}>
          ✕
        </button>
      </div>
      {seg.note && <p className="muted small">{seg.note}</p>}
      <div className="grid-4">
        <Field label="Descrizione">{(id) => <input id={id} value={seg.label} onChange={(e) => onChange({ label: e.target.value })} />}</Field>
        {seg.mode === 'costiera' && (
          <Field label="Opzione costiera">
            {(id) => (
              <select id={id} value={seg.coastalOptionId ?? ''} onChange={(e) => onChange({ coastalOptionId: e.target.value || undefined })}>
                <option value="">— scegli —</option>
                {trip.coastalOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.operator} {o.fromPort} → {o.toPort}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}
        <Field label="Distanza (km)">
          {(id) => <NumberInput id={id} value={seg.distanceKm} onChange={(v) => onChange({ distanceKm: v })} min={0} />}
        </Field>
        <Field label="Durata (min)">
          {(id) => <NumberInput id={id} value={seg.durationMin} onChange={(v) => onChange({ durationMin: v })} min={0} />}
        </Field>
        {seg.mode !== 'strada' && (
          <>
            <Field label="Attesa/imbarco (min)">
              {(id) => <NumberInput id={id} value={seg.waitMin} onChange={(v) => onChange({ waitMin: v })} min={0} />}
            </Field>
            <Field label="Partenza (orario)">
              {(id) => <input id={id} type="time" value={seg.departureTime ?? ''} onChange={(e) => onChange({ departureTime: e.target.value || undefined })} />}
            </Field>
          </>
        )}
        {seg.mode !== 'costiera' && (
          <Field label="Costo" hint={seg.mode === 'strada' ? 'Pedaggi/parcheggi' : 'Famiglia, con auto se serve'}>
            {(id) => <MoneyInput id={id} value={seg.cost} onChange={(m) => onChange({ cost: m })} />}
          </Field>
        )}
        {seg.mode !== 'costiera' && (
          <Field label="Stato costo">{(id) => <StatusSelect id={id} value={seg.costStatus} onChange={(v) => onChange({ costStatus: v })} />}</Field>
        )}
        <Field label="Stato dati">{(id) => <StatusSelect id={id} value={seg.status} onChange={(v) => onChange({ status: v })} />}</Field>
        <Field label="Fonte (link)">
          {(id) => (
            <input
              id={id}
              type="url"
              placeholder="https://…"
              value={seg.source?.url ?? ''}
              readOnly={auto}
              onChange={(e) =>
                onChange({ source: { label: seg.source?.label ?? 'Fonte inserita a mano', url: e.target.value || undefined, checkedAt: new Date().toISOString() } })
              }
            />
          )}
        </Field>
      </div>
      {seg.source && (
        <p className="muted small">
          Fonte: {seg.source.label}
          {seg.source.checkedAt ? ` · ${fmtDateTime(seg.source.checkedAt)}` : ''}
        </p>
      )}
    </div>
  );
}
