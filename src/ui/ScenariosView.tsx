import { useMemo, useState } from 'react';
import { formatEur } from '../domain/budget';
import { formatDuration } from '../domain/itinerary';
import {
  addScenario,
  comparability,
  ensureScenarios,
  removeScenario,
  SCENARIO_KIND_LABEL,
  scenarioKindNotes,
  scenarioMetrics,
  switchScenario,
  tripForScenario,
  updateScenarioMeta,
  type CompareBasis,
  type ScenarioCompleteness,
  type ScenarioMetrics,
} from '../domain/scenarios';
import type { ScenarioKind } from '../domain/types';
import { useTrip } from '../state/store';
import { Badge, Field } from './common';

type Row = {
  label: string;
  get: (m: ScenarioMetrics) => number | undefined;
  fmt: (v: number, m: ScenarioMetrics) => string;
  better: 'min' | 'max' | 'none';
  basis: CompareBasis;
  /** Testo al posto del valore quando non è calcolabile */
  missing?: string;
};

const partialMark = (m: ScenarioMetrics) => (m.incompleteLegs > 0 ? ' (parziale)' : '');

const ROWS: Row[] = [
  { label: 'Giorni', get: (m) => m.days, fmt: (v) => String(v), better: 'none', basis: 'nessuno' },
  { label: 'Notti', get: (m) => m.nights, fmt: (v) => String(v), better: 'none', basis: 'nessuno' },
  { label: 'Cambi di alloggio', get: (m) => m.accommodationChanges, fmt: (v) => String(v), better: 'min', basis: 'nessuno' },
  { label: 'Km su strada (calcolati)', get: (m) => m.roadKm, fmt: (v, m) => `${v.toLocaleString('it-IT')} km${partialMark(m)}`, better: 'min', basis: 'tratti' },
  { label: 'Trasferimenti teorici', get: (m) => m.transferTheoreticalMin, fmt: (v, m) => formatDuration(v) + partialMark(m), better: 'min', basis: 'tratti' },
  { label: 'Trasferimenti realistici (stima)', get: (m) => m.transferRealisticMin, fmt: (v, m) => formatDuration(v) + partialMark(m), better: 'min', basis: 'tratti' },
  { label: 'Giornata di trasferimento più lunga', get: (m) => m.maxDayTransferMin, fmt: (v, m) => formatDuration(v) + partialMark(m), better: 'min', basis: 'tratti' },
  { label: 'Giornate piene o troppo cariche', get: (m) => m.heavyDays, fmt: (v) => String(v), better: 'min', basis: 'tratti' },
  { label: 'Traghetti', get: (m) => m.ferries, fmt: (v) => String(v), better: 'none', basis: 'nessuno' },
  { label: 'Tratti di navigazione costiera', get: (m) => m.coastalSegments, fmt: (v) => String(v), better: 'none', basis: 'nessuno' },
  { label: 'Notti a bordo', get: (m) => m.nightsOnboard, fmt: (v) => String(v), better: 'none', basis: 'nessuno' },
  { label: 'Tratti in treno o autobus', get: (m) => m.publicTransportSegments, fmt: (v) => String(v), better: 'none', basis: 'nessuno' },
  { label: 'Tratti non calcolati', get: (m) => m.uncalculatedLegs, fmt: (v) => String(v), better: 'none', basis: 'nessuno' },
  { label: 'Segmenti con tempi o orari da verificare', get: (m) => m.unverifiedSegments, fmt: (v) => String(v), better: 'none', basis: 'nessuno' },
  {
    label: 'Costo delle voci quantificate',
    get: (m) => m.costTotal,
    fmt: (v, m) => `${formatEur(v)}${m.costPartial ? ' (parziale)' : ''}`,
    better: 'min',
    basis: 'costi_stessa_durata',
  },
  { label: 'Costo al giorno', get: (m) => m.costPerDay, fmt: (v) => formatEur(v), better: 'min', basis: 'costi', missing: 'non calcolabile: totale parziale' },
  { label: '— di cui certo', get: (m) => m.costFirm, fmt: formatEur, better: 'none', basis: 'nessuno' },
  { label: '— di cui stimato o da verificare', get: (m) => m.costEstimated, fmt: formatEur, better: 'none', basis: 'nessuno' },
  { label: 'Costi senza importo', get: (m) => m.missingCosts.length, fmt: (v) => String(v), better: 'none', basis: 'nessuno' },
];

const LEVEL: Record<ScenarioCompleteness['level'], { label: string; tone: 'ok' | 'info' | 'warn' | 'neutral' }> = {
  vuoto: { label: 'Itinerario vuoto', tone: 'neutral' },
  insufficiente: { label: 'Dati insufficienti', tone: 'warn' },
  parziale: { label: 'Dati parziali', tone: 'info' },
  completo: { label: 'Dati completi', tone: 'ok' },
};

export function ScenariosView() {
  const { trip, update, toast } = useTrip();
  const t = useMemo(() => ensureScenarios(trip), [trip]);
  const scenarios = t.scenarios!;
  const metrics = useMemo(() => scenarios.map((s) => ({ s, m: scenarioMetrics(tripForScenario(t, s.id)) })), [t, scenarios]);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<ScenarioKind>('auto_hytte');
  const [from, setFrom] = useState<'copia' | 'vuoto'>('copia');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const all = metrics.map(({ m }) => m);

  // Il migliore si indica solo se la riga è confrontabile con i dati di tutti gli scenari
  const best = (row: Row): number | undefined => {
    if (row.better === 'none' || !comparability(row.basis, all).ok) return undefined;
    const vals = metrics
      .filter(({ m }) => m.days > 0)
      .map(({ m }) => row.get(m))
      .filter((v): v is number => v !== undefined);
    if (vals.length < 2 || vals.every((v) => v === vals[0])) return undefined;
    return row.better === 'min' ? Math.min(...vals) : Math.max(...vals);
  };
  const notCompared = [...new Set(ROWS.filter((r) => r.better !== 'none').map((r) => comparability(r.basis, all)).filter((c) => !c.ok).map((c) => c.reason!))];

  return (
    <div className="scenarios">
      <div className="note-info">
        Ogni scenario è un itinerario completo (tappe, tratti, giornate e voci di budget). Hytte e opzioni costiere sono condivise. Confrontare gli scenari
        non modifica l'itinerario attivo: cambia solo con «Apri per modificare».
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
          const kindNotes = scenarioKindNotes(s.kind, m);
          const lv = LEVEL[m.completeness.level];
          return (
            <article key={s.id} className={`card scenario-card ${active ? 'active' : ''}`}>
              <header>
                <div>
                  <h3>{s.name}</h3>
                  <span className="muted small">{SCENARIO_KIND_LABEL[s.kind]}</span>
                </div>
                <span className="row tight wrap">
                  {active && <Badge tone="ok">in modifica</Badge>}
                  <Badge tone={lv.tone}>{lv.label}</Badge>
                </span>
              </header>
              {s.notes && <p className="small scenario-desc">{s.notes}</p>}
              {m.days > 0 && (
                <dl className="sc-facts">
                  <div>
                    <dt>Durata</dt>
                    <dd>
                      {m.days} giorni · {m.nights} notti {!m.inTarget && <span className="warn-text">(fuori 15–20)</span>}
                    </dd>
                  </div>
                  <div>
                    <dt>Cambi di alloggio</dt>
                    <dd>{m.accommodationChanges}</dd>
                  </div>
                  <div>
                    <dt>Strada</dt>
                    <dd>
                      {m.roadKm.toLocaleString('it-IT')} km{partialMark(m)}
                    </dd>
                  </div>
                  <div>
                    <dt>Trasferimenti realistici</dt>
                    <dd>
                      ~{formatDuration(m.transferRealisticMin)}
                      {partialMark(m)}
                    </dd>
                  </div>
                  <div>
                    <dt>Nave, traghetti, treni</dt>
                    <dd>
                      {m.ferries} {m.ferries === 1 ? 'traghetto' : 'traghetti'} · {m.coastalSegments} costiera · {m.publicTransportSegments} treno/bus
                    </dd>
                  </div>
                  <div>
                    <dt>Costo voci quantificate</dt>
                    <dd>
                      {formatEur(m.costTotal)} <span className="muted small">{m.costPartial ? 'parziale' : 'completo'}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Al giorno</dt>
                    <dd>{m.costPerDay !== undefined ? formatEur(m.costPerDay) : <span className="muted">non calcolabile</span>}</dd>
                  </div>
                  <div>
                    <dt>Da verificare</dt>
                    <dd>
                      {m.uncalculatedLegs} tratti da calcolare · {m.unverifiedSegments} segmenti
                    </dd>
                  </div>
                </dl>
              )}
              {m.familyNotes.length + kindNotes.length > 0 && (
                <div className="sc-block">
                  <h4>Per la famiglia</h4>
                  <ul className="mini">
                    {[...kindNotes, ...m.familyNotes].map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
              {m.missingCosts.length > 0 && (
                <div className="sc-block">
                  <h4>Costi senza importo (esclusi dal totale)</h4>
                  <ul className="mini">
                    {m.missingCosts.slice(0, 3).map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                    {m.missingCosts.length > 3 && <li>e altri {m.missingCosts.length - 3}</li>}
                  </ul>
                </div>
              )}
              {m.completeness.needs.length > 0 && (
                <div className="sc-block">
                  <h4>Per completare il confronto</h4>
                  <ul className="mini">
                    {m.completeness.needs.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
              <details>
                <summary>Nome, tipo e descrizione</summary>
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
                <Field label="Descrizione e note">
                  {(id) => <textarea id={id} rows={2} value={s.notes} onChange={(e) => update((cur) => updateScenarioMeta(cur, s.id, { notes: e.target.value }))} />}
                </Field>
              </details>
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
        <section className="panel scenario-compare">
          <h2>Confronto</h2>
          <p className="muted small compare-mobile-note">Su questo schermo il confronto è nelle schede qui sopra: la tabella completa compare su schermi più larghi.</p>
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
                        const isBest = b !== undefined && v === b;
                        return (
                          <td key={s.id} className={`num ${isBest ? 'best' : ''}`}>
                            {m.days === 0 ? '—' : v === undefined ? <span className="muted small">{row.missing ?? '—'}</span> : row.fmt(v, m)}
                            {isBest && <span className="best-mark"> ✓ migliore</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr>
                  <td>Completezza</td>
                  {metrics.map(({ s, m }) => (
                    <td key={s.id} className="small">
                      {LEVEL[m.completeness.level].label}
                    </td>
                  ))}
                </tr>
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
            «✓ migliore» compare solo dove i dati di tutti gli scenari lo permettono. I costi includono solo le voci con un importo: un prezzo mancante non vale
            zero.
          </p>
          {notCompared.length > 0 && <p className="note-warn small">Alcune righe non indicano un migliore: {notCompared.join('; ')}.</p>}
        </section>
      )}
    </div>
  );
}
