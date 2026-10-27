import { useMemo, useState } from 'react';
import { BUDGET_CATEGORIES, computeBudget, formatEur, STATUS_LABEL } from '../domain/budget';
import { newId } from '../domain/ids';
import type { BudgetCategory, BudgetItem, DataStatus, Money } from '../domain/types';
import { useTrip } from '../state/store';
import { Badge, Field, MoneyInput, NumberInput, StatusBadge, StatusSelect } from './common';

const ORIGIN_LABEL = { manuale: 'Voce manuale', hytte: 'Da Hytte', costiera: 'Da Costiera', trasporti: 'Da Itinerario', giornate: 'Da Giornate' } as const;

export function BudgetView() {
  const { trip, update } = useTrip();
  const b = useMemo(() => computeBudget(trip), [trip]);
  const [cat, setCat] = useState<BudgetCategory>('voli');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState<Money | undefined>(undefined);
  const [status, setStatus] = useState<DataStatus>('stimato');

  const add = () => {
    if (!amount || !label.trim()) return;
    const item: BudgetItem = { id: newId(), category: cat, label: label.trim(), amount, status, notes: '' };
    update((t) => ({ ...t, budgetItems: [...t.budgetItems, item] }));
    setLabel('');
    setAmount(undefined);
  };

  const firm = b.byStatus.confermato + b.byStatus.prenotato + b.byStatus.pagato;

  return (
    <div className="budget">
      <section className="kpis">
        <div className="kpi">
          <span>Totale previsto</span>
          <strong>{formatEur(b.total)}</strong>
          <small>2 adulti e 2 bambini</small>
        </div>
        <div className="kpi">
          <span>Media giornaliera</span>
          <strong>{b.perDay !== undefined ? formatEur(b.perDay) : '—'}</strong>
          <small>{b.days ? `${b.days} giorni` : 'itinerario vuoto'}</small>
        </div>
        <div className="kpi">
          <span>Già certo</span>
          <strong>{formatEur(firm)}</strong>
          <small>confermato, prenotato o pagato</small>
        </div>
        <div className="kpi kpi-warn">
          <span>Stime e da verificare</span>
          <strong>{formatEur(b.byStatus.stimato + b.byStatus.da_verificare)}</strong>
          <small>non sono prezzi ufficiali</small>
        </div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <h2>Per categoria</h2>
          <table className="table compact">
            <tbody>
              {BUDGET_CATEGORIES.map((c) => (
                <tr key={c.id}>
                  <td>{c.label}</td>
                  <td className="num">{b.byCategory[c.id] ? formatEur(b.byCategory[c.id]) : <span className="muted">—</span>}</td>
                  <td className="bar-cell">
                    <span className="bar" style={{ width: `${b.total ? Math.round((b.byCategory[c.id] / b.total) * 100) : 0}%` }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel">
          <h2>Cosa manca</h2>
          {b.missing.length === 0 ? (
            <p>Tutte le categorie hanno almeno una voce.</p>
          ) : (
            <ul className="facts-list">
              {b.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
          <h3>Parametri</h3>
          <div className="grid-2">
            <Field label="Cambio NOK per 1 EUR" hint={trip.settings.nokRateNote}>
              {(id) => (
                <NumberInput
                  id={id}
                  value={trip.settings.nokPerEur}
                  min={1}
                  onChange={(v) => v && v > 0 && update((t) => ({ ...t, settings: { ...t.settings, nokPerEur: v, nokRateNote: 'Impostato a mano' } }))}
                />
              )}
            </Field>
            <Field label="Carburante (EUR/km)" hint="Es. consumo × prezzo al litro. Lascia vuoto se non vuoi stimarlo.">
              {(id) => (
                <NumberInput
                  id={id}
                  value={trip.settings.fuelEurPerKm}
                  min={0}
                  step={0.01}
                  onChange={(v) => update((t) => ({ ...t, settings: { ...t.settings, fuelEurPerKm: v } }))}
                />
              )}
            </Field>
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>Voci</h2>
        <div className="add-line">
          <select value={cat} onChange={(e) => setCat(e.target.value as BudgetCategory)} aria-label="Categoria">
            {BUDGET_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <input placeholder="Descrizione (es. voli Bari–Bergen A/R)" value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Descrizione" />
          <MoneyInput value={amount} onChange={setAmount} />
          <StatusSelect value={status} onChange={setStatus} />
          <button className="btn btn-primary" disabled={!amount || !label.trim()} onClick={add}>
            Aggiungi voce
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Voce</th>
                <th>Categoria</th>
                <th>Origine</th>
                <th>Stato</th>
                <th className="num">EUR</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {b.lines.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    Nessuna voce. Le voci di hytte, navigazione, traghetti e attività compaiono qui automaticamente quando hanno un prezzo.
                  </td>
                </tr>
              )}
              {b.lines.map((l) => (
                <tr key={l.key}>
                  <td>{l.label}</td>
                  <td>{BUDGET_CATEGORIES.find((c) => c.id === l.category)?.label}</td>
                  <td>
                    <Badge>{ORIGIN_LABEL[l.origin]}</Badge>
                  </td>
                  <td>
                    {l.itemId ? (
                      <StatusSelect
                        value={l.status}
                        onChange={(v) => update((t) => ({ ...t, budgetItems: t.budgetItems.map((x) => (x.id === l.itemId ? { ...x, status: v } : x)) }))}
                      />
                    ) : (
                      <StatusBadge status={l.status} />
                    )}
                  </td>
                  <td className="num">{formatEur(l.eur)}</td>
                  <td>
                    {l.itemId && (
                      <button
                        className="icon-btn danger"
                        aria-label={`Elimina ${l.label}`}
                        onClick={() => update((t) => ({ ...t, budgetItems: t.budgetItems.filter((x) => x.id !== l.itemId) }))}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          Legenda stati: {Object.values(STATUS_LABEL).join(' · ')}. Le voci derivate si modificano nella sezione di origine.
        </p>
      </section>
    </div>
  );
}
