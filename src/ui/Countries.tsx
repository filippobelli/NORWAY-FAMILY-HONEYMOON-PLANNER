import { useEffect, useRef, useState } from 'react';
import type { CatalogCountry } from '../catalog/adapter';
import { countryInfo, placeCountry, useCatalog } from '../catalog/registry';
import { COASTAL_CATALOG } from '../data/coastalCatalog';
import { FILE_COUNTRY } from '../data/country';
import { DESTINATIONS } from '../data/destinations';
import { addCountry, countryUsage, releaseVersion, removeCountry, tripCountries, upgradeCatalog, usageEmpty } from '../domain/countries';
import { removeStops } from '../domain/itinerary';
import type { AvailableCountry, CatalogLoadState } from '../services/catalog/catalogService';
import { useTripCatalog } from '../state/catalog';
import { useTrip } from '../state/store';
import { useOnline } from '../state/uiContext';
import { Badge } from './common';
import { Modal } from './PlacementDialog';

// Nazioni del viaggio (design §1–§3): scelta all'inizio, aggiunta, rimozione con conferma, versione del catalogo.

const STATE_LABEL: Record<CatalogLoadState, string> = { sul_dispositivo: 'sul dispositivo', in_download: 'in download', da_scaricare: 'da scaricare', errore: 'da scaricare' };
const STATE_TONE: Record<CatalogLoadState, 'ok' | 'info' | 'warn'> = { sul_dispositivo: 'ok', in_download: 'info', da_scaricare: 'warn', errore: 'warn' };
const date = (iso?: string) => (iso ? iso.slice(0, 10) : 'data non indicata');

/** Nazioni con un catalogo pubblicato. Senza cloud (modalità di prova) solo quella del catalogo da file. */
function useAvailable(): { list?: AvailableCountry[]; error?: string } {
  const cat = useTripCatalog();
  const { fileMode, loadAvailable, available, availableError } = cat;
  const asked = useRef(false);
  useEffect(() => {
    if (fileMode || asked.current) return;
    asked.current = true;
    void loadAvailable();
  }, [fileMode, loadAvailable]);
  if (fileMode) return { list: [fileAvailable()] };
  return { list: available, error: availableError };
}

/** Catalogo da file come «nazione disponibile» (versione contenuta nell'app) */
const fileAvailable = (): AvailableCountry => ({ code: FILE_COUNTRY.code, name: FILE_COUNTRY.name, currency: FILE_COUNTRY.currency, timezone: FILE_COUNTRY.timezone, releaseId: FILE_COUNTRY.releaseId, version: FILE_COUNTRY.version, placeCount: DESTINATIONS.length });

function loadState(code: string, states: Record<string, CatalogLoadState>, fileMode: boolean): CatalogLoadState {
  if (fileMode) return 'sul_dispositivo';
  return states[code] ?? (countryInfo(code) ? 'sul_dispositivo' : 'da_scaricare');
}

function describe(info: CatalogCountry | undefined, releaseId: string): string {
  if (!info) return `Catalogo ${releaseId}`;
  // La versione è quella scelta dal viaggio (senza cloud i file valgono per tutte le versioni che contengono)
  const version = info.releaseId === releaseId ? info.version : (releaseVersion(releaseId) ?? info.version);
  return `Catalogo versione ${version} · pubblicato il ${date(info.publishedAt)} · ${info.placeCount} luoghi · valuta ${info.currency}`;
}

/** Riga «Nazioni» della Panoramica */
export function CountriesLine() {
  useCatalog();
  const { trip } = useTrip();
  const [open, setOpen] = useState(false);
  const list = tripCountries(trip);
  const names = list.map((c) => countryInfo(c.code)?.name ?? c.code);
  return (
    <p className="ov-sub">
      Nazioni: {list.length === 1 ? `${names[0]} (catalogo versione ${releaseVersion(list[0]!.releaseId) ?? countryInfo(list[0]!.code)?.version})` : names.join(', ')}
      {' · '}
      <button type="button" className="link-btn" onClick={() => setOpen(true)}>
        Gestisci le nazioni
      </button>
      {open && <CountriesDialog onClose={() => setOpen(false)} />}
    </p>
  );
}

/** Riquadro «Nazioni e cataloghi» delle Impostazioni */
export function CountriesPanel() {
  const { trip } = useTrip();
  const { states, fileMode } = useTripCatalog();
  const { list: listed } = useAvailable();
  const cat = useCatalog();
  // Senza l'elenco del server (non collegati) e con il catalogo dei file in uso, la versione proposta è quella
  // contenuta nell'app (NO-2): il passaggio resta una scelta esplicita con conferma
  const available = listed ?? (cat.source === 'file' ? [fileAvailable()] : undefined);
  const [open, setOpen] = useState(false);
  const [upgrading, setUpgrading] = useState<AvailableCountry>();
  return (
    <section className="panel" id="nazioni" aria-labelledby="nazioni-titolo">
      {upgrading && <UpgradeDialog target={upgrading} onClose={() => setUpgrading(undefined)} />}
      <h2 id="nazioni-titolo">Nazioni e cataloghi</h2>
      <ul className="plain-list">
        {tripCountries(trip).map((c) => {
          const info = countryInfo(c.code);
          const st = loadState(c.code, states, fileMode);
          const current = releaseVersion(c.releaseId) ?? info?.version ?? 0;
          const newer = available?.find((a) => a.code === c.code && a.version > current);
          return (
            <li key={c.code}>
              <strong>{info?.name ?? c.code}</strong> <Badge tone={STATE_TONE[st]}>{STATE_LABEL[st]}</Badge>
              <br />
              <span className="small">
                {describe(info, c.releaseId)}
                {info ? ` · fuso ${info.timezone}` : ''}
              </span>
              {newer && (
                <div className="small catalog-upgrade">
                  <p>
                    <Badge tone="info">versione {newer.version} disponibile</Badge> È uscita la versione {newer.version} del catalogo{newer.publishedAt ? ` (${date(newer.publishedAt)})` : ''}
                    {c.code === 'NO' && newer.version >= 2 ? ', con le tratte dei traghetti (Trasporti via mare)' : ''}. Il viaggio resta sulla versione {current} finché non scegli di passare.
                  </p>
                  <button className="btn btn-small" onClick={() => setUpgrading(newer)}>
                    Passa a {newer.releaseId}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="small muted">Il catalogo caricato nel viaggio non cambia da solo: resta questa versione anche se ne esce una più recente.</p>
      <button className="btn" onClick={() => setOpen(true)}>
        Gestisci le nazioni
      </button>
      {open && <CountriesDialog onClose={() => setOpen(false)} />}
    </section>
  );
}

/**
 * Passaggio a una versione più recente del catalogo (architettura §16.3), con conferma esplicita: la nuova contiene
 * la vecchia (stesse chiavi), nulla del viaggio cambia tranne la versione; si può annullare.
 */
function UpgradeDialog({ target, onClose }: { target: AvailableCountry; onClose: () => void }) {
  const { trip, update, replace, toast } = useTrip();
  const from = tripCountries(trip).find((c) => c.code === target.code);
  const confirm = () => {
    const before = trip;
    update((t) => upgradeCatalog(t, target.code, target.releaseId));
    toast(`${target.name}: catalogo ${target.releaseId} in uso`, 'ok', { label: 'Annulla', run: () => replace(before) });
    onClose();
  };
  return (
    <Modal title={`Passare al catalogo ${target.releaseId}?`} onClose={onClose}>
      <p>
        Il viaggio usa il catalogo {target.name} {from?.releaseId ?? ''}. La versione {target.version} contiene tutti i luoghi della versione precedente, con le stesse
        chiavi{target.code === 'NO' && target.version >= 2 ? ', più le tratte dei traghetti (Prenotazioni › Trasporti via mare › Traghetti)' : ''}.
      </p>
      <ul className="small">
        <li>Tappe, notti, idee, preferiti, attività, crociere e costi restano come sono.</li>
        <li>Cambia solo la versione del catalogo del viaggio: puoi annullare subito dopo.</li>
        <li>Le tariffe dei traghetti lette nel 2026 restano «da verificare» per il viaggio.</li>
      </ul>
      <div className="row wrap place-actions">
        <button className="btn btn-primary" onClick={confirm}>
          Passa a {target.releaseId}
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Annulla
        </button>
      </div>
    </Modal>
  );
}

/** Dialogo «Nazioni del viaggio»: elenco, aggiunta, rimozione con conferma */
export function CountriesDialog({ onClose }: { onClose: () => void }) {
  useCatalog();
  const { trip, update, replace, toast } = useTrip();
  const { states, errors, fileMode, retry } = useTripCatalog();
  const { list: available, error } = useAvailable();
  const online = useOnline();
  const [removing, setRemoving] = useState<string>();
  const [choice, setChoice] = useState<string>();
  const list = tripCountries(trip);
  const others = (available ?? []).filter((a) => !list.some((c) => c.code === a.code));

  if (removing) return <RemoveCountry code={removing} onBack={() => setRemoving(undefined)} onDone={onClose} />;

  const add = () => {
    const a = others.find((x) => x.code === choice);
    if (!a) return;
    const before = trip;
    update((t) => addCountry(t, a.code, a.releaseId));
    setChoice(undefined);
    toast(`${a.name} aggiunta al viaggio: scarico il catalogo versione ${a.version}`, 'ok', { label: 'Annulla', run: () => replace(before) });
  };

  return (
    <Modal title="Nazioni del viaggio" onClose={onClose}>
      <ul className="plain-list" aria-label="Nazioni nel viaggio">
        {list.map((c) => {
          const info = countryInfo(c.code);
          const st = loadState(c.code, states, fileMode);
          return (
            <li key={c.code}>
              <strong>{info?.name ?? c.code}</strong> <Badge tone={STATE_TONE[st]}>{STATE_LABEL[st]}</Badge>
              <br />
              <span className="small">{describe(info, c.releaseId)}</span>
              {st === 'in_download' && (
                <span className="small" role="status">
                  {' '}
                  <span className="spinner" aria-hidden /> Scarico il catalogo…
                </span>
              )}
              {errors[c.code] && (
                <span className="small warn-text" role="alert">
                  {' '}
                  {errors[c.code]}{' '}
                  {online && (
                    <button className="btn btn-small" onClick={retry}>
                      Riprova
                    </button>
                  )}
                </span>
              )}
              <div>
                {list.length > 1 ? (
                  <button className="btn btn-small danger" aria-label={`Togli ${info?.name ?? c.code} dal viaggio`} onClick={() => setRemoving(c.code)}>
                    Togli
                  </button>
                ) : (
                  <span className="small muted">È l'unica nazione del viaggio: non si può togliere.</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <fieldset className="place-q">
        <legend>Aggiungi nazione</legend>
        {available === undefined ? (
          <p className="small muted">{error ?? (online ? 'Carico le nazioni disponibili…' : 'Senza rete non posso mostrare le nazioni disponibili.')}</p>
        ) : others.length === 0 ? (
          <div className="empty">Non ci sono altre nazioni con un catalogo pubblicato.</div>
        ) : (
          <>
            {others.map((a) => (
              <label key={a.code} className="place-opt">
                <input type="radio" name="nazione-nuova" checked={choice === a.code} onChange={() => setChoice(a.code)} /> {a.name} · catalogo versione {a.version} · valuta {a.currency}
              </label>
            ))}
            <button className="btn btn-primary" disabled={!choice || !online} onClick={add}>
              Aggiungi e scarica il catalogo
            </button>
          </>
        )}
      </fieldset>
      <p className="small muted">Il catalogo di ogni nazione resta nella versione caricata: non cambia da solo.</p>
    </Modal>
  );
}

function RemoveCountry({ code, onBack, onDone }: { code: string; onBack: () => void; onDone: () => void }) {
  const { trip, update, replace, toast } = useTrip();
  const [ok, setOk] = useState(false);
  const name = countryInfo(code)?.name ?? code;
  const cat = useCatalog();
  const voyageKeys = new Set(COASTAL_CATALOG.filter((v) => cat.voyageCountry[v.id] === code).map((v) => v.id));
  const airports = new Set(DESTINATIONS.filter((d) => d.category === 'aeroporti' && placeCountry(d.id) === code).map((d) => d.id.toUpperCase()));
  const u = countryUsage(trip, code, placeCountry, { voyageKeys, airportCodes: airports });
  const empty = usageEmpty(u);
  const confirm = () => {
    const before = trip;
    update((t) => removeCountry(t, code, u.stops.map((s) => s.id), removeStops));
    toast(`${name} tolta dal viaggio`, 'ok', { label: 'Annulla', run: () => replace(before) });
    onDone();
  };
  return (
    <Modal title={`Togliere ${name} dal viaggio?`} onClose={onBack}>
      {empty ? (
        <p>Nessun elemento del viaggio usa questa nazione. Il suo catalogo viene tolto dal viaggio e da questo dispositivo.</p>
      ) : (
        <>
          <p>Questi elementi del viaggio usano la {name}:</p>
          <ul className="small">
            {u.stops.length > 0 && (
              <li>
                {u.stops.length} tappe: {u.stops.map((s) => `${s.name} (${s.nights} notti)`).join(', ')}
              </li>
            )}
            {(u.ideas > 0 || u.favorites > 0) && (
              <li>
                {u.ideas} idee e {u.favorites} preferiti del suo catalogo
              </li>
            )}
            {u.activities > 0 && <li>{u.activities} attività pianificate</li>}
            {u.coastal > 0 && <li>{u.coastal} opzioni di crociera</li>}
            {u.flights > 0 && <li>{u.flights} voli con aeroporto in questa nazione</li>}
          </ul>
          {u.stops.length > 0 && <p className="small">Le tappe si tolgono come sempre: le attività e le note restano, senza giornata, da ricollocare.</p>}
          <p className="small">Idee e preferiti di questa nazione restano salvati ma non si vedono finché non la aggiungi di nuovo. Voli e crociere restano in Prenotazioni: controllali tu.</p>
          {u.stops.length > 0 && (
            <label className="check impact-confirm">
              <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> Ho controllato l'elenco: togli le tappe di questa nazione.
            </label>
          )}
        </>
      )}
      <div className="row wrap place-actions">
        <button className="btn btn-primary danger" disabled={u.stops.length > 0 && !ok} onClick={confirm}>
          {u.stops.length ? `Togli la nazione e ${u.stops.length} tappe` : 'Togli la nazione'}
        </button>
        <button className="btn btn-ghost" onClick={onBack}>
          Annulla
        </button>
      </div>
    </Modal>
  );
}

/** Viaggio nuovo senza nazioni: scelta della prima (design §1) */
export function CountryChooser() {
  const { update } = useTrip();
  const { list: available, error } = useAvailable();
  const online = useOnline();
  const [choice, setChoice] = useState<string>();
  const sel = available?.length === 1 ? available[0]!.code : choice;
  const picked = available?.find((a) => a.code === sel);
  return (
    <section className="ov-start" aria-labelledby="ov-nazione-title">
      <h2 id="ov-nazione-title">In quale nazione viaggiate?</h2>
      <p>Scegli la prima nazione: l'app scarica il suo catalogo dei luoghi e lo tiene anche senza rete. Altre nazioni si aggiungono dopo.</p>
      {available === undefined ? (
        <p role="status">{!online ? 'Senza rete non posso mostrare le nazioni disponibili. Riprovo da solo quando torna la connessione.' : (error ?? 'Carico le nazioni disponibili…')}</p>
      ) : (
        <>
          <fieldset className="ov-start-grid">
            <legend className="sr-only">Nazioni disponibili</legend>
            {available.map((a) => (
              <label key={a.code} className={`ov-start-card ${sel === a.code ? 'is-recommended' : ''}`}>
                <input type="radio" name="prima-nazione" checked={sel === a.code} onChange={() => setChoice(a.code)} /> <strong>{a.name}</strong>
                <span className="small">
                  {' '}
                  Catalogo versione {a.version} · pubblicato il {date(a.publishedAt)}
                </span>
                <span className="small">
                  {' '}
                  {a.placeCount !== undefined ? `${a.placeCount} luoghi · ` : ''}valuta {a.currency}
                </span>
              </label>
            ))}
          </fieldset>
          <p className="small muted">Il catalogo resta quello di questa versione per tutto il viaggio, anche se in seguito ne esce una nuova.</p>
          <button className="btn btn-primary" disabled={!picked} onClick={() => picked && update((t) => ({ ...t, countries: [{ code: picked.code, releaseId: picked.releaseId }] }))}>
            {picked ? `Continua con ${picked.name}` : 'Scegli una nazione'}
          </button>
        </>
      )}
    </section>
  );
}

/** Nota del catalogo: nazioni e versioni caricate */
export function CatalogVersionNote() {
  useCatalog();
  const { trip } = useTrip();
  const list = tripCountries(trip)
    .map((c) => countryInfo(c.code))
    .filter((c): c is CatalogCountry => Boolean(c));
  if (!list.length) return null;
  if (list.length === 1) {
    const c = list[0]!;
    return (
      <>
        Catalogo {c.name} versione {c.version} ({date(c.publishedAt)}), {c.placeCount} luoghi.{' '}
      </>
    );
  }
  return <>Cataloghi: {list.map((c) => `${c.name} versione ${c.version} (${date(c.publishedAt)})`).join(', ')}. </>;
}
