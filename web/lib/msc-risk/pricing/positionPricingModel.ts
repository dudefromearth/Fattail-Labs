/**
 * Minimal type surface for optional pricingResult path.
 * Labs uses the standalone BSM path (pricingResult undefined).
 */

export type IvTier = 1 | 2 | 3 | 4 | 5 | 6;

export interface ResolvedLeg {
  strike: number;
  option_type: "call" | "put";
  expiration: string;
  quantity: number;
  entry_price: number;
  iv: number;
  ivTier: IvTier;
  T: number;
}

export interface PnLPoint {
  price: number;
  pnl: number;
}

export interface GridSlice {
  t: number;
  points: PnLPoint[];
  segments: [number, number][];
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface BreakevenSet {
  zeroCrossings: number[];
  maxProfit: number;
  maxLoss: number;
}

export interface PositionModel {
  intentId: string;
  isExpired: boolean;
  currentSlice: GridSlice;
  expirySlice: GridSlice;
  resolvedLegs: ResolvedLeg[];
  netDebit: number;
  greeks: Greeks;
  iv: number;
}

export interface PositionPricingResult {
  models: PositionModel[];
  aggregateBreakevens: BreakevenSet;
}
