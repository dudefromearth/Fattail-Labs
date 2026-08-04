/* Greeks Dashboard — displays delta, gamma, theta, vega, max P/L, breakevens, topology.
   Uses GlassCard containers. Green for profit, red for loss.
   Multi-position: shows combined Greeks, "N positions" label. */

import { useMemo } from 'react';
import { GlassCard } from '../GlassCard';
import type { ConvexityResult, StrategyInfo } from '../../types/risk-graph';

interface GreeksDashboardProps {
  result: ConvexityResult;
  strategy: StrategyInfo | null;
  spotPrice: number;
  positionCount?: number;
}

const TOPOLOGY_LABELS: Record<string, string> = {
  LONG_GAMMA_CONVEX: 'Long Gamma (Convex)',
  SHORT_GAMMA_CONCAVE: 'Short Gamma (Concave)',
  ASYMMETRIC_CONVEX_UP: 'Asymmetric Convex Up',
  ASYMMETRIC_CONVEX_DOWN: 'Asymmetric Convex Down',
  NEUTRAL_LINEAR: 'Neutral Linear',
};

export function GreeksDashboard({ result, strategy, positionCount = 1 }: GreeksDashboardProps) {
  const { maxProfit, maxLoss, breakevens } = useMemo(() => {
    const grid = result.price_grid;
    const pnl = result.pnl_curve;

    const maxProfit = pnl.length > 0 ? Math.max(...pnl) : 0;
    const maxLoss = pnl.length > 0 ? Math.min(...pnl) : 0;

    // Breakevens: linear interpolation of zero-crossings
    const breakevens: number[] = [];
    for (let i = 1; i < pnl.length; i++) {
      if ((pnl[i - 1] <= 0 && pnl[i] > 0) || (pnl[i - 1] >= 0 && pnl[i] < 0)) {
        const frac = Math.abs(pnl[i - 1]) / (Math.abs(pnl[i - 1]) + Math.abs(pnl[i]));
        breakevens.push(grid[i - 1] + frac * (grid[i] - grid[i - 1]));
      }
    }

    return { maxProfit, maxLoss, breakevens };
  }, [result]);

  const topology = result.convexity_profile
    ? (TOPOLOGY_LABELS[result.convexity_profile] || result.convexity_profile)
    : null;

  const isMulti = positionCount > 1;

  return (
    <div className="greeks-dashboard">
      <GlassCard>
        <div className="gd-section">
          <div className="gd-title">{isMulti ? 'Combined Greeks' : 'Greeks'}</div>
          <div className="gd-row">
            <GreekCell label="Delta" value={result.portfolio_delta} decimals={2} />
            <GreekCell label="Gamma" value={result.portfolio_gamma} decimals={4} />
            <GreekCell label="Theta" value={result.portfolio_theta} decimals={2} prefix="$" />
            <GreekCell label="Vega" value={result.portfolio_vega} decimals={2} />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="gd-section">
          <div className="gd-title">Summary</div>
          <div className="gd-summary-grid">
            <div className="gd-metric">
              <span className="gd-metric-label">Max Profit</span>
              <span className={`gd-metric-value ${maxProfit > 0 ? 'profit' : ''}`}>
                ${maxProfit.toFixed(0)}
              </span>
            </div>
            <div className="gd-metric">
              <span className="gd-metric-label">Max Loss</span>
              <span className={`gd-metric-value ${maxLoss < 0 ? 'loss' : ''}`}>
                ${maxLoss.toFixed(0)}
              </span>
            </div>
            <div className="gd-metric">
              <span className="gd-metric-label">Breakeven{breakevens.length > 1 ? 's' : ''}</span>
              <span className="gd-metric-value">
                {breakevens.length > 0
                  ? breakevens.map(b => b.toFixed(1)).join(', ')
                  : 'None'}
              </span>
            </div>
            {topology && (
              <div className="gd-metric">
                <span className="gd-metric-label">Topology</span>
                <span className="gd-metric-value">{topology}</span>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <div className="gd-strategy-label">
        {isMulti
          ? `${positionCount} positions`
          : strategy?.label ?? 'Unknown'
        }
        {!isMulti && strategy?.auto_detected && <span className="gd-auto-badge">auto</span>}
      </div>
    </div>
  );
}

function GreekCell({
  label,
  value,
  decimals = 2,
  prefix = '',
}: {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
}) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const formatted = `${prefix}${value >= 0 ? '+' : ''}${value.toFixed(decimals)}`;

  return (
    <div className="gd-greek">
      <span className="gd-greek-label">{label}</span>
      <span className={`gd-greek-value ${isPositive ? 'positive' : ''} ${isNegative ? 'negative' : ''}`}>
        {formatted}
      </span>
    </div>
  );
}
