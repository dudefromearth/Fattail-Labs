/**
 * Expiration payoff for multi-leg options — Labs Analyzer v1.
 * Per-share P&L then ×100 for dollar P&L (1 contract multiplier).
 */

import type { ParsedTosLeg, ParsedTosTrade } from "./tosParser";

const MULTIPLIER = 100;

export function intrinsic(price: number, strike: number, right: "call" | "put"): number {
  return right === "call"
    ? Math.max(0, price - strike)
    : Math.max(0, strike - price);
}

/** Per-share structure value at expiration (no debit). */
export function legsValuePerShare(price: number, legs: ParsedTosLeg[]): number {
  let v = 0;
  for (const leg of legs) {
    v += intrinsic(price, leg.strike, leg.right) * leg.quantity;
  }
  return v;
}

/**
 * Dollar P&L at expiration for one package.
 * debit: positive = paid (long), negative = credit received.
 */
export function expirationPnLDollars(
  price: number,
  legs: ParsedTosLeg[],
  debit: number,
): number {
  const perShare = legsValuePerShare(price, legs) - debit;
  return perShare * MULTIPLIER;
}

export type PayoffPoint = { x: number; y: number };

export type PayoffSummary = {
  points: PayoffPoint[];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  maxProfit: number;
  maxLoss: number;
  breakevens: number[];
  debit: number;
};

export function buildPayoffCurve(
  trade: ParsedTosTrade,
  opts?: { padPts?: number; steps?: number; spot?: number | null },
): PayoffSummary {
  const pad = opts?.padPts ?? 80;
  const steps = opts?.steps ?? 200;
  const strikes = trade.legs.map((l) => l.strike);
  const lo = Math.min(...strikes);
  const hi = Math.max(...strikes);
  const mid =
    opts?.spot != null && Number.isFinite(opts.spot)
      ? Number(opts.spot)
      : (lo + hi) / 2;
  const xMin = Math.min(lo, mid) - pad;
  const xMax = Math.max(hi, mid) + pad;
  const debit =
    trade.debit != null
      ? trade.debit
      : trade.limit != null
        ? trade.isCredit
          ? -Math.abs(trade.limit)
          : Math.abs(trade.limit)
        : 0;

  const points: PayoffPoint[] = [];
  // Include exact strikes and breakeven candidates
  const extras = new Set(strikes);
  for (let i = 0; i <= steps; i++) {
    const x = xMin + ((xMax - xMin) * i) / steps;
    extras.add(Math.round(x * 100) / 100);
  }
  const xs = [...extras].sort((a, b) => a - b);
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const x of xs) {
    const y = expirationPnLDollars(x, trade.legs, debit);
    points.push({ x, y });
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }

  // Breakevens: zero crossings between consecutive samples
  const breakevens: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (a.y === 0) breakevens.push(a.x);
    else if (a.y * b.y < 0) {
      const t = a.y / (a.y - b.y);
      breakevens.push(a.x + t * (b.x - a.x));
    }
  }

  // Pad y for chart
  const yr = Math.max(Math.abs(yMin), Math.abs(yMax), 1);
  return {
    points,
    xMin,
    xMax,
    yMin: yMin - yr * 0.08,
    yMax: yMax + yr * 0.08,
    maxProfit: yMax,
    maxLoss: yMin,
    breakevens,
    debit,
  };
}

export function tradeLabel(trade: ParsedTosTrade): string {
  const w = trade.width != null ? `±${trade.width}` : "";
  const body = trade.body != null ? String(trade.body) : trade.strikes.join("/");
  const side = trade.right.toUpperCase();
  if (trade.structure === "butterfly") {
    return `${trade.symbol} ${body} ${w} ${side} fly`;
  }
  if (trade.structure === "vertical") {
    return `${trade.symbol} ${trade.strikes.join("/")} ${side} vertical`;
  }
  return `${trade.symbol} ${trade.strikes.join("/")} ${side}`;
}
