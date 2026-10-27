// Porti della rotta costiera Bergen–Kirkenes (34 porti + scali stagionali).
// Ordine e porti verificati il 27/10/2026 sull'itinerario "Round Voyage" di Havila Voyages
// e sulla pagina port-to-port di Hurtigruten (34 porti). Coordinate APPROSSIMATIVE (centro abitato),
// da non usare come posizione del molo. Orari e scali stagionali vanno verificati sul piano di navigazione.

export interface CoastalPort {
  name: string;
  lat: number;
  lng: number;
  /** Scalo solo in direzione nord */
  northboundOnly?: boolean;
  /** Scalo/deviazione stagionale, da verificare per la data scelta */
  seasonal?: boolean;
}

export const COASTAL_PORTS_NORTHBOUND: CoastalPort[] = [
  { name: 'Bergen', lat: 60.392, lng: 5.322 },
  { name: 'Florø', lat: 61.6, lng: 5.032 },
  { name: 'Måløy', lat: 61.935, lng: 5.113 },
  { name: 'Torvik', lat: 62.33, lng: 5.74 },
  { name: 'Ålesund', lat: 62.472, lng: 6.15 },
  { name: 'Geiranger', lat: 62.101, lng: 7.206, seasonal: true, northboundOnly: true },
  { name: 'Molde', lat: 62.737, lng: 7.16 },
  { name: 'Kristiansund', lat: 63.11, lng: 7.728 },
  { name: 'Trondheim', lat: 63.436, lng: 10.399 },
  { name: 'Rørvik', lat: 64.862, lng: 11.238 },
  { name: 'Brønnøysund', lat: 65.474, lng: 12.212 },
  { name: 'Sandnessjøen', lat: 66.021, lng: 12.63 },
  { name: 'Nesna', lat: 66.199, lng: 13.02 },
  { name: 'Ørnes', lat: 66.869, lng: 13.707 },
  { name: 'Bodø', lat: 67.283, lng: 14.38 },
  { name: 'Stamsund', lat: 68.125, lng: 13.845 },
  { name: 'Svolvær', lat: 68.234, lng: 14.568 },
  { name: 'Stokmarknes', lat: 68.565, lng: 14.91 },
  { name: 'Sortland', lat: 68.696, lng: 15.414 },
  { name: 'Risøyhamn', lat: 68.97, lng: 15.65 },
  { name: 'Harstad', lat: 68.799, lng: 16.541 },
  { name: 'Finnsnes', lat: 69.229, lng: 17.981 },
  { name: 'Tromsø', lat: 69.649, lng: 18.956 },
  { name: 'Skjervøy', lat: 70.033, lng: 20.973 },
  { name: 'Øksfjord', lat: 70.239, lng: 22.351 },
  { name: 'Hammerfest', lat: 70.663, lng: 23.682 },
  { name: 'Havøysund', lat: 70.996, lng: 24.662 },
  { name: 'Honningsvåg', lat: 70.982, lng: 25.97 },
  { name: 'Kjøllefjord', lat: 70.946, lng: 27.348 },
  { name: 'Mehamn', lat: 71.035, lng: 27.849 },
  { name: 'Berlevåg', lat: 70.857, lng: 29.09 },
  { name: 'Båtsfjord', lat: 70.634, lng: 29.718 },
  { name: 'Vardø', lat: 70.37, lng: 31.108 },
  { name: 'Vadsø', lat: 70.074, lng: 29.75, northboundOnly: true },
  { name: 'Kirkenes', lat: 69.727, lng: 30.045 },
];

export function portsFor(direction: 'nord' | 'sud'): CoastalPort[] {
  if (direction === 'nord') return COASTAL_PORTS_NORTHBOUND;
  return COASTAL_PORTS_NORTHBOUND.filter((p) => !p.northboundOnly).slice().reverse();
}

export const COASTAL_SOURCES = {
  Hurtigruten: [
    {
      label: 'Hurtigruten — Port-to-port (regole cabine, pasti, sconti bambini)',
      url: 'https://www.hurtigruten.com/en-gb/practical-information/port-to-port',
      checkedAt: '2026-10-27',
    },
    { label: 'Hurtigruten — Prenotazione port-to-port', url: 'https://www.hurtigruten.com/en/port-to-port', checkedAt: '2026-10-27' },
    { label: 'Hurtigruten — Piano di navigazione', url: 'https://www.hurtigruten.com/en/sail-plan' },
  ],
  Havila: [
    { label: 'Havila Voyages — FAQ port-to-port', url: 'https://www.havilavoyages.com/faq/port-to-port', checkedAt: '2026-10-27' },
    {
      label: 'Havila Voyages — Round voyage (ordine dei porti)',
      url: 'https://havilavoyages.com/voyages/round-voyage-bergen-kirkenes-bergen',
      checkedAt: '2026-10-27',
    },
  ],
} as const;

/** Fatti verificati il 27/10/2026 sulle pagine ufficiali. Non sono tariffe 2027. */
export const COASTAL_FACTS: Record<'Hurtigruten' | 'Havila', string[]> = {
  Hurtigruten: [
    'Si può scegliere porto di imbarco e sbarco tra i 34 porti, con biglietto di sola andata o andata e ritorno.',
    'Cabina facoltativa per viaggi sotto le 23 ore, obbligatoria oltre le 23 ore; suite non disponibili per il port-to-port.',
    'Pasti non inclusi: pensione completa, mezza pensione o à la carte acquistabili in prenotazione o a bordo.',
    'Bambini fino a 5 anni gratis, da 6 a 17 anni sconto del 75% sul solo biglietto (non su cabina, pasti ed extra).',
    'Trasporto auto: non chiarito sulla pagina port-to-port, da verificare con il servizio clienti.',
  ],
  Havila: [
    'Port-to-port tra 34 porti; check-in fino a 15 minuti prima della partenza.',
    'Cabina facoltativa: per i tratti notturni si può scegliere poltrona o cabina.',
    'Pasti non inclusi: pacchetti colazione/pranzo/cena acquistabili online (sconto 15% indicato) o caffetteria a bordo.',
    'Veicoli aggiungibili separatamente dove disponibile.',
    'Prenotazione al massimo 6 mesi prima della partenza: per agosto 2027 si apre indicativamente a febbraio 2027.',
    'Sconti per bambini: non riportati nella FAQ consultata, da verificare.',
  ],
};
