import type { DiaryAttachment, Trip } from './types';

// Allegati del diario nel cloud (D5): immagini comuni e PDF, al massimo 10 MB per file, spazio di 1 GB.
// Gli stessi limiti li applica il bucket «diario-allegati» (supabase/migrations/20261106000500_storage.sql):
// l'app li controlla prima di salvare per dirlo subito.

export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf'];
/** Valore per l'attributo accept del campo file */
export const ATTACHMENT_ACCEPT = 'image/*,application/pdf';
export const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;
export const STORAGE_WARN_RATIO = 0.8;

const mb = (n: number) => (n / (1024 * 1024)).toLocaleString('it-IT', { maximumFractionDigits: 1 });
export const formatMb = mb;

/** Motivo per cui un file non si allega; undefined se va bene */
export function attachmentProblem(f: { name: string; type: string; size: number }): string | undefined {
  if (!ATTACHMENT_TYPES.includes(f.type)) return `${f.name} non allegato: sono ammessi solo immagini e PDF.`;
  if (f.size > ATTACHMENT_MAX_BYTES) return `${f.name} non allegato: pesa ${mb(f.size)} MB, il massimo è 10 MB.`;
  return undefined;
}

/** Percorso nello Storage: {owner_id}/{trip_id}/{attachment_id} (il nome è l'id: nessun doppione nei reinvii) */
export function storagePath(ownerId: string, tripId: string, attachmentId: string): string {
  return `${ownerId}/${tripId}/${attachmentId}`;
}

export interface AttachmentRef {
  entryId: string;
  attachment: DiaryAttachment;
}

/** Allegati delle voci non eliminate, non ancora nel cloud */
export function notUploaded(t: Trip): AttachmentRef[] {
  const out: AttachmentRef[] = [];
  for (const e of t.diary ?? []) {
    if (e.deletedAt) continue;
    for (const a of e.attachments ?? []) if (a.state !== 'nel_cloud') out.push({ entryId: e.id, attachment: a });
  }
  return out;
}

/** Segna un allegato come caricato (dopo la conferma dello Storage) */
export function markUploaded(t: Trip, attachmentId: string, path: string, at: string): Trip {
  let changed = false;
  const diary = (t.diary ?? []).map((e) => {
    if (!e.attachments?.some((a) => a.id === attachmentId && a.state !== 'nel_cloud')) return e;
    changed = true;
    return {
      ...e,
      attachments: e.attachments.map((a) => {
        if (a.id !== attachmentId) return a;
        const { error: _e, ...rest } = a;
        void _e;
        return { ...rest, state: 'nel_cloud' as const, storagePath: path, uploadedAt: at };
      }),
    };
  });
  return changed ? { ...t, diary } : t;
}

/** Spazio usato in percentuale e se va dato l'avviso (oltre l'80%) */
export function usageInfo(usedBytes: number, limitBytes = STORAGE_LIMIT_BYTES): { pct: number; warn: boolean } {
  const pct = limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 0;
  return { pct, warn: usedBytes >= limitBytes * STORAGE_WARN_RATIO };
}
