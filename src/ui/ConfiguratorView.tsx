import { useMemo, useState } from 'react';
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
import { formatDateIt, totalDays } from '../domain/itinerary';
import { addScenarioWithPlan } from '../domain/scenarios';
import type { Region } from '../domain/types';
import { useTrip } from '../state/store';
import { Badge, Field, NumberInput } from './common';

const REGIONS: Region[] = ['Oslo e Østlandet', 'Innlandet e montagne', 'Fiordi occidentali', 'Sørlandet e Rogaland', 'Trøndelag', 'Nordland e Lofoten', 'Troms e Finnmark'];
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
const STORE_KEY = 'nfhp.configurator.v1';
export const AUTO_ROUTE_KEY = 'nfhp.autoRoute';

const AIRPORTS = DESTINATIONS.filter((d) => d.category === 'aeroporti');

function loadSaved(): Partial<ConfiguratorInput> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as Partial<ConfiguratorInput>;
  } catch {
    return {};
  }
}

export function ConfiguratorView() {
  const { trip, update, toast } = useTrip();
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
    mustSee: trip.favorites.filter((id) => findDestination(id)?.category !== 'aeroporti'),
    kidFriendly: saved.kidFriendly ?? true,
  }));
  const [result, setResult] = useState<ConfiguratorResult | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [extra, setExtra] = useState('');
  const set = (p: Partial<ConfiguratorInput>) => {
    setInput((x) => ({ ...x, ...p }));
    setResult(null);
  };

  const run = () => {
    try {
      setError('');
      const r = configureItinerary(input);
      setResult(r);
      try {
        const { mustSee: _m, startDate: _s, ...keep } = input;
        localStorage.setItem(STORE_KEY, JSON.stringify(keep));
      } catch {
        /* storage non disponibile: si ricomincia dai valori iniziali */
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const create = () => {
    if (!result) return;
    const scName = name.trim() || defaultName;
    const memo = [...result.notes, ...result.warnings.map((w) => `Da guardare: ${w}`)].join('\n');
    update((t) => addScenarioWithPlan(t, scName, scenarioKindFor(input.modes), result.plan, memo));
    try {
      sessionStorage.setItem(AUTO_ROUTE_KEY, '1');
    } catch {
      /* senza sessionStorage il calcolo dei tratti resta manuale */
    }
    toast(`Scenario "${scName}" creato e attivo: l'itinerario precedente è salvato in Scenari`);
    window.location.hash = '#/itinerario';
  };

  const modesText = input.modes.map((m) => TRAVEL_MODE_LABEL[m].split(' (')[0]!.toLowerCase()).join(', ');
  const defaultName = `Proposta ${modesText} · ${input.days} giorni`;
  const toggleMode = (m: TravelMode, on: boolean) => {
    const next = on ? [...input.modes, m] : input.modes.filter((x) => x !== m);
    if (next.length) set({ modes: TRAVEL_MODES.filter((x) => next.includes(x)) });
  };

  const options = DESTINATIONS.filter((d) => d.category !== 'aeroporti' && !input.mustSee.includes(d.id)).sort((a, b) => a.name.localeCompare(b.name, 'it'));
  const stops = result?.plan.stops ?? [];

  return (
    <div className="configurator">
      <div className="note-info">
        Il configuratore propone un itinerario con le destinazioni del catalogo, rispettando giorni, aeroporti, ritmo e ore di guida. Per scegliere l'ordine usa
        <strong> distanze stimate</strong> (non calcolate): km e tempi veri si calcolano subito dopo, nell'Itinerario. Crea sempre uno{' '}
        <strong>scenario nuovo</strong>: quello attuale resta salvato e confrontabile in Scenari. Nessun prezzo, orario o disponibilità viene inventato.
      </div>

      <section className="panel">
        <h2>Impostazioni</h2>
        <div className="grid-4 cols-4">
          <Field label="Giorni" hint="Obiettivo: 15–20">
            {(id) => <NumberInput id={id} value={input.days} min={5} onChange={(v) => v && set({ days: Math.min(30, Math.max(5, Math.round(v))) })} />}
          </Field>
          <Field label="Primo giorno">{(id) => <input id={id} type="date" value={input.startDate} onChange={(e) => e.target.value && set({ startDate: e.target.value })} />}</Field>
          <Field label="Aeroporto di arrivo">
            {(id) => (
              <select id={id} value={input.arrivalAirportId} onChange={(e) => set({ arrivalAirportId: e.target.value })}>
                {AIRPORTS.map((a) => (
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
                {AIRPORTS.map((a) => (
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
          <legend>Regioni da esplorare (quelle degli aeroporti sono sempre comprese)</legend>
          <div className="chips">
            {REGIONS.map((r) => (
              <label key={r} className={`chip ${input.regions.includes(r) ? 'on' : ''}`}>
                <input
                  type="checkbox"
                  checked={input.regions.includes(r)}
                  onChange={(e) => set({ regions: e.target.checked ? [...input.regions, r] : input.regions.filter((x) => x !== r) })}
                />
                {r}
              </label>
            ))}
          </div>
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
            Crea la proposta
          </button>
          {error && (
            <span className="error" role="alert">
              {error}
            </span>
          )}
        </div>
      </section>

      {result && (
        <section className="panel" aria-live="polite">
          <header className="panel-head">
            <div>
              <h2>Proposta · {totalDays(stops)} giorni</h2>
              <p className="muted small">
                Dal {formatDateIt(input.startDate)} · {modesText} · {result.bases.length} località in cui dormire
              </p>
            </div>
          </header>
          <ol className="proposal">
            {stops.map((s) => {
              const acts = Object.entries(result.plan.days)
                .filter(([k]) => k.startsWith(`${s.id}#`))
                .flatMap(([, d]) => d.activities);
              return (
                <li key={s.id} className={s.kind === 'a_bordo' ? 'aboard' : ''}>
                  <strong>{s.name}</strong>{' '}
                  <span className="muted small">{s.nights === 0 ? (s === stops[0] ? 'arrivo' : 'ripartenza') : `${s.nights} ${s.nights === 1 ? 'notte' : 'notti'}`}</span>
                  {acts.length > 0 && (
                    <div className="small proposal-acts">
                      {acts.map((a, i) => (
                        <span key={a.id}>
                          {i > 0 && ' · '}
                          {a.destinationId && findDestination(a.destinationId)?.officialUrl ? (
                            <a href={findDestination(a.destinationId)!.officialUrl} target="_blank" rel="noreferrer">
                              {a.title} ↗
                            </a>
                          ) : (
                            a.title
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          {result.warnings.length > 0 && (
            <ul className="warnings">
              {result.warnings.map((w) => (
                <li key={w} className="note-warn small">
                  ⚠️ {w}
                </li>
              ))}
            </ul>
          )}
          <ul className="facts-list small">
            {result.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <div className="row wrap">
            <Field label="Nome dello scenario">
              {(id) => <input id={id} value={name} placeholder={defaultName} onChange={(e) => setName(e.target.value)} />}
            </Field>
            <button className="btn btn-primary" onClick={create}>
              Crea come nuovo scenario e calcola i tratti
            </button>
            <Badge tone="info">L'itinerario attuale non viene toccato</Badge>
          </div>
        </section>
      )}
    </div>
  );
}
