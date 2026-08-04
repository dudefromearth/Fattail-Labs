/* Graph Header — control bar above the Risk Graph canvas.
   Left: Risk Graph (n), What's New.
   Center: View toggle (Payoff | Price·Time | History).
   Right: Theo/Mkt, VP, DG, GEX, settings, Auto-Fit.
   Overlay controls only enabled in payoff mode. */

import { CapsuleButton } from '../CapsuleButton';

export type ViewMode = 'payoff' | 'price-time' | 'history';

interface GraphHeaderProps {
  positionCount: number;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function GraphHeader({ positionCount, viewMode = 'payoff', onViewModeChange }: GraphHeaderProps) {
  const isPayoff = viewMode === 'payoff';
  const hasToggle = onViewModeChange != null;
  return (
    <div className="rg-graph-header">
      <div className="rg-graph-header-left">
        <span className="rg-graph-header-title">
          Risk Graph{positionCount > 0 ? ` (${positionCount})` : ''}
        </span>
        <button className="rg-header-btn" disabled>What's New</button>
      </div>

      {/* View toggle — center (only rendered when toggle handler is provided) */}
      {hasToggle && (
        <div className="rg-graph-header-center">
          <div className="rg-view-toggle">
            <CapsuleButton
              label="Payoff"
              compact
              active={viewMode === 'payoff'}
              onClick={() => onViewModeChange!('payoff')}
            />
            <CapsuleButton
              label="Time"
              compact
              active={viewMode === 'price-time'}
              onClick={() => onViewModeChange!('price-time')}
            />
            <CapsuleButton
              label="History"
              compact
              active={viewMode === 'history'}
              onClick={() => onViewModeChange!('history')}
            />
          </div>
        </div>
      )}

      <div className="rg-graph-header-right">
        <button className="rg-header-btn" disabled={!isPayoff}>Theo / Mkt</button>
        <button className="rg-header-btn" disabled={!isPayoff}>VP</button>
        <button className="rg-header-btn" disabled={!isPayoff}>DG</button>
        <button className="rg-header-btn" disabled={!isPayoff}>GEX</button>
        <button className="rg-header-btn rg-header-btn--icon" disabled aria-label="Settings">
          ⚙
        </button>
        <button className="rg-header-btn" disabled={!isPayoff}>Auto-Fit</button>
      </div>
    </div>
  );
}
