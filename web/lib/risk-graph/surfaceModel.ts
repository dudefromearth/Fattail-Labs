/**
 * Shared 3D P&L surface — one model, every app.
 *
 * Strategy Lab Design, Options Lab Analyzer Surface viewport, and the
 * future day-replay harness all call these functions. Do not fork a
 * second grid or a second pricer.
 *
 * Shape is created through **per-leg IV** (DL-380). A single-IV sheet is
 * only allowed when labeled `sticky_cli` (Design preview without a chain).
 *
 * Pricing: `bsPrice` in this folder (the Strategy Lab calculator).
 * Heritage: proto charlie.js `computeSurface` / `evaluatePnLAtSpot`,
 * re-typed to Labs legs (AZ-VP-S4). No MSC import.
 */

import { RISK_FREE_RATE, bsPrice } from "./blackScholes";

export type SurfaceLeg = {
  strike: number;
  right: "call" | "put";
  /** Signed quantity (+ long / − short). Batman body is −2. */
  qty: number;
  /** Entry premium per share (debit paid / credit received as signed mid). */
  premium: number;
  /** Per-leg implied vol. Never invent a smile here. */
  iv: number;
  /** Years to expiry at sheet t=0 (now). */
  tauYears0: number;
};

export type SurfaceQuality = "per_leg_iv" | "sticky_cli";

export type SurfaceSheet = {
  spotAxis: number[];
  /** Remaining τ in years: index 0 = now (max τ), last = expiry (≈0). */
  timeAxis: number[];
  /** pnlGrid[time][spot] — dollars, 100-multiplier. */
  pnlGrid: number[][];
  minPnL: number;
  maxPnL: number;
  sMin: number;
  sMax: number;
  maxTau: number;
  quality: SurfaceQuality;
  ivSource: string;
  spot: number;
};

export type ComputeSurfaceOpts = {
  spot: number;
  r?: number;
  nx?: number;
  nt?: number;
  /** Half-width of the S axis as a fraction of spot. Default 0.35. */
  padFrac?: number;
  quality?: SurfaceQuality;
  ivSource?: string;
};

const DEFAULT_NX = 80;
const DEFAULT_NT = 48;
const MIN_TAU = 1 / 365.25 / 24 / 60;

export function evaluatePnlAtSpot(
  legs: SurfaceLeg[],
  spot: number,
  tauYears: number,
  r: number = RISK_FREE_RATE,
): number {
  if (!legs.length) return 0;
  let pnl = 0;
  const T = Math.max(0, tauYears);
  for (const leg of legs) {
    if (leg.tauYears0 + 1e-12 < T) continue;
    const isCall = leg.right === "call";
    const mark = bsPrice(spot, leg.strike, T, r, Math.max(leg.iv, 1e-8), isCall);
    pnl += leg.qty * (mark - leg.premium) * 100;
  }
  return pnl;
}

export function computeSurfaceSheet(
  legs: SurfaceLeg[],
  opts: ComputeSurfaceOpts,
): SurfaceSheet {
  if (!legs.length) {
    throw new Error("computeSurfaceSheet: legs array is empty");
  }
  const spot = Number(opts.spot);
  if (!Number.isFinite(spot) || spot <= 0) {
    throw new Error("computeSurfaceSheet: opts.spot must be a finite price");
  }
  const r = opts.r ?? RISK_FREE_RATE;
  const nx = Math.max(8, opts.nx ?? DEFAULT_NX);
  const nt = Math.max(4, opts.nt ?? DEFAULT_NT);
  const padFrac = opts.padFrac ?? 0.35;
  const maxTau = Math.max(...legs.map((l) => l.tauYears0), MIN_TAU);
  const sRange = spot * padFrac;
  const sMin = Math.max(0.01, spot - sRange);
  const sMax = spot + sRange;

  const spotAxis = Array.from(
    { length: nx },
    (_, i) => sMin + (i / (nx - 1)) * (sMax - sMin),
  );
  const timeAxis = Array.from(
    { length: nt },
    (_, j) => maxTau * (1 - j / (nt - 1)),
  );

  const pnlGrid: number[][] = [];
  let minPnL = Infinity;
  let maxPnL = -Infinity;
  for (const tau of timeAxis) {
    const row: number[] = [];
    for (const s of spotAxis) {
      const pnl = evaluatePnlAtSpot(legs, s, tau, r);
      row.push(pnl);
      if (pnl < minPnL) minPnL = pnl;
      if (pnl > maxPnL) maxPnL = pnl;
    }
    pnlGrid.push(row);
  }

  return {
    spotAxis,
    timeAxis,
    pnlGrid,
    minPnL,
    maxPnL,
    sMin,
    sMax,
    maxTau,
    quality: opts.quality ?? "per_leg_iv",
    ivSource: opts.ivSource ?? "per_leg",
    spot,
  };
}

/** Bilinear sample of the sheet — the harness walks S(t), τ(t) here. */
export function sampleSheet(
  sheet: SurfaceSheet,
  spot: number,
  tauYears: number,
): number | null {
  const { spotAxis, timeAxis, pnlGrid } = sheet;
  if (spotAxis.length < 2 || timeAxis.length < 2) return null;
  const s0 = spotAxis[0];
  const s1 = spotAxis[spotAxis.length - 1];
  const t0 = timeAxis[0];
  const t1 = timeAxis[timeAxis.length - 1];
  if (spot < s0 || spot > s1) return null;
  const si = ((spot - s0) / (s1 - s0)) * (spotAxis.length - 1);
  const ti = ((t0 - tauYears) / Math.max(t0 - t1, 1e-12)) * (timeAxis.length - 1);
  const i0 = Math.max(0, Math.min(spotAxis.length - 2, Math.floor(si)));
  const j0 = Math.max(0, Math.min(timeAxis.length - 2, Math.floor(ti)));
  const fu = si - i0;
  const fv = ti - j0;
  const a = pnlGrid[j0][i0];
  const b = pnlGrid[j0][i0 + 1];
  const c = pnlGrid[j0 + 1][i0];
  const d = pnlGrid[j0 + 1][i0 + 1];
  return a * (1 - fu) * (1 - fv) + b * fu * (1 - fv) + c * (1 - fu) * fv + d * fu * fv;
}

export function designTauYears(dteType: unknown): number {
  const t = String(dteType || "");
  if (t === "0dte") return 6.5 / 24 / 365.25;
  if (t === "1dte") return 1 / 365.25;
  if (t === "1_2_dte") return 2 / 365.25;
  if (t === "2_4_dte") return 3 / 365.25;
  if (t === "2_5_dte") return 4 / 365.25;
  if (t === "5_10_dte") return 7 / 365.25;
  return 3 / 365.25;
}

export function legsFromTos(
  legs: Array<{
    strike: number;
    quantity: number;
    right: "call" | "put";
    expiration?: string;
  }>,
  opts: {
    spot: number;
    ivFor: (strike: number, right: "call" | "put") => number;
    premiumFor?: (strike: number, right: "call" | "put") => number | null;
    tauFor: (expiration?: string) => number;
  },
): SurfaceLeg[] {
  return legs.map((l) => {
    const tau = Math.max(opts.tauFor(l.expiration), MIN_TAU);
    const iv = Math.max(opts.ivFor(l.strike, l.right), 1e-8);
    const mark = bsPrice(
      opts.spot,
      l.strike,
      tau,
      RISK_FREE_RATE,
      iv,
      l.right === "call",
    );
    const prem = opts.premiumFor?.(l.strike, l.right);
    return {
      strike: l.strike,
      right: l.right,
      qty: l.quantity,
      premium: prem != null && Number.isFinite(prem) ? prem : mark,
      iv,
      tauYears0: tau,
    };
  });
}

export function legsFromRelative(
  legs: Array<{
    strike: number;
    quantity: number;
    right: "call" | "put";
  }>,
  spot: number,
  tauYears: number,
  iv: number,
): SurfaceLeg[] {
  const T = Math.max(tauYears, MIN_TAU);
  return legs.map((l) => ({
    strike: l.strike,
    right: l.right,
    qty: l.quantity,
    premium: bsPrice(spot, l.strike, T, RISK_FREE_RATE, iv, l.right === "call"),
    iv,
    tauYears0: T,
  }));
}
