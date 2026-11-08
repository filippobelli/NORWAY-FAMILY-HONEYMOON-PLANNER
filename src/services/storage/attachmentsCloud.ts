import { CloudError, rpc, storageFetch, type CloudConfig } from './supabase';

// Allegati nello Storage privato «diario-allegati». Nessuna sovrascrittura (non c'è policy UPDATE): un reinvio dopo
// una risposta persa riceve «già esistente» e vale come riuscito. Lettura solo con link firmati temporanei.

const BUCKET = 'diario-allegati';
const enc = (path: string) => path.split('/').map(encodeURIComponent).join('/');

export interface AttachmentStorage {
  upload(path: string, blob: Blob, type: string): Promise<'caricato' | 'gia_presente'>;
  /** Dimensione del file nello Storage (undefined se non leggibile) */
  info(path: string): Promise<{ size?: number } | undefined>;
  signedUrl(path: string): Promise<string>;
  remove(path: string): Promise<void>;
  usage(): Promise<{ userBytes: number; bucketBytes: number; limitBytes: number }>;
}

async function message(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { message?: string; error?: string };
    return j.message ?? j.error ?? `Errore ${res.status}`;
  } catch {
    return `Errore ${res.status}`;
  }
}

export function cloudAttachments(cfg: CloudConfig): AttachmentStorage {
  return {
    upload: async (path, blob, type) => {
      const res = await storageFetch(cfg, `object/${BUCKET}/${enc(path)}`, { method: 'POST', body: blob, headers: { 'Content-Type': type || 'application/octet-stream', 'x-upsert': 'false', 'cache-control': '3600' } });
      if (res.ok) return 'caricato';
      const msg = await message(res);
      // File già caricato da un invio precedente (risposta persa): non si sovrascrive, vale come riuscito
      if (res.status === 409 || /already exists|Duplicate/i.test(msg)) return 'gia_presente';
      if (res.status === 413 || /size|too large/i.test(msg)) throw new CloudError('File troppo grande per lo spazio del cloud (massimo 10 MB)', res.status);
      if (/mime|type/i.test(msg)) throw new CloudError('Tipo di file non ammesso: solo immagini e PDF', res.status);
      throw new CloudError(msg, res.status);
    },
    info: async (path) => {
      // Metadati dell'oggetto (API Storage «object/info»); in alternativa la lunghezza dalla risposta HEAD
      const res = await storageFetch(cfg, `object/info/authenticated/${BUCKET}/${enc(path)}`);
      if (res.ok) {
        try {
          const j = (await res.json()) as { size?: unknown; metadata?: { size?: unknown } };
          const size = Number(j.size ?? j.metadata?.size);
          if (Number.isFinite(size)) return { size };
        } catch {
          /* risposta non JSON: si prova con HEAD */
        }
      }
      const head = await storageFetch(cfg, `object/authenticated/${BUCKET}/${enc(path)}`, { method: 'HEAD' });
      const len = Number(head.headers.get('content-length'));
      return head.ok && Number.isFinite(len) ? { size: len } : undefined;
    },
    signedUrl: async (path) => {
      const res = await storageFetch(cfg, `object/sign/${BUCKET}/${enc(path)}`, { method: 'POST', body: JSON.stringify({ expiresIn: 600 }) });
      if (!res.ok) throw new CloudError(await message(res), res.status);
      const j = (await res.json()) as { signedURL?: string; signedUrl?: string };
      const u = j.signedURL ?? j.signedUrl;
      if (!u) throw new CloudError('Link al file non disponibile');
      return u.startsWith('http') ? u : `${cfg.url}/storage/v1${u.startsWith('/') ? '' : '/'}${u}`;
    },
    remove: async (path) => {
      const res = await storageFetch(cfg, `object/${BUCKET}/${enc(path)}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw new CloudError(await message(res), res.status);
    },
    usage: async () => {
      const rows = await rpc<{ user_bytes: number; bucket_bytes: number; limit_bytes: number }[] | { user_bytes: number; bucket_bytes: number; limit_bytes: number }>(cfg, 'attachments_usage', {});
      const r = Array.isArray(rows) ? rows[0] : rows;
      return { userBytes: Number(r?.user_bytes ?? 0), bucketBytes: Number(r?.bucket_bytes ?? 0), limitBytes: Number(r?.limit_bytes ?? 1073741824) };
    },
  };
}
