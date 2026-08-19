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

export type FlyDirection = "long" | "short";

/**
 * Symmetric fly package mid (OPF sign: + pay / − receive).
 * Long/Debit  = +1 / −2 / +1 at K−w, K, K+w.
 * Short/Credit = −1 / +2 / −1 at the same strikes.
 */
export function symFlyPackage(
  ctx: ChainContext,
  body: number,
  widthPts: number,
  direction: FlyDirection = "long",
  side: "call" | "put" = ctx.viewSide,
): number | null {
  const lo = body - widthPts;
  const hi = body + widthPts;
  const mLo = midAt(ctx, side, lo);
  const mBody = midAt(ctx, side, body);
  const mHi = midAt(ctx, side, hi);
  if (mLo == null || mBody == null || mHi == null) return null;
  const qLo = direction === "long" ? 1 : -1;
  const qBody = direction === "long" ? -2 : 2;
  const qHi = direction === "long" ? 1 : -1;
  return qLo * mLo + qBody * mBody + qHi * mHi;
}

/** Long fly package: +1 / −2 / +1. */
export function symFlyDebit(
  ctx: ChainContext,
  body: number,
  widthPts: number,
  side: "call" | "put" = ctx.viewSide,
): number | null {
  return symFlyPackage(ctx, body, widthPts, "long", side);
}

/** Spot, else nearest listed center to live spot, else the middle row. */
export function flySpotCenter(
  ctx: ChainContext,
  centersDesc: readonly number[],
): number | null {
  if (!centersDesc.length) return null;
  let mark: number | null = null;
  for (const row of ctx.contracts.values()) {
    if (row.is_spot && Number.isFinite(Number(row.strike))) {
      mark = Number(row.strike);
      break;
    }
  }
  if (mark == null && ctx.spot != null && Number.isFinite(ctx.spot) && ctx.spot > 0) {
    mark = ctx.spot;
  }
  if (mark == null) {
    return centersDesc[Math.floor(centersDesc.length / 2)] ?? null;
  }
  let best = centersDesc[0];
  let bestD = Math.abs(best - mark);
  for (const k of centersDesc) {
    const d = Math.abs(k - mark);
    if (d < bestD) {
      best = k;
      bestD = d;
    }
  }
  return best;
}

/**
 * Listed mids are cent-class. A package below a half-cent is float dust
 * (wings ≈ 2× body), not a ratio denominator.
 */
export const LISTED_PACKAGE_EPS = 0.005;

export function isUsablePackageDebit(d: number | null | undefined): d is number {
  return d != null && Number.isFinite(d) && Math.abs(d) >= LISTED_PACKAGE_EPS;
}

/** Positive listed debit — R:R denominator. Dust and credits are not. */
export function isPositiveListedDebit(d: number | null | undefined): d is number {
  return d != null && Number.isFinite(d) && d > LISTED_PACKAGE_EPS;
}

/**
 * Heatmap tile face. A number that will not fit 3 digits + 2 decimals
 * (5 digits, |n| ≥ 1000) paints as xxx.xx. The honest value is `alt`.
 */
export const HEATMAP_TILE_MASK = "xxx.xx";
export const HEATMAP_TILE_ABS_MAX = 1000;

function heatmapTileSuffix(display: string): string {
  if (display.endsWith("%")) return "%";
  if (display.endsWith("¢")) return "¢";
  return "";
}

function heatmapTileExact(n: number, suffix: string): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1e6 || (n !== 0 && Math.abs(n) < 1e-6)) {
    return `${n}${suffix}`;
  }
  return `${n.toFixed(2)}${suffix}`;
}

export function formatHeatmapTileFace(
  display: string | null | undefined,
  value: number | null | undefined,
): { face: string; alt: string } {
  const shown = display == null || display === "" ? "—" : display;
  if (shown === "—") return { face: "—", alt: "—" };
  const suffix = heatmapTileSuffix(shown);
  const alt =
    value != null && Number.isFinite(value)
      ? heatmapTileExact(value, suffix)
      : shown;
  const digits = shown.replace(/[^\d]/g, "").length;
  const unusual =
    (value != null && Number.isFinite(value) && Math.abs(value) >= HEATMAP_TILE_ABS_MAX) ||
    digits > 5;
  if (unusual) {
    return { face: `${HEATMAP_TILE_MASK}${suffix}`, alt };
  }
  return { face: shown, alt };
}

/**
 * % change on the outer cell (further from spot).
 * Starting (inner) 9, next (outer) 7 → |((9 − 7) / 9) × 100|.
 * Never negative. Spot row is 0.
 */
export function debitPctFromSpot(
  ctx: ChainContext,
  centersDesc: readonly number[],
  idx: number,
  debitAt: (strike: number) => number | null,
): number | null {
  if (idx < 0 || idx >= centersDesc.length) return null;
  const spotK = flySpotCenter(ctx, centersDesc);
  if (spotK == null) return null;
  const k = centersDesc[idx];
  if (k === spotK) return 0;
  const inIdx = k > spotK ? idx + 1 : idx - 1;
  if (inIdx < 0 || inIdx >= centersDesc.length) return null;
  const dOuter = debitAt(k);
  const dInner = debitAt(centersDesc[inIdx]);
  if (dOuter == null || !isUsablePackageDebit(dInner)) return null;
  return Math.abs(((dInner - dOuter) / dInner) * 100);
}

export function symFlyDebitPctFromSpot(
  ctx: ChainContext,
  centersDesc: readonly number[],
  idx: number,
  widthPts: number,
): number | null {
  return debitPctFromSpot(ctx, centersDesc, idx, (strike) =>
    symFlyDebit(ctx, strike, widthPts),
  );
}

export function verticalDebitPctFromSpot(
  ctx: ChainContext,
  centersDesc: readonly number[],
  idx: number,
  widthPts: number,
): number | null {
  return debitPctFromSpot(ctx, centersDesc, idx, (strike) =>
    verticalPackage(ctx, strike, widthPts, "long"),
  );
}

export type FlyGreekName = "delta" | "gamma" | "theta";

/**
 * Long-fly package greek from listed chain rows: +1/−2/+1.
 * Missing greek on any leg → null (no invented surface derivative).
 */
export function symFlyGreek(
  ctx: ChainContext,
  body: number,
  widthPts: number,
  greek: FlyGreekName,
  side: "call" | "put" = ctx.viewSide,
): number | null {
  const lo = rowAt(ctx, side, body - widthPts);
  const mid = rowAt(ctx, side, body);
  const hi = rowAt(ctx, side, body + widthPts);
  if (!lo || !mid || !hi) return null;
  const a = Number(lo[greek]);
  const b = Number(mid[greek]);
  const c = Number(hi[greek]);
  if (![a, b, c].every((n) => Number.isFinite(n))) return null;
  return a - 2 * b + c;
}

/** Short fly package: −1 / +2 / −1. */
export function symFlyCredit(
  ctx: ChainContext,
  body: number,
  widthPts: number,
  side: "call" | "put" = ctx.viewSide,
): number | null {
  return symFlyPackage(ctx, body, widthPts, "short", side);
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

/** Far strike of a debit vertical: calls up, puts down. Must be listed. */
export function verticalFarStrike(
  side: "call" | "put",
  body: number,
  widthPts: number,
): number {
  return side === "call" ? body + widthPts : body - widthPts;
}

/**
 * Vertical package mid (OPF +pay / −receive).
 * Long/Debit: +1 body, −1 far (call K+w / put K−w).
 * Short/Credit: −1 body, +1 far.
 */
export function verticalPackage(
  ctx: ChainContext,
  body: number,
  widthPts: number,
  direction: FlyDirection = "long",
): number | null {
  const side = ctx.viewSide;
  const far = verticalFarStrike(side, body, widthPts);
  const mBody = midAt(ctx, side, body);
  const mFar = midAt(ctx, side, far);
  if (mBody == null || mFar == null) return null;
  return direction === "long" ? mBody - mFar : mFar - mBody;
}

/** Long vertical debit: long body, short body+width (calls) or body-width (puts). */
export function verticalDebit(
  ctx: ChainContext,
  body: number,
  widthPts: number,
): number | null {
  return verticalPackage(ctx, body, widthPts, "long");
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
