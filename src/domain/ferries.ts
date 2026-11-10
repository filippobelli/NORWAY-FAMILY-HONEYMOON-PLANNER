// Traghetti del catalogo (NO-2): costo per la famiglia, stato del prezzo, ricerca e filtri, suggerimenti
// «alternativa all'auto», tratto traghetto nel percorso. Funzioni pure e testate (tests/traghetti-*.test.ts).
//
// Regole (spec §4, design §5–§9, architettura §16):
// - età dei bambini = quelle del viaggio (alla partenza); avviso se cadono a ±1 anno da una soglia della tratta;
// - adulti sempre «adulto» pieno; gratis sotto l'età indicata dalla fonte; tetto bambino con adulto pagante;
// - auto solo se scelta; con «conducente incluso» il conducente non paga il biglietto; se la fonte non lo dice: da verificare;
// - passeggeri «gratis» = 0; «non indicata» senza auto = non calcolabile (mai 0, design DU9);
// - pacchetto auto e biglietto famiglia calcolati a parte: si propone il più basso, a parità il conto per persona;
// - un prezzo mancante rende il totale «non calcolabile»: mai zero al suo posto;
// - tariffa di un anno diverso da quello del viaggio = da verificare, mai «confermato».
// Nessuna distanza: il traghetto è un tratto a sé, senza km; la linea sulla mappa solo tra moli con coordinate NSR.

import type { FerryFare, FerryMode, FerryRoute, FerryStop } from '../data/ferryTypes';
import { tripCountries } from './countries';
import { newId } from './ids';
import { addDays } from './itinerary';
import { isAutoSegment } from './routeMerge';
import type { DataStatus, Leg, Money, Participants, Segment, Stop, Trip } from './types';

export const FERRY_MODE_LABEL: Record<FerryMode, string> = {
  ferje: 'Traghetto per auto',
  hurtigbat: 'Battello veloce',
  turistico: 'Battello turistico',
};

/** Zone del filtro (design §3): una tratta può stare in più zone (es. Nordland/Troms) */
export const FERRY_ZONES = ['Vestland', 'Rogaland', 'Møre og Romsdal', 'Nordland', 'Troms', 'Finnmark'] as const;

/** Testo senza accenti e in minuscolo: «flam» trova «Flåm», «tromso» trova «Tromsø» */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// ---------------------------------------------------------------- Date, anni, periodi

/** Anno del viaggio dalla data di partenza (assente se la data non è valida) */
export function tripYear(t: Pick<Trip, 'startDate'>): number | undefined {
  return /^\d{4}-\d{2}-\d{2}$/.test(t.startDate ?? '') ? Number(t.startDate.slice(0, 4)) : undefined;
}

/** Data del collegamento (giorno in cui si parte dalla tappa di partenza), come in computeDays */
export function legDate(t: Pick<Trip, 'startDate' | 'stops'>, leg: Pick<Leg, 'toStopId'>): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.startDate ?? '')) return undefined;
  const i = t.stops.findIndex((s) => s.id === leg.toStopId);
  if (i <= 0) return undefined;
  const nights = t.stops.slice(0, i).reduce((n, s) => n + Math.max(0, s.nights), 0);
  return addDays(t.startDate, nights);
}

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/**
 * Periodo di una tariffa come scritto dalla fonte: «18 maggio – 31 agosto 2027» oppure «fuori dal 18/5–31/8 (2027)».
 * Restituisce giorno e mese di inizio e fine (estremi compresi) e se il periodo è il complemento. undefined = non letto.
 */
export function parsePeriod(text: string): { from: [number, number]; to: [number, number]; outside: boolean } | undefined {
  const t = fold(text);
  const outside = /^fuori/.test(t.trim());
  const m1 = t.match(new RegExp(`(\\d{1,2})\\s+(${MONTHS.join('|')})\\s*[–-]\\s*(\\d{1,2})\\s+(${MONTHS.join('|')})`));
  if (m1) return { from: [MONTHS.indexOf(m1[2]!) + 1, Number(m1[1])], to: [MONTHS.indexOf(m1[4]!) + 1, Number(m1[3])], outside };
  const m2 = t.match(/(\d{1,2})\/(\d{1,2})\s*[–-]\s*(\d{1,2})\/(\d{1,2})/);
  if (m2) return { from: [Number(m2[2]), Number(m2[1])], to: [Number(m2[4]), Number(m2[3])], outside };
  return undefined;
}

/** Il periodo contiene la data? undefined se il testo del periodo non si legge */
export function periodContains(text: string, isoDate: string): boolean | undefined {
  const p = parsePeriod(text);
  if (!p) return undefined;
  const md = Number(isoDate.slice(5, 7)) * 100 + Number(isoDate.slice(8, 10));
  const a = p.from[0] * 100 + p.from[1];
  const b = p.to[0] * 100 + p.to[1];
  const inside = md >= a && md <= b;
  return p.outside ? !inside : inside;
}

const isSaturday = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay() === 6;

// ---------------------------------------------------------------- Tappe della tratta

export const firstStop = (r: FerryRoute): FerryStop => r.stops[0]!;
export const lastStop = (r: FerryRoute): FerryStop => r.stops[r.stops.length - 1]!;
export const stopBySeq = (r: FerryRoute, seq: number | undefined): FerryStop | undefined => r.stops.find((s) => s.seq === seq);

/** Fermate selezionabili: niente «solo passaggio»/«senza sbarco»; «solo discesa» solo come sbarco */
export function canBoard(s: FerryStop): boolean {
  return s.call === 'fermata' || s.call === 'a_richiesta';
}
export function canAlight(s: FerryStop): boolean {
  return s.call === 'fermata' || s.call === 'a_richiesta' || s.call === 'solo_discesa';
}

/** Nome breve della fermata (senza le annotazioni tra parentesi) */
export const stopName = (s: FerryStop | undefined): string => (s ? s.name.replace(/\s*\([^)]*\)\s*$/, '').trim() : '—');

export interface SubRoute {
  board: FerryStop;
  alight: FerryStop;
  /** Tutta la tratta (in un verso o nell'altro) */
  full: boolean;
  /** Verso opposto a quello del catalogo: durata (e prezzo) presi dall'andata, da verificare */
  reversed: boolean;
  /** Fermate intermedie saltate rispetto all'intera tratta */
  skipped: number;
}

export function subRoute(r: FerryRoute, board?: number, alight?: number): SubRoute | undefined {
  const b = stopBySeq(r, board ?? firstStop(r).seq);
  const a = stopBySeq(r, alight ?? lastStop(r).seq);
  if (!b || !a || b.seq === a.seq) return undefined;
  const first = firstStop(r).seq;
  const last = lastStop(r).seq;
  const full = (b.seq === first && a.seq === last) || (b.seq === last && a.seq === first);
  const covered = Math.abs(a.seq - b.seq) + 1;
  return { board: b, alight: a, full, reversed: b.seq > a.seq, skipped: r.stops.length - covered };
}

/** Durata del tratto scelto in minuti: [min, max]; assente se la fonte non la pubblica */
export function subDuration(r: FerryRoute, sub: SubRoute): [number, number] | undefined {
  if (sub.full) {
    const lo = r.duration.min ?? r.duration.max;
    const hi = r.duration.max ?? r.duration.min;
    return lo !== undefined && hi !== undefined ? [lo, hi] : undefined;
  }
  const [x, y] = sub.reversed ? [sub.alight, sub.board] : [sub.board, sub.alight];
  if (x.minutesMin === undefined || y.minutesMin === undefined) return undefined;
  const lo = (y.minutesMin ?? 0) - (x.minutesMax ?? x.minutesMin);
  const hi = (y.minutesMax ?? y.minutesMin) - (x.minutesMin ?? 0);
  return lo >= 0 && hi >= 0 ? [Math.min(lo, hi), Math.max(lo, hi)] : undefined;
}

// ---------------------------------------------------------------- Costo per la famiglia

export interface FerryCostInput {
  route: FerryRoute;
  participants: Participants;
  withCar: boolean;
  /** seq di imbarco e sbarco; assenti = tutta la tratta */
  board?: number;
  alight?: number;
  /** Data della traversata (ISO), se nota */
  date?: string;
  tripYear?: number;
  /** Ritorno acquistato insieme all'andata (sconto ritorno, se la fonte lo prevede) */
  returnBought?: boolean;
  /** Prenotazione facoltativa (es. plassgaranti) */
  bookingAdded?: boolean;
}

/** Una riga del conto: voce · regola · importo. amountNok assente = non conteggiata o mancante (missing) */
export interface CostLine {
  item: string;
  rule: string;
  amountNok?: number;
  missing?: boolean;
  /** Avviso sulla riga (es. soglia d'età vicina) */
  warn?: string;
}

export interface CostOption {
  kind: 'persone' | 'pacchetto' | 'famiglia';
  label: string;
  lines: CostLine[];
  /** Assente se manca un prezzo necessario */
  totalNok?: number;
}

export type PriceTone = 'ok' | 'warn' | 'none';

export interface FerryCost {
  computable: boolean;
  totalNok?: number;
  chosen?: CostOption;
  /** Il conto per persona è sempre il primo */
  options: CostOption[];
  /** Perché si usa il conto scelto */
  reason?: string;
  /** Prezzi che mancano (costo non calcolabile) */
  missing: string[];
  warnings: string[];
  /** Stato del costo nel percorso: «confermato» solo per un prezzo dell'anno del viaggio letto sulla fonte */
  status: Extract<DataStatus, 'confermato' | 'da_verificare'>;
  statusText: string;
  tone: PriceTone;
}

const sum = (lines: CostLine[]) => lines.reduce((n, l) => n + (l.amountNok ?? 0), 0);
const nok = (n: number) => `${Math.round(n).toLocaleString('it-IT')}`;

/** Stato del prezzo di una tratta (design §4.4): tre testi soltanto */
export function priceStatus(r: FerryRoute, year: number | undefined, extraVerify = false): { status: 'confermato' | 'da_verificare'; text: string; short: string; tone: PriceTone } {
  const trip = year !== undefined ? String(year) : 'viaggio';
  if (r.fare.status === 'assente' && !r.fare.fares.some((f) => f.amountNok !== null)) {
    return { status: 'da_verificare', text: 'Prezzo non pubblicato dalla fonte', short: '— Prezzo assente', tone: 'none' };
  }
  const label = r.fare.yearLabel ?? (r.fare.year !== undefined ? String(r.fare.year) : undefined);
  const sameYear = r.fare.year !== undefined && year !== undefined && r.fare.year === year && !r.fare.yearLabel;
  if (sameYear && r.fare.status === 'confermato' && !extraVerify) {
    return { status: 'confermato', text: `Prezzo ${r.fare.year} confermato sulla fonte`, short: `✓ Prezzo ${r.fare.year}`, tone: 'ok' };
  }
  if (sameYear) return { status: 'da_verificare', text: `Tariffa ${label}, da verificare`, short: `! Tariffa ${label} · da verificare`, tone: 'warn' };
  if (label) return { status: 'da_verificare', text: `Tariffa ${label}, da verificare per il ${trip}`, short: `! Tariffa ${label} · da verificare per il ${trip}`, tone: 'warn' };
  return { status: 'da_verificare', text: `Tariffa senza anno indicato, da verificare per il ${trip}`, short: `! Tariffa senza anno · da verificare per il ${trip}`, tone: 'warn' };
}

/** Fonte secondaria (aggregatore): sempre da verificare */
export const isSecondarySource = (key: string | undefined) => key === 'fergeruter';

const inAge = (f: FerryFare, age: number) => (f.ageMin === undefined || age >= f.ageMin) && (f.ageMax === undefined || age <= f.ageMax);

/**
 * Costo per la famiglia di una tratta (o sottotratta). Funzione pura: stessi dati, stesso risultato.
 * Esempi (spec §8): Tromsø → Harstad senza auto 1469; Geiranger → Hellesylt con auto 1650; Bergen → Flåm 3107.
 */
export function ferryCost(input: FerryCostInput): FerryCost {
  const { route: r, participants: p } = input;
  const warnings: string[] = [];
  let verify = false;
  const sub = subRoute(r, input.board, input.alight);
  const year = input.tripYear;
  const date = input.date;
  // Senza data si usa il periodo che contiene agosto (mese del viaggio) dell'anno del viaggio; senza anno il periodo
  // non si può scegliere: tariffa da verificare
  const refDate = date ?? (year !== undefined ? `${year}-08-15` : undefined);
  if (!sub) {
    return { computable: false, options: [], missing: ['imbarco e sbarco validi'], warnings, status: 'da_verificare', statusText: 'Imbarco e sbarco devono essere diversi', tone: 'none' };
  }
  if (sub.reversed) {
    warnings.push('Verso opposto: durata e prezzo presi dall\'andata, da verificare.');
    verify = true;
  }

  // Voci utilizzabili: sola andata, non facoltative, del tratto scelto, del periodo e del giorno
  const sameStop = (stopText: string | undefined, s: FerryStop) => Boolean(stopText) && fold(s.name).includes(fold(stopText!));
  const matchesSub = (f: FerryFare) => {
    if (!f.fromStop && !f.toStop) return sub.full;
    const [x, y] = [sub.board, sub.alight];
    const direct = sameStop(f.fromStop, x) && sameStop(f.toStop, y);
    const back = sameStop(f.fromStop, y) && sameStop(f.toStop, x);
    if (back && !direct && !sub.reversed) return false;
    return direct || back;
  };
  let periodNoted = false;
  const usable = r.fare.fares.filter((f) => {
    if (f.trip !== 'andata' || f.optional || !matchesSub(f)) return false;
    if (f.period) {
      if (!refDate) {
        if (!periodNoted) {
          periodNoted = true;
          verify = true;
          warnings.push(`Data e anno del viaggio non noti: periodo della tariffa da verificare (${f.period}).`);
        }
        return true;
      }
      const inside = periodContains(f.period, refDate);
      if (inside === false) return false;
      if (inside === undefined) {
        verify = true;
        warnings.push(`Periodo della tariffa non interpretato: «${f.period}».`);
      }
      if (!date && !periodNoted) {
        periodNoted = true;
        warnings.push(`Data del collegamento non nota: uso la tariffa del periodo che contiene agosto (${f.period}).`);
      }
    }
    return true;
  });
  const saturday = date ? isSaturday(date) : false;
  /** Voce di una categoria: quella del sabato solo se si viaggia di sabato */
  const pick = (cat: FerryFare['category'], age?: number): FerryFare | undefined => {
    const c = usable.filter((f) => f.category === cat && (age === undefined || inAge(f, age)));
    if (saturday) return c.find((f) => f.dayType === 'sabato') ?? c.find((f) => !f.dayType);
    return c.find((f) => !f.dayType);
  };
  const satFares = r.fare.fares.filter((f) => f.dayType === 'sabato' && f.trip === 'andata' && matchesSub(f));
  if (!saturday && satFares.length) {
    warnings.push(`Esiste una tariffa del sabato (${satFares.map((f) => `${f.category} ${f.amountNok ?? '—'}`).join(', ')} NOK): si applica solo se viaggi di sabato.`);
  }
  if (!sub.full && !usable.length && r.fare.fares.some((f) => f.amountNok !== null && !f.optional)) {
    warnings.push(`La fonte non pubblica il prezzo della sottotratta ${stopName(sub.board)} → ${stopName(sub.alight)}.`);
  }

  const used: FerryFare[] = [];
  const track = (f: FerryFare | undefined) => {
    if (f) used.push(f);
    return f;
  };
  const car = input.withCar;
  const missing: string[] = [];
  const lines: CostLine[] = [];

  // Auto
  let driverCovered = false;
  if (car) {
    if (!r.carriesCar) {
      missing.push('auto: la tratta non porta veicoli');
    } else {
      const v = track(pick('veicolo'));
      if (!v || v.amountNok === null) {
        missing.push('auto fino a 6 m');
        lines.push({ item: 'Auto fino a 6 m', rule: 'prezzo assente', missing: true });
      } else {
        driverCovered = v.driverIncluded !== false;
        if (v.driverIncluded !== true && v.driverIncluded !== false) {
          warnings.push('La fonte non dice se il conducente è compreso nel prezzo dell\'auto: calcolo con conducente incluso, da verificare.');
          verify = true;
        }
        lines.push({ item: 'Auto fino a 6 m', rule: v.driverIncluded === true ? 'conducente incluso' : 'conducente incluso? da verificare', amountNok: v.amountNok });
      }
    }
  } else if (r.carriesCar) {
    lines.push({ item: 'Auto', rule: 'non scelta', amountNok: undefined });
  }

  const adultsToPay = Math.max(0, p.adults - (driverCovered ? 1 : 0));
  const ages = p.childrenAges;
  const fare = r.fare;
  const hasPassengerFares = usable.some((f) => ['adulto', 'bambino'].includes(f.category));
  const rule = fare.passengerRule === 'non_indicata' && hasPassengerFares ? 'a_pagamento' : fare.passengerRule;
  const discount = input.returnBought && fare.returnDiscountPct ? fare.returnDiscountPct : 0;
  const disc = (n: number) => (discount ? n * (1 - discount / 100) : n);
  const discRule = discount ? ` · ritorno −${discount}%` : '';
  const passengers = adultsToPay + ages.length;

  if (rule === 'gratis') {
    if (passengers > 0) lines.push({ item: driverCovered ? 'Passeggeri' : 'Passeggeri (tutta la famiglia)', rule: 'gratis per regola della tratta', amountNok: 0 });
  } else if (rule === 'non_indicata') {
    if (car && driverCovered) {
      if (passengers > 0) {
        lines.push({ item: 'Passeggeri', rule: 'la fonte non dice se pagano: da verificare', warn: 'Regola dei passeggeri non scritta dalla fonte' });
        warnings.push('La fonte non dice se i passeggeri pagano: il totale comprende solo l\'auto, da verificare.');
        verify = true;
      }
    } else if (passengers > 0) {
      missing.push(fare.fares.length ? 'regola dei passeggeri (la fonte non dice se pagano)' : 'prezzi adulto e bambino');
      lines.push({ item: 'Passeggeri', rule: 'la fonte non dice se pagano', missing: true });
    }
  } else {
    // Passeggeri a pagamento
    const adult = adultsToPay > 0 ? track(pick('adulto')) : undefined;
    if (adultsToPay > 0) {
      if (!adult || adult.amountNok === null) {
        missing.push('adulto');
        lines.push({ item: adultsToPay > 1 ? `Adulto × ${adultsToPay}` : 'Adulto', rule: 'prezzo assente', missing: true });
      } else {
        const each = disc(adult.amountNok);
        const base = adultsToPay > 1 ? `${nok(each)} × ${adultsToPay}` : 'tariffa adulto';
        lines.push({
          item: adultsToPay > 1 ? `Adulto × ${adultsToPay}` : driverCovered ? 'Adulto (passeggero; il conducente è già nell\'auto)' : 'Adulto',
          rule: `${base}${adult.dayType === 'sabato' ? ' · tariffa del sabato' : ''}${discRule}`,
          amountNok: each * adultsToPay,
        });
      }
    }
    const childFares = usable.filter((f) => f.category === 'bambino');
    for (const age of ages) {
      const item = `Bambino ${age} anni`;
      const thresholds = new Set<number>();
      if (fare.freeUnderAge !== undefined) thresholds.add(fare.freeUnderAge);
      for (const f of childFares) {
        if (f.ageMin !== undefined) thresholds.add(f.ageMin);
        if (f.ageMax !== undefined) thresholds.add(f.ageMax + 1);
      }
      const near = [...thresholds].filter((t) => Math.abs(age - t) <= 1).sort((a, b) => a - b)[0];
      const warn = near !== undefined ? `Controlla l'età il giorno della traversata: soglia ${near} anni` : undefined;
      if (fare.freeUnderAge !== undefined && age < fare.freeUnderAge) {
        lines.push({ item, rule: `gratis sotto i ${fare.freeUnderAge} anni`, amountNok: 0, warn });
        continue;
      }
      const child = track(pick('bambino', age));
      if (child) {
        if (child.amountNok === null) {
          missing.push('bambino');
          lines.push({ item, rule: 'prezzo assente', missing: true, warn });
          continue;
        }
        const payingAdult = adultsToPay > 0 || driverCovered;
        const capped = fare.childCapNok !== undefined && payingAdult && child.amountNok > fare.childCapNok;
        const amount = disc(capped ? fare.childCapNok! : child.amountNok);
        const range = child.ageText ? ` (${child.ageText})` : '';
        const ruleText = capped
          ? `tariffa bambino ${nok(child.amountNok)}, max ${nok(fare.childCapNok!)} con adulto pagante`
          : `tariffa bambino${range}${fare.freeUnderAge !== undefined ? ` · gratis solo sotto i ${fare.freeUnderAge} anni` : ''}`;
        lines.push({ item, rule: `${ruleText}${child.dayType === 'sabato' ? ' · tariffa del sabato' : ''}${discRule}`, amountNok: amount, warn });
        continue;
      }
      // Oltre la fascia bambino: giovane se la tariffa la prevede, altrimenti adulto
      const aboveChild = childFares.length > 0 && childFares.every((f) => f.ageMax !== undefined && age > f.ageMax);
      const older = aboveChild ? track(pick('giovane', age) ?? pick('adulto')) : undefined;
      if (older && older.amountNok !== null) {
        lines.push({ item, rule: `oltre la fascia bambino: tariffa ${older.category}${discRule}`, amountNok: disc(older.amountNok), warn });
      } else {
        missing.push('bambino');
        lines.push({ item, rule: 'prezzo assente', missing: true, warn });
      }
    }
  }

  // Prenotazione facoltativa (voce separata, solo se scelta)
  const bookingLines: CostLine[] = [];
  if (input.bookingAdded) {
    const opt = (cat: FerryFare['category']) => r.fare.fares.find((f) => f.category === cat && f.optional && matchesSub(f));
    const add = (cat: FerryFare['category'], n: number, item: string) => {
      if (n <= 0) return;
      const f = opt(cat);
      if (!f || f.amountNok === null) {
        missing.push(`prenotazione (${item.toLowerCase()})`);
        bookingLines.push({ item: `Prenotazione: ${item}`, rule: 'prezzo assente', missing: true });
        return;
      }
      used.push(f);
      bookingLines.push({ item: `Prenotazione: ${item}${n > 1 ? ` × ${n}` : ''}`, rule: 'facoltativa, scelta da te', amountNok: f.amountNok * n });
    };
    if (car) add('prenotazione_veicolo', 1, 'auto');
    else {
      add('prenotazione_adulto', p.adults, 'adulto');
      add('prenotazione_bambino', ages.length, 'bambino');
    }
  }

  const perPerson: CostOption = {
    kind: 'persone',
    label: 'Conto per persona',
    lines: [...lines, ...bookingLines],
    totalNok: missing.length ? undefined : sum([...lines, ...bookingLines]),
  };
  const options: CostOption[] = [perPerson];

  // Pacchetto auto + N persone
  if (car && r.carriesCar) {
    const pk = pick('pacchetto_veicolo');
    if (pk && pk.amountNok !== null && pk.passengersIncluded !== undefined) {
      const persons = p.adults + ages.length;
      const capacity = pk.passengersIncluded + (pk.driverIncluded === true ? 1 : 0);
      if (persons <= capacity) {
        const bookMissing = bookingLines.some((l) => l.missing);
        options.push({
          kind: 'pacchetto',
          label: `Pacchetto auto + ${pk.passengersIncluded} persone`,
          lines: [{ item: `Pacchetto auto fino a 6 m + ${pk.passengersIncluded} persone`, rule: pk.note ?? 'pacchetto della fonte', amountNok: pk.amountNok }, ...bookingLines],
          totalNok: bookMissing ? undefined : pk.amountNok + sum(bookingLines),
        });
        if (pk.driverIncluded !== true) {
          warnings.push('Pacchetto: la fonte non dice se il conducente rientra nel numero di persone, da verificare.');
        }
      }
    }
  }
  // Biglietto famiglia (senza auto)
  if (!car) {
    const fam = pick('famiglia');
    if (fam && fam.amountNok !== null && fam.adultsIncluded !== undefined && fam.childrenIncluded !== undefined) {
      const paying = ages.filter((a) => fare.freeUnderAge === undefined || a >= fare.freeUnderAge);
      // Fascia d'età della stessa tariffa (periodo, giorno e tratto scelti)
      const childRange = usable.find((f) => f.category === 'bambino' && !f.dayType) ?? usable.find((f) => f.category === 'bambino');
      const inRange = paying.every((a) => !childRange || inAge(childRange, a));
      if (p.adults <= fam.adultsIncluded && paying.length <= fam.childrenIncluded && inRange) {
        const free = ages.length - paying.length;
        const bookMissing = bookingLines.some((l) => l.missing);
        options.push({
          kind: 'famiglia',
          label: `Biglietto famiglia (${fam.adultsIncluded} adulti + ${fam.childrenIncluded} bambini)`,
          lines: [
            { item: `Biglietto famiglia ${fam.adultsIncluded} adulti + ${fam.childrenIncluded} bambini`, rule: `${childRange?.ageText ? `bambini ${childRange.ageText}` : 'tariffa famiglia'}${free ? ` · ${free} ${free === 1 ? 'bambino gratis' : 'bambini gratis'} per età` : ''}`, amountNok: fam.amountNok },
            ...bookingLines,
          ],
          totalNok: bookMissing ? undefined : fam.amountNok + sum(bookingLines),
        });
      }
    }
  }

  const priced = options.filter((o) => o.totalNok !== undefined);
  // A parità vince il conto per persona (è il primo e il confronto è stretto)
  const chosen = priced.reduce<CostOption | undefined>((best, o) => (!best || o.totalNok! < best.totalNok! ? o : best), undefined);
  let reason: string | undefined;
  if (chosen && priced.length > 1) {
    const others = priced.filter((o) => o !== chosen);
    reason = others.every((o) => o.totalNok === chosen.totalNok) ? `stesso importo: ${others.map((o) => o.label.toLowerCase()).join(', ')}` : 'il più basso';
  }
  if (chosen && chosen.kind !== 'persone') {
    for (const f of r.fare.fares.filter((x) => x.category === (chosen.kind === 'pacchetto' ? 'pacchetto_veicolo' : 'famiglia'))) if (usable.includes(f)) used.push(f);
  }
  if (used.some((f) => f.status !== 'confermato' || isSecondarySource(f.sourceKey)) || chosen?.kind === 'pacchetto' && warnings.some((w) => w.startsWith('Pacchetto'))) verify = true;
  if (chosen?.kind === 'pacchetto' && options.find((o) => o.kind === 'pacchetto')) {
    const pk = pick('pacchetto_veicolo');
    if (pk && pk.status !== 'confermato') verify = true;
  }
  const st = priceStatus(r, year, verify);
  const tone: PriceTone = chosen ? st.tone : 'none';
  return {
    computable: Boolean(chosen),
    totalNok: chosen?.totalNok,
    chosen,
    options,
    reason,
    missing: chosen ? [] : [...new Set(missing.length ? missing : ['prezzo'])],
    warnings: [...new Set(warnings)],
    status: st.status,
    statusText: st.text,
    tone,
  };
}

/** Testo «non calcolabile» (design §12) */
export const missingText = (c: FerryCost) => `Costo non calcolabile: mancano ${c.missing.join(', ')}.`;

// ---------------------------------------------------------------- Testi della tratta

/** Regola tariffaria in una frase, prima dei numeri (design §4) */
export function fareRuleText(r: FerryRoute): string {
  const f = r.fare;
  const hasPassengerFares = f.fares.some((x) => ['adulto', 'bambino'].includes(x.category) && x.amountNok !== null);
  if (f.passengerRule === 'gratis') return r.carriesCar ? 'Paga solo il veicolo, conducente incluso. I passeggeri viaggiano gratis.' : 'I passeggeri viaggiano gratis.';
  if (f.passengerRule === 'non_indicata' && !hasPassengerFares) return 'La fonte non dice se i passeggeri pagano: da verificare.';
  const kids = f.childAgeText && f.childAgeText !== 'non indicata' ? ` Bambini ${f.childAgeText}` : '';
  const free = f.freeUnderAge !== undefined ? `${kids ? ';' : ''} sotto i ${f.freeUnderAge} anni gratis` : '';
  if (r.carriesCar) return `Paga l'auto (conducente incluso) e ogni passeggero.${kids}${free}${kids || free ? '.' : ''}`;
  return `Paga ogni passeggero.${kids}${free}${kids || free ? '.' : ''}`;
}

/** Prezzo in una riga, per l'elenco (design §3) */
export function priceLine(r: FerryRoute): string {
  const base = r.fare.fares.filter((f) => f.trip === 'andata' && !f.optional && !f.dayType && !f.fromStop);
  const pickBase = (c: FerryFare['category']) => {
    const list = base.filter((f) => f.category === c);
    return list.find((f) => !f.period || periodContains(f.period, '2027-08-15') !== false);
  };
  const a = pickBase('adulto');
  const b = pickBase('bambino');
  const v = pickBase('veicolo');
  const amount = (f: FerryFare | undefined) => (f && f.amountNok !== null ? nok(f.amountNok) : undefined);
  const parts: string[] = [];
  if (r.carriesCar && amount(v)) parts.push(`Auto fino a 6 m ${amount(v)}`);
  if (r.fare.passengerRule === 'gratis') {
    if (parts.length) return `${parts.join(' · ')} NOK · passeggeri gratis`;
    return r.carriesCar ? 'Auto: prezzo non pubblicato · passeggeri gratis' : 'Passeggeri gratis';
  }
  if (amount(a)) parts.push(`${parts.length ? 'adulto' : 'Adulto'} ${amount(a)}`);
  if (amount(b)) parts.push(`bambino ${amount(b)}`);
  else if (a && b) parts.push('bambino non pubblicato');
  if (!parts.length) return 'Prezzo non pubblicato';
  const text = `${parts.join(' · ')} NOK`;
  return r.carriesCar && r.fare.passengerRule === 'non_indicata' ? `${text} · passeggeri: da verificare` : text;
}

/** Almeno un importo usabile (adulto, bambino o auto) */
export const hasPrice = (r: FerryRoute) => r.fare.fares.some((f) => !f.optional && f.amountNok !== null && ['adulto', 'bambino', 'veicolo', 'pacchetto_veicolo', 'famiglia'].includes(f.category));

/** Durata a parole: «3 h», «1 h 05», «50 min», intervallo «1 h 50–2 h» */
export function fmtMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}
export function fmtRange(r: [number, number] | undefined): string | undefined {
  if (!r) return undefined;
  return r[0] === r[1] ? fmtMinutes(r[0]) : `${fmtMinutes(r[0])}–${fmtMinutes(r[1])}`;
}

// ---------------------------------------------------------------- Elenco: zone, ricerca, filtri

export function zonesOf(r: FerryRoute): string[] {
  const z = fold(r.zone);
  return FERRY_ZONES.filter((x) => z.includes(fold(x)));
}

/** Luoghi del catalogo collegati alla tratta (solo per id, mai per distanza) */
export function routePlaces(r: FerryRoute): string[] {
  return [...new Set([r.places.from, r.places.to, ...r.places.along].filter((x): x is string => Boolean(x)))];
}

export interface FerryFilter {
  q?: string;
  zone?: string;
  car?: 'tutte' | 'auto' | 'passeggeri';
  modes?: FerryMode[];
  withPrice?: boolean;
  linked?: boolean;
}

export function activeFilters(f: FerryFilter): number {
  return [f.q?.trim(), f.zone, f.car && f.car !== 'tutte', f.modes?.length, f.withPrice, f.linked].filter(Boolean).length;
}

export function matchesFerry(r: FerryRoute, f: FerryFilter, tripPlaces: Set<string>): boolean {
  const q = fold(f.q?.trim() ?? '');
  if (q) {
    const text = fold([r.name, r.fromName, r.toName, r.operator, ...r.stops.map((s) => s.name)].join(' '));
    if (!q.split(/\s+/).every((w) => text.includes(w))) return false;
  }
  if (f.zone && !zonesOf(r).includes(f.zone)) return false;
  if (f.car === 'auto' && !r.carriesCar) return false;
  if (f.car === 'passeggeri' && r.carriesCar) return false;
  if (f.modes?.length && !f.modes.includes(r.mode)) return false;
  if (f.withPrice && !hasPrice(r)) return false;
  if (f.linked && !routePlaces(r).some((p) => tripPlaces.has(p))) return false;
  return true;
}

/** Luoghi del catalogo delle tappe del viaggio */
export const tripPlaceIds = (t: Pick<Trip, 'stops'>) => new Set(t.stops.map((s) => s.destinationId).filter((x): x is string => Boolean(x)));

export interface ZoneGroup {
  zone: string;
  routes: FerryRoute[];
}

/** Gruppi per zona; dentro la zona prima le tratte collegate alle tappe, poi in ordine alfabetico */
export function groupByZone(routes: FerryRoute[], tripPlaces: Set<string>, zone?: string): ZoneGroup[] {
  const linked = (r: FerryRoute) => routePlaces(r).some((p) => tripPlaces.has(p));
  const out: ZoneGroup[] = [];
  for (const z of FERRY_ZONES) {
    if (zone && z !== zone) continue;
    const list = routes.filter((r) => zonesOf(r).includes(z));
    if (!list.length) continue;
    list.sort((a, b) => Number(linked(b)) - Number(linked(a)) || a.name.localeCompare(b.name, 'it'));
    out.push({ zone: z, routes: list });
  }
  const other = routes.filter((r) => zonesOf(r).length === 0);
  if (other.length && !zone) out.push({ zone: 'Altre zone', routes: other });
  return out;
}

/** Riepilogo del catalogo (design §3): quante tratte con prezzo dell'anno, da verificare, assente */
export function catalogSummary(routes: FerryRoute[], year: number | undefined) {
  let ok = 0;
  let warn = 0;
  let none = 0;
  for (const r of routes) {
    const s = priceStatus(r, year);
    if (s.tone === 'ok') ok++;
    else if (s.tone === 'warn') warn++;
    else none++;
  }
  return { total: routes.length, ok, warn, none, withPrice: routes.filter(hasPrice).length };
}

// ---------------------------------------------------------------- Disponibilità nel viaggio e passaggio a NO-2

/**
 * Tratte visibili nel viaggio: solo quelle della versione del catalogo scelta dal viaggio (NO-1 non ne ha).
 * `releaseOf` dice da quale versione arriva ogni tratta caricata.
 */
export function tripFerryRoutes(t: Pick<Trip, 'countries'>, routes: FerryRoute[], releaseOf: Record<string, string>): FerryRoute[] {
  const releases = new Set(tripCountries(t).map((c) => c.releaseId));
  return routes.filter((r) => releases.has(releaseOf[r.key] ?? ''));
}

// ---------------------------------------------------------------- Suggerimenti «alternativa all'auto»

export interface FerrySuggestion {
  legId: string;
  route: FerryRoute;
  from: Stop;
  to: Stop;
  /** La tratta va nel verso opposto al collegamento */
  reversed: boolean;
}

/**
 * Battelli veloci o turistici che collegano due tappe consecutive oggi in auto (design §9):
 * entrambe le tappe tra i luoghi della tratta, per id del catalogo; mai per distanza; mai traghetti per auto.
 */
export function ferrySuggestions(t: Pick<Trip, 'stops' | 'legs' | 'hiddenFerrySuggestions'>, routes: FerryRoute[], opts: { includeHidden?: boolean } = {}): FerrySuggestion[] {
  const out: FerrySuggestion[] = [];
  const hidden = t.hiddenFerrySuggestions ?? [];
  for (const leg of t.legs) {
    const from = t.stops.find((s) => s.id === leg.fromStopId);
    const to = t.stops.find((s) => s.id === leg.toStopId);
    if (!from?.destinationId || !to?.destinationId || from.destinationId === to.destinationId) continue;
    if (!leg.segments.some((s) => s.mode === 'strada')) continue;
    for (const r of routes) {
      if (r.mode === 'ferje' || r.roundTrip) continue;
      const places = routePlaces(r);
      if (!places.includes(from.destinationId) || !places.includes(to.destinationId)) continue;
      if (!opts.includeHidden && hidden.some((h) => h.legId === leg.id && h.ferryRouteId === r.key)) continue;
      const reversed = r.places.from === to.destinationId || r.places.to === from.destinationId;
      out.push({ legId: leg.id, route: r, from, to, reversed });
    }
  }
  return out;
}

export function hideSuggestion(t: Trip, legId: string, routeKey: string): Trip {
  const list = t.hiddenFerrySuggestions ?? [];
  if (list.some((h) => h.legId === legId && h.ferryRouteId === routeKey)) return t;
  return { ...t, hiddenFerrySuggestions: [...list, { legId, ferryRouteId: routeKey }] };
}

export function showHiddenSuggestions(t: Trip): Trip {
  if (!t.hiddenFerrySuggestions) return t;
  const next = { ...t };
  delete next.hiddenFerrySuggestions;
  return next;
}

// ---------------------------------------------------------------- Tratto traghetto nel percorso

/**
 * Collegamenti con almeno una tappa collegata alla tratta (per id). Ordine: prima quelli con entrambe le tappe, poi
 * quelli che partono da un luogo collegato (si parte dal porto della tratta), poi gli altri.
 */
export function linkedLegs(t: Pick<Trip, 'stops' | 'legs'>, r: FerryRoute): { legId: string; both: boolean }[] {
  const places = routePlaces(r);
  const out: { legId: string; both: boolean; score: number }[] = [];
  for (const leg of t.legs) {
    const a = t.stops.find((s) => s.id === leg.fromStopId)?.destinationId;
    const b = t.stops.find((s) => s.id === leg.toStopId)?.destinationId;
    const fromIn = Boolean(a && places.includes(a));
    const toIn = Boolean(b && places.includes(b));
    if (fromIn || toIn) out.push({ legId: leg.id, both: fromIn && toIn, score: fromIn && toIn ? 2 : fromIn ? 1 : 0 });
  }
  return out.sort((x, y) => y.score - x.score).map(({ legId, both }) => ({ legId, both }));
}

/** Imbarco e sbarco proposti per un collegamento: tutta la tratta, nel verso del collegamento se si capisce dai luoghi */
export function defaultStops(r: FerryRoute, fromPlace?: string, toPlace?: string): { board: number; alight: number } {
  const reversed = (fromPlace !== undefined && fromPlace === r.places.to) || (toPlace !== undefined && toPlace === r.places.from && fromPlace !== r.places.from);
  return reversed ? { board: lastStop(r).seq, alight: firstStop(r).seq } : { board: firstStop(r).seq, alight: lastStop(r).seq };
}

export type RoadChoice = 'ricalcola' | 'sostituisci' | 'lascia';

export interface FerryChoice {
  route: FerryRoute;
  releaseId?: string;
  board: number;
  alight: number;
  withCar: boolean;
  departureTime?: string;
  waitMin?: number;
  returnBought?: boolean;
  bookingAdded?: boolean;
  /** Prezzo trovato dall'utente: il calcolo del catalogo non si usa */
  manualCost?: Money;
  manualCostStatus?: DataStatus;
  manualSourceUrl?: string;
  /** Link alla fonte della tariffa (dal dizionario delle fonti del catalogo) */
  sourceUrl?: string;
}

/** Coordinate dei moli, solo dal registro NSR */
export function pierLine(sub: SubRoute): [number, number][] | undefined {
  const { board: b, alight: a } = sub;
  if (b.lat === undefined || b.lng === undefined || a.lat === undefined || a.lng === undefined) return undefined;
  return [
    [b.lat, b.lng],
    [a.lat, a.lng],
  ];
}

/**
 * Crea (o aggiorna, con `prev`) il tratto traghetto: segmento a sé, senza km, con durata dalla tratta, attesa e orario
 * inseriti dall'utente, costo per la famiglia calcolato (o inserito a mano). Stato «da verificare» per gli orari.
 */
export function ferrySegment(c: FerryChoice, cost: FerryCost, prev?: Segment): Segment {
  const r = c.route;
  const sub = subRoute(r, c.board, c.alight)!;
  const dur = subDuration(r, sub);
  const manual = Boolean(c.manualCost);
  const keepPaid = prev && ['prenotato', 'pagato'].includes(prev.costStatus) && !manual;
  const seg: Segment = {
    ...(prev ?? {}),
    id: prev?.id ?? newId(),
    mode: 'traghetto',
    label: `${stopName(sub.board)} → ${stopName(sub.alight)}`,
    durationMin: dur ? dur[1] : undefined,
    waitMin: c.waitMin,
    departureTime: c.departureTime || undefined,
    cost: manual ? c.manualCost : cost.totalNok !== undefined ? { amount: Math.round(cost.totalNok), currency: 'NOK' } : undefined,
    costStatus: keepPaid ? prev!.costStatus : manual ? (c.manualCostStatus ?? 'da_verificare') : cost.status,
    status: prev?.status ?? 'da_verificare',
    source: manual && c.manualSourceUrl
      ? { label: 'Prezzo inserito da te', url: c.manualSourceUrl, checkedAt: new Date().toISOString().slice(0, 10) }
      : { label: `Catalogo traghetti${c.releaseId ? ` ${c.releaseId}` : ''}: ${r.name}`, url: c.sourceUrl, checkedAt: r.checkedAt },
    note: `${r.operator} · ${FERRY_MODE_LABEL[r.mode]}${sub.reversed ? ' · verso opposto: durata dall\'andata, da verificare' : ''}`,
    ferryRouteId: r.key,
    ferryReleaseId: c.releaseId,
    ferryBoardStop: sub.board.seq,
    ferryAlightStop: sub.alight.seq,
    withCar: c.withCar,
    ferryReturnBought: c.returnBought || undefined,
    ferryBookingAdded: c.bookingAdded || undefined,
    costByUser: manual || undefined,
  };
  delete seg.distanceKm;
  const line = pierLine(sub);
  if (line) seg.geometry = line;
  else delete seg.geometry;
  for (const k of Object.keys(seg) as (keyof Segment)[]) if (seg[k] === undefined) delete seg[k];
  return seg;
}

/** Stato «prenotato» o «pagato»: l'importo non cambia mai da solo */
export const isLockedCost = (s: Pick<Segment, 'costStatus'>) => s.costStatus === 'prenotato' || s.costStatus === 'pagato';

export interface CostDrift {
  /** Totale salvato nel tratto (NOK) e totale di oggi dal catalogo; assenti = non calcolabile / non salvato */
  from?: number;
  to?: number;
  /** Il tratto è prenotato o pagato: si aggiorna solo con conferma esplicita */
  locked: boolean;
}

/**
 * Conto cambiato rispetto al costo salvato nel tratto (date, età, partecipanti, catalogo): undefined se uguale,
 * se il costo è inserito a mano o se non è un tratto del catalogo. Nulla si aggiorna da solo (review B1).
 */
export function costDrift(seg: Segment, cost: FerryCost): CostDrift | undefined {
  if (!seg.ferryRouteId || seg.costByUser) return undefined;
  const saved = seg.cost && seg.cost.currency === 'NOK' ? Math.round(seg.cost.amount) : undefined;
  if (seg.cost && seg.cost.currency !== 'NOK') return undefined;
  const now = cost.totalNok !== undefined ? Math.round(cost.totalNok) : undefined;
  const statusChanged = !isLockedCost(seg) && now !== undefined && seg.costStatus !== cost.status;
  if (saved === now && !statusChanged) return undefined;
  return { from: saved, to: now, locked: isLockedCost(seg) };
}

/** Modifica del tratto per «Aggiorna»: nuovo importo; lo stato prenotato/pagato resta quello dell'utente */
export function refreshCost(seg: Segment, cost: FerryCost): Partial<Segment> {
  return {
    cost: cost.totalNok !== undefined ? { amount: Math.round(cost.totalNok), currency: 'NOK' } : undefined,
    costStatus: isLockedCost(seg) ? seg.costStatus : cost.status,
    costByUser: undefined,
  };
}

/** Il collegamento ha già la stessa tratta nello stesso verso? */
export function legHasRoute(leg: Leg, routeKey: string, board: number, alight: number, exceptId?: string): boolean {
  return leg.segments.some((s) => s.id !== exceptId && s.ferryRouteId === routeKey && s.ferryBoardStop === board && s.ferryAlightStop === alight);
}

/**
 * Mette il tratto traghetto nel collegamento. Nessuna tappa nuova, notti invariate (design DU6).
 * - `lascia`: la strada resta com'è, il traghetto si aggiunge (i tempi si sommano: avviso nella vista);
 * - `sostituisci`: senza auto, via la strada (e i traghetti rilevati dal calcolo stradale);
 * - `ricalcola`: via i tratti calcolati; la strada fino all'imbarco e dallo sbarco si calcola dopo (insertRoadParts).
 * Con `replaceId` aggiorna un tratto esistente al suo posto.
 */
export function applyFerry(t: Trip, legId: string, seg: Segment, road: RoadChoice, replaceId?: string): Trip {
  return {
    ...t,
    legs: t.legs.map((l) => {
      if (l.id !== legId) return l;
      if (replaceId && l.segments.some((s) => s.id === replaceId)) return { ...l, segments: l.segments.map((s) => (s.id === replaceId ? seg : s)) };
      let rest = l.segments.filter((s) => s.mode !== 'non_calcolato');
      if (road === 'sostituisci') rest = rest.filter((s) => s.mode !== 'strada' && !isAutoSegment(s));
      if (road === 'ricalcola') rest = rest.filter((s) => !isAutoSegment(s));
      return { ...l, segments: [...rest, seg] };
    }),
  };
}

/** Strada calcolata fino all'imbarco (prima) e dallo sbarco (dopo), attorno al traghetto */
export function insertRoadParts(leg: Leg, ferryId: string, before: Segment[], after: Segment[]): Leg {
  const i = leg.segments.findIndex((s) => s.id === ferryId);
  if (i < 0) return leg;
  const segs = [...leg.segments.slice(0, i), ...before, leg.segments[i]!, ...after, ...leg.segments.slice(i + 1)];
  return { ...leg, segments: segs, calculatedAt: new Date().toISOString(), routingError: undefined };
}

/** Proposta «con l'auto» (design DU7): solo se la tratta porta veicoli e il collegamento ha già un tratto su strada */
export const proposeCar = (r: FerryRoute, leg: Leg | undefined) => r.carriesCar && Boolean(leg?.segments.some((s) => s.mode === 'strada'));

/** Ricostruisce dal tratto salvato le scelte del dialogo (per «Cambia imbarco, auto e opzioni») */
export function choiceFromSegment(seg: Segment, r: FerryRoute): FerryChoice {
  return {
    route: r,
    releaseId: seg.ferryReleaseId,
    board: seg.ferryBoardStop ?? firstStop(r).seq,
    alight: seg.ferryAlightStop ?? lastStop(r).seq,
    withCar: Boolean(seg.withCar),
    departureTime: seg.departureTime,
    waitMin: seg.waitMin,
    returnBought: seg.ferryReturnBought,
    bookingAdded: seg.ferryBookingAdded,
    manualCost: seg.costByUser ? seg.cost : undefined,
    manualCostStatus: seg.costByUser ? seg.costStatus : undefined,
    manualSourceUrl: seg.costByUser ? seg.source?.url : undefined,
  };
}

/** Costo del tratto dal catalogo (per il dettaglio «Come è calcolato»); la data è quella del collegamento */
export function segmentCost(t: Trip, leg: Leg, seg: Segment, r: FerryRoute): FerryCost {
  return ferryCost({
    route: r,
    participants: t.participants,
    withCar: Boolean(seg.withCar),
    board: seg.ferryBoardStop,
    alight: seg.ferryAlightStop,
    date: legDate(t, leg),
    tripYear: tripYear(t),
    returnBought: seg.ferryReturnBought,
    bookingAdded: seg.ferryBookingAdded,
  });
}
