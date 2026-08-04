/**
 * Shared curve utilities for Risk Graph authority path.
 * Linear interpolation + zero-crossing breakevens on a price/PnL grid.
 */

export interface CurvePoint {
  price: number;
  pnl: number;
}

/** Interpolate PnL at price x on a sorted price grid. */
export function interpolatePnl(
  priceGrid: readonly number[],
  pnlCurve: readonly number[],
  x: number,
): number {
  const n = priceGrid.length;
  if (n === 0 || pnlCurve.length !== n) return 0;
  if (x <= priceGrid[0]) return pnlCurve[0];
  if (x >= priceGrid[n - 1]) return pnlCurve[n - 1];

  // Binary search for right edge
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (priceGrid[mid] <= x) lo = mid;
    else hi = mid;
  }
  const x0 = priceGrid[lo];
  const x1 = priceGrid[hi];
  const y0 = pnlCurve[lo];
  const y1 = pnlCurve[hi];
  const t = (x - x0) / (x1 - x0 || 1e-12);
  return y0 + t * (y1 - y0);
}

/** Zero-crossings via linear interpolation (matches server segment logic). */
export function findZeroCrossings(
  priceGrid: readonly number[],
  pnlCurve: readonly number[],
): number[] {
  const out: number[] = [];
  const n = Math.min(priceGrid.length, pnlCurve.length);
  for (let i = 1; i < n; i++) {
    const y0 = pnlCurve[i - 1];
    const y1 = pnlCurve[i];
    if (y0 === 0) {
      out.push(priceGrid[i - 1]);
      continue;
    }
    if ((y0 < 0) !== (y1 < 0) && Math.abs(y1 - y0) > 1e-12) {
      const t = -y0 / (y1 - y0);
      out.push(priceGrid[i - 1] + t * (priceGrid[i] - priceGrid[i - 1]));
    }
  }
  return out;
}

export function curveMinMax(pnlCurve: readonly number[]): { min: number; max: number } {
  if (pnlCurve.length === 0) return { min: 0, max: 0 };
  let min = pnlCurve[0];
  let max = pnlCurve[0];
  for (let i = 1; i < pnlCurve.length; i++) {
    const v = pnlCurve[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

export function toCurvePoints(
  priceGrid: readonly number[],
  pnlCurve: readonly number[],
): CurvePoint[] {
  const n = Math.min(priceGrid.length, pnlCurve.length);
  const out: CurvePoint[] = new Array(n);
  for (let i = 0; i < n; i++) out[i] = { price: priceGrid[i], pnl: pnlCurve[i] };
  return out;
}
