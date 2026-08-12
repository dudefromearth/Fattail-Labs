/**
 * Client fly debit-grid history — Spec Advanced Fly §6 · AF10 · AF17.
 * Pure memory; no fetch. Live Debit always recomputed from ChainContext.
 */

export const FLY_HISTORY_DEFAULT_DEPTH = 32;
/** OD-AF3 — velocity/acceleration rate-noise floor (ms). */
export const VELOCITY_MIN_DT_MS = 500;
/** OD-AF10 — max gap for tick-delta modes (ms). */
export const TICK_MAX_DT_MS = 15_000;
/** OD-AF11 default |D_{t-1}| floor for pct_change. */
export const PCT_CHANGE_D_MIN = 0.05;

export type DebitGridSnap = {
  asOf: string | null;
  contentHash: string | null;
  receivedAt: number;
  /** key: `${side}|${K}|${w}` → D or null */
  cells: Map<string, number | null>;
};

export function cellKey(
  side: string,
  strike: number,
  widthPts: number,
): string {
  return `${side.toLowerCase()}|${strike}|${widthPts}`;
}

export type PairClock = {
  basis: "asOf" | "receivedAt";
  dtMs: number;
};

/**
 * Δt with single clock basis only (AF17b).
 * Prefer asOf–asOf when both present; else receivedAt–receivedAt.
 * Mixed basis → null.
 */
export function pairDeltaMs(
  newer: DebitGridSnap,
  older: DebitGridSnap,
): PairClock | null {
  const a0 = parseAsOfMs(newer.asOf);
  const a1 = parseAsOfMs(older.asOf);
  if (a0 != null && a1 != null) {
    return { basis: "asOf", dtMs: a0 - a1 };
  }
  if (a0 != null || a1 != null) {
    // Mixed: one has asOf, other doesn't — do not cross bases
    return null;
  }
  return {
    basis: "receivedAt",
    dtMs: newer.receivedAt - older.receivedAt,
  };
}

function parseAsOfMs(asOf: string | null | undefined): number | null {
  if (!asOf) return null;
  const t = Date.parse(asOf);
  return Number.isFinite(t) ? t : null;
}

/** tickPairHonest: d_debit · pct_change — NO 0.5s floor (P-B2). */
export function tickPairHonest(
  newer: DebitGridSnap,
  older: DebitGridSnap,
  maxDtMs: number = TICK_MAX_DT_MS,
): PairClock | null {
  const p = pairDeltaMs(newer, older);
  if (!p) return null;
  if (!(p.dtMs > 0) || p.dtMs > maxDtMs) return null;
  return p;
}

/** velocityPairHonest: tick honest ∧ Δt ≥ 0.5s (OD-AF3). */
export function velocityPairHonest(
  newer: DebitGridSnap,
  older: DebitGridSnap,
  maxDtMs: number = TICK_MAX_DT_MS,
  minDtMs: number = VELOCITY_MIN_DT_MS,
): PairClock | null {
  const p = tickPairHonest(newer, older, maxDtMs);
  if (!p) return null;
  if (p.dtMs < minDtMs) return null;
  return p;
}

export class FlySurfaceHistory {
  private snaps: DebitGridSnap[] = [];
  private readonly depth: number;
  /** After seam, time modes need fresh samples. */
  private seamed = false;

  constructor(depth: number = FLY_HISTORY_DEFAULT_DEPTH) {
    this.depth = Math.max(2, Math.min(256, depth));
  }

  clear(): void {
    this.snaps = [];
    this.seamed = true;
  }

  /** AF10/AF11 seam — discontinuity for time derivatives. */
  seam(): void {
    this.clear();
  }

  get depthLimit(): number {
    return this.depth;
  }

  get size(): number {
    return this.snaps.length;
  }

  /** Newest first: [0]=most recent pushed generation. */
  peek(i: number): DebitGridSnap | null {
    return this.snaps[i] ?? null;
  }

  /**
   * Push a debit grid. AF17(a): non-monotonic asOf → reject (return false)
   * without appending. Caller may seam instead.
   */
  push(snap: DebitGridSnap): boolean {
    const newest = this.snaps[0];
    if (newest) {
      const aNew = parseAsOfMs(snap.asOf);
      const aOld = parseAsOfMs(newest.asOf);
      if (aNew != null && aOld != null && aNew <= aOld) {
        return false; // reject non-monotonic
      }
    }
    this.snaps.unshift({
      ...snap,
      cells: new Map(snap.cells),
    });
    while (this.snaps.length > this.depth) this.snaps.pop();
    this.seamed = false;
    return true;
  }

  debitAt(
    side: string,
    strike: number,
    widthPts: number,
    lag: number,
  ): number | null {
    const s = this.snaps[lag];
    if (!s) return null;
    const v = s.cells.get(cellKey(side, strike, widthPts));
    return v == null || !Number.isFinite(v) ? null : v;
  }

  /**
   * Live D vs history[0] for tick modes.
   * liveSnap synthesizes current generation for pairing clocks.
   */
  tickDelta(
    live: DebitGridSnap,
    side: string,
    strike: number,
    widthPts: number,
  ): { dD: number; dtMs: number } | null {
    const prev = this.snaps[0];
    if (!prev) return null;
    const pair = tickPairHonest(live, prev);
    if (!pair) return null;
    const d0 = live.cells.get(cellKey(side, strike, widthPts));
    const d1 = prev.cells.get(cellKey(side, strike, widthPts));
    if (d0 == null || d1 == null || !Number.isFinite(d0) || !Number.isFinite(d1)) {
      return null;
    }
    return { dD: d0 - d1, dtMs: pair.dtMs };
  }

  velocityDelta(
    live: DebitGridSnap,
    side: string,
    strike: number,
    widthPts: number,
  ): { dD: number; dtMs: number } | null {
    const prev = this.snaps[0];
    if (!prev) return null;
    const pair = velocityPairHonest(live, prev);
    if (!pair) return null;
    const d0 = live.cells.get(cellKey(side, strike, widthPts));
    const d1 = prev.cells.get(cellKey(side, strike, widthPts));
    if (d0 == null || d1 == null || !Number.isFinite(d0) || !Number.isFinite(d1)) {
      return null;
    }
    return { dD: d0 - d1, dtMs: pair.dtMs };
  }

  /**
   * Δ² from last two history samples vs live for d2_debit.
   * Needs history[0] and history[1] both tick-honest with successive pairs.
   */
  d2Debit(
    live: DebitGridSnap,
    side: string,
    strike: number,
    widthPts: number,
  ): number | null {
    const h0 = this.snaps[0];
    const h1 = this.snaps[1];
    if (!h0 || !h1) return null;
    const p0 = tickPairHonest(live, h0);
    const p1 = tickPairHonest(h0, h1);
    if (!p0 || !p1) return null;
    const dL = live.cells.get(cellKey(side, strike, widthPts));
    const d0 = h0.cells.get(cellKey(side, strike, widthPts));
    const d1 = h1.cells.get(cellKey(side, strike, widthPts));
    if (
      dL == null ||
      d0 == null ||
      d1 == null ||
      !Number.isFinite(dL) ||
      !Number.isFinite(d0) ||
      !Number.isFinite(d1)
    ) {
      return null;
    }
    const dD0 = dL - d0;
    const dD1 = d0 - d1;
    return dD0 - dD1;
  }

  acceleration(
    live: DebitGridSnap,
    side: string,
    strike: number,
    widthPts: number,
  ): number | null {
    const h0 = this.snaps[0];
    const h1 = this.snaps[1];
    if (!h0 || !h1) return null;
    const p0 = velocityPairHonest(live, h0);
    const p1 = velocityPairHonest(h0, h1);
    if (!p0 || !p1) return null;
    const dL = live.cells.get(cellKey(side, strike, widthPts));
    const d0 = h0.cells.get(cellKey(side, strike, widthPts));
    const d1 = h1.cells.get(cellKey(side, strike, widthPts));
    if (
      dL == null ||
      d0 == null ||
      d1 == null ||
      !Number.isFinite(dL) ||
      !Number.isFinite(d0) ||
      !Number.isFinite(d1)
    ) {
      return null;
    }
    const v0 = (dL - d0) / (p0.dtMs / 60_000); // per minute
    const v1 = (d0 - d1) / (p1.dtMs / 60_000);
    const dtMin = p0.dtMs / 60_000;
    if (!(dtMin > 0)) return null;
    return (v0 - v1) / dtMin;
  }
}

/** Module singleton keyed by generation plane identity. */
const books = new Map<string, FlySurfaceHistory>();

export function historyBookKey(
  symbol: string,
  expiration: string,
  wings: number,
): string {
  return `${symbol.toUpperCase()}|${expiration.slice(0, 10)}|w${wings}`;
}

export function getFlyHistory(
  symbol: string,
  expiration: string,
  wings: number,
): FlySurfaceHistory {
  const k = historyBookKey(symbol, expiration, wings);
  let h = books.get(k);
  if (!h) {
    h = new FlySurfaceHistory();
    books.set(k, h);
  }
  return h;
}

export function seamFlyHistory(
  symbol: string,
  expiration: string,
  wings: number,
): void {
  getFlyHistory(symbol, expiration, wings).seam();
}

/** Drop all books (tests). */
export function resetAllFlyHistory(): void {
  books.clear();
}
