import type { SourceRef } from '../domain/types';

// Schede editoriali delle attrazioni (musei, parchi, luoghi visitabili), da affiancare alle voci del catalogo.
// Ogni scheda è stata controllata a mano il 06/11/2026 sul sito ufficiale e su Wikidata. Regole:
// - descrizioni brevi scritte per l'app (nessun testo copiato da siti o da Wikipedia);
// - coordinate dalla proprietà P625 di Wikidata (dati CC0), con l'identificativo dell'elemento;
// - orari e prezzi NON sono riportati: si dice solo se il sito li pubblica, da ricontrollare prima della visita;
// - «al coperto/all'aperto» solo quando è evidente dalla descrizione ufficiale;
// - prenotazione: si riporta soltanto quello che il sito dice, con la data della lettura;
// - i termini d'uso di VisitOSLO non sono leggibili (HTTP 403): nessun suo contenuto è usato.
// Per aggiungere una scheda: voce nel catalogo (destinations.ts), poi qui con fonti e data di verifica, vedi docs/ATTRAZIONI.md.

export const ATTRACTIONS_CHECKED_AT = '2026-11-06';

export type Setting = 'al_coperto' | 'all_aperto' | 'misto';

export const SETTING_LABEL: Record<Setting, string> = {
  al_coperto: 'Al coperto',
  all_aperto: "All'aperto",
  misto: "Al coperto e all'aperto",
};

export interface AttractionInfo {
  /** Voce del catalogo della città a cui la scheda è associata */
  base: string;
  /** Quartiere o località, come indicato dal sito ufficiale */
  area: string;
  address?: string;
  setting?: Setting;
  booking: {
    /** Che cosa dice il sito: consigliata, non indicata */
    advice: 'consigliata' | 'non_indicata';
    note: string;
    url?: string;
  };
  /** Il sito ufficiale pubblica orari: non li copiamo, vanno controllati per le date del viaggio */
  hoursPublished: boolean;
  /** Apertura stagionale dichiarata dal sito */
  seasonal?: string;
  /** Fuori dal centro della città: distanza indicata dalla fonte e cosa verificare */
  outside?: { note: string };
  /** Coordinate e immagine: elemento Wikidata usato */
  wikidata: string;
  coords: { lat: number; lng: number };
  sources: SourceRef[];
  checkedAt: string;
}

const site = (label: string, url: string): SourceRef => ({ label, url, checkedAt: ATTRACTIONS_CHECKED_AT });
const wd = (qid: string): SourceRef => ({ label: `Wikidata ${qid} (coordinate P625, CC0)`, url: `https://www.wikidata.org/wiki/${qid}`, checkedAt: ATTRACTIONS_CHECKED_AT });

const BUY_ONLINE = 'Biglietti in vendita sul sito; il sito non indica una prenotazione obbligatoria.';

export const ATTRACTION_INFO: Record<string, AttractionInfo> = {
  fram: {
    base: 'oslo',
    area: 'Bygdøy, Oslo',
    address: 'Bygdøynesveien 39, 0286 Oslo',
    setting: 'al_coperto',
    booking: { advice: 'non_indicata', note: BUY_ONLINE },
    hoursPublished: true,
    wikidata: 'Q941250',
    coords: { lat: 59.903333, lng: 10.699444 },
    sources: [site('Sito ufficiale Frammuseet', 'https://frammuseum.no/'), wd('Q941250')],
    checkedAt: ATTRACTIONS_CHECKED_AT,
  },
  folkemuseum: {
    base: 'oslo',
    area: 'Bygdøy, Oslo',
    address: 'Museumsveien 10, Bygdøy, 0287 Oslo',
    setting: 'misto',
    booking: { advice: 'non_indicata', note: BUY_ONLINE },
    hoursPublished: true,
    wikidata: 'Q937521',
    coords: { lat: 59.906911, lng: 10.685958 },
    sources: [site('Sito ufficiale Norsk Folkemuseum', 'https://norskfolkemuseum.no/'), wd('Q937521')],
    checkedAt: ATTRACTIONS_CHECKED_AT,
  },
  kontiki: {
    base: 'oslo',
    area: 'Bygdøy, Oslo',
    address: 'Bygdøynesveien 36, 0286 Oslo',
    setting: 'al_coperto',
    booking: { advice: 'non_indicata', note: BUY_ONLINE },
    hoursPublished: true,
    wikidata: 'Q1415972',
    coords: { lat: 59.903611, lng: 10.698056 },
    sources: [site('Sito ufficiale Kon-Tiki Museet', 'https://www.kon-tiki.no/'), wd('Q1415972')],
    checkedAt: ATTRACTIONS_CHECKED_AT,
  },
  munch: {
    base: 'oslo',
    area: 'Bjørvika, Oslo',
    address: 'Edvard Munchs plass 1, 0194 Oslo',
    setting: 'al_coperto',
    booking: { advice: 'non_indicata', note: BUY_ONLINE },
    hoursPublished: true,
    wikidata: 'Q844926',
    coords: { lat: 59.90575, lng: 10.755306 },
    sources: [site('Sito ufficiale MUNCH', 'https://www.munch.no/'), wd('Q844926')],
    checkedAt: ATTRACTIONS_CHECKED_AT,
  },
  vigeland: {
    base: 'oslo',
    area: 'Frogner, Oslo',
    setting: 'misto',
    booking: { advice: 'non_indicata', note: "Il sito indica il parco sempre aperto; biglietti solo per il museo e per le visite guidate." },
    hoursPublished: true,
    wikidata: 'Q1126911',
    coords: { lat: 59.926944, lng: 10.701111 },
    sources: [site('Sito ufficiale Vigelandmuseet', 'https://vigeland.museum.no/'), wd('Q1126911')],
    checkedAt: ATTRACTIONS_CHECKED_AT,
  },
  teknisk: {
    base: 'oslo',
    area: 'Kjelsås, Oslo (nord della città)',
    address: 'Kjelsåsveien 143, 0491 Oslo',
    setting: 'al_coperto',
    booking: { advice: 'consigliata', note: 'Il sito consiglia di comprare il biglietto online prima della visita.', url: 'https://www.tekniskmuseum.no/apningstider' },
    hoursPublished: true,
    wikidata: 'Q7061184',
    coords: { lat: 59.966667, lng: 10.782778 },
    sources: [site('Sito ufficiale Norsk Teknisk Museum', 'https://www.tekniskmuseum.no/'), site('Orari e biglietti', 'https://www.tekniskmuseum.no/apningstider'), wd('Q7061184')],
    checkedAt: ATTRACTIONS_CHECKED_AT,
  },
  holmenkollen: {
    base: 'oslo',
    area: 'Holmenkollen, collina a nord-ovest di Oslo',
    setting: 'misto',
    booking: { advice: 'non_indicata', note: "Il sito indica biglietti sia online sia all'ingresso." },
    hoursPublished: true,
    seasonal: 'Il sito pubblica orari diversi tra inverno ed estate: da ricontrollare per agosto.',
    wikidata: 'Q1633217',
    coords: { lat: 59.962594, lng: 10.666775 },
    sources: [site('Sito ufficiale Skimuseet i Holmenkollen', 'https://www.holmenkollen.com/'), wd('Q1633217')],
    checkedAt: ATTRACTIONS_CHECKED_AT,
  },
  tusenfryd: {
    base: 'oslo',
    area: 'Vinterbro, fuori Oslo',
    address: 'Fryds vei 25, 1407 Vinterbro',
    setting: 'all_aperto',
    booking: { advice: 'non_indicata', note: BUY_ONLINE },
    hoursPublished: true,
    seasonal: 'Parco stagionale: a novembre 2026 il sito lo indica chiuso, con riapertura il 24 aprile 2027. Date e orari di agosto da verificare.',
    outside: { note: 'Fuori città: circa 20 km dal centro di Oslo secondo il sito ufficiale. Trasferimento e tempi da verificare.' },
    wikidata: 'Q2581206',
    coords: { lat: 59.748226, lng: 10.777019 },
    sources: [site('Sito ufficiale TusenFryd', 'https://www.tusenfryd.no/'), site('Come arrivare', 'https://www.tusenfryd.no/planlegg-besoket/relevant-informasjon/komme-seg-til'), site('Orari', 'https://www.tusenfryd.no/apningstider-og-priser/apningstider'), wd('Q2581206')],
    checkedAt: ATTRACTIONS_CHECKED_AT,
  },
};
