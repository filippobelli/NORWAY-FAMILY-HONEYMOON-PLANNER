// Nazione del catalogo da file (riserva per sviluppo e test, D1, e base del seed della versione NO-1).
// Nel funzionamento normale nazione, valuta, fuso e lingua arrivano dal catalogo scaricato (tabella countries).
export const FILE_COUNTRY = {
  code: 'NO',
  name: 'Norvegia',
  names: { en: 'Norway', nb: 'Norge' } as Record<string, string>,
  currency: 'NOK',
  timezone: 'Europe/Oslo',
  language: 'nb',
  releaseId: 'NO-1',
  version: 1,
};
