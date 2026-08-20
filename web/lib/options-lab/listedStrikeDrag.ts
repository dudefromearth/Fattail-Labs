/**
 * Analyzer strike-handle geometry.
 * Heritage: MSC Risk Graph / Labs design-studio handle grammar
 * (body slide · wing resize · Shift = whole package).
 * Destinations must be OPF-listed (DL-309). No MSC import.
 */

import type { AnalyzerPosition } from "./analyzerBook";
import { buildLabel, buildNotation } from "./positionLabels";
import type { LegInput } from "./positionTypes";
import {
  normalizeStrike,
  snapToListed,
  uniqueListedStrikes,
} from "./listedStrikes";

const EPS = 1e-6;

function nearly(a: number, b: number): boolean {
  return Math.abs(a - b) < EPS;
}

function signedQty(l: LegInput): number {
  const q = Math.abs(l.quantity);
  return l.side === "short" ? -q : q;
}

function isClassicButterfly(legs: readonly LegInput[]): boolean {
  if (legs.length < 3) return false;
  const byK = new Map<number, number>();
  for (const l of legs) {
    const k = normalizeStrike(l.strike);
    byK.set(k, (byK.get(k) || 0) + signedQty(l));
  }
  if (byK.size !== 3) return false;
  const qtys = [...byK.values()].sort((a, b) => a - b);
  const mid = qtys[0];
  if (!(mid < 0)) return false;
  return qtys[1] === qtys[2] && qtys[1] === -mid / 2;
}

export function classifyGrab(
  legs: readonly LegInput[],
  grabbedStrike: number,
): "body" | "wing" {
  const at = legs.filter((l) => nearly(l.strike, grabbedStrike));
  if (!at.length) return "body";
  const hasShort = at.some((l) => l.side === "short");
  const hasLong = at.some((l) => l.side === "long");
  if (isClassicButterfly(legs)) {
    if (hasShort && !hasLong) return "body";
    if (hasLong && !hasShort) return "wing";
    return "body";
  }
  if (hasLong && !hasShort) return "body";
  if (hasShort && !hasLong) return "wing";
  return "body";
}

function listedIndex(listed: readonly number[], strike: number): number {
  if (!listed.length) return -1;
  const n = normalizeStrike(strike);
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < listed.length; i++) {
    const d = Math.abs(listed[i] - n);
    if (d < bestD) {
      best = i;
      bestD = d;
    }
  }
  return best;
}

function expOf(leg: LegInput, front: string): string {
  return (leg.expiration || front || "").slice(0, 10);
}

/**
 * Apply a handle drag. `targetStrike` is the pointer price (snapped inside).
 * Returns null when the move is not representable on the listed grid.
 */
export function applyListedStrikeDrag(args: {
  legs: readonly LegInput[];
  grabbedStrike: number;
  targetStrike: number;
  shiftAll: boolean;
  frontExpiration: string;
  getListed: (expiration: string) => readonly number[];
}): LegInput[] | null {
  const { legs, grabbedStrike, targetStrike, shiftAll, frontExpiration, getListed } =
    args;
  if (!legs.length) return null;
  const grabLeg =
    legs.find((l) => nearly(l.strike, grabbedStrike)) ?? legs[0];
  const listed = uniqueListedStrikes(getListed(expOf(grabLeg, frontExpiration)));
  if (listed.length < 2) return null;
  const from = snapToListed(grabbedStrike, listed);
  const to = snapToListed(targetStrike, listed);
  if (from == null || to == null || from === to) return null;
  const steps = listedIndex(listed, to) - listedIndex(listed, from);
  if (!steps) return null;

  // Shift / group: every listed strike on the position moves in unison.
  if (shiftAll) {
    const next: LegInput[] = [];
    for (const l of legs) {
      const lst = uniqueListedStrikes(getListed(expOf(l, frontExpiration)));
      if (lst.length < 2) return null;
      const idx = listedIndex(lst, l.strike);
      const j = idx + steps;
      if (j < 0 || j >= lst.length) return null;
      next.push({ ...l, strike: lst[j], entry_price: 0 });
    }
    return next;
  }

  // Single handle: only the grabbed strike (and any legs on it) move.
  return legs.map((l) =>
    nearly(l.strike, grabbedStrike) ? { ...l, strike: to, entry_price: 0 } : l,
  );
}

export function applyStrikeDragToPosition(
  pos: AnalyzerPosition,
  grabbedStrike: number,
  targetStrike: number,
  shiftAll: boolean,
  getListed: (expiration: string) => readonly number[],
): AnalyzerPosition {
  const legs = applyListedStrikeDrag({
    legs: pos.position.legs,
    grabbedStrike,
    targetStrike,
    shiftAll,
    frontExpiration: pos.position.expiration,
    getListed,
  });
  if (!legs) return pos;
  const same = legs.every(
    (l, i) => normalizeStrike(l.strike) === normalizeStrike(pos.position.legs[i]?.strike),
  );
  if (same) return pos;
  const position = {
    ...pos.position,
    legs,
    net_debit_override: null,
  };
  return {
    ...pos,
    position,
    label: buildLabel(position.underlying, legs, position.expiration),
    notation: buildNotation(legs),
    lock: { mode: "unlocked" },
    lastNatSigned: null,
    definedDebitPerShare: null,
    livePackagePerShare: null,
    priceSide: null,
    bind: null,
    liveState: "not_live",
    displayAsOf: null,
    contentHashes: {},
    updatedAt: Date.now(),
  };
}
