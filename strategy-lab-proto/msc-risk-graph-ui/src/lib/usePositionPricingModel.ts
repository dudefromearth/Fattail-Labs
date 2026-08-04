/**
 * usePositionPricingModel — Unified Pricing Computation coordinator.
 *
 * Spec: Unified-Pricing-Computation-Spec-v1.1 §3.3
 *
 * Single computation that both the Risk Graph and Time Graph consume.
 *
 *   Risk Graph reads:  currentSlice + expirySlice + breakevens + greeks
 *   Time Graph reads:  envelope + expirySlice + breakevens + legs + timing
 *
 * Internal composition:
 *   useIVResolution  — canonical 6-tier cascade, per-leg IV per entry
 *   usePricingGrid   — BSM pricing across shared price grid, Greeks
 *   useEnvelope      — term-structure projection, smooth + bar cross-sections
 *
 * ┌── Dual-Graph Invariant ────────────────────────────────────────────────────┐
 * │  currentSlice = envelope[T=now].                                           │
 * │                                                                            │
 * │  At t=now in sliceAt(), the term-structure scaling ratio is exactly 1.0   │
 * │  (atmIvAtT / currentAtmIv = currentAtmIv / currentAtmIv). Each leg's     │
 * │  scaled IV equals its resolvedLeg.iv — the same value usePricingGrid      │
 * │  uses. One IV resolution pass. One BSM engine. No separate code paths.    │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * Aggregate breakevens are computed across the shared price grid by summing
 * all entries' currentSlice.points element-wise and finding zero-crossings
 * in the aggregate P&L curve.
 */

import { useMemo } from 'react';
import type { RegistryEntry } from '../types/position-intent';
import type { ChainIVMap } from './useChainIV';
import type { AtmIvMap } from './useAtmIv';
import { pickIv } from './useAtmIv';
import type { PricingEngine } from './blackScholes';
import type { StrikeLine } from './extractBreakevens';
import type {
  PositionPricingModel,
  PositionPricingResult,
  BreakevenSet,
  ResolvedLeg,
} from './pricing/positionPricingModel';
import { useIVResolution } from './pricing/useIVResolution';
import { usePricingGrid, type SharedPriceRange } from './pricing/usePricingGrid';
import { useEnvelope, type EnvelopeEntryInputs } from './pricing/useEnvelope';

// ─── Constants ────────────────────────────────────────────────────────────────

const SKIP_STATUSES = new Set<string>(['CANCELLED', 'REJECTED']);
const SECS_PER_YEAR = 365.25 * 24 * 3600;

// ─── DST-aware expiry timestamp (matches useEnvelope and usePriceTimePositions) ─

function expiry4pmUtc(yyyyMmDd: string): number {
  if (!yyyyMmDd || !/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return NaN;
  const noon = new Date(yyyyMmDd + 'T12:00:00Z');
  const etHour = parseInt(
    noon.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      hour12: false,
    }),
    10,
  );
  const offsetHours = ((noon.getUTCHours() - etHour) + 24) % 24;
  const [yr, mo, dy] = yyyyMmDd.split('-').map(Number);
  return Date.UTC(yr, mo - 1, dy, 16 + offsetHours, 0, 0) / 1000;
}

// ─── Breakeven extraction from a P&L point array ─────────────────────────────

function extractBreakevenSet(
  points: { price: number; pnl: number }[],
): BreakevenSet {
  const zeroCrossings: number[] = [];
  let maxProfit = -Infinity;
  let maxLoss = Infinity;

  for (let i = 0; i < points.length; i++) {
    const { pnl } = points[i];
    if (pnl > maxProfit) maxProfit = pnl;
    if (pnl < maxLoss)   maxLoss   = pnl;

    if (i > 0) {
      const prev = points[i - 1];
      if ((prev.pnl < 0 && pnl >= 0) || (prev.pnl >= 0 && pnl < 0)) {
        if (Math.max(Math.abs(prev.pnl), Math.abs(pnl)) < 0.01) continue;
        const t = Math.abs(prev.pnl) / (Math.abs(prev.pnl) + Math.abs(pnl));
        zeroCrossings.push(prev.price + t * (points[i].price - prev.price));
      }
    }
  }

  return {
    zeroCrossings,
    maxProfit: isFinite(maxProfit) ? maxProfit : 0,
    maxLoss:   isFinite(maxLoss)   ? maxLoss   : 0,
  };
}

// ─── Shared price range across all visible entries ────────────────────────────

function computeSharedRange(
  resolvedLegsMap: Map<string, ResolvedLeg[]>,
  spot: number,
): SharedPriceRange | null {
  if (resolvedLegsMap.size === 0) return null;

  let minStrike = Infinity;
  let maxStrike = -Infinity;

  for (const legs of resolvedLegsMap.values()) {
    for (const leg of legs) {
      if (leg.strike < minStrike) minStrike = leg.strike;
      if (leg.strike > maxStrike) maxStrike = leg.strike;
    }
  }

  if (!isFinite(minStrike) || !isFinite(maxStrike)) return null;

  // Include spot in range so the Greeks anchor point is always covered
  const refLo = Math.min(minStrike, spot);
  const refHi = Math.max(maxStrike, spot);
  const padding = Math.max((refHi - refLo) * 0.15, refHi * 0.05);

  return {
    lo: refLo - padding,
    hi: refHi + padding,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UsePositionPricingModelProps {
  entries: RegistryEntry[] | undefined;
  chainIV: ChainIVMap | null | undefined;
  chainStale?: boolean;
  atmIv: AtmIvMap;
  spot: number;
  /** VIX as a percentage (e.g. 18.5). Converted to decimal for Tier-6 fallback. */
  vix?: number;
  /** Candle timestamps (unix seconds) from the price-time chart for bar alignment. */
  candleTimes?: number[];
  /** Pricing engine override — defaults to Black-Scholes. */
  engine?: PricingEngine;
}

/**
 * Unified pricing coordinator hook.
 *
 * Call once per page. Pass the result to both the Risk Graph and Time Graph.
 * Neither graph should call blackScholes.ts or sub-hooks independently.
 */
export function usePositionPricingModel({
  entries,
  chainIV,
  chainStale = false,
  atmIv,
  spot,
  vix = 20,
  candleTimes,
  engine,
}: UsePositionPricingModelProps): PositionPricingResult {

  // ── Step 1: IV Resolution (6-tier cascade) ──────────────────────────────────
  const vixFallback = Math.max(5, vix) / 100;
  const resolvedLegsMap = useIVResolution(entries, chainIV, atmIv, vixFallback);

  // ── Step 2: Entry metadata (netDebits, entryTimes, expirationTimes) ─────────
  // Computed in one useMemo to avoid triggering the sub-hooks multiple times
  // when entries change but IV data is stable.
  const entryMeta = useMemo(() => {
    const netDebits   = new Map<string, number>();
    const entryTimes  = new Map<string, number>();
    const expTimes    = new Map<string, number>();
    const dtes        = new Map<string, number>();
    const frozenSpots = new Map<string, number>();
    const strikeLinesMap = new Map<string, StrikeLine[]>();

    if (!entries) return { netDebits, entryTimes, expTimes, dtes, frozenSpots, strikeLinesMap };

    const now = Date.now() / 1000;

    for (const entry of entries) {
      if (!entry.visible) continue;
      if (SKIP_STATUSES.has(entry.status)) continue;
      if (!entry.intent.legs || entry.intent.legs.length === 0) continue;

      const { intent } = entry;
      const id = intent.intent_id;

      // Cost basis — always target_price with price_side sign convention, scaled by position quantity
      const positionQty = intent.quantity ?? 1;
      if (intent.target_price != null) {
        const abs = Math.abs(intent.target_price) * positionQty;
        netDebits.set(id, intent.price_side === 'credit' ? -abs : abs);
      }

      // Expiration time — latest leg's 4pm ET (DST-aware)
      const legExpiries = intent.legs.map(l => expiry4pmUtc(l.expiration)).filter(isFinite);
      const expirationTime = legExpiries.length > 0 ? Math.max(...legExpiries) : NaN;
      if (isFinite(expirationTime)) expTimes.set(id, expirationTime);

      // Entry time — admin-set → created_at → now
      const rawEntryTime = entry.entry_time
        ? new Date(entry.entry_time).getTime() / 1000
        : intent.created_at
          ? new Date(intent.created_at).getTime() / 1000
          : now;
      entryTimes.set(id, rawEntryTime);

      dtes.set(id, intent.dte ?? 0);
      frozenSpots.set(id, intent.frozen_spot);

      strikeLinesMap.set(id, intent.legs.map(leg => ({
        strike:      leg.strike,
        option_type: leg.option_type,
        quantity:    leg.quantity * positionQty,
        expiration:  leg.expiration,
      })));
    }

    return { netDebits, entryTimes, expTimes, dtes, frozenSpots, strikeLinesMap };
  }, [entries]);

  // ── Step 3: Shared price range ───────────────────────────────────────────────
  const sharedRange = useMemo(
    () => computeSharedRange(resolvedLegsMap, spot),
    [resolvedLegsMap, spot],
  );

  // ── Step 4: Pricing grid (currentSlice, expirySlice, Greeks) ─────────────────
  const gridResults = usePricingGrid(
    resolvedLegsMap,
    entryMeta.netDebits,
    spot,
    sharedRange,
    engine,
  );

  // ── Step 5: Envelope inputs ───────────────────────────────────────────────────
  const envelopeInputs = useMemo(() => {
    const inputs = new Map<string, EnvelopeEntryInputs>();

    for (const [intentId, resolvedLegs] of resolvedLegsMap) {
      const netDebit       = entryMeta.netDebits.get(intentId);
      const entryTime      = entryMeta.entryTimes.get(intentId);
      const expirationTime = entryMeta.expTimes.get(intentId);
      const dte            = entryMeta.dtes.get(intentId) ?? 0;

      if (netDebit === undefined || entryTime === undefined || expirationTime === undefined) continue;
      if (!isFinite(expirationTime)) continue;

      inputs.set(intentId, { resolvedLegs, netDebit, entryTime, expirationTime, dte });
    }

    return inputs;
  }, [resolvedLegsMap, entryMeta]);

  // ── Step 6: Envelope computation ─────────────────────────────────────────────
  const envelopeResults = useEnvelope(envelopeInputs, atmIv, candleTimes, engine);

  // ── Step 7: Assemble PositionPricingModel[] ───────────────────────────────────
  return useMemo(() => {
    const models: PositionPricingModel[] = [];
    const now = Date.now() / 1000;

    for (const [intentId, resolvedLegs] of resolvedLegsMap) {
      const grid           = gridResults.get(intentId);
      const envelope       = envelopeResults.get(intentId);
      const netDebit       = entryMeta.netDebits.get(intentId);
      const entryTime      = entryMeta.entryTimes.get(intentId);
      const expirationTime = entryMeta.expTimes.get(intentId);
      const dte            = entryMeta.dtes.get(intentId) ?? 0;
      const frozenSpot     = entryMeta.frozenSpots.get(intentId) ?? spot;
      const legs           = entryMeta.strikeLinesMap.get(intentId) ?? [];

      // Skip entries with incomplete data
      if (
        !grid || !envelope || netDebit === undefined ||
        entryTime === undefined || expirationTime === undefined ||
        !isFinite(expirationTime)
      ) continue;

      const isExpired = expirationTime < now;

      // Breakevens for this individual strategy (from currentSlice zero-crossings)
      const breakevens = extractBreakevenSet(grid.currentSlice.points);

      const meta = {
        intentId,
        computedAt:  Date.now(),
        chainStale,
        legIvTiers:  resolvedLegs.map(l => l.ivTier),
      };

      models.push({
        intentId,
        resolvedLegs,
        netDebit,
        currentSlice: grid.currentSlice,
        expirySlice:  grid.expirySlice,
        envelope: {
          smooth: envelope.smooth,
          bars:   envelope.bars,
        },
        breakevens,
        greeks:   grid.greeks,
        meta,
        entryTime,
        expirationTime,
        frozenSpot,
        legs,
        isExpired,
      });
    }

    // ── Aggregate breakevens across all entries ─────────────────────────────
    // Sum currentSlice.points element-wise across all models on the shared grid.
    // All models share the same price grid (same lo, hi, steps via sharedRange),
    // so element-wise summation is valid.
    let aggregateBreakevens: BreakevenSet = {
      zeroCrossings: [],
      maxProfit: 0,
      maxLoss:   0,
    };

    if (models.length > 0) {
      const referencePoints = models[0].currentSlice.points;
      const aggregatePoints = referencePoints.map(({ price }, i) => {
        const pnl = models.reduce((sum, m) => {
          const pt = m.currentSlice.points[i];
          return sum + (pt ? pt.pnl : 0);
        }, 0);
        return { price, pnl };
      });
      aggregateBreakevens = extractBreakevenSet(aggregatePoints);
    }

    return { models, aggregateBreakevens };
  }, [
    resolvedLegsMap,
    gridResults,
    envelopeResults,
    entryMeta,
    spot,
    chainStale,
    sharedRange,
  ]);
}
