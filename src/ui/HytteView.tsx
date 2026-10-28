import { useMemo, useRef, useState, type ReactNode } from 'react';
import { toEur } from '../domain/coastal';
import { newId } from '../domain/ids';
import { computeDays, formatDateIt } from '../domain/itinerary';
import type { Accommodation, AccommodationStatus } from '../domain/types';
import { externalSearchLinks, searchNearbyOsm, type NearbyPlace, type NearbySource } from '../services/accommodation/search';
import { useTrip } from '../state/store';
import { formatEur } from '../domain/budget';
import { externalHref, lodgingComparison, type LodgingDecision, type StopLodging } from '../domain/lodging';
import { Badge, Empty, Field, fmtDateTime, fmtMoney, MoneyInput, NumberInput, StatusBadge, StatusSelect } from './common';

const STATUS: Record<AccommodationStatus, { label: string; tone: 'neutral' | 'info' | 'ok' | 'warn' }> = {
  individuata: { label: 'Individuata (non verificata)', tone: 'neutral' },
  disponibile: { label: 'Disponibile per le date', tone: 'info' },
  opzionata: { label: 'Opzionata', tone: 'warn' },
  prenotata: { label: 'Prenotata', tone: 'ok' },
};

function blank(partial: Partial<Accommodation> = {}): Accommodation {
  return {
    id: newId(),
    name: '',
    type: 'hytte',
    locality: '',
    priceStatus: 'da_verificare',
    beds: '',
    bathroom: 'non_noto',
    kitchen: 'non_noto',
    parking: 'non_noto',
    cancellation: '',
    status: 'individuata',
    notes: '',
    ...partial,
  };
}

export function HytteView() {
  const { trip, update, replace, toast } = useTrip();
  const [draft, setDraft] = useState<Accommodation | null>(null);
  const [stopId, setStopId] = useState<string>(trip.stops.find((s) => s.kind === 'luogo' && s.nights > 0)?.id ?? '');
  const [radius, setRadius] = useState(15);
  const [results, setResults] = useState<NearbyPlace[] | null>(null);
  const [via, setVia] = useState<NearbySource>('Overpass');
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [searchError, setSearchError] = useState('');
  const ac = useRef<AbortController | null>(null);

  const days = useMemo(() => computeDays(trip), [trip]);
  const stop = trip.stops.find((s) => s.id === stopId);
  const checkIn = stop ? days.find((d) => d.sleepStop?.id === stop.id)?.date : undefined;
  const sleepStops = trip.stops.filter((s) => s.kind === 'luogo' && s.nights > 0);

  const runSearch = async () => {
    if (!stop) return;
    ac.current?.abort();
    const c = new AbortController();
    ac.current = c;
    setSearchState('loading');
    setResults(null);
    try {
      const r = await searchNearbyOsm(stop, radius, c.signal);
      setResults(r.places);
      setVia(r.via);
      setSearchState('idle');
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setSearchError((e as Error).message);
      setSearchState('error');
    }
  };

  const save = (a: Accommodation) => {
    update((t) => {
      const exists = t.accommodations.some((x) => x.id === a.id);
      const accommodations = exists ? t.accommodations.map((x) => (x.id === a.id ? a : x)) : [...t.accommodations, a];
      // Mantiene coerente il collegamento tappa ↔ alloggio
      // La tappa adotta la sistemazione solo se non ne ha già una scelta (le altre restano candidate).
      const stops = t.stops.map((s) => {
        if (s.id === a.stopId && !s.accommodationId) return { ...s, accommodationId: a.id };
        if (s.accommodationId === a.id && s.id !== a.stopId) return { ...s, accommodationId: undefined };
        return s;
      });
      return { ...t, accommodations, stops };
    });
    setDraft(null);
    toast('Sistemazione salvata');
  };

  const comparison = useMemo(() => lodgingComparison(trip), [trip]);
  const choose = (stopId: string, accId: string) => {
    const before = trip;
    // Scelta esplicita dell'utente: l'alloggio diventa quello della tappa, le altre candidate restano come alternative
    update((t) => ({
      ...t,
      stops: t.stops.map((s) => (s.id === stopId ? { ...s, accommodationId: accId } : s)),
      accommodations: t.accommodations.map((a) => (a.id === accId ? { ...a, stopId } : a)),
    }));
    toast('Alloggio scelto per la tappa (non è una prenotazione)', 'ok', { label: 'Annulla', run: () => replace(before) });
  };
  const searchFor = (id: string) => {
    setStopId(id);
    setResults(null);
    document.getElementById('hytte-search')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="hytte">
      {comparison.length > 0 && <LodgingCompare rows={comparison} onChoose={choose} onSearch={searchFor} />}
      <section className="panel" id="hytte-search">
        <h2>Cerca vicino a una tappa</h2>
        {sleepStops.length === 0 ? (
          <Empty title="Nessuna tappa con pernottamento">Aggiungi tappe con almeno una notte nell'itinerario.</Empty>
        ) : (
          <>
            <div className="row wrap">
              <select value={stopId} onChange={(e) => setStopId(e.target.value)} aria-label="Tappa">
                <option value="">Scegli la tappa…</option>
                {sleepStops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.nights} notti)
                  </option>
                ))}
              </select>
              <label className="check">
                Raggio
                <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                  {[5, 10, 15, 25, 40].map((r) => (
                    <option key={r} value={r}>
                      {r} km
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-primary" disabled={!stop || searchState === 'loading'} onClick={runSearch}>
                {searchState === 'loading' ? 'Ricerca…' : 'Cerca su OpenStreetMap'}
              </button>
            </div>
            {stop && (
              <div className="ext-links">
                <span className="muted small">
                  Ricerca esterna{checkIn ? ` dal ${formatDateIt(checkIn)} per ${stop.nights} notti` : ''}, {trip.participants.adults} adulti e{' '}
                  {trip.participants.childrenAges.length} bambini — si apre il sito del fornitore, l'app non verifica la disponibilità:
                </span>
                {externalSearchLinks(stop.name, checkIn, stop.nights, trip.participants).map((l) => (
                  <a key={l.provider} className="btn btn-small" href={l.url} target="_blank" rel="noreferrer" title={l.note}>
                    {l.provider} ↗
                  </a>
                ))}
              </div>
            )}
            {searchState === 'error' && (
              <p className="error" role="alert">
                {searchError}
              </p>
            )}
            {results && results.length === 0 && <p className="muted">Nessuna struttura con nome trovata in OpenStreetMap: prova un raggio maggiore.</p>}
            {results && results.length > 0 && (
              <>
                <p className="muted small">
                  {results.length} strutture da OpenStreetMap (© contributori OSM)
                  {via === 'Nominatim' ? ", trovate con la ricerca Nominatim perché Overpass non risponde: l'elenco può essere meno completo" : ''}. Distanze in linea d'aria dalla tappa. Prezzi e disponibilità non
                  inclusi: una struttura presente su OpenStreetMap non è per questo disponibile, prenotabile o adatta a {trip.participants.adults + trip.participants.childrenAges.length}{' '}
                  persone. Aggiunta all'elenco resta «da verificare».
                </p>
                <ul className="osm-results">
                  {results.map((p) => (
                    <li key={p.osmId}>
                      <div>
                        <strong>{p.name}</strong> <span className="muted small">{p.kind} · {p.distanceKm} km</span>
                        {p.website && (
                          <>
                            {' '}
                            <ExtLink url={p.website} className="small">
                              sito ↗
                            </ExtLink>
                          </>
                        )}
                      </div>
                      <button
                        className="btn btn-small"
                        onClick={() =>
                          setDraft(
                            blank({
                              name: p.name,
                              type: p.kind.startsWith('Chalet') ? 'hytte' : p.kind.startsWith('Campeggio') ? 'hytte_campeggio' : 'altro',
                              locality: stop?.name ?? '',
                              lat: p.lat,
                              lng: p.lng,
                              url: p.website,
                              stopId: stop?.id,
                              source: {
                                label: `OpenStreetMap ${p.osmId}`,
                                url: `https://www.openstreetmap.org/${p.osmId}`,
                                checkedAt: new Date().toISOString(),
                              },
                            }),
                          )
                        }
                      >
                        Aggiungi
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      <section className="panel">
        <header className="panel-head">
          <h2>Sistemazioni ({trip.accommodations.length})</h2>
          <button className="btn btn-primary" onClick={() => setDraft(blank({ stopId: stop?.id, locality: stop?.name ?? '' }))}>
            + Inserisci a mano
          </button>
        </header>
        {draft && <AccommodationForm value={draft} onSave={save} onCancel={() => setDraft(null)} />}
        {trip.accommodations.length === 0 ? (
          <Empty title="Nessuna sistemazione">Cerca vicino a una tappa o inserisci una hytte trovata altrove.</Empty>
        ) : (
          <div className="cards">
            {trip.accommodations.map((a) => {
              const st = trip.stops.find((s) => s.id === a.stopId);
              const total = st && a.pricePerNight ? toEur(a.pricePerNight, trip.settings) * st.nights + toEur(a.cleaningFee, trip.settings) + toEur(a.linenFee, trip.settings) : undefined;
              return (
                <article key={a.id} className="card">
                  <header>
                    <div>
                      <h3>{a.name}</h3>
                      <span className="muted small">
                        {a.locality} · {a.type.replace('_', ' ')}
                      </span>
                    </div>
                    <Badge tone={STATUS[a.status].tone}>{STATUS[a.status].label}</Badge>
                  </header>
                  <dl className="facts">
                    <dt>Tappa</dt>
                    <dd>
                      {st ? `${st.name} (${st.nights} notti)` : 'non associata'}{' '}
                      {st && (st.accommodationId === a.id ? <Badge tone="ok">scelta</Badge> : <Badge>alternativa</Badge>)}
                    </dd>
                    <dt>Prezzo/notte</dt>
                    <dd>
                      {fmtMoney(a.pricePerNight)} <StatusBadge status={a.priceStatus} />
                    </dd>
                    {total !== undefined && (
                      <>
                        <dt>Totale soggiorno</dt>
                        <dd>{formatEur(total)}</dd>
                      </>
                    )}
                    <dt>Posti / letti</dt>
                    <dd>
                      {a.capacity ?? '—'} · {a.beds || '—'}
                    </dd>
                    <dt>Servizi</dt>
                    <dd>
                      {servicesText(a)}
                    </dd>
                    {a.cancellation && (
                      <>
                        <dt>Cancellazione</dt>
                        <dd>{a.cancellation}</dd>
                      </>
                    )}
                  </dl>
                  {a.source && (
                    <p className="muted small">
                      Fonte:{' '}
                      {externalHref(a.source.url) ? <ExtLink url={a.source.url}>{a.source.label}</ExtLink> : a.source.label}
                      {a.source.url && !externalHref(a.source.url) && (
                        <>
                          {' '}
                          <ExtLink url={a.source.url}>{a.source.label}</ExtLink>
                        </>
                      )}{' '}
                      · {fmtDateTime(a.source.checkedAt)}
                    </p>
                  )}
                  <footer>
                    <ExtLink url={a.url} className="btn btn-small">
                      Sito ↗
                    </ExtLink>
                    <button className="btn btn-small" onClick={() => setDraft(a)}>
                      Modifica
                    </button>
                    <button
                      className="btn btn-small danger"
                      onClick={() => {
                        if (window.confirm(`Eliminare "${a.name}"?`)) {
                          update((t) => ({
                            ...t,
                            accommodations: t.accommodations.filter((x) => x.id !== a.id),
                            stops: t.stops.map((s) => (s.accommodationId === a.id ? { ...s, accommodationId: undefined } : s)),
                          }));
                        }
                      }}
                    >
                      Elimina
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/** Link esterno: aperto solo se http/https; altrimenti lo si dichiara non valido mostrando il testo salvato. */
function ExtLink({ url, className, children }: { url: string | undefined; className?: string; children: ReactNode }) {
  if (!url?.trim()) return null;
  const href = externalHref(url);
  if (!href) {
    return (
      <span className="small warn-text" title={url}>
        link non valido: {url.length > 40 ? `${url.slice(0, 40)}…` : url}
      </span>
    );
  }
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

const YES_NO = { si: 'sì', no: 'no', non_noto: 'non noto' } as const;
const BATH = { privato: 'privato', condiviso: 'condiviso', non_noto: 'non noto' } as const;

/** Servizi così come sono stati inseriti: «non noto» resta tale (anche per dati vecchi senza il campo). */
function servicesText(a: Accommodation): string {
  return `Cucina ${YES_NO[a.kitchen] ?? 'non noto'} · Bagno ${BATH[a.bathroom] ?? 'non noto'} · Parcheggio ${YES_NO[a.parking] ?? 'non noto'}`;
}

const DECISION: Record<LodgingDecision, string> = {
  da_verificare: 'Da verificare',
  valutata: 'Valutata',
  scelta: 'Scelta, non prenotata',
  prenotata: '✓ Prenotata',
};

function LodgingCompare({ rows, onChoose, onSearch }: { rows: StopLodging[]; onChoose: (stopId: string, accId: string) => void; onSearch: (stopId: string) => void }) {
  const { trip } = useTrip();
  const toSearch = rows.filter((r) => r.toSearch).length;
  const booked = rows.filter((r) => r.options.some((o) => o.chosen && o.decision === 'prenotata')).length;
  return (
    <section className="panel" aria-labelledby="lodging-compare">
      <header className="panel-head">
        <h2 id="lodging-compare">Confronto per tappa</h2>
        <span className="muted small">
          {rows.length} tappe · {booked} prenotate · {toSearch} da cercare
        </span>
      </header>
      <p className="muted small">
        Totale soggiorno = prezzo per notte × notti + pulizia + biancheria, come nel budget. Distanze in linea d'aria dalla tappa, non stradali. Disponibilità e
        prezzi vanno verificati sul sito del fornitore: l'app non prenota e non controlla la disponibilità.
      </p>
      <div className="lodging-stops">
        {rows.map((r) => {
          const chosen = r.options.find((o) => o.chosen);
          return (
            <article key={r.stop.id} className="lodging-stop">
              <header>
                <h3>
                  {r.stop.name}{' '}
                  <span className="muted small">
                    {r.nights} {r.nights === 1 ? 'notte' : 'notti'}
                    {r.checkIn ? ` · dal ${formatDateIt(r.checkIn)}` : ''}
                  </span>
                </h3>
                <span className="small">
                  {r.toSearch ? (
                    <Badge tone="warn">Da cercare</Badge>
                  ) : chosen ? (
                    <Badge tone={chosen.decision === 'prenotata' ? 'ok' : 'info'}>{DECISION[chosen.decision]}</Badge>
                  ) : (
                    <Badge tone="warn">Nessuna scelta</Badge>
                  )}
                </span>
              </header>
              {r.toSearch ? (
                <p className="small">
                  Nessuna sistemazione candidata.{' '}
                  <button className="link-btn" onClick={() => onSearch(r.stop.id)}>
                    Cerca vicino a {r.stop.name}
                  </button>
                </p>
              ) : (
                <ul className="lodging-options">
                  {r.options.map((o) => (
                    <li key={o.acc.id} className={o.chosen ? 'is-chosen' : ''}>
                      <div className="lo-name">
                        <strong>{o.acc.name}</strong>
                        <span className="small">{o.chosen ? '★ Scelta per la tappa' : `Alternativa · ${DECISION[o.decision].toLowerCase()}`}</span>
                      </div>
                      <div className="lo-price">
                        {o.stayEur !== undefined ? (
                          <>
                            <strong>{formatEur(o.stayEur)}</strong>
                            <span className="small muted"> soggiorno · {fmtMoney(o.acc.pricePerNight)}/notte</span> <StatusBadge status={o.priceStatus} />
                            {o.diffVsChosenEur !== undefined && o.diffVsChosenEur !== 0 && (
                              <span className="small lo-diff">
                                {o.diffVsChosenEur > 0 ? '+' : '−'}
                                {formatEur(Math.abs(o.diffVsChosenEur))} rispetto alla scelta
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="warn-text small">Prezzo mancante: totale non calcolabile</span>
                        )}
                      </div>
                      <div className="lo-facts small">
                        <span>
                          {o.fitsFamily === undefined
                            ? 'Posti non indicati'
                            : o.fitsFamily
                              ? `${o.acc.capacity} posti indicati per ${trip.participants.adults + trip.participants.childrenAges.length} persone${o.acc.beds ? ` · ${o.acc.beds}` : ' · letti da verificare'}`
                              : `✗ ${o.acc.capacity} posti: insufficienti`}
                        </span>
                        <span>{o.airKmFromStop !== undefined ? `~${o.airKmFromStop.toLocaleString('it-IT')} km in linea d'aria` : 'Posizione non indicata'}</span>
                        <span>{servicesText(o.acc)}</span>
                        <span className="muted">
                          Fonte: {o.source ? `${o.source.label}${o.source.checkedAt ? `, ${fmtDateTime(o.source.checkedAt)}` : ''}` : 'non indicata'}
                        </span>
                      </div>
                      {o.missing.length > 0 && <div className="small lo-missing">Manca: {o.missing.join(', ')}</div>}
                      {o.acc.cancellation && <div className="small">Cancellazione: {o.acc.cancellation}</div>}
                      {o.acc.notes && <div className="small muted">{o.acc.notes}</div>}
                      <div className="lo-actions">
                        <ExtLink url={o.acc.url ?? o.source?.url} className="btn btn-small">
                          Fonte ↗
                        </ExtLink>
                        {!o.chosen && (
                          <button className="btn btn-small" onClick={() => onChoose(r.stop.id, o.acc.id)}>
                            Scegli per questa tappa
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AccommodationForm({ value, onSave, onCancel }: { value: Accommodation; onSave: (a: Accommodation) => void; onCancel: () => void }) {
  const { trip } = useTrip();
  const [a, setA] = useState(value);
  const set = (p: Partial<Accommodation>) => setA((x) => ({ ...x, ...p }));
  const yn = (v: 'si' | 'no' | 'non_noto', on: (x: 'si' | 'no' | 'non_noto') => void, id: string) => (
    <select id={id} value={v} onChange={(e) => on(e.target.value as 'si' | 'no' | 'non_noto')}>
      <option value="non_noto">Non noto</option>
      <option value="si">Sì</option>
      <option value="no">No</option>
    </select>
  );
  return (
    <div className="form-panel">
      <div className="grid-4">
        <Field label="Nome">{(id) => <input id={id} value={a.name} onChange={(e) => set({ name: e.target.value })} />}</Field>
        <Field label="Tipo">
          {(id) => (
            <select id={id} value={a.type} onChange={(e) => set({ type: e.target.value as Accommodation['type'] })}>
              <option value="hytte">Hytte</option>
              <option value="hytte_campeggio">Hytte in campeggio</option>
              <option value="appartamento">Appartamento</option>
              <option value="hotel">Hotel</option>
              <option value="altro">Altro</option>
            </select>
          )}
        </Field>
        <Field label="Località">{(id) => <input id={id} value={a.locality} onChange={(e) => set({ locality: e.target.value })} />}</Field>
        <Field label="Tappa">
          {(id) => (
            <select id={id} value={a.stopId ?? ''} onChange={(e) => set({ stopId: e.target.value || undefined })}>
              <option value="">— nessuna —</option>
              {trip.stops
                .filter((s) => s.kind === 'luogo')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          )}
        </Field>
        <Field label="Latitudine">{(id) => <NumberInput id={id} value={a.lat} onChange={(v) => set({ lat: v })} />}</Field>
        <Field label="Longitudine">{(id) => <NumberInput id={id} value={a.lng} onChange={(v) => set({ lng: v })} />}</Field>
        <Field label="Link prenotazione / ufficiale">{(id) => <input id={id} type="url" value={a.url ?? ''} onChange={(e) => set({ url: e.target.value || undefined })} />}</Field>
        <Field label="Stato">
          {(id) => (
            <select id={id} value={a.status} onChange={(e) => set({ status: e.target.value as AccommodationStatus })}>
              {Object.entries(STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Prezzo per notte">{(id) => <MoneyInput id={id} value={a.pricePerNight} onChange={(m) => set({ pricePerNight: m })} />}</Field>
        <Field label="Stato prezzo">{(id) => <StatusSelect id={id} value={a.priceStatus} onChange={(v) => set({ priceStatus: v })} />}</Field>
        <Field label="Pulizia finale">{(id) => <MoneyInput id={id} value={a.cleaningFee} onChange={(m) => set({ cleaningFee: m })} />}</Field>
        <Field label="Biancheria">{(id) => <MoneyInput id={id} value={a.linenFee} onChange={(m) => set({ linenFee: m })} />}</Field>
        <Field label="Posti letto">{(id) => <NumberInput id={id} value={a.capacity} min={0} onChange={(v) => set({ capacity: v })} />}</Field>
        <Field label="Configurazione letti">{(id) => <input id={id} value={a.beds} placeholder="es. 1 matrimoniale + letto a castello" onChange={(e) => set({ beds: e.target.value })} />}</Field>
        <Field label="Bagno">
          {(id) => (
            <select id={id} value={a.bathroom} onChange={(e) => set({ bathroom: e.target.value as Accommodation['bathroom'] })}>
              <option value="non_noto">Non noto</option>
              <option value="privato">Privato</option>
              <option value="condiviso">Condiviso</option>
            </select>
          )}
        </Field>
        <Field label="Cucina">{(id) => yn(a.kitchen, (x) => set({ kitchen: x }), id)}</Field>
        <Field label="Parcheggio">{(id) => yn(a.parking, (x) => set({ parking: x }), id)}</Field>
      </div>
      <div className="grid-2">
        <Field label="Politica di cancellazione">{(id) => <textarea id={id} rows={2} value={a.cancellation} onChange={(e) => set({ cancellation: e.target.value })} />}</Field>
        <Field label="Note (distanze, servizi)">{(id) => <textarea id={id} rows={2} value={a.notes} onChange={(e) => set({ notes: e.target.value })} />}</Field>
      </div>
      {a.capacity !== undefined && a.capacity < trip.participants.adults + trip.participants.childrenAges.length && (
        <p className="note-warn small">⚠️ Posti letto insufficienti per la famiglia.</p>
      )}
      <div className="row">
        <button className="btn btn-primary" disabled={!a.name.trim()} onClick={() => onSave({ ...a, name: a.name.trim() })}>
          Salva
        </button>
        <button className="btn" onClick={onCancel}>
          Annulla
        </button>
      </div>
    </div>
  );
}

