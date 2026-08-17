/**
 * $0 P&L contour of a SurfaceSheet.
 * Same crossings as Analyzer Risk-detent T+0 (linear interp on a slice).
 * The 3D curve is those crossings through τ. No second pricer.
 */

import type { SurfaceSheet } from "./surfaceModel";

export function zeroCrossingsOnSlice(
  spotAxis: number[],
  pnlRow: number[],
): number[] {
  const out: number[] = [];
  const n = Math.min(spotAxis.length, pnlRow.length);
  for (let i = 0; i < n - 1; i++) {
    const a = pnlRow[i];
    const b = pnlRow[i + 1];
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (a === 0) {
      out.push(spotAxis[i]);
      continue;
    }
    if (Math.sign(a) === Math.sign(b) || a * b > 0) continue;
    const t = Math.abs(a) / (Math.abs(a) + Math.abs(b));
    out.push(spotAxis[i] + t * (spotAxis[i + 1] - spotAxis[i]));
  }
  return out;
}

export type ZeroPnlPoint = { s: number; tau: number };

/** Continuity-traced $0 branches across time (nearest-S match). */
export function zeroPnlBranches(
  sheet: SurfaceSheet,
  fromTimeIndex = 0,
): ZeroPnlPoint[][] {
  const branches: ZeroPnlPoint[][] = [];
  const nt = sheet.timeAxis.length;
  const start = Math.max(0, Math.min(fromTimeIndex, nt - 1));
  let prev: number[] = [];
  let ids: number[] = [];
  for (let j = start; j < nt; j++) {
    const xs = zeroCrossingsOnSlice(sheet.spotAxis, sheet.pnlGrid[j]);
    const used = new Set<number>();
    const nextIds: number[] = [];
    for (const s of xs) {
      let best = -1;
      let bestD = Infinity;
      for (let p = 0; p < prev.length; p++) {
        if (used.has(p)) continue;
        const d = Math.abs(prev[p] - s);
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
      const span = Math.max(sheet.sMax - sheet.sMin, 1);
      if (best >= 0 && bestD < span * 0.25) {
        used.add(best);
        const id = ids[best];
        branches[id].push({ s, tau: sheet.timeAxis[j] });
        nextIds.push(id);
      } else {
        branches.push([{ s, tau: sheet.timeAxis[j] }]);
        nextIds.push(branches.length - 1);
      }
    }
    prev = xs;
    ids = nextIds;
  }
  return branches.filter((b) => b.length >= 2);
}
