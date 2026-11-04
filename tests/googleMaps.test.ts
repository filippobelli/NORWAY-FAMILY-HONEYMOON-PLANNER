import assert from 'node:assert/strict';
import { test } from 'node:test';
import { googleDirectionsUrl, googleModeForLeg, googlePlaceUrl } from '../src/domain/googleMaps';

test('Google Maps: link di percorso con partenza, arrivo e mezzo', () => {
  const u = new URL(googleDirectionsUrl({ lat: 68.15123456, lng: 14.2 }, { lat: 69.3, lng: 16.1 }, 'driving'));
  assert.equal(u.hostname, 'www.google.com');
  assert.equal(u.searchParams.get('api'), '1');
  assert.equal(u.searchParams.get('origin'), '68.15123,14.20000');
  assert.equal(u.searchParams.get('destination'), '69.30000,16.10000');
  assert.equal(u.searchParams.get('travelmode'), 'driving');
  assert.equal(new URL(googlePlaceUrl({ lat: 1, lng: 2 })).searchParams.get('query'), '1.00000,2.00000');
});

test('Google Maps: mezzi pubblici solo se il tratto ha treno o bus', () => {
  const seg = (mode: 'strada' | 'treno' | 'traghetto') => ({ id: mode, mode, label: mode, status: 'stimato' as const, costStatus: 'stimato' as const });
  assert.equal(googleModeForLeg({ id: 'l', fromStopId: 'a', toStopId: 'b', segments: [seg('strada'), seg('traghetto')] }), 'driving');
  assert.equal(googleModeForLeg({ id: 'l', fromStopId: 'a', toStopId: 'b', segments: [seg('treno')] }), 'transit');
});
