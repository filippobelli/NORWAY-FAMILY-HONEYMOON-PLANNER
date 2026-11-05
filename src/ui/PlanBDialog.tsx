import { useMemo, useState } from 'react';
import { restorePlanOnly } from '../domain/actuals';
import { formatEur } from '../domain/budget';
import { formatDateIt, formatDuration, removeStops } from '../domain/itinerary';
import { applyVersion, draftMoveStop, draftRemoveStop, draftSetNights, planImpact, previewVersion, saveAlternative, undoVersion, type PlanImpact } from '../domain/planImpact';
import { clearScenario, tripForScenario } from '../domain/scenarios';
import type { ID, Scenario, Stop, Trip } from '../domain/types';
import { useTrip } from '../state/store';
import { Field, NumberInput } from './common';
import { Modal } from './PlacementDialog';

function ImpactRow({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <tr className={before === after ? '' : 'is-changed'}>
      <th scope="row">{label}</th>
      <td>{before}</td>
      <td>{after}</td>
    </tr>
  );
}

// Confronto prima/dopo. Tutto ciò che qui è mostrato viene dalle funzioni di dominio: nessun dato stimato in più.
export function ImpactView({ i }: { i: PlanImpact }) {
  return (
    <section className="impact" aria-label="Cosa cambia">
      <h3>Cosa cambia</h3>
      <table className="impact-table small">
        <caption className="sr-only">Prima e dopo la modifica</caption>
        <thead>
          <tr>
            <td />
            <th scope="col">Prima</th>
            <th scope="col">Dopo</th>
          </tr>
        </thead>
        <tbody>
          <ImpactRow label="Giorni" before={String(i.route.daysBefore)} after={String(i.route.daysAfter)} />
          <ImpactRow label="Notti" before={String(i.nights.before)} after={String(i.nights.after)} />
          <ImpactRow label="Partenza" before={formatDateIt(i.route.startBefore)} after={formatDateIt(i.route.startAfter)} />
          <ImpactRow label="Fine" before={i.end.before ? formatDateIt(i.end.before) : '—'} after={i.end.after ? formatDateIt(i.end.after) : '—'} />
          <ImpactRow label="Trasferimenti realistici" before={formatDuration(i.times.realisticBefore)} after={`${formatDuration(i.times.realisticAfter)}${i.times.complete ? '' : ' · dato parziale'}`} />
          <ImpactRow label="Trasferimenti teorici" before={formatDuration(i.times.theoreticalBefore)} after={formatDuration(i.times.theoreticalAfter)} />
          <ImpactRow label="Budget" before={formatEur(i.budget.before)} after={formatEur(i.budget.after)} />
          <ImpactRow label="Costi senza importo" before={String(i.budget.missingBefore)} after={String(i.budget.missingAfter)} />
        </tbody>
      </table>
      <h4>Tappe e ordine{i.orderChanged ? ' (ordine cambiato)' : ''}</h4>
      <ol className="place-rows">
        {i.route.rows.map((r, k) => (
          <li key={k} className={`place-row is-${r.change}`}>
            <span>{r.name}</span>
            <span className="small">{r.fromNights !== undefined ? `${r.fromNights} → ${r.nights} notti` : r.nights === 0 ? 'senza notti' : `${r.nights} ${r.nights === 1 ? 'notte' : 'notti'}`}</span>
          </li>
        ))}
      </ol>
      {i.route.removed.length > 0 && <p className="small place-removed">Tolte: {i.route.removed.map((r) => r.name).join(', ')}.</p>}
      {i.unassigned.length > 0 && <p className="small note-warn">Attività senza giornata (restano da ricollocare): {i.unassigned.join(', ')}.</p>}
      {(i.transport.added.length > 0 || i.transport.removed.length > 0) && (
        <p className="small">
          {i.transport.removed.length > 0 && `Mezzi che escono: ${i.transport.removed.join(', ')}. `}
          {i.transport.added.length > 0 && `Mezzi che entrano: ${i.transport.added.join(', ')}.`}
        </p>
      )}
      {i.lodging.length > 0 && <p className="small">Alloggi: {i.lodging.join('; ')}.</p>}
      {i.budget.rows.length > 0 && (
        <table className="table compact small">
          <caption className="sr-only">Budget per categoria, prima e dopo</caption>
          <thead>
            <tr>
              <th>Categoria</th>
              <th className="num">Prima</th>
              <th className="num">Dopo</th>
            </tr>
          </thead>
          <tbody>
            {i.budget.rows.map((r) => (
              <tr key={r.category}>
                <td>{r.category}</td>
                <td className="num">{formatEur(r.before)}</td>
                <td className="num">{formatEur(r.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {i.missing.map((m) => (
        <p key={m} className="note-warn small">
          Da sapere: {m}
        </p>
      ))}
      {i.booked.length > 0 && (
        <div className="impact-booked" role="alert">
          <strong>Elementi prenotati, pagati o già completati coinvolti</strong>
          <ul className="small">
            {i.booked.map((b, k) => (
              <li key={k}>
                {b.label} ({b.status}): {b.effect}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="muted small">Diario e stati di visita non cambiano.</p>
    </section>
  );
}

export function BookingConfirm({ i, ok, setOk }: { i: PlanImpact; ok: boolean; setOk: (v: boolean) => void }) {
  if (!i.needsBookingConfirm) return null;
  return (
    <label className="check impact-confirm">
      <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> Ho capito: l'app non annulla né modifica prenotazioni, e diario e stati di visita restano registrati. Se serve, con i fornitori devo occuparmene io.
    </label>
  );
}

function useApplyVersion() {
  const { update, toast } = useTrip();
  return (id: ID, from: ID | undefined, label: string) => {
    update((t) => applyVersion(t, id, label));
    toast(`Piano applicato: ${label}`, 'ok', from ? { label: 'Annulla', run: () => update((t) => undoVersion(t, from, label)) } : undefined);
  };
}

/** Prepara una variante del percorso. Nulla cambia finché non scegli «Applica piano». */
export function PlanBDialog({ onClose }: { onClose: () => void }) {
  const { trip, update, toast } = useTrip();
  const [draft, setDraft] = useState<Trip>(trip);
  const [name, setName] = useState('Piano B');
  const [ok, setOk] = useState(false);
  const [nightsTo, setNightsTo] = useState<'togli' | 'alla_precedente'>('alla_precedente');
  const impact = useMemo(() => planImpact(trip, draft), [trip, draft]);
  const changed = draft !== trip;
  const apply = useApplyVersion();
  const save = () => {
    const r = saveAlternative(trip, name, draft);
    update(() => r.trip);
    toast(`Alternativa «${name.trim() || 'Piano B'}» salvata: il percorso non è cambiato`);
    return r;
  };
  return (
    <Modal title="Prepara un piano B" onClose={onClose}>
      <p className="muted small">È una bozza: l'itinerario attivo non cambia finché non scegli «Applica piano». Con «Salva alternativa» la ritrovi tra le versioni del percorso.</p>
      <ol className="planb-stops">
        {draft.stops.map((s, i) => (
          <li key={s.id}>
            <span className="planb-name">{s.name}</span>
            <NumberInput ariaLabel={`Notti a ${s.name}`} value={s.nights} min={0} step={1} onChange={(v) => setDraft((d) => draftSetNights(d, s.id, v ?? 0))} />
            <button className="icon-btn" aria-label={`Sposta su ${s.name}`} disabled={i === 0} onClick={() => setDraft((d) => draftMoveStop(d, s.id, -1))}>
              ↑
            </button>
            <button className="icon-btn" aria-label={`Sposta giù ${s.name}`} disabled={i === draft.stops.length - 1} onClick={() => setDraft((d) => draftMoveStop(d, s.id, 1))}>
              ↓
            </button>
            <button className="btn btn-small" onClick={() => setDraft((d) => draftRemoveStop(d, s.id, nightsTo))}>
              Salta
            </button>
          </li>
        ))}
      </ol>
      <Field label="Le notti di una tappa saltata">
        {(id) => (
          <select id={id} value={nightsTo} onChange={(e) => setNightsTo(e.target.value as 'togli' | 'alla_precedente')}>
            <option value="alla_precedente">Passano alla tappa precedente</option>
            <option value="togli">Si tolgono: il viaggio si accorcia</option>
          </select>
        )}
      </Field>
      {changed ? <ImpactView i={impact} /> : <p className="muted small">Cambia notti, ordine o tappe per vedere gli effetti.</p>}
      <Field label="Nome dell'alternativa">{(id) => <input id={id} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
      {changed && <BookingConfirm i={impact} ok={ok} setOk={setOk} />}
      <div className="row wrap place-actions">
        <button
          className="btn"
          disabled={!changed}
          onClick={() => {
            save();
            onClose();
          }}
        >
          Salva alternativa
        </button>
        <button
          className={`btn ${impact.needsBookingConfirm && !ok ? '' : 'btn-primary'}`}
          disabled={!changed || (impact.needsBookingConfirm && !ok)}
          onClick={() => {
            const r = saveAlternative(trip, name, draft);
            const from = r.trip.activeScenarioId;
            update(() => r.trip);
            apply(r.id, from, name.trim() || 'Piano B');
            onClose();
          }}
        >
          Applica piano
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Annulla
        </button>
      </div>
    </Modal>
  );
}

/** Applica una versione salvata solo dopo aver visto cosa cambia. */
export function ApplyVersionDialog({ scenario, onClose }: { scenario: Scenario; onClose: () => void }) {
  const { trip } = useTrip();
  const impact = useMemo(() => planImpact(trip, previewVersion(trip, scenario.id)), [trip, scenario.id]);
  const [ok, setOk] = useState(false);
  const apply = useApplyVersion();
  const activeName = trip.scenarios?.find((s) => s.id === trip.activeScenarioId)?.name;
  return (
    <Modal title={`Applica «${scenario.name}»`} onClose={onClose}>
      <ImpactView i={impact} />
      <p className="small">
        L'itinerario attivo diventa «{scenario.name}». Quello attuale{activeName ? ` («${activeName}»)` : ''} resta tra le versioni del percorso e puoi tornarci.
      </p>
      <BookingConfirm i={impact} ok={ok} setOk={setOk} />
      <div className="row wrap place-actions">
        <button
          className={`btn ${impact.needsBookingConfirm && !ok ? '' : 'btn-primary'}`}
          disabled={impact.needsBookingConfirm && !ok}
          onClick={() => {
            apply(scenario.id, trip.activeScenarioId, scenario.name);
            onClose();
          }}
        >
          Applica piano
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Annulla
        </button>
      </div>
    </Modal>
  );
}

/** Svuota uno scenario in un colpo solo, dopo aver visto cosa cambia. Si può annullare. */
export function ClearScenarioDialog({ scenario, onClose }: { scenario: Scenario; onClose: () => void }) {
  const { trip, update, toast } = useTrip();
  const [costs, setCosts] = useState(false);
  const [ok, setOk] = useState(false);
  const before = useMemo(() => tripForScenario(trip, scenario.id), [trip, scenario.id]);
  const impact = useMemo(() => planImpact(before, tripForScenario(clearScenario(trip, scenario.id, { costs }), scenario.id)), [trip, before, scenario.id, costs]);
  const flights = before.flights?.length ?? 0;
  const items = before.budgetItems.length;
  return (
    <Modal title={`Svuota «${scenario.name}»`} onClose={onClose}>
      <p className="small">Si tolgono tappe, tratti e giornate con le loro attività. Restano la data di partenza, gli alloggi salvati e il diario.</p>
      <label className="check">
        <input type="checkbox" checked={costs} onChange={(e) => setCosts(e.target.checked)} /> Togli anche voli ({flights}), crociere scelte e voci di budget ({items})
      </label>
      <ImpactView i={impact} />
      <BookingConfirm i={impact} ok={ok} setOk={setOk} />
      <div className="row wrap place-actions">
        <button
          className="btn danger"
          disabled={impact.needsBookingConfirm && !ok}
          onClick={() => {
            const previous = trip;
            update((t) => clearScenario(t, scenario.id, { costs }));
            toast(`Scenario «${scenario.name}» svuotato`, 'ok', { label: 'Annulla', run: () => update((t) => restorePlanOnly(t, previous)) });
            onClose();
          }}
        >
          Svuota scenario
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Annulla
        </button>
      </div>
    </Modal>
  );
}

/** Elimina più tappe insieme, dopo aver visto cosa cambia. Si può annullare. */
export function RemoveStopsDialog({ stops, onClose, onDone }: { stops: Stop[]; onClose: () => void; onDone: () => void }) {
  const { trip, update, toast } = useTrip();
  const [ok, setOk] = useState(false);
  const ids = stops.map((s) => s.id);
  const key = ids.join();
  const impact = useMemo(() => planImpact(trip, removeStops(trip, key.split(','))), [trip, key]);
  const label = stops.length === 1 ? '1 tappa' : `${stops.length} tappe`;
  return (
    <Modal title={`Elimina ${label}`} onClose={onClose}>
      <p className="small">{stops.map((s) => s.name).join(' · ')}</p>
      <ImpactView i={impact} />
      <BookingConfirm i={impact} ok={ok} setOk={setOk} />
      <div className="row wrap place-actions">
        <button
          className="btn danger"
          disabled={impact.needsBookingConfirm && !ok}
          onClick={() => {
            const previous = trip;
            update((t) => removeStops(t, ids));
            toast(stops.length === 1 ? '1 tappa eliminata' : `${stops.length} tappe eliminate`, 'ok', { label: 'Annulla', run: () => update((t) => restorePlanOnly(t, previous)) });
            onDone();
          }}
        >
          Elimina {label}
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Annulla
        </button>
      </div>
    </Modal>
  );
}
