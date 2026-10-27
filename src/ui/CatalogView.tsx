import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_LABEL, DESTINATIONS } from '../data/destinations';
import { WIKI } from '../data/wiki';
import type { Category, Destination, Region } from '../domain/types';
import { commonsImageUrl, fetchImageCredit, fetchWikiIntro, type ImageCredit, type WikiIntro } from '../services/wiki';
import { useTrip } from '../state/store';
import { Badge } from './common';
import { stopFromDestination } from './ItineraryView';

const REGIONS: Region[] = ['Oslo e Østlandet', 'Innlandet e montagne', 'Fiordi occidentali', 'Sørlandet e Rogaland', 'Trøndelag', 'Nordland e Lofoten', 'Troms e Finnmark'];
const KID_LABEL = { 1: 'Poco adatto ai piccoli', 2: 'Adatto con accortezze', 3: 'Molto adatto ai bambini' } as const;

export function CatalogView() {
  const { trip, update, toast } = useTrip();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | ''>('');
  const [region, setRegion] = useState<Region | ''>('');
  const [kids, setKids] = useState(false);
  const [onlyFav, setOnlyFav] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return DESTINATIONS.filter(
      (d) =>
        (!qq || `${d.name} ${d.localName ?? ''} ${d.description}`.toLowerCase().includes(qq)) &&
        (!cat || d.category === cat) &&
        (!region || d.region === region) &&
        (!kids || d.kidScore === 3) &&
        (!onlyFav || trip.favorites.includes(d.id)),
    );
  }, [q, cat, region, kids, onlyFav, trip.favorites]);

  const inTrip = new Set(trip.stops.map((s) => s.destinationId));

  return (
    <div className="catalog">
      <div className="note-info">
        {DESTINATIONS.length} destinazioni. Coordinate verificate su OpenStreetMap per {DESTINATIONS.filter((d) => d.coordsStatus === 'verificate').length}{' '}
        schede (27/10/2026); le altre sono approssimative. Descrizioni, durate, idoneità per bambini e stagionalità sono <strong>da verificare</strong>
        sulle fonti ufficiali; prezzi e orari non sono inseriti di proposito.
      </div>
      <div className="filters">
        <input type="search" placeholder="Cerca…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cerca nel catalogo" />
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
          {REGIONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={kids} onChange={(e) => setKids(e.target.checked)} /> Molto adatte ai bambini
        </label>
        <label className="check">
          <input type="checkbox" checked={onlyFav} onChange={(e) => setOnlyFav(e.target.checked)} /> Solo preferiti
        </label>
      </div>
      <p className="muted small">{list.length} risultati</p>
      <div className="cards catalog-cards">
        {list.map((d) => (
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
            onAdd={() => {
              const st = stopFromDestination(d.id);
              if (st) {
                update((t) => ({ ...t, stops: [...t.stops, st] }));
                toast(`${d.name} aggiunta all'itinerario`);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

const CATEGORY_ICON: Record<Category, string> = {
  citta: '🏘️',
  fiordi: '🌊',
  natura: '🏔️',
  strade: '🛣️',
  isole: '🏝️',
  treni: '🚆',
  fauna: '🐋',
  musei: '🏛️',
  parchi: '🎡',
  stagionali: '✨',
  aeroporti: '✈️',
};

function DestinationCard({
  d,
  open,
  onToggle,
  fav,
  inTrip,
  onFav,
  onAdd,
}: {
  d: Destination;
  open: boolean;
  onToggle: () => void;
  fav: boolean;
  inTrip: boolean;
  onFav: () => void;
  onAdd: () => void;
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
      <img src={commonsImageUrl(wiki.image, open ? 960 : 480)} alt={`Foto: ${d.name}`} loading="lazy" decoding="async" onError={() => setImgOk(false)} />
    ) : (
      <div className={`photo-placeholder cat-${d.category}`} aria-hidden>
        <span>{CATEGORY_ICON[d.category]}</span>
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
        {fav ? '★' : '☆'}
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
          {d.augustNote && <p className="note-warn small">⚠️ {d.augustNote}</p>}

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
            <button
              className="btn btn-small btn-primary"
              disabled={d.id === 'aurora'}
              title={d.id === 'aurora' ? 'Non realistica ad agosto' : undefined}
              onClick={onAdd}
            >
              {inTrip ? 'Aggiungi di nuovo' : "Aggiungi all'itinerario"}
            </button>
          </footer>
        </div>
      )}
    </article>
  );
}
