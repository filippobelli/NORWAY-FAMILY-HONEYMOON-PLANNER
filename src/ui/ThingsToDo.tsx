import { useEffect, useMemo, useState } from 'react';
import { SETTING_LABEL } from '../data/attractions';
import { CATEGORY_LABEL, findDestination } from '../data/destinations';
import { WIKI } from '../data/wiki';
import { googlePlaceUrl } from '../domain/googleMaps';
import { formatDateIt, formatDuration } from '../domain/itinerary';
import {
  addPersonalActivity,
  ATTRACTION_CATEGORY_LABEL,
  attractionsForStop,
  dayLoadChange,
  filterAttractions,
  missingInfo,
  planAttraction,
  plannedOf,
  removeIdea,
  saveIdea,
  stopThings,
  unplanActivity,
  type StopAttraction,
} from '../domain/thingsToDo';
import type { Category, Destination, Stop } from '../domain/types';
import { commonsImageUrl, fetchImageCredit, type ImageCredit } from '../services/wiki';
import { useTrip } from '../state/store';
import { Badge, Field } from './common';
import { Icon } from './icons';
import { Modal } from './PlacementDialog';

const KID_TEXT = { 1: 'Poco adatto ai piccoli', 2: 'Adatto con qualche accortezza', 3: 'Molto adatto ai bambini' } as const;
const hoursText = (h?: [number, number]) => (h ? (h[0] === h[1] ? `circa ${formatDuration(h[0] * 60)}` : `${formatDuration(h[0] * 60)}–${formatDuration(h[1] * 60)}`) : undefined);
const dateIt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Sezione «Cosa fare» nel dettaglio della tappa: riepilogo e due azioni distinte, catalogo e attività personale. */
export function StopThingsSection({ stop, onSelectDay }: { stop: Stop; onSelectDay: (dayKey: string) => void }) {
  const { trip, update, toast } = useTrip();
  const t = useMemo(() => stopThings(trip, stop.id), [trip, stop.id]);
  const [exploring, setExploring] = useState(false);
  const [personal, setPersonal] = useState(false);
  const [title, setTitle] = useState('');
  const [day, setDay] = useState('');
  const dayKey = day || t.days[0]?.key || '';
  return (
    <section className="things" aria-labelledby={`things-${stop.id}`}>
      {exploring && <AttractionsDrawer stopId={stop.id} onClose={() => setExploring(false)} />}
      <h3 id={`things-${stop.id}`}>Cosa fare a {stop.name}</h3>
      <p className="small muted">
        {t.ideas.length} {t.ideas.length === 1 ? 'idea da valutare' : 'idee da valutare'} · {t.planned.length} {t.planned.length === 1 ? 'visita pianificata' : 'visite pianificate'}
        {t.personal.length > 0 && ` · ${t.personal.length} ${t.personal.length === 1 ? 'attività personale' : 'attività personali'}`}
      </p>
      <div className="things-actions">
        <div>
          <button type="button" className="btn btn-primary" onClick={() => setExploring(true)}>
            Esplora musei e attrazioni
          </button>
          <p className="small muted">Schede di luoghi con fonte e data di verifica: le salvi come idee o le pianifichi in un giorno.</p>
        </div>
        <div>
          <button type="button" className="btn" aria-expanded={personal} onClick={() => setPersonal((v) => !v)} disabled={t.days.length === 0}>
            Aggiungi un'attività personale
          </button>
          <p className="small muted">Per idee vostre che non trovi nel catalogo, come tempo libero, una cena o una visita a familiari.</p>
        </div>
      </div>
      {personal && t.days.length > 0 && (
        <div className="things-personal">
          <div className="grid-2">
            <Field label="Attività personale">{(id) => <input id={id} value={title} placeholder="Es. pomeriggio di riposo" onChange={(e) => setTitle(e.target.value)} />}</Field>
            <Field label="Giornata">
              {(id) => (
                <select id={id} value={dayKey} onChange={(e) => setDay(e.target.value)}>
                  {t.days.map((d) => (
                    <option key={d.key} value={d.key}>
                      Giorno {d.index + 1} · {formatDateIt(d.date)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <button
            type="button"
            className="btn btn-small btn-primary"
            disabled={!title.trim()}
            onClick={() => {
              update((tr) => addPersonalActivity(tr, dayKey, title));
              toast(`«${title.trim()}» aggiunta al giorno: è un'attività personale, senza scheda del catalogo`);
              setTitle('');
              setPersonal(false);
            }}
          >
            Aggiungi al giorno
          </button>
        </div>
      )}
      {t.days.length === 0 && <p className="small muted">Tappa di passaggio, senza giornate: puoi salvare idee, non pianificarle qui.</p>}
      {t.planned.length > 0 && (
        <>
          <h4>Pianificate</h4>
          <ul className="things-list">
            {t.planned.slice(0, 2).map((p) => (
              <li key={p.activity.id}>
                <span>
                  <strong>{p.activity.title}</strong> <span className="small muted">· Giorno {p.day.index + 1}, {formatDateIt(p.day.date)}</span>
                </span>
                <button type="button" className="link-btn small" onClick={() => onSelectDay(p.day.key)}>
                  Apri il giorno
                </button>
              </li>
            ))}
          </ul>
          {t.planned.length > 2 && <p className="small muted">e altre {t.planned.length - 2}: le trovi nelle giornate.</p>}
        </>
      )}
      {t.ideas.length > 0 && (
        <>
          <h4>Idee da valutare</h4>
          <ul className="things-list">
            {t.ideas.slice(0, 3).map((d) => (
              <li key={d.id}>
                <span>
                  <strong>{d.name}</strong> <span className="small muted">· salvata, non pianificata</span>
                </span>
                <button
                  type="button"
                  className="link-btn small"
                  onClick={() => {
                    update((tr) => removeIdea(tr, stop.id, d.id));
                    toast(`${d.name} tolta dalle idee`);
                  }}
                >
                  Togli
                </button>
              </li>
            ))}
          </ul>
          {t.ideas.length > 3 && (
            <button type="button" className="link-btn small" onClick={() => setExploring(true)}>
              Vedi tutte le idee ({t.ideas.length})
            </button>
          )}
        </>
      )}
    </section>
  );
}

type Flags = { indoor: boolean; kids: boolean; inCity: boolean };

/** Catalogo collegato alla tappa: pannello laterale su computer, a tutto schermo sul telefono. */
export function AttractionsDrawer({ stopId, onClose }: { stopId: string; onClose: () => void }) {
  const { trip } = useTrip();
  const stop = trip.stops.find((s) => s.id === stopId);
  const all = useMemo(() => attractionsForStop(trip, stopId), [trip, stopId]);
  const things = useMemo(() => stopThings(trip, stopId), [trip, stopId]);
  const [q, setQ] = useState('');
  const [cats, setCats] = useState<Category[]>([]);
  const [flags, setFlags] = useState<Flags>({ indoor: false, kids: false, inCity: false });
  const [onlyIdeas, setOnlyIdeas] = useState(false);
  const ideaIds = new Set(things.ideas.map((d) => d.id));
  const shown = filterAttractions(all, { q, categories: cats, ...flags }).filter((a) => !onlyIdeas || ideaIds.has(a.d.id));
  const presentCats = [...new Set(all.map((a) => a.d.category))];
  const anyIndoor = all.some((a) => a.info?.setting);
  const filtered = Boolean(q.trim() || cats.length || flags.indoor || flags.kids || flags.inCity || onlyIdeas);
  const reset = () => {
    setQ('');
    setCats([]);
    setFlags({ indoor: false, kids: false, inCity: false });
    setOnlyIdeas(false);
  };
  if (!stop) return null;
  const first = things.days[0];
  const last = things.days[things.days.length - 1];
  return (
    <Modal title={`Cosa fare a ${stop.name}`} className="drawer things-drawer" onClose={onClose}>
      <p className="small things-context">
        {first && last ? `${formatDateIt(first.date)} → ${formatDateIt(last.date)} · ${things.days.length} ${things.days.length === 1 ? 'giornata' : 'giornate'}` : 'Tappa di passaggio, senza giornate'} · {things.ideas.length} idee ·{' '}
        {things.planned.length} pianificate
      </p>
      <div className="things-filters" role="search">
        <Field label="Cerca per nome o descrizione">{(id) => <input id={id} type="search" value={q} placeholder="Es. museo, nave, sculture" onChange={(e) => setQ(e.target.value)} />}</Field>
        <fieldset className="chips-field">
          <legend>Categorie</legend>
          <div className="chips">
            {presentCats.map((c) => (
              <label key={c} className={`chip ${cats.includes(c) ? 'on' : ''}`}>
                <input type="checkbox" checked={cats.includes(c)} onChange={(e) => setCats(e.target.checked ? [...cats, c] : cats.filter((x) => x !== c))} /> {ATTRACTION_CATEGORY_LABEL[c] ?? CATEGORY_LABEL[c]}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="chips-field">
          <legend>Filtri</legend>
          <div className="chips">
            {anyIndoor && (
              <label className={`chip ${flags.indoor ? 'on' : ''}`}>
                <input type="checkbox" checked={flags.indoor} onChange={(e) => setFlags({ ...flags, indoor: e.target.checked })} /> Al coperto (se indicato)
              </label>
            )}
            <label className={`chip ${flags.kids ? 'on' : ''}`}>
              <input type="checkbox" checked={flags.kids} onChange={(e) => setFlags({ ...flags, kids: e.target.checked })} /> Molto adatti ai bambini
            </label>
            <label className={`chip ${flags.inCity ? 'on' : ''}`}>
              <input type="checkbox" checked={flags.inCity} onChange={(e) => setFlags({ ...flags, inCity: e.target.checked })} /> Solo in città
            </label>
            {things.ideas.length > 0 && (
              <label className={`chip ${onlyIdeas ? 'on' : ''}`}>
                <input type="checkbox" checked={onlyIdeas} onChange={(e) => setOnlyIdeas(e.target.checked)} /> Solo le idee salvate
              </label>
            )}
          </div>
        </fieldset>
        <p className="row wrap things-count">
          <span role="status" aria-live="polite">
            {shown.length} {shown.length === 1 ? 'luogo' : 'luoghi'}
            {filtered ? ` su ${all.length}` : ''}
          </span>
          {filtered && (
            <button type="button" className="link-btn small" onClick={reset}>
              Azzera ricerca e filtri
            </button>
          )}
        </p>
      </div>
      {all.length === 0 ? (
        <p className="empty">Nessun luogo del catalogo vicino a {stop.name}. Puoi aggiungere un'attività personale dalla tappa.</p>
      ) : shown.length === 0 ? (
        <p className="empty">
          Nessun luogo con questa ricerca.{' '}
          <button type="button" className="link-btn" onClick={reset}>
            Azzera ricerca e filtri
          </button>
        </p>
      ) : (
        <ul className="things-results">
          {shown.map((a) => (
            <AttractionCard key={a.d.id} a={a} stop={stop} isIdea={ideaIds.has(a.d.id)} />
          ))}
        </ul>
      )}
      <p className="small muted">
        «Molto adatti ai bambini» è una valutazione editoriale dell'app, non di una fonte. Distanze in linea d'aria dal centro della tappa, non stradali. Orari e prezzi non sono riportati: controllali sul
        sito ufficiale prima della visita.
      </p>
    </Modal>
  );
}

function AttractionCard({ a, stop, isIdea }: { a: StopAttraction; stop: Stop; isIdea: boolean }) {
  const { trip, update, toast } = useTrip();
  const [open, setOpen] = useState(false);
  const [planning, setPlanning] = useState(false);
  const planned = plannedOf(trip, stop.id, a.d.id);
  const days = stopThings(trip, stop.id).days;
  const [day, setDay] = useState(planned?.day.key ?? days[0]?.key ?? '');
  const draft = useMemo(() => (day ? planAttraction(trip, stop.id, a.d.id, day) : trip), [trip, stop.id, a.d.id, day]);
  const load = day ? dayLoadChange(trip, draft, day) : {};
  const id = `attr-${a.d.id}`;
  const duration = hoursText(a.d.visitHours);
  const chosenDay = days.find((d) => d.key === day);
  return (
    <li className={`attr ${a.info ? '' : 'is-unverified'}`} aria-labelledby={`${id}-name`}>
      <div className="attr-head">
        <div>
          <h3 id={`${id}-name`}>{a.d.name}</h3>
          <p className="small muted">
            {ATTRACTION_CATEGORY_LABEL[a.d.category] ?? CATEGORY_LABEL[a.d.category]}
            {a.info?.area ? ` · ${a.info.area}` : ''}
          </p>
        </div>
        <span className="attr-status">
          {planned ? (
            <Badge tone="ok">
              <Icon name="calendar" /> Pianificata: giorno {planned.day.index + 1}
            </Badge>
          ) : isIdea ? (
            <Badge tone="info">
              <Icon name="star" /> Salvata tra le idee
            </Badge>
          ) : null}
        </span>
      </div>
      <p className="attr-desc">{a.d.description}</p>
      <ul className="attr-facts small">
        {duration && <li>Durata indicativa: {duration}</li>}
        <li>{KID_TEXT[a.d.kidScore]} (valutazione editoriale)</li>
        {a.info?.setting && <li>{SETTING_LABEL[a.info.setting]}</li>}
        <li className={a.outside ? 'warn-text' : ''}>
          {a.info?.outside ? a.info.outside.note : `${a.outside ? 'Fuori città: ' : ''}circa ${a.km.toLocaleString('it-IT')} km in linea d'aria dal centro di ${stop.name}`}
        </li>
        {a.info ? (
          <li>
            Prenotazione: {a.info.booking.note} <span className="muted">(letto il {dateIt(a.info.checkedAt)}, da ricontrollare)</span>
          </li>
        ) : (
          <li>Scheda non ancora verificata sulle fonti ufficiali: prenotazione, orari e prezzi da verificare.</li>
        )}
        {a.info?.seasonal && <li>{a.info.seasonal}</li>}
      </ul>
      <div className="attr-actions">
        <button type="button" className="btn btn-small" aria-expanded={open} aria-controls={`${id}-more`} onClick={() => setOpen((v) => !v)}>
          {open ? 'Meno dettagli' : 'Dettagli e fonti'}
        </button>
        {!planned &&
          (isIdea ? (
            <button
              type="button"
              className="btn btn-small"
              onClick={() => {
                update((t) => removeIdea(t, stop.id, a.d.id));
                toast(`${a.d.name} tolta dalle idee`);
              }}
            >
              Togli dalle idee
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-small"
              onClick={() => {
                update((t) => saveIdea(t, stop.id, a.d.id));
                toast(`${a.d.name} salvata tra le idee: il programma non è cambiato`);
              }}
            >
              Salva tra le idee
            </button>
          ))}
        {days.length > 0 && (
          <button type="button" className="btn btn-small btn-primary" aria-expanded={planning} onClick={() => setPlanning((v) => !v)}>
            {planned ? 'Cambia giornata' : 'Pianifica nella giornata'}
          </button>
        )}
        {planned && (
          <button
            type="button"
            className="btn btn-small"
            onClick={() => {
              update((t) => unplanActivity(t, stop.id, planned.activity.id));
              toast(`${a.d.name} tolta dal giorno ${planned.day.index + 1}: resta tra le idee`);
            }}
          >
            Rimuovi dal giorno
          </button>
        )}
      </div>
      {planning && days.length > 0 && (
        <div className="attr-plan" role="group" aria-label={`Pianifica ${a.d.name}`}>
          <fieldset>
            <legend className="small">Giornate a {stop.name}</legend>
            {days.map((d) => (
              <label key={d.key} className="check small">
                <input type="radio" name={`${id}-day`} checked={day === d.key} onChange={() => setDay(d.key)} /> Giorno {d.index + 1} · {formatDateIt(d.date)}
 · {trip.days[d.key]?.activities.length ?? 0} attività
              </label>
            ))}
          </fieldset>
          {chosenDay && (
            <p className="small">
              Carico del giorno {chosenDay.index + 1}: {load.before ?? '—'}% → {load.after ?? '—'}%{load.levelAfter === 'eccessiva' ? ' · diventerebbe troppo carico' : ''}. Durata usata: {duration ?? 'non disponibile'}.
              <span className="block muted">Da sapere: {missingInfo(a).join('; ')}.</span>
            </p>
          )}
          <div className="row wrap">
            <button
              type="button"
              className="btn btn-small btn-primary"
              disabled={!chosenDay || planned?.day.key === day}
              onClick={() => {
                update(() => draft);
                toast(`${a.d.name} pianificata nel giorno ${chosenDay!.index + 1}. Non è una prenotazione.`);
                setPlanning(false);
              }}
            >
              {planned?.day.key === day ? 'Già in questo giorno' : `Conferma: pianifica nel giorno ${chosenDay ? chosenDay.index + 1 : ''}`}
            </button>
            <button type="button" className="btn btn-small btn-ghost" onClick={() => setPlanning(false)}>
              Annulla
            </button>
          </div>
        </div>
      )}
      {open && <AttractionDetails id={`${id}-more`} d={a.d} a={a} />}
    </li>
  );
}

/** Dettagli: posizione, fonti con data e foto solo con autore e licenza letti da Wikimedia Commons. */
export function AttractionDetails({ id, d, a }: { id?: string; d: Destination; a?: StopAttraction }) {
  const wiki = WIKI[d.id];
  const [credit, setCredit] = useState<ImageCredit | undefined>();
  const [photo, setPhoto] = useState<'idle' | 'ok' | 'no'>('idle');
  useEffect(() => {
    if (!wiki?.image) return;
    const ac = new AbortController();
    fetchImageCredit(wiki.image, ac.signal)
      .then((c) => {
        setCredit(c);
        setPhoto(/da verificare/.test(c.license) ? 'no' : 'ok');
      })
      .catch(() => setPhoto('no'));
    return () => ac.abort();
  }, [wiki?.image]);
  const info = a?.info;
  return (
    <div id={id} className="attr-more">
      {wiki?.image && photo === 'ok' && credit ? (
        <figure className="attr-photo">
          <img src={commonsImageUrl(wiki.image, 640)} alt={`Foto: ${d.name}`} loading="lazy" onError={() => setPhoto('no')} />
          <figcaption className="small muted">
            Foto: {credit.author} ·{' '}
            {credit.licenseUrl ? (
              <a href={credit.licenseUrl} target="_blank" rel="noreferrer">
                {credit.license}
              </a>
            ) : (
              credit.license
            )}{' '}
            ·{' '}
            <a href={credit.pageUrl} target="_blank" rel="noreferrer">
              Wikimedia Commons
            </a>
          </figcaption>
        </figure>
      ) : (
        <div className="attr-photo-placeholder small muted" aria-hidden={photo === 'idle'}>
          <Icon name="building" /> {photo === 'idle' && wiki?.image ? 'Foto in caricamento (serve la rete)…' : 'Nessuna foto con licenza verificata'}
        </div>
      )}
      <ul className="small">
        {info?.address && <li>Indirizzo: {info.address}</li>}
        <li>
          Coordinate: {d.lat.toFixed(5)}, {d.lng.toFixed(5)} {d.coordsStatus === 'verificate' ? '(verificate)' : '(approssimative)'} ·{' '}
          <a href={googlePlaceUrl(d)} target="_blank" rel="noreferrer">
            Indicazioni su Google Maps ↗
          </a>
        </li>
        {d.officialUrl && (
          <li>
            <a href={d.officialUrl} target="_blank" rel="noreferrer">
              Sito ufficiale ↗
            </a>{' '}
            {info?.hoursPublished && <span className="muted">· orari pubblicati lì, non riportati qui</span>}
          </li>
        )}
        {d.augustNote && <li>{d.augustNote}</li>}
      </ul>
      <p className="small">
        <strong>Fonti</strong>
      </p>
      <ul className="small">
        {(info?.sources ?? d.sources).map((s) => (
          <li key={s.label + s.url}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ) : (
              s.label
            )}
            {s.checkedAt && ` · controllata il ${dateIt(s.checkedAt.slice(0, 10))}`}
          </li>
        ))}
        {!info && d.sources.length === 0 && <li>Nessuna fonte registrata: scheda da verificare.</li>}
        <li className="muted">Descrizione scritta per l'app, non copiata da altre fonti.</li>
      </ul>
    </div>
  );
}

/** Dettagli di un'attività del giorno collegata a una scheda, per Giornate e Oggi. */
export function ActivityPlaceLinks({ destinationId }: { destinationId: string }) {
  const d = findDestination(destinationId);
  const [open, setOpen] = useState(false);
  if (!d) return null;
  return (
    <span className="activity-place">
      <button type="button" className="link-btn small" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? 'Chiudi la scheda' : 'Scheda del luogo'}
      </button>{' '}
      <a className="small" href={googlePlaceUrl(d)} target="_blank" rel="noreferrer">
        Indicazioni ↗
      </a>
      {open && <AttractionDetails d={d} />}
    </span>
  );
}
