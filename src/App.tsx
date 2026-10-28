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
import { HytteView } from './ui/HytteView';
import { ItineraryView } from './ui/ItineraryView';
import { OverviewView } from './ui/OverviewView';
import { ScenariosView } from './ui/ScenariosView';
import { SettingsView } from './ui/SettingsView';

// Sezioni raggruppate per fase: capire, pianificare, organizzare la logistica, decidere.
const TABS = [
  { id: 'panoramica', label: 'Panoramica', icon: '🏔️', group: 'Viaggio' },
  { id: 'itinerario', label: 'Itinerario', icon: '🗺️', group: 'Pianifica' },
  { id: 'giornate', label: 'Giornate', icon: '📅', group: 'Pianifica' },
  { id: 'configuratore', label: 'Configuratore', icon: '🧭', group: 'Pianifica' },
  { id: 'catalogo', label: 'Catalogo', icon: '📚', group: 'Pianifica' },
  { id: 'hytte', label: 'Alloggi', icon: '🛖', group: 'Logistica' },
  { id: 'crociere', label: 'Crociere', icon: '🚢', group: 'Logistica' },
  { id: 'budget', label: 'Budget', icon: '💶', group: 'Decidi' },
  { id: 'scenari', label: 'Scenari', icon: '⚖️', group: 'Decidi' },
  { id: 'viaggio', label: 'Salvataggio', icon: '☁️', group: 'Impostazioni' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function readHash(): TabId {
  let h = window.location.hash.replace(/^#\/?/, '');
  if (h === 'costiera') h = 'crociere'; // vecchio nome della sezione: i link salvati continuano a funzionare
  return (TABS.find((t) => t.id === h)?.id ?? 'panoramica') as TabId;
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
        <a href="#/viaggio" className={`save-state save-${localState === 'errore' ? 'errore' : cloud.status}`} role="status" title={cloud.error}>
          {saveLabel(localState, cloud.status, cloud.lastSyncAt)}
        </a>
      </header>
      <nav className="tabs" aria-label="Sezioni" ref={navRef}>
        {TABS.map((t, i) => (
          <a
            key={t.id}
            href={`#/${t.id}`}
            className={`${tab === t.id ? 'active' : ''} ${i > 0 && TABS[i - 1]!.group !== t.group ? 'group-start' : ''}`}
            aria-current={tab === t.id ? 'page' : undefined}
            title={t.group}
          >
            <span className="tab-icon" aria-hidden>
              {t.icon}
            </span>
            <span className="tab-label">{t.label}</span>
          </a>
        ))}
      </nav>
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
        {tab === 'hytte' && <HytteView />}
        {tab === 'budget' && <BudgetView />}
        {tab === 'scenari' && <ScenariosView />}
        {tab === 'viaggio' && <SettingsView />}
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
