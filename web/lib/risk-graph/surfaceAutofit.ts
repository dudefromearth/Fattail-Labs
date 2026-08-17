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

export type AutofitProfileId = "default";

export type AutofitWindow = {
  sMin: number;
  sMax: number;
  /** Outermost content before pad (BEs and/or strikes and spot). */
  contentLo: number;
  contentHi: number;
  pad: number;
  profile: AutofitProfileId;
};

export function surfaceAutofitWindow(
  legs: SurfaceLeg[],
  spot: number,
  listedStrikes?: number[],
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
  const pad = Math.max(step * SURFACE_AUTOFIT_STRIKE_STEPS, 10);
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
  return {
    sMin: Math.max(0.01, contentLo - pad),
    sMax: contentHi + pad,
    contentLo,
    contentHi,
    pad,
    profile: "default",
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
