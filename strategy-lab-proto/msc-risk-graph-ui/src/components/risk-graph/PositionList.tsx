/* Position List — left panel showing saved positions with visibility toggles.
   Each card: visibility eye, label, notation, cached P&L, edit/delete actions. */

import type { SavedPosition, TradeRecord, TradeStatus } from '../../types/risk-graph';

interface PositionListProps {
  positions: SavedPosition[];
  visibleIds: Set<string>;
  trades: Map<string, TradeRecord>;
  onToggleVisibility: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onPlaceOrder: (positionId: string) => void;
  onClosePosition: (positionId: string) => void;
}

const BADGE_CLASS: Record<TradeStatus, string> = {
  ANALYSIS: 'tint-badge--blue',
  PENDING: 'tint-badge--yellow',
  OPEN: 'tint-badge--green',
  PARTIAL_OPEN: 'tint-badge--yellow',
  CLOSED: 'tint-badge--gray',
  CANCELLED: 'tint-badge--gray',
  REJECTED: 'tint-badge--red',
};

export function PositionList({
  positions,
  visibleIds,
  trades,
  onToggleVisibility,
  onEdit,
  onDelete,
  onCreate,
  onPlaceOrder,
  onClosePosition,
}: PositionListProps) {
  return (
    <div className="position-list">
      <button className="pl-create-circle" onClick={onCreate} aria-label="Create position" title="Create position">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className="pl-items">
        {positions.map(pos => {
          const isVisible = visibleIds.has(pos.id);
          const cachedPnL = getCachedPnLAtSpot(pos);
          const trade = trades.get(pos.id);
          const status = trade?.status as TradeStatus | undefined;

          return (
            <div key={pos.id} className={`pl-card ${isVisible ? '' : 'pl-card--hidden'}`}>
              <button
                className={`pl-eye ${isVisible ? 'pl-eye--on' : 'pl-eye--off'}`}
                onClick={() => onToggleVisibility(pos.id)}
                aria-label={isVisible ? 'Hide position' : 'Show position'}
              >
                {isVisible ? '●' : '○'}
              </button>

              <div className="pl-card-body">
                <div className="pl-card-label">
                  {pos.label}
                  {status && (
                    <span className={`tint-badge ${BADGE_CLASS[status]}`}>
                      {status}
                    </span>
                  )}
                </div>
                <div className="pl-card-notation">{pos.notation}</div>
                {status === 'OPEN' && trade?.entry_cost != null && (
                  <div className="pl-card-entry">
                    Entry: ${Math.abs(trade.entry_cost).toFixed(2)}
                  </div>
                )}
                {status === 'CLOSED' && trade?.realized_pnl != null && (
                  <div className={`pl-card-pnl ${trade.realized_pnl >= 0 ? 'profit' : 'loss'}`}>
                    P&L: ${trade.realized_pnl.toFixed(2)}
                  </div>
                )}
                {(!status || status === 'CLOSED' || status === 'CANCELLED' || status === 'REJECTED') && cachedPnL !== null && !trade?.realized_pnl && (
                  <div className={`pl-card-pnl ${cachedPnL >= 0 ? 'profit' : 'loss'}`}>
                    P&L: ${cachedPnL.toFixed(0)}
                  </div>
                )}
              </div>

              <div className="pl-card-actions">
                {/* Trade action buttons */}
                {(!status || status === 'CLOSED' || status === 'CANCELLED' || status === 'REJECTED') && (
                  <button
                    className="pl-action-btn pl-action-btn--trade"
                    onClick={() => onPlaceOrder(pos.id)}
                    aria-label="Trade"
                    title="Place order"
                  >
                    Trade
                  </button>
                )}
                {status === 'OPEN' && (
                  <button
                    className="pl-action-btn pl-action-btn--close"
                    onClick={() => onClosePosition(pos.id)}
                    aria-label="Close position"
                    title="Close position"
                  >
                    Close
                  </button>
                )}
                {status === 'PENDING' && (
                  <span className="pl-action-pending" title="Order pending">...</span>
                )}

                <button className="pl-action-btn" onClick={() => onEdit(pos.id)} aria-label="Edit">
                  ✎
                </button>
                <button className="pl-action-btn pl-action-btn--delete" onClick={() => onDelete(pos.id)} aria-label="Delete">
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Extract P&L at spot from cached compute result. */
function getCachedPnLAtSpot(pos: SavedPosition): number | null {
  if (!pos.lastComputeResult || !pos.lastComputeConfig) return null;
  const results = pos.lastComputeResult.results;
  if (!results || results.length === 0) return null;

  // Use first scenario (At Expiration)
  const primary = results[0];
  if (!primary?.convexity) return null;

  const grid = primary.convexity.price_grid;
  const pnl = primary.convexity.pnl_curve;
  const spot = pos.lastComputeConfig.spotPrice;

  if (!grid || !pnl || grid.length < 2) return null;
  if (spot <= grid[0]) return pnl[0];
  if (spot >= grid[grid.length - 1]) return pnl[pnl.length - 1];

  for (let i = 1; i < grid.length; i++) {
    if (grid[i] >= spot) {
      const frac = (spot - grid[i - 1]) / (grid[i] - grid[i - 1]);
      return pnl[i - 1] + frac * (pnl[i] - pnl[i - 1]);
    }
  }
  return null;
}
