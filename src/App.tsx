import { useEffect, useRef, useState } from 'react';
import { computeBudget, formatEur } from './domain/budget';
import { totalDays } from './domain/itinerary';
import { useAutoRates } from './state/autoRates';
import { CloudSyncProvider, useCloudSync, type CloudStatus } from './state/cloudSync';
import { TripProvider, useTrip } from './state/store';
import { fmtDateTime } from './ui/common';
import { BudgetView } from './ui/BudgetView';
import { CatalogView } from './ui/CatalogView';
import { ConfiguratorView } from './ui/ConfiguratorView';
import { CoastalView } from './ui/CoastalView';
import { DaysView } from './ui/DaysView';
import { FlightsView } from './ui/FlightsView';
import { HytteView } from './ui/HytteView';
import { ItineraryView } from './ui/ItineraryView';
import { OverviewView } from './ui/OverviewView';
import { ScenariosView } from './ui/ScenariosView';
import { SettingsView } from './ui/SettingsView';

// Il menù segue le domande di chi organizza: chi e quando, dove, come ci si muove, dove si dorme, cosa si fa, quanto costa.
// Ogni voce può avere più viste; gli indirizzi delle viste restano quelli di sempre, così i link salvati continuano a funzionare.
const SECTIONS = [
  { id: 'il-viaggio', label: 'Il viaggio', icon: '🏔️', views: [{ id: 'panoramica', label: 'Il viaggio' }] },
  {
    id: 'percorso',
    label: 'Percorso',
    icon: '🗺️',
    views: [
      { id: 'itinerario', label: 'Tappe e mappa' },
      { id: 'configuratore', label: 'Fatti proporre un percorso' },
      { id: 'catalogo', label: 'Mete' },
      { id: 'scenari', label: 'Versioni' },
    ],
  },
  {
    id: 'trasporti',
    label: 'Trasporti',
    icon: '✈️',
    views: [
      { id: 'voli', label: 'Voli' },
      { id: 'crociere', label: 'Crociere' },
    ],
  },
  { id: 'alloggi', label: 'Alloggi', icon: '🛖', views: [{ id: 'hytte', label: 'Alloggi' }] },
  { id: 'giorni', label: 'Giorno per giorno', icon: '📅', views: [{ id: 'giornate', label: 'Giorno per giorno' }] },
  { id: 'costi', label: 'Budget', icon: '💶', views: [{ id: 'budget', label: 'Budget' }] },
] as const;
type TabId = (typeof SECTIONS)[number]['views'][number]['id'] | 'impostazioni';

// Vecchi nomi: «viaggio» erano le impostazioni, «costiera» le crociere
const ALIASES: Record<string, TabId> = { viaggio: 'impostazioni', costiera: 'crociere', percorso: 'itinerario', trasporti: 'voli' };

function readHash(): TabId {
  const h = window.location.hash.replace(/^#\/?/, '');
  if (ALIASES[h]) return ALIASES[h]!;
  if (h === 'impostazioni') return h;
  for (const s of SECTIONS) for (const v of s.views) if (v.id === h) return v.id;
  return 'panoramica';
}

export default function App() {
  return (
    <TripProvider>
      <CloudSyncProvider>
        <Shell />
      </CloudSyncProvider>
    </TripProvider>
  );
}

function Shell() {
  const { trip, localState, loadError, toasts, dismissToast } = useTrip();
  const [tab, setTab] = useState<TabId>(readHash);
  useEffect(() => {
    const on = () => setTab(readHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  // Cambiando sezione si riparte dall'inizio della pagina e la voce attiva resta visibile nella barra (su smartphone scorre)
  const navRef = useRef<HTMLElement>(null);
  const firstTab = useRef(true);
  useEffect(() => {
    navRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (firstTab.current) {
      firstTab.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
  }, [tab]);
  const section = SECTIONS.find((s) => s.views.some((v) => v.id === tab));
  const days = totalDays(trip.stops);
  const total = computeBudget(trip).total;
  const cloud = useCloudSync();
  useAutoRates(cloud.status);
  const activeScenario = (trip.scenarios?.length ?? 0) > 1 ? trip.scenarios?.find((s) => s.id === trip.activeScenarioId)?.name : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            ⛰
          </span>
          <div>
            <h1>{trip.title || 'Norvegia 2027'}</h1>
            <p>
              {activeScenario && `${activeScenario} · `}
              {days ? `${days} giorni` : 'Itinerario da costruire'} · {trip.participants.adults} adulti, {trip.participants.childrenAges.length} bambini
              {total > 0 && ` · ${formatEur(total)}`}
            </p>
          </div>
        </div>
        <div className="topbar-right">
          <a href="#/impostazioni" className={`save-state save-${localState === 'errore' ? 'errore' : cloud.status}`} role="status" title={cloud.error}>
            {saveLabel(localState, cloud.status, cloud.lastSyncAt)}
          </a>
          <a href="#/impostazioni" className={`gear ${tab === 'impostazioni' ? 'active' : ''}`} aria-label="Impostazioni, salvataggio e backup" title="Impostazioni, salvataggio e backup" aria-current={tab === 'impostazioni' ? 'page' : undefined}>
            ⚙️
          </a>
        </div>
      </header>
      <nav className="tabs" aria-label="Sezioni" ref={navRef}>
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#/${s.views[0].id}`} className={section?.id === s.id ? 'active' : ''} aria-current={section?.id === s.id ? 'page' : undefined}>
            <span className="tab-icon" aria-hidden>
              {s.icon}
            </span>
            <span className="tab-label">{s.label}</span>
          </a>
        ))}
      </nav>
      {section && section.views.length > 1 && (
        <nav className="subtabs" aria-label={`Viste di ${section.label}`}>
          {section.views.map((v) => (
            <a key={v.id} href={`#/${v.id}`} className={tab === v.id ? 'active' : ''} aria-current={tab === v.id ? 'page' : undefined}>
              {v.label}
            </a>
          ))}
        </nav>
      )}
      {cloud.status === 'conflitto' && (
        <div className="note-warn banner conflict" role="alert">
          <span>
            Questo viaggio è stato modificato sia qui sia su un altro dispositivo
            {cloud.conflictRemoteAt ? ` (cloud: ${fmtDateTime(cloud.conflictRemoteAt)})` : ''}. Il salvataggio automatico è in pausa finché non scegli:
          </span>
          <span className="row wrap">
            <button className="btn btn-small btn-primary" onClick={cloud.keepLocal}>
              Tieni questa versione
            </button>
            <button className="btn btn-small" onClick={cloud.useRemote}>
              Usa la versione del cloud
            </button>
          </span>
        </div>
      )}
      {loadError && (
        <div className="note-warn banner" role="alert">
          {loadError}
        </div>
      )}
      <main className="content">
        {tab === 'panoramica' && <OverviewView />}
        {tab === 'itinerario' && <ItineraryView />}
        {tab === 'configuratore' && <ConfiguratorView />}
        {tab === 'giornate' && <DaysView />}
        {tab === 'catalogo' && <CatalogView />}
        {tab === 'crociere' && <CoastalView />}
        {tab === 'voli' && <FlightsView />}
        {tab === 'hytte' && <HytteView />}
        {tab === 'budget' && <BudgetView />}
        {tab === 'scenari' && <ScenariosView />}
        {tab === 'impostazioni' && <SettingsView />}
      </main>
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <span>{t.msg}</span>
            {t.action && (
              <button
                className="toast-action"
                onClick={() => {
                  t.action?.run();
                  dismissToast(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function saveLabel(local: 'salvato' | 'in_attesa' | 'errore', cloud: CloudStatus, lastSyncAt?: string): string {
  if (local === 'errore') return 'Salvataggio su questo dispositivo NON riuscito';
  switch (cloud) {
    case 'non_configurato':
      return 'Modalità locale · salvato su questo dispositivo';
    case 'non_connesso':
      return 'Salvato solo qui · accedi per il cloud';
    case 'in_attesa':
    case 'in_corso':
      return 'Salvataggio nel cloud…';
    case 'sincronizzato':
      return lastSyncAt ? `Salvato nel cloud · ${new Date(lastSyncAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` : 'Salvato nel cloud';
    case 'offline':
      return 'Cloud non raggiungibile · salvato qui, riprovo';
    case 'conflitto':
      return 'Sincronizzazione in pausa';
  }
}
