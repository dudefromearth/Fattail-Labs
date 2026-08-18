/**
 * Surface Autofit — default strike window for the viewport box.
 *
 * Default: outermost of breakevens (T0 and expiry) and listed strikes,
 * plus spot, with equal pad. The box maps that range to full strike
 * width (stretch or compress). Spot stays inside.
 *
 * Position-family profiles can adjust later. Do not fork a second pricer.
 */

import { evaluatePnlAtSpot, MIN_TAU, type SurfaceLeg } from "./surfaceModel";

export const SURFACE_AUTOFIT_STRIKE_STEPS = 4;
/** Analyzer-like air: 15% of content span on each side (≈ 30% of half-width). */
export const SURFACE_PAD_FRAC = 0.15;
export const SURFACE_PAD_FRAC_MIN = 0;
export const SURFACE_WIDTH_PAD_FRAC_MAX = 0.845;
export const SURFACE_HEIGHT_PAD_FRAC_MAX = 0.65;
export const SURFACE_WIDTH_PAD_MIN_PTS = 10;
export const SURFACE_VALUE_PAD_MIN = 1;

export type AutofitProfileId = "default";

export type AutofitTrigger =
  | "book-change"
  | "autofit-button"
  | "what-if"
  | "live-spot"
  | "playhead"
  | "camera-fit";

/** AF-L5 / AF-L8 — only book change and the Autofit button recompute the S window. */
export function autofitShouldRun(trigger: AutofitTrigger): boolean {
  return trigger === "book-change" || trigger === "autofit-button";
}

/** Union of listed strikes across every shown structure. */
export function unionListedStrikes(groups: number[][]): number[] {
  const out = new Set<number>();
  for (const g of groups) {
    for (const k of g) {
      if (Number.isFinite(k) && k > 0) out.add(k);
    }
  }
  return [...out].sort((a, b) => a - b);
}

export type AutofitWindow = {
  sMin: number;
  sMax: number;
  /** Outermost content before pad (BEs and/or strikes and spot). */
  contentLo: number;
  contentHi: number;
  pad: number;
  padFrac: number;
  profile: AutofitProfileId;
};

export type ValueWindow = {
  yMin: number;
  yMax: number;
  pad: number;
  padFrac: number;
};

/** Equal air on both sides; the remaining span is what the model fills. */
export function applyEqualPad(
  lo: number,
  hi: number,
  padFrac: number,
  minPad: number,
): { min: number; max: number; pad: number } {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    throw new Error(
      `applyEqualPad: bounds unbounded or invalid (${String(lo)}…${String(hi)})`,
    );
  }
  if (!Number.isFinite(padFrac) || padFrac < 0 || padFrac > 1) {
    throw new Error(
      `applyEqualPad: padFrac unbounded or invalid (${String(padFrac)})`,
    );
  }
  if (!Number.isFinite(minPad) || minPad < 0) {
    throw new Error(
      `applyEqualPad: minPad unbounded or invalid (${String(minPad)})`,
    );
  }
  const span = Math.max(hi - lo, 0);
  const pad = Math.max(span * padFrac, minPad);
  return { min: lo - pad, max: hi + pad, pad };
}

/**
 * P&L → box height. Content includes $0. Equal pad top and bottom;
 * the tent fills the remaining height.
 */
export function surfaceValueWindow(
  minPnL: number,
  maxPnL: number,
  padFrac: number = SURFACE_PAD_FRAC,
): ValueWindow {
  if (!Number.isFinite(minPnL) || !Number.isFinite(maxPnL)) {
    throw new Error(
      `surfaceValueWindow: P&L unbounded (${String(minPnL)}…${String(maxPnL)})`,
    );
  }
  const lo = Math.min(minPnL, maxPnL, 0);
  const hi = Math.max(minPnL, maxPnL, 0);
  const { min, max, pad } = applyEqualPad(lo, hi, padFrac, SURFACE_VALUE_PAD_MIN);
  return { yMin: min, yMax: max, pad, padFrac };
}

/** Re-pad a frozen Autofit content span (width slider). */
export function applyWidthPad(
  contentLo: number,
  contentHi: number,
  padFrac: number = SURFACE_PAD_FRAC,
): Pick<AutofitWindow, "sMin" | "sMax" | "pad" | "padFrac"> {
  const { min, max, pad } = applyEqualPad(
    contentLo,
    contentHi,
    padFrac,
    SURFACE_WIDTH_PAD_MIN_PTS,
  );
  return {
    sMin: Math.max(0.01, min),
    sMax: max,
    pad,
    padFrac,
  };
}

export function surfaceAutofitWindow(
  legs: SurfaceLeg[],
  spot: number,
  listedStrikes?: number[],
  padFrac: number = SURFACE_PAD_FRAC,
  profile: AutofitProfileId = "default",
): AutofitWindow {
  if (!Number.isFinite(spot) || spot <= 0) {
    throw new Error("surfaceAutofitWindow: spot must be a finite price");
  }
  if (!legs.length) {
    throw new Error("surfaceAutofitWindow: legs array is empty");
  }
  void profile;
  const ks = (listedStrikes && listedStrikes.length
    ? listedStrikes
    : legs.map((l) => l.strike)
  ).filter((k) => Number.isFinite(k) && k > 0);
  const step = listedStrikeStep(ks);
  const kMin = ks.length ? Math.min(...ks) : spot;
  const kMax = ks.length ? Math.max(...ks) : spot;
  const structure = Math.max(kMax - kMin, step);
  const scanLo = Math.max(
    0.01,
    Math.min(spot, kMin) - Math.max(structure * 4, spot * 0.2),
  );
  const scanHi = Math.max(spot, kMax) + Math.max(structure * 4, spot * 0.2);
  const tau0 = Math.max(...legs.map((l) => l.tauYears0), MIN_TAU);
  const content = [spot, kMin, kMax];
  for (const tau of [tau0, 0]) {
    content.push(...scanBookBreakevens(legs, tau, scanLo, scanHi));
  }
  const contentLo = Math.min(...content);
  const contentHi = Math.max(...content);
  const padded = applyWidthPad(contentLo, contentHi, padFrac);
  return {
    sMin: padded.sMin,
    sMax: padded.sMax,
    contentLo,
    contentHi,
    pad: padded.pad,
    padFrac: padded.padFrac,
    profile,
  };
}

function listedStrikeStep(ks: number[]): number {
  const uniq = [...new Set(ks)].sort((a, b) => a - b);
  if (uniq.length < 2) return 5;
  const gaps: number[] = [];
  for (let i = 1; i < uniq.length; i++) {
    const g = uniq[i] - uniq[i - 1];
    if (g > 0) gaps.push(g);
  }
  if (!gaps.length) return 5;
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
}

function scanBookBreakevens(
  legs: SurfaceLeg[],
  tauYears: number,
  lo: number,
  hi: number,
  steps = 400,
): number[] {
  if (!(hi > lo) || steps < 8) return [];
  const step = (hi - lo) / steps;
  const out: number[] = [];
  let prev = evaluatePnlAtSpot(legs, lo, tauYears);
  for (let i = 1; i <= steps; i++) {
    const s = lo + i * step;
    const pnl = evaluatePnlAtSpot(legs, s, tauYears);
    if (prev === 0) out.push(s - step);
    else if (prev * pnl < 0) {
      const t = prev / (prev - pnl);
      out.push(s - step + t * step);
    }
    prev = pnl;
  }
  return out;
}
