// Traghetti del catalogo (design trasporti via mare §4–§8): scheda della tratta e aggiunta al percorso nello stesso
// dialogo a passi, conto per la famiglia, dettaglio nel percorso e nel Budget. Nessuna prenotazione: solo link alle fonti.

import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import { catalogState, useCatalog } from '../catalog/registry';
import { DESTINATIONS } from '../data/destinations';
import { FERRY_ROUTES, FERRY_SOURCES } from '../data/ferryRoutes';
import type { FerryFare, FerryRoute, FerryStop } from '../data/ferryTypes';
import { toEur } from '../domain/coastal';
import { formatEur } from '../domain/budget';
import {
  applyFerry,
  canAlight,
  canBoard,
  choiceFromSegment,
  defaultStops,
  FERRY_MODE_LABEL,
  ferryCost,
  ferrySegment,
  fmtMinutes,
  fmtRange,
  fareRuleText,
  insertRoadParts,
  isSecondarySource,
  legDate,
  legHasRoute,
  linkedLegs,
  missingText,
  pierLine,
  priceStatus,
  proposeCar,
  routePlaces,
  costDrift,
  isLockedCost,
  refreshCost,
  segmentCost,
  stopName,
  subDuration,
  subRoute,
  tripFerryRoutes,
  tripYear,
  type FerryChoice,
  type FerryCost,
  type RoadChoice,
} from '../domain/ferries';
import { formatDuration, legSummary } from '../domain/itinerary';
import { externalHref } from '../domain/lodging';
import type { DataStatus, Leg, Money, Segment, Trip } from '../domain/types';
import { getRoutingProvider, RoutingError } from '../services/routing';
import { buildHash } from '../state/route';
import { useTrip } from '../state/store';
import { Badge, Field, MoneyInput, NumberInput, StatusSelect } from './common';
import { Modal } from './PlacementDialog';

/** Nome breve: «Tromsø → Finnsnes → Harstad» (senza le note tra parentesi) */
export const shortName = (r: FerryRoute) => r.name.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+[–-]\s+/g, ' → ');

/** Freccia letta come «verso» dai lettori di schermo */
export function Arrowed({ text }: { text: string }) {
  const parts = text.split(' → ');
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && (
            <>
              {' '}
              <span aria-hidden>→</span>
              <span className="sr-only">verso</span>{' '}
            </>
          )}
          {p}
        </span>
      ))}
    </>
  );
}

export const nokText = (n: number) => `${Math.round(n).toLocaleString('it-IT')} NOK`;
/** Link alle fonti: solo https (review, riserva 2) */
const httpsHref = (url: string | undefined) => {
  const h = externalHref(url);
  return h?.startsWith('https://') ? h : undefined;
};
const dateIt = (iso: string) => (/^\d{4}-\d{2}-\d{2}/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : iso);

/** Tratte del catalogo che il viaggio vede: solo quelle della versione del catalogo scelta (NO-1 non ne ha) */
export function useTripFerries(): FerryRoute[] {
  const cat = useCatalog();
  const { trip } = useTrip();
  return useMemo(() => tripFerryRoutes(trip, FERRY_ROUTES, cat.ferryRelease), [trip, cat]);
}

/** Tratte del catalogo in uso (per chiave); i tratti salvati restano anche se la tratta non c'è più */
export const findFerry = (key: string | undefined): FerryRoute | undefined => FERRY_ROUTES.find((r) => r.key === key);

export function PriceBadge({ r, year }: { r: FerryRoute; year?: number }) {
  const s = priceStatus(r, year);
  const secondary = r.fare.fares.some((f) => isSecondarySource(f.sourceKey)) || isSecondarySource(r.fare.sourceKey);
  return (
    <>
      <Badge tone={s.tone === 'none' ? 'neutral' : s.tone}>{s.short}</Badge>
      {secondary && (
        <>
          {' '}
          <Badge tone="warn">fonte secondaria</Badge>
        </>
      )}
    </>
  );
}

/** Tabella del conto: voce · regola · importo (design §5.2, §6) */
export function CostTable({ cost, trip }: { cost: FerryCost; trip: Trip }) {
  const opt = cost.chosen ?? cost.options[0];
  if (!opt) return null;
  return (
    <div className="cost-wrap">
      <table className="cost-lines">
        <caption className="sr-only">Dettaglio del costo</caption>
        <thead>
          <tr>
            <th scope="col">Voce</th>
            <th scope="col">Regola</th>
            <th scope="col" className="num">
              NOK
            </th>
          </tr>
        </thead>
        <tbody>
          {cost.options[0]!.lines.map((l, i) => (
            <tr key={i}>
              <th scope="row">{l.item}</th>
              <td>
                {l.rule}
                {l.warn && (
                  <span className="small warn-text">
                    {' '}
                    ! {l.warn}
                  </span>
                )}
              </td>
              <td className="num">{l.missing ? '— prezzo assente' : l.amountNok === undefined ? (l.rule === 'non scelta' ? 'non conteggiata' : '—') : Math.round(l.amountNok).toLocaleString('it-IT')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {cost.options.map((o) => (
        <p key={o.kind} className="small">
          {o.label}: {o.totalNok !== undefined ? nokText(o.totalNok) : 'non calcolabile'}
        </p>
      ))}
      {cost.computable && cost.totalNok !== undefined ? (
        <p>
          <strong>
            Si usa: {nokText(cost.totalNok)} (≈ {formatEur(toEur({ amount: cost.totalNok, currency: 'NOK' }, trip.settings, trip.rates))})
          </strong>
          {cost.reason && <span className="small"> · {cost.reason}</span>}
        </p>
      ) : (
        <p className="note-warn small">{missingText(cost)}</p>
      )}
    </div>
  );
}

/** Stato del conto e fonte, in una riga */
function CostStatusLine({ cost, r }: { cost: FerryCost; r: FerryRoute }) {
  const src = r.fare.sourceKey ? FERRY_SOURCES[r.fare.sourceKey] : undefined;
  return (
    <p className="small">
      <Badge tone={cost.tone === 'none' ? 'neutral' : cost.tone}>
        {cost.tone === 'ok' ? '✓' : cost.tone === 'warn' ? '!' : '—'} {cost.statusText}
      </Badge>
      {src && (
        <>
          {' '}
          · Fonte: {src.title}, letto il {dateIt(src.checkedAt)}
        </>
      )}
    </p>
  );
}

const CATEGORY_LABEL: Record<FerryFare['category'], string> = {
  adulto: 'Adulto',
  bambino: 'Bambino',
  giovane: 'Giovane',
  senior: 'Senior',
  famiglia: 'Biglietto famiglia',
  veicolo: 'Auto fino a 6 m',
  pacchetto_veicolo: 'Pacchetto auto',
  prenotazione_adulto: 'Prenotazione adulto (facoltativa)',
  prenotazione_bambino: 'Prenotazione bambino (facoltativa)',
  prenotazione_veicolo: 'Prenotazione auto (facoltativa)',
};

function fareLabel(f: FerryFare): string {
  const bits = [CATEGORY_LABEL[f.category]];
  if (f.ageText) bits.push(f.ageText);
  if (f.category === 'veicolo' && f.driverIncluded === true) bits.push('conducente incluso');
  if (f.category === 'veicolo' && f.driverIncluded === null) bits.push('conducente: non indicato');
  if (f.passengersIncluded !== undefined) bits.push(`+ ${f.passengersIncluded} persone`);
  if (f.adultsIncluded !== undefined) bits.push(`${f.adultsIncluded} adulti + ${f.childrenIncluded ?? 0} bambini`);
  if (f.fromStop) bits.push(`${f.fromStop} → ${f.toStop}`);
  if (f.dayType) bits.push('sabato');
  if (f.period) bits.push(f.period);
  if (f.trip === 'andata_ritorno') bits.push('andata e ritorno');
  return bits.join(' · ');
}

function stopTime(s: FerryStop): string {
  if (s.minutesMin === undefined) return 'orario non indicato';
  if (s.minutesMin === 0 && (s.minutesMax ?? 0) === 0) return 'Partenza';
  const r: [number, number] = [s.minutesMin, s.minutesMax ?? s.minutesMin];
  return `dopo ${fmtRange(r)}`;
}

const CALL_LABEL: Partial<Record<FerryStop['call'], string>> = {
  a_richiesta: 'a richiesta',
  solo_discesa: 'solo discesa',
  solo_passaggio: 'solo passaggio, senza fermata',
  senza_sbarco: 'senza sbarco',
};

// ------------------------------------------------------------------ Dialogo a passi

export interface FerryDialogProps {
  routeKey: string;
  step?: 'scheda' | 'aggiungi';
  /** Collegamento proposto (es. dal suggerimento) */
  legId?: string;
  /** Proposte iniziali: senza auto, «il traghetto sostituisce la strada» */
  preset?: { withCar?: boolean; road?: RoadChoice };
  /** Tratto da modificare (dal percorso) */
  edit?: { legId: string; segId: string };
  onClose: () => void;
}

export function FerryDialog(props: FerryDialogProps) {
  const r = findFerry(props.routeKey);
  const [step, setStep] = useState(props.step ?? 'scheda');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const goAdd = () => {
    setStep('aggiungi');
    requestAnimationFrame(() => titleRef.current?.focus());
  };
  if (!r) {
    return (
      <Modal title="Tratta non trovata" onClose={props.onClose}>
        <p>Questa tratta non è nel catalogo caricato. Il tratto salvato nel percorso resta com'è.</p>
        <button className="btn" onClick={props.onClose}>
          Chiudi
        </button>
      </Modal>
    );
  }
  const title = step === 'scheda' ? shortName(r) : `${props.edit ? 'Cambia il traghetto' : 'Aggiungi al percorso'}: ${shortName(r)}`;
  return (
    <Modal title={title} onClose={props.onClose} className="ferry-dialog">
      {step === 'scheda' ? (
        <FerrySheet r={r} onAdd={goAdd} onClose={props.onClose} addRef={backRef} />
      ) : (
        <>
          <h3 className="sr-only" tabIndex={-1} ref={titleRef}>
            {title}
          </h3>
          {!props.edit && (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setStep('scheda');
                requestAnimationFrame(() => backRef.current?.focus());
              }}
            >
              ← Torna alla scheda
            </button>
          )}
          <AddFerry r={r} legId={props.legId} preset={props.preset} edit={props.edit} onDone={props.onClose} />
        </>
      )}
    </Modal>
  );
}

function FerrySheet({ r, onAdd, onClose, addRef }: { r: FerryRoute; onAdd: () => void; onClose: () => void; addRef: RefObject<HTMLButtonElement | null> }) {
  const { trip } = useTrip();
  const year = tripYear(trip);
  const status = priceStatus(r, year);
  const dur = fmtRange(r.duration.min !== undefined ? [r.duration.min, r.duration.max ?? r.duration.min] : undefined);
  const inTrip = trip.legs.flatMap((l) => l.segments.filter((s) => s.ferryRouteId === r.key).map((s) => ({ l, s })));
  const stopsOfTrip = new Map(trip.stops.map((s) => [s.id, s]));
  const durStatus = r.duration.status === 'confermato' ? '✓ confermato' : r.duration.status === 'da_verificare' ? '! da verificare' : '— non pubblicata';
  // All'apertura si parte dall'inizio della scheda (il primo controllo è in fondo, tra le fonti)
  const top = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Dopo il focus iniziale del dialogo (che scatta dopo questo effetto)
    const id = requestAnimationFrame(() => {
      top.current?.focus({ preventScroll: true });
      top.current?.closest('dialog')?.scrollTo({ top: 0 });
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="ferry-sheet" ref={top} tabIndex={-1}>
      <p className="muted">
        {FERRY_MODE_LABEL[r.mode]} · {r.operator} · {r.zone}
        {r.road ? ` · ${r.road}` : ''}
      </p>
      {r.notes.length > 0 && (
        <ul className="small">
          {r.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      <dl className="ferry-facts">
        <div>
          <dt>Durata totale</dt>
          <dd>
            {dur ?? 'non pubblicata'} · {durStatus}
            {r.duration.note && <span className="small muted"> · {r.duration.note}</span>}
          </dd>
        </div>
        <div>
          <dt>Porta l'auto</dt>
          <dd>{r.carriesCar ? "Sì, fino a 6 m (un'auto familiare rientra; con portapacchi o rimorchio conta la lunghezza totale)" : 'No, solo passeggeri'}</dd>
        </div>
        <div>
          <dt>Stagione</dt>
          <dd>{r.season.text ? `${r.season.text} · ${r.season.status === 'confermato' ? '✓ confermata' : '! da verificare'}` : 'non pubblicata'}</dd>
        </div>
        <div>
          <dt>Frequenza in estate</dt>
          <dd>{r.summerFrequency.status === 'assente' ? `Non pubblicata. ${r.summerFrequency.text.replace(/^non pubblicata;?\s*/i, '')}` : `${r.summerFrequency.text}${r.summerFrequency.status === 'da_verificare' ? ' · ! da verificare' : ''}`}</dd>
        </div>
      </dl>

      <h3>Tappe in ordine</h3>
      <ol className="ferry-stops">
        {r.stops.map((s) => (
          <li key={s.seq} className={`call-${s.call}`}>
            <span className="ferry-stop-name">{stopName(s)}</span> <span className="small muted">{stopTime(s)}</span>
            {CALL_LABEL[s.call] && (
              <>
                {' '}
                <Badge>{CALL_LABEL[s.call]}</Badge>
              </>
            )}
          </li>
        ))}
      </ol>
      <p className="small">Durata totale {dur ?? 'non pubblicata'}</p>
      {routePlaces(r).length > 0 && (
        <p className="small muted">
          Luoghi del catalogo collegati: {routePlaces(r).map((k) => catalogPlaceName(k)).join(', ')}
        </p>
      )}

      <section aria-labelledby={`tariffa-${r.key}`}>
        <h3 id={`tariffa-${r.key}`}>Tariffa base · {r.fare.yearLabel ?? r.fare.year ?? 'anno non indicato'}</h3>
        <p>
          <Badge tone={status.tone === 'none' ? 'neutral' : status.tone}>
            {status.tone === 'ok' ? '✓' : status.tone === 'warn' ? '!' : '—'} {status.text}
          </Badge>
        </p>
        <p>{fareRuleText(r)}</p>
        {r.fare.fares.length > 0 ? (
          <table className="cost-lines">
            <caption className="sr-only">Tariffe pubblicate</caption>
            <thead>
              <tr>
                <th scope="col">Voce</th>
                <th scope="col" className="num">
                  NOK
                </th>
              </tr>
            </thead>
            <tbody>
              {r.fare.fares.map((f, i) => (
                <tr key={i}>
                  <th scope="row">{fareLabel(f)}</th>
                  <td className="num">{f.amountNok === null ? '— non pubblicato' : f.amountNok.toLocaleString('it-IT')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="small">Prezzo non pubblicato dalla fonte.</p>
        )}
        {r.fare.freeUnderAge !== undefined && <p className="small">Gratis sotto i {r.fare.freeUnderAge} anni.</p>}
        {r.fare.childCapNok !== undefined && <p className="small">Bambino con adulto pagante: massimo {r.fare.childCapNok} NOK.</p>}
        {r.fare.returnDiscountPct !== undefined && <p className="small">Ritorno comprato con l'andata: −{r.fare.returnDiscountPct}%.</p>}
        {r.fare.rules.length > 0 && (
          <ul className="small">
            {r.fare.rules.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        )}
        {r.fare.passengersText && <p className="small">Passeggeri: {r.fare.passengersText}</p>}
        {r.fare.generalRules && <p className="small">{r.fare.generalRules}</p>}
        {r.fare.note && <p className="small muted">{r.fare.note}</p>}
      </section>

      <h3>Fonti</h3>
      <ul className="links">
        {r.sourceKeys.map((k) => {
          const s = FERRY_SOURCES[k];
          if (!s) return null;
          return (
            <li key={k}>
              {s.title} · letto il {dateIt(s.checkedAt)}
              {isSecondarySource(k) && ' · fonte secondaria: aggregatore'}{' '}
              {httpsHref(s.url) ? (
                <a href={httpsHref(s.url)} target="_blank" rel="noreferrer">
                  Vai alla fonte ↗<span className="sr-only"> (si apre in una nuova scheda)</span>
                </a>
              ) : (
                <span className="muted">link non valido</span>
              )}
            </li>
          );
        })}
      </ul>

      {inTrip.length > 0 && (
        <p className="small">
          {inTrip.map(({ l, s }) => (
            <span key={s.id}>
              <Badge tone="ok">
                ✓ Nel percorso: {stopsOfTrip.get(l.fromStopId)?.name ?? '—'} → {stopsOfTrip.get(l.toStopId)?.name ?? '—'}
              </Badge>{' '}
              <a className="link-btn" href={buildHash('pianifica', { sel: `leg:${l.id}` })}>
                Apri nel percorso
              </a>{' '}
            </span>
          ))}
        </p>
      )}
      <div className="row wrap place-actions ferry-actions">
        {r.roundTrip ? (
          <>
            <p className="small">Crociera andata e ritorno: non collega due tappe. Aggiungila come attività nella giornata della tappa (Giornate).</p>
            <a className="btn btn-primary" href="#/giornate">
              Aggiungi come escursione
            </a>
          </>
        ) : (
          <button ref={addRef} className="btn btn-primary" onClick={onAdd}>
            Aggiungi al percorso
          </button>
        )}
        <button className="btn btn-ghost" onClick={onClose}>
          Chiudi
        </button>
      </div>
    </div>
  );
}

/** Nome di un luogo del catalogo (per id) */
const catalogPlaceName = (key: string): string => DESTINATIONS.find((d) => d.id === key)?.name ?? key;

// ------------------------------------------------------------------ Aggiungi al percorso

function legLabel(t: Trip, l: Leg): string {
  const i = t.stops.findIndex((s) => s.id === l.fromStopId);
  const a = t.stops[i];
  const b = t.stops.find((s) => s.id === l.toStopId);
  return `${i + 1} ${a?.name ?? '—'} → ${i + 2} ${b?.name ?? '—'}`;
}

function AddFerry({ r, legId: initialLeg, preset, edit, onDone }: { r: FerryRoute; legId?: string; preset?: FerryDialogProps['preset']; edit?: FerryDialogProps['edit']; onDone: () => void }) {
  const { trip, update, replace, toast } = useTrip();
  const editing = edit ? trip.legs.find((l) => l.id === edit.legId)?.segments.find((s) => s.id === edit.segId) : undefined;
  const linked = useMemo(() => linkedLegs(trip, r), [trip, r]);
  const firstLeg = edit?.legId ?? initialLeg ?? linked[0]?.legId ?? '';
  const [legId, setLegId] = useState(firstLeg);
  const leg = trip.legs.find((l) => l.id === legId);
  const placeOf = (stopId?: string) => trip.stops.find((s) => s.id === stopId)?.destinationId;
  const init = editing ? choiceFromSegment(editing, r) : undefined;
  const defaults = (l?: Leg) => defaultStops(r, placeOf(l?.fromStopId), placeOf(l?.toStopId));
  const [board, setBoard] = useState(init?.board ?? defaults(leg).board);
  const [alight, setAlight] = useState(init?.alight ?? defaults(leg).alight);
  const [withCar, setWithCar] = useState(init?.withCar ?? preset?.withCar ?? proposeCar(r, leg));
  const [departure, setDeparture] = useState(init?.departureTime ?? '');
  const [wait, setWait] = useState<number | undefined>(init?.waitMin);
  const [returnBought, setReturnBought] = useState(Boolean(init?.returnBought));
  const [booking, setBooking] = useState(Boolean(init?.bookingAdded));
  const [manual, setManual] = useState<Money | undefined>(init?.manualCost);
  const [manualStatus, setManualStatus] = useState<DataStatus>(init?.manualCostStatus ?? 'da_verificare');
  const [manualUrl, setManualUrl] = useState(init?.manualSourceUrl ?? '');
  const carReason = useId();
  const sub = subRoute(r, board, alight);
  const hasRoad = Boolean(leg?.segments.some((s) => s.mode === 'strada'));
  const bothLinked = Boolean(leg && linked.find((x) => x.legId === leg.id)?.both);
  const piers = sub ? pierLine(sub) : undefined;
  const roadOptions: RoadChoice[] = [];
  if (hasRoad && piers) roadOptions.push('ricalcola');
  if (hasRoad && !withCar && bothLinked) roadOptions.push('sostituisci');
  roadOptions.push('lascia');
  const [roadPick, setRoadPick] = useState<RoadChoice | undefined>(preset?.road);
  const road: RoadChoice = !hasRoad ? 'lascia' : roadPick && roadOptions.includes(roadPick) ? roadPick : roadOptions[0]!;

  // Cambiando collegamento: imbarco, sbarco e auto proposti di nuovo
  const changeLeg = (id: string) => {
    setLegId(id);
    const l = trip.legs.find((x) => x.id === id);
    const d = defaults(l);
    setBoard(d.board);
    setAlight(d.alight);
    setWithCar(proposeCar(r, l));
  };

  const date = leg ? legDate(trip, leg) : undefined;
  const cost = useMemo(
    () => ferryCost({ route: r, participants: trip.participants, withCar, board, alight, date, tripYear: tripYear(trip), returnBought, bookingAdded: booking }),
    [r, trip, withCar, board, alight, date, returnBought, booking],
  );
  const dur = sub ? subDuration(r, sub) : undefined;
  const duplicate = leg && sub ? legHasRoute(leg, r.key, board, alight, edit?.segId) : false;
  const departures = r.summerFrequency.status !== 'assente' && r.summerFrequency.year ? [...r.summerFrequency.text.matchAll(/\b(\d{2}):(\d{2})\b/g)].map((m) => `${m[1]}:${m[2]}`) : [];
  const uniqueDepartures = [...new Set(departures)];
  const hasBooking = r.fare.fares.some((f) => f.optional);
  // Tratto prenotato o pagato: se le scelte cambiano l'importo, serve una conferma esplicita
  const [lockOk, setLockOk] = useState(false);
  const lockedChange =
    editing && isLockedCost(editing) && !manual && (editing.cost?.amount ?? undefined) !== (cost.totalNok !== undefined ? Math.round(cost.totalNok) : undefined);
  const reason = !leg
    ? 'Scegli un collegamento.'
    : !sub
      ? 'Imbarco e sbarco devono essere diversi.'
      : lockedChange && !lockOk
        ? 'Conferma il cambio dell\'importo del tratto prenotato o pagato.'
        : undefined;
  const dupAuto = leg?.segments.some((s) => s.mode === 'traghetto' && s.source?.label.startsWith('OSRM'));

  if (trip.stops.length < 2) {
    return (
      <div className="note-warn">
        Servono almeno due tappe nel percorso. Aggiungile in Itinerario e torna qui.{' '}
        <a href="#/pianifica" className="link-btn">
          Vai all'Itinerario
        </a>
      </div>
    );
  }

  const apply = () => {
    if (!leg || !sub) return;
    const choice: FerryChoice = {
      route: r,
      releaseId: catalogState().ferryRelease[r.key],
      board,
      alight,
      withCar,
      departureTime: departure || undefined,
      waitMin: wait,
      returnBought,
      bookingAdded: booking,
      manualCost: manual,
      manualCostStatus: manual ? manualStatus : undefined,
      manualSourceUrl: manual ? manualUrl || undefined : undefined,
      sourceUrl: r.fare.sourceKey ? FERRY_SOURCES[r.fare.sourceKey]?.url : undefined,
    };
    const seg = ferrySegment(choice, cost, editing);
    const before = trip;
    update((t) => applyFerry(t, leg.id, seg, road, editing?.id));
    const from = trip.stops.find((s) => s.id === leg.fromStopId)?.name ?? '—';
    const to = trip.stops.find((s) => s.id === leg.toStopId)?.name ?? '—';
    toast(editing ? `Traghetto aggiornato: ${seg.label}` : `Traghetto aggiunto: ${seg.label} nel collegamento ${from} → ${to}`, 'ok', { label: 'Annulla', run: () => replace(before) });
    onDone();
    if (road === 'ricalcola' && !editing && piers) void routeToPiers(leg, seg, piers);
  };

  // Strada fino all'imbarco e dallo sbarco: coordinate dei moli dal registro NSR
  const routeToPiers = async (l: Leg, seg: Segment, line: [number, number][]) => {
    const a = trip.stops.find((s) => s.id === l.fromStopId);
    const b = trip.stops.find((s) => s.id === l.toStopId);
    if (!a || !b) return;
    try {
      const p = getRoutingProvider();
      const [x, y] = await Promise.all([p.route(a, { lat: line[0]![0], lng: line[0]![1] }), p.route({ lat: line[1]![0], lng: line[1]![1] }, b)]);
      update((t) => ({ ...t, legs: t.legs.map((g) => (g.id === l.id ? insertRoadParts(g, seg.id, x.segments, y.segments) : g)) }));
    } catch (e) {
      const msg = e instanceof RoutingError ? e.message : 'Errore imprevisto nel calcolo del percorso.';
      update((t) => ({ ...t, legs: t.legs.map((g) => (g.id === l.id ? { ...g, routingError: `Strada fino al molo: ${msg}` } : g)) }));
    }
  };

  const others = trip.legs.filter((l) => !linked.some((x) => x.legId === l.id));
  const linkedList = linked.map((x) => trip.legs.find((l) => l.id === x.legId)!).filter(Boolean);
  const boardStops = r.stops.filter(canBoard);
  const alightStops = r.stops.filter(canAlight);
  const days = (l: Leg) => {
    const d = legDate(trip, l);
    return d ? ` · ${dateIt(d)}` : '';
  };
  const sum = leg ? legSummary(leg, trip.settings) : undefined;

  return (
    <div className="ferry-add">
      <Field label="Collegamento del percorso">
        {(id) => (
          <select id={id} value={legId} onChange={(e) => changeLeg(e.target.value)} disabled={Boolean(edit)}>
            <option value="">Scegli un collegamento</option>
            {linkedList.length > 0 && (
              <optgroup label="Collegati a questa tratta">
                {linkedList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {legLabel(trip, l)}
                    {days(l)}
                  </option>
                ))}
              </optgroup>
            )}
            {others.length > 0 && (
              <optgroup label="Altri collegamenti">
                {others.map((l) => (
                  <option key={l.id} value={l.id}>
                    {legLabel(trip, l)}
                    {days(l)}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        )}
      </Field>
      <p className="small muted">Il traghetto entra in un collegamento esistente: tappe e notti non cambiano.</p>

      <div className="grid-2">
        <Field label="Imbarco">
          {(id) => (
            <select id={id} value={board} onChange={(e) => setBoard(Number(e.target.value))}>
              {boardStops.map((s) => (
                <option key={s.seq} value={s.seq}>
                  {stopName(s)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Sbarco">
          {(id) => (
            <select id={id} value={alight} onChange={(e) => setAlight(Number(e.target.value))}>
              {alightStops.map((s) => (
                <option key={s.seq} value={s.seq}>
                  {stopName(s)}
                  {s.call === 'solo_discesa' ? ' (solo discesa)' : ''}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      {sub ? (
        <p className="small">
          Tratto scelto: {stopName(sub.board)} → {stopName(sub.alight)} · {fmtRange(dur) ?? 'durata non pubblicata'}
          {sub.skipped > 0 && ` · ${sub.skipped} ${sub.skipped === 1 ? 'fermata' : 'fermate'} in meno di ${r.stops.length}`}
          {sub.reversed && ' · Verso opposto: durata presa dall\'orario dell\'andata, da verificare'}
        </p>
      ) : (
        <p className="error small" role="alert">
          Imbarco e sbarco devono essere diversi.
        </p>
      )}

      <fieldset className="place-q">
        <legend>Con l'auto?</legend>
        <label className="place-opt">
          <input type="radio" name={`auto-${r.key}`} checked={withCar} disabled={!r.carriesCar} aria-describedby={!r.carriesCar ? carReason : undefined} onChange={() => setWithCar(true)} /> Con l'auto a bordo
        </label>
        {!r.carriesCar && (
          <span id={carReason} className="small muted">
            Questa tratta non porta veicoli
          </span>
        )}
        <label className="place-opt">
          <input type="radio" name={`auto-${r.key}`} checked={!withCar} onChange={() => setWithCar(false)} /> Senza auto (solo passeggeri)
        </label>
        {r.carriesCar && proposeCar(r, leg) && <span className="hint small">Proposto con l'auto perché questo collegamento è in auto.</span>}
      </fieldset>

      {hasRoad && !edit && (
        <fieldset className="place-q">
          <legend>La strada del collegamento</legend>
          <label className="place-opt">
            <input type="radio" name={`strada-${r.key}`} checked={road === 'ricalcola'} disabled={!roadOptions.includes('ricalcola')} onChange={() => setRoadPick('ricalcola')} /> Ricalcola la strada fino all'imbarco e dallo sbarco
          </label>
          {!piers && sub && <span className="small muted">Mancano le coordinate del molo di {pierMissing(sub.board, sub.alight)}: non posso calcolare la strada fino al molo.</span>}
          <label className="place-opt">
            <input type="radio" name={`strada-${r.key}`} checked={road === 'sostituisci'} disabled={!roadOptions.includes('sostituisci')} onChange={() => setRoadPick('sostituisci')} /> Il traghetto sostituisce la strada
          </label>
          {road === 'sostituisci' && <span className="small">L'auto non fa questo collegamento: decidi tu dove resta (riconsegna o ritorno).</span>}
          {!roadOptions.includes('sostituisci') && <span className="small muted">Solo senza auto e con entrambe le tappe collegate alla tratta.</span>}
          <label className="place-opt">
            <input type="radio" name={`strada-${r.key}`} checked={road === 'lascia'} onChange={() => setRoadPick('lascia')} /> Lascia la strada com'è
          </label>
          {road === 'lascia' && <span className="small warn-text">Strada e traghetto insieme: i tempi si sommano, controlla il collegamento.</span>}
        </fieldset>
      )}

      <div className="grid-2">
        <Field label="Partenza (orario)">
          {(id) => <input id={id} type="time" value={departure} onChange={(e) => setDeparture(e.target.value)} />}
        </Field>
        <Field label="Attesa e imbarco (min)" hint="Vuoto: vale l'attesa ipotizzata delle Impostazioni">
          {(id) => <NumberInput id={id} value={wait} onChange={setWait} min={0} />}
        </Field>
      </div>
      {uniqueDepartures.length > 0 ? (
        <div className="small">
          Partenze pubblicate ({r.summerFrequency.year}, da verificare per il {tripYear(trip) ?? 'viaggio'}):{' '}
          <span className="chips-field">
            {uniqueDepartures.map((d) => (
              <button key={d} type="button" className="chip" onClick={() => setDeparture(d)}>
                {d}
              </button>
            ))}
          </span>
        </div>
      ) : (
        <p className="small muted">La fonte non pubblica gli orari estivi: inseriscilo quando lo trovi.</p>
      )}

      {(r.fare.returnDiscountPct !== undefined || hasBooking) && (
        <div>
          {r.fare.returnDiscountPct !== undefined && (
            <label className="check">
              <input type="checkbox" checked={returnBought} onChange={(e) => setReturnBought(e.target.checked)} /> È il ritorno di un biglietto comprato con l'andata (−{r.fare.returnDiscountPct}%)
            </label>
          )}
          {hasBooking && (
            <label className="check">
              <input type="checkbox" checked={booking} onChange={(e) => setBooking(e.target.checked)} /> Aggiungi la prenotazione del posto (facoltativa):{' '}
              {r.fare.fares
                .filter((f) => f.optional)
                .map((f) => `${CATEGORY_LABEL[f.category].replace(/^Prenotazione /, '').replace(' (facoltativa)', '')} ${f.amountNok ?? '—'}`)
                .join(', ')}{' '}
              NOK
            </label>
          )}
        </div>
      )}

      <section className="place-preview" aria-label="Costo per la famiglia">
        <h3>Costo per la famiglia</h3>
        <p className="small muted">
          {trip.participants.adults} adulti{trip.participants.childrenAges.length ? `, bambini ${trip.participants.childrenAges.join(' e ')} anni` : ''}
          {withCar ? ' · con auto' : ' · senza auto'}
        </p>
        <CostTable cost={cost} trip={trip} />
        {cost.warnings.length > 0 && (
          <ul className="small">
            {cost.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
        <CostStatusLine cost={cost} r={r} />
        {!cost.computable && <p className="small">Nel Budget il traghetto comparirà tra i costi da cercare, senza importo.</p>}
        <details className="more-fields" open={Boolean(manual)}>
          <summary>Ho trovato il prezzo</summary>
          <div className="grid-2">
            <Field label="Prezzo totale per la famiglia">{(id) => <MoneyInput id={id} value={manual} onChange={setManual} />}</Field>
            <Field label="Stato del prezzo">{(id) => <StatusSelect id={id} value={manualStatus} onChange={setManualStatus} />}</Field>
            <Field label="Link alla fonte">{(id) => <input id={id} type="url" placeholder="https://…" value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} />}</Field>
          </div>
          {manual && <p className="small">Prezzo inserito da te: il calcolo del catalogo non si usa per questo tratto.</p>}
        </details>
      </section>

      {leg && (
        <section className="place-preview" aria-label="Come diventa il collegamento">
          <h3>Come diventa il collegamento</h3>
          <p className="small">
            Prima: {sum && sum.roadKm > 0 ? `strada ${Math.round(sum.roadKm)} km, guida ${formatDuration(sum.driveMin)}` : 'nessuna strada calcolata'}
            {leg.segments.filter((s) => s.mode === 'traghetto').length > 0 && ` · ${leg.segments.filter((s) => s.mode === 'traghetto').length} traghetti già nel collegamento`}
          </p>
          <p className="small">
            Dopo: {sub ? `${stopName(sub.board)} → ${stopName(sub.alight)} ${fmtRange(dur) ?? 'durata da inserire'}` : '—'}
            {hasRoad && road === 'ricalcola' && ' · strada fino all\'imbarco e dallo sbarco da ricalcolare'}
            {hasRoad && road === 'sostituisci' && ' · strada tolta dal collegamento'}
            {hasRoad && road === 'lascia' && ' · strada invariata'}
            . Tappe e notti invariate.
          </p>
          {dupAuto && <p className="note-warn small">Traghetto calcolato e traghetto manuale insieme: probabile doppio conteggio.</p>}
        </section>
      )}
      {duplicate && <p className="note-warn small">Questo collegamento ha già {sub ? `${stopName(sub.board)} → ${stopName(sub.alight)}` : 'questa tratta'}. Aggiungerla di nuovo conta il costo due volte.</p>}

      {lockedChange && (
        <div className="note-warn small">
          Il tratto è {editing!.costStatus === 'pagato' ? 'pagato' : 'prenotato'}: con queste scelte l'importo passa da {nokOrNone(editing!.cost ? Math.round(editing!.cost.amount) : undefined)} a{' '}
          {nokOrNone(cost.totalNok)}.
          <label className="check impact-confirm">
            <input type="checkbox" checked={lockOk} onChange={(e) => setLockOk(e.target.checked)} /> Il biglietto è cambiato: aggiorna l'importo (lo stato resta «{editing!.costStatus}»)
          </label>
        </div>
      )}
      <div className="row wrap place-actions ferry-actions">
        <button className="btn btn-primary" disabled={Boolean(reason)} onClick={apply} aria-describedby={reason ? `${carReason}-r` : undefined}>
          {editing ? 'Applica le modifiche' : 'Applica al percorso'}
        </button>
        {reason && (
          <span id={`${carReason}-r`} className="small muted">
            {reason}
          </span>
        )}
        <button className="btn btn-ghost" onClick={onDone}>
          Annulla
        </button>
      </div>
    </div>
  );
}

function pierMissing(a: FerryStop, b: FerryStop): string {
  return [a, b]
    .filter((s) => s.lat === undefined)
    .map(stopName)
    .join(' e ');
}

// ------------------------------------------------------------------ Nel percorso e nel Budget

/** Riga riassuntiva del costo di un tratto traghetto del catalogo */
export function ferryChipText(seg: Segment): string {
  const car = seg.withCar ? ' · con auto' : ' · senza auto';
  return `${car}${seg.cost ? ` · ${Math.round(seg.cost.amount).toLocaleString('it-IT')} ${seg.cost.currency}` : ' · prezzo da cercare'}`;
}

const nokOrNone = (n: number | undefined) => (n === undefined ? 'non calcolabile' : nokText(n));

/**
 * Avviso «Il conto è cambiato: X → Y · Aggiorna» (review B1): date, età o partecipanti cambiati dopo l'aggiunta.
 * Nulla si aggiorna da solo; per un tratto prenotato o pagato serve una seconda conferma.
 */
export function CostDriftNote({ seg, cost, onChange }: { seg: Segment; cost: FerryCost; onChange: (p: Partial<Segment>) => void }) {
  const [asking, setAsking] = useState(false);
  const d = costDrift(seg, cost);
  if (!d) return null;
  const same = d.from === d.to;
  return (
    <div className="note-warn small cost-drift" role="status">
      {same ? (
        <>Lo stato del prezzo è cambiato: ora «{cost.statusText}».</>
      ) : (
        <>
          Il conto è cambiato: {nokOrNone(d.from)} → {nokOrNone(d.to)}.
        </>
      )}{' '}
      {d.locked ? (
        asking ? (
          <>
            Il tratto è {seg.costStatus === 'pagato' ? 'pagato' : 'prenotato'}: aggiorna l'importo solo se il biglietto è cambiato.{' '}
            <button type="button" className="btn btn-small" onClick={() => onChange(refreshCost(seg, cost))}>
              Sì, aggiorna l'importo
            </button>{' '}
            <button type="button" className="link-btn" onClick={() => setAsking(false)}>
              Lascia com'è
            </button>
          </>
        ) : (
          <>
            Il tratto è {seg.costStatus === 'pagato' ? 'pagato' : 'prenotato'}: l'importo non cambia da solo.{' '}
            <button type="button" className="link-btn" onClick={() => setAsking(true)}>
              Aggiorna…
            </button>
          </>
        )
      ) : (
        <button type="button" className="btn btn-small" onClick={() => onChange(refreshCost(seg, cost))}>
          Aggiorna
        </button>
      )}
    </div>
  );
}

/** Blocco «Costo per la famiglia» nel dettaglio del tratto (design §7) */
export function FerrySegmentBlock({ seg, leg, onChange }: { seg: Segment; leg: Leg; onChange: (p: Partial<Segment>) => void }) {
  const { trip } = useTrip();
  useCatalog();
  const [dialog, setDialog] = useState<'scheda' | 'aggiungi' | null>(null);
  const r = findFerry(seg.ferryRouteId);
  const cost = r ? segmentCost(trip, leg, seg, r) : undefined;
  const backToCalc = () => {
    if (!r || !cost) return;
    onChange({ cost: cost.totalNok !== undefined ? { amount: Math.round(cost.totalNok), currency: 'NOK' } : undefined, costStatus: cost.status, costByUser: undefined });
  };
  return (
    <div className="ferry-seg">
      {dialog && seg.ferryRouteId && <FerryDialog routeKey={seg.ferryRouteId} step={dialog} edit={dialog === 'aggiungi' ? { legId: leg.id, segId: seg.id } : undefined} onClose={() => setDialog(null)} />}
      <p className="small">
        <strong>Costo per la famiglia:</strong> {seg.cost ? `${Math.round(seg.cost.amount).toLocaleString('it-IT')} ${seg.cost.currency}` : 'prezzo da cercare'}
        {seg.withCar ? ' · con auto' : ' · senza auto'}
        {r ? ` · ${FERRY_MODE_LABEL[r.mode]} · ${r.operator}` : ' · tratta non presente nel catalogo caricato'}
      </p>
      {cost && <CostDriftNote seg={seg} cost={cost} onChange={onChange} />}
      {seg.costByUser ? (
        <p className="small">
          Costo inserito da te: il calcolo del catalogo non si usa più.{' '}
          {r && (
            <button type="button" className="link-btn" onClick={backToCalc}>
              Torna al calcolo
            </button>
          )}
        </p>
      ) : (
        r &&
        cost && (
          <details className="more-fields">
            <summary>Come è calcolato</summary>
            <CostTable cost={cost} trip={trip} />
            <CostStatusLine cost={cost} r={r} />
          </details>
        )
      )}
      {r && (
        <div className="row wrap">
          <button type="button" className="btn btn-small" onClick={() => setDialog('aggiungi')}>
            Cambia imbarco, auto e opzioni
          </button>
          <button type="button" className="btn btn-small" onClick={() => setDialog('scheda')}>
            Scheda della tratta
          </button>
        </div>
      )}
      {!seg.geometry && <p className="small muted">Senza linea sulla mappa: mancano le coordinate del molo.</p>}
    </div>
  );
}

/** Dettaglio di una voce del Budget che arriva da un tratto traghetto del catalogo (design §8) */
export function FerryBudgetDetail({ legId, segId }: { legId: string; segId: string }) {
  const { trip, update } = useTrip();
  useCatalog();
  const leg = trip.legs.find((l) => l.id === legId);
  const seg = leg?.segments.find((s) => s.id === segId);
  if (!leg || !seg) return null;
  const r = findFerry(seg.ferryRouteId);
  const cost = r ? segmentCost(trip, leg, seg, r) : undefined;
  const p = trip.participants;
  return (
    <div className="small muted">
      {seg.cost && `${Math.round(seg.cost.amount).toLocaleString('it-IT')} ${seg.cost.currency} · `}
      {seg.costByUser ? 'prezzo inserito da te' : cost?.statusText}
      {` · ${p.adults} adulti${p.childrenAges.length ? `, bambini ${p.childrenAges.join(' e ')}` : ''}`}{' '}
      <a className="link-btn" href={buildHash('pianifica', { sel: `leg:${legId}` })}>
        Apri nel percorso
      </a>
      {cost && (
        <CostDriftNote
          seg={seg}
          cost={cost}
          onChange={(patch) => update((t) => ({ ...t, legs: t.legs.map((l) => (l.id === legId ? { ...l, segments: l.segments.map((s) => (s.id === segId ? { ...s, ...patch } : s)) } : l)) }))}
        />
      )}
      {r && cost && !seg.costByUser && (
        <details className="more-fields">
          <summary>Dettaglio</summary>
          <CostTable cost={cost} trip={trip} />
        </details>
      )}
    </div>
  );
}

/** Riga del collegamento in Itinerario: «C'è anche un battello» (solo proposta, nessuna azione automatica) */
export function FerryHint({ leg, routes }: { leg: Leg; routes: { route: FerryRoute; legId: string }[] }) {
  const mine = routes.filter((x) => x.legId === leg.id);
  if (!mine.length) return null;
  return (
    <span className="muted small">
      {mine.map(({ route }) => (
        <span key={route.key}>
          C'è anche un {FERRY_MODE_LABEL[route.mode].toLowerCase()}: {shortName(route)}
          {route.duration.max !== undefined ? `, ${fmtMinutes(route.duration.max)}` : ''} ·{' '}
          <a className="link-btn" href={buildHash('crociere', { parte: 'traghetti', tratta: route.key })}>
            Vedi
          </a>{' '}
        </span>
      ))}
    </span>
  );
}

