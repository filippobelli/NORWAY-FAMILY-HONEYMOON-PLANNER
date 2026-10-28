import { useMemo, useState } from 'react';
import { formatEur } from '../domain/budget';
import { toEur } from '../domain/coastal';
import { airportLabel, DEFAULT_HOME_AIRPORTS, flightAdvice, ITALIAN_AIRPORTS, norwayAirports, type AirportPick } from '../domain/flightAdvisor';
import { newId } from '../domain/ids';
import { formatDateIt, formatDuration } from '../domain/itinerary';
import { externalHref } from '../domain/lodging';
import type { Flight, FlightDirection } from '../domain/types';
import { flightSearchLinks, openJawLink, type FlightLink, type FlightQuery } from '../services/flights/links';
import { useTrip } from '../state/store';
import { Badge, Empty, Field, fmtMoney, MoneyInput, NumberInput, StatusBadge, StatusSelect } from './common';

const DIRECTION: Record<FlightDirection, string> = { andata: 'Andata', ritorno: 'Ritorno', interno: 'Volo interno' };

function blankFlight(p: Partial<Flight> = {}): Flight {
  return { id: newId(), direction: 'andata', fromAirport: '', toAirport: '', airline: '', flightNumber: '', baggage: '', priceStatus: 'da_verificare', selected: false, notes: '', ...p };
}

function Links({ links }: { links: FlightLink[] }) {
  return (
    <span className="flight-links">
      {links.map((l) => (
        <a key={l.provider} className="btn btn-small" href={l.url} target="_blank" rel="noreferrer" title={l.note}>
          {l.provider} ↗
        </a>
      ))}
    </span>
  );
}

export function FlightsView() {
  const { trip, update, toast } = useTrip();
  const flights = trip.flights ?? [];
  const advice = useMemo(() => flightAdvice(trip), [trip]);
  const [draft, setDraft] = useState<Flight | null>(null);
  const [homeText, setHomeText] = useState(advice.home.join(', '));
  const [pickArr, setPickArr] = useState(0);
  const [pickDep, setPickDep] = useState(0);
  const p = trip.participants;
  const persons = p.adults + p.childrenAges.length;

  const save = (f: Flight) => {
    update((t) => {
      const list = t.flights ?? [];
      return { ...t, flights: list.some((x) => x.id === f.id) ? list.map((x) => (x.id === f.id ? f : x)) : [...list, f] };
    });
    setDraft(null);
    toast('Volo salvato');
  };
  const saveHome = () => {
    const codes = homeText
      .split(/[\s,;]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^[A-Z]{3}$/.test(c));
    update((t) => ({ ...t, settings: { ...t.settings, homeAirports: codes.length ? codes : undefined } }));
    setHomeText((codes.length ? codes : DEFAULT_HOME_AIRPORTS).join(', '));
  };

  const arr = advice.arrival?.options[Math.min(pickArr, (advice.arrival?.options.length ?? 1) - 1)];
  const dep = advice.departure?.options[Math.min(pickDep, (advice.departure?.options.length ?? 1) - 1)];
  const openJaw = Boolean(arr && dep && arr.code !== dep.code);

  return (
    <div className="flights">
      <section className="panel" aria-labelledby="fl-advice">
        <header className="panel-head">
          <h2 id="fl-advice">Tratte consigliate dall'itinerario</h2>
          <span className="muted small">
            {persons} passeggeri: {p.adults} adulti{p.childrenAges.length ? `, bambini di ${p.childrenAges.join(' e ')} anni` : ''}
          </span>
        </header>
        <div className="row wrap fl-home">
          <label htmlFor="fl-home-input" className="small">
            Partenza dall'Italia (in ordine di preferenza)
          </label>
          <input
            id="fl-home-input"
            list="fl-it-airports"
            value={homeText}
            onChange={(e) => setHomeText(e.target.value)}
            onBlur={saveHome}
            onKeyDown={(e) => e.key === 'Enter' && saveHome()}
            placeholder="BRI, FCO"
          />
          <span className="muted small">{advice.home.map((c, i) => `${i === 0 ? '★ ' : ''}${airportLabel(c)} (${c})`).join(' · ')}</span>
          <datalist id="fl-it-airports">
            {ITALIAN_AIRPORTS.map((a) => (
              <option key={a.code} value={a.code}>
                {a.name}
              </option>
            ))}
          </datalist>
        </div>
        <p className="muted small">
          L'app conosce le tappe, non i voli: consiglia gli aeroporti più vicini alla prima e all'ultima tappa (distanza in linea d'aria) e i voli interni dove un
          trasferimento supera il doppio del massimo di guida giornaliero. Prezzi, orari e voli diretti si verificano con i link: Kayak imposta anche i{' '}
          {persons} passeggeri.
        </p>

        {!advice.arrival || !advice.departure ? (
          <Empty title="Itinerario vuoto">Aggiungi le tappe: i suggerimenti partono dalla prima e dall'ultima tappa.</Empty>
        ) : (
          <>
            <div className="fl-ends">
              <EndCard
                title="Arrivo in Norvegia"
                stopName={advice.arrival.stop.name}
                date={advice.arrival.date}
                options={advice.arrival.options}
                picked={pickArr}
                onPick={setPickArr}
              />
              <EndCard
                title="Ripartenza"
                stopName={advice.departure.stop.name}
                date={advice.departure.date}
                options={advice.departure.options}
                picked={pickDep}
                onPick={setPickDep}
              />
            </div>
            {arr && dep && (
              <ul className="fl-routes">
                {advice.home.map((h, i) => {
                  const out: FlightQuery = { from: h, to: arr.code, depart: advice.arrival!.date };
                  const back: FlightQuery = { from: dep.code, to: h, depart: advice.departure!.date };
                  return (
                    <li key={h}>
                      <div>
                        <strong>
                          {i === 0 ? '★ ' : ''}
                          {airportLabel(h)} ({h})
                        </strong>
                        <span className="small">
                          {' '}
                          → {arr.name} il {formatDateIt(out.depart)} · ritorno da {dep.name} il {formatDateIt(back.depart)}
                        </span>
                      </div>
                      {openJaw ? (
                        <div className="fl-row">
                          <span className="small muted">Andata e ritorno da aeroporti diversi:</span>
                          <Links links={[openJawLink(out, back, p)]} />
                          <span className="small muted">oppure due ricerche separate:</span>
                          <span className="small">andata</span>
                          <Links links={flightSearchLinks(out, p)} />
                          <span className="small">ritorno</span>
                          <Links links={flightSearchLinks(back, p)} />
                        </div>
                      ) : (
                        <div className="fl-row">
                          <span className="small muted">Andata e ritorno:</span>
                          <Links links={flightSearchLinks({ ...out, ret: back.depart }, p)} />
                        </div>
                      )}
                      <div className="fl-row">
                        <button className="btn btn-small" onClick={() => setDraft(blankFlight({ direction: 'andata', fromAirport: h, toAirport: arr.code, date: out.depart }))}>
                          + Aggiungi l'andata
                        </button>
                        <button className="btn btn-small" onClick={() => setDraft(blankFlight({ direction: 'ritorno', fromAirport: dep.code, toAirport: h, date: back.depart }))}>
                          + Aggiungi il ritorno
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <h3 className="fl-sub">Voli interni</h3>
            {advice.internal.length === 0 ? (
              <p className="muted small">
                Nessun trasferimento supera {formatDuration(2 * trip.settings.maxTravelMinPerDay)} tra due tappe con un aeroporto vicino
                {advice.legsToCalculate > 0 ? `, ma ${advice.legsToCalculate} ${advice.legsToCalculate === 1 ? 'tratto non è calcolato' : 'tratti non sono calcolati'}: calcolali nell'Itinerario per una valutazione completa` : ''}.
              </p>
            ) : (
              <ul className="fl-routes">
                {advice.internal.map((x) => {
                  const q: FlightQuery = { from: x.fromAirport.code, to: x.toAirport.code, depart: x.date };
                  return (
                    <li key={x.legId}>
                      <div>
                        <strong>
                          {x.from.name} → {x.to.name}
                        </strong>
                        <span className="small">
                          {' '}
                          · in auto ~{formatDuration(x.realisticMin)} (calcolato, soglia {formatDuration(x.thresholdMin)}) · volo {x.fromAirport.code} → {x.toAirport.code} il{' '}
                          {formatDateIt(x.date)}
                        </span>
                        <span className="small muted block">
                          Aeroporti a ~{x.fromAirport.airKm} e ~{x.toAirport.airKm} km in linea d'aria dalle tappe; con il volo l'auto a noleggio va gestita a parte.
                        </span>
                      </div>
                      <div className="fl-row">
                        <Links links={flightSearchLinks(q, p)} />
                        <button className="btn btn-small" onClick={() => setDraft(blankFlight({ direction: 'interno', fromAirport: q.from, toAirport: q.to, date: q.depart }))}>
                          + Aggiungi
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {advice.plannedInternal.length > 0 && (
              <p className="small muted">
                Già previsti in aereo nell'itinerario: {advice.plannedInternal.map((x) => `${x.from.name} → ${x.to.name}`).join(', ')}.
              </p>
            )}
          </>
        )}
      </section>

      <FreeSearch />

      <section className="panel" aria-labelledby="fl-list">
        <header className="panel-head">
          <h2 id="fl-list">Voli del viaggio ({flights.length})</h2>
          <button className="btn btn-primary" onClick={() => setDraft(blankFlight({ date: trip.startDate }))}>
            + Inserisci a mano
          </button>
        </header>
        {draft && <FlightForm value={draft} onSave={save} onCancel={() => setDraft(null)} />}
        {flights.length === 0 ? (
          <Empty title="Nessun volo">Usa i link di ricerca, poi inserisci qui il volo trovato con prezzo e fonte.</Empty>
        ) : (
          <ul className="fl-list">
            {flights
              .slice()
              .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || (a.departureTime ?? '').localeCompare(b.departureTime ?? ''))
              .map((f) => {
                const href = externalHref(f.source?.url);
                return (
                  <li key={f.id} className={f.selected ? 'is-chosen' : ''}>
                    <div>
                      <strong>
                        {DIRECTION[f.direction]}: {f.fromAirport} → {f.toAirport}
                      </strong>{' '}
                      {f.selected ? <Badge tone="ok">nel budget</Badge> : <Badge>alternativa</Badge>}
                      <div className="small">
                        {f.date ? formatDateIt(f.date) : 'data da definire'}
                        {f.departureTime && ` · ${f.departureTime}${f.arrivalTime ? `–${f.arrivalTime}` : ''}`}
                        {f.airline && ` · ${f.airline}`}
                        {f.flightNumber && ` ${f.flightNumber}`}
                        {f.stops !== undefined && ` · ${f.stops === 0 ? 'diretto' : `${f.stops} ${f.stops === 1 ? 'scalo' : 'scali'}`}`}
                      </div>
                      <div className="small muted">
                        Bagagli: {f.baggage || 'non indicati'}
                        {f.source?.label ? ` · fonte: ${f.source.label}` : ''}
                        {f.source?.checkedAt ? ` (${new Date(f.source.checkedAt).toLocaleDateString('it-IT')})` : ''}
                        {f.notes ? ` · ${f.notes}` : ''}
                      </div>
                    </div>
                    <div className="fl-price">
                      {f.price ? (
                        <>
                          <strong>{fmtMoney(f.price)}</strong>
                          {f.price.currency === 'NOK' && <span className="small muted"> ≈ {formatEur(toEur(f.price, trip.settings))}</span>}
                          <span className="small muted"> famiglia</span>
                        </>
                      ) : (
                        <span className="warn-text small">Prezzo mancante</span>
                      )}{' '}
                      <StatusBadge status={f.priceStatus} />
                    </div>
                    <div className="fl-row">
                      {href && (
                        <a className="btn btn-small" href={href} target="_blank" rel="noreferrer">
                          Fonte ↗
                        </a>
                      )}
                      <button
                        className="btn btn-small"
                        onClick={() => update((t) => ({ ...t, flights: (t.flights ?? []).map((x) => (x.id === f.id ? { ...x, selected: !x.selected } : x)) }))}
                      >
                        {f.selected ? 'Escludi dal budget' : 'Includi nel budget'}
                      </button>
                      <button className="btn btn-small" onClick={() => setDraft(f)}>
                        Modifica
                      </button>
                      <button
                        className="btn btn-small danger"
                        onClick={() => {
                          if (window.confirm(`Eliminare il volo ${f.fromAirport} → ${f.toAirport}?`)) update((t) => ({ ...t, flights: (t.flights ?? []).filter((x) => x.id !== f.id) }));
                        }}
                      >
                        Elimina
                      </button>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
        <p className="muted small">
          Il prezzo è il totale per tutta la famiglia. Solo i voli «nel budget» entrano nella categoria «Voli»; senza prezzo restano un costo da quantificare. L'app non
          prenota.
        </p>
      </section>
    </div>
  );
}

function EndCard({
  title,
  stopName,
  date,
  options,
  picked,
  onPick,
}: {
  title: string;
  stopName: string;
  date: string;
  options: AirportPick[];
  picked: number;
  onPick: (i: number) => void;
}) {
  return (
    <fieldset className="fl-end">
      <legend>
        {title} · {formatDateIt(date)}
      </legend>
      <p className="small muted">Tappa: {stopName}</p>
      {options.map((o, i) => (
        <label key={o.code} className="check fl-opt">
          <input type="radio" checked={picked === i} onChange={() => onPick(i)} />
          <span>
            <strong>
              {o.name} ({o.code})
            </strong>
            <span className="small muted">
              {' '}
              {o.isStop ? '· è la tappa' : `· ~${o.airKm} km in linea d'aria`}
              {o.far ? ' · lontano: valuta il trasferimento' : ''}
              {i === 0 && options.length > 1 ? ' · il più vicino' : ''}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function FreeSearch() {
  const { trip } = useTrip();
  const [q, setQ] = useState<{ from: string; to: string; depart: string; ret: string; roundTrip: boolean }>({
    from: (trip.settings.homeAirports?.[0] ?? DEFAULT_HOME_AIRPORTS[0])!,
    to: 'BGO',
    depart: trip.startDate,
    ret: '',
    roundTrip: true,
  });
  const valid = /^[A-Za-z]{3}$/.test(q.from.trim()) && /^[A-Za-z]{3}$/.test(q.to.trim()) && Boolean(q.depart) && (!q.roundTrip || Boolean(q.ret));
  return (
    <section className="panel" aria-labelledby="fl-free">
      <h2 id="fl-free">Ricerca libera</h2>
      <div className="grid-4">
        <Field label="Da (codice IATA)">{(id) => <input id={id} list="fl-all-airports" value={q.from} onChange={(e) => setQ({ ...q, from: e.target.value })} />}</Field>
        <Field label="A (codice IATA)">{(id) => <input id={id} list="fl-all-airports" value={q.to} onChange={(e) => setQ({ ...q, to: e.target.value })} />}</Field>
        <Field label="Andata">{(id) => <input id={id} type="date" value={q.depart} onChange={(e) => setQ({ ...q, depart: e.target.value })} />}</Field>
        <Field label="Ritorno">
          {(id) => (
            <div className="field-control">
              <input id={id} type="date" value={q.ret} disabled={!q.roundTrip} onChange={(e) => setQ({ ...q, ret: e.target.value })} />
              <label className="check">
                <input type="checkbox" checked={!q.roundTrip} onChange={(e) => setQ({ ...q, roundTrip: !e.target.checked })} /> Solo andata
              </label>
            </div>
          )}
        </Field>
      </div>
      <datalist id="fl-all-airports">
        {[...ITALIAN_AIRPORTS, ...norwayAirports()].map((a) => (
          <option key={a.code} value={a.code}>
            {a.name}
          </option>
        ))}
      </datalist>
      {valid ? (
        <Links links={flightSearchLinks({ from: q.from, to: q.to, depart: q.depart, ret: q.roundTrip ? q.ret : undefined }, trip.participants)} />
      ) : (
        <p className="muted small">Inserisci due codici IATA (es. BRI, BGO) e le date.</p>
      )}
    </section>
  );
}

function FlightForm({ value, onSave, onCancel }: { value: Flight; onSave: (f: Flight) => void; onCancel: () => void }) {
  const [f, setF] = useState(value);
  const set = (p: Partial<Flight>) => setF((x) => ({ ...x, ...p }));
  const ok = f.fromAirport.trim() && f.toAirport.trim();
  return (
    <div className="form-panel" aria-label="Modifica volo">
      <div className="grid-4">
        <Field label="Tipo">
          {(id) => (
            <select id={id} value={f.direction} onChange={(e) => set({ direction: e.target.value as FlightDirection })}>
              {Object.entries(DIRECTION).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Da">{(id) => <input id={id} list="fl-all-airports" value={f.fromAirport} onChange={(e) => set({ fromAirport: e.target.value.toUpperCase() })} />}</Field>
        <Field label="A">{(id) => <input id={id} list="fl-all-airports" value={f.toAirport} onChange={(e) => set({ toAirport: e.target.value.toUpperCase() })} />}</Field>
        <Field label="Data">{(id) => <input id={id} type="date" value={f.date ?? ''} onChange={(e) => set({ date: e.target.value || undefined })} />}</Field>
        <Field label="Partenza">{(id) => <input id={id} type="time" value={f.departureTime ?? ''} onChange={(e) => set({ departureTime: e.target.value || undefined })} />}</Field>
        <Field label="Arrivo">{(id) => <input id={id} type="time" value={f.arrivalTime ?? ''} onChange={(e) => set({ arrivalTime: e.target.value || undefined })} />}</Field>
        <Field label="Compagnia">{(id) => <input id={id} value={f.airline} onChange={(e) => set({ airline: e.target.value })} />}</Field>
        <Field label="Numero volo">{(id) => <input id={id} value={f.flightNumber} onChange={(e) => set({ flightNumber: e.target.value.toUpperCase() })} />}</Field>
        <Field label="Scali" hint="0 = diretto">
          {(id) => <NumberInput id={id} value={f.stops} min={0} step={1} onChange={(v) => set({ stops: v === undefined ? undefined : Math.max(0, Math.round(v)) })} />}
        </Field>
        <Field label="Bagagli inclusi">{(id) => <input id={id} value={f.baggage} placeholder="es. 1 bagaglio da stiva a testa" onChange={(e) => set({ baggage: e.target.value })} />}</Field>
        <Field label="Prezzo totale famiglia">{(id) => <MoneyInput id={id} value={f.price} onChange={(m) => set({ price: m })} />}</Field>
        <Field label="Stato prezzo">{(id) => <StatusSelect id={id} value={f.priceStatus} onChange={(v) => set({ priceStatus: v })} />}</Field>
        <Field label="Link della fonte">
          {(id) => (
            <input
              id={id}
              type="url"
              placeholder="https://…"
              value={f.source?.url ?? ''}
              onChange={(e) => set({ source: e.target.value ? { label: 'Ricerca o preventivo', url: e.target.value, checkedAt: new Date().toISOString() } : undefined })}
            />
          )}
        </Field>
        <Field label="Nel budget">
          {(id) => (
            <div className="field-control">
              <label className="check">
                <input id={id} type="checkbox" checked={f.selected} onChange={(e) => set({ selected: e.target.checked })} /> includi
              </label>
            </div>
          )}
        </Field>
      </div>
      <Field label="Note">{(id) => <textarea id={id} rows={2} value={f.notes} onChange={(e) => set({ notes: e.target.value })} />}</Field>
      <div className="row">
        <button className="btn btn-primary" disabled={!ok} onClick={() => onSave({ ...f, fromAirport: f.fromAirport.trim(), toAirport: f.toAirport.trim() })}>
          Salva volo
        </button>
        <button className="btn" onClick={onCancel}>
          Annulla
        </button>
      </div>
    </div>
  );
}
