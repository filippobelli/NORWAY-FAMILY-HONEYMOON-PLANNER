import { tripCountries } from '../domain/countries';
import { useTrip } from '../state/store';
import { bandClipPath, MAX_FLAG_BANDS } from './flagGeometry';

// Bandiere delle nazioni: file SVG del pacchetto flag-icons (licenza MIT), proporzione 4:3. Ogni file diventa un asset
// separato e il browser scarica solo le bandiere mostrate. Una nazione senza bandiera nel pacchetto mostra il codice.

const FILES = import.meta.glob<string>('/node_modules/flag-icons/flags/4x3/*.svg', { query: '?no-inline', import: 'default', eager: true });
const URLS: Record<string, string> = {};
for (const [path, url] of Object.entries(FILES)) URLS[path.slice(path.lastIndexOf('/') + 1, -'.svg'.length)] = url;

/** Indirizzo della bandiera di una nazione (codice ISO a due lettere), se c'è */
export const flagUrl = (code: string): string | undefined => URLS[code.toLowerCase()];

/**
 * Bandiera del viaggio o di una nazione. Con più nazioni le bandiere si dividono il riquadro in fasce oblique (con due:
 * la prima in alto a sinistra, la seconda in basso a destra); oltre quattro si disegnano le prime quattro.
 * `label` rende la bandiera leggibile dai lettori di schermo; senza, è decorativa (il nome è già scritto accanto).
 */
export function TripFlag({ codes, label, className = '' }: { codes: string[]; label?: string; className?: string }) {
  const shown = codes.slice(0, MAX_FLAG_BANDS);
  return (
    <span className={`trip-flag ${shown.length === 0 ? 'is-empty' : ''} ${className}`.trim()} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {shown.map((c, i) => {
        const url = flagUrl(c);
        const style = shown.length > 1 ? { clipPath: bandClipPath(i, shown.length) } : undefined;
        return url ? (
          <img key={c} src={url} alt="" style={style} draggable={false} />
        ) : (
          <span key={c} className="trip-flag-code" style={style}>
            {c.toUpperCase()}
          </span>
        );
      })}
    </span>
  );
}

const REGION_NAMES = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['it'], { type: 'region' }) : undefined;
/** Nome italiano di una nazione dal codice ISO (per le etichette delle bandiere) */
export const countryName = (code: string): string => REGION_NAMES?.of(code.toUpperCase()) ?? code.toUpperCase();

/** Elenco leggibile: «Norvegia», «Norvegia e Svezia», «Norvegia, Svezia e Danimarca» */
export const namesList = (codes: string[]): string => {
  const n = codes.map(countryName);
  return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} e ${n[n.length - 1]}`;
};

/** Logo dell'app: la bandiera delle nazioni del viaggio (vuoto finché il viaggio nuovo non ne ha scelta una) */
export function TripFlagMark() {
  const { trip } = useTrip();
  const codes = Array.isArray(trip.countries) && trip.countries.length === 0 ? [] : tripCountries(trip).map((c) => c.code);
  return <TripFlag codes={codes} className="flag" label={codes.length ? `Bandiera del viaggio: ${namesList(codes)}` : 'Nessuna nazione ancora scelta'} />;
}
