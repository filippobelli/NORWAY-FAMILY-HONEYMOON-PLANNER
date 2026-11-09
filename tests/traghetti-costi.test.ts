// Costo per la famiglia dei traghetti del catalogo (spec trasporti via mare §4 e §8): esempi della ricerca,
// 2 adulti + bambini di 8 e 5 anni. Nessun prezzo inventato: un prezzo mancante = «non calcolabile», mai zero.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FERRY_ROUTES } from '../src/data/ferryRoutes';
import type { FerryRoute } from '../src/data/ferryTypes';
import { toEur } from '../src/domain/coastal';
import { createEmptyTrip } from '../src/domain/defaults';
import { catalogSummary, ferryCost, fmtRange, parsePeriod, periodContains, priceLine, priceStatus, subDuration, subRoute, type FerryCostInput } from '../src/domain/ferries';

const family = { adults: 2, childrenAges: [8, 5] };
const route = (key: string): FerryRoute => {
  const r = FERRY_ROUTES.find((x) => x.key === key);
  assert.ok(r, `tratta ${key} nel catalogo`);
  return r;
};
const cost = (key: string, extra: Partial<FerryCostInput> = {}) => ferryCost({ route: route(key), participants: family, withCar: false, tripYear: 2027, ...extra });

test('Tromsø → Harstad senza auto, feriale: 630 × 2 + 209 + 0 = 1469 NOK, tariffa 2026 da verificare per il 2027', () => {
  const c = cost('tromso-harstad-express', { date: '2027-08-11' });
  assert.equal(c.totalNok, 1469);
  assert.equal(c.chosen?.kind, 'persone');
  const lines = c.options[0]!.lines;
  assert.equal(lines.find((l) => l.item.startsWith('Adulto'))?.amountNok, 1260);
  assert.equal(lines.find((l) => l.item === 'Bambino 8 anni')?.amountNok, 209);
  const five = lines.find((l) => l.item === 'Bambino 5 anni')!;
  assert.equal(five.amountNok, 0);
  assert.match(five.rule, /gratis sotto i 6 anni/);
  assert.match(five.warn ?? '', /soglia 6 anni/, 'avviso: età vicina alla soglia');
  assert.equal(c.status, 'da_verificare');
  assert.equal(c.statusText, 'Tariffa 2026, da verificare per il 2027');
});

test('Tromsø → Harstad: di sabato la tariffa del sabato; senza data la feriale con avviso', () => {
  assert.equal(cost('tromso-harstad-express', { date: '2027-08-14' }).totalNok, 277 * 2 + 154);
  const c = cost('tromso-harstad-express');
  assert.equal(c.totalNok, 1469);
  assert.ok(c.warnings.some((w) => /sabato/.test(w)));
});

test('Sottotratta Tromsø → Finnsnes: prezzo della sottotratta (295 × 2 + 98) e durata 1 h 15', () => {
  const r = route('tromso-harstad-express');
  const c = cost('tromso-harstad-express', { board: 1, alight: 2, date: '2027-08-11' });
  assert.equal(c.totalNok, 295 * 2 + 98);
  const sub = subRoute(r, 1, 2)!;
  assert.equal(fmtRange(subDuration(r, sub)), '1 h 15');
  assert.equal(sub.skipped, 3);
  // Sottotratta senza prezzo pubblicato: non calcolabile, mai il prezzo dell'intera tratta
  const mid = cost('tromso-harstad-express', { board: 2, alight: 3, date: '2027-08-11' });
  assert.equal(mid.computable, false);
  assert.equal(mid.totalNok, undefined);
});

test('Geiranger → Hellesylt con auto: 810 + 420 + 210 + 210 = 1650, pacchetto 1650 (a parità vince il conto per persona)', () => {
  const c = cost('geiranger-hellesylt', { withCar: true });
  assert.equal(c.totalNok, 1650);
  assert.equal(c.chosen?.kind, 'persone');
  assert.equal(c.options.find((o) => o.kind === 'pacchetto')?.totalNok, 1650);
  assert.match(c.reason ?? '', /stesso importo/);
  const lines = c.options[0]!.lines;
  assert.equal(lines.find((l) => l.item.startsWith('Auto'))?.amountNok, 810);
  assert.match(lines.find((l) => l.item.startsWith('Adulto'))!.item, /conducente è già nell'auto/, 'il conducente non paga il biglietto');
  assert.match(lines.find((l) => l.item === 'Bambino 5 anni')!.warn ?? '', /soglia 4 anni/);
  // Senza auto: 420 × 2 + 210 + 210; ritorno comprato con l'andata: −50% su adulti e bambini
  assert.equal(cost('geiranger-hellesylt').totalNok, 1260);
  assert.equal(cost('geiranger-hellesylt', { returnBought: true }).totalNok, 630);
});

test('Lauvvik → Lysebotn (Rødne) con auto: pacchetto 1990 contro 2585 per persona, si propone il più basso', () => {
  const c = cost('lysefjord-turistferje', { withCar: true });
  assert.equal(c.options[0]!.totalNok, 2585);
  assert.equal(c.totalNok, 1990);
  assert.equal(c.chosen?.kind, 'pacchetto');
  assert.equal(c.reason, 'il più basso');
  assert.equal(c.status, 'da_verificare');
});

test('Bergen → Flåm agosto 2027: 1449 × 2 + 209 + 0 = 3107, famiglia 3299 come alternativa più cara; prezzo 2027 confermato', () => {
  const c = cost('bergen-flam-express');
  assert.equal(c.totalNok, 3107);
  assert.equal(c.options.find((o) => o.kind === 'famiglia')?.totalNok, 3299);
  assert.equal(c.chosen?.kind, 'persone');
  assert.match(c.options[0]!.lines.find((l) => l.item === 'Bambino 8 anni')!.rule, /max 209 con adulto pagante/);
  assert.equal(c.status, 'confermato');
  assert.equal(c.statusText, 'Prezzo 2027 confermato sulla fonte');
  // Fuori dal 18/5–31/8 vale l'altra tariffa (1349 adulto, tetto bambino 209)
  assert.equal(cost('bergen-flam-express', { date: '2027-09-10' }).totalNok, 1349 * 2 + 209);
  // Viaggio nel 2028: la tariffa 2027 diventa «da verificare»
  assert.equal(cost('bergen-flam-express', { tripYear: 2028 }).status, 'da_verificare');
});

test('Flåm → Gudvangen senza auto: biglietto famiglia 1365 contro 1650 per persona', () => {
  const c = cost('flam-gudvangen');
  assert.equal(c.options[0]!.totalNok, 1650);
  assert.equal(c.totalNok, 1365);
  assert.equal(c.chosen?.kind, 'famiglia');
});

test('Eidsdal → Linge: con auto 81 (passeggeri da verificare); senza auto NON calcolabile (Møre og Romsdal, regola non scritta)', () => {
  const withCar = cost('eidsdal-linge', { withCar: true });
  assert.equal(withCar.totalNok, 81);
  assert.equal(withCar.status, 'da_verificare');
  assert.ok(withCar.warnings.some((w) => /passeggeri pagano/.test(w)));
  const noCar = cost('eidsdal-linge');
  assert.equal(noCar.computable, false);
  assert.equal(noCar.totalNok, undefined, 'mai zero al posto di un dato assente');
  assert.ok(noCar.missing.some((m) => /passeggeri/.test(m)));
});

test('Bodø → Moskenes: senza auto 0 (passeggeri gratis), con auto 605, prenotazione +130 solo se scelta', () => {
  const free = cost('bodo-moskenes');
  assert.equal(free.computable, true);
  assert.equal(free.totalNok, 0);
  assert.equal(cost('bodo-moskenes', { withCar: true }).totalNok, 605);
  assert.equal(cost('bodo-moskenes', { withCar: true, bookingAdded: true }).totalNok, 735);
});

test('Prezzi assenti: Bodø → Svolvær (battello) e Ålesund → Geiranger (bambino non pubblicato) non calcolabili', () => {
  const a = cost('bodo-svolvaer-express');
  assert.equal(a.computable, false);
  assert.equal(a.statusText, 'Prezzo non pubblicato dalla fonte');
  const b = cost('alesund-geiranger');
  assert.equal(b.computable, false);
  assert.ok(b.missing.includes('bambino'));
  // Tariffa estiva del veicolo non pubblicata (Nordland): con auto non calcolabile, senza auto 0 (passeggeri gratis)
  assert.equal(cost('skutvik-svolvaer', { withCar: true }).computable, false);
  assert.equal(cost('skutvik-svolvaer').totalNok, 0);
});

test('Auto non scelta: nessun costo del veicolo; tratta che non porta veicoli: «con auto» non calcolabile', () => {
  const c = cost('bodo-moskenes');
  assert.ok(c.options[0]!.lines.some((l) => l.item === 'Auto' && l.rule === 'non scelta' && l.amountNok === undefined));
  assert.equal(cost('bergen-flam-express', { withCar: true }).computable, false);
});

test('Verso opposto: stesso prezzo dell\'andata ma da verificare', () => {
  const c = cost('geiranger-hellesylt', { board: 2, alight: 1, withCar: true });
  assert.equal(c.totalNok, 1650);
  assert.equal(c.status, 'da_verificare');
  assert.ok(c.warnings.some((w) => /Verso opposto/.test(w)));
});

test('Conversione in euro con il cambio delle Impostazioni', () => {
  const t = createEmptyTrip();
  const eur = toEur({ amount: 1650, currency: 'NOK' }, t.settings);
  assert.equal(Math.round(eur * t.settings.nokPerEur), 1650);
});

test('Periodi della fonte e stato del prezzo: tre testi soltanto', () => {
  assert.deepEqual(parsePeriod('18 maggio – 31 agosto 2027'), { from: [5, 18], to: [8, 31], outside: false });
  assert.deepEqual(parsePeriod('fuori dal 18/5–31/8 (2027)'), { from: [5, 18], to: [8, 31], outside: true });
  assert.equal(periodContains('fuori dal 18/5–31/8 (2027)', '2027-08-20'), false);
  assert.equal(periodContains('testo non leggibile', '2027-08-20'), undefined);
  assert.equal(priceStatus(route('bergen-flam-express'), 2027).short, '✓ Prezzo 2027');
  assert.equal(priceStatus(route('tromso-harstad-express'), 2027).short, '! Tariffa 2026 · da verificare per il 2027');
  assert.equal(priceStatus(route('bodo-svolvaer-express'), 2027).short, '— Prezzo assente');
  const s = catalogSummary(FERRY_ROUTES, 2027);
  assert.equal(s.total, 58);
  assert.equal(s.ok, 1);
  assert.equal(s.none, 11);
  assert.equal(s.withPrice, 41);
  assert.equal(priceLine(route('eidsdal-linge')), 'Auto fino a 6 m 81 NOK · passeggeri: da verificare');
  assert.equal(priceLine(route('bergen-flam-express')), 'Adulto 1449 · bambino 719 NOK');
});
