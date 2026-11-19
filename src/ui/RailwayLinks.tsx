import { placeCountry } from '../catalog/registry';
import { RAIL_PLANNERS } from '../data/railPlanners';
import { formatDateIt } from '../domain/itinerary';
import type { Destination } from '../domain/types';

/** La ricerca esterna è distinta da una tratta pianificata o da un biglietto prenotato. */
export function RailwayLinks({ dest }: { dest: Destination }) {
  if (!dest.transportPoint || dest.category !== 'treni') return null;
  const code = placeCountry(dest.id);
  const source = code ? RAIL_PLANNERS[code] : undefined;
  if (!source) return null;
  return (
    <p className="small">
      <a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>
      <br />{source.checkedAt ? `Fonte nazionale consultata il ${formatDateIt(source.checkedAt)}.` : 'Fonte nazionale: raggiungibilità da verificare.'} Richiede rete. Verifica la tratta e la data: nessun biglietto è incluso.
    </p>
  );
}
