/**
 * usePricingGrid — BSM pricing across the price grid with per-leg T support.
 *
 * Spec: Unified-Pricing-Computation-Spec-v1.1 §6.2
 *
 * Produces for each visible position:
 *   currentSlice — P&L grid at T=now (each leg uses its own fractional T)
 *   expirySlice  — P&L grid at T=0 (intrinsic value, model-independent)
 *   greeks       — delta, gamma, theta, vega at current spot
 *
 * Multi-expiration positions are handled natively: each ResolvedLeg carries
 * its own T (computed from fractionalT at IV-resolution time). No grouping
 * or splitting is required.
 *
 * Profitable segments are located via linear interpolation at zero-crossings
 * — same approach as findProfitableSegments in blackScholes.ts.
 *
 * All entries share the same price grid when sharedRange is provided.
 * This is required for aggregate P&L summation in usePositionPricingModel.
 */

import { useMemo } from 'react';
import {
  blackScholesEngine,
  RISK_FREE_RATE,
  normCdf,
  normPdf,
  type PricingEngine,
} from '../blackScholes';
import type { ResolvedLeg, GridSlice, PnLPoint, Greeks } from './positionPricingModel';

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_STEPS = 400;
const DEFAULT_RANGE_PCT = 0.12;  // [minStrike × (1 - r), maxStrike × (1 + r)]
const MIN_T = 1 / (365 * 24);   // 1-hour floor — BSM requires T > 0
const MULTIPLIER = 100;          // standard US equity options contract multiplier

// ─── Per-price P&L ────────────────────────────────────────────────────────────

function legValue(
  spot: number,
  leg: ResolvedLeg,
  atExpiry: boolean,
  engine: PricingEngine,
): number {
  const isCall = leg.option_type === 'call';
  if (atExpiry) {
    return isCall
      ? Math.max(0, spot - leg.strike)
      : Math.max(0, leg.strike - spot);
  }
  const T = Math.max(leg.T, MIN_T);
  return engine.price(spot, leg.strike, T, RISK_FREE_RATE, leg.iv, isCall);
}

/** One week residual when a calendar collapsed to a single expiration. */
const COLLAPSED_CALENDAR_RESIDUAL_YEARS = 7 / 365.25;

function isCollapsedTimeSpreadLegs(legs: ResolvedLeg[]): boolean {
  if (legs.length !== 2) return false;
  const [a, b] = legs;
  if (a.strike !== b.strike || a.option_type !== b.option_type) return false;
  if (Math.sign(a.quantity) === 0 || Math.sign(b.quantity) === 0) return false;
  return Math.sign(a.quantity) !== Math.sign(b.quantity);
}

/**
 * Mark at nearest expiry: front legs → intrinsic; back legs → residual BS.
 * Fixes calendar/diagonal "at expiry" (same-strike pure intrinsic nets to 0).
 */
function positionValueAtFrontExpiry(
  spot: number,
  legs: ResolvedLeg[],
  engine: PricingEngine,
): number {
  if (legs.length === 0) return 0;
  const expKeys = legs.map(l => String(l.expiration || ''));
  const distinct = new Set(expKeys.filter(Boolean).map(e => e.split('T')[0]));
  let residualT: number[];
  if (distinct.size >= 2) {
    const expMs = expKeys.map(e => {
      if (!e) return NaN;
      const ms = new Date(e.split('T')[0] + 'T16:00:00-04:00').getTime();
      return Number.isFinite(ms) ? ms : NaN;
    });
    const frontMs = Math.min(...expMs.filter(Number.isFinite));
    residualT = expMs.map(ms =>
      Number.isFinite(ms)
        ? Math.max(0, (ms - frontMs) / (365.25 * 24 * 3600 * 1000))
        : 0,
    );
  } else {
    const frontT = Math.min(...legs.map(l => Math.max(0, l.T)));
    residualT = legs.map(l => Math.max(0, l.T - frontT));
  }

  // Collapsed same-exp calendar → synthetic residual on long legs
  if (
    residualT.every(r => r <= MIN_T)
    && isCollapsedTimeSpreadLegs(legs)
  ) {
    residualT = legs.map(l => (l.quantity > 0 ? COLLAPSED_CALENDAR_RESIDUAL_YEARS : 0));
  }

  let total = 0;
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const isCall = leg.option_type === 'call';
    const rem = residualT[i] ?? 0;
    if (rem <= MIN_T) {
      const iv = isCall
        ? Math.max(0, spot - leg.strike)
        : Math.max(0, leg.strike - spot);
      total += leg.quantity * iv;
    } else {
      total += leg.quantity * engine.price(
        spot, leg.strike, Math.max(rem, MIN_T), RISK_FREE_RATE, leg.iv, isCall,
      );
    }
  }
  return total;
}

function positionPnL(
  spot: number,
  legs: ResolvedLeg[],
  netDebit: number,
  atExpiry: boolean,
  engine: PricingEngine,
): number {
  if (atExpiry) {
    const mark = positionValueAtFrontExpiry(spot, legs, engine);
    return (mark - netDebit) * MULTIPLIER;
  }
  const legValues = legs.reduce(
    (sum, leg) => sum + leg.quantity * legValue(spot, leg, false, engine),
    0,
  );
  return (legValues - netDebit) * MULTIPLIER;
}

// ─── Profitable segment scan ──────────────────────────────────────────────────

function findSegments(
  legs: ResolvedLeg[],
  netDebit: number,
  lo: number,
  hi: number,
  atExpiry: boolean,
  engine: PricingEngine,
): [number, number][] {
  if (legs.length === 0) return [];

  const step = (hi - lo) / GRID_STEPS;
  const pnl = (price: number) => positionPnL(price, legs, netDebit, atExpiry, engine);

  const segments: [number, number][] = [];
  let segStart: number | null = null;
  let prev = pnl(lo);
  if (prev > 0) segStart = lo;

  for (let i = 1; i <= GRID_STEPS; i++) {
    const price = lo + i * step;
    const curr = pnl(price);

    if (prev <= 0 && curr > 0) {
      const t = Math.abs(prev) / (Math.abs(prev) + Math.abs(curr));
      segStart = price - step + t * step;
    } else if (prev > 0 && curr <= 0 && segStart !== null) {
      const t = Math.abs(prev) / (Math.abs(prev) + Math.abs(curr));
      segments.push([segStart, price - step + t * step]);
      segStart = null;
    }

    prev = curr;
  }

  if (segStart !== null) segments.push([segStart, hi]);
  return segments;
}

// ─── Full P&L grid ────────────────────────────────────────────────────────────

function buildGridSlice(
  t: number,
  legs: ResolvedLeg[],
  netDebit: number,
  lo: number,
  hi: number,
  atExpiry: boolean,
  engine: PricingEngine,
): GridSlice {
  const step = (hi - lo) / GRID_STEPS;
  const points: PnLPoint[] = new Array(GRID_STEPS + 1);

  for (let i = 0; i <= GRID_STEPS; i++) {
    const price = lo + i * step;
    points[i] = { price, pnl: positionPnL(price, legs, netDebit, atExpiry, engine) };
  }

  return {
    t,
    points,
    segments: findSegments(legs, netDebit, lo, hi, atExpiry, engine),
  };
}

// ─── Greeks ───────────────────────────────────────────────────────────────────

function legGreeks(
  spot: number,
  leg: ResolvedLeg,
): { delta: number; gamma: number; theta: number; vega: number } {
  const T = Math.max(leg.T, MIN_T);
  const K = leg.strike;
  const sigma = leg.iv;
  const r = RISK_FREE_RATE;
  const isCall = leg.option_type === 'call';

  if (sigma <= 0 || spot <= 0 || K <= 0) {
    const itm = isCall ? spot > K : spot < K;
    const d = itm ? (isCall ? 1 : -1) : 0;
    return {
      delta: d * leg.quantity * MULTIPLIER,
      gamma: 0,
      theta: 0,
      vega:  0,
    };
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(spot / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const nd1 = normPdf(d1);
  const gamma = nd1 / (spot * sigma * sqrtT);

  let delta: number;
  let thetaYear: number;

  if (isCall) {
    delta = normCdf(d1);
    thetaYear = -(spot * nd1 * sigma) / (2 * sqrtT)
              - r * K * Math.exp(-r * T) * normCdf(d2);
  } else {
    delta = normCdf(d1) - 1;
    thetaYear = -(spot * nd1 * sigma) / (2 * sqrtT)
              + r * K * Math.exp(-r * T) * normCdf(-d2);
  }

  // vega: dollar change per 1% move in IV, per contract
  const vega = spot * nd1 * sqrtT / 100;

  return {
    delta: delta    * leg.quantity * MULTIPLIER,
    gamma: gamma    * Math.abs(leg.quantity) * MULTIPLIER,
    theta: (thetaYear / 365) * leg.quantity * MULTIPLIER,
    vega:  vega     * leg.quantity * MULTIPLIER,
  };
}

function computeGreeks(spot: number, legs: ResolvedLeg[]): Greeks {
  let delta = 0, gamma = 0, theta = 0, vega = 0;
  for (const leg of legs) {
    const g = legGreeks(spot, leg);
    delta += g.delta;
    gamma += g.gamma;
    theta += g.theta;
    vega  += g.vega;
  }
  return { delta, gamma, theta, vega };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface PricingGridResult {
  currentSlice: GridSlice;
  expirySlice: GridSlice;
  greeks: Greeks;
}

/**
 * Shared price range used when all entries must produce comparable grids.
 * Required for aggregate P&L summation across entries.
 */
export interface SharedPriceRange {
  lo: number;
  hi: number;
}

/**
 * Compute P&L grids and Greeks for all resolved positions.
 *
 * @param resolvedLegsMap  Output of useIVResolution — Map<intentId, ResolvedLeg[]>
 * @param netDebits        Map<intentId, netDebit> — cost basis per entry
 * @param spot             Current spot price (for Greeks and per-entry range fallback)
 * @param sharedRange      Optional shared [lo, hi] for all entries (enables aggregation)
 * @param engine           Pricing engine — defaults to Black-Scholes
 */
export function usePricingGrid(
  resolvedLegsMap: Map<string, ResolvedLeg[]>,
  netDebits: Map<string, number>,
  spot: number,
  sharedRange: SharedPriceRange | null = null,
  engine: PricingEngine = blackScholesEngine,
): Map<string, PricingGridResult> {
  return useMemo(() => {
    const result = new Map<string, PricingGridResult>();
    if (resolvedLegsMap.size === 0 || !(spot > 0)) return result;

    const now = Date.now() / 1000;

    for (const [intentId, legs] of resolvedLegsMap) {
      const netDebit = netDebits.get(intentId);
      if (netDebit === undefined || legs.length === 0) continue;

      let lo: number;
      let hi: number;

      if (sharedRange) {
        lo = sharedRange.lo;
        hi = sharedRange.hi;
      } else {
        const strikes = legs.map(l => l.strike);
        lo = Math.min(...strikes) * (1 - DEFAULT_RANGE_PCT);
        hi = Math.max(...strikes) * (1 + DEFAULT_RANGE_PCT);
      }

      const currentSlice = buildGridSlice(now, legs, netDebit, lo, hi, false, engine);
      const expirySlice  = buildGridSlice(0,   legs, netDebit, lo, hi, true,  engine);
      const greeks       = computeGreeks(spot, legs);

      result.set(intentId, { currentSlice, expirySlice, greeks });
    }

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedLegsMap, netDebits, spot, sharedRange, engine]);
}
