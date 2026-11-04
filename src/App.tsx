import { useEffect, useRef, useState } from 'react';
import { computeBudget, formatEur } from './domain/budget';
import { totalDays } from './domain/itinerary';
import { useAutoRates } from './state/autoRates';
import { CloudSyncProvider, useCloudSync, type CloudStatus } from './state/cloudSync';
import { TripProvider, useTrip } from './state/store';
import { isTravelView, parseRoute, startView, type ViewId } from './state/route';
import { useAppMode } from './state/mode';
import { exportTripFile } from './services/storage/local';
import { fmtDateTime } from './ui/common';
import { FlagMark, Icon, type IconName } from './ui/icons';
import { ConflictDialog } from './ui/SyncDialogs';
import { BudgetView } from './ui/BudgetView';
import { CatalogView } from './ui/CatalogView';
import { ConfiguratorView } from './ui/ConfiguratorView';
import { CoastalView } from './ui/CoastalView';
import { DaysView } from './ui/DaysView';
import { FlightsView } from './ui/FlightsView';
import { HytteView } from './ui/HytteView';
import { ItineraryView } from './ui/ItineraryView';
import { OverviewView } from './ui/OverviewView';
import { PlannerView } from './ui/PlannerView';
import { ScenariosView } from './ui/ScenariosView';
import { SettingsView } from './ui/SettingsView';
import { DiaryScreen, MoreScreen, TodayScreen, TravelItinerary, TravelMap, TravelShell } from './ui/TravelView';

// Il menù segue le domande di chi organizza: chi e quando, dove, come ci si muove, dove si dorme, cosa si fa, quanto costa.
// Ogni voce può avere più viste; gli indirizzi delle viste restano quelli di sempre, così i link salvati continuano a funzionare.
const SECTIONS = [
  { id: 'il-viaggio', label: 'Il viaggio', icon: 'mountain', views: [{ id: 'panoramica', label: 'Panoramica' }] },
  {
    id: 'percorso',
    label: 'Percorso',
    icon: 'route',
    views: [
      { id: 'pianifica', label: 'Pianificatore' },
      { id: 'itinerario', label: 'Tappe e mappa' },
      { id: 'configuratore', label: 'Pianificatore automatico' },
      { id: 'catalogo', label: 'Luoghi da visitare' },
      { id: 'scenari', label: 'Scenari' },
    ],
  },
  {
    id: 'trasporti',
    label: 'Trasporti',
    icon: 'plane',
    views: [
      { id: 'voli', label: 'Voli' },
      { id: 'crociere', label: 'Crociere' },
    ],
  },
  { id: 'alloggi', label: 'Alloggi', icon: 'bed', views: [{ id: 'hytte', label: 'Alloggi' }] },
  { id: 'giorni', label: 'Giorno per giorno', icon: 'calendar', views: [{ id: 'giornate', label: 'Giorno per giorno' }] },
  { id: 'costi', label: 'Budget', icon: 'wallet', views: [{ id: 'budget', label: 'Budget' }] },
] as const satisfies readonly { id: string; label: string; icon: IconName; views: readonly { id: string; label: string }[] }[];

function readHash(): ViewId {
  return parseRoute(window.location.hash).view;
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
  const { trip, localState, loadError, staleTab, toasts, dismissToast } = useTrip();
  const [showConflict, setShowConflict] = useState(false);
  const { mode, setMode } = useAppMode();
  const [tab, setTab] = useState<ViewId>(readHash);
  useEffect(() => {
    const on = () => setTab(readHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  // Senza un indirizzo si apre la schermata principale della modalità; un link esplicito resta dov'è
  const hasStops = trip.stops.length > 0;
  useEffect(() => {
    const start = startView(window.location.hash, mode, hasStops);
    if (start) window.location.hash = `#/${start}`;
  }, [mode, hasStops]);
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

  const banners = (
    <>
      {cloud.conflict && (
        <div className="note-warn banner conflict" role="alert">
          <span>
            Questo viaggio è stato modificato sia qui sia su un altro dispositivo
            {cloud.conflict.remoteUpdatedAt ? ` (cloud: ${fmtDateTime(cloud.conflict.remoteUpdatedAt)})` : ''}. L'invio al cloud è in pausa finché non scegli.
          </span>
          <button className="btn btn-small btn-primary" onClick={() => setShowConflict(true)}>
            Confronta e scegli
          </button>
        </div>
      )}
      {showConflict && cloud.conflict && <ConflictDialog conflict={cloud.conflict} onClose={() => setShowConflict(false)} />}
      {staleTab && (
        <div className="note-warn banner" role="alert">
          <span>Il viaggio è stato modificato in un'altra scheda. Questa è in pausa per non sovrascriverlo.</span>
          <button className="btn btn-small" onClick={() => window.location.reload()}>
            Ricarica
          </button>
        </div>
      )}
      {localState === 'errore' && (
        <div className="note-warn banner" role="alert">
          <span>Salvataggio su questo dispositivo NON riuscito (spazio esaurito o archivio non disponibile). Le ultime modifiche sono solo in questa pagina: non chiuderla.</span>
          <button className="btn btn-small" onClick={() => exportTripFile(trip)}>
            Esporta un backup
          </button>
        </div>
      )}
      {cloud.status === 'errore' && cloud.error && (
        <div className="note-warn banner" role="alert">
          {cloud.error}
        </div>
      )}
      {loadError && (
        <div className="note-warn banner" role="alert">
          {loadError}
        </div>
      )}
    </>
  );
  const page = (
    <>
      {tab === 'panoramica' && <OverviewView />}
      {tab === 'pianifica' && <PlannerView />}
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
      {tab === 't/oggi' && <TodayScreen />}
      {tab === 't/itinerario' && <TravelItinerary />}
      {tab === 't/mappa' && <TravelMap />}
      {tab === 't/diario' && <DiaryScreen />}
      {tab === 't/altro' && <MoreScreen />}
    </>
  );
  const toastList = (
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
  );

  if (isTravelView(tab) || mode === 'travel') {
    return (
      <TravelShell
        tab={tab}
        status={
          <a href="#/impostazioni" className={`save-state save-${localState === 'errore' ? 'errore' : cloud.status}`} role="status" title={cloud.error}>
            {saveLabel(localState, cloud.status, cloud.lastSyncAt)}
          </a>
        }
      >
        {banners}
        {page}
        {toastList}
      </TravelShell>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">
            <FlagMark />
          </span>
          <div>
            <p className="eyebrow">Viaggio / {section?.views.find((v) => v.id === tab)?.label ?? 'Impostazioni'}</p>
            <h1>{trip.title || 'Norvegia 2027'}</h1>
            <p>
              {days ? `${days} giorni` : 'Itinerario da costruire'} · {trip.participants.adults} adulti, {trip.participants.childrenAges.length} bambini
              {total > 0 && ` · ${formatEur(total)}`}
            </p>
          </div>
        </div>
        <div className="topbar-right">
          <span className="mode-tag">Pianificazione</span>
          {activeScenario && (
            <a href="#/scenari" className="scenario-tag" title="Scenario attivo">
              <Icon name="scale" /> {activeScenario}
            </a>
          )}
          <button
            className="mode-link"
            onClick={() => {
              setMode('travel');
              window.location.hash = '#/t/oggi';
            }}
          >
            <Icon name="phone" /> Modalità viaggio
          </button>
          <a href="#/impostazioni" className={`save-state save-${localState === 'errore' ? 'errore' : cloud.status}`} role="status" title={cloud.error}>
            {saveLabel(localState, cloud.status, cloud.lastSyncAt)}
          </a>
          <a href="#/impostazioni" className={`gear ${tab === 'impostazioni' ? 'active' : ''}`} aria-label="Impostazioni, salvataggio e backup" title="Impostazioni, salvataggio e backup" aria-current={tab === 'impostazioni' ? 'page' : undefined}>
            <Icon name="gear" />
          </a>
        </div>
      </header>
      <nav className="tabs" aria-label="Sezioni" ref={navRef}>
        <span className="rail-logo">
          <FlagMark />
        </span>
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#/${s.views[0].id}`} className={section?.id === s.id ? 'active' : ''} aria-current={section?.id === s.id ? 'page' : undefined}>
            <span className="tab-icon">
              <Icon name={s.icon} />
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
      {banners}
      <main className="content">{page}</main>
      {toastList}
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
      return lastSyncAt ? `Sincronizzato · ${new Date(lastSyncAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` : 'Sincronizzato';
    case 'offline':
      return 'Offline · modifiche salvate qui, in attesa di invio';
    case 'errore':
      return 'Errore del cloud · salvato qui';
    case 'conflitto':
      return 'Sincronizzazione in pausa: da scegliere';
  }
}
