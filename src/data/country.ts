// Nazione del catalogo da file (riserva per sviluppo e test, D1, e base del seed). I file corrispondono alla versione
// NO-2 (NO-1 + traghetti, architettura §16.3): il seed di NO-1 prende da qui solo nazione, valuta, fuso e lingua.
// Nel funzionamento normale nazione, valuta, fuso e lingua arrivano dal catalogo scaricato (tabella countries).
export const FILE_COUNTRY = {
  code: 'NO',
  name: 'Norvegia',
  names: { en: 'Norway', nb: 'Norge' } as Record<string, string>,
  currency: 'NOK',
  timezone: 'Europe/Oslo',
  language: 'nb',
  releaseId: 'NO-2',
  version: 2,
};
