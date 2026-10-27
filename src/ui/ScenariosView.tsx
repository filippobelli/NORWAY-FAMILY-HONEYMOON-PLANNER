import { useMemo, useState } from 'react';
import { formatEur } from '../domain/budget';
import { formatDuration } from '../domain/itinerary';
import {
  addScenario,
  ensureScenarios,
  removeScenario,
  SCENARIO_KIND_LABEL,
  scenarioKindNotes,
  scenarioMetrics,
  switchScenario,
  tripForScenario,
  updateScenarioMeta,
  type ScenarioMetrics,
} from '../domain/scenarios';
import type { ScenarioKind } from '../domain/types';
import { useTrip } from '../state/store';
import { Badge, Field } from './common';

type Row = { label: string; get: (m: ScenarioMetrics) => number; fmt: (v: number) => string; better: 'min' | 'max' | 'none' };

const ROWS: Row[] = [
  { label: 'Giorni', get: (m) => m.days, fmt: (v) => String(v), better: 'none' },
  { label: 'Notti', get: (m) => m.nights, fmt: (v) => String(v), better: 'none' },
  { label: 'Cambi di alloggio', get: (m) => m.accommodationChanges, fmt: (v) => String(v), better: 'min' },
  { label: 'Km su strada (calcolati)', get: (m) => m.roadKm, fmt: (v) => `${v.toLocaleString('it-IT')} km`, better: 'min' },
  { label: 'Trasferimenti teorici', get: (m) => m.transferTheoreticalMin, fmt: formatDuration, better: 'min' },
  { label: 'Trasferimenti realistici (stima)', get: (m) => m.transferRealisticMin, fmt: formatDuration, better: 'min' },
  { label: 'Giornata di trasferimento più lunga', get: (m) => m.maxDayTransferMin, fmt: formatDuration, better: 'min' },
  { label: 'Giornate piene o troppo cariche', get: (m) => m.heavyDays, fmt: (v) => String(v), better: 'min' },
  { label: 'Traghetti', get: (m) => m.ferries, fmt: (v) => String(v), better: 'none' },
  { label: 'Tratti di navigazione costiera', get: (m) => m.coastalSegments, fmt: (v) => String(v), better: 'none' },
  { label: 'Notti a bordo', get: (m) => m.nightsOnboard, fmt: (v) => String(v), better: 'none' },
  { label: 'Tratti in treno o autobus', get: (m) => m.publicTransportSegments, fmt: (v) => String(v), better: 'none' },
  { label: 'Costo totale previsto', get: (m) => m.costTotal, fmt: formatEur, better: 'min' },
  { label: '— di cui certo', get: (m) => m.costFirm, fmt: formatEur, better: 'none' },
  { label: '— di cui stimato o da verificare', get: (m) => m.costEstimated, fmt: formatEur, better: 'none' },
];

export function ScenariosView() {
  const { trip, update, toast } = useTrip();
  const t = useMemo(() => ensureScenarios(trip), [trip]);
  const scenarios = t.scenarios!;
  const metrics = useMemo(() => scenarios.map((s) => ({ s, m: scenarioMetrics(tripForScenario(t, s.id)) })), [t, scenarios]);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<ScenarioKind>('auto_hytte');
  const [from, setFrom] = useState<'copia' | 'vuoto'>('copia');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const best = (row: Row): number | undefined => {
    if (row.better === 'none') return undefined;
    const vals = metrics.filter(({ m }) => m.days > 0).map(({ m }) => row.get(m));
    if (vals.length < 2 || vals.every((v) => v === vals[0])) return undefined;
    return row.better === 'min' ? Math.min(...vals) : Math.max(...vals);
  };

  return (
    <div className="scenarios">
      <div className="note-info">
        Ogni scenario è un itinerario completo (tappe, tratti, giornate e voci di budget). Hytte e opzioni costiere sono condivise. Le cifre vengono solo
        dai dati inseriti: dove mancano, lo scenario lo segnala in "Da verificare".
      </div>

      <section className="panel">
        <h2>Nuovo scenario</h2>
        <div className="grid-4">
          <Field label="Nome">{(id) => <input id={id} value={name} placeholder="es. Fiordi in auto" onChange={(e) => setName(e.target.value)} />}</Field>
          <Field label="Tipo">
            {(id) => (
              <select id={id} value={kind} onChange={(e) => setKind(e.target.value as ScenarioKind)}>
                {Object.entries(SCENARIO_KIND_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Partenza da">
            {(id) => (
              <select id={id} value={from} onChange={(e) => setFrom(e.target.value as 'copia' | 'vuoto')}>
                <option value="copia">Copia dello scenario attivo</option>
                <option value="vuoto">Itinerario vuoto</option>
              </select>
            )}
          </Field>
          <div className="field">
            <span className="field-label" aria-hidden>
              &nbsp;
            </span>
            <div className="field-control">
              <button
                className="btn btn-primary"
                onClick={() => {
                  update((cur) => addScenario(cur, name, kind, from));
                  setName('');
                  toast('Scenario creato: aprilo per modificarlo');
                }}
              >
                Crea scenario
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="scenario-grid">
        {metrics.map(({ s, m }) => {
          const active = s.id === t.activeScenarioId;
          const notes = [...scenarioKindNotes(s.kind, m), ...m.toVerify];
          return (
            <article key={s.id} className={`card scenario-card ${active ? 'active' : ''}`}>
              <header>
                <div>
                  <h3>{s.name}</h3>
                  <span className="muted small">{SCENARIO_KIND_LABEL[s.kind]}</span>
                </div>
                {active ? <Badge tone="ok">in modifica</Badge> : null}
              </header>
              <p className="small">
                {m.days} giorni · {m.roadKm.toLocaleString('it-IT')} km · {formatEur(m.costTotal)}{' '}
                {m.days > 0 && (m.inTarget ? <Badge tone="ok">15–20 giorni</Badge> : <Badge tone="warn">fuori 15–20 giorni</Badge>)}
              </p>
              {notes.length > 0 && (
                <ul className="mini">
                  {notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
              <div className="grid-2">
                <Field label="Nome">
                  {(id) => <input id={id} value={s.name} onChange={(e) => update((cur) => updateScenarioMeta(cur, s.id, { name: e.target.value }))} />}
                </Field>
                <Field label="Tipo">
                  {(id) => (
                    <select id={id} value={s.kind} onChange={(e) => update((cur) => updateScenarioMeta(cur, s.id, { kind: e.target.value as ScenarioKind }))}>
                      {Object.entries(SCENARIO_KIND_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              </div>
              <Field label="Note">
                {(id) => <textarea id={id} rows={2} value={s.notes} onChange={(e) => update((cur) => updateScenarioMeta(cur, s.id, { notes: e.target.value }))} />}
              </Field>
              <footer>
                {!active && (
                  <button
                    className="btn btn-small btn-primary"
                    onClick={() => {
                      update((cur) => switchScenario(cur, s.id));
                      toast(`Aperto "${s.name}": Itinerario, Giornate e Budget ora mostrano questo scenario`);
                    }}
                  >
                    Apri per modificare
                  </button>
                )}
                {!active &&
                  (confirmDelete === s.id ? (
                    <span className="row tight">
                      <button
                        className="btn btn-small danger"
                        onClick={() => {
                          update((cur) => removeScenario(cur, s.id));
                          setConfirmDelete(null);
                        }}
                      >
                        Conferma eliminazione
                      </button>
                      <button className="btn btn-small" onClick={() => setConfirmDelete(null)}>
                        Annulla
                      </button>
                    </span>
                  ) : (
                    <button className="btn btn-small danger" onClick={() => setConfirmDelete(s.id)}>
                      Elimina
                    </button>
                  ))}
              </footer>
            </article>
          );
        })}
      </div>

      {metrics.length > 1 && (
        <section className="panel">
          <h2>Confronto</h2>
          <div className="table-wrap">
            <table className="table metric-table">
              <thead>
                <tr>
                  <th />
                  {metrics.map(({ s }) => (
                    <th key={s.id}>{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const b = best(row);
                  return (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      {metrics.map(({ s, m }) => {
                        const v = row.get(m);
                        return (
                          <td key={s.id} className={`num ${b !== undefined && v === b ? 'best' : ''}`}>
                            {m.days === 0 ? '—' : row.fmt(v)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr>
                  <td>Da verificare</td>
                  {metrics.map(({ s, m }) => (
                    <td key={s.id} className="small">
                      {m.toVerify.length === 0 ? 'nulla' : m.toVerify.join('; ')}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="muted small">
            In verde il valore migliore tra gli scenari con itinerario. I costi includono solo le voci con un prezzo inserito: uno scenario con più dati
            mancanti può sembrare più economico.
          </p>
        </section>
      )}
    </div>
  );
}
