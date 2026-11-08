import { restorePlanOnly } from '../domain/actuals';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toEur } from '../domain/coastal';
import { newId } from '../domain/ids';
import { addDays, computeDays, formatDateIt } from '../domain/itinerary';
import { accommodationInfo } from '../domain/verification';
import { Modal } from './PlacementDialog';
import { InfoBadge, VerificationControl } from './Verification';
import type { Accommodation, AccommodationStatus } from '../domain/types';
import { externalSearchLinks, searchNearbyOsm, type NearbyPlace, type NearbySource } from '../services/accommodation/search';
import { parseRoute } from '../state/route';
import { useTrip } from '../state/store';
import { formatEur } from '../domain/budget';
import { upsertAccommodation, externalHref, lodgingComparison, type LodgingDecision, type StopLodging } from '../domain/lodging';
import { Badge, Empty, Field, fmtDateTime, fmtMoney, MoneyInput, NumberInput, StatusBadge, StatusSelect } from './common';
import { Icon } from './icons';

// Stato di prenotazione. La disponibilità è un'informazione a parte (verifica), mostrata accanto
const STATUS: Record<AccommodationStatus, { label: string; tone: 'neutral' | 'info' | 'ok' | 'warn' }> = {
  individuata: { label: 'Individuata, non prenotata', tone: 'neutral' },
  disponibile: { label: 'Individuata, non prenotata', tone: 'neutral' },
  opzionata: { label: 'Opzionata', tone: 'info' },
  prenotata: { label: 'Prenotata', tone: 'ok' },
  annullata: { label: 'Annullata', tone: 'warn' },
};

export function blank(partial: Partial<Accommodation> = {}): Accommodation {
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
  const { trip, update, toast } = useTrip();
  const [draft, setDraft] = useState<Accommodation | null>(null);
  // Da un link «Cerca alloggio» di una tappa si arriva già su quella tappa
  const route = parseRoute(window.location.hash);
  const wanted = route.params.tappa;
  const [stopId, setStopId] = useState<string>((wanted && trip.stops.some((s) => s.id === wanted) ? wanted : undefined) ?? trip.stops.find((s) => s.kind === 'luogo' && s.nights > 0)?.id ?? '');
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
    update((t) => upsertAccommodation(t, a));
    setDraft(null);
    toast('Sistemazione salvata');
  };

  // «Cerca» da una tappa apre direttamente la ricerca impostata su quella tappa
  const [searchOpen, setSearchOpen] = useState(route.params.cerca === '1' && Boolean(wanted));
  const openSearch = (id?: string) => {
    if (id) setStopId(id);
    setResults(null);
    setSearchState('idle');
    setSearchOpen(true);
  };
  // Anche se Alloggi è già aperto, un link «Cerca» per un'altra tappa apre la ricerca su quella tappa
  useEffect(() => {
    const follow = () => {
      const r = parseRoute(window.location.hash);
      if (r.view === 'hytte' && r.params.tappa && r.params.cerca === '1') {
        setStopId(r.params.tappa);
        setResults(null);
        setSearchOpen(true);
      }
    };
    window.addEventListener('hashchange', follow);
    return () => window.removeEventListener('hashchange', follow);
  }, []);
  useEffect(() => {
    if (wanted && !searchOpen) document.getElementById(`lodging-${wanted}`)?.scrollIntoView({ block: 'center' });
    // Solo all'arrivo: dopo si scorre liberamente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const comparison = useMemo(() => lodgingComparison(trip), [trip]);
  const choose = (stopId: string, accId: string) => {
    const before = trip;
    // Scelta esplicita dell'utente: l'alloggio diventa quello della tappa, le altre candidate restano come alternative
    update((t) => ({
      ...t,
      stops: t.stops.map((s) => (s.id === stopId ? { ...s, accommodationId: accId } : s)),
      accommodations: t.accommodations.map((a) => (a.id === accId ? { ...a, stopId } : a)),
    }));
    toast('Alloggio scelto per la tappa (non è una prenotazione)', 'ok', { label: 'Annulla', run: () => update((cur) => restorePlanOnly(cur, before)) });
  };

  return (
    <div className="hytte">
      {searchOpen && (
        <Modal title="Cerca un alloggio" className="drawer" onClose={() => setSearchOpen(false)}>
          {sleepStops.length === 0 ? (
            <Empty title="Nessuna tappa con pernottamento">
              Aggiungi tappe con almeno una notte <a href="#/pianifica">nell'itinerario</a>.
            </Empty>
          ) : (
            <>
              <div className="search-for" aria-live="polite">
                <div className="grid-2">
                  <Field label="Tappa">
                    {(id) => (
                      <select
                        id={id}
                        value={stopId}
                        onChange={(e) => {
                          setStopId(e.target.value);
                          setResults(null);
                        }}
                      >
                        {sleepStops.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.nights} {s.nights === 1 ? 'notte' : 'notti'})
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <Field label="Raggio dalla tappa">
                    {(id) => (
                      <select id={id} value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                        {[5, 10, 15, 25, 40].map((r) => (
                          <option key={r} value={r}>
                            {r} km
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                </div>
                {stop && (
                  <p className="small search-summary">
                    <strong>{stop.name}</strong> ·{' '}
                    {checkIn ? `dal ${formatDateIt(checkIn)} al ${formatDateIt(addDays(checkIn, stop.nights))}` : 'date non disponibili'} · {stop.nights} {stop.nights === 1 ? 'notte' : 'notti'} ·{' '}
                    {trip.participants.adults} adulti e {trip.participants.childrenAges.length} bambini
                    {trip.participants.childrenAges.length ? ` (${trip.participants.childrenAges.join(' e ')} anni)` : ''} · raggio {radius} km
                    {trip.dateTentative && <span className="block muted">Le date del viaggio sono provvisorie.</span>}
                  </p>
                )}
              </div>

              <h3>Strutture vicine da OpenStreetMap</h3>
              <p className="small muted">Nomi e posizioni dalla mappa libera: nessun prezzo e nessuna disponibilità. Richiede la rete.</p>
              <button className="btn btn-primary" disabled={!stop || searchState === 'loading'} onClick={runSearch}>
                {searchState === 'loading' ? 'Ricerca in corso…' : `Cerca entro ${radius} km`}
              </button>
              {searchState === 'loading' && (
                <p className="small" role="status">
                  <span className="spinner" aria-hidden /> Ricerca su OpenStreetMap…
                </p>
              )}
              {searchState === 'error' && (
                <p className="error" role="alert">
                  {searchError}{' '}
                  <button className="link-btn" onClick={runSearch}>
                    Riprova
                  </button>
                </p>
              )}
              {results && results.length === 0 && <p className="muted" role="status">Nessuna struttura con nome trovata: prova un raggio maggiore.</p>}
              {results && results.length > 0 && (
                <>
                  <p className="muted small" role="status">
                    {results.length} strutture da OpenStreetMap (© contributori OSM)
                    {via === 'Nominatim' ? ", trovate con Nominatim perché Overpass non risponde: l'elenco può essere meno completo" : ''}. Distanze in linea d'aria dalla tappa. Una struttura presente sulla mappa non è
                    per questo disponibile o adatta a {trip.participants.adults + trip.participants.childrenAges.length} persone: aggiunta all'elenco resta da verificare.
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
                                source: { label: `OpenStreetMap ${p.osmId}`, url: `https://www.openstreetmap.org/${p.osmId}`, checkedAt: new Date().toISOString() },
                              }),
                            )
                          }
                        >
                          Aggiungi come candidata
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {stop && (
                <>
                  <h3>Ricerche esterne</h3>
                  <p className="small muted">
                    Aprono il sito del fornitore con tappa, date e persone già inseriti. Sono ricerche: non confermano la disponibilità e non sono prenotazioni.
                  </p>
                  <div className="ext-links">
                    {externalSearchLinks(stop.name, checkIn, stop.nights, trip.participants).map((l) => (
                      <a key={l.provider} className="btn btn-small" href={l.url} target="_blank" rel="noreferrer" title={l.note}>
                        Cerca su {l.provider} ↗
                      </a>
                    ))}
                  </div>
                </>
              )}
              <h3>L'hai trovata altrove?</h3>
              <button className="btn" onClick={() => setDraft(blank({ stopId: stop?.id, locality: stop?.name ?? '' }))}>
                Inserisci a mano per {stop?.name ?? 'la tappa'}
              </button>
              {draft && <AccommodationForm value={draft} onSave={save} onCancel={() => setDraft(null)} />}
            </>
          )}
        </Modal>
      )}
      <div className="hytte-head">
        <p className="small muted">Una ricerca per tappa: si apre già impostata su date, persone e raggio. Prenotazione e verifica della disponibilità sono indicate separatamente.</p>
        <span className="row wrap">
          <button className="btn btn-primary" disabled={sleepStops.length === 0} onClick={() => openSearch(stopId || sleepStops[0]?.id)}>
            Cerca un alloggio
          </button>
          <button className="btn" onClick={() => setDraft(blank({ stopId: stop?.id, locality: stop?.name ?? '' }))}>
            + Inserisci a mano
          </button>
        </span>
      </div>
      {draft && !searchOpen && <AccommodationForm value={draft} onSave={save} onCancel={() => setDraft(null)} />}
      {comparison.length > 0 && <LodgingCompare rows={comparison} onChoose={choose} onSearch={openSearch} />}

      <section className="panel">
        <header className="panel-head">
          <h2>Sistemazioni salvate ({trip.accommodations.length})</h2>
        </header>
        {trip.accommodations.length === 0 ? (
          <Empty title="Nessuna sistemazione">Cerca vicino a una tappa o inserisci una hytte trovata altrove.</Empty>
        ) : (
          <div className="cards">
            {trip.accommodations.map((a) => {
              const st = trip.stops.find((s) => s.id === a.stopId);
              const total = st && a.pricePerNight ? toEur(a.pricePerNight, trip.settings, trip.rates) * st.nights + toEur(a.cleaningFee, trip.settings, trip.rates) + toEur(a.linenFee, trip.settings, trip.rates) : undefined;
              return (
                <article key={a.id} className="card">
                  <header>
                    <div>
                      <h3>{a.name}</h3>
                      <span className="muted small">
                        {a.locality} · {a.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="row tight wrap">
                      <Badge tone={STATUS[a.status].tone}>{STATUS[a.status].label}</Badge>
                      {a.status !== 'annullata' && <InfoBadge info={accommodationInfo(a, trip.settings)} what="Disponibilità" />}
                    </span>
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
                    {a.address && (
                      <>
                        <dt>Indirizzo</dt>
                        <dd>{a.address}</dd>
                      </>
                    )}
                    {a.phone && (
                      <>
                        <dt>Telefono</dt>
                        <dd>
                          <a href={`tel:${a.phone.replace(/[^+\d]/g, '')}`}>{a.phone}</a>
                        </dd>
                      </>
                    )}
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
  da_verificare: 'Candidata',
  valutata: 'Valutata',
  scelta: 'Scelta, non prenotata',
  prenotata: '✓ Prenotata',
  annullata: 'Annullata',
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
            <article key={r.stop.id} id={`lodging-${r.stop.id}`} className="lodging-stop">
              <header>
                <h3>
                  {r.stop.name}{' '}
                  <span className="muted small">
                    {r.nights} {r.nights === 1 ? 'notte' : 'notti'}
                    {r.checkIn ? ` · dal ${formatDateIt(r.checkIn)}` : ''}
                  </span>
                </h3>
                <span className="small row tight wrap">
                  <button className="btn btn-small" onClick={() => onSearch(r.stop.id)} aria-label={`Cerca un alloggio a ${r.stop.name}`}>
                    Cerca
                  </button>
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
                  Nessuna sistemazione candidata: usa «Cerca» per aprire la ricerca su questa tappa.
                </p>
              ) : (
                <ul className="lodging-options">
                  {r.options.map((o) => (
                    <li key={o.acc.id} className={o.chosen ? 'is-chosen' : ''}>
                      <div className="lo-name">
                        <strong>{o.acc.name}</strong>
                        <span className="small">{o.chosen ? '★ Scelta per la tappa' : `Alternativa · ${DECISION[o.decision].toLowerCase()}`}</span>
                        {o.acc.status !== 'annullata' && <InfoBadge info={accommodationInfo(o.acc, trip.settings)} what="Disponibilità" />}
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

export function AccommodationForm({ value, onSave, onCancel }: { value: Accommodation; onSave: (a: Accommodation) => void; onCancel: () => void }) {
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
        <Field label="Link prenotazione / ufficiale">{(id) => <input id={id} type="url" value={a.url ?? ''} onChange={(e) => set({ url: e.target.value || undefined })} />}</Field>
        <Field label="Stato prenotazione" hint="«Prenotata» solo con la conferma del fornitore">
          {(id) => (
            <select id={id} value={a.status} onChange={(e) => set({ status: e.target.value as AccommodationStatus })}>
              {(['individuata', 'opzionata', 'prenotata', 'annullata'] as const).map((k) => (
                <option key={k} value={k}>
                  {STATUS[k].label}
                </option>
              ))}
              {a.status === 'disponibile' && <option value="disponibile">Individuata, disponibilità controllata (dato precedente)</option>}
            </select>
          )}
        </Field>
        <Field label="Prezzo per notte">{(id) => <MoneyInput id={id} value={a.pricePerNight} onChange={(m) => set({ pricePerNight: m })} />}</Field>
        <Field label="Stato prezzo">{(id) => <StatusSelect id={id} value={a.priceStatus} onChange={(v) => set({ priceStatus: v })} />}</Field>
        <Field label="Posti letto">{(id) => <NumberInput id={id} value={a.capacity} min={0} onChange={(v) => set({ capacity: v })} />}</Field>
      </div>
      <details className="more-fields">
        <summary>Altri dettagli</summary>
        <div className="grid-4">
        <Field label="Località">{(id) => <input id={id} value={a.locality} onChange={(e) => set({ locality: e.target.value })} />}</Field>
        <Field label="Indirizzo">{(id) => <input id={id} value={a.address ?? ''} onChange={(e) => set({ address: e.target.value || undefined })} />}</Field>
        <Field label="Telefono">{(id) => <input id={id} type="tel" value={a.phone ?? ''} onChange={(e) => set({ phone: e.target.value || undefined })} />}</Field>
        <Field label="Latitudine">{(id) => <NumberInput id={id} value={a.lat} onChange={(v) => set({ lat: v })} />}</Field>
        <Field label="Longitudine">{(id) => <NumberInput id={id} value={a.lng} onChange={(v) => set({ lng: v })} />}</Field>
        <Field label="Pulizia finale">{(id) => <MoneyInput id={id} value={a.cleaningFee} onChange={(m) => set({ cleaningFee: m })} />}</Field>
        <Field label="Biancheria">{(id) => <MoneyInput id={id} value={a.linenFee} onChange={(m) => set({ linenFee: m })} />}</Field>
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
      </details>
      {a.capacity !== undefined && a.capacity < trip.participants.adults + trip.participants.childrenAges.length && (
        <p className="note-warn small"><Icon name="warning" /> Posti letto insufficienti per la famiglia.</p>
      )}
      {a.status !== 'annullata' && (
        <VerificationControl what="Disponibilità" info={accommodationInfo(a, trip.settings)} value={a.verification} onChange={(v) => set({ verification: v })} />
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

export const blankAccommodation = blank;
