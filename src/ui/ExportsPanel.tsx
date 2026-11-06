import { useState } from 'react';
import { exportFileName, offlinePackage, tripToGpx, tripToIcs, tripToKml } from '../domain/exportFormats';
import { summaryToPdf } from '../domain/pdf';
import { tripSummary } from '../domain/tripSummary';
import { useTrip } from '../state/store';
import { Field, fmtDateTime } from './common';
import { Icon } from './icons';

function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Esportazioni del viaggio: tutte generate qui, sul dispositivo, senza rete e senza inviare dati a servizi esterni.
 * Le mappe offline non ci sono: per orientarsi senza rete restano GPX/KML e le coordinate.
 */
export function ExportsPanel({ compact }: { compact?: boolean }) {
  const { trip, update, toast } = useTrip();
  const [diary, setDiary] = useState(false);
  const empty = trip.stops.length === 0;
  const run = (label: string, fn: () => void) => {
    try {
      fn();
      toast(`${label} pronto: controlla i download`);
    } catch (e) {
      toast(`${label} non riuscito: ${(e as Error).message}`, 'errore');
    }
  };
  return (
    <section className={compact ? 't-card exports' : 'panel exports'} id="esporta" aria-labelledby="exports-title">
      <h2 id="exports-title">Esportazioni e pacchetto offline</h2>
      <p className="small">
        Si creano su questo dispositivo con i dati del viaggio aperto, aggiornati al {fmtDateTime(trip.updatedAt)}. Non serve la rete e nulla viene inviato fuori.
        {empty && ' Il viaggio è vuoto: i file conterranno solo titolo e partecipanti.'}
      </p>
      <div className="export-grid">
        <article>
          <h3>
            <Icon name="book" /> Pacchetto offline
          </h3>
          <p className="small">Un file HTML da aprire senza rete: giornate, tappe con coordinate, alloggi con indirizzi e telefoni, prenotazioni e verifiche, numeri e note utili{diary ? ', diario' : ''}.</p>
          <label className="check small">
            <input type="checkbox" checked={diary} onChange={(e) => setDiary(e.target.checked)} /> Includi il diario (testo; gli allegati restano sul dispositivo)
          </label>
          <button className="btn btn-primary" onClick={() => run('Pacchetto offline', () => download(exportFileName(trip, 'html'), offlinePackage(trip, { diary }), 'text/html;charset=utf-8'))}>
            Scarica il pacchetto offline
          </button>
        </article>
        <article>
          <h3>
            <Icon name="note" /> PDF del viaggio
          </h3>
          <p className="small">Lo stesso contenuto del pacchetto, da stampare o tenere sul telefono.</p>
          <button className="btn" onClick={() => run('PDF', () => download(exportFileName(trip, "pdf"), summaryToPdf(tripSummary(trip, { diary })).buffer as ArrayBuffer, "application/pdf"))}>
            Scarica il PDF
          </button>
        </article>
        <article>
          <h3>
            <Icon name="calendar" /> Calendario (.ics)
          </h3>
          <p className="small">Un evento per ogni giornata. Voli e traghetti diventano eventi con l'ora solo se l'orario è stato inserito: nessun orario inventato.</p>
          <button className="btn" onClick={() => run('Calendario', () => download(exportFileName(trip, 'ics'), tripToIcs(trip), 'text/calendar;charset=utf-8'))}>
            Scarica il calendario
          </button>
        </article>
        <article>
          <h3>
            <Icon name="map" /> Tappe per app di mappe
          </h3>
          <p className="small">GPX (app di navigazione e outdoor) o KML (Google Earth, Mappe). Tappe, alloggi con coordinate e i tracciati stradali già calcolati.</p>
          <div className="row wrap">
            <button className="btn" onClick={() => run('GPX', () => download(exportFileName(trip, 'gpx'), tripToGpx(trip), 'application/gpx+xml'))}>
              Scarica GPX
            </button>
            <button className="btn" onClick={() => run('KML', () => download(exportFileName(trip, 'kml'), tripToKml(trip), 'application/vnd.google-earth.kml+xml'))}>
              Scarica KML
            </button>
          </div>
        </article>
      </div>
      <Field label="Numeri utili e note di viaggio" hint="Finiscono nel pacchetto offline e nel PDF. Restano nel viaggio come gli altri dati.">
        {(id) => (
          <textarea
            id={id}
            rows={compact ? 3 : 4}
            value={trip.usefulInfo ?? ''}
            placeholder="Es. noleggio auto: numero di assistenza · emergenze in Norvegia: 112 · assicurazione: …"
            onChange={(e) => update((t) => ({ ...t, usefulInfo: e.target.value || undefined }))}
          />
        )}
      </Field>
      <p className="small muted">
        Mappe offline non disponibili: i termini dei fornitori cartografici attuali non permettono di scaricare le mappe per l'uso senza rete. Senza rete restano l'elenco delle tappe, le coordinate e i file GPX/KML da
        aprire in un'app di mappe che hai già scaricato.
      </p>
    </section>
  );
}
