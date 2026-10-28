import { useMemo, useState } from 'react';
import { DESTINATIONS, findDestination } from '../data/destinations';
import { applySuggestion, computeDayLoads, describeLoad, loadFactors, suggestAlternatives, type DayLoad, type Suggestion } from '../domain/dayLoad';
import { newId } from '../domain/ids';
import { assumptions, computeDays, formatDateIt, formatDuration, legSummary, orphanDayKeys, type DayInfo } from '../domain/itinerary';
import type { Activity, DayPlan } from '../domain/types';
import { haversineKm } from '../services/accommodation/search';
import { useTrip } from '../state/store';
import { OfficialLink } from './OfficialLink';
import { Badge, Empty, Field, fmtMoney, MODE_ICON, MoneyInput, NumberInput, StatusSelect } from './common';

const emptyDay = (): DayPlan => ({ activities: [], notes: '', planB: '' });

const LEVEL_LABEL: Record<DayLoad['level'], { label: string; tone: 'ok' | 'info' | 'warn' | 'neutral' }> = {
  leggera: { label: 'Leggera', tone: 'ok' },
  equilibrata: { label: 'Equilibrata', tone: 'info' },
  piena: { label: 'Piena', tone: 'warn' },
  eccessiva: { label: 'Troppo carica', tone: 'warn' },
};

export function DaysView() {
  const { trip, update, replace, toast } = useTrip();
  const days = useMemo(() => computeDays(trip), [trip]);
  const loads = useMemo(() => computeDayLoads(trip, days), [trip, days]);
  const suggestions = useMemo(() => suggestAlternatives(trip), [trip]);
  const orphans = useMemo(() => orphanDayKeys(trip), [trip]);
  const a = assumptions(trip.settings);

  if (days.length === 0) return <Empty title="Nessuna giornata">Aggiungi le tappe nella sezione Itinerario: le giornate si generano dalle notti.</Empty>;

  const apply = (sg: Suggestion) => {
    if (!sg.action) return;
    const action = sg.action;
    const before = trip;
    update((t) => applySuggestion(t, action));
    toast('Proposta applicata', 'ok', { label: 'Annulla', run: () => replace(before) });
  };

  const counts = loads.reduce<Record<string, number>>((acc, l) => ({ ...acc, [l.level]: (acc[l.level] ?? 0) + 1 }), {});

  return (
    <div className="days">
      {trip.dateTentative && (
        <p className="note-info">Date provvisorie: la partenza è impostata al {formatDateIt(trip.startDate)} e si può cambiare in Salvataggio → Viaggio.</p>
      )}
      <section className="panel">
        <h2>Ritmo del viaggio</h2>
        <p className="muted small">
          Carico = trasferimenti realistici + visite + pause pasto ({formatDuration(a.mealBreaksMin)}) + margine imprevisti ({a.marginPct}%), su{' '}
          {formatDuration(a.activeDayMin)} di tempo attivo al giorno. Sono ipotesi modificabili in Salvataggio → Viaggio.
        </p>
        <div className="load-strip" role="list" aria-label="Carico giornaliero">
          {loads.map((l) => (
            <a key={l.key} role="listitem" href={`#/giornate`} onClick={(e) => { e.preventDefault(); document.getElementById(`day-${l.key}`)?.scrollIntoView({ behavior: 'smooth' }); }} className={`load-cell load-${l.level} ${l.incomplete ? 'load-incomplete' : ''}`} title={`Giorno ${l.index + 1}: ${LEVEL_LABEL[l.level].label}${l.incomplete ? ' (incompleto: tratti non calcolati)' : ''} — ${describeLoad(l)}`}>
              {l.index + 1}
            </a>
          ))}
        </div>
        <p className="small">
          {(['leggera', 'equilibrata', 'piena', 'eccessiva'] as const)
            .filter((k) => counts[k])
            .map((k) => `${counts[k]} ${LEVEL_LABEL[k].label.toLowerCase()}`)
            .join(' · ')}
          {loads.some((l) => l.incomplete) && ` · ${loads.filter((l) => l.incomplete).length} con tratti non calcolati (bordo tratteggiato)`}
        </p>
        {suggestions.length > 0 && (
          <>
            <h3>Proposte per alleggerire</h3>
            <p className="muted small">Nessuna proposta viene applicata da sola: scegli tu.</p>
            <ul className="suggestion-list">
              {suggestions.map((sg) => (
                <li key={sg.id}>
                  <span>
                    <strong>Giorno {(days.find((d) => d.key === sg.dayKey)?.index ?? 0) + 1}:</strong> {sg.text}
                  </span>
                  {sg.action && (
                    <button className="btn btn-small" onClick={() => apply(sg)}>
                      Applica
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {orphans.length > 0 && (
        <section className="panel">
          <h2>Attività di giornate non più presenti</h2>
          <p className="muted small">Appartenevano a tappe rimosse o a notti tolte. Non sono conteggiate nel budget; spostale o eliminale.</p>
          {orphans.map((k) => (
            <OrphanDay key={k} dayKey={k} days={days} />
          ))}
        </section>
      )}

      {days.map((d) => (
        <DayCard key={d.key} day={d} load={loads[d.index]!} suggestions={suggestions.filter((sg) => sg.dayKey === d.key)} onApply={apply} />
      ))}
    </div>
  );
}

function OrphanDay({ dayKey, days }: { dayKey: string; days: DayInfo[] }) {
  const { trip, update } = useTrip();
  const plan = trip.days[dayKey];
  const [target, setTarget] = useState(days[0]?.key ?? '');
  if (!plan) return null;
  return (
    <div className="segment">
      <p className="small">{plan.activities.map((a) => a.title || 'attività').join(', ') || plan.notes || plan.planB}</p>
      <div className="row wrap">
        <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Giornata di destinazione">
          {days.map((d) => (
            <option key={d.key} value={d.key}>
              Giorno {d.index + 1} · {d.sleepStop?.name ?? 'partenza'}
            </option>
          ))}
        </select>
        <button
          className="btn btn-small"
          onClick={() =>
            update((t) => {
              const to = t.days[target] ?? emptyDay();
              const rest = { ...t.days };
              delete rest[dayKey];
              return {
                ...t,
                days: {
                  ...rest,
                  [target]: {
                    activities: [...to.activities, ...plan.activities],
                    notes: [to.notes, plan.notes].filter(Boolean).join('\n'),
                    planB: [to.planB, plan.planB].filter(Boolean).join('\n'),
                  },
                },
              };
            })
          }
        >
          Sposta qui
        </button>
        <button
          className="btn btn-small danger"
          onClick={() => {
            if (window.confirm('Eliminare definitivamente queste attività e note?')) {
              update((t) => {
                const rest = { ...t.days };
                delete rest[dayKey];
                return { ...t, days: rest };
              });
            }
          }}
        >
          Elimina
        </button>
      </div>
    </div>
  );
}

function DayCard({ day, load, suggestions, onApply }: { day: DayInfo; load: DayLoad; suggestions: Suggestion[]; onApply: (sg: Suggestion) => void }) {
  const { trip, update } = useTrip();
  const plan = trip.days[day.key] ?? emptyDay();
  const [title, setTitle] = useState('');
  const setPlan = (fn: (p: DayPlan) => DayPlan) => update((t) => ({ ...t, days: { ...t.days, [day.key]: fn(t.days[day.key] ?? emptyDay()) } }));
  const here = day.sleepStop ?? day.wakeStop;
  const nearby = here
    ? DESTINATIONS.filter((x) => x.category !== 'aeroporti' && haversineKm(x, here) < 60 && x.id !== here.destinationId).slice(0, 6)
    : [];
  const addActivity = (a: Partial<Activity>) =>
    setPlan((p) => ({ ...p, activities: [...p.activities, { id: newId(), title: a.title ?? '', costStatus: 'da_verificare', ...a }] }));
  const setAct = (id: string, patch: Partial<Activity>) =>
    setPlan((p) => ({ ...p, activities: p.activities.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));

  const from = day.legs[0] ? trip.stops.find((s) => s.id === day.legs[0]!.fromStopId) : undefined;
  const lv = LEVEL_LABEL[load.level];
  const factors = loadFactors(trip, day, load);
  const heavy = load.level === 'piena' || load.level === 'eccessiva';
  // Il riquadro compare se la giornata è piena o se un fattore da solo la rende faticosa (es. tratto non calcolato)
  const attention = factors.length > 0 && (heavy || factors.some((f) => f.strong));
  const acc = day.sleepStop?.accommodationId ? trip.accommodations.find((x) => x.id === day.sleepStop!.accommodationId) : undefined;
  return (
    <article id={`day-${day.key}`} className={`day day-${load.level}`}>
      <header className="day-head">
        <div>
          <span className="day-num">Giorno {day.index + 1}</span> <span className="muted">{formatDateIt(day.date)}</span>
        </div>
        <div className="day-route">
          {day.isArrivalDay && <Badge tone="info">Arrivo</Badge>}
          {day.isDepartureDay && <Badge tone="info">Rientro</Badge>}
          {from && day.sleepStop ? (
            <span>
              {from.name} → <strong>{day.sleepStop.name}</strong>
            </span>
          ) : day.sleepStop ? (
            <strong>{day.sleepStop.name}</strong>
          ) : (
            day.wakeStop && <span>Partenza da {day.wakeStop.name}</span>
          )}
        </div>
      </header>

      <div className="load-bar" aria-label={`Carico: ${lv.label}, ${describeLoad(load)}`}>
        <span className={`load-fill load-${load.level}`} style={{ width: `${Math.min(100, Math.round(load.ratio * 100))}%` }} />
      </div>
      <p className="small">
        <Badge tone={lv.tone}>{lv.label}</Badge> {describeLoad(load)} · trasferimenti {formatDuration(load.transferMin)} · visite {formatDuration(load.visitsMin)}
        {load.estimatedVisits > 0 && <span className="muted"> ({load.estimatedVisits} durate stimate dal catalogo)</span>}
        {load.unknownVisits > 0 && <span className="muted"> · {load.unknownVisits} attività senza durata</span>}
        {load.incomplete && <strong className="error"> · stima incompleta: ci sono tratti non calcolati</strong>}
      </p>
      {attention && (
        <div className={`load-why ${heavy ? '' : 'load-why-soft'}`}>
          <strong className="small">{heavy ? `Perché è ${load.level === 'eccessiva' ? 'troppo carica' : 'piena'}` : 'Perché richiede attenzione'}:</strong>
          <ul>
            {factors.map((f) => (
              <li key={f.text} className={f.strong ? 'strong' : ''}>
                {f.text}
                {f.hint && <span className="load-hint"> → {f.hint}</span>}
              </li>
            ))}
          </ul>
          {suggestions.length > 0 && (
            <ul className="load-proposals">
              {suggestions.map((sg) => (
                <li key={sg.id}>
                  <span>
                    <strong>Proposta:</strong> {sg.text}
                  </span>
                  {sg.action && (
                    <button className="btn btn-small" onClick={() => onApply(sg)}>
                      Applica
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {suggestions.some((sg) => sg.action) && <p className="muted small">Nulla viene modificato finché non scegli «Applica»; ogni proposta si può annullare.</p>}
        </div>
      )}
      {!attention && (day.isArrivalDay || day.isDepartureDay) && <p className="muted small">Giorno di volo: considera gli orari reali del volo, non inclusi nel calcolo.</p>}

      {day.legs.length > 0 && (
        <ul className="day-legs">
          {day.legs.map((l) => {
            const t = legSummary(l, trip.settings);
            return (
              <li key={l.id}>
                {l.segments.map((s) => MODE_ICON[s.mode]).join(' ')} {t.roadKm > 0 && `${Math.round(t.roadKm)} km su strada · guida ${formatDuration(t.driveMin)} · `}
                {t.totalMin !== undefined
                  ? `totale teorico ${formatDuration(t.totalMin)} · realistici ~${formatDuration(t.realisticMin ?? t.totalMin)}`
                  : t.state === 'da_calcolare'
                    ? 'da calcolare'
                    : 'totale non calcolabile (durate mancanti)'}
                {l.segments
                  .filter((s) => s.mode !== 'strada' && s.mode !== 'non_calcolato')
                  .map((s) => (
                    <span key={s.id} className="muted">
                      {' '}
                      · {s.label} {s.departureTime ? `ore ${s.departureTime}` : ''}
                      {['confermato', 'prenotato', 'pagato'].includes(s.status) ? '' : ' (orario da verificare)'}
                    </span>
                  ))}
              </li>
            );
          })}
        </ul>
      )}
      {!attention && day.warnings.map((w) => (
        <p key={w} className="note-warn small">
          ⚠️ {w}
        </p>
      ))}
      <p className="day-sleep small">
        <span aria-hidden>🛏</span>{' '}
        {!day.sleepStop ? (
          <span className="muted">Ultimo giorno: nessun pernottamento</span>
        ) : day.sleepStop.kind === 'a_bordo' ? (
          <span>Notte a bordo della nave</span>
        ) : (
          <>
            Si dorme a <strong>{day.sleepStop.name}</strong>
            {day.nightIndex > 0 && <span className="muted"> (notte {day.nightIndex + 1} di {day.sleepStop.nights})</span>} ·{' '}
            {acc ? (
              <Badge tone={acc.status === 'prenotata' ? 'ok' : 'info'}>
                {acc.name} · {acc.status}
              </Badge>
            ) : (
              <Badge tone="warn">alloggio da scegliere</Badge>
            )}
          </>
        )}
      </p>

      <ul className="activities">
        {plan.activities.map((a) => {
          const dest = findDestination(a.destinationId);
          return (
            <li key={a.id} className="activity">
              <input aria-label="Attività" value={a.title} onChange={(e) => setAct(a.id, { title: e.target.value })} />
              <NumberInput
                ariaLabel="Durata in minuti"
                value={a.durationMin}
                placeholder={dest?.visitHours ? `~${dest.visitHours[0] * 60}` : 'min'}
                onChange={(v) => setAct(a.id, { durationMin: v })}
              />
              <MoneyInput ariaLabel="Costo dell'attività" value={a.cost} onChange={(m) => setAct(a.id, { cost: m })} />
              <StatusSelect ariaLabel="Stato del costo" value={a.costStatus} onChange={(v) => setAct(a.id, { costStatus: v })} />
              <button
                className="icon-btn danger"
                aria-label={`Rimuovi ${a.title || 'attività'}`}
                onClick={() => setPlan((p) => ({ ...p, activities: p.activities.filter((x) => x.id !== a.id) }))}
              >
                ✕
              </button>
              {dest?.officialUrl && <OfficialLink id={dest.id} />}
              {dest?.augustNote && <span className="note-warn small">⚠️ {dest.augustNote}</span>}
            </li>
          );
        })}
      </ul>
      <div className="row">
        <input
          aria-label="Nuova attività"
          placeholder="Nuova attività (es. battello sul fiordo, parco giochi, riposo)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          className="btn btn-small"
          disabled={!title.trim()}
          onClick={() => {
            addActivity({ title: title.trim() });
            setTitle('');
          }}
        >
          Aggiungi
        </button>
      </div>
      {nearby.length > 0 && (
        <div className="chips">
          <span className="muted small">Nei dintorni (entro ~60 km in linea d'aria):</span>
          {nearby.map((x) => (
            <button key={x.id} className="chip" onClick={() => addActivity({ title: x.name, destinationId: x.id })} title={x.description}>
              + {x.name}
            </button>
          ))}
        </div>
      )}
      <details>
        <summary>Note e piano B {plan.activities.some((a) => a.cost) && `· ${plan.activities.filter((a) => a.cost).map((a) => fmtMoney(a.cost)).join(' + ')}`}</summary>
        <div className="grid-2">
          <Field label="Note operative">{(id) => <textarea id={id} rows={2} value={plan.notes} onChange={(e) => setPlan((p) => ({ ...p, notes: e.target.value }))} />}</Field>
          <Field label="Se piove">{(id) => <textarea id={id} rows={2} value={plan.planB} onChange={(e) => setPlan((p) => ({ ...p, planB: e.target.value }))} />}</Field>
        </div>
      </details>
    </article>
  );
}
