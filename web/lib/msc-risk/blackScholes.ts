/**
 * blackScholes.ts — Client-side Black-Scholes pricing.
 *
 * Exact port of src/engines/risk_graph/pricing.py.
 * Same formulas, same constants, same edge-case handling.
 *
 * r = 0.05 (5% risk-free rate) — matches heatmap builder hardcode.
 * T computed to 4:00 PM ET on expiration date — matches _fractional_T().
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const RISK_FREE_RATE = 0.05;

// ─── Math helpers ─────────────────────────────────────────────────────────────

/** Standard normal CDF via error-function approximation (matches erf in Python). */
export function normCdf(x: number): number {
  // Abramowitz & Stegun approximation — same precision as Python math.erf
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * absX);
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  const erf = 1.0 - poly * Math.exp(-absX * absX);
  return 0.5 * (1.0 + sign * erf);
}

export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2.0 * Math.PI);
}

// ─── Black-Scholes core ───────────────────────────────────────────────────────

/**
 * Black-Scholes option price.
 * Returns intrinsic value when T ≤ 0 or sigma ≤ 0 (expiration / invalid).
 *
 * @param S     Underlying spot price
 * @param K     Strike price
 * @param T     Time to expiration in years
 * @param r     Risk-free rate (annualised, e.g. 0.05)
 * @param sigma Implied volatility (annualised, e.g. 0.30)
 * @param isCall true = call, false = put
 */
export function bsPrice(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  isCall: boolean,
  q: number = 0,
): number {
  // Edge cases — intrinsic fallback (matches Python pricing.py)
  if (S <= 0 || K <= 0 || T <= 0 || sigma <= 0) {
    return isCall
      ? Math.max(0, S - K)
      : Math.max(0, K - S);
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  if (isCall) {
    return S * Math.exp(-q * T) * normCdf(d1) - K * Math.exp(-r * T) * normCdf(d2);
  } else {
    return K * Math.exp(-r * T) * normCdf(-d2) - S * Math.exp(-q * T) * normCdf(-d1);
  }
}

// ─── Time helper ──────────────────────────────────────────────────────────────

/**
 * Fractional years from now to 4:00 PM ET on expiration date.
 * Matches services/massive/intel/model_builders/builder.py _fractional_T().
 * Minimum: 1 hour (prevents division by zero).
 */
export function fractionalT(expiration: string): number {
  const now = Date.now();
  // 4pm ET — use fixed UTC offset (-05:00 / EST; DST shifts to -04:00)
  // Parse as local date then force to 16:00 ET
  const [y, m, d] = expiration.split('-').map(Number);
  // Try 4pm EDT (-04:00) and EST (-05:00), take whichever is in the future
  const etEdtMs = Date.UTC(y, m - 1, d, 20, 0, 0); // 4pm EDT = 20:00 UTC
  const etEstMs = Date.UTC(y, m - 1, d, 21, 0, 0); // 4pm EST = 21:00 UTC
  // Choose based on which offset is currently in effect (rough: EDT Mar–Nov)
  const month = m; // 1-12
  const isDst = month >= 3 && month <= 11;
  const closeMs = isDst ? etEdtMs : etEstMs;
  const T = (closeMs - now) / (365.25 * 24 * 3600 * 1000);
  const minT = 1 / (365 * 24); // 1 hour minimum
  return Math.max(T, minT);
}

// ─── Pricing Engine interface (Strategy pattern) ──────────────────────────────

/**
 * A PricingEngine computes the theoretical fair value of a single option.
 *
 * All consumers (legPnL, positionPnL, findProfitableSegments) accept an
 * optional engine parameter — defaulting to blackScholesEngine — so any
 * implementation can be swapped in without touching callers.
 *
 * Implementations must be deterministic: identical inputs → identical output.
 * Monte Carlo engines satisfy this requirement by using a fixed seed.
 */
export interface PricingEngine {
  price(
    S: number,       // underlying spot price
    K: number,       // strike price
    T: number,       // time to expiry in years (> 0)
    r: number,       // risk-free rate (annualised, e.g. 0.05)
    sigma: number,   // implied volatility (annualised, e.g. 0.30)
    isCall: boolean, // true = call, false = put
  ): number;
}

/** Default engine — canonical Black-Scholes analytical solution. */
export const blackScholesEngine: PricingEngine = {
  price: bsPrice,
};

// ─── Position-level helpers ───────────────────────────────────────────────────

export interface BsLeg {
  strike: number;
  option_type: 'call' | 'put';
  quantity: number;    // signed: +1 long, -2 short
  entry_price: number; // dollars per share (what was paid/received per leg)
  expiration: string;  // YYYY-MM-DD
  iv?: number;         // per-leg implied volatility from chain (overrides position-level iv)
}

/**
 * Theoretical P&L of a single leg at spot S and time T.
 * P&L = quantity × (engine.price(...) - entry_price) × 100 (contract multiplier).
 *
 * @param engine  Pricing engine to use — defaults to Black-Scholes.
 */
export function legPnL(
  leg: BsLeg,
  spot: number,
  T: number,
  iv: number,   // position-level fallback IV; per-leg leg.iv takes priority
  r: number,
  engine: PricingEngine = blackScholesEngine,
): number {
  const isCall = leg.option_type === 'call';
  const legIv = leg.iv ?? iv;
  const currentValue = engine.price(spot, leg.strike, T, r, legIv, isCall);
  return leg.quantity * (currentValue - leg.entry_price) * 100;
}

/**
 * Total theoretical P&L of a multi-leg position at spot S.
 * Each leg uses its own T (legs may have different expirations).
 *
 * @param engine  Pricing engine to use — defaults to Black-Scholes.
 */
export function positionPnL(
  legs: BsLeg[],
  spot: number,
  iv: number,
  r: number,
  engine: PricingEngine = blackScholesEngine,
): number {
  return legs.reduce((sum, leg) => {
    const T = fractionalT(leg.expiration);
    return sum + legPnL(leg, spot, T, iv, r, engine);
  }, 0);
}

// ─── Profitable range scan ────────────────────────────────────────────────────

/**
 * Find ALL contiguous price segments where position P&L > 0.
 *
 * Uses a 400-point scan with linear interpolation at each zero-crossing.
 * Returns one segment per contiguous profitable region — handles any topology:
 *
 *   Butterfly / condor / iron condor  →  [ [lower_be, upper_be] ]
 *   Vertical (long call)              →  [ [breakeven, scan_hi] ]
 *   Long strangle                     →  [ [scan_lo, lower_be], [upper_be, scan_hi] ]
 *   Iron fly                          →  [ [lower_be, upper_be] ]
 *
 * Returns [] if the position is never profitable across the scan range.
 *
 * @param debitOverride  Optional total net cost (positive = debit paid, negative = credit
 *                       received). When provided, leg.entry_price values are ignored and
 *                       P&L is computed as (sum_of_leg_values − debitOverride) × 100.
 *                       This matches how useRiskGraphCalculations uses strategy.debit and
 *                       ensures the price chart and risk graph always agree.
 */
export function findProfitableSegments(
  legs: BsLeg[],
  iv: number,
  r: number = RISK_FREE_RATE,
  atExpiration = false,
  engine: PricingEngine = blackScholesEngine,
  debitOverride?: number,
): [number, number][] {
  if (!legs.length) return [];

  const strikes = legs.map(l => l.strike);
  const lo = Math.min(...strikes) * 0.88;
  const hi = Math.max(...strikes) * 1.12;
  const steps = 400;
  const step = (hi - lo) / steps;

  const computePnL = (price: number): number => {
    if (debitOverride !== undefined) {
      // Use total debit as cost basis — matches risk graph's strategy.debit calculation.
      // Bypasses individual leg.entry_price so the two surfaces always agree.
      const legValues = legs.reduce((sum, leg) => {
        const isCall = leg.option_type === 'call';
        if (atExpiration) {
          const intrinsic = isCall
            ? Math.max(0, price - leg.strike)
            : Math.max(0, leg.strike - price);
          return sum + leg.quantity * intrinsic;
        }
        const T = fractionalT(leg.expiration);
        const legIv = leg.iv ?? iv;
        const value = engine.price(price, leg.strike, T, r, legIv, isCall);
        return sum + leg.quantity * value;
      }, 0);
      return (legValues - debitOverride) * 100;
    }
    if (atExpiration) {
      // At expiration intrinsic value is model-independent — no engine needed.
      return legs.reduce((sum, leg) => {
        const isCall = leg.option_type === 'call';
        const intrinsic = isCall
          ? Math.max(0, price - leg.strike)
          : Math.max(0, leg.strike - price);
        return sum + leg.quantity * (intrinsic - leg.entry_price) * 100;
      }, 0);
    }
    return positionPnL(legs, price, iv, r, engine);
  };

  const segments: [number, number][] = [];
  let segStart: number | null = null;
  let prev = computePnL(lo);

  // Handle case where scan starts inside a profitable zone
  if (prev > 0) segStart = lo;

  for (let i = 1; i <= steps; i++) {
    const price = lo + i * step;
    const pnl   = computePnL(price);

    if (prev <= 0 && pnl > 0) {
      // Entering profitable zone — interpolate zero crossing
      const t = prev / (prev - pnl);
      segStart = price - step + t * step;
    } else if (prev > 0 && pnl <= 0) {
      // Leaving profitable zone — interpolate zero crossing
      if (segStart !== null) {
        const t = prev / (prev - pnl);
        segments.push([segStart, price - step + t * step]);
        segStart = null;
      }
    }

    prev = pnl;
  }

  // Close any segment still open at the scan boundary
  if (segStart !== null) {
    segments.push([segStart, hi]);
  }

  return segments;
}

/**
 * Find the price range [lo, hi] where position P&L > 0, using a 400-point scan.
 *
 * @deprecated Prefer findProfitableSegments — correctly handles disjoint profitable
 *             zones (long strangles, complex multi-leg positions). This function
 *             returns only the outermost bounds, masking any loss zones in between.
 */
export function findProfitableRange(
  legs: BsLeg[],
  iv: number,
  r: number = RISK_FREE_RATE,
  atExpiration = false,
): [number, number] | null {
  const segs = findProfitableSegments(legs, iv, r, atExpiration);
  if (!segs.length) return null;
  return [segs[0][0], segs[segs.length - 1][1]];
}

// ─── Legacy zero-crossing scans (kept for tests / future use) ─────────────────

/**
 * Find breakeven prices where position P&L crosses zero.
 * Scans 400 points across [minStrike * 0.88, maxStrike * 1.12].
 * Uses linear interpolation at each zero-crossing.
 *
 * @deprecated Prefer findProfitableRange — handles all topologies including
 *             single-breakeven positions (verticals, naked options).
 */
export function findBsBreakevens(
  legs: BsLeg[],
  iv: number,
  r: number = RISK_FREE_RATE,
): number[] {
  if (!legs.length) return [];

  const strikes = legs.map(l => l.strike);
  const lo = Math.min(...strikes) * 0.88;
  const hi = Math.max(...strikes) * 1.12;
  const steps = 400;
  const step = (hi - lo) / steps;

  const breakevens: number[] = [];
  let prevPnl = positionPnL(legs, lo, iv, r);

  for (let i = 1; i <= steps; i++) {
    const price = lo + i * step;
    const pnl = positionPnL(legs, price, iv, r);
    if (prevPnl * pnl < 0) {
      const t = prevPnl / (prevPnl - pnl);
      breakevens.push(price - step + t * step);
    }
    prevPnl = pnl;
  }

  return breakevens;
}

/**
 * Expiration breakevens — same scan but with T → 0 (intrinsic only).
 *
 * @deprecated Prefer findProfitableRange with atExpiration=true.
 */
export function findExpirationBreakevens(
  legs: BsLeg[],
  r: number = RISK_FREE_RATE,
): number[] {
  if (!legs.length) return [];

  const strikes = legs.map(l => l.strike);
  const lo = Math.min(...strikes) * 0.88;
  const hi = Math.max(...strikes) * 1.12;
  const steps = 400;
  const step = (hi - lo) / steps;

  const intrinsicPnL = (spot: number) =>
    legs.reduce((sum, leg) => {
      const isCall = leg.option_type === 'call';
      const intrinsic = isCall
        ? Math.max(0, spot - leg.strike)
        : Math.max(0, leg.strike - spot);
      return sum + leg.quantity * (intrinsic - leg.entry_price) * 100;
    }, 0);

  const breakevens: number[] = [];
  let prev = intrinsicPnL(lo);

  for (let i = 1; i <= steps; i++) {
    const price = lo + i * step;
    const pnl = intrinsicPnL(price);
    if (prev * pnl < 0) {
      const t = prev / (prev - pnl);
      breakevens.push(price - step + t * step);
    }
    prev = pnl;
  }

  return breakevens;
}
