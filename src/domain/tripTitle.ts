import { addDays, totalDays } from './itinerary';
import { tripCountries } from './countries';
import type { Trip } from './types';

// Titolo del viaggio: nazioni del viaggio e, se le date ci sono, il periodo (mese e anno) ricavato da quelle.
// Senza itinerario non c'è un periodo: solo le nazioni, niente mese o anno messi a caso.

let names: Intl.DisplayNames | undefined;
function countryName(code: string): string {
  try {
    names ??= new Intl.DisplayNames(['it'], { type: 'region' });
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

const month = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('it-IT', { month: 'long', timeZone: 'UTC' });

/** «agosto 2027», «luglio–agosto 2027», «dicembre 2027 – gennaio 2028» */
export function periodLabel(start: string, end: string): string {
  const [ys, ms] = start.split('-');
  const [ye, me] = end.split('-');
  if (ys === ye && ms === me) return `${month(start)} ${ys}`;
  if (ys === ye) return `${month(start)}–${month(end)} ${ys}`;
  return `${month(start)} ${ys} – ${month(end)} ${ye}`;
}

function joinNames(list: string[]): string {
  if (list.length <= 1) return list[0] ?? '';
  return `${list.slice(0, -1).join(', ')} e ${list[list.length - 1]}`;
}

/** Titolo mostrato ovunque (intestazione, esportazioni). `nameOf` permette di usare i nomi del catalogo. */
export function tripTitle(trip: Pick<Trip, 'countries' | 'stops' | 'startDate'>, nameOf?: (code: string) => string | undefined): string {
  const countries = joinNames(tripCountries(trip).map((c) => nameOf?.(c.code) ?? countryName(c.code)));
  const n = totalDays(trip.stops);
  const period = n > 0 && trip.startDate ? periodLabel(trip.startDate, addDays(trip.startDate, n - 1)) : '';
  if (!countries) return period ? `Viaggio, ${period}` : 'Nuovo viaggio';
  return period ? `${countries}, ${period}` : countries;
}
