import { useEffect, useRef, useState } from 'react';
import { computeBudget, formatEur } from './domain/budget';
import { totalDays } from './domain/itinerary';
import { useAutoRates } from './state/autoRates';
import { CloudSyncProvider, useCloudSync } from './state/cloudSync';
import { TripProvider, useTrip } from './state/store';
import { isTravelView, parseRoute, startView, type ViewId } from './state/route';
import { useAppMode } from './state/mode';
import { saveLastPlanning, useOnline } from './state/uiContext';
import { exportTripFile } from './services/storage/local';
import { fmtDateTime } from './ui/common';
import { FlagMark, Icon, type IconName } from './ui/icons';
import { ConflictDialog } from './ui/SyncDialogs';
import { SyncBadge } from './ui/SyncStatus';
import { BookingsView } from './ui/BookingsView';
import { BudgetView } from './ui/BudgetView';
import { CatalogView } from './ui/CatalogView';
import { ConfiguratorView } from './ui/ConfiguratorView';
import { CoastalView } from './ui/CoastalView';
import { DaysView } from './ui/DaysView';
import { FlightsView } from './ui/FlightsView';
import { HytteView } from './ui/HytteView';
import { OverviewView } from './ui/OverviewView';
import { PlannerView } from './ui/PlannerView';
import { ScenariosView } from './ui/ScenariosView';
import { SettingsView } from './ui/SettingsView';
import { DiaryScreen, MoreScreen, TodayScreen, TravelItinerary, TravelMap, TravelShell } from './ui/TravelView';

// Il menù segue l'ordine consigliato del lavoro, senza imporlo: viaggio, itinerario, prenotazioni, giornate, budget e, a parte, la modalità viaggio.
// Gli indirizzi delle viste restano quelli di sempre; quelli vecchi sono mappati in state/route.ts.
interface Section {
  id: string;
  label: string;
  icon: IconName;
  home: ViewId;
  views: { id: ViewId; label: string }[];
  /** Sottomenù visibile. Dentro l'Itinerario no: proposta, catalogo e versioni si aprono dallo spazio di lavoro */
  subnav?: boolean;
}
const SECTIONS: Section[] = [
  { id: 'viaggio', label: 'Viaggio', icon: 'mountain', home: 'panoramica', views: [{ id: 'panoramica', label: 'Panoramica' }] },
  {
    id: 'itinerario',
    label: 'Itinerario',
    icon: 'route',
    home: 'pianifica',
    views: [
      { id: 'pianifica', label: 'Spazio di lavoro' },
      { id: 'configuratore', label: 'Proposta automatica' },
      { id: 'catalogo', label: 'Catalogo dei luoghi' },
      { id: 'scenari', label: 'Versioni del percorso' },
    ],
  },
  {
    id: 'prenotazioni',
    label: 'Prenotazioni',
    icon: 'bed',
    home: 'prenotazioni',
    subnav: true,
    views: [
      { id: 'prenotazioni', label: 'Riepilogo' },
      { id: 'voli', label: 'Voli' },
      { id: 'crociere', label: 'Crociere' },
      { id: 'hytte', label: 'Alloggi' },
    ],
  },
  { id: 'giornate', label: 'Giornate', icon: 'calendar', home: 'giornate', views: [{ id: 'giornate', label: 'Attività e carico' }] },
  { id: 'budget', label: 'Budget', icon: 'wallet', home: 'budget', views: [{ id: 'budget', label: 'Costi' }] },
];

function readHash(): ViewId {
  return parseRoute(window.location.hash).view;
}

/** Sul telefono la barra in basso tiene quattro aree; Budget, Modalità viaggio e Impostazioni stanno in «Altro». */
function PhoneMore({ current, onTravel }: { current?: string; onTravel: () => void }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: Event) => {
      const d = ref.current;
      if (!d?.open) return;
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !d.contains(e.target as Node)) {
        d.open = false;
        if (e instanceof KeyboardEvent) d.querySelector<HTMLElement>('summary')?.focus();
      }
    };
    const onHash = () => {
      if (ref.current) ref.current.open = false;
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    window.addEventListener('hashchange', onHash);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);
  const active = current === 'budget' || current === undefined;
  return (
    <details className={`tab-more ${active ? 'active' : ''}`} ref={ref}>
      <summary aria-label="Altre sezioni">
        <span className="tab-icon">
          <Icon name="menu" />
        </span>
        <span className="tab-label">Altro</span>
      </summary>
      <div className="tab-more-menu">
        <a href="#/budget" aria-current={current === 'budget' ? 'page' : undefined}>
          <Icon name="wallet" /> Budget
        </a>
        <a href="#/t/oggi" onClick={onTravel}>
          <Icon name="phone" /> Modalità viaggio
        </a>
        <a href="#/impostazioni" aria-current={current === undefined ? 'page' : undefined}>
          <Icon name="gear" /> Impostazioni ed esportazioni
        </a>
      </div>
    </details>
  );
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
  const online = useOnline();
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
  // Ritorno dalla modalità viaggio: si riparte dalla schermata di pianificazione che era aperta
  useEffect(() => {
    if (!isTravelView(tab) && mode === 'planning') saveLastPlanning(window.location.hash);
  }, [tab, mode]);
  const section = SECTIONS.find((s) => s.views.some((v) => v.id === tab));
  const viewLabel = section?.views.find((v) => v.id === tab)?.label;
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
          <span>{cloud.error} Le modifiche restano su questo dispositivo.</span>
          <span className="row wrap">
            {online && (
              <button className="btn btn-small btn-primary" onClick={cloud.syncNow}>
                Riprova
              </button>
            )}
            <button className="btn btn-small" onClick={() => exportTripFile(trip)}>
              Esporta un backup
            </button>
          </span>
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
      {tab === 'configuratore' && <ConfiguratorView />}
      {tab === 'giornate' && <DaysView />}
      {tab === 'catalogo' && <CatalogView />}
      {tab === 'prenotazioni' && <BookingsView />}
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
      <TravelShell tab={tab} status={<SyncBadge compact />} online={online}>
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
            <p className="eyebrow">{section ? `${section.label}${viewLabel && section.views.length > 1 ? ` / ${viewLabel}` : ''}` : 'Impostazioni'}</p>
            <h1>{trip.title || 'Norvegia 2027'}</h1>
            <p>
              {days ? `${days} giorni` : 'Itinerario da costruire'} · {trip.participants.adults} adulti, {trip.participants.childrenAges.length} bambini
              {total > 0 && ` · ${formatEur(total)}`}
            </p>
          </div>
        </div>
        <div className="topbar-right">
          {activeScenario && tab !== 'pianifica' && (
            <a href="#/scenari" className="scenario-tag" title="Versione attiva del percorso">
              <Icon name="scale" /> {activeScenario}
            </a>
          )}
          <SyncBadge />
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
          <a key={s.id} href={`#/${s.home}`} data-section={s.id} className={section?.id === s.id ? 'active' : ''} aria-current={section?.id === s.id ? 'page' : undefined}>
            <span className="tab-icon">
              <Icon name={s.icon} />
            </span>
            <span className="tab-label">{s.label}</span>
          </a>
        ))}
        <a href="#/t/oggi" className="tab-travel" onClick={() => setMode('travel')} title="Passa alla gestione da smartphone: oggi, itinerario, mappa e diario">
          <span className="tab-icon">
            <Icon name="phone" />
          </span>
          <span className="tab-label">Modalità viaggio</span>
        </a>
        <PhoneMore current={section?.id} onTravel={() => setMode('travel')} />
      </nav>
      {section?.subnav && (
        <nav className="subtabs" aria-label={`Viste di ${section.label}`}>
          {section.views.map((v) => (
            <a key={v.id} href={`#/${v.id}`} className={tab === v.id ? 'active' : ''} aria-current={tab === v.id ? 'page' : undefined}>
              {v.label}
            </a>
          ))}
        </nav>
      )}
      {banners}
      <main className="content">
        {section?.id === 'itinerario' && tab !== 'pianifica' && (
          <p className="crumb">
            <a href="#/pianifica">← Torna all'itinerario</a> <span aria-hidden>/</span> <span>{viewLabel}</span>
          </p>
        )}
        {page}
      </main>
      {toastList}
    </div>
  );
}
