import { useEffect, useState } from 'react';
import { computeBudget, formatEur } from './domain/budget';
import { totalDays } from './domain/itinerary';
import { CloudSyncProvider, useCloudSync, type CloudStatus } from './state/cloudSync';
import { TripProvider, useTrip } from './state/store';
import { fmtDateTime } from './ui/common';
import { BudgetView } from './ui/BudgetView';
import { CatalogView } from './ui/CatalogView';
import { CoastalView } from './ui/CoastalView';
import { DaysView } from './ui/DaysView';
import { HytteView } from './ui/HytteView';
import { ItineraryView } from './ui/ItineraryView';
import { SettingsView } from './ui/SettingsView';

const TABS = [
  { id: 'itinerario', label: 'Itinerario', icon: '🗺️' },
  { id: 'giornate', label: 'Giornate', icon: '📅' },
  { id: 'catalogo', label: 'Catalogo', icon: '📚' },
  { id: 'costiera', label: 'Costiera', icon: '🚢' },
  { id: 'hytte', label: 'Hytte', icon: '🛖' },
  { id: 'budget', label: 'Budget', icon: '💶' },
  { id: 'viaggio', label: 'Salvataggio', icon: '☁️' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function readHash(): TabId {
  const h = window.location.hash.replace(/^#\/?/, '');
  return (TABS.find((t) => t.id === h)?.id ?? 'itinerario') as TabId;
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
  const { trip, localState, loadError, toasts } = useTrip();
  const [tab, setTab] = useState<TabId>(readHash);
  useEffect(() => {
    const on = () => setTab(readHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const days = totalDays(trip.stops);
  const total = computeBudget(trip).total;
  const cloud = useCloudSync();

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
              {days ? `${days} giorni` : 'Itinerario da costruire'} · {trip.participants.adults} adulti, {trip.participants.childrenAges.length} bambini
              {total > 0 && ` · ${formatEur(total)}`}
            </p>
          </div>
        </div>
        <a href="#/viaggio" className={`save-state save-${localState === 'errore' ? 'errore' : cloud.status}`} role="status" title={cloud.error}>
          {saveLabel(localState, cloud.status, cloud.lastSyncAt)}
        </a>
      </header>
      <nav className="tabs" aria-label="Sezioni">
        {TABS.map((t) => (
          <a key={t.id} href={`#/${t.id}`} className={tab === t.id ? 'active' : ''} aria-current={tab === t.id ? 'page' : undefined}>
            <span aria-hidden>{t.icon}</span> {t.label}
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
        {tab === 'itinerario' && <ItineraryView />}
        {tab === 'giornate' && <DaysView />}
        {tab === 'catalogo' && <CatalogView />}
        {tab === 'costiera' && <CoastalView />}
        {tab === 'hytte' && <HytteView />}
        {tab === 'budget' && <BudgetView />}
        {tab === 'viaggio' && <SettingsView />}
      </main>
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.msg}
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
