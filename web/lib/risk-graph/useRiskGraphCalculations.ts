/**
 * useRiskGraphCalculations - Transplanted from MarketSwarm
 *
 * Full options pricing engine with:
 * - Black-Scholes with empirical volatility skew
 * - Heston Stochastic Volatility Model
 * - Monte Carlo simulation (GBM + Heston dynamics)
 * - 7 market regime presets (normal, low_vol, elevated, panic, fomc, meme, opex)
 * - Per-leg Greeks (delta, gamma, theta)
 * - Expiration P&L (piecewise linear) + Theoretical P&L (smooth curves)
 * - Calendar/diagonal support (per-leg time to expiry)
 * - Breakeven interpolation
 *
 * Adapted for MSC: @market-swarm/core types inlined, resolveSpotKey inlined.
 */

import { useMemo, useRef } from 'react';
import type { ChainIVMap } from './useChainIV';
import { bsPrice, normCdf, normPdf } from './blackScholes';
import type { PositionPricingResult } from './pricing/positionPricingModel';

// ============================================================
// Inlined types from @market-swarm/core
// ============================================================

export type OptionRight = 'call' | 'put';

export interface PositionLeg {
  strike: number;
  expiration: string;
  right: OptionRight;
  quantity: number; // positive = long, negative = short
  implied_volatility?: number;  // per-leg IV from chain at creation; used as fallback when live chain unavailable
  fillPrice?: number;
  fillDate?: string;
  commission?: number;
  fees?: number;
}

export type PositionType =
  | 'single' | 'vertical' | 'calendar' | 'diagonal'
  | 'butterfly' | 'bwb' | 'condor' | 'straddle' | 'strangle'
  | 'iron_fly' | 'iron_condor' | 'custom';

export type PositionDirection = 'long' | 'short';
export type CostBasisType = 'debit' | 'credit';

// ============================================================
// Inlined resolveSpotKey (hardcoded index map, no registry)
// ============================================================

const INDEX_MAP: Record<string, string> = {
  'SPX': 'I:SPX', 'SPXW': 'I:SPX', 'NDXP': 'I:NDX',
  'NDX': 'I:NDX', 'VIX': 'I:VIX', 'RUT': 'I:RUT', 'XSP': 'I:XSP',
};

function resolveSpotKey(positionSymbol: string): string {
  return INDEX_MAP[positionSymbol] || positionSymbol;
}

// ============================================================
// Market Regime Types & Presets
// ============================================================

export type MarketRegime =
  | 'normal' | 'low_vol' | 'elevated' | 'panic' | 'fomc' | 'meme' | 'opex';

export interface RegimeConfig {
  name: string;
  description: string;
  vixRange: [number, number];
  putSkew: number;
  callSkew: number;
  atmBoost: number;
  color: string;
}

export const MARKET_REGIMES: Record<MarketRegime, RegimeConfig> = {
  normal: {
    name: 'Normal', description: 'Typical trading day',
    vixRange: [14, 18], putSkew: 0.15, callSkew: 0.03, atmBoost: 0, color: '#6b7280',
  },
  low_vol: {
    name: 'Low Vol', description: 'Complacent, cheap options',
    vixRange: [10, 14], putSkew: 0.10, callSkew: 0.02, atmBoost: 0, color: '#22c55e',
  },
  elevated: {
    name: 'Elevated', description: 'Heightened fear, steep skew',
    vixRange: [22, 30], putSkew: 0.30, callSkew: 0.05, atmBoost: 0, color: '#f59e0b',
  },
  panic: {
    name: 'Panic', description: 'Crash/crisis mode',
    vixRange: [35, 60], putSkew: 0.50, callSkew: 0.08, atmBoost: 0.05, color: '#ef4444',
  },
  fomc: {
    name: 'FOMC/Event', description: 'Binary event, elevated ATM',
    vixRange: [18, 26], putSkew: 0.12, callSkew: 0.12, atmBoost: 0.08, color: '#8b5cf6',
  },
  meme: {
    name: 'Squeeze', description: 'Call skew inverted, OTM calls expensive',
    vixRange: [30, 50], putSkew: 0.10, callSkew: 0.40, atmBoost: 0.10, color: '#ec4899',
  },
  opex: {
    name: 'Opex', description: 'Expiration dynamics, gamma dominant',
    vixRange: [12, 20], putSkew: 0.08, callSkew: 0.08, atmBoost: -0.03, color: '#06b6d4',
  },
};

// ============================================================
// Pricing Model Types & Configurations
// ============================================================

export type PricingModel = 'black-scholes' | 'heston' | 'monte-carlo';

export interface PricingModelConfig {
  name: string;
  shortName: string;
  description: string;
  color: string;
}

export const PRICING_MODELS: Record<PricingModel, PricingModelConfig> = {
  'black-scholes': {
    name: 'Black-Scholes + Skew', shortName: 'BS',
    description: 'Fast analytical solution with empirical skew adjustment', color: '#3b82f6',
  },
  'heston': {
    name: 'Heston Stochastic Vol', shortName: 'Heston',
    description: 'Volatility follows its own random process with mean reversion', color: '#8b5cf6',
  },
  'monte-carlo': {
    name: 'Monte Carlo', shortName: 'MC',
    description: 'Simulates thousands of price paths for maximum accuracy', color: '#f59e0b',
  },
};

export interface HestonParams {
  kappa: number;
  theta: number;
  xi: number;
  rho: number;
  v0: number;
}

export interface MonteCarloParams {
  numPaths: number;
  numSteps: number;
  seed?: number;
}

export const DEFAULT_HESTON_PARAMS: Omit<HestonParams, 'theta' | 'v0'> = {
  kappa: 2.0, xi: 0.4, rho: -0.7,
};

export const DEFAULT_MONTE_CARLO_PARAMS: MonteCarloParams = {
  numPaths: 5000, numSteps: 100,
};

// ============================================================
// Volatility Skew
// ============================================================

function calculateSkewedIV(
  baseIV: number, strike: number, spotPrice: number, regime: RegimeConfig
): number {
  const moneyness = (strike - spotPrice) / spotPrice;
  let skewAdjustment = 0;

  if (moneyness < 0) {
    skewAdjustment = regime.putSkew * Math.abs(moneyness) * 10;
  } else if (moneyness > 0) {
    skewAdjustment = regime.callSkew * moneyness * 10;
  }

  const atmDistance = Math.abs(moneyness);
  const atmFactor = Math.exp(-atmDistance * atmDistance * 50);
  const atmAdjustment = regime.atmBoost * atmFactor;

  return baseIV * (1 + skewAdjustment + atmAdjustment);
}

// ============================================================
// Strategy type (MS legacy + leg-based)
// ============================================================

export interface Strategy {
  id: string;
  strike: number;
  width: number;
  side: 'call' | 'put';
  strategy: 'butterfly' | 'vertical' | 'single';
  debit: number | null;
  visible: boolean;
  dte?: number;
  expiration?: string;
  symbol?: string;
  legs?: PositionLeg[];
  positionType?: PositionType;
  direction?: PositionDirection;
  costBasisType?: CostBasisType;
}

export interface PnLPoint {
  price: number;
  pnl: number;
}

export interface RiskGraphData {
  expirationPoints: PnLPoint[];
  theoreticalPoints: PnLPoint[];
  minPrice: number;
  maxPrice: number;
  fullMinPrice: number;
  fullMaxPrice: number;
  minPnL: number;
  maxPnL: number;
  expirationBreakevens: number[];
  theoreticalBreakevens: number[];
  theoreticalPnLAtSpot: number;
  theta: number;
  gamma: number;
  delta: number;
  allStrikes: number[];
  centerPrice: number;
  activeStrategyIds: string[];
  expiredExpirationPoints: PnLPoint[];
  expiredTheoreticalPoints: PnLPoint[];
  strategyTheoValues: Record<string, number>;
  strategyNaturalDebits: Record<string, number>;
  strategyExpirationCurves: Record<string, Array<{ price: number; pnl: number }>>;
  strategyGreeks: Record<string, { delta: number; gamma: number; theta: number }>;
  strategyPnLAtSpot: Record<string, number>;
  strategyLegVols: Record<string, (number | undefined)[]>;
}

interface UseRiskGraphCalculationsProps {
  strategies: Strategy[];
  spotPrice: number;
  vix: number;
  spotPrices?: Record<string, number>;
  weightingSpot?: number;
  timeMachineEnabled?: boolean;
  simVolatilityOffset?: number;
  simTimeOffsetHours?: number;
  simSpotPct?: number;
  panOffset?: number;
  marketRegime?: MarketRegime;
  pricingModel?: PricingModel;
  hestonVolOfVol?: number;
  hestonMeanReversion?: number;
  hestonCorrelation?: number;
  mcNumPaths?: number;
  unlockedStrategyIds?: Set<string>;
  atmIvByDte?: Record<string, number>;
  heatmapTiles?: Record<string, any>;
  chainIV?: ChainIVMap | null;
  /** Per-leg mid price lookup from chain — used for per-leg anchor offset. */
  getContractMid?: (expiration: string, strike: number, type: 'call' | 'put') => number | null;
  /** Authoritative natural prices (from live bid/ask) for unlocked positions.
   *  When present, overrides BSM reconstruction for the given strategy IDs.
   *  Keys are strategy IDs; values are per-share debit (positive for debit spreads). */
  naturalPricesOverride?: Record<string, number>;
  /**
   * Pre-computed unified pricing model from usePositionPricingModel.
   *
   * When provided and timeMachineEnabled=false, the hook reads P&L curves,
   * breakevens, and Greeks directly from this model instead of running its
   * own BSM computation. The legacy BSM path is retained for Time Machine mode
   * and for callers that do not yet supply the model.
   *
   * Pass via prop from MSRiskGraphView → RiskGraphPanel → this hook once
   * the component-level wiring is complete.
   */
  pricingResult?: PositionPricingResult;
}

// ============================================================
// Black-Scholes Implementation
// ============================================================
// normalCDF / normalPDF / blackScholesCall / blackScholesPut
// are no longer inlined here — all call sites use the canonical
// bsPrice / normCdf / normPdf imported from blackScholes.ts.

function calculateD1D2(S: number, K: number, T: number, r: number, sigma: number) {
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  return { d1, d2 };
}

export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
}

function calculateOptionGreeks(
  S: number, K: number, T: number, r: number, sigma: number, isCall: boolean
): OptionGreeks {
  const minT = 1 / (365 * 24 * 2);
  if (T <= minT || sigma <= 0.001 || S <= 0 || K <= 0) {
    if (T <= 0) {
      const itm = isCall ? S > K : S < K;
      return { delta: itm ? (isCall ? 1 : -1) : 0, gamma: 0, theta: 0 };
    }
    T = minT;
  }
  const { d1, d2 } = calculateD1D2(S, K, T, r, sigma);
  const sqrtT = Math.sqrt(T);
  const nd1 = normPdf(d1);
  const Nd1 = normCdf(d1);
  const Nd2 = normCdf(d2);
  const gamma = nd1 / (S * sigma * sqrtT);

  if (isCall) {
    const delta = Nd1;
    const thetaYear = -(S * nd1 * sigma) / (2 * sqrtT) - r * K * Math.exp(-r * T) * Nd2;
    return { delta, gamma, theta: thetaYear / 365 };
  } else {
    const delta = Nd1 - 1;
    const thetaYear = -(S * nd1 * sigma) / (2 * sqrtT) + r * K * Math.exp(-r * T) * normCdf(-d2);
    return { delta, gamma, theta: thetaYear / 365 };
  }
}

// ============================================================
// Heston Stochastic Volatility Model
// ============================================================

function hestonImpliedVol(
  baseVol: number, S: number, K: number, T: number,
  xi: number, rho: number, kappa: number
): number {
  const moneyness = Math.log(K / S);
  const sqrtT = Math.sqrt(Math.max(T, 0.001));
  const smileCurvature = xi * xi * T * 0.5;
  const smileEffect = smileCurvature * moneyness * moneyness;
  const skewEffect = -rho * xi * sqrtT * moneyness * 0.8;
  const meanReversionFactor = 1 - Math.exp(-kappa * T);
  const termAdjustment = meanReversionFactor * 0.3;
  const volAdjustment = (smileEffect + skewEffect) * (1 + termAdjustment);
  return Math.max(0.01, baseVol * (1 + volAdjustment));
}

function hestonCallPrice(
  S: number, K: number, T: number, r: number,
  v0: number, kappa: number, _theta: number, xi: number, rho: number
): number {
  if (T <= 0) return Math.max(0, S - K);
  const baseVol = Math.sqrt(v0);
  const hestonVol = hestonImpliedVol(baseVol, S, K, T, xi, rho, kappa);
  return bsPrice(S, K, T, r, hestonVol, true);
}

function hestonPutPrice(
  S: number, K: number, T: number, r: number,
  v0: number, kappa: number, _theta: number, xi: number, rho: number
): number {
  if (T <= 0) return Math.max(0, K - S);
  const baseVol = Math.sqrt(v0);
  const hestonVol = hestonImpliedVol(baseVol, S, K, T, xi, rho, kappa);
  return bsPrice(S, K, T, r, hestonVol, false);
}

// ============================================================
// Monte Carlo Simulation
// ============================================================

function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function boxMuller(random: () => number): number {
  const u1 = random();
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function _monteCarloPrice(
  S: number, K: number, T: number, r: number, sigma: number,
  isCall: boolean, numPaths: number, numSteps: number, seed: number = 42
): { price: number; stdError: number } {
  if (T <= 0) {
    return { price: isCall ? Math.max(0, S - K) : Math.max(0, K - S), stdError: 0 };
  }
  const random = mulberry32(seed);
  const dt = T / numSteps;
  const drift = (r - 0.5 * sigma * sigma) * dt;
  const diffusion = sigma * Math.sqrt(dt);
  let sumPayoffs = 0, sumPayoffsSquared = 0;

  for (let path = 0; path < numPaths; path++) {
    let price = S;
    for (let step = 0; step < numSteps; step++) {
      price *= Math.exp(drift + diffusion * boxMuller(random));
    }
    const payoff = isCall ? Math.max(0, price - K) : Math.max(0, K - price);
    sumPayoffs += payoff;
    sumPayoffsSquared += payoff * payoff;
  }

  const discountFactor = Math.exp(-r * T);
  const meanPayoff = sumPayoffs / numPaths;
  const price = discountFactor * meanPayoff;
  const variance = (sumPayoffsSquared / numPaths) - (meanPayoff * meanPayoff);
  return { price, stdError: discountFactor * Math.sqrt(variance / numPaths) };
}

export function _monteCarloHeston(
  S: number, K: number, T: number, r: number,
  v0: number, kappa: number, theta: number, xi: number, rho: number,
  isCall: boolean, numPaths: number, numSteps: number, seed: number = 42
): { price: number; stdError: number } {
  if (T <= 0) {
    return { price: isCall ? Math.max(0, S - K) : Math.max(0, K - S), stdError: 0 };
  }
  const random = mulberry32(seed);
  const dt = T / numSteps;
  const sqrtDt = Math.sqrt(dt);
  const sqrtOneMinusRhoSq = Math.sqrt(1 - rho * rho);
  let sumPayoffs = 0, sumPayoffsSquared = 0;

  for (let path = 0; path < numPaths; path++) {
    let price = S, v = v0;
    for (let step = 0; step < numSteps; step++) {
      const z1 = boxMuller(random);
      const z2 = rho * z1 + sqrtOneMinusRhoSq * boxMuller(random);
      const sqrtV = Math.sqrt(Math.max(0, v));
      v = v + kappa * (theta - v) * dt + xi * sqrtV * sqrtDt * z2;
      v = Math.max(0, v);
      price = price * Math.exp((r - 0.5 * v) * dt + sqrtV * sqrtDt * z1);
    }
    const payoff = isCall ? Math.max(0, price - K) : Math.max(0, K - price);
    sumPayoffs += payoff;
    sumPayoffsSquared += payoff * payoff;
  }

  const discountFactor = Math.exp(-r * T);
  const meanPayoff = sumPayoffs / numPaths;
  const price = discountFactor * meanPayoff;
  const variance = (sumPayoffsSquared / numPaths) - (meanPayoff * meanPayoff);
  return { price, stdError: discountFactor * Math.sqrt(variance / numPaths) };
}

// ============================================================
// Expiration P&L Calculations (Intrinsic Value)
// ============================================================

function singleOptionExpirationPnL(price: number, strike: number, side: 'call' | 'put', debit: number): number {
  return (side === 'call' ? Math.max(0, price - strike) : Math.max(0, strike - price)) - debit;
}

function verticalExpirationPnL(price: number, strike: number, width: number, side: 'call' | 'put', debit: number): number {
  if (side === 'call') {
    return Math.max(0, price - strike) - Math.max(0, price - (strike + width)) - debit;
  }
  return Math.max(0, strike - price) - Math.max(0, (strike - width) - price) - debit;
}

function butterflyExpirationPnL(price: number, centerStrike: number, width: number, side: 'call' | 'put', debit: number): number {
  const lK = centerStrike - width, uK = centerStrike + width;
  if (side === 'call') {
    return Math.max(0, price - lK) - 2 * Math.max(0, price - centerStrike) + Math.max(0, price - uK) - debit;
  }
  return Math.max(0, lK - price) - 2 * Math.max(0, centerStrike - price) + Math.max(0, uK - price) - debit;
}

function legExpirationPnL(price: number, leg: PositionLeg, primaryExpiration?: string, baseVolatility?: number): number {
  if (!primaryExpiration || !leg.expiration || leg.expiration <= primaryExpiration) {
    const intrinsic = leg.right === 'call' ? Math.max(0, price - leg.strike) : Math.max(0, leg.strike - price);
    return intrinsic * leg.quantity;
  }
  const primaryDate = new Date(primaryExpiration + 'T16:00:00');
  const legExpDate = new Date(leg.expiration + 'T16:00:00');
  const daysRemaining = Math.max(1, (legExpDate.getTime() - primaryDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeToExpiry = daysRemaining / 365;
  const vol = baseVolatility || 0.20;
  const theoreticalValue = bsPrice(price, leg.strike, timeToExpiry, 0.05, vol, leg.right === 'call');
  return theoreticalValue * leg.quantity;
}

function getLegsPrimaryExpiration(legs: PositionLeg[]): string | undefined {
  const expirations = legs.map(l => l.expiration).filter(Boolean);
  return expirations.length === 0 ? undefined : expirations.sort()[0];
}

function hasMultipleExpirations(legs: PositionLeg[]): boolean {
  return new Set(legs.map(l => l.expiration).filter(Boolean)).size > 1;
}

function calculateLegsExpirationPnL(legs: PositionLeg[], price: number, debit: number, baseVolatility?: number): number {
  const multiplier = 100;
  const primaryExp = hasMultipleExpirations(legs) ? getLegsPrimaryExpiration(legs) : undefined;
  let pnlPerShare = 0;
  for (const leg of legs) {
    pnlPerShare += legExpirationPnL(price, leg, primaryExp, baseVolatility);
  }
  return (pnlPerShare - debit) * multiplier;
}

function calculateExpirationPnL(strategy: Strategy, price: number, baseVolatility?: number): number {
  const rawDebit = strategy.debit ?? 0;
  const debit = strategy.costBasisType === 'credit' ? -Math.abs(rawDebit) : Math.abs(rawDebit);
  const multiplier = 100;

  if (strategy.legs && strategy.legs.length > 0) {
    return calculateLegsExpirationPnL(strategy.legs, price, debit, baseVolatility);
  }

  let pnlPerShare = 0;
  switch (strategy.strategy) {
    case 'single':
      pnlPerShare = singleOptionExpirationPnL(price, strategy.strike, strategy.side, debit); break;
    case 'vertical':
      pnlPerShare = verticalExpirationPnL(price, strategy.strike, strategy.width, strategy.side, debit); break;
    case 'butterfly':
      pnlPerShare = butterflyExpirationPnL(price, strategy.strike, strategy.width, strategy.side, debit); break;
  }
  return pnlPerShare * multiplier;
}

// ============================================================
// Greeks
// ============================================================

function calculateLegGreeks(
  leg: PositionLeg, price: number, baseVolatility: number, rate: number,
  timeToExpiryYears: number, spotPrice: number, regime: RegimeConfig,
  legVolatility?: number,
): OptionGreeks {
  const T = Math.max(0, timeToExpiryYears);
  // If per-leg IV provided (from chain), use it directly — skew is already embedded
  const iv = legVolatility != null ? legVolatility : calculateSkewedIV(baseVolatility, leg.strike, spotPrice, regime);
  const g = calculateOptionGreeks(price, leg.strike, T, rate, iv, leg.right === 'call');
  return {
    delta: g.delta * leg.quantity,
    gamma: g.gamma * Math.abs(leg.quantity),
    theta: g.theta * leg.quantity,
  };
}

function calculateLegsGreeks(
  legs: PositionLeg[], price: number, baseVolatility: number, rate: number,
  timeToExpiryYears: number, spotPrice: number, regime: RegimeConfig,
  legVolatilities?: (number | undefined)[],
): OptionGreeks {
  const multiplier = 100;
  let delta = 0, gamma = 0, theta = 0;
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const g = calculateLegGreeks(leg, price, baseVolatility, rate, timeToExpiryYears, spotPrice, regime, legVolatilities?.[i]);
    delta += g.delta;
    gamma += g.gamma * (leg.quantity > 0 ? 1 : -1);
    theta += g.theta;
  }
  return { delta: delta * multiplier, gamma: gamma * multiplier, theta: theta * multiplier };
}

export function calculateStrategyGreeks(
  strategy: Strategy, price: number, baseVolatility: number, rate: number,
  timeToExpiryYears: number, spotPrice: number, regime: RegimeConfig,
  legVolatilities?: (number | undefined)[],
): OptionGreeks {
  const multiplier = 100;
  const T = Math.max(0, timeToExpiryYears);

  if (strategy.legs && strategy.legs.length > 0) {
    return calculateLegsGreeks(strategy.legs, price, baseVolatility, rate, timeToExpiryYears, spotPrice, regime, legVolatilities);
  }

  const getGreeks = (K: number, isCall: boolean) => {
    const skewedIV = calculateSkewedIV(baseVolatility, K, spotPrice, regime);
    return calculateOptionGreeks(price, K, T, rate, skewedIV, isCall);
  };

  let delta = 0, gamma = 0, theta = 0;
  switch (strategy.strategy) {
    case 'single': {
      const g = getGreeks(strategy.strike, strategy.side === 'call');
      delta = g.delta; gamma = g.gamma; theta = g.theta; break;
    }
    case 'vertical': {
      if (strategy.side === 'call') {
        const lg = getGreeks(strategy.strike, true);
        const sg = getGreeks(strategy.strike + strategy.width, true);
        delta = lg.delta - sg.delta; gamma = lg.gamma - sg.gamma; theta = lg.theta - sg.theta;
      } else {
        const lg = getGreeks(strategy.strike, false);
        const sg = getGreeks(strategy.strike - strategy.width, false);
        delta = lg.delta - sg.delta; gamma = lg.gamma - sg.gamma; theta = lg.theta - sg.theta;
      }
      break;
    }
    case 'butterfly': {
      const lK = strategy.strike - strategy.width, mK = strategy.strike, uK = strategy.strike + strategy.width;
      if (strategy.side === 'call') {
        const lG = getGreeks(lK, true), mG = getGreeks(mK, true), uG = getGreeks(uK, true);
        delta = lG.delta - 2 * mG.delta + uG.delta;
        gamma = lG.gamma - 2 * mG.gamma + uG.gamma;
        theta = lG.theta - 2 * mG.theta + uG.theta;
      } else {
        const lG = getGreeks(lK, false), mG = getGreeks(mK, false), uG = getGreeks(uK, false);
        delta = uG.delta - 2 * mG.delta + lG.delta;
        gamma = uG.gamma - 2 * mG.gamma + lG.gamma;
        theta = uG.theta - 2 * mG.theta + lG.theta;
      }
      break;
    }
  }
  return { delta: delta * multiplier, gamma: gamma * multiplier, theta: theta * multiplier };
}

// ============================================================
// Theoretical P&L Calculations
// ============================================================

function getStrategyMaxValue(strategy: Strategy): number {
  switch (strategy.strategy) {
    case 'single': return Infinity;
    case 'vertical': return strategy.width;
    case 'butterfly': return strategy.width;
  }
  return Infinity;
}

export interface PricingParams {
  model: PricingModel;
  regime: RegimeConfig;
  hestonKappa: number;
  hestonXi: number;
  hestonRho: number;
  mcNumPaths: number;
  mcSeed: number;
}

function calculateLegTheoreticalValue(
  leg: PositionLeg, price: number, baseVolatility: number, rate: number,
  baseTimeYears: number, spotPrice: number, regime: RegimeConfig, primaryExpiration?: string,
  legVolatility?: number,
  legTime?: number,
  q: number = 0,
): number {
  // If per-leg time override provided (from legTimeMap, mirrors legVolatility pattern), use it directly.
  // Otherwise fall through to calendar-based time resolution for multi-expiration strategies.
  let legTimeYears: number;
  if (legTime != null) {
    legTimeYears = legTime;
  } else {
    legTimeYears = baseTimeYears;
    if (leg.expiration && primaryExpiration && leg.expiration !== primaryExpiration) {
      const now = new Date();
      const legExpDate = new Date(leg.expiration + 'T16:00:00');
      const daysToLegExp = Math.max(0.001, (legExpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      legTimeYears = daysToLegExp / 365;
    }
  }
  // If per-leg IV provided (from chain), use it directly — skew is already embedded
  const iv = legVolatility != null ? legVolatility : calculateSkewedIV(baseVolatility, leg.strike, spotPrice, regime);
  const legValue = bsPrice(price, leg.strike, legTimeYears, rate, iv, leg.right === 'call', q);
  return legValue * leg.quantity;
}

function calculateLegsTheoreticalPnL(
  legs: PositionLeg[], price: number, debit: number, baseVolatility: number,
  rate: number, baseTimeYears: number, spotPrice: number, regime: RegimeConfig,
  legVolatilities?: (number | undefined)[],
  legTimes?: (number | undefined)[],
  q: number = 0,
): number {
  const multiplier = 100;
  const primaryExp = hasMultipleExpirations(legs) ? getLegsPrimaryExpiration(legs) : undefined;
  let theoreticalValue = 0;
  for (let i = 0; i < legs.length; i++) {
    theoreticalValue += calculateLegTheoreticalValue(legs[i], price, baseVolatility, rate, baseTimeYears, spotPrice, regime, primaryExp, legVolatilities?.[i], legTimes?.[i], q);
  }
  // No clamp — matches server pricing. Per-leg chain IVs can produce slightly
  // negative net values due to skew differences; clamping creates visible kinks
  // in the theoretical curve.
  return (theoreticalValue - debit) * multiplier;
}

function calculateStrategyTheoreticalValue(
  strategy: Strategy, price: number, baseVolatility: number, rate: number,
  timeToExpiryYears: number, spotPrice: number, params: PricingParams,
  legVolatilities?: (number | undefined)[],
  legTimes?: (number | undefined)[],
): number {
  const T = Math.max(0, timeToExpiryYears);

  if (T <= 0) {
    if (strategy.legs && strategy.legs.length > 0) {
      let value = 0;
      for (const leg of strategy.legs) {
        const intrinsic = leg.right === 'call' ? Math.max(0, price - leg.strike) : Math.max(0, leg.strike - price);
        value += intrinsic * leg.quantity;
      }
      return value;
    }
    switch (strategy.strategy) {
      case 'single':
        return strategy.side === 'call' ? Math.max(0, price - strategy.strike) : Math.max(0, strategy.strike - price);
      case 'vertical':
        if (strategy.side === 'call') {
          return Math.max(0, price - strategy.strike) - Math.max(0, price - (strategy.strike + strategy.width));
        }
        return Math.max(0, strategy.strike - price) - Math.max(0, (strategy.strike - strategy.width) - price);
      case 'butterfly': {
        const lK = strategy.strike - strategy.width, mK = strategy.strike, uK = strategy.strike + strategy.width;
        if (strategy.side === 'call') {
          return Math.max(0, price - lK) - 2 * Math.max(0, price - mK) + Math.max(0, price - uK);
        }
        return Math.max(0, uK - price) - 2 * Math.max(0, mK - price) + Math.max(0, lK - price);
      }
    }
    return 0;
  }

  if (strategy.legs && strategy.legs.length > 0) {
    const primaryExp = hasMultipleExpirations(strategy.legs) ? getLegsPrimaryExpiration(strategy.legs) : undefined;
    let value = 0;
    for (let i = 0; i < strategy.legs.length; i++) {
      value += calculateLegTheoreticalValue(strategy.legs[i], price, baseVolatility, rate, T, spotPrice, params.regime, primaryExp, legVolatilities?.[i], legTimes?.[i]);
    }
    return value;
  }

  const optionCall = (K: number) => {
    const skewedIV = calculateSkewedIV(baseVolatility, K, spotPrice, params.regime);
    return bsPrice(price, K, T, rate, skewedIV, true);
  };
  const optionPut = (K: number) => {
    const skewedIV = calculateSkewedIV(baseVolatility, K, spotPrice, params.regime);
    return bsPrice(price, K, T, rate, skewedIV, false);
  };

  let value = 0;
  switch (strategy.strategy) {
    case 'single':
      value = strategy.side === 'call' ? optionCall(strategy.strike) : optionPut(strategy.strike); break;
    case 'vertical':
      value = strategy.side === 'call'
        ? optionCall(strategy.strike) - optionCall(strategy.strike + strategy.width)
        : optionPut(strategy.strike) - optionPut(strategy.strike - strategy.width);
      break;
    case 'butterfly': {
      const lK = strategy.strike - strategy.width, mK = strategy.strike, uK = strategy.strike + strategy.width;
      value = strategy.side === 'call'
        ? optionCall(lK) - 2 * optionCall(mK) + optionCall(uK)
        : optionPut(uK) - 2 * optionPut(mK) + optionPut(lK);
      break;
    }
  }
  const maxValue = getStrategyMaxValue(strategy);
  return Math.max(0, Math.min(maxValue, value));
}

function calculateTheoreticalPnL(
  strategy: Strategy, price: number, baseVolatility: number, rate: number,
  timeToExpiryYears: number, spotPrice: number, params: PricingParams,
  legVolatilities?: (number | undefined)[],
  legTimes?: (number | undefined)[],
  q: number = 0,
): number {
  const rawDebit = strategy.debit ?? 0;
  const debit = strategy.costBasisType === 'credit' ? -Math.abs(rawDebit) : Math.abs(rawDebit);
  const multiplier = 100;
  const T = Math.max(0, timeToExpiryYears);

  if (T <= 0) return calculateExpirationPnL(strategy, price, baseVolatility);

  let optionCall: (K: number) => number;
  let optionPut: (K: number) => number;
  const v0 = baseVolatility * baseVolatility;
  const theta = v0;

  switch (params.model) {
    case 'heston':
      optionCall = (K) => hestonCallPrice(price, K, T, rate, v0, params.hestonKappa, theta, params.hestonXi, params.hestonRho);
      optionPut = (K) => hestonPutPrice(price, K, T, rate, v0, params.hestonKappa, theta, params.hestonXi, params.hestonRho);
      break;
    case 'monte-carlo': {
      const mcXi = params.hestonXi * 1.2;
      optionCall = (K) => { const v = hestonImpliedVol(Math.sqrt(v0), price, K, T, mcXi, params.hestonRho, params.hestonKappa); return bsPrice(price, K, T, rate, v, true, q); };
      optionPut = (K) => { const v = hestonImpliedVol(Math.sqrt(v0), price, K, T, mcXi, params.hestonRho, params.hestonKappa); return bsPrice(price, K, T, rate, v, false, q); };
      break;
    }
    case 'black-scholes':
    default:
      optionCall = (K) => { const iv = calculateSkewedIV(baseVolatility, K, spotPrice, params.regime); return bsPrice(price, K, T, rate, iv, true, q); };
      optionPut = (K) => { const iv = calculateSkewedIV(baseVolatility, K, spotPrice, params.regime); return bsPrice(price, K, T, rate, iv, false, q); };
      break;
  }

  if (strategy.legs && strategy.legs.length > 0) {
    return calculateLegsTheoreticalPnL(strategy.legs, price, debit, baseVolatility, rate, T, spotPrice, params.regime, legVolatilities, legTimes, q);
  }

  let theoreticalValue = 0;
  switch (strategy.strategy) {
    case 'single':
      theoreticalValue = strategy.side === 'call' ? optionCall(strategy.strike) : optionPut(strategy.strike); break;
    case 'vertical':
      theoreticalValue = strategy.side === 'call'
        ? optionCall(strategy.strike) - optionCall(strategy.strike + strategy.width)
        : optionPut(strategy.strike) - optionPut(strategy.strike - strategy.width);
      break;
    case 'butterfly': {
      const lK = strategy.strike - strategy.width, mK = strategy.strike, uK = strategy.strike + strategy.width;
      theoreticalValue = strategy.side === 'call'
        ? optionCall(lK) - 2 * optionCall(mK) + optionCall(uK)
        : optionPut(uK) - 2 * optionPut(mK) + optionPut(lK);
      break;
    }
  }
  const maxValue = getStrategyMaxValue(strategy);
  theoreticalValue = Math.max(0, Math.min(maxValue, theoreticalValue));
  return (theoreticalValue - debit) * multiplier;
}

// ============================================================
// Curve Generation Helpers
// ============================================================

function getStrategyStrikeValues(strategy: Strategy): number[] {
  if (strategy.legs && strategy.legs.length > 0) return strategy.legs.map(l => l.strike);
  switch (strategy.strategy) {
    case 'single': return [strategy.strike];
    case 'vertical':
      return [strategy.strike, strategy.side === 'call' ? strategy.strike + strategy.width : strategy.strike - strategy.width];
    case 'butterfly':
      return [strategy.strike - strategy.width, strategy.strike, strategy.strike + strategy.width];
  }
  return [strategy.strike];
}

// ── Market Tile P&L (Option B) ────────────────────────────────────────────────
// Uses live market debits from heatmap tiles to drive the theoretical P&L curve,
// capturing vol skew that symmetric BS cannot model. Falls back to BS outside
// the tile strike range or when tiles are unavailable.

interface TilePoint { strike: number; marketDebit: number; tangent: number; }

function buildTileLookup(
  strat: Strategy,
  heatmapTiles: Record<string, any>,
): TilePoint[] | null {
  const prefix = `${strat.strategy}:${strat.dte ?? 0}:${strat.width}:`;
  const raw: Array<{ strike: number; marketDebit: number }> = [];

  for (const key of Object.keys(heatmapTiles)) {
    if (!key.startsWith(prefix)) continue;
    const strike = parseFloat(key.slice(prefix.length));
    if (!isFinite(strike)) continue;
    const tile = heatmapTiles[key];
    const sideData = tile?.[strat.side];
    if (!sideData) continue;
    const value = strat.strategy === 'single' ? sideData.market_mid : sideData.market_debit;
    if (value != null && value > 0) raw.push({ strike, marketDebit: value });
  }

  if (raw.length < 2) return null;
  raw.sort((a, b) => a.strike - b.strike);

  // Catmull-Rom tangents: centred finite differences, one-sided at endpoints
  const n = raw.length;
  const pts: TilePoint[] = raw.map((p, i) => {
    let tangent: number;
    if (i === 0) {
      tangent = (raw[1].marketDebit - raw[0].marketDebit) / (raw[1].strike - raw[0].strike);
    } else if (i === n - 1) {
      tangent = (raw[n - 1].marketDebit - raw[n - 2].marketDebit) / (raw[n - 1].strike - raw[n - 2].strike);
    } else {
      tangent = (raw[i + 1].marketDebit - raw[i - 1].marketDebit) / (raw[i + 1].strike - raw[i - 1].strike);
    }
    return { strike: p.strike, marketDebit: p.marketDebit, tangent };
  });
  return pts;
}

function interpolateTileValue(price: number, tileLookup: TilePoint[]): number | null {
  const first = tileLookup[0];
  const last = tileLookup[tileLookup.length - 1];
  if (price < first.strike || price > last.strike) return null;

  // Binary search for interval [lo, lo+1]
  let lo = 0, hi = tileLookup.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (tileLookup[mid].strike <= price) lo = mid; else hi = mid;
  }

  const p0 = tileLookup[lo];
  const p1 = tileLookup[hi];
  const h = p1.strike - p0.strike;
  if (h === 0) return p0.marketDebit;

  // Cubic Hermite basis
  const t = (price - p0.strike) / h;
  const t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return h00 * p0.marketDebit + h10 * h * p0.tangent + h01 * p1.marketDebit + h11 * h * p1.tangent;
}

function generatePricePoints(minPrice: number, maxPrice: number, criticalStrikes: number[], basePoints: number = 200): number[] {
  const prices = new Set<number>();
  const step = (maxPrice - minPrice) / basePoints;
  for (let i = 0; i <= basePoints; i++) prices.add(minPrice + i * step);
  const epsilon = 0.01;
  for (const strike of criticalStrikes) {
    if (strike >= minPrice && strike <= maxPrice) {
      prices.add(strike - epsilon);
      prices.add(strike);
      prices.add(strike + epsilon);
    }
  }
  return Array.from(prices).sort((a, b) => a - b);
}

export function findBreakevens(points: PnLPoint[]): number[] {
  const breakevens: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1], curr = points[i];
    if ((prev.pnl < 0 && curr.pnl >= 0) || (prev.pnl >= 0 && curr.pnl < 0)) {
      // Filter floating-point rounding artifacts (IEEE 754 noise is < 1e-10)
      if (Math.max(Math.abs(prev.pnl), Math.abs(curr.pnl)) < 0.01) continue;
      const t = Math.abs(prev.pnl) / Math.abs(curr.pnl - prev.pnl);
      breakevens.push(prev.price + t * (curr.price - prev.price));
    }
  }
  return breakevens;
}

const MIN_PRICING_DAYS = 1 / 1440; // 1 minute floor (BS needs T > 0)

export interface PricingInputs {
  stratVolMap: Map<string, number>;
  legVolMap: Map<string, (number | undefined)[]>;
  legTimeMap: Map<string, (number | undefined)[]>;
  stratTimeDaysMap: Map<string, number>;
  realTimeDaysMap: Map<string, number>;
  pricingParams: PricingParams;
  effectiveRegime: MarketRegime;
  vixVolatility: number;
  adjustedVix: number;
  timeOffsetDays: number;
}

export function buildPricingInputs(args: {
  strategies: Strategy[];
  vix: number;
  marketRegime: MarketRegime;
  chainIV: ChainIVMap | null | undefined;
  atmIvByDte: Record<string, number> | undefined;
  pricingModel: PricingModel;
  hestonVolOfVol: number;
  hestonMeanReversion: number;
  hestonCorrelation: number;
  timeMachineEnabled: boolean;
  simVolatilityOffset: number;
  simTimeOffsetHours: number;
  now?: Date;
}): PricingInputs {
  const { strategies, vix, marketRegime, chainIV, atmIvByDte, pricingModel,
    hestonVolOfVol, hestonMeanReversion, hestonCorrelation,
    timeMachineEnabled, simVolatilityOffset, simTimeOffsetHours } = args;

  // Vol offset applies whenever the slider is non-zero — not gated on the toggle.
  // simVolatilityOffset is 0 when unused, so this is a no-op in live mode.
  const adjustedVix = vix + simVolatilityOffset;
  const vixVolatility = Math.max(5, adjustedVix) / 100;

  const effectiveRegime: MarketRegime = timeMachineEnabled
    ? marketRegime
    : adjustedVix <= 14 ? 'low_vol' : adjustedVix <= 18 ? 'normal' : adjustedVix <= 30 ? 'elevated' : 'panic';
  const regimeConfig = MARKET_REGIMES[effectiveRegime];

  const pricingParams: PricingParams = {
    model: pricingModel, regime: regimeConfig,
    hestonKappa: hestonMeanReversion, hestonXi: hestonVolOfVol, hestonRho: hestonCorrelation,
    mcNumPaths: pricingModel === 'monte-carlo' ? 200 : 1000, mcSeed: 42,
  };

  const now = args.now ?? new Date();
  // Time offset applies regardless of timeMachineEnabled — the TIME slider always works.
  // VOL and SPOT offsets are still gated by timeMachineEnabled (see adjustedVix, simWs below).
  const timeOffsetDays = simTimeOffsetHours / 24;

  const realTimeDaysMap = new Map<string, number>();
  const stratTimeDaysMap = new Map<string, number>();
  for (const strat of strategies) {
    let realDays: number;
    if (strat.expiration) {
      const expDateStr = String(strat.expiration).split('T')[0];
      const expClose = new Date(expDateStr + 'T16:00:00-05:00');
      realDays = (expClose.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    } else {
      const fallbackDte = strat.dte ?? 30;
      realDays = fallbackDte === 0 ? 0.02 : fallbackDte;
    }
    realTimeDaysMap.set(strat.id, realDays);
    // Apply time offset at source — same pattern as simVolatilityOffset → adjustedVix → vixVolatility.
    // The offset is baked into the map so every downstream reader sees the adjusted value.
    stratTimeDaysMap.set(strat.id, Math.max(MIN_PRICING_DAYS, realDays - timeOffsetDays));
  }

  // Pre-compute per-leg vol arrays for each strategy — getLegVol inlined.
  // Priority cascade: chain IV → stored intent IV → ATM IV by DTE → VIX fallback.
  const legVolMap = new Map<string, (number | undefined)[]>();
  for (const strat of strategies) {
    if (strat.legs && strat.legs.length > 0) {
      const vols = strat.legs.map(leg => {
        // Priority 1: per-leg IV from live chain snapshot (skip in Time Machine)
        if (!timeMachineEnabled && chainIV && strat.expiration) {
          const expStr = String(strat.expiration).split('T')[0];
          const exactIv = chainIV.get(leg.strike, leg.right, expStr);
          if (exactIv && exactIv > 0.01 && exactIv < 5.0) return exactIv;
          const nearestIv = chainIV.getNearest(leg.strike, leg.right, expStr);
          if (nearestIv && nearestIv > 0.01 && nearestIv < 5.0) return nearestIv;
          const closestDteIv = chainIV.getClosestDTE(leg.strike, leg.right, expStr);
          if (closestDteIv && closestDteIv > 0.01 && closestDteIv < 5.0) return closestDteIv;
        }
        // Priority 2: stored per-leg IV from intent (captured from chain at position creation).
        // Provides per-leg skew accuracy when the live chain is unavailable (pre-market, after
        // hours, or when chainIV hasn't loaded yet). Skipped in Time Machine so simulated
        // volatility overrides can take effect.
        if (!timeMachineEnabled && leg.implied_volatility != null) {
          const storedIv = leg.implied_volatility;
          if (storedIv > 0.01 && storedIv < 5.0) return storedIv;
        }
        // Priority 3: ATM IV by DTE
        if (!timeMachineEnabled && atmIvByDte) {
          const dteKey = String(strat.dte ?? 0);
          const atmIv = atmIvByDte[dteKey];
          if (atmIv && atmIv > 0.01 && atmIv < 5.0) return atmIv;
        }
        // Priority 4: VIX fallback
        return vixVolatility;
      });
      legVolMap.set(strat.id, vols);
    }
  }

  // Pre-compute per-leg time arrays — mirrors legVolMap pattern exactly.
  // Time offset is already baked into stratTimeDaysMap, so each leg simply
  // inherits the strategy-level adjusted time (all legs in one expiration share T).
  const legTimeMap = new Map<string, (number | undefined)[]>();
  for (const strat of strategies) {
    if (strat.legs && strat.legs.length > 0) {
      const stratTimeDays = stratTimeDaysMap.get(strat.id) ?? 30;
      const timeYears = Math.max(stratTimeDays, MIN_PRICING_DAYS) / 365;
      legTimeMap.set(strat.id, strat.legs.map(() => timeYears));
    }
  }

  // Pre-compute per-strategy base IV — getStrategyVol inlined.
  const stratVolMap = new Map<string, number>();
  for (const strat of strategies) {
    if (!timeMachineEnabled && atmIvByDte) {
      const dteKey = String(strat.dte ?? 0);
      const atmIv = atmIvByDte[dteKey];
      if (atmIv && atmIv > 0.01 && atmIv < 5.0) {
        stratVolMap.set(strat.id, atmIv);
        continue;
      }
    }
    stratVolMap.set(strat.id, vixVolatility);
  }

  return { stratVolMap, legVolMap, legTimeMap, stratTimeDaysMap, realTimeDaysMap, pricingParams, effectiveRegime, vixVolatility, adjustedVix, timeOffsetDays };
}

// ============================================================
// Main Hook
// ============================================================

export function useRiskGraphCalculations({
  strategies,
  spotPrice,
  vix,
  spotPrices,
  weightingSpot: weightingSpotProp,
  timeMachineEnabled = false,
  simVolatilityOffset = 0,
  simTimeOffsetHours = 0,
  simSpotPct = 0,
  panOffset = 0,
  marketRegime = 'normal',
  pricingModel = 'black-scholes',
  hestonVolOfVol = 0.4,
  hestonMeanReversion = 2.0,
  hestonCorrelation = -0.7,
  mcNumPaths = 5000,
  unlockedStrategyIds,
  atmIvByDte,
  heatmapTiles,
  chainIV,
  getContractMid,
  naturalPricesOverride,
  pricingResult,
}: UseRiskGraphCalculationsProps): RiskGraphData {
  const unlockedIdsRef = useRef(unlockedStrategyIds);
  unlockedIdsRef.current = unlockedStrategyIds;
  const getContractMidRef = useRef(getContractMid);
  getContractMidRef.current = getContractMid;
  const heatmapTilesRef = useRef(heatmapTiles);
  heatmapTilesRef.current = heatmapTiles;
  const surfaceCompute = useMemo(() => {
    // ── Unified model fast path ──────────────────────────────────────────────
    // When a pre-computed PositionPricingResult is available and Time Machine
    // is off, derive all output from the model instead of running independent
    // BSM computation. This eliminates duplicate IV resolution and pricing work.
    if (pricingResult && !timeMachineEnabled && simTimeOffsetHours === 0) {
      const safeSpot = spotPrice > 0 ? spotPrice : 6000;
      const ws = (weightingSpotProp && weightingSpotProp > 0) ? weightingSpotProp : safeSpot;

      const { models, aggregateBreakevens } = pricingResult;
      const activeModels = models.filter(m => !m.isExpired);
      const expiredModels = models.filter(m => m.isExpired);

      // ── Aggregate P&L curves (shared grid) ────────────────────────────────
      const refPoints = activeModels[0]?.currentSlice.points ?? [];

      const theoreticalPoints: PnLPoint[] = refPoints.map(({ price }, i) => ({
        price,
        pnl: activeModels.reduce((sum, m) => sum + (m.currentSlice.points[i]?.pnl ?? 0), 0),
      }));

      const expirationPoints: PnLPoint[] = refPoints.map(({ price }, i) => ({
        price,
        pnl: activeModels.reduce((sum, m) => sum + (m.expirySlice.points[i]?.pnl ?? 0), 0),
      }));

      // Expired positions render at intrinsic value for both curves.
      const expRefPoints = expiredModels[0]?.expirySlice.points ?? [];
      const expiredAggPoints: PnLPoint[] = expRefPoints.map(({ price }, i) => ({
        price,
        pnl: expiredModels.reduce((sum, m) => sum + (m.expirySlice.points[i]?.pnl ?? 0), 0),
      }));
      const expiredExpirationPoints = expiredAggPoints;
      const expiredTheoreticalPoints = expiredAggPoints;

      // ── Price range ────────────────────────────────────────────────────────
      const fullMinPrice = refPoints.length > 0 ? refPoints[0].price : ws - 200;
      const fullMaxPrice = refPoints.length > 0 ? refPoints[refPoints.length - 1].price : ws + 200;

      // Collect absolute strikes for viewport computation.
      const allStrikes: number[] = [];
      for (const m of models) {
        for (const leg of m.resolvedLegs) allStrikes.push(leg.strike);
      }
      if (allStrikes.length === 0) allStrikes.push(ws);

      const minStrike = Math.min(...allStrikes);
      const maxStrike = Math.max(...allStrikes);
      const strikeRange = maxStrike - minStrike || 50;

      const centerPrice = (minStrike + maxStrike) / 2 + panOffset;
      const viewportPadding = Math.max(strikeRange * 0.5, 30);
      const minPrice = centerPrice - strikeRange / 2 - viewportPadding;
      const maxPrice = centerPrice + strikeRange / 2 + viewportPadding;

      // ── P&L extremes (viewport only) ──────────────────────────────────────
      let minPnL = Infinity, maxPnL = -Infinity;
      for (const pt of theoreticalPoints) {
        if (pt.price >= minPrice && pt.price <= maxPrice) {
          if (pt.pnl < minPnL) minPnL = pt.pnl;
          if (pt.pnl > maxPnL) maxPnL = pt.pnl;
        }
      }
      for (const pt of expirationPoints) {
        if (pt.price >= minPrice && pt.price <= maxPrice) {
          if (pt.pnl < minPnL) minPnL = pt.pnl;
          if (pt.pnl > maxPnL) maxPnL = pt.pnl;
        }
      }
      if (minPnL === Infinity) minPnL = -100;
      if (maxPnL === -Infinity) maxPnL = 100;
      const pnlRange = maxPnL - minPnL || 100;
      minPnL -= pnlRange * 0.1;
      maxPnL += pnlRange * 0.1;

      // ── Breakevens ────────────────────────────────────────────────────────
      const expirationBreakevens = findBreakevens(expirationPoints);
      const theoreticalBreakevens = aggregateBreakevens.zeroCrossings;

      // ── Spot P&L (look up nearest grid point) ────────────────────────────
      const findSpotPnL = (pts: PnLPoint[]): number => {
        if (pts.length === 0) return 0;
        const lo = pts[0].price, hi = pts[pts.length - 1].price;
        if (hi === lo) return pts[0].pnl;
        const frac = (safeSpot - lo) / (hi - lo);
        const idx = Math.max(0, Math.min(pts.length - 1, Math.round(frac * (pts.length - 1))));
        return pts[idx]?.pnl ?? 0;
      };

      let theoreticalPnLAtSpot = 0;
      const strategyPnLAtSpot: Record<string, number> = {};
      const strategyTheoValues: Record<string, number> = {};
      const strategyNaturalDebits: Record<string, number> = {};

      for (const m of activeModels) {
        const pnlAtSpot = findSpotPnL(m.currentSlice.points);
        theoreticalPnLAtSpot += pnlAtSpot;
        strategyPnLAtSpot[m.intentId] = pnlAtSpot;
        // BSM theoretical value at spot = netDebit + pnlAtSpot/100
        const theoValue = m.netDebit + pnlAtSpot / 100;
        strategyTheoValues[m.intentId] = theoValue;
        strategyNaturalDebits[m.intentId] = theoValue;
      }
      for (const m of expiredModels) {
        strategyPnLAtSpot[m.intentId] = findSpotPnL(m.expirySlice.points);
      }

      // ── Greeks ────────────────────────────────────────────────────────────
      let totalDelta = 0, totalGamma = 0, totalTheta = 0;
      const strategyGreeks: Record<string, { delta: number; gamma: number; theta: number }> = {};
      for (const m of activeModels) {
        totalDelta += m.greeks.delta;
        totalGamma += m.greeks.gamma;
        totalTheta += m.greeks.theta;
        strategyGreeks[m.intentId] = {
          delta: m.greeks.delta,
          gamma: m.greeks.gamma,
          theta: m.greeks.theta,
        };
      }

      // ── Per-strategy expiration curves ────────────────────────────────────
      const strategyExpirationCurves: Record<string, PnLPoint[]> = {};
      for (const m of [...activeModels, ...expiredModels]) {
        strategyExpirationCurves[m.intentId] = m.expirySlice.points;
      }

      // ── Per-strategy leg vols ─────────────────────────────────────────────
      const strategyLegVols: Record<string, (number | undefined)[]> = {};
      for (const m of models) {
        strategyLegVols[m.intentId] = m.resolvedLegs.map(l => l.iv);
      }

      // [DIAG] fast-path: unified model (pricingResult)
      console.log('[CURVE-WRITE]', 'source=unified-model-fast-path', Date.now(), theoreticalPoints?.length, theoreticalPoints?.[Math.floor(theoreticalPoints.length/2)]);
      console.log('[CURVE-WRITE]', 'source=unified-model-fast-path-expiry', Date.now(), expirationPoints?.length, expirationPoints?.[Math.floor(expirationPoints.length/2)]);
      return {
        expirationPoints,
        theoreticalPoints,
        minPrice,
        maxPrice,
        fullMinPrice,
        fullMaxPrice,
        minPnL,
        maxPnL,
        expirationBreakevens,
        theoreticalBreakevens,
        theoreticalPnLAtSpot,
        theta: totalTheta,
        gamma: totalGamma,
        delta: totalDelta,
        allStrikes: [...new Set(allStrikes)].sort((a, b) => a - b),
        centerPrice,
        activeStrategyIds: activeModels.map(m => m.intentId),
        expiredExpirationPoints,
        expiredTheoreticalPoints,
        strategyTheoValues,
        strategyNaturalDebits,
        strategyExpirationCurves,
        strategyGreeks,
        strategyPnLAtSpot,
        strategyLegVols,
        timeSlicedCurves: [theoreticalPoints] as PnLPoint[][], T_max: 0, NT: 1,
      };
    }
    const visibleStrategies = strategies.filter(s => s.visible);

    const safeSpot = (spotPrice && Number.isFinite(spotPrice) && spotPrice > 0) ? spotPrice : 6000;
    const ws = (weightingSpotProp && Number.isFinite(weightingSpotProp) && weightingSpotProp > 0) ? weightingSpotProp : safeSpot;

    const getStrategySpot = (strat: Strategy): number => {
      if (!spotPrices || !strat.symbol) return safeSpot;
      const key = resolveSpotKey(strat.symbol);
      const val = spotPrices[key];
      return (val && Number.isFinite(val) && val > 0) ? val : safeSpot;
    };

    if (visibleStrategies.length === 0) {
      return {
        expirationPoints: [], theoreticalPoints: [],
        minPrice: ws - 100, maxPrice: ws + 100, fullMinPrice: ws - 200, fullMaxPrice: ws + 200,
        minPnL: -100, maxPnL: 100,
        expirationBreakevens: [], theoreticalBreakevens: [],
        theoreticalPnLAtSpot: 0, theta: 0, gamma: 0, delta: 0,
        allStrikes: [], centerPrice: ws, activeStrategyIds: [],
        expiredExpirationPoints: [], expiredTheoreticalPoints: [],
        strategyTheoValues: {}, strategyNaturalDebits: {}, strategyExpirationCurves: {}, strategyGreeks: {}, strategyPnLAtSpot: {}, strategyLegVols: {},
        timeSlicedCurves: [] as PnLPoint[][], T_max: 0, NT: 0,
      };
    }

    try {
      const projectStrike = (strike: number, stratSpot: number): number => {
        const pct = (strike - stratSpot) / stratSpot;
        return ws * (1 + pct);
      };

      const projectedStrikes: number[] = [];
      for (const strat of visibleStrategies) {
        const stratSpot = getStrategySpot(strat);
        for (const strike of getStrategyStrikeValues(strat)) {
          projectedStrikes.push(projectStrike(strike, stratSpot));
        }
      }

      const allStrikes = projectedStrikes.length > 0
        ? Array.from(new Set(projectedStrikes)).sort((a, b) => a - b) : [ws];
      const minStrike = Math.min(...allStrikes);
      const maxStrike = Math.max(...allStrikes);
      const strikeRange = maxStrike - minStrike || 50;

      const now = new Date();
      const {
        stratVolMap,
        legVolMap: strategyLegVols,
        legTimeMap: strategyLegTimes,
        stratTimeDaysMap: strategyTimeDaysMap,
        realTimeDaysMap,
        pricingParams,
        effectiveRegime,
        adjustedVix,
        timeOffsetDays,
      } = buildPricingInputs({
        strategies: visibleStrategies,
        vix,
        marketRegime,
        chainIV,
        atmIvByDte,
        pricingModel,
        hestonVolOfVol,
        hestonMeanReversion,
        hestonCorrelation,
        timeMachineEnabled,
        simVolatilityOffset,
        simTimeOffsetHours: 0, // Surface is time-offset-agnostic; sliceIndex drives scrubbing
        now,
      });
      const regimeConfig = MARKET_REGIMES[effectiveRegime];

      const allTimeDays = Array.from(strategyTimeDaysMap.values());
      const baseTimeDays = allTimeDays.length > 0 ? Math.max(...allTimeDays) : 30;

      const activeStrategies = visibleStrategies.filter(strat => {
        const realDays = realTimeDaysMap.get(strat.id) ?? 0;
        if (realDays - timeOffsetDays <= 0) return false;
        // Double-check: if all legs have an expiration date in the past, treat as expired
        // even when dte fallback produces a positive realDays (dte is a snapshot, not live).
        if (!timeOffsetDays && strat.legs && strat.legs.length > 0) {
          const allLegsExpired = strat.legs.every(l => {
            if (!l.expiration) return false;
            const expClose = new Date(String(l.expiration).split('T')[0] + 'T16:00:00-05:00');
            return expClose.getTime() < now.getTime();
          });
          if (allLegsExpired) return false;
        }
        return true;
      });
      const activeStrategyIds = activeStrategies.map(s => s.id);

      const getStrategyTimeYears = (stratId: string): number => {
        const raw = strategyTimeDaysMap.get(stratId) ?? baseTimeDays;
        return Math.max(raw, MIN_PRICING_DAYS) / 365;
      };

      const riskFreeRate = 0.05;
      // Dividend yield — matches server DEFAULT_Q for SPX-family indices.
      // TODO: per-symbol lookup when multi-symbol support is added.
      const dividendYield = 0.013;

      const baseDteForRange = Math.ceil(baseTimeDays);
      const sigma1Day = ws * (adjustedVix / 100) / Math.sqrt(252);
      const sigmaPadding = sigma1Day * Math.sqrt(Math.max(baseDteForRange, 7)) * 3;
      const strategyPadding = strikeRange * 2;
      const minPadding = Math.max(ws * 0.10, 200);
      const fullPadding = Math.max(sigmaPadding, strategyPadding, minPadding);

      const fullMinPrice = Math.min(ws, minStrike) - fullPadding;
      const fullMaxPrice = Math.max(ws, maxStrike) + fullPadding;

      const centerPrice = (minStrike + maxStrike) / 2 + panOffset;
      const viewportPadding = Math.max(strikeRange * 0.5, 30);
      const minPrice = centerPrice - strikeRange / 2 - viewportPadding;
      const maxPrice = centerPrice + strikeRange / 2 + viewportPadding;

      // Spot slider is visual-only: moves the spot indicator line, never reprices curves.
      const simWs = ws;
      const criticalPrices = [...allStrikes, simWs];
      const pricePoints = generatePricePoints(fullMinPrice, fullMaxPrice, criticalPrices, timeMachineEnabled ? 200 : 800);

      const expiredStrategies = visibleStrategies.filter(s => !activeStrategyIds.includes(s.id));

      // Heatmap tile anchoring
      const getTileAnchor = (strat: Strategy): number | null => {
        if (!heatmapTilesRef.current || timeMachineEnabled) return null;
        const tileKey = `${strat.strategy}:${strat.dte ?? 0}:${strat.width}:${strat.strike}`;
        const tile = heatmapTilesRef.current[tileKey];
        if (!tile) return null;
        const sideData = tile[strat.side];
        if (!sideData) return null;
        const value = strat.strategy === 'single' ? sideData.market_mid : sideData.market_debit;
        return (value != null && value > 0) ? value : null;
      };

      // Pre-compute per-strategy constants (called once, not per price point)
      const stratTimeMap = new Map<string, number>();
      const stratSpotMap = new Map<string, number>();
      const stratSimSpotMap = new Map<string, number>();
      for (const strat of visibleStrategies) {
        const time = getStrategyTimeYears(strat.id);
        const spot = getStrategySpot(strat);
        const simSpot = spot; // spot slider is visual-only
        stratTimeMap.set(strat.id, time);
        stratSpotMap.set(strat.id, spot);
        stratSimSpotMap.set(strat.id, simSpot);
      }

      // strategyBsValues: BSM natural price at spot with per-leg IVs
      // anchorOffsets: per-leg market mid − BSM at spot.  Exactly mirrors the
      // server formula: anchor = Σ(qty × leg_mid) − Σ(qty × bsm(spot)).
      const strategyBsValues: Record<string, number> = {};
      const strategyTheoValues: Record<string, number> = {};
      const anchorOffsets: Record<string, number> = {};
      const getMid = getContractMidRef.current;
      for (const strat of activeStrategies) {
        const stratSpot = stratSpotMap.get(strat.id)!;
        const simSpot = stratSimSpotMap.get(strat.id)!;
        const bsValue = calculateStrategyTheoreticalValue(strat, simSpot, stratVolMap.get(strat.id)!, riskFreeRate, stratTimeMap.get(strat.id)!, stratSpot, pricingParams, strategyLegVols.get(strat.id), strategyLegTimes.get(strat.id));
        const storedDebit = strat.debit != null && strat.debit > 0 ? strat.debit : null;
        const minCredible = storedDebit != null ? storedDebit * 0.1 : 0.01;
        const safeBsValue = bsValue > minCredible ? bsValue : (storedDebit ?? Math.max(bsValue, 0.01));
        strategyBsValues[strat.id] = safeBsValue;
        strategyTheoValues[strat.id] = safeBsValue;
        // Anchor offset from per-leg mids (same chain data as server).
        // Falls back to spread-level cardDebits if per-leg mids unavailable.
        if (getMid && strat.legs && strat.legs.length > 0) {
          let marketNet = 0;
          let allMids = true;
          for (const leg of strat.legs) {
            const mid = getMid(leg.expiration ?? strat.expiration ?? '', leg.strike, leg.right);
            if (mid == null) { allMids = false; break; }
            marketNet += leg.quantity * mid;
          }
          if (allMids) {
            anchorOffsets[strat.id] = marketNet - safeBsValue;
          }
        }
        // Fallback: use cardDebits if per-leg mids weren't available
        if (anchorOffsets[strat.id] == null) {
          const cardMid = naturalPricesOverride?.[strat.id];
          if (cardMid != null && cardMid > 0 && safeBsValue > 0) {
            anchorOffsets[strat.id] = cardMid - safeBsValue;
          }
        }
      }

      // Build market tile lookups for Option B — one sorted array per strategy
      const strategyTileLookups = new Map<string, TilePoint[] | null>();
      if (!timeMachineEnabled && heatmapTilesRef.current) {
        for (const strat of activeStrategies) {
          strategyTileLookups.set(strat.id, buildTileLookup(strat, heatmapTilesRef.current));
        }
      }

      const getEffectiveDebit = (strat: Strategy): number => {
        // Single source of truth: naturalPricesOverride is the cardDebits map
        // emitted by the position card.  It covers BOTH locked and unlocked
        // positions — the chart simply shows whatever the card shows.
        // Falls back to strat.debit then BSM only if the map is missing the entry.
        // Return absolute value: sign is communicated via costBasisType, not here.
        const override = naturalPricesOverride?.[strat.id];
        if (override != null && override > 0) return override;
        if (strat.debit != null) return strat.debit;
        return Math.abs(strategyBsValues[strat.id] ?? 0);
      };

      // Calculate P&L curves
      const expirationPoints: PnLPoint[] = [];
      const theoreticalPoints: PnLPoint[] = [];
      const expiredExpirationPoints: PnLPoint[] = [];
      const expiredTheoreticalPoints: PnLPoint[] = [];
      let minPnL = Infinity, maxPnL = -Infinity;

      const stratExpCurves: Record<string, PnLPoint[]> = {};
      for (const strat of [...activeStrategies, ...expiredStrategies]) {
        stratExpCurves[strat.id] = [];
      }

      for (const price of pricePoints) {
        const pctFromIndex = (price - ws) / ws;

        let expPnL = 0;
        for (const strat of activeStrategies) {
          const stratSpot = stratSpotMap.get(strat.id)!;
          const stratPrice = stratSpot * (1 + pctFromIndex);
          // Rebuild debit when unlocked or when stored debit is null.
          // Always rebuild debit from cardDebits (single source of truth from
          // the position card).  Do NOT strip costBasisType: credit spreads
          // rely on it for sign convention.
          const effectiveStrat = { ...strat, debit: getEffectiveDebit(strat) };
          const stratVol = stratVolMap.get(strat.id)!;
          const stratExpPnL = calculateExpirationPnL(effectiveStrat, stratPrice, stratVol);
          expPnL += stratExpPnL;
          stratExpCurves[strat.id].push({ price, pnl: stratExpPnL });
        }
        if (activeStrategies.length > 0) expirationPoints.push({ price, pnl: expPnL });

        let theoPnL = 0;
        for (const strat of activeStrategies) {
          const stratSpot = stratSpotMap.get(strat.id)!;
          const stratPrice = stratSpot * (1 + pctFromIndex);
          // Rebuild debit when unlocked or when stored debit is null.
          // Always rebuild debit from cardDebits (single source of truth from
          // the position card).  Do NOT strip costBasisType: credit spreads
          // rely on it for sign convention.
          const effectiveStrat = { ...strat, debit: getEffectiveDebit(strat) };
          let stratTheoPnL = calculateTheoreticalPnL(effectiveStrat, stratPrice, stratVolMap.get(strat.id)!, riskFreeRate, stratTimeMap.get(strat.id)!, stratSpot, pricingParams, strategyLegVols.get(strat.id), strategyLegTimes.get(strat.id), dividendYield);
          // Anchor offset: shift BSM curve to pass through market mid at spot.
          const anchor = anchorOffsets[strat.id];
          if (anchor != null) stratTheoPnL += anchor * 100;
          // Floor: theoretical P&L can never be worse than the full debit paid.
          // Tile-anchor offset shifts the curve but cannot push it below max loss.
          const effectiveDebitAbs = Math.abs(getEffectiveDebit(effectiveStrat));
          stratTheoPnL = Math.max(-(effectiveDebitAbs * 100), stratTheoPnL);
          theoPnL += stratTheoPnL;
        }
        if (activeStrategies.length > 0) theoreticalPoints.push({ price, pnl: theoPnL });

        if (expiredStrategies.length > 0) {
          let expiredExpPnL = 0, expiredTheoPnL = 0;
          for (const strat of expiredStrategies) {
            const stratSpot = stratSpotMap.get(strat.id)!;
            const stratPrice = stratSpot * (1 + pctFromIndex);
            const ep = calculateExpirationPnL(strat, stratPrice, stratVolMap.get(strat.id)!);
            expiredExpPnL += ep;
            expiredTheoPnL += ep;
            stratExpCurves[strat.id].push({ price, pnl: ep });
          }
          expiredExpirationPoints.push({ price, pnl: expiredExpPnL });
          expiredTheoreticalPoints.push({ price, pnl: expiredTheoPnL });
        }

        if (price >= minPrice && price <= maxPrice) {
          minPnL = Math.min(minPnL, expPnL, theoPnL);
          maxPnL = Math.max(maxPnL, expPnL, theoPnL);
        }
      }

      if (minPnL === Infinity) minPnL = -100;
      if (maxPnL === -Infinity) maxPnL = 100;
      const pnlRange = maxPnL - minPnL || 100;
      minPnL -= pnlRange * 0.1;
      maxPnL += pnlRange * 0.1;

      const expirationBreakevens = findBreakevens(expirationPoints);
      const theoreticalBreakevens = findBreakevens(theoreticalPoints);

      // ── Pre-compute time slices (exact 3D mechanism, different view direction) ──
      // NT curves covering the full DTE range using the same quadratic spacing as 3D.
      // Slice 0 = today (elapsed=0) = theoreticalPoints already computed above.
      // Slider picks the row via sliceIndex — zero BSM recalculation on slider move.
      const NT_SLICES = 20;
      const T_max = Math.max(...Array.from(realTimeDaysMap.values()), 0.001);
      const timeSlices2D = Array.from({ length: NT_SLICES }, (_, i) => {
        const u = i / (NT_SLICES - 1);
        return T_max * u * (2 - u); // same quadratic as 3D — denser near today
      });
      const timeSlicedCurves: PnLPoint[][] = [theoreticalPoints];
      for (let si = 1; si < NT_SLICES; si++) {
        const elapsed = timeSlices2D[si];
        const sliceCurve: PnLPoint[] = [];
        for (const price of pricePoints) {
          const pctFromIndex = (price - ws) / ws;
          let theoPnL = 0;
          for (const strat of activeStrategies) {
            const stratSpot = stratSpotMap.get(strat.id)!;
            const stratPrice = stratSpot * (1 + pctFromIndex);
            const realDays = realTimeDaysMap.get(strat.id) ?? 0;
            const remaining = Math.max(0, realDays - elapsed);
            const T = Math.max(remaining, MIN_PRICING_DAYS) / 365;
            // Always rebuild from cardDebits — single source of truth from card.
            const effectiveStrat = { ...strat, debit: getEffectiveDebit(strat) };
            let stratTheoPnL = calculateTheoreticalPnL(
              effectiveStrat, stratPrice, stratVolMap.get(strat.id)!, riskFreeRate, T,
              stratSpot, pricingParams, strategyLegVols.get(strat.id), undefined, dividendYield,
            );
            const anchor = anchorOffsets[strat.id];
            if (anchor != null) stratTheoPnL += anchor * 100;
            stratTheoPnL = Math.max(-(Math.abs(getEffectiveDebit(effectiveStrat)) * 100), stratTheoPnL);
            theoPnL += stratTheoPnL;
          }
          sliceCurve.push({ price, pnl: theoPnL });
        }
        timeSlicedCurves.push(sliceCurve);
      }

      const spotPricingParams = { ...pricingParams, mcNumPaths: pricingModel === 'monte-carlo' ? Math.min(mcNumPaths, 1000) : 1000 };
      let theoreticalPnLAtSpot = 0;
      const strategyPnLAtSpot: Record<string, number> = {};

      for (const strat of activeStrategies) {
        const effectiveDebit = getEffectiveDebit(strat);
        if (effectiveDebit <= 0) { strategyPnLAtSpot[strat.id] = 0; continue; }
        const stratSpot = stratSpotMap.get(strat.id)!;
        const stratSimulatedSpot = stratSimSpotMap.get(strat.id)!;
        const effectiveStrat = { ...strat, debit: effectiveDebit };
        let stratPnL = calculateTheoreticalPnL(effectiveStrat, stratSimulatedSpot, stratVolMap.get(strat.id)!, riskFreeRate, stratTimeMap.get(strat.id)!, stratSpot, spotPricingParams, strategyLegVols.get(strat.id), strategyLegTimes.get(strat.id), dividendYield);
        const anchor = anchorOffsets[strat.id];
        if (anchor != null) stratPnL += anchor * 100;
        theoreticalPnLAtSpot += stratPnL;
        strategyPnLAtSpot[strat.id] = stratPnL;
      }
      for (const strat of expiredStrategies) {
        const stratSimulatedSpot = stratSimSpotMap.get(strat.id)!;
        strategyPnLAtSpot[strat.id] = calculateExpirationPnL(strat, stratSimulatedSpot, stratVolMap.get(strat.id)!);
      }

      let totalDelta = 0, totalGamma = 0, totalTheta = 0;
      const strategyGreeks: Record<string, { delta: number; gamma: number; theta: number }> = {};
      for (const strat of activeStrategies) {
        const stratSpot = stratSpotMap.get(strat.id)!;
        const stratSimulatedSpot = stratSimSpotMap.get(strat.id)!;
        const greeks = calculateStrategyGreeks(strat, stratSimulatedSpot, stratVolMap.get(strat.id)!, riskFreeRate, stratTimeMap.get(strat.id)!, stratSpot, regimeConfig, strategyLegVols.get(strat.id));
        totalDelta += greeks.delta; totalGamma += greeks.gamma; totalTheta += greeks.theta;
        strategyGreeks[strat.id] = { delta: greeks.delta, gamma: greeks.gamma, theta: greeks.theta };
      }

      // [DIAG] slow-path: standalone BSM computation
      console.log('[CURVE-WRITE]', 'source=standalone-bsm-slow-path', Date.now(), theoreticalPoints?.length, theoreticalPoints?.[Math.floor(theoreticalPoints.length/2)]);
      console.log('[CURVE-WRITE]', 'source=standalone-bsm-slow-path-expiry', Date.now(), expirationPoints?.length, expirationPoints?.[Math.floor(expirationPoints.length/2)]);
      return {
        expirationPoints, theoreticalPoints,
        minPrice, maxPrice, fullMinPrice, fullMaxPrice, minPnL, maxPnL,
        expirationBreakevens, theoreticalBreakevens, theoreticalPnLAtSpot,
        theta: totalTheta, gamma: totalGamma, delta: totalDelta,
        allStrikes, centerPrice, activeStrategyIds,
        expiredExpirationPoints, expiredTheoreticalPoints,
        timeSlicedCurves, T_max, NT: NT_SLICES,
        strategyTheoValues, strategyNaturalDebits: strategyBsValues, strategyExpirationCurves: stratExpCurves, strategyGreeks, strategyPnLAtSpot,
        strategyLegVols: Object.fromEntries(strategyLegVols),
      };

    } catch (err) {
      console.error('[RiskGraph] calculation error, returning empty state:', err);
      return {
        expirationPoints: [], theoreticalPoints: [],
        minPrice: ws - 100, maxPrice: ws + 100, fullMinPrice: ws - 200, fullMaxPrice: ws + 200,
        minPnL: -100, maxPnL: 100,
        expirationBreakevens: [], theoreticalBreakevens: [],
        theoreticalPnLAtSpot: 0, theta: 0, gamma: 0, delta: 0,
        allStrikes: [], centerPrice: ws, activeStrategyIds: [],
        expiredExpirationPoints: [], expiredTheoreticalPoints: [],
        strategyTheoValues: {}, strategyNaturalDebits: {}, strategyExpirationCurves: {}, strategyGreeks: {}, strategyPnLAtSpot: {}, strategyLegVols: {},
        timeSlicedCurves: [] as PnLPoint[][], T_max: 0, NT: 0,
      };
    }
  // simTimeOffsetHours intentionally excluded: surface is pre-computed for all time slices.
  // sliceIndex (derived from simTimeOffsetHours) drives the picker below — same pattern as 3D.
  // naturalPricesOverride is read inside getEffectiveDebit — without it here the 2D
  // chart would not re-render when chain mid prices update on the 15s poll.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategies, spotPrice, vix, spotPrices, weightingSpotProp, timeMachineEnabled, simVolatilityOffset, simSpotPct, panOffset, marketRegime, pricingModel, hestonVolOfVol, hestonMeanReversion, hestonCorrelation, mcNumPaths, atmIvByDte, chainIV, naturalPricesOverride, pricingResult]);

  // Slice picker — cheap memo that only re-runs when the slider moves.
  // Maps simTimeOffsetHours → sliceIndex → selects pre-computed curve row.
  return useMemo(() => {
    const { timeSlicedCurves, T_max, NT } = surfaceCompute;
    if (!NT || !timeSlicedCurves.length) return surfaceCompute as unknown as RiskGraphData;
    const elapsedDays = simTimeOffsetHours / 24;
    const sliceIndex = Math.min(
      Math.round(Math.min(elapsedDays / Math.max(T_max, 0.001), 1) * (NT - 1)),
      NT - 1,
    );
    const theoreticalPoints = timeSlicedCurves[sliceIndex] ?? surfaceCompute.theoreticalPoints;
    const theoreticalBreakevens = findBreakevens(theoreticalPoints);
    return { ...surfaceCompute, theoreticalPoints, theoreticalBreakevens } as unknown as RiskGraphData;
  }, [surfaceCompute, simTimeOffsetHours]);
}

export { calculateExpirationPnL, calculateTheoreticalPnL, calculateStrategyTheoreticalValue };
