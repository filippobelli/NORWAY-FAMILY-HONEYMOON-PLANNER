import { useMemo, useRef, useState } from 'react';
import { toEur } from '../domain/coastal';
import { newId } from '../domain/ids';
import { computeDays, formatDateIt } from '../domain/itinerary';
import type { Accommodation, AccommodationStatus } from '../domain/types';
import { externalSearchLinks, searchNearbyOsm, type NearbyPlace } from '../services/accommodation/search';
import { useTrip } from '../state/store';
import { formatEur } from '../domain/budget';
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
  const { trip, update, toast } = useTrip();
  const [draft, setDraft] = useState<Accommodation | null>(null);
  const [stopId, setStopId] = useState<string>(trip.stops.find((s) => s.kind === 'luogo' && s.nights > 0)?.id ?? '');
  const [radius, setRadius] = useState(15);
  const [results, setResults] = useState<NearbyPlace[] | null>(null);
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
      setResults(r);
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

  return (
    <div className="hytte">
      <section className="panel">
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
                  {results.length} strutture da OpenStreetMap (© contributori OSM). Distanze in linea d'aria dalla tappa. Prezzi e disponibilità non
                  inclusi.
                </p>
                <ul className="osm-results">
                  {results.map((p) => (
                    <li key={p.osmId}>
                      <div>
                        <strong>{p.name}</strong> <span className="muted small">{p.kind} · {p.distanceKm} km</span>
                        {p.website && (
                          <a className="small" href={p.website} target="_blank" rel="noreferrer">
                            {' '}
                            sito ↗
                          </a>
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
                    <dt>Bagno · cucina · parcheggio</dt>
                    <dd>
                      {a.bathroom.replace('_', ' ')} · {a.kitchen.replace('_', ' ')} · {a.parking.replace('_', ' ')}
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
                      {a.source.url ? (
                        <a href={a.source.url} target="_blank" rel="noreferrer">
                          {a.source.label}
                        </a>
                      ) : (
                        a.source.label
                      )}{' '}
                      · {fmtDateTime(a.source.checkedAt)}
                    </p>
                  )}
                  <footer>
                    {a.url && (
                      <a className="btn btn-small" href={a.url} target="_blank" rel="noreferrer">
                        Sito ↗
                      </a>
                    )}
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
