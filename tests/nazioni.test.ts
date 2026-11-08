import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeBudget } from '../src/domain/budget';
import { rateFor, toEur } from '../src/domain/coastal';
import { addCountry, countryUsage, removeCountry, stopCountry, tripCountries, usageEmpty } from '../src/domain/countries';
import { createEmptyTrip } from '../src/domain/defaults';
import { tripToIcs } from '../src/domain/exportFormats';
import { removeStops, syncLegs } from '../src/domain/itinerary';
import type { Stop, Trip } from '../src/domain/types';

const stop = (id: string, dest: string | undefined, extra: Partial<Stop> = {}): Stop => ({ id, kind: 'luogo', name: id, destinationId: dest, lat: 60, lng: 10, nights: 2, notes: '', weatherPlanB: '', ...extra });
const placeCountry = (k?: string) => (k?.startsWith('xt-') ? 'XT' : k ? 'NO' : undefined);

function twoCountries(): Trip {
  const stops = [stop('a', 'oslo'), stop('b', 'xt-citta'), stop('c', undefined)];
  return {
    ...createEmptyTrip(),
    startDate: '2027-08-01',
    stops,
    legs: syncLegs(stops, []),
    countries: [{ code: 'NO', releaseId: 'NO-1' }, { code: 'XT', releaseId: 'XT-1' }],
    favorites: ['xt-museo', 'oslo'],
    days: { 'b#0': { activities: [{ id: 'x', title: 'Museo', destinationId: 'xt-museo', costStatus: 'stimato', cost: { amount: 50, currency: 'XTS' } }], notes: '', planB: '' } },
    budgetItems: [{ id: 'i1', category: 'pasti', label: 'Cena', amount: { amount: 300, currency: 'XTS' }, status: 'stimato', notes: '' }],
  };
}

test('Valute: cambio per valuta; senza cambio l\'importo è «non convertibile», escluso dal totale ed elencato, mai zero', () => {
  const t = twoCountries();
  assert.equal(rateFor('EUR', t.settings), 1);
  assert.equal(rateFor('NOK', t.settings), t.settings.nokPerEur);
  assert.equal(rateFor('XTS', t.settings), undefined);
  const without = computeBudget(t);
  assert.ok(!without.lines.some((l) => l.label === 'Cena'), 'esclusa dalle righe e dal totale');
  assert.ok(without.missing.includes('Cena: 300 XTS, cambio da inserire'));
  assert.ok(without.missing.some((m) => m.startsWith('Museo: 50 XTS')));
  const withRate = computeBudget({ ...t, rates: { XTS: { perEur: 10, note: 'a mano', auto: false } } });
  assert.equal(withRate.lines.find((l) => l.label === 'Cena')?.eur, 30);
  assert.equal(toEur({ amount: 20, currency: 'XTS' }, t.settings, { XTS: { perEur: 4, note: '', auto: false } }), 5);
});

test('Nazioni: nazione della tappa, cosa usa una nazione, aggiunta e rimozione con le regole delle tappe', () => {
  const t = twoCountries();
  assert.equal(stopCountry(t, t.stops[1]!, placeCountry), 'XT');
  assert.equal(stopCountry(t, t.stops[2]!, placeCountry), 'NO', 'luogo libero: la prima nazione del viaggio (D4)');
  assert.equal(stopCountry(t, { ...t.stops[2]!, countryCode: 'XT' }, placeCountry), 'XT');
  const u = countryUsage(t, 'XT', placeCountry, { airportCodes: new Set(['XTA']) });
  assert.deepEqual(u.stops.map((s) => s.id), ['b']);
  assert.equal(u.favorites, 1);
  assert.equal(u.activities, 1);
  const after = removeCountry(t, 'XT', u.stops.map((s) => s.id), removeStops);
  assert.deepEqual(after.stops.map((s) => s.id), ['a', 'c']);
  assert.deepEqual(tripCountries(after).map((c) => c.code), ['NO']);
  assert.ok(after.days['b#0'], 'attività e note restano, senza giornata');
  assert.deepEqual(after.favorites, t.favorites, 'preferiti conservati');
  assert.equal(removeCountry(after, 'NO', [], removeStops), after, 'l\'ultima nazione non si toglie');
  assert.equal(countryUsage(after, 'XT', placeCountry).stops.length, 0);
  assert.ok(!usageEmpty(countryUsage(after, 'XT', placeCountry)), 'i preferiti conservati restano contati');
  assert.ok(usageEmpty(countryUsage({ ...after, favorites: ['oslo'], days: {} }, 'XT', placeCountry)));
  const third = addCountry(after, 'YY', 'YY-1');
  assert.deepEqual(tripCountries(third).map((c) => c.code), ['NO', 'YY']);
  assert.equal(addCountry(third, 'YY', 'YY-2'), third, 'già presente: nessun doppione');
  assert.deepEqual(tripCountries(createEmptyTrip()), [{ code: 'NO', releaseId: 'NO-1' }], 'viaggio vecchio: Norvegia versione 1');
});

test('Fuso: calendario nel fuso della nazione; fusi CET con VTIMEZONE, gli altri in UTC', () => {
  const t: Trip = {
    ...createEmptyTrip(),
    startDate: '2027-08-01',
    stops: [stop('a', 'oslo', { nights: 1 })],
    flights: [{ id: 'f', direction: 'andata', fromAirport: 'NRT', toAirport: 'HND', date: '2027-08-01', departureTime: '10:00', arrivalTime: '12:30', airline: '', flightNumber: '', baggage: '', priceStatus: 'stimato', selected: true, notes: '' }],
  };
  const cet = tripToIcs(t, new Date('2026-11-07T00:00:00Z'), 'Europe/Stockholm');
  assert.match(cet, /TZID:Europe\/Stockholm/);
  assert.match(cet, /DTSTART;TZID=Europe\/Stockholm:20270801T100000/);
  const tokyo = tripToIcs(t, new Date('2026-11-07T00:00:00Z'), 'Asia/Tokyo');
  assert.doesNotMatch(tokyo, /BEGIN:VTIMEZONE/);
  assert.match(tokyo, /DTSTART:20270801T010000Z/, '10:00 a Tokyo = 01:00 UTC');
  assert.match(tokyo, /DTEND:20270801T033000Z/);
});

import { ratesUsed } from '../src/domain/budget';

test('Budget: «Cambi usati» una riga per valuta, con il cambio o «cambio mancante» e quante voci', () => {
  const t = twoCountries();
  const r = ratesUsed(t, ['NOK', 'XTS']);
  assert.deepEqual(r.map((x) => x.currency), ['NOK', 'XTS']);
  assert.equal(r[0]!.perEur, t.settings.nokPerEur);
  assert.equal(r[1]!.perEur, undefined, 'XTS senza cambio');
  assert.equal(r[1]!.amounts, 2, 'cena e attività in XTS');
  const withRate = ratesUsed({ ...t, rates: { XTS: { perEur: 10, date: '2026-11-08', note: 'a mano', auto: false } } }, ['NOK', 'XTS']);
  assert.equal(withRate[1]!.perEur, 10);
  assert.deepEqual(ratesUsed({ ...t, budgetItems: [], days: {} }, []).map((x) => x.currency), [], 'nessuna valuta: nessuna riga');
});
