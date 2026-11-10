// Genera src/data/ferryRoutes.ts da docs/ricerca-traghetti.json (ricerca dell'analista, letta il 2026-11-09).
//
//   npx tsx scripts/build-ferry-routes.ts
//
// Nessuna chiamata di rete. Il file generato è deterministico. Regole:
// - nessun valore inventato: si copiano i valori della ricerca; ciò che manca resta assente con stato «assente»;
// - le poche regole tariffarie che il calcolo del costo deve leggere come numeri (tetto bambino, sconto ritorno,
//   tariffe fuori stagione, fascia d'età del biglietto passeggero, persone del pacchetto) sono in STRUCTURED:
//   ognuna cita il testo della ricerca da cui viene e lo script si ferma se quel testo non c'è più (niente deriva);
// - coordinate solo dove la ricerca ha l'id NSR;
// - i nomi Entur con caratteri rovinati (UTF-8 letto come Latin-1, es. «TromsÃ¸») si ricodificano: stessa stringa, non un dato nuovo.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGION_COUNTIES } from '../src/data/regionShapes';
import type {
  FerryCall, FerryDataStatus, FerryEnturLine, FerryFare, FerryFareInfo, FerryMode, FerryPassengerRule, FerryRoute, FerrySource, FerryStop, FerryText,
} from '../src/data/ferryTypes';
import type { Region } from '../src/domain/types';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v !== '' ? v : undefined);
const numOrUndef = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function status(v: unknown, where: string): FerryDataStatus {
  if (v === 'confermato') return 'confermato';
  if (v === 'da verificare' || v === 'da_verificare') return 'da_verificare';
  if (v === 'assente') return 'assente';
  throw new Error(`${where}: stato sconosciuto ${String(v)}`);
}

/** Caratteri di Windows-1252 nell'intervallo 0x80–0x9F (es. «…» = 0x85, «˜» = 0x98) */
const CP1252: Record<string, number> = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c,
  'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b,
  'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
};

/** «TromsÃ¸» → «Tromsø», «Ã…lesund» → «Ålesund» (solo se il testo è chiaramente UTF-8 letto come Windows-1252) */
function fixMojibake(s: string): string {
  if (!/[ÃÂ]/.test(s)) return s;
  const bytes: number[] = [];
  for (const ch of s) {
    const code = CP1252[ch] ?? ch.charCodeAt(0);
    if (code > 0xff) return s;
    bytes.push(code);
  }
  const fixed = Buffer.from(bytes).toString('utf8');
  return fixed.includes('�') ? s : fixed;
}

/** Intervallo di minuti: numero → [n, n]; [a, b] → [a, b]; altro → assente */
function range(v: unknown): [number, number] | undefined {
  if (typeof v === 'number') return [v, v];
  if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number') return [v[0], v[1]];
  return undefined;
}

/** Fascia d'età scritta come «6–17 …»: estremi numerici; il testo resta com'è */
function ages(text: string | undefined): { ageMin?: number; ageMax?: number } {
  const m = text?.match(/^(\d+)\s*[–-]\s*(\d+)/);
  return m ? { ageMin: Number(m[1]), ageMax: Number(m[2]) } : {};
}

function callOf(name: string): FerryCall {
  if (/\(a richiesta\)/i.test(name)) return 'a_richiesta';
  if (/solo passaggio/i.test(name)) return 'solo_passaggio';
  if (/senza sbarco/i.test(name)) return 'senza_sbarco';
  return 'fermata';
}

// ---------- Regole strutturate (dal testo della ricerca, citato) ----------

interface Structured {
  /** Testo della ricerca da cui viene la regola: deve esserci (in tariffa.regole, ritorno, passeggeri, pacchettoAuto.descrizione o nota della durata) */
  quote: string;
  apply: (r: FerryRoute) => void;
}

const STRUCTURED: Record<string, Structured[]> = {
  'bergen-flam-express': [
    {
      quote: 'Aurland solo discesa.',
      apply: (r) => {
        const s = r.stops.find((x) => x.name === 'Aurland kai');
        if (!s) throw new Error('bergen-flam-express: manca la fermata Aurland kai');
        s.call = 'solo_discesa';
      },
    },
    { quote: 'Bambino con adulto pagante: massimo 209 NOK per bambino, a tratta', apply: (r) => { r.fare.childCapNok = 209; } },
    {
      quote: 'Fuori dal periodo 18/5–31/8: adulto 1349, bambino 649, famiglia 3099',
      apply: (r) => {
        const base = r.fare.fares.find((f) => f.category === 'adulto')!;
        const off = { trip: 'andata' as const, period: 'fuori dal 18/5–31/8 (2027)', year: base.year, status: base.status, sourceKey: base.sourceKey };
        const child = r.fare.fares.find((f) => f.category === 'bambino')!;
        r.fare.fares.push(
          { ...off, category: 'adulto', amountNok: 1349 },
          { ...off, category: 'bambino', amountNok: 649, ageText: child.ageText, ageMin: child.ageMin, ageMax: child.ageMax },
          { ...off, category: 'famiglia', amountNok: 3099, adultsIncluded: 2, childrenIncluded: 2 },
        );
      },
    },
  ],
  'geiranger-hellesylt': [
    { quote: '50% di sconto sul ritorno (adulto e bambino)', apply: (r) => { r.fare.returnDiscountPct = 50; } },
    {
      quote: 'auto fino a 6 m con conducente + 4 passeggeri',
      apply: (r) => {
        for (const f of r.fare.fares) if (f.category === 'pacchetto_veicolo') Object.assign(f, { driverIncluded: true, passengersIncluded: 4 });
      },
    },
  ],
  'lysefjord-turistferje': [
    {
      quote: 'auto fino a 6 m + fino a 5 passeggeri (conducente compreso nel conteggio da verificare)',
      apply: (r) => {
        // Se il conducente rientri nei 5 non è chiaro: driverIncluded resta null (da verificare)
        for (const f of r.fare.fares) if (f.category === 'pacchetto_veicolo') Object.assign(f, { driverIncluded: null, passengersIncluded: 5, status: 'da_verificare' as const });
      },
    },
  ],
  'andenes-gryllefjord': [
    {
      quote: '2026 (prova): adulto 30–66 anni 100 NOK; bambini, giovani e senior gratis; conducente incluso nel prezzo del veicolo',
      apply: (r) => {
        r.fare.passengerRule = 'a_pagamento';
        const a = r.fare.fares.find((f) => f.category === 'adulto' && f.amountNok === 100);
        if (!a) throw new Error('andenes-gryllefjord: manca la voce adulto 100');
        Object.assign(a, { ageMin: 30, ageMax: 66, ageText: '30–66', note: 'Solo i passeggeri oltre al conducente (compreso nel prezzo del veicolo)' });
      },
    },
  ],
};

function textsOf(t: Obj): string[] {
  const f = isObj(t.tariffa) ? t.tariffa : {};
  const p = isObj(f.pacchettoAuto) ? f.pacchettoAuto : {};
  const d = isObj(t.durataMinuti) ? t.durataMinuti : {};
  return [...arr(f.regole), f.ritorno, f.passeggeri, p.descrizione, d.nota].filter((x): x is string => typeof x === 'string');
}

// ---------- Conversione ----------

function fareInfo(t: Obj, id: string): FerryFareInfo {
  const f = isObj(t.tariffa) ? t.tariffa : {};
  const fareStatus = status(f.stato, `${id}.tariffa`);
  const year = numOrUndef(f.anno) ?? (isObj(f.auto) ? numOrUndef(f.auto.anno) : undefined);
  const yearLabel = typeof f.anno === 'string' ? f.anno : undefined;
  const sourceKey = str(f.fonte);
  const childAgeText = str(f.fasciaBambino);
  const fares: FerryFare[] = [];
  const line = (x: Omit<FerryFare, 'status' | 'year' | 'sourceKey' | 'trip'> & Partial<Pick<FerryFare, 'trip' | 'status' | 'sourceKey' | 'year'>>): void => {
    fares.push({
      trip: 'andata',
      year,
      sourceKey,
      ...x,
      status: x.amountNok === null ? 'assente' : (x.status ?? fareStatus),
    });
  };
  const period = str(f.periodo);
  const childAges = { ...ages(childAgeText), ageText: childAgeText };

  if ('adulto' in f) line({ category: 'adulto', amountNok: numOrUndef(f.adulto) ?? null, ageText: str(f.fasciaAdulto), period });
  if ('bambino' in f) line({ category: 'bambino', amountNok: numOrUndef(f.bambino) ?? null, ...childAges, period });
  if ('giovane18_29' in f) line({ category: 'giovane', amountNok: numOrUndef(f.giovane18_29) ?? null, ageMin: 18, ageMax: 29, ageText: '18–29' });
  if ('giovane20_29' in f) line({ category: 'giovane', amountNok: numOrUndef(f.giovane20_29) ?? null, ageMin: 20, ageMax: 29, ageText: '20–29' });
  if ('senior67' in f) line({ category: 'senior', amountNok: numOrUndef(f.senior67) ?? null, ageMin: 67, ageText: '67+', period });
  if ('famiglia2piu2' in f) line({ category: 'famiglia', amountNok: numOrUndef(f.famiglia2piu2) ?? null, adultsIncluded: 2, childrenIncluded: 2, period });
  if ('andataRitornoAdulto' in f) line({ category: 'adulto', trip: 'andata_ritorno', amountNok: numOrUndef(f.andataRitornoAdulto) ?? null, ageText: str(f.fasciaAdulto) });
  if ('andataRitornoBambino' in f) line({ category: 'bambino', trip: 'andata_ritorno', amountNok: numOrUndef(f.andataRitornoBambino) ?? null, ...childAges });
  if ('andataRitornoFamiglia' in f) line({ category: 'famiglia', trip: 'andata_ritorno', amountNok: numOrUndef(f.andataRitornoFamiglia) ?? null, adultsIncluded: 2, childrenIncluded: 2 });
  if ('sabatoAdulto' in f) line({ category: 'adulto', dayType: 'sabato', amountNok: numOrUndef(f.sabatoAdulto) ?? null });
  if ('sabatoBambino' in f) line({ category: 'bambino', dayType: 'sabato', amountNok: numOrUndef(f.sabatoBambino) ?? null, ...childAges });
  for (const s of arr(f.tratti)) {
    if (!isObj(s)) continue;
    const leg = { fromStop: str(s.da), toStop: str(s.a) };
    if ('adulto' in s) line({ category: 'adulto', amountNok: numOrUndef(s.adulto) ?? null, ...leg });
    if ('bambino' in s) line({ category: 'bambino', amountNok: numOrUndef(s.bambino) ?? null, ...childAges, ...leg });
  }
  if (isObj(f.auto)) {
    const a = f.auto;
    line({
      category: 'veicolo',
      amountNok: numOrUndef(a.nok) ?? null,
      vehicleClass: a.classe === 'fino a 6 m' ? 'fino_6m' : undefined,
      driverIncluded: typeof a.conducenteIncluso === 'boolean' ? a.conducenteIncluso : null,
      year: numOrUndef(a.anno) ?? year,
      status: status(a.stato, `${id}.tariffa.auto`),
      sourceKey: str(a.fonte) ?? sourceKey,
      note: str(a.nota),
    });
  }
  if (isObj(f.pacchettoAuto)) {
    const p = f.pacchettoAuto;
    const base = { category: 'pacchetto_veicolo' as const, vehicleClass: 'fino_6m' as const, note: str(p.descrizione) };
    line({ ...base, amountNok: numOrUndef(p.nok) ?? null });
    if ('andataRitorno' in p) line({ ...base, trip: 'andata_ritorno', amountNok: numOrUndef(p.andataRitorno) ?? null });
  }
  if (isObj(f.prenotazione)) {
    const p = f.prenotazione;
    const note = str(p.nota);
    if ('adulto' in p) line({ category: 'prenotazione_adulto', optional: true, amountNok: numOrUndef(p.adulto) ?? null, note });
    if ('bambino' in p) line({ category: 'prenotazione_bambino', optional: true, amountNok: numOrUndef(p.bambino) ?? null, note });
    if ('auto06m' in p) line({ category: 'prenotazione_veicolo', optional: true, vehicleClass: 'fino_6m', amountNok: numOrUndef(p.auto06m) ?? null, note });
  }

  // Regola passeggeri: «gratis» solo se la fonte lo scrive; «a pagamento» solo se c'è un prezzo adulto; altrimenti non indicata
  const passengersText = str(f.passeggeri);
  let passengerRule: FerryPassengerRule = 'non_indicata';
  if (passengersText && /^gratis/i.test(passengersText)) passengerRule = 'gratis';
  else if (!passengersText && fares.some((x) => x.category === 'adulto' && (x.amountNok ?? 0) > 0)) passengerRule = 'a_pagamento';

  return {
    status: fareStatus,
    year,
    yearLabel,
    validFrom: str(f.validoDal),
    period,
    sourceKey,
    note: str(f.nota),
    verifyForTripYear: f.daVerificarePer2027 === true,
    passengerRule,
    passengersText,
    freeUnderAge: numOrUndef(f.gratisSottoAnni),
    childAgeText,
    adultAgeText: str(f.fasciaAdulto),
    rules: [...arr(f.regole).filter((x): x is string => typeof x === 'string'), ...(str(f.ritorno) ? [str(f.ritorno)!] : [])],
    generalRules: str(f.regoleGenerali),
    fares,
  };
}

function textField(v: unknown, where: string): FerryText {
  const o = isObj(v) ? v : {};
  return { text: str(o.testo) ?? '', status: status(o.stato, where), sourceKey: str(o.fonte), year: numOrUndef(o.anno) };
}

function enturLine(v: unknown): FerryEnturLine | undefined {
  if (!isObj(v)) return undefined;
  return {
    id: String(v.id),
    code: String(v.codice),
    name: fixMojibake(String(v.nome)),
    operator: typeof v.operatoreEntur === 'string' ? fixMojibake(v.operatoreEntur) : null,
    validFrom: String(v.datiValidiDal),
    validTo: String(v.datiValidiAl),
    sampleTrips: { wed: Number(v.corseMer18nov2026), sat: Number(v.corseSab21nov2026), sun: Number(v.corseDom22nov2026) },
  };
}

/** Toglie le chiavi undefined (file più leggibile, confronto per JSON) */
function clean<T>(v: T): T {
  if (Array.isArray(v)) return v.map(clean) as T;
  if (isObj(v)) {
    const out: Obj = {};
    for (const [k, x] of Object.entries(v)) if (x !== undefined) out[k] = clean(x);
    return out as T;
  }
  return v;
}

export function buildFerryData(json: unknown): { sources: FerrySource[]; routes: FerryRoute[]; checkedAt: string } {
  if (!isObj(json) || json.schema !== 'ricerca-traghetti/1' || json.valuta !== 'NOK') throw new Error('Ricerca traghetti: formato inatteso');
  const checkedAt = String(json.lettoIl);
  const fonti = isObj(json.fonti) ? json.fonti : {};
  const sources: FerrySource[] = Object.keys(fonti).sort().map((key) => {
    const s = fonti[key];
    if (!isObj(s) || !str(s.url) || !str(s.lettoIl)) throw new Error(`Fonte ${key}: url o data mancanti`);
    // Solo https (CHECK di ferry_sources.url nella migrazione 20261109000000_traghetti.sql)
    if (!/^https:\/\//.test(String(s.url))) throw new Error(`Fonte ${key}: l'url deve iniziare con https://`);
    return { key, title: String(s.titolo), url: String(s.url), checkedAt: String(s.lettoIl) };
  });
  const sourceKeys = new Set(sources.map((s) => s.key));
  const regions = new Set(Object.keys(REGION_COUNTIES));
  const seen = new Set<string>();

  const routes = arr(json.tratte).map((raw): FerryRoute => {
    if (!isObj(raw)) throw new Error('Tratta non leggibile');
    const id = String(raw.id);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id) || seen.has(id)) throw new Error(`Chiave non valida o duplicata: ${id}`);
    seen.add(id);
    if (!['ferje', 'hurtigbat', 'turistico'].includes(String(raw.tipo))) throw new Error(`${id}: mezzo sconosciuto`);
    if (!regions.has(String(raw.regione))) throw new Error(`${id}: regione sconosciuta ${String(raw.regione)}`);

    const stops: FerryStop[] = arr(raw.tappe).map((s, i) => {
      const o = isObj(s) ? s : {};
      const name = String(o.nome);
      const m = range(o.minutiDaPartenza);
      const nsrId = str(o.nsrId);
      const lat = numOrUndef(o.lat);
      const lng = numOrUndef(o.lng);
      if ((lat === undefined) !== (lng === undefined) || (lat !== undefined && !nsrId)) throw new Error(`${id}: coordinate senza id NSR (${name})`);
      return { seq: i + 1, name, minutesMin: m?.[0], minutesMax: m?.[1], call: callOf(name), nsrId, lat, lng };
    });

    const d = isObj(raw.durataMinuti) ? raw.durataMinuti : {};
    const dr = range(d.valore);
    const dest = isObj(raw.destinazioni) ? raw.destinazioni : {};
    const route: FerryRoute = {
      key: id,
      name: String(raw.nome),
      operator: String(raw.operatore),
      mode: raw.tipo as FerryMode,
      zone: String(raw.zona),
      region: raw.regione as Region,
      road: str(raw.strada),
      carriesCar: raw.trasportaAuto === true,
      roundTrip: raw.andataRitorno === true,
      fromName: String(raw.partenza),
      toName: String(raw.arrivo),
      stops,
      duration: { min: dr?.[0], max: dr?.[1], status: status(d.stato, `${id}.durata`), note: str(d.nota), sourceKey: str(d.fonte) },
      summerFrequency: textField(raw.frequenzaEstiva, `${id}.frequenzaEstiva`),
      season: textField(raw.stagione, `${id}.stagione`),
      fare: fareInfo(raw, id),
      places: { from: str(dest.partenza), to: str(dest.arrivo), along: arr(dest.tappe).map(String) },
      sourceKeys: arr(raw.fonti).map(String),
      notes: arr(raw.note).map(String),
      enturLine: enturLine(raw.enturLinea),
      checkedAt: String(raw.lettoIl),
    };

    const texts = textsOf(raw);
    for (const s of STRUCTURED[id] ?? []) {
      if (!texts.some((x) => x.includes(s.quote))) throw new Error(`${id}: il testo citato non è più nella ricerca: «${s.quote}»`);
      s.apply(route);
    }

    const used = [route.duration.sourceKey, route.summerFrequency.sourceKey, route.season.sourceKey, route.fare.sourceKey,
      ...route.fare.fares.map((f) => f.sourceKey), ...route.sourceKeys];
    for (const k of used) if (k && !sourceKeys.has(k)) throw new Error(`${id}: fonte sconosciuta ${k}`);
    return clean(route);
  });
  for (const k of Object.keys(STRUCTURED)) if (!seen.has(k)) throw new Error(`Regola strutturata per una tratta assente: ${k}`);
  return { sources, routes, checkedAt };
}

function main(): void {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const json = JSON.parse(readFileSync(resolve(root, 'docs/ricerca-traghetti.json'), 'utf8')) as unknown;
  const { sources, routes, checkedAt } = buildFerryData(json);
  const out = [
    '// GENERATO da scripts/build-ferry-routes.ts a partire da docs/ricerca-traghetti.json: non modificare a mano.',
    '// Rigenerare con `npx tsx scripts/build-ferry-routes.ts`. Tipi in ./ferryTypes.ts.',
    '// Tratte traghetto interne alla Norvegia (catalogo NO-2). Tariffe 2026 = «tariffa di oggi, da verificare per il 2027»',
    '// (solo Bergen–Flåm ha prezzi 2027). Coordinate solo dal registro NSR (Entur). Nessun dato stimato.',
    '',
    "import type { FerryRoute, FerrySource } from './ferryTypes';",
    '',
    `export const FERRY_CHECKED_AT = ${JSON.stringify(checkedAt)};`,
    '',
    '/** Fonti per chiave: titolo, URL, data di lettura */',
    `export const FERRY_SOURCES: Record<string, FerrySource> = ${JSON.stringify(Object.fromEntries(sources.map((s) => [s.key, s])), null, 2)};`,
    '',
    `/** ${routes.length} tratte, nell'ordine della ricerca (per zona) */`,
    `export const FERRY_ROUTES: FerryRoute[] = ${JSON.stringify(routes, null, 2)};`,
    '',
  ].join('\n');
  const path = resolve(root, 'src/data/ferryRoutes.ts');
  writeFileSync(path, out, 'utf8');
  const fares = routes.reduce((n, r) => n + r.fare.fares.length, 0);
  console.log(`Scritto ${path}: ${routes.length} tratte, ${routes.reduce((n, r) => n + r.stops.length, 0)} tappe, ${fares} voci di tariffa, ${sources.length} fonti.`);
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();
