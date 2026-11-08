// Contesto di lavoro dell'utente (decisione 5 del piano): ultima vista di pianificazione, giornata e tappa scelte in
// modalità viaggio, messaggio di attivazione della proposta, elemento scelto nel Pianificatore, valori del configuratore,
// ultimo viaggio aperto. Fonte: tabella user_context; sul dispositivo resta la copia per l'uso senza rete
// (localStorage «nfhp.contesto.v1»). La modalità pianificazione/viaggio è per utente e dispositivo (user_devices, D2):
// copia locale «nfhp.ui.mode».
//
// Ultima scrittura vince (architettura §7.6): sono dati di lavoro, un conflitto non ha senso.

export interface WorkContext {
  lastPlanning?: string;
  travel?: unknown;
  activation?: unknown;
  plannerSel?: string;
  configurator?: Record<string, unknown>;
  lastTripId?: string;
  /** Ultima modifica fatta qui (ISO) */
  updatedAt?: string;
  /** updated_at del cloud dell'ultima copia ricevuta o inviata */
  cloudAt?: string;
  /** Modifiche fatte qui non ancora inviate */
  dirty?: boolean;
}

const KEY = 'nfhp.contesto.v1';
const LEGACY = {
  activation: 'nfhp.ui.activation',
  lastPlanning: 'nfhp.ui.lastPlanning',
  travel: 'nfhp.ui.travel',
  planner: 'nfhp.planner.ui',
  configurator: 'nfhp.configurator.v1',
};

let memo: WorkContext | undefined;
const listeners = new Set<() => void>();

function parse<T>(raw: string | null): T | undefined {
  try {
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

/** Prima lettura: se manca la copia nuova si raccolgono i valori salvati dalla versione precedente dell'app */
function initial(): WorkContext {
  try {
    const cur = parse<WorkContext>(localStorage.getItem(KEY));
    if (cur) return cur;
  } catch {
    return {};
  }
  const ss = (k: string) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  };
  const ls = (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  };
  const ctx: WorkContext = {
    activation: parse(ss(LEGACY.activation)),
    lastPlanning: parse<string>(ss(LEGACY.lastPlanning)),
    travel: parse(ss(LEGACY.travel)),
    plannerSel: parse<{ sel?: string }>(ss(LEGACY.planner))?.sel,
    configurator: parse(ls(LEGACY.configurator)),
  };
  for (const k of Object.keys(ctx) as (keyof WorkContext)[]) if (ctx[k] === undefined) delete ctx[k];
  if (Object.keys(ctx).length) {
    ctx.dirty = true;
    // Copiati nella copia nuova (salvata qui sotto): le chiavi vecchie non servono più
    try {
      localStorage.setItem(KEY, JSON.stringify(ctx));
      for (const k of [LEGACY.activation, LEGACY.lastPlanning, LEGACY.travel]) sessionStorage.removeItem(k);
      localStorage.removeItem(LEGACY.configurator);
    } catch {
      /* restano dove sono: si rileggono al prossimo avvio */
    }
  }
  return ctx;
}

export function getContext(): WorkContext {
  return (memo ??= initial());
}

function persist(c: WorkContext): void {
  memo = c;
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* senza spazio il contesto vale finché la pagina resta aperta */
  }
  listeners.forEach((l) => l());
}

/** Modifica fatta qui: si salva subito sul dispositivo e si invia al cloud appena possibile */
export function setContext(patch: Partial<WorkContext>): void {
  const cur = getContext();
  const next: WorkContext = { ...cur, ...patch, updatedAt: new Date().toISOString(), dirty: true };
  for (const k of Object.keys(patch) as (keyof WorkContext)[]) if (patch[k] === undefined) delete next[k];
  if (JSON.stringify({ ...cur, updatedAt: '', dirty: true }) === JSON.stringify({ ...next, updatedAt: '', dirty: true })) return;
  persist(next);
}

/** Copia arrivata dal cloud: sostituisce quella locale solo se qui non ci sono modifiche da inviare */
export function applyRemoteContext(remote: Omit<WorkContext, 'dirty' | 'updatedAt'>, cloudAt: string): boolean {
  const cur = getContext();
  if (cur.dirty) return false;
  if (cur.cloudAt && cur.cloudAt >= cloudAt) return false;
  persist({ ...remote, cloudAt, dirty: false });
  return true;
}

/** Invio riuscito */
export function markContextSent(sentAt: string | undefined, cloudAt: string): void {
  const cur = getContext();
  // Se nel frattempo è cambiato resta da inviare
  persist({ ...cur, cloudAt, dirty: cur.updatedAt !== sentAt });
}

export function subscribeContext(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Solo per i test e per l'uscita dall'account */
export function resetContext(): void {
  memo = undefined;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* niente da togliere */
  }
}

// ---------- Righe del database ----------

export interface UserContextRow {
  user_id?: string;
  last_trip_id?: string | null;
  last_planning?: string | null;
  travel_context?: unknown;
  activation_notice?: unknown;
  planner_selection?: unknown;
  configurator?: unknown;
  device_id?: string | null;
  updated_at?: string;
}

export function contextToRow(c: WorkContext, userId: string, deviceId: string): UserContextRow {
  return {
    user_id: userId,
    last_trip_id: c.lastTripId ?? null,
    last_planning: c.lastPlanning ?? null,
    travel_context: c.travel ?? null,
    activation_notice: c.activation ?? null,
    planner_selection: c.plannerSel ? { sel: c.plannerSel } : null,
    configurator: c.configurator ?? null,
    device_id: deviceId,
  };
}

export function rowToContext(r: UserContextRow): Omit<WorkContext, 'dirty' | 'updatedAt'> {
  const out: WorkContext = {
    lastTripId: r.last_trip_id ?? undefined,
    lastPlanning: r.last_planning ?? undefined,
    travel: r.travel_context ?? undefined,
    activation: r.activation_notice ?? undefined,
    plannerSel: (r.planner_selection as { sel?: string } | null)?.sel,
    configurator: (r.configurator as Record<string, unknown> | null) ?? undefined,
  };
  for (const k of Object.keys(out) as (keyof WorkContext)[]) if (out[k] === undefined) delete out[k];
  return out;
}

/** Rilegge la copia del dispositivo (dopo uscita o cambio utente) */
export function reloadContext(): void {
  memo = undefined;
  listeners.forEach((l) => l());
}
