/**
 * positionPricingModel.ts — Type definitions for the Unified Pricing Computation layer.
 *
 * Single source of truth for all pricing model output types.
 * Both the Risk Graph and Time Graph read from these types.
 * Neither graph defines its own pricing structures.
 *
 * Spec: Unified-Pricing-Computation-Spec-v1.1
 */

import type { EnvelopeCrossSection, StrikeLine } from '../extractBreakevens';

// ─── IV Resolution ────────────────────────────────────────────────────────────

/**
 * Which tier of the 6-tier cascade resolved this leg's implied volatility.
 *
 *   1 = chain exact match      (chainIV.get — strike + type + expiration)
 *   2 = chain nearest strike   (chainIV.getNearest — same type + expiration)
 *   3 = chain closest DTE      (chainIV.getClosestDTE — nearest expiration)
 *   4 = stored leg IV          (IntentLeg.implied_volatility — frozen at creation)
 *   5 = ATM IV by DTE          (pickIv(dte, atmIv) — heatmap model rollup)
 *   6 = VIX fallback           (max(5, vix) / 100 — last resort)
 */
export type IvTier = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * A position leg with IV fully resolved from the canonical 6-tier cascade.
 *
 * T is the fractional years to this leg's own expiration at the time the model
 * was computed. Multi-expiration positions (calendars, diagonals) carry distinct
 * T values per leg — the pricing engine uses each leg's own T, not a shared one.
 */
export interface ResolvedLeg {
  strike: number;
  option_type: 'call' | 'put';
  expiration: string;           // YYYY-MM-DD
  quantity: number;             // signed: +1 long, -2 short
  entry_price: number;          // dollars per share
  iv: number;                   // resolved implied volatility (annualised, e.g. 0.30)
  ivTier: IvTier;               // which tier resolved this leg's IV
  T: number;                    // fractional years to expiry at model-computation time
}

// ─── Price grid ───────────────────────────────────────────────────────────────

export interface PnLPoint {
  price: number;
  pnl: number;
}

/**
 * One time-slice of the P&L grid.
 *
 *   t        = unix timestamp in seconds (0 = at-expiry sentinel for expirySlice)
 *   points   = P&L at each price step across the scan range
 *   segments = contiguous profitable price segments [lo, hi] where P&L > 0
 */
export interface GridSlice {
  t: number;
  points: PnLPoint[];
  segments: [number, number][];
}

// ─── Greeks ───────────────────────────────────────────────────────────────────

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

// ─── Breakevens ───────────────────────────────────────────────────────────────

/**
 * Zero-crossings and P&L extremes for one strategy or the aggregate portfolio.
 *
 *   zeroCrossings = price(s) where P&L crosses zero (interpolated)
 *   maxProfit     = highest P&L value across the scan range (dollars)
 *   maxLoss       = lowest P&L value (most negative, in dollars)
 */
export interface BreakevenSet {
  zeroCrossings: number[];
  maxProfit: number;
  maxLoss: number;
}

// ─── Model metadata ───────────────────────────────────────────────────────────

export interface PricingModelMeta {
  intentId: string;
  computedAt: number;           // Date.now() — unix milliseconds
  chainStale: boolean;          // true when chain data is > 45 seconds old
  legIvTiers: IvTier[];         // tier per leg, same order as resolvedLegs
}

// ─── Per-entry pricing model ──────────────────────────────────────────────────

/**
 * The single authoritative pricing model for one RegistryEntry.
 *
 * Both the Risk Graph and Time Graph consume this structure.
 *
 * ┌── Dual-Graph Invariant ────────────────────────────────────────────────────┐
 * │                                                                            │
 * │  currentSlice IS envelope.smooth[0] (T=now).                              │
 * │                                                                            │
 * │  At T=now the term-structure scaling ratio is 1.0 (currentAtmIv / itself) │
 * │  so each leg's IV in the scaled BsLeg array equals its resolvedLeg.iv     │
 * │  value. usePricingGrid and useEnvelope both use resolvedLegs with the     │
 * │  same IV values and the same BSM engine — their outputs are numerically   │
 * │  identical at T=now. This is enforced by construction, not coincidence.   │
 * │                                                                            │
 * └────────────────────────────────────────────────────────────────────────────┘
 */
export interface PositionPricingModel {
  intentId: string;

  /** IV-resolved legs — the source of truth for all pricing in this model. */
  resolvedLegs: ResolvedLeg[];

  /**
   * Net cost basis (dollars per share).
   * Always from intent.target_price with price_side sign convention.
   * Positive = debit paid, negative = credit received.
   */
  netDebit: number;

  /**
   * P&L across the price grid at the current moment (T=now).
   * Each leg uses its own fractional T (multi-expiration safe).
   * Risk Graph reads this for the theoretical P&L line.
   */
  currentSlice: GridSlice;

  /**
   * P&L across the price grid at expiration (T=0, intrinsic value only).
   * Model-independent (no engine). Risk Graph reads this for the expiry line.
   * t = 0 (sentinel — not a real timestamp).
   */
  expirySlice: GridSlice;

  /**
   * Time-varying envelope for the Time Graph.
   *
   *   smooth = 40 uniformly-spaced cross-sections from entryTime to expirationTime.
   *            Defines the outer polygon boundary of the green zone.
   *   bars   = one cross-section per 5-minute bar (candle-aligned for the
   *            historical portion, extended at BAR_STEP for the future portion).
   *            Fills the green zone interior with natural decay shape.
   *
   * Each cross-section applies term-structure IV scaling (sticky-strike).
   */
  envelope: {
    smooth: EnvelopeCrossSection[];
    bars: EnvelopeCrossSection[];
  };

  /** Breakevens for this individual strategy (from currentSlice zero-crossings). */
  breakevens: BreakevenSet;

  /** Greeks at current spot: delta, gamma, theta (per day), vega (per 1% IV). */
  greeks: Greeks;

  /** Timing, staleness, and IV source metadata. */
  meta: PricingModelMeta;

  /** Time bounds in unix seconds for the Time Graph renderer. */
  entryTime: number;
  expirationTime: number;

  /** Spot at position creation time (frozen_spot from PositionIntent). */
  frozenSpot: number;

  /** Strike lines — one per leg, for the PositionBoxPrimitive white horizontals. */
  legs: StrikeLine[];

  /** True when now > expirationTime. Renderer applies ghost/dashed style. */
  isExpired: boolean;
}

// ─── Hook result ──────────────────────────────────────────────────────────────

/**
 * Full output of usePositionPricingModel.
 *
 *   models              = one PositionPricingModel per visible, non-terminal entry.
 *                         Time Graph iterates this for envelope rendering.
 *                         Risk Graph sums currentSlice + expirySlice across entries.
 *
 *   aggregateBreakevens = zero-crossings of the combined portfolio P&L curve.
 *                         Risk Graph uses this for zero-line markers and auto-fit.
 */
export interface PositionPricingResult {
  models: PositionPricingModel[];
  aggregateBreakevens: BreakevenSet;
}
