import { exportTripFile } from '../services/storage/local';
import { useCloudSync } from '../state/cloudSync';
import { useTrip } from '../state/store';
import { syncView } from '../state/syncLabel';
import { useOnline } from '../state/uiContext';
import { fmtDateTime } from './common';

/** Stato del salvataggio, sempre visibile: porta alle Impostazioni, dove ci sono backup e cloud. */
export function SyncBadge({ compact }: { compact?: boolean }) {
  const { localState } = useTrip();
  const cloud = useCloudSync();
  const online = useOnline();
  const v = syncView(localState, cloud.status, cloud.lastSyncAt, online);
  return (
    <a href={compact ? '#/t/altro' : '#/impostazioni'} className={`save-state save-tone-${v.tone}`} role="status" title={cloud.error ?? v.detail} aria-label={`Stato dei dati: ${v.label}. ${v.detail}`}>
      {compact ? v.short : v.label}
    </a>
  );
}

/** Che cosa funziona senza rete: la stessa risposta in Impostazioni e in modalità viaggio. */
export function OfflineInfo() {
  return (
    <div className="offline-info">
      <div>
        <h3>Funziona senza rete</h3>
        <p className="muted small">Dopo una prima apertura con la rete, su questo dispositivo.</p>
        <ul className="small">
          <li>Oggi, itinerario in elenco, diario, stati di visita</li>
          <li>Budget già calcolato e modifiche al viaggio, salvate sul dispositivo</li>
          <li>Allegati del diario: si salvano qui e si caricano nel cloud al ritorno della rete</li>
        </ul>
      </div>
      <div>
        <h3>Serve la rete</h3>
        <ul className="small">
          <li>Sfondo della mappa: le mappe offline non ci sono</li>
          <li>Calcolo dei percorsi e ricerca degli alloggi</li>
          <li>Cambio, carburante e foto del catalogo</li>
          <li>Accesso e invio al cloud: le modifiche restano in coda e ripartono da sole</li>
        </ul>
      </div>
    </div>
  );
}

/** Riquadro completo: stato attuale, cosa significa e cosa si può fare. */
export function DataStatusCard() {
  const { trip, localState } = useTrip();
  const cloud = useCloudSync();
  const online = useOnline();
  const v = syncView(localState, cloud.status, cloud.lastSyncAt, online);
  const connected = Boolean(cloud.config && cloud.session);
  return (
    <section className="t-card data-status" aria-labelledby="data-status-title">
      <h2 id="data-status-title">I tuoi dati</h2>
      <p className={`data-status-now tone-${v.tone}`}>
        <strong>{v.label}</strong>
      </p>
      <p className="small">{v.detail}</p>
      {cloud.error && <p className="small error">{cloud.error}</p>}
      <p className="small muted">
        Rete: {online ? 'disponibile secondo il dispositivo' : 'assente'}
        {connected ? ` · ultimo invio confermato: ${cloud.lastSyncAt ? fmtDateTime(cloud.lastSyncAt) : 'mai'}` : ''}
      </p>
      <div className="t-actions">
        {connected && v.canRetry && (
          <button className="btn" onClick={cloud.syncNow}>
            Riprova adesso
          </button>
        )}
        <button className="btn" onClick={() => exportTripFile(trip)}>
          Esporta un backup
        </button>
      </div>
      <details className="more-fields">
        <summary>Che cosa funziona senza rete</summary>
        <OfflineInfo />
      </details>
    </section>
  );
}
