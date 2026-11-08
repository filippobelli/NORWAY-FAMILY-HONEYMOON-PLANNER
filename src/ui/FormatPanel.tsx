import { useState } from 'react';
import { exportTripFile } from '../services/storage/local';
import { conversionMode } from '../state/conversionMode';
import { Modal } from './PlacementDialog';
import { useCloudSync } from '../state/cloudSync';
import { useTrip } from '../state/store';
import { useOnline } from '../state/uiContext';
import { Badge } from './common';

/** Passaggio del viaggio dal documento alle righe (design §7, «Aggiorno il formato dei dati») */
export function FormatPanel() {
  const { trip } = useTrip();
  const cloud = useCloudSync();
  const online = useOnline();
  const [confirming, setConfirming] = useState(false);
  if (!cloud.config || !cloud.session) return null;
  const c = cloud.conversion;
  // Il pulsante compare solo con VITE_PASSAGGIO_RIGHE=pulsante|auto (review B1); lo stato di un viaggio già convertito sì
  if (conversionMode() === 'nascosto' && !(cloud.rowsFormat && (!c || c.stato === 'fatto'))) return null;
  if (cloud.rowsFormat && (!c || c.stato === 'fatto')) {
    return (
      <section className="panel" aria-labelledby="formato-titolo">
        <h2 id="formato-titolo">
          Formato dei dati <Badge tone="ok">✓ nuovo formato</Badge>
        </h2>
        <p className="small muted">Il viaggio è salvato nel cloud riga per riga: le modifiche di più dispositivi si uniscono elemento per elemento.</p>
        {c?.unresolved && c.unresolved.length > 0 && (
          <div className="note-info small">
            <p>Riferimenti al catalogo non trovati nella versione caricata (conservati, non scartati):</p>
            <ul>
              {c.unresolved.slice(0, 20).map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    );
  }
  const steps: [string, 'fatto' | 'in_corso' | 'da_fare' | 'errore'][] = [
    ['Invio delle modifiche in attesa', c?.stato === 'attesa' ? 'in_corso' : c ? 'fatto' : 'da_fare'],
    ['Conversione del viaggio al nuovo formato', c?.stato === 'in_corso' ? 'in_corso' : c?.stato === 'fallita' ? 'errore' : 'da_fare'],
  ];
  const mark = { fatto: '✓', in_corso: '…', da_fare: '○', errore: '!' } as const;
  return (
    <section className="panel" aria-labelledby="formato-titolo">
      <h2 id="formato-titolo">Aggiorno il formato dei dati</h2>
      <p>Prima invio le modifiche fatte qui, poi converto il viaggio. Nessun dato viene tolto: la copia precedente resta su questo dispositivo.</p>
      {c && (
        <ol className="plain-list" aria-live="polite">
          {steps.map(([label, s]) => (
            <li key={label}>
              <span aria-hidden>{mark[s]}</span> {label}
              {s === 'fatto' && <span className="sr-only">: fatto</span>}
            </li>
          ))}
        </ol>
      )}
      {c?.stato === 'attesa' && !online && (
        <p className="note-info" role="status">
          Ci sono modifiche fatte qui non ancora nel cloud. La conversione aspetta la rete per non perderle. Intanto puoi usare il viaggio: le modifiche restano in coda.
        </p>
      )}
      {c?.stato === 'fallita' && (
        <div className="note-warn" role="alert">
          <p>Conversione non riuscita: il viaggio resta com'era su questo dispositivo. {c.error}</p>
          <div className="row wrap">
            {online && (
              <button className="btn btn-small btn-primary" onClick={() => void cloud.convertToRows()}>
                Riprova
              </button>
            )}
            <button className="btn btn-small" onClick={() => exportTripFile(trip)}>
              Esporta un backup
            </button>
          </div>
        </div>
      )}
      {!c && (
        <button className="btn btn-primary" disabled={!online || cloud.status === 'conflitto'} onClick={() => setConfirming(true)}>
          Converti il viaggio al nuovo formato
        </button>
      )}
      {confirming && (
        <Modal title="Convertire il viaggio al nuovo formato?" onClose={() => setConfirming(false)}>
          <ul className="small">
            <li>
              Dopo la conversione <strong>l'app di oggi sugli altri dispositivi non potrà più salvare questo viaggio</strong>: prima apri questa versione
              dell'app su tutti i dispositivi.
            </li>
            <li>Non c'è ancora un ritorno automatico al formato precedente: si fa solo con una procedura manuale sul database.</li>
            <li>Conviene esportare prima un backup su file. Nessun dato viene tolto: la copia precedente resta anche nel cloud.</li>
          </ul>
          <div className="row wrap place-actions">
            <button className="btn" onClick={() => exportTripFile(trip)}>
              Esporta un backup
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setConfirming(false);
                void cloud.convertToRows();
              }}
            >
              Converti il viaggio
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirming(false)}>
              Annulla
            </button>
          </div>
        </Modal>
      )}
      {c?.stato === 'in_corso' && (
        <p role="status">
          <span className="spinner" aria-hidden /> Conversione in corso…
        </p>
      )}
    </section>
  );
}
