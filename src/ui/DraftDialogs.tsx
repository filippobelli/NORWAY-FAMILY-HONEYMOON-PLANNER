import { useEffect, useMemo, useRef, useState } from 'react';
import { restorePlanOnly } from '../domain/actuals';
import { breakCandidates, canTakeNight, dayOfLeg, draftBreak, newLegs, type NightsFrom } from '../domain/breakLeg';
import { applySuggestion, type Suggestion } from '../domain/dayLoad';
import { dayTransfer, DAY_STATE_LABEL, legTiming, missingText, TIMING_LABEL } from '../domain/dayTransfer';
import { formatDuration, isRoutableLeg } from '../domain/itinerary';
import { planImpact } from '../domain/planImpact';
import { mergeRouted } from '../domain/routeMerge';
import type { Trip } from '../domain/types';
import { getRoutingProvider } from '../services/routing';
import { useTrip } from '../state/store';
import { Badge } from './common';
import { Modal } from './PlacementDialog';
import { BookingConfirm, ImpactView } from './PlanBDialog';

/** Conferma di una proposta di alleggerimento: prima l'impatto, poi l'applicazione esplicita (annullabile). */
export function SuggestionDialog({ suggestion, onClose }: { suggestion: Suggestion; onClose: () => void }) {
  const { trip, update, toast } = useTrip();
  const draft = useMemo(() => (suggestion.action ? applySuggestion(trip, suggestion.action) : trip), [trip, suggestion]);
  const impact = useMemo(() => planImpact(trip, draft), [trip, draft]);
  const [ok, setOk] = useState(false);
  return (
    <Modal title="Applica la proposta" onClose={onClose}>
      <p className="small">{suggestion.text}</p>
      <p className="muted small">È una bozza: il viaggio non cambia finché non scegli «Applica».</p>
      <ImpactView i={impact} />
      <BookingConfirm i={impact} ok={ok} setOk={setOk} />
      <div className="row wrap place-actions">
        <button
          className="btn btn-primary"
          disabled={impact.needsBookingConfirm && !ok}
          onClick={() => {
            const before = trip;
            update(() => draft);
            toast('Proposta applicata', 'ok', { label: 'Annulla', run: () => update((cur) => restorePlanOnly(cur, before)) });
            onClose();
          }}
        >
          Applica
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Non ora
        </button>
      </div>
    </Modal>
  );
}

/** Esplora tappe intermedie per un trasferimento lungo o non verificabile. Tutto resta una bozza fino alla conferma. */
export function BreakLegDialog({ legId, onClose }: { legId: string; onClose: () => void }) {
  const { trip, update, toast } = useTrip();
  const options = useMemo(() => breakCandidates(trip, legId), [trip, legId]);
  const [pick, setPick] = useState<string | undefined>(options.candidates[0]?.destinationId);
  const [nights, setNights] = useState<NightsFrom>(canTakeNight(trip, legId) ? 'dalla_destinazione' : 'aggiungi');
  const base = useMemo(() => (pick ? draftBreak(trip, legId, pick, nights) : undefined), [trip, legId, pick, nights]);
  const [draft, setDraft] = useState<Trip | undefined>(base);
  const [calc, setCalc] = useState<{ running: boolean; error?: string }>({ running: false });
  const [ok, setOk] = useState(false);
  const leg = trip.legs.find((l) => l.id === legId);
  const day = dayOfLeg(trip, legId);
  const before = day ? dayTransfer(trip, day) : undefined;
  const ac = useRef<AbortController | null>(null);

  // Ogni bozza nuova: si calcolano davvero i due tratti nuovi (servizio di percorsi), senza toccare il viaggio
  useEffect(() => {
    setDraft(base);
    setOk(false);
    if (!base) return;
    ac.current?.abort();
    const c = new AbortController();
    ac.current = c;
    const todo = newLegs(trip, base).filter((l) => isRoutableLeg(l, base.stops));
    if (todo.length === 0) return;
    setCalc({ running: true });
    void (async () => {
      let next = base;
      let error: string | undefined;
      for (const l of todo) {
        const a = base.stops.find((s) => s.id === l.fromStopId);
        const b = base.stops.find((s) => s.id === l.toStopId);
        if (!a || !b) continue;
        try {
          const r = await getRoutingProvider().route(a, b, c.signal);
          next = { ...next, legs: next.legs.map((x) => (x.id === l.id ? mergeRouted(x, r.segments) : x)) };
        } catch (e) {
          if ((e as Error).name === 'AbortError' || c.signal.aborted) return;
          error = (e as Error).message;
        }
      }
      if (c.signal.aborted) return;
      setDraft(next);
      setCalc({ running: false, error });
    })();
    return () => c.abort();
  }, [base, trip]);

  const impact = useMemo(() => (draft ? planImpact(trip, draft) : undefined), [trip, draft]);
  const fresh = draft ? newLegs(trip, draft).map((l) => legTiming(l, draft)) : [];

  return (
    <Modal title="Spezza il trasferimento" onClose={onClose}>
      {before && leg && (
        <p className="small">
          Giorno {before.dayIndex + 1}: {DAY_STATE_LABEL[before.state].toLowerCase()}
          {before.knownMin > 0 && ` · tempi noti circa ${formatDuration(before.knownMin)} su ${formatDuration(before.limitMin)}`}
          {before.missing.length > 0 && ` · manca: ${missingText(before.missing)}`}.
        </p>
      )}
      {options.candidates.length === 0 ? (
        <p className="note-info small">{options.limit} Il viaggio non è stato modificato.</p>
      ) : (
        <>
          <fieldset className="chips-field">
            <legend>Luoghi del catalogo vicini al tracciato</legend>
            <div className="break-list">
              {options.candidates.map((c) => (
                <label key={c.destinationId} className={`chip ${pick === c.destinationId ? 'on' : ''}`}>
                  <input type="radio" name="break-pick" checked={pick === c.destinationId} onChange={() => setPick(c.destinationId)} /> {c.name}
                  <span className="small muted"> · a circa {c.offRouteKm} km dal percorso</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="chips-field">
            <legend>La notte in più</legend>
            <label className="check small">
              <input type="radio" name="break-nights" checked={nights === 'aggiungi'} onChange={() => setNights('aggiungi')} /> Si aggiunge: il viaggio dura un giorno in più
            </label>
            <label className="check small">
              <input type="radio" name="break-nights" disabled={!canTakeNight(trip, legId)} checked={nights === 'dalla_destinazione'} onChange={() => setNights('dalla_destinazione')} /> Si toglie alla tappa di
              arrivo{!canTakeNight(trip, legId) && ' (non possibile: ha una sola notte)'}
            </label>
          </fieldset>
          <h3>I due tratti nuovi</h3>
          <ul className="small" role="status">
            {fresh.map((f) => (
              <li key={f.legId}>
                {f.from} → {f.to}:{' '}
                {calc.running && f.missing ? (
                  'calcolo in corso…'
                ) : f.missing ? (
                  <>
                    tempo non disponibile ({f.reason}){f.roughMin ? ` · stima di massima in linea d'aria circa ${formatDuration(f.roughMin)}` : ''}
                  </>
                ) : (
                  <>
                    circa {formatDuration(f.knownMin)} <Badge tone={f.kind === 'calcolato' ? 'ok' : 'info'}>{TIMING_LABEL[f.kind]}</Badge>
                  </>
                )}
              </li>
            ))}
          </ul>
          {calc.error && <p className="note-warn small">Percorso non calcolato: {calc.error} I tempi restano da calcolare dopo, nell'itinerario.</p>}
          {impact && <ImpactView i={impact} />}
          {impact && <BookingConfirm i={impact} ok={ok} setOk={setOk} />}
        </>
      )}
      <div className="row wrap place-actions">
        {draft && impact && (
          <button
            className="btn btn-primary"
            disabled={calc.running || (impact.needsBookingConfirm && !ok)}
            onClick={() => {
              const prev = trip;
              update(() => draft);
              toast('Tappa intermedia aggiunta', 'ok', { label: 'Annulla', run: () => update((cur) => restorePlanOnly(cur, prev)) });
              onClose();
            }}
          >
            {calc.running ? 'Calcolo dei tratti…' : 'Aggiungi la tappa intermedia'}
          </button>
        )}
        <button className="btn btn-ghost" onClick={onClose}>
          {options.candidates.length ? 'Non ora' : 'Chiudi'}
        </button>
      </div>
    </Modal>
  );
}
