import { normalizeTrip } from '../../domain/defaults';
import type { Trip } from '../../domain/types';

// Client minimo per Supabase via REST (Auth + PostgREST), senza dipendenze.
// Usa solo URL del progetto e anon key (pubblici). La sicurezza dei dati è garantita dalle
// policy Row Level Security definite in supabase/schema.sql.

export interface CloudConfig {
  url: string;
  anonKey: string;
}

export interface CloudSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  email: string;
}

export interface CloudTripRow {
  id: string;
  title: string;
  updated_at: string;
}

const CONFIG_KEY = 'nfhp.cloud.config';
const SESSION_KEY = 'nfhp.cloud.session';

function env(name: string): string | undefined {
  try {
    const v = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[name];
    return v && v.trim() ? v.trim() : undefined;
  } catch {
    return undefined;
  }
}

export function getCloudConfig(): CloudConfig | undefined {
  const url = env('VITE_SUPABASE_URL');
  const anonKey = env('VITE_SUPABASE_ANON_KEY');
  if (url && anonKey) return { url: url.replace(/\/$/, ''), anonKey };
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const c = JSON.parse(raw) as CloudConfig;
      if (c.url && c.anonKey) return c;
    }
  } catch {
    /* configurazione assente */
  }
  return undefined;
}

export function isConfigFromEnv(): boolean {
  return Boolean(env('VITE_SUPABASE_URL') && env('VITE_SUPABASE_ANON_KEY'));
}

export function saveCloudConfig(c: CloudConfig | undefined): void {
  if (c) localStorage.setItem(CONFIG_KEY, JSON.stringify({ url: c.url.trim().replace(/\/$/, ''), anonKey: c.anonKey.trim() }));
  else localStorage.removeItem(CONFIG_KEY);
}

export function loadSession(): CloudSession | undefined {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as CloudSession) : undefined;
  } catch {
    return undefined;
  }
}

function storeSession(s: CloudSession | undefined): void {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

export class CloudError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'CloudError';
  }
}

interface AuthResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { id: string; email?: string };
  msg?: string;
  error_description?: string;
  message?: string;
}

async function call(cfg: CloudConfig, path: string, init: RequestInit & { token?: string } = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  // apikey: chiave pubblica (publishable "sb_publishable_..." o legacy anon).
  // Authorization solo con il token dell'utente: le chiavi publishable non sono JWT.
  headers.set('apikey', cfg.anonKey);
  if (init.token) headers.set('Authorization', `Bearer ${init.token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  try {
    return await fetch(`${cfg.url}${path}`, { ...init, headers });
  } catch {
    throw new CloudError('Server cloud non raggiungibile. I dati restano salvati in locale.');
  }
}

async function authError(res: Response): Promise<CloudError> {
  let msg = `Errore ${res.status}`;
  try {
    const j = (await res.json()) as AuthResponse;
    msg = j.error_description ?? j.msg ?? j.message ?? msg;
  } catch {
    /* corpo non JSON */
  }
  return new CloudError(msg, res.status);
}

function toSession(j: AuthResponse, fallbackEmail: string): CloudSession {
  if (!j.access_token || !j.refresh_token || !j.user) throw new CloudError('Risposta di autenticazione incompleta');
  return {
    accessToken: j.access_token,
    refreshToken: j.refresh_token,
    expiresAt: Date.now() + (j.expires_in ?? 3600) * 1000,
    userId: j.user.id,
    email: j.user.email ?? fallbackEmail,
  };
}

export async function signIn(cfg: CloudConfig, email: string, password: string): Promise<CloudSession> {
  const res = await call(cfg, '/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (!res.ok) throw await authError(res);
  const s = toSession((await res.json()) as AuthResponse, email);
  storeSession(s);
  return s;
}

/** Registrazione: se il progetto richiede conferma email, la sessione arriva solo dopo la conferma. */
export async function signUp(cfg: CloudConfig, email: string, password: string): Promise<CloudSession | 'conferma_email'> {
  const res = await call(cfg, '/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (!res.ok) throw await authError(res);
  const j = (await res.json()) as AuthResponse;
  if (!j.access_token) return 'conferma_email';
  const s = toSession(j, email);
  storeSession(s);
  return s;
}

export async function signOut(cfg: CloudConfig, s: CloudSession | undefined): Promise<void> {
  if (s) {
    try {
      await call(cfg, '/auth/v1/logout', { method: 'POST', token: s.accessToken });
    } catch {
      /* logout locale comunque */
    }
  }
  storeSession(undefined);
}

async function validSession(cfg: CloudConfig): Promise<CloudSession> {
  const s = loadSession();
  if (!s) throw new CloudError('Accesso al cloud non effettuato', 401);
  if (s.expiresAt - Date.now() > 60_000) return s;
  const res = await call(cfg, '/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: s.refreshToken }),
  });
  if (!res.ok) {
    storeSession(undefined);
    throw new CloudError('Sessione scaduta: accedi di nuovo', 401);
  }
  const ns = toSession((await res.json()) as AuthResponse, s.email);
  storeSession(ns);
  return ns;
}

async function restError(res: Response): Promise<CloudError> {
  let detail = '';
  try {
    const j = (await res.json()) as { message?: string; hint?: string };
    detail = j.message ?? '';
  } catch {
    /* corpo non JSON */
  }
  if (res.status === 404 || /relation .* does not exist|Could not find the table/i.test(detail)) {
    return new CloudError('Tabella "trips" non trovata: esegui supabase/schema.sql nel progetto Supabase.', res.status);
  }
  return new CloudError(`Errore cloud ${res.status}${detail ? `: ${detail}` : ''}`, res.status);
}

export async function listCloudTrips(cfg: CloudConfig): Promise<CloudTripRow[]> {
  const s = await validSession(cfg);
  const res = await call(cfg, '/rest/v1/trips?select=id,title,updated_at&order=updated_at.desc', { token: s.accessToken });
  if (!res.ok) throw await restError(res);
  return (await res.json()) as CloudTripRow[];
}

export async function getCloudTripMeta(cfg: CloudConfig, id: string): Promise<CloudTripRow | undefined> {
  const s = await validSession(cfg);
  const res = await call(cfg, `/rest/v1/trips?select=id,title,updated_at&id=eq.${encodeURIComponent(id)}`, { token: s.accessToken });
  if (!res.ok) throw await restError(res);
  const rows = (await res.json()) as CloudTripRow[];
  return rows[0];
}

export async function loadCloudTrip(cfg: CloudConfig, id: string): Promise<{ trip: Trip; updatedAt: string }> {
  const s = await validSession(cfg);
  const res = await call(cfg, `/rest/v1/trips?select=data,updated_at&id=eq.${encodeURIComponent(id)}`, { token: s.accessToken });
  if (!res.ok) throw await restError(res);
  const rows = (await res.json()) as { data: unknown; updated_at: string }[];
  const row = rows[0];
  if (!row) throw new CloudError('Viaggio non trovato nel cloud', 404);
  return { trip: normalizeTrip(row.data), updatedAt: row.updated_at };
}

/** Salva (upsert). Restituisce updated_at del server: il salvataggio è confermato solo così. */
export async function saveCloudTrip(cfg: CloudConfig, trip: Trip): Promise<string> {
  const s = await validSession(cfg);
  const res = await call(cfg, '/rest/v1/trips?on_conflict=id', {
    method: 'POST',
    token: s.accessToken,
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ id: trip.id, title: trip.title, schema_version: trip.schemaVersion, data: trip }),
  });
  if (!res.ok) throw await restError(res);
  const rows = (await res.json()) as { updated_at?: string }[];
  const updatedAt = rows[0]?.updated_at;
  if (!updatedAt) throw new CloudError('Il server non ha confermato il salvataggio');
  return updatedAt;
}
