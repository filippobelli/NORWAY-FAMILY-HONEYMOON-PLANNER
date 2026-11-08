import { getContext, setContext } from '../state/workContext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_LABEL, DESTINATIONS, findDestination } from '../data/destinations';
import {
  configureItinerary,
  PACE_MIN_NIGHTS,
  scenarioKindFor,
  TRAVEL_MODE_LABEL,
  TRAVEL_MODES,
  type ConfiguratorInput,
  type ConfiguratorResult,
  type Pace,
  type TravelMode,
} from '../domain/configurator';
import { formatDateIt, formatDuration, isRoutableLeg, legTotals } from '../domain/itinerary';
import { applyVersion, draftMoveStop, draftRemoveStop, draftSetNights, planImpact, saveAlternative } from '../domain/planImpact';
import { reviewProposal, TRANSFER_KIND_LABEL, type TransferKind } from '../domain/proposal';
import { mergeRouted } from '../domain/routeMerge';
import { addScenarioWithPlan, ensureScenarios } from '../domain/scenarios';
import type { Region, Trip } from '../domain/types';
import { getRoutingProvider } from '../services/routing';
import { useTrip } from '../state/store';
import { saveNotice } from '../state/uiContext';
import { Badge, Field, NumberInput } from './common';
import { Icon } from './icons';
import { Modal } from './PlacementDialog';
import { BookingConfirm, ImpactView } from './PlanBDialog';
import { RegionPicker } from './RegionMap';

const PACE_LABEL: Record<Pace, string> = { tranquillo: 'Tranquillo', equilibrato: 'Equilibrato', intenso: 'Intenso' };
const PACE_HINT: Record<Pace, string> = {
  tranquillo: 'Almeno 3 notti per tappa',
  equilibrato: 'Almeno 2 notti per tappa',
  intenso: 'Anche 1 notte per tappa',
};
const MODE_HINT: Record<TravelMode, string> = {
  auto: 'Tra le tappe; i traghetti dei fiordi sono compresi nei percorsi',
  nave: 'Per i tratti lunghi lungo la costa, con notti a bordo',
  treno: 'Dove c\'è una linea tra due tappe (Bergensbanen, Dovrebanen…)',
  bus: 'Per i tratti senza auto né treno',
  volo: 'Per i tratti molto lunghi tra due aeroporti',
};
/** "Aeroporto Bergen Flesland" → "Bergen Flesland (BGO)" */
const airportLabel = (id: string, name: string) => `${name.replace(/^Aeroporto (di )?/, '')} (${id.toUpperCase()})`;
export const AUTO_ROUTE_KEY = 'nfhp.autoRoute';

// Calcolato a ogni uso: il catalogo cambia con le nazioni del viaggio
const airports = () => DESTINATIONS.filter((d) => d.category === 'aeroporti');

/** Valori del configuratore: contesto di lavoro dell'utente (nel cloud, con la copia sul dispositivo) */
function loadSaved(): Partial<ConfiguratorInput> {
  return (getContext().configurator ?? {}) as Partial<ConfiguratorInput>;
}

export function ConfiguratorView() {
  const { trip } = useTrip();
  const saved = useMemo(loadSaved, []);
  const [input, setInput] = useState<ConfiguratorInput>(() => ({
    days: saved.days ?? 18,
    startDate: trip.startDate,
    arrivalAirportId: saved.arrivalAirportId ?? 'bgo',
    departureAirportId: saved.departureAirportId ?? 'bgo',
    modes: saved.modes?.length ? saved.modes : ['auto'],
    pace: saved.pace ?? 'equilibrato',
    maxDriveHours: saved.maxDriveHours ?? Math.round(trip.settings.maxTravelMinPerDay / 60),
    regions: saved.regions ?? ['Fiordi occidentali'],
    excludedAirportRegions: saved.excludedAirportRegions ?? [],
    mustSee: trip.favorites.filter((id) => findDestination(id)?.category !== 'aeroporti'),
    kidFriendly: saved.kidFriendly ?? true,
  }));
  const [result, setResult] = useState<ConfiguratorResult | null>(null);
  const [error, setError] = useState('');
  const [extra, setExtra] = useState('');
  // Due fasi nella stessa vista: prima si scelgono le impostazioni, poi si controlla la proposta
  const [reviewing, setReviewing] = useState(false);
  // Regioni degli aeroporti: comprese finché l'utente non le toglie (si arriva e si riparte comunque dall'aeroporto)
  const airportRegions = [...new Set([findDestination(input.arrivalAirportId)?.region, findDestination(input.departureAirportId)?.region].filter((r): r is Region => Boolean(r)))];
  const excludedAirport = input.excludedAirportRegions ?? [];
  const effectiveRegions = [...new Set([...input.regions, ...airportRegions.filter((r) => !excludedAirport.includes(r))])];
  const toggleRegion = (r: Region) => {
    const on = effectiveRegions.includes(r);
    if (airportRegions.includes(r)) {
      set(
        on
          ? { regions: input.regions.filter((x) => x !== r), excludedAirportRegions: [...excludedAirport.filter((x) => x !== r), r] }
          : { excludedAirportRegions: excludedAirport.filter((x) => x !== r) },
      );
      return;
    }
    set({ regions: on ? input.regions.filter((x) => x !== r) : [...input.regions, r] });
  };
  const set = (p: Partial<ConfiguratorInput>) => {
    setInput((x) => ({ ...x, ...p }));
    setResult(null);
  };

  const run = () => {
    try {
      setError('');
      const r = configureItinerary(input);
      setResult(r);
      setReviewing(true);
      try {
        const keep: Partial<ConfiguratorInput> = { ...input };
        delete keep.mustSee;
        delete keep.startDate;
        setContext({ configurator: keep as Record<string, unknown> });
      } catch {
        /* storage non disponibile: si ricomincia dai valori iniziali */
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const modesText = input.modes.map((m) => TRAVEL_MODE_LABEL[m].split(' (')[0]!.toLowerCase()).join(', ');
  // Nome libero tra le versioni già salvate: due proposte uguali restano distinguibili
  const baseName = `Proposta ${modesText} · ${input.days} giorni`;
  const usedNames = (trip.scenarios ?? []).map((s) => s.name);
  let nameCount = 2;
  let defaultName = baseName;
  while (usedNames.includes(defaultName)) defaultName = `${baseName} (${nameCount++})`;
  const toggleMode = (m: TravelMode, on: boolean) => {
    const next = on ? [...input.modes, m] : input.modes.filter((x) => x !== m);
    if (next.length) set({ modes: TRAVEL_MODES.filter((x) => next.includes(x)) });
  };

  const options = DESTINATIONS.filter((d) => d.category !== 'aeroporti' && !input.mustSee.includes(d.id)).sort((a, b) => a.name.localeCompare(b.name, 'it'));

  if (reviewing && result) return <ProposalReviewPanel key={String(result.plan.stops[0]?.id)} result={result} input={input} defaultName={defaultName} onBack={() => setReviewing(false)} />;

  return (
    <div className="configurator">
      <ol className="flow-steps" aria-label="Come funziona">
        <li className="active" aria-current="step">1. Scegli le impostazioni</li>
        <li>2. Controlla la proposta</li>
        <li>3. Attivala come itinerario</li>
      </ol>
      <div className="note-info">
        Un modo per iniziare o aggiornare l'itinerario: l'app propone un percorso con i luoghi del catalogo, rispettando giorni, aeroporti, ritmo e ore di guida. Nulla cambia finché non controlli la
        proposta e scegli di attivarla; l'itinerario attuale resta comunque conservato tra le versioni del percorso. Nessun prezzo, orario o disponibilità viene inventato.
      </div>

      <section className="panel">
        <h2>Impostazioni della proposta</h2>
        <div className="grid-4 cols-4">
          <Field label="Giorni" hint="Obiettivo: 15–20">
            {(id) => <NumberInput id={id} value={input.days} min={5} onChange={(v) => v && set({ days: Math.min(30, Math.max(5, Math.round(v))) })} />}
          </Field>
          <Field label="Primo giorno">{(id) => <input id={id} type="date" value={input.startDate} onChange={(e) => e.target.value && set({ startDate: e.target.value })} />}</Field>
          <Field label="Aeroporto di arrivo">
            {(id) => (
              <select id={id} value={input.arrivalAirportId} onChange={(e) => set({ arrivalAirportId: e.target.value })}>
                {airports().map((a) => (
                  <option key={a.id} value={a.id}>
                    {airportLabel(a.id, a.name)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Aeroporto di ripartenza">
            {(id) => (
              <select id={id} value={input.departureAirportId} onChange={(e) => set({ departureAirportId: e.target.value })}>
                {airports().map((a) => (
                  <option key={a.id} value={a.id}>
                    {airportLabel(a.id, a.name)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Ritmo" hint={PACE_HINT[input.pace]}>
            {(id) => (
              <select id={id} value={input.pace} onChange={(e) => set({ pace: e.target.value as Pace })}>
                {(Object.keys(PACE_MIN_NIGHTS) as Pace[]).map((p) => (
                  <option key={p} value={p}>
                    {PACE_LABEL[p]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label={input.modes.includes('auto') ? 'Guida al giorno (ore)' : 'Viaggio al giorno (ore)'} hint="Massimo, con soste e traghetti">
            {(id) => <NumberInput id={id} value={input.maxDriveHours} min={1} step={0.5} onChange={(v) => v && set({ maxDriveHours: v })} />}
          </Field>
          <div className="field">
            <span className="field-label">Bambini</span>
            <label className="check field-control">
              <input type="checkbox" checked={input.kidFriendly} onChange={(e) => set({ kidFriendly: e.target.checked })} /> Solo attività adatte
            </label>
            <small className="hint">Esclude quelle poco adatte ai piccoli</small>
          </div>
        </div>

        <fieldset className="chips-field">
          <legend>Mezzi di trasporto (scegline uno o più, in qualsiasi combinazione)</legend>
          <div className="chips">
            {TRAVEL_MODES.map((m) => (
              <label key={m} className={`chip ${input.modes.includes(m) ? 'on' : ''}`} title={MODE_HINT[m]}>
                <input type="checkbox" checked={input.modes.includes(m)} onChange={(e) => toggleMode(m, e.target.checked)} />
                {TRAVEL_MODE_LABEL[m]}
              </label>
            ))}
          </div>
          <p className="muted small">{input.modes.map((m) => `${TRAVEL_MODE_LABEL[m].split(' (')[0]}: ${MODE_HINT[m].toLowerCase()}`).join(' · ')}.</p>
        </fieldset>

        <fieldset className="chips-field">
          <legend>Regioni da esplorare</legend>
          <RegionPicker
            selected={effectiveRegions}
            airportRegions={airportRegions}
            airportIds={[...new Set([input.arrivalAirportId, input.departureAirportId])]}
            onToggle={toggleRegion}
          />
        </fieldset>

        <fieldset className="chips-field">
          <legend>Da includere per forza ({input.mustSee.length}) — all'inizio sono i preferiti del catalogo</legend>
          <div className="chips">
            {input.mustSee.map((id) => {
              const d = findDestination(id);
              return (
                <span key={id} className="chip on">
                  {d?.name ?? id}
                  <button type="button" className="chip-x" aria-label={`Togli ${d?.name ?? id}`} onClick={() => set({ mustSee: input.mustSee.filter((x) => x !== id) })}>
                    ×
                  </button>
                </span>
              );
            })}
            <select
              value={extra}
              aria-label="Aggiungi una destinazione da includere"
              onChange={(e) => {
                if (e.target.value) set({ mustSee: [...input.mustSee, e.target.value] });
                setExtra('');
              }}
            >
              <option value="">+ Aggiungi…</option>
              {options.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {CATEGORY_LABEL[d.category]}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <div className="row">
          <button className="btn btn-primary" onClick={run}>
            Crea la proposta da controllare
          </button>
          {result && (
            <button className="btn" onClick={() => setReviewing(true)}>
              Torna alla proposta
            </button>
          )}
          {error && (
            <span className="error" role="alert">
              {error}
            </span>
          )}
        </div>
      </section>

    </div>
  );
}

/** Calcola i tratti della proposta prima di attivarla: nel viaggio non cambia nulla, si aggiorna solo la bozza. */
function useProposalRouting(draft: Trip, setDraft: (fn: (d: Trip) => Trip) => void) {
  const [state, setState] = useState({ running: false, done: 0, total: 0, failed: 0, error: '' });
  const ref = useRef(draft);
  ref.current = draft;
  const ac = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    ac.current?.abort();
    const c = new AbortController();
    ac.current = c;
    const t = ref.current;
    const todo = t.legs.filter((l) => legTotals(l, t.settings).hasUncalculated && isRoutableLeg(l, t.stops));
    setState({ running: todo.length > 0, done: 0, total: todo.length, failed: 0, error: '' });
    let done = 0;
    let failed = 0;
    let error = '';
    for (const leg of todo) {
      const a = t.stops.find((s) => s.id === leg.fromStopId);
      const b = t.stops.find((s) => s.id === leg.toStopId);
      if (!a || !b) continue;
      try {
        const r = await getRoutingProvider().route(a, b, c.signal);
        if (c.signal.aborted) return;
        setDraft((d) => ({ ...d, legs: d.legs.map((l) => (l.fromStopId === leg.fromStopId && l.toStopId === leg.toStopId ? mergeRouted(l, r.segments) : l)) }));
        done += 1;
      } catch (e) {
        if ((e as Error).name === 'AbortError' || c.signal.aborted) return;
        failed += 1;
        error = (e as Error).message;
      }
      setState({ running: true, done, total: todo.length, failed, error });
    }
    if (!c.signal.aborted) setState({ running: false, done, total: todo.length, failed, error });
  }, [setDraft]);

  useEffect(() => {
    void run();
    return () => ac.current?.abort();
  }, [run]);

  return { ...state, run };
}

const KIND_TONE: Record<TransferKind, 'ok' | 'info' | 'warn'> = { calcolato: 'ok', stimato: 'info', da_verificare: 'warn' };

function ProposalReviewPanel({
  result,
  input,
  defaultName,
  onBack,
}: {
  result: ConfiguratorResult;
  input: ConfiguratorInput;
  defaultName: string;
  onBack: () => void;
}) {
  const { trip, update, toast } = useTrip();
  const kind = scenarioKindFor(input.modes);
  // Bozza: la proposta applicata a una copia del viaggio. Il viaggio vero non cambia finché non si attiva
  const [draft, setDraftState] = useState<Trip>(() =>
    addScenarioWithPlan(trip, defaultName, kind, { ...result.plan, coastalSelected: trip.coastalOptions.filter((o) => o.selected).map((o) => o.id) }),
  );
  const setDraft = useCallback((fn: (d: Trip) => Trip) => setDraftState(fn), []);
  const routing = useProposalRouting(draft, setDraft);
  const limitMin = Math.round(input.maxDriveHours * 60);
  const review = useMemo(() => reviewProposal(draft, limitMin), [draft, limitMin]);
  const [name, setName] = useState('');
  const [confirming, setConfirming] = useState(false);
  const scName = name.trim() || defaultName;
  const memo = [...result.notes, ...result.warnings.map((w) => `Da guardare: ${w}`)].join('\n');
  const activeName = ensureScenarios(trip).scenarios!.find((s) => s.id === ensureScenarios(trip).activeScenarioId)?.name ?? 'Scenario principale';
  const limitChanges = limitMin !== trip.settings.maxTravelMinPerDay;
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    // Cambia fase nella stessa pagina: si riparte dall'inizio e chi usa la tastiera o uno screen reader lo sente
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, []);

  const saveOnly = () => {
    const r = saveAlternative(trip, scName, draft, memo, kind);
    update(() => r.trip);
    toast(`Proposta «${scName}» salvata tra le versioni: l'itinerario attivo non è cambiato`);
    window.location.hash = '#/scenari';
  };

  const activate = () => {
    const r = saveAlternative(trip, scName, draft, memo, kind);
    const from = r.trip.activeScenarioId!;
    update(() => ({ ...applyVersion(r.trip, r.id, scName), settings: { ...r.trip.settings, maxTravelMinPerDay: limitMin } }));
    saveNotice({ scenarioId: r.id, name: scName, fromId: from, fromName: activeName, fromEmpty: trip.stops.length === 0, prevLimit: trip.settings.maxTravelMinPerDay });
    if (review.counts.stimato > 0) {
      try {
        sessionStorage.setItem(AUTO_ROUTE_KEY, '1');
      } catch {
        /* senza sessionStorage il calcolo dei tratti resta manuale */
      }
    }
    window.location.hash = '#/pianifica';
  };

  // Le stime fatte per scegliere l'ordine non servono più quando quel tratto è calcolato: restano solo gli avvisi ancora validi
  const warnings = result.warnings.filter((w) => !review.transfers.some((t) => t.kind === 'calcolato' && w.startsWith(`${t.from} → ${t.to}:`)));

  const transferOf = (stopId: string) => {
    const leg = draft.legs.find((l) => l.fromStopId === stopId);
    return leg ? review.transfers.find((t) => t.legId === leg.id) : undefined;
  };

  return (
    <section className="panel proposal-review" aria-labelledby="proposal-title">
      {confirming && <ActivateDialog trip={trip} draft={draft} name={scName} activeName={activeName} limitMin={limitChanges ? limitMin : undefined} onCancel={() => setConfirming(false)} onConfirm={activate} />}
      <header className="panel-head">
        <div>
          <p className="ov-eyebrow">Proposta da controllare · non ancora attiva</p>
          <h2 id="proposal-title" ref={headingRef} tabIndex={-1}>
            {review.days} giorni in Norvegia, {review.stops.filter((s) => s.nights > 0).length} località in cui dormire
          </h2>
          <p className="muted small">Finché non scegli «Attiva questo itinerario» il percorso attivo («{activeName}») non cambia.</p>
        </div>
      </header>

      <dl className="review-facts">
        <div>
          <dt>Date</dt>
          <dd>
            {review.start && review.end ? `${formatDateIt(review.start)} → ${formatDateIt(review.end)}` : '—'}
            <span className="small muted block">{trip.dateTentative ? 'Provvisorie' : 'Decise nel viaggio'}</span>
          </dd>
        </div>
        <div>
          <dt>Durata</dt>
          <dd>
            {review.days} giorni · {review.nights} notti
            {!review.inTarget && <span className="small warn-text block">Fuori dall'obiettivo di 15–20 giorni</span>}
          </dd>
        </div>
        <div>
          <dt>Trasferimenti</dt>
          <dd>
            {review.counts.calcolato} calcolati · {review.counts.stimato} stimati · {review.counts.da_verificare} da verificare
          </dd>
        </div>
        <div>
          <dt>Limite al giorno</dt>
          <dd>{formatDuration(review.limitMin)}</dd>
        </div>
      </dl>

      <div className="review-legend small" aria-label="Che cosa significano i tempi">
        <span>
          <Badge tone="ok">Calcolato</Badge> percorso stradale dal servizio OSRM, con le soste ipotizzate
        </span>
        <span>
          <Badge tone="info">Stima di massima</Badge> dalla linea d'aria, serve solo a scegliere l'ordine
        </span>
        <span>
          <Badge tone="warn">Da verificare</Badge> treni, navi, voli: tempi e orari non noti
        </span>
      </div>

      <p className="small" role="status">
        {routing.running
          ? `Calcolo dei percorsi stradali: ${routing.done} di ${routing.total}…`
          : review.counts.stimato > 0
            ? `${review.counts.stimato} ${review.counts.stimato === 1 ? 'trasferimento resta stimato' : 'trasferimenti restano stimati'}${routing.failed > 0 ? `: il servizio di percorsi non ha risposto (${routing.error})` : ''}.`
            : 'Tutti i tratti stradali sono calcolati.'}{' '}
        {!routing.running && review.counts.stimato > 0 && (
          <button className="link-btn" onClick={() => void routing.run()}>
            Calcola di nuovo
          </button>
        )}
      </p>

      <h3>Da guardare prima di attivare</h3>
      {review.violations.length + review.unverifiable.length + review.crossings.length + warnings.length + review.lodgingMissing.length === 0 ? (
        <p className="muted small">Nessun avviso.</p>
      ) : (
        <ul className="review-alerts">
          {review.violations.map((v) => (
            <li key={v.dayIndex} className="note-warn small">
              <Icon name="warning" /> <strong>Giorno {v.dayIndex + 1}:</strong> {v.from} → {v.to}, {v.kind === 'stimato' ? 'circa ' : ''}
              {formatDuration(v.minutes)} {v.kind === 'stimato' ? '(stima di massima)' : '(calcolato, con soste)'}: oltre il limite di {formatDuration(review.limitMin)}.
            </li>
          ))}
          {review.unverifiable.map((u) => (
            <li key={`u${u.dayIndex}`} className="note-info small">
              <Icon name="question" /> <strong>Giorno {u.dayIndex + 1}: non verificabile.</strong> {u.from} → {u.to}: tempi noti {u.knownMin > 0 ? `circa ${formatDuration(u.knownMin)}` : 'nessuno'}, manca il tempo di{' '}
              {u.missing.join(', ')}. Un tempo mancante non vale zero.
            </li>
          ))}
          {review.lodgingMissing.length > 0 && (
            <li className="note-info small">
              <Icon name="bed" /> <strong>Alloggi mancanti in {review.lodgingMissing.length} {review.lodgingMissing.length === 1 ? 'tappa' : 'tappe'}:</strong> {review.lodgingMissing.join(', ')}. Li completi dopo in Prenotazioni.
            </li>
          )}
          {review.crossings.length > 0 && (
            <li className="note-info small">
              <Icon name="ferry" /> <strong>Orari da verificare:</strong> {review.crossings.map((c) => `${c.label} (${c.from} → ${c.to})`).join('; ')}.
            </li>
          )}
          {warnings.map((w) => (
            <li key={w} className="note-warn small">
              <Icon name="warning" /> {w}
            </li>
          ))}
        </ul>
      )}

      <h3>Tappe e ordine</h3>
      <ol className="review-route">
        {draft.stops.map((s, i) => {
          const info = review.stops[i];
          const tr = i < draft.stops.length - 1 ? transferOf(s.id) : undefined;
          return (
            <li key={s.id} className={s.kind === 'a_bordo' ? 'aboard' : ''}>
              <div className="review-stop">
                <span className="review-stop-name">
                  <strong>
                    {i + 1}. {s.name}
                  </strong>
                  {info && info.activities.length > 0 && <span className="small muted block">{info.activities.join(' · ')}</span>}
                </span>
                <span className="review-stop-edit">
                  <NumberInput ariaLabel={`Notti a ${s.name}`} value={s.nights} min={0} step={1} onChange={(v) => setDraft((d) => draftSetNights(d, s.id, v ?? 0))} />
                  <span className="small muted">notti</span>
                  <button className="icon-btn" aria-label={`Sposta su ${s.name}`} disabled={i === 0} onClick={() => setDraft((d) => draftMoveStop(d, s.id, -1))}>
                    ↑
                  </button>
                  <button className="icon-btn" aria-label={`Sposta giù ${s.name}`} disabled={i === draft.stops.length - 1} onClick={() => setDraft((d) => draftMoveStop(d, s.id, 1))}>
                    ↓
                  </button>
                  <button className="btn btn-small" aria-label={`Togli ${s.name} dalla proposta`} onClick={() => setDraft((d) => draftRemoveStop(d, s.id, 'alla_precedente'))}>
                    Togli
                  </button>
                </span>
              </div>
              {tr && (
                <p className="review-transfer small">
                  <Badge tone={KIND_TONE[tr.kind]}>{TRANSFER_KIND_LABEL[tr.kind]}</Badge>{' '}
                  {tr.labels.length > 0 && `${tr.labels.join(' + ')} · `}
                  {tr.minutes !== undefined ? `${tr.kind === 'stimato' ? 'circa ' : ''}${formatDuration(tr.minutes)}${tr.roadKm ? ` · ${tr.roadKm.toLocaleString('it-IT')} km su strada` : ''}${review.crossings.some((c) => c.legId === tr.legId) ? ' · orario del traghetto o del mezzo da verificare' : ''}` : 'durata e orari da verificare'}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {review.toComplete.length > 0 && (
        <>
          <h3>Da completare dopo</h3>
          <ul className="facts-list small">
            {review.toComplete.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </>
      )}
      <details className="more-fields">
        <summary>Come è stata costruita la proposta</summary>
        <ul className="facts-list small">
          {result.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </details>

      <div className="review-actions">
        <Field label="Nome della versione">{(id) => <input id={id} value={name} placeholder={defaultName} onChange={(e) => setName(e.target.value)} />}</Field>
        <div className="row wrap">
          <button className="btn btn-primary" disabled={draft.stops.length === 0} onClick={() => setConfirming(true)}>
            Attiva questo itinerario
          </button>
          <button className="btn" disabled={draft.stops.length === 0} onClick={saveOnly}>
            Salva senza attivare
          </button>
          <button className="btn btn-ghost" onClick={onBack}>
            Torna alle impostazioni
          </button>
        </div>
        <p className="muted small">
          Attivando, l'itinerario attivo diventa questo e «{activeName}» resta conservato tra le versioni del percorso. Per ritoccare la proposta usa notti, frecce e «Togli» qui sopra.
        </p>
      </div>
    </section>
  );
}

/** Conferma esplicita: dice che cosa cambia nel percorso attivo, compresi prenotazioni e costi. */
function ActivateDialog({
  trip,
  draft,
  name,
  activeName,
  limitMin,
  onCancel,
  onConfirm,
}: {
  trip: Trip;
  draft: Trip;
  name: string;
  activeName: string;
  limitMin?: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const impact = useMemo(() => planImpact(trip, draft), [trip, draft]);
  const [ok, setOk] = useState(false);
  return (
    <Modal title={`Attiva «${name}»`} onClose={onCancel}>
      <p className="small">
        L'itinerario attivo cambia: da questo momento lavori su «{name}». {trip.stops.length > 0 ? `«${activeName}» resta conservato tra le versioni del percorso e puoi tornarci.` : "L'itinerario attuale è vuoto."}
      </p>
      {limitMin !== undefined && <p className="small">Il limite di trasferimento del viaggio diventa {formatDuration(limitMin)} al giorno, come nelle impostazioni della proposta.</p>}
      <ImpactView i={impact} />
      <BookingConfirm i={impact} ok={ok} setOk={setOk} />
      <div className="row wrap place-actions">
        <button className={`btn ${impact.needsBookingConfirm && !ok ? '' : 'btn-primary'}`} disabled={impact.needsBookingConfirm && !ok} onClick={onConfirm}>
          Sì, attiva questo itinerario
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>
          Non ora
        </button>
      </div>
    </Modal>
  );
}
