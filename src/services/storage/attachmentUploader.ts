import { ATTACHMENT_MAX_BYTES, notUploaded, storagePath } from '../../domain/attachments';
import type { Trip } from '../../domain/types';
import type { AttachmentStorage } from './attachmentsCloud';

// Caricamento degli allegati non ancora nel cloud. Ordine (architettura §6): la voce e i metadati sono già nel cloud
// (sincronizzazione per riga) → caricamento del file → conferma nei metadati (state = nel_cloud, storagePath).
// La copia sul dispositivo resta: è la cache per l'uso senza rete.
// Percorso: {owner_id}/{trip_id}/{id} con il PROPRIETARIO del viaggio, anche quando carica un membro (architettura §6).
// «Già esistente» (risposta persa a un invio precedente) vale come riuscito solo se la dimensione nello Storage
// coincide con quella del file; altrimenti è un errore con «Riprova» e il file resta sul dispositivo.

export type UploadState = 'in_caricamento' | 'errore';

export interface UploadOutcome {
  uploaded: { id: string; path: string; at: string }[];
  errors: Record<string, string>;
  /** Allegati senza file su questo dispositivo (aggiunti da un altro): si caricano da lì */
  elsewhere: string[];
}

export async function uploadPending(
  trip: Trip,
  ownerId: string,
  storage: AttachmentStorage,
  readBlob: (id: string) => Promise<Blob | undefined>,
  onState?: (id: string, s: UploadState | undefined, error?: string) => void,
): Promise<UploadOutcome> {
  const out: UploadOutcome = { uploaded: [], errors: {}, elsewhere: [] };
  for (const { attachment: a } of notUploaded(trip)) {
    let blob: Blob | undefined;
    try {
      blob = await readBlob(a.id);
    } catch {
      blob = undefined;
    }
    if (!blob) {
      out.elsewhere.push(a.id);
      continue;
    }
    if (blob.size > ATTACHMENT_MAX_BYTES) {
      out.errors[a.id] = 'Il file supera 10 MB';
      onState?.(a.id, 'errore', out.errors[a.id]);
      continue;
    }
    const path = storagePath(ownerId, trip.id, a.id);
    onState?.(a.id, 'in_caricamento');
    try {
      if ((await storage.upload(path, blob, a.type)) === 'gia_presente') {
        const info = await storage.info(path).catch(() => undefined);
        if (info?.size === undefined) throw new Error("Nel cloud c'è già un file con questo nome e non se ne può leggere la dimensione");
        if (info.size !== blob.size) throw new Error(`Nel cloud c'è già un file con questo nome ma di dimensione diversa (${info.size} byte invece di ${blob.size})`);
      }
      out.uploaded.push({ id: a.id, path, at: new Date().toISOString() });
      onState?.(a.id, undefined);
    } catch (e) {
      out.errors[a.id] = e instanceof Error ? e.message : String(e);
      onState?.(a.id, 'errore', out.errors[a.id]);
      // Senza rete inutile continuare con gli altri: si riparte al ritorno della connessione
      if (e instanceof Error && /raggiungibile/.test(e.message)) break;
    }
  }
  return out;
}
