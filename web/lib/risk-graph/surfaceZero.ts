/**
 * $0 P&L contour of a SurfaceSheet.
 * Linear interp on each S-slice, traced through τ. No second pricer.
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

/** Chaikin corner-cut — keeps endpoints, stays in the polyline hull (y stays 0). */
export function chaikinXYZ(pts: number[], rounds = 2): number[] {
  let p = pts;
  for (let r = 0; r < rounds; r++) {
    const n = p.length / 3;
    if (n < 2) break;
    const next: number[] = [p[0], p[1], p[2]];
    for (let i = 0; i < n - 1; i++) {
      const ax = p[i * 3];
      const ay = p[i * 3 + 1];
      const az = p[i * 3 + 2];
      const bx = p[i * 3 + 3];
      const by = p[i * 3 + 4];
      const bz = p[i * 3 + 5];
      next.push(
        0.75 * ax + 0.25 * bx,
        0.75 * ay + 0.25 * by,
        0.75 * az + 0.25 * bz,
        0.25 * ax + 0.75 * bx,
        0.25 * ay + 0.75 * by,
        0.25 * az + 0.75 * bz,
      );
    }
    next.push(p[p.length - 3], p[p.length - 2], p[p.length - 1]);
    p = next;
  }
  return p;
}

/** Box-space xyz polylines for $0 ∩ surface. y = box height of $0. */
export function zeroPnlBoxPolylines(
  sheet: SurfaceSheet,
  yZero = 0,
  rounds = 2,
): number[][] {
  if (!Number.isFinite(yZero)) {
    throw new Error(
      `zeroPnlBoxPolylines: yZero unbounded or invalid (${String(yZero)})`,
    );
  }
  const s0 = sheet.sMin;
  const sSpan = Math.max(sheet.sMax - sheet.sMin, 1e-9);
  const out: number[][] = [];
  for (const branch of zeroPnlBranches(sheet)) {
    const raw: number[] = [];
    for (const p of branch) {
      raw.push(
        ((p.s - s0) / sSpan) * 2 - 1,
        yZero,
        tauToBoxZLocal(sheet, p.tau),
      );
    }
    if (raw.length >= 6) out.push(chaikinXYZ(raw, rounds));
  }
  return out;
}

function tauToBoxZLocal(sheet: SurfaceSheet, tau: number): number {
  const axis = sheet.timeAxis;
  if (!axis.length) return 1;
  const t0 = axis[0];
  const t1 = axis[axis.length - 1];
  const span = t0 - t1;
  if (!Number.isFinite(span) || Math.abs(span) < 1e-12) return 1;
  const lo = Math.min(t0, t1);
  const hi = Math.max(t0, t1);
  const t = Number.isFinite(tau) ? Math.min(hi, Math.max(lo, tau)) : t0;
  return 1 - ((t0 - t) / span) * 2;
}
