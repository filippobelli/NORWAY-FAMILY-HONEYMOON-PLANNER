import { useEffect, useRef, useState } from 'react';
import { createEmptyTrip } from '../domain/defaults';
import { exportTripFile, readTripFile } from '../services/storage/local';
import { CloudError, isConfigFromEnv, listCloudTrips, saveCloudConfig, signIn, type CloudTripRow } from '../services/storage/supabase';
import { markRowsTrip, useCloudSync } from '../state/cloudSync';
import { newTripInRows } from '../state/conversionMode';
import { useAppMode } from '../state/mode';
import { useTrip } from '../state/store';
import { Badge, Field, fmtDateTime, NumberInput } from './common';
import { LogoutDialog } from './SyncDialogs';
import { RatesPanel } from './RatesPanel';
import { OfflineInfo } from './SyncStatus';
import { ExportsPanel } from './ExportsPanel';
import { CountriesPanel } from './Countries';
import { FormatPanel } from './FormatPanel';
import { AttachmentsPanel } from './AttachmentsPanel';
import { DEFAULT_RECHECK_DAYS } from '../domain/verification';
import { parseRoute } from '../state/route';

export function SettingsView() {
  const { trip, update, replace, toast } = useTrip();
  const cloudOn = Boolean(useCloudSync().session);
  const fileRef = useRef<HTMLInputElement>(null);
  const { setMode } = useAppMode();
  const [modeChoice, setChoice] = useState<'auto' | 'planning' | 'travel'>(() => {
    try {
      const v = localStorage.getItem('nfhp.ui.mode');
      return v === 'planning' || v === 'travel' ? v : 'auto';
    } catch {
      return 'auto';
    }
  });
  const setModeChoice = (v: 'auto' | 'planning' | 'travel') => {
    setChoice(v);
    setMode(v === 'auto' ? undefined : v);
  };

  // «Prepara le esportazioni» dal prossimo passo porta direttamente alla sezione
  useEffect(() => {
    const sezione = parseRoute(window.location.hash).params.sezione;
    // «Vai a Nazioni e cataloghi» (Trasporti via mare) porta al riquadro delle nazioni
    if (sezione === 'esporta' || sezione === 'nazioni') document.getElementById(sezione)?.scrollIntoView({ block: 'start' });
  }, []);

  return (
    <div className="settings">
      <ExportsPanel />
      <section className="panel">
        <h2>Preferenze</h2>
        <div className="grid-4">
          <Field label="Modalità su questo dispositivo" hint="Salvata per il tuo account su questo dispositivo: gli altri dispositivi hanno la loro.">
            {(id) => (
              <select id={id} value={modeChoice} onChange={(e) => setModeChoice(e.target.value as 'auto' | 'planning' | 'travel')}>
                <option value="auto">Automatica (dalla larghezza dello schermo)</option>
                <option value="planning">Pianificazione</option>
                <option value="travel">Viaggio</option>
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
          <Field label="Ricontrolla le verifiche dopo (giorni)" hint={`Orari e disponibilità controllati da più tempo diventano «Da ricontrollare». Predefinito ${DEFAULT_RECHECK_DAYS}.`}>
            {(id) => (
              <NumberInput
                id={id}
                value={trip.settings.recheckAfterDays ?? DEFAULT_RECHECK_DAYS}
                min={1}
                onChange={(v) => update((t) => ({ ...t, settings: { ...t.settings, recheckAfterDays: v && v > 0 ? Math.round(v) : undefined } }))}
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

      <CountriesPanel />

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

      <section className="panel">
        <h2>Cosa funziona senza rete</h2>
        <OfflineInfo />
        <p className="small muted">Ogni modifica si salva sul dispositivo e resta in attesa di invio al cloud; riparte alla riapertura, al ritorno della rete e ogni 30 secondi.</p>
      </section>

      <AttachmentsPanel />

      <RatesPanel />

      <CloudPanel />

      <FormatPanel />

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
              const msg = cloudOn
                ? 'Creare un nuovo viaggio? Quello attuale resta nel cloud e lo riapri da «Viaggi salvati nel cloud».'
                : 'Creare un viaggio vuoto? Il viaggio attuale verrà sostituito in questo browser (esporta prima un backup).';
              if (window.confirm(msg)) {
                // Viaggio nuovo: titolo provvisorio e nessuna nazione, che si sceglie nella Panoramica (design §1)
                const fresh = { ...createEmptyTrip(), title: 'Nuovo viaggio', countries: [] };
                // Nel formato a righe solo con il cloud collegato e VITE_PASSAGGIO_RIGHE=pulsante|auto; altrimenti documento
                if (newTripInRows(cloudOn)) markRowsTrip(fresh.id);
                replace(fresh);
                window.location.hash = '#/panoramica';
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
  const [logoutOpen, setLogoutOpen] = useState(false);
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
              onClick={() => setLogoutOpen(true)}
            >
              esci
            </button>
            {logoutOpen && <LogoutDialog onClose={() => setLogoutOpen(false)} />}
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
    errore: ['warn', 'errore'],
    conflitto: ['warn', 'da risolvere'],
  } as const;
  const [tone, label] = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}
