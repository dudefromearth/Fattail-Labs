/* Left Rail — full-height left column of the Risk Graph surface.
   Contains: Positions List, Algo Alerts, Alerts, Greeks Dashboard. */

import { PositionsList } from './PositionsList';
import { AlertsSection } from './AlertsSection';
import { GreeksDashboard } from './GreeksDashboard';
import type { UiPosition, ConvexityResult, StrategyInfo, TradeStatus } from '../../types/risk-graph';

interface LeftRailProps {
  positions: UiPosition[];
  visibleIds: Set<string>;
  tradeStatuses: Map<string, TradeStatus>;
  focusedId: string | null;
  onFocusPosition: (id: string) => void;
  onCreatePosition: () => void;
  onToggleVisibility: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  onUpdatePrice: (id: string, value: number) => void;
  greeksResult: ConvexityResult | null;
  strategy: StrategyInfo | null;
  spotPrice: number;
  positionCount: number;
}

export function LeftRail({
  positions,
  visibleIds,
  tradeStatuses,
  focusedId,
  onFocusPosition,
  onCreatePosition,
  onToggleVisibility,
  onEdit,
  onDelete,
  onSubmit,
  onUpdatePrice,
  greeksResult,
  strategy,
  spotPrice,
  positionCount,
}: LeftRailProps) {
  return (
    <div className="rg-left-rail">
      {/* Positions section */}
      <div className="rg-rail-section rg-rail-section--positions">
        <div className="rg-rail-section-header">
          <span className="rg-rail-section-title">POSITIONS</span>
          <button
            className="rg-rail-create-btn"
            onClick={onCreatePosition}
            aria-label="Create Position"
          >
            +
          </button>
        </div>
        <PositionsList
          positions={positions}
          visibleIds={visibleIds}
          tradeStatuses={tradeStatuses}
          focusedId={focusedId}
          onFocus={onFocusPosition}
          onToggleVisibility={onToggleVisibility}
          onEdit={onEdit}
          onDelete={onDelete}
          onSubmit={onSubmit}
          onUpdatePrice={onUpdatePrice}
        />
      </div>

      {/* Alerts */}
      <AlertsSection />

      {/* Greeks Dashboard — pinned to bottom */}
      {greeksResult && (
        <div className="rg-rail-section rg-rail-section--greeks">
          <GreeksDashboard
            result={greeksResult}
            strategy={strategy}
            spotPrice={spotPrice}
            positionCount={positionCount}
          />
        </div>
      )}
    </div>
  );
}
