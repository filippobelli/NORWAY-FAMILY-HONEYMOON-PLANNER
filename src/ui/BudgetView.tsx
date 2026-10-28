import { useMemo, useState } from 'react';
import { BUDGET_CATEGORIES, budgetCompleteness, budgetOverlaps, capStatus, categoryBreakdown, computeBudget, type CategoryBreakdown, formatEur, formatPeriod, fuelCostPerKm, STATUS_LABEL } from '../domain/budget';
import { newId } from '../domain/ids';
import type { BudgetCategory, BudgetEstimates, BudgetItem, CarSettings, DataStatus, FuelType, Money, TripSettings } from '../domain/types';
import { formatRateDate, refreshRatesNow } from '../state/autoRates';
import { useTrip } from '../state/store';
import { Badge, Field, MoneyInput, NumberInput, StatusBadge, StatusSelect } from './common';

const ORIGIN_LABEL = { manuale: 'Voce manuale', hytte: 'Da Alloggi', costiera: 'Da Crociere', voli: 'Da Voli', trasporti: 'Da Itinerario', giornate: 'Da Giornate', stime: 'Stima da parametri' } as const;
const FUEL_LABEL: Record<FuelType, string> = { benzina: 'Benzina', diesel: 'Diesel', elettrica: 'Elettrica' };
const DEFAULT_CAR: CarSettings = { fuel: 'benzina', consumption: 7, priceAuto: true };

/** Subtotali per stato di una categoria: compaiono solo i gruppi con almeno una voce (anche da 0 €). */
function statusParts(c: CategoryBreakdown): string[] {
  const parts: string[] = [];
  if (c.counts.firm) parts.push(`certo ${formatEur(c.firm)}`);
  if (c.counts.estimated) parts.push(`stimato ${formatEur(c.estimated)}`);
  if (c.counts.toVerify) parts.push(`da verificare ${formatEur(c.toVerify)}`);
  return parts;
}

export function BudgetView() {
  const { trip, update, toast } = useTrip();
  const b = useMemo(() => computeBudget(trip), [trip]);
  const st = trip.settings;
  const car = st.car ?? DEFAULT_CAR;
  const est = st.estimates ?? {};
  const fuel = fuelCostPerKm(st);
  const cap = capStatus(st.budgetCap, b.total);
  const [refreshing, setRefreshing] = useState(false);
  const setS = (p: Partial<TripSettings>) => update((t) => ({ ...t, settings: { ...t.settings, ...p } }));
  const setCar = (p: Partial<CarSettings>) => update((t) => ({ ...t, settings: { ...t.settings, car: { ...(t.settings.car ?? DEFAULT_CAR), ...p } } }));
  const setEst = (p: Partial<BudgetEstimates>) => update((t) => ({ ...t, settings: { ...t.settings, estimates: { ...(t.settings.estimates ?? {}), ...p } } }));
  // Stima a mano per categoria: una voce manuale «stimato» con id fisso, modificabile anche nell'elenco delle voci
  const catEstimateId = (c: BudgetCategory) => `stima-${c}`;
  const setCatEstimate = (c: BudgetCategory, v: number | undefined) =>
    update((t) => {
      const id = catEstimateId(c);
      const rest = t.budgetItems.filter((x) => x.id !== id);
      if (!v || v <= 0) return { ...t, budgetItems: rest };
      const prev = t.budgetItems.find((x) => x.id === id);
      const label = `Stima ${BUDGET_CATEGORIES.find((x) => x.id === c)?.label ?? c}`;
      const item: BudgetItem = prev
        ? { ...prev, amount: { amount: v, currency: 'EUR' } }
        : { id, category: c, label, amount: { amount: v, currency: 'EUR' }, status: 'stimato', notes: '' };
      return { ...t, budgetItems: prev ? t.budgetItems.map((x) => (x.id === id ? item : x)) : [...t.budgetItems, item] };
    });
  const setCatCap = (c: BudgetCategory, v: number | undefined) =>
    update((t) => ({ ...t, settings: { ...t.settings, budgetCapByCategory: { ...(t.settings.budgetCapByCategory ?? {}), [c]: v && v > 0 ? v : undefined } } }));

  const refresh = async () => {
    setRefreshing(true);
    const r = await refreshRatesNow(car.fuel === 'elettrica' ? undefined : car.fuel);
    setRefreshing(false);
    update((t) => {
      let settings = { ...t.settings };
      if (r.rate) settings = { ...settings, nokPerEur: r.rate.nokPerEur, nokRateDate: r.rate.date, nokRateAuto: true, nokRateNote: `${r.rate.source}, cambio del ${formatRateDate(r.rate.date)}.` };
      if (r.fuel && settings.car && settings.car.fuel !== 'elettrica')
        settings = { ...settings, car: { ...settings.car, priceAuto: true, priceNok: r.fuel.nokPerLitre, pricePeriod: r.fuel.period, priceSource: r.fuel.source } };
      return { ...t, settings };
    });
    toast(r.rate || r.fuel ? 'Cambio e carburante aggiornati' : 'Fonti non raggiungibili: restano i valori salvati', r.rate || r.fuel ? 'ok' : 'errore');
  };
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
  const done = budgetCompleteness(b);
  const missingPrices = done.missingAmounts.length;
  const overlaps = budgetOverlaps(b);
  const breakdown = useMemo(() => categoryBreakdown(b), [b]);
  // Riferimento del cambio: solo data e fonte salvate; se mancano lo si dice, senza inventarle
  const rateNote = st.nokRateNote?.trim().replace(/\.+$/, '');
  const rateDate = st.nokRateDate ? formatRateDate(st.nokRateDate) : undefined;
  const rateRef = `${rateDate ? (rateNote?.includes(rateDate) ? '' : ` (cambio del ${rateDate})`) : ' (data del cambio non indicata)'}${rateNote ? ` · ${rateNote}` : ' · fonte non indicata'}`;

  return (
    <div className="budget">
      <section className="kpis">
        <div className={`kpi ${done.partial ? 'kpi-partial' : ''}`}>
          <span>{done.partial ? 'Totale parziale (voci con importo)' : 'Totale previsto'}</span>
          <strong>{formatEur(b.total)}</strong>
          <small>
            {done.partial
              ? [missingPrices > 0 && `${missingPrices} ${missingPrices === 1 ? 'importo mancante' : 'importi mancanti'}`, done.emptyCategories.length > 0 && `${done.emptyCategories.length} categorie vuote`]
                  .filter(Boolean)
                  .join(' · ') || 'nessuna voce inserita'
              : 'tutte le categorie hanno voci'}
          </small>
        </div>
        <div className="kpi">
          <span>Media giornaliera{done.partial && b.perDay !== undefined ? ' (parziale)' : ''}</span>
          <strong>{b.perDay !== undefined ? formatEur(b.perDay) : '—'}</strong>
          <small>{b.days ? `${b.days} giorni${done.partial ? ': crescerà con i costi mancanti' : ''}` : 'itinerario vuoto'}</small>
        </div>
        <div className="kpi">
          <span>Già certo</span>
          <strong>{formatEur(firm)}</strong>
          <small>confermato da fonte, prenotato o pagato</small>
        </div>
        <div className="kpi">
          <span>Stimato</span>
          <strong>{formatEur(b.byStatus.stimato)}</strong>
          <small>ipotesi e stime, non preventivi</small>
        </div>
        <div className="kpi kpi-warn">
          <span>Da verificare</span>
          <strong>{formatEur(b.byStatus.da_verificare)}</strong>
          <small>importi inseriti ma non confermati</small>
        </div>
        <div className={`kpi ${missingPrices > 0 ? 'kpi-warn' : ''}`}>
          <span>Costi senza importo</span>
          <strong>{missingPrices}</strong>
          <small>{missingPrices > 0 ? 'esclusi dal totale: un prezzo mancante non vale zero' : 'nessun prezzo noto mancante'}</small>
        </div>
        <div className={`kpi ${cap?.over ? 'kpi-bad' : ''}`}>
          <span>Tetto di spesa</span>
          <strong>{cap ? formatEur(cap.cap) : '—'}</strong>
          <small>{cap ? (cap.over ? `superato di ${formatEur(-cap.left)}` : `restano ${formatEur(cap.left)}`) : 'non impostato'}</small>
        </div>
      </section>
      <p className="muted small budget-rate">
        Importi in NOK convertiti a {st.nokPerEur.toLocaleString('it-IT', { maximumFractionDigits: 4 })} NOK per 1 €{rateRef}. Gli importi restano salvati nella
        valuta originale.
      </p>
      {overlaps.length > 0 && (
        <section className="note-warn" aria-labelledby="budget-overlaps">
          <strong id="budget-overlaps">Possibili doppi conteggi da verificare</strong>
          <ul className="facts-list">
            {overlaps.map((o) => (
              <li key={o.category}>{o.text}</li>
            ))}
          </ul>
          <span className="small">Nessun importo è stato modificato: se una voce è già inclusa in un'altra, togli quella in più.</span>
        </section>
      )}

      <div className="grid-2">
        <section className="panel">
          <h2>Per categoria</h2>
          <div className="table-wrap">
            <table className="table compact">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th className="num">Previsto</th>
                  <th className="num" title="Importo previsto per la categoria: entra nel totale come «Stimato»">
                    Stima
                  </th>
                  <th className="num" title="Limite massimo di spesa per la categoria: non entra nel totale">
                    Tetto max
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {BUDGET_CATEGORIES.map((c) => {
                  const cs = capStatus(st.budgetCapByCategory?.[c.id], b.byCategory[c.id]);
                  const ref = cs?.cap ?? b.total;
                  const br = breakdown.find((x) => x.category === c.id)!;
                  const parts = statusParts(br);
                  return (
                    <tr key={c.id} className={cs?.over ? 'row-over' : ''}>
                      <td>{c.label}</td>
                      <td className="num">
                        {parts.length > 0 ? (
                          <>
                            {formatEur(br.total)}
                            {parts.map((p) => (
                              <span key={p} className="cat-kind">
                                {p}
                              </span>
                            ))}
                          </>
                        ) : (
                          <span className="muted small">non quantificata</span>
                        )}
                        {br.withoutAmount > 0 && (
                          <span className="cat-missing">
                            + {br.withoutAmount} senza importo
                          </span>
                        )}
                      </td>
                      <td className="num cap-cell">
                        <NumberInput
                          value={trip.budgetItems.find((x) => x.id === catEstimateId(c.id))?.amount.amount}
                          min={0}
                          placeholder="€"
                          ariaLabel={`Stima per ${c.label} in euro`}
                          onChange={(v) => setCatEstimate(c.id, v)}
                        />
                      </td>
                      <td className="num cap-cell">
                        <NumberInput
                          value={st.budgetCapByCategory?.[c.id]}
                          min={0}
                          placeholder="—"
                          ariaLabel={`Tetto per ${c.label} in euro`}
                          onChange={(v) => setCatCap(c.id, v)}
                        />
                      </td>
                      <td className="bar-cell">
                        <span className={`bar ${cs?.over ? 'bar-over' : ''}`} style={{ width: `${ref ? Math.min(100, Math.round((b.byCategory[c.id] / ref) * 100)) : 0}%` }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted small">
            Sotto ogni importo, i subtotali per stato («certo» = confermato, prenotato o pagato): sommati danno il totale della categoria. «non quantificata»:
            nessuna voce né stima (non vuol dire gratis). «senza importo»: costi noti ma non ancora prezzati, esclusi dal totale e senza stato. «Stima»: scrivi
            quanto pensi di spendere per la categoria; entra nel totale come «Stimato» e compare tra le voci. «Tetto max»: il limite che non vuoi superare, non
            entra nel totale; con un tetto la barra mostra quanto è già impegnato di quel tetto, senza la quota sul totale.
          </p>
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
        </section>
      </div>

      <div className="grid-2">
        <section className="panel">
          <h2>Tetto e stime</h2>
          <p className="muted small">
            Le stime riempiono solo le categorie senza dati reali (per l'alloggio: le tappe senza una sistemazione con prezzo). Sono le tue ipotesi, non prezzi
            ufficiali: compaiono come «Stimato».
          </p>
          <div className="grid-2">
            <Field label="Tetto di spesa complessivo (EUR)">
              {(id) => <NumberInput id={id} value={st.budgetCap} min={0} onChange={(v) => setS({ budgetCap: v && v > 0 ? v : undefined })} />}
            </Field>
            <Field label="Alloggio a notte (EUR)" hint="Per tutta la famiglia">
              {(id) => <NumberInput id={id} value={est.lodgingPerNight} min={0} onChange={(v) => setEst({ lodgingPerNight: v })} />}
            </Field>
            <Field label="Pasti e spesa al giorno (EUR)" hint="Per tutta la famiglia">
              {(id) => <NumberInput id={id} value={est.foodPerDay} min={0} onChange={(v) => setEst({ foodPerDay: v })} />}
            </Field>
            <Field label="Attività al giorno (EUR)" hint="Solo nei giorni senza attività con prezzo">
              {(id) => <NumberInput id={id} value={est.activitiesPerDay} min={0} onChange={(v) => setEst({ activitiesPerDay: v })} />}
            </Field>
            <Field label="Noleggio auto al giorno (EUR)" hint="Se non c'è già una voce di noleggio">
              {(id) => <NumberInput id={id} value={est.carRentalPerDay} min={0} onChange={(v) => setEst({ carRentalPerDay: v })} />}
            </Field>
            <Field label="Fondo imprevisti (%)" hint="Sul resto del budget">
              {(id) => <NumberInput id={id} value={est.contingencyPct} min={0} onChange={(v) => setEst({ contingencyPct: v })} />}
            </Field>
          </div>
        </section>

        <section className="panel">
          <h2>Cambio e carburante</h2>
          <div className="grid-2">
            <Field label="Cambio NOK per 1 EUR" hint={st.nokRateNote}>
              {(id) => (
                <NumberInput
                  id={id}
                  value={st.nokPerEur}
                  min={1}
                  step={0.0001}
                  onChange={(v) => v && v > 0 && setS({ nokPerEur: v, nokRateAuto: false, nokRateNote: 'Impostato a mano: non si aggiorna in automatico.' })}
                />
              )}
            </Field>
            <div className="field">
              <span className="field-label">Aggiornamento del cambio</span>
              <div className="field-control">
                <label className="check">
                  <input type="checkbox" checked={st.nokRateAuto !== false} onChange={(e) => setS({ nokRateAuto: e.target.checked })} /> Automatico
                </label>
                <button className="btn btn-small" disabled={refreshing} onClick={refresh}>
                  {refreshing ? 'Aggiornamento…' : 'Aggiorna ora'}
                </button>
              </div>
              <small className="hint">All'apertura dell'app, al massimo ogni 6 ore</small>
            </div>
            <Field label="Alimentazione dell'auto">
              {(id) => (
                <select
                  id={id}
                  value={car.fuel}
                  onChange={(e) => {
                    const f = e.target.value as FuelType;
                    setCar(
                      f === 'elettrica'
                        ? { fuel: f, consumption: 20, priceAuto: false, priceNok: undefined, pricePeriod: undefined }
                        : { fuel: f, consumption: f === 'diesel' ? 6 : 7, priceAuto: true, priceNok: undefined, pricePeriod: undefined },
                    );
                    if (f !== 'elettrica') void refresh();
                  }}
                >
                  {(Object.keys(FUEL_LABEL) as FuelType[]).map((f) => (
                    <option key={f} value={f}>
                      {FUEL_LABEL[f]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={`Consumo (${car.fuel === 'elettrica' ? 'kWh' : 'litri'} ogni 100 km)`}>
              {(id) => <NumberInput id={id} value={car.consumption} min={0} step={0.1} onChange={(v) => v && v > 0 && setCar({ consumption: v })} />}
            </Field>
            <Field
              label={`Prezzo (NOK per ${car.fuel === 'elettrica' ? 'kWh' : 'litro'})`}
              hint={
                car.fuel === 'elettrica'
                  ? 'Inseriscilo tu: per la ricarica non c\'è una media nazionale ufficiale.'
                  : car.priceAuto
                    ? car.pricePeriod
                      ? `Media nazionale ${formatPeriod(car.pricePeriod)} (${car.priceSource ?? 'SSB'}), si aggiorna in automatico.`
                      : 'In attesa della media nazionale SSB…'
                    : 'Impostato a mano.'
              }
            >
              {(id) => (
                <NumberInput
                  id={id}
                  value={car.priceNok}
                  min={0}
                  step={0.01}
                  onChange={(v) => setCar({ priceNok: v, priceAuto: false, pricePeriod: undefined, priceSource: undefined })}
                />
              )}
            </Field>
            {car.fuel !== 'elettrica' && (
              <div className="field">
                <span className="field-label">Aggiornamento del prezzo</span>
                <label className="check field-control">
                  <input type="checkbox" checked={car.priceAuto} onChange={(e) => (e.target.checked ? void refresh() : setCar({ priceAuto: false }))} /> Media nazionale
                  automatica
                </label>
                <small className="hint">Statistics Norway, dato mensile</small>
              </div>
            )}
          </div>
          <p className="small">
            {fuel ? (
              <>
                Costo stimato: <strong>{fuel.eurPerKm.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 3 })} al km</strong> · {fuel.basis}
              </>
            ) : (
              <span className="muted">Costo al km non calcolabile: manca il prezzo.</span>
            )}
          </p>
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
