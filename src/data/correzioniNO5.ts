// Correzioni del catalogo NO-5 (19/11/2026) ai luoghi pubblicati in NO-4. Le chiavi restano le stesse: cambiano solo
// testi, collegamento al sito ufficiale e foto dei luoghi elencati qui. NO-4 resta pubblicata e immutabile.
// - Testi: tolte o attenuate le affermazioni non verificate su una fonte («il più grande…», numeri non letti).
// - Siti ufficiali: controllati uno per uno il 19/11/2026. Tolti quelli che rispondono «pagina non trovata», con un
//   certificato non valido, senza risposta o che rimandano a una pagina generica; sostituiti solo con pagine aperte e
//   riconosciute dal titolo (nessun indirizzo dedotto).
// - Foto: da docs/ricerca-foto-no5.json (scripts/harvest-foto.mjs), stesse regole delle altre foto del catalogo.

import type { PlacePhoto } from './placeExtras';
import { FOTO_NO5 } from './fotoNO5';

export const CORRECTIONS_CHECKED_AT = '2026-11-19';

export interface PlaceCorrection {
  /** Testi italiani da sostituire (solo i campi indicati) */
  texts?: Partial<{ description: string; access: string; season: string; augustNote: string }>;
  /** Nuovo sito ufficiale verificato, oppure null per toglierlo */
  official?: string | null;
  /** Foto da usare al posto di quelle di NO-4 (fino a 3) */
  photos?: PlacePhoto[];
  /** Perché la scheda è stata corretta: finisce tra le fonti del luogo */
  why: string;
}

const foto = (key: string): PlacePhoto[] => (FOTO_NO5[key] ?? []).slice(0, 3);
const LINK_REMOVED = 'Sito ufficiale tolto: il 19/11/2026 non rispondeva o non era più quello del luogo';
const LINK_REPLACED = 'Sito ufficiale sostituito con una pagina verificata il 19/11/2026';
const TEXT = 'Testo corretto: tolta un\'affermazione non verificata su una fonte';

export const CORRECTIONS_NO5: Record<string, PlaceCorrection> = {
  // ---------- Testi ----------
  'fredrikstad-gamleby': {
    texts: { description: 'Città fortificata del Seicento ancora abitata, sulla riva est del fiume Glomma: bastioni, fossati e strade acciottolate.' },
    why: TEXT,
  },
  nasjonalmuseet: {
    texts: { description: 'Il più grande museo della Norvegia per arte, architettura e design, come si presenta sul suo sito; la nuova sede ha aperto nel 2022 e ha una sala dedicata a Munch.' },
    why: TEXT,
  },
  maihaugen: {
    texts: { description: 'Il più grande museo all\'aperto della Norvegia, come si presenta sul suo sito: circa 200 edifici, dalle fattorie della valle del Gudbrandsdal con una stavkirke fino a un quartiere di case del Novecento.' },
    why: TEXT,
  },
  midgard: {
    texts: { description: 'Il parco di Borre conserva sette grandi tumuli funerari e una ventina di tumuli più piccoli, di età vichinga e dei secoli prima. Accanto ci sono il centro Midgard, con le mostre, e la ricostruzione di una grande sala vichinga.' },
    why: TEXT,
  },
  trollveggen: {
    texts: { description: 'La «parete dei troll», nella valle del Romsdal: circa 1.000 metri di roccia in parte strapiombante, tra le pareti verticali più alte d\'Europa. Si guarda dal fondovalle.' },
    why: TEXT,
  },
  sognefjellsvegen: {
    texts: { description: 'Strada turistica nazionale tra Lom e il Lustrafjord (strada 55): sale a oltre 1.400 metri, tra i valichi stradali più alti del nord Europa, in mezzo ai ghiacciai e alle cime del Jotunheimen.' },
    why: TEXT,
  },
  vardohus: {
    texts: { description: 'Piccola fortezza a stella del 1737 nella città di Vardø, tra le più settentrionali al mondo.' },
    official: null,
    why: `${TEXT}. ${LINK_REMOVED}`,
  },
  'roros-kirke': {
    texts: { description: 'La grande chiesa bianca in pietra del 1784 che domina la città mineraria, chiamata «l\'ornamento della città»: è tra le chiese più grandi della Norvegia.' },
    why: TEXT,
  },
  'hopperstad-stavkirke': {
    texts: { description: 'Stavkirke del XII secolo, tra le più antiche rimaste, a Vik sul Sognefjord.' },
    why: TEXT,
  },
  'ovre-pasvik': {
    texts: { description: 'Lembo di taiga con pini secolari, laghi e paludi nella valle di Pasvik, stretta tra Finlandia e Russia; qui vive l\'orso bruno.' },
    why: TEXT,
  },
  'borgund-stavkirke': {
    texts: { description: 'Stavkirke costruita intorno al 1180, tra le meglio conservate della Norvegia: tetti a più livelli con teste di drago sui colmi. Accanto c\'è un centro visitatori.' },
    official: null,
    why: `${TEXT}. ${LINK_REMOVED}`,
  },
  svartisen: {
    texts: { description: 'Svartisen è il nome di due grandi ghiacciai del Saltfjellet, tra i maggiori della Norvegia. La lingua di Engabreen scende fin quasi al livello del mare, sull\'Holandsfjord.' },
    photos: foto('svartisen'),
    why: `${TEXT}. Foto della lingua di Engabreen al posto di quelle generiche del 1998`,
  },

  // ---------- Siti ufficiali ----------
  folgefonna: { official: 'https://www.norgesnasjonalparker.no/nasjonalparker/folgefonna/', why: LINK_REPLACED },
  reisa: { official: 'https://www.norgesnasjonalparker.no/nasjonalparker/reisa/', why: LINK_REPLACED },
  'hardangervidda-natursenter': { official: 'https://www.norsknatursenter.no/', why: LINK_REPLACED },
  jektefartsmuseet: { official: 'https://www.nordlandsmuseet.no/jektefartsmuseet', photos: foto('jektefartsmuseet'), why: `${LINK_REPLACED}. Foto della jekt «Anna Karoline», il cuore del museo` },
  fredriksten: { official: null, why: LINK_REMOVED },
  jernbanemuseum: { official: null, why: LINK_REMOVED },
  troldhaugen: { official: null, why: LINK_REMOVED },
  kode: { official: null, why: LINK_REMOVED },
  kristiansand: { official: null, why: LINK_REMOVED },
  ringve: { official: null, why: LINK_REMOVED },
  nordlyskatedralen: { official: null, why: LINK_REMOVED },
  'urnes-stavkirke': { official: null, why: LINK_REMOVED },
  erkebispegarden: { official: null, why: LINK_REMOVED },

  // ---------- Foto ----------
  rampestreken: {
    photos: [{ file: 'View of Romsdalsgondolen.jpg', author: 'Davide Mauro', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0' }],
    why: 'Tolte due foto panoramiche deformate',
  },
  hermetikkmuseum: { photos: foto('hermetikkmuseum'), why: 'Aggiunta una foto (prima mancava)' },
  avaldsnes: { photos: foto('avaldsnes'), why: 'Aggiunte foto della chiesa e degli scavi (prima mancavano)' },
};
