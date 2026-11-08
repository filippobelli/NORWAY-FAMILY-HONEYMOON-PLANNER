import { newId } from '../../domain/ids';

// Identificativo di questo dispositivo (D2: modalità per utente e dispositivo; sync_push registra da dove arriva
// una modifica). Generato una volta e tenuto in localStorage: non è un dato personale e non lascia il dispositivo
// se non come etichetta delle proprie righe.

const KEY = 'nfhp.device';
let memo: string | undefined;

export function getDeviceId(): string {
  if (memo) return memo;
  try {
    const v = localStorage.getItem(KEY);
    if (v && /^[A-Za-z0-9-]{8,64}$/.test(v)) return (memo = v);
    const id = newId();
    localStorage.setItem(KEY, id);
    return (memo = id);
  } catch {
    return (memo ??= newId());
  }
}
