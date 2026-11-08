import { useEffect, useRef, useSyncExternalStore } from 'react';
import { markUploaded } from '../domain/attachments';
import { cloudAttachments } from '../services/storage/attachmentsCloud';
import { uploadPending, type UploadState } from '../services/storage/attachmentUploader';
import { getBlob } from '../services/storage/blobs';
import { restJson } from '../services/storage/supabase';
import { useCloudSync } from './cloudSync';
import { useTrip } from './store';
import { useOnline } from './uiContext';

// Stato del caricamento per allegato (solo in memoria: è lo stato di questa pagina, non un dato)
const states = new Map<string, { s: UploadState; error?: string }>();
const listeners = new Set<() => void>();
let version = 0;
function setUpload(id: string, s: UploadState | undefined, error?: string) {
  if (s) states.set(id, { s, error });
  else states.delete(id);
  version++;
  listeners.forEach((l) => l());
}
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export function useUploadState(id: string): { s: UploadState; error?: string } | undefined {
  useSyncExternalStore(subscribe, () => version, () => version);
  return states.get(id);
}

let retryNow: (() => void) | undefined;
/** «Riprova» su un allegato: riparte il caricamento */
export const retryUploads = () => retryNow?.();

/**
 * Carica nel cloud gli allegati di questo dispositivo quando il viaggio è nel formato a righe e i metadati sono già
 * confermati (lo Storage accetta il file solo se la riga dell'allegato esiste nel cloud).
 */
export function useAttachmentUploads(): void {
  const { trip, update, toast } = useTrip();
  const { config, session, status, pending, rowsFormat } = useCloudSync();
  const online = useOnline();
  const running = useRef(false);
  // Proprietario del viaggio (percorso nello Storage), letto una volta per viaggio
  const owner = useRef<{ trip: string; id: string } | undefined>(undefined);
  const tripRef = useRef(trip);
  tripRef.current = trip;
  const ready = Boolean(config && session && rowsFormat && status === 'sincronizzato' && !pending && online);
  const waiting = trip.diary?.some((e) => !e.deletedAt && e.attachments?.some((a) => a.state !== 'nel_cloud' && !states.has(a.id)));

  useEffect(() => {
    if (!ready || !config || !session) return;
    const run = async () => {
      if (running.current) return;
      running.current = true;
      try {
        const t = tripRef.current;
        if (owner.current?.trip !== t.id) {
          const rows = await restJson<{ owner_id: string }[]>(config, `trips?select=owner_id&id=eq.${encodeURIComponent(t.id)}`).catch(() => null);
          const id = rows?.[0]?.owner_id;
          if (!id) return;
          owner.current = { trip: t.id, id };
        }
        const r = await uploadPending(t, owner.current.id, cloudAttachments(config), getBlob, setUpload);
        if (r.uploaded.length) {
          update((t) => r.uploaded.reduce((acc, u) => markUploaded(acc, u.id, u.path, u.at), t), { immediate: true });
          toast(`${r.uploaded.length} ${r.uploaded.length === 1 ? 'allegato caricato' : 'allegati caricati'} nel cloud`);
        }
      } finally {
        running.current = false;
      }
    };
    retryNow = () => {
      for (const [id, v] of states) if (v.s === 'errore') states.delete(id);
      void run();
    };
    if (waiting) void run();
  }, [ready, waiting, config, session, update, toast]);
}
