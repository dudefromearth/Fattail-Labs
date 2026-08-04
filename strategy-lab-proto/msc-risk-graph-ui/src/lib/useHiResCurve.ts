/**
 * useHiResCurve — fetches a high-resolution theoretical P&L curve from the
 * server after a drag-drop reposition. During drag the client uses its own
 * 250-point approximate curve for real-time responsiveness. On drop this hook
 * fires a server request for 2001 points; when the response arrives the caller
 * swaps in the smooth hi-res data.
 *
 * The server returns mark-to-market P&L (value @ price − value @ spot).
 * The caller must add theoreticalPnLAtSpot to shift to debit-relative P&L so
 * the curves align visually.
 *
 * Abort semantics: calling request() while a fetch is in-flight cancels the
 * previous request before starting the new one. Calling cancel() explicitly
 * discards the hi-res data and reverts to the approximate curve.
 */

import { useRef, useState, useCallback } from 'react';
import type { Strategy } from './useRiskGraphCalculations';
import type { PnLPoint } from './useRiskGraphCalculations';

interface HiResStrategyPayload {
  underlying: string;
  expiration: string;
  contracts: number;
  dte_days: number;
  vol?: number;
  legs: {
    strike: number;
    type: string;
    side: string;
    quantity: number;
    volatility?: number;
  }[];
}

interface HiResState {
  data: PnLPoint[] | null;
  pending: boolean;
}

interface UseHiResCurveResult {
  hiResData: PnLPoint[] | null;
  pending: boolean;
  request: (params: {
    strategies: Strategy[];
    spot: number;
    baseVol: number;
    rate: number;
    aggregateDebit: number;
    aggregateMarketValue?: number;
    timeMachineOffsetDays?: number;
    positionIds?: string[];
  }) => void;
  cancel: () => void;
}

export function useHiResCurve(): UseHiResCurveResult {
  const [state, setState] = useState<HiResState>({ data: null, pending: false });
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setState({ data: null, pending: false });
  }, []);

  const request = useCallback((params: {
    strategies: Strategy[];
    spot: number;
    baseVol: number;
    rate: number;
    aggregateDebit: number;
    aggregateMarketValue?: number;
    timeMachineOffsetDays?: number;
    positionIds?: string[];
  }) => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const { strategies, spot, baseVol, rate, aggregateDebit, aggregateMarketValue, timeMachineOffsetDays = 0, positionIds } = params;

    // Only strategies that have legs and an expiration can be sent to the server
    const payloadStrategies: HiResStrategyPayload[] = [];
    for (const strat of strategies) {
      if (!strat.legs || strat.legs.length === 0) continue;

      // For time spreads (calendar/diagonal) legs expire on different dates.
      // Split into per-expiration groups so each group gets the correct DTE —
      // the backend prices all legs in a strategy with a single T, which is wrong
      // for multi-expiration strategies. Grouping fixes this without touching the engine.
      const uniqueExpirations = [...new Set(
        strat.legs.map(l => l.expiration).filter(Boolean) as string[]
      )].sort();

      if (uniqueExpirations.length > 1) {
        for (const legExp of uniqueExpirations) {
          const groupLegs = strat.legs.filter(l => l.expiration === legExp);
          if (groupLegs.length === 0) continue;
          const legExpMs = new Date(legExp + 'T21:00:00Z').getTime();
          const groupRawDte = (legExpMs - Date.now()) / 86_400_000;
          const groupDteDays = Math.max(0, groupRawDte - timeMachineOffsetDays);
          payloadStrategies.push({
            underlying: (strat.symbol || 'SPX').replace(/^I:/, ''),
            expiration: legExp,
            contracts: 1,
            dte_days: groupDteDays,
            legs: groupLegs.map(leg => ({
              strike: leg.strike,
              type: leg.right,
              side: leg.quantity > 0 ? 'long' : 'short',
              quantity: Math.abs(leg.quantity),
              volatility: leg.implied_volatility,
            })),
          });
        }
        continue;
      }

      // Single-expiration strategy — original path
      const expiration = strat.expiration ?? strat.legs[0]?.expiration;
      if (!expiration) continue;

      // Compute DTE from expiration date (4pm ET close), adjusted for Time Machine offset
      const expMs = new Date(expiration + 'T21:00:00Z').getTime(); // 4pm ET = 21:00 UTC
      const rawDte = (expMs - Date.now()) / 86_400_000;
      const dte_days = Math.max(0, rawDte - timeMachineOffsetDays);

      payloadStrategies.push({
        underlying: (strat.symbol || 'SPX').replace(/^I:/, ''),
        expiration,
        contracts: 1,
        dte_days,
        legs: strat.legs.map(leg => ({
          strike: leg.strike,
          type: leg.right,
          side: leg.quantity > 0 ? 'long' : 'short',
          quantity: Math.abs(leg.quantity),
          volatility: leg.implied_volatility,
        })),
      });
    }

    if (payloadStrategies.length === 0) {
      setState({ data: null, pending: false });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setState(prev => ({ ...prev, pending: true }));

    fetch('/api/risk-graph/hires', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      signal: controller.signal,
      body: JSON.stringify({
        strategies: payloadStrategies,
        spot,
        base_vol: baseVol,
        risk_free_rate: rate,
        percent_range: 0.20,
        steps: 2001,
        ...(positionIds && positionIds.length > 0 ? { position_ids: positionIds } : {}),
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`hires: ${res.status}`);
        return res.json();
      })
      .then((json: { price_grid: number[]; theo_pnl: number[]; mark_at_spot: number }) => {
        if (controller.signal.aborted) return;
        // Shift from mark-to-market to debit-relative.
        // Prefer the tile market value anchor (aggregateMarketValue) when available —
        // this is the actual market price at spot from the heatmap, which matches ToS.
        // Fall back to server's mark_at_spot only when no tile data is present.
        const marketAnchor = aggregateMarketValue ?? json.mark_at_spot;
        const shift = marketAnchor - aggregateDebit;
        // Floor: the position's P&L can never be worse than the full debit paid.
        // The server computes mark-to-market values; after the debit-relative shift
        // the floor must equal -|aggregateDebit| (same invariant as the client curve).
        const floor = -Math.abs(aggregateDebit);
        const pts: PnLPoint[] = json.price_grid.map((price, i) => ({
          price,
          pnl: Math.max(floor, json.theo_pnl[i] + shift),
        }));
        abortRef.current = null;
        setState({ data: pts, pending: false });
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.warn('useHiResCurve: fetch failed', err);
        abortRef.current = null;
        setState({ data: null, pending: false });
      });
  }, []);

  return { hiResData: state.data, pending: state.pending, request, cancel };
}
