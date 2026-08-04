/* Risk Graph — Template leg generators.
   Pure functions returning LegInput[] for common strategy templates. */

import type { LegInput } from '../types/risk-graph';

export function butterflyLegs(
  center: number,
  width: number,
  type: 'call' | 'put' = 'call',
): LegInput[] {
  return [
    { strike: center - width, type, quantity: 1, side: 'long', entry_price: 0 },
    { strike: center, type, quantity: 2, side: 'short', entry_price: 0 },
    { strike: center + width, type, quantity: 1, side: 'long', entry_price: 0 },
  ];
}

export function verticalLegs(
  low: number,
  high: number,
  type: 'call' | 'put' = 'call',
  direction: 'debit' | 'credit' = 'debit',
): LegInput[] {
  if (direction === 'debit') {
    return [
      { strike: low, type, quantity: 1, side: 'long', entry_price: 0 },
      { strike: high, type, quantity: 1, side: 'short', entry_price: 0 },
    ];
  }
  return [
    { strike: low, type, quantity: 1, side: 'short', entry_price: 0 },
    { strike: high, type, quantity: 1, side: 'long', entry_price: 0 },
  ];
}

export function ironCondorLegs(
  putLow: number,
  putHigh: number,
  callLow: number,
  callHigh: number,
): LegInput[] {
  return [
    { strike: putLow, type: 'put', quantity: 1, side: 'long', entry_price: 0 },
    { strike: putHigh, type: 'put', quantity: 1, side: 'short', entry_price: 0 },
    { strike: callLow, type: 'call', quantity: 1, side: 'short', entry_price: 0 },
    { strike: callHigh, type: 'call', quantity: 1, side: 'long', entry_price: 0 },
  ];
}

export function straddleLegs(strike: number): LegInput[] {
  return [
    { strike, type: 'call', quantity: 1, side: 'long', entry_price: 0 },
    { strike, type: 'put', quantity: 1, side: 'long', entry_price: 0 },
  ];
}

export function singleLeg(
  strike: number,
  type: 'call' | 'put' = 'call',
  side: 'long' | 'short' = 'long',
): LegInput[] {
  return [
    { strike, type, quantity: 1, side, entry_price: 0 },
  ];
}

/** Broken Wing Butterfly — unequal wings (skip-strike on one side). */
export function bwbLegs(
  center: number,
  width: number,
  type: 'call' | 'put' = 'call',
): LegInput[] {
  // Lower wing is normal width, upper wing is 2× width (skip-strike)
  return [
    { strike: center - width, type, quantity: 1, side: 'long', entry_price: 0 },
    { strike: center, type, quantity: 2, side: 'short', entry_price: 0 },
    { strike: center + width * 2, type, quantity: 1, side: 'long', entry_price: 0 },
  ];
}

/** Condor — 4 legs, same type, buy wings / sell body. */
export function condorLegs(
  center: number,
  width: number,
  type: 'call' | 'put' = 'call',
): LegInput[] {
  return [
    { strike: center - width * 2, type, quantity: 1, side: 'long', entry_price: 0 },
    { strike: center - width, type, quantity: 1, side: 'short', entry_price: 0 },
    { strike: center + width, type, quantity: 1, side: 'short', entry_price: 0 },
    { strike: center + width * 2, type, quantity: 1, side: 'long', entry_price: 0 },
  ];
}

/** Strangle — OTM call + OTM put at different strikes. */
export function strangleLegs(
  center: number,
  width: number,
): LegInput[] {
  return [
    { strike: center - width, type: 'put', quantity: 1, side: 'long', entry_price: 0 },
    { strike: center + width, type: 'call', quantity: 1, side: 'long', entry_price: 0 },
  ];
}

/** Iron Fly (Iron Butterfly) — ATM straddle body + OTM wing protection. */
export function ironFlyLegs(
  center: number,
  width: number,
): LegInput[] {
  return [
    { strike: center - width, type: 'put', quantity: 1, side: 'long', entry_price: 0 },
    { strike: center, type: 'put', quantity: 1, side: 'short', entry_price: 0 },
    { strike: center, type: 'call', quantity: 1, side: 'short', entry_price: 0 },
    { strike: center + width, type: 'call', quantity: 1, side: 'long', entry_price: 0 },
  ];
}

/** Calendar — same strike, same type, two expirations (front short / back long).
 *  Expiration is set at the PositionInput level; the second leg's expiration
 *  must be edited manually in the dialog. */
export function calendarLegs(
  strike: number,
  type: 'call' | 'put' = 'call',
): LegInput[] {
  return [
    { strike, type, quantity: 1, side: 'short', entry_price: 0 },
    { strike, type, quantity: 1, side: 'long', entry_price: 0 },
  ];
}

/**
 * Default diagonal: short front at center, long back higher by `width`.
 * Default product width is "2 strikes between" (3 chain steps) — see
 * PositionBuilder.diagonalWidthForTwoStrikesBetween.
 */
export function diagonalLegs(
  center: number,
  width: number,
  type: 'call' | 'put' = 'call',
): LegInput[] {
  return [
    { strike: center, type, quantity: 1, side: 'short', entry_price: 0 },
    { strike: center + width, type, quantity: 1, side: 'long', entry_price: 0 },
  ];
}

/**
 * Width (points) so there are `strikesBetween` listed strikes between the two
 * diagonal legs. e.g. between=2 → step offset 3 on the ladder
 * (7580 / 7585 / 7590 / 7595 → short 7580, long 7595).
 */
export function diagonalWidthFromLadder(
  center: number,
  ladder: readonly number[],
  strikesBetween: number = 2,
): number | null {
  if (ladder.length < 2 || strikesBetween < 0) return null;
  let idx = 0;
  let best = Infinity;
  for (let i = 0; i < ladder.length; i++) {
    const d = Math.abs(ladder[i] - center);
    if (d < best) {
      best = d;
      idx = i;
    }
  }
  const steps = strikesBetween + 1; // 2 between → 3 increments
  let j = idx + steps;
  if (j >= ladder.length) j = idx - steps;
  if (j < 0 || j >= ladder.length) {
    // Fall back to nearest neighbor in the only available direction
    j = idx < ladder.length - 1 ? idx + 1 : idx - 1;
  }
  if (j < 0 || j >= ladder.length || j === idx) return null;
  return Math.abs(ladder[j] - ladder[idx]);
}
