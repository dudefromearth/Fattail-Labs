/**
 * breakevenEnvelopeAuthority — Time Graph P&L=0 loci from the same pricing
 * path as the 3D risk surface (realtimeClient computePnlAtPrice / tShift).
 *
 * NOT the envelope.worker path (useEnvelope / term-structure worker), which
 * uses a different cost basis and IV scaling and will not match 3D BEs.
 *
 * Output shape matches EnvelopeCrossSection so PositionBoxPrimitive can stroke
 * upper/lower edges without a filled green field.
 */

import type { EnvelopeCrossSection } from '../extractBreakevens';
import { computePnlAtPrice, type RtLeg } from './realtimeClient';
import type { ResolvedLeg } from './positionPricingModel';

const SECS_PER_YEAR = 365.25 * 24 * 3600;
const DEFAULT_SLICES = 48;
const DEFAULT_PRICE_STEPS = 160;

/** Convert pricing-model legs → RtLeg for computePnlAtPrice. */
export function resolvedLegsToRtLegs(legs: readonly ResolvedLeg[]): RtLeg[] {
  return legs.map(l => ({
    strike: l.strike,
    kind: (l.option_type === 'put' ? 'P' : 'C') as 'C' | 'P',
    qty: l.quantity,
    T: Math.max(0, l.T),
    iv: l.iv > 0 && l.iv <= 5 ? l.iv : 0.2,
    mid: l.entry_price ?? 0,
    entryPrice: l.entry_price ?? 0,
  }));
}

/**
 * Contiguous profitable segments [lo, hi] where PnL > 0, via sign changes
 * on a price grid (same zero-crossing idea as 3D findRowZeroCrossings).
 */
export function profitableSegmentsFromPnl(
  priceGrid: readonly number[],
  pnl: readonly number[],
  minAbsSep = 1e-6,
): [number, number][] {
  if (priceGrid.length < 2 || pnl.length !== priceGrid.length) return [];

  const segments: [number, number][] = [];
  let segStart: number | null = null;
  let prev = pnl[0];
  if (prev > minAbsSep) segStart = priceGrid[0];

  for (let i = 1; i < pnl.length; i++) {
    const curr = pnl[i];
    const p0 = prev;
    const p1 = curr;
    const s0 = priceGrid[i - 1];
    const s1 = priceGrid[i];

    if (p0 <= 0 && p1 > 0) {
      const den = Math.abs(p0) + Math.abs(p1);
      const t = den > 0 ? Math.abs(p0) / den : 0.5;
      segStart = s0 + t * (s1 - s0);
    } else if (p0 > 0 && p1 <= 0 && segStart !== null) {
      const den = Math.abs(p0) + Math.abs(p1);
      const t = den > 0 ? Math.abs(p0) / den : 0.5;
      segments.push([segStart, s0 + t * (s1 - s0)]);
      segStart = null;
    }
    prev = curr;
  }

  if (segStart !== null) {
    segments.push([segStart, priceGrid[priceGrid.length - 1]]);
  }
  return segments;
}

export interface AuthorityEnvelopeArgs {
  /** IV-resolved legs (from PositionPricingModel.resolvedLegs). */
  resolvedLegs: readonly ResolvedLeg[];
  /**
   * Cost basis dollars (package). Same units as computePnlAtPrice cbOverride.
   * netDebit (per-share) × 100.
   */
  cbDollars: number;
  /** Live spot — used for vol calibration inside computePnlAtPrice. */
  spot: number;
  /** Unix seconds — left edge of the Time Graph box. */
  entryTime: number;
  /** Unix seconds — right edge (latest leg 4pm ET). */
  expirationTime: number;
  /** Number of time samples (inclusive endpoints). Default 48. */
  numSlices?: number;
  /** Price grid density. Default 160. */
  priceSteps?: number;
}

/**
 * Build smooth BE envelope: at each calendar time t ∈ [entry, expiry], reprice
 * with tShift = (t − now) / year so Teff = leg.T − tShift matches the 3D
 * surface time axis (elapsed from the pricing clock on the legs).
 */
export function buildAuthorityBreakevenEnvelope(
  args: AuthorityEnvelopeArgs,
): EnvelopeCrossSection[] {
  const {
    resolvedLegs,
    cbDollars,
    spot,
    entryTime,
    expirationTime,
    numSlices = DEFAULT_SLICES,
    priceSteps = DEFAULT_PRICE_STEPS,
  } = args;

  if (
    !resolvedLegs.length ||
    !(spot > 0) ||
    !Number.isFinite(entryTime) ||
    !Number.isFinite(expirationTime) ||
    expirationTime <= entryTime
  ) {
    return [];
  }

  const legs = resolvedLegsToRtLegs(resolvedLegs);
  if (legs.length === 0) return [];

  const strikes = legs.map(l => l.strike);
  const sMin = Math.min(...strikes);
  const sMax = Math.max(...strikes);
  // Wide enough for wings / short structures; denser than worker's coarse scan
  const pad = Math.max((sMax - sMin) * 0.35, 40);
  const lo = sMin - pad;
  const hi = sMax + pad;
  const NX = Math.max(priceSteps, 32);
  const step = (hi - lo) / NX;
  const priceGrid: number[] = [];
  for (let j = 0; j <= NX; j++) priceGrid.push(lo + j * step);

  const nowSec = Date.now() / 1000;
  const n = Math.max(numSlices, 2);
  const out: EnvelopeCrossSection[] = [];

  for (let i = 0; i < n; i++) {
    const t = entryTime + (i / (n - 1)) * (expirationTime - entryTime);
    // Years elapsed from the leg pricing clock (now). Past → negative tShift
    // (more residual life); future → positive (same as 3D surface timeGrid).
    const tShift = (t - nowSec) / SECS_PER_YEAR;

    const pnl: number[] = new Array(priceGrid.length);
    for (let j = 0; j < priceGrid.length; j++) {
      pnl[j] = computePnlAtPrice(
        legs,
        priceGrid[j],
        spot,
        undefined,
        undefined,
        tShift,
        0,
        cbDollars,
      );
    }

    out.push({
      t,
      segments: profitableSegmentsFromPnl(priceGrid, pnl),
    });
  }

  return out;
}
