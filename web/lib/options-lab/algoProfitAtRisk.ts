/**
 * Proposed trail: adverse-move profit-at-risk (E1 · E10 · E23 · E24).
 *
 * larger k → H − k·PaR lower → MORE give-up room (positive dealer gamma,
 * heavy strike near center). Smaller k → tighter. Inverting this in review is
 * the single most likely silent defect in this file.
 *
 * Δ, Γ must already be package dollars / pt and / pt². Per-share is a named state.
 * Time remaining reaches this module only as the E23 floor window, never through k.
 */

import type { AlgoConfig } from "./algoConfig";

export const PAR_UNITS = {
  delta: "$/pt",
  gamma: "$/pt²",
  moveUnit: "pt",
  mAdv: "pt",
  pnlChangeAdv: "$",
  par: "$",
  trailLevel: "$",
  H: "$",
  k: "1",
} as const;

export type FlyKind = "call" | "put";
export type GreekUnit = "package" | "per-share";

export type ParPainted = {
  state: "painted";
  paint: true;
  delta: number;
  gamma: number;
  moveUnit: number;
  mAdv: number;
  pnlChangeAdv: number;
  par: number;
  parUp?: number;
  parDown?: number;
  k: number;
  kRaw: number;
  proposedRaw: number;
  floor: number;
  floorActive: boolean;
  trailLevel: number;
  units: typeof PAR_UNITS;
};

export type ParWaiting = {
  state: "WAITING";
  paint: false;
  reason: "unmeasured_greeks" | "unmeasured_move" | "per-share greeks";
  units: typeof PAR_UNITS;
};

export type ParResult = ParPainted | ParWaiting;

export function clampK(
  kRaw: number,
  cfg: Pick<AlgoConfig, "ALGO_K_CLAMP_MIN" | "ALGO_K_CLAMP_MAX">,
): number {
  return Math.min(cfg.ALGO_K_CLAMP_MAX, Math.max(cfg.ALGO_K_CLAMP_MIN, kRaw));
}

export function computeK(
  gammaFactor: number,
  proximityFactor: number,
  cfg: Pick<AlgoConfig, "ALGO_K_BASE" | "ALGO_K_CLAMP_MIN" | "ALGO_K_CLAMP_MAX">,
): { k: number; kRaw: number } {
  const kRaw = cfg.ALGO_K_BASE * gammaFactor * proximityFactor;
  return { k: clampK(kRaw, cfg), kRaw };
}

function pnlChange(delta: number, gamma: number, mAdv: number): number {
  return delta * mAdv + 0.5 * gamma * mAdv * mAdv;
}

function parFromPnl(pnl: number): number {
  return Math.max(0, -pnl);
}

/** Adverse signs: call below body → down; above → up; put mirrored; at body both. */
export function adverseSigns(
  kind: FlyKind,
  spot: number,
  body: number,
): number[] {
  if (spot === body) return [1, -1];
  if (kind === "call") return spot < body ? [-1] : [1];
  return spot > body ? [1] : [-1];
}

export type ProfitAtRiskInput = {
  kind: FlyKind;
  spot: number;
  body: number;
  delta: number | "unmeasured";
  gamma: number | "unmeasured";
  greekUnit: GreekUnit;
  moveUnit: number | "unmeasured";
  H: number;
  gammaFactor: number;
  proximityFactor: number;
  remainingToDecayEnd: number | null;
  cfg: Pick<
    AlgoConfig,
    | "ALGO_K_BASE"
    | "ALGO_K_CLAMP_MIN"
    | "ALGO_K_CLAMP_MAX"
    | "ALGO_TRAIL_END_PCT"
    | "ALGO_FLOOR_REMAINING_H"
  >;
};

export function computeProfitAtRisk(input: ProfitAtRiskInput): ParResult {
  if (input.greekUnit === "per-share") {
    return { state: "WAITING", paint: false, reason: "per-share greeks", units: PAR_UNITS };
  }
  if (input.delta === "unmeasured" || input.gamma === "unmeasured") {
    return { state: "WAITING", paint: false, reason: "unmeasured_greeks", units: PAR_UNITS };
  }
  if (input.moveUnit === "unmeasured") {
    return { state: "WAITING", paint: false, reason: "unmeasured_move", units: PAR_UNITS };
  }

  const delta = input.delta;
  const gamma = input.gamma;
  const moveUnit = input.moveUnit;
  const signs = adverseSigns(input.kind, input.spot, input.body);

  let par = 0;
  let parUp: number | undefined;
  let parDown: number | undefined;
  let chosenPnl = 0;
  let chosenM = 0;

  for (const sign of signs) {
    const m = sign * moveUnit;
    const pnl = pnlChange(delta, gamma, m);
    const p = parFromPnl(pnl);
    if (sign > 0) parUp = p;
    else parDown = p;
    if (p > par) {
      par = p;
      chosenPnl = pnl;
      chosenM = m;
    }
  }

  const { k, kRaw } = computeK(input.gammaFactor, input.proximityFactor, input.cfg);
  const proposedRaw = input.H - k * par;
  const gMin = input.cfg.ALGO_TRAIL_END_PCT / 100;
  const floor = (1 - gMin) * input.H;
  const rem = input.remainingToDecayEnd;
  const floorActive =
    rem != null && rem <= input.cfg.ALGO_FLOOR_REMAINING_H;
  const trailLevel = floorActive ? Math.max(proposedRaw, floor) : proposedRaw;

  return {
    state: "painted",
    paint: true,
    delta,
    gamma,
    moveUnit,
    mAdv: chosenM,
    pnlChangeAdv: chosenPnl,
    par,
    parUp,
    parDown,
    k,
    kRaw,
    proposedRaw,
    floor,
    floorActive,
    trailLevel,
    units: PAR_UNITS,
  };
}
