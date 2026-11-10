import { countryInfo, placeCountry, useCatalog } from '../catalog/registry';
import { defaultCountry, stopCountry, tripCountries } from '../domain/countries';
import { useMemo, useRef, useState } from 'react';
import { COASTAL_PORTS_NORTHBOUND } from '../data/coastalPorts';
import { DESTINATIONS, findDestination } from '../data/destinations';
import { newId } from '../domain/ids';
import {
  addDays,
  formatDateIt,
  formatDuration,
  isRoutableLeg,
  legSummary,
  legTotals,
  type DayInfo,
  type LegState,
  moveItem,
  uncalculatedSegment,
} from '../domain/itinerary';
import { googleDirectionsUrl, googleModeForLeg } from '../domain/googleMaps';
import { isAutoSegment, mergeRouted } from '../domain/routeMerge';
import type { Leg, Segment, Stop, TransportMode, Trip } from '../domain/types';
import { getRoutingProvider, RoutingError } from '../services/routing';
import { useTrip } from '../state/store';
import { Badge, Field, fmtDateTime, ModeIcon, MODE_LABEL, MoneyInput, NumberInput, StatusBadge, StatusSelect } from './common';
import { Icon } from './icons';
import { dayTransfer, DAY_STATE_LABEL, legTiming, missingText } from '../domain/dayTransfer';
import { segmentInfo, INFO_STATE_LABEL } from '../domain/verification';
import { ACCOMMODATION_STATUS_LABEL } from '../domain/bookings';
import { BreakLegDialog } from './DraftDialogs';
import { VerificationControl } from './Verification';
import { ferrySuggestions } from '../domain/ferries';
import { ferryChipText, FerryHint, FerrySegmentBlock, useTripFerries } from './Ferries';
import { PlaceCard, PlaceLinkHint } from './PlaceCard';

export function stopFromDestination(destinationId: string): Stop | undefined {
  const d = findDestination(destinationId);
  if (!d) return undefined;
  // Gli aeroporti sono punti di arrivo/partenza: di norma non ci si dorme
  const nights = d.category === 'aeroporti' ? 0 : 1;
  return { id: newId(), kind: 'luogo', destinationId: d.id, name: d.name, lat: d.lat, lng: d.lng, nights, notes: '', weatherPlanB: '' };
}

/** Calcolo dei tratti dell'area di lavoro dell'itinerario. */
export function useLegRouting() {
  const { trip, update, toast } = useTrip();
  const [busy, setBusy] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

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
      if ((e as Error).name !== 'AbortError') toast('Calcolo non riuscito: il motivo è indicato nel tratto', 'errore');
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
            ? { ...l, routingError: 'Tratto con notte a bordo: aggiungi la crociera da Prenotazioni › Trasporti via mare › Crociere (Aggiungi al percorso).' }
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
    toast(
      ko
        ? `Calcolati ${ok} tratti, ${ko} non riusciti: per quelli resta la stima di massima, il motivo è nel tratto${skipped ? `; ${skipped} in nave da collegare` : ''}`
        : `Calcolati ${ok} tratti${skipped ? `, ${skipped} in nave da collegare` : ''}`,
      ko ? 'errore' : 'ok',
    );
  };

  return { busy, abort, calcOne, calcAll };
}

export function StopPicker({ onAdd, onBrowse }: { onAdd: (s: Stop | undefined) => void; onBrowse?: () => void }) {
  const [q, setQ] = useState('');
  const [custom, setCustom] = useState(false);
  const [c, setC] = useState<{ name: string; lat?: number; lng?: number; country?: string }>({ name: '' });
  const { trip } = useTrip();
  useCatalog();
  const countries = tripCountries(trip);
  // Con più nazioni la tappa libera sceglie la sua (D4, proposta la prima); con una sola resta implicita
  const multi = countries.length > 1;
  const chosenCountry = c.country ?? defaultCountry(trip);
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
        {onBrowse && (
          <button className="btn" onClick={onBrowse}>
            Sfoglia il catalogo
          </button>
        )}
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
          {multi ? (
            <Field label="Nazione" hint="Serve per valuta e fuso orario della tappa.">
              {(id) => (
                <select id={id} value={chosenCountry} onChange={(e) => setC({ ...c, country: e.target.value })}>
                  {countries.map((x) => (
                    <option key={x.code} value={x.code}>
                      {countryInfo(x.code)?.name ?? x.code}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          ) : (
            <p className="small muted">Nazione: {countryInfo(chosenCountry)?.name ?? chosenCountry}</p>
          )}
          <button
            className="btn btn-primary"
            disabled={!c.name.trim() || c.lat === undefined || c.lng === undefined || Math.abs(c.lat) > 90 || Math.abs(c.lng) > 180}
            onClick={() => {
              onAdd({ id: newId(), kind: 'luogo', name: c.name.trim(), lat: c.lat!, lng: c.lng!, nights: 1, notes: '', weatherPlanB: '', ...(multi && chosenCountry ? { countryCode: chosenCountry } : {}) });
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

export const shortDate = (iso: string) => new Date(iso).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export function StopCard({
  stop,
  index,
  count,
  checkIn,
  selected,
  onShowOnMap,
  expanded,
  hideDetails,
}: {
  stop: Stop;
  index: number;
  count: number;
  checkIn?: string;
  selected: boolean;
  onShowOnMap: () => void;
  /** Dettagli già aperti, come nell'area di lavoro */
  expanded?: boolean;
  /** Senza il blocco alloggio, note e piano B (nel Percorso sono in schede separate) */
  hideDetails?: boolean;
}) {
  const { trip, update } = useTrip();
  const dest = findDestination(stop.destinationId);
  const setStop = (patch: Partial<Stop>) => update((t) => ({ ...t, stops: t.stops.map((s) => (s.id === stop.id ? { ...s, ...patch } : s)) }));
  const move = (to: number) => update((t) => ({ ...t, stops: moveItem(t.stops, index, to) }));
  const acc = trip.accommodations.find((a) => a.id === stop.accommodationId);
  const cat = useCatalog();
  const multi = tripCountries(trip).length > 1;
  const nameOf = (code?: string) => (code ? (countryInfo(code)?.name ?? code) : undefined);
  const port = stop.kind === 'a_bordo' ? COASTAL_PORTS_NORTHBOUND.find((p) => p.lat === stop.lat && p.lng === stop.lng) : undefined;
  // Testata con la nazione, solo con più nazioni nel viaggio (design §4)
  const subtitle = !multi
    ? dest
      ? dest.region
      : stop.kind === 'a_bordo'
        ? 'Pernottamento in nave'
        : 'Luogo personalizzato'
    : dest
      ? `${dest.region} · ${nameOf(stopCountry(trip, stop, placeCountry))}`
      : stop.kind === 'a_bordo'
        ? port && cat.portCountry[port.name]
          ? `Pernottamento in nave · ${nameOf(cat.portCountry[port.name])} (porto d'imbarco)`
          : "Pernottamento in nave · nazione dal porto d'imbarco: scegli il porto"
        : `Luogo personalizzato · ${nameOf(stopCountry(trip, stop, placeCountry))}`;

  return (
    <article className={`stop ${stop.kind === 'a_bordo' ? 'stop-ship' : ''} ${selected ? 'stop-selected' : ''}`}>
      <div className="stop-head">
        <button className="stop-num" onClick={onShowOnMap} aria-label={`Mostra ${stop.name} sulla mappa`} aria-pressed={selected} title="Mostra sulla mappa">
          {index + 1}
        </button>
        <div className="stop-title">
          <strong>
            {stop.name}
            {selected && <span className="sel-tag"><Icon name="pin" /> sulla mappa</span>}
          </strong>
          <span className="muted small">
            {subtitle}
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
                <Badge tone={acc.status === 'prenotata' ? 'ok' : acc.status === 'annullata' ? 'warn' : 'info'}>
                  <Icon name="bed" /> {acc.name} · {ACCOMMODATION_STATUS_LABEL[acc.status].toLowerCase()}
                </Badge>
              ) : (
                <Badge tone="warn"><Icon name="bed" /> Alloggio da scegliere</Badge>
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
            <Icon name="close" />
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
      {multi && stop.kind === 'luogo' && !dest && (
        <div className="row wrap small">
          <label htmlFor={`country-${stop.id}`}>Nazione della tappa</label>
          <select id={`country-${stop.id}`} aria-describedby={`country-note-${stop.id}`} value={stopCountry(trip, stop, placeCountry) ?? ''} onChange={(e) => setStop({ countryCode: e.target.value })}>
            {tripCountries(trip).map((x) => (
              <option key={x.code} value={x.code}>
                {nameOf(x.code)}
              </option>
            ))}
          </select>
          <span id={`country-note-${stop.id}`} className="muted">
            Decide valuta proposta e fuso orario di questa tappa.
          </span>
        </div>
      )}
      {dest?.augustNote && <p className="note-warn small"><Icon name="warning" /> {dest.augustNote}</p>}
      {dest && <PlaceCard dest={dest} open={expanded} />}
      {!dest && stop.kind === 'luogo' && <PlaceLinkHint stop={stop} onLink={(destinationId) => setStop({ destinationId })} />}
      {!hideDetails && (
      <details open={expanded}>
        <summary>
          Alloggio, note e piano B{stop.notes || stop.weatherPlanB ? ' · compilati' : ''}
        </summary>
        <div className="grid-2">
          {stop.kind === 'luogo' && <StopLodgingSelect stop={stop} />}
          <Field label="Note">{(id) => <textarea id={id} rows={2} value={stop.notes} onChange={(e) => setStop({ notes: e.target.value })} />}</Field>
          <Field label="Alternativa in caso di maltempo">
            {(id) => <textarea id={id} rows={2} value={stop.weatherPlanB} onChange={(e) => setStop({ weatherPlanB: e.target.value })} />}
          </Field>
        </div>
      </details>
      )}
    </article>
  );
}

/** Scelta della sistemazione di una tappa (le sistemazioni si gestiscono in Prenotazioni › Alloggi) */
export function StopLodgingSelect({ stop }: { stop: Stop }) {
  const { trip, update } = useTrip();
  const accs = trip.accommodations.filter((a) => !a.stopId || a.stopId === stop.id);
  return (
    <Field label="Alloggio scelto" hint="Le sistemazioni si gestiscono in Prenotazioni › Alloggi">
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
              {a.name} ({ACCOMMODATION_STATUS_LABEL[a.status].toLowerCase()})
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

const LEG_STATE: Record<LegState, string> = {
  da_calcolare: 'Da calcolare',
  calcolato: '✓ Calcolato (OSRM)',
  manuale: 'Inserito a mano',
  misto: '✓ Calcolato + a mano',
};

export function LegCard({ leg, fromNum, day, busy, onCalc, expanded }: { leg: Leg; fromNum: number; day?: DayInfo; busy: boolean; onCalc: () => void; expanded?: boolean }) {
  const { trip, update } = useTrip();
  const t = legTotals(leg, trip.settings);
  const sum = legSummary(leg, trip.settings);
  const fromStop = trip.stops.find((s) => s.id === leg.fromStopId);
  const toStop = trip.stops.find((s) => s.id === leg.toStopId);
  const routable = isRoutableLeg(leg, trip.stops);
  const setLeg = (fn: (l: Leg) => Leg) => update((tr) => ({ ...tr, legs: tr.legs.map((l) => (l.id === leg.id ? fn(l) : l)) }));
  const [addMode, setAddMode] = useState<TransportMode | ''>('');
  const [breaking, setBreaking] = useState(false);
  const timing = legTiming(leg, trip);
  const dt = day ? dayTransfer(trip, day) : undefined;
  const ferryRoutes = useTripFerries();
  const boatHints = useMemo(() => ferrySuggestions({ ...trip, legs: [leg] }, ferryRoutes, { includeHidden: true }), [trip, leg, ferryRoutes]);

  const addSegment = (mode: TransportMode) => {
    const seg: Segment = { id: newId(), mode, label: MODE_LABEL[mode], status: 'da_verificare', costStatus: 'da_verificare' };
    setLeg((l) => ({ ...l, segments: [...l.segments.filter((s) => s.mode !== 'non_calcolato'), seg] }));
  };

  const real = leg.segments.filter((s) => s.mode !== 'non_calcolato');
  // Il separatore «·» prima del totale solo se prima c'è già qualcosa (strada, traghetti o altri mezzi con durata)
  const hasParts = sum.roadKm > 0 || t.ferryCount > 0 || sum.otherMin > 0;
  return (
    <div className={`leg leg-${sum.state}`} aria-busy={busy}>
      {breaking && <BreakLegDialog legId={leg.id} onClose={() => setBreaking(false)} />}
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
            <span className="muted"><Icon name="question" /> Collegamento non calcolato: distanza e durata non disponibili</span>
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
                  {hasParts && ' · '}totale teorico {formatDuration(sum.totalMin)}
                  {sum.realisticMin !== undefined && sum.realisticMin > sum.totalMin && (
                    <span title="Con soste durante la guida e attese ai traghetti non inserite: ipotesi modificabili in Impostazioni → Viaggio">
                      {' · '}
                      <strong>realistici ~{formatDuration(sum.realisticMin)}</strong>
                    </span>
                  )}
                </>
              ) : (
                <>
                  {hasParts && ' · '}
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
                  <ModeIcon mode={s.mode} /> {s.mode === 'strada' ? MODE_LABEL.strada : s.label}
                  {s.distanceKm !== undefined ? ` · ${Math.round(s.distanceKm)} km` : s.mode === 'strada' ? ' · distanza da inserire' : ''}
                  {s.durationMin !== undefined ? ` · ${formatDuration(s.durationMin)}` : <em> · durata da inserire</em>}
                  {s.waitMin !== undefined && ` + attesa ${formatDuration(s.waitMin)}`}
                  {s.mode !== 'strada' && (
                    <em>
                      {s.departureTime ? ` · ore ${s.departureTime}` : ' · orario non inserito'} · orario {INFO_STATE_LABEL[segmentInfo(s, trip.settings)?.state ?? 'da_verificare'].toLowerCase()}
                    </em>
                  )}
                  {s.ferryRouteId && ferryChipText(s)}
                  <span className="seg-src">{isAutoSegment(s) ? 'calcolato' : s.ferryRouteId ? 'dal catalogo traghetti' : 'inserito a mano'}</span>
                </li>
              ))}
            </ul>
          )}
          {t.estimatedWaitMin > 0 && (
            <span className="muted small">Attesa ai traghetti ipotizzata ({formatDuration(t.estimatedWaitMin)}): inserisci quella reale con l'orario.</span>
          )}
          <FerryHint leg={leg} routes={boatHints} />
          {t.mixedModes && <span className="note-warn small">Strada e treno/nave/aereo nello stesso tratto: tienili solo se sono in sequenza.</span>}
          {t.possibleDuplicateFerry && <span className="note-warn small">Traghetto calcolato e traghetto manuale insieme: probabile doppio conteggio.</span>}
          {!routable && t.hasUncalculated && (
            <span className="muted small">Tratto in nave: scegli la crociera in Prenotazioni › Trasporti via mare › Crociere (Aggiungi al percorso) oppure aggiungi un tratto "Navigazione costiera".</span>
          )}
          {leg.routingError && (
            <span className="error small" role="alert">
              Calcolo non riuscito: {leg.routingError}
              {timing.roughMin !== undefined && ` Stima di massima in linea d'aria: circa ${formatDuration(timing.roughMin)}, non usata nei totali.`}
            </span>
          )}
          {busy && (
            <span className="small" role="status">
              Calcolo del percorso in corso…
            </span>
          )}
          {dt && (dt.state === 'oltre' || dt.state === 'non_verificabile') && (
            <span className={`small ${dt.state === 'oltre' ? 'warn-text' : ''}`}>
              <strong>Giorno {dt.dayIndex + 1}: {DAY_STATE_LABEL[dt.state].toLowerCase()}</strong>
              {dt.knownMin > 0 && ` · tempi noti circa ${formatDuration(dt.knownMin)} su ${formatDuration(dt.limitMin)}`}
              {dt.missing.length > 0 && ` · manca: ${missingText(dt.missing)}`}{' '}
              <button type="button" className="link-btn" onClick={() => setBreaking(true)}>
                Cerca una tappa intermedia
              </button>
            </span>
          )}
        </div>
        {routable && (
          <button className="btn btn-small" onClick={onCalc} disabled={busy}>
            {busy ? 'Calcolo…' : leg.calculatedAt ? 'Ricalcola strada' : 'Calcola strada'}
          </button>
        )}
        {routable && fromStop && toStop && (
          <a
            className="btn btn-small"
            href={googleDirectionsUrl(fromStop, toStop, googleModeForLeg(leg))}
            target="_blank"
            rel="noreferrer"
            title="Apre il tratto in Google Maps in una nuova scheda: strada, traghetti e navigazione"
          >
            <Icon name="map" /> Google Maps ↗
          </a>
        )}
      </div>
      <details className="leg-details" open={expanded}>
        <summary>Dettaglio tratti{leg.calculatedAt ? ` · calcolato ${fmtDateTime(leg.calculatedAt)}` : ''}</summary>
        {leg.segments.map((s) => (
          <SegmentEditor
            key={s.id}
            seg={s}
            leg={leg}
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
                {MODE_LABEL[m]}
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

function SegmentEditor({ seg, leg, trip, onChange, onRemove }: { seg: Segment; leg: Leg; trip: Trip; onChange: (p: Partial<Segment>) => void; onRemove: () => void }) {
  if (seg.mode === 'non_calcolato') {
    return <p className="muted small">Nessun tratto: usa "Calcola strada" o aggiungi un tratto manuale (traghetto, treno, nave…).</p>;
  }
  const auto = isAutoSegment(seg);
  return (
    <div className="segment">
      <div className="segment-head">
        <span>
          <ModeIcon mode={seg.mode} /> <strong>{seg.label}</strong> {seg.mode === 'strada' && <StatusBadge status={seg.status} />}
        </span>
        <button className="icon-btn danger" aria-label="Rimuovi tratto" onClick={onRemove}>
          <Icon name="close" />
        </button>
      </div>
      {seg.note && <p className="muted small">{seg.note}</p>}
      {seg.ferryRouteId && <FerrySegmentBlock seg={seg} leg={leg} onChange={onChange} />}
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
            {(id) => <MoneyInput id={id} value={seg.cost} onChange={(m) => onChange(seg.ferryRouteId ? { cost: m, costByUser: true } : { cost: m })} />}
          </Field>
        )}
        {seg.mode !== 'costiera' && (
          <Field label="Costo e prenotazione" hint="«Prenotato» o «Pagato» solo se hai il biglietto">
            {(id) => <StatusSelect id={id} value={seg.costStatus} onChange={(v) => onChange({ costStatus: v })} />}
          </Field>
        )}
        {seg.mode === 'strada' && <Field label="Affidabilità del dato">{(id) => <StatusSelect id={id} value={seg.status} onChange={(v) => onChange({ status: v })} />}</Field>}
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
      {seg.mode !== 'strada' && segmentInfo(seg, trip.settings) ? (
        <VerificationControl what="Orario" info={segmentInfo(seg, trip.settings)!} value={seg.verification} onChange={(v) => onChange({ verification: v })} />
      ) : (
        seg.source && (
          <p className="muted small">
            Fonte: {seg.source.label}
            {seg.source.checkedAt ? ` · ${fmtDateTime(seg.source.checkedAt)}` : ''}
          </p>
        )
      )}
    </div>
  );
}
