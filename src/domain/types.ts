// Modello dati del planner. Entità distinte, serializzate insieme come documento "Trip".

export type ID = string;
export type Currency = 'EUR' | 'NOK';

export interface Money {
  amount: number;
  currency: Currency;
}

/** Stato di attendibilità di un importo o di un dato operativo. */
export type DataStatus = 'confermato' | 'stimato' | 'da_verificare' | 'prenotato' | 'pagato';

export interface SourceRef {
  label: string;
  url?: string;
  /** ISO date-time della verifica */
  checkedAt?: string;
}

// ---------- Catalogo ----------

export type Category =
  | 'citta'
  | 'fiordi'
  | 'natura'
  | 'strade'
  | 'isole'
  | 'treni'
  | 'fauna'
  | 'musei'
  | 'parchi'
  | 'stagionali'
  | 'aeroporti';

export type Region =
  | 'Oslo e Østlandet'
  | 'Innlandet e montagne'
  | 'Fiordi occidentali'
  | 'Sørlandet e Rogaland'
  | 'Trøndelag'
  | 'Nordland e Lofoten'
  | 'Troms e Finnmark';

export interface Destination {
  id: ID;
  name: string;
  localName?: string;
  description: string;
  lat: number;
  lng: number;
  /** Le coordinate del catalogo iniziale sono approssimative finché non verificate. */
  coordsStatus: 'approssimative' | 'verificate';
  category: Category;
  region: Region;
  /** Durata indicativa della visita, in ore [min, max] */
  visitHours?: [number, number];
  difficulty: 'facile' | 'media' | 'impegnativa';
  /** 1 = poco adatto, 2 = adatto con accortezze, 3 = molto adatto (valutazione indicativa) */
  kidScore: 1 | 2 | 3;
  access: string;
  season: string;
  /** Avviso specifico per agosto (es. aurora non visibile) */
  augustNote?: string;
  officialUrl?: string;
  sources: SourceRef[];
  reliability: 'da_verificare' | 'verificato';
}

// ---------- Itinerario ----------

export interface Stop {
  id: ID;
  kind: 'luogo' | 'a_bordo';
  destinationId?: ID;
  name: string;
  lat: number;
  lng: number;
  nights: number;
  accommodationId?: ID;
  notes: string;
  weatherPlanB: string;
}

export type TransportMode = 'strada' | 'traghetto' | 'costiera' | 'treno' | 'bus' | 'aereo' | 'non_calcolato';

export interface Segment {
  id: ID;
  mode: TransportMode;
  label: string;
  distanceKm?: number;
  durationMin?: number;
  /** Attesa/imbarco stimati, separati dalla durata di viaggio */
  waitMin?: number;
  departureTime?: string;
  cost?: Money;
  costStatus: DataStatus;
  source?: SourceRef;
  status: DataStatus;
  coastalOptionId?: ID;
  /** [lat, lng] */
  geometry?: [number, number][];
  note?: string;
}

export interface Leg {
  id: ID;
  fromStopId: ID;
  toStopId: ID;
  segments: Segment[];
  calculatedAt?: string;
  routingError?: string;
}

export interface Activity {
  id: ID;
  title: string;
  destinationId?: ID;
  durationMin?: number;
  cost?: Money;
  costStatus: DataStatus;
}

export interface DayPlan {
  activities: Activity[];
  notes: string;
  planB: string;
}

// ---------- Navigazione costiera ----------

export type CoastalOperator = 'Hurtigruten' | 'Havila';

export interface CoastalOption {
  id: ID;
  operator: CoastalOperator;
  direction: 'nord' | 'sud';
  fromPort: string;
  toPort: string;
  date?: string;
  departureTime?: string;
  arrivalTime?: string;
  durationHours?: number;
  nightsOnboard: number;
  cabin: string;
  withCar: boolean;
  meals: 'nessuno' | 'mezza_pensione' | 'pensione_completa' | 'a_la_carte' | 'da_definire';
  price?: Money;
  priceStatus: DataStatus;
  extras?: Money;
  childRules: string;
  changePolicy: string;
  notes: string;
  source?: SourceRef;
  /** Inclusa nel budget/itinerario */
  selected: boolean;
  /** Proposta del catalogo da cui è stata creata (facoltativo: le opzioni inserite a mano non lo hanno) */
  catalogId?: ID;
}

// ---------- Sistemazioni ----------

export type AccommodationStatus = 'individuata' | 'disponibile' | 'opzionata' | 'prenotata';

export interface Accommodation {
  id: ID;
  name: string;
  type: 'hytte' | 'hytte_campeggio' | 'hotel' | 'appartamento' | 'altro';
  locality: string;
  lat?: number;
  lng?: number;
  url?: string;
  pricePerNight?: Money;
  priceStatus: DataStatus;
  cleaningFee?: Money;
  linenFee?: Money;
  capacity?: number;
  beds: string;
  bathroom: 'privato' | 'condiviso' | 'non_noto';
  kitchen: 'si' | 'no' | 'non_noto';
  parking: 'si' | 'no' | 'non_noto';
  cancellation: string;
  status: AccommodationStatus;
  stopId?: ID;
  source?: SourceRef;
  notes: string;
}

// ---------- Voli ----------

export type FlightDirection = 'andata' | 'ritorno' | 'interno';

/** Volo inserito dall'utente (da un preventivo o da una ricerca su un sito esterno). Nessun dato viene letto in automatico. */
export interface Flight {
  id: ID;
  direction: FlightDirection;
  /** Codice IATA o nome dell'aeroporto */
  fromAirport: string;
  toAirport: string;
  /** YYYY-MM-DD */
  date?: string;
  departureTime?: string;
  arrivalTime?: string;
  airline: string;
  flightNumber: string;
  /** Numero di scali; assente se non indicato */
  stops?: number;
  /** Bagagli inclusi, come indicati dalla fonte */
  baggage: string;
  /** Prezzo totale per tutta la famiglia */
  price?: Money;
  priceStatus: DataStatus;
  /** Incluso nel budget (le alternative restano escluse) */
  selected: boolean;
  source?: SourceRef;
  notes: string;
}

// ---------- Budget ----------

export type BudgetCategory =
  | 'voli'
  | 'bagagli_transfer'
  | 'noleggio_auto'
  | 'carburante_pedaggi'
  | 'traghetti'
  | 'costiera'
  | 'treni_bus'
  | 'alloggi'
  | 'pasti'
  | 'attrazioni'
  | 'extra_imprevisti';

export interface BudgetItem {
  id: ID;
  category: BudgetCategory;
  label: string;
  amount: Money;
  status: DataStatus;
  source?: SourceRef;
  notes: string;
}

// ---------- Viaggio ----------

export interface Participants {
  adults: number;
  childrenAges: number[];
}

export interface TripSettings {
  /** Corone norvegesi per 1 euro */
  nokPerEur: number;
  nokRateNote: string;
  /** Soglia oltre la quale una giornata di trasferimento è segnalata come pesante */
  maxTravelMinPerDay: number;
  /** Aggiorna il cambio in automatico all'apertura dell'app (assente = sì) */
  nokRateAuto?: boolean;
  /** Data del cambio applicato (YYYY-MM-DD) */
  nokRateDate?: string;
  /** Costo carburante per km (EUR) inserito a mano; usato solo se l'auto non ha consumo e prezzo */
  fuelEurPerKm?: number;
  car?: CarSettings;
  /** Tetto di spesa complessivo, in EUR */
  budgetCap?: number;
  /** Tetti per categoria, in EUR */
  budgetCapByCategory?: Partial<Record<BudgetCategory, number>>;
  /** Parametri per stimare le categorie senza voci (sono ipotesi dell'utente, non prezzi) */
  estimates?: BudgetEstimates;
  showCatalogOnMap: boolean;
  // Ipotesi di pianificazione (non dati verificati): servono solo alle stime realistiche
  /** Ogni quanti minuti di guida si fa una sosta */
  breakEveryMin?: number;
  /** Durata di ogni sosta */
  breakMin?: number;
  /** Attesa/imbarco ipotizzati per i traghetti senza attesa inserita */
  defaultFerryWaitMin?: number;
  /** Tempo attivo disponibile in una giornata con i bambini */
  activeDayMin?: number;
  /** Pause pasto complessive al giorno */
  mealBreaksMin?: number;
  /** Margine per imprevisti, in percentuale */
  marginPct?: number;
  /** Aeroporti di partenza dall'Italia in ordine di preferenza (codici IATA); assente = predefiniti della sezione Voli */
  homeAirports?: string[];
}

export type FuelType = 'benzina' | 'diesel' | 'elettrica';

export interface CarSettings {
  fuel: FuelType;
  /** Litri (o kWh per l'elettrica) ogni 100 km */
  consumption: number;
  /** Prezzo in NOK per litro (o per kWh) */
  priceNok?: number;
  /** Prezzo aggiornato in automatico dalla media nazionale (solo benzina e diesel) */
  priceAuto: boolean;
  /** Periodo del prezzo, es. "2026M09" */
  pricePeriod?: string;
  priceSource?: string;
}

export interface BudgetEstimates {
  /** EUR a notte per le tappe senza un alloggio con prezzo */
  lodgingPerNight?: number;
  /** EUR al giorno per la famiglia (spesa e pasti) */
  foodPerDay?: number;
  /** EUR al giorno per attività, nei giorni senza attività con prezzo */
  activitiesPerDay?: number;
  /** EUR al giorno di noleggio auto */
  carRentalPerDay?: number;
  /** Percentuale per imprevisti sul totale */
  contingencyPct?: number;
}

// ---------- Scenari ----------

export type ScenarioKind = 'auto_hytte' | 'auto_traghetti_costiera' | 'misto_treni' | 'altro';

/** Parte del viaggio che cambia da uno scenario all'altro. Hytte, opzioni costiere e catalogo sono condivisi. */
export interface PlanSnapshot {
  startDate: string;
  stops: Stop[];
  legs: Leg[];
  days: Record<string, DayPlan>;
  budgetItems: BudgetItem[];
  /** Opzioni costiere incluse nel budget in questo scenario */
  coastalSelected: ID[];
}

export interface Scenario {
  id: ID;
  name: string;
  kind: ScenarioKind;
  notes: string;
  updatedAt: string;
  /** Piano salvato; assente per lo scenario attivo, che vive nei campi principali del viaggio */
  plan?: PlanSnapshot;
}

export interface Trip {
  schemaVersion: 1;
  id: ID;
  title: string;
  startDate: string;
  dateTentative: boolean;
  participants: Participants;
  stops: Stop[];
  legs: Leg[];
  days: Record<string, DayPlan>;
  coastalOptions: CoastalOption[];
  /** Voli: facoltativo per compatibilità con i viaggi salvati prima della sezione Voli */
  flights?: Flight[];
  accommodations: Accommodation[];
  budgetItems: BudgetItem[];
  favorites: ID[];
  scenarios?: Scenario[];
  activeScenarioId?: ID;
  settings: TripSettings;
  updatedAt: string;
}
