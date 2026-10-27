import { useMemo, useState } from 'react';
import { COASTAL_FACTS, COASTAL_SOURCES, portsFor } from '../data/coastalPorts';
import { formatEur, STATUS_LABEL } from '../domain/budget';
import { coastalRoute, coastalTotalEur, familyValueNotes } from '../domain/coastal';
import { newId } from '../domain/ids';
import type { CoastalOperator, CoastalOption, Segment } from '../domain/types';
import { useTrip } from '../state/store';
import { Badge, Empty, Field, fmtMoney, MoneyInput, NumberInput, StatusBadge, StatusSelect } from './common';

const MEALS: Record<CoastalOption['meals'], string> = {
  nessuno: 'Nessun pasto',
  mezza_pensione: 'Mezza pensione',
  pensione_completa: 'Pensione completa',
  a_la_carte: 'À la carte / caffetteria',
  da_definire: 'Da definire',
};

function blank(operator: CoastalOperator): CoastalOption {
  return {
    id: newId(),
    operator,
    direction: 'nord',
    fromPort: 'Bergen',
    toPort: 'Ålesund',
    nightsOnboard: 0,
    cabin: '',
    withCar: false,
    meals: 'da_definire',
    priceStatus: 'da_verificare',
    childRules: '',
    changePolicy: '',
    notes: '',
    selected: false,
  };
}

export function CoastalView() {
  const { trip, update, toast } = useTrip();
  const [draft, setDraft] = useState<CoastalOption | null>(null);
  const sorted = useMemo(
    () => trip.coastalOptions.slice().sort((a, b) => (coastalTotalEur(a, trip.settings) ?? Infinity) - (coastalTotalEur(b, trip.settings) ?? Infinity)),
    [trip.coastalOptions, trip.settings],
  );

  const save = (o: CoastalOption) => {
    update((t) => ({
      ...t,
      coastalOptions: t.coastalOptions.some((x) => x.id === o.id) ? t.coastalOptions.map((x) => (x.id === o.id ? o : x)) : [...t.coastalOptions, o],
    }));
    setDraft(null);
    toast('Opzione salvata');
  };

  const attachToLeg = (o: CoastalOption, legId: string) => {
    const seg: Segment = {
      id: newId(),
      mode: 'costiera',
      label: `${o.operator} ${o.fromPort} → ${o.toPort}`,
      durationMin: o.durationHours !== undefined ? Math.round(o.durationHours * 60) : undefined,
      departureTime: o.departureTime,
      status: o.priceStatus === 'prenotato' || o.priceStatus === 'pagato' ? 'confermato' : 'da_verificare',
      costStatus: o.priceStatus,
      coastalOptionId: o.id,
      source: o.source,
      note: 'Il costo è conteggiato nel budget dalla sezione Navigazione costiera.',
    };
    update((t) => ({
      ...t,
      coastalOptions: t.coastalOptions.map((x) => (x.id === o.id ? { ...x, selected: true } : x)),
      legs: t.legs.map((l) => (l.id === legId ? { ...l, segments: [...l.segments.filter((s) => s.mode !== 'non_calcolato'), seg] } : l)),
    }));
    toast('Navigazione aggiunta al tratto');
  };

  return (
    <div className="coastal">
      <div className="grid-2">
        {(['Hurtigruten', 'Havila'] as const).map((op) => (
          <section key={op} className="panel">
            <h2>{op}</h2>
            <p className="muted small">Fatti verificati sulle pagine ufficiali il 27/10/2026. Non sono tariffe né orari 2027.</p>
            <ul className="facts-list">
              {COASTAL_FACTS[op].map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <ul className="links">
              {COASTAL_SOURCES[op].map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <button className="btn btn-primary" onClick={() => setDraft(blank(op))}>
              + Nuova opzione {op}
            </button>
          </section>
        ))}
      </div>

      <div className="note-info">
        Tariffe e orari di agosto 2027 potrebbero non essere ancora pubblicati. Inserisci qui i preventivi reali man mano che li ottieni, indicando
        fonte e stato: l'app non inventa prezzi e non effettua prenotazioni.
      </div>

      {draft && <CoastalForm value={draft} onCancel={() => setDraft(null)} onSave={save} />}

      <section className="panel">
        <h2>Confronto</h2>
        {sorted.length === 0 ? (
          <Empty title="Nessuna opzione ancora">Crea un'opzione per ogni combinazione operatore/porti/data che vuoi valutare.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Operatore</th>
                  <th>Tratta</th>
                  <th>Scali</th>
                  <th>Data / durata</th>
                  <th>Cabina · pasti</th>
                  <th>Prezzo famiglia</th>
                  <th>Note per la famiglia</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sorted.map((o) => {
                  const r = coastalRoute(o.direction, o.fromPort, o.toPort);
                  const tot = coastalTotalEur(o, trip.settings);
                  return (
                    <tr key={o.id} className={o.selected ? 'row-selected' : ''}>
                      <td>
                        <strong>{o.operator}</strong>
                        {o.selected && <Badge tone="ok">nel viaggio</Badge>}
                      </td>
                      <td>
                        {o.fromPort} → {o.toPort}
                        <div className="muted small">verso {o.direction}</div>
                      </td>
                      <td>{r.valid ? r.intermediateStops : <span className="error small">{r.error}</span>}</td>
                      <td>
                        {o.date ?? '—'} {o.departureTime && `ore ${o.departureTime}`}
                        <div className="muted small">
                          {o.durationHours !== undefined ? `${o.durationHours} h` : 'durata da verificare'} · {o.nightsOnboard} notti a bordo
                        </div>
                      </td>
                      <td>
                        {o.cabin || '—'} · {MEALS[o.meals]}
                        {o.withCar && <div className="muted small">con auto</div>}
                      </td>
                      <td>
                        {fmtMoney(o.price)}
                        {o.extras && <div className="muted small">+ extra {fmtMoney(o.extras)}</div>}
                        {tot !== undefined && o.price?.currency === 'NOK' && <div className="muted small">≈ {formatEur(tot)}</div>}
                        <div>
                          <StatusBadge status={o.priceStatus} />
                        </div>
                      </td>
                      <td>
                        <ul className="mini">
                          {familyValueNotes(o).map((n) => (
                            <li key={n}>{n}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="actions">
                        <button className="btn btn-small" onClick={() => setDraft(o)}>
                          Modifica
                        </button>
                        <button
                          className="btn btn-small"
                          onClick={() => update((t) => ({ ...t, coastalOptions: t.coastalOptions.map((x) => (x.id === o.id ? { ...x, selected: !x.selected } : x)) }))}
                        >
                          {o.selected ? 'Escludi dal budget' : 'Includi nel budget'}
                        </button>
                        {trip.legs.length > 0 && (
                          <select
                            aria-label="Collega a un tratto dell'itinerario"
                            value=""
                            onChange={(e) => e.target.value && attachToLeg(o, e.target.value)}
                          >
                            <option value="">Collega a un tratto…</option>
                            {trip.legs.map((l) => {
                              const a = trip.stops.find((s) => s.id === l.fromStopId);
                              const b = trip.stops.find((s) => s.id === l.toStopId);
                              return (
                                <option key={l.id} value={l.id}>
                                  {a?.name} → {b?.name}
                                </option>
                              );
                            })}
                          </select>
                        )}
                        <button
                          className="btn btn-small danger"
                          onClick={() => {
                            if (window.confirm('Eliminare questa opzione? Verrà scollegata anche dai tratti.')) {
                              update((t) => ({
                                ...t,
                                coastalOptions: t.coastalOptions.filter((x) => x.id !== o.id),
                                legs: t.legs.map((l) => ({ ...l, segments: l.segments.filter((s) => s.coastalOptionId !== o.id) })),
                              }));
                            }
                          }}
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small">Ordinamento per prezzo totale in euro (cambio {trip.settings.nokPerEur} NOK/EUR). Stati possibili: {Object.values(STATUS_LABEL).join(', ')}.</p>
      </section>
    </div>
  );
}

function CoastalForm({ value, onSave, onCancel }: { value: CoastalOption; onSave: (o: CoastalOption) => void; onCancel: () => void }) {
  const [o, setO] = useState(value);
  const set = (p: Partial<CoastalOption>) => setO((x) => ({ ...x, ...p }));
  const ports = portsFor(o.direction);
  const r = coastalRoute(o.direction, o.fromPort, o.toPort);
  return (
    <section className="panel form-panel" aria-label="Modifica opzione costiera">
      <h2>
        {o.operator}: {o.fromPort} → {o.toPort}
      </h2>
      <div className="grid-4">
        <Field label="Direzione">
          {(id) => (
            <select id={id} value={o.direction} onChange={(e) => set({ direction: e.target.value as 'nord' | 'sud' })}>
              <option value="nord">Verso nord (Bergen → Kirkenes)</option>
              <option value="sud">Verso sud (Kirkenes → Bergen)</option>
            </select>
          )}
        </Field>
        <Field label="Porto di imbarco">
          {(id) => (
            <select id={id} value={o.fromPort} onChange={(e) => set({ fromPort: e.target.value })}>
              {ports.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                  {p.seasonal ? ' (stagionale)' : ''}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Porto di sbarco">
          {(id) => (
            <select id={id} value={o.toPort} onChange={(e) => set({ toPort: e.target.value })}>
              {ports.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                  {p.seasonal ? ' (stagionale)' : ''}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Data">{(id) => <input id={id} type="date" value={o.date ?? ''} onChange={(e) => set({ date: e.target.value || undefined })} />}</Field>
        <Field label="Partenza">{(id) => <input id={id} type="time" value={o.departureTime ?? ''} onChange={(e) => set({ departureTime: e.target.value || undefined })} />}</Field>
        <Field label="Arrivo">{(id) => <input id={id} type="time" value={o.arrivalTime ?? ''} onChange={(e) => set({ arrivalTime: e.target.value || undefined })} />}</Field>
        <Field label="Durata (ore)">{(id) => <NumberInput id={id} value={o.durationHours} min={0} onChange={(v) => set({ durationHours: v })} />}</Field>
        <Field label="Notti a bordo">{(id) => <NumberInput id={id} value={o.nightsOnboard} min={0} onChange={(v) => set({ nightsOnboard: v ?? 0 })} />}</Field>
        <Field label="Cabina">{(id) => <input id={id} value={o.cabin} placeholder="es. cabina interna 4 posti, poltrona" onChange={(e) => set({ cabin: e.target.value })} />}</Field>
        <Field label="Pasti">
          {(id) => (
            <select id={id} value={o.meals} onChange={(e) => set({ meals: e.target.value as CoastalOption['meals'] })}>
              {Object.entries(MEALS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Prezzo totale famiglia">{(id) => <MoneyInput id={id} value={o.price} onChange={(m) => set({ price: m })} />}</Field>
        <Field label="Extra (auto, pasti…)">{(id) => <MoneyInput id={id} value={o.extras} onChange={(m) => set({ extras: m })} />}</Field>
        <Field label="Stato prezzo">{(id) => <StatusSelect id={id} value={o.priceStatus} onChange={(v) => set({ priceStatus: v })} />}</Field>
        <Field label="Con auto">
          {(id) => (
            <select id={id} value={o.withCar ? 'si' : 'no'} onChange={(e) => set({ withCar: e.target.value === 'si' })}>
              <option value="no">No</option>
              <option value="si">Sì</option>
            </select>
          )}
        </Field>
        <Field label="Link preventivo / fonte">
          {(id) => (
            <input
              id={id}
              type="url"
              value={o.source?.url ?? ''}
              placeholder="https://…"
              onChange={(e) => set({ source: e.target.value ? { label: `Preventivo ${o.operator}`, url: e.target.value, checkedAt: new Date().toISOString() } : undefined })}
            />
          )}
        </Field>
      </div>
      <div className="grid-3">
        <Field label="Regole per i bambini">{(id) => <textarea id={id} rows={2} value={o.childRules} onChange={(e) => set({ childRules: e.target.value })} />}</Field>
        <Field label="Modifica e cancellazione">{(id) => <textarea id={id} rows={2} value={o.changePolicy} onChange={(e) => set({ changePolicy: e.target.value })} />}</Field>
        <Field label="Note (collegamenti, costi aggiuntivi)">{(id) => <textarea id={id} rows={2} value={o.notes} onChange={(e) => set({ notes: e.target.value })} />}</Field>
      </div>
      {!r.valid && <p className="error">{r.error}</p>}
      {r.valid && (
        <p className="muted small">
          {r.intermediateStops} scali intermedi: {r.ports.slice(1, -1).map((p) => p.name).join(', ') || 'nessuno'}.
          {r.ports.some((p) => p.seasonal) && ' Include uno scalo stagionale: verificare sul piano di navigazione.'}
        </p>
      )}
      <div className="row">
        <button className="btn btn-primary" disabled={!r.valid} onClick={() => onSave(o)}>
          Salva opzione
        </button>
        <button className="btn" onClick={onCancel}>
          Annulla
        </button>
      </div>
    </section>
  );
}
