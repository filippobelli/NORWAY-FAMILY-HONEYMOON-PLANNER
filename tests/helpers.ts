import { mergeRouted } from '../src/domain/routeMerge';
import type { Leg } from '../src/domain/types';
export { stepsToSegments } from '../src/services/routing/osrm';

export function mergeRoutedForTest(): Leg {
  const leg: Leg = {
    id: 'l',
    fromStopId: 'a',
    toStopId: 'b',
    segments: [
      { id: '1', mode: 'strada', label: 'Percorso stradale', durationMin: 60, status: 'stimato', costStatus: 'da_verificare', source: { label: 'OSRM vecchio' } },
      {
        id: '2',
        mode: 'traghetto',
        label: 'Traghetto X',
        durationMin: 20,
        departureTime: '10:30',
        status: 'stimato',
        costStatus: 'da_verificare',
        source: { label: 'OSRM vecchio' },
      },
      { id: '3', mode: 'treno', label: 'Treno manuale', status: 'da_verificare', costStatus: 'da_verificare' },
    ],
  };
  return mergeRouted(leg, [
    { id: 'n1', mode: 'strada', label: 'Percorso stradale', durationMin: 65, status: 'stimato', costStatus: 'da_verificare', source: { label: 'OSRM nuovo' } },
    { id: 'n2', mode: 'traghetto', label: 'Traghetto X', durationMin: 22, status: 'stimato', costStatus: 'da_verificare', source: { label: 'OSRM nuovo' } },
  ]);
}
