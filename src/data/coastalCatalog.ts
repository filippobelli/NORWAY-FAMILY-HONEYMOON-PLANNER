// Catalogo delle proposte brevi (1–5 giorni) della rotta costiera, letto dai siti ufficiali il 28/10/2026.
// - Havila: pagine «/de/reisen/<tratta>?month=2027-08», prezzi «ab … pro Person» per agosto 2027 calcolati dal sito su 2 ospiti.
// - Hurtigruten: elenco «/de-de/kreuzfahrten?durations=OneToFiveDays» (13 proposte, prezzi in EUR; il sito UK ne mostra 5 in GBP).
//   Il «Preis ab» vale per le partenze del mese indicato (novembre 2026 o gennaio 2027): NON è un prezzo estivo.
//   Partenze di giugno e agosto 2027 cercate sul sito il 28/10/2026: «nessuna partenza» (non ancora in vendita).
// Testi descrittivi riassunti in italiano; porti, durate, pasti e prezzi come pubblicati. Nulla è prenotabile da qui.

import type { CoastalOperator, CoastalOption } from '../domain/types';

export interface CatalogDay {
  day: number;
  title: string;
  ports: string[];
}

export interface CatalogPrice {
  /** Categoria di cabina come indicata dal sito */
  cabin: string;
  /** Prezzo minimo a persona in EUR */
  perPerson: number;
}

export interface CoastalCatalogVoyage {
  id: string;
  operator: CoastalOperator;
  title: string;
  /** Tratta come presentata dall'operatore */
  route: string;
  direction: 'nord' | 'sud';
  /** Porti di imbarco e sbarco della parte in nave (per collegarla ai tratti dell'itinerario) */
  fromPort: string;
  toPort: string;
  /** Andata e ritorno sullo stesso tratto */
  roundTrip?: boolean;
  days: number;
  /** Porti o località toccati secondo l'operatore */
  stops: number;
  meals: CoastalOption['meals'];
  summary: string;
  highlights: string[];
  /** Programma giorno per giorno, quando pubblicato */
  itinerary?: CatalogDay[];
  prices: CatalogPrice[];
  /** A cosa si riferiscono i prezzi */
  priceBasis: string;
  /** Periodo di partenza a cui vale il prezzo */
  priceValidFor: string;
  /** true solo se il prezzo è per una partenza estiva (agosto 2027) */
  summerPrice: boolean;
  /** Cosa cambia d'estate, quando l'operatore lo indica */
  summerNotes: string[];
  url: string;
  checkedAt: string;
}

const CHECKED = '2026-10-28';
const HR_BASIS = 'Prezzo minimo a persona pubblicato da Hurtigruten (cabina non specificata nell\'elenco).';
const HR_NOT_SUMMER = 'Le partenze di giugno e agosto 2027 non risultavano ancora in vendita il 28/10/2026.';
const HV_BASIS = 'Prezzo minimo a persona per agosto 2027, calcolato dal sito Havila su 2 ospiti nella stessa cabina.';
const MIDNIGHT_SUN = 'D\'estate, a nord del Circolo polare, si naviga con il sole di mezzanotte.';

const hr = (v: Omit<CoastalCatalogVoyage, 'operator' | 'priceBasis' | 'summerPrice' | 'checkedAt' | 'url'> & { slug: string }): CoastalCatalogVoyage => {
  const { slug, ...rest } = v;
  return {
    ...rest,
    operator: 'Hurtigruten',
    priceBasis: HR_BASIS,
    summerPrice: false,
    url: `https://www.hurtigruten.com/de-de/kreuzfahrten/${slug}`,
    checkedAt: CHECKED,
  };
};

const hv = (v: Omit<CoastalCatalogVoyage, 'operator' | 'priceBasis' | 'summerPrice' | 'checkedAt' | 'url' | 'priceValidFor' | 'meals'> & { slug: string }): CoastalCatalogVoyage => {
  const { slug, ...rest } = v;
  return {
    ...rest,
    operator: 'Havila',
    meals: 'pensione_completa',
    priceBasis: HV_BASIS,
    priceValidFor: 'agosto 2027',
    summerPrice: true,
    url: `https://www.havilavoyages.com/de/reisen/${slug}?month=2027-08`,
    checkedAt: CHECKED,
  };
};

const ports = (s: string) => s.split(',').map((p) => p.trim());

export const COASTAL_CATALOG: CoastalCatalogVoyage[] = [
  // ---------------- Hurtigruten ----------------
  hr({
    id: 'hr-sail-rail-norvegia',
    slug: 'sail-und-rail-norwegen-5-tage',
    title: 'Sail & Rail Norvegia',
    route: 'Oslo → Trondheim → Bergen → Oslo (circuito)',
    direction: 'sud',
    fromPort: 'Trondheim',
    toPort: 'Bergen',
    days: 5,
    stops: 8,
    meals: 'mezza_pensione',
    summary:
      'Circuito breve con partenza e arrivo a Oslo: treno fino a Trondheim, nave della rotta costiera fino a Bergen e treno per tornare a Oslo. Il pacchetto include anche pernottamenti in hotel.',
    highlights: ['Oslo', 'Treno Dovrebanen fino a Trondheim', 'Trondheim', 'Rotta costiera verso sud', 'Costa atlantica', 'Bergen', 'Treno di ritorno a Oslo'],
    prices: [{ cabin: 'non specificata', perPerson: 968 }],
    priceValidFor: 'novembre 2026',
    summerNotes: [HR_NOT_SUMMER, 'Pacchetto con treni e hotel: non serve l\'auto per questa parte del viaggio.'],
  }),
  hr({
    id: 'hr-bergen-trondheim',
    slug: 'bergen-trondheim',
    title: 'Dai fiordi occidentali alla capitale vichinga',
    route: 'Bergen → Ålesund → Trondheim (verso nord)',
    direction: 'nord',
    fromPort: 'Bergen',
    toPort: 'Trondheim',
    days: 3,
    stops: 8,
    meals: 'nessuno',
    summary: 'Tre giorni da Bergen a Trondheim tra fiordi, Ålesund in stile liberty e la città dei re vichinghi.',
    highlights: ['Bergen e il quartiere di Bryggen (UNESCO)', 'Ålesund in stile liberty', 'Geirangerfjord (estate) o Hjørundfjord (primavera/autunno)', 'Panorama di Molde', 'Trondheim'],
    prices: [{ cabin: 'non specificata', perPerson: 395 }],
    priceValidFor: 'novembre 2026',
    summerNotes: ['D\'estate la nave entra nel Geirangerfjord (UNESCO).', 'Escursione facoltativa «Geiranger con Trollstigen» indicata per giugno–agosto.', HR_NOT_SUMMER],
  }),
  hr({
    id: 'hr-bergen-svolvaer',
    slug: 'bergen-svolvaer',
    title: 'Dai fiordi occidentali alle Lofoten',
    route: 'Bergen → Ålesund → Trondheim → Svolvær (verso nord)',
    direction: 'nord',
    fromPort: 'Bergen',
    toPort: 'Svolvær',
    days: 4,
    stops: 16,
    meals: 'nessuno',
    summary: 'Da Bergen alle isole Lofoten lungo fiordi e arcipelaghi, con l\'attraversamento del Circolo polare artico.',
    highlights: ['Ålesund in stile liberty', 'Trondheim', 'Corrente di marea del Saltstraumen', 'Attraversamento del Circolo polare', 'Lofoten'],
    prices: [{ cabin: 'non specificata', perPerson: 605 }],
    priceValidFor: 'gennaio 2027',
    summerNotes: ['D\'estate la nave entra nel Geirangerfjord.', MIDNIGHT_SUN, HR_NOT_SUMMER],
  }),
  hr({
    id: 'hr-bergen-tromso',
    slug: 'bergen-tromso',
    title: 'Dai fiordi occidentali alla capitale dell\'Artico',
    route: 'Bergen → Ålesund → Trondheim → Bodø → Tromsø (verso nord)',
    direction: 'nord',
    fromPort: 'Bergen',
    toPort: 'Tromsø',
    days: 5,
    stops: 22,
    meals: 'nessuno',
    summary: 'Navigazione breve verso nord sulla rotta classica: dai fiordi occidentali fino a Tromsø, oltre il Circolo polare.',
    highlights: ['Fiordi e cascate (Geirangerfjord in estate)', 'Ålesund in stile liberty', 'Trondheim', 'Attraversamento del Circolo polare', 'Saltstraumen', 'Arrivo a Tromsø'],
    prices: [{ cabin: 'non specificata', perPerson: 839 }],
    priceValidFor: 'gennaio 2027',
    summerNotes: ['D\'estate la nave entra nel Geirangerfjord.', MIDNIGHT_SUN, HR_NOT_SUMMER],
  }),
  hr({
    id: 'hr-trondheim-tromso',
    slug: 'trondheim-tromso',
    title: 'Dalla capitale vichinga alla capitale dell\'Artico',
    route: 'Trondheim → Bodø → Tromsø (verso nord)',
    direction: 'nord',
    fromPort: 'Trondheim',
    toPort: 'Tromsø',
    days: 3,
    stops: 15,
    meals: 'nessuno',
    summary: 'Tre giorni tra Trondheim e Tromsø con il passaggio del Circolo polare artico.',
    highlights: ['Trondheim', 'Costa dei fiordi', 'Cerimonia del Circolo polare', 'Bodø', 'Senja e uccelli marini', 'Tromsø'],
    prices: [{ cabin: 'non specificata', perPerson: 407 }],
    priceValidFor: 'gennaio 2027',
    summerNotes: [MIDNIGHT_SUN, HR_NOT_SUMMER],
  }),
  hr({
    id: 'hr-tromso-kirkenes',
    slug: 'tromso-kirkenes',
    title: 'Dalla capitale dell\'Artico al confine norvegese',
    route: 'Tromsø → Honningsvåg → Båtsfjord → Kirkenes (verso nord)',
    direction: 'nord',
    fromPort: 'Tromsø',
    toPort: 'Kirkenes',
    days: 3,
    stops: 13,
    meals: 'nessuno',
    summary: 'L\'estremo nord: da Tromsø a Kirkenes passando per Honningsvåg, porto di accesso a Capo Nord.',
    highlights: ['Tromsø', 'Alpi di Lyngen', 'Capo Nord (da Honningsvåg)', 'Faro di Slettnes', 'Kirkenes'],
    prices: [{ cabin: 'non specificata', perPerson: 300 }],
    priceValidFor: 'novembre 2026',
    summerNotes: [MIDNIGHT_SUN, HR_NOT_SUMMER],
  }),
  hr({
    id: 'hr-svolvaer-kirkenes',
    slug: 'svolvaer-kirkenes',
    title: 'Dalle Lofoten al confine norvegese',
    route: 'Svolvær → Tromsø → Honningsvåg → Kirkenes (verso nord)',
    direction: 'nord',
    fromPort: 'Svolvær',
    toPort: 'Kirkenes',
    days: 4,
    stops: 19,
    meals: 'nessuno',
    summary: 'Dalle Lofoten fino a Kirkenes attraverso il grande nord, con la sosta di Honningsvåg per Capo Nord.',
    highlights: ['Capo Nord', 'Lofoten', 'Alpi di Lyngen', 'Faro di Slettnes', 'Kirkenes'],
    prices: [{ cabin: 'non specificata', perPerson: 507 }],
    priceValidFor: 'gennaio 2027',
    summerNotes: [MIDNIGHT_SUN, HR_NOT_SUMMER],
  }),
  hr({
    id: 'hr-trondheim-bergen',
    slug: 'trondheim-bergen',
    title: 'Dalla capitale vichinga ai fiordi occidentali',
    route: 'Trondheim → Kristiansund → Bergen (verso sud)',
    direction: 'sud',
    fromPort: 'Trondheim',
    toPort: 'Bergen',
    days: 2,
    stops: 8,
    meals: 'nessuno',
    summary: 'La proposta più breve: due giorni da Trondheim a Bergen lungo la costa occidentale.',
    highlights: ['Trondheim', 'Kristiansund, la città del baccalà', 'Molde, città delle rose', 'Fiordi e ghiacciai', 'Bergen'],
    prices: [{ cabin: 'non specificata', perPerson: 289 }],
    priceValidFor: 'novembre 2026',
    summerNotes: [HR_NOT_SUMMER],
  }),
  hr({
    id: 'hr-tromso-trondheim',
    slug: 'tromso-trondheim',
    title: 'Dalla capitale dell\'Artico alla capitale vichinga',
    route: 'Tromsø → Brønnøysund → Trondheim (verso sud)',
    direction: 'sud',
    fromPort: 'Tromsø',
    toPort: 'Trondheim',
    days: 3,
    stops: 15,
    meals: 'nessuno',
    summary: 'Da Tromsø a Trondheim passando per le Lofoten, il Trollfjord e la montagna forata di Torghatten.',
    highlights: ['Tromsø', 'Lofoten', 'Trollfjord', 'Torghatten', 'Circolo polare', 'Trondheim'],
    prices: [{ cabin: 'non specificata', perPerson: 412 }],
    priceValidFor: 'novembre 2026',
    summerNotes: [MIDNIGHT_SUN, HR_NOT_SUMMER],
  }),
  hr({
    id: 'hr-tromso-bergen',
    slug: 'tromso-bergen',
    title: 'Dalla capitale dell\'Artico ai fiordi occidentali',
    route: 'Tromsø → Brønnøysund → Trondheim → Bergen (verso sud)',
    direction: 'sud',
    fromPort: 'Tromsø',
    toPort: 'Bergen',
    days: 4,
    stops: 22,
    meals: 'nessuno',
    summary: 'Discesa verso sud lungo arcipelaghi e fiordi, da Tromsø fino a Bergen.',
    highlights: ['Lofoten', 'Trollfjord', 'Kristiansund e la cultura del merluzzo', 'Molde, città delle rose', 'Bergen'],
    prices: [{ cabin: 'non specificata', perPerson: 805 }],
    priceValidFor: 'novembre 2026',
    summerNotes: [MIDNIGHT_SUN, HR_NOT_SUMMER],
  }),
  hr({
    id: 'hr-svolvaer-bergen',
    slug: 'svolvaer-bergen',
    title: 'Dalle Lofoten ai fiordi occidentali',
    route: 'Svolvær → Brønnøysund → Trondheim → Bergen (verso sud)',
    direction: 'sud',
    fromPort: 'Svolvær',
    toPort: 'Bergen',
    days: 4,
    stops: 16,
    meals: 'nessuno',
    summary: 'Dalle Lofoten a Bergen lungo la costa di Helgeland, isole e siti UNESCO.',
    highlights: ['Lofoten', 'Le Sette Sorelle', 'Torghatten', 'Molde, città delle rose', 'Bergen'],
    prices: [{ cabin: 'non specificata', perPerson: 575 }],
    priceValidFor: 'novembre 2026',
    summerNotes: [HR_NOT_SUMMER],
  }),
  hr({
    id: 'hr-kirkenes-svolvaer',
    slug: 'kirkenes-svolvaer',
    title: 'Dal confine norvegese alle Lofoten',
    route: 'Kirkenes → Hammerfest → Svolvær (verso sud)',
    direction: 'sud',
    fromPort: 'Kirkenes',
    toPort: 'Svolvær',
    days: 3,
    stops: 17,
    meals: 'nessuno',
    summary: 'Lungo la costa settentrionale da Kirkenes alle Lofoten, con sosta a Tromsø.',
    highlights: ['Kirkenes', 'Fortezza di Vardø', 'Hammerfest', 'Tromsø con il sole di mezzanotte (estate)', 'Trollfjord', 'Arrivo alle Lofoten'],
    prices: [{ cabin: 'non specificata', perPerson: 478 }],
    priceValidFor: 'novembre 2026',
    summerNotes: [MIDNIGHT_SUN, HR_NOT_SUMMER],
  }),
  hr({
    id: 'hr-kirkenes-tromso',
    slug: 'kirkenes-tromso',
    title: 'Dal confine norvegese alla capitale dell\'Artico',
    route: 'Kirkenes → Hammerfest → Tromsø (verso sud)',
    direction: 'sud',
    fromPort: 'Kirkenes',
    toPort: 'Tromsø',
    days: 2,
    stops: 12,
    meals: 'nessuno',
    summary: 'Due giorni nel nord estremo, da Kirkenes a Tromsø.',
    highlights: ['Kirkenes', 'Fortezza di Vardø', 'Hammerfest', 'Tromsø'],
    prices: [{ cabin: 'non specificata', perPerson: 301 }],
    priceValidFor: 'novembre 2026',
    summerNotes: [MIDNIGHT_SUN, HR_NOT_SUMMER],
  }),

  // ---------------- Havila (prezzi agosto 2027) ----------------
  hv({
    id: 'hv-bergen-trondheim',
    slug: 'bergen-trondheim',
    title: 'Fiordi occidentali fino a Trondheim',
    route: 'Bergen → Ålesund → Trondheim (verso nord)',
    direction: 'nord',
    fromPort: 'Bergen',
    toPort: 'Trondheim',
    days: 3,
    stops: 10,
    summary: 'Dalle banchine colorate di Bergen ad Ålesund in stile liberty e ai fiordi, fino a Trondheim e alla sua cattedrale.',
    highlights: ['Bergen e la costa occidentale', 'Ålesund in stile liberty', 'Geirangerfjord o Hjørundfjord', 'Trondheim e il duomo di Nidaros'],
    itinerary: [
      { day: 1, title: 'Partenza da Bergen', ports: ['Bergen'] },
      { day: 2, title: 'Ålesund e i fiordi', ports: ports('Florø, Måløy, Torvik, Ålesund, Geiranger, Hjørundfjord, Molde') },
      { day: 3, title: 'Arrivo a Trondheim', ports: ports('Kristiansund, Trondheim') },
    ],
    prices: [
      { cabin: 'Interna', perPerson: 773 },
      { cabin: 'Vista mare', perPerson: 1414 },
    ],
    summerNotes: ['Nel programma compare la sosta a Geiranger (fiordo navigato nella stagione estiva).'],
  }),
  hv({
    id: 'hv-bergen-tromso',
    slug: 'bergen-tromso',
    title: 'Dai fiordi alla capitale dell\'Artico',
    route: 'Bergen → Trondheim → Tromsø (verso nord)',
    direction: 'nord',
    fromPort: 'Bergen',
    toPort: 'Tromsø',
    days: 5,
    stops: 24,
    summary: 'Cinque giorni da Bergen a Tromsø: fiordi occidentali, Trondheim, l\'ingresso nell\'Artico e le Lofoten.',
    highlights: ['Ålesund e i fiordi', 'Trondheim', 'Attraversamento del Circolo polare', 'Lofoten e Vesterålen', 'Tromsø'],
    itinerary: [
      { day: 1, title: 'Partenza da Bergen', ports: ['Bergen'] },
      { day: 2, title: 'Ålesund e i fiordi', ports: ports('Florø, Måløy, Torvik, Ålesund, Geiranger, Hjørundfjord, Molde') },
      { day: 3, title: 'Trondheim', ports: ports('Kristiansund, Trondheim, Rørvik') },
      { day: 4, title: 'Ingresso nell\'Artico', ports: ports('Brønnøysund, Sandnessjøen, Nesna, Ørnes, Bodø, Stamsund, Svolvær') },
      { day: 5, title: 'Arrivo a Tromsø', ports: ports('Stokmarknes, Sortland, Risøyhamn, Harstad, Finnsnes, Tromsø') },
    ],
    prices: [
      { cabin: 'Interna', perPerson: 1299 },
      { cabin: 'Vista mare', perPerson: 2380 },
    ],
    summerNotes: [MIDNIGHT_SUN],
  }),
  hv({
    id: 'hv-trondheim-tromso',
    slug: 'trondheim-tromso',
    title: 'L\'avventura nel nord della Norvegia',
    route: 'Trondheim → Bodø → Tromsø (verso nord)',
    direction: 'nord',
    fromPort: 'Trondheim',
    toPort: 'Tromsø',
    days: 3,
    stops: 15,
    summary: 'Da Trondheim a Tromsø attraverso il Circolo polare, la costa di Helgeland e le Lofoten.',
    highlights: ['Trondheim', 'Attraversamento del Circolo polare', 'Lofoten e Vesterålen', 'Tromsø'],
    itinerary: [
      { day: 1, title: 'Partenza da Trondheim', ports: ports('Trondheim, Rørvik') },
      { day: 2, title: 'Ingresso nell\'Artico', ports: ports('Brønnøysund, Sandnessjøen, Nesna, Ørnes, Bodø, Stamsund, Svolvær') },
      { day: 3, title: 'Arrivo a Tromsø', ports: ports('Stokmarknes, Sortland, Risøyhamn, Harstad, Finnsnes, Tromsø') },
    ],
    prices: [
      { cabin: 'Interna', perPerson: 644 },
      { cabin: 'Vista mare', perPerson: 1179 },
    ],
    summerNotes: [MIDNIGHT_SUN],
  }),
  hv({
    id: 'hv-trondheim-kirkenes',
    slug: 'trondheim-kirkenes',
    title: 'Da Trondheim ai confini dell\'Artico',
    route: 'Trondheim → Tromsø → Kirkenes (verso nord)',
    direction: 'nord',
    fromPort: 'Trondheim',
    toPort: 'Kirkenes',
    days: 5,
    stops: 27,
    summary: 'Tutta la metà settentrionale della rotta: da Trondheim fino a Kirkenes, passando per Lofoten, Tromsø e Honningsvåg.',
    highlights: ['Attraversamento del Circolo polare', 'Lofoten', 'Tromsø', 'Honningsvåg (Capo Nord)', 'Kirkenes'],
    itinerary: [
      { day: 1, title: 'Partenza da Trondheim', ports: ports('Trondheim, Rørvik') },
      { day: 2, title: 'Ingresso nell\'Artico', ports: ports('Brønnøysund, Sandnessjøen, Nesna, Ørnes, Bodø, Stamsund, Svolvær') },
      { day: 3, title: 'Tromsø, capitale dell\'Artico', ports: ports('Stokmarknes, Sortland, Risøyhamn, Harstad, Finnsnes, Tromsø, Skjervøy') },
      { day: 4, title: 'All\'estremità d\'Europa', ports: ports('Øksfjord, Hammerfest, Havøysund, Honningsvåg, Kjøllefjord, Mehamn, Berlevåg') },
      { day: 5, title: 'Arrivo a Kirkenes', ports: ports('Båtsfjord, Vardø, Vadsø, Kirkenes') },
    ],
    prices: [
      { cabin: 'Interna', perPerson: 1325 },
      { cabin: 'Vista mare', perPerson: 2427 },
    ],
    summerNotes: [MIDNIGHT_SUN],
  }),
  hv({
    id: 'hv-tromso-kirkenes',
    slug: 'tromso-kirkenes',
    title: 'La punta più settentrionale d\'Europa',
    route: 'Tromsø → Honningsvåg → Kirkenes (verso nord)',
    direction: 'nord',
    fromPort: 'Tromsø',
    toPort: 'Kirkenes',
    days: 3,
    stops: 13,
    summary: 'Da Tromsø a Kirkenes passando per Hammerfest e Honningsvåg.',
    highlights: ['Tromsø', 'Hammerfest', 'Honningsvåg (Capo Nord)', 'Kirkenes'],
    itinerary: [
      { day: 1, title: 'Partenza da Tromsø', ports: ports('Tromsø, Skjervøy') },
      { day: 2, title: 'All\'estremità d\'Europa', ports: ports('Øksfjord, Hammerfest, Havøysund, Honningsvåg, Kjøllefjord, Mehamn, Berlevåg') },
      { day: 3, title: 'Arrivo a Kirkenes', ports: ports('Båtsfjord, Vardø, Vadsø, Kirkenes') },
    ],
    prices: [
      { cabin: 'Interna', perPerson: 1082 },
      { cabin: 'Vista mare', perPerson: 1980 },
    ],
    summerNotes: [MIDNIGHT_SUN],
  }),
  hv({
    id: 'hv-tromso-kirkenes-tromso',
    slug: 'tromso-kirkenes-tromso',
    title: 'Nel grande nord e ritorno',
    route: 'Tromsø → Kirkenes → Tromsø (andata e ritorno)',
    direction: 'nord',
    fromPort: 'Tromsø',
    toPort: 'Kirkenes',
    roundTrip: true,
    days: 4,
    stops: 12,
    summary: 'Andata e ritorno da Tromsø: si sale fino a Kirkenes e si torna a Tromsø sulla stessa nave.',
    highlights: ['Tromsø', 'Hammerfest', 'Honningsvåg (Capo Nord)', 'Kirkenes', 'Ritorno a Tromsø'],
    itinerary: [
      { day: 1, title: 'Partenza da Tromsø', ports: ports('Tromsø, Skjervøy') },
      { day: 2, title: 'All\'estremità d\'Europa', ports: ports('Øksfjord, Hammerfest, Havøysund, Honningsvåg, Kjøllefjord, Mehamn, Berlevåg') },
      { day: 3, title: 'Kirkenes, il confine orientale', ports: ports('Båtsfjord, Vardø, Vadsø, Kirkenes, Vardø, Båtsfjord, Berlevåg') },
      { day: 4, title: 'Verso sud fino a Tromsø', ports: ports('Mehamn, Kjøllefjord, Honningsvåg, Havøysund, Hammerfest, Øksfjord, Skjervøy, Tromsø') },
    ],
    prices: [
      { cabin: 'Interna', perPerson: 897 },
      { cabin: 'Vista mare', perPerson: 1642 },
    ],
    summerNotes: [MIDNIGHT_SUN, 'Andata e ritorno: nell\'itinerario dell\'app la nave è registrata come tratto Tromsø → Kirkenes.'],
  }),
  hv({
    id: 'hv-trondheim-bergen',
    slug: 'trondheim-bergen',
    title: 'Mare, fiordi e montagne',
    route: 'Trondheim → Kristiansund → Bergen (verso sud)',
    direction: 'sud',
    fromPort: 'Trondheim',
    toPort: 'Bergen',
    days: 2,
    stops: 8,
    summary: 'Due giorni da Trondheim a Bergen, con Kristiansund, Molde e Ålesund.',
    highlights: ['Trondheim', 'Kristiansund', 'Molde', 'Ålesund', 'Bergen'],
    itinerary: [
      { day: 1, title: 'Da Trondheim a Kristiansund', ports: ports('Trondheim, Kristiansund, Molde') },
      { day: 2, title: 'Arrivo a Bergen', ports: ports('Ålesund, Torvik, Måløy, Florø, Bergen') },
    ],
    prices: [
      { cabin: 'Interna', perPerson: 271 },
      { cabin: 'Vista mare', perPerson: 483 },
    ],
    summerNotes: [],
  }),
  hv({
    id: 'hv-tromso-trondheim',
    slug: 'tromso-trondheim',
    title: 'Lofoten e Circolo polare',
    route: 'Tromsø → Svolvær → Trondheim (verso sud)',
    direction: 'sud',
    fromPort: 'Tromsø',
    toPort: 'Trondheim',
    days: 3,
    stops: 14,
    summary: 'Da Tromsø a Trondheim attraverso Lofoten, Vesterålen e la costa di Helgeland.',
    highlights: ['Tromsø', 'Lofoten e Vesterålen', 'Costa di Helgeland', 'Trondheim'],
    itinerary: [
      { day: 1, title: 'Partenza da Tromsø', ports: ['Tromsø'] },
      { day: 2, title: 'Lofoten e Vesterålen', ports: ports('Finnsnes, Harstad, Risøyhamn, Sortland, Stokmarknes, Svolvær, Stamsund') },
      { day: 3, title: 'Costa di Helgeland', ports: ports('Bodø, Ørnes, Nesna, Sandnessjøen, Brønnøysund, Rørvik') },
      { day: 4, title: 'Arrivo a Trondheim', ports: ['Trondheim'] },
    ],
    prices: [
      { cabin: 'Interna', perPerson: 719 },
      { cabin: 'Vista mare', perPerson: 1317 },
    ],
    summerNotes: [MIDNIGHT_SUN, 'Il sito indica 3 giorni ma il programma mostra l\'arrivo a Trondheim il giorno 4: da verificare.'],
  }),
  hv({
    id: 'hv-tromso-bergen',
    slug: 'tromso-bergen',
    title: 'Da Tromsø ai fiordi occidentali',
    route: 'Tromsø → Svolvær → Bergen (verso sud)',
    direction: 'sud',
    fromPort: 'Tromsø',
    toPort: 'Bergen',
    days: 5,
    stops: 22,
    summary: 'Cinque giorni verso sud da Tromsø a Bergen: Lofoten, Helgeland, Trondheim e i fiordi occidentali.',
    highlights: ['Lofoten e Vesterålen', 'Costa di Helgeland', 'Trondheim e Kristiansund', 'Ålesund', 'Bergen'],
    itinerary: [
      { day: 1, title: 'Partenza da Tromsø', ports: ['Tromsø'] },
      { day: 2, title: 'Lofoten e Vesterålen', ports: ports('Finnsnes, Harstad, Risøyhamn, Sortland, Stokmarknes, Svolvær, Stamsund') },
      { day: 3, title: 'Costa di Helgeland', ports: ports('Bodø, Ørnes, Nesna, Sandnessjøen, Brønnøysund, Rørvik') },
      { day: 4, title: 'Da Trondheim a Kristiansund', ports: ports('Trondheim, Kristiansund, Molde') },
      { day: 5, title: 'Arrivo a Bergen', ports: ports('Ålesund, Torvik, Måløy, Florø, Bergen') },
    ],
    prices: [
      { cabin: 'Interna', perPerson: 920 },
      { cabin: 'Vista mare', perPerson: 1684 },
    ],
    summerNotes: [MIDNIGHT_SUN],
  }),
  hv({
    id: 'hv-kirkenes-tromso',
    slug: 'kirkenes-tromso',
    title: 'Mondi artici',
    route: 'Kirkenes → Hammerfest → Tromsø (verso sud)',
    direction: 'sud',
    fromPort: 'Kirkenes',
    toPort: 'Tromsø',
    days: 2,
    stops: 12,
    summary: 'Due giorni da Kirkenes a Tromsø lungo la costa più settentrionale d\'Europa.',
    highlights: ['Kirkenes', 'Vardø', 'Honningsvåg', 'Hammerfest', 'Tromsø'],
    itinerary: [
      { day: 1, title: 'Partenza da Kirkenes', ports: ports('Kirkenes, Vardø, Båtsfjord, Berlevåg') },
      { day: 2, title: 'Dall\'estremità d\'Europa verso sud', ports: ports('Mehamn, Kjøllefjord, Honningsvåg, Havøysund, Hammerfest, Øksfjord, Skjervøy, Tromsø') },
    ],
    prices: [
      { cabin: 'Interna', perPerson: 354 },
      { cabin: 'Vista mare', perPerson: 648 },
    ],
    summerNotes: [MIDNIGHT_SUN],
  }),
  hv({
    id: 'hv-kirkenes-trondheim',
    slug: 'kirkenes-trondheim',
    title: 'Dalla costa artica a Trondheim',
    route: 'Kirkenes → Hammerfest → Trondheim (verso sud)',
    direction: 'sud',
    fromPort: 'Kirkenes',
    toPort: 'Trondheim',
    days: 5,
    stops: 26,
    summary: 'Da Kirkenes a Trondheim: costa artica, Tromsø, Lofoten e Helgeland.',
    highlights: ['Kirkenes e Vardø', 'Honningsvåg e Hammerfest', 'Tromsø', 'Lofoten e Vesterålen', 'Trondheim'],
    itinerary: [
      { day: 1, title: 'Partenza da Kirkenes', ports: ports('Kirkenes, Vardø, Båtsfjord, Berlevåg') },
      { day: 2, title: 'Dall\'estremità d\'Europa verso sud', ports: ports('Mehamn, Kjøllefjord, Honningsvåg, Havøysund, Hammerfest, Øksfjord, Skjervøy, Tromsø') },
      { day: 3, title: 'Lofoten e Vesterålen', ports: ports('Finnsnes, Harstad, Risøyhamn, Sortland, Stokmarknes, Svolvær, Stamsund') },
      { day: 4, title: 'Costa di Helgeland', ports: ports('Bodø, Ørnes, Nesna, Sandnessjøen, Brønnøysund, Rørvik') },
      { day: 5, title: 'Arrivo a Trondheim', ports: ['Trondheim'] },
    ],
    prices: [
      { cabin: 'Interna', perPerson: 1019 },
      { cabin: 'Vista mare', perPerson: 1867 },
    ],
    summerNotes: [MIDNIGHT_SUN],
  }),
];

export function catalogFor(operator: CoastalOperator): CoastalCatalogVoyage[] {
  return COASTAL_CATALOG.filter((v) => v.operator === operator).sort((a, b) => a.days - b.days || a.fromPort.localeCompare(b.fromPort));
}

export function findCatalogVoyage(id: string | undefined): CoastalCatalogVoyage | undefined {
  return id ? COASTAL_CATALOG.find((v) => v.id === id) : undefined;
}
