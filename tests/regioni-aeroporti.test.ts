import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findDestination } from '../src/data/destinations';
import { configureItinerary, type ConfiguratorInput } from '../src/domain/configurator';

const input: ConfiguratorInput = {
  days: 16,
  startDate: '2027-08-01',
  arrivalAirportId: 'osl',
  departureAirportId: 'bgo',
  modes: ['auto'],
  pace: 'equilibrato',
  maxDriveHours: 5,
  regions: ['Fiordi occidentali'],
  mustSee: [],
  kidFriendly: true,
};
const regionsOf = (i: ConfiguratorInput) =>
  configureItinerary(i)
    .plan.stops.filter((s) => s.nights > 0)
    .map((s) => findDestination(s.destinationId)?.region);

test('Configuratore: la regione dell\'aeroporto è compresa finché non viene tolta', () => {
  // Comportamento di prima: arrivo a Oslo, la regione Oslo e Østlandet può ospitare tappe
  const withAirport = configureItinerary(input);
  assert.equal(withAirport.plan.stops[0]?.destinationId, 'osl');
  // Tolta: si atterra comunque a Oslo, ma nessuna notte nella regione (salvo tappe intermedie per tratti lunghi)
  const excluded = configureItinerary({ ...input, excludedAirportRegions: ['Oslo e Østlandet'] });
  assert.equal(excluded.plan.stops[0]?.destinationId, 'osl', 'l\'arrivo resta all\'aeroporto');
  assert.equal(excluded.plan.stops[excluded.plan.stops.length - 1]?.destinationId, 'bgo');
  assert.ok(regionsOf(input).includes('Oslo e Østlandet'), 'regione compresa: almeno una notte in Østlandet');
  assert.ok(!regionsOf({ ...input, excludedAirportRegions: ['Oslo e Østlandet'] }).includes('Oslo e Østlandet'), 'regione tolta: nessuna notte in Østlandet');
  // Togliere una regione che non è di un aeroporto non ha effetto su questa regola
  assert.deepEqual(regionsOf({ ...input, excludedAirportRegions: ['Troms e Finnmark'] }), regionsOf(input));
});
