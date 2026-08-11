/**
 * Risk graph engine v2 — MSC-style dual curves from a ToS trade.
 * Expiration (intrinsic) + theoretical T+0 (flat IV Black-Scholes).
 */

import {
  RISK_FREE_RATE,
  bsGreeks,
  bsPrice,
  fractionalT,
  type Greeks,
} from "./blackScholes";
import type { ParsedTosLeg, ParsedTosTrade } from "./tosParser";

const MULT = 100;

export type WhatIf = {
  /** Hours to shift clock (negative = earlier, positive = later toward expiry) */
  timeOffsetHours: number;
  /** Additive vol points, e.g. +5 = +5 vol pts on base IV */
  volOffsetPts: number;
  /** Spot % move from base spot, e.g. +1 = +1% */
  spotPct: number;
};

export const DEFAULT_WHAT_IF: WhatIf = {
  timeOffsetHours: 0,
  volOffsetPts: 0,
  spotPct: 0,
};

export type CurvePoint = { x: number; exp: number; theo: number };

export type RiskGraphResult = {
  points: CurvePoint[];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  maxProfit: number;
  maxLoss: number;
  breakevensExp: number[];
  debit: number;
  /** Effective spot after what-if */
  spot: number;
  baseSpot: number;
  /** Years to expiry after what-if */
  T: number;
  iv: number;
  greeks: Greeks; // package ×100
  theoAtSpot: number;
  expAtSpot: number;
};

function netDebit(trade: ParsedTosTrade): number {
  if (trade.debit != null) return trade.debit;
  if (trade.limit != null) {
    return trade.isCredit ? -Math.abs(trade.limit) : Math.abs(trade.limit);
  }
  return 0;
}

function legsValueIntrinsic(price: number, legs: ParsedTosLeg[]): number {
  let v = 0;
  for (const leg of legs) {
    const iv =
      leg.right === "call"
        ? Math.max(0, price - leg.strike)
        : Math.max(0, leg.strike - price);
    v += iv * leg.quantity;
  }
  return v;
}

function legsValueTheo(
  price: number,
  legs: ParsedTosLeg[],
  T: number,
  iv: number,
  r: number,
): number {
  let v = 0;
  for (const leg of legs) {
    // Per-leg time: same T for single-expiry packages (heatmap ToS)
    const px = bsPrice(price, leg.strike, T, r, iv, leg.right === "call");
    v += px * leg.quantity;
  }
  return v;
}

function packageGreeks(
  price: number,
  legs: ParsedTosLeg[],
  T: number,
  iv: number,
  r: number,
): Greeks {
  let delta = 0;
  let gamma = 0;
  let theta = 0;
  let vega = 0;
  for (const leg of legs) {
    const g = bsGreeks(price, leg.strike, T, r, iv, leg.right === "call");
    delta += g.delta * leg.quantity;
    gamma += g.gamma * leg.quantity;
    theta += g.theta * leg.quantity;
    vega += g.vega * leg.quantity;
  }
  return {
    delta: delta * MULT,
    gamma: gamma * MULT,
    theta: theta * MULT,
    vega: vega * MULT,
  };
}

function zeroCrossings(
  xs: number[],
  ys: number[],
): number[] {
  const out: number[] = [];
  for (let i = 1; i < xs.length; i++) {
    const y0 = ys[i - 1];
    const y1 = ys[i];
    if (y0 === 0) out.push(xs[i - 1]);
    else if (y0 * y1 < 0) {
      const t = y0 / (y0 - y1);
      out.push(xs[i - 1] + t * (xs[i] - xs[i - 1]));
    }
  }
  return out;
}

export function buildRiskGraph(
  trade: ParsedTosTrade,
  opts: {
    baseSpot: number;
    /** Base IV annualized, e.g. 0.18 */
    baseIv?: number;
    whatIf?: WhatIf;
    steps?: number;
    padPts?: number;
  },
): RiskGraphResult {
  const whatIf = opts.whatIf ?? DEFAULT_WHAT_IF;
  const baseIv = opts.baseIv ?? 0.18;
  const steps = opts.steps ?? 240;
  const debit = netDebit(trade);

  const baseSpot = opts.baseSpot > 0 ? opts.baseSpot : trade.body ?? trade.strikes[0] ?? 5000;
  const spot = baseSpot * (1 + whatIf.spotPct / 100);
  const iv = Math.max(0.01, baseIv + whatIf.volOffsetPts / 100);

  let T = fractionalT(trade.expiration);
  T = Math.max(1 / (365 * 24), T - whatIf.timeOffsetHours / (365.25 * 24));

  const strikes = trade.legs.map((l) => l.strike);
  const lo = Math.min(...strikes);
  const hi = Math.max(...strikes);
  const half = trade.width ?? ((hi - lo) / 2 || 25);
  const pad = opts.padPts ?? Math.max(50, half * 4);
  const xMin = Math.min(lo, spot) - pad;
  const xMax = Math.max(hi, spot) + pad;

  const points: CurvePoint[] = [];
  const xs: number[] = [];
  for (let i = 0; i <= steps; i++) {
    xs.push(xMin + ((xMax - xMin) * i) / steps);
  }
  // ensure strikes + spot sampled
  for (const k of strikes) xs.push(k);
  xs.push(spot);
  xs.sort((a, b) => a - b);
  const uniq: number[] = [];
  for (const x of xs) {
    if (!uniq.length || Math.abs(uniq[uniq.length - 1] - x) > 1e-9) uniq.push(x);
  }

  let yMin = Infinity;
  let yMax = -Infinity;
  const expYs: number[] = [];
  for (const x of uniq) {
    const expPer = legsValueIntrinsic(x, trade.legs) - debit;
    const theoPer = legsValueTheo(x, trade.legs, T, iv, RISK_FREE_RATE) - debit;
    const exp = expPer * MULT;
    const theo = theoPer * MULT;
    points.push({ x, exp, theo });
    expYs.push(exp);
    yMin = Math.min(yMin, exp, theo);
    yMax = Math.max(yMax, exp, theo);
  }

  const yr = Math.max(Math.abs(yMin), Math.abs(yMax), 1) * 0.1;
  const greeks = packageGreeks(spot, trade.legs, T, iv, RISK_FREE_RATE);
  const expAtSpot =
    (legsValueIntrinsic(spot, trade.legs) - debit) * MULT;
  const theoAtSpot =
    (legsValueTheo(spot, trade.legs, T, iv, RISK_FREE_RATE) - debit) * MULT;

  return {
    points,
    xMin,
    xMax,
    yMin: yMin - yr,
    yMax: yMax + yr,
    maxProfit: Math.max(...expYs),
    maxLoss: Math.min(...expYs),
    breakevensExp: zeroCrossings(
      points.map((p) => p.x),
      expYs,
    ),
    debit,
    spot,
    baseSpot,
    T,
    iv,
    greeks,
    theoAtSpot,
    expAtSpot,
  };
}
