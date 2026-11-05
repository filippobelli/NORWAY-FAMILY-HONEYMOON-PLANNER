// Stato del salvataggio in parole chiare. Funzione pura e testata: dice solo ciò che risulta davvero,
// «sincronizzato» compare unicamente quando il cloud ha confermato.

export type LocalState = 'salvato' | 'in_attesa' | 'errore';
export type CloudState = 'non_configurato' | 'non_connesso' | 'sincronizzato' | 'in_attesa' | 'in_corso' | 'offline' | 'errore' | 'conflitto';

export interface SyncView {
  label: string;
  /** Per lo spazio ridotto del telefono */
  short: string;
  tone: 'ok' | 'attesa' | 'problema';
  /** Che cosa significa e che cosa succede alle modifiche */
  detail: string;
  /** Si può chiedere subito un nuovo invio al cloud */
  canRetry: boolean;
}

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

export function syncView(local: LocalState, cloud: CloudState, lastSyncAt?: string, online = true): SyncView {
  if (local === 'errore') {
    return {
      label: 'Salvataggio sul dispositivo non riuscito',
      short: 'Non salvato',
      tone: 'problema',
      detail: 'Le ultime modifiche sono solo in questa pagina: non chiuderla ed esporta un backup.',
      canRetry: false,
    };
  }
  const here = local === 'in_attesa' ? 'Salvataggio sul dispositivo…' : undefined;
  switch (cloud) {
    case 'non_configurato':
      return { label: here ?? 'Salvato su questo dispositivo', short: here ? 'Salvataggio…' : 'Salvato qui', tone: here ? 'attesa' : 'ok', detail: 'Il cloud non è configurato: i dati restano su questo dispositivo. Esporta un backup per spostarli.', canRetry: false };
    case 'non_connesso':
      return { label: here ?? 'Salvato qui · cloud non collegato', short: here ? 'Salvataggio…' : 'Solo qui', tone: 'attesa', detail: 'Le modifiche sono su questo dispositivo. Accedi al cloud dalle Impostazioni per averle anche sugli altri.', canRetry: false };
    case 'in_attesa':
    case 'in_corso':
      return { label: 'Salvato qui · invio al cloud…', short: 'Invio…', tone: 'attesa', detail: 'Le modifiche sono già sul dispositivo e vengono inviate al cloud.', canRetry: false };
    case 'sincronizzato':
      if (here) return { label: 'Salvataggio…', short: 'Salvataggio…', tone: 'attesa', detail: 'La modifica si sta salvando sul dispositivo e poi andrà al cloud.', canRetry: false };
      return { label: lastSyncAt ? `Sincronizzato alle ${hhmm(lastSyncAt)}` : 'Sincronizzato', short: lastSyncAt ? `Cloud ${hhmm(lastSyncAt)}` : 'Sincronizzato', tone: 'ok', detail: 'Il cloud ha confermato le modifiche.', canRetry: true };
    case 'offline':
      return { label: 'Senza rete · salvato qui, invio in attesa', short: 'In attesa di rete', tone: 'attesa', detail: "Le modifiche sono sul dispositivo. L'invio riparte da solo al ritorno della rete.", canRetry: online };
    case 'errore':
      return { label: 'Cloud non raggiunto · salvato qui', short: 'Errore cloud', tone: 'problema', detail: 'Le modifiche restano sul dispositivo: puoi riprovare senza perderle.', canRetry: online };
    case 'conflitto':
      return { label: 'Sincronizzazione in pausa: da scegliere', short: 'Da scegliere', tone: 'problema', detail: 'Lo stesso dato è cambiato anche su un altro dispositivo: scegli quale versione tenere.', canRetry: false };
  }
}
