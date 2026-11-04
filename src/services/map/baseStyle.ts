// Stile del fondo vettoriale: i nomi in italiano dove esistono, altrimenti quello locale (mai inglese),
// e i colori del viaggio. Funzione pura: lo stile scaricato non viene toccato.

export interface StyleLayer {
  id: string;
  type: string;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
}
export interface MapStyle {
  layers: StyleLayer[];
  [key: string]: unknown;
}

const ITALIAN_LABEL = ['coalesce', ['get', 'name:it'], ['get', 'name']];

// Stessi valori di --terra e --mare: MapLibre ha bisogno del colore esplicito
const PAINT: Record<string, Record<string, string>> = {
  background: { 'background-color': '#f5f7fa' },
  water: { 'fill-color': '#cdd9ea' },
};

export function italianStyle(style: MapStyle): MapStyle {
  return {
    ...style,
    layers: style.layers.map((l) => {
      // Le sigle delle strade restano come sono: si cambia solo dove la scritta è un nome
      const named = l.type === 'symbol' && JSON.stringify(l.layout?.['text-field'] ?? '').includes('"name');
      const paint = PAINT[l.id];
      if (!named && !paint) return l;
      return {
        ...l,
        ...(named ? { layout: { ...l.layout, 'text-field': ITALIAN_LABEL } } : {}),
        ...(paint ? { paint: { ...l.paint, ...paint } } : {}),
      };
    }),
  };
}

/** Fondo senza scritte: per le mappe che hanno già le proprie etichette. */
export function withoutLabels(style: MapStyle): MapStyle {
  return { ...style, layers: style.layers.filter((l) => l.type !== 'symbol') };
}
