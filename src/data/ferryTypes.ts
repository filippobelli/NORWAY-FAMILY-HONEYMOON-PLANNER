// Tipi del catalogo traghetti (versione NO-2 del catalogo Norvegia). Scritti a mano: i dati sono in ferryRoutes.ts,
// GENERATO da scripts/build-ferry-routes.ts a partire da docs/ricerca-traghetti.json (letto il 2026-11-09).
// Stessa forma delle righe delle tabelle ferry_* (docs/architettura.md, «Trasporti via mare (NO-2)»).
// Regola: nessun valore inventato. Un dato non letto sulla fonte è assente (undefined/null) con stato «assente».

import type { Region } from '../domain/types';

/** ferje = traghetto per auto (AutoPASS); hurtigbat = battello veloce passeggeri; turistico = battello o traghetto turistico con tariffa propria */
export type FerryMode = 'ferje' | 'hurtigbat' | 'turistico';

/** Stato di un dato del catalogo traghetti. «confermato» = letto sulla fonte primaria. */
export type FerryDataStatus = 'confermato' | 'da_verificare' | 'assente';

/** Fonte (dizionario per chiave): URL e data di lettura */
export interface FerrySource {
  key: string;
  title: string;
  url: string;
  checkedAt: string;
}

/** Tipo di fermata, solo se scritto nella fonte (nel nome o nella nota della durata) */
export type FerryCall = 'fermata' | 'a_richiesta' | 'solo_discesa' | 'solo_passaggio' | 'senza_sbarco';

/** Passeggeri: gratis / a pagamento / la fonte non lo dice */
export type FerryPassengerRule = 'gratis' | 'a_pagamento' | 'non_indicata';

export interface FerryStop {
  /** Ordine lungo la tratta, da 1 */
  seq: number;
  name: string;
  /** Minuti dalla partenza: valore singolo (min = max) o intervallo; assenti se non pubblicati */
  minutesMin?: number;
  minutesMax?: number;
  call: FerryCall;
  /** Registro nazionale delle fermate (NSR, Entur). Coordinate SOLO da qui, mai stimate. */
  nsrId?: string;
  lat?: number;
  lng?: number;
}

/** Valore descrittivo con stato e fonte (stagione, frequenza estiva) */
export interface FerryText {
  text: string;
  status: FerryDataStatus;
  sourceKey?: string;
  /** Anno a cui si riferisce il testo, se la fonte lo dice */
  year?: number;
}

export interface FerryDuration {
  /** Minuti: min = max per un valore singolo; assenti se non pubblicati */
  min?: number;
  max?: number;
  status: FerryDataStatus;
  note?: string;
  sourceKey?: string;
}

export type FerryFareCategory =
  | 'adulto'
  | 'bambino'
  | 'giovane'
  | 'senior'
  | 'famiglia'
  | 'veicolo'
  | 'pacchetto_veicolo'
  | 'prenotazione_adulto'
  | 'prenotazione_bambino'
  | 'prenotazione_veicolo';

/** Una voce di tariffa, come pubblicata. Importi in NOK. */
export interface FerryFare {
  category: FerryFareCategory;
  /** null = la voce esiste ma l'importo non è pubblicato (stato «assente») */
  amountNok: number | null;
  trip: 'andata' | 'andata_ritorno';
  /** Fascia d'età della categoria, se la fonte la indica (estremi compresi) */
  ageMin?: number;
  ageMax?: number;
  /** Testo della fascia come scritto dalla fonte */
  ageText?: string;
  /** Solo veicolo/pacchetto: classe di lunghezza. Il sistema norvegese ha «fino a 6 m», non 5 m. */
  vehicleClass?: 'fino_6m';
  /** Veicolo/pacchetto: conducente compreso nel prezzo. null = la fonte non lo dice (da verificare) */
  driverIncluded?: boolean | null;
  /** Pacchetto: passeggeri compresi oltre al conducente; famiglia: adulti e bambini compresi */
  passengersIncluded?: number;
  adultsIncluded?: number;
  childrenIncluded?: number;
  /** Sottotratta con prezzo proprio (nomi come nella fonte) */
  fromStop?: string;
  toStop?: string;
  /** Tariffa di un solo giorno della settimana */
  dayType?: 'sabato';
  /** Periodo di validità come scritto dalla fonte */
  period?: string;
  /** Voce facoltativa, non inclusa per default (es. prenotazione/plassgaranti) */
  optional?: boolean;
  year?: number;
  status: FerryDataStatus;
  sourceKey?: string;
  note?: string;
}

export interface FerryFareInfo {
  status: FerryDataStatus;
  /** Anno della tariffa (numerico) e testo dell'anno se non è un solo anno (es. «2026/2027») */
  year?: number;
  yearLabel?: string;
  validFrom?: string;
  period?: string;
  sourceKey?: string;
  note?: string;
  /** Sempre vero per le tariffe lette nel 2026: «da verificare per il 2027» */
  verifyForTripYear: boolean;
  /**
   * Regola passeggeri scritta dalla fonte. «non_indicata» (es. Møre og Romsdal) = senza auto il costo è
   * «non calcolabile», mai 0 (design DU9).
   */
  passengerRule: FerryPassengerRule;
  passengersText?: string;
  /** Bambini sotto questa età gratis (fonte) */
  freeUnderAge?: number;
  childAgeText?: string;
  adultAgeText?: string;
  /** Tetto per bambino con adulto pagante (es. Bergen–Flåm 209) */
  childCapNok?: number;
  /** Sconto sul ritorno acquistato con l'andata, in percento */
  returnDiscountPct?: number;
  /** Regole come scritte dalla fonte: si mostrano, non si interpretano */
  rules: string[];
  generalRules?: string;
  fares: FerryFare[];
}

export interface FerryEnturLine {
  id: string;
  code: string;
  name: string;
  operator: string | null;
  validFrom: string;
  validTo: string;
  /** Corse in tre giorni campione (orario invernale): solo riferimento, mai frequenza estiva */
  sampleTrips: { wed: number; sat: number; sun: number };
}

export interface FerryRoute {
  /** Chiave stabile kebab-case (route_key), uguale in tutte le versioni del catalogo */
  key: string;
  name: string;
  operator: string;
  mode: FerryMode;
  zone: string;
  region: Region;
  road?: string;
  carriesCar: boolean;
  /** Tratta che parte e torna allo stesso porto (escursione, non collegamento tra due tappe) */
  roundTrip: boolean;
  fromName: string;
  toName: string;
  stops: FerryStop[];
  duration: FerryDuration;
  summerFrequency: FerryText;
  season: FerryText;
  fare: FerryFareInfo;
  /** Luoghi del catalogo (place_key) collegati: solo per id, mai per distanza */
  places: { from?: string; to?: string; along: string[] };
  sourceKeys: string[];
  notes: string[];
  enturLine?: FerryEnturLine;
  checkedAt: string;
}
