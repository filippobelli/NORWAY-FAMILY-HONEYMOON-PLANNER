import { useEffect, useMemo, useRef, useState } from 'react';
import { ensureScenarios, scenarioMetrics, tripForScenario } from '../domain/scenarios';
import type { Scenario } from '../domain/types';
import { useTrip } from '../state/store';
import { Badge } from './common';
import { Icon } from './icons';
import { ApplyVersionDialog, PlanBDialog } from './PlanBDialog';

/** Controllo unico per le alternative: mostra la versione attiva e porta a confronto, applicazione e piano B. */
export function VersionsControl() {
  const { trip } = useTrip();
  const t = useMemo(() => ensureScenarios(trip), [trip]);
  const rows = useMemo(() => t.scenarios!.map((s) => ({ s, m: scenarioMetrics(tripForScenario(t, s.id)) })), [t]);
  const active = t.scenarios!.find((s) => s.id === t.activeScenarioId);
  const [applying, setApplying] = useState<Scenario | null>(null);
  const [planB, setPlanB] = useState(false);
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = (e: Event) => {
      const d = ref.current;
      if (!d?.open) return;
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !d.contains(e.target as Node)) d.open = false;
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, []);
  const closeMenu = () => {
    if (ref.current) ref.current.open = false;
  };

  return (
    <>
      {applying && <ApplyVersionDialog scenario={applying} onClose={() => setApplying(null)} />}
      {planB && <PlanBDialog onClose={() => setPlanB(false)} />}
      <details className="versions" ref={ref}>
        <summary>
          <Icon name="scale" />
          <span className="versions-label">
            <span className="small muted">Versione attiva</span>
            <strong>{active?.name ?? 'Scenario principale'}</strong>
          </span>
          <span aria-hidden className="versions-caret">
            ▾
          </span>
        </summary>
        <div className="versions-menu">
          <h3>Versioni del percorso</h3>
          <ul>
            {rows.map(({ s, m }) => {
              const on = s.id === t.activeScenarioId;
              return (
                <li key={s.id}>
                  <span>
                    <strong>{s.name}</strong>
                    <span className="small muted block">{m.days > 0 ? `${m.days} giorni · ${m.stops} tappe` : 'Vuota'}</span>
                  </span>
                  {on ? (
                    <Badge tone="ok">Attiva</Badge>
                  ) : (
                    <button
                      className="btn btn-small"
                      onClick={() => {
                        closeMenu();
                        setApplying(s);
                      }}
                    >
                      Vedi cosa cambia
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="versions-actions">
            {trip.stops.length > 0 && (
              <button
                className="btn btn-small"
                onClick={() => {
                  closeMenu();
                  setPlanB(true);
                }}
              >
                Prepara un piano B
              </button>
            )}
            <a className="btn btn-small" href="#/scenari" onClick={closeMenu}>
              Confronta tutte
            </a>
          </div>
        </div>
      </details>
    </>
  );
}
