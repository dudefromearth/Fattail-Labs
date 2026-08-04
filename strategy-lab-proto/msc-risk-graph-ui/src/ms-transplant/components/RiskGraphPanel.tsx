/**
 * RiskGraphPanel - Consolidated Risk Graph component
 *
 * Features:
 * - P&L chart (PnLChart) with expiration and theoretical curves
 * - Positions list with visibility toggle and debit editing
 * - Alerts section with price line alerts
 * - 3D of Options controls (time, spot, volatility simulation)
 * - Summary stats (Real-Time P&L, Max Profit, Max Loss)
 */

import React, { useRef, useMemo, useCallback, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useHiResCurve } from '../../lib/useHiResCurve';
import { USE_REALTIME_AUTHORITY } from '../../lib/pricing/authority';
import { pricingAsOfMs } from '../../lib/tradingSessions';
import {
  interpolatePnl,
  findZeroCrossings,
  curveMinMax,
  toCurvePoints,
} from '../../lib/pricing/curveMath';
import {
  buildLegsAndCostBasis,
  buildMultiPositionSharedCurves,
  buildPerIntentLegsAndCostBasis,
  buildSharedRiskCurves,
  applyFlatIv,
  resolveFlatIvToPackage,
  resolveTheoIvSeed,
  normalizePerShareDebit,
  isPositionExpired,
  chainStrikesForExpirations,
} from '../../lib/pricing/sharedRiskSurface';
import { computePnlAtPrice } from '../../lib/pricing/realtimeClient';
import { useRealTimeRiskMap, type RealTimeRiskResult } from '../../lib/useRealTimeRisk';
import PnLChart, { type PnLChartHandle, type PriceAlertType, type BackdropRenderProps, type PnLAlertZone, type StrikeDragInfo } from './PnLChart';
import RiskGraphBackdrop from './RiskGraphBackdrop';
import RiskGraphBackdropSettings from './RiskGraphBackdropSettings';
import AlgoAlertPanel from './AlgoAlertPanel';
import AlertDesigner from './AlertDesigner';
// PositionAlertDialog removed — consolidated into AlertDesigner
import WhatsNew from './WhatsNew';
import { PriceTimeChart, type ChartTimeframe } from '../../components/risk-graph/PriceTimeChart';
import { PriceTimeHistory } from '../../components/risk-graph/PriceTimeHistory';
import {
  useRiskGraphCalculations,
  type Strategy,
  type MarketRegime,
  type PricingModel,
} from '../hooks/useRiskGraphCalculations';
import { resolveSpotKey } from '../utils/symbolResolver';
import type { ChainIVMap } from '../../lib/useChainIV';
import { useAlerts } from '../contexts/AlertContext';
import { useAlertEvaluator } from '../hooks/useAlertEvaluator';
import { canonicalAlertsForEvaluator } from '../../lib/alerts/canonicalToEvaluator';
import { useDealerGravity } from '../contexts/DealerGravityContext';
import { useIndicatorSettings } from './chart-primitives';
import { computeProbRange, tomorrowYmd } from '../../lib/pricing/probRange';
import { pickIv } from '../../lib/useAtmIv';
import { isTimeSpreadAutofit } from '../../lib/pricing/autofitView';
import { repriceShortCredit } from '../../lib/repriceCredit';
import { applyLabsStrikeDrag } from '../../lib/labsDragGeometry';

/** Risk Graph vol surface mode for the real-time (T+0) curve.
 *  'mkt'  — per-leg chain IV + mid-calibrated parallel shift
 *  'theo' — flat / single-IV surface (no mid cal)
 *  'both' — overlay Mkt (magenta) + Theo (orange)
 */
export type RgVolSurfaceMode = 'mkt' | 'theo' | 'both';
const RG_VOL_SURFACE_LS_KEY = 'rgVolSurfaceMode';

function loadVolSurfaceMode(): RgVolSurfaceMode {
  try {
    const v = localStorage.getItem(RG_VOL_SURFACE_LS_KEY);
    if (v === 'mkt' || v === 'theo' || v === 'both') return v;
  } catch { /* ignore */ }
  return 'mkt';
}

/**
 * Risk Graph curve stroke language (PnLChart consumes these).
 * Live series use color; expired is neutral dashed grey only.
 */
export const RG_RT_CURVE_COLORS = {
  mkt: '#e879f9',      // magenta — Mkt Real-Time (per-leg + mid cal)
  theo: '#f97316',     // orange — Theo Real-Time (single IV)
  expiry: '#3b82f6',   // blue — live at-expiry
  expired: '#6b7280',  // grey — expired ghost (dashed; no series color)
} as const;

import type {
  Alert,
  AlertType,
  AlertBehavior,
  AlertCondition,
  AlertMode,
  CreateCanonicalAlertRequest,
} from '../types/alerts';
import type { PositionLeg, PositionType, PositionDirection, CostBasisType } from '../types/riskGraph';
import { recognizePositionType, strategyToLegs } from '../utils/positionRecognition';
import { formatLegsDisplay, formatPositionLabel } from '../utils/positionFormatting';

// Re-export types for consumers
export type { AlertBehavior, AlertType };

// ─── GEX Y-Axis Scale ────────────────────────────────────────────────────────
// PnLChart canvas padding constants (must stay in sync with PnLChart.tsx)
const PNLCHART_PAD_TOP = 40;
const PNLCHART_PAD_BOTTOM = 50;

function formatGex(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toFixed(0);
}

function GexYAxis({
  containerHeight,
  maxGex,
  heightPercent,
  callColor,
  putColor,
  mode,
}: {
  containerHeight: number;
  maxGex: number;
  heightPercent: number;
  callColor: string;
  putColor: string;
  mode: 'combined' | 'net' | 'abs';
}) {
  if (containerHeight < 50 || maxGex === 0) return null;
  const chartH = containerHeight - PNLCHART_PAD_TOP - PNLCHART_PAD_BOTTOM;
  const centerY = PNLCHART_PAD_TOP + chartH / 2;
  const maxBarH = chartH * (heightPercent / 100);
  const ticks = [0.25, 0.5, 0.75, 1.0] as const;
  const spineX = 6;
  const tickX2 = 14;
  const labelX = 16;

  return (
    <svg
      style={{
        position: 'absolute', right: 0, top: 0,
        width: 58, height: containerHeight,
        pointerEvents: 'none', zIndex: 2, overflow: 'visible',
      }}
    >
      {/* Spine */}
      <line x1={spineX} y1={centerY - maxBarH} x2={spineX} y2={mode === 'abs' ? centerY : centerY + maxBarH}
        stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      {/* Zero tick */}
      <line x1={spineX} y1={centerY} x2={tickX2} y2={centerY}
        stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <text x={labelX} y={centerY + 3} fontSize={15} fill="rgba(255,255,255,0.35)"
        textAnchor="start" fontFamily="monospace">0</text>
      {/* Call/Abs ticks (upward) */}
      {ticks.map(f => {
        const y = centerY - maxBarH * f;
        const color = mode === 'abs' ? '#3b82f6' : callColor;
        return (
          <g key={`c${f}`}>
            <line x1={spineX} y1={y} x2={tickX2} y2={y}
              stroke={color} strokeWidth={1} strokeOpacity={0.55} />
            <text x={labelX} y={y + 5} fontSize={15} fill={color} fillOpacity={0.7}
              textAnchor="start" fontFamily="monospace">
              {formatGex(maxGex * f)}
            </text>
          </g>
        );
      })}
      {/* Put ticks (downward) — hidden in abs mode */}
      {mode !== 'abs' && ticks.map(f => {
        const y = centerY + maxBarH * f;
        const label = mode === 'net' ? `-${formatGex(maxGex * f)}` : formatGex(maxGex * f);
        return (
          <g key={`p${f}`}>
            <line x1={spineX} y1={y} x2={tickX2} y2={y}
              stroke={putColor} strokeWidth={1} strokeOpacity={0.55} />
            <text x={labelX} y={y + 5} fontSize={15} fill={putColor} fillOpacity={0.7}
              textAnchor="start" fontFamily="monospace">
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function GexCumulativeCallouts({
  upside,
  downside,
  absTotal,
  mode,
  callColor,
  putColor,
}: {
  upside: number;
  downside: number;
  absTotal: number;
  mode: 'combined' | 'net' | 'abs';
  callColor: string;
  putColor: string;
}) {
  if (mode === 'abs') {
    if (absTotal === 0) return null;
    return (
      <div style={{
        position: 'absolute', top: 12, right: 16,
        pointerEvents: 'none', zIndex: 3,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
        fontFamily: 'monospace', fontSize: 11, fontWeight: 600,
      }}>
        <span style={{ color: '#3b82f6' }}>Abs {formatGex(absTotal)}</span>
      </div>
    );
  }
  if (upside === 0 && downside === 0) return null;
  return (
    <div style={{
      position: 'absolute', top: 12, right: 16,
      pointerEvents: 'none', zIndex: 3,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
      fontFamily: 'monospace', fontSize: 11, fontWeight: 600,
    }}>
      {upside !== 0 && (
        <span style={{ color: callColor }}>▲ {upside > 0 ? '+' : ''}{formatGex(upside)}</span>
      )}
      {downside !== 0 && (
        <span style={{ color: putColor }}>▼ {downside > 0 ? '+' : ''}{formatGex(downside)}</span>
      )}
    </div>
  );
}

// Handle for imperative methods (used by parent via ref)
export interface RiskGraphPanelHandle {
  autoFit: () => void;
}

// Strategy details for popup/risk graph (legacy interface)
export interface SelectedStrategy {
  strategy: 'butterfly' | 'vertical' | 'single';
  side: 'call' | 'put';
  strike: number;
  width: number;
  dte: number;
  expiration: string;
  debit: number | null;
  symbol?: string;  // Underlying symbol (SPX, NDX, etc.)
}

// Extended interface with leg support and cost basis
export interface RiskGraphStrategy extends SelectedStrategy {
  id: string;
  addedAt: number;
  visible: boolean;
  // New leg-based fields (optional for backward compat)
  legs?: PositionLeg[];
  positionType?: PositionType;
  direction?: PositionDirection;
  // Position-level quantity (number of spreads)
  quantity?: number;
  // Cost basis (debit = you paid, credit = you received)
  costBasis?: number | null;      // Absolute value of cost
  costBasisType?: CostBasisType;  // 'debit' or 'credit'
  // Market cost basis (bid/ask midpoint from heatmap tiles, captured at creation)
  marketCostBasis?: number | null;
}

// Price alert line (visual only, separate from strategy alerts)
export interface PriceAlertLine {
  id: string;
  price: number;
  color: string;
  label?: string;
  createdAt: number;
}

// Data for editing an alert (passed to modal)
export interface EditingAlertData {
  id: string;
  type: AlertType;
  condition: AlertCondition;
  targetValue: number;
  color: string;
  behavior: AlertBehavior;
  minProfitThreshold?: number;
}


/** Wing width in points from leg strikes (full adjacent spacing for flies/verticals). */
function structureWidthPoints(strategy: RiskGraphStrategy): number {
  const legs = strategy.legs;
  if (legs && legs.length >= 2) {
    const strikes = [...new Set(legs.map(l => l.strike))].sort((a, b) => a - b);
    if (strikes.length >= 2) {
      // Min adjacent spacing = defined-risk wing width for verticals / symmetric flies
      let minGap = Infinity;
      for (let i = 1; i < strikes.length; i++) {
        minGap = Math.min(minGap, strikes[i] - strikes[i - 1]);
      }
      if (minGap > 0 && minGap < Infinity) return minGap;
    }
  }
  // Legacy half-width on butterflies was wrong for max-profit; prefer full width field ×2 for butterfly
  if (strategy.strategy === 'butterfly' && strategy.width > 0) return strategy.width * 2;
  return strategy.width || 0;
}

// Compute structural max loss — prefer live card debit over stale strategy.debit
function computeStructuralMaxLoss(
  strategy: RiskGraphStrategy,
  effectiveDebitPerShare?: number | null,
): { defined: boolean; maxLoss: number } {
  const multiplier = 100;
  const rawDebit = (effectiveDebitPerShare != null && effectiveDebitPerShare > 0)
    ? effectiveDebitPerShare
    : (strategy.debit || 0);
  const s = strategy as RiskGraphStrategy & { positionType?: string; direction?: string; costBasisType?: string };

  // --- Undefined risk detection ---
  if (s.positionType && s.direction === 'short' &&
      ['single', 'straddle', 'strangle'].includes(s.positionType)) {
    return { defined: false, maxLoss: Infinity };
  }
  if (strategy.strategy === 'single' && !s.positionType) {
    if (s.costBasisType === 'credit' || s.direction === 'short') {
      return { defined: false, maxLoss: Infinity };
    }
  }

  if (s.costBasisType === 'credit') {
    const width = structureWidthPoints(strategy);
    return { defined: true, maxLoss: Math.max(0, width - rawDebit) * multiplier };
  }
  // Debit strategy: max loss = debit × multiplier
  return { defined: true, maxLoss: rawDebit * multiplier };
}

// Local color palette (matches types/alerts.ts ALERT_COLORS)
const ALERT_COLOR_PALETTE = [
  '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6',
  '#ffffff', '#9ca3af', '#4b5563',
];

export interface RiskGraphPanelProps {
  // Strategies
  strategies: RiskGraphStrategy[];
  onRemoveStrategy: (id: string) => void;
  onToggleStrategyVisibility: (id: string) => void;
  onUpdateStrategyDebit: (id: string, debit: number | null) => void;

  // Trade statuses (keyed by strategy/intent id)
  tradeStatuses?: Map<string, import('../../types/position-intent').TradeStatus>;

  // Price alert lines (visual chart annotations, separate from strategy alerts)
  priceAlertLines: PriceAlertLine[];
  onDeletePriceAlertLine: (id: string) => void;

  // Alert dialog callbacks (connect to AlertCreationModal in App.tsx)
  // Note: condition limited to basic types - zone conditions handled by AI alerts separately
  onOpenAlertDialog: (strategyId: string, price: number | null, condition: 'above' | 'below' | 'at') => void;
  onStartNewAlert: (strategyId: string) => void;
  onStartEditingAlert: (alertId: string) => void;

  // Market data
  spotPrice: number;
  vix: number;

  // 3D of Options
  timeMachineEnabled: boolean;
  onTimeMachineToggle: () => void;
  simTimeOffsetHours: number;
  onSimTimeChange: (hours: number) => void;
  simVolatilityOffset: number;
  onSimVolatilityChange: (offset: number) => void;
  simSpotPct: number;
  onSimSpotPctChange: (pct: number) => void;
  onResetSimulation: () => void;

  // Reflection hook - opens Journal for capturing insights
  onOpenJournal?: () => void;

  // Create Position - opens PositionCreateModal
  onCreatePosition?: () => void;

  // Edit strategy - opens modal to edit existing strategy
  onEditStrategy?: (id: string) => void;

  // Submit strategy — initiates order confirmation flow
  onSubmitStrategy?: (id: string) => void;

  // Cancel pending order (before fill)
  onCancelOrder?: (id: string) => void;

  // Close open position (initiates closing order)
  onClosePosition?: (id: string) => void;

  // Log trade - opens TradeEntryModal with strategy data
  onLogTrade?: (strategy: RiskGraphStrategy) => void;

  // Monitor - opens position monitor panel
  onOpenMonitor?: () => void;
  pendingOrderCount?: number;
  openTradeCount?: number;

  // GEX data for backdrop (from App.tsx)
  gexByStrike?: Record<number, { calls: number; puts: number }>;

  // Full spot data map for per-symbol pricing (from SSE spot channel)
  spotData?: Record<string, { value: number; [key: string]: any }>;

  // Pricing mode toggle (Theo/Market) — shared with heatmap
  pricingMode?: 'theo' | 'market';
  onPricingModeChange?: (mode: 'theo' | 'market') => void;

  // Per-DTE ATM IV from chain data (e.g. {"0": 0.15, "1": 0.17})
  // Used as base volatility instead of VIX for more accurate pricing
  atmIvByDte?: Record<string, number>;
  // Raw heatmap tiles for anchoring risk graph pricing to market data
  heatmapTiles?: Record<string, any>;

  // When true, the internal sidebar/position list is hidden (MSC renders its own)
  hideSidebar?: boolean;

  // Drag-to-reposition: commit callback
  onRepositionStrategy?: (
    strategyId: string,
    grabbedStrike: number,
    strikeOffset: number,
    shiftAll: boolean,
  ) => void;

  // Entry/exit time persistence for Price-Time chart
  onSetEntryExitTime?: (intentId: string, entryTime?: string, exitTime?: string) => void;

  // Canonical strike map — threaded to PriceTimeChart for drag-snap
  canonicalStrikeMap?: import('../../lib/snapToNearestStrike').CanonicalStrikeMap;

  // Per-leg IV from chain snapshot (for skew-accurate pricing)
  chainIV?: ChainIVMap | null;
  chainIVError?: string | null;
  chainIVStale?: boolean;

  /** Live chain mid lookup — refreshed every 15s by useChainIV poll.
   *  Used to compute fresh spread mid prices for unlocked position cards. */
  getChainContract?: (expiration: string, strike: number, type: 'call' | 'put') => number | null
  /** Per-contract IV from SSE — preferred over chainIV HTTP poll for rendering. */
  getSSEIV?: (expiration: string, strike: number, type: 'call' | 'put') => number | null

  /** Listener callback: fires whenever the per-position effective debit
   *  changes (lock edit, unlock toggle, or live-mid update).  Parents
   *  forward the map to the 3D surface so the chart redraws in lockstep
   *  with the position card. */
  onCardDebitsChange?: (debits: Record<string, number>) => void;

  // External backdrop opacity override (0-1). When provided, overrides internal slider.
  backdropOpacity?: number;

  // External GEX mode override — when provided, overrides internal gexConfig.mode
  gexModeOverride?: 'net' | 'combined' | 'abs';

  // External zero-gamma flip zone toggle — when provided, overrides internal showStructuralLines
  zgfzEnabled?: boolean;
  zgfzIntensity?: number;

  // External VP toggle — when provided, overrides internal showVolumeProfile
  vpEnabled?: boolean;
  // External MS toggle — when provided, overrides internal structural lines toggle
  msEnabled?: boolean;

  /** Probability range band (2D payoff only). nΣ + date drive lognormal expected move. */
  probEnabled?: boolean;
  /** Band width in σ (1 | 1.25 | 1.5 | 1.75 | 2). */
  probConfidence?: number;
  probDate?: string;

  // Price-Time view mode — when provided, shows toggle in header and swaps chart canvas
  chartViewMode?: 'payoff' | 'price-time' | 'history' | 'risk3d';
  onChartViewModeChange?: (mode: 'payoff' | 'price-time' | 'history') => void;
  // Juliett-B / Kilo: 3D surface slot — rendered in chart area when chartViewMode === 'risk3d'
  chartSlotOverride?: React.ReactNode;
  // Data piped through to PriceTimeChart / PriceTimeHistory
  priceTimeEntries?: import('../../types/position-intent').RegistryEntry[];
  priceTimeSpot?: number;
  priceTimeSymbol?: string;
  priceTimeChainIV?: ChainIVMap | null;
  priceTimeGexEnabled?: boolean;
  priceTimeVpEnabled?: boolean;
  priceTimeMsEnabled?: boolean;
  priceTimeTimeframe?: ChartTimeframe;
  priceTimeSessionOnly?: boolean;
  priceTimeSessionLines?: boolean;
}

export interface RiskGraphPanelHandle {
  autoFit: () => void;
}

// ── Pure helpers (outside component — no re-creation on render) ──

/** Format hours-remaining into a human-readable DTE string */
function formatDTE(hours: number): string {
  if (hours <= 0) return '0m';
  if (hours < 4) {
    const mins = Math.round(hours * 60);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (hours < 24) return `${hours.toFixed(0)}h`;
  const days = hours / 24;
  if (days < 1.5) {
    const h = Math.round(hours % 24);
    return `1d ${h}h`;
  }
  return `${days.toFixed(1)}d`;
}

// P&L calculations are now handled by useRiskGraphCalculations hook

const RiskGraphPanel = forwardRef<RiskGraphPanelHandle, RiskGraphPanelProps>(function RiskGraphPanel({
  strategies,
  onRemoveStrategy,
  onToggleStrategyVisibility,
  onUpdateStrategyDebit,
  priceAlertLines,
  onDeletePriceAlertLine,
  onOpenAlertDialog,
  onStartNewAlert,
  onStartEditingAlert,
  spotPrice,
  vix,
  timeMachineEnabled,
  onTimeMachineToggle,
  simTimeOffsetHours,
  onSimTimeChange,
  simVolatilityOffset,
  onSimVolatilityChange,
  simSpotPct,
  onSimSpotPctChange,
  onResetSimulation,
  onOpenJournal,
  onCreatePosition,
  onEditStrategy,
  onSubmitStrategy,
  onCancelOrder,
  onClosePosition,
  onLogTrade,
  onOpenMonitor,
  pendingOrderCount = 0,
  openTradeCount = 0,
  gexByStrike,
  spotData,
  pricingMode = 'theo',
  onPricingModeChange,
  tradeStatuses,
  atmIvByDte,
  heatmapTiles,
  hideSidebar,
  onRepositionStrategy,
  onSetEntryExitTime,
  canonicalStrikeMap,
  chainIV,
  chainIVError,
  chainIVStale,
  getChainContract,
  getSSEIV,
  onCardDebitsChange,
  backdropOpacity: backdropOpacityProp,
  gexModeOverride,
  zgfzEnabled,
  zgfzIntensity,
  vpEnabled,
  msEnabled,
  probEnabled = true,
  probConfidence = 1,
  probDate,
  chartViewMode = 'payoff',
  onChartViewModeChange,
  priceTimeEntries,
  priceTimeSpot,
  priceTimeSymbol,
  priceTimeChainIV,
  priceTimeGexEnabled,
  priceTimeVpEnabled,
  priceTimeMsEnabled,
  priceTimeTimeframe = '5m',
  priceTimeSessionOnly = false,
  priceTimeSessionLines = false,
  chartSlotOverride,
}, ref) {
  // Get alerts from shared context
  const {
    alerts,
    canonicalAlerts,
    createAlert,
    updateAlert,
    deleteAlert: deleteLocalAlert,
    clearTriggeredAlerts,
    getTriggeredAlerts,
    setAlertMode,
    createCanonicalAlert,
    deleteCanonicalAlert,
    patchCanonicalAlert,
  } = useAlerts();

  // Alert designer state
  const [designerOpen, setDesignerOpen] = useState(false);
  const [designerInitialType, setDesignerInitialType] = useState<string | undefined>();
  const [designerInitialValue, setDesignerInitialValue] = useState<number | undefined>();
  const [designerInitialCondition, setDesignerInitialCondition] = useState<'above' | 'below' | 'at' | undefined>();
  const [designerInitialStrategyId, setDesignerInitialStrategyId] = useState<string | undefined>();
  const [designerEditingAlert, setDesignerEditingAlert] = useState<Alert | null>(null);
  const [editingCanonicalAlertId, setEditingCanonicalAlertId] = useState<string | null>(null);

  // (Legacy posAlertOpen/posAlertPosition removed — consolidated into AlertDesigner)

  // Curve context menu (position picker when multiple visible)
  const [curveMenu, setCurveMenu] = useState<{x: number; y: number; price: number; pnl: number} | null>(null);

  // Dealer Gravity context — artifact/data only; display config is local (useIndicatorSettings)
  const { artifact: dgArtifact } = useDealerGravity();

  const pnlChartRef = useRef<PnLChartHandle>(null);

  // GEX y-axis scale — container height tracker
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [chartAreaHeight, setChartAreaHeight] = useState(0);
  useEffect(() => {
    const el = chartAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect.height;
      if (h) setChartAreaHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reduce Motion preference — drives instant glow transition (§11.2.1 accessibility)
  const reduceMotionRef = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduceMotionRef.current = mq.matches;
    function onChange(e: MediaQueryListEvent) { reduceMotionRef.current = e.matches; }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Strike drag-to-reposition state
  const [dragInfo, setDragInfo] = useState<StrikeDragInfo | null>(null);
  const lastDragInfoRef = useRef<StrikeDragInfo | null>(null);

  // Hi-res server curve — fetched after drop, swapped in for smooth rendering
  const hiResCurve = useHiResCurve();

  // Valid chain strikes for snap-on-release (union of all expirations from canonicalStrikeMap)
  // Payoff curve drag has no per-leg expiration context, so we use the full union —
  // this covers both live and expired positions consistently with the gateway rule.
  const chainStrikes = useMemo(() => {
    if (!canonicalStrikeMap) return null;
    const all = Object.values(canonicalStrikeMap).flat();
    if (all.length === 0) return null;
    return [...new Set(all)].sort((a, b) => a - b);
  }, [canonicalStrikeMap]);

  // Chain strike increment for badge display
  const strikeInterval = useMemo(() => {
    if (chainStrikes && chainStrikes.length >= 2) {
      let minDiff = Infinity;
      for (let i = 1; i < chainStrikes.length; i++) {
        minDiff = Math.min(minDiff, chainStrikes[i] - chainStrikes[i - 1]);
      }
      if (minDiff > 0 && minDiff < Infinity) return minDiff;
    }
    return 5;
  }, [chainStrikes]);

  // Snap a target price to the nearest valid chain strike
  const snapToChainStrike = useCallback((targetPrice: number): number => {
    if (!chainStrikes || chainStrikes.length === 0) {
      // Fallback: snap to nearest strikeInterval multiple
      return Math.round(targetPrice / strikeInterval) * strikeInterval;
    }
    // Binary search for nearest chain strike
    let lo = 0, hi = chainStrikes.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (chainStrikes[mid] < targetPrice) lo = mid + 1;
      else hi = mid;
    }
    // Clamp to valid index range
    if (lo >= chainStrikes.length) return chainStrikes[chainStrikes.length - 1];
    if (lo === 0) return chainStrikes[0];
    // Compare candidates on either side
    const above = chainStrikes[lo];
    const below = chainStrikes[lo - 1];
    return Math.abs(targetPrice - below) <= Math.abs(targetPrice - above) ? below : above;
  }, [chainStrikes, strikeInterval]);

  // Refs so handleStrikeDrag can read latest values without forward-reference errors
  const hiResCurveRef = useRef(hiResCurve);
  hiResCurveRef.current = hiResCurve;
  const chartStrategiesRef = useRef<typeof chartStrategies>([] as unknown as typeof chartStrategies);
  const pnlChartDataRef = useRef<typeof pnlChartData>(null as unknown as typeof pnlChartData);
  const serverPriceMapRef = useRef<Record<string, RealTimeRiskResult>>({});
  // Per-share version of currentNetValue (÷100) — display-only; curve arrays stay in total dollars.
  const serverPerShareMapRef = useRef<Record<string, number | null>>({});
  const unlockedStrategyIdsRef = useRef<Set<string>>(new Set());
  const spotPriceRef = useRef(spotPrice);
  spotPriceRef.current = spotPrice;
  const vixRef = useRef(vix);
  vixRef.current = vix;
  const simulatedSpotRef = useRef(0);
  const currentVixRef = useRef(0);
  const timeMachineOffsetDaysRef = useRef(0);

  const handleStrikeDrag = useCallback((info: StrikeDragInfo | null) => {
    // Exact MSC RiskGraphPanel path
    if (info !== null) {
      hiResCurveRef.current.cancel();
      const targetPrice = info.grabbedStrike + info.offset;
      const snappedPrice = snapToChainStrike(targetPrice);
      const snappedInfo = { ...info, offset: snappedPrice - info.grabbedStrike };
      lastDragInfoRef.current = snappedInfo;
      setDragInfo(snappedInfo);
    } else {
      const final = lastDragInfoRef.current;
      setDragInfo(null);
      lastDragInfoRef.current = null;
      if (final && final.offset !== 0) {
        onRepositionStrategy?.(final.strategyId, final.grabbedStrike, final.offset, final.shiftKey);
      }
      // MSC refits on drop; Labs keeps sticky viewport (no autoFit) so scale doesn't jump.
    }
  }, [onRepositionStrategy, snapToChainStrike]);

  // Track meaningful analyzer interaction for reflection hook
  const [hasAnalyzerInteraction, setHasAnalyzerInteraction] = useState(false);

  // Lock/unlock state for position pricing (locked = user-entered, unlocked = model theo value)
  // Labs design-studio ids (labs-*) are stripped — a frozen lock was keeping Credit
  // at 2.00 while the tent slid ATM→OTM (see rg3/rg4 screenshots).
  const [priceLocked, setPriceLocked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('riskGraph_priceLocked');
      const raw = saved ? JSON.parse(saved) : {};
      const cleaned: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (typeof k === 'string' && k.startsWith('labs-')) continue;
        cleaned[k] = Boolean(v);
      }
      return cleaned;
    } catch { return {}; }
  });

  // Prices frozen at lock time — prevents the card and curve from jumping during the
  // render cycle between priceLocked flipping and strat.debit propagating via
  // onUpdateStrategyDebit. Persisted so the locked price survives page reload.
  const [frozenLockedPrices, setFrozenLockedPrices] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('riskGraph_frozenPrices');
      const raw = saved ? JSON.parse(saved) : {};
      const cleaned: Record<string, number> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (typeof k === 'string' && k.startsWith('labs-')) continue;
        if (typeof v === 'number' && Number.isFinite(v)) cleaned[k] = v;
      }
      return cleaned;
    } catch { return {}; }
  });

  // Backdrop visibility controls (off by default - user can enable as needed)
  const [showVolumeProfileInternal, setShowVolumeProfile] = useState(false);
  const showVolumeProfile = vpEnabled ?? showVolumeProfileInternal;
  const [showGexInternal, setShowGexInternal] = useState(false);
  // Show GEX if parent provided data OR internal toggle is on
  const showGex = (gexByStrike && Object.keys(gexByStrike).length > 0) || showGexInternal;
  const [showStructuralLinesInternal, setShowStructuralLines] = useState(false);
  const showStructuralLines = zgfzEnabled ?? showStructuralLinesInternal;
  const showMS = msEnabled ?? false;
  const [backdropOpacityInternal, setBackdropOpacity] = useState(0.8);
  const backdropOpacity = backdropOpacityProp ?? backdropOpacityInternal;
  const [showDGSettings, setShowDGSettings] = useState(false);

  // Local display config for VP + GEX in Risk Graph backdrop (localStorage-backed)
  const { gexConfig, vpConfig: volumeProfileConfig, setGexConfig, setVpConfig, saveAsDefault, resetToFactoryDefaults } = useIndicatorSettings();

  // GEX y-axis scale — maxGex and heightPercent (depends on gexConfig + showGex)
  const gexMaxGex = useMemo(() => {
    if (!showGex || !gexByStrike) return 0;
    const effectiveMode = gexModeOverride ?? gexConfig.mode;
    let max = 0;
    for (const { calls, puts } of Object.values(gexByStrike)) {
      if (effectiveMode === 'net') max = Math.max(max, Math.abs(calls + puts));
      else if (effectiveMode === 'abs') max = Math.max(max, Math.abs(calls) + Math.abs(puts));
      else max = Math.max(max, Math.abs(calls), Math.abs(puts));
    }
    return max;
  }, [showGex, gexByStrike, gexConfig.mode, gexModeOverride]);
  const gexHeightPct = gexConfig?.heightPercent ?? 40;

  // Phase 2: Cumulative GEX callouts — upside/downside totals relative to spot
  const { gexUpside, gexDownside, gexAbsTotal } = useMemo(() => {
    if (!showGex || !gexByStrike || !spotPrice) {
      return { gexUpside: 0, gexDownside: 0, gexAbsTotal: 0 };
    }
    let upside = 0, downside = 0, absTotal = 0;
    for (const [strikeStr, { calls, puts }] of Object.entries(gexByStrike)) {
      const strike = Number(strikeStr);
      const net = calls + puts;
      absTotal += Math.abs(calls) + Math.abs(puts);
      if (strike > spotPrice) upside += net;
      else downside += net;
    }
    return { gexUpside: upside, gexDownside: downside, gexAbsTotal: absTotal };
  }, [showGex, gexByStrike, spotPrice]);

  // Auto-fit function registered by PriceTimeChart after mount.
  const priceTimeAutoFitRef = useRef<(() => void) | null>(null);
  const handlePriceTimeAutoFitReady = useCallback((fn: () => void) => {
    priceTimeAutoFitRef.current = fn;
  }, []);

  // Expose autoFit to parent — routes to the active chart view.
  useImperativeHandle(ref, () => ({
    autoFit: () => {
      if (chartViewMode === 'price-time') {
        priceTimeAutoFitRef.current?.();
      } else {
        pnlChartRef.current?.autoFit();
      }
    },
  }));
  const vixInputRef = useRef<HTMLInputElement>(null);

  // ── §11 Always-on Time Machine state ─────────────────────────────────────
  // isSimActive: any slider is non-default (offset ≠ 0)
  const isSimActive = simTimeOffsetHours !== 0 || simVolatilityOffset !== 0 || simSpotPct !== 0;
  // isSimPulsing: sim has been active for >500ms (transitions reset button from glow→pulse)
  const [isSimPulsing, setIsSimPulsing] = useState(false);
  useEffect(() => {
    if (!isSimActive) { setIsSimPulsing(false); return; }
    const t = setTimeout(() => setIsSimPulsing(true), 500);
    return () => clearTimeout(t);
  }, [isSimActive]);

  // VIX editing state
  const [isEditingVix, setIsEditingVix] = useState(false);
  const [vixInputValue, setVixInputValue] = useState('');

  // Labs: Regime/Model UI removed — fixed BS + auto regime from VIX.
  // Always Theo (flat single-IV, orange). Mkt/per-leg magenta needs chain IV
  // and mid-cal; without them it mis-renders the real-time curve.
  const marketRegime: MarketRegime =
    vix <= 14 ? 'low_vol' : vix <= 18 ? 'normal' : vix <= 30 ? 'elevated' : 'panic';
  const pricingModel: PricingModel = 'black-scholes';
  const rgVolSurfaceMode: RgVolSurfaceMode = 'theo';
  const hestonVolOfVol = 0.4;
  const hestonCorrelation = -0.7;
  const mcNumPaths = 5000;

  // Weighting index selector — determines the X-axis reference for portfolio-weighted view
  const underlyings = useMemo(() => {
    const syms = new Set(strategies.map(s => s.symbol || 'SPX'));
    return Array.from(syms).sort();
  }, [strategies]);

  const [weightingIndex, setWeightingIndex] = useState<string>('SPX');

  // Auto-select: prefer SPX if present, else first available symbol
  const effectiveWeightingIndex = underlyings.includes(weightingIndex) ? weightingIndex : (underlyings.includes('SPX') ? 'SPX' : underlyings[0] || 'SPX');

  // Compute the weighting spot price from spotData
  const weightingSpot = useMemo(() => {
    if (!spotData) return spotPrice;
    const key = resolveSpotKey(effectiveWeightingIndex);
    const val = spotData[key]?.value;
    return (val && val > 0) ? val : spotPrice;
  }, [spotData, effectiveWeightingIndex, spotPrice]);

  // Simulated spot for 3D of Options (percentage-based)
  // Spot slider is visual-only: always shift the indicator line, regardless of timeMachineEnabled.
  // The payoff curves are NOT repriced — simSpotPct is removed from useRiskGraphCalculations pricing.
  const simulatedSpot = weightingSpot * (1 + simSpotPct / 100);
  const currentVix = vix + (timeMachineEnabled ? simVolatilityOffset : 0);
  simulatedSpotRef.current = simulatedSpot;
  currentVixRef.current = currentVix;
  timeMachineOffsetDaysRef.current = simTimeOffsetHours / 24;

  // Handle VIX edit
  const handleVixClick = useCallback(() => {
    if (!timeMachineEnabled) return;
    setVixInputValue(currentVix.toFixed(1));
    setIsEditingVix(true);
    // Focus input after render
    setTimeout(() => vixInputRef.current?.select(), 0);
  }, [timeMachineEnabled, currentVix]);

  const handleVixInputBlur = useCallback(() => {
    setIsEditingVix(false);
    const newVix = parseFloat(vixInputValue);
    if (!isNaN(newVix) && newVix >= 5 && newVix <= 80) {
      onSimVolatilityChange(newVix - vix);
    }
  }, [vixInputValue, vix, onSimVolatilityChange]);

  const handleVixInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVixInputBlur();
    } else if (e.key === 'Escape') {
      setIsEditingVix(false);
    }
  }, [handleVixInputBlur]);

  // Build spotPrices map from spotData for per-symbol pricing
  const spotPrices = useMemo(() => {
    if (!spotData) return undefined;
    const map: Record<string, number> = {};
    for (const [key, data] of Object.entries(spotData)) {
      if (data?.value) map[key] = data.value;
    }
    return Object.keys(map).length > 0 ? map : undefined;
  }, [spotData]);

  // Lock/unlock toggle for position pricing (default: locked = use market entry price)
  // Compute set of unlocked strategy IDs for the calculation hook.
  // Lock authority: priceLocked[id] (explicit user choice) takes absolute precedence.
  // Default lock state: ANALYSIS positions default to unlocked (engine computes debit);
  // PENDING/OPEN/CLOSED default to locked (frozen entry price).
  // The lock icon uses the same rule so icon state and curve behavior always agree.
  const unlockedStrategyIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of strategies) {
      // Labs design studio: always unlocked so debit tracks package mid / legs.
      if (typeof s.id === 'string' && s.id.startsWith('labs-')) {
        ids.add(s.id);
        continue;
      }
      const status = tradeStatuses?.get(s.id);
      const isAnalysis = !status || status === 'ANALYSIS';
      // ANALYSIS defaults to unlocked; all others default to locked.
      // Explicit priceLocked entry overrides the default in both directions.
      const locked = priceLocked[s.id] ?? (isAnalysis ? false : true);
      if (!locked) ids.add(s.id);
    }
    return ids;
  }, [strategies, priceLocked, tradeStatuses]);
  // Keep ref in sync so the drag-drop handler can access the current set without stale closures
  unlockedStrategyIdsRef.current = unlockedStrategyIds;

  // Compute live spread mid prices for unlocked position cards.
  // Uses per-contract mid from useChainIV's 15s poll (same source as the heatmap
  // tile engine). BSM reconstruction from per-leg chain IVs is unreliable for
  // multi-leg spreads — small IV differences across legs compound into wrong
  // aggregate values. The market mid is always authoritative.
  const naturalPricesOverride = useMemo(() => {
    if (!getChainContract || unlockedStrategyIds.size === 0) return undefined;
    const result: Record<string, number> = {};
    for (const s of strategies) {
      if (!unlockedStrategyIds.has(s.id)) continue;
      if (!s.legs || s.legs.length === 0) continue;
      let price = 0;
      let allAvailable = true;
      for (const leg of s.legs) {
        const mid = getChainContract(leg.expiration ?? s.expiration ?? '', leg.strike, leg.right);
        if (mid == null) {
          allAvailable = false;
          break;
        }
        // Spread mid: signed sum of leg.quantity × mid (debit positive, credit negative).
        // Card displays absolute value via Math.abs below.
        price += leg.quantity * mid;
      }
      if (allAvailable) result[s.id] = Math.abs(price);
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }, [getChainContract, unlockedStrategyIds, strategies]);

  // ── cardDebits: SINGLE SOURCE OF TRUTH for what each position card shows ──
  // Mirrors the inline displayPrice computation in the card render.  Both the
  // 2D chart calculations and the 3D surface read from this map, so they
  // always redraw together when the card value changes — driven by:
  //   • lock toggle  (priceLocked → frozen capture)
  //   • lock-edit    (frozenLockedPrices update)
  //   • unlock       (priceLocked → live mid)
  //   • live-mid poll (naturalPricesOverride from useChainIV every 15s)
  //   • server real-time response (serverPerSharePriceMap fallback, lagged
  //     by one render via serverPerShareMapRef to break the dep cycle).
  const cardDebits = useMemo(() => {
    const out: Record<string, number> = {};
    for (const strat of strategies) {
      const rawCostBasis = strat.costBasis ?? strat.debit ?? 0;
      // Labs design studio: credit MUST track |body − spot|. Always reprice from
      // current legs — ignore localStorage lock / frozen 2.00 / stale host debit.
      if (typeof strat.id === 'string' && strat.id.startsWith('labs-')) {
        if (strat.legs?.length && strat.costBasisType === 'credit') {
          let legs = strat.legs;
          let wing = Number(strat.width) > 0 ? Number(strat.width) : 5;
          if (
            dragInfo &&
            dragInfo.offset !== 0 &&
            dragInfo.strategyId === strat.id
          ) {
            const geo = applyLabsStrikeDrag({
              legs: strat.legs,
              bodyStrike: Number(strat.strike) || spotPrice,
              width: wing,
              grabbedStrike: dragInfo.grabbedStrike,
              offset: dragInfo.offset,
              shiftAll: dragInfo.shiftKey,
              positionType: strat.positionType,
            });
            legs = geo.legs;
            wing = geo.width;
          }
          out[strat.id] = repriceShortCredit({
            legs,
            spot: spotPrice,
            wing,
            dte: strat.dte,
            iv: (vix ?? 16) / 100,
          });
        } else {
          out[strat.id] = Math.abs(Number(rawCostBasis) || 0);
        }
        continue;
      }
      const status = tradeStatuses?.get(strat.id);
      const isAnalysis = !status || status === 'ANALYSIS';
      const isLocked = priceLocked[strat.id] ?? (isAnalysis ? false : true);
      const frozen = frozenLockedPrices[strat.id];
      const lockedPrice = frozen != null ? frozen : Math.abs(rawCostBasis);
      // Server fallback read via ref to avoid a cycle: serverPerSharePriceMap
      // depends (transitively) on useRiskGraphCalculations, which now reads
      // cardDebits.  Lagging by one render is invisible since server data
      // updates on a 500ms+ debounce.
      const serverNet = serverPerShareMapRef.current?.[strat.id];
      const livePrice = naturalPricesOverride?.[strat.id]
        ?? (serverNet != null ? Math.abs(serverNet) : Math.abs(rawCostBasis));
      out[strat.id] = isLocked ? lockedPrice : livePrice;
    }
    return out;
  }, [strategies, tradeStatuses, priceLocked, frozenLockedPrices,
      naturalPricesOverride, dragInfo, spotPrice, vix]);

  // Ref mirror of cardDebits so togglePriceLock reads the current card value
  // at click time without needing cardDebits in its dependency array.
  const cardDebitsRef = useRef(cardDebits);
  cardDebitsRef.current = cardDebits;

  // Keep a ref so togglePriceLock can always read the latest natural prices without
  // adding naturalPricesOverride to the callback dependency array.
  const naturalPricesOverrideRef = useRef(naturalPricesOverride);
  naturalPricesOverrideRef.current = naturalPricesOverride;

  /** Freeze current card debit and mark locked. No-op if already locked. */
  const lockPriceAtCurrent = useCallback((id: string) => {
    const status = tradeStatuses?.get(id);
    const isAnalysis = !status || status === 'ANALYSIS';
    const currentlyLocked = priceLocked[id] ?? (isAnalysis ? false : true);
    if (currentlyLocked) return;

    // Capture whatever the card is showing now (live mid / server / raw)
    // so focus-to-edit never jumps the value under the cursor.
    const currentCardValue = cardDebitsRef.current?.[id];
    if (currentCardValue != null && currentCardValue > 0) {
      setFrozenLockedPrices(prev => {
        const next = { ...prev, [id]: currentCardValue };
        try { localStorage.setItem('riskGraph_frozenPrices', JSON.stringify(next)); } catch {}
        return next;
      });
      onUpdateStrategyDebit(id, currentCardValue);
    }

    setPriceLocked(prev => {
      const next = { ...prev, [id]: true };
      try { localStorage.setItem('riskGraph_priceLocked', JSON.stringify(next)); } catch {}
      return next;
    });
  }, [priceLocked, tradeStatuses, onUpdateStrategyDebit]);

  const togglePriceLock = useCallback((id: string) => {
    // Mirror display logic exactly: ANALYSIS defaults to unlocked, all others to locked.
    // Using the same default here prevents the first click from being a no-op.
    const status = tradeStatuses?.get(id);
    const isAnalysis = !status || status === 'ANALYSIS';
    const currentlyLocked = priceLocked[id] ?? (isAnalysis ? false : true);
    const nextLocked = !currentlyLocked;

    if (nextLocked) {
      lockPriceAtCurrent(id);
      return;
    }

    // Going locked → unlocked: clear the frozen price so live price takes over.
    setFrozenLockedPrices(prev => {
      const { [id]: _removed, ...rest } = prev;
      try { localStorage.setItem('riskGraph_frozenPrices', JSON.stringify(rest)); } catch {}
      return rest;
    });

    setPriceLocked(prev => {
      const next = { ...prev, [id]: false };
      try { localStorage.setItem('riskGraph_priceLocked', JSON.stringify(next)); } catch {}
      return next;
    });
  }, [priceLocked, tradeStatuses, lockPriceAtCurrent]);

  // Debit field draft while focused (unlocked → lock-on-focus, then edit)
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState('');

  // Map strategies to the format expected by useRiskGraphCalculations
  // When pricingMode is 'market', swap debit to marketCostBasis (if available)
  // During drag, shift the targeted strategy's leg(s) by drag offset
  const chartStrategies: Strategy[] = useMemo(() => {
    return strategies.map(s => {
      const isLabs = typeof s.id === 'string' && s.id.startsWith('labs-');
      let debit =
        pricingMode === 'market' && s.marketCostBasis != null ? s.marketCostBasis : s.debit;
      // Labs: always mark debit from legs vs spot (never frozen lock value).
      if (isLabs && s.legs?.length && s.costBasisType === 'credit') {
        debit = repriceShortCredit({
          legs: s.legs,
          spot: spotPrice,
          wing: Number(s.width) > 0 ? Number(s.width) : 5,
          dte: s.dte,
          iv: (vix ?? 16) / 100,
        });
      }
      const base = {
        id: s.id,
        strike: s.strike,
        width: s.width,
        side: s.side,
        strategy: s.strategy,
        debit,
        visible: s.visible,
        dte: s.dte,
        expiration: s.expiration,
        symbol: s.symbol,
        legs: s.legs,
        positionType: s.positionType,
        direction: s.direction,
        costBasisType: s.costBasisType,
      };
      // Apply drag offset
      if (dragInfo && dragInfo.offset !== 0 && s.id === dragInfo.strategyId && s.visible && base.legs) {
        let legs = base.legs;
        let strike = base.strike;
        let width = base.width;
        if (isLabs) {
          // Labs: body short = whole structure; wing = symmetric resize (not MSC
          // single-strike-only, which breaks iron flies into undefined-risk shapes).
          const geo = applyLabsStrikeDrag({
            legs: base.legs as PositionLeg[],
            bodyStrike: Number(base.strike) || spotPrice,
            width: Number(s.width) > 0 ? Number(s.width) : 5,
            grabbedStrike: dragInfo.grabbedStrike,
            offset: dragInfo.offset,
            shiftAll: dragInfo.shiftKey,
            positionType: s.positionType,
          });
          legs = geo.legs;
          strike = geo.strike;
          width = geo.width;
          if (s.costBasisType === 'credit') {
            debit = repriceShortCredit({
              legs: legs as PositionLeg[],
              spot: spotPrice,
              wing: width,
              dte: s.dte,
              iv: (vix ?? 16) / 100,
            });
          }
          return { ...base, strike, width, legs, debit };
        }
        if (dragInfo.shiftKey) {
          legs = base.legs.map(l => ({ ...l, strike: l.strike + dragInfo.offset }));
          strike = base.strike + dragInfo.offset;
        } else {
          legs = base.legs.map(l =>
            l.strike === dragInfo.grabbedStrike
              ? { ...l, strike: l.strike + dragInfo.offset }
              : l
          );
        }
        return { ...base, strike, legs, debit };
      }
      return base;
    });
  }, [strategies, pricingMode, dragInfo, spotPrice, vix]);

  // Map strike → strategyId for drag hit detection (only draggable = PositionIntent, not open orders)
  const strikeToStrategyId = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of chartStrategies) {
      if (!s.visible || !s.legs) continue;
      // TODO: exclude strategies with open/pending trade status when order flow is wired
      for (const leg of s.legs) {
        const k = Math.round(Number(leg.strike) * 100) / 100;
        map.set(k, s.id);
        // Also store raw in case chart strikes keep full float
        map.set(Number(leg.strike), s.id);
      }
    }
    return map;
  }, [chartStrategies]);

  // Calculate P&L data for PnLChart — listens to cardDebits (single source
  // of truth from the position card) for effective debit per strategy.
  const pnlChartData = useRiskGraphCalculations({
    strategies: chartStrategies,
    spotPrice: spotPrice,
    vix: vix,
    spotPrices,
    weightingSpot,
    timeMachineEnabled,
    simVolatilityOffset: simVolatilityOffset,
    simTimeOffsetHours: simTimeOffsetHours,
    simSpotPct: simSpotPct,
    marketRegime,
    pricingModel,
    hestonVolOfVol,
    hestonCorrelation,
    mcNumPaths,
    unlockedStrategyIds,
    atmIvByDte,
    heatmapTiles,
    chainIV,
    getContractMid: getChainContract,
    naturalPricesOverride: cardDebits,
  });

  // Keep refs up-to-date so handleStrikeDrag (defined above) can read latest values
  chartStrategiesRef.current = chartStrategies;
  pnlChartDataRef.current = pnlChartData;

  // ── Server-authoritative P&L data (replaces client-BS pricing paths) ─────
  const visibleIntentIds = useMemo(
    () => chartStrategies.filter(s => s.visible).map(s => s.id),
    [chartStrategies],
  );
  // serverWhatIf: active whenever any time/vol offset is non-zero — not gated on the
  // timeMachineEnabled toggle so TIME and VOL controls work in both 2D and 3D without
  // requiring the toggle to be on first. Mirrors 3D behavior.
  const serverWhatIf = (simTimeOffsetHours !== 0 || simVolatilityOffset !== 0)
    ? { tShiftDays: simTimeOffsetHours / 24, volShift: simVolatilityOffset }
    : undefined;
  // Spot is visual-only: the server curve is computed at the real (unshifted) spot so
  // the position shape stays fixed. simulatedSpot (shifted by simSpotPct) is only used
  // as spotPrice on PnLChart to move the indicator line.
  const serverPriceMap = useRealTimeRiskMap(visibleIntentIds, weightingSpot, serverWhatIf);
  serverPriceMapRef.current = serverPriceMap;
  // Divide currentNetValue by 100 once here — card display is per-share (×100 multiplier on server).
  // pnl_curve and at_expiration_pnl stay untouched (chart Y-axis is total dollars).
  const serverPerSharePriceMap = useMemo(
    () => Object.fromEntries(
      Object.entries(serverPriceMap).map(([id, r]) => [
        id, r.currentNetValue != null ? r.currentNetValue / 100 : null,
      ])
    ),
    [serverPriceMap]
  );
  serverPerShareMapRef.current = serverPerSharePriceMap;

  // Emit cardDebits to parent so the 3D surface (rendered as chartSlotOverride)
  // can listen for changes — the card is the source of truth, the surface is
  // a downstream consumer.  cardDebits itself is computed earlier so it can
  // also feed into the 2D chart pricing.
  useEffect(() => {
    if (onCardDebitsChange) onCardDebitsChange(cardDebits);
  }, [cardDebits, onCardDebitsChange]);

  // Server curve aggregation removed from render path (Phase 1).
  // useRealTimeRiskMap still feeds card fallback via serverPerSharePriceMap.
  // Full server curve re-enable only via ?priceMode=legacy + future shadow mode.

  // Live vs expired ANALYSIS entries (Time Machine advances the clock)
  const { activeEntries, expiredEntries } = useMemo(() => {
    const nowMs = Date.now();
    const visible = (priceTimeEntries ?? []).filter(e => e.status === 'ANALYSIS' && e.visible);
    const active: typeof visible = [];
    const expired: typeof visible = [];
    for (const e of visible) {
      if (isPositionExpired(e.intent, nowMs, simTimeOffsetHours)) expired.push(e);
      else active.push(e);
    }
    return { activeEntries: active, expiredEntries: expired };
  }, [priceTimeEntries, simTimeOffsetHours]);

  // Set of expired strategy ids for cards / status (same clock as curves).
  // Labs shape-studio strategies (id labs-*) stay live so status + curves
  // render after the cash close on 0DTE research sessions.
  const expiredStrategyIds = useMemo(() => {
    const nowMs = Date.now();
    const ids = new Set<string>();
    for (const s of strategies) {
      if (typeof s.id === 'string' && s.id.startsWith('labs-')) continue;
      if (isPositionExpired(s, nowMs, simTimeOffsetHours)) ids.add(s.id);
    }
    return ids;
  }, [strategies, simTimeOffsetHours]);

  // Chain strike ladder for position expirations — same source as heatmap tiles
  const activeChainStrikes = useMemo(() => {
    const exps = new Set<string>();
    for (const e of activeEntries) {
      for (const leg of e.intent.legs) {
        if (leg.expiration) exps.add(String(leg.expiration).split('T')[0]);
      }
    }
    return chainStrikesForExpirations(canonicalStrikeMap, [...exps]);
  }, [activeEntries, canonicalStrikeMap]);

  const expiredChainStrikes = useMemo(() => {
    const exps = new Set<string>();
    for (const e of expiredEntries) {
      for (const leg of e.intent.legs) {
        if (leg.expiration) exps.add(String(leg.expiration).split('T')[0]);
      }
    }
    // Prefer that expiry's ladder; fall back to active chain for context
    const own = chainStrikesForExpirations(canonicalStrikeMap, [...exps]);
    return own.length > 0 ? own : activeChainStrikes;
  }, [expiredEntries, canonicalStrikeMap, activeChainStrikes]);

  // ── Shared surface curves (identical formula + range to 3D Risk detent) ───
  // ACTIVE positions only. Mkt / Theo / Both select T+0 series.
  // Expiry = value at nearest leg expiry (intrinsic front + residual back for calendars).
  // Expired → separate ghost (dashed grey).
  const modeCurves = useMemo(() => {
    if (!USE_REALTIME_AUTHORITY) return null;
    if (!spotPrice || spotPrice <= 0) return null;
    if (activeEntries.length === 0) return null;
    // Closed market: pin T to last RTH close so model matches Friday 4pm prints.
    const asOfMs = pricingAsOfMs();
    // Per-position legs + cost: never merge packages before vol-calibrate.
    // Multi-fly books calibrated as one package flatten each tent.
    const positions = buildPerIntentLegsAndCostBasis({
      intents: activeEntries.map(e => ({
        legs: e.intent.legs,
        quantity: e.intent.quantity ?? 1,
        intent_id: e.intent.intent_id,
        target_price: e.intent.target_price,
        price_side: e.intent.price_side,
        topology: e.intent.topology,
      })),
      cardDebits,
      chainIV,
      getContractMid: getChainContract,
      getSSEIV,
      atmIvByDte,
      spot: spotPrice,
      asOfMs,
    });
    if (positions.length === 0) return null;
    const allLegs = positions.flatMap(p => p.legs);
    const cbDollars = positions.reduce((s, p) => s + p.cbDollars, 0);
    const elapsedDays = simTimeOffsetHours / 24;
    const volShift = simVolatilityOffset / 100;
    const dteDays = Math.max(...allLegs.map(l => l.T * 365.25), 0);
    const surfaceBase = {
      positions,
      spot: spotPrice,
      volShift,
      elapsedDays,
      gridN: 161 as const,
      numTimeSlices: 30,
      chainStrikes: activeChainStrikes,
      vix,
      dteDays,
    };

    const needMkt = rgVolSurfaceMode === 'mkt' || rgVolSurfaceMode === 'both';
    const needTheo = rgVolSurfaceMode === 'theo' || rgVolSurfaceMode === 'both';

    const mkt = needMkt
      ? buildMultiPositionSharedCurves({ ...surfaceBase, skipVolCalibrate: false })
      : null;

    let theoIvUsed: number | null = null;
    let theo = null as ReturnType<typeof buildSharedRiskCurves>;
    if (needTheo) {
      // Per-position package-implied flat IV (not one σ for the whole book)
      const seed = resolveTheoIvSeed({ legs: allLegs, atmIvByDte, dteDays, vix });
      theo = buildMultiPositionSharedCurves({
        ...surfaceBase,
        skipVolCalibrate: true,
        mapLegs: (legs, posCb) => {
          const packageMidDollars = legs.reduce((s, l) => s + l.qty * l.mid * 100, 0);
          const targetDollars =
            packageMidDollars > 0 ? Math.abs(packageMidDollars) : Math.abs(posCb);
          const sigma = resolveFlatIvToPackage({
            legs,
            spot: spotPrice,
            targetDollars,
            seedIv: seed,
          });
          theoIvUsed = sigma; // last position's σ for readout (approx)
          return applyFlatIv(legs, sigma);
        },
      });
    }

    // Expiry from whichever surface exists (same cb + intrinsic)
    const expirySource = mkt ?? theo;
    if (!expirySource) return null;

    // Primary T+0 for stats: Mkt when present, else Theo
    const primary = (rgVolSurfaceMode === 'theo' ? theo : mkt) ?? theo ?? mkt;
    if (!primary) return null;

    return { mkt, theo, expirySource, primary, theoIvUsed, cbDollars };
  }, [activeEntries, spotPrice, chainIV, getChainContract, getSSEIV, cardDebits, simTimeOffsetHours, simVolatilityOffset, activeChainStrikes, vix, atmIvByDte, rgVolSurfaceMode]);

  // Back-compat alias used by authorityActive / stats
  const sharedCurves = modeCurves?.primary ?? null;

  // Expired positions → dashed ghost at-expiry curve only (not in debit total)
  const expiredGhostCurves = useMemo(() => {
    if (!USE_REALTIME_AUTHORITY) return null;
    if (!spotPrice || spotPrice <= 0) return null;
    if (expiredEntries.length === 0) return null;
    const asOfMs = pricingAsOfMs();
    const { legs, cbDollars } = buildLegsAndCostBasis({
      intents: expiredEntries.map(e => ({
        legs: e.intent.legs,
        quantity: e.intent.quantity ?? 1,
        intent_id: e.intent.intent_id,
        target_price: e.intent.target_price,
        price_side: e.intent.price_side,
        topology: e.intent.topology,
      })),
      cardDebits,
      chainIV,
      getContractMid: getChainContract,
      getSSEIV,
      atmIvByDte,
      spot: spotPrice,
      asOfMs,
    });
    if (legs.length === 0) return null;
    return buildSharedRiskCurves({
      legs,
      spot: spotPrice,
      cbDollars,
      volShift: 0,
      elapsedDays: 0,
      gridN: 121,
      numTimeSlices: 8,
      chainStrikes: expiredChainStrikes,
      vix,
    });
  }, [expiredEntries, spotPrice, chainIV, getChainContract, getSSEIV, cardDebits, expiredChainStrikes, vix, atmIvByDte]);

  // Authority path active when flag on and we have live and/or ghost curves
  const authorityActive = USE_REALTIME_AUTHORITY && (sharedCurves != null || expiredGhostCurves != null);

  // Chart series — primary T+0 (Mkt in mkt/both, Theo in theo-only)
  const authorityTheoPoints = useMemo(() => {
    if (!modeCurves?.primary) return null;
    return toCurvePoints(modeCurves.primary.priceGrid, modeCurves.primary.theoreticalPnl);
  }, [modeCurves]);

  // Secondary T+0: Theo when Both (under Mkt primary)
  const authoritySecondaryTheoPoints = useMemo(() => {
    if (rgVolSurfaceMode !== 'both' || !modeCurves?.theo) return null;
    return toCurvePoints(modeCurves.theo.priceGrid, modeCurves.theo.theoreticalPnl);
  }, [modeCurves, rgVolSurfaceMode]);

  const authorityExpiryPoints = useMemo(() => {
    if (!modeCurves?.expirySource) return null;
    return toCurvePoints(modeCurves.expirySource.priceGrid, modeCurves.expirySource.expirationPnl);
  }, [modeCurves]);

  const authorityExpiredGhostPoints = useMemo(
    () => (expiredGhostCurves
      ? toCurvePoints(expiredGhostCurves.priceGrid, expiredGhostCurves.expirationPnl)
      : null),
    [expiredGhostCurves],
  );

  // Primary stroke / legend for chart
  const primaryT0Stroke =
    rgVolSurfaceMode === 'theo' ? RG_RT_CURVE_COLORS.theo : RG_RT_CURVE_COLORS.mkt;
  const primaryT0Legend =
    rgVolSurfaceMode === 'theo'
      ? 'Real-Time (Theo)'
      : rgVolSurfaceMode === 'both'
        ? 'Real-Time (Mkt)'
        : 'Real-Time';

  // Active spot for P&L readout: simulated when spot What-If ≠ 0, else live weighting spot.
  // Spot does NOT reprice the curve — only the read location on the fixed model.
  const activeReadSpot = simSpotPct !== 0 ? simulatedSpot : weightingSpot;

  const authorityStats = useMemo(() => {
    if (!sharedCurves) return null;
    // Today / time-machine slice (primary series)
    const today = curveMinMax(sharedCurves.theoreticalPnl);
    // Structural extrema from pure intrinsic (matches debit floor semantics)
    const intrinsic = curveMinMax(sharedCurves.intrinsicPnl);
    // Display expiry face (debit-pinned)
    const expiryFace = curveMinMax(sharedCurves.expirationPnl);
    return {
      minPnL: today.min,
      maxPnL: today.max,
      expiryMinPnL: intrinsic.min,
      expiryMaxPnL: intrinsic.max,
      expiryFaceMinPnL: expiryFace.min,
      expiryFaceMaxPnL: expiryFace.max,
      theoreticalPnLAtSpot: interpolatePnl(
        sharedCurves.priceGrid,
        sharedCurves.theoreticalPnl,
        activeReadSpot,
      ),
      theoreticalBreakevens: findZeroCrossings(sharedCurves.priceGrid, sharedCurves.theoreticalPnl),
      expirationBreakevens: findZeroCrossings(sharedCurves.priceGrid, sharedCurves.expirationPnl),
    };
  }, [sharedCurves, activeReadSpot]);

  // Status-line cost basis: LIVE (non-expired) visible cards only — expired deducted
  const statusCostBasis = useMemo(() => {
    const live = strategies.filter(s => s.visible && !expiredStrategyIds.has(s.id));
    if (live.length === 0) return null;
    const parts: { id: string; perShare: number; qty: number; isCredit: boolean }[] = [];
    let perShareAbs = 0;
    let dollars = 0;
    let allCredit = true;
    let allDebit = true;
    for (const s of live) {
      // Exact same source as card displayPrice
      const raw = cardDebits[s.id];
      if (raw == null || !Number.isFinite(raw) || raw === 0) continue;
      const perShare = normalizePerShareDebit(raw);
      if (perShare === 0) continue;
      const qty = Math.max(1, s.quantity ?? 1);
      const isCredit = s.costBasisType === 'credit';
      if (isCredit) allDebit = false;
      else allCredit = false;
      // Status "Debit" = sum of card face values (each card is per-share of one spread)
      // Multi-lot: card still shows per-share; dollar risk multiplies by qty.
      perShareAbs += perShare;
      dollars += (isCredit ? -perShare : perShare) * 100 * qty;
      parts.push({ id: s.id, perShare, qty, isCredit });
    }
    if (parts.length === 0) return null;
    return {
      perShare: perShareAbs,
      dollars,
      parts,
      side: allCredit ? 'credit' as const : allDebit ? 'debit' as const : 'mixed' as const,
    };
  }, [strategies, cardDebits, expiredStrategyIds]);

  // Status-line Max Profit / Max Loss / R2R — LIVE positions only
  // Prefer structural from card debits for defined-risk debit books (matches card×100).
  // Curve extrema can disagree when price grid doesn't reach full OTM or multi-pos mix.
  const statusExtrema = useMemo(() => {
    const live = strategies.filter(s => s.visible && !expiredStrategyIds.has(s.id));
    if (live.length === 0) {
      return { maxProfit: 0, maxLoss: 0, r2r: null, source: 'none' as const };
    }

    // Structural from the same debits the cards show
    let structuralLoss = 0;
    let structuralProfit = 0;
    let defined = true;
    for (const s of live) {
      const raw = cardDebits[s.id];
      const debit = raw != null && Number.isFinite(raw) && raw !== 0
        ? normalizePerShareDebit(raw)
        : normalizePerShareDebit(s.debit ?? s.costBasis ?? 0);
      const qty = Math.max(1, s.quantity ?? 1);
      const r = computeStructuralMaxLoss(s, debit);
      if (!r.defined) { defined = false; break; }
      // computeStructuralMaxLoss is per 1-lot; scale by position quantity
      structuralLoss += r.maxLoss * qty;
      const width = structureWidthPoints(s);
      if (s.costBasisType === 'credit') {
        structuralProfit += Math.abs(debit) * 100 * qty;
      } else {
        structuralProfit += Math.max(0, width - Math.abs(debit)) * 100 * qty;
      }
    }

    if (!defined) {
      return { maxProfit: 0, maxLoss: Infinity, r2r: null, source: 'undefined' as const };
    }

    // If authority curve is available, use max profit from intrinsic peak (better for
    // multi-structure than width formula) but keep structural max loss for debit books
    // so status Max Loss === sum(card debit)×100.
    let maxProfit = structuralProfit;
    let maxLoss = structuralLoss;
    let source: 'structural' | 'hybrid_curve' = 'structural';
    if (authorityStats) {
      const curveProfit = Math.max(0, authorityStats.expiryMaxPnL);
      // Prefer curve peak when it is finite and positive (captures multi-fly peaks)
      if (curveProfit > 0) {
        maxProfit = curveProfit;
        source = 'hybrid_curve';
      }
      // For pure debit book, structural loss is authoritative (card debit × 100 × qty).
      // Only trust curve min when it is within 15% of structural (grid reached OTM).
      const curveLoss = Math.abs(Math.min(0, authorityStats.expiryMinPnL));
      if (structuralLoss > 0 && curveLoss > 0) {
        const ratio = curveLoss / structuralLoss;
        if (ratio >= 0.85 && ratio <= 1.15) {
          maxLoss = curveLoss;
        }
      }
    }

    const r2r = maxLoss > 1e-6 ? maxProfit / maxLoss : null;
    return { maxProfit, maxLoss, r2r, source };
  }, [authorityStats, strategies, cardDebits, expiredStrategyIds]);

  // Hi-res is legacy-only: under authority it fights the ported curve and misaligns BEs.
  useEffect(() => {
    if (authorityActive) {
      hiResCurve.cancel();
      return;
    }
    hiResCurve.cancel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorityActive, timeMachineEnabled, simTimeOffsetHours, simulatedSpot, currentVix]);

  const hiResData = authorityActive ? null : hiResCurve.hiResData;
  useEffect(() => {
    if (hiResData !== null) {
      pnlChartRef.current?.autoFit();
    }
  }, [hiResData]);

  // Breakevens must track the curve actually drawn.
  const theoreticalBreakevens = useMemo(() => {
    if (authorityStats) return authorityStats.theoreticalBreakevens;
    if (!hiResData || hiResData.length < 2) return pnlChartData.theoreticalBreakevens;
    const crossings: number[] = [];
    for (let i = 1; i < hiResData.length; i++) {
      if ((hiResData[i - 1].pnl < 0) !== (hiResData[i].pnl < 0)) {
        if (Math.max(Math.abs(hiResData[i - 1].pnl), Math.abs(hiResData[i].pnl)) < 0.01) continue;
        const t = -hiResData[i - 1].pnl / (hiResData[i].pnl - hiResData[i - 1].pnl);
        crossings.push(hiResData[i - 1].price + t * (hiResData[i].price - hiResData[i - 1].price));
      }
    }
    return crossings;
  }, [authorityStats, hiResData, pnlChartData.theoreticalBreakevens]);

  const expirationBreakevens = useMemo(() => {
    if (authorityStats) return authorityStats.expirationBreakevens;
    return pnlChartData.expirationBreakevens;
  }, [authorityStats, pnlChartData.expirationBreakevens]);

  // Extract strikes from all visible strategies for chart (includes expired for auto-fit bounds)
  const chartStrikes = useMemo(() => {
    return chartStrategies.filter(s => s.visible).flatMap(strat => {
      // Use legs if available for accurate strike extraction
      if (strat.legs && strat.legs.length > 0) {
        return strat.legs.map(leg => leg.strike);
      }
      // Legacy fallback
      if (strat.strategy === 'butterfly') {
        return [strat.strike - strat.width, strat.strike, strat.strike + strat.width];
      } else if (strat.strategy === 'vertical') {
        return [strat.strike, strat.side === 'call' ? strat.strike + strat.width : strat.strike - strat.width];
      }
      return [strat.strike];
    });
  }, [chartStrategies]);

  // Stats: authority curve when active; else legacy hook.
  const riskGraphData = useMemo(() => {
    if (authorityStats) {
      return {
        minPnL: authorityStats.minPnL,
        maxPnL: authorityStats.maxPnL,
        theoreticalPnLAtSpot: authorityStats.theoreticalPnLAtSpot,
        marketPnL: null as number | null,
      };
    }
    return {
      minPnL: pnlChartData.minPnL,
      maxPnL: pnlChartData.maxPnL,
      theoreticalPnLAtSpot: pnlChartData.theoreticalPnLAtSpot,
      marketPnL: null as number | null,
    };
  }, [authorityStats, pnlChartData]);

  const displayTotalPnL = riskGraphData.theoreticalPnLAtSpot;

  // ── Alert evaluation feeds ───────────────────────────────────────────────
  // Designer persists to canonicalAlerts only. Map those into the evaluator
  // shape so condition-met never depends on empty localAlerts.
  const evaluatorAlerts = useMemo(
    () => canonicalAlertsForEvaluator(canonicalAlerts),
    [canonicalAlerts],
  );

  // Per-strategy T+0 P&L at the chart read spot — same BS authority as the
  // shared surface (not the legacy useRiskGraphCalculations path).
  const authorityStrategyPnLAtSpot = useMemo(() => {
    if (!USE_REALTIME_AUTHORITY) return null;
    if (!spotPrice || spotPrice <= 0) return null;
    if (activeEntries.length === 0) return {} as Record<string, number>;

    const asOfMs = pricingAsOfMs();
    const tShiftYears = (simTimeOffsetHours || 0) / 24 / 365;
    const volShift = (simVolatilityOffset || 0) / 100;
    const readS = activeReadSpot;
    const out: Record<string, number> = {};

    for (const e of activeEntries) {
      const { legs, cbDollars } = buildLegsAndCostBasis({
        intents: [{
          legs: e.intent.legs,
          quantity: e.intent.quantity ?? 1,
          intent_id: e.intent.intent_id,
          target_price: e.intent.target_price,
          price_side: e.intent.price_side,
          topology: e.intent.topology,
        }],
        cardDebits,
        chainIV,
        getContractMid: getChainContract,
        getSSEIV,
        atmIvByDte,
        spot: spotPrice,
        asOfMs,
      });
      if (legs.length === 0) continue;
      out[e.intent.intent_id] = computePnlAtPrice(
        legs,
        readS,
        spotPrice,
        undefined,
        undefined,
        tShiftYears,
        volShift,
        cbDollars,
      );
    }
    return out;
  }, [
    activeEntries, spotPrice, activeReadSpot, cardDebits, chainIV,
    getChainContract, getSSEIV, atmIvByDte, simTimeOffsetHours, simVolatilityOffset,
  ]);

  const alertStrategyPnLAtSpot = authorityStrategyPnLAtSpot
    ?? pnlChartData.strategyPnLAtSpot
    ?? {};
  // Portfolio total: authority aggregate (matches chart stat) when available
  const alertTotalPnL = authorityStats?.theoreticalPnLAtSpot ?? displayTotalPnL;
  // Greeks: per-strategy from pricing model (BS greeks — not disabled {})
  const alertStrategyGreeks = pnlChartData.strategyGreeks ?? {};

  // Client-side threshold evaluator — canonical store + authority P&L + real greeks
  const conditionMetIds = useAlertEvaluator({
    alerts: evaluatorAlerts,
    hasPositions: strategies.length > 0,
    spotPrice: simulatedSpot,
    delta: pnlChartData.delta,
    gamma: pnlChartData.gamma,
    theta: pnlChartData.theta,
    totalPnL: alertTotalPnL,
    strategyPnLAtSpot: alertStrategyPnLAtSpot,
    strategyGreeks: alertStrategyGreeks,
  });

  // Convert alerts to lines for PnLChart — all lines come from real alerts now
  const alertLinesForChart = useMemo(() => {
    const lines: { price: number; color: string; label?: string; style?: 'dashed' | 'solid' | 'dimmed' | 'active' }[] = [];

    // Legacy price alert lines (will be migrated to real alerts)
    priceAlertLines.forEach(line => {
      lines.push({
        price: line.price,
        color: line.color,
        label: line.label,
        style: 'dashed',
      });
    });

    // Canonical threshold alerts (from API)
    canonicalAlerts
      .filter(a => a.alert_class === 'threshold' && a.trigger_payload)
      .forEach(ca => {
        const payload = ca.trigger_payload as Record<string, unknown> | null;
        const price = Number(payload?.threshold ?? payload?.price);
        if (isNaN(price) || price <= 0) return;
        const meta = ca.metadata as Record<string, unknown> | null;
        const alertColor = (meta?.color as string) || '#f59e0b';
        let style: 'dashed' | 'solid' | 'dimmed' = 'dashed';
        if (ca.status === 'new') style = 'dashed';
        else if (ca.status === 'acknowledged' || ca.status === 'acted') style = 'solid';
        else if (ca.status === 'dismissed' || ca.status === 'expired') style = 'dimmed';
        lines.push({ price, color: alertColor, label: price.toFixed(2), style });
      });

    return lines;
  }, [priceAlertLines, canonicalAlerts]);

  // Build P&L alert zones from **canonical** evaluator alerts (not empty local store)
  const pnlAlertZones = useMemo(() => {
    const zones: PnLAlertZone[] = [];

    evaluatorAlerts.filter(a => a.enabled).forEach(alert => {
      switch (alert.type) {
        case 'profit_target': {
          // Absolute P&L threshold (dollars). If entry_debit stored, treat
          // targetValue as fraction of debit; else targetValue is dollars.
          const entryDebit = alert.entryDebit;
          const targetPnL = entryDebit && entryDebit > 0 && alert.targetValue > 0 && alert.targetValue <= 5
            ? entryDebit * alert.targetValue
            : alert.targetValue;
          if (Number.isFinite(targetPnL)) {
            zones.push({
              type: 'profit_target',
              pnlValue: targetPnL,
              color: alert.color || '#22c55e',
              label: `Target $${targetPnL.toFixed(0)}`,
              style: 'dashed',
            });
          }
          break;
        }
        case 'trailing_stop': {
          const ts = alert as import('../types/alerts').TrailingStopAlert;
          if (ts.highWaterMark > 0) {
            zones.push({
              type: 'trailing_stop_hwm',
              pnlValue: ts.highWaterMark,
              color: '#3b82f6',
              label: 'HWM',
              style: 'solid',
            });
            zones.push({
              type: 'trailing_stop_level',
              pnlValue: ts.highWaterMark - ts.targetValue,
              color: '#ef4444',
              label: `Stop -$${ts.targetValue.toFixed(0)}`,
              style: 'dashed',
            });
          }
          break;
        }
        case 'ai_theta_gamma': {
          const tg = alert as import('../types/alerts').AIThetaGammaAlert;
          if (tg.isZoneActive && tg.zoneLow && tg.zoneHigh) {
            zones.push({
              type: 'theta_gamma_zone',
              priceLow: tg.zoneLow,
              priceHigh: tg.zoneHigh,
              color: tg.color || '#f59e0b',
              label: 'Safe Zone',
              style: 'shaded',
            });
          }
          break;
        }
      }
    });

    return zones;
  }, [evaluatorAlerts]);


  // Open designer from chart context menu (right-click)
  const handleOpenAlertDialog = useCallback((price: number, type: PriceAlertType) => {
    const conditionMap: Record<PriceAlertType, 'above' | 'below' | 'at'> = {
      'price_above': 'above',
      'price_below': 'below',
      'price_touch': 'at',
    };
    setEditingCanonicalAlertId(null);
    setDesignerEditingAlert(null);
    setDesignerInitialType('price');
    setDesignerInitialValue(Math.round(price));
    setDesignerInitialCondition(conditionMap[type]);
    setDesignerInitialStrategyId(strategies[0]?.id);
    setDesignerOpen(true);
  }, [strategies]);

  // Open designer from position "Alert" button
  const handleStartNewAlert = useCallback((strategyId: string) => {
    setEditingCanonicalAlertId(null);
    setDesignerEditingAlert(null);
    setDesignerInitialType(undefined);
    setDesignerInitialValue(undefined);
    setDesignerInitialCondition(undefined);
    setDesignerInitialStrategyId(strategyId);
    setDesignerOpen(true);
  }, []);

  // Open designer to edit existing alert (canonical store is source of truth)
  const handleStartEditingAlert = useCallback((alertId: string) => {
    const mapped = evaluatorAlerts.find(a => a.id === alertId);
    if (!mapped) return;
    setEditingCanonicalAlertId(alertId);
    setDesignerEditingAlert(mapped);
    setDesignerInitialType(undefined);
    setDesignerInitialValue(undefined);
    setDesignerInitialCondition(undefined);
    setDesignerInitialStrategyId(mapped.strategyId);
    setDesignerOpen(true);
  }, [evaluatorAlerts]);

  // Handle designer save — create or update canonical alert (full evaluator payload)
  const handleDesignerSave = useCallback((alertData: any) => {
    const strategyId = alertData.strategyId || strategies[0]?.id || undefined;
    const strategy = strategyId ? strategies.find(s => s.id === strategyId) : undefined;
    const condLabel = alertData.condition === 'above' ? 'above' : alertData.condition === 'below' ? 'below' : 'at';
    const symbol = strategy?.symbol || 'SPX';
    const alertType = alertData.type || 'price';
    const typeLabel = alertType === 'price' ? 'Price'
      : alertType === 'profit_target' ? 'Profit'
      : alertType === 'greeks_threshold' ? (alertData.greekName || alertData.label || 'Greek')
      : alertData.label || alertType;
    const valNum = Number(alertData.targetValue);
    const valStr = valNum % 1 !== 0 ? valNum.toFixed(2) : String(valNum);
    const title = `${typeLabel} ${condLabel} ${valStr}`;
    const message = alertData.goal || `${typeLabel} alert: ${condLabel} ${valStr} on ${symbol}`;

    // Payload must carry everything the client evaluator needs — no local dual store.
    const entryDebit = strategy
      ? (cardDebits?.[strategy.id] ?? strategy.debit ?? strategy.costBasis ?? undefined)
      : undefined;
    const trigger_payload: Record<string, unknown> = {
      threshold: alertData.targetValue,
      condition: condLabel,
      alert_type: alertType,
      strategy_id: strategyId,
      threshold_scope: alertData.thresholdScope
        || (strategyId ? 'single' : 'all'),
      greek_name: alertData.greekName || alertData.label || undefined,
      label: alertData.label || undefined,
      entry_debit: entryDebit != null && entryDebit > 0 ? entryDebit : undefined,
    };
    const metadata = {
      color: alertData.color,
      mode: alertData.mode || 'observe',
      goal: alertData.goal,
      greek_name: alertData.greekName || alertData.label,
    };

    if (editingCanonicalAlertId) {
      patchCanonicalAlert(editingCanonicalAlertId, {
        title,
        message,
        trigger_key: `${alertType}:${condLabel}:${alertData.targetValue}`,
        trigger_payload,
        metadata,
        source_ref_type: strategyId ? 'intent' : undefined,
        source_ref_id: strategyId,
        ...(alertData.expiration ? { expiration: alertData.expiration } : {}),
      });
      setEditingCanonicalAlertId(null);
    } else {
      createCanonicalAlert({
        alert_class: 'threshold',
        domain: 'work_surface',
        source_system: 'risk_graph',
        severity: 'medium',
        title,
        message,
        dedupe_key: `rg:${alertType}:${condLabel}:${alertData.targetValue}:${Date.now()}`,
        trigger_type: 'threshold',
        trigger_key: `${alertType}:${condLabel}:${alertData.targetValue}`,
        trigger_payload,
        symbol,
        source_ref_type: strategyId ? 'intent' : undefined,
        source_ref_id: strategyId,
        delivery_targets: ['ui', 'push'],
        metadata,
        ...(alertData.expiration ? { expiration: alertData.expiration } : {}),
      });
    }
  }, [createCanonicalAlert, patchCanonicalAlert, editingCanonicalAlertId, strategies, cardDebits]);

  // Build strategy info list for AlertDesigner
  const designerStrategies = useMemo(() =>
    strategies.map(s => {
      const legs = s.legs || strategyToLegs(s.strategy, s.side, s.strike, s.width, s.expiration);
      return {
        id: s.id,
        label: `${s.symbol || 'SPX'} ${formatPositionLabel(
          s.positionType || s.strategy,
          s.direction || 'long',
          legs
        )}`,
        strikesLabel: [...legs].sort((a, b) => a.strike - b.strike).map(l => {
          const pc = (l.right || s.side || 'call').charAt(0).toUpperCase();
          return `${l.strike}${pc}`;
        }).join('/'),
      };
    }),
    [strategies]
  );

  // ── Position labels for chart context menu (slash-joined strikes) ──
  const positionLabels = useMemo(() => {
    return strategies.filter(s => s.visible).map(s => {
      const legs = s.legs || strategyToLegs(s.strategy, s.side, s.strike, s.width, s.expiration);
      const sorted = [...legs].sort((a, b) => a.strike - b.strike);
      // Include Put/Call suffix: "6595C/6625C/6655C" or "6595P/6625P"
      const strikesLabel = sorted.map(l => {
        const pc = (l.right || s.side || 'call').charAt(0).toUpperCase();
        return `${l.strike}${pc}`;
      }).join('/');
      const leftmostStrike = sorted.length > 0 ? sorted[0].strike : 0;
      return { id: s.id, strikesLabel, leftmostStrike };
    }).sort((a, b) => a.leftmostStrike - b.leftmostStrike);
  }, [strategies]);

  // ── Open AlertDesigner in Position mode for a specific strategy ──
  const openDesignerForPosition = useCallback((strategyId: string, value?: number) => {
    setEditingCanonicalAlertId(null);
    setDesignerEditingAlert(null);
    setDesignerInitialType('position');
    setDesignerInitialValue(value != null ? Math.round(value) : undefined);
    setDesignerInitialCondition('above');
    setDesignerInitialStrategyId(strategyId);
    setDesignerOpen(true);
  }, []);

  const handlePositionAlertSelect = useCallback((positionId: string, price: number) => {
    openDesignerForPosition(positionId, price);
  }, [openDesignerForPosition]);

  // ── Curve context menu + position alert handlers ──────────

  const handleCurveContextMenu = useCallback((price: number, pnl: number, _curveType: 'expiration' | 'theoretical', event: React.MouseEvent) => {
    const visibleStrategies = strategies.filter(s => s.visible);
    if (visibleStrategies.length === 0) return;

    if (visibleStrategies.length === 1) {
      // Single position — open AlertDesigner directly
      openDesignerForPosition(visibleStrategies[0].id);
    } else {
      // Multiple positions — show picker menu at cursor
      setCurveMenu({ x: event.clientX, y: event.clientY, price, pnl });
    }
  }, [strategies, openDesignerForPosition]);

  const handlePickPositionForAlert = useCallback((strategyId: string) => {
    setCurveMenu(null);
    openDesignerForPosition(strategyId);
  }, [openDesignerForPosition]);

  const closeCurveMenu = useCallback(() => setCurveMenu(null), []);

  // PROB: primary fill (selected nΣ) + fixed 1 / 1.5 / 2σ ladder rings
  const LADDER_NSIGMAS = [1, 1.5, 2] as const;
  const probModel = useMemo(() => {
    if (!probEnabled) return null;
    const S = spotPrice > 0 ? spotPrice : 0;
    if (!(S > 0)) return null;
    const horizon = (probDate && /^\d{4}-\d{2}-\d{2}$/.test(probDate))
      ? probDate
      : tomorrowYmd();
    const asOfMs = Date.now();
    const horizonMs = new Date(horizon + 'T20:00:00Z').getTime();
    const dte = Math.max(0, Math.round((horizonMs - asOfMs) / 86_400_000));
    const atmMap = atmIvByDte ?? {};
    const atmNumeric: Record<number, number> = {};
    for (const [k, v] of Object.entries(atmMap)) {
      const n = Number(k);
      if (Number.isFinite(n) && typeof v === 'number' && v > 0) atmNumeric[n] = v;
    }
    let sigma = pickIv(dte, atmNumeric);
    if (!(sigma > 0) || sigma > 5) {
      sigma = (vix > 0 ? vix : 18) / 100;
    }
    const nPrimary = probConfidence > 0 ? probConfidence : 1;
    try {
      const primary = computeProbRange({
        spot: S, sigma, nSigma: nPrimary, asOfMs, horizonDate: horizon,
      });
      const rings = LADDER_NSIGMAS.map(nSigma => {
        const r = computeProbRange({
          spot: S, sigma, nSigma, asOfMs, horizonDate: horizon,
        });
        return { nSigma, lo: r.lo, hi: r.hi };
      });
      return { primary, rings, sigma };
    } catch {
      return null;
    }
  }, [probEnabled, probConfidence, probDate, spotPrice, atmIvByDte, vix]);

  // Render backdrop for Dealer Gravity visualization (VP + GEX + Structural Lines + PROB)
  const renderBackdrop = useCallback((props: BackdropRenderProps) => {
    const hasVPData = dgArtifact?.profile;
    const hasGexData = gexByStrike && Object.keys(gexByStrike).length > 0;
    const hasProb = probEnabled && probModel != null;
    // Allow PROB-only (no VP/GEX) so the band still mounts
    if (!hasVPData && !hasGexData && !hasProb) return null;

    return (
      <RiskGraphBackdrop
        vpArtifact={dgArtifact}
        width={props.width}
        height={props.height}
        priceMin={props.priceMin}
        priceMax={props.priceMax}
        spotPrice={props.spotPrice}
        showVolumeProfile={showVolumeProfile}
        showGex={showGex}
        showStructuralLines={showStructuralLines}
        showMS={showMS}
        showProb={hasProb}
        probLo={probModel?.primary.lo}
        probHi={probModel?.primary.hi}
        probRings={probModel?.rings}
        probPrimaryNSigma={probModel?.primary.z}
        zgfzIntensity={zgfzIntensity}
        opacity={backdropOpacity}
        gexByStrike={gexByStrike}
        gexConfig={{
          callColor: gexConfig.callColor,
          putColor: gexConfig.putColor,
          mode: gexModeOverride ?? gexConfig.mode,
          heightPercent: gexConfig.heightPercent,
          zgrDotMinRadius: gexConfig.zgrDotMinRadius,
          zgrDotMaxRadius: gexConfig.zgrDotMaxRadius,
          zgrLineBaseAlpha: gexConfig.zgrLineBaseAlpha,
          zgrLineProximityBoost: gexConfig.zgrLineProximityBoost,
          zgrDotBaseOpacity: gexConfig.zgrDotBaseOpacity,
          zgfzExponentMin: gexConfig.zgfzExponentMin,
          zgfzExponentRange: gexConfig.zgfzExponentRange,
          zgrMinAbsNet: gexConfig.zgrMinAbsNet,
        }}
        vpConfig={{
          color: volumeProfileConfig.color,
          widthPercent: volumeProfileConfig.widthPercent,
          mode: volumeProfileConfig.mode,
          rowsLayout: volumeProfileConfig.rowsLayout,
          rowSize: volumeProfileConfig.rowSize,
          transparency: volumeProfileConfig.transparency,
          cappingSigma: volumeProfileConfig.cappingSigma,
        }}
      />
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dgArtifact, showVolumeProfile, showGex, showStructuralLines, showMS, zgfzIntensity, backdropOpacity, gexByStrike, gexConfig, gexModeOverride, volumeProfileConfig, probEnabled, probModel]);

  // formatDTE moved outside component — see module-level function

  // Calculate time machine limits based on ACTUAL hours remaining until expiration
  // Compute dynamically from expiration date to avoid stale DTE snapshots
  const visibleStrategies = strategies.filter(s => s.visible);
  const now = new Date();

  // Find the earliest expiration across visible strategies and compute hours remaining
  const expirations = visibleStrategies
    .map(s => s.expiration)
    .filter((e): e is string => !!e);

  let actualHoursRemaining: number;
  if (expirations.length > 0) {
    // Parse expiration dates with 4pm ET close, find the minimum.
    // Probe 20:00 UTC — that's 4 PM EDT (UTC-4). If ET reads 15 instead of 16,
    // we're in EST (UTC-5) and need to shift +1h to reach 4 PM ET.
    const hoursPerExpiration = expirations.map(exp => {
      // Normalize to YYYY-MM-DD (handles ISO datetime strings from API)
      const expDateStr = String(exp).split('T')[0];
      const probe = new Date(expDateStr + 'T20:00:00Z');
      const etHour = parseInt(probe.toLocaleString('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false }));
      const expClose = etHour === 16 ? probe : new Date(probe.getTime() + 3600000);
      return (expClose.getTime() - now.getTime()) / (1000 * 60 * 60);
    });
    actualHoursRemaining = Math.max(0.5, Math.max(...hoursPerExpiration));
  } else {
    // Fallback: use static dte
    const minDTE = visibleStrategies.length > 0
      ? Math.min(...visibleStrategies.map(s => s.dte))
      : 1;
    actualHoursRemaining = minDTE === 0 ? 0.5 : minDTE * 24;
  }

  const maxHours = actualHoursRemaining;
  const hoursRemaining = maxHours - simTimeOffsetHours;
  const effectiveHoursRemaining = Math.max(0, hoursRemaining);

  // ── Piecewise 3-zone time slider mapping ──────────────────────
  // Zone 1 (slider 0–50%):  current → 2h before close   (coarse, ~hour-level)
  // Zone 2 (slider 50–75%): 2h → 10min before close     (10-minute increments)
  // Zone 3 (slider 75–100%): final 60 minutes           (minute-level increments)
  //
  // Edge cases: if maxHours < 2h, skip zone 1 and split 60/40 between zones 2+3.
  // If maxHours <= 1h, entire slider is zone 3.

  // 3-zone piecewise time scale (continuous, no quantization):
  // 0-50%: current → 2h before close (coarse)
  // 50-75%: 2h → 1h before close (medium resolution)
  // 75-100%: 1h → close (fine — minute-by-minute drag)

  const sliderToHours = useCallback((position: number): number => {
    if (maxHours <= 0) return 0;

    // Edge case: 1 hour or less total — entire slider is fine zone
    if (maxHours <= 1) {
      return (position / 100) * maxHours;
    }

    // Edge case: less than 2 hours total — skip zone 1, split 60/40 between zones 2+3
    if (maxHours <= 2) {
      if (position <= 60) {
        return (position / 60) * (maxHours - 1);
      } else {
        const start = maxHours - 1;
        return start + ((position - 60) / 40) * 1;
      }
    }

    // Normal case: 3 zones
    const zone1End = maxHours - 2; // coarse zone covers this range
    const zone2End = maxHours - 1; // medium zone covers 2h minus last 1h

    if (position <= 50) {
      // Zone 1: 0-50% → 0 to (maxHours - 2) hours
      return (position / 50) * zone1End;
    } else if (position <= 75) {
      // Zone 2: 50-75% → (maxHours-2) to (maxHours-1h)
      return zone1End + ((position - 50) / 25) * (zone2End - zone1End);
    } else {
      // Zone 3: 75-100% → (maxHours-1h) to maxHours
      return zone2End + ((position - 75) / 25) * (maxHours - zone2End);
    }
  }, [maxHours]);

  const hoursToSlider = useCallback((hours: number): number => {
    if (maxHours <= 0) return 0;
    hours = Math.max(0, Math.min(hours, maxHours));

    if (maxHours <= 1) return (hours / maxHours) * 100;

    if (maxHours <= 2) {
      const boundary = maxHours - 1;
      if (hours <= boundary) return (hours / boundary) * 60;
      return 60 + ((hours - boundary) / 1) * 40;
    }

    const zone1End = maxHours - 2;
    const zone2End = maxHours - 1;

    if (hours <= zone1End) {
      return (hours / zone1End) * 50;
    } else if (hours <= zone2End) {
      return 50 + ((hours - zone1End) / (zone2End - zone1End)) * 25;
    } else {
      return 75 + ((hours - zone2End) / (maxHours - zone2End)) * 25;
    }
  }, [maxHours]);

  // Current slider position
  const sliderPosition = hoursToSlider(simTimeOffsetHours);

  // Compute expiration markers for the time slider
  // Shows where each position expires relative to the slider range
  const expirationMarkers = useMemo(() => {
    const markers: Array<{ position: number; label: string; expired: boolean }> = [];
    const seen = new Set<string>(); // dedupe by expiration date
    for (const s of visibleStrategies) {
      if (!s.expiration || seen.has(s.expiration)) continue;
      seen.add(s.expiration);
      const expDateStr = String(s.expiration).split('T')[0];
      const expProbe = new Date(expDateStr + 'T20:00:00Z');
      const expEtHour = parseInt(expProbe.toLocaleString('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false }));
      const expClose = expEtHour === 16 ? expProbe : new Date(expProbe.getTime() + 3600000);
      const hoursToExp = (expClose.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursToExp <= 0 || hoursToExp >= maxHours) continue; // skip if at boundary
      const sliderPos = hoursToSlider(hoursToExp);
      const dateLabel = s.expiration.slice(5); // "MM-DD"
      markers.push({
        position: sliderPos,
        label: dateLabel,
        expired: simTimeOffsetHours >= hoursToExp,
      });
    }
    return markers;
  }, [visibleStrategies, maxHours, hoursToSlider, now, simTimeOffsetHours]);

  // ── Slider state ──
  const [localTimePos, setLocalTimePos] = useState(sliderPosition);

  // Sync local time position from prop (reset, toggle, external change)
  useEffect(() => { setLocalTimePos(sliderPosition); }, [sliderPosition]);

  const handleTimeSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const position = parseFloat(e.target.value);
    setLocalTimePos(position);
    onSimTimeChange(sliderToHours(position));
  }, [sliderToHours, onSimTimeChange]);

  // Spot slider: direct
  const handleSpotSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSimSpotPctChange(parseFloat(e.target.value));
  }, [onSimSpotPctChange]);

  // Vol slider: operates on absolute currentVix, commits as offset
  const handleVolSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const absVix = parseFloat(e.target.value);
    onSimVolatilityChange(absVix - vix);
  }, [vix, onSimVolatilityChange]);

  // Local time hours for readout (instant feedback, not deferred)
  const localTimeHours = sliderToHours(localTimePos);
  const localHoursRemaining = Math.max(0, maxHours - localTimeHours);

  // Military time + date label (ET) for the simulated point in time
  const simDateET = useMemo(() => {
    const simDate = new Date(now.getTime() + localTimeHours * 3600000);
    const time = simDate.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const date = simDate.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
    });
    return { time, date };
  }, [now, localTimeHours]);

  return (
    <div className="panel echarts-risk-graph-panel">
      <div className="panel-header" data-report-area="Risk Graph: Header Controls">
        <h3>Risk Graph {strategies.length > 0 && `(${strategies.length})`}</h3>
        {underlyings.length > 1 && (
          <div className="weighting-selector">
            {underlyings.map(sym => (
              <button
                key={sym}
                className={`weighting-btn ${sym === effectiveWeightingIndex ? 'active' : ''}`}
                onClick={() => setWeightingIndex(sym)}
                title={`Weight chart to ${sym} prices`}
              >
                {sym}
              </button>
            ))}
          </div>
        )}
        <WhatsNew area="risk-graph" className="whats-new-apple" />
        <div className="panel-header-actions">
          {/* Vol Source Indicator */}
          <span className="rg-vol-source" title="Labs uses theoretical flat-IV surface (orange). Per-leg Mkt IV is off.">
            <span className="rg-vol-dot flat" style={{ background: RG_RT_CURVE_COLORS.theo }} />
            Theo · flat IV
          </span>
          {chainIVError && !chainIV && (
            <span className="rg-vol-error">Vol unavailable</span>
          )}
          {/* Theo/Market Pricing Toggle */}
          {onPricingModeChange && (
            <div className="pricing-toggle" title="Switch between theoretical and market pricing">
              <button
                className={`pricing-toggle-btn ${pricingMode === 'theo' ? 'active' : ''}`}
                onClick={() => onPricingModeChange('theo')}
              >Theo</button>
              <button
                className={`pricing-toggle-btn ${pricingMode === 'market' ? 'active' : ''}`}
                onClick={() => onPricingModeChange('market')}
              >Mkt</button>
            </div>
          )}
          {/* Dealer Gravity Backdrop Controls */}
          {(dgArtifact || (gexByStrike && Object.keys(gexByStrike).length > 0)) && (
            <div className="backdrop-controls" title="Dealer Gravity Backdrop">
              <label className="backdrop-toggle-label" title="Toggle Volume Profile">
                <input type="checkbox" checked={showVolumeProfile} onChange={() => setShowVolumeProfile(!showVolumeProfile)} />
                <span>VP</span>
              </label>
              <label className="backdrop-toggle-label" title="Toggle Structural Lines (Volume Nodes, Wells, Crevasses)">
                <input type="checkbox" checked={showStructuralLines} onChange={() => setShowStructuralLines(!showStructuralLines)} />
                <span>DG</span>
              </label>
              <label className="backdrop-toggle-label" title="Toggle GEX (Gamma Exposure)">
                <input type="checkbox" checked={showGex} onChange={() => setShowGexInternal(!showGexInternal)} />
                <span>GEX</span>
              </label>
              <input
                type="range"
                className="backdrop-opacity-slider"
                min="0"
                max="100"
                value={backdropOpacity * 100}
                onChange={(e) => setBackdropOpacity(Number(e.target.value) / 100)}
                title={`Backdrop Opacity: ${Math.round(backdropOpacity * 100)}%`}
              />
              <button
                className="btn-backdrop-settings"
                onClick={() => setShowDGSettings(true)}
                title="Dealer Gravity Settings"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
              </button>
            </div>
          )}
          {onOpenMonitor && (
            <button
              className="btn-monitor"
              onClick={onOpenMonitor}
              title="Open Position Monitor"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              {(pendingOrderCount > 0 || openTradeCount > 0) && (
                <span className="monitor-badge">{pendingOrderCount + openTradeCount}</span>
              )}
            </button>
          )}
          {strategies.length > 0 && (
            <button
              className="btn-auto-fit-header"
              onClick={() => pnlChartRef.current?.autoFit()}
            >
              Auto-Fit
            </button>
          )}
        </div>
      </div>
      <div
        className={
          hideSidebar
            ? 'panel-content risk-graph-consolidated risk-graph-consolidated--chart-only'
            : 'panel-content risk-graph-consolidated'
        }
      >
          {/* Main content: Chart + Sidebar */}
          <div className="risk-graph-main">
            {/* Chart Area — PriceTimeChart always mounted (pre-fetches candles),
                swaps visibility between Payoff (PnLChart) and Price-Time (LWC) */}
            <div
              className="risk-graph-chart-area"
              ref={chartAreaRef}
              style={{ position: 'relative' }}
              data-report-area="Risk Graph: Chart"
            >
              {/* PriceTimeChart — always mounted so candle data is pre-fetched.
                  Uses `visible` prop + CSS display:none when inactive. */}
              <PriceTimeChart
                symbol={priceTimeSymbol ?? strategies[0]?.symbol ?? 'SPX'}
                mode="live"
                visible={chartViewMode === 'price-time'}
                timeframe={priceTimeTimeframe}
                sessionOnly={priceTimeSessionOnly}
                showSessionLines={priceTimeSessionLines}
                entries={priceTimeEntries}
                spot={priceTimeSpot}
                chainIV={priceTimeChainIV}
                gexEnabled={priceTimeGexEnabled}
                vpEnabled={priceTimeVpEnabled}
                vpConfig={volumeProfileConfig}
                msEnabled={priceTimeMsEnabled}
                canonicalStrikeMap={canonicalStrikeMap}
                onRepositionStrategy={onRepositionStrategy}
                onSubmitIntent={onSubmitStrategy}
                onSetEntryExitTime={onSetEntryExitTime}
                onAutoFitReady={handlePriceTimeAutoFitReady}
              />
              {chartViewMode === 'risk3d' ? (
                chartSlotOverride && React.isValidElement(chartSlotOverride)
                  ? React.cloneElement(chartSlotOverride as React.ReactElement<any>, { cardDebits })
                  : chartSlotOverride
              ) : chartViewMode === 'history' ? (
                <PriceTimeHistory
                  symbol={priceTimeSymbol ?? strategies[0]?.symbol ?? 'SPX'}
                  visible={true}
                />
              ) : chartViewMode !== 'price-time' ? (
                <PnLChart
                  ref={pnlChartRef}
                  // Authority path: solid curves = LIVE only; empty when all expired
                  expirationData={
                    USE_REALTIME_AUTHORITY
                      ? (authorityExpiryPoints ?? [])
                      : pnlChartData.expirationPoints
                  }
                  theoreticalData={
                    USE_REALTIME_AUTHORITY
                      ? (authorityTheoPoints ?? [])
                      : pnlChartData.theoreticalPoints
                  }
                  theoreticalStroke={
                    USE_REALTIME_AUTHORITY ? primaryT0Stroke : RG_RT_CURVE_COLORS.theo
                  }
                  theoreticalLegendLabel={
                    USE_REALTIME_AUTHORITY ? primaryT0Legend : 'Real-Time (Theo)'
                  }
                  secondaryTheoreticalData={
                    USE_REALTIME_AUTHORITY
                      ? (authoritySecondaryTheoPoints ?? [])
                      : []
                  }
                  secondaryTheoreticalStroke={RG_RT_CURVE_COLORS.theo}
                  secondaryTheoreticalLegendLabel="Real-Time (Theo)"
                  hiResTheoreticalData={
                    authorityActive || isSimActive || dragInfo !== null
                      ? null
                      : hiResCurve.hiResData
                  }
                  spotPrice={weightingSpot}
                  spotIndicatorPrice={simSpotPct !== 0 ? simulatedSpot : undefined}
                  expirationBreakevens={
                    USE_REALTIME_AUTHORITY
                      ? (authorityStats?.expirationBreakevens ?? [])
                      : expirationBreakevens
                  }
                  theoreticalBreakevens={
                    USE_REALTIME_AUTHORITY
                      ? (authorityStats?.theoreticalBreakevens ?? [])
                      : theoreticalBreakevens
                  }
                  strikes={chartStrikes}
                  onOpenAlertDialog={handleOpenAlertDialog}
                  alertLines={alertLinesForChart}
                  pnlAlertZones={pnlAlertZones}
                  expiredExpirationData={
                    USE_REALTIME_AUTHORITY
                      ? (authorityExpiredGhostPoints ?? [])
                      : pnlChartData.expiredExpirationPoints
                  }
                  expiredTheoreticalData={
                    // Expired: dashed at-expiry ghost only (no realtime magenta ghost)
                    USE_REALTIME_AUTHORITY
                      ? []
                      : pnlChartData.expiredTheoreticalPoints
                  }
                  renderBackdrop={renderBackdrop}
                  gexByStrike={showGex ? gexByStrike : undefined}
                  vpProfile={showVolumeProfile && dgArtifact?.profile ? dgArtifact.profile : undefined}
                  strikeToStrategyId={strikeToStrategyId}
                  onStrikeDrag={handleStrikeDrag}
                  onCurveContextMenu={handleCurveContextMenu}
                  positionLabels={positionLabels}
                  onPositionAlertSelect={handlePositionAlertSelect}
                  autofitProfile={
                    // Only visible positions — hidden calendars must not soft-cap fly peaks
                    isTimeSpreadAutofit(strategies) ? 'time_spread' : 'default'
                  }
                  autoFitOnStrategyChange={false}
                  oneSigmaBandWidth={(() => {
                    const ring1 = probModel?.rings?.find(r => r.nSigma === 1);
                    if (ring1 && ring1.hi > ring1.lo) return ring1.hi - ring1.lo;
                    // Fallback: primary band scaled to 1σ if primary is nΣ ≠ 1
                    const p = probModel?.primary;
                    if (p && p.hi > p.lo && p.z > 0) {
                      return (p.hi - p.lo) / p.z;
                    }
                    // VIX 1-day 1σ so autofit still has a band when PROB is cold
                    const S = spotPrice > 0 ? spotPrice : 0;
                    const sig = (vix > 0 ? vix : 18) / 100;
                    if (S > 0 && sig > 0) {
                      const t = 1 / 365.25;
                      return S * (Math.exp(sig * Math.sqrt(t)) - Math.exp(-sig * Math.sqrt(t)));
                    }
                    return undefined;
                  })()}
                />
              ) : null}

              {/* GEX Y-axis scale — only on payoff chart view */}
              {showGex && gexMaxGex > 0 && chartViewMode !== 'price-time' && chartViewMode !== 'risk3d' && (
                <GexYAxis
                  containerHeight={chartAreaHeight}
                  maxGex={gexMaxGex}
                  heightPercent={gexHeightPct}
                  callColor={gexConfig.callColor ?? '#22c55e'}
                  putColor={gexConfig.putColor ?? '#ef4444'}
                  mode={gexModeOverride ?? gexConfig.mode ?? 'combined'}
                />
              )}

              {/* Phase 2: Cumulative GEX callouts — top-right of chart area */}
              {showGex && chartViewMode !== 'price-time' && chartViewMode !== 'risk3d' && (
                <GexCumulativeCallouts
                  upside={gexUpside}
                  downside={gexDownside}
                  absTotal={gexAbsTotal}
                  mode={gexModeOverride ?? gexConfig.mode ?? 'combined'}
                  callColor={gexConfig.callColor ?? '#22c55e'}
                  putColor={gexConfig.putColor ?? '#ef4444'}
                />
              )}

              {/* Time Machine dirty-state glow — overlay above canvas so it's visible */}
              {isSimActive && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    boxShadow: 'inset 0 0 8px 14px rgba(220, 50, 50, 0.55)',
                    pointerEvents: 'none',
                    zIndex: 10,
                    transition: 'opacity 300ms ease-out',
                  }}
                />
              )}
            </div>
          </div>

          {/* Sidebar: Positions + Alerts */}
          {!hideSidebar && <div className="risk-graph-sidebar" data-report-area="Risk Graph: Sidebar">
                {/* Position List */}
                <div className="risk-graph-strategies" data-report-area="Risk Graph: Position List">
                  <div className="section-header">
                    Positions
                    <div className="section-header-actions">
                      {onCreatePosition && (
                        <button
                          className="btn-create-position"
                          title="Create new position"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreatePosition();
                          }}
                        >
                          + Create
                        </button>
                      )}
                      {hasAnalyzerInteraction && onOpenJournal && (
                        <button
                          className="reflect-hook analyzer-reflect"
                          title="Capture an insight?"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHasAnalyzerInteraction(false);
                            onOpenJournal();
                          }}
                        >
                          📝
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="strategies-list">
                    {strategies.map(strat => {
                      // Derive legs from strategy if not already provided
                      const legs = strat.legs || strategyToLegs(
                        strat.strategy,
                        strat.side,
                        strat.strike,
                        strat.width,
                        strat.expiration
                      );

                      // Recognize position type from legs
                      const recognition = strat.positionType
                        ? { type: strat.positionType, direction: strat.direction || 'long', isSymmetric: true }
                        : recognizePositionType(legs);

                      const positionType = recognition.type;
                      const direction = recognition.direction;
                      const isAsymmetric = recognition.isSymmetric === false;

                      // Format display values
                      const positionLabel = formatPositionLabel(positionType, direction, legs);
                      const legsNotation = formatLegsDisplay(legs);

                      // Recompute DTE from expiration date (stored dte can be stale/off-by-one after midnight)
                      const displayDte = (() => {
                        if (!strat.expiration) return strat.dte ?? 0;
                        const expStr = String(strat.expiration).split('T')[0];
                        const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
                        if (expStr <= todayET) return 0;
                        const expMs = new Date(expStr + 'T00:00:00-05:00').getTime();
                        const todayMs = new Date(todayET + 'T00:00:00-05:00').getTime();
                        return Math.ceil((expMs - todayMs) / (1000 * 60 * 60 * 24));
                      })();

                      // Determine cost basis
                      const costBasis = strat.costBasis ?? strat.debit ?? null;

                      // Format legs for stacked display — scale by position quantity
                      const posQty = strat.quantity ?? 1;
                      const legLines = (strat.legs || []).map(leg => {
                        const scaled = leg.quantity * posQty;
                        const sign = scaled > 0 ? '+' : '';
                        const sideChar = leg.right === 'call' ? 'C' : 'P';
                        return `${sign}${scaled} ${leg.strike}${sideChar}`;
                      });
                      const isHidden = !strat.visible;
                      // Ghost = expired (calendar or Time Machine) — dashed curve, out of debit total
                      const isGhost = strat.visible && (
                        expiredStrategyIds.has(strat.id)
                        || !pnlChartData.activeStrategyIds.includes(strat.id)
                      );
                      const stratStatus = tradeStatuses?.get(strat.id);
                      // Lock/unlock state: ANALYSIS positions default to unlocked (engine computes debit);
                      // all other statuses default to locked. Explicit priceLocked entry overrides.
                      // Must mirror unlockedStrategyIds logic so icon state matches curve behavior.
                      const stratIsAnalysis = !stratStatus || stratStatus === 'ANALYSIS';
                      const isLabsStrat = typeof strat.id === 'string' && strat.id.startsWith('labs-');
                      // Labs design studio never freezes credit — moneyness reprice owns the card.
                      const isLocked = isLabsStrat
                        ? false
                        : (priceLocked[strat.id] ?? (stratIsAnalysis ? false : true));

                      // Single source of truth: cardDebits (computed once above,
                      // mirrors locked/unlocked logic).  Listeners (2D, 3D) read
                      // the same map.
                      const rawCostBasis = costBasis ?? 0;
                      const frozenLockedPrice = frozenLockedPrices[strat.id];
                      const serverNetValue = serverPerSharePriceMap[strat.id];
                      const displayPrice = cardDebits[strat.id] ?? Math.abs(rawCostBasis);

                      // Dynamic credit/debit: if the effective price is negative
                      // (or costBasisType says credit), show as credit with red card
                      const effectiveRaw = isLabsStrat
                        ? displayPrice
                        : isLocked
                          ? (frozenLockedPrice ?? rawCostBasis)
                          : (naturalPricesOverride?.[strat.id] ?? serverNetValue ?? rawCostBasis);
                      const isCredit = strat.costBasisType === 'credit' || effectiveRaw < 0;
                      const isOpen = stratStatus === 'OPEN' || stratStatus === 'PARTIAL_OPEN';
                      const isSubmitted = stratStatus === 'PENDING' || isOpen;

                      const isPending = stratStatus === 'PENDING';
                      const isLive = isOpen || isPending;

                      const cardClasses = [
                        'rg-pos-card',
                        isCredit ? 'rg-pos-card--credit' : 'rg-pos-card--debit',
                        isOpen ? 'rg-pos-card--open' : '',
                        isLive ? 'rg-pos-card--live' : '',
                        isHidden ? 'rg-pos-card--hidden' : '',
                        isGhost ? 'rg-pos-card--ghost' : '',
                      ].filter(Boolean).join(' ');

                      return (
                        <div key={strat.id} className={cardClasses}>
                          {/* ── Upper area: title | legs | price ── */}
                          <div className="rg-pos-card-upper">
                            <span className="rg-pos-card-title">
                              {positionLabel}
                              {(strat.quantity ?? 1) > 1 && (
                                <span className="rg-pos-card-qty">×{strat.quantity}</span>
                              )}
                              <span className="rg-pos-card-dte">{displayDte}D</span>
                            </span>
                            <div className="rg-pos-card-legs">
                              {legLines.length > 0
                                ? legLines.map((line, i) => (
                                    <span key={i} className="rg-pos-card-leg">{line}</span>
                                  ))
                                : <span className="rg-pos-card-leg">{legsNotation}</span>
                              }
                            </div>
                            <div className="rg-pos-card-price-cluster">
                              {/* Always editable. Focus on an unlocked card freezes the
                                  current live mid into a locked debit, then editing proceeds. */}
                              <input
                                type="text"
                                inputMode="decimal"
                                className={
                                  isLocked || editingPriceId === strat.id
                                    ? 'rg-pos-card-price-input'
                                    : 'rg-pos-card-price-input rg-pos-card-price-input--live'
                                }
                                value={
                                  editingPriceId === strat.id
                                    ? priceDraft
                                    : displayPrice.toFixed(2)
                                }
                                readOnly={false}
                                aria-label={isLocked ? 'Edit locked debit' : 'Edit debit (locks on focus)'}
                                title={isLocked ? 'Locked debit — edit and blur to commit' : 'Click to lock at current mid and edit'}
                                onChange={(e) => {
                                  if (editingPriceId === strat.id) setPriceDraft(e.target.value);
                                }}
                                onFocus={(e) => {
                                  e.stopPropagation();
                                  // Labs: never lock — credit tracks moneyness from legs.
                                  // MSC: lock on focus so live mid stops fighting the edit.
                                  if (!isLabsStrat && !isLocked) {
                                    lockPriceAtCurrent(strat.id);
                                  }
                                  setEditingPriceId(strat.id);
                                  setPriceDraft(displayPrice.toFixed(2));
                                  // Select after lock re-render settles
                                  requestAnimationFrame(() => {
                                    e.target.select();
                                  });
                                }}
                                onBlur={() => {
                                  if (editingPriceId !== strat.id) return;
                                  setHasAnalyzerInteraction(true);
                                  const val = parseFloat(priceDraft);
                                  const next = isNaN(val) || val < 0 ? null : Math.round(val * 100) / 100;
                                  if (next != null && next > 0) {
                                    if (!isLabsStrat) {
                                      setFrozenLockedPrices(prev => {
                                        const m = { ...prev, [strat.id]: next };
                                        try { localStorage.setItem('riskGraph_frozenPrices', JSON.stringify(m)); } catch {}
                                        return m;
                                      });
                                    }
                                    onUpdateStrategyDebit(strat.id, next);
                                  }
                                  setEditingPriceId(null);
                                  setPriceDraft('');
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') e.currentTarget.blur();
                                  if (e.key === 'Escape') {
                                    setPriceDraft(displayPrice.toFixed(2));
                                    e.currentTarget.blur();
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="rg-pos-card-price-side">
                                {isCredit ? 'CREDIT' : 'DEBIT'}
                              </span>
                            </div>
                          </div>

                          {/* ── Lower area: state-machine-driven actions ── */}
                          {/* ANALYSIS: X | HIDE EDIT SUBMIT | lock */}
                          {/* PENDING:  HIDE CANCEL | lock */}
                          {/* OPEN:     X | HIDE SUBMIT | broker badge */}
                          {/* CLOSED/CANCELLED: ghost, HIDE only */}
                          <div className="rg-pos-card-actions">
                            {/* Delete X — ephemeral statuses only (ANALYSIS/CANCELLED/REJECTED).
                                Trade records (PENDING/OPEN/CLOSED) remain in existence. */}
                            {(!stratStatus || stratStatus === 'ANALYSIS' || stratStatus === 'CANCELLED' || stratStatus === 'REJECTED') && (
                              <button
                                className="rg-pos-card-remove"
                                onClick={(e) => { e.stopPropagation(); onRemoveStrategy(strat.id); }}
                                aria-label="Remove position"
                                title="Remove"
                              >×</button>
                            )}
                            <div className="rg-pos-card-btns">
                              {/* HIDE/SHOW — always available */}
                              <button
                                className="rg-pos-card-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHasAnalyzerInteraction(true);
                                  onToggleStrategyVisibility(strat.id);
                                }}
                              >
                                {isHidden ? 'SHOW' : 'HIDE'}
                              </button>
                              {/* EDIT — ANALYSIS only */}
                              {(!stratStatus || stratStatus === 'ANALYSIS') && onEditStrategy && (
                                <button
                                  className="rg-pos-card-btn"
                                  onClick={(e) => { e.stopPropagation(); onEditStrategy(strat.id); }}
                                >
                                  EDIT
                                </button>
                              )}
                              {/* SUBMIT — ANALYSIS only */}
                              {(!stratStatus || stratStatus === 'ANALYSIS') && onSubmitStrategy && (
                                <button
                                  className="rg-pos-card-btn rg-pos-card-btn--submit"
                                  onClick={(e) => { e.stopPropagation(); onSubmitStrategy(strat.id); }}
                                >
                                  SUBMIT
                                </button>
                              )}
                              {/* CLOSE — OPEN only */}
                              {isOpen && onSubmitStrategy && (
                                <button
                                  className="rg-pos-card-btn rg-pos-card-btn--submit"
                                  onClick={(e) => { e.stopPropagation(); onSubmitStrategy(strat.id); }}
                                >
                                  CLOSE
                                </button>
                              )}
                              {/* CANCEL — PENDING only */}
                              {stratStatus === 'PENDING' && onCancelOrder && (
                                <button
                                  className="rg-pos-card-btn rg-pos-card-btn--cancel"
                                  onClick={(e) => { e.stopPropagation(); onCancelOrder(strat.id); }}
                                >
                                  CANCEL
                                </button>
                              )}
                            </div>
                            {/* Right anchor: broker badge for OPEN, price lock for everything else */}
                            {isOpen ? (
                              <span className="rg-pos-card-broker-badge" title="Live position at broker">
                                <svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    d="M11 1L2 4.5V11c0 5.8 3.9 11.2 9 12.5C16.1 22.2 20 16.8 20 11V4.5L11 1z"
                                    fill="rgba(59,130,246,0.18)"
                                    stroke="rgba(59,130,246,0.55)"
                                    strokeWidth="1.4"
                                  />
                                  <path
                                    d="M11 6.5l1.3 3.9h4.1l-3.3 2.4 1.3 3.9L11 14.3l-3.4 2.4 1.3-3.9-3.3-2.4h4.1z"
                                    fill="#60a5fa"
                                  />
                                </svg>
                              </span>
                            ) : !isGhost && !isLabsStrat && (
                              <button
                                className="rg-pos-card-lock"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePriceLock(strat.id);
                                }}
                                title={isLocked ? 'Price locked — click to use model price' : 'Using model price — click to lock'}
                              >
                                {isLocked ? (
                                  <img src="/icons/locked.png" alt="Locked" width="42" height="36" style={{ display: 'block' }} />
                                ) : (
                                  <img src="/icons/unlocked.png" alt="Unlocked" width="42" height="36" style={{ display: 'block' }} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {strategies.length === 0 && (
                      <div className="strategies-empty">
                        No positions loaded
                      </div>
                    )}
                  </div>
                </div>

                {/* Algo Alerts Section */}
                <AlgoAlertPanel
                  positionIds={strategies.map(s => s.id)}
                />

                {/* Alerts Section */}
                <div className="risk-graph-alerts" data-report-area="Risk Graph: Alerts">
                  <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Alerts
                    <button
                      className="btn-add-alert"
                      onClick={() => {
                        setEditingCanonicalAlertId(null);
                        setDesignerEditingAlert(null);
                        setDesignerInitialType(undefined);
                        setDesignerInitialValue(undefined);
                        setDesignerInitialCondition(undefined);
                        setDesignerInitialStrategyId(strategies[0]?.id);
                        setDesignerOpen(true);
                      }}
                      aria-label="Create new alert"
                      title="Create new alert"
                    />
                  </div>
                  <div className="alerts-list" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
                    {canonicalAlerts.filter(a => a.source_system === 'risk_graph').map(ca => {
                      const payload = ca.trigger_payload as Record<string, unknown> | null;
                      const meta = ca.metadata as Record<string, unknown> | null;
                      const caColor = (meta?.color as string) || '#3b82f6';
                      const alertMode = (meta?.mode as string) || 'observe';
                      const condition = (payload?.condition as string) || '';
                      const threshold = payload?.threshold ?? payload?.price;
                      const thresholdStr = threshold != null
                        ? Number(threshold).toFixed(2)
                        : '';

                      // Derive alert kind label (uppercase)
                      const triggerKey = ca.trigger_key || '';
                      const typePart = triggerKey.split(':')[0] || 'price';
                      const kindLabel = (() => {
                        const cond = condition.toUpperCase();
                        switch (typePart) {
                          case 'price': return condition === 'above' ? 'PRICE RISES ABOVE' : condition === 'below' ? 'PRICE FALLS BELOW' : `PRICE ${cond}`;
                          case 'profit_target': return 'PROFIT TARGET';
                          case 'trailing_stop': return 'TRAILING STOP BELOW';
                          case 'greeks_threshold': {
                            const g = String(
                              (payload?.greek_name as string)
                              || (meta?.greek_name as string)
                              || 'gamma',
                            ).toUpperCase();
                            const dir = condition === 'below' ? 'LESS THAN' : 'GREATER THAN';
                            return `${g} ${dir}`;
                          }
                          default: return ca.title?.toUpperCase() || typePart.toUpperCase();
                        }
                      })();

                      // Status display
                      const isStopped = ca.status === 'dismissed' || ca.status === 'expired';
                      const isActive = alertMode === 'active' && !isStopped;
                      const isConditionMet = conditionMetIds.has(ca.alert_id);
                      const statusLabel = isStopped
                        ? `Stopped - ${ca.status === 'expired' ? 'Expired' : 'Triggered'}`
                        : isConditionMet
                          ? 'Condition met'
                          : isActive ? 'Active' : 'Paused';
                      const statusColor = isConditionMet
                        ? '#fbbf24'
                        : isActive ? '#4ade80' : isStopped ? '#94a3b8' : '#94a3b8';

                      return (
                        <div
                          key={ca.alert_id}
                          style={{
                            background: '#2a4a7f',
                            borderRadius: 12,
                            padding: '10px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            outline: isConditionMet ? '1px solid rgba(251, 191, 36, 0.7)' : undefined,
                          }}
                        >
                          {/* Top row: color dot, kind label, value badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              backgroundColor: caColor,
                              flexShrink: 0,
                            }} />
                            <span style={{
                              flex: 1,
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#fff',
                              letterSpacing: 0.5,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {kindLabel}
                            </span>
                            {thresholdStr && (
                              <span style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#fff',
                                background: 'rgba(96, 165, 250, 0.35)',
                                padding: '3px 12px',
                                borderRadius: 4,
                                flexShrink: 0,
                              }}>
                                {thresholdStr}
                              </span>
                            )}
                          </div>
                          {/* Bottom row: delete, pause/restart, edit, status */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteCanonicalAlert(ca.alert_id); }}
                              title="Delete alert"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                fontSize: 15,
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: '2px 6px',
                                lineHeight: 1,
                              }}
                            >
                              X
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newMode = alertMode === 'active' ? 'observe' : 'active';
                                patchCanonicalAlert(ca.alert_id, {
                                  metadata: { ...meta, mode: newMode },
                                });
                              }}
                              title={alertMode === 'active' ? 'Pause alert' : 'Start alert'}
                              style={{
                                background: alertMode === 'active' ? '#f59e0b' : '#4ade80',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 6,
                                color: '#1e293b',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: '4px 14px',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              {alertMode === 'active' ? 'Pause' : 'Start'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Open designer pre-filled with this alert's values, in edit mode
                                setEditingCanonicalAlertId(ca.alert_id);
                                setDesignerEditingAlert(null);
                                setDesignerInitialType(typePart);
                                setDesignerInitialValue(threshold != null ? Number(threshold) : undefined);
                                setDesignerInitialCondition(condition as 'above' | 'below' | 'at' | undefined);
                                setDesignerInitialStrategyId(strategies[0]?.id);
                                setDesignerOpen(true);
                              }}
                              title="Edit alert"
                              style={{
                                background: '#60a5fa',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 6,
                                color: '#1e293b',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: '4px 14px',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              Edit
                            </button>
                            <span style={{
                              flex: 1,
                              textAlign: 'right',
                              fontSize: 12,
                              fontWeight: 500,
                              fontStyle: 'italic',
                              color: statusColor,
                            }}>
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {canonicalAlerts.filter(a => a.source_system === 'risk_graph').length === 0 && (
                      <div style={{
                        padding: '16px 8px',
                        textAlign: 'center',
                        color: 'var(--text-tertiary, #636366)',
                        fontSize: 11,
                      }}>
                        No alerts set
                        <div style={{ fontSize: 10, marginTop: 4, color: 'var(--text-quaternary, #48484A)' }}>
                          Right-click chart or tap + to add
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>}

              {/* Time machine / what-if strip removed for Labs — chart gets the space. */}

              {/* Summary Stats — dollar stats synced to cardDebits + authority curves */}
              <div className="risk-graph-stats" data-report-area="Risk Graph: Statistics">
                <div className="stat highlight">
                  <span className="stat-label">
                    Real-Time P&L
                    {simSpotPct !== 0 && (
                      <span style={{ opacity: 0.7, fontWeight: 400, marginLeft: 4 }}>
                        @ sim spot
                      </span>
                    )}
                  </span>
                  {(() => {
                    const pnl = riskGraphData.marketPnL ?? riskGraphData.theoreticalPnLAtSpot;
                    return (
                      <span className={`stat-value ${pnl >= 0 ? 'profit' : 'loss'}`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(0)}
                      </span>
                    );
                  })()}
                </div>
                <div className="stat-divider" />
                {statusCostBasis && (
                  <div
                    className="stat"
                    title={
                      statusCostBasis.parts
                        .map(p => `${p.perShare.toFixed(2)}${p.qty > 1 ? `×${p.qty}` : ''}`)
                        .join(' + ') +
                      ` = ${statusCostBasis.perShare.toFixed(2)}/sh  →  $${Math.abs(statusCostBasis.dollars).toFixed(0)} total`
                    }
                  >
                    <span className="stat-label">
                      {statusCostBasis.side === 'credit' ? 'Credit' : statusCostBasis.side === 'mixed' ? 'Cost' : 'Debit'}
                    </span>
                    <span className="stat-value">
                      {statusCostBasis.perShare.toFixed(2)}
                      <span style={{ opacity: 0.55, fontWeight: 400, marginLeft: 4, fontSize: '0.85em' }}>
                        (${Math.abs(statusCostBasis.dollars).toFixed(0)})
                      </span>
                    </span>
                  </div>
                )}
                <div className="stat" title="Peak of at-expiration P&L (curve or structural)">
                  <span className="stat-label">Max Profit</span>
                  <span className="stat-value profit">
                    +${statusExtrema.maxProfit.toFixed(0)}
                  </span>
                </div>
                <div className="stat" title="Sum of card debits × 100 × qty for defined-risk debit structures">
                  <span className="stat-label">Max Loss</span>
                  <span className="stat-value loss">
                    {statusExtrema.maxLoss === Infinity
                      ? 'UND'
                      : `−$${statusExtrema.maxLoss.toFixed(0)}`}
                  </span>
                </div>
                <div className="stat" title="Max Profit ÷ Max Loss from expiry curve">
                  <span className="stat-label">R2R</span>
                  <span className="stat-value">
                    {statusExtrema.r2r == null ? '—' : statusExtrema.r2r.toFixed(1)}
                  </span>
                </div>
                <div className="stat-divider" />
                <div className="stat" title="Greeks from legacy BS path (not yet authority-synced)">
                  <span className="stat-label">Delta</span>
                  <span className={`stat-value ${pnlChartData.delta >= 0 ? 'profit' : 'loss'}`}>
                    {pnlChartData.delta >= 0 ? '+' : ''}{pnlChartData.delta.toFixed(1)}
                  </span>
                </div>
                <div className="stat" title="Greeks from legacy BS path (not yet authority-synced)">
                  <span className="stat-label">Gamma</span>
                  <span className="stat-value">{pnlChartData.gamma.toFixed(2)}</span>
                </div>
                <div className="stat" title="Greeks from legacy BS path (not yet authority-synced)">
                  <span className="stat-label">Theta</span>
                  <span className={`stat-value ${pnlChartData.theta >= 0 ? 'profit' : 'loss'}`}>
                    {pnlChartData.theta >= 0 ? '+' : ''}${pnlChartData.theta.toFixed(0)}/day
                  </span>
                </div>
                {(isSimActive || timeMachineEnabled) && (
                  <>
                    <div className="stat-divider" />
                    <div className="stat simulation-indicator">
                      <span className="stat-label">Simulation</span>
                      <span className="stat-value">
                        {simSpotPct !== 0 && <span className="sim-param">Spot {simSpotPct > 0 ? '+' : ''}{simSpotPct.toFixed(1)}%</span>}
                        {simTimeOffsetHours !== 0 && <span className="sim-param">{simTimeOffsetHours > 0 ? '−' : '+'}{formatDTE(Math.abs(simTimeOffsetHours))} decay</span>}
                        {simVolatilityOffset !== 0 && <span className="sim-param">Vol {simVolatilityOffset > 0 ? '+' : ''}{simVolatilityOffset.toFixed(1)}</span>}
                        {!isSimActive && timeMachineEnabled && <span className="sim-param">ready</span>}
                      </span>
                    </div>
                  </>
                )}
              </div>
        </div>

        {/* Risk Graph Backdrop Settings (local display config — VP, GEX, Structural Lines) */}
        <RiskGraphBackdropSettings
          isOpen={showDGSettings}
          onClose={() => setShowDGSettings(false)}
          vpConfig={volumeProfileConfig}
          gexConfig={gexConfig}
          onVpChange={setVpConfig}
          onGexChange={setGexConfig}
          onSaveDefault={saveAsDefault}
          onResetToFactory={resetToFactoryDefaults}
        />

        {/* Alert Designer Panel */}
        <AlertDesigner
          isOpen={designerOpen}
          onClose={() => { setDesignerOpen(false); setEditingCanonicalAlertId(null); }}
          onSave={handleDesignerSave}
          strategies={designerStrategies}
          spotPrice={simulatedSpot}
          totalPnL={alertTotalPnL}
          delta={pnlChartData.delta}
          gamma={pnlChartData.gamma}
          theta={pnlChartData.theta}
          strategyPnLAtSpot={alertStrategyPnLAtSpot}
          initialType={designerInitialType}
          initialValue={designerInitialValue}
          initialCondition={designerInitialCondition}
          initialStrategyId={designerInitialStrategyId}
          editingAlert={designerEditingAlert}
        />

        {/* Legacy PositionAlertDialog removed — all alerts use AlertDesigner */}

        {/* Curve context menu (position picker) */}
        {curveMenu && (
          <div
            className="pnl-context-menu"
            style={{
              position: 'fixed',
              left: curveMenu.x,
              top: curveMenu.y,
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              background: 'var(--bg-elevated, #2c2c2e)',
              borderRadius: 8,
              padding: '4px 0',
              minWidth: 220,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              border: '1px solid var(--border-secondary, rgba(255,255,255,0.1))',
            }}
            onMouseLeave={closeCurveMenu}
          >
            <div
              style={{
                padding: '6px 12px',
                fontSize: 11,
                color: 'var(--text-tertiary, #98989d)',
                borderBottom: '1px solid var(--border-secondary, rgba(255,255,255,0.08))',
                marginBottom: 2,
              }}
            >
              P&L: {curveMenu.pnl >= 0 ? '+' : ''}${curveMenu.pnl.toFixed(0)} at ${curveMenu.price.toFixed(0)}
            </div>
            {strategies.filter(s => s.visible).map(s => {
              const legs = s.legs || strategyToLegs(s.strategy, s.side, s.strike, s.width, s.expiration);
              const sorted = [...legs].sort((a, b) => a.strike - b.strike);
              const strikeLabel = sorted.map(l => l.strike).join('/');
              return (
                <button
                  key={s.id}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary, #f5f5f7)',
                    fontSize: 13,
                    textAlign: 'left',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--bg-hover, rgba(255,255,255,0.08))'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.background = 'none'; }}
                  onClick={() => handlePickPositionForAlert(s.id)}
                >
                  {s.symbol || 'SPX'} {strikeLabel}
                </button>
              );
            })}
          </div>
        )}
    </div>
  );
});

export default RiskGraphPanel;
