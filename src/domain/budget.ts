import { toEur } from './coastal';
import { computeDays, legTotals, totalDays } from './itinerary';
import type { BudgetCategory, DataStatus, Trip } from './types';

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
  origin: 'manuale' | 'hytte' | 'costiera' | 'trasporti' | 'giornate';
  itemId?: string;
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
    if (s.fuelEurPerKm !== undefined) {
      lines.push({
        key: 'fuel',
        category: 'carburante_pedaggi',
        label: `Carburante stimato su ${Math.round(roadKm)} km stradali calcolati`,
        eur: roadKm * s.fuelEurPerKm,
        status: 'stimato',
        origin: 'trasporti',
      });
    } else {
      missing.push('Costo carburante per km non impostato');
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
  const days = totalDays(trip.stops);
  return { lines, byCategory, byStatus, total, perDay: days > 0 ? total / days : undefined, days, missing };
}

export function formatEur(v: number): string {
  return v.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}
