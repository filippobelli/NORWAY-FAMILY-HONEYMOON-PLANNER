import type { Accommodation, Activity, CoastalOption, Flight, Segment, SourceRef, TripSettings, Verification } from './types';

// Verifica delle informazioni che cambiano (orari, disponibilità, durate): è un concetto diverso dalla prenotazione.
// Una verifica dice «controllato sulla fonte il giorno X», mai «prenotato». Regola esplicita per «Da ricontrollare»:
// una verifica più vecchia di `recheckAfterDays` giorni (predefinito 30) va rifatta.
// I viaggi salvati prima non hanno il campo `verification`: lo stato si ricava dai campi esistenti, senza riscriverli.

export type InfoState = 'da_verificare' | 'verificata' | 'da_ricontrollare';

export const INFO_STATE_LABEL: Record<InfoState, string> = {
  da_verificare: 'Da verificare',
  verificata: 'Verificata',
  da_ricontrollare: 'Da ricontrollare',
};

export const DEFAULT_RECHECK_DAYS = 30;

export interface InfoStatus {
  state: InfoState;
  checkedAt?: string;
  source?: SourceRef;
  /** Spiegazione breve dello stato */
  why: string;
}

const DAY_MS = 86_400_000;
const FIRM = ['confermato', 'prenotato', 'pagato'];

export const recheckDays = (settings?: Partial<TripSettings>) => Math.max(1, Math.round(settings?.recheckAfterDays ?? DEFAULT_RECHECK_DAYS));

const fmt = (iso: string) => new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });

function resolve(v: Verification | undefined, legacyVerified: boolean, legacySource: SourceRef | undefined, what: string, settings: Partial<TripSettings> | undefined, now: Date): InfoStatus {
  const verified = v ? v.state === 'verificata' : legacyVerified;
  const source = v?.source ?? legacySource;
  const checkedAt = v ? v.checkedAt : legacyVerified ? legacySource?.checkedAt : undefined;
  if (!verified) return { state: 'da_verificare', source, why: `${what} non ancora controllato sulla fonte` };
  if (checkedAt) {
    const age = (now.getTime() - new Date(checkedAt).getTime()) / DAY_MS;
    const limit = recheckDays(settings);
    if (Number.isFinite(age) && age > limit) return { state: 'da_ricontrollare', checkedAt, source, why: `Controllato il ${fmt(checkedAt)}, più di ${limit} giorni fa` };
    return { state: 'verificata', checkedAt, source, why: `Controllato il ${fmt(checkedAt)}${source?.url ? '' : ' · fonte non indicata'}` };
  }
  return { state: 'verificata', source, why: `Segnato come verificato · data del controllo non registrata${source?.url ? '' : ' · fonte non indicata'}` };
}

/** Orario e durata di traghetti, navi, treni, bus e voli interni. La strada calcolata non ha orari: nessuno stato. */
export function segmentInfo(s: Segment, settings?: Partial<TripSettings>, now = new Date()): InfoStatus | undefined {
  if (s.mode === 'strada' || s.mode === 'non_calcolato') return undefined;
  return resolve(s.verification, FIRM.includes(s.status), s.source, 'Orario', settings, now);
}

/** Disponibilità e prezzo di un alloggio. «Individuata» non vuol dire disponibile. */
export function accommodationInfo(a: Accommodation, settings?: Partial<TripSettings>, now = new Date()): InfoStatus {
  const legacy = a.status === 'disponibile' || a.status === 'opzionata' || a.status === 'prenotata';
  return resolve(a.verification, legacy, a.source, 'Disponibilità', settings, now);
}

export function flightInfo(f: Flight, settings?: Partial<TripSettings>, now = new Date()): InfoStatus {
  return resolve(f.verification, FIRM.includes(f.priceStatus), f.source, 'Orario e prezzo', settings, now);
}

export function coastalInfo(o: CoastalOption, settings?: Partial<TripSettings>, now = new Date()): InfoStatus {
  return resolve(o.verification, FIRM.includes(o.priceStatus), o.source, 'Orario e prezzo', settings, now);
}

export function activityInfo(a: Activity, settings?: Partial<TripSettings>, now = new Date()): InfoStatus {
  return resolve(a.verification, a.costStatus === 'confermato' || a.costStatus === 'prenotato' || a.costStatus === 'pagato', undefined, 'Orario e apertura', settings, now);
}

/** Verifica fatta adesso, con la fonte indicata dall'utente (facoltativa). */
export function verifiedNow(source?: SourceRef, now = new Date()): Verification {
  return { state: 'verificata', checkedAt: now.toISOString(), source: source ? { ...source, checkedAt: now.toISOString() } : undefined };
}
