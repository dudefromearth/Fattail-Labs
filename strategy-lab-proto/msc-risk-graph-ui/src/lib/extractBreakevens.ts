/**
 * extractBreakevens — derive price-time zone bounds from a RegistryEntry.
 *
 * Returns the data needed to draw the PositionBoxPrimitive zones.
 * Called per entry when building the Price-Time chart.
 *
 * Pure utility: no React hooks, no React imports.
 */

import type { RegistryEntry } from '../types/position-intent';

/**
 * One leg's strike line — rendered as a thin horizontal line on the price axis.
 */
export interface StrikeLine {
  strike: number;
  option_type: 'call' | 'put';
  quantity: number;    // signed: +1 long, -2 short
  expiration: string;  // YYYY-MM-DD — used to compute per-leg DTE label
}

/**
 * One time-slice of the profitable zone envelope.
 *
 * The envelope is computed at N evenly-spaced time points between entryTime
 * and expirationTime. Each slice records the profitable price segments at
 * that moment, so the primitive can draw a polygon whose width reflects
 * the theta decay of extrinsic value over time.
 *
 * At entryTime (full T): widest — real-time BS breakevens include extrinsic.
 * At expirationTime (T=0): narrowest — purely intrinsic breakevens.
 * Between: smooth taper driven by sqrt(T) decay of extrinsic value.
 */
export interface EnvelopeCrossSection {
  /** Unix timestamp in seconds — the time this slice represents. */
  t: number;
  /** Profitable price segments [lo, hi] at time t. May be empty. */
  segments: [number, number][];
}

export interface BreakevenBounds {
  /**
   * True when now > expirationTime. Renderer draws ghost style:
   * dashed strike lines, reduced-opacity fill, dashed outline.
   */
  isExpired?: boolean;
  /**
   * At-expiration breakevens — outer bounds of the expiry profitable zone.
   */
  expLower: number;
  expUpper: number;
  /**
   * Real-time (mark-to-model) profitable segments — all contiguous price ranges
   * where the position P&L is currently above zero.
   *
   * Each tuple is [lowerPrice, upperPrice] of one segment.
   * Empty when position is currently unprofitable everywhere.
   *
   * Butterfly → 1 segment. Long strangle → 2 segments. Vertical → 1 open-ended.
   */
  theoSegments: [number, number][];
  /**
   * Smooth theoretical envelope — uniformly-spaced cross-sections using current
   * ATM IV. Defines the outer boundary of the green zone (the ideal BS decay).
   * Rendered as the polygon outline / border.
   */
  smoothEnvelope: EnvelopeCrossSection[];

  /**
   * Candle-resolution envelope — one cross-section per chart bar from entryTime
   * to expirationTime, using the same IV. Because each cross-section is anchored
   * to an actual 5-min bar timestamp, the fill aligns with the chart's x-axis
   * and reflects the exact T-remaining at each traded bar.
   * Rendered as the filled interior (overlaid on smoothEnvelope).
   */
  barEnvelope: EnvelopeCrossSection[];
  /** Time bounds (Unix timestamps, seconds) */
  entryTime: number;
  expirationTime: number;
  /** Source */
  intentId: string;
  frozenSpot: number;
  /** Strike lines — one per leg, drawn as thin white horizontals */
  legs: StrikeLine[];
}

/**
 * Derive BreakevenBounds from a RegistryEntry and its calculated breakeven arrays.
 *
 * @param entry - Registry entry containing the PositionIntent
 * @param expirationBreakevens - At-expiration breakeven prices from useRiskGraphCalculations
 * @param theoreticalBreakevens - Mark-to-model breakeven prices from useRiskGraphCalculations
 * @returns BreakevenBounds or null if insufficient data
 */
export function extractBreakevens(
  entry: RegistryEntry,
  expirationBreakevens: number[],
  theoreticalBreakevens: number[],
): BreakevenBounds | null {
  if (expirationBreakevens.length < 2) {
    return null;
  }

  const expLower = Math.min(...expirationBreakevens);
  const expUpper = Math.max(...expirationBreakevens);
  // Legacy path: build a single segment from the min/max of passed breakevens.
  // Callers using findProfitableSegments directly should populate theoSegments themselves.
  const theoSegments: [number, number][] = theoreticalBreakevens.length >= 2
    ? [[Math.min(...theoreticalBreakevens), Math.max(...theoreticalBreakevens)]]
    : [];

  // Derive expiration time from the latest leg expiration across all legs.
  // Legs expire at 4pm EST (UTC-5) on their expiration date.
  const expirationTime = Math.max(
    ...entry.intent.legs.map(
      leg => new Date(leg.expiration + 'T16:00:00-05:00').getTime() / 1000,
    ),
  );

  // Entry time: approximate — 1 day ago placeholder.
  // FOXTROT will replace with actual entry timestamp from backend.
  const entryTime = Date.now() / 1000 - 86400;

  const legs: StrikeLine[] = entry.intent.legs.map(leg => ({
    strike:      leg.strike,
    option_type: leg.option_type,
    quantity:    leg.quantity,
    expiration:  leg.expiration,
  }));

  return {
    expLower,
    expUpper,
    theoSegments,
    smoothEnvelope: [],   // legacy path — no envelope computed here
    barEnvelope:    [],
    entryTime,
    expirationTime,
    intentId: entry.intent.intent_id,
    frozenSpot: entry.intent.frozen_spot,
    legs,
  };
}
