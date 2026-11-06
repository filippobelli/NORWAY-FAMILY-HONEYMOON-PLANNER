import { useState } from 'react';
import { externalHref } from '../domain/lodging';
import type { Verification } from '../domain/types';
import { INFO_STATE_LABEL, verifiedNow, type InfoStatus } from '../domain/verification';
import { Badge, Field } from './common';
import { Icon } from './icons';

const TONE = { verificata: 'ok', da_verificare: 'neutral', da_ricontrollare: 'warn' } as const;
const ICON = { verificata: 'check', da_verificare: 'question', da_ricontrollare: 'warning' } as const;

/** Stato della verifica, con spiegazione e fonte: mai confondibile con una prenotazione. */
export function InfoBadge({ info, what = 'Informazione' }: { info: InfoStatus; what?: string }) {
  return (
    <span className="info-badge" title={info.why}>
      <Badge tone={TONE[info.state]}>
        <Icon name={ICON[info.state]} /> {what}: {INFO_STATE_LABEL[info.state].toLowerCase()}
      </Badge>
    </span>
  );
}

export function SourceLine({ info }: { info: InfoStatus }) {
  const href = externalHref(info.source?.url);
  return (
    <span className="small muted block">
      {info.why}
      {href ? (
        <>
          {' · '}
          <a href={href} target="_blank" rel="noreferrer">
            Fonte{info.source?.label && info.source.label !== 'Fonte inserita a mano' ? `: ${info.source.label}` : ''} ↗
          </a>
        </>
      ) : (
        info.state !== 'da_verificare' && ' · fonte non indicata'
      )}
    </span>
  );
}

/**
 * Controllo della verifica: «verificata» significa controllata sulla fonte in una data, non prenotata.
 * Un link di ricerca non è una fonte di conferma: la fonte va indicata da chi ha controllato.
 */
export function VerificationControl({ info, value, onChange, what = 'Informazione' }: { info: InfoStatus; value?: Verification; onChange: (v: Verification) => void; what?: string }) {
  const [url, setUrl] = useState(value?.source?.url ?? info.source?.url ?? '');
  return (
    <div className="verification">
      <div>
        <InfoBadge info={info} what={what} />
        <SourceLine info={info} />
      </div>
      <details className="more-fields">
        <summary>{info.state === 'verificata' ? 'Aggiorna la verifica' : 'Segna come verificata'}</summary>
        <Field label="Pagina dove hai controllato (facoltativa)" hint="Il sito dell'operatore o del fornitore, non una pagina di ricerca">
          {(id) => <input id={id} type="url" value={url} placeholder="https://…" onChange={(e) => setUrl(e.target.value)} />}
        </Field>
        <div className="row wrap">
          <button type="button" className="btn btn-small btn-primary" onClick={() => onChange(verifiedNow(url.trim() ? { label: 'Fonte inserita a mano', url: url.trim() } : undefined))}>
            Verificata oggi
          </button>
          {info.state !== 'da_verificare' && (
            <button type="button" className="btn btn-small" onClick={() => onChange({ state: 'da_verificare', source: value?.source ?? info.source })}>
              Da verificare di nuovo
            </button>
          )}
        </div>
      </details>
    </div>
  );
}
