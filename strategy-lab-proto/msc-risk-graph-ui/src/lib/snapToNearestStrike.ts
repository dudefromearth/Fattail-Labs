/**
 * snapToNearestStrike — canonical strike snapping utility.
 *
 * Single rule applied uniformly across all entry points:
 * A leg strike may only be set to a value that exists in ChainSnapshot
 * for the selected symbol and expiration.
 *
 * CanonicalStrikeMap: expiration → sorted ascending canonical strikes.
 * Shared type used by useChainStrikes, PriceTimeChart, PositionBuilder,
 * MSRiskGraphView, RiskGraphPanel, and useIntentRegistry.
 */

/** Maps expiration string (YYYY-MM-DD) to sorted ascending canonical strikes. */
export type CanonicalStrikeMap = { [expiration: string]: number[] };

/**
 * snapToNearestStrike — snap rawPrice to the nearest value in a sorted
 * canonical strike array.
 *
 * Tie-breaking: when rawPrice is equidistant between two strikes, the lower
 * strike wins. This matches standard options market convention.
 *
 * Returns Math.round(rawPrice) when canonicalStrikes is empty — graceful
 * fallback so callers never receive NaN or null. Never throws.
 *
 * Early-exit optimisation: canonicalStrikes must be sorted ascending.
 * Once distance starts growing we have passed the minimum and can stop.
 */
export function snapToNearestStrike(
  rawPrice: number,
  canonicalStrikes: number[],
): number {
  if (canonicalStrikes.length === 0) return Math.round(rawPrice);

  let nearest = canonicalStrikes[0];
  let minDist = Math.abs(rawPrice - nearest);

  for (const strike of canonicalStrikes) {
    const dist = Math.abs(rawPrice - strike);
    if (dist < minDist) {
      minDist = dist;
      nearest = strike;
    } else if (dist > minDist) {
      // Sorted ascending — distance only grows from here.
      break;
    }
    // dist === minDist: tie — keep existing (lower) strike. Do nothing.
  }

  return nearest;
}
