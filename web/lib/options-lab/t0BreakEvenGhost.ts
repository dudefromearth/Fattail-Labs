/**
 * T Ortho view-only: realtime T+0 P&L break-evens.
 * When a live BE moves, the last place stays as a dashed grey ghost.
 * No price-cross required. Not stored on the position.
 */

import { zeroCrossingsOnSlice } from "@/lib/risk-graph/surfaceZero";
import type { SurfaceSheet } from "@/lib/risk-graph/surfaceModel";

export function t0BreakEvens(sheet: SurfaceSheet | null): number[] {
  if (!sheet?.spotAxis?.length || !sheet.pnlGrid?.[0]) return [];
  return zeroCrossingsOnSlice(sheet.spotAxis, sheet.pnlGrid[0]);
}

export function nearLevel(s: number, levels: number[], eps: number): boolean {
  return levels.some((x) => Math.abs(x - s) <= eps);
}

/** Park live BEs that are no longer in the new set. */
export function parkMovedBreakEvens(
  prevLive: number[],
  nextLive: number[],
  ghosts: number[],
  eps: number,
): number[] {
  const out = [...ghosts];
  for (const s of prevLive) {
    if (!Number.isFinite(s)) continue;
    if (nearLevel(s, nextLive, eps)) continue;
    if (nearLevel(s, out, eps)) continue;
    out.push(s);
  }
  return out;
}

export function beGhostEps(sMin: number, sMax: number): number {
  const span = Math.max(sMax - sMin, 1);
  return Math.max(span * 0.002, 0.25);
}
