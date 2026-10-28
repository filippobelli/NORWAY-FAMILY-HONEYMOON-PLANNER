import type { Participants } from '../../domain/types';

// Link di ricerca voli precompilati: si apre il sito esterno, l'app non legge prezzi né disponibilità.
// Formati provati il 28/10/2026:
// - Kayak andata e ritorno / solo andata: tratta, date e passeggeri (2 adulti + bambini con età) applicati.
// - Google Flights: tratta e date applicati; i passeggeri NON si possono passare nel link (vanno impostati sul sito).
// - Skyscanner e Kayak multi-città: formato documentato ma non verificato (il sito ha chiesto un controllo anti-robot).

export interface FlightQuery {
  from: string;
  to: string;
  /** YYYY-MM-DD */
  depart: string;
  /** YYYY-MM-DD: andata e ritorno */
  ret?: string;
}

export interface FlightLink {
  provider: string;
  url: string;
  /** Cosa il link imposta davvero: da mostrare accanto al pulsante */
  note: string;
}

const iata = (s: string) => s.trim().toUpperCase();
const yymmdd = (d: string) => d.slice(2).replace(/-/g, '');

export function flightSearchLinks(q: FlightQuery, p: Participants): FlightLink[] {
  const from = iata(q.from);
  const to = iata(q.to);
  const kids = p.childrenAges.length ? `/children-${p.childrenAges.join('-')}` : '';
  const pax = `${p.adults} adulti${p.childrenAges.length ? ` + ${p.childrenAges.length} bambini` : ''}`;
  const kayakDates = q.ret ? `${q.depart}/${q.ret}` : q.depart;
  const googleQ = `Flights from ${from} to ${to} on ${q.depart}${q.ret ? ` through ${q.ret}` : ' one way'}`;
  const sky = `https://www.skyscanner.it/trasporti/voli/${from.toLowerCase()}/${to.toLowerCase()}/${yymmdd(q.depart)}/${q.ret ? `${yymmdd(q.ret)}/` : ''}`;
  const skyParams = new URLSearchParams({ adultsv2: String(p.adults), cabinclass: 'economy', rtn: q.ret ? '1' : '0' });
  if (p.childrenAges.length) skyParams.set('childrenv2', p.childrenAges.join('|'));
  return [
    {
      provider: 'Kayak',
      url: `https://www.kayak.it/flights/${from}-${to}/${kayakDates}/${p.adults}adults${kids}?sort=bestflight_a`,
      note: `tratta, date e ${pax} impostati`,
    },
    {
      provider: 'Google Voli',
      url: `https://www.google.com/travel/flights?hl=it&curr=EUR&q=${encodeURIComponent(googleQ)}`,
      note: q.ret ? 'tratta e date impostati; imposta i passeggeri sul sito' : 'tratta e data impostati; controlla «Solo andata» e imposta i passeggeri sul sito',
    },
    {
      provider: 'Skyscanner',
      url: `${sky}?${skyParams.toString()}`,
      note: `tratta, date e ${pax} nel link (formato non verificato)`,
    },
  ];
}

/** Andata verso un aeroporto e ritorno da un altro (multi-città su Kayak; formato non verificato). */
export function openJawLink(out: FlightQuery, back: FlightQuery, p: Participants): FlightLink {
  const kids = p.childrenAges.length ? `/children-${p.childrenAges.join('-')}` : '';
  return {
    provider: 'Kayak multi-città',
    url: `https://www.kayak.it/flights/${iata(out.from)}-${iata(out.to)}/${out.depart}/${iata(back.from)}-${iata(back.to)}/${back.depart}/${p.adults}adults${kids}?sort=bestflight_a`,
    note: 'andata e ritorno da aeroporti diversi (formato non verificato)',
  };
}
