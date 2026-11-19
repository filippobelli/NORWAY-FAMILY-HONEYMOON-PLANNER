import { googleDirectionsUrl, googleModeForLeg } from '../domain/googleMaps';
import { formatDuration, isRoutableLeg, transferBreakdown } from '../domain/itinerary';
import type { Leg, Trip } from '../domain/types';
import { STATUS_LABEL } from '../domain/budget';
import { ModeIcon } from './common';
import { Icon } from './icons';

// Riepilogo di un trasferimento da usare sul posto (mappa, Oggi): guida, traversata, attesa, totale previsto e
// il collegamento a Google Maps. I tempi sono quelli del planner (OSRM e dati inseriti): Google Maps ricalcola il
// percorso dai due punti del link e può scegliere una traversata diversa da quella pianificata.

export function TransferSummary({ trip, leg, onOpen, heading }: { trip: Trip; leg: Leg; /** Apre il dettaglio completo del trasferimento */ onOpen?: () => void; heading?: boolean }) {
  const from = trip.stops.find((s) => s.id === leg.fromStopId);
  const to = trip.stops.find((s) => s.id === leg.toStopId);
  const b = transferBreakdown(leg, trip.settings);
  const routable = isRoutableLeg(leg, trip.stops);
  const calculated = Boolean(leg.calculatedAt);
  return (
    <div className="transfer-summary">
      {heading !== false && (
        <p className="transfer-title">
          {leg.segments.map((s) => (
            <ModeIcon key={s.id} mode={s.mode} />
          ))}{' '}
          <strong>
            {from?.name ?? '—'} → {to?.name ?? '—'}
          </strong>
        </p>
      )}
      {b.state === 'non_calcolato' ? (
        <p className="small muted">Non calcolato: tempi non disponibili. Il tempo mancante non vale zero.</p>
      ) : (
        <dl className="transfer-facts">
          {b.driveMin > 0 && (
            <div>
              <dt>Guida</dt>
              <dd>
                {formatDuration(b.driveMin)}
                {b.roadKm > 0 && ` · ${b.roadKm.toLocaleString('it-IT')} km`}
                <span className="small muted block">{calculated ? 'calcolato (OSRM), stima' : 'inserito a mano'}</span>
              </dd>
            </div>
          )}
          {b.crossings.length > 0 && (
            <div>
              <dt>Traversata e altri mezzi</dt>
              <dd>
                {b.crossingMin > 0 ? formatDuration(b.crossingMin) : 'durata da inserire'}
                <span className="small muted block">{b.unverifiedCrossings > 0 ? 'orari da verificare' : 'orari confermati'}</span>
              </dd>
            </div>
          )}
          {b.waitMin > 0 && (
            <div>
              <dt>Attesa e imbarco</dt>
              <dd>
                {formatDuration(b.waitMin)}
                <span className="small muted block">{b.waitAssumed ? 'ipotesi delle impostazioni' : 'inserita'}</span>
              </dd>
            </div>
          )}
          {b.breakMin > 0 && (
            <div>
              <dt>Soste</dt>
              <dd>
                {formatDuration(b.breakMin)}
                <span className="small muted block">ipotizzate</span>
              </dd>
            </div>
          )}
          <div className="transfer-total">
            <dt>Totale previsto</dt>
            <dd>
              {b.state === 'parziale' ? `almeno ${formatDuration(b.totalMin)}` : formatDuration(b.totalMin)}
              <span className="small muted block">{b.state === 'parziale' ? 'manca la durata di un tratto' : 'con soste e attese'}</span>
            </dd>
          </div>
        </dl>
      )}
      {b.crossings.length > 0 && (
        <ul className="transfer-crossings small">
          {b.crossings.map((c) => (
            <li key={c.id}>
              <ModeIcon mode={c.mode} /> <strong>{c.label}</strong>
              {c.note && ` · ${c.note}`} · {c.departureTime ? `partenza ${c.departureTime}` : 'orario non inserito'} · {STATUS_LABEL[c.status]}
              {c.source && (
                <>
                  {' · fonte: '}
                  {c.source.url ? (
                    <a href={c.source.url} target="_blank" rel="noreferrer">
                      {c.source.label} ↗
                    </a>
                  ) : (
                    c.source.label
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="row wrap transfer-actions">
        {routable && from && to && (
          <a className="btn btn-small" href={googleDirectionsUrl(from, to, googleModeForLeg(leg))} target="_blank" rel="noreferrer" title="Apre Google Maps in una nuova scheda, con partenza e arrivo già impostati">
            <Icon name="map" /> Apri in Google Maps ↗
          </a>
        )}
        {onOpen && (
          <button type="button" className="btn btn-small" onClick={onOpen}>
            Apri il dettaglio
          </button>
        )}
      </div>
      {routable && b.crossings.length > 0 && <p className="small muted">Google Maps ricalcola il percorso da solo: può scegliere una traversata diversa da quella pianificata qui.</p>}
    </div>
  );
}
