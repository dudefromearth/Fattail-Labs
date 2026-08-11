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
): number | null {
  const side = ctx.viewSide;
  const lo = body - widthPts;
  const hi = body + widthPts;
  const mLo = midAt(ctx, side, lo);
  const mBody = midAt(ctx, side, body);
  const mHi = midAt(ctx, side, hi);
  if (mLo == null || mBody == null || mHi == null) return null;
  return mLo + mHi - 2 * mBody;
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
