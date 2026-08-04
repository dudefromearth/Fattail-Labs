/**
 * useAtmIv — fetch ATM implied-volatility by DTE from the heatmap model.
 *
 * Source: GET /api/models/heatmap/{symbol}
 *   → response.data.atm_iv  (object: { [dte: string]: number })
 *
 * Refreshes every 30 s. Returns an empty object until first successful fetch.
 * Keys are integer DTE values; values are annualised IV (e.g. 0.24 = 24%).
 */

import { useState } from 'react';

/** DTE (integer days) → annualised IV */
export type AtmIvMap = Record<number, number>;

// Endpoint /api/models/heatmap/{symbol} always returns 404 — polling disabled.
// Callers receive {} and pickIv() falls back to 0.30, same as the current 404 outcome.
export function useAtmIv(_symbol: string): AtmIvMap {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [atmIv] = useState<AtmIvMap>({});
  return atmIv;
}

/**
 * Pick the best IV for a given DTE from the ATM IV map.
 *
 * Priority:
 *  1. Exact DTE match.
 *  2. Closest DTE in the map.
 *  3. Fallback: 0.30 (30%) — conservative default.
 */
export function pickIv(dte: number, atmIv: AtmIvMap): number {
  const keys = Object.keys(atmIv);
  if (keys.length === 0) return 0.30;

  // Exact match
  if (atmIv[dte] !== undefined) return atmIv[dte];

  // Closest DTE
  let bestDte = -1;
  let bestDiff = Infinity;
  for (const k of keys) {
    const n = Number(k);
    const diff = Math.abs(n - dte);
    if (diff < bestDiff) { bestDiff = diff; bestDte = n; }
  }

  return bestDte >= 0 ? atmIv[bestDte] : 0.30;
}
