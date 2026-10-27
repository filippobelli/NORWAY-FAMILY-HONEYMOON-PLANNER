// Siti ufficiali delle attrazioni. Fonti: proprietà P856 ("sito ufficiale") di Wikidata e, dove manca,
// il sito del gestore o dell'ente turistico. Ogni indirizzo è stato aperto il 27/10/2026 dal browser di
// Filippo: risposta 200 e titolo della pagina coerente (es. "Akvariet i Bergen", "Polaria", "Frammuseet").
// Per le città non si usa il sito del comune: non serve per organizzare le visite.

export type OfficialKind = 'attrazione' | 'gestore' | 'ente';

export interface OfficialSite {
  url: string;
  kind: OfficialKind;
  /** Da dove arriva il link */
  via: 'Wikidata' | 'verifica manuale';
}

export const OFFICIAL_CHECKED_AT = '2026-10-27';

export const OFFICIAL_KIND_LABEL: Record<OfficialKind, string> = {
  attrazione: 'Sito ufficiale',
  gestore: 'Sito del gestore',
  ente: 'Pagina dell\'ente turistico',
};

export const OFFICIAL_SITES: Record<string, OfficialSite> = {
  // Musei e acquari
  'folkemuseum': { url: 'https://norskfolkemuseum.no/', kind: 'attrazione', via: 'Wikidata' },
  'fram': { url: 'https://frammuseum.no/', kind: 'attrazione', via: 'Wikidata' },
  'bergen-aquarium': { url: 'https://www.akvariet.no/', kind: 'attrazione', via: 'Wikidata' },
  'atlanterhavsparken': { url: 'https://www.atlanterhavsparken.no/', kind: 'attrazione', via: 'Wikidata' },
  'polaria': { url: 'https://polaria.no/', kind: 'attrazione', via: 'Wikidata' },
  'glacier-museum': { url: 'https://www.bremuseum.no/', kind: 'attrazione', via: 'Wikidata' },
  'lofotr': { url: 'https://www.museumnord.no/vare-museer/lofotr-vikingmuseum/', kind: 'gestore', via: 'Wikidata' },
  'fjellsenter': { url: 'https://www.norskfjellsenter.no/', kind: 'attrazione', via: 'Wikidata' },
  // Parchi e animali
  'hunderfossen': { url: 'https://hunderfossen.no/', kind: 'attrazione', via: 'Wikidata' },
  'kongeparken': { url: 'https://www.kongeparken.no/', kind: 'attrazione', via: 'Wikidata' },
  'tusenfryd': { url: 'https://www.tusenfryd.no/', kind: 'attrazione', via: 'Wikidata' },
  'dyreparken': { url: 'https://www.dyreparken.no/', kind: 'attrazione', via: 'Wikidata' },
  'polar-park': { url: 'https://www.norwaysbest.com/no/polar-park', kind: 'gestore', via: 'Wikidata' },
  'langedrag': { url: 'https://www.langedrag.no/', kind: 'attrazione', via: 'verifica manuale' },
  // Treni
  'flamsbana': { url: 'https://www.norwaysbest.com/no/aktiviteter/flamsbana', kind: 'gestore', via: 'Wikidata' },
  'raumabanen': { url: 'https://www.vy.no/tog/andalsnes', kind: 'gestore', via: 'verifica manuale' },
  // Strade turistiche nazionali (Statens vegvesen)
  'trollstigen': { url: 'https://www.nasjonaleturistveger.no/en/routes/geiranger--trollstigen/trollstigen/', kind: 'ente', via: 'verifica manuale' },
  'ornesvingen': { url: 'https://www.nasjonaleturistveger.no/en/routes/geiranger--trollstigen/ornesvingen/', kind: 'ente', via: 'verifica manuale' },
  'atlanterhavsveien': { url: 'https://www.nasjonaleturistveger.no/en/routes/atlanterhavsvegen/', kind: 'ente', via: 'verifica manuale' },
  'aurlandsfjellet': { url: 'https://www.nasjonaleturistveger.no/en/routes/aurlandsfjellet/', kind: 'ente', via: 'verifica manuale' },
  'stegastein': { url: 'https://www.nasjonaleturistveger.no/en/routes/aurlandsfjellet/stegastein/', kind: 'ente', via: 'Wikidata' },
  // Natura e aree
  'trolltunga': { url: 'https://www.trolltunga.com/en', kind: 'attrazione', via: 'Wikidata' },
  'voringsfossen': { url: 'https://www.visitnorway.com/listings/voringsfossen-waterfall/158686/', kind: 'ente', via: 'Wikidata' },
  'lofoten': { url: 'https://visitlofoten.com/en/', kind: 'ente', via: 'Wikidata' },
};
