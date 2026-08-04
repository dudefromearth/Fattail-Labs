/* Risk Graph & Trade Simulator — TypeScript Types */

export interface LegInput {
  strike: number;
  type: 'call' | 'put';
  quantity: number;
  side: 'long' | 'short';
  entry_price: number;
  expiration?: string;  // per-leg override (calendar/diagonal spreads)
  volatility?: number;  // per-leg IV from chain snapshot (sent to server for skew-accurate pricing)
}

export interface PositionInput {
  underlying: string;
  expiration: string;
  contracts: number;
  legs: LegInput[];
  /** Per-share magnitude of package debit/credit; sign comes from direction / leg net. */
  net_debit_override?: number | null;
  /**
   * PositionBuilder Buy/Sell. Used at commit when leg prices are zero so
   * price_side is not forced to debit (sell ⇒ credit).
   */
  direction?: 'buy' | 'sell';
}

export interface PriceLadderConfig {
  percent_range: number;
  steps: number;
}

export interface ScenarioConfig {
  label: string;
  volatility?: number;
  time_to_expiry_days?: number;
  spot_price?: number;
  risk_free_rate?: number;
}

export interface ConvexityResult {
  portfolio_delta: number;
  portfolio_gamma: number;
  portfolio_vega: number;
  portfolio_theta: number;
  price_grid: number[];
  pnl_curve: number[];
  max_positive_curvature: number;
  max_negative_curvature: number;
  curvature_flip_points: number[];
  convexity_bias_ratio: number;
  convexity_profile: string;
}

export interface ScenarioResult {
  label: string;
  engine_version: string;
  convexity: ConvexityResult;
  commission: null;
  margin: null;
}

export interface StrategyInfo {
  family: string;
  label: string;
  auto_detected: boolean;
}

export interface ComputeResponse {
  results: ScenarioResult[];
  strategy: StrategyInfo;
}

export interface ComputeError {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

// Persisted position from API
export interface SavedPosition {
  id: string;
  label: string;
  notation: string;
  underlying: string;
  positionConfig: PositionInput;
  lastComputeConfig: RiskGraphConfig | null;
  lastComputeResult: ComputeResponse | null;
  createdAt: string;
  updatedAt: string;
}

// Multi-position compute response
export interface MultiComputeResponse {
  combined: { results: ScenarioResult[] };
  individual: Array<{
    strategy: StrategyInfo;
    results: ScenarioResult[];
  }>;
  strategy: null;
}

// Union: single or multi response
export type ComputeResponseEnvelope = ComputeResponse | MultiComputeResponse;

// Type guard
export function isMultiResponse(r: ComputeResponseEnvelope): r is MultiComputeResponse {
  return 'combined' in r && 'individual' in r;
}

// ---------------------------------------------------------------------------
// Order / Trade types
// ---------------------------------------------------------------------------

export type TradeStatus = 'ANALYSIS' | 'PENDING' | 'OPEN' | 'PARTIAL_OPEN' | 'CLOSED' | 'CANCELLED' | 'REJECTED';

export interface TradeRecord {
  id: string;
  position_id: string | null;
  status: TradeStatus;
  entry_cost: number | null;
  realized_pnl: number | null;
  unrealized_pnl: number | null;
  fill_snapshot: FillSnapshot[] | null;
  order_snapshot: OrderSnapshot;
  underlying: string | null;
  strategy_label: string | null;
  order_action: string | null;
  order_type: string | null;
  created_at: string;
  closed_at: string | null;
}

export interface FillSnapshot {
  fill_id: string;
  leg_id: string;
  fill_price: number;
  slippage: number;
  commission: number;
  fees: number;
  filled: boolean;
  filled_at: string;
}

export interface OrderSnapshot {
  order_id: string;
  order_type: string;
  limit_price: number | null;
  time_in_force: string;
  order_action: string;
  legs: Array<{ contract_id: string; quantity: number }>;
}

export interface OrderPreview {
  total_commission: number;
  total_fees: number;
  estimated_net_debit: number;
  fills: FillSnapshot[];
}

export interface SubmitResult {
  trade_id: string;
  order_id: string;
  broker_order_id?: string;
  status: string;
  entry_cost?: number;
  reject_reason?: string;
  fills?: FillSnapshot[];
}

export type OrderFlowState =
  | 'hidden'
  | 'preview_loading'
  | 'preview_ready'
  | 'submitting'
  | 'filled'
  | 'error';

export type TemplateType =
  | 'single' | 'vertical'
  | 'butterfly' | 'bwb' | 'condor'
  | 'straddle' | 'strangle' | 'iron_fly' | 'iron_condor'
  | 'calendar' | 'diagonal';

// ---------------------------------------------------------------------------
// UI-local position (localStorage persistence, thin layer)
// ---------------------------------------------------------------------------

export interface UiLeg {
  qty: number;             // signed: +1, -2
  strike: number;
  type: 'call' | 'put';
  expiry: string;
  entryPrice?: number;     // midpoint at creation (dollars per contract)
}

export interface UiPosition {
  id: string;
  symbol: string;
  strategy: string;        // From dialog selection ONLY. No auto-classify.
  legs: UiLeg[];
  quantity: number;        // position multiplier (number of spreads)
  price_side: 'debit' | 'credit';
  dte: number;             // days to expiration at creation
  priceValue: number;      // editable entry/cost basis (absolute, always >= 0)
  frozenPrice: number;     // spot at creation time
  createdAt: string;
  label: string;           // e.g. "SPX Long Call Butterfly 0D"
  notation: string;        // e.g. "+1 6785C / -2 6815C / +1 6845C"
  // Legacy fields (read from old localStorage, not written on new creates)
  side?: string;
  debitCredit?: number;
}

export interface RiskGraphConfig {
  spotPrice: number;
  volatility: number;
  riskFreeRate: number;
  timeToExpiryDays: number;
  priceLadder: PriceLadderConfig;
}

// ---------------------------------------------------------------------------
// GEX (Gamma Exposure) overlay data
// ---------------------------------------------------------------------------

export interface GexData {
  symbol: string;
  ts: number | null;
  strikes: number[];
  call_gex: number[];
  put_gex: number[];
  net_gex: number[];
}
