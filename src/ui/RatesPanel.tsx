import { useState } from 'react';
import { formatPeriod, fuelCostPerKm } from '../domain/budget';
import type { CarSettings, FuelType, TripSettings } from '../domain/types';
import { formatRateDate, refreshRatesNow } from '../state/autoRates';
import { useTrip } from '../state/store';
import { Field, NumberInput } from './common';

const FUEL_LABEL: Record<FuelType, string> = { benzina: 'Benzina', diesel: 'Diesel', elettrica: 'Elettrica' };
const DEFAULT_CAR: CarSettings = { fuel: 'benzina', consumption: 7, priceAuto: true };

export function RatesPanel() {
  const { trip, update, toast } = useTrip();
  const st = trip.settings;
  const car = st.car ?? DEFAULT_CAR;
  const fuel = fuelCostPerKm(st);
  const [refreshing, setRefreshing] = useState(false);
  const setS = (p: Partial<TripSettings>) => update((t) => ({ ...t, settings: { ...t.settings, ...p } }));
  const setCar = (p: Partial<CarSettings>) => update((t) => ({ ...t, settings: { ...t.settings, car: { ...(t.settings.car ?? DEFAULT_CAR), ...p } } }));

  const refresh = async () => {
    setRefreshing(true);
    const r = await refreshRatesNow(car.fuel === 'elettrica' ? undefined : car.fuel);
    setRefreshing(false);
    update((t) => {
      let settings = { ...t.settings };
      if (r.rate) settings = { ...settings, nokPerEur: r.rate.nokPerEur, nokRateDate: r.rate.date, nokRateAuto: true, nokRateNote: `${r.rate.source}, cambio del ${formatRateDate(r.rate.date)}.` };
      if (r.fuel && settings.car && settings.car.fuel !== 'elettrica')
        settings = { ...settings, car: { ...settings.car, priceAuto: true, priceNok: r.fuel.nokPerLitre, pricePeriod: r.fuel.period, priceSource: r.fuel.source } };
      return { ...t, settings };
    });
    toast(r.rate || r.fuel ? 'Cambio e carburante aggiornati' : 'Fonti non raggiungibili: restano i valori salvati', r.rate || r.fuel ? 'ok' : 'errore');
  };
  return (
        <section className="panel">
          <h2>Cambio e carburante</h2>
          <div className="grid-2">
            <Field label="Cambio NOK per 1 EUR" hint={st.nokRateNote}>
              {(id) => (
                <NumberInput
                  id={id}
                  value={st.nokPerEur}
                  min={1}
                  step={0.0001}
                  onChange={(v) => v && v > 0 && setS({ nokPerEur: v, nokRateAuto: false, nokRateNote: 'Impostato a mano: non si aggiorna in automatico.' })}
                />
              )}
            </Field>
            <div className="field">
              <span className="field-label">Aggiornamento del cambio</span>
              <div className="field-control">
                <label className="check">
                  <input type="checkbox" checked={st.nokRateAuto !== false} onChange={(e) => setS({ nokRateAuto: e.target.checked })} /> Automatico
                </label>
                <button className="btn btn-small" disabled={refreshing} onClick={refresh}>
                  {refreshing ? 'Aggiornamento…' : 'Aggiorna ora'}
                </button>
              </div>
              <small className="hint">All'apertura dell'app, al massimo ogni 6 ore</small>
            </div>
            <Field label="Alimentazione dell'auto">
              {(id) => (
                <select
                  id={id}
                  value={car.fuel}
                  onChange={(e) => {
                    const f = e.target.value as FuelType;
                    setCar(
                      f === 'elettrica'
                        ? { fuel: f, consumption: 20, priceAuto: false, priceNok: undefined, pricePeriod: undefined }
                        : { fuel: f, consumption: f === 'diesel' ? 6 : 7, priceAuto: true, priceNok: undefined, pricePeriod: undefined },
                    );
                    if (f !== 'elettrica') void refresh();
                  }}
                >
                  {(Object.keys(FUEL_LABEL) as FuelType[]).map((f) => (
                    <option key={f} value={f}>
                      {FUEL_LABEL[f]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={`Consumo (${car.fuel === 'elettrica' ? 'kWh' : 'litri'} ogni 100 km)`}>
              {(id) => <NumberInput id={id} value={car.consumption} min={0} step={0.1} onChange={(v) => v && v > 0 && setCar({ consumption: v })} />}
            </Field>
            <Field
              label={`Prezzo (NOK per ${car.fuel === 'elettrica' ? 'kWh' : 'litro'})`}
              hint={
                car.fuel === 'elettrica'
                  ? 'Inseriscilo tu: per la ricarica non c\'è una media nazionale ufficiale.'
                  : car.priceAuto
                    ? car.pricePeriod
                      ? `Media nazionale ${formatPeriod(car.pricePeriod)} (${car.priceSource ?? 'SSB'}), si aggiorna in automatico.`
                      : 'In attesa della media nazionale SSB…'
                    : 'Impostato a mano.'
              }
            >
              {(id) => (
                <NumberInput
                  id={id}
                  value={car.priceNok}
                  min={0}
                  step={0.01}
                  onChange={(v) => setCar({ priceNok: v, priceAuto: false, pricePeriod: undefined, priceSource: undefined })}
                />
              )}
            </Field>
            {car.fuel !== 'elettrica' && (
              <div className="field">
                <span className="field-label">Aggiornamento del prezzo</span>
                <label className="check field-control">
                  <input type="checkbox" checked={car.priceAuto} onChange={(e) => (e.target.checked ? void refresh() : setCar({ priceAuto: false }))} /> Media nazionale
                  automatica
                </label>
                <small className="hint">Statistics Norway, dato mensile</small>
              </div>
            )}
          </div>
          <p className="small">
            {fuel ? (
              <>
                Costo stimato: <strong>{fuel.eurPerKm.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 3 })} al km</strong> · {fuel.basis}
              </>
            ) : (
              <span className="muted">Costo al km non calcolabile: manca il prezzo.</span>
            )}
          </p>
        </section>
  );
}
