/** Structure pricing helpers — pure (Spec HM6) */

import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import type { ChainContext } from "./types";

export function midAt(
  ctx: ChainContext,
  side: "call" | "put",
  strike: number,
): number | null {
  const row = ctx.contracts.get(contractKey(side, strike));
  if (!row || row.mid == null || Number.isNaN(Number(row.mid))) return null;
  return Number(row.mid);
}

export function rowAt(
  ctx: ChainContext,
  side: "call" | "put",
  strike: number,
): LadderRow | undefined {
  return ctx.contracts.get(contractKey(side, strike));
}

/** Symmetric fly debit: long K-w, short 2×K, long K+w (mids). */
export function symFlyDebit(
  ctx: ChainContext,
  body: number,
  widthPts: number,
  side: "call" | "put" = ctx.viewSide,
): number | null {
  const lo = body - widthPts;
  const hi = body + widthPts;
  const mLo = midAt(ctx, side, lo);
  const mBody = midAt(ctx, side, body);
  const mHi = midAt(ctx, side, hi);
  if (mLo == null || mBody == null || mHi == null) return null;
  return mLo + mHi - 2 * mBody;
}

/** Call fly debit − put fly debit (same K,w generation). */
export function symFlyCpAsym(
  ctx: ChainContext,
  body: number,
  widthPts: number,
): number | null {
  const dc = symFlyDebit(ctx, body, widthPts, "call");
  const dp = symFlyDebit(ctx, body, widthPts, "put");
  if (dc == null || dp == null) return null;
  return dc - dp;
}

/**
 * Broken-wing fly debit: long lo / short 2×body / long hi (mids).
 * Wings need not be equal; all three strikes must be listed with mids.
 */
export function bwFlyDebit(
  ctx: ChainContext,
  body: number,
  lo: number,
  hi: number,
): number | null {
  if (!(lo < body && body < hi)) return null;
  const side = ctx.viewSide;
  const mLo = midAt(ctx, side, lo);
  const mBody = midAt(ctx, side, body);
  const mHi = midAt(ctx, side, hi);
  if (mLo == null || mBody == null || mHi == null) return null;
  return mLo + mHi - 2 * mBody;
}

/** View-side strikes sorted ascending (for N-strike wing walk). */
export function listedStrikesAsc(ctx: ChainContext): number[] {
  const side = ctx.viewSide;
  const set = new Set<number>();
  for (const row of ctx.contracts.values()) {
    if ((row.side || "call").toLowerCase() !== side) continue;
    const k = Number(row.strike);
    if (Number.isFinite(k)) set.add(k);
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * Walk `n` listed strikes from body toward lower (−) or upper (+).
 * n ≥ 1. Returns the wing strike, or null if body/wing not on the ladder.
 */
export function wingStrikeByCount(
  listedAsc: readonly number[],
  body: number,
  nStrikes: number,
  dir: "lower" | "upper",
): number | null {
  if (nStrikes < 1 || !listedAsc.length) return null;
  let idx = -1;
  for (let i = 0; i < listedAsc.length; i++) {
    if (listedAsc[i] === body) {
      idx = i;
      break;
    }
  }
  if (idx < 0) return null;
  const j = dir === "upper" ? idx + nStrikes : idx - nStrikes;
  if (j < 0 || j >= listedAsc.length) return null;
  return listedAsc[j];
}

/**
 * Resolve BWB wing strikes for body + equal wing (points) + broken wing (N strikes).
 *
 * - Equal wing: body ± equalWidthPts (exact listed strike required; no snap).
 * - Broken wing: N listed strikes from body on closest or furthest side vs spot.
 * - When spot is null: furthest → upper, closest → lower.
 */
export function resolveBwWings(
  ctx: ChainContext,
  body: number,
  equalWidthPts: number,
  nStrikes: number,
  wingSide: "closest" | "furthest",
): { lo: number; hi: number; brokenDir: "lower" | "upper" } | null {
  if (!(equalWidthPts > 0) || nStrikes < 1) return null;
  const side = ctx.viewSide;
  const listed = listedStrikesAsc(ctx);
  if (!listed.length) return null;
  if (!ctx.contracts.has(contractKey(side, body))) return null;

  // Side of body closest to spot (or lower when spot missing / at body).
  let closestDir: "lower" | "upper";
  if (ctx.spot == null || !Number.isFinite(ctx.spot)) {
    closestDir = "lower";
  } else if (body > ctx.spot) {
    closestDir = "lower"; // toward spot from above
  } else if (body < ctx.spot) {
    closestDir = "upper"; // toward spot from below
  } else {
    closestDir = "lower";
  }
  const furthestDir: "lower" | "upper" =
    closestDir === "lower" ? "upper" : "lower";
  const brokenDir = wingSide === "closest" ? closestDir : furthestDir;
  const equalDir: "lower" | "upper" =
    brokenDir === "lower" ? "upper" : "lower";

  const brokenK = wingStrikeByCount(listed, body, nStrikes, brokenDir);
  if (brokenK == null) return null;

  const equalK =
    equalDir === "lower" ? body - equalWidthPts : body + equalWidthPts;
  if (!ctx.contracts.has(contractKey(side, equalK))) return null;

  const lo = Math.min(brokenK, equalK);
  const hi = Math.max(brokenK, equalK);
  if (!(lo < body && body < hi)) return null;
  return { lo, hi, brokenDir };
}

/** Long vertical debit: long body, short body+width (calls) or body-width (puts). */
export function verticalDebit(
  ctx: ChainContext,
  body: number,
  widthPts: number,
): number | null {
  const side = ctx.viewSide;
  const longK = body;
  const shortK = side === "call" ? body + widthPts : body - widthPts;
  const mL = midAt(ctx, side, longK);
  const mS = midAt(ctx, side, shortK);
  if (mL == null || mS == null) return null;
  return mL - mS;
}

/**
 * gex_v1 per share: Γ·OI·S² ; call +, put − (Spec §5.5).
 */
export function gexSide(
  ctx: ChainContext,
  side: "call" | "put",
  strike: number,
): number | null {
  const row = rowAt(ctx, side, strike);
  if (!row) return null;
  if (row.gamma == null || row.open_interest == null || ctx.spot == null)
    return null;
  const g = Number(row.gamma);
  const oi = Number(row.open_interest);
  const s = Number(ctx.spot);
  if (!Number.isFinite(g) || !Number.isFinite(oi) || !Number.isFinite(s))
    return null;
  const raw = g * oi * s * s;
  return side === "call" ? raw : -raw;
}

/** Net = call + put; both sides required (AT-HM13). */
export function gexNet(
  ctx: ChainContext,
  strike: number,
): number | null {
  const c = gexSide(ctx, "call", strike);
  const p = gexSide(ctx, "put", strike);
  if (c == null || p == null) return null;
  return c + p;
}

/** Absolute = |call| + |put| (total magnitude; both sides required). */
export function gexAbs(
  ctx: ChainContext,
  strike: number,
): number | null {
  const c = gexSide(ctx, "call", strike);
  const p = gexSide(ctx, "put", strike);
  if (c == null || p == null) return null;
  return Math.abs(c) + Math.abs(p);
}

export function fmtMoney(n: number, digits = 2): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}
