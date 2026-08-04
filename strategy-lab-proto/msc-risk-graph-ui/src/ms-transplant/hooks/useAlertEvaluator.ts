/**
 * useAlertEvaluator — Client-side threshold evaluator
 *
 * Evaluates threshold alerts against live (or simulated) market data.
 * Returns a Set of alert IDs whose conditions are currently met.
 *
 * Evaluates both Observe and Active alerts (for live indicator display),
 * but triggering actions only fire for Active mode alerts (handled by caller).
 */

import { useMemo } from 'react';
import type { Alert, ThresholdScope } from '../types/alerts';

export interface EvaluatorInput {
  alerts: Alert[];
  hasPositions: boolean;
  spotPrice: number;
  delta: number;
  gamma: number;
  theta: number;
  totalPnL: number;
  strategyPnLAtSpot: Record<string, number>;
  strategyGreeks: Record<string, { delta: number; gamma: number; theta: number }>;
}

function evaluateCondition(
  currentValue: number,
  condition: string,
  targetValue: number,
): boolean {
  switch (condition) {
    case 'above': return currentValue >= targetValue;
    case 'below': return currentValue <= targetValue;
    case 'at': return Math.abs(currentValue - targetValue) < 0.5;
    default: return false;
  }
}

function getAlertCurrentValue(
  alert: Alert,
  input: EvaluatorInput,
): number | null {
  const scope: ThresholdScope = (alert as any).thresholdScope || 'single';
  const strategyId = 'strategyId' in alert ? (alert as any).strategyId : undefined;
  const strategyIds: string[] = (alert as any).strategyIds || (strategyId ? [strategyId] : []);

  switch (alert.type) {
    case 'price':
      return input.spotPrice;

    case 'profit_target': {
      if (scope === 'all') return input.totalPnL;
      if (scope === 'any') {
        const pnls = Object.values(input.strategyPnLAtSpot);
        return pnls.length > 0 ? Math.max(...pnls) : null;
      }
      if (scope === 'group') {
        return strategyIds.reduce((sum, id) => sum + (input.strategyPnLAtSpot[id] ?? 0), 0);
      }
      // single
      return strategyId ? (input.strategyPnLAtSpot[strategyId] ?? null) : input.totalPnL;
    }

    case 'greeks_threshold': {
      // Prefer greekName field; label is used by designer for algo subtype / greek
      const greekName = String(
        (alert as { greekName?: string }).greekName || alert.label || 'delta',
      ).toLowerCase();
      if (scope === 'all') {
        switch (greekName) {
          case 'delta': return input.delta;
          case 'gamma': return input.gamma;
          case 'theta': return input.theta;
          default: return null;
        }
      }
      if (scope === 'any') {
        const values = Object.values(input.strategyGreeks).map(g => {
          switch (greekName) {
            case 'delta': return g.delta;
            case 'gamma': return g.gamma;
            case 'theta': return g.theta;
            default: return 0;
          }
        });
        if (values.length === 0) return null;
        return alert.condition === 'below' ? Math.min(...values) : Math.max(...values);
      }
      if (scope === 'group') {
        return strategyIds.reduce((sum, id) => {
          const g = input.strategyGreeks[id];
          if (!g) return sum;
          switch (greekName) {
            case 'delta': return sum + g.delta;
            case 'gamma': return sum + g.gamma;
            case 'theta': return sum + g.theta;
            default: return sum;
          }
        }, 0);
      }
      // single — prefer per-strategy greeks when bound
      if (strategyId && input.strategyGreeks[strategyId]) {
        const g = input.strategyGreeks[strategyId];
        switch (greekName) {
          case 'delta': return g.delta;
          case 'gamma': return g.gamma;
          case 'theta': return g.theta;
          default: return null;
        }
      }
      // Fallback to aggregate portfolio greeks
      switch (greekName) {
        case 'delta': return input.delta;
        case 'gamma': return input.gamma;
        case 'theta': return input.theta;
        default: return null;
      }
    }

    case 'portfolio_pnl':
      return input.totalPnL;

    default:
      return null;
  }
}

export function useAlertEvaluator(input: EvaluatorInput): Set<string> {
  return useMemo(() => {
    const metIds = new Set<string>();

    if (!input.hasPositions) return metIds;

    for (const alert of input.alerts) {
      if (!alert.enabled) continue;
      if (alert.triggered) continue;

      // Only evaluate threshold-type alerts
      const evaluatable = ['price', 'profit_target', 'greeks_threshold', 'portfolio_pnl'];
      if (!evaluatable.includes(alert.type)) continue;

      const currentValue = getAlertCurrentValue(alert, input);
      if (currentValue === null) continue;

      if (evaluateCondition(currentValue, alert.condition, alert.targetValue)) {
        metIds.add(alert.id);
      }
    }

    return metIds;
  }, [
    input.alerts,
    input.hasPositions,
    input.spotPrice,
    input.delta,
    input.gamma,
    input.theta,
    input.totalPnL,
    input.strategyPnLAtSpot,
    input.strategyGreeks,
  ]);
}
