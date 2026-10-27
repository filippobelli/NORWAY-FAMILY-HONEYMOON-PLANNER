import { useRef, useState } from 'react';
import { createEmptyTrip } from '../domain/defaults';
import { exportTripFile, readTripFile } from '../services/storage/local';
import { CloudError, isConfigFromEnv, listCloudTrips, saveCloudConfig, signIn, signOut, type CloudTripRow } from '../services/storage/supabase';
import { useCloudSync } from '../state/cloudSync';
import { useTrip } from '../state/store';
import { Badge, Field, fmtDateTime, NumberInput } from './common';

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

      <section className="panel">
        <h2>Ipotesi per le stime realistiche</h2>
        <p className="muted small">
          Non sono dati verificati: sono regole di prudenza per una famiglia con bambini. Servono a passare dai tempi teorici a quelli realistici e a
          valutare il carico delle giornate.
        </p>
        <div className="grid-4">
          {(
            [
              ['breakEveryMin', 'Sosta ogni (minuti di guida)', 30],
              ['breakMin', 'Durata di ogni sosta (min)', 0],
              ['defaultFerryWaitMin', 'Attesa al traghetto se non inserita (min)', 0],
              ['activeDayMin', 'Tempo attivo al giorno (min)', 120],
              ['mealBreaksMin', 'Pause pasto al giorno (min)', 0],
              ['marginPct', 'Margine imprevisti (%)', 0],
            ] as const
          ).map(([key, label, min]) => (
            <Field key={key} label={label}>
              {(id) => (
                <NumberInput
                  id={id}
                  value={trip.settings[key]}
                  min={min}
                  onChange={(v) => v !== undefined && v >= min && update((t) => ({ ...t, settings: { ...t.settings, [key]: v } }))}
                />
              )}
            </Field>
          ))}
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
  const { trip, toast } = useTrip();
  const cloud = useCloudSync();
  const cfg = cloud.config;
  const session = cloud.session;
  const [url, setUrl] = useState(cfg?.url ?? '');
  const [key, setKey] = useState(cfg?.anonKey ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<CloudTripRow[] | null>(null);
  const [confirmLoad, setConfirmLoad] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      const msg = e instanceof CloudError ? e.message : `Errore: ${(e as Error).message}`;
      toast(msg, 'errore');
      if (e instanceof CloudError && e.status === 401) cloud.setSession(undefined);
    } finally {
      setBusy(false);
    }
  };

  if (!cfg) {
    return (
      <section className="panel">
        <h2>
          Salvataggio cloud <Badge tone="warn">non configurato</Badge>
        </h2>
        <p>
          Stai usando la <strong>modalità locale</strong>: i dati sono salvati solo in questo browser. Per ritrovarli da altri dispositivi collega un
          progetto Supabase seguendo il README, poi inserisci qui URL e chiave pubblica — oppure impostale nel file <code>.env</code>.
        </p>
        <div className="grid-2">
          <Field label="URL progetto Supabase">{(id) => <input id={id} type="url" placeholder="https://xxxx.supabase.co" value={url} onChange={(e) => setUrl(e.target.value)} />}</Field>
          <Field label="Chiave pubblica (publishable o anon)" hint="Mai la secret/service_role key">
            {(id) => <input id={id} value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" />}
          </Field>
        </div>
        <button
          className="btn btn-primary"
          disabled={!/^https:\/\/.+/.test(url) || key.length < 20}
          onClick={() => {
            saveCloudConfig({ url, anonKey: key });
            cloud.reloadConfig();
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
        Salvataggio cloud <CloudBadge />
      </h2>
      <p className="muted small">
        Progetto: {cfg.url} {isConfigFromEnv() ? '(da .env)' : ''}
        {!isConfigFromEnv() && (
          <button
            className="link-btn"
            onClick={() => {
              saveCloudConfig(undefined);
              cloud.reloadConfig();
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
              cloud.setSession(s);
              setPassword('');
              toast('Accesso effettuato: da ora ogni modifica viene salvata anche nel cloud');
            });
          }}
        >
          <Field label="Email">{(id) => <input id={id} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
          <Field label="Password">
            {(id) => <input id={id} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
          <div className="field">
            <span className="field-label" aria-hidden>
              &nbsp;
            </span>
            <div className="field-control">
              <button className="btn btn-primary" type="submit" disabled={busy || !email || password.length < 6}>
                Accedi
              </button>
            </div>
            <small className="hint">Accesso riservato agli account autorizzati.</small>
          </div>
          {cloud.error && <p className="error small form-wide">{cloud.error}</p>}
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
                  cloud.setSession(undefined);
                })
              }
            >
              esci
            </button>
          </p>
          <p className="muted small">
            Salvataggio automatico: ogni modifica arriva nel cloud dopo pochi secondi. Ultima sincronizzazione:{' '}
            {cloud.lastSyncAt ? fmtDateTime(cloud.lastSyncAt) : 'mai'}.
          </p>
          {cloud.error && <p className="error small">{cloud.error}</p>}
          <div className="row wrap">
            <button className="btn" disabled={busy || cloud.status === 'in_corso'} onClick={cloud.syncNow}>
              Sincronizza ora
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
                    {r.id === trip.id && <Badge tone="info">aperto</Badge>}
                  </div>
                  {r.id !== trip.id &&
                    (confirmLoad === r.id ? (
                      <span className="row tight">
                        <button
                          className="btn btn-small btn-primary"
                          disabled={busy}
                          onClick={() =>
                            run(async () => {
                              await cloud.loadTrip(r.id);
                              setConfirmLoad(null);
                              toast('Viaggio aperto dal cloud');
                            })
                          }
                        >
                          Conferma apertura
                        </button>
                        <button className="btn btn-small" onClick={() => setConfirmLoad(null)}>
                          Annulla
                        </button>
                      </span>
                    ) : (
                      <button className="btn btn-small" disabled={busy} onClick={() => setConfirmLoad(r.id)}>
                        Apri
                      </button>
                    ))}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

export function CloudBadge() {
  const { status } = useCloudSync();
  const map = {
    non_configurato: ['warn', 'non configurato'],
    non_connesso: ['warn', 'accesso richiesto'],
    sincronizzato: ['ok', 'sincronizzato'],
    in_attesa: ['info', 'in salvataggio'],
    in_corso: ['info', 'in salvataggio'],
    offline: ['warn', 'non raggiungibile'],
    conflitto: ['warn', 'da risolvere'],
  } as const;
  const [tone, label] = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}
