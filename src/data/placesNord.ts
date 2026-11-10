// Luoghi della zona nord per il catalogo NO-3: unisce i dati di base (src/data/nordFonti.ts, generato dalla ricerca)
// con le schede scritte a mano (src/data/nordSchede.ts). Usato SOLO da buildNorwayV3 in scripts/seed-catalog.ts:
// i file dell'app (DESTINATIONS, WIKI…) restano quelli di NO-1/NO-2, che non devono cambiare.

import type { Category, Destination, Region } from '../domain/types';
import { NORD_CHECKED_AT, NORD_FONTI, NORD_FOTO_ESISTENTI } from './nordFonti';
import { NORD_CONSIGLI, NORD_SCHEDE } from './nordSchede';
import type { PlacePhoto, PlaceTip } from './placeExtras';

export { NORD_CHECKED_AT };

export interface NordPlace {
  key: string;
  name: string;
  localName?: string;
  category: Category;
  region: Region;
  lat: number;
  lng: number;
  coordSource: { label: string; url: string; method: string; license: string };
  kidScore: Destination['kidScore'];
  difficulty: Destination['difficulty'];
  visitHours?: [number, number];
  description: string;
  access: string;
  season: string;
  augustNote?: string;
  wiki?: { qid: string; it?: string; en?: string; image?: string };
  official?: string;
}

const photos: Record<string, PlacePhoto[]> = { ...NORD_FOTO_ESISTENTI };

export const NORD_PLACES: NordPlace[] = NORD_SCHEDE.map((s) => {
  const f = NORD_FONTI[s.key];
  if (!f) throw new Error(`Scheda del nord senza dati di base: ${s.key}`);
  const useOsm = s.coord === 'osm' || !f.wd;
  const point = useOsm ? f.osm : f.wd;
  if (!point) throw new Error(`Scheda del nord senza coordinate da una fonte: ${s.key}`);
  const coordSource = useOsm
    ? { label: `OpenStreetMap (Nominatim): ${f.osm!.name}`, url: `https://www.openstreetmap.org/${f.osm!.id}`, method: `Nominatim: ${f.osm!.kind}`, license: 'ODbL 1.0' }
    : { label: `Wikidata ${f.wd!.qid} (${f.wd!.label})`, url: `https://www.wikidata.org/wiki/${f.wd!.qid}`, method: 'Wikidata P625', license: 'CC0 1.0' };
  // `entity: false`: l'elemento trovato è un'altra cosa vicina (una chiesa, un faro): niente voce, sito o foto sue
  const own = s.entity !== false && f.wd;
  // Con `entity: false` le foto dell'elemento vicino si usano solo se la scheda lo chiede (`photos: true`)
  const list = s.photos === false ? [] : own || f.photosOwn || s.photos === true ? f.photos : [];
  if (list.length) photos[s.key] = list;
  return {
    key: s.key,
    name: s.name,
    localName: s.localName,
    category: s.category,
    region: s.region,
    lat: point.lat,
    lng: point.lng,
    coordSource,
    kidScore: s.kid,
    difficulty: s.difficulty,
    visitHours: s.hours,
    description: s.description,
    access: s.access,
    season: s.season,
    augustNote: s.august,
    wiki: own ? { qid: own.qid, it: own.it, en: own.en, image: list[0]?.file } : undefined,
    official: own ? own.official : undefined,
  };
});

/** Foto per luogo (nuovi e già presenti): fino a 3, con autore e licenza */
export const NORD_PHOTOS: Record<string, PlacePhoto[]> = photos;

/** Consigli da fonti ufficiali, per luogo (nuovi e già presenti) */
export const NORD_TIPS: Record<string, PlaceTip[]> = NORD_CONSIGLI;
