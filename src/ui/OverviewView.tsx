import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { formatEur } from '../domain/budget';
import { formatDateIt } from '../domain/itinerary';
import { tripOverview, type NextAction, type StepState } from '../domain/overview';
import type { AccommodationStatus } from '../domain/types';
import { buildHash, parseRoute, placeOf } from '../state/route';
import { useTrip } from '../state/store';
import { Badge, Field, NumberInput } from './common';
import { Icon, type IconName } from './icons';

const STEP_ICON: Record<StepState, IconName> = { fatto: 'check', in_corso: 'progress', da_fare: 'circle' };
const STEP_TEXT: Record<StepState, string> = { fatto: 'Fatto', in_corso: 'In corso', da_fare: 'Da fare' };
const PRIORITY_TEXT: Record<NextAction['priority'], string> = { alta: 'Priorità alta', media: 'Da sistemare', bassa: 'Rifinitura' };
const ACC_TEXT: Record<AccommodationStatus, string> = {
  individuata: 'Individuata',
  disponibile: 'Disponibile',
  opzionata: 'Opzionata',
  prenotata: 'Prenotata',
};

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
  const { trip, update } = useTrip();
  const o = useMemo(() => tripOverview(trip), [trip]);
  const done = o.steps.filter((s) => s.state === 'fatto').length;
  const [top, ...rest] = o.actions;
  const budgetPartial = o.budget.missingPrices.length > 0 || o.budget.emptyCategories > 0;
  const empty = trip.stops.length === 0;
  const activeVersion = (trip.scenarios?.length ?? 0) > 1 ? trip.scenarios?.find((s) => s.id === trip.activeScenarioId)?.name : undefined;
  // Date e partecipanti: chiusi per non competere con il prossimo passo; si aprono da «Modifica» o da un'azione sulle date
  const [formOpen, setFormOpen] = useState(false);
  const formRef = useRef<HTMLDetailsElement>(null);
  const openForm = () => {
    setFormOpen(true);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      formRef.current?.querySelector<HTMLInputElement>('input[type="date"]')?.focus();
    });
  };
  useEffect(() => {
    const follow = () => {
      const r = parseRoute(window.location.hash);
      if (r.view === 'panoramica' && r.params.sezione === 'date') {
        window.history.replaceState(null, '', buildHash('panoramica'));
        openForm();
      }
    };
    follow();
    window.addEventListener('hashchange', follow);
    return () => window.removeEventListener('hashchange', follow);
  }, []);
  const family = `${trip.participants.adults} adulti, ${trip.participants.childrenAges.length} bambini${trip.participants.childrenAges.length ? ` (${trip.participants.childrenAges.join(' e ')} anni)` : ''}`;

  return (
    <div className="overview">
      <section className="ov-hero" aria-labelledby="ov-title">
        <div>
          <p className="ov-eyebrow">Il viaggio</p>
          <h2 id="ov-title">{trip.title || 'Norvegia 2027'}</h2>
          {o.period ? (
            <p className={`ov-period ${o.period.tentative ? 'is-tentative' : 'is-confirmed'}`}>
              <span className="ov-period-kind">{o.period.tentative ? 'Periodo ipotizzato' : '✓ Date confermate'}</span>
              <span>
                {fmtLongDate(o.period.start)} → {fmtLongDate(o.period.end)}
              </span>
              {o.period.tentative && <span className="ov-period-note">La partenza non è decisa: le date seguono il 1° giorno impostato.</span>}
            </p>
          ) : (
            <p className="ov-period">Periodo da definire: l'itinerario è ancora vuoto</p>
          )}
          <p className="ov-sub">
            {family}
            {activeVersion && (
              <>
                {' · '}versione attiva: <a href="#/scenari">{activeVersion}</a>
              </>
            )}
            {' · '}
            <button type="button" className="link-btn" onClick={openForm}>
              Modifica date e partecipanti
            </button>
          </p>
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

      {empty ? (
        <section className="ov-start" aria-labelledby="ov-start-title">
          <h2 id="ov-start-title">Da dove vuoi cominciare?</h2>
          <div className="ov-start-grid">
            <article className="ov-start-card is-recommended">
              <p className="ov-eyebrow">Consigliato</p>
              <h3>Fatti proporre un percorso</h3>
              <p>Scegli giorni, aeroporti, ritmo e regioni: l'app prepara una proposta che controlli e modifichi prima di attivarla.</p>
              <a className="btn btn-primary" href="#/configuratore">
                Crea una proposta automatica
              </a>
            </article>
            <article className="ov-start-card">
              <p className="ov-eyebrow">In alternativa</p>
              <h3>Costruiscilo tu, tappa per tappa</h3>
              <p>Se sai già dove vuoi andare, aggiungi le località dal catalogo o dalla mappa nell'ordine che preferisci.</p>
              <a className="btn" href="#/pianifica">
                Aggiungi le tappe a mano
              </a>
            </article>
          </div>
        </section>
      ) : (
        top && (
          <section className={`ov-next prio-${top.priority}`} aria-labelledby="ov-next-title">
            <div>
              <h2 id="ov-next-title" className="ov-prio">
                Prossimo passo · {PRIORITY_TEXT[top.priority]}
              </h2>
              <p>{top.text}</p>
              <p className="small ov-where">Si apre in: {placeOf(top.href)}</p>
            </div>
            <span className="row wrap">
              <a className="btn btn-primary" href={top.href}>
                {top.cta}
              </a>
              {top.secondary && (
                <a className="btn btn-ghost" href={top.secondary.href}>
                  {top.secondary.cta}
                </a>
              )}
            </span>
          </section>
        )
      )}

      <details className="panel ov-trip-form" ref={formRef} open={formOpen} onToggle={(e) => setFormOpen(e.currentTarget.open)}>
        <summary>Date e partecipanti{trip.dateTentative ? ' · date provvisorie' : ' · date decise'}</summary>
        <div className="grid-4">
          <Field label="Titolo">{(id) => <input id={id} value={trip.title} onChange={(e) => update((t) => ({ ...t, title: e.target.value }))} />}</Field>
          <Field label="Data di partenza" hint={trip.dateTentative ? 'Provvisoria' : 'Confermata'}>
            {(id) => (
              <input
                id={id}
                type="date"
                value={trip.startDate}
                min="2027-07-01"
                max="2027-09-30"
                onChange={(e) => e.target.value && update((t) => ({ ...t, startDate: e.target.value }))}
              />
            )}
          </Field>
          <Field label="Date">
            {(id) => (
              <select id={id} value={trip.dateTentative ? 'p' : 'c'} onChange={(e) => update((t) => ({ ...t, dateTentative: e.target.value === 'p' }))}>
                <option value="p">Provvisorie</option>
                <option value="c">Decise</option>
              </select>
            )}
          </Field>
          <Field label="Adulti">
            {(id) => (
              <NumberInput id={id} value={trip.participants.adults} min={1} onChange={(v) => v && update((t) => ({ ...t, participants: { ...t.participants, adults: v } }))} />
            )}
          </Field>
          <Field label="Età bambini (ad agosto 2027)" hint="Separate da virgola">
            {(id) => (
              <input
                id={id}
                defaultValue={trip.participants.childrenAges.join(', ')}
                onBlur={(e) => {
                  const ages = e.target.value
                    .split(',')
                    .map((x: string) => Number(x.trim()))
                    .filter((x: number) => Number.isFinite(x) && x >= 0 && x < 18);
                  update((t) => ({ ...t, participants: { ...t.participants, childrenAges: ages } }));
                }}
              />
            )}
          </Field>
        </div>
      </details>

      {!empty && (
      <section className="panel" aria-labelledby="ov-steps">
        <header className="panel-head">
          <h2 id="ov-steps">Decisioni del viaggio</h2>
          <span className="muted small">
            {done} di {o.steps.length} completate · ordine consigliato, puoi procedere come preferisci
          </span>
        </header>
        <ol className="ov-steps">
          {o.steps.map((s, i) => (
            <li key={s.id} className={`ov-step step-${s.state}`}>
              <a href={s.href}>
                <span className="ov-step-icon" aria-hidden>
                  <Icon name={STEP_ICON[s.state]} />
                </span>
                <span className="ov-step-body">
                  <strong>
                    <span className="ov-step-n">{i + 1}.</span> {s.label}
                  </strong>
                  <span className="small">
                    {STEP_TEXT[s.state]} · {s.detail}
                  </span>
                  {s.waitsFor.length > 0 && <span className="ov-step-dep small">Dipende da: {s.waitsFor.join(', ')}</span>}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>
      )}

      {!empty && (
      <details className="ov-more">
        <summary>Altre azioni e dettagli: alloggi, giornate, budget, trasferimenti</summary>
      <div className="ov-grid">
        <div className="ov-col">
          <section className="panel ov-actions" aria-labelledby="ov-more">
            <h2 id="ov-more">Altre azioni</h2>
            {rest.length === 0 ? (
              <p className="muted">{top ? "Nessun'altra azione segnalata." : 'Nessuna azione urgente: i controlli automatici non segnalano problemi.'}</p>
            ) : (
              <Clipped
                items={rest}
                max={5}
                render={(a) => (
                  <li key={a.id} className={`ov-action prio-${a.priority}`}>
                    <div>
                      <span className="ov-prio">{PRIORITY_TEXT[a.priority]}</span>
                      <p>{a.text}</p>
                    </div>
                    <span className="ov-action-links">
                      <a className="btn btn-small" href={a.href}>
                        {a.cta}
                      </a>
                      {a.secondary && (
                        <a className="btn btn-small" href={a.secondary.href}>
                          {a.secondary.cta}
                        </a>
                      )}
                    </span>
                  </li>
                )}
              />
            )}
          </section>

          <section className="panel" aria-labelledby="ov-lodging">
            <header className="panel-head">
              <h2 id="ov-lodging">Alloggi</h2>
              <a href="#/prenotazioni" className="small">
                Apri le prenotazioni
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
                      <strong>{l.stopName}</strong>{' '}
                      <span className="muted small">
                        · {l.nights} {l.nights === 1 ? 'notte' : 'notti'}
                      </span>
                      {l.accommodation && (
                        <span className="muted small block">
                          {l.accommodation}
                          {!l.hasPrice && ' · prezzo mancante'}
                        </span>
                      )}
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
                Apri le giornate
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
                      <strong>Giorno {h.index + 1}</strong>{' '}
                      <span className="muted small">
                        {formatDateIt(h.date)}
                        {h.place ? ` · ${h.place}` : ''}
                      </span>
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
        <div className="ov-col">
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
                  {budgetPartial && <span className="ov-total-label">Totale parziale · solo voci con importo</span>}
                  <strong>{formatEur(o.budget.total)}</strong>
                  <span className="muted small">
                    {o.budget.perDay !== undefined ? ` · ${formatEur(o.budget.perDay)} al giorno${budgetPartial ? ' (parziale)' : ''}` : ''}
                  </span>
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
                <Clipped items={o.budget.missingPrices} max={3} render={(m, i) => <li key={`${m}-${i}`}>{m}</li>} />
              </div>
            )}
          </section>
          <section className="panel" aria-labelledby="ov-legs">
            <header className="panel-head">
              <h2 id="ov-legs">Trasferimenti</h2>
              <a href="#/pianifica" className="small">
                Apri l'itinerario
              </a>
            </header>
            {o.uncalculatedLegs.length + o.shipLegsMissing.length === 0 ? (
              <p className="muted">
                {trip.legs.length === 0 ? 'Nessun tratto: aggiungi almeno due tappe.' : 'Tutti i tratti hanno un percorso o un mezzo inserito.'}
              </p>
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
            <h3 className="ov-subhead">Orari da verificare</h3>
            {o.unverifiedCrossings.length === 0 ? (
              <p className="muted">Nessun traghetto, nave o mezzo con orario da confermare.</p>
            ) : (
              <Clipped
                items={o.unverifiedCrossings}
                render={(c, i) => (
                  <li key={`${c.legId}-${i}`}>
                    <span>
                      {c.label}{' '}
                      <span className="muted small">
                        ({c.from} → {c.to})
                      </span>
                    </span>{' '}
                    <Badge tone="warn">{c.departureTime ? `ore ${c.departureTime} da confermare` : 'orario da verificare'}</Badge>
                  </li>
                )}
              />
            )}
          </section>
        </div>
      </div>
      </details>
      )}
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
