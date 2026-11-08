import { useState } from 'react';
import type { Side } from '../domain/merge';
import { exportTripFile } from '../services/storage/local';
import { useCloudSync, type CloudConflict } from '../state/cloudSync';
import { useTrip } from '../state/store';
import { Modal } from './PlacementDialog';
import { formatMb, notUploaded } from '../domain/attachments';

/** Stessa cosa cambiata in modo diverso su due dispositivi: si confronta e si sceglie, punto per punto. */
export function ConflictDialog({ conflict, onClose }: { conflict: CloudConflict; onClose: () => void }) {
  const { resolve } = useCloudSync();
  const { merge } = conflict;
  const [choices, setChoices] = useState<Record<string, Side>>({});
  const all = (side: Side) => setChoices(Object.fromEntries(merge.conflicts.map((c) => [c.id, side])));
  const complete = merge.conflicts.every((c) => choices[c.id]);
  return (
    <Modal title="Modifiche su due dispositivi" onClose={onClose}>
      <p className="small">Niente viene sovrascritto finché non scegli. Prima di applicare viene conservata una copia di questo dispositivo.</p>
      {merge.merged.length > 0 && <p className="small note-info">Unito in automatico: {merge.merged.join(', ')}.</p>}
      <div className="row wrap">
        <button className="btn btn-small" onClick={() => all('qui')}>
          Tutto da questo dispositivo
        </button>
        <button className="btn btn-small" onClick={() => all('cloud')}>
          Tutto dal cloud
        </button>
      </div>
      {merge.conflicts.map((c) => (
        <fieldset key={c.id} className="place-q">
          <legend>{c.label}</legend>
          {(['qui', 'cloud'] as const).map((side) => (
            <label key={side} className="place-opt">
              <input type="radio" name={`conflict-${c.id}`} checked={choices[c.id] === side} onChange={() => setChoices((x) => ({ ...x, [c.id]: side }))} />
              <span>
                <strong>{side === 'qui' ? 'Questo dispositivo' : 'Cloud'}</strong>
                <span className="small block">{c[side]}</span>
              </span>
            </label>
          ))}
        </fieldset>
      ))}
      <div className="row wrap place-actions">
        <button
          className="btn btn-primary"
          disabled={!complete}
          onClick={() => {
            resolve(choices);
            onClose();
          }}
        >
          Applica le scelte
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Decido dopo
        </button>
      </div>
    </Modal>
  );
}

/** Logout: i dati del viaggio non restano per chi accede dopo. Con modifiche in attesa lo si dice prima. */
export function LogoutDialog({ onClose }: { onClose: () => void }) {
  const { trip, toast } = useTrip();
  const { pending, status, logout, syncNow, session } = useCloudSync();
  const [busy, setBusy] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [filesUnderstood, setFilesUnderstood] = useState(false);
  const local = notUploaded(trip);
  const localBytes = local.reduce((n, x) => n + x.attachment.size, 0);
  return (
    <Modal title="Esci dall'account" onClose={onClose}>
      <p className="small">Uscendo, il viaggio, il diario e gli allegati vengono tolti da questo dispositivo: chi accede dopo non li vede. Ciò che è nel cloud resta.</p>
      {pending && (
        <>
          <p className="note-warn small" role="alert">
            Ci sono modifiche non ancora nel cloud{status === 'offline' ? ' e ora il cloud non è raggiungibile' : ''}. Uscendo andrebbero perse.
          </p>
          <div className="row wrap">
            <button className="btn" onClick={syncNow}>
              Riprova a sincronizzare
            </button>
            <button className="btn" onClick={() => exportTripFile(trip)}>
              Esporta un backup
            </button>
          </div>
          <label className="check impact-confirm">
            <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} /> Ho capito: le modifiche non sincronizzate vengono eliminate da questo dispositivo.
          </label>
        </>
      )}
      {local.length > 0 && (
        <>
          <p className="note-warn small" role="alert">
            {local.length} allegati ({formatMb(localBytes)} MB) non sono ancora nel cloud: uscendo andrebbero persi. Il backup su file non li contiene: aspetta che si carichino.
          </p>
          <ul className="small">
            {local.slice(0, 10).map((x) => (
              <li key={x.attachment.id}>{x.attachment.name}</li>
            ))}
          </ul>
          <label className="check impact-confirm">
            <input type="checkbox" checked={filesUnderstood} onChange={(e) => setFilesUnderstood(e.target.checked)} /> Ho capito: gli allegati non caricati vengono eliminati da questo dispositivo.
          </label>
        </>
      )}
      <div className="row wrap place-actions">
        <button
          className="btn btn-primary"
          disabled={busy || (pending && !understood) || (local.length > 0 && !filesUnderstood)}
          onClick={() => {
            setBusy(true);
            void logout().then(() => {
              toast(`Uscita completata${session ? ` da ${session.email}` : ''}: i dati del viaggio sono stati tolti da questo dispositivo`);
              onClose();
            });
          }}
        >
          Esci
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Annulla
        </button>
      </div>
    </Modal>
  );
}
