/**
 * Time(tn) ∩ surface — the Analyzer Real Time curve at one clock.
 * Pure. Playhead walks this cut; it does not rebuild the sheet.
 */

import { sliceSheetAtTau, type SurfaceSheet } from "../surfaceModel";

/** Box z: +1 = window start (now), −1 = expiry. */
export function tauToBoxZ(sheet: SurfaceSheet, tau: number): number {
  const axis = sheet.timeAxis;
  if (!axis.length) return 1;
  const t0 = axis[0];
  const t1 = axis[axis.length - 1];
  if (!Number.isFinite(t0) || !Number.isFinite(t1)) return 1;
  const lo = Math.min(t0, t1);
  const hi = Math.max(t0, t1);
  const t = Number.isFinite(tau) ? Math.min(hi, Math.max(lo, tau)) : t0;
  const span = t0 - t1;
  if (Math.abs(span) < 1e-12) return 1;
  return 1 - ((t0 - t) / span) * 2;
}

/** Flat xyz polyline in box space, coplanar with the time plane at τ. */
export function timeCutPoints(sheet: SurfaceSheet, tau: number): number[] {
  const slice = sliceSheetAtTau(sheet, tau);
  const s0 = sheet.sMin;
  const sSpan = Math.max(sheet.sMax - sheet.sMin, 1e-9);
  const pAbs = Math.max(sheet.displayAbs || 0, 1);
  const z = tauToBoxZ(sheet, tau);
  const pts: number[] = [];
  for (let i = 0; i < sheet.spotAxis.length; i++) {
    pts.push(
      ((sheet.spotAxis[i] - s0) / sSpan) * 2 - 1,
      Math.min(1, Math.max(-1, slice[i] / pAbs)),
      z,
    );
  }
  return pts;
}
