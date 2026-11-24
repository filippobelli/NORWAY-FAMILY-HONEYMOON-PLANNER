// Divisione obliqua della bandiera del viaggio: con più nazioni ogni bandiera occupa una fascia diagonale, parallela
// alla diagonale che va dall'angolo in alto a destra a quello in basso a sinistra. Con due nazioni la prima è il
// triangolo in alto a sinistra e la seconda quello in basso a destra. Coordinate in percentuale del riquadro, pronte
// per `clip-path: polygon(...)`.

/** Fasce massime disegnate: oltre diventerebbero troppo sottili per riconoscere le bandiere */
export const MAX_FLAG_BANDS = 4;

type Pt = [number, number];

/** Poligono della fascia `i` di `n` (0 = in alto a sinistra), come elenco di punti in percentuale */
export function bandPolygon(i: number, n: number): Pt[] {
  if (n <= 1) return [[0, 0], [100, 0], [100, 100], [0, 100]];
  // Fascia: a ≤ x + y ≤ b nel quadrato unitario (x, y tra 0 e 1)
  const a = (2 * i) / n;
  const b = (2 * (i + 1)) / n;
  const inside = (p: Pt) => p[0] + p[1] >= a - 1e-9 && p[0] + p[1] <= b + 1e-9;
  const pts: Pt[] = [];
  const corners: Pt[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  for (const c of corners) if (inside(c)) pts.push(c);
  // Intersezioni delle due rette con i lati del quadrato
  for (const s of [a, b]) {
    for (const p of [[s, 0], [0, s], [s - 1, 1], [1, s - 1]] as Pt[]) {
      if (p[0] >= -1e-9 && p[0] <= 1 + 1e-9 && p[1] >= -1e-9 && p[1] <= 1 + 1e-9) pts.push([clamp(p[0]), clamp(p[1])]);
    }
  }
  const unique = pts.filter((p, k) => pts.findIndex((q) => Math.abs(q[0] - p[0]) < 1e-9 && Math.abs(q[1] - p[1]) < 1e-9) === k);
  // Ordine attorno al baricentro, per un poligono senza incroci
  const cx = unique.reduce((s, p) => s + p[0], 0) / unique.length;
  const cy = unique.reduce((s, p) => s + p[1], 0) / unique.length;
  unique.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx));
  return unique.map(([x, y]) => [round(x * 100), round(y * 100)]);
}

/** Valore CSS `clip-path` della fascia */
export function bandClipPath(i: number, n: number): string {
  return `polygon(${bandPolygon(i, n).map(([x, y]) => `${x}% ${y}%`).join(', ')})`;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const round = (v: number) => Math.round(v * 100) / 100;
