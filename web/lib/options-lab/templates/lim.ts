/**
 * Heatmap LIM compute — Spec v0.4.3 §5–8 (E1–E17).
 *
 * Input: buildGexProfile(ctx, "gex_net") + ctx.spot. No volume. E8: Y has no unclamped twin.
 * Proximity never moves x/y. Crossings are intervals; no midpoint.
 */

import type { ChainContext, HeatmapTemplate } from "./types";
import { buildGexProfile } from "./gex";
import { loadLimConfig, type LimConfig } from "./limConfig";
import { LIM_MODE_LABEL, LIM_PICKER_LABEL } from "./limChrome";

export type StrikeNet = {
  strike: number;
  call: number | null;
  put: number | null;
  net: number | null;
};

export type LimCrossing = {
  lo: number;
  hi: number;
  netBefore: number;
  netAfter: number;
  steepness: number;
};

export type LimResult = {
  x: number;
  y: number;
  xUnclamped: number;
  lean: number;
  nearSpotMix: number;
  netRatio: number;
  concF: number;
  magF: number;
  centrePts: number;
  crossings: LimCrossing[];
  crossingCount: number;
  nearestCrossing: { lo: number; hi: number } | null;
  distanceToCrossing: number | null;
  spotBelowNearestCrossing: boolean;
  crossingProximity: number;
  oiAsOf: string | null;
  expiration: string;
  wings: number;
  symbol: string;
  valid: boolean;
};

export type LimComputeInput = {
  symbol: string;
  spot: number | null;
  wings: number;
  expiration: string;
  oiAsOf: string | null;
  nets: StrikeNet[];
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function finiteNet(n: StrikeNet): n is StrikeNet & { net: number } {
  return n.net != null && Number.isFinite(n.net);
}

function emptyState(
  input: LimComputeInput,
  valid: boolean,
): LimResult {
  return {
    x: 0,
    y: 50,
    xUnclamped: 0,
    lean: 0,
    nearSpotMix: 50,
    netRatio: 0,
    concF: 0,
    magF: 0,
    centrePts: 0,
    crossings: [],
    crossingCount: 0,
    nearestCrossing: null,
    distanceToCrossing: null,
    spotBelowNearestCrossing: false,
    crossingProximity: 1,
    oiAsOf: input.oiAsOf,
    expiration: input.expiration,
    wings: input.wings,
    symbol: input.symbol,
    valid,
  };
}

function walkCrossings(rows: Array<{ strike: number; net: number }>): LimCrossing[] {
  const crossings: LimCrossing[] = [];
  const visited = rows
    .filter((r) => r.net !== 0)
    .sort((a, b) => a.strike - b.strike);
  for (let i = 1; i < visited.length; i++) {
    const prev = visited[i - 1];
    const cur = visited[i];
    if (Math.sign(prev.net) === Math.sign(cur.net)) continue;
    const lo = prev.strike;
    const hi = cur.strike;
    const width = hi - lo;
    if (width === 0) continue;
    crossings.push({
      lo,
      hi,
      netBefore: prev.net,
      netAfter: cur.net,
      steepness: Math.abs(cur.net - prev.net) / width,
    });
  }
  return crossings;
}

function crossingDist(
  c: { lo: number; hi: number },
  spot: number,
): number {
  if (c.lo <= spot && spot <= c.hi) return 0;
  return Math.min(Math.abs(spot - c.lo), Math.abs(spot - c.hi));
}

export function computeLimFromNets(
  input: LimComputeInput,
  config: LimConfig,
): LimResult {
  const scale = config.LIM_CENTRE_SCALE_PTS[input.symbol];
  const hasScale = Number.isFinite(scale);
  const spotOk =
    input.spot != null && Number.isFinite(input.spot) && input.spot > 0;
  const valid = hasScale && spotOk;

  const usable = input.nets.filter(finiteNet);
  let totalAbs = 0;
  for (const r of usable) totalAbs += Math.abs(r.net);

  if (!spotOk || totalAbs === 0) {
    const empty = emptyState(input, hasScale && spotOk);
    if (!spotOk) return { ...empty, valid: false };
    return empty;
  }

  const spot = input.spot as number;
  const closeR = (config.LIM_BAND_CLOSE_PCT / 100) * spot;
  const mediumR = (config.LIM_BAND_MEDIUM_PCT / 100) * spot;

  let weighted = 0;
  let gexClose = 0;
  let absGexClose = 0;
  let absGexMedium = 0;
  for (const r of usable) {
    const abs = Math.abs(r.net);
    weighted += abs * (r.strike - spot);
    const dist = Math.abs(r.strike - spot);
    if (dist <= closeR) {
      gexClose += r.net;
      absGexClose += abs;
    }
    if (dist <= mediumR) absGexMedium += abs;
  }

  const centrePts = weighted / totalAbs;
  let lean = 0;
  let xUnclamped = 0;
  if (hasScale) {
    xUnclamped = (centrePts / scale) * 100;
    lean = clamp(xUnclamped, -100, 100);
  }

  const netRatio = absGexClose === 0 ? 0 : gexClose / absGexClose;
  const netF = ((netRatio + 1) / 2) * 100;
  const concF =
    config.LIM_CONC_FLOOR + (absGexMedium / totalAbs) * config.LIM_CONC_SPAN;
  const magF =
    config.LIM_MAG_FLOOR + (absGexClose / totalAbs) * config.LIM_MAG_SPAN;
  const nearSpotMix =
    netF * config.LIM_W_NET +
    concF * config.LIM_W_CONC +
    magF * config.LIM_W_MAG;

  const crossings = walkCrossings(
    usable.map((r) => ({ strike: r.strike, net: r.net })),
  );

  let nearestCrossing: { lo: number; hi: number } | null = null;
  let distanceToCrossing: number | null = null;
  let spotBelowNearestCrossing = false;
  let crossingProximity = 1;
  if (crossings.length > 0) {
    let best = crossings[0];
    let bestD = crossingDist(best, spot);
    for (let i = 1; i < crossings.length; i++) {
      const d = crossingDist(crossings[i], spot);
      if (d < bestD) {
        best = crossings[i];
        bestD = d;
      }
    }
    nearestCrossing = { lo: best.lo, hi: best.hi };
    distanceToCrossing = bestD;
    spotBelowNearestCrossing = spot < best.lo;
    const dPct = (bestD / spot) * 100;
    const span = config.LIM_XPROX_CEIL_PCT - config.LIM_XPROX_FLOOR_PCT;
    crossingProximity = clamp(
      (dPct - config.LIM_XPROX_FLOOR_PCT) / span,
      0,
      1,
    );
  }

  return {
    x: lean,
    y: nearSpotMix,
    xUnclamped,
    lean,
    nearSpotMix,
    netRatio,
    concF,
    magF,
    centrePts,
    crossings,
    crossingCount: crossings.length,
    nearestCrossing,
    distanceToCrossing,
    spotBelowNearestCrossing,
    crossingProximity,
    oiAsOf: input.oiAsOf,
    expiration: input.expiration,
    wings: input.wings,
    symbol: input.symbol,
    valid,
  };
}

export function netsFromGexProfile(ctx: ChainContext): StrikeNet[] {
  return buildGexProfile(ctx, "gex_net").map((p) => ({
    strike: p.strike,
    call: p.call,
    put: p.put,
    net: p.value,
  }));
}

export function computeLim(
  ctx: ChainContext,
  opts?: {
    expiration?: string;
    oiAsOf?: string | null;
    config?: LimConfig;
    nets?: StrikeNet[];
  },
): LimResult {
  const config = opts?.config ?? loadLimConfig();
  const nets = opts?.nets ?? netsFromGexProfile(ctx);
  return computeLimFromNets(
    {
      symbol: ctx.symbol,
      spot: ctx.spot,
      wings: ctx.wings,
      expiration: opts?.expiration ?? "",
      oiAsOf: opts?.oiAsOf ?? null,
      nets,
    },
    config,
  );
}

/** Registry descriptor. Stubs only — the quadrant does not use the grid. */
export const limTemplate: HeatmapTemplate = {
  id: "lim",
  label: LIM_PICKER_LABEL,
  description: "Window GEX lean and near-spot mix on a quadrant",
  layout: "quadrant",
  valueModes: [{ id: "lim", label: LIM_MODE_LABEL }],
  defaultValueMode: "lim",
  resolveColumns: () => [],
  resolveRows: () => [],
  computeCell: () => ({ display: null, value: null, valid: false }),
  assignColors: () => ({ stickyScale: 1 }),
};
