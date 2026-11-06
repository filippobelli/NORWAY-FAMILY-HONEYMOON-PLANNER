import { useMemo } from 'react';
import { nextStep } from '../domain/overview';
import { placeOf } from '../state/route';
import { useTrip } from '../state/store';
import { Icon } from './icons';

const TIER_TEXT = { 1: 'Trasferimenti', 2: 'Da confermare prima di partire', 3: 'Prenotazione mancante', 4: 'Rifinitura' } as const;

/**
 * Prossimo passo del viaggio. Unica fonte: la stessa condizione dà lo stesso testo e la stessa destinazione
 * in Panoramica, Itinerario e Prenotazioni.
 */
export function NextStepCard({ compact, lead }: { compact?: boolean; lead?: string }) {
  const { trip } = useTrip();
  const { main, then } = useMemo(() => nextStep(trip), [trip]);
  if (!main) {
    return (
      <section className={`next-step is-ok ${compact ? 'is-compact' : ''}`} aria-label="Prossimo passo">
        <div>
          <p className="next-step-kicker">
            <Icon name="check" /> Nessuna azione urgente
          </p>
          <p>I controlli automatici non segnalano nulla da sistemare. Facoltativo: prepara il pacchetto offline e il calendario per il viaggio.</p>
        </div>
        <a className="btn" href="#/impostazioni?sezione=esporta">
          Prepara le esportazioni
        </a>
      </section>
    );
  }
  return (
    <section className={`next-step tier-${main.tier} ${compact ? 'is-compact' : ''}`} aria-label="Prossimo passo">
      <div>
        <p className="next-step-kicker">
          {lead ?? 'Prossimo passo'} · {TIER_TEXT[main.tier]}
        </p>
        <p className="next-step-text">{main.text}</p>
        <p className="small next-step-why">
          <strong>Perché adesso:</strong> {main.why}
          {then && <> Poi: {then}.</>}
        </p>
        {!compact && <p className="small next-step-where">Si apre in: {placeOf(main.href)}</p>}
      </div>
      <span className="row wrap">
        <a className="btn btn-primary" href={main.href}>
          {main.cta}
        </a>
        {main.secondary && (
          <a className="btn btn-ghost" href={main.secondary.href}>
            {main.secondary.cta}
          </a>
        )}
      </span>
    </section>
  );
}
