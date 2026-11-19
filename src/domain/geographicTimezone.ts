/**
 * Eccezioni insulari dei cataloghi ES/PT. Le fasce delimitano gli arcipelaghi già associati
 * alla nazione, non sono confini politici o un servizio globale di geocodifica dei fusi.
 * Nomi IANA: https://data.iana.org/time-zones/tzdb/zone1970.tab (pubblico dominio).
 * Senza coordinate o fuori da questi ambiti si conserva il fuso della nazione.
 */
export function geographicTimezone(code: string | undefined, point: { lat?: number; lng?: number }, fallback: string): string {
  const { lat, lng } = point;
  if (lat === undefined || lng === undefined || !Number.isFinite(lat) || !Number.isFinite(lng)) return fallback;
  if (code === 'ES' && lat >= 27 && lat <= 30 && lng >= -18.5 && lng <= -13) return 'Atlantic/Canary';
  if (code === 'PT' && lat >= 36.5 && lat <= 40.5 && lng >= -31.5 && lng <= -24) return 'Atlantic/Azores';
  if (code === 'PT' && lat >= 30 && lat <= 34 && lng >= -18 && lng <= -15) return 'Atlantic/Madeira';
  return fallback;
}
