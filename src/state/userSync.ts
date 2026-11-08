import { useCallback, useEffect, useRef } from 'react';
import { getDeviceId } from '../services/storage/device';
import { restJson } from '../services/storage/supabase';
import { useCloudSync } from './cloudSync';
import { useTrip } from './store';
import { applyRemoteContext, contextToRow, getContext, markContextSent, rowToContext, setContext, subscribeContext, type UserContextRow } from './workContext';

// Preferenze di lavoro nel cloud (architettura §7.6): contesto per utente (user_context) e modalità per utente e
// dispositivo (user_devices). Upsert diretto, l'ultima scrittura vince. Senza rete restano le copie del dispositivo.

const MODE_KEY = 'nfhp.ui.mode';
const DELAY_MS = 2000;

function localMode(): 'planning' | 'travel' | null {
  try {
    const v = localStorage.getItem(MODE_KEY);
    return v === 'planning' || v === 'travel' ? v : null;
  } catch {
    return null;
  }
}

/** Modalità arrivata dal cloud per questo dispositivo */
function applyRemoteMode(mode: string | null | undefined): void {
  const cur = localMode();
  const next = mode === 'planning' || mode === 'travel' ? mode : null;
  if (cur === next) return;
  try {
    if (next) localStorage.setItem(MODE_KEY, next);
    else localStorage.removeItem(MODE_KEY);
  } catch {
    return;
  }
  window.dispatchEvent(new Event('nfhp-mode'));
}

export function useUserDataSync(): void {
  const { config, session } = useCloudSync();
  const { trip } = useTrip();
  const timer = useRef<number | undefined>(undefined);
  const ready = useRef(false);

  // Ultimo viaggio aperto
  useEffect(() => {
    if (session) setContext({ lastTripId: trip.id });
  }, [trip.id, session]);

  const upload = useCallback(async () => {
    if (!config || !session || !ready.current) return;
    const c = getContext();
    if (!c.dirty) return;
    try {
      const rows = await restJson<UserContextRow[]>(config, 'user_context?on_conflict=user_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(contextToRow(c, session.userId, getDeviceId())),
      });
      const at = rows?.[0]?.updated_at ?? new Date().toISOString();
      markContextSent(c.updatedAt, at);
    } catch {
      /* resta da inviare: si riprova alla prossima modifica o al ritorno della rete */
    }
  }, [config, session]);

  const uploadMode = useCallback(async () => {
    if (!config || !session) return;
    try {
      await restJson(config, 'user_devices?on_conflict=user_id,device_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ user_id: session.userId, device_id: getDeviceId(), mode: localMode(), label: navigator.userAgent.slice(0, 60), last_seen_at: new Date().toISOString() }),
      });
    } catch {
      /* la scelta resta su questo dispositivo */
    }
  }, [config, session]);

  // Dopo l'accesso: prima si scarica (un dispositivo nuovo ritrova il contesto), poi si inviano le modifiche di qui
  useEffect(() => {
    ready.current = false;
    if (!config || !session) return;
    let cancelled = false;
    void (async () => {
      try {
        const rows = await restJson<UserContextRow[]>(config, 'user_context?select=*');
        const r = rows?.[0];
        if (!cancelled && r?.updated_at) applyRemoteContext(rowToContext(r), r.updated_at);
        const dev = await restJson<{ mode: string | null }[]>(config, `user_devices?select=mode&device_id=eq.${encodeURIComponent(getDeviceId())}`);
        if (!cancelled && dev?.[0]) applyRemoteMode(dev[0].mode);
      } catch {
        /* senza rete o tabelle non ancora create: restano le copie del dispositivo */
      }
      if (cancelled) return;
      ready.current = true;
      await upload();
      await uploadMode();
    })();
    return () => {
      cancelled = true;
    };
  }, [config, session, upload, uploadMode]);

  // Ogni modifica del contesto o della modalità: invio dopo un attimo
  useEffect(() => {
    if (!config || !session) return;
    const later = () => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void upload(), DELAY_MS);
    };
    const unsub = subscribeContext(later);
    const onMode = () => void uploadMode();
    const onOnline = () => void upload();
    window.addEventListener('nfhp-mode', onMode);
    window.addEventListener('online', onOnline);
    return () => {
      unsub();
      window.clearTimeout(timer.current);
      window.removeEventListener('nfhp-mode', onMode);
      window.removeEventListener('online', onOnline);
    };
  }, [config, session, upload, uploadMode]);
}
