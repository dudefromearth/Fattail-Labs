/**
 * Tick one Algo alert. Demo uses What-if spot / time / vol (FI-033).
 * No reason prompt → built-in trail engine.
 */

import type { AnalyzerThresholdAlert } from "./analyzerBook";
import { normalizeAlertRunState } from "./analyzerBook";
import {
  inferLongFly,
  remainingToDecayEndHours,
  resolveDecayEndMs,
  stepAlgoTrailWithPrevSpot,
  type AlgoTrailState,
  type PnLSample,
} from "./algoTrailMath";
import type { LegInput } from "./positionTypes";

export type AlgoTickCtx = {
  symbol: string;
  spot: number;
  /** Package P&L in the same units as debit (per share). */
  U: number;
  debit: number;
  legs: readonly Pick<LegInput, "strike" | "quantity" | "side" | "type">[];
  curve: readonly PnLSample[];
  remainingHours: number;
  E: number | null;
};

function trailEqual(a: AlgoTrailState, b: AlgoTrailState): boolean {
  return (
    a.phase === b.phase &&
    a.side === b.side &&
    a.f === b.f &&
    a.H === b.H &&
    a.S === b.S &&
    a.xH === b.xH &&
    a.xS === b.xS &&
    a.invertNamed === b.invertNamed &&
    a.pulse === b.pulse &&
    a.exitSide === b.exitSide
  );
}

export function tickAlgoAlert(
  alert: AnalyzerThresholdAlert,
  ctx: AlgoTickCtx,
): AnalyzerThresholdAlert {
  if (alert.alertClass !== "algo" || !alert.algo) return alert;
  const state = normalizeAlertRunState(
    alert.runState,
    alert.enabled,
    alert.status,
  );
  if (state !== "live") return alert;
  if (alert.algoPhase === "recorded") return alert;
  if (!alert.algo.demo) return alert;
  if (!(ctx.spot > 0) || !(ctx.debit > 0)) return alert;
  const fly = inferLongFly(ctx.legs);
  if (!fly || !fly.longFly) return alert;

  const ag = alert.algo;
  const entryPct = (ag.entry_pct || 75) / 100;
  const f0 = (ag.trail_start_pct || 75) / 100;
  const fMin = (ag.trail_floor_pct || 25) / 100;
  const prev = ag.trail_state ?? null;
  const remainingAtArm =
    prev?.phase === "armed" || prev?.phase === "recorded"
      ? (ag.remaining_at_arm ?? ctx.remainingHours)
      : ctx.remainingHours;
  const eArm =
    prev?.phase === "armed" || prev?.phase === "recorded"
      ? (ag.e_at_arm ?? ctx.E)
      : ctx.E;
  const next = stepAlgoTrailWithPrevSpot({
    spot: ctx.spot,
    prevSpot: ag.prev_spot ?? ctx.spot,
    U: ctx.U,
    debit: ctx.debit,
    entryPct,
    f0,
    fMin,
    E: ctx.E,
    EArm: eArm,
    remainingLastTrade: ctx.remainingHours,
    remainingLastTradeAtArm: remainingAtArm,
    body: fly.body,
    curve: ctx.curve,
    prev,
  });
  const recorded = next.phase === "recorded";
  if (
    prev &&
    trailEqual(prev, next) &&
    ag.prev_spot === ctx.spot &&
    alert.algoPhase === next.phase
  ) {
    return alert;
  }
  return {
    ...alert,
    algoPhase: next.phase,
    runState: recorded ? "touched" : "live",
    enabled: !recorded,
    status: recorded ? "triggered" : alert.status,
    triggeredAt: recorded
      ? alert.triggeredAt || new Date().toISOString()
      : alert.triggeredAt,
    triggeredSpot: recorded ? ctx.spot : alert.triggeredSpot,
    algo: {
      ...ag,
      trail_state: next,
      remaining_at_arm: remainingAtArm,
      e_at_arm: eArm,
      prev_spot: ctx.spot,
    },
  };
}

export function remainingHoursForAlgo(
  alert: AnalyzerThresholdAlert,
  symbol: string,
  nowMs: number,
): number {
  const end = resolveDecayEndMs(alert.algo?.decay_end ?? "eod", symbol, nowMs);
  return remainingToDecayEndHours(end, nowMs);
}
