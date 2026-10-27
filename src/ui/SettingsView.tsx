import { useRef, useState } from 'react';
import { createEmptyTrip } from '../domain/defaults';
import { exportTripFile, readTripFile } from '../services/storage/local';
import {
  CloudError,
  getCloudConfig,
  getCloudTripMeta,
  isConfigFromEnv,
  listCloudTrips,
  loadCloudTrip,
  loadSession,
  saveCloudConfig,
  saveCloudTrip,
  signIn,
  signOut,
  type CloudSession,
  type CloudTripRow,
} from '../services/storage/supabase';
import { useTrip } from '../state/store';
import { Badge, Field, fmtDateTime, NumberInput } from './common';

const syncKey = (id: string) => `nfhp.cloud.lastSync.${id}`;
const getLastSync = (id: string) => {
  try {
    return localStorage.getItem(syncKey(id)) ?? undefined;
  } catch {
    return undefined;
  }
};
const setLastSync = (id: string, v: string) => {
  try {
    localStorage.setItem(syncKey(id), v);
  } catch {
    /* ignorato */
  }
};

export function SettingsView() {
  const { trip, update, replace, toast } = useTrip();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="settings">
      <section className="panel">
        <h2>Viaggio</h2>
        <div className="grid-4">
          <Field label="Titolo">{(id) => <input id={id} value={trip.title} onChange={(e) => update((t) => ({ ...t, title: e.target.value }))} />}</Field>
          <Field label="Data di partenza" hint={trip.dateTentative ? 'Provvisoria' : 'Confermata'}>
            {(id) => (
              <input
                id={id}
                type="date"
                value={trip.startDate}
                min="2027-07-01"
                max="2027-09-30"
                onChange={(e) => e.target.value && update((t) => ({ ...t, startDate: e.target.value }))}
              />
            )}
          </Field>
          <Field label="Date">
            {(id) => (
              <select id={id} value={trip.dateTentative ? 'p' : 'c'} onChange={(e) => update((t) => ({ ...t, dateTentative: e.target.value === 'p' }))}>
                <option value="p">Provvisorie</option>
                <option value="c">Decise</option>
              </select>
            )}
          </Field>
          <Field label="Soglia trasferimenti al giorno (min)" hint="Oltre questa soglia la giornata è segnalata">
            {(id) => (
              <NumberInput
                id={id}
                value={trip.settings.maxTravelMinPerDay}
                min={60}
                onChange={(v) => v && update((t) => ({ ...t, settings: { ...t.settings, maxTravelMinPerDay: v } }))}
              />
            )}
          </Field>
          <Field label="Adulti">
            {(id) => (
              <NumberInput id={id} value={trip.participants.adults} min={1} onChange={(v) => v && update((t) => ({ ...t, participants: { ...t.participants, adults: v } }))} />
            )}
          </Field>
          <Field label="Età bambini (ad agosto 2027)" hint="Separate da virgola">
            {(id) => (
              <input
                id={id}
                defaultValue={trip.participants.childrenAges.join(', ')}
                onBlur={(e) => {
                  const ages = e.target.value
                    .split(',')
                    .map((x: string) => Number(x.trim()))
                    .filter((x: number) => Number.isFinite(x) && x >= 0 && x < 18);
                  update((t) => ({ ...t, participants: { ...t.participants, childrenAges: ages } }));
                }}
              />
            )}
          </Field>
          <Field label="Mappa">
            {(id) => (
              <select
                id={id}
                value={trip.settings.showCatalogOnMap ? 's' : 'n'}
                onChange={(e) => update((t) => ({ ...t, settings: { ...t.settings, showCatalogOnMap: e.target.value === 's' } }))}
              >
                <option value="s">Mostra il catalogo</option>
                <option value="n">Solo le tappe</option>
              </select>
            )}
          </Field>
        </div>
      </section>

      <CloudPanel />

      <section className="panel">
        <h2>Backup su file</h2>
        <p className="muted">Funziona sempre, anche senza cloud. Utile per spostare il progetto tra dispositivi o tenerne una copia.</p>
        <div className="row wrap">
          <button className="btn" onClick={() => exportTripFile(trip)}>
            Esporta JSON
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Importa JSON…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try {
                const t = await readTripFile(f);
                if (window.confirm(`Sostituire il viaggio attuale con "${t.title}"? Consiglio: esporta prima un backup.`)) {
                  replace(t);
                  toast('Viaggio importato');
                }
              } catch (err) {
                toast(`File non valido: ${(err as Error).message}`, 'errore');
              }
            }}
          />
          <button
            className="btn danger"
            onClick={() => {
              if (window.confirm('Creare un viaggio vuoto? Il viaggio attuale verrà sostituito in questo browser (esporta prima un backup).')) {
                replace(createEmptyTrip());
              }
            }}
          >
            Nuovo viaggio vuoto
          </button>
        </div>
      </section>
    </div>
  );
}

function CloudPanel() {
  const { trip, replace, toast } = useTrip();
  const [cfg, setCfg] = useState(getCloudConfig);
  const [session, setSession] = useState<CloudSession | undefined>(loadSession);
  const [url, setUrl] = useState(cfg?.url ?? '');
  const [key, setKey] = useState(cfg?.anonKey ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<CloudTripRow[] | null>(null);
  const [lastSync, setLastSyncState] = useState(() => getLastSync(trip.id));

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      const msg = e instanceof CloudError ? e.message : `Errore: ${(e as Error).message}`;
      toast(msg, 'errore');
      if (e instanceof CloudError && e.status === 401) setSession(loadSession());
    } finally {
      setBusy(false);
    }
  };

  const doSave = () =>
    run(async () => {
      if (!cfg) return;
      const remote = await getCloudTripMeta(cfg, trip.id);
      const known = getLastSync(trip.id);
      if (remote && (!known || remote.updated_at > known)) {
        const ok = window.confirm(
          `Nel cloud c'è una versione di questo viaggio modificata il ${fmtDateTime(remote.updated_at)}, più recente dell'ultima sincronizzazione da questo dispositivo.\n\nOK = sovrascrivi il cloud con la versione locale\nAnnulla = non salvare (potrai caricare quella del cloud)`,
        );
        if (!ok) return;
      }
      const at = await saveCloudTrip(cfg, trip);
      setLastSync(trip.id, at);
      setLastSyncState(at);
      toast(`Salvato nel cloud (${fmtDateTime(at)})`);
    });

  if (!cfg) {
    return (
      <section className="panel">
        <h2>
          Salvataggio cloud <Badge tone="warn">non configurato</Badge>
        </h2>
        <p>
          Stai usando la <strong>modalità locale</strong>: i dati sono salvati solo in questo browser. Per ritrovarli da altri dispositivi collega un
          progetto Supabase (gratuito) seguendo il README, poi inserisci qui URL e anon key — oppure impostale nel file <code>.env.local</code>.
        </p>
        <div className="grid-2">
          <Field label="URL progetto Supabase">{(id) => <input id={id} type="url" placeholder="https://xxxx.supabase.co" value={url} onChange={(e) => setUrl(e.target.value)} />}</Field>
          <Field label="Anon key (pubblica)" hint="Mai la service_role key">
            {(id) => <input id={id} value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" />}
          </Field>
        </div>
        <button
          className="btn btn-primary"
          disabled={!/^https:\/\/.+/.test(url) || key.length < 20}
          onClick={() => {
            saveCloudConfig({ url, anonKey: key });
            setCfg(getCloudConfig());
          }}
        >
          Collega
        </button>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>
        Salvataggio cloud <Badge tone="info">Supabase</Badge>
      </h2>
      <p className="muted small">
        Progetto: {cfg.url} {isConfigFromEnv() ? '(da .env)' : ''}
        {!isConfigFromEnv() && (
          <button
            className="link-btn"
            onClick={() => {
              saveCloudConfig(undefined);
              setCfg(undefined);
            }}
          >
            scollega
          </button>
        )}
      </p>
      {!session ? (
        <form
          className="grid-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const s = await signIn(cfg, email, password);
              setSession(s);
              toast('Accesso effettuato');
            });
          }}
        >
          <Field label="Email">{(id) => <input id={id} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
          <Field label="Password">
            {(id) => <input id={id} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
          <div className="row">
            <button className="btn btn-primary" type="submit" disabled={busy || !email || password.length < 6}>
              Accedi
            </button>

          </div>
        </form>
      ) : (
        <>
          <p>
            Accesso come <strong>{session.email}</strong>{' '}
            <button
              className="link-btn"
              onClick={() =>
                run(async () => {
                  await signOut(cfg, session);
                  setSession(undefined);
                })
              }
            >
              esci
            </button>
          </p>
          <p className="muted small">Ultima sincronizzazione di questo viaggio da qui: {lastSync ? fmtDateTime(lastSync) : 'mai'}</p>
          <div className="row wrap">
            <button className="btn btn-primary" disabled={busy} onClick={doSave}>
              {busy ? 'Attendi…' : 'Salva nel cloud'}
            </button>
            <button className="btn" disabled={busy} onClick={() => run(async () => setRows(await listCloudTrips(cfg)))}>
              Viaggi salvati nel cloud
            </button>
          </div>
          {rows && (
            <ul className="osm-results">
              {rows.length === 0 && <li className="muted">Nessun viaggio salvato.</li>}
              {rows.map((r) => (
                <li key={r.id}>
                  <div>
                    <strong>{r.title}</strong> <span className="muted small">modificato {fmtDateTime(r.updated_at)}</span>{' '}
                    {r.id === trip.id && <Badge tone="info">questo</Badge>}
                  </div>
                  <button
                    className="btn btn-small"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        if (!window.confirm(`Caricare "${r.title}" dal cloud? Il viaggio aperto in questo browser verrà sostituito.`)) return;
                        const { trip: t, updatedAt } = await loadCloudTrip(cfg, r.id);
                        replace(t);
                        setLastSync(t.id, updatedAt);
                        setLastSyncState(updatedAt);
                        toast('Viaggio caricato dal cloud');
                      })
                    }
                  >
                    Carica
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
