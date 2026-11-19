// Pagine nazionali consultate il 19/11/2026. Non sono API né conferme di servizi per una stazione.
export const RAIL_PLANNERS: Record<string, { label: string; url: string; checkedAt?: string }> = {
  DE: { label: 'Cerca treni su Deutsche Bahn', url: 'https://int.bahn.de/en', checkedAt: '2026-11-19' },
  FR: { label: 'Cerca treni su SNCF Connect', url: 'https://www.sncf-connect.com/en-en/', checkedAt: '2026-11-19' },
  JP: { label: 'Guida ufficiale ai trasporti in Giappone · JNTO', url: 'https://www.japan.travel/en/plan/getting-around/', checkedAt: '2026-11-19' },
  NL: { label: 'Cerca treni su NS', url: 'https://www.ns.nl/en', checkedAt: '2026-11-19' },
  DK: { label: 'Cerca treni su DSB', url: 'https://www.dsb.dk/en/', checkedAt: '2026-11-19' },
  SE: { label: 'Cerca treni su SJ', url: 'https://www.sj.se/en', checkedAt: '2026-11-19' },
  SI: { label: 'Cerca treni su Slovenske železnice', url: 'https://potniski.sz.si/en/', checkedAt: '2026-11-19' },
  AT: { label: 'Cerca treni su ÖBB', url: 'https://www.oebb.at/en/', checkedAt: '2026-11-19' },
  ES: { label: 'Cerca treni su Renfe', url: 'https://www.renfe.com/es/en', checkedAt: '2026-11-19' },
  PT: { label: 'Cerca treni su CP', url: 'https://www.cp.pt/passageiros/en', checkedAt: '2026-11-19' },
  HR: { label: 'Cerca treni su HŽPP', url: 'https://www.hzpp.hr/en' },
  GR: { label: 'Cerca treni su Hellenic Train', url: 'https://www.hellenictrain.gr/en/', checkedAt: '2026-11-19' },
  TR: { label: 'Cerca treni su TCDD Taşımacılık', url: 'https://www.tcddtasimacilik.gov.tr/', checkedAt: '2026-11-19' },
  FI: { label: 'Cerca treni su VR', url: 'https://www.vr.fi/en', checkedAt: '2026-11-19' },
  GB: { label: 'Cerca treni su National Rail · Gran Bretagna', url: 'https://www.nationalrail.co.uk/', checkedAt: '2026-11-19' },
  IE: { label: 'Cerca treni su Irish Rail', url: 'https://www.irishrail.ie/en-ie/', checkedAt: '2026-11-19' },
  TH: { label: 'Cerca treni su State Railway of Thailand', url: 'https://www.railway.co.th/', checkedAt: '2026-11-19' },
  KH: { label: 'Cerca treni su Royal Railway Cambodia', url: 'https://www.royalrailway.com.kh/', checkedAt: '2026-11-19' },
  VN: { label: 'Cerca treni su Vietnam Railways', url: 'https://www.vr.com.vn/en' },
  IN: { label: 'Cerca treni su IRCTC', url: 'https://www.irctc.co.in/nget/train-search' },
};

/** National Rail copre la Gran Bretagna, non la rete dell'Irlanda del Nord. */
export const NORTHERN_IRELAND_RAIL = { label: 'Cerca treni su Translink · Irlanda del Nord', url: 'https://www.translink.co.uk/', checkedAt: '2026-11-19' };
