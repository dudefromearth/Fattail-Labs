/**
 * Realized-move estimator (E11).
 * move_unit = MOVE_SIGMA × stdev(1-min log returns) × spot  [points]
 * Fewer than MOVE_MIN_SAMPLES bars → unmeasured. No default, no prior window, no IV.
 */

import type { AlgoConfig } from "./algoConfig";

export type MoveUnitMeasured = {
  state: "measured";
  moveUnit: number;
  n: number;
  unit: "pt";
};

export type MoveUnitUnmeasured = {
  state: "unmeasured";
  reason: "min_samples";
  n: number;
  unit: "pt";
};

export type MoveUnitResult = MoveUnitMeasured | MoveUnitUnmeasured;

function logReturns(prices: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    const cur = prices[i];
    if (!(prev > 0) || !(cur > 0)) continue;
    out.push(Math.log(cur / prev));
  }
  return out;
}

function sampleStdev(xs: number[]): number | null {
  if (xs.length < 2) return null;
  const mean = xs.reduce((a, x) => a + x, 0) / xs.length;
  let ss = 0;
  for (const x of xs) ss += (x - mean) * (x - mean);
  return Math.sqrt(ss / (xs.length - 1));
}

export function estimateMoveUnit(
  prices: number[],
  spot: number,
  cfg: Pick<AlgoConfig, "ALGO_MOVE_SIGMA" | "ALGO_MOVE_MIN_SAMPLES">,
): MoveUnitResult {
  const rets = logReturns(prices);
  const n = rets.length;
  if (n < cfg.ALGO_MOVE_MIN_SAMPLES) {
    return { state: "unmeasured", reason: "min_samples", n, unit: "pt" };
  }
  const sd = sampleStdev(rets);
  if (sd == null || !Number.isFinite(spot)) {
    return { state: "unmeasured", reason: "min_samples", n, unit: "pt" };
  }
  return {
    state: "measured",
    moveUnit: cfg.ALGO_MOVE_SIGMA * sd * spot,
    n,
    unit: "pt",
  };
}
