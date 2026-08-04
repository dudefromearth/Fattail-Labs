/**
 * MSRiskGraphView — Wrapper that renders the transplanted MarketSwarm RiskGraphPanel.
 * Position list is handled by the transplant's built-in sidebar.
 * Reads RegistryEntry[] and converts to RiskGraphStrategy[] via intentAdapters.
 *
 * Overlay and simulation state is lifted to App.tsx and passed in as props
 * so that WorkspaceControls (top bar) can mirror these controls.
 */

import { useCallback, useMemo, useRef, useState, memo } from 'react';
import { RiskGraph3DView } from './RiskGraph3DView';
import type { Rg3dScrollSensitivity, Rg3dWellStrength } from './RiskGraph3DView';
import RiskGraphPanel, {
  type PriceAlertLine,
  type RiskGraphPanelHandle,
} from '../../ms-transplant/components/RiskGraphPanel';
import type { RegistryEntry } from '../../types/position-intent';
import { toRiskGraphStrategy } from '../../lib/intentAdapters';
import type { ChainIVMap } from '../../lib/useChainIV';
import type { CanonicalStrikeMap } from '../../lib/snapToNearestStrike';
import type { ChartTimeframe } from './PriceTimeChart';
import type { GexByStrike } from '../../lib/useGex';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MSRiskGraphViewProps {
  initialSpot?: number;
  vix?: number;
  symbol?: string;
  entries?: RegistryEntry[];
  onCreatePosition?: () => void;
  onRemoveIntent?: (intentId: string) => void;
  onToggleVisible?: (intentId: string) => void;
  onUpdateTargetPrice?: (intentId: string, price: number) => void;
  onEditPosition?: (intentId: string) => void;
  onSubmitIntent?: (intentId: string) => void;
  onRepositionStrategy?: (
    strategyId: string,
    grabbedStrike: number,
    strikeOffset: number,
    shiftAll: boolean,
  ) => void;
  onSetEntryExitTime?: (intentId: string, entryTime?: string, exitTime?: string) => void;
  // Canonical strike enforcement props
  canonicalStrikeMap?: CanonicalStrikeMap;
  chainIV?: ChainIVMap | null;
  chainIVError?: string | null;
  chainIVStale?: boolean;
  getChainContract?: (expiration: string, strike: number, type: 'call' | 'put') => number | null;
  /** Per-contract IV from SSE (preferred over chainIV HTTP poll for rendering). */
  getSSEIV?: (expiration: string, strike: number, type: 'call' | 'put') => number | null;
  atmIvByDte?: Record<string, number>;
  heatmapTiles?: Record<string, any>;
  // Lifted overlay state
  vpEnabled: boolean;
  msEnabled: boolean;
  gexEnabled: boolean;
  gexMode?: 'net' | 'combined' | 'abs';
  gexByStrike?: GexByStrike;
  zgfzEnabled?: boolean;
  zgfzIntensity?: number;
  /** Probability range band — 2D risk graph only. */
  probEnabled?: boolean;
  probConfidence?: number;
  probDate?: string;
  transparency: number;
  // Lifted simulation state
  timeMachineEnabled: boolean;
  onTimeMachineToggle: () => void;
  simTimeOffsetHours: number;
  onSimTimeChange: (hours: number) => void;
  simVolatilityOffset: number;
  onSimVolatilityChange: (offset: number) => void;
  simSpotPct: number;
  onSimSpotPctChange: (pct: number) => void;
  onResetSimulation: () => void;
  // Auto-fit callback registration
  onAutoFitReady?: (fn: () => void) => void;
  // Chart view (controlled by WorkspaceControls)
  chartView?: 'risk' | 'price' | 'risk3d';
  chartTimeframe?: ChartTimeframe;
  chartSessionOnly?: boolean;
  chartSessionLines?: boolean;
  // Focus region toggle (3D only, §5.14.6 of v1.1.1)
  focusRegionMode?: 'strikes' | 'dollars';
  // Price chart floor — LWC candlestick on the bottom face of the 3D box
  priceChartFloorEnabled?: boolean;
  // Camera drag convention (3D only) — 'natural' = grab-the-model, 'camera' = camera-up
  rg3dDragMode?: 'natural' | 'camera';
  // Scroll sensitivity (3D only)
  rg3dScrollSensitivity?: Rg3dScrollSensitivity;
  // Gravity well strength (3D only)
  rg3dWellStrength?: Rg3dWellStrength;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MSRiskGraphView = memo(function MSRiskGraphView({
  initialSpot,
  vix: vixProp,
  symbol = 'SPX',
  entries = [],
  onCreatePosition,
  onRemoveIntent,
  onToggleVisible,
  onUpdateTargetPrice,
  onEditPosition,
  onSubmitIntent,
  onRepositionStrategy,
  onSetEntryExitTime,
  canonicalStrikeMap,
  chainIV,
  chainIVError,
  chainIVStale,
  getChainContract,
  getSSEIV,
  atmIvByDte,
  heatmapTiles,
  vpEnabled,
  msEnabled,
  gexEnabled,
  gexMode,
  gexByStrike,
  zgfzEnabled,
  zgfzIntensity,
  probEnabled = true,
  probConfidence = 1,
  probDate,
  transparency,
  timeMachineEnabled,
  onTimeMachineToggle,
  simTimeOffsetHours,
  onSimTimeChange,
  simVolatilityOffset,
  onSimVolatilityChange,
  simSpotPct,
  onSimSpotPctChange,
  onResetSimulation,
  onAutoFitReady,
  chartView = 'risk',
  chartTimeframe = '5m',
  chartSessionOnly = false,
  chartSessionLines = false,
  focusRegionMode = 'strikes',
  rg3dDragMode = 'natural',
  rg3dScrollSensitivity = 'normal' as Rg3dScrollSensitivity,
  rg3dWellStrength = 'normal' as Rg3dWellStrength,
  priceChartFloorEnabled = false,
}: MSRiskGraphViewProps) {
  const panelRef = useRef<RiskGraphPanelHandle>(null);
  const [priceAlertLines] = useState<PriceAlertLine[]>([]);

  // Only ANALYSIS-status entries show in the position list.
  // PENDING/OPEN/CLOSED/etc. belong in the Trade Log, not the working surface.
  const activeEntries = useMemo(
    () => entries.filter(e => e.status === 'ANALYSIS'),
    [entries],
  );

  // cardDebits: position card source of truth — forwarded to both the 3D surface
  // (via serverSurface cost-basis shift) and the RiskGraphPanel (via callback).
  const [cardDebits, setCardDebits] = useState<Record<string, number>>({});

  // Convert RegistryEntry[] → RiskGraphStrategy[] via lossless adapter
  const strategies = useMemo(
    () => activeEntries.map(toRiskGraphStrategy),
    [activeEntries],
  );

  // Build status map from registry entries
  const tradeStatuses = useMemo(() => {
    const map = new Map<string, import('../../types/position-intent').TradeStatus>();
    for (const entry of activeEntries) {
      map.set(entry.intent.intent_id, entry.status);
    }
    return map;
  }, [activeEntries]);

  const handleRemoveStrategy = useCallback((id: string) => {
    onRemoveIntent?.(id);
  }, [onRemoveIntent]);

  const handleToggleVisibility = useCallback((id: string) => {
    onToggleVisible?.(id);
  }, [onToggleVisible]);

  const handleUpdateDebit = useCallback((id: string, debit: number | null) => {
    if (debit != null) onUpdateTargetPrice?.(id, debit);
  }, [onUpdateTargetPrice]);

  const noop = useCallback(() => {}, []);

  // Register autoFit callback with parent
  const autoFitRegistered = useRef(false);
  if (onAutoFitReady && !autoFitRegistered.current) {
    autoFitRegistered.current = true;
    // Defer so panelRef is assigned after mount
    setTimeout(() => {
      onAutoFitReady(() => panelRef.current?.autoFit());
    }, 0);
  }

  const spotPrice = initialSpot ?? 5950;


  // 3D surface slot — mounted as chartSlotOverride inside RiskGraphPanel so that
  // the sidebar (positions, alerts), time machine, and stats line are preserved (§12).
  // Only mounted when chartView === 'risk3d'; 'risk' shows the 2D PnLChart instead.
  const riskGraph3DSlot = chartView === 'risk3d' ? (
    <RiskGraph3DView
      entries={entries}
      initialSpot={initialSpot}
      vix={vixProp}
      symbol={symbol}
      chainIV={chainIV}
      chainIVError={chainIVError}
      chainIVStale={chainIVStale}
      cardDebits={cardDebits}
      getContractMid={getChainContract}
      getSSEIV={getSSEIV}
      atmIvByDte={atmIvByDte}
      canonicalStrikeMap={canonicalStrikeMap}
      focusRegionMode={focusRegionMode}
      timeMachineEnabled={timeMachineEnabled}
      simVolatilityOffset={simVolatilityOffset}
      simTimeOffsetHours={simTimeOffsetHours}
      simSpotPct={simSpotPct}
      rg3dDragMode={rg3dDragMode}
      rg3dScrollSensitivity={rg3dScrollSensitivity}
      rg3dWellStrength={rg3dWellStrength}
      vpEnabled={vpEnabled}
      msEnabled={msEnabled}
      gexEnabled={gexEnabled}
      gexMode={gexMode}
      gexByStrike={gexByStrike}
      priceChartFloorEnabled={priceChartFloorEnabled}
      chartTimeframe={chartTimeframe}
      chartSessionOnly={chartSessionOnly}
      chartSessionLines={chartSessionLines}
    />
  ) : undefined;

  return (
    <div className="ms-rg-layout">
      <div className="ms-rg-chart">
      {(
        <RiskGraphPanel
          ref={panelRef}
          strategies={strategies}
          tradeStatuses={tradeStatuses}
          onRemoveStrategy={handleRemoveStrategy}
          onToggleStrategyVisibility={handleToggleVisibility}
          onUpdateStrategyDebit={handleUpdateDebit}
          priceAlertLines={priceAlertLines}
          onDeletePriceAlertLine={noop}
          onOpenAlertDialog={noop as any}
          onStartNewAlert={noop}
          onStartEditingAlert={noop}
          spotPrice={spotPrice}
          vix={vixProp ?? 16}
          timeMachineEnabled={timeMachineEnabled}
          onTimeMachineToggle={onTimeMachineToggle}
          simTimeOffsetHours={simTimeOffsetHours}
          onSimTimeChange={onSimTimeChange}
          simVolatilityOffset={simVolatilityOffset}
          onSimVolatilityChange={onSimVolatilityChange}
          simSpotPct={simSpotPct}
          onSimSpotPctChange={onSimSpotPctChange}
          onResetSimulation={onResetSimulation}
          onCreatePosition={onCreatePosition ?? noop}
          onEditStrategy={onEditPosition}
          onSubmitStrategy={onSubmitIntent}
          onRepositionStrategy={onRepositionStrategy}
          onSetEntryExitTime={onSetEntryExitTime}
          canonicalStrikeMap={canonicalStrikeMap}
          chainIV={chainIV}
          chainIVError={chainIVError}
          chainIVStale={chainIVStale}
          getChainContract={getChainContract}
          getSSEIV={getSSEIV}
          onCardDebitsChange={setCardDebits}
          atmIvByDte={atmIvByDte}
          heatmapTiles={heatmapTiles}
          gexByStrike={gexByStrike ?? undefined}
          gexModeOverride={gexMode}
          vpEnabled={vpEnabled}
          msEnabled={msEnabled}
          zgfzEnabled={zgfzEnabled}
          zgfzIntensity={zgfzIntensity}
          probEnabled={probEnabled && chartView === 'risk'}
          probConfidence={probConfidence}
          probDate={probDate}
          backdropOpacity={(100 - transparency) / 100}
          chartViewMode={chartView === 'price' ? 'price-time' : chartView === 'risk3d' ? 'risk3d' : 'payoff'}
          chartSlotOverride={riskGraph3DSlot}
          priceTimeSymbol={symbol}
          priceTimeEntries={activeEntries}
          priceTimeSpot={spotPrice}
          priceTimeChainIV={chainIV}
          priceTimeGexEnabled={gexEnabled}
          priceTimeVpEnabled={vpEnabled}
          priceTimeMsEnabled={msEnabled}
          priceTimeTimeframe={chartTimeframe}
          priceTimeSessionOnly={chartSessionOnly}
          priceTimeSessionLines={chartSessionLines}
        />
      )}
      </div>
    </div>
  );
});
