import { CatalogVersionNote } from './Countries';
import { countryInfo, placeCountry, useCatalog } from '../catalog/registry';
import { REGION_COUNTIES } from '../data/regionShapes';
import { airKm } from '../domain/configurator';
import { tripCountries } from '../domain/countries';
import { formatDateIt } from '../domain/itinerary';
import { ALONG_KM, dayLoadChange, hasRouteTrack, NEAR_KM, planAttraction, plannedOf, routeDistanceKm, stopDays } from '../domain/thingsToDo';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_LABEL, DESTINATIONS } from '../data/destinations';
import { WIKI } from '../data/wiki';
import type { Category, Destination, Region, Stop } from '../domain/types';
import { commonsImageUrl, fetchImageCredit, fetchWikiIntro, type ImageCredit, type WikiIntro } from '../services/wiki';
import { useTrip } from '../state/store';
import { Badge, Field } from './common';
import { Icon, type IconName } from './icons';
import { stopFromDestination } from './ItineraryView';
import { OfficialLink } from './OfficialLink';
import { Modal, StopDialog } from './PlacementDialog';

const KID_LABEL = { 1: 'Poco adatto ai piccoli', 2: 'Adatto con accortezze', 3: 'Molto adatto ai bambini' } as const;

// Ricerca e filtri del catalogo: restano gli stessi tra il pannello dell'Itinerario e la pagina intera, e al ritorno
// (sessione del browser: sono contesto di lavoro di questa scheda, non dati del viaggio)
const FILTERS_KEY = 'nfhp.catalog.filters';
interface CatalogFilters {
  q: string;
  cat: Category | '';
  region: Region | '';
  kids: boolean;
  onlyFav: boolean;
  nation: string;
  /** '' ovunque, 'percorso' lungo il tracciato, altrimenti l'id della tappa vicino a cui cercare */
  where: string;
}
const NO_FILTERS: CatalogFilters = { q: '', cat: '', region: '', kids: false, onlyFav: false, nation: '', where: '' };
function loadFilters(): CatalogFilters {
  try {
    return { ...NO_FILTERS, ...(JSON.parse(sessionStorage.getItem(FILTERS_KEY) ?? '{}') as Partial<CatalogFilters>) };
  } catch {
    return NO_FILTERS;
  }
}

export function CatalogView() {
  const { trip, update } = useTrip();
  const [saved] = useState(loadFilters);
  const [q, setQ] = useState(saved.q);
  const [cat, setCat] = useState<Category | ''>(saved.cat);
  const [region, setRegion] = useState<Region | ''>(saved.region);
  const [kids, setKids] = useState(saved.kids);
  const [onlyFav, setOnlyFav] = useState(saved.onlyFav);
  const [openId, setOpenId] = useState<string | null>(null);
  const [nation, setNation] = useState(saved.nation);
  const [whereRaw, setWhere] = useState(saved.where);
  const hasTrack = useMemo(() => hasRouteTrack(trip), [trip]);
  // Un filtro salvato che non vale più (tappa tolta, tracciato assente) torna a «ovunque»
  const where = whereRaw === 'percorso' ? (hasTrack ? whereRaw : '') : trip.stops.some((s) => s.id === whereRaw) ? whereRaw : '';
  const whereStop = trip.stops.find((s) => s.id === where);
  useEffect(() => {
    try {
      sessionStorage.setItem(FILTERS_KEY, JSON.stringify({ q, cat, region, kids, onlyFav, nation, where }));
    } catch {
      /* senza sessionStorage i filtri valgono solo finché la schermata resta aperta */
    }
  }, [q, cat, region, kids, onlyFav, nation, where]);
  const filtered = Boolean(q.trim() || cat || region || kids || onlyFav || nation || where);
  const resetFilters = () => {
    setQ('');
    setCat('');
    setRegion('');
    setKids(false);
    setOnlyFav(false);
    setNation('');
    setWhere('');
  };
  const [visiting, setVisiting] = useState<Destination | null>(null);
  const catalog = useCatalog();
  const countries = tripCountries(trip);
  // Filtro e gruppi per nazione solo con due o più nazioni nel viaggio (design §5)
  const multi = countries.length > 1;
  const nameOf = (code: string) => countryInfo(code)?.name ?? code;
  // Regioni del catalogo in uso (per nazione e versione), non un elenco fisso
  const regions = Object.keys(REGION_COUNTIES).filter((r) => !nation || catalog.regionCountry[r] === nation);

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return DESTINATIONS.filter(
      (d) =>
        (!qq || `${d.name} ${d.localName ?? ''} ${d.description}`.toLowerCase().includes(qq)) &&
        (!cat || d.category === cat) &&
        (!region || d.region === region) &&
        (!nation || placeCountry(d.id) === nation) &&
        (!kids || d.kidScore === 3) &&
        (!onlyFav || trip.favorites.includes(d.id)) &&
        (where !== 'percorso' || (routeDistanceKm(trip, d) ?? Infinity) <= ALONG_KM) &&
        (!whereStop || airKm(whereStop, d) <= NEAR_KM),
    );
    // trip.legs e trip.stops: il filtro per posizione dipende da tracciato e tappe
  }, [q, cat, region, nation, kids, onlyFav, trip, where, whereStop]);
  const byCountry = countries.map((c) => ({ code: c.code, items: list.filter((d) => placeCountry(d.id) === c.code) }));

  const inTrip = new Set(trip.stops.map((s) => s.destinationId));
  const [placing, setPlacing] = useState<Stop | null>(null);

  return (
    <div className="catalog">
      {placing && <StopDialog stop={placing} onClose={() => setPlacing(null)} />}
      {visiting && <VisitDialog d={visiting} onClose={() => setVisiting(null)} />}
      <div className="note-info">
        <CatalogVersionNote />
        {DESTINATIONS.length} luoghi. Coordinate verificate su OpenStreetMap per {DESTINATIONS.filter((d) => d.coordsStatus === 'verificate').length}{' '}
        schede (27/10/2026); le altre sono approssimative. Descrizioni, durate, idoneità per bambini e stagionalità sono <strong>da verificare</strong>{' '}
        sulle fonti ufficiali; prezzi e orari non sono inseriti di proposito.
      </div>
      <div className="filters">
        <input type="search" placeholder="Cerca…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cerca nel catalogo" />
        {multi && (
          <select
            value={nation}
            onChange={(e) => {
              setNation(e.target.value);
              setRegion('');
            }}
            aria-label="Nazione"
          >
            <option value="">Tutte le nazioni</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {nameOf(c.code)}
              </option>
            ))}
          </select>
        )}
        <select value={cat} onChange={(e) => setCat(e.target.value as Category | '')} aria-label="Categoria">
          <option value="">Tutte le categorie</option>
          {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <select value={region} onChange={(e) => setRegion(e.target.value as Region | '')} aria-label="Regione">
          <option value="">Tutte le regioni</option>
          {multi && !nation
            ? countries.map((c) => (
                <optgroup key={c.code} label={nameOf(c.code)}>
                  {regions
                    .filter((r) => catalog.regionCountry[r] === c.code)
                    .map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                </optgroup>
              ))
            : regions.map((r) => <option key={r}>{r}</option>)}
        </select>
        {trip.stops.length > 0 && (
          <select value={where} onChange={(e) => setWhere(e.target.value)} aria-label="Posizione rispetto al viaggio">
            <option value="">Ovunque</option>
            {hasTrack && <option value="percorso">Lungo il percorso</option>}
            <optgroup label="Vicino alla tappa">
              {trip.stops
                .filter((s) => s.kind === 'luogo')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </optgroup>
          </select>
        )}
        <label className="check">
          <input type="checkbox" checked={kids} onChange={(e) => setKids(e.target.checked)} /> Molto adatte ai bambini
        </label>
        <label className="check">
          <input type="checkbox" checked={onlyFav} onChange={(e) => setOnlyFav(e.target.checked)} /> Solo preferiti
        </label>
      </div>
      <p className="muted small" role="status">
        {list.length} risultati{multi ? ` · ${byCountry.map((g) => `${nameOf(g.code)} ${g.items.length}`).join(', ')}` : ''}
        {filtered && (
          <>
            {' · '}
            <button type="button" className="link-btn" onClick={resetFilters}>
              Azzera filtri
            </button>
          </>
        )}
      </p>
      {where === 'percorso' && (
        <p className="small muted">
          Lungo il percorso: luoghi entro {ALONG_KM} km in linea d'aria dal tracciato dei tratti già calcolati. Il tempo di deviazione non è noto: per saperlo aggiungi il luogo come sosta e calcola il tratto.
          {trip.legs.some((l) => !l.segments.some((s) => (s.geometry?.length ?? 0) > 1)) && ' Alcuni tratti non hanno ancora un tracciato e non sono considerati.'}
        </p>
      )}
      {whereStop && (
        <p className="small muted">
          Vicino a {whereStop.name}: entro {NEAR_KM} km in linea d'aria dal centro della tappa, che non è la distanza stradale.
        </p>
      )}
      {list.length === 0 && (
        <div className="note-info">
          <p>Nessun luogo corrisponde a ricerca e filtri{onlyFav ? ' (stai guardando solo i preferiti)' : ''}.</p>
          <div className="row wrap">
            <button type="button" className="btn btn-small btn-primary" onClick={resetFilters}>
              Azzera filtri
            </button>
            {q.trim() && (cat || region || kids || onlyFav || nation) && (
              <button
                type="button"
                className="btn btn-small"
                onClick={() => {
                  const keep = q;
                  resetFilters();
                  setQ(keep);
                }}
              >
                Cerca «{q.trim()}» in tutto il catalogo
              </button>
            )}
          </div>
        </div>
      )}
      {(multi && !nation ? byCountry : [{ code: '', items: list }]).map((g) => (
        <section key={g.code || 'tutti'}>
          {g.code && (
            <h3 className="row wrap">
              {nameOf(g.code)}{' '}
              <span className="muted small">
                catalogo versione {countryInfo(g.code)?.version ?? '—'} · {countryInfo(g.code)?.placeCount ?? g.items.length} luoghi
              </span>
            </h3>
          )}
      <div className="cards catalog-cards">
        {g.items.map((d) => (
          <DestinationCard
            key={d.id}
            d={d}
            open={openId === d.id}
            onToggle={() => setOpenId((cur) => (cur === d.id ? null : d.id))}
            fav={trip.favorites.includes(d.id)}
            inTrip={inTrip.has(d.id)}
            onFav={() =>
              update((t) => ({ ...t, favorites: t.favorites.includes(d.id) ? t.favorites.filter((x) => x !== d.id) : [...t.favorites, d.id] }))
            }
            onAdd={(pass) => {
              const st = stopFromDestination(d.id);
              if (st) setPlacing(pass ? { ...st, nights: 0 } : st);
            }}
            onVisit={trip.stops.length > 0 ? () => setVisiting(d) : undefined}
          />
        ))}
      </div>
        </section>
      ))}
    </div>
  );
}

const CATEGORY_ICON: Record<Category, IconName> = {
  citta: 'building',
  fiordi: 'ship',
  natura: 'mountain',
  strade: 'route',
  isole: 'map',
  treni: 'train',
  fauna: 'pin',
  musei: 'building',
  parchi: 'star',
  stagionali: 'sparkle',
  aeroporti: 'plane',
};

function DestinationCard({
  d,
  open,
  onToggle,
  fav,
  inTrip,
  onFav,
  onAdd,
  onVisit,
}: {
  d: Destination;
  open: boolean;
  onToggle: () => void;
  fav: boolean;
  inTrip: boolean;
  onFav: () => void;
  /** pass = true: sosta lungo il percorso, senza notti */
  onAdd: (pass?: boolean) => void;
  /** Assente finché il viaggio non ha tappe */
  onVisit?: () => void;
}) {
  const wiki = WIKI[d.id];
  const [imgOk, setImgOk] = useState(true);
  const [intro, setIntro] = useState<WikiIntro | null | undefined>(undefined);
  const [credit, setCredit] = useState<ImageCredit | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const panelId = `dest-${d.id}`;

  // Testo e crediti si scaricano solo quando la scheda viene aperta
  useEffect(() => {
    if (!open || !wiki) return;
    const ac = new AbortController();
    setLoadError(false);
    fetchWikiIntro(wiki, ac.signal)
      .then((r) => setIntro(r ?? null))
      .catch((e: unknown) => {
        if ((e as Error).name !== 'AbortError') setLoadError(true);
      });
    if (wiki.image) {
      fetchImageCredit(wiki.image, ac.signal)
        .then(setCredit)
        .catch(() => undefined);
    }
    return () => ac.abort();
  }, [open, wiki]);

  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [open]);

  const photo =
    wiki?.image && imgOk ? (
      <img src={commonsImageUrl(wiki.image, open ? 960 : 500)} alt={`Foto: ${d.name}`} loading="lazy" decoding="async" onError={() => setImgOk(false)} />
    ) : (
      <div className={`photo-placeholder cat-${d.category}`} aria-hidden>
        <Icon name={CATEGORY_ICON[d.category]} />
      </div>
    );

  return (
    <article ref={ref} className={`card dest ${open ? 'dest-open' : ''}`}>
      <button type="button" className="dest-head" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        <span className="dest-photo">{photo}</span>
        <span className="dest-title">
          <span className="dest-name">{d.name}</span>
          <span className="muted small">
            {CATEGORY_LABEL[d.category]} · {d.region}
          </span>
        </span>
        <span className="dest-chevron" aria-hidden>
          {open ? '−' : '+'}
        </span>
      </button>
      <button
        type="button"
        className={`icon-btn fav dest-fav ${fav ? 'on' : ''}`}
        aria-pressed={fav}
        aria-label={fav ? `Togli ${d.name} dai preferiti` : `Aggiungi ${d.name} ai preferiti`}
        onClick={onFav}
      >
        <Icon name="star" filled={fav} />
      </button>
      {wiki?.image && imgOk && !open && <span className="photo-credit-mini">Foto Wikimedia Commons</span>}

      {open && (
        <div id={panelId} className="dest-body">
          {wiki?.image && imgOk && (
            <p className="photo-credit">
              Foto:{' '}
              {credit ? (
                <>
                  {credit.author} ·{' '}
                  {credit.licenseUrl ? (
                    <a href={credit.licenseUrl} target="_blank" rel="noreferrer">
                      {credit.license}
                    </a>
                  ) : (
                    credit.license
                  )}{' '}
                  ·{' '}
                </>
              ) : null}
              <a href={credit?.pageUrl ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(wiki.image)}`} target="_blank" rel="noreferrer">
                Wikimedia Commons ↗
              </a>
            </p>
          )}
          <div className="tags">
            <Badge tone={d.kidScore === 3 ? 'ok' : d.kidScore === 1 ? 'warn' : 'neutral'}>{KID_LABEL[d.kidScore]}</Badge>
            {d.localName && <Badge>{d.localName}</Badge>}
          </div>
          <p>{d.description}</p>
          {d.officialUrl && (
            <p>
              <OfficialLink id={d.id} />
            </p>
          )}
          {d.augustNote && <p className="note-warn small"><Icon name="warning" /> {d.augustNote}</p>}

          <section className="wiki-text" aria-live="polite">
            {!wiki && <p className="muted small">Nessuna voce enciclopedica collegata a questa scheda.</p>}
            {wiki && intro === undefined && !loadError && <p className="muted small">Caricamento della descrizione da Wikipedia…</p>}
            {loadError && <p className="error small">Wikipedia non raggiungibile in questo momento.</p>}
            {intro === null && <p className="muted small">Nessuna voce Wikipedia disponibile.</p>}
            {intro && (
              <>
                {intro.text.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
                <p className="muted small">
                  Testo da{' '}
                  <a href={intro.url} target="_blank" rel="noreferrer">
                    Wikipedia{intro.lang === 'en' ? ' in inglese' : ''}: “{intro.title}” ↗
                  </a>{' '}
                  · licenza CC BY-SA 4.0
                </p>
              </>
            )}
          </section>

          <dl className="facts">
            <dt>Come arrivare</dt>
            <dd>{d.access}</dd>
            <dt>Stagione</dt>
            <dd>{d.season}</dd>
            {d.visitHours && (
              <>
                <dt>Durata indicativa</dt>
                <dd>{d.visitHours[0] === d.visitHours[1] ? d.visitHours[0] : `${d.visitHours[0]}–${d.visitHours[1]}`} ore</dd>
              </>
            )}
            <dt>Difficoltà</dt>
            <dd>{d.difficulty}</dd>
          </dl>
          <footer>
            <span className="tags">
              <Badge tone={d.coordsStatus === 'verificate' ? 'ok' : 'warn'}>
                {d.coordsStatus === 'verificate' ? 'Posizione verificata' : 'Posizione approssimativa'}
              </Badge>
              <Badge tone="warn">Dati pratici da verificare</Badge>
              {d.sources[0]?.url && (
                <a className="small" href={d.sources[0].url} target="_blank" rel="noreferrer">
                  OSM ↗
                </a>
              )}
            </span>
            <span className="row wrap catalog-actions">
              <button className="btn btn-small btn-primary" disabled={d.id === 'aurora'} title={d.id === 'aurora' ? 'Non realistica ad agosto' : 'Una tappa con le sue notti'} onClick={() => onAdd(false)}>
                {inTrip ? 'Aggiungi di nuovo come tappa' : 'Aggiungi come tappa'}
              </button>
              <button className="btn btn-small" disabled={d.id === 'aurora'} title="Una fermata lungo il percorso, senza notti" onClick={() => onAdd(true)}>
                Inserisci come sosta
              </button>
              <button className="btn btn-small" disabled={!onVisit} title={onVisit ? 'Una visita in una giornata, senza cambiare tappe e notti' : 'Serve almeno una tappa nel percorso'} onClick={onVisit}>
                Pianifica come visita
              </button>
            </span>
          </footer>
        </div>
      )}
    </article>
  );
}

/** Pianifica un luogo del catalogo come visita in una giornata del viaggio, senza aggiungere una tappa. */
function VisitDialog({ d, onClose }: { d: Destination; onClose: () => void }) {
  const { trip, update, toast } = useTrip();
  // Tappe ordinate per distanza in linea d'aria dal luogo: è un criterio per scegliere, non una distanza stradale
  const options = useMemo(() => trip.stops.filter((s) => s.kind === 'luogo').map((s) => ({ s, km: Math.round(airKm(s, d)) })).sort((a, b) => a.km - b.km), [trip.stops, d]);
  const [stopId, setStopId] = useState(options[0]?.s.id ?? '');
  const days = useMemo(() => (stopId ? stopDays(trip, stopId) : []), [trip, stopId]);
  const [dayKey, setDayKey] = useState('');
  const day = days.find((x) => x.key === dayKey) ?? days[0];
  const stop = options.find((o) => o.s.id === stopId);
  const draft = useMemo(() => (day && stopId ? planAttraction(trip, stopId, d.id, day.key) : trip), [trip, stopId, d.id, day]);
  const load = day ? dayLoadChange(trip, draft, day.key) : {};
  const already = stopId ? plannedOf(trip, stopId, d.id) : undefined;
  return (
    <Modal title={`Pianifica come visita: ${d.name}`} onClose={onClose}>
      <p className="small" tabIndex={-1} data-autofocus>
        La visita entra in una giornata del viaggio: tappe, notti e date non cambiano.
      </p>
      <div className="grid-2">
        <Field label="Da quale tappa" hint="Distanze in linea d'aria, non stradali">
          {(id) => (
            <select
              id={id}
              value={stopId}
              onChange={(e) => {
                setStopId(e.target.value);
                setDayKey('');
              }}
            >
              {options.map((o) => (
                <option key={o.s.id} value={o.s.id}>
                  {o.s.name} · {o.km} km in linea d'aria{o.s.nights === 0 ? ' · di passaggio' : ''}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Giornata" hint={stop?.s.nights === 0 ? 'Sosta senza notti: è il giorno in cui passi di lì' : undefined}>
          {(id) => (
            <select id={id} value={day?.key ?? ''} onChange={(e) => setDayKey(e.target.value)} disabled={days.length === 0}>
              {days.map((x) => (
                <option key={x.key} value={x.key}>
                  Giorno {x.index + 1} · {formatDateIt(x.date)}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      {days.length === 0 ? (
        <p className="note-warn small">Questa tappa non ha una giornata in cui pianificare: è di passaggio e nessun trasferimento la raggiunge ancora.</p>
      ) : (
        <p className="small" role="status">
          {stop && stop.km > NEAR_KM && `${d.name} è a ${stop.km} km in linea d'aria da ${stop.s.name}: il tempo per arrivarci non è calcolato e non entra nel carico. `}
          {load.before !== undefined && load.after !== undefined
            ? `Carico della giornata: ${load.before}% → ${load.after}%${load.levelAfter ? ` (${load.levelAfter})` : ''}.`
            : 'Carico della giornata non disponibile.'}
          {already && already.day.key !== day?.key && ' È già pianificata in un altro giorno di questa tappa: verrà spostata.'}
        </p>
      )}
      <div className="row wrap place-actions">
        <button
          className="btn btn-primary"
          disabled={!day || draft === trip}
          onClick={() => {
            update(() => draft);
            toast(`${d.name} pianificata il giorno ${day!.index + 1}`);
            onClose();
          }}
        >
          Pianifica la visita
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Annulla
        </button>
      </div>
    </Modal>
  );
}
