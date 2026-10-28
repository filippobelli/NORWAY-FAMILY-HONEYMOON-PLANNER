import type { CoastalCatalogVoyage } from '../data/coastalCatalog';
import { portsFor, type CoastalPort } from '../data/coastalPorts';
import { newId } from './ids';
import type { CoastalOption, Money, Participants, TripSettings } from './types';

export interface CoastalRoute {
  ports: CoastalPort[];
  /** Numero di scali intermedi (esclusi imbarco e sbarco) */
  intermediateStops: number;
  valid: boolean;
  error?: string;
}

export function coastalRoute(direction: 'nord' | 'sud', from: string, to: string): CoastalRoute {
  const list = portsFor(direction);
  const a = list.findIndex((p) => p.name === from);
  const b = list.findIndex((p) => p.name === to);
  if (a < 0 || b < 0) return { ports: [], intermediateStops: 0, valid: false, error: 'Porto non servito in questa direzione' };
  if (a >= b) {
    return {
      ports: [],
      intermediateStops: 0,
      valid: false,
      error: `Con direzione ${direction} il porto di sbarco deve venire dopo quello di imbarco`,
    };
  }
  const ports = list.slice(a, b + 1);
  return { ports, intermediateStops: ports.length - 2, valid: true };
}

export function toEur(m: Money | undefined, settings: TripSettings): number {
  if (!m) return 0;
  return m.currency === 'EUR' ? m.amount : m.amount / settings.nokPerEur;
}

export function coastalTotalEur(o: CoastalOption, settings: TripSettings): number | undefined {
  if (!o.price) return undefined;
  return toEur(o.price, settings) + toEur(o.extras, settings);
}

/** Punteggio semplice di "valore per la famiglia" usato solo per ordinare il confronto. */
export function familyValueNotes(o: CoastalOption): string[] {
  const notes: string[] = [];
  if (o.nightsOnboard > 0 && !/cabin|cabina/i.test(o.cabin)) notes.push('Tratto notturno senza cabina indicata');
  if (o.durationHours !== undefined && o.durationHours > 23 && o.operator === 'Hurtigruten') {
    notes.push('Oltre 23 ore: con Hurtigruten la cabina è obbligatoria');
  }
  if (o.meals === 'da_definire') notes.push('Pasti da definire');
  if (o.priceStatus === 'da_verificare' || o.priceStatus === 'stimato') notes.push('Prezzo non confermato');
  if (o.withCar) notes.push('Con auto: verificare disponibilità posto auto nei porti scelti');
  return notes;
}

const MEALS_IT: Record<CoastalOption['meals'], string> = {
  nessuno: 'nessun pasto incluso',
  mezza_pensione: 'mezza pensione',
  pensione_completa: 'pensione completa',
  a_la_carte: 'à la carte',
  da_definire: 'pasti da definire',
};

/**
 * Crea un'opzione costiera precompilata da una proposta del catalogo. Non modifica il viaggio: l'utente la rivede e la salva.
 * Prezzo: solo per le proposte con prezzo estivo pubblicato (agosto 2027), come stima = persone × prezzo minimo a persona,
 * con stato «stimato». Per le altre il prezzo resta vuoto («da verificare»): il prezzo di riferimento è in un'altra stagione.
 */
export function optionFromCatalog(v: CoastalCatalogVoyage, participants: Participants): CoastalOption {
  const persons = participants.adults + participants.childrenAges.length;
  const cheapest = v.prices.reduce<{ cabin: string; perPerson: number } | undefined>((m, p) => (!m || p.perPerson < m.perPerson ? p : m), undefined);
  const priceList = v.prices.map((p) => `${p.cabin} da ${p.perPerson.toLocaleString('it-IT')} € a persona`).join(', ');
  const notes = [
    `${v.title} — ${v.route}. ${v.summary}`,
    `${v.days} giorni, ${v.stops} porti/località, ${MEALS_IT[v.meals]}.`,
    `Prezzi pubblicati (${v.priceValidFor}): ${priceList}. ${v.priceBasis}`,
    v.summerPrice && cheapest
      ? `Stima nel campo prezzo: ${persons} persone × ${cheapest.perPerson.toLocaleString('it-IT')} € (${cheapest.cabin.toLowerCase()}). Riduzioni per i bambini, cabina per ${persons} e auto da verificare: il costo reale può essere diverso.`
      : `Prezzo estivo non pubblicato: il prezzo indicato vale per ${v.priceValidFor}, non per agosto. Inserisci il preventivo reale quando le date saranno in vendita.`,
    ...v.summerNotes,
    ...(v.itinerary ?? []).map((d) => `Giorno ${d.day} — ${d.title}: ${d.ports.join(', ')}`),
  ];
  return {
    id: newId(),
    operator: v.operator,
    direction: v.direction,
    fromPort: v.fromPort,
    toPort: v.toPort,
    nightsOnboard: Math.max(0, v.days - 1),
    cabin: v.summerPrice && cheapest ? `${cheapest.cabin} (prezzo da catalogo, da confermare)` : '',
    withCar: false,
    meals: v.meals,
    price: v.summerPrice && cheapest ? { amount: cheapest.perPerson * persons, currency: 'EUR' } : undefined,
    priceStatus: v.summerPrice ? 'stimato' : 'da_verificare',
    childRules: '',
    changePolicy: '',
    notes: notes.join('\n'),
    source: { label: `${v.operator} — catalogo «${v.title}»`, url: v.url, checkedAt: v.checkedAt },
    selected: false,
    catalogId: v.id,
  };
}
