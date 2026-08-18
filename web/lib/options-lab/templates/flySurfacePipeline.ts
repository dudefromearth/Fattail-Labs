/**
 * Advanced Fly compute pipeline — memory-safe, debit-diff, sticky hold.
 *
 * Critical bounds (browser crash prevention):
 * - Only compute **requested modes** (default: active mode only).
 * - Cap centers × widths; skip full 11-mode matrix every tick.
 * - History depth ≤ 4 full debit maps; older drops immediately.
 * - Same contentHash → no re-ingest (mode switch uses ensureMode only).
 * - Sticky hold: last valid display retained until next valid ready.
 */

import { contractKey } from "@/lib/chainLadderApi";
import {
  cellKey,
  type DebitGridSnap,
  type FlySurfaceHistory,
  FlySurfaceHistory as FlyHistoryClass,
  FLY_HISTORY_DEFAULT_DEPTH,
} from "./flySurfaceHistory";
import { HEATMAP_FLY_WIDTHS, heatmapFlyWidths } from "./symFly";
import {
  symFlyCpAsym,
  symFlyDebit,
  symFlyDebitPctFromSpot,
  symFlyGreek,
} from "./pricing";
import type {
  ChainContext,
  ColDef,
  GridCell,
  RowDef,
  ValueModeId,
} from "./types";

/** Hard caps — SPX ±50 dual-side can be large; fly surface must stay lean. */
export const FLY_MAX_CENTERS = 80;
/** Must cover HEATMAP_FLY_WIDTHS (10…50 by 5 = 9 cols). 8 dropped the 50. */
export const FLY_MAX_WIDTHS = HEATMAP_FLY_WIDTHS.length;
/** History depth for time modes (velocity needs ≥2 gens). */
export const FLY_HISTORY_DEPTH = 4;

export type HeldCell = {
  display: string;
  value: number | null;
  valid: boolean;
  tooltip?: string;
};

export type FlyPipelinePaint = {
  genKey: string;
  contentHash: string | null;
  asOf: string | null;
  rows: RowDef[];
  cols: ColDef[];
  /** Single-mode grid only (not all modes). */
  cells: GridCell[][];
  mode: ValueModeId;
  stats: {
    debitValid: number;
    changedKeys: number;
    recomputeCount: number;
    heldReuse: number;
    historySize: number;
    modeValid: number;
  };
};

const TIME_MODES = new Set<ValueModeId>([
  "velocity",
  "acceleration",
]);

function fmt(n: number): string {
  return n.toFixed(2);
}

function centersFromCtx(ctx: ChainContext, widths: number[]): number[] {
  const side = ctx.viewSide;
  const strikes: number[] = [];
  for (const row of ctx.contracts.values()) {
    if ((row.side || "call").toLowerCase() !== side) continue;
    const k = Number(row.strike);
    if (Number.isFinite(k)) strikes.push(k);
  }
  strikes.sort((a, b) => b - a);
  // Prefer ATM band: keep centers that can form at least one width
  const out: number[] = [];
  for (const k of strikes) {
    const can = widths.some(
      (w) =>
        ctx.contracts.has(contractKey(side, k - w)) &&
        ctx.contracts.has(contractKey(side, k)) &&
        ctx.contracts.has(contractKey(side, k + w)),
    );
    if (can) out.push(k);
    if (out.length >= FLY_MAX_CENTERS) break;
  }
  return out;
}

function debitMap(
  ctx: ChainContext,
  centers: number[],
  widths: number[],
): Map<string, number | null> {
  const m = new Map<string, number | null>();
  const side = ctx.viewSide;
  for (const k of centers) {
    for (const w of widths) {
      m.set(cellKey(side, k, w), symFlyDebit(ctx, k, w));
    }
  }
  return m;
}

function diffDebitKeys(
  prev: Map<string, number | null>,
  next: Map<string, number | null>,
): string[] {
  if (prev.size === 0) return [...next.keys()];
  const changed: string[] = [];
  for (const [k, b] of next) {
    const a = prev.get(k);
    const an = a == null || !Number.isFinite(a as number) ? null : a;
    const bn = b == null || !Number.isFinite(b as number) ? null : b;
    if (an !== bn) changed.push(k);
  }
  for (const k of prev.keys()) {
    if (!next.has(k)) changed.push(k);
  }
  return changed;
}

/** Neighbor expand limited to ±1 center same width — not full width column. */
function expandNeighbors(
  changed: string[],
  centers: number[],
  side: string,
): Set<string> {
  const out = new Set(changed);
  const idx = new Map(centers.map((c, i) => [c, i]));
  for (const key of changed) {
    const p = key.split("|");
    if (p.length < 3) continue;
    const k = Number(p[1]);
    const w = Number(p[2]);
    const i = idx.get(k);
    if (i == null || !Number.isFinite(w)) continue;
    if (i > 0) out.add(cellKey(side, centers[i - 1], w));
    if (i + 1 < centers.length) out.add(cellKey(side, centers[i + 1], w));
  }
  return out;
}

function computeOne(
  mode: ValueModeId,
  ctx: ChainContext,
  side: string,
  k: number,
  w: number,
  d: number | null,
  centers: number[],
  cIdx: number,
  hist: FlySurfaceHistory,
  live: DebitGridSnap,
): HeldCell {
  if (mode === "d_debit" || mode === "d2_debit" || mode === "theta") {
    const greek =
      mode === "d_debit" ? "delta" : mode === "d2_debit" ? "gamma" : "theta";
    const g = symFlyGreek(ctx, k, w, greek);
    if (g == null) {
      return {
        display: "—",
        value: null,
        valid: false,
        tooltip: `Missing listed ${greek} on a fly leg`,
      };
    }
    const digits = greek === "gamma" ? 4 : 3;
    return {
      display: g.toFixed(digits),
      value: g,
      valid: true,
      tooltip: `Long fly ${greek} = +1/−2/+1 chain ${greek}s`,
    };
  }
  if (d == null || !Number.isFinite(d)) {
    return {
      display: "—",
      value: null,
      valid: false,
      tooltip: "Missing listed wing or null mid",
    };
  }

  if (mode === "debit") {
    return {
      display: fmt(d),
      value: d,
      valid: true,
      tooltip: `Debit ${fmt(d)} (mid)`,
    };
  }
  if (mode === "credit") {
    const c = -d;
    return {
      display: fmt(c),
      value: c,
      valid: true,
      tooltip: `Short fly −1/+2/−1 · package ${fmt(c)} (mid)`,
    };
  }
  if (mode === "r2r") {
    if (!(d > 0) || !(w - d > 0)) {
      return { display: "—", value: null, valid: false, tooltip: "Risk to Reward n/a" };
    }
    const rr = (w - d) / d;
    return {
      display: rr.toFixed(2),
      value: rr,
      valid: true,
      tooltip: "Risk to Reward = (width − debit) / debit",
    };
  }
  if (mode === "cp_asym") {
    const a = symFlyCpAsym(ctx, k, w);
    if (a == null) {
      return {
        display: "—",
        value: null,
        valid: false,
        tooltip: "Call or put fly incomplete",
      };
    }
    return {
      display: Math.abs(a) < 1 ? `${(a * 100).toFixed(1)}¢` : fmt(a),
      value: a,
      valid: true,
      tooltip: "Call − put fly debit (book asymmetry)",
    };
  }
  if (mode === "pct_change") {
    const pct = symFlyDebitPctFromSpot(ctx, centers, cIdx, w);
    if (pct == null) {
      return {
        display: "—",
        value: null,
        valid: false,
        tooltip: "Need debit at this strike and the next toward spot",
      };
    }
    return {
      display: `${pct.toFixed(1)}%`,
      value: pct,
      valid: true,
      tooltip: "% change in debit = |(inner − outer) / inner|",
    };
  }
  if (mode === "slope" || mode === "curvature") {
    return spatial(mode, ctx, centers, cIdx, w);
  }
  return timeMode(mode, hist, live, side, k, w, d);
}

function spatial(
  mode: "slope" | "curvature",
  ctx: ChainContext,
  centers: number[],
  idx: number,
  w: number,
): HeldCell {
  if (idx < 0 || idx >= centers.length - 1) {
    return {
      display: "—",
      value: null,
      valid: false,
      tooltip: "Edge — no lower neighbor",
    };
  }
  const Ki = centers[idx];
  const Kj = centers[idx + 1];
  const Di = symFlyDebit(ctx, Ki, w);
  const Dj = symFlyDebit(ctx, Kj, w);
  if (Di == null || Dj == null) {
    return {
      display: "—",
      value: null,
      valid: false,
      tooltip: "Incomplete fly",
    };
  }
  const gap = Ki - Kj;
  if (!(gap > 0)) {
    return { display: "—", value: null, valid: false, tooltip: "Bad gap" };
  }
  const s0 = (Di - Dj) / gap;
  if (mode === "slope") {
    return {
      display: s0.toFixed(4),
      value: s0,
      valid: true,
      tooltip: "Slope ΔD/ΔK",
    };
  }
  if (idx >= centers.length - 2) {
    return {
      display: "—",
      value: null,
      valid: false,
      tooltip: "Edge — need three centers",
    };
  }
  const Kk = centers[idx + 2];
  const Dk = symFlyDebit(ctx, Kk, w);
  if (Dk == null) {
    return {
      display: "—",
      value: null,
      valid: false,
      tooltip: "Incomplete fly",
    };
  }
  const gap2 = Kj - Kk;
  if (!(gap2 > 0) || Math.abs(gap - gap2) > 1e-9) {
    return {
      display: "—",
      value: null,
      valid: false,
      tooltip: "Non-uniform spacing",
    };
  }
  const s1 = (Dj - Dk) / gap2;
  const c = s0 - s1;
  return {
    display: c.toFixed(4),
    value: c,
    valid: true,
    tooltip: "Curvature",
  };
}

function timeMode(
  mode: ValueModeId,
  hist: FlySurfaceHistory,
  live: DebitGridSnap,
  side: string,
  k: number,
  w: number,
  d: number,
): HeldCell {
  live.cells.set(cellKey(side, k, w), d);

  if (mode === "velocity") {
    const t = hist.velocityDelta(live, side, k, w);
    if (!t) {
      return {
        display: "—",
        value: null,
        valid: false,
        tooltip: "Needs prior · Δt≥0.5s · pts/min",
      };
    }
    const v = t.dD / (t.dtMs / 60_000);
    return {
      display: v.toFixed(3),
      value: v,
      valid: true,
      tooltip: `Velocity ${v.toFixed(3)} pts/min`,
    };
  }
  if (mode === "acceleration") {
    const a = hist.acceleration(live, side, k, w);
    if (a == null) {
      return {
        display: "—",
        value: null,
        valid: false,
        tooltip: "Needs two velocity samples",
      };
    }
    return {
      display: a.toFixed(3),
      value: a,
      valid: true,
      tooltip: "Acceleration",
    };
  }
  return { display: "—", value: null, valid: false };
}

function hold(
  map: Map<string, HeldCell>,
  key: string,
  next: HeldCell,
): { cell: HeldCell; reused: boolean } {
  if (next.valid && next.display !== "—") {
    map.set(key, next);
    return { cell: next, reused: false };
  }
  const prev = map.get(key);
  if (prev?.valid && prev.display !== "—") {
    return { cell: prev, reused: true };
  }
  map.set(key, next);
  return { cell: next, reused: false };
}

export class FlySurfacePipeline {
  readonly history: FlySurfaceHistory;
  private lastDebits = new Map<string, number | null>();
  private heldByMode = new Map<ValueModeId, Map<string, HeldCell>>();
  private lastCenters: number[] = [];
  private lastWidths: number[] = [];
  private lastHash: string | null = null;
  private lastSide: string | null = null;
  private lastPaint: FlyPipelinePaint | null = null;

  constructor() {
    this.history = new FlyHistoryClass(FLY_HISTORY_DEPTH);
  }

  seam(): void {
    this.history.seam();
    this.lastDebits.clear();
    this.lastHash = null;
    this.lastPaint = null;
    this.heldByMode.clear();
  }

  /**
   * Ingest OPF chain generation for **one** display mode.
   * Same contentHash + same mode → returns cached paint (no alloc).
   */
  ingest(
    ctx: ChainContext,
    mode: ValueModeId,
    widths?: number[],
    opts?: { receivedAt?: number },
  ): FlyPipelinePaint {
    const wList = (widths?.length ? widths : heatmapFlyWidths(ctx.strikeStep, 7))
      .slice(0, FLY_MAX_WIDTHS);
    const centers = centersFromCtx(ctx, wList);
    const side = ctx.viewSide;
    const hash = ctx.contentHash;
    const genKey = `${hash ?? ""}|${ctx.asOf ?? ""}|${side}|${mode}`;
    const receivedAt = opts?.receivedAt ?? Date.now();

    // Fast path: identical generation + mode already painted
    if (
      this.lastPaint &&
      this.lastHash === hash &&
      this.lastSide === side &&
      this.lastPaint.mode === mode &&
      hash
    ) {
      return this.lastPaint;
    }

    const debits = debitMap(ctx, centers, wList);
    const geomChanged =
      this.lastSide !== side ||
      centers.length !== this.lastCenters.length ||
      wList.length !== this.lastWidths.length ||
      centers.some((c, i) => c !== this.lastCenters[i]) ||
      wList.some((w, i) => w !== this.lastWidths[i]);

    let changed = geomChanged
      ? [...debits.keys()]
      : diffDebitKeys(this.lastDebits, debits);

    const genChanged = !hash || hash !== this.lastHash || geomChanged;
    const modeChanged = this.lastPaint?.mode !== mode;
    const held = this.heldByMode.get(mode);
    const modeCold = !held || held.size === 0;

    // Same gen + same mode + no debit delta → reuse paint (zero alloc)
    if (
      !genChanged &&
      !modeChanged &&
      !geomChanged &&
      changed.length === 0 &&
      this.lastPaint
    ) {
      return this.lastPaint;
    }

    // Full pass when: geometry change, first paint for this mode, or time mode on new gen
    if (
      geomChanged ||
      modeCold ||
      modeChanged ||
      (TIME_MODES.has(mode) && genChanged)
    ) {
      changed = [...debits.keys()];
    }

    const keys = expandNeighbors(changed, centers, side);

    const live: DebitGridSnap = {
      asOf: ctx.asOf,
      contentHash: hash,
      receivedAt,
      cells: debits, // shared ref — do not mutate after push clone
    };

    // Archive gen only when hash changes and we have mids
    if (genChanged) {
      let any = false;
      for (const v of debits.values()) {
        if (v != null && Number.isFinite(v)) {
          any = true;
          break;
        }
      }
      if (any) {
        // Clone map for history so later debitMap edits don't corrupt lag
        const snap: DebitGridSnap = {
          asOf: ctx.asOf,
          contentHash: hash,
          receivedAt,
          cells: new Map(debits),
        };
        if (!this.history.push(snap)) {
          this.history.seam();
        }
      }
    }

    if (!this.heldByMode.has(mode)) this.heldByMode.set(mode, new Map());
    const heldMap = this.heldByMode.get(mode)!;
    if (geomChanged) {
      for (const k of [...heldMap.keys()]) {
        if (!debits.has(k)) heldMap.delete(k);
      }
    }

    const cIdx = new Map(centers.map((c, i) => [c, i]));
    let recomputeCount = 0;
    let heldReuse = 0;
    let modeValid = 0;
    let debitValid = 0;

    for (const v of debits.values()) {
      if (v != null && Number.isFinite(v)) debitValid++;
    }

    const runKeys = keys.size ? keys : new Set(debits.keys());
    for (const key of runKeys) {
      const p = key.split("|");
      const k = Number(p[1]);
      const w = Number(p[2]);
      const d = debits.get(key) ?? null;
      const next = computeOne(
        mode,
        ctx,
        side,
        k,
        w,
        d,
        centers,
        cIdx.get(k) ?? -1,
        this.history,
        live,
      );
      recomputeCount++;
      const { cell, reused } = hold(heldMap, key, next);
      if (reused) heldReuse++;
      if (cell.valid) modeValid++;
    }

    if (!genChanged && !geomChanged && !modeChanged) {
      modeValid = 0;
      for (const h of heldMap.values()) if (h.valid) modeValid++;
    }

    const rows: RowDef[] = centers.map((k) => ({
      strike: k,
      label: String(k),
      isSpot: Boolean(ctx.contracts.get(contractKey(side, k))?.is_spot),
    }));
    const cols: ColDef[] = wList.map((w) => ({
      id: `w${w}`,
      label: String(w),
      widthPts: w,
    }));

    // Build single-mode grid from held only (one pass)
    const cells: GridCell[][] = new Array(rows.length);
    for (let ri = 0; ri < rows.length; ri++) {
      const rowCells: GridCell[] = new Array(cols.length);
      for (let ci = 0; ci < cols.length; ci++) {
        const key = cellKey(side, rows[ri].strike, cols[ci].widthPts);
        const h = heldMap.get(key);
        rowCells[ci] = h
          ? {
              display: h.display,
              value: h.value,
              valid: h.valid,
              tooltip: h.tooltip,
              colorT: null,
            }
          : {
              display: "—",
              value: null,
              valid: false,
              colorT: null,
            };
      }
      cells[ri] = rowCells;
    }

    this.lastDebits = debits;
    this.lastCenters = centers;
    this.lastWidths = wList;
    this.lastHash = hash;
    this.lastSide = side;

    const paint: FlyPipelinePaint = {
      genKey,
      contentHash: hash,
      asOf: ctx.asOf,
      rows,
      cols,
      cells,
      mode,
      stats: {
        debitValid,
        changedKeys: changed.length,
        recomputeCount,
        heldReuse,
        historySize: this.history.size,
        modeValid,
      },
    };
    this.lastPaint = paint;
    return paint;
  }
}

/** Ladder JSON → ChainContext for headless OPF ingest. */
export function chainContextFromLadderRows(
  symbol: string,
  expiration: string,
  viewSide: "call" | "put",
  rows: Array<{
    strike: number;
    side?: string;
    mid?: number | null;
    is_spot?: boolean;
  }>,
  meta?: {
    spot?: number | null;
    strike_step?: number | null;
    wings?: number;
    as_of?: string | null;
    content_hash?: string | null;
  },
): ChainContext {
  const contracts = new Map();
  for (const r of rows) {
    const s = (r.side || "call").toLowerCase();
    contracts.set(contractKey(s, r.strike), {
      strike: r.strike,
      side: s,
      mid: r.mid,
      is_spot: r.is_spot,
    });
  }
  return {
    symbol,
    viewSide,
    spot: meta?.spot ?? null,
    strikeStep: meta?.strike_step ?? null,
    wings: meta?.wings ?? 50,
    contracts,
    asOf: meta?.as_of ?? null,
    contentHash: meta?.content_hash ?? null,
  };
}

// re-export depth constant used by history default
void FLY_HISTORY_DEFAULT_DEPTH;
