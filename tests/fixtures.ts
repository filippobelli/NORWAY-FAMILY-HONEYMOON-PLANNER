import { createEmptyTrip } from '../src/domain/defaults';
import { syncLegs } from '../src/domain/itinerary';
import { addScenario } from '../src/domain/scenarios';
import type { Stop, Trip } from '../src/domain/types';

// Documento di prova con tutti i campi del modello (usato dai test delle righe, della sincronizzazione e del passaggio)
export const stop = (id: string, name: string, nights: number, extra: Partial<Stop> = {}): Stop => ({ id, kind: 'luogo', name, lat: 60, lng: 7, nights, notes: '', weatherPlanB: '', ...extra });

/** Documento con tutti i campi del modello, più campi sconosciuti a ogni livello */
export function fullTrip(): Trip {
  const stops = [
    stop('a', 'Oslo', 2, { destinationId: 'oslo', ideas: ['fram', 'folkemuseum'], accommodationId: 'h1', countryCode: 'NO', notes: 'n', weatherPlanB: 'museo', placedFrom: undefined }),
    stop('b', 'Bergen', 1, { destinationId: 'bergen', ideas: [] }),
    { ...stop('c', 'A bordo', 1, { kind: 'a_bordo', placedFrom: 'co1' }), campoFuturoTappa: { x: [1, 2] } } as unknown as Stop,
  ];
  const legs = syncLegs(stops, []).map((l, i) => ({
    ...l,
    calculatedAt: '2026-11-01T10:00:00.000Z',
    routingError: i === 1 ? 'errore' : undefined,
    segments: [
      { id: `s${i}a`, mode: 'strada' as const, label: 'Strada', distanceKm: 120.5, durationMin: 95, status: 'stimato' as const, costStatus: 'da_verificare' as const, geometry: [[60, 7], [60.1, 7.2]] as [number, number][], source: { label: 'OSRM', url: 'https://router.project-osrm.org', checkedAt: '2026-11-01' } },
      { id: `s${i}b`, mode: 'traghetto' as const, label: 'Traghetto', durationMin: 20, waitMin: 15, departureTime: '10:30', cost: { amount: 250, currency: 'NOK' }, costStatus: 'stimato' as const, status: 'da_verificare' as const, note: 'orario estivo', verification: { state: 'verificata' as const, checkedAt: '2026-11-02T08:00:00Z', source: { label: 'Fjord1' } }, flightId: undefined, coastalOptionId: 'co1', campoSegmento: true },
    ],
  }));
  const base = createEmptyTrip();
  const t: Trip = {
    ...base,
    id: '11111111-2222-4333-8444-555555555555',
    title: 'Norvegia, agosto 2027',
    startDate: '2027-08-01',
    dateTentative: false,
    participants: { adults: 2, childrenAges: [8, 5] },
    stops,
    legs,
    days: {
      'a#1': { activities: [{ id: 'act1', title: 'Museo Fram', destinationId: 'fram', durationMin: 120, cost: { amount: 300, currency: 'NOK' }, costStatus: 'confermato', verification: { state: 'da_verificare' } }, { id: 'act2', title: 'Gelato', costStatus: 'stimato' }], notes: 'giornata piena', planB: 'pioggia: acquario' },
      'b#1': { activities: [], notes: '', planB: '' },
      partenza: { activities: [], notes: 'volo alle 10', planB: '' },
    },
    coastalOptions: [{ id: 'co1', operator: 'Havila', direction: 'nord', fromPort: 'Bergen', toPort: 'Ålesund', date: '2027-08-04', departureTime: '20:30', arrivalTime: '09:45', durationHours: 13.25, nightsOnboard: 1, cabin: 'interna', withCar: true, meals: 'pensione_completa', price: { amount: 1234.5, currency: 'EUR' }, priceStatus: 'stimato', extras: { amount: 900, currency: 'NOK' }, childRules: 'sotto 4 gratis', changePolicy: 'flessibile', notes: '', source: { label: 'Havila' }, verification: { state: 'verificata', checkedAt: '2026-10-28' }, selected: true, catalogId: 'hv-bergen-alesund' }],
    flights: [{ id: 'f1', direction: 'andata', fromAirport: 'BRI', toAirport: 'OSL', date: '2027-08-01', departureTime: '06:00', arrivalTime: '11:00', airline: 'SAS', flightNumber: 'SK1', stops: 1, baggage: '1 bagaglio', price: { amount: 800, currency: 'EUR' }, priceStatus: 'stimato', selected: true, notes: '', keptIssues: ['data'], verification: { state: 'da_verificare' } }],
    accommodations: [{ id: 'h1', name: 'Hytte', type: 'hytte', locality: 'Oslo', lat: 59.9, lng: 10.7, url: 'https://example.invalid/h', pricePerNight: { amount: 1500, currency: 'NOK' }, priceStatus: 'da_verificare', cleaningFee: { amount: 500, currency: 'NOK' }, capacity: 4, beds: '2 letti', bathroom: 'privato', kitchen: 'si', parking: 'non_noto', cancellation: '', status: 'opzionata', stopId: 'a', notes: '', address: 'Via 1', phone: '+47' }],
    budgetItems: [{ id: 'b1', category: 'pasti', label: 'Spesa', amount: { amount: 100, currency: 'EUR' }, status: 'stimato', notes: '', source: { label: 'stima' } }],
    favorites: ['oslo', 'fram'],
    usefulInfo: 'Numero utile 112',
    actuals: { stops: { a: { state: 'visitata', at: '2027-08-02T10:00:00Z' } }, activities: { act1: { state: 'fatta', at: '2027-08-02T12:00:00Z' } } },
    diary: [
      { id: 'd1', createdAt: '2027-08-01T20:00:00Z', updatedAt: '2027-08-01T20:05:00Z', localDate: '2027-08-01', localTime: '22:00', tzOffsetMin: -120, text: 'Arrivati', dayDate: '2027-08-01', stopId: 'a', stopName: 'Oslo', attachments: [{ id: 'att1', name: 'foto.jpg', type: 'image/jpeg', size: 12345, state: 'nel_cloud', storagePath: 'u/t/att1', uploadedAt: '2027-08-01T20:10:00.000Z' }, { id: 'att2', name: 'b.pdf', type: 'application/pdf', size: 10, state: 'errore', error: 'pieno' }] },
      // Copia «-cloud» di una voce unita: stessi allegati (stesso id) della voce originale
      { id: 'd1-cloud', createdAt: '2027-08-01T20:00:00Z', updatedAt: '2027-08-01T20:06:00Z', localDate: '2027-08-01', localTime: '22:00', tzOffsetMin: -120, text: 'Arrivati\n(versione dell\'altro dispositivo)', attachments: [{ id: 'att1', name: 'foto.jpg', type: 'image/jpeg', size: 12345, state: 'solo_dispositivo' }] },
      { id: 'd2', createdAt: '2027-08-02T20:00:00Z', updatedAt: '2027-08-02T20:00:00Z', localDate: '2027-08-02', localTime: '22:00', tzOffsetMin: -120, text: 'tolta', deletedAt: '2027-08-03T08:00:00Z' },
    ],
    planLog: [{ id: 'p1', at: '2026-11-01T10:00:00Z', label: 'Proposta', from: 'x', to: 'y' }],
    settings: {
      ...base.settings,
      nokPerEur: 11.2,
      nokRateNote: 'Norges Bank',
      nokRateDate: '2026-11-01',
      nokRateAuto: false,
      budgetCap: 9000,
      budgetCapByCategory: { pasti: 1500 },
      estimates: { foodPerDay: 90 },
      car: { fuel: 'diesel', consumption: 6.5, priceNok: 21.3, priceAuto: true, pricePeriod: '2026M09', priceSource: 'SSB' },
      homeAirports: ['BRI', 'FCO'],
      impostazioneFutura: 'x',
    } as Trip['settings'],
    countries: [{ code: 'NO', releaseId: 'NO-1', fuel: { price: 21.3, currency: 'NOK', auto: true, period: '2026M09', source: 'SSB' } }, { code: 'XT', releaseId: 'XT-1' }],
    rates: { XTS: { perEur: 2, date: '2026-11-01', note: 'a mano', auto: false } },
    updatedAt: '2026-11-06T10:00:00.000Z',
  };
  const withScenario = addScenario(t, 'Variante', 'misto_treni', 'copia');
  const legacyScenario = { id: 'vecchio', name: 'Vecchio', kind: 'altro' as const, notes: '', updatedAt: '', plan: { startDate: '2027-08-02', stops: [stop('z', 'Z', 1)], legs: [], days: {}, budgetItems: [], coastalSelected: [] } };
  return { ...withScenario, scenarios: [...withScenario.scenarios!, legacyScenario], campoFuturoViaggio: { v: 1 } } as Trip;
}

