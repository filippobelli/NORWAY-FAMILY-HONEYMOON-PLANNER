import { toEur } from './coastal';
import { computeDays, legTotals, totalDays } from './itinerary';
import type { BudgetCategory, DataStatus, TripSettings, Trip } from './types';

export const BUDGET_CATEGORIES: { id: BudgetCategory; label: string }[] = [
  { id: 'voli', label: "Voli da e per l'Italia" },
  { id: 'bagagli_transfer', label: 'Bagagli e trasferimenti aeroportuali' },
  { id: 'noleggio_auto', label: 'Noleggio auto e assicurazioni' },
  { id: 'carburante_pedaggi', label: 'Carburante, pedaggi e parcheggi' },
  { id: 'traghetti', label: 'Traghetti' },
  { id: 'costiera', label: 'Hurtigruten / Havila' },
  { id: 'treni_bus', label: 'Treni e autobus' },
  { id: 'alloggi', label: 'Hytte e altre sistemazioni' },
  { id: 'pasti', label: 'Alimentari e pasti' },
  { id: 'attrazioni', label: 'Attrazioni ed escursioni' },
  { id: 'extra_imprevisti', label: 'Spese extra e fondo imprevisti' },
];

export const STATUS_LABEL: Record<DataStatus, string> = {
  confermato: 'Confermato da fonte',
  stimato: 'Stimato',
  da_verificare: 'Da verificare',
  prenotato: 'Prenotato',
  pagato: 'Pagato',
};

export interface BudgetLine {
  key: string;
  category: BudgetCategory;
  label: string;
  eur: number;
  status: DataStatus;
  /** Da dove arriva la riga: manuale o calcolata da un'altra sezione */
  origin: 'manuale' | 'hytte' | 'costiera' | 'trasporti' | 'giornate' | 'stime';
  itemId?: string;
}

export interface FuelCost {
  eurPerKm: number;
  /** Come è stato ottenuto, per mostrarlo accanto alla cifra */
  basis: string;
}

const FUEL_UNIT = { benzina: 'l', diesel: 'l', elettrica: 'kWh' } as const;

/** Costo per km: da consumo × prezzo dell'auto se disponibili, altrimenti il valore inserito a mano. */
export function fuelCostPerKm(s: TripSettings): FuelCost | undefined {
  const c = s.car;
  if (c && c.consumption > 0 && c.priceNok && c.priceNok > 0 && s.nokPerEur > 0) {
    const u = FUEL_UNIT[c.fuel];
    const price = c.priceNok.toLocaleString('it-IT', { maximumFractionDigits: 2 });
    const src = c.priceAuto && c.pricePeriod ? `media nazionale ${formatPeriod(c.pricePeriod)}` : 'prezzo inserito';
    return { eurPerKm: ((c.consumption / 100) * c.priceNok) / s.nokPerEur, basis: `${c.consumption} ${u}/100 km × ${price} NOK/${u} (${src})` };
  }
  if (s.fuelEurPerKm !== undefined) return { eurPerKm: s.fuelEurPerKm, basis: 'costo per km inserito a mano' };
  return undefined;
}

const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
/** "2026M09" → "set 2026" */
export function formatPeriod(p: string): string {
  const m = p.match(/^(\d{4})M(\d{2})$/);
  return m ? `${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}` : p;
}

export interface CapStatus {
  cap: number;
  spent: number;
  left: number;
  over: boolean;
}

export function capStatus(cap: number | undefined, spent: number): CapStatus | undefined {
  if (!cap || cap <= 0) return undefined;
  return { cap, spent, left: cap - spent, over: spent > cap };
}

export interface BudgetSummary {
  lines: BudgetLine[];
  byCategory: Record<BudgetCategory, number>;
  byStatus: Record<DataStatus, number>;
  total: number;
  perDay?: number;
  days: number;
  missing: string[];
}

/** Calcola il budget: voci manuali + voci derivate dalle altre sezioni (senza doppi conteggi). */
export function computeBudget(trip: Trip): BudgetSummary {
  const s = trip.settings;
  const lines: BudgetLine[] = [];
  const missing: string[] = [];

  for (const it of trip.budgetItems) {
    lines.push({
      key: `m-${it.id}`,
      category: it.category,
      label: it.label,
      eur: toEur(it.amount, s),
      status: it.status,
      origin: 'manuale',
      itemId: it.id,
    });
  }

  // Alloggi scelti per ogni tappa (le alternative non sono conteggiate): prezzo/notte × notti + extra
  for (const stop of trip.stops) {
    if (!stop.accommodationId || stop.nights === 0) continue;
    const a = trip.accommodations.find((x) => x.id === stop.accommodationId);
    if (!a) continue;
    if (!a.pricePerNight) {
      missing.push(`Prezzo mancante per "${a.name}"`);
      continue;
    }
    const eur = toEur(a.pricePerNight, s) * stop.nights + toEur(a.cleaningFee, s) + toEur(a.linenFee, s);
    lines.push({
      key: `a-${a.id}`,
      category: 'alloggi',
      label: `${a.name} — ${stop.nights} notti a ${stop.name}`,
      eur,
      status: a.status === 'prenotata' ? 'prenotato' : a.priceStatus,
      origin: 'hytte',
    });
  }

  // Navigazione costiera: coerenza tra opzioni incluse nel budget e tratti dell'itinerario
  const linked = new Set(trip.legs.flatMap((l) => l.segments.map((sg) => sg.coastalOptionId)).filter(Boolean));
  for (const o of trip.coastalOptions) {
    if (linked.has(o.id) && !o.selected) missing.push(`${o.operator} ${o.fromPort} → ${o.toPort} è nell'itinerario ma esclusa dal budget`);
  }

  // Navigazione costiera selezionata
  for (const o of trip.coastalOptions.filter((x) => x.selected)) {
    if (!o.price) {
      missing.push(`Prezzo mancante per ${o.operator} ${o.fromPort} → ${o.toPort}`);
      continue;
    }
    lines.push({
      key: `c-${o.id}`,
      category: 'costiera',
      label: `${o.operator} ${o.fromPort} → ${o.toPort}`,
      eur: toEur(o.price, s) + toEur(o.extras, s),
      status: o.priceStatus,
      origin: 'costiera',
    });
  }

  // Segmenti di trasporto con costo (traghetti, treni, bus...). La costiera è già contata sopra.
  let roadKm = 0;
  for (const leg of trip.legs) {
    roadKm += legTotals(leg).roadKm;
    for (const seg of leg.segments) {
      if (seg.coastalOptionId) continue;
      if (seg.mode === 'traghetto' && !seg.cost) missing.push(`Costo traghetto mancante: ${seg.label}`);
      if (!seg.cost) continue;
      const category: BudgetCategory =
        seg.mode === 'traghetto' ? 'traghetti' : seg.mode === 'treno' || seg.mode === 'bus' ? 'treni_bus' : seg.mode === 'aereo' ? 'voli' : 'carburante_pedaggi';
      lines.push({
        key: `s-${seg.id}`,
        category,
        label: seg.label,
        eur: toEur(seg.cost, s),
        status: seg.costStatus,
        origin: 'trasporti',
      });
    }
  }

  if (roadKm > 0) {
    const fuel = fuelCostPerKm(s);
    if (fuel) {
      lines.push({
        key: 'fuel',
        category: 'carburante_pedaggi',
        label: `Carburante su ${Math.round(roadKm)} km stradali calcolati: ${fuel.basis}`,
        eur: roadKm * fuel.eurPerKm,
        status: 'stimato',
        origin: 'trasporti',
      });
    } else {
      missing.push('Costo del carburante non impostato (consumo e prezzo dell\'auto)');
    }
  }

  // Attività con costo nelle giornate esistenti (le giornate rimaste senza tappa non sono contate)
  const liveKeys = new Set(computeDays(trip).map((d) => d.key));
  for (const [dayKey, day] of Object.entries(trip.days)) {
    if (!liveKeys.has(dayKey)) {
      if (day.activities.some((a) => a.cost)) missing.push('Attività con costo in giornate non più presenti nell\'itinerario (non conteggiate)');
      continue;
    }
    for (const act of day.activities) {
      if (!act.cost) continue;
      lines.push({
        key: `d-${dayKey}-${act.id}`,
        category: 'attrazioni',
        label: act.title,
        eur: toEur(act.cost, s),
        status: act.costStatus,
        origin: 'giornate',
      });
    }
  }

  // Stime da parametri dell'utente, solo dove mancano dati reali (niente doppi conteggi)
  const e = s.estimates ?? {};
  const days = totalDays(trip.stops);
  const has = (c: BudgetCategory) => lines.some((l) => l.category === c && l.origin !== 'stime');
  if (e.lodgingPerNight && e.lodgingPerNight > 0) {
    for (const stop of trip.stops) {
      if (stop.kind !== 'luogo' || stop.nights === 0) continue;
      const a = stop.accommodationId ? trip.accommodations.find((x) => x.id === stop.accommodationId) : undefined;
      if (a?.pricePerNight) continue;
      lines.push({
        key: `e-lodging-${stop.id}`,
        category: 'alloggi',
        label: `Stima alloggio a ${stop.name}: ${stop.nights} ${stop.nights === 1 ? 'notte' : 'notti'} × ${formatEur(e.lodgingPerNight)}`,
        eur: stop.nights * e.lodgingPerNight,
        status: 'stimato',
        origin: 'stime',
      });
    }
  }
  if (days > 0 && e.foodPerDay && e.foodPerDay > 0 && !has('pasti')) {
    lines.push({ key: 'e-food', category: 'pasti', label: `Stima pasti e spesa: ${days} giorni × ${formatEur(e.foodPerDay)}`, eur: days * e.foodPerDay, status: 'stimato', origin: 'stime' });
  }
  if (days > 0 && e.carRentalPerDay && e.carRentalPerDay > 0 && !has('noleggio_auto')) {
    lines.push({
      key: 'e-car',
      category: 'noleggio_auto',
      label: `Stima noleggio auto: ${days} giorni × ${formatEur(e.carRentalPerDay)}`,
      eur: days * e.carRentalPerDay,
      status: 'stimato',
      origin: 'stime',
    });
  }
  if (days > 0 && e.activitiesPerDay && e.activitiesPerDay > 0) {
    const pricedDays = new Set(Object.entries(trip.days).filter(([, d]) => d.activities.some((x) => x.cost)).map(([k]) => k));
    const free = computeDays(trip).filter((d) => !d.isDepartureDay && !pricedDays.has(d.key)).length;
    if (free > 0) {
      lines.push({
        key: 'e-act',
        category: 'attrazioni',
        label: `Stima attività: ${free} giorni senza attività con prezzo × ${formatEur(e.activitiesPerDay)}`,
        eur: free * e.activitiesPerDay,
        status: 'stimato',
        origin: 'stime',
      });
    }
  }
  if (e.contingencyPct && e.contingencyPct > 0 && !has('extra_imprevisti')) {
    const base = lines.reduce((sum, l) => sum + l.eur, 0);
    if (base > 0) {
      lines.push({
        key: 'e-extra',
        category: 'extra_imprevisti',
        label: `Fondo imprevisti: ${e.contingencyPct}% del resto del budget`,
        eur: (base * e.contingencyPct) / 100,
        status: 'stimato',
        origin: 'stime',
      });
    }
  }

  const byCategory = Object.fromEntries(BUDGET_CATEGORIES.map((c) => [c.id, 0])) as Record<BudgetCategory, number>;
  const byStatus: Record<DataStatus, number> = { confermato: 0, stimato: 0, da_verificare: 0, prenotato: 0, pagato: 0 };
  let total = 0;
  for (const l of lines) {
    byCategory[l.category] += l.eur;
    byStatus[l.status] += l.eur;
    total += l.eur;
  }
  for (const c of BUDGET_CATEGORIES) {
    if (byCategory[c.id] === 0) missing.push(`Nessuna voce per "${c.label}"`);
  }
  return { lines, byCategory, byStatus, total, perDay: days > 0 ? total / days : undefined, days, missing };
}

const ORIGIN_TEXT: Record<BudgetLine['origin'], string> = {
  manuale: 'voce manuale',
  hytte: 'alloggi scelti',
  costiera: 'navigazione costiera',
  trasporti: 'tratti dell\'itinerario',
  giornate: 'attività delle giornate',
  stime: 'stime da parametri',
};

export interface BudgetOverlap {
  category: BudgetCategory;
  text: string;
}

/**
 * Possibili doppi conteggi: una categoria con voci manuali e anche voci derivate da altre sezioni.
 * Il modello non permette di sapere se si sovrappongono (es. un pacchetto che include il traghetto),
 * quindi si segnala soltanto: nessun importo viene tolto o corretto.
 */
export function budgetOverlaps(b: BudgetSummary): BudgetOverlap[] {
  const out: BudgetOverlap[] = [];
  for (const c of BUDGET_CATEGORIES) {
    const lines = b.lines.filter((l) => l.category === c.id);
    const manual = lines.filter((l) => l.origin === 'manuale');
    // Le stime di alloggi e attività si aggiungono anche quando esistono voci manuali: vanno controllate come le voci derivate
    const derived = [...new Set(lines.filter((l) => l.origin !== 'manuale').map((l) => l.origin))];
    if (manual.length > 0 && derived.length > 0) {
      out.push({
        category: c.id,
        text: `${c.label}: ${manual.length === 1 ? '1 voce manuale' : `${manual.length} voci manuali`} e importi da ${derived.map((o) => ORIGIN_TEXT[o]).join(', ')}. Controlla che la voce manuale non includa già quei costi.`,
      });
    }
  }
  return out;
}

export interface BudgetCompleteness {
  /** true se la somma delle voci note non rappresenta l'intero viaggio */
  partial: boolean;
  /** Costi che esistono ma non hanno un importo */
  missingAmounts: string[];
  /** Categorie senza voci né stime */
  emptyCategories: string[];
}

export function budgetCompleteness(b: BudgetSummary): BudgetCompleteness {
  const missingAmounts = b.missing.filter((m) => !m.startsWith('Nessuna voce'));
  const emptyCategories = BUDGET_CATEGORIES.filter((c) => b.byCategory[c.id] === 0).map((c) => c.label);
  return { partial: b.total === 0 || missingAmounts.length > 0 || emptyCategories.length > 0, missingAmounts, emptyCategories };
}

export function formatEur(v: number): string {
  return v.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}
