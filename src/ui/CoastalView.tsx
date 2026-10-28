import { useMemo, useState } from 'react';
import { catalogFor, findCatalogVoyage, type CoastalCatalogVoyage } from '../data/coastalCatalog';
import { COASTAL_FACTS, COASTAL_SOURCES, portsFor } from '../data/coastalPorts';
import { formatEur, STATUS_LABEL } from '../domain/budget';
import { coastalRoute, coastalTotalEur, familyValueNotes, optionFromCatalog } from '../domain/coastal';
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
  // Catalogo aperto con «+ Nuova opzione»: si sceglie una proposta oppure si inserisce a mano
  const [picker, setPicker] = useState<CoastalOperator | null>(null);
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
      note: [
        findCatalogVoyage(o.catalogId) && `Proposta «${findCatalogVoyage(o.catalogId)!.title}» (${o.nightsOnboard} notti a bordo).`,
        'Il costo è conteggiato nel budget dalla sezione Navigazione costiera.',
      ]
        .filter(Boolean)
        .join(' '),
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
            <button
              className="btn btn-primary"
              aria-expanded={picker === op}
              onClick={() => {
                setDraft(null);
                setPicker(picker === op ? null : op);
              }}
            >
              + Nuova opzione {op}
            </button>
          </section>
        ))}
      </div>

      <div className="note-info">
        Tariffe e orari di agosto 2027 potrebbero non essere ancora pubblicati. Inserisci qui i preventivi reali man mano che li ottieni, indicando
        fonte e stato: l'app non inventa prezzi e non effettua prenotazioni.
      </div>

      {picker && (
        <CatalogPicker
          operator={picker}
          onPick={(v) => {
            setDraft(optionFromCatalog(v, trip.participants));
            setPicker(null);
          }}
          onManual={() => {
            setDraft(blank(picker));
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}

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
                        {findCatalogVoyage(o.catalogId) && <CatalogDetails v={findCatalogVoyage(o.catalogId)!} compact />}
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

const MEALS_SHORT: Record<CoastalOption['meals'], string> = {
  nessuno: 'Pasti non inclusi',
  mezza_pensione: 'Mezza pensione',
  pensione_completa: 'Pensione completa',
  a_la_carte: 'À la carte',
  da_definire: 'Pasti da definire',
};

/** Programma e note estive di una proposta del catalogo. */
function CatalogDetails({ v, compact }: { v: CoastalCatalogVoyage; compact?: boolean }) {
  return (
    <details className="cat-details">
      <summary>{compact ? `Proposta: ${v.title}` : 'Dettagli e programma'}</summary>
      {compact && <p className="small">{v.summary}</p>}
      <ul className="mini">
        {v.highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      {v.itinerary && (
        <ol className="cat-days small">
          {v.itinerary.map((d) => (
            <li key={d.day}>
              <strong>
                Giorno {d.day} — {d.title}:
              </strong>{' '}
              {d.ports.join(', ')}
            </li>
          ))}
        </ol>
      )}
      {v.summerNotes.length > 0 && (
        <ul className="mini small">
          {v.summerNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      <p className="small">
        <a href={v.url} target="_blank" rel="noreferrer">
          Pagina ufficiale ↗
        </a>{' '}
        <span className="muted">· verificata il {new Date(v.checkedAt).toLocaleDateString('it-IT')}</span>
      </p>
    </details>
  );
}

/** Catalogo delle proposte 1–5 giorni dell'operatore: si sceglie una proposta da precompilare o si inserisce a mano. */
function CatalogPicker({
  operator,
  onPick,
  onManual,
  onClose,
}: {
  operator: CoastalOperator;
  onPick: (v: CoastalCatalogVoyage) => void;
  onManual: () => void;
  onClose: () => void;
}) {
  const { trip } = useTrip();
  const [maxDays, setMaxDays] = useState(5);
  const persons = trip.participants.adults + trip.participants.childrenAges.length;
  const list = catalogFor(operator).filter((v) => v.days <= maxDays);
  const summer = catalogFor(operator).some((v) => v.summerPrice);
  return (
    <section className="panel" aria-labelledby="cat-title">
      <header className="panel-head">
        <div>
          <h2 id="cat-title">Catalogo {operator}: viaggi da 1 a 5 giorni</h2>
          <p className="muted small">
            Proposte lette sul sito ufficiale il {new Date(catalogFor(operator)[0]?.checkedAt ?? '').toLocaleDateString('it-IT')}. Scegline una: l'opzione si apre
            precompilata da rivedere prima di salvarla. Nulla viene prenotato.
          </p>
        </div>
        <span className="row wrap">
          <label className="check">
            Durata fino a
            <select value={maxDays} onChange={(e) => setMaxDays(Number(e.target.value))} aria-label="Durata massima">
              {[2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {d} giorni
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-small" onClick={onManual}>
            Inserisci a mano
          </button>
          <button className="btn btn-small" onClick={onClose}>
            Chiudi
          </button>
        </span>
      </header>
      <p className={summer ? 'note-info small' : 'note-warn small'}>
        {summer
          ? `Prezzi per partenze di agosto 2027, minimi a persona su 2 ospiti per cabina. Nell'opzione la stima famiglia è ${persons} × prezzo minimo: riduzioni per bambini e cabina per ${persons} vanno verificate.`
          : 'Le partenze di giugno e agosto 2027 non erano ancora in vendita al momento della lettura: i prezzi indicati valgono per il mese scritto accanto (fine 2026 o inizio 2027) e NON vengono usati come costo estivo.'}
      </p>
      {list.length === 0 ? (
        <Empty title="Nessuna proposta con questa durata" />
      ) : (
        <ul className="cat-list">
          {list.map((v) => {
            const cheapest = Math.min(...v.prices.map((p) => p.perPerson));
            return (
              <li key={v.id} className="cat-item">
                <div className="cat-main">
                  <h3>{v.title}</h3>
                  <p className="small">{v.route}</p>
                  <p className="small muted">
                    {v.days} giorni · {v.days - 1} {v.days - 1 === 1 ? 'notte' : 'notti'} a bordo · {v.stops} porti/località · {MEALS_SHORT[v.meals]}
                    {v.roundTrip ? ' · andata e ritorno' : ''}
                  </p>
                  <p className="small">{v.summary}</p>
                  <CatalogDetails v={v} />
                </div>
                <div className="cat-price">
                  {v.prices.map((p) => (
                    <span key={p.cabin} className="small">
                      {p.cabin === 'non specificata' ? 'da' : `${p.cabin} da`} <strong>{p.perPerson.toLocaleString('it-IT')} €</strong> a persona
                    </span>
                  ))}
                  <span className={`small ${v.summerPrice ? 'muted' : 'warn-text'}`}>{v.summerPrice ? `partenze di ${v.priceValidFor}` : `prezzo di ${v.priceValidFor}, non estivo`}</span>
                  {v.summerPrice && (
                    <span className="small">
                      stima famiglia ({persons}): <strong>{(cheapest * persons).toLocaleString('it-IT')} €</strong>
                    </span>
                  )}
                  <button className="btn btn-small btn-primary" onClick={() => onPick(v)}>
                    Scegli questa proposta
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
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
        <Field label="Note (collegamenti, costi aggiuntivi)">{(id) => <textarea id={id} rows={o.catalogId ? 8 : 2} value={o.notes} onChange={(e) => set({ notes: e.target.value })} />}</Field>
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
