/**
 * probRange — lognormal expected-move band for the 2D Risk Graph PROB overlay.
 *
 *   S_lo = S · exp(−nΣ · σ · √T)
 *   S_hi = S · exp(+nΣ · σ · √T)
 *
 * User selects nΣ (1, 1.25, 1.5, 1.75, 2). σ is annualized IV; T is years to horizon.
 * Pure / deterministic. No IO.
 */

export const PROB_SIGMA_PRESETS = [
  { label: '1σ', value: 1 },
  { label: '1.25σ', value: 1.25 },
  { label: '1.5σ', value: 1.5 },
  { label: '1.75σ', value: 1.75 },
  { label: '2σ', value: 2 },
] as const;

export const DEFAULT_PROB_SIGMA = 1;

/** @deprecated Use PROB_SIGMA_PRESETS */
export const PROB_CONFIDENCE_PRESETS = PROB_SIGMA_PRESETS;
/** @deprecated Use DEFAULT_PROB_SIGMA */
export const DEFAULT_PROB_CONFIDENCE = DEFAULT_PROB_SIGMA;

export interface ProbRangeArgs {
  spot: number;
  /** Annualized IV as decimal (0.18 = 18%). */
  sigma: number;
  /**
   * Band width in standard deviations (1, 1.25, 1.5, 1.75, 2).
   * Also accepted as `confidence` for backward-compat callers (values > 1 treated as nΣ).
   */
  nSigma?: number;
  /** @deprecated Prefer nSigma. If in (0,1) treated as two-tailed conf → z; if ≥1 treated as nΣ. */
  confidence?: number;
  /** Pricing clock (ms). */
  asOfMs: number;
  /** Horizon calendar date YYYY-MM-DD. */
  horizonDate: string;
}

export interface ProbRangeResult {
  lo: number;
  hi: number;
  /** nΣ used for the band. */
  z: number;
  tYears: number;
  /** Half-width as fraction of spot on the upper side: hi/spot − 1. */
  movePct: number;
}

/**
 * Calendar years from asOf to horizon. Floor at 1/365.25 day if horizon ≤ asOf.
 */
export function yearsToHorizon(asOfMs: number, horizonDate: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(horizonDate);
  if (!m) throw new Error(`yearsToHorizon: bad date ${horizonDate}`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const horizonMs = Date.UTC(y, mo - 1, d, 20, 0, 0);
  const msDay = 86_400_000;
  if (horizonMs <= asOfMs) return 1 / 365.25;
  return Math.max(1 / 365.25, (horizonMs - asOfMs) / msDay / 365.25);
}

function resolveNSigma(args: ProbRangeArgs): number {
  if (args.nSigma != null && Number.isFinite(args.nSigma) && args.nSigma > 0) {
    return args.nSigma;
  }
  const c = args.confidence;
  if (c != null && Number.isFinite(c) && c > 0) {
    // Values ≥ 1 are sigma multiples; (0,1) was old two-tailed conf — map 0.6827→1
    if (c >= 1) return c;
    // Legacy: approximate common conf → nearest preset σ
    if (c < 0.6) return 1;
    if (c < 0.75) return 1;
    if (c < 0.85) return 1.25;
    if (c < 0.925) return 1.5;
    if (c < 0.97) return 1.75;
    return 2;
  }
  return DEFAULT_PROB_SIGMA;
}

export function computeProbRange(args: ProbRangeArgs): ProbRangeResult {
  const { spot, sigma, asOfMs, horizonDate } = args;
  if (!(spot > 0) || !Number.isFinite(spot)) {
    throw new Error(`computeProbRange: spot must be positive finite, got ${spot}`);
  }
  if (!(sigma > 0) || !Number.isFinite(sigma) || sigma > 5) {
    throw new Error(`computeProbRange: sigma must be in (0, 5], got ${sigma}`);
  }

  const z = resolveNSigma(args);
  const tYears = yearsToHorizon(asOfMs, horizonDate);
  const move = z * sigma * Math.sqrt(tYears);
  const lo = spot * Math.exp(-move);
  const hi = spot * Math.exp(move);
  return {
    lo,
    hi,
    z,
    tYears,
    movePct: Math.exp(move) - 1,
  };
}

/**
 * Standard normal CDF Φ(x). Pure / deterministic (Abramowitz–Stegun 26.2.17).
 * Used to annotate PROB ladder regions with approximate probability mass under
 * the same log-space normal model as the σ bands (no price-slice table).
 */
export function stdNormalCdf(x: number): number {
  if (!Number.isFinite(x)) return x > 0 ? 1 : 0;
  // Φ(-x) = 1 - Φ(x)
  const neg = x < 0;
  const z = Math.abs(x);
  const t = 1 / (1 + 0.2316419 * z);
  const d = 0.3989422804014327; // 1/√(2π)
  const p =
    d * Math.exp(-0.5 * z * z) * (
      t * (0.319381530
        + t * (-0.356563782
          + t * (1.781477937
            + t * (-1.821255978
              + t * 1.330274429))))
    );
  const cdf = 1 - p;
  return neg ? 1 - cdf : cdf;
}

/** Two-sided mass inside ±nΣ: P(|Z| ≤ n) = 2Φ(n) − 1. */
export function massInsideSigma(n: number): number {
  if (!(n > 0) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, 2 * stdNormalCdf(n) - 1));
}

/** One-sided tail mass beyond nΣ: P(Z > n) = 1 − Φ(n). */
export function massTailBeyondSigma(n: number): number {
  if (!(n > 0) || !Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, 1 - stdNormalCdf(n)));
}

/**
 * Mass in the annulus nLo < |Z| ≤ nHi (both sides combined).
 * nLo, nHi ≥ 0, nHi > nLo. E.g. between 1σ and 1.5σ ≈ 2(Φ(1.5)−Φ(1)).
 */
export function massBetweenSigmaShell(nLo: number, nHi: number): number {
  const a = Math.max(0, nLo);
  const b = Math.max(a, nHi);
  if (!(b > a)) return 0;
  return Math.max(0, Math.min(1, 2 * (stdNormalCdf(b) - stdNormalCdf(a))));
}

/** Format as percent string for chart labels: 0.3413 → "34%". */
export function formatProbMassPct(mass: number, digits: number = 0): string {
  if (!Number.isFinite(mass) || mass < 0) return '—';
  const pct = mass * 100;
  if (digits <= 0) return `${Math.round(pct)}%`;
  return `${pct.toFixed(digits)}%`;
}

/** YYYY-MM-DD for local calendar today. */
export function todayYmd(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD for local calendar tomorrow. */
export function tomorrowYmd(now: Date = new Date()): string {
  const t = new Date(now.getTime());
  t.setDate(t.getDate() + 1);
  return todayYmd(t);
}
