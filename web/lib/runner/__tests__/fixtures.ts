/**
 * Recorded-shape generations for TR-P1 hash AT.
 * Symbols from market_symbol_universe roles: SPX (index), TSLA (equity), SPY (ETF).
 * Dual-side listed mids — no live Massive.
 */

import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import type { ChainContext } from "@/lib/options-lab/templates/types";

function row(
  side: "call" | "put",
  strike: number,
  mid: number,
  extra: Partial<LadderRow> = {},
): LadderRow {
  return {
    strike,
    side,
    mid,
    bid: mid - 0.05,
    ask: mid + 0.05,
    delta: 0.5 - (strike - 100) * 0.01,
    gamma: Math.max(0.01, 0.08 - Math.abs(strike - 100) * 0.002),
    theta: -0.04,
    ...extra,
  };
}

function makeGen(opts: {
  symbol: string;
  spot: number;
  step: number;
  lo: number;
  hi: number;
  hash: string;
}): ChainContext {
  const contracts = new Map<string, LadderRow>();
  for (const side of ["call", "put"] as const) {
    for (let k = opts.lo; k <= opts.hi; k += opts.step) {
      const dist = Math.abs(k - opts.spot);
      const mid = Math.max(0.15, 1.8 + dist * 0.08);
      contracts.set(contractKey(side, k), row(side, k, mid));
    }
  }
  return {
    symbol: opts.symbol,
    viewSide: "call",
    spot: opts.spot,
    strikeStep: opts.step,
    wings: 50,
    contracts,
    asOf: "2026-08-21T15:00:00.000Z",
    contentHash: opts.hash,
  };
}

/** Index — market_symbol_universe. */
export const GEN_SPX = makeGen({
  symbol: "SPX",
  spot: 5600,
  step: 5,
  lo: 5520,
  hi: 5680,
  hash: "gen-spx-trp1",
});

/** Equity — market_symbol_universe (admin tests cite TSLA). */
export const GEN_TSLA = makeGen({
  symbol: "TSLA",
  spot: 250,
  step: 2.5,
  lo: 210,
  hi: 290,
  hash: "gen-tsla-trp1",
});

/** ETF — market_symbol_universe (admin tests cite SPY). */
export const GEN_SPY = makeGen({
  symbol: "SPY",
  spot: 560,
  step: 1,
  lo: 520,
  hi: 600,
  hash: "gen-spy-trp1",
});

export const RECORDED_GENERATIONS: { label: string; ctx: ChainContext }[] = [
  { label: "SPX", ctx: GEN_SPX },
  { label: "TSLA", ctx: GEN_TSLA },
  { label: "SPY", ctx: GEN_SPY },
];
