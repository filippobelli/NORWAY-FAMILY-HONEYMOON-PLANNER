// Passaggio del viaggio dal documento alle righe (docs/architettura.md §9): quando l'app lo offre.
// - vuoto o altro valore (predefinito): mai, il pulsante non compare (finché Filippo non approva, review B1);
// - «pulsante»: pulsante in Impostazioni, con conferma esplicita;
// - «auto»: pulsante e passaggio automatico al primo accesso a viaggio allineato.
export type ConversionMode = 'nascosto' | 'pulsante' | 'auto';

export function parseConversionMode(v: string | undefined): ConversionMode {
  const x = (v ?? '').trim().toLowerCase();
  return x === 'pulsante' || x === 'auto' ? x : 'nascosto';
}

export function conversionMode(): ConversionMode {
  try {
    return parseConversionMode((import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_PASSAGGIO_RIGHE);
  } catch {
    return 'nascosto';
  }
}

/**
 * Formato di un viaggio nuovo (decisione di Filippo, terzo giro): nasce nel formato a righe solo con il cloud
 * collegato E con VITE_PASSAGGIO_RIGHE=pulsante|auto; altrimenti nel formato documento di sempre.
 */
export function newTripInRows(cloudOn: boolean, mode: ConversionMode = conversionMode()): boolean {
  return cloudOn && mode !== 'nascosto';
}
