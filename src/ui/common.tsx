import { useId, type ReactNode } from 'react';
import { STATUS_LABEL } from '../domain/budget';
import type { Currency, DataStatus, Money, TransportMode } from '../domain/types';

export const MODE_LABEL: Record<TransportMode, string> = {
  strada: 'Strada',
  traghetto: 'Traghetto',
  costiera: 'Navigazione costiera',
  treno: 'Treno',
  bus: 'Autobus',
  aereo: 'Aereo',
  non_calcolato: 'Non calcolato',
};

export const MODE_ICON: Record<TransportMode, string> = {
  strada: '🚗',
  traghetto: '⛴️',
  costiera: '🚢',
  treno: '🚆',
  bus: '🚌',
  aereo: '✈️',
  non_calcolato: '❔',
};

export const MODE_COLOR: Record<TransportMode, string> = {
  strada: '#2563eb',
  traghetto: '#0d9488',
  costiera: '#7c3aed',
  treno: '#b45309',
  bus: '#ca8a04',
  aereo: '#64748b',
  non_calcolato: '#94a3b8',
};

export function StatusBadge({ status }: { status: DataStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'warn' | 'ok' | 'info'; children: ReactNode }) {
  return <span className={`badge badge-tone-${tone}`}>{children}</span>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint && <small className="hint">{hint}</small>}
    </div>
  );
}

export function StatusSelect({ id, value, onChange, ariaLabel }: { id?: string; value: DataStatus; onChange: (s: DataStatus) => void; ariaLabel?: string }) {
  return (
    <select id={id} aria-label={id ? undefined : (ariaLabel ?? 'Stato del dato')} value={value} onChange={(e) => onChange(e.target.value as DataStatus)}>
      {(Object.keys(STATUS_LABEL) as DataStatus[]).map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

export function parseNum(v: string): number | undefined {
  if (v.trim() === '') return undefined;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

export function NumberInput({
  id,
  value,
  onChange,
  min,
  step,
  placeholder,
  ariaLabel,
}: {
  id?: string;
  value: number | undefined;
  onChange: (n: number | undefined) => void;
  min?: number;
  step?: number;
  placeholder?: string;
  ariaLabel?: string;
}) {
  return (
    <input
      id={id}
      aria-label={id ? undefined : ariaLabel}
      type="number"
      inputMode="decimal"
      value={value ?? ''}
      min={min}
      step={step ?? 'any'}
      placeholder={placeholder}
      onChange={(e) => onChange(parseNum(e.target.value))}
    />
  );
}

export function MoneyInput({ id, value, onChange, ariaLabel }: { id?: string; value: Money | undefined; onChange: (m: Money | undefined) => void; ariaLabel?: string }) {
  const currency: Currency = value?.currency ?? 'EUR';
  return (
    <div className="money">
      <input
        id={id}
        aria-label={id ? undefined : (ariaLabel ?? 'Importo')}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value?.amount ?? ''}
        placeholder="—"
        onChange={(e) => {
          const n = parseNum(e.target.value);
          onChange(n === undefined ? undefined : { amount: n, currency });
        }}
      />
      <select
        aria-label="Valuta"
        value={currency}
        onChange={(e) => value && onChange({ ...value, currency: e.target.value as Currency })}
      >
        <option value="EUR">EUR</option>
        <option value="NOK">NOK</option>
      </select>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <div>{children}</div>}
    </div>
  );
}

export function fmtMoney(m: Money | undefined): string {
  if (!m) return '—';
  return m.amount.toLocaleString('it-IT', { style: 'currency', currency: m.currency, maximumFractionDigits: 0 });
}

export function fmtDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
