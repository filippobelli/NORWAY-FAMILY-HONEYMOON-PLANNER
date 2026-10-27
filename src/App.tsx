import { useEffect, useState } from 'react';
import { computeBudget, formatEur } from './domain/budget';
import { totalDays } from './domain/itinerary';
import { getCloudConfig } from './services/storage/supabase';
import { TripProvider, useTrip } from './state/store';
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
      <Shell />
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
  const cloud = Boolean(getCloudConfig());

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
        <div className={`save-state save-${localState}`} role="status">
          {localState === 'salvato' && (cloud ? 'Salvato in locale · cloud manuale' : 'Modalità locale · salvato in questo browser')}
          {localState === 'in_attesa' && 'Salvataggio…'}
          {localState === 'errore' && 'Salvataggio locale NON riuscito'}
        </div>
      </header>
      <nav className="tabs" aria-label="Sezioni">
        {TABS.map((t) => (
          <a key={t.id} href={`#/${t.id}`} className={tab === t.id ? 'active' : ''} aria-current={tab === t.id ? 'page' : undefined}>
            <span aria-hidden>{t.icon}</span> {t.label}
          </a>
        ))}
      </nav>
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
