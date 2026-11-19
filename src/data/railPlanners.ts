// Pagine nazionali consultate il 19/11/2026. Non sono API né conferme di servizi per una stazione.
export const RAIL_PLANNERS: Record<string, { label: string; url: string; checkedAt: string }> = {
  DE: { label: 'Cerca treni su Deutsche Bahn', url: 'https://int.bahn.de/en', checkedAt: '2026-11-19' },
  FR: { label: 'Cerca treni su SNCF Connect', url: 'https://www.sncf-connect.com/en-en/', checkedAt: '2026-11-19' },
  JP: { label: 'Guida ufficiale ai trasporti in Giappone · JNTO', url: 'https://www.japan.travel/en/plan/getting-around/', checkedAt: '2026-11-19' },
  NL: { label: 'Cerca treni su NS', url: 'https://www.ns.nl/en', checkedAt: '2026-11-19' },
  DK: { label: 'Cerca treni su DSB', url: 'https://www.dsb.dk/en/', checkedAt: '2026-11-19' },
  SE: { label: 'Cerca treni su SJ', url: 'https://www.sj.se/en', checkedAt: '2026-11-19' },
};
