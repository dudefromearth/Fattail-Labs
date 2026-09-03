/**
 * GEX percentile normalization (E5 · E11).
 * 0th → GAMMA_FACTOR_MIN, 100th → MAX, 50th → 1.0. Absolute dollars never used.
 * Not on pane → unavailable. n < MIN_SAMPLES → warming. Both: gamma_factor = 1.0, named, persists.
 */

import type { AlgoConfig } from "./algoConfig";

export type GexNormResult = {
  gammaFactor: number;
  n: number;
  chrome: string;
  paints: true;
};

function percentileRank(current: number, samples: number[]): number {
  const n = samples.length;
  let less = 0;
  let equal = 0;
  for (const s of samples) {
    if (s < current) less += 1;
    else if (s === current) equal += 1;
  }
  return (less + 0.5 * equal) / n;
}

export function normalizeGex(
  input: {
    onPane: boolean;
    samples: number[];
    current?: number;
  },
  cfg: Pick<
    AlgoConfig,
    | "ALGO_GAMMA_FACTOR_MIN"
    | "ALGO_GAMMA_FACTOR_MAX"
    | "ALGO_GEX_NORM_MIN_SAMPLES"
  >,
): GexNormResult {
  const minN = cfg.ALGO_GEX_NORM_MIN_SAMPLES;
  if (!input.onPane) {
    return {
      gammaFactor: 1.0,
      n: input.samples.length,
      chrome: "gex: unavailable · k unmodulated",
      paints: true,
    };
  }
  const n = input.samples.length;
  if (n < minN) {
    return {
      gammaFactor: 1.0,
      n,
      chrome: `gex: warming (${n}/${minN} samples)`,
      paints: true,
    };
  }
  const current = input.current ?? input.samples[n - 1];
  const rank = percentileRank(current, input.samples);
  const gammaFactor =
    cfg.ALGO_GAMMA_FACTOR_MIN +
    rank * (cfg.ALGO_GAMMA_FACTOR_MAX - cfg.ALGO_GAMMA_FACTOR_MIN);
  return {
    gammaFactor,
    n,
    chrome: `gex: percentile (${n}/${minN} samples)`,
    paints: true,
  };
}
