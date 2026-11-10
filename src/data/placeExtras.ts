// Foto e consigli dei luoghi (dal catalogo NO-3). I file dell'app valgono come NO-2: qui restano vuoti finché non
// arriva un catalogo che li contiene (src/catalog/registry.ts li sostituisce sul posto, come le altre strutture).
// Foto: solo file di Wikimedia Commons con licenza libera; autore e licenza letti alla data del catalogo.
// Consigli: solo da fonti ufficiali, sempre con la fonte e la data di lettura.

export interface PlacePhoto {
  /** Nome del file su Wikimedia Commons */
  file: string;
  author: string;
  license: string;
  licenseUrl?: string;
}

export interface PlaceTip {
  text: string;
  /** Nome della fonte ufficiale */
  source: string;
  url: string;
  checkedAt: string;
}

export const PLACE_PHOTOS: Record<string, PlacePhoto[]> = {};
export const PLACE_TIPS: Record<string, PlaceTip[]> = {};
