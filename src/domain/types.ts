// Modello dati del planner. Entità distinte, serializzate insieme come documento "Trip".

export type ID = string;
/** Codice ISO 4217. EUR è la valuta del viaggio (totali e tetti); le altre vengono dalle nazioni del viaggio. */
export type Currency = string;

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

/**
 * Verifica di un'informazione che può cambiare (orari, disponibilità, durate). È distinta dalla prenotazione:
 * «verificata» vuol dire controllata sulla fonte, non prenotata. Facoltativa: assente nei viaggi salvati prima,
 * dove lo stato si ricava dai campi precedenti senza modificarli.
 */
export interface Verification {
  state: 'da_verificare' | 'verificata';
  /** ISO date-time dell'ultimo controllo */
  checkedAt?: string;
  source?: SourceRef;
  note?: string;
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
  /** Crociera per cui la tappa è stata creata (porti e notti a bordo): si toglie insieme a lei */
  placedFrom?: ID;
  /** Idee salvate: schede del catalogo che interessano, non ancora assegnate a un giorno */
  ideas?: ID[];
  /** Nazione della tappa (ISO 3166-1 alfa-2). Assente nei viaggi salvati prima: vale la prima nazione del viaggio */
  countryCode?: string;
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
  // Traghetto del catalogo (mode 'traghetto', catalogo NO-2+). Campi facoltativi: nei viaggi a righe vanno in
  // segments.extra senza colonne nuove (docs/architettura.md «Trasporti via mare (NO-2)»). Il conto si calcola, non si salva.
  /** route_key della tratta (stabile tra le versioni del catalogo); nessuna chiave esterna */
  ferryRouteId?: string;
  /** Versione del catalogo da cui è stata scelta la tratta, es. «NO-2» */
  ferryReleaseId?: string;
  /** seq delle fermate di imbarco e sbarco (sottotratta) */
  ferryBoardStop?: number;
  ferryAlightStop?: number;
  /** Con auto: si paga il veicolo (conducente incluso se la fonte lo dice) */
  withCar?: boolean;
  /** Ritorno acquistato con l'andata: sconto ritorno se la tratta lo prevede */
  ferryReturnBought?: boolean;
  /** Prenotazione facoltativa (es. plassgaranti) aggiunta al costo */
  ferryBookingAdded?: boolean;
  /** Costo inserito a mano: il calcolo dal catalogo non si usa */
  costByUser?: boolean;
  /** Volo interno della sezione Voli che copre questo tratto: il costo è conteggiato lì */
  flightId?: ID;
  /** [lat, lng] */
  geometry?: [number, number][];
  note?: string;
  /** Verifica di orario e durata sulla fonte dell'operatore */
  verification?: Verification;
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
  /** Verifica di orari, apertura e prezzo */
  verification?: Verification;
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
  /** Verifica di orario e prezzo sul sito dell'operatore */
  verification?: Verification;
  /** Inclusa nel budget/itinerario */
  selected: boolean;
  /** Proposta del catalogo da cui è stata creata (facoltativo: le opzioni inserite a mano non lo hanno) */
  catalogId?: ID;
}

// ---------- Sistemazioni ----------

/**
 * Stato di prenotazione. «disponibile» è un valore dei viaggi salvati prima: indica una disponibilità controllata,
 * non una prenotazione, e resta leggibile. «annullata» è una prenotazione disdetta.
 */
export type AccommodationStatus = 'individuata' | 'disponibile' | 'opzionata' | 'prenotata' | 'annullata';

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
  /** Verifica di disponibilità e prezzo per le date */
  verification?: Verification;
  /** Indirizzo e telefono, se noti: finiscono nel pacchetto offline */
  address?: string;
  phone?: string;
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
  /** Differenze con il percorso che l'utente ha deciso di lasciare così: non vengono richieste */
  keptIssues?: string[];
  /** Verifica di orari e prezzo */
  verification?: Verification;
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
  /** Dopo quanti giorni una verifica va ricontrollata (assente = 30) */
  recheckAfterDays?: number;
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

/** Parte del viaggio che cambia da una versione all'altra. Alloggi, opzioni costiere e catalogo sono condivisi. */
export interface PlanSnapshot {
  startDate: string;
  stops: Stop[];
  legs: Leg[];
  days: Record<string, DayPlan>;
  budgetItems: BudgetItem[];
  /** Opzioni costiere incluse nel budget in questo scenario */
  coastalSelected: ID[];
  /** Voli di questa versione; assente nei piani salvati prima: restano quelli attuali */
  flights?: Flight[];
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

// ---------- Stato effettivo e diario (fuori dal piano: non cambiano date, ordine, notti o budget) ----------

export type StopVisitState = 'in_corso' | 'visitata' | 'saltata';
export type ActivityDoneState = 'fatta' | 'saltata';

/** Solo ciò che è stato segnato: una tappa assente è Pianificata, un'attività assente è Da fare. */
export interface Actuals {
  stops: Record<ID, { state: StopVisitState; at: string }>;
  activities: Record<ID, { state: ActivityDoneState; at: string }>;
}

export interface DiaryAttachment {
  id: ID;
  name: string;
  type: string;
  size: number;
  /** Il file sta sul dispositivo (solo_dispositivo, errore) o nello Storage privato del cloud (nel_cloud) */
  state: 'solo_dispositivo' | 'errore' | 'nel_cloud';
  error?: string;
  /** Percorso nello Storage ({owner_id}/{trip_id}/{id}), dopo il caricamento confermato */
  storagePath?: string;
  /** ISO date-time del caricamento confermato */
  uploadedAt?: string;
}

export interface DiaryEntry {
  id: ID;
  createdAt: string;
  updatedAt: string;
  /** Data e ora locali di chi ha scritto */
  localDate: string;
  localTime: string;
  tzOffsetMin: number;
  text: string;
  /** Giornata per data, non per posizione: riordinare le tappe non la sposta */
  dayDate?: string;
  stopId?: ID;
  /** Nome al momento della scrittura: resta anche se la tappa viene tolta */
  stopName?: string;
  attachments?: DiaryAttachment[];
  deletedAt?: string;
}

export interface PlanLogEntry {
  id: ID;
  at: string;
  label: string;
  from: ID;
  to: ID;
}

// ---------- Nazioni e cambi ----------

/** Prezzo del carburante in una nazione (aggiornamento automatico solo dove c'è una fonte ufficiale) */
export interface CountryFuel {
  price?: number;
  currency?: string;
  auto?: boolean;
  period?: string;
  source?: string;
  fetchedAt?: string;
}

/** Nazione del viaggio con la versione del catalogo caricata: non cambia da sola */
export interface TripCountry {
  /** ISO 3166-1 alfa-2 */
  code: string;
  /** Versione del catalogo, es. «NO-1» */
  releaseId: string;
  fuel?: CountryFuel;
}

/** Cambio di una valuta: unità per 1 EUR */
export interface CurrencyRate {
  perEur?: number;
  date?: string;
  note: string;
  source?: string;
  auto: boolean;
  fetchedAt?: string;
}

export interface Trip {
  schemaVersion: 2;
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
  /** Numeri utili e note di viaggio scritte dall'utente: vanno nel pacchetto offline */
  usefulInfo?: string;
  actuals?: Actuals;
  diary?: DiaryEntry[];
  /** Registro delle versioni applicate, per rivedere e annullare */
  planLog?: PlanLogEntry[];
  /** Ultimo invio al cloud: riconosce la propria scrittura se la risposta si è persa */
  lastMutationId?: ID;
  scenarios?: Scenario[];
  activeScenarioId?: ID;
  settings: TripSettings;
  updatedAt: string;
  /**
   * Nazioni del viaggio, nell'ordine di aggiunta (la prima è la proposta per le tappe libere).
   * Assente nei viaggi salvati prima: vale Norvegia, catalogo NO-1 (vedi ensureCountries).
   */
  countries?: TripCountry[];
  /** Suggerimenti di traghetto nascosti dall'utente (design trasporti via mare, DU14); nei viaggi a righe in trips.extra */
  hiddenFerrySuggestions?: { legId: ID; ferryRouteId: string }[];
  /** Cambi delle valute diverse da EUR e NOK (il cambio NOK resta in settings.nokPerEur per compatibilità) */
  rates?: Record<string, CurrencyRate>;
}
