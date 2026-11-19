import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { CatalogSeed, PlaceSeed } from './seed-catalog';
import type { PlacePhoto } from '../src/data/placeExtras';

interface ResearchedPlace {
  key: string; name: string; title: string; category: string; region: string; description: string;
  qid: string; lat: number; lng: number; localName?: string; iata?: string;
  official?: string; wiki: { it?: string; en?: string }; photos: PlacePhoto[]; checkedAt: string;
}
interface ResearchedCountry {
  name: string; en: string; language: string; currency: string; timezone: string;
  tourism: string; regions: string[]; checkedAt: string; places: ResearchedPlace[];
}

export const INTERNATIONAL_CODES = ['DE', 'FR', 'JP', 'NL', 'DK', 'SE'] as const;

/** Il file è un input del seed, non una dipendenza della build frontend. */
export function buildInternational(code: string): CatalogSeed {
  if (!(INTERNATIONAL_CODES as readonly string[]).includes(code)) throw new Error(`Nazione non supportata: ${code}`);
  const all = JSON.parse(readFileSync(fileURLToPath(new URL('../src/data/catalogs/international-v1.json', import.meta.url)), 'utf8')) as Record<string, ResearchedCountry>;
  const c = all[code];
  if (!c || c.places.length !== 30) throw new Error(`Ricerca incompleta per ${code}`);
  const regionKey = (name: string) => `${code.toLowerCase()}-r${c.regions.indexOf(name) + 1}`;
  const places: PlaceSeed[] = c.places.map((p) => {
    const url = `https://www.wikidata.org/wiki/${p.qid}`;
    const coordinates = { label: `Wikidata ${p.qid} · P625`, url, checkedAt: p.checkedAt, license: 'CC0-1.0', method: 'API Wikidata: coordinate terrestri e controllo geografico della nazione' };
    const base = p.category === 'citta';
    const source = { label: `Wikidata ${p.qid}`, url, checkedAt: p.checkedAt, license: 'CC0-1.0', note: 'Dati strutturati; orari, tariffe e disponibilità non verificati' };
    return {
      key: p.key, category: p.category, regionKey: regionKey(p.region), lat: p.lat, lng: p.lng,
      coordsStatus: 'verificate', localName: p.localName, reliability: 'da_verificare',
      isBase: base, dayVisit: !base && p.category !== 'aeroporti', iata: p.iata,
      // Nessuna durata, idoneità familiare o accessibilità dedotta dalla categoria.
      wiki: { qid: p.qid, ...p.wiki, image: p.photos[0]?.file }, photos: p.photos, photosCheckedAt: p.checkedAt,
      official: p.official ? { url: p.official, kind: base ? 'ente' : 'attrazione', via: 'Wikidata' } : undefined,
      texts: { it: {
        name: p.name, description: p.description,
        access: 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.',
        season: 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.',
      } },
      sources: {
        coordinate: [coordinates], scheda: [source], wikidata: [source],
        testi: [{ label: 'Redazione del catalogo', checkedAt: p.checkedAt, method: 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato' }],
        // P856 è un riferimento importato, non una pagina di cui dichiariamo la verifica.
        ...(p.official ? { sito_ufficiale: [{ label: 'Sito indicato in Wikidata (P856), da verificare', url: p.official, checkedAt: p.checkedAt, note: 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate' }] } : {}),
      },
    };
  });
  return {
    country: { code, name: c.name, names: { en: c.en }, currency: c.currency, timezone: c.timezone, language: c.language },
    release: {
      version: 1, dataCheckedUntil: c.checkedAt,
      notes: 'Prima selezione editoriale: città, musei, natura, parchi e aeroporti. Coordinate da Wikidata; foto Commons con licenza per file. Informazioni operative da verificare. Trasporti non ancora catalogati.',
      sourceNotes: [{ label: 'Wikidata: dati strutturati CC0', url: 'https://www.wikidata.org/wiki/Wikidata:Licensing', checkedAt: c.checkedAt, license: 'CC0-1.0' }, { label: `Ente turistico · ${c.name}`, url: c.tourism, checkedAt: c.checkedAt, note: 'Consultato per il contesto e la copertura; testi e immagini non importati' }],
      roadCalibrated: false, roadNote: 'Parametri stradali non calibrati per questa nazione. I tempi del configuratore sono indicativi: calcolare i trasferimenti prima di attivare.',
    },
    regions: c.regions.map((name) => ({ key: regionKey(name), name, areas: [], sources: [{ label: 'Raggruppamento editoriale per esplorare il catalogo', checkedAt: c.checkedAt, note: 'Zone di viaggio; confini cartografici non importati' }] })),
    places, operators: [], voyages: [], routePorts: [], links: [], outFile: `catalogo-${code.toLowerCase()}-v1.sql`,
  };
}
