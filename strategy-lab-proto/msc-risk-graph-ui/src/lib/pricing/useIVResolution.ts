/**
 * useIVResolution — canonical 6-tier per-leg IV cascade.
 *
 * Spec: Unified-Pricing-Computation-Spec-v1.1 §4
 *
 * Resolution order per leg:
 *   Tier 1: chainIV.get(strike, type, expiration)          — exact chain IV
 *   Tier 2: chainIV.getNearest(strike, type, expiration)   — nearest strike, same type+exp
 *   Tier 3: chainIV.getClosestDTE(strike, type, expiration) — closest expiration date
 *   Tier 4: leg.implied_volatility                          — snapshot frozen at creation
 *   Tier 5: pickIv(dte, atmIv)                             — ATM IV by DTE from heatmap
 *   Tier 6: max(vixFallback, 0.011)                        — last resort
 *
 * Values outside [0.01, 5.0] are rejected as pathological (deep ITM noise,
 * stale quotes, data errors). The next tier is tried immediately.
 *
 * Returns Map<intentId, ResolvedLeg[]>. Each ResolvedLeg carries the resolved IV,
 * the tier that provided it, and the per-leg fractional T computed at call time.
 *
 * Multi-expiration positions (calendars, diagonals) are handled natively:
 * each leg independently resolves IV from its own strike + expiration.
 */

import { useMemo } from 'react';
import type { RegistryEntry, IntentLeg } from '../../types/position-intent';
import type { ChainIVMap } from '../useChainIV';
import type { AtmIvMap } from '../useAtmIv';
import { pickIv } from '../useAtmIv';
import { fractionalT } from '../blackScholes';
import type { ResolvedLeg, IvTier } from './positionPricingModel';

// ─── Constants ────────────────────────────────────────────────────────────────

const IV_MIN = 0.01;
const IV_MAX = 5.0;

const SKIP_STATUSES = new Set<string>(['CANCELLED', 'REJECTED']);

// ─── Validity filter ──────────────────────────────────────────────────────────

function validIv(v: number | null | undefined): number | null {
  if (v == null || !isFinite(v) || v <= IV_MIN || v >= IV_MAX) return null;
  return v;
}

// ─── Single-leg cascade ───────────────────────────────────────────────────────

/**
 * Resolve the implied volatility for one leg using the canonical 6-tier cascade.
 */
function resolveLegIv(
  leg: IntentLeg,
  dte: number,
  chainIV: ChainIVMap | null | undefined,
  atmIv: AtmIvMap,
  vixFallback: number,
): { iv: number; tier: IvTier } {
  if (chainIV) {
    // Tier 1: exact chain match (strike + type + expiration)
    const exact = validIv(chainIV.get(leg.strike, leg.option_type, leg.expiration));
    if (exact !== null) return { iv: exact, tier: 1 };

    // Tier 2: nearest available strike, same type + expiration
    const nearest = validIv(chainIV.getNearest(leg.strike, leg.option_type, leg.expiration));
    if (nearest !== null) return { iv: nearest, tier: 2 };

    // Tier 3: closest DTE — nearest available expiration, then nearest strike
    const closestDte = validIv(chainIV.getClosestDTE(leg.strike, leg.option_type, leg.expiration));
    if (closestDte !== null) return { iv: closestDte, tier: 3 };
  }

  // Tier 4: stored per-leg IV from PositionIntent (frozen at creation time).
  // Provides per-leg skew accuracy when the live chain is unavailable.
  const stored = validIv(leg.implied_volatility);
  if (stored !== null) return { iv: stored, tier: 4 };

  // Tier 5: ATM IV by DTE from heatmap model (position-level, no strike-specific skew).
  const atmResolved = pickIv(dte, atmIv);
  if (validIv(atmResolved) !== null) return { iv: atmResolved, tier: 5 };

  // Tier 6: VIX fallback — last resort when all chain-derived sources are unavailable.
  return { iv: Math.max(vixFallback, IV_MIN + 0.001), tier: 6 };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Resolve per-leg IV for all visible, non-terminal RegistryEntries.
 *
 * The returned Map is stable across renders when inputs are unchanged.
 * Each ResolvedLeg carries its IV, the tier that provided it, and the
 * fractional T to expiry computed at the moment useMemo executes.
 *
 * @param entries      Registry entries to resolve IV for
 * @param chainIV      Live chain IV map (null = chain not yet loaded)
 * @param atmIv        ATM IV by DTE from useAtmIv
 * @param vixFallback  Tier-6 fallback: annualised IV (e.g. vix / 100). Default: 0.20.
 */
export function useIVResolution(
  entries: RegistryEntry[] | undefined,
  chainIV: ChainIVMap | null | undefined,
  atmIv: AtmIvMap,
  vixFallback = 0.20,
): Map<string, ResolvedLeg[]> {
  return useMemo(() => {
    const result = new Map<string, ResolvedLeg[]>();
    if (!entries || entries.length === 0) return result;

    for (const entry of entries) {
      if (!entry.visible) continue;
      if (SKIP_STATUSES.has(entry.status)) continue;
      if (!entry.intent.legs || entry.intent.legs.length === 0) continue;

      const dte = entry.intent.dte ?? 0;

      const positionQty = entry.intent.quantity ?? 1;
      const resolvedLegs: ResolvedLeg[] = entry.intent.legs.map(leg => {
        const { iv, tier } = resolveLegIv(leg, dte, chainIV, atmIv, vixFallback);
        return {
          strike:      leg.strike,
          option_type: leg.option_type,
          expiration:  leg.expiration,
          quantity:    leg.quantity * positionQty,
          entry_price: leg.entry_price,
          iv,
          ivTier: tier,
          T: fractionalT(leg.expiration),
        };
      });

      result.set(entry.intent.intent_id, resolvedLegs);
    }

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, chainIV, atmIv, vixFallback]);
}
