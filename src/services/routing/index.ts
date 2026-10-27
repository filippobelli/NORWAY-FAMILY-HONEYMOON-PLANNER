import { createOsrmProvider } from './osrm';
import type { RoutingProvider } from './types';

let provider: RoutingProvider = createOsrmProvider();

export function getRoutingProvider(): RoutingProvider {
  return provider;
}

/** Punto unico per sostituire il provider (es. nei test o con un backend dedicato). */
export function setRoutingProvider(p: RoutingProvider): void {
  provider = p;
}

export * from './types';
