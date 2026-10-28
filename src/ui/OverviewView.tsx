import { useMemo, useState, type ReactNode } from 'react';
import { formatEur } from '../domain/budget';
import { formatDateIt } from '../domain/itinerary';
import { tripOverview, type NextAction, type StepState } from '../domain/overview';
import type { AccommodationStatus } from '../domain/types';
import { useTrip } from '../state/store';
import { Badge } from './common';

const STEP_ICON: Record<StepState, string> = { fatto: '✓', in_corso: '◐', da_fare: '○' };
const STEP_TEXT: Record<StepState, string> = { fatto: 'Fatto', in_corso: 'In corso', da_fare: 'Da fare' };
const PRIORITY_TEXT: Record<NextAction['priority'], string> = { alta: 'Priorità alta', media: 'Da sistemare', bassa: 'Rifinitura' };
const ACC_TEXT: Record<AccommodationStatus, string> = { individuata: 'Individuata', disponibile: 'Disponibile', opzionata: 'Opzionata', prenotata: 'Prenotata' };

function fmtLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y ?? 2027, (m ?? 1) - 1, d ?? 1)).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Lista con al massimo `max` righe visibili e un pulsante per vedere le altre. */
function Clipped<T>({ items, max = 4, render }: { items: T[]; max?: number; render: (t: T, i: number) => ReactNode }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, max);
  return (
    <>
      <ul className="ov-list">{shown.map(render)}</ul>
      {items.length > max && (
        <button className="link-btn small" onClick={() => setAll((v) => !v)} aria-expanded={all}>
          {all ? 'Mostra meno' : `Mostra tutte (${items.length})`}
        </button>
      )}
    </>
  );
}

export function OverviewView() {
  const { trip } = useTrip();
  const o = useMemo(() => tripOverview(trip), [trip]);
  const done = o.steps.filter((s) => s.state === 'fatto').length;
  const family = `${trip.participants.adults} adulti, ${trip.participants.childrenAges.length} bambini${trip.participants.childrenAges.length ? ` (${trip.participants.childrenAges.join(' e ')} anni)` : ''}`;

  return (
    <div className="overview">
      <section className="ov-hero" aria-labelledby="ov-title">
        <div>
          <p className="ov-eyebrow">Panoramica</p>
          <h2 id="ov-title">{trip.title || 'Norvegia 2027'}</h2>
          <p className="ov-period">
            {o.period ? (
              <>
                {fmtLongDate(o.period.start)} → {fmtLongDate(o.period.end)}{' '}
                {o.period.tentative && <span className="ov-tag">date provvisorie</span>}
              </>
            ) : (
              'Periodo da definire: l\'itinerario è ancora vuoto'
            )}
          </p>
          <p className="ov-sub">{family}</p>
        </div>
        <dl className="ov-facts">
          <div>
            <dt>Giorni</dt>
            <dd>{o.days || '—'}</dd>
          </div>
          <div>
            <dt>Notti assegnate</dt>
            <dd>{o.nights || '—'}</dd>
          </div>
          <div>
            <dt>Tappe con pernottamento</dt>
            <dd>{o.sleepStops || '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="panel" aria-labelledby="ov-steps">
        <header className="panel-head">
          <h2 id="ov-steps">A che punto siamo</h2>
          <span className="muted small">
            {done} di {o.steps.length} passaggi completati
          </span>
        </header>
        <ol className="ov-steps">
          {o.steps.map((s) => (
            <li key={s.id} className={`ov-step step-${s.state}`}>
              <a href={s.href}>
                <span className="ov-step-icon" aria-hidden>
                  {STEP_ICON[s.state]}
                </span>
                <span className="ov-step-body">
                  <strong>{s.label}</strong>
                  <span className="small">
                    <span className="sr-only">{STEP_TEXT[s.state]}: </span>
                    {s.detail}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      <div className="ov-grid">
        <section className="panel ov-actions" aria-labelledby="ov-next">
          <h2 id="ov-next">Prossime azioni</h2>
          {o.actions.length === 0 ? (
            <p className="muted">Nessuna azione urgente: i controlli automatici non segnalano problemi.</p>
          ) : (
            <Clipped
              items={o.actions}
              max={5}
              render={(a) => (
                <li key={a.id} className={`ov-action prio-${a.priority}`}>
                  <div>
                    <span className="ov-prio">{PRIORITY_TEXT[a.priority]}</span>
                    <p>{a.text}</p>
                  </div>
                  <a className="btn btn-small" href={a.href}>
                    {a.cta}
                  </a>
                </li>
              )}
            />
          )}
        </section>

        <section className="panel" aria-labelledby="ov-budget">
          <header className="panel-head">
            <h2 id="ov-budget">Budget</h2>
            <a href="#/budget" className="small">
              Dettaglio
            </a>
          </header>
          {o.budget.total === 0 && o.budget.missingPrices.length === 0 ? (
            <p className="muted">Da definire: nessuna voce di spesa e nessuna stima impostata.</p>
          ) : (
            <>
              <p className="ov-total">
                <strong>{formatEur(o.budget.total)}</strong>
                <span className="muted small">{o.budget.perDay !== undefined ? ` · ${formatEur(o.budget.perDay)} al giorno` : ''}</span>
              </p>
              <dl className="ov-split">
                <div>
                  <dt>
                    <Badge tone="ok">Certo</Badge>
                  </dt>
                  <dd>{formatEur(o.budget.firm)}</dd>
                </div>
                <div>
                  <dt>
                    <Badge tone="info">Stimato</Badge>
                  </dt>
                  <dd>{formatEur(o.budget.estimated)}</dd>
                </div>
                <div>
                  <dt>
                    <Badge tone="warn">Da verificare</Badge>
                  </dt>
                  <dd>{formatEur(o.budget.toVerify)}</dd>
                </div>
              </dl>
              {o.budget.total > 0 && <SplitBar firm={o.budget.firm} est={o.budget.estimated} ver={o.budget.toVerify} />}
              <p className="muted small">«Certo» = confermato da fonte, prenotato o pagato.</p>
            </>
          )}
          {o.budget.missingPrices.length > 0 && (
            <div className="ov-missing">
              <h3 className="small">Costi non ancora quantificati (esclusi dal totale)</h3>
              <Clipped items={o.budget.missingPrices} max={3} render={(m) => <li key={m}>{m}</li>} />
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="ov-legs">
          <header className="panel-head">
            <h2 id="ov-legs">Trasferimenti</h2>
            <a href="#/itinerario" className="small">
              Itinerario
            </a>
          </header>
          {o.uncalculatedLegs.length + o.shipLegsMissing.length === 0 ? (
            <p className="muted">{trip.legs.length === 0 ? 'Nessun tratto: aggiungi almeno due tappe.' : 'Tutti i tratti hanno un percorso o un mezzo inserito.'}</p>
          ) : (
            <Clipped
              items={[...o.uncalculatedLegs.map((l) => ({ ...l, ship: false })), ...o.shipLegsMissing.map((l) => ({ ...l, ship: true }))]}
              render={(l) => (
                <li key={l.legId}>
                  <span>
                    {l.from} → {l.to}
                  </span>{' '}
                  <Badge tone="warn">{l.ship ? 'nave da collegare' : 'non calcolato'}</Badge>
                </li>
              )}
            />
          )}
        </section>

        <section className="panel" aria-labelledby="ov-verify">
          <h2 id="ov-verify">Da verificare</h2>
          {o.unverifiedCrossings.length === 0 ? (
            <p className="muted">Nessun traghetto o nave con orario da confermare.</p>
          ) : (
            <Clipped
              items={o.unverifiedCrossings}
              render={(c, i) => (
                <li key={`${c.legId}-${i}`}>
                  <span>
                    {c.label} <span className="muted small">({c.from} → {c.to})</span>
                  </span>{' '}
                  <Badge tone="warn">{c.departureTime ? `ore ${c.departureTime} da confermare` : 'orario da verificare'}</Badge>
                </li>
              )}
            />
          )}
        </section>

        <section className="panel" aria-labelledby="ov-lodging">
          <header className="panel-head">
            <h2 id="ov-lodging">Alloggi</h2>
            <a href="#/hytte" className="small">
              Cerca e confronta
            </a>
          </header>
          {o.lodging.length === 0 ? (
            <p className="muted">Nessuna tappa con pernottamento.</p>
          ) : (
            <Clipped
              items={o.lodging}
              max={6}
              render={(l) => (
                <li key={l.stopId} className="ov-lodging-row">
                  <span>
                    <strong>{l.stopName}</strong> <span className="muted small">· {l.nights} {l.nights === 1 ? 'notte' : 'notti'}</span>
                    {l.accommodation && <span className="muted small block">{l.accommodation}{!l.hasPrice && ' · prezzo mancante'}</span>}
                  </span>
                  {l.status ? <Badge tone={l.status === 'prenotata' ? 'ok' : 'info'}>{ACC_TEXT[l.status]}</Badge> : <Badge tone="warn">Da scegliere</Badge>}
                </li>
              )}
            />
          )}
        </section>

        <section className="panel" aria-labelledby="ov-days">
          <header className="panel-head">
            <h2 id="ov-days">Giornate impegnative</h2>
            <a href="#/giornate" className="small">
              Giornate
            </a>
          </header>
          {o.days === 0 ? (
            <p className="muted">Le giornate si generano dalle notti delle tappe.</p>
          ) : o.heavyDays.length === 0 ? (
            <p className="muted">Nessuna giornata piena o troppo carica secondo le ipotesi attuali.</p>
          ) : (
            <Clipped
              items={o.heavyDays}
              render={(h) => (
                <li key={h.key}>
                  <span>
                    <strong>Giorno {h.index + 1}</strong> <span className="muted small">{formatDateIt(h.date)}{h.place ? ` · ${h.place}` : ''}</span>
                  </span>{' '}
                  <Badge tone="warn">
                    {h.level === 'eccessiva' ? 'Troppo carica' : 'Piena'} · {Math.round(h.ratio * 100)}%{h.incomplete ? ' (incompleta)' : ''}
                  </Badge>
                </li>
              )}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function SplitBar({ firm, est, ver }: { firm: number; est: number; ver: number }) {
  const tot = firm + est + ver;
  if (tot <= 0) return null;
  const pct = (v: number) => `${(v / tot) * 100}%`;
  return (
    <div className="ov-bar" aria-hidden>
      <span className="seg-firm" style={{ width: pct(firm) }} />
      <span className="seg-est" style={{ width: pct(est) }} />
      <span className="seg-ver" style={{ width: pct(ver) }} />
    </div>
  );
}
