import { useMemo, useState } from 'react';
import { CATEGORY_LABEL, DESTINATIONS } from '../data/destinations';
import type { Category, Region } from '../domain/types';
import { useTrip } from '../state/store';
import { Badge } from './common';
import { stopFromDestination } from './ItineraryView';

const REGIONS: Region[] = ['Oslo e Østlandet', 'Fiordi occidentali', 'Sørlandet e Rogaland', 'Trøndelag', 'Nordland e Lofoten', 'Troms e Finnmark'];
const KID_LABEL = { 1: 'Poco adatto ai piccoli', 2: 'Adatto con accortezze', 3: 'Molto adatto ai bambini' } as const;

export function CatalogView() {
  const { trip, update, toast } = useTrip();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | ''>('');
  const [region, setRegion] = useState<Region | ''>('');
  const [kids, setKids] = useState(false);
  const [onlyFav, setOnlyFav] = useState(false);

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
        Catalogo iniziale di {DESTINATIONS.length} destinazioni. Schede e coordinate sono <strong>da verificare</strong> (non ancora confrontate con
        fonti ufficiali); prezzi e orari non sono inseriti di proposito. Il completamento a ~100 schede verificate è la prossima milestone.
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
      <div className="cards">
        {list.map((d) => {
          const fav = trip.favorites.includes(d.id);
          return (
            <article key={d.id} className="card">
              <header>
                <div>
                  <h3>{d.name}</h3>
                  {d.localName && <span className="muted small">{d.localName}</span>}
                </div>
                <button
                  className={`icon-btn fav ${fav ? 'on' : ''}`}
                  aria-pressed={fav}
                  aria-label={fav ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'}
                  onClick={() =>
                    update((t) => ({ ...t, favorites: fav ? t.favorites.filter((x) => x !== d.id) : [...t.favorites, d.id] }))
                  }
                >
                  {fav ? '★' : '☆'}
                </button>
              </header>
              <div className="tags">
                <Badge>{CATEGORY_LABEL[d.category]}</Badge>
                <Badge>{d.region}</Badge>
                <Badge tone={d.kidScore === 3 ? 'ok' : d.kidScore === 1 ? 'warn' : 'neutral'}>{KID_LABEL[d.kidScore]}</Badge>
              </div>
              <p>{d.description}</p>
              <dl className="facts">
                <dt>Come arrivare</dt>
                <dd>{d.access}</dd>
                <dt>Stagione</dt>
                <dd>{d.season}</dd>
                {d.visitHours && (
                  <>
                    <dt>Durata indicativa</dt>
                    <dd>
                      {d.visitHours[0] === d.visitHours[1] ? d.visitHours[0] : `${d.visitHours[0]}–${d.visitHours[1]}`} ore
                    </dd>
                  </>
                )}
                <dt>Difficoltà</dt>
                <dd>{d.difficulty}</dd>
              </dl>
              {d.augustNote && <p className="note-warn small">⚠️ {d.augustNote}</p>}
              <footer>
                <Badge tone="warn">Dati da verificare</Badge>
                <button
                  className="btn btn-small btn-primary"
                  disabled={d.id === 'aurora'}
                  title={d.id === 'aurora' ? 'Non realistica ad agosto' : undefined}
                  onClick={() => {
                    const s = stopFromDestination(d.id);
                    if (s) {
                      update((t) => ({ ...t, stops: [...t.stops, s] }));
                      toast(`${d.name} aggiunta all'itinerario`);
                    }
                  }}
                >
                  {inTrip.has(d.id) ? 'Aggiungi di nuovo' : 'Aggiungi all\'itinerario'}
                </button>
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
