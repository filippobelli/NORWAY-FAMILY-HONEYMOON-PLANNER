import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bookingsOverview } from '../src/domain/bookings';
import { breakCandidates, draftBreak } from '../src/domain/breakLeg';
import { applySuggestion, suggestAlternatives } from '../src/domain/dayLoad';
import { dayTransfer, legTiming } from '../src/domain/dayTransfer';
import { createEmptyTrip } from '../src/domain/defaults';
import { exportFileName, foldIcsLine, offlinePackage, tripToGpx, tripToIcs, tripToKml } from '../src/domain/exportFormats';
import { computeDays, syncLegs } from '../src/domain/itinerary';
import { migrateDocument } from '../src/domain/migrations';
import { nextStep, tripOverview } from '../src/domain/overview';
import { summaryToPdf, winAnsi, wrap } from '../src/domain/pdf';
import { planImpact } from '../src/domain/planImpact';
import { tripSummary } from '../src/domain/tripSummary';
import type { Accommodation, Leg, Segment, Stop, Trip } from '../src/domain/types';
import { accommodationInfo, segmentInfo, verifiedNow } from '../src/domain/verification';
import { forecastWindow, parseOpenMeteo } from '../src/domain/weather';
import { parseRoute } from '../src/state/route';

const stop = (id: string, name: string, nights: number, lat = 60, lng = 6, kind: Stop['kind'] = 'luogo'): Stop => ({ id, kind, name, lat, lng, nights, notes: '', weatherPlanB: '' });
function tripWith(stops: Stop[], patch: Partial<Trip> = {}): Trip {
  const t = { ...createEmptyTrip(), stops, ...patch };
  return { ...t, legs: syncLegs(t.stops, t.legs) };
}
const road = (min: number, geometry?: [number, number][]): Segment => ({ id: `r${min}`, mode: 'strada', label: 'Percorso stradale', durationMin: min, distanceKm: min, status: 'stimato', costStatus: 'da_verificare', source: { label: 'OSRM (routing.openstreetmap.de)' }, geometry });
const ferry = (p: Partial<Segment> = {}): Segment => ({ id: 'f1', mode: 'traghetto', label: 'Traghetto Linge–Eidsdal', durationMin: 20, status: 'stimato', costStatus: 'da_verificare', ...p });
const acc = (p: Partial<Accommodation>): Accommodation => ({ id: 'h', name: 'Hytte', type: 'hytte', locality: '', priceStatus: 'stimato', beds: '', bathroom: 'non_noto', kitchen: 'non_noto', parking: 'non_noto', cancellation: '', status: 'individuata', notes: '', ...p });
const withLegs = (t: Trip, fn: (l: Leg, i: number) => Leg['segments']): Trip => ({ ...t, legs: t.legs.map((l, i) => ({ ...l, segments: fn(l, i) })) });
const NOW = new Date('2027-07-01T10:00:00Z');

// ---------- A. Prenotazione e verifica distinte ----------

test('Verifica ≠ prenotazione: un traghetto con orario verificato resta «non prenotato»', () => {
  const t = withLegs(tripWith([stop('a', 'Ålesund', 2), stop('b', 'Geiranger', 2)]), () => [road(60), ferry({ verification: verifiedNow(undefined, NOW) })]);
  const row = bookingsOverview(t, NOW).rows.find((r) => r.group === 'trasporti')!;
  assert.equal(row.booking, 'non_prenotato');
  assert.equal(row.info?.state, 'verificata');
  // Il prossimo passo non chiede di verificarlo e non lo tratta come prenotato
  assert.ok(!tripOverview(t).actions.some((a) => a.id === 'crossings'));
});

test('Verifica: una verifica vecchia diventa «da ricontrollare» secondo la regola configurabile', () => {
  const old = ferry({ verification: { state: 'verificata', checkedAt: '2027-05-01T10:00:00Z' } });
  assert.equal(segmentInfo(old, {}, NOW)?.state, 'da_ricontrollare');
  assert.equal(segmentInfo(old, { recheckAfterDays: 90 }, NOW)?.state, 'verificata');
  assert.equal(segmentInfo(road(30)), undefined, 'la strada calcolata non ha orari da verificare');
});

test('Alloggio individuato: non disponibile né prenotato; prenotato non dipende dalla verifica', () => {
  assert.equal(accommodationInfo(acc({ status: 'individuata' }), {}, NOW).state, 'da_verificare');
  const t = tripWith([stop('a', 'Bergen', 2), stop('b', 'Oslo', 0)], { accommodations: [acc({ id: 'h1', status: 'individuata', stopId: 'a', verification: verifiedNow(undefined, NOW) })] });
  const withA = { ...t, stops: t.stops.map((s) => (s.id === 'a' ? { ...s, accommodationId: 'h1' } : s)) };
  const row = bookingsOverview(withA, NOW).rows.find((r) => r.group === 'alloggi')!;
  assert.equal(row.booking, 'individuato');
  assert.equal(row.info?.state, 'verificata');
  assert.match(row.todo ?? '', /da prenotare/);
});

test('Compatibilità: viaggi salvati prima, senza il campo verifica, si leggono come prima e non vengono riscritti', () => {
  const legacy = { ...createEmptyTrip(), schemaVersion: 2 } as unknown as Record<string, unknown>;
  const doc = migrateDocument(legacy);
  assert.equal(doc.schemaVersion, 2, 'nessuna migrazione di formato necessaria: i campi nuovi sono facoltativi');
  // Stato «confermato» dei dati vecchi = orario verificato, con la data della fonte se c'è
  assert.equal(segmentInfo(ferry({ status: 'confermato', source: { label: 'Fjord1', checkedAt: '2027-06-20T00:00:00Z' } }), {}, NOW)?.state, 'verificata');
  assert.equal(segmentInfo(ferry({ status: 'confermato' }), {}, NOW)?.why.includes('data del controllo non registrata'), true);
  // «disponibile» dei viaggi vecchi: disponibilità controllata, ma non prenotazione
  const old = acc({ status: 'disponibile' });
  assert.equal(accommodationInfo(old, {}, NOW).state, 'verificata');
  const t = tripWith([stop('a', 'Bergen', 2)], { accommodations: [{ ...old, id: 'x', stopId: 'a' }] });
  assert.equal(bookingsOverview({ ...t, stops: t.stops.map((s) => ({ ...s, accommodationId: 'x' })) }, NOW).rows.find((r) => r.group === 'alloggi')?.booking, 'individuato');
});

test('Alloggio annullato: torna tra le prenotazioni da fare', () => {
  const t = tripWith([stop('a', 'Bergen', 2), stop('b', 'Oslo', 0)], { accommodations: [acc({ id: 'h1', status: 'annullata', stopId: 'a' })] });
  const withA = { ...t, stops: t.stops.map((s) => (s.id === 'a' ? { ...s, accommodationId: 'h1' } : s)) };
  assert.equal(bookingsOverview(withA).rows.find((r) => r.group === 'alloggi')?.booking, 'annullato');
  assert.ok(tripOverview(withA).actions.some((a) => a.id === 'beds'));
});

// ---------- B. Prossimo passo: priorità e unica fonte ----------

test('Prossimo passo: ordine trasferimenti → orari da confermare → prenotazioni → rifiniture', () => {
  const t0 = tripWith([stop('a', 'Bergen', 8), stop('b', 'Geiranger', 8), stop('c', 'Oslo', 0)], { startDate: '2027-08-01' });
  const t = withLegs({ ...t0, settings: { ...t0.settings, maxTravelMinPerDay: 120 } }, (_, i) => (i === 0 ? [road(300)] : [road(60), ferry()]));
  const ids = tripOverview(t).actions.map((a) => a.id);
  const at = (id: string) => ids.indexOf(id);
  assert.ok(at('over-limit') >= 0 && at('crossings') > at('over-limit'));
  assert.ok(at('flights') > at('crossings') && at('beds') > at('crossings'));
  assert.ok(at('dates') > at('beds'));
  const tiers = tripOverview(t).actions.map((a) => a.tier);
  assert.deepEqual(tiers, [...tiers].sort((x, y) => x - y));
  assert.ok(tripOverview(t).actions.every((a) => a.why.length > 10), 'ogni suggerimento spiega perché');
});

test('Prossimo passo: stessa condizione, stesso testo e stessa destinazione ovunque', () => {
  const t = tripWith([stop('a', 'Bergen', 3), stop('b', 'Flåm', 2)]);
  const a = nextStep(t);
  const b = nextStep(JSON.parse(JSON.stringify(t)) as Trip);
  assert.deepEqual(a, b);
  assert.equal(parseRoute(a.main!.href).params.azione, 'calcola');
});

test('Prossimo passo: con tutto in ordine non resta nessuna azione urgente', () => {
  const t0 = tripWith([stop('a', 'Bergen', 16), stop('b', 'Oslo', 0)], {
    dateTentative: false,
    accommodations: [acc({ id: 'h1', status: 'prenotata', stopId: 'a', pricePerNight: { amount: 100, currency: 'EUR' } })],
    flights: [
      { id: 'f1', direction: 'andata', fromAirport: 'BRI', toAirport: 'BGO', airline: '', flightNumber: '', baggage: '', priceStatus: 'pagato', price: { amount: 1, currency: 'EUR' }, selected: true, notes: '' },
      { id: 'f2', direction: 'ritorno', fromAirport: 'OSL', toAirport: 'BRI', airline: '', flightNumber: '', baggage: '', priceStatus: 'pagato', price: { amount: 1, currency: 'EUR' }, selected: true, notes: '' },
    ],
  });
  const t = withLegs({ ...t0, stops: t0.stops.map((s) => (s.id === 'a' ? { ...s, accommodationId: 'h1' } : s)) }, () => [road(60)]);
  const ids = tripOverview(t).actions.map((a) => a.id);
  assert.ok(!ids.some((id) => ['over-limit', 'legs', 'crossings', 'flights', 'beds', 'availability'].includes(id)), ids.join());
});

// ---------- C. Tempi mancanti, stimati e calcolati ----------

test('Giornata con un tratto mancante e tempi noti sotto il limite: non verificabile, non «entro»', () => {
  const t = withLegs(tripWith([stop('a', 'A', 0), stop('b', 'B', 0), stop('c', 'C', 2)]), (_, i) => (i === 0 ? [road(60)] : [{ id: 'x', mode: 'non_calcolato', label: '—', status: 'da_verificare', costStatus: 'da_verificare' }]));
  const d = dayTransfer(t, computeDays(t)[0]!);
  assert.equal(d.state, 'non_verificabile');
  assert.equal(d.missing.length, 1);
  assert.match(d.missing[0]!.reason!, /non ancora calcolato/);
  assert.ok(tripOverview(t).actions.some((a) => a.id === 'legs' && a.tier === 1));
});

test('Giornata con tempi noti già oltre il limite: oltre il limite anche se un tratto manca', () => {
  const t = withLegs(tripWith([stop('a', 'A', 0), stop('b', 'B', 0), stop('c', 'C', 2)]), (_, i) => (i === 0 ? [road(400)] : [{ ...ferry(), durationMin: undefined }]));
  const d = dayTransfer(t, computeDays(t)[0]!);
  assert.equal(d.state, 'oltre');
  assert.equal(d.missing[0]?.reason, 'durata di un mezzo non inserita');
});

test('Tempi: calcolato da OSRM, stimato se inserito a mano, da verificare per un traghetto non verificato', () => {
  const t = withLegs(tripWith([stop('a', 'A', 1), stop('b', 'B', 1)]), () => [road(60)]);
  assert.equal(legTiming(t.legs[0]!, t).kind, 'calcolato');
  const manual = withLegs(t, () => [{ ...road(60), source: { label: 'Fonte inserita a mano' } }]);
  assert.equal(legTiming(manual.legs[0]!, manual).kind, 'stimato');
  const f = withLegs(t, () => [road(60), ferry()]);
  assert.equal(legTiming(f.legs[0]!, f).kind, 'da_verificare');
  // Un tratto non calcolato ha una stima di massima, che non entra mai nei totali
  const u = withLegs(tripWith([stop('a', 'Bergen', 1, 60.39, 5.32), stop('b', 'Flåm', 1, 60.86, 7.11)]), () => [{ id: 'x', mode: 'non_calcolato', label: '—', status: 'da_verificare', costStatus: 'da_verificare' }]);
  const lt = legTiming(u.legs[0]!, u);
  assert.ok((lt.roughMin ?? 0) > 0);
  assert.equal(lt.knownMin, 0);
});

// ---------- H. Tappe intermedie e proposte: bozze, mai applicate da sole ----------

test('Tappa intermedia: senza tracciato si spiega il limite; con tracciato si propone una bozza che non tocca il viaggio', () => {
  const t0 = tripWith([stop('a', 'Bergen', 2, 60.39, 5.32), stop('b', 'Trondheim', 3, 63.43, 10.39)]);
  assert.match(breakCandidates(t0, t0.legs[0]!.id).limit ?? '', /tracciato/);
  // Tracciato che passa da Ålesund (62.47, 6.15)
  const line: [number, number][] = Array.from({ length: 40 }, (_, i) => {
    const k = i / 39;
    return k < 0.5 ? [60.39 + (62.47 - 60.39) * k * 2, 5.32 + (6.15 - 5.32) * k * 2] : [62.47 + (63.43 - 62.47) * (k - 0.5) * 2, 6.15 + (10.39 - 6.15) * (k - 0.5) * 2];
  });
  const t = withLegs(t0, () => [road(600, line)]);
  const frozen = JSON.stringify(t);
  const opts = breakCandidates(t, t.legs[0]!.id);
  assert.ok(opts.candidates.some((c) => c.destinationId === 'alesund'), JSON.stringify(opts));
  const draft = draftBreak(t, t.legs[0]!.id, 'alesund', 'dalla_destinazione');
  assert.equal(JSON.stringify(t), frozen, 'il viaggio non cambia');
  assert.deepEqual(draft.stops.map((s) => s.name), ['Bergen', 'Ålesund', 'Trondheim']);
  assert.equal(draft.stops[2]!.nights, 2, 'la notte è presa dalla tappa di arrivo');
  const longer = draftBreak(t, t.legs[0]!.id, 'alesund', 'aggiungi');
  assert.equal(planImpact(t, longer).nights.after, 6);
});

test('Proposte di alleggerimento: suggerite senza applicarle; applicate solo su richiesta', () => {
  const t0 = tripWith([stop('a', 'A', 1), stop('b', 'B', 1), stop('c', 'C', 1)]);
  const t = withLegs({ ...t0, settings: { ...t0.settings, maxTravelMinPerDay: 60 } }, () => [road(400)]);
  const frozen = JSON.stringify(t);
  const sg = suggestAlternatives(t).find((s) => s.action);
  assert.equal(JSON.stringify(t), frozen);
  if (sg?.action) assert.notEqual(JSON.stringify(applySuggestion(t, sg.action)), frozen);
});

// ---------- G. Esportazioni ----------

test('ICS: un evento per giornata, eventi con ora solo se l\'orario è inserito, testo e righe a norma', () => {
  const t0 = tripWith([stop('a', 'Ålesund, centro; porto', 1), stop('b', 'Geiranger', 1), stop('c', 'Oslo', 0)], { startDate: '2027-08-03' });
  const t = withLegs(t0, (_, i) => (i === 0 ? [road(60), ferry({ departureTime: '10:30' })] : [road(60), ferry({ id: 'f2' })]));
  const ics = tripToIcs(t, NOW);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n'));
  assert.equal((ics.match(/DTSTART;VALUE=DATE:/g) ?? []).length, 3);
  assert.equal((ics.match(/DTSTART;TZID=Europe\/Oslo:20270804T103000/g) ?? []).length, 1, 'solo il traghetto con orario');
  assert.ok(ics.includes('Ålesund\\, centro\\; porto'), 'virgole e punti e virgola protetti, accenti intatti');
  for (const line of ics.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, line);
  assert.ok(!tripToIcs(tripWith([stop('a', 'A', 1)]), NOW).includes('DTSTART;TZID'), 'senza orari nessun evento con ora');
  assert.equal(foldIcsLine('x'.repeat(80)).split('\r\n ').length, 2);
});

test('ICS, GPX, KML e PDF con viaggio vuoto o dati mancanti: file validi, nulla inventato', () => {
  const empty = createEmptyTrip();
  assert.ok(tripToIcs(empty, NOW).includes('BEGIN:VCALENDAR') && !tripToIcs(empty, NOW).includes('BEGIN:VEVENT'));
  assert.ok(tripToGpx(empty).includes('<gpx') && !tripToGpx(empty).includes('<wpt'));
  assert.ok(tripToKml(empty).includes('<kml'));
  const pdf = new TextDecoder('latin1').decode(summaryToPdf(tripSummary(empty, { now: NOW })));
  assert.ok(pdf.startsWith('%PDF-1.4') && pdf.trimEnd().endsWith('%%EOF'));
  // Coordinate mancanti o non valide: la tappa resta nel riepilogo ma non nei file per le mappe
  const t = tripWith([stop('a', 'Bergen', 1), { ...stop('b', 'Senza coordinate', 1), lat: Number.NaN }]);
  assert.equal((tripToGpx(t).match(/<wpt/g) ?? []).length, 1);
  assert.equal((tripToKml(t).match(/<Point>/g) ?? []).length, 1);
  assert.ok(tripSummary(t, { now: NOW }).sections.find((s) => s.id === 'tappe')!.items[1]!.lines.includes('Coordinate non disponibili'));
});

test('PDF: offset xref corretti, accenti in WinAnsi, testi lunghi su più pagine', () => {
  assert.deepEqual(winAnsi('åøæ → é'), [0xe5, 0xf8, 0xe6, 32, 45, 62, 32, 0xe9]);
  assert.ok(wrap('parola '.repeat(200), 10, false).length > 5);
  const long = tripWith(Array.from({ length: 30 }, (_, i) => stop(`s${i}`, `Tappa ${i} con un nome piuttosto lungo per andare a capo`, 1)), { usefulInfo: 'Numero utile: +47 22 00 00 00\n'.repeat(40) });
  const bytes = summaryToPdf(tripSummary(long, { now: NOW }));
  const txt = new TextDecoder('latin1').decode(bytes);
  const pages = Number(/\/Count (\d+)/.exec(txt)![1]);
  assert.ok(pages > 2);
  const startxref = Number(/startxref\n(\d+)/.exec(txt)![1]);
  assert.equal(txt.slice(startxref, startxref + 4), 'xref');
  // Ogni oggetto parte all'offset dichiarato
  const offsets = [...txt.slice(startxref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
  offsets.forEach((o, i) => assert.ok(txt.startsWith(`${i + 1} 0 obj`, o), `oggetto ${i + 1}`));
});

test('Pacchetto offline: solo dati del viaggio, HTML protetto, diario solo se scelto', () => {
  const t = tripWith([stop('a', 'Bergen <b>', 2)], {
    usefulInfo: 'Assistenza auto: +47 123',
    diary: [{ id: 'd', createdAt: '2027-08-01T10:00:00Z', updatedAt: '2027-08-01T10:00:00Z', localDate: '2027-08-01', localTime: '12:00', tzOffsetMin: -120, text: 'Bellissimo fiordo' }],
  });
  const html = offlinePackage(t, { now: NOW });
  assert.ok(html.includes('Bergen &lt;b&gt;') && !html.includes('Bergen <b>'));
  assert.ok(html.includes('Assistenza auto: +47 123'));
  assert.ok(!html.includes('Bellissimo fiordo'));
  assert.ok(offlinePackage(t, { diary: true, now: NOW }).includes('Bellissimo fiordo'));
  assert.ok(!/<script/i.test(html), 'nessuno script: funziona offline senza risorse esterne');
  assert.equal(exportFileName({ ...t, title: 'Norvegia, fjordi & Ålesund' }, 'pdf', NOW), 'norvegia-fjordi-alesund-2027-07-01.pdf');
});

// ---------- K. Meteo ----------

test('Meteo: solo nei 16 giorni del fornitore; la risposta si legge senza inventare valori', () => {
  assert.equal(forecastWindow('2027-08-10', '2026-11-06').available, false);
  const far = forecastWindow('2027-08-10', '2027-07-20');
  assert.ok(!far.available && far.from === '2027-07-26');
  assert.deepEqual(forecastWindow('2027-08-10', '2027-08-01'), { available: true, daysAhead: 9 });
  assert.equal(forecastWindow('2027-07-30', '2027-08-01').available, false);
  const f = parseOpenMeteo({ daily: { time: ['2027-08-10'], temperature_2m_max: [18.4], temperature_2m_min: [null], precipitation_sum: [2], weather_code: [61] } }, '2027-08-10', { place: 'Bergen', lat: 60.39, lng: 5.32, fetchedAt: NOW.toISOString() });
  assert.equal(f?.tMax, 18.4);
  assert.equal(f?.tMin, undefined, 'un valore assente resta assente');
  assert.equal(parseOpenMeteo({ daily: { time: ['2027-08-11'] } }, '2027-08-10', { place: '', lat: 0, lng: 0, fetchedAt: '' }), undefined);
});
