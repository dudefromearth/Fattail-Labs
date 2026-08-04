/**
 * usePriceTimePositions — compute BreakevenBounds[] for the Price-Time chart.
 *
 * Structural data (entry/expiry, legs, current/expiry slices) comes from
 * usePositionPricingModel. Breakeven **curves** over time use the same P&L
 * authority as the 3D risk surface (realtimeClient computePnlAtPrice + tShift)
 * via buildAuthorityBreakevenEnvelope — NOT the envelope.worker path.
 *
 * @param entries                Registry entries
 * @param atmIv                  ATM IV by DTE from useAtmIv
 * @param chainIV                Per-contract IV map (same source as Risk Graph)
 * @param _spot                  Live spot (used for pricing model + frozenSpot fallback)
 * @param entryTimeOverride      Unix seconds — overrides entryTime for all positions (test)
 * @param expirationTimeOverride Unix seconds — overrides expirationTime (test)
 * @param _engine                Pricing engine override (forwarded to unified model)
 * @param candleTimes            Candle timestamps (Unix seconds) for bar-envelope alignment
 * @param pricingResult          Optional pre-computed unified model — when provided the
 *                               hook skips its internal usePositionPricingModel call and
 *                               reads directly from the shared result (avoids double work
 *                               once prop-drilling wiring is complete).
 */

import { useMemo } from 'react';
import type { RegistryEntry } from '../types/position-intent';
import type { BreakevenBounds } from './extractBreakevens';
import type { AtmIvMap } from './useAtmIv';
import type { ChainIVMap } from './useChainIV';
import type { PositionPricingResult } from './pricing/positionPricingModel';
import { usePositionPricingModel } from './usePositionPricingModel';
import { useRealTimeRiskMap } from './useRealTimeRisk';
import { buildAuthorityBreakevenEnvelope } from './pricing/breakevenEnvelopeAuthority';

export function usePriceTimePositions(
  entries: RegistryEntry[] | undefined,
  atmIv: AtmIvMap,
  chainIV?: ChainIVMap | null,
  _spot?: number,
  entryTimeOverride?: number,
  expirationTimeOverride?: number,
  _engine?: unknown,
  candleTimes?: number[],
  pricingResult?: PositionPricingResult,
): BreakevenBounds[] {
  // Unified pricing model — called unconditionally (hooks must not be conditional).
  // Used for structural data: entry/expiry times, at-expiry segments, legs.
  const internalResult = usePositionPricingModel({
    entries,
    chainIV,
    atmIv,
    spot: _spot ?? 0,
    candleTimes,
  });

  // Prefer an externally-provided result (shared computation, no double work).
  const result = pricingResult ?? internalResult;

  // Server-authoritative profitable segments from POST /api/risk/real-time.
  // Replaces client-side BS current-slice segment computation.
  const intentIds = useMemo(
    () => (entries ?? []).map(e => e.intent.intent_id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [(entries ?? []).map(e => e.intent.intent_id).join(',')],
  );
  const serverDataMap = useRealTimeRiskMap(intentIds, _spot ?? null);

  return useMemo(() => {
    const bounds: BreakevenBounds[] = [];

    for (const model of result.models) {
      const expirationTime = expirationTimeOverride ?? model.expirationTime;

      // Entry time: honour test override, otherwise snap to nearest candle bar.
      // LWC's timeToCoordinate() only resolves timestamps that fall on actual bar
      // data in the combined series — snapping guarantees a valid coordinate.
      const rawEntryTime = entryTimeOverride ?? model.entryTime;
      const entryTime = (() => {
        if (!candleTimes || candleTimes.length === 0) return rawEntryTime;
        const snapped = candleTimes.find(t => t >= rawEntryTime);
        // If rawEntryTime is after all candles (e.g. position entered today),
        // anchor to the last candle bar so it still appears on the right side.
        return snapped ?? candleTimes[candleTimes.length - 1];
      })();

      // At-expiry profitable segments define expLower / expUpper.
      const expSegs = model.expirySlice.segments;
      if (!expSegs.length) {
        // Never profitable at expiry — show strike lines only.
        bounds.push({
          isExpired: model.isExpired,
          expLower: 0,
          expUpper: 0,
          theoSegments: [],
          smoothEnvelope: [],
          barEnvelope: [],
          entryTime,
          expirationTime,
          intentId: model.intentId,
          frozenSpot: model.frozenSpot,
          legs: model.legs,
        });
        continue;
      }

      const expLower = expSegs[0][0];
      const expUpper = expSegs[expSegs.length - 1][1];

      // Server profitable segments (current-time, T=now) — replaces client BS.
      // Falls back to client model when server hasn't responded yet.
      const serverSegs = serverDataMap[model.intentId]?.profitableSegments;
      const theoSegments = serverSegs ?? model.currentSlice.segments;

      // 3D-parity BE envelope: same computePnlAtPrice + tShift as RiskGraph3DView
      // surface zeros — not model.envelope (envelope.worker / useEnvelope).
      const spot = (_spot != null && _spot > 0) ? _spot : model.frozenSpot;
      const cbDollars = model.netDebit * 100;
      const authorityEnvelope = spot > 0
        ? buildAuthorityBreakevenEnvelope({
            resolvedLegs: model.resolvedLegs,
            cbDollars,
            spot,
            entryTime,
            expirationTime,
            numSlices: 48,
          })
        : [];

      bounds.push({
        isExpired: model.isExpired,
        expLower,
        expUpper,
        theoSegments,
        smoothEnvelope: authorityEnvelope,
        // Dense candle-aligned path optional later; smooth is enough for strokes
        barEnvelope: [],
        entryTime,
        expirationTime,
        intentId: model.intentId,
        frozenSpot: model.frozenSpot,
        legs: model.legs,
      });
    }

    return bounds;
  }, [result, serverDataMap, entryTimeOverride, expirationTimeOverride, candleTimes, _spot]);
}
