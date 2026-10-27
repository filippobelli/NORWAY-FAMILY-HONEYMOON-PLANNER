import type { Segment } from '../../domain/types';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResult {
  /** Segmenti già separati per modalità (strada / traghetto) */
  segments: Segment[];
  providerName: string;
  attribution: string;
}

/** Interfaccia sostituibile: OSRM oggi, altro provider (GraphHopper, ORS, ...) domani. */
export interface RoutingProvider {
  name: string;
  route(from: LatLng, to: LatLng, signal?: AbortSignal): Promise<RouteResult>;
}

export class RoutingError extends Error {
  constructor(
    message: string,
    public readonly kind: 'rete' | 'nessun_percorso' | 'limite' | 'risposta_non_valida',
  ) {
    super(message);
    this.name = 'RoutingError';
  }
}
