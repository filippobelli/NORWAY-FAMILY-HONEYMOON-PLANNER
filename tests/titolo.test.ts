import assert from 'node:assert/strict';
import test from 'node:test';
import { periodLabel, tripTitle } from '../src/domain/tripTitle';

const stop = (nights: number) => ({ nights }) as never;

test('Titolo: solo la nazione senza itinerario, il periodo dalle date se ci sono giorni', () => {
  assert.equal(tripTitle({ countries: [{ code: 'NO', releaseId: 'NO-1' }], stops: [], startDate: '2027-08-01' }), 'Norvegia');
  assert.equal(tripTitle({ countries: [], stops: [], startDate: '2027-08-01' }), 'Nuovo viaggio');
  const t = { countries: [{ code: 'NO', releaseId: 'NO-1' }, { code: 'SE', releaseId: 'SE-1' }], stops: [stop(3)], startDate: '2027-07-30' };
  assert.match(tripTitle(t), /^Norvegia e Svezia, luglio–agosto 2027$/);
  assert.equal(tripTitle(t, (c) => (c === 'NO' ? 'Norge' : undefined)), 'Norge e Svezia, luglio–agosto 2027');
});

test('Periodo: stesso mese, mesi diversi, anni diversi', () => {
  assert.equal(periodLabel('2027-08-01', '2027-08-15'), 'agosto 2027');
  assert.equal(periodLabel('2027-07-25', '2027-08-10'), 'luglio–agosto 2027');
  assert.equal(periodLabel('2027-12-28', '2028-01-04'), 'dicembre 2027 – gennaio 2028');
});
