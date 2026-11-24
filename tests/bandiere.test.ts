import assert from 'node:assert/strict';
import test from 'node:test';
import { bandClipPath, bandPolygon } from '../src/ui/flagGeometry';

// Area di un poligono in percentuale² (formula di Gauss)
const area = (pts: [number, number][]) => Math.abs(pts.reduce((s, [x, y], i) => s + x * pts[(i + 1) % pts.length]![1] - pts[(i + 1) % pts.length]![0] * y, 0)) / 2;

test('Bandiera del viaggio: una nazione occupa tutto il riquadro', () => {
  assert.deepEqual(bandPolygon(0, 1), [[0, 0], [100, 0], [100, 100], [0, 100]]);
});

test('Bandiera del viaggio: due nazioni divise in obliquo, prima in alto a sinistra', () => {
  const sorted = (p: [number, number][]) => [...p].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  assert.deepEqual(sorted(bandPolygon(0, 2)), [[0, 0], [0, 100], [100, 0]]);
  assert.deepEqual(sorted(bandPolygon(1, 2)), [[0, 100], [100, 0], [100, 100]]);
  assert.match(bandClipPath(0, 2), /^polygon\(/);
});

test('Bandiera del viaggio: le fasce coprono tutto il riquadro, senza sovrapporsi', () => {
  for (const n of [2, 3, 4]) {
    const total = Array.from({ length: n }, (_, i) => area(bandPolygon(i, n))).reduce((s, v) => s + v, 0);
    assert.ok(Math.abs(total - 10000) < 1, `n=${n}: area totale ${total}`);
  }
});
