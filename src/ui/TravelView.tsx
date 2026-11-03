import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { STATUS_LABEL } from '../domain/budget';
import { activityState, addDiaryEntry, editDiaryEntry, newDiaryEntry, removeDiaryEntry, setActivityState, setStopState, stopState, STOP_STATE_LABEL, visibleDiary } from '../domain/actuals';
import { airKm } from '../domain/configurator';
import { newId } from '../domain/ids';
import { addDays, computeDays, formatDateIt, formatDuration } from '../domain/itinerary';
import { defaultDayIndex, phaseNote, todayView, type BookingInfo } from '../domain/today';
import type { DiaryAttachment, DiaryEntry, StopVisitState } from '../domain/types';
import { deleteBlob, getBlob, putBlob } from '../services/storage/blobs';
import { useAppMode } from '../state/mode';
import type { ViewId } from '../state/route';
import { useTrip } from '../state/store';
import { Badge, Empty, Field, fmtDateTime, ModeIcon } from './common';
import { Icon, type IconName } from './icons';
import { MapView } from './MapView';
import { PlanBDialog } from './PlanBDialog';

// Travel Mode: stesso viaggio e stessi dati del Planning Mode, pensato per il telefono.

const BAR: { id: ViewId; label: string; icon: IconName }[] = [
  { id: 't/oggi', label: 'Oggi', icon: 'sun' },
  { id: 't/itinerario', label: 'Itinerario', icon: 'list' },
  { id: 't/mappa', label: 'Mappa', icon: 'map' },
  { id: 't/diario', label: 'Diario', icon: 'book' },
  { id: 't/altro', label: 'Altro', icon: 'menu' },
];

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function TravelShell({ tab, status, children }: { tab: ViewId; status: ReactNode; children: ReactNode }) {
  const { trip } = useTrip();
  const active = BAR.some((b) => b.id === tab) ? tab : 't/altro';
  return (
    <div className="travel">
      <header className="travel-top">
        <strong>{trip.title || 'Norvegia 2027'}</strong>
        {status}
      </header>
      <main className="travel-main">{children}</main>
      <nav className="travel-bar" aria-label="Modalità viaggio">
        {BAR.map((b) => (
          <a key={b.id} href={`#/${b.id}`} className={active === b.id ? 'active' : ''} aria-current={active === b.id ? 'page' : undefined}>
            <Icon name={b.icon} />
            {b.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

const STATE_ICON: Record<string, IconName> = { pianificata: 'circle', da_fare: 'circle', in_corso: 'progress', visitata: 'check', fatta: 'check', saltata: 'skip' };
const STATE_TEXT: Record<string, string> = { pianificata: 'Pianificata', da_fare: 'Da fare', in_corso: 'In corso', visitata: 'Visitata', fatta: 'Fatta', saltata: 'Saltata' };

function StateChip({ state }: { state: string }) {
  return (
    <span className={`state-chip state-${state}`}>
      <Icon name={STATE_ICON[state] ?? 'circle'} /> {STATE_TEXT[state] ?? state}
    </span>
  );
}

const BOOKING_ICON: Record<BookingInfo['kind'], IconName> = { volo: 'plane', crociera: 'ship', alloggio: 'bed', trasporto: 'ferry' };
const ACC_LABEL: Record<string, string> = { individuata: 'Individuata', disponibile: 'Disponibile', opzionata: 'Opzionata', prenotata: 'Prenotata' };
const bookingLabel = (s: BookingInfo['status']) => ACC_LABEL[s] ?? STATUS_LABEL[s as keyof typeof STATUS_LABEL];

export function TodayScreen() {
  const { trip, update, toast } = useTrip();
  const today = localToday();
  const [index, setIndex] = useState(() => defaultDayIndex(trip, today));
  const [noting, setNoting] = useState(false);
  const [planB, setPlanB] = useState(false);
  const v = useMemo(() => todayView(trip, index), [trip, index]);
  if (!v) return <Empty title="Il percorso è vuoto">Aggiungi le tappe dall'area di lavoro su computer, o da Altro → Tappe e mappa.</Empty>;
  const note = phaseNote(trip, today);

  const markStop = (id: string, name: string, state: StopVisitState) => {
    const prev = stopState(trip, id);
    update((t) => setStopState(t, id, state), { immediate: true });
    toast(`${name}: ${STOP_STATE_LABEL[state].toLowerCase()}. Il piano non cambia.`, 'ok', { label: 'Annulla', run: () => update((t) => setStopState(t, id, prev === 'pianificata' ? undefined : prev), { immediate: true }) });
  };
  const markActivity = (id: string, title: string, state: 'fatta' | 'saltata') => {
    const prev = activityState(trip, id);
    update((t) => setActivityState(t, id, state), { immediate: true });
    toast(`${title}: ${state}. Il piano non cambia.`, 'ok', { label: 'Annulla', run: () => update((t) => setActivityState(t, id, prev === 'da_fare' ? undefined : prev), { immediate: true }) });
  };

  return (
    <div className="today">
      <div className="today-nav">
        <button className="btn" disabled={v.index === 0} aria-label="Giorno precedente" onClick={() => setIndex(v.index - 1)}>
          ←
        </button>
        <div>
          <h1>
            Giorno {v.index + 1} di {v.total}
          </h1>
          <p className="small">{formatDateIt(v.day.date)}{v.place ? ` · ${v.place.name}` : ''}</p>
        </div>
        <button className="btn" disabled={v.index === v.total - 1} aria-label="Giorno successivo" onClick={() => setIndex(v.index + 1)}>
          →
        </button>
      </div>
      {note && <p className="note-info small">{note}</p>}

      <div className="t-card t-today">
      {v.place && (
        <section className="t-today-row" aria-label="Tappa corrente">
          <h2>Tappa</h2>
          <p className="t-today-place">
            {v.place.name} <StateChip state={stopState(trip, v.place.id)} />
          </p>
        </section>
      )}
      <section className="t-today-row" aria-label="Prossima cosa da fare">
        <h2>Prossimo</h2>
        {v.next ? (
          <>
            <p className="t-next-title">{v.next.title}</p>
            {v.next.activity ? (
              <div className="t-actions">
                <button className="btn btn-primary" onClick={() => markActivity(v.next!.activity!.id, v.next!.title, 'fatta')}>
                  Segna fatta
                </button>
                <button className="btn" onClick={() => markActivity(v.next!.activity!.id, v.next!.title, 'saltata')}>
                  Salta
                </button>
              </div>
            ) : (
              <div className="t-actions">
                <button className="btn btn-primary" onClick={() => markStop(v.next!.stop!.id, v.next!.title, 'visitata')}>
                  Segna visitata
                </button>
                <button className="btn" onClick={() => markStop(v.next!.stop!.id, v.next!.title, 'in_corso')}>
                  In corso
                </button>
                <button className="btn" onClick={() => markStop(v.next!.stop!.id, v.next!.title, 'saltata')}>
                  Salta
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="muted">Niente in sospeso per questa giornata.</p>
        )}
        <div className="t-actions t-note-btn">
          <button className="btn" aria-expanded={noting} onClick={() => setNoting((x) => !x)}>
            <Icon name="note" /> Annota
          </button>
          <button className="btn" onClick={() => setPlanB(true)}>
            <Icon name="umbrella" /> Piano B
          </button>
        </div>
        {planB && <PlanBDialog onClose={() => setPlanB(false)} />}
        {noting && <DiaryComposer dayDate={v.day.date} stop={v.place ? { id: v.place.id, name: v.place.name } : undefined} onDone={() => setNoting(false)} />}
      </section>

      <section className="t-today-row" aria-label="Trasferimento">
        <h2>Trasferimento</h2>
        {v.transfers.length === 0 ? (
          <p className="muted small">Nessun trasferimento previsto.</p>
        ) : (
          <ul className="t-list">
            {v.transfers.map((t) => (
              <li key={t.leg.id}>
                <span>
                  {t.leg.segments.map((s) => <ModeIcon key={s.id} mode={s.mode} />)} {t.from} → {t.to}
                </span>
                <span className="small muted">{t.uncalculated ? 'Non calcolato: tempi non disponibili' : t.partial ? 'Durata incompleta' : `Circa ${formatDuration(t.realisticMin)} con soste (teorico ${formatDuration(t.theoreticalMin)})`}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="t-today-row" aria-label="Pernottamento">
        <h2>Pernottamento</h2>
        {v.sleep ? (
          <p>
            <Icon name={v.sleep.kind === 'a_bordo' ? 'ship' : 'bed'} />{' '}
            {v.sleep.name}
            {v.accommodation ? ` · ${v.accommodation.name}` : v.sleep.kind === 'luogo' ? ' · alloggio da scegliere' : ''}
          </p>
        ) : (
          <p className="muted small">Ultimo giorno: nessun pernottamento.</p>
        )}
      </section>
      </div>

      {v.activities.length > 0 && (
        <section className="t-card" aria-label="Attività">
          <h2>Attività</h2>
          <ul className="t-list">
            {v.activities.map(({ activity: a, state }) => (
              <li key={a.id} className={`t-row is-${state}`}>
                <span>
                  {a.title || 'Attività'} <StateChip state={state} />
                </span>
                <span className="t-actions">
                  {state !== 'da_fare' ? (
                    <button className="btn btn-small" onClick={() => update((t) => setActivityState(t, a.id, undefined), { immediate: true })}>
                      Riapri
                    </button>
                  ) : (
                    <>
                      <button className="btn btn-small" onClick={() => markActivity(a.id, a.title || 'Attività', 'fatta')}>
                        Fatta
                      </button>
                      <button className="btn btn-small" onClick={() => markActivity(a.id, a.title || 'Attività', 'saltata')}>
                        Salta
                      </button>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="t-card" aria-label="Prenotazioni e collegamenti di oggi">
        <h2>Prenotazioni e collegamenti</h2>
        {v.bookings.length === 0 ? (
          <p className="muted small">Nessuno inserito per questa giornata.</p>
        ) : (
          <ul className="t-list">
            {v.bookings.map((b, i) => (
              <li key={i}>
                <span>
                  <Icon name={BOOKING_ICON[b.kind]} /> {b.text}
                </span>
                <Badge tone={b.status === 'prenotato' || b.status === 'pagato' || b.status === 'prenotata' ? 'ok' : 'neutral'}>{bookingLabel(b.status)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(v.planB.length > 0 || v.notes) && (
        <section className="t-card" aria-label="Note e piano B">
          <h2>Note e piano B</h2>
          {v.notes && <p className="small">{v.notes}</p>}
          {v.planB.map((p) => (
            <p key={p} className="small">
              <Icon name="umbrella" /> {p}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}

export function TravelItinerary() {
  const { trip, update, toast } = useTrip();
  const days = useMemo(() => computeDays(trip), [trip]);
  if (trip.stops.length === 0) return <Empty title="Il percorso è vuoto" />;
  const mark = (id: string, name: string, state: StopVisitState | undefined) => {
    const prev = stopState(trip, id);
    update((t) => setStopState(t, id, state), { immediate: true });
    toast(`${name}: ${STOP_STATE_LABEL[state ?? 'pianificata'].toLowerCase()}. Il piano non cambia.`, 'ok', { label: 'Annulla', run: () => update((t) => setStopState(t, id, prev === 'pianificata' ? undefined : prev), { immediate: true }) });
  };
  return (
    <ol className="t-stops" aria-label="Tappe del viaggio">
      {trip.stops.map((s, i) => {
        const st = stopState(trip, s.id);
        const d = days.find((x) => x.sleepStop?.id === s.id);
        return (
          <li key={s.id} className={`t-card t-stop is-${st}`}>
            <div>
              <strong>
                {i + 1}. {s.kind === 'a_bordo' && <Icon name="ship" />}{' '}
                {s.name}
              </strong>
              <p className="small muted">
                {d ? `${formatDateIt(d.date)} → ${formatDateIt(addDays(d.date, s.nights))} · ${s.nights} ${s.nights === 1 ? 'notte' : 'notti'}` : 'Di passaggio, senza notti'}
              </p>
              <StateChip state={st} />
            </div>
            <div className="t-actions">
              {st !== 'visitata' && (
                <button className="btn btn-small" onClick={() => mark(s.id, s.name, 'visitata')}>
                  Visitata
                </button>
              )}
              {st !== 'in_corso' && st !== 'visitata' && (
                <button className="btn btn-small" onClick={() => mark(s.id, s.name, 'in_corso')}>
                  In corso
                </button>
              )}
              {st !== 'saltata' && st !== 'visitata' && (
                <button className="btn btn-small" onClick={() => mark(s.id, s.name, 'saltata')}>
                  Salta
                </button>
              )}
              {st !== 'pianificata' && (
                <button className="btn btn-small" onClick={() => mark(s.id, s.name, undefined)}>
                  Riporta a pianificata
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function TravelMap() {
  const { trip } = useTrip();
  const [near, setNear] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string>();
  // Il permesso GPS si chiede solo qui, quando lo si richiede con il pulsante
  const locate = () => {
    if (!navigator.geolocation) {
      setNear('Posizione non disponibile su questo dispositivo.');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy(false);
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        const best = trip.stops.map((s) => ({ s, km: airKm(here, s) })).sort((a, b) => a.km - b.km)[0];
        if (best) setSelected(best.s.id);
        setNear(best ? `Tappa più vicina: ${best.s.name}, circa ${Math.round(best.km)} km in linea d'aria (non è la distanza stradale).` : 'Nessuna tappa nel percorso.');
      },
      () => {
        setBusy(false);
        setNear('Posizione non disponibile: permesso negato o segnale assente. Puoi usare la lista qui sotto.');
      },
      { timeout: 10_000 },
    );
  };
  return (
    <div className="t-map">
      <MapView trip={{ ...trip, settings: { ...trip.settings, showCatalogOnMap: false } }} height={320} selectedStopId={selected} onSelectStop={setSelected} />
      <div className="t-actions">
        <button className="btn" disabled={busy} onClick={locate}>
          <Icon name="pin" /> {busy ? 'Cerco la posizione…' : 'Trova la tappa più vicina'}
        </button>
      </div>
      {near && <p className="small" role="status">{near}</p>}
      <h2>Le tappe in elenco</h2>
      <p className="muted small">L'elenco funziona anche senza mappa o senza rete.</p>
      <TravelItinerary />
    </div>
  );
}

// ---------- Diario ----------

/** File non salvati: restano qui finché la pagina è aperta, per poter riprovare. */
const failedFiles = new Map<string, File>();

function DiaryComposer({ dayDate, stop, onDone }: { dayDate?: string; stop?: { id: string; name: string }; onDone?: () => void }) {
  const { trip, update, toast } = useTrip();
  const days = useMemo(() => computeDays(trip), [trip]);
  const [text, setText] = useState('');
  const [day, setDay] = useState(dayDate ?? '');
  const [stopId, setStopId] = useState(stop?.id ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    if (!text.trim() && files.length === 0) return;
    const s = trip.stops.find((x) => x.id === stopId) ?? (stop?.id === stopId ? stop : undefined);
    const entry = newDiaryEntry({ text: text.trim(), dayDate: day || undefined, stop: s ? { id: s.id, name: s.name } : undefined });
    const attachments = await Promise.all(files.map(saveFile));
    if (attachments.length) entry.attachments = attachments;
    update((t) => addDiaryEntry(t, entry), { immediate: true });
    setText('');
    setFiles([]);
    if (fileRef.current) fileRef.current.value = '';
    toast(attachments.some((a) => a.state === 'errore') ? 'Voce salvata, ma un allegato non è stato salvato: puoi riprovare' : 'Voce salvata nel diario', attachments.some((a) => a.state === 'errore') ? 'errore' : 'ok');
    onDone?.();
  };

  return (
    <div className="diary-form">
      <Field label="Cosa vuoi ricordare?">{(id) => <textarea id={id} rows={3} value={text} onChange={(e) => setText(e.target.value)} />}</Field>
      <div className="grid-2">
        <Field label="Giornata (facoltativa)">
          {(id) => (
            <select id={id} value={day} onChange={(e) => setDay(e.target.value)}>
              <option value="">Nessuna</option>
              {days.map((d) => (
                <option key={d.index} value={d.date}>
                  Giorno {d.index + 1} · {formatDateIt(d.date)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Tappa (facoltativa)">
          {(id) => (
            <select id={id} value={stopId} onChange={(e) => setStopId(e.target.value)}>
              <option value="">Nessuna</option>
              {trip.stops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <Field label="Allegati (facoltativi)" hint="Restano solo su questo dispositivo">
        {(id) => <input id={id} ref={fileRef} type="file" multiple onChange={(e) => setFiles([...(e.target.files ?? [])])} />}
      </Field>
      <button className="btn btn-primary" disabled={!text.trim() && files.length === 0} onClick={() => void save()}>
        Salva nel diario
      </button>
    </div>
  );
}

async function saveFile(f: File): Promise<DiaryAttachment> {
  const a: DiaryAttachment = { id: newId(), name: f.name, type: f.type, size: f.size, state: 'solo_dispositivo' };
  try {
    await putBlob(a.id, f);
    return a;
  } catch (e) {
    failedFiles.set(a.id, f);
    return { ...a, state: 'errore', error: (e as Error).message };
  }
}

function Attachment({ a, entry }: { a: DiaryAttachment; entry: DiaryEntry }) {
  const { update } = useTrip();
  const [url, setUrl] = useState<string>();
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (a.state !== 'solo_dispositivo') return;
    let u: string | undefined;
    let live = true;
    getBlob(a.id)
      .then((b) => {
        if (!live) return;
        if (!b) setMissing(true);
        else {
          u = URL.createObjectURL(b);
          setUrl(u);
        }
      })
      .catch(() => live && setMissing(true));
    return () => {
      live = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [a.id, a.state]);
  const retry = async () => {
    const f = failedFiles.get(a.id);
    if (!f) return;
    const patch = (state: DiaryAttachment['state'], error?: string) => update((t) => editDiaryEntry(t, entry.id, { attachments: (entry.attachments ?? []).map((x) => (x.id === a.id ? { ...x, state, error } : x)) }), { immediate: true });
    try {
      await putBlob(a.id, f);
      failedFiles.delete(a.id);
      patch('solo_dispositivo');
    } catch (e) {
      patch('errore', (e as Error).message);
    }
  };
  if (a.state === 'errore') {
    return (
      <li className="small">
        <Icon name="clip" /> {a.name}: <span className="warn-text">non salvato</span>{' '}
        {failedFiles.has(a.id) ? (
          <button className="btn btn-small" onClick={() => void retry()}>
            Riprova
          </button>
        ) : (
          'allega di nuovo il file'
        )}
      </li>
    );
  }
  return (
    <li className="small">
      {url && a.type.startsWith('image/') && <img className="diary-img" src={url} alt={a.name} />}
      <Icon name="clip" /> {url ? <a href={url} download={a.name}>{a.name}</a> : a.name}
      <span className="muted"> · {missing ? 'file non presente su questo dispositivo' : 'solo su questo dispositivo'}</span>
    </li>
  );
}

export function DiaryScreen() {
  const { trip, update, toast } = useTrip();
  const [filter, setFilter] = useState('');
  const entries = useMemo(() => visibleDiary(trip, { stopId: filter || undefined }), [trip, filter]);
  const [editing, setEditing] = useState<string>();
  const [draft, setDraft] = useState('');
  const stopsWithEntries = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of visibleDiary(trip)) if (e.stopId) seen.set(e.stopId, e.stopName ?? '');
    return [...seen];
  }, [trip]);
  return (
    <div className="diary">
      <section className="t-card">
        <h1>Diario</h1>
        <DiaryComposer />
      </section>
      {stopsWithEntries.length > 0 && (
        <Field label="Mostra">
          {(id) => (
            <select id={id} value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Tutte le voci</option>
              {stopsWithEntries.map(([stopId, name]) => (
                <option key={stopId} value={stopId}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}
      {entries.length === 0 ? (
        <p className="muted">Nessuna voce.</p>
      ) : (
        <ul className="diary-list">
          {entries.map((e) => (
            <li key={e.id} className="t-card">
              <p className="small muted">
                {fmtDateTime(e.createdAt)}
                {e.dayDate ? ` · ${formatDateIt(e.dayDate)}` : ''}
                {e.stopName ? ` · ${e.stopName}` : ''}
              </p>
              {editing === e.id ? (
                <>
                  <textarea aria-label="Testo della voce" rows={3} value={draft} onChange={(x) => setDraft(x.target.value)} />
                  <div className="t-actions">
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => {
                        update((t) => editDiaryEntry(t, e.id, { text: draft }), { immediate: true });
                        setEditing(undefined);
                      }}
                    >
                      Salva
                    </button>
                    <button className="btn btn-small" onClick={() => setEditing(undefined)}>
                      Annulla
                    </button>
                  </div>
                </>
              ) : (
                <p className="diary-text">{e.text}</p>
              )}
              {(e.attachments?.length ?? 0) > 0 && (
                <ul className="diary-files">
                  {e.attachments!.map((a) => (
                    <Attachment key={a.id} a={a} entry={e} />
                  ))}
                </ul>
              )}
              {editing !== e.id && (
                <div className="t-actions">
                  <button
                    className="btn btn-small"
                    onClick={() => {
                      setDraft(e.text);
                      setEditing(e.id);
                    }}
                  >
                    Modifica
                  </button>
                  <button
                    className="btn btn-small danger"
                    onClick={() => {
                      if (window.confirm('Eliminare questa voce del diario?')) {
                        update((t) => removeDiaryEntry(t, e.id), { immediate: true });
                        for (const a of e.attachments ?? []) void deleteBlob(a.id).catch(() => undefined);
                        toast('Voce eliminata');
                      }
                    }}
                  >
                    Elimina
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const MORE_LINKS: [string, IconName, string][] = [
  ['#/panoramica', 'mountain', 'Il viaggio'],
  ['#/itinerario', 'route', 'Tappe e mappa'],
  ['#/giornate', 'calendar', 'Giorno per giorno'],
  ['#/voli', 'plane', 'Voli'],
  ['#/crociere', 'ship', 'Crociere'],
  ['#/hytte', 'bed', 'Alloggi'],
  ['#/budget', 'wallet', 'Budget'],
  ['#/scenari', 'scale', 'Versioni e piano B'],
  ['#/impostazioni', 'gear', 'Impostazioni, salvataggio e backup'],
];

export function MoreScreen() {
  const { setMode } = useAppMode();
  return (
    <div className="more">
      <h1>Altro</h1>
      <ul className="more-links">
        {MORE_LINKS.map(([href, icon, label]) => (
          <li key={href}>
            <a href={href}>
              <Icon name={icon} /> {label}
            </a>
          </li>
        ))}
      </ul>
      <button
        className="btn"
        onClick={() => {
          setMode('planning');
          window.location.hash = '#/pianifica';
        }}
      >
        Passa alla pianificazione
      </button>
    </div>
  );
}
