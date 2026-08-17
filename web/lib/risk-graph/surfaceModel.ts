/**
 * Shared 3D P&L surface — one model, every app.
 *
 * Strategy Lab Design, Options Lab Analyzer Surface viewport, and the
 * future day-replay harness all call these functions. Do not fork a
 * second grid or a second pricer.
 *
 * Shape is created through **per-leg IV** (DL-380). Product sheets use
 * **exact or locked** OPF IVs only. No sticky smile. No silent 0.20.
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

/**
 * Product truth: listed contract IV on the OPF-held generation.
 * `generation` = the row IV the client already holds (live sheet).
 * `exact` / `locked` = server PackagePricer tags of that same listed IV.
 */
export const TRUTH_IV_SOURCES = new Set(["exact", "locked", "generation"]);

export type SurfaceIvHole = "IV NO" | "CHECK LEGS";

export type OpfLegMarkForSheet = {
  strike?: unknown;
  side?: unknown;
  right?: unknown;
  iv?: unknown;
  iv_source?: unknown;
  mid?: unknown;
  tau?: unknown;
  expiration?: unknown;
};

export type BindSurfaceResult =
  | { ok: true; legs: SurfaceLeg[]; ivSources: string[] }
  | { ok: false; hole: SurfaceIvHole; detail: string };

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
  /** Listed structure strikes — display markers, not a second grid. */
  listedStrikes?: number[];
  /**
   * Display |P&L| scale from the structure corridor (listed K + spot).
   * Grid extremes must not flatten the tent.
   */
  displayAbs: number;
};

export type ComputeSurfaceOpts = {
  spot: number;
  r?: number;
  nx?: number;
  nt?: number;
  /** Half-width of the S axis as a fraction of spot. Default 0.35. */
  padFrac?: number;
  /** Inclusive strike window. When set, overrides padFrac. Fail loud if invalid. */
  sMin?: number;
  sMax?: number;
  /**
   * Inclusive remaining-τ window in years. If set, timeAxis fills
   * [tauHi … tauLo] (index 0 nearer now). Invalid window fails loud.
   */
  tauLo?: number;
  tauHi?: number;
  quality?: SurfaceQuality;
  ivSource?: string;
  listedStrikes?: number[];
};

/** First-ship grid (T-GRID-1). Fail loud if caller asks for an unbounded grid. */
export const DEFAULT_NX = 80;
export const DEFAULT_NT = 48;
const MAX_GRID = 512;
/**
 * OPF29 / OPF Spec v0.2.1 §3.7 — cite AT-L0-τ1 / AT-L0-τ4.
 * 1-minute floor. Do not invent a second τ. Forbidden: 1-hour flatten.
 */
export const MIN_TAU = 1 / 365.25 / 24 / 60;

function resolveGrid(
  n: number | undefined,
  fallback: number,
  min: number,
  name: string,
): number {
  const v = n ?? fallback;
  if (!Number.isFinite(v) || v < min || v > MAX_GRID) {
    throw new Error(
      `computeSurfaceSheet: ${name} unbounded or invalid (${String(v)})`,
    );
  }
  return Math.floor(v);
}

/**
 * P&L of the listed book at one (S, τ). Every grid point uses this.
 * No second structure. Short-dated legs stay in the package (elapsed τ,
 * not "drop if τ0 < slice").
 */
export function evaluatePnlAtSpot(
  legs: SurfaceLeg[],
  spot: number,
  tauYears: number,
  r: number = RISK_FREE_RATE,
): number {
  if (!legs.length) return 0;
  const maxTau0 = Math.max(...legs.map((l) => l.tauYears0), 0);
  const elapsed = Math.max(0, maxTau0 - Math.max(0, tauYears));
  let pnl = 0;
  for (const leg of legs) {
    const tLeg = Math.max(0, leg.tauYears0 - elapsed);
    const isCall = leg.right === "call";
    const mark = bsPrice(
      spot,
      leg.strike,
      tLeg,
      r,
      Math.max(leg.iv, 1e-8),
      isCall,
    );
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
  const nx = resolveGrid(opts.nx, DEFAULT_NX, 8, "nx");
  const nt = resolveGrid(opts.nt, DEFAULT_NT, 4, "nt");
  const maxTau = Math.max(...legs.map((l) => l.tauYears0), MIN_TAU);
  let sMin: number;
  let sMax: number;
  if (opts.sMin != null || opts.sMax != null) {
    if (
      !Number.isFinite(opts.sMin) ||
      !Number.isFinite(opts.sMax) ||
      !(opts.sMin! < opts.sMax!)
    ) {
      throw new Error("computeSurfaceSheet: sMin < sMax required");
    }
    sMin = Math.max(0.01, opts.sMin as number);
    sMax = opts.sMax as number;
  } else {
    const padFrac = opts.padFrac ?? 0.35;
    const sRange = spot * padFrac;
    sMin = Math.max(0.01, spot - sRange);
    sMax = spot + sRange;
  }

  const windowed = opts.tauLo != null || opts.tauHi != null;
  if (windowed) {
    const tauLo = opts.tauLo;
    const tauHi = opts.tauHi;
    if (!Number.isFinite(tauLo) || !Number.isFinite(tauHi)) {
      throw new Error("computeSurfaceSheet: tauLo/tauHi must both be finite");
    }
    if (!(tauLo! >= 0 && tauLo! < tauHi!)) {
      throw new Error("computeSurfaceSheet: require 0 ≤ tauLo < tauHi");
    }
    if (tauHi! > maxTau + 1e-12) {
      throw new Error("computeSurfaceSheet: tauHi exceeds remaining life");
    }
  }
  const tauHiUse = windowed ? (opts.tauHi as number) : maxTau;
  const tauLoUse = windowed ? (opts.tauLo as number) : 0;

  const spotAxis = Array.from(
    { length: nx },
    (_, i) => sMin + (i / (nx - 1)) * (sMax - sMin),
  );
  const timeAxis = Array.from(
    { length: nt },
    (_, j) => tauHiUse + (j / (nt - 1)) * (tauLoUse - tauHiUse),
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
    listedStrikes: opts.listedStrikes,
    displayAbs: structureDisplayAbs(
      legs,
      spot,
      opts.listedStrikes,
      timeAxis,
      r,
    ),
  };
}

/** |P&L| along listed strikes and spot — not the grid corners. */
export function structureDisplayAbs(
  legs: SurfaceLeg[],
  spot: number,
  listedStrikes: number[] | undefined,
  timeAxis: number[],
  r: number = RISK_FREE_RATE,
): number {
  const ks = (listedStrikes || []).filter((k) => Number.isFinite(k) && k > 0);
  const xs = new Set<number>([spot, ...ks]);
  if (ks.length >= 2) {
    const lo = Math.min(...ks);
    const hi = Math.max(...ks);
    for (let i = 0; i <= 12; i++) xs.add(lo + (i / 12) * (hi - lo));
  }
  let abs = 0;
  for (const s of xs) {
    for (const tau of timeAxis) {
      abs = Math.max(abs, Math.abs(evaluatePnlAtSpot(legs, s, tau, r)));
    }
  }
  return Math.max(abs, 1);
}

/**
 * Surface owns the S range. Spot is the midpoint. Half-width reaches
 * every listed strike plus pad. Every grid point is the Analyzer book
 * P&L — including S that are not listed strikes.
 */
export function surfaceStrikeWindow(
  strikes: number[],
  spot: number,
): { sMin: number; sMax: number } {
  if (!Number.isFinite(spot) || spot <= 0) {
    throw new Error("surfaceStrikeWindow: spot must be a finite price");
  }
  const ks = strikes.filter((k) => Number.isFinite(k) && k > 0);
  const farthest = ks.reduce((m, k) => Math.max(m, Math.abs(k - spot)), 0);
  const minHalf = Math.max(spot * 0.004, 5);
  const half = Math.max(farthest, minHalf) * 1.15;
  return {
    sMin: Math.max(0.01, spot - half),
    sMax: spot + half,
  };
}

/**
 * P&L along every listed S at one remaining τ.
 * That polyline is time(tn) ∩ surface — Analyzer Risk at that clock.
 */
export function sliceSheetAtTau(
  sheet: SurfaceSheet,
  tauYears: number,
): number[] {
  const { spotAxis, timeAxis, pnlGrid } = sheet;
  if (!spotAxis.length || !timeAxis.length || !pnlGrid.length) {
    throw new Error("sliceSheetAtTau: empty sheet");
  }
  if (timeAxis.length === 1) return pnlGrid[0].slice();
  const t0 = timeAxis[0];
  const t1 = timeAxis[timeAxis.length - 1];
  const lo = Math.min(t0, t1);
  const hi = Math.max(t0, t1);
  const t = Number.isFinite(tauYears) ? Math.min(hi, Math.max(lo, tauYears)) : t0;
  const ti =
    ((t0 - t) / Math.max(Math.abs(t0 - t1), 1e-12)) * (timeAxis.length - 1);
  const j0 = Math.max(0, Math.min(timeAxis.length - 2, Math.floor(ti)));
  const fv = Math.min(1, Math.max(0, ti - j0));
  return spotAxis.map((_, i) => {
    const a = pnlGrid[j0][i];
    const b = pnlGrid[j0 + 1][i];
    return a * (1 - fv) + b * fv;
  });
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

function _sideOf(mark: OpfLegMarkForSheet): "call" | "put" | null {
  const s = String(mark.side || mark.right || "")
    .trim()
    .toLowerCase();
  if (s === "call" || s === "c") return "call";
  if (s === "put" || s === "p") return "put";
  return null;
}

/**
 * Bind listed TOS/OPF legs to the sheet using **truth IVs only**
 * (`exact`, `locked`, or `generation` on the OPF-held row). Missing or
 * inferred IV (nearest / ATM / VIX / sticky) → named hole, no sheet.
 */
export function bindListedSurfaceLegs(
  legs: Array<{
    strike: number;
    quantity: number;
    right: "call" | "put";
    expiration?: string;
  }>,
  marks: OpfLegMarkForSheet[] | null | undefined,
  opts: {
    spot: number;
    tauFor: (expiration?: string) => number;
  },
): BindSurfaceResult {
  if (!legs.length) {
    return { ok: false, hole: "CHECK LEGS", detail: "No listed legs on the pointer." };
  }
  if (!marks?.length) {
    return {
      ok: false,
      hole: "IV NO",
      detail: "No OPF leg marks yet — waiting for the held chain.",
    };
  }
  const out: SurfaceLeg[] = [];
  const sources: string[] = [];
  for (const l of legs) {
    const mark = marks.find((m) => {
      const side = _sideOf(m);
      const k = Number(m.strike);
      if (side !== l.right || !Number.isFinite(k)) return false;
      if (Math.abs(k - l.strike) > 1e-6) return false;
      if (l.expiration && m.expiration) {
        return String(m.expiration).slice(0, 10) === String(l.expiration).slice(0, 10);
      }
      return true;
    });
    const src = String(mark?.iv_source || "").toLowerCase();
    const iv = mark != null ? Number(mark.iv) : NaN;
    if (!mark || !TRUTH_IV_SOURCES.has(src) || !Number.isFinite(iv) || iv <= 0) {
      return {
        ok: false,
        hole: "IV NO",
        detail:
          `No exact listed IV for ${l.right} ${l.strike}` +
          (l.expiration ? ` ${l.expiration}` : "") +
          (src ? ` (source ${src})` : "") +
          ".",
      };
    }
    const tauRaw = mark.tau != null ? Number(mark.tau) : opts.tauFor(l.expiration);
    const tau = Math.max(Number.isFinite(tauRaw) ? tauRaw : opts.tauFor(l.expiration), MIN_TAU);
    const mid = mark.mid != null ? Number(mark.mid) : NaN;
    const prem = Number.isFinite(mid)
      ? mid
      : bsPrice(opts.spot, l.strike, tau, RISK_FREE_RATE, iv, l.right === "call");
    out.push({
      strike: l.strike,
      right: l.right,
      qty: l.quantity,
      premium: prem,
      iv,
      tauYears0: tau,
    });
    sources.push(src);
  }
  return { ok: true, legs: out, ivSources: sources };
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
