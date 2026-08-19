/**
 * Expired Surface ghost — Analyzer's at-expiry residual as a 3D wire cage.
 *
 * After midnight ET the pointer is EXPIRED (Law C). Analyzer draws a grey
 * ghost curve from defined debit + intrinsic. Surface draws the same number
 * as a wireframe with no filled mesh (DL-446). No live IV. No invented mark.
 */

import { expirationPnLDollars } from "@/lib/options-lab/riskPayoff";
import { tradeTotalDebit } from "@/lib/options-lab/packageEconomics";
import type { ParsedTosTrade } from "@/lib/options-lab/tosParser";
import {
  DEFAULT_NT,
  DEFAULT_NX,
  MIN_TAU,
  type SurfaceSheet,
} from "./surfaceModel";

/** Display τ so the box still has Now → Expiry depth. P&L is flat in time. */
export const GHOST_DISPLAY_TAU = 1 / 365.25;

export function computeExpiredGhostSheet(
  trades: ParsedTosTrade[],
  opts: {
    spot: number;
    sMin: number;
    sMax: number;
    nx?: number;
    nt?: number;
    /** Share Z with a live tent when both are on the book. */
    timeAxis?: number[];
  },
): SurfaceSheet {
  if (!trades.length) {
    throw new Error("computeExpiredGhostSheet: no expired trades");
  }
  const spot = Number(opts.spot);
  if (!Number.isFinite(spot) || spot <= 0) {
    throw new Error("computeExpiredGhostSheet: spot must be a finite price");
  }
  if (
    !Number.isFinite(opts.sMin) ||
    !Number.isFinite(opts.sMax) ||
    !(opts.sMin < opts.sMax)
  ) {
    throw new Error("computeExpiredGhostSheet: sMin < sMax required");
  }
  const nx = Math.max(8, Math.floor(opts.nx ?? DEFAULT_NX));
  const nt = Math.max(4, Math.floor(opts.nt ?? DEFAULT_NT));
  const sMin = Math.max(0.01, opts.sMin);
  const sMax = opts.sMax;
  const spotAxis = Array.from(
    { length: nx },
    (_, i) => sMin + (i / (nx - 1)) * (sMax - sMin),
  );
  const timeAxis =
    opts.timeAxis && opts.timeAxis.length >= 2
      ? [...opts.timeAxis]
      : Array.from(
          { length: nt },
          (_, j) =>
            GHOST_DISPLAY_TAU +
            (j / (nt - 1)) * (MIN_TAU - GHOST_DISPLAY_TAU),
        );
  const maxTau = Math.max(...timeAxis, MIN_TAU);
  const expiryTau = Math.min(...timeAxis);

  const face = (s: number) =>
    trades.reduce(
      (sum, t) =>
        sum + expirationPnLDollars(s, t.legs, tradeTotalDebit(t)),
      0,
    );

  const row = spotAxis.map(face);
  const pnlGrid = timeAxis.map(() => [...row]);
  let minPnL = Infinity;
  let maxPnL = -Infinity;
  for (const y of row) {
    if (y < minPnL) minPnL = y;
    if (y > maxPnL) maxPnL = y;
  }

  const listedStrikes = [
    ...new Set(
      trades.flatMap((t) =>
        t.legs.map((l) => l.strike).filter((k) => Number.isFinite(k) && k > 0),
      ),
    ),
  ].sort((a, b) => a - b);

  let displayAbs = 0;
  for (const s of [spot, ...listedStrikes]) {
    const a = Math.abs(face(s));
    if (a > displayAbs) displayAbs = a;
  }
  if (!(displayAbs > 0)) displayAbs = Math.max(Math.abs(minPnL), Math.abs(maxPnL), 1);

  return {
    spotAxis,
    timeAxis,
    pnlGrid,
    minPnL,
    maxPnL,
    sMin,
    sMax,
    maxTau,
    expiryTau,
    quality: "per_leg_iv",
    ivSource: "ghost",
    spot,
    listedStrikes,
    displayAbs,
  };
}
