/**
 * Heatmap LIM compute — Spec v0.4.8 §5–8.
 *
 * X is one shared k applied to the ATM straddle: x = 100·tanh(r), r = centrePts/(k·S).
 * Displayed X stays in the open interval (−100, +100). xUnclamped = 100·r for the trail.
 * Y is unchanged. Proximity never moves x/y. Crossings are intervals; no midpoint.
 * Input: buildGexProfile(ctx, "gex_net") + ctx.spot + ATM mids. No volume.
 */

import { contractKey } from "@/lib/chainLadderApi";
import type { ChainContext, HeatmapTemplate } from "./types";
import { buildGexProfile } from "./gex";
import { LimConfigError, loadLimConfig, type LimConfig } from "./limConfig";
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
  invalidReason: "no-straddle" | "no-spot" | null;
};

export type LimComputeInput = {
  symbol: string;
  spot: number | null;
  wings: number;
  expiration: string;
  oiAsOf: string | null;
  nets: StrikeNet[];
  /** ATM call mid. Null when that contract has no finite mid. */
  callMid: number | null;
  /** ATM put mid. Null when that contract has no finite mid. */
  putMid: number | null;
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
  invalidReason: LimResult["invalidReason"],
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
    invalidReason,
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

function finiteMid(row: { mid?: number | null } | undefined): number | null {
  if (row == null || typeof row.mid !== "number" || !Number.isFinite(row.mid)) {
    return null;
  }
  return row.mid;
}

/**
 * Listed strike nearest spot. A distance tie takes the lower strike.
 * Strikes come only from the contracts already on this expiration.
 */
export function nearestAtmStrike(
  contracts: ChainContext["contracts"],
  spot: number,
): number | null {
  let best: number | null = null;
  let bestD = Infinity;
  const seen = new Set<number>();
  for (const key of contracts.keys()) {
    const colon = key.lastIndexOf(":");
    if (colon < 0) continue;
    const strike = Number(key.slice(colon + 1));
    if (!Number.isFinite(strike) || seen.has(strike)) continue;
    seen.add(strike);
    const d = Math.abs(strike - spot);
    if (best == null || d < bestD || (d === bestD && strike < best)) {
      best = strike;
      bestD = d;
    }
  }
  return best;
}

/**
 * Displayed X. Float64 tanh reaches ±1 once |r| is about 20, which would
 * paint the ball on the edge. Step one ulp inside ±100 only in that case.
 */
function displayedLean(ratio: number): number {
  const x = 100 * Math.tanh(ratio);
  if (x > -100 && x < 100) return x;
  const ulp = 2 ** (Math.floor(Math.log2(100)) - 52);
  if (x >= 100) return 100 - ulp;
  if (x <= -100) return -100 + ulp;
  return x;
}

/** S = ATM call mid + ATM put mid. Missing or non-positive S is not a straddle. */
function straddlePremium(input: LimComputeInput): number | null {
  const { callMid, putMid } = input;
  if (typeof callMid !== "number" || typeof putMid !== "number") return null;
  if (!Number.isFinite(callMid) || !Number.isFinite(putMid)) return null;
  const s = callMid + putMid;
  if (!(s > 0)) return null;
  return s;
}

export function computeLimFromNets(
  input: LimComputeInput,
  config: LimConfig,
): LimResult {
  const k = config.LIM_STRADDLE_K;
  if (!(typeof k === "number" && Number.isFinite(k) && k > 0)) {
    throw new LimConfigError(
      "Invalid environment variable: LABS_LIM_STRADDLE_K (must be greater than 0)",
      "LABS_LIM_STRADDLE_K",
    );
  }
  const spotOk =
    input.spot != null && Number.isFinite(input.spot) && input.spot > 0;
  if (!spotOk) return emptyState(input, false, "no-spot");

  const S = straddlePremium(input);
  if (S == null) return emptyState(input, false, "no-straddle");

  const usable = input.nets.filter(finiteNet);
  let totalAbs = 0;
  for (const r of usable) totalAbs += Math.abs(r.net);
  if (totalAbs === 0) return emptyState(input, true, null);

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
  const ratio = centrePts / (k * S);
  const xUnclamped = 100 * ratio;
  const lean = displayedLean(ratio);

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
    valid: true,
    invalidReason: null,
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
  let callMid: number | null = null;
  let putMid: number | null = null;
  if (ctx.spot != null && Number.isFinite(ctx.spot) && ctx.spot > 0) {
    const strike = nearestAtmStrike(ctx.contracts, ctx.spot);
    if (strike != null) {
      callMid = finiteMid(ctx.contracts.get(contractKey("call", strike)));
      putMid = finiteMid(ctx.contracts.get(contractKey("put", strike)));
    }
  }
  return computeLimFromNets(
    {
      symbol: ctx.symbol,
      spot: ctx.spot,
      wings: ctx.wings,
      expiration: opts?.expiration ?? "",
      oiAsOf: opts?.oiAsOf ?? null,
      nets,
      callMid,
      putMid,
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
