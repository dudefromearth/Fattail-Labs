/**
 * Expected-move range for the Analyzer risk graph.
 *
 * Member % is two-sided normal mass (1σ = 68.27%, 2σ = 95.45%).
 * Band geometry is ±z · σ · √τ around spot on a listed expiration.
 */

import { MIN_TAU } from "@/lib/risk-graph/surfaceModel";

/** Two-sided mass inside ±1σ, XX.XX percent. */
export const RANGE_MASS_1SIGMA = 68.27;
/** Two-sided mass inside ±2σ, XX.XX percent. */
export const RANGE_MASS_2SIGMA = 95.45;

/** Inner (first) band σ presets — fill mass % on select. */
export const RANGE_INNER_SIGMA_PRESETS = [0.75, 1, 1.25, 1.5, 2] as const;
/** Outer (second) band σ presets. */
export const RANGE_OUTER_SIGMA_PRESETS = [2.25, 2.5, 2.75, 3] as const;

export function clampMassPct(n: number): number {
  if (!Number.isFinite(n)) return RANGE_MASS_1SIGMA;
  return Math.max(0.01, Math.min(99.99, Math.round(n * 100) / 100));
}

export function matchingSigmaPreset(
  pct: number,
  presets: readonly number[],
): number | null {
  if (!Number.isFinite(pct)) return null;
  for (const s of presets) {
    const p = massInsideSigmaPct(s);
    if (p != null && Math.abs(p - pct) < 0.02) return s;
  }
  return null;
}

export function tYearsFromRemainingHours(hours: number): number {
  const h = Number.isFinite(hours) ? Math.max(0, hours) : 0;
  return Math.max(h / (365.25 * 24), MIN_TAU);
}

/** Abramowitz–Stegun 7.1.26 */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t -
      0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-a * a);
  return sign * y;
}

function stdNormCdf(x: number): number {
  if (!Number.isFinite(x)) return x > 0 ? 1 : 0;
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/** Two-sided mass as XX.XX percent. 1 → 68.27, 2 → 95.45. */
export function massInsideSigmaPct(nSigma: number): number | null {
  if (!(nSigma > 0) || !Number.isFinite(nSigma)) return null;
  const m = Math.max(0, Math.min(1, 2 * stdNormCdf(nSigma) - 1));
  return Math.round(m * 10000) / 100;
}

export function formatMassPct(pct: number): string {
  if (!Number.isFinite(pct)) return "—";
  return pct.toFixed(2);
}

/** Invert two-sided mass % → nσ. 68.27 → ~1, 95.45 → ~2. */
export function nSigmaFromMassPct(pct: number): number | null {
  if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) return null;
  const target = (1 + pct / 100) / 2;
  let lo = 0;
  let hi = 8;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (stdNormCdf(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Half-width as % of spot: n · σ · √τ · 100. */
export function expectedMovePct(opts: {
  ivDecimal: number;
  tYears: number;
  nSigma: number;
}): number | null {
  const iv = opts.ivDecimal;
  const t = opts.tYears;
  const n = opts.nSigma;
  if (!(iv > 0) || !(t > 0) || !(n > 0)) return null;
  if (!Number.isFinite(iv) || !Number.isFinite(t) || !Number.isFinite(n)) {
    return null;
  }
  const pct = n * iv * Math.sqrt(t) * 100;
  if (!Number.isFinite(pct) || pct <= 0) return null;
  return pct;
}

export function bandFromSpotPct(
  spot: number,
  pct: number,
): { lo: number; hi: number } | null {
  if (!(spot > 0) || !(pct > 0) || !Number.isFinite(spot) || !Number.isFinite(pct)) {
    return null;
  }
  const f = pct / 100;
  return { lo: spot * (1 - f), hi: spot * (1 + f) };
}

export function bandFromMassPct(opts: {
  spot: number;
  ivDecimal: number;
  tYears: number;
  massPct: number;
}): { lo: number; hi: number } | null {
  const z = nSigmaFromMassPct(opts.massPct);
  if (z == null) return null;
  const half = expectedMovePct({
    ivDecimal: opts.ivDecimal,
    tYears: opts.tYears,
    nSigma: z,
  });
  if (half == null) return null;
  return bandFromSpotPct(opts.spot, half);
}

/** Second (outer) band is this fraction of the first band's opacity. */
export const RANGE_SECOND_OPACITY_FRAC = 0.75;

/** First-band alpha from the member slider; second is ¾ of that. */
export function rangeBandAlphas(
  opacityPct: number,
  hasSecond: boolean,
): { first: number; second: number } {
  const first = Math.max(0, Math.min(1, Number(opacityPct) / 100));
  const a = Number.isFinite(first) ? first : 0;
  return {
    first: a,
    second: hasSecond ? a * RANGE_SECOND_OPACITY_FRAC : 0,
  };
}
