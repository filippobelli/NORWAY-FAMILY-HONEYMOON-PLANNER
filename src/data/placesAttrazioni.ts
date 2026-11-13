// Musei, parchi e attrazioni per il catalogo NO-4: unisce i dati di base (src/data/attrazioniFonti.ts, generato dalla
// ricerca) con le schede scritte a mano (src/data/attrazioniSchede.ts). Usato SOLO da buildNorwayV4 in
// scripts/seed-catalog.ts: i file dell'app restano quelli di NO-1/NO-2, che non devono cambiare.

import { ATTR_CHECKED_AT, ATTR_FONTI, ATTR_FOTO_ESISTENTI } from './attrazioniFonti';
import { ATTR_SCHEDE } from './attrazioniSchede';
import type { PlacePhoto } from './placeExtras';
import { joinPlaces, type NordPlace } from './placesNord';

export { ATTR_CHECKED_AT };

const photos: Record<string, PlacePhoto[]> = { ...ATTR_FOTO_ESISTENTI };

export const ATTR_PLACES: NordPlace[] = joinPlaces(ATTR_SCHEDE, ATTR_FONTI, photos);

/** Foto per luogo: i luoghi nuovi di NO-4 e quelli già presenti che non ne avevano; fino a 3, con autore e licenza */
export const ATTR_PHOTOS: Record<string, PlacePhoto[]> = photos;
