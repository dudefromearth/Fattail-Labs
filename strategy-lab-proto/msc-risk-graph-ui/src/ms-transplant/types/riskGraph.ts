// types/riskGraph.ts — Transplant stub (inlined @market-swarm/core types)

// ============================================================
// Core types (inlined from @market-swarm/core)
// ============================================================

export type PositionType =
  | 'single' | 'vertical' | 'calendar' | 'diagonal'
  | 'butterfly' | 'bwb' | 'condor'
  | 'straddle' | 'strangle'
  | 'iron_fly' | 'iron_condor'
  | 'custom';

export type PositionDirection = 'long' | 'short';
export type OptionRight = 'call' | 'put';
export type CostBasisType = 'debit' | 'credit';

export interface PositionLeg {
  strike: number;
  expiration: string;
  right: OptionRight;
  quantity: number;
  implied_volatility?: number;  // per-leg IV from chain at creation (used when live chain unavailable)
}

export interface ImportSource {
  type: string;
  id?: string;
  timestamp?: string;
}

export interface ImportMetadata {
  source: ImportSource;
  importedAt: string;
}

export interface Position {
  id: string;
  symbol: string;
  legs: PositionLeg[];
  positionType: PositionType;
  direction: PositionDirection;
  costBasis?: number | null;
  costBasisType?: CostBasisType;
  createdAt: string;
  updatedAt?: string;
  importMetadata?: ImportMetadata;
}

export const POSITION_TYPE_LABELS: Record<PositionType, string> = {
  single: 'Single',
  vertical: 'Vertical',
  calendar: 'Calendar',
  diagonal: 'Diagonal',
  butterfly: 'Butterfly',
  bwb: 'BWB',
  condor: 'Condor',
  straddle: 'Straddle',
  strangle: 'Strangle',
  iron_fly: 'Iron Fly',
  iron_condor: 'Iron Condor',
  custom: 'Custom',
};

export const POSITION_TYPE_CODES: Record<PositionType, string> = {
  single: 'SGL',
  vertical: 'VRT',
  calendar: 'CAL',
  diagonal: 'DIG',
  butterfly: 'BF',
  bwb: 'BWB',
  condor: 'CDR',
  straddle: 'STR',
  strangle: 'SRG',
  iron_fly: 'IF',
  iron_condor: 'IC',
  custom: 'CST',
};

export const POSITION_TYPE_COLORS: Record<PositionType, string> = {
  single: '#3b82f6',
  vertical: '#22c55e',
  calendar: '#f59e0b',
  diagonal: '#8b5cf6',
  butterfly: '#ec4899',
  bwb: '#f97316',
  condor: '#06b6d4',
  straddle: '#ef4444',
  strangle: '#d946ef',
  iron_fly: '#14b8a6',
  iron_condor: '#6366f1',
  custom: '#6b7280',
};

// ============================================================
// Legacy types
// ============================================================

export type StrategyType = 'single' | 'vertical' | 'butterfly';
export type Side = 'call' | 'put';
export type ChangeType = 'created' | 'debit_updated' | 'visibility_toggled' | 'edited' | 'deleted';

// ============================================================
// API Types
// ============================================================

export interface RiskGraphStrategy {
  id: string;
  userId: number;
  symbol: string;
  underlying: string;
  strategy: StrategyType;
  side: Side;
  strike: number;
  width: number | null;
  dte: number;
  expiration: string;
  debit: number | null;
  visible: boolean;
  sortOrder: number;
  color: string | null;
  label: string | null;
  addedAt: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiskGraphStrategyVersion {
  id: number;
  strategyId: string;
  version: number;
  debit: number | null;
  visible: boolean;
  label: string | null;
  changeType: ChangeType;
  changeReason: string | null;
  createdAt: string;
}

export interface RiskGraphTemplate {
  id: string;
  userId: number;
  name: string;
  description: string | null;
  symbol: string;
  strategy: StrategyType;
  side: Side;
  strikeOffset: number;
  width: number | null;
  dteTarget: number;
  debitEstimate: number | null;
  isPublic: boolean;
  shareCode: string | null;
  useCount: number;
  createdAt: string;
}

export interface CreateStrategyInput {
  symbol?: string;
  underlying?: string;
  strategy: StrategyType;
  side: Side;
  strike: number;
  width?: number | null;
  dte: number;
  expiration: string;
  debit?: number | null;
  visible?: boolean;
  sortOrder?: number;
  color?: string | null;
  label?: string | null;
  addedAt?: number;
}

export interface UpdateStrategyInput {
  debit?: number | null;
  visible?: boolean;
  sortOrder?: number;
  color?: string | null;
  label?: string | null;
  changeReason?: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string | null;
  symbol?: string;
  strategy: StrategyType;
  side: Side;
  strikeOffset?: number;
  width?: number | null;
  dteTarget: number;
  debitEstimate?: number | null;
  isPublic?: boolean;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string | null;
}

export interface UseTemplateInput {
  spotPrice: number;
  underlying?: string;
  debit?: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

export interface StrategiesListResponse extends ApiResponse<RiskGraphStrategy[]> { count: number; }
export interface StrategyResponse extends ApiResponse<RiskGraphStrategy> {}
export interface VersionsListResponse extends ApiResponse<RiskGraphStrategyVersion[]> { count: number; }
export interface TemplatesListResponse extends ApiResponse<RiskGraphTemplate[]> { count: number; }
export interface TemplateResponse extends ApiResponse<RiskGraphTemplate> {}
export interface ExportResponse extends ApiResponse<{ strategies: RiskGraphStrategy[]; exportedAt: string; count: number; }> {}
export interface ShareCodeResponse extends ApiResponse<{ shareCode: string; }> {}

export type RiskGraphEventType = 'strategy_added' | 'strategy_updated' | 'strategy_removed';

export interface RiskGraphSSEEvent {
  type: RiskGraphEventType;
  data: RiskGraphStrategy | { id: string };
  ts: string;
}

export interface RiskGraphPosition extends Position {}

export interface LegacyRiskGraphStrategy {
  id: string;
  strategy: StrategyType;
  side: Side;
  strike: number;
  width: number;
  dte: number;
  expiration: string;
  debit: number | null;
  visible: boolean;
  addedAt: number;
  symbol?: string;
}

export function toLegacyStrategy(s: RiskGraphStrategy): LegacyRiskGraphStrategy {
  return {
    id: s.id,
    strategy: s.strategy,
    side: s.side,
    strike: s.strike,
    width: s.width ?? 0,
    dte: s.dte,
    expiration: s.expiration,
    debit: s.debit,
    visible: s.visible,
    addedAt: s.addedAt,
    symbol: s.symbol,
  };
}

export function fromLegacyStrategy(s: LegacyRiskGraphStrategy, _userId: number): CreateStrategyInput {
  return {
    symbol: s.symbol ?? 'SPX',
    underlying: `I:${s.symbol ?? 'SPX'}`,
    strategy: s.strategy,
    side: s.side,
    strike: s.strike,
    width: s.width || null,
    dte: s.dte,
    expiration: s.expiration,
    debit: s.debit,
    visible: s.visible,
    addedAt: s.addedAt,
  };
}
