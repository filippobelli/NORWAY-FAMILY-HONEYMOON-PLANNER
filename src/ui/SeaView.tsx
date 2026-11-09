// «Trasporti via mare» (design trasporti via mare §1–§3, §9–§11): due schede, Crociere (la vista di sempre,
// invariata) e Traghetti (catalogo delle tratte in giornata con ricerca, filtri, suggerimenti «alternativa all'auto»).
// Indirizzo: #/crociere (Crociere), #/crociere?parte=traghetti, #/crociere?parte=traghetti&tratta={id}; alias #/mare.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FerryMode, FerryRoute } from '../data/ferryTypes';
import { releaseVersion, tripCountries } from '../domain/countries';
import {
  activeFilters,
  catalogSummary,
  FERRY_MODE_LABEL,
  FERRY_ZONES,
  ferrySuggestions,
  fmtRange,
  groupByZone,
  hideSuggestion,
  matchesFerry,
  priceLine,
  routePlaces,
  showHiddenSuggestions,
  tripPlaceIds,
  tripYear,
  type FerryFilter,
} from '../domain/ferries';
import { formatDuration, legSummary } from '../domain/itinerary';
import { buildHash, parseRoute } from '../state/route';
import { useTripCatalog } from '../state/catalog';
import { useTrip } from '../state/store';
import { useMediaQuery, useOnline } from '../state/uiContext';
import { CoastalView } from './CoastalView';
import { Badge, Empty } from './common';
import { Arrowed, FerryDialog, PriceBadge, shortName, useTripFerries, type FerryDialogProps } from './Ferries';

type Part = 'crociere' | 'traghetti';
const partOf = (params: Record<string, string>): Part => (params.parte === 'traghetti' || params.tratta ? 'traghetti' : 'crociere');


export function SeaView() {
  const [part, setPart] = useState<Part>(() => partOf(parseRoute(window.location.hash).params));
  const routes = useTripFerries();
  useEffect(() => {
    const on = () => {
      const r = parseRoute(window.location.hash);
      if (r.view === 'crociere') setPart(partOf(r.params));
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const choose = (p: Part) => {
    setPart(p);
    // replaceState: «indietro» del browser non cambia scheda
    window.history.replaceState(null, '', buildHash('crociere', { parte: p === 'traghetti' ? 'traghetti' : undefined }));
  };
  const tabs: { id: Part; label: string }[] = [
    { id: 'crociere', label: 'Crociere' },
    { id: 'traghetti', label: routes.length ? `Traghetti (${routes.length})` : 'Traghetti' },
  ];
  return (
    <div className="sea">
      <div
        className="stop-tabs sea-tabs"
        role="tablist"
        aria-label="Trasporti via mare"
        onKeyDown={(e) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
          e.preventDefault();
          const i = tabs.findIndex((t) => t.id === part);
          const n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
          choose(tabs[n]!.id);
          requestAnimationFrame(() => document.getElementById(`mare-${tabs[n]!.id}`)?.focus());
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`mare-${t.id}`}
            tabIndex={part === t.id ? 0 : -1}
            aria-selected={part === t.id}
            aria-controls="mare-pannello"
            className={part === t.id ? 'active' : ''}
            onClick={() => choose(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="mare-pannello" aria-labelledby={`mare-${part}`}>
        {part === 'crociere' ? <CoastalView /> : <FerriesPanel routes={routes} />}
      </div>
    </div>
  );
}

const MODES: FerryMode[] = ['ferje', 'hurtigbat', 'turistico'];

function FerriesPanel({ routes }: { routes: FerryRoute[] }) {
  const { trip, update, toast, replace } = useTrip();
  const { fileMode, states, errors, retry } = useTripCatalog();
  const online = useOnline();
  const wide = useMediaQuery('(min-width: 760px)');
  const year = tripYear(trip);
  const places = useMemo(() => tripPlaceIds(trip), [trip]);
  const [dialog, setDialog] = useState<Omit<FerryDialogProps, 'onClose'> | null>(() => {
    const key = parseRoute(window.location.hash).params.tratta;
    return key ? { routeKey: key, step: 'scheda' } : null;
  });
  useEffect(() => {
    const on = () => {
      const r = parseRoute(window.location.hash);
      if (r.view === 'crociere' && r.params.tratta) setDialog({ routeKey: r.params.tratta, step: 'scheda' });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const closeDialog = () => {
    setDialog(null);
    if (parseRoute(window.location.hash).params.tratta) window.history.replaceState(null, '', buildHash('crociere', { parte: 'traghetti' }));
  };
  const [f, setF] = useState<FerryFilter>({ car: 'tutte', modes: [] });
  // Il conteggio per i lettori di schermo si aggiorna una volta a fine digitazione
  const [q, setQ] = useState('');
  useEffect(() => {
    const id = window.setTimeout(() => setF((x) => ({ ...x, q })), 300);
    return () => window.clearTimeout(id);
  }, [q]);
  const [allSugg, setAllSugg] = useState(false);
  const shown = useMemo(() => routes.filter((r) => matchesFerry(r, f, places)), [routes, f, places]);
  const groups = useMemo(() => groupByZone(shown, places, f.zone), [shown, places, f.zone]);
  const suggestions = useMemo(() => ferrySuggestions(trip, routes), [trip, routes]);
  const hiddenCount = useMemo(() => ferrySuggestions(trip, routes, { includeHidden: true }).length - suggestions.length, [trip, routes, suggestions]);
  const summary = useMemo(() => catalogSummary(routes, year), [routes, year]);
  const nActive = activeFilters({ ...f, q });
  const reset = () => {
    setQ('');
    setF({ car: 'tutte', modes: [] });
  };

  // Stati del catalogo (design §3, «Stati»)
  if (!routes.length) {
    const noRelease = tripCountries(trip).find((c) => c.code === 'NO');
    const loading = !fileMode && Object.values(states).includes('in_download');
    const err = !fileMode ? Object.values(errors).find(Boolean) : undefined;
    const missing = !fileMode && Object.values(states).includes('da_scaricare');
    if (loading)
      return (
        <p role="status">
          <span className="spinner" aria-hidden /> Carico le tratte…
        </p>
      );
    if (noRelease && (releaseVersion(noRelease.releaseId) ?? 0) < 2) {
      return (
        <div className="note-info ferry-upgrade">
          <p>Le tratte dei traghetti sono nel catalogo Norvegia versione 2. Il viaggio usa la versione {releaseVersion(noRelease.releaseId) ?? 1} e non cambia da solo.</p>
          <a className="btn" href={buildHash('impostazioni', { sezione: 'nazioni' })}>
            Vai a Nazioni e cataloghi
          </a>
        </div>
      );
    }
    if (err)
      return (
        <div className="note-warn" role="alert">
          Non riesco a leggere il catalogo dei traghetti: {err}{' '}
          {online && (
            <button className="btn btn-small" onClick={retry}>
              Riprova
            </button>
          )}
        </div>
      );
    if (missing && !online) return <p className="note-info">Senza rete: le tratte si caricano da sole al ritorno della connessione.</p>;
    return <Empty title="Nessuna tratta traghetto">Il catalogo delle nazioni del viaggio non contiene tratte traghetto.</Empty>;
  }

  const visibleSugg = allSugg ? suggestions : suggestions.slice(0, 3);
  const filters = (
    <>
      <label className="field">
        <span>Zona</span>
        <select value={f.zone ?? ''} onChange={(e) => setF({ ...f, zone: e.target.value || undefined })}>
          <option value="">Tutte le zone</option>
          {FERRY_ZONES.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Auto</span>
        <select value={f.car ?? 'tutte'} onChange={(e) => setF({ ...f, car: e.target.value as FerryFilter['car'] })}>
          <option value="tutte">Con o senza auto</option>
          <option value="auto">Porta l'auto</option>
          <option value="passeggeri">Solo passeggeri</option>
        </select>
      </label>
      <fieldset className="chips-field">
        <legend>Mezzo</legend>
        {MODES.map((m) => (
          <label key={m} className={`chip ${f.modes?.includes(m) ? 'on' : ''}`}>
            <input
              type="checkbox"
              checked={Boolean(f.modes?.includes(m))}
              onChange={(e) => setF({ ...f, modes: e.target.checked ? [...(f.modes ?? []), m] : (f.modes ?? []).filter((x) => x !== m) })}
            />{' '}
            {FERRY_MODE_LABEL[m]}
          </label>
        ))}
      </fieldset>
      <label className="check">
        <input type="checkbox" checked={Boolean(f.withPrice)} onChange={(e) => setF({ ...f, withPrice: e.target.checked || undefined })} /> Solo con prezzo
      </label>
      <label className="check" title={places.size ? undefined : 'Nessuna tappa nel viaggio'}>
        <input type="checkbox" disabled={!places.size} checked={Boolean(f.linked)} onChange={(e) => setF({ ...f, linked: e.target.checked || undefined })} /> Collegate alle mie tappe
      </label>
    </>
  );

  return (
    <div className="ferries">
      {dialog && <FerryDialog {...dialog} onClose={closeDialog} />}
      <div className="note-info">
        Tratte in giornata (traghetti per auto, battelli veloci, battelli turistici) lette sulle fonti ufficiali il 09/11/2026. Quasi tutte le tariffe sono del 2026: da verificare per il 2027. L'app non prenota nulla.
      </div>
      <p className="muted small">
        {summary.total} tratte · prezzo {year ?? 'del viaggio'}: {summary.ok} · tariffa da verificare: {summary.warn} · prezzo assente: {summary.none}
      </p>

      {(suggestions.length > 0 || hiddenCount > 0) && (
        <section className="panel ferry-suggest" aria-labelledby="alternative-auto">
          <h2 id="alternative-auto">Alternative all'auto nel tuo percorso</h2>
          <p className="small muted">Tratte via mare che collegano due tue tappe oggi in auto. Sono solo proposte: il percorso cambia solo se lo scegli tu.</p>
          <ul className="plain-list">
            {visibleSugg.map((s) => {
              const leg = trip.legs.find((l) => l.id === s.legId)!;
              const sum = legSummary(leg, trip.settings);
              const dur = fmtRange(s.route.duration.min !== undefined ? [s.route.duration.min, s.route.duration.max ?? s.route.duration.min] : undefined);
              return (
                <li key={`${s.legId}-${s.route.key}`} className="ferry-sugg">
                  <p>
                    <strong>
                      {s.from.name} → {s.to.name}
                    </strong>{' '}
                    in auto oggi: {sum.roadKm > 0 ? `${Math.round(sum.roadKm)} km, guida ${formatDuration(sum.driveMin)}` : 'strada da calcolare'}. In {FERRY_MODE_LABEL[s.route.mode].toLowerCase()}: {shortName(s.route)}
                    {dur ? `, ${dur}` : ''}
                    {s.reversed ? ' (verso opposto, durata da verificare)' : ''}. {priceLine(s.route)}.
                  </p>
                  <p className="small">Senza auto su questo collegamento: l'auto va riconsegnata o riportata. Decidi tu.</p>
                  <div className="row wrap">
                    <button className="btn btn-small" onClick={() => setDialog({ routeKey: s.route.key, step: 'scheda' })} aria-label={`Scheda: ${shortName(s.route)}`}>
                      Scheda
                    </button>
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => setDialog({ routeKey: s.route.key, step: 'aggiungi', legId: s.legId, preset: { withCar: false, road: 'sostituisci' } })}
                      aria-label={`Valuta nel percorso: ${shortName(s.route)}`}
                    >
                      Valuta nel percorso
                    </button>
                    <button
                      className="btn btn-small btn-ghost"
                      onClick={() => {
                        const before = trip;
                        update((t) => hideSuggestion(t, s.legId, s.route.key));
                        toast('Suggerimento nascosto', 'ok', { label: 'Annulla', run: () => replace(before) });
                      }}
                    >
                      Non mi interessa
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {suggestions.length > 3 && !allSugg && (
            <button type="button" className="link-btn" onClick={() => setAllSugg(true)}>
              Mostra tutte ({suggestions.length})
            </button>
          )}
          {hiddenCount > 0 && (
            <button type="button" className="link-btn" onClick={() => update((t) => showHiddenSuggestions(t))}>
              Mostra i suggerimenti nascosti ({hiddenCount})
            </button>
          )}
        </section>
      )}

      <div className="filters ferry-filters">
        <input type="search" className="ferry-search" aria-label="Cerca nei traghetti" placeholder="Cerca tratta, porto o tappa" value={q} onChange={(e) => setQ(e.target.value)} />
        {wide ? (
          filters
        ) : (
          <details className="more-fields ferry-more">
            <summary>Filtri{nActive ? ` · ${nActive} attivi` : ''}</summary>
            {filters}
          </details>
        )}
        {nActive > 0 && (
          <button type="button" className="link-btn" onClick={reset}>
            Azzera filtri
          </button>
        )}
      </div>
      <p className="small" role="status">
        {shown.length} tratte su {routes.length}
        {f.linked ? ' collegate alle tue tappe' : ''}
      </p>

      {shown.length === 0 ? (
        <Empty title="Nessuna tratta per questi filtri">
          {f.linked ? 'Nessuna tratta collegata alle tue tappe. Le tratte si collegano alle tappe solo se sono nel catalogo dei luoghi.' : 'Prova a togliere un filtro o a cercare un porto vicino.'}{' '}
          <button type="button" className="btn btn-small" onClick={reset}>
            Azzera filtri
          </button>
        </Empty>
      ) : (
        groups.map((g) => (
          <section key={g.zone} className="ferry-zone" aria-labelledby={`zona-${g.zone}`}>
            <h3 id={`zona-${g.zone}`} className="row space">
              <span>{g.zone}</span> <span className="small muted">{g.routes.length} tratte</span>
            </h3>
            <ul className="cat-list ferry-list">
              {g.routes.map((r) => (
                <FerryItem key={r.key} r={r} places={places} year={year} onOpen={(step) => setDialog({ routeKey: r.key, step })} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function FerryItem({ r, places, year, onOpen }: { r: FerryRoute; places: Set<string>; year?: number; onOpen: (step: 'scheda' | 'aggiungi') => void }) {
  const linked = routePlaces(r).filter((p) => places.has(p));
  const { trip } = useTrip();
  const names = linked.map((k) => trip.stops.find((s) => s.destinationId === k)?.name ?? k);
  const dur = fmtRange(r.duration.min !== undefined ? [r.duration.min, r.duration.max ?? r.duration.min] : undefined);
  const inner = r.stops.length - 2;
  const name = shortName(r);
  const ref = useRef<HTMLLIElement>(null);
  return (
    <li className="cat-item ferry-item" ref={ref}>
      <div>
        <h4>
          <button type="button" className="link-btn" onClick={() => onOpen('scheda')}>
            <Arrowed text={name} />
          </button>
        </h4>
        <p className="small">
          <Badge>{FERRY_MODE_LABEL[r.mode]}</Badge> {r.operator}
          {r.road ? ` · ${r.road}` : ''}
        </p>
        <p className="small">
          {dur ?? 'durata non pubblicata'} · {inner > 0 ? `${inner} ${inner === 1 ? 'fermata intermedia' : 'fermate intermedie'}` : 'diretta'} · {r.carriesCar ? "porta l'auto" : "non porta l'auto"}
        </p>
        {r.season.text && r.season.status !== 'assente' && <p className="small muted">{r.season.text}</p>}
        {linked.length > 0 && <Badge tone="ok">✓ collegata a {names.join(', ')}</Badge>}
        {r.roundTrip && (
          <>
            {' '}
            <Badge>andata e ritorno</Badge>
          </>
        )}
      </div>
      <div className="cat-price">
        <p className="small">{priceLine(r)}</p>
        <PriceBadge r={r} year={year} />
        <div className="row wrap ferry-item-actions">
          <button className="btn btn-small" onClick={() => onOpen('scheda')} aria-label={`Scheda: ${name}`}>
            Scheda
          </button>
          {!r.roundTrip && (
            <button className="btn btn-small btn-primary" onClick={() => onOpen('aggiungi')} aria-label={`Aggiungi al percorso: ${name}`}>
              Aggiungi al percorso
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
