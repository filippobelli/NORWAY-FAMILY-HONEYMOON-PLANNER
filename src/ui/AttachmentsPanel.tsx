import { useEffect, useState } from 'react';
import { formatMb, notUploaded, STORAGE_LIMIT_BYTES, usageInfo } from '../domain/attachments';
import { cloudAttachments } from '../services/storage/attachmentsCloud';
import { useCloudSync } from '../state/cloudSync';
import { useTrip } from '../state/store';

let warnedThisSession = false;

/** Spazio usato dagli allegati nel cloud (design §6, D5) */
export function AttachmentsPanel() {
  const { trip } = useTrip();
  const { config, session, rowsFormat } = useCloudSync();
  const [used, setUsed] = useState<{ bytes: number; limit: number }>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (!config || !session) return;
    let live = true;
    cloudAttachments(config)
      .usage()
      .then((u) => live && setUsed({ bytes: u.userBytes, limit: u.limitBytes || STORAGE_LIMIT_BYTES }))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [config, session]);
  const local = notUploaded(trip);
  const localBytes = local.reduce((n, x) => n + x.attachment.size, 0);
  const info = used ? usageInfo(used.bytes, used.limit) : undefined;
  const [alerted] = useState(() => {
    const first = !warnedThisSession;
    return first;
  });
  useEffect(() => {
    if (info?.warn) warnedThisSession = true;
  }, [info?.warn]);
  return (
    <section className="panel" aria-labelledby="allegati-titolo">
      <h2 id="allegati-titolo">Allegati del diario</h2>
      {!config || !session ? (
        <p className="small muted">Gli allegati restano su questo dispositivo finché non accedi al cloud.</p>
      ) : used && info ? (
        <>
          <p>
            <label htmlFor="allegati-spazio">
              Spazio usato nel cloud: {formatMb(used.bytes)} MB su 1 GB ({info.pct}%)
            </label>
          </p>
          <meter id="allegati-spazio" min={0} max={used.limit} low={used.limit * 0.6} high={used.limit * 0.8} optimum={0} value={used.bytes} />
          {info.warn && (
            <p className="note-warn small" role={alerted ? 'alert' : undefined}>
              Spazio quasi esaurito. Quando è pieno, i nuovi allegati non si caricano e restano su questo dispositivo.
            </p>
          )}
        </>
      ) : (
        <p className="small muted">{error ? `Spazio usato non disponibile: ${error}` : 'Leggo lo spazio usato…'}</p>
      )}
      <p className="small">
        Da caricare da questo dispositivo: {local.length} file, {formatMb(localBytes)} MB. Ammessi immagini e PDF fino a 10 MB per file.
      </p>
      {config && session && !rowsFormat && local.length > 0 && (
        <p className="small muted">Il caricamento parte dopo la conversione del viaggio al nuovo formato dei dati.</p>
      )}
    </section>
  );
}
