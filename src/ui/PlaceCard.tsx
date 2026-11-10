import { useEffect, useState } from 'react';
import { useCatalog } from '../catalog/registry';
import { DESTINATIONS } from '../data/destinations';
import { PLACE_PHOTOS, PLACE_TIPS, type PlacePhoto } from '../data/placeExtras';
import { WIKI } from '../data/wiki';
import { matchPlace } from '../domain/placeMatch';
import type { Destination, Stop } from '../domain/types';
import { commonsFilePage, commonsImageUrl, fetchImageCredit } from '../services/wiki';
import { Icon } from './icons';
import { OfficialLink } from './OfficialLink';

/** Foto del luogo: quelle del catalogo (crediti già pronti); altrimenti la foto principale, con i crediti letti da Commons */
function usePlacePhotos(id: string): PlacePhoto[] {
  useCatalog();
  const listed = PLACE_PHOTOS[id];
  const main = WIKI[id]?.image;
  const useMain = !listed?.length && Boolean(main);
  const [fallback, setFallback] = useState<{ id: string; photo: PlacePhoto } | undefined>();
  useEffect(() => {
    if (!useMain || !main) return;
    const ac = new AbortController();
    fetchImageCredit(main, ac.signal)
      .then((c) => {
        // Senza licenza letta la foto non si mostra
        if (!/da verificare/.test(c.license)) setFallback({ id, photo: { file: main, author: c.author, license: c.license, licenseUrl: c.licenseUrl } });
      })
      .catch(() => undefined);
    return () => ac.abort();
  }, [id, main, useMain]);
  if (listed?.length) return listed;
  return useMain && fallback?.id === id ? [fallback.photo] : [];
}

function Photo({ p, name }: { p: PlacePhoto; name: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <figure className="place-photo">
      <a href={commonsFilePage(p.file)} target="_blank" rel="noreferrer" title="Apri la foto su Wikimedia Commons">
        <img src={commonsImageUrl(p.file, 500)} alt={`Foto: ${name}`} loading="lazy" decoding="async" onError={() => setOk(false)} />
      </a>
      <figcaption className="small muted">
        {p.author} ·{' '}
        {p.licenseUrl ? (
          <a href={p.licenseUrl} target="_blank" rel="noreferrer">
            {p.license}
          </a>
        ) : (
          p.license
        )}
      </figcaption>
    </figure>
  );
}

const hours = (h: [number, number]) => (h[0] === h[1] ? `${h[0]}` : `${h[0]}–${h[1]}`);

/** Scheda del luogo dentro la tappa: foto, descrizione, come arrivare, consigli con la fonte, sito ufficiale */
export function PlaceCard({ dest, open }: { dest: Destination; open?: boolean }) {
  const photos = usePlacePhotos(dest.id);
  const tips = PLACE_TIPS[dest.id] ?? [];
  const wiki = WIKI[dest.id];
  const wikiUrl = wiki?.it
    ? `https://it.wikipedia.org/wiki/${encodeURIComponent(wiki.it.replace(/ /g, '_'))}`
    : wiki?.en
      ? `https://en.wikipedia.org/wiki/${encodeURIComponent(wiki.en.replace(/ /g, '_'))}`
      : undefined;
  const parts = [photos.length ? `${photos.length} foto` : '', tips.length ? (tips.length === 1 ? '1 consiglio' : `${tips.length} consigli`) : ''].filter(Boolean);
  return (
    <details className="place-card" open={open}>
      <summary>Scheda del luogo{parts.length ? ` · ${parts.join(', ')}` : ''}</summary>
      {photos.length > 0 && (
        <div className="place-photos" role="group" aria-label={`Foto di ${dest.name}`}>
          {photos.map((p) => (
            <Photo key={p.file} p={p} name={dest.name} />
          ))}
        </div>
      )}
      {dest.description && <p>{dest.description}</p>}
      <dl className="place-facts small">
        {dest.access && (
          <>
            <dt>Come arrivare</dt>
            <dd>{dest.access}</dd>
          </>
        )}
        {dest.season && (
          <>
            <dt>Stagione</dt>
            <dd>{dest.season}</dd>
          </>
        )}
        {dest.visitHours && (
          <>
            <dt>Durata indicativa</dt>
            <dd>{dest.visitHours[0] === 1 && dest.visitHours[1] === 1 ? '1 ora' : `${hours(dest.visitHours)} ore`} (stima)</dd>
          </>
        )}
      </dl>
      {tips.length > 0 && (
        <div className="place-tips">
          <strong className="small">Consigli</strong>
          <ul className="small">
            {tips.map((t) => (
              <li key={t.text}>
                {t.text}{' '}
                <span className="muted">
                  (
                  <a href={t.url} target="_blank" rel="noreferrer">
                    {t.source}
                  </a>
                  , letto il {new Date(`${t.checkedAt}T12:00:00Z`).toLocaleDateString('it-IT', { timeZone: 'UTC' })})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="small muted place-foot">
        {dest.reliability === 'da_verificare' ? "Descrizione scritta per l'app, da verificare. " : ''}
        {dest.coordsStatus === 'verificate' ? 'Posizione verificata sulla fonte.' : 'Posizione approssimativa.'}
        {photos.length > 0 ? ' Foto da Wikimedia Commons: tocca una foto per aprirla.' : ''}
      </p>
      <p className="row wrap small">
        <OfficialLink id={dest.id} />
        {wikiUrl && (
          <a href={wikiUrl} target="_blank" rel="noreferrer">
            Wikipedia ↗
          </a>
        )}
      </p>
    </details>
  );
}

/** Tappa messa a mano: se vicino c'è un luogo del catalogo, proposta di collegarla alla sua scheda (decide l'utente) */
export function PlaceLinkHint({ stop, onLink }: { stop: Stop; onLink: (destinationId: string) => void }) {
  useCatalog();
  const m = stop.kind === 'luogo' && !stop.destinationId ? matchPlace(stop, DESTINATIONS) : undefined;
  if (!m) return null;
  const km = m.km < 0.1 ? 'stesso punto' : `a ${m.km.toLocaleString('it-IT', { maximumFractionDigits: 1 })} km in linea d'aria`;
  return (
    <p className="place-link small">
      <Icon name="pin" /> Nel catalogo c'è «{m.dest.name}» ({km}).{' '}
      <button className="btn btn-small" onClick={() => onLink(m.dest.id)}>
        Collega alla scheda
      </button>
    </p>
  );
}
