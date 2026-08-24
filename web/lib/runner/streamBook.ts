/**
 * Runner stream book — TR14 · DL-574.
 * Client RAM ring of subscribed OPF generations. Templates do not read this.
 */

import type { LadderRow } from "../chainLadderApi";
import { widthFitFill } from "../options-lab/templates/widthFit";
import type { GridCell, WidthFitWeights } from "../options-lab/templates/types";

export const MIB = 1024 * 1024;
export const BUDGET_STOPS_MIB = [4, 8, 16, 32] as const;
export type BudgetStopMib = (typeof BUDGET_STOPS_MIB)[number];
export const DEFAULT_BUDGET_MIB: BudgetStopMib = 8;
export const FLOOR_MIB: BudgetStopMib = 4;
export const CEILING_MIB: BudgetStopMib = 32;
export const WINDOW_STOPS = [10, 20, 50, 100] as const;
export type AverageWindow = (typeof WINDOW_STOPS)[number];

export function clampBudgetMib(n: number): BudgetStopMib {
  const stops = BUDGET_STOPS_MIB;
  let best: BudgetStopMib = DEFAULT_BUDGET_MIB;
  let dist = Infinity;
  for (const s of stops) {
    const d = Math.abs(s - n);
    if (d < dist) {
      dist = d;
      best = s;
    }
  }
  return best;
}

export function clampWindow(n: number): AverageWindow {
  const stops = WINDOW_STOPS;
  let best: AverageWindow = 10;
  let dist = Infinity;
  for (const s of stops) {
    const d = Math.abs(s - n);
    if (d < dist) {
      dist = d;
      best = s;
    }
  }
  return best;
}

export function interestKey(symbol: string, expiration: string): string {
  return `${symbol.toUpperCase()}|${(expiration || "").slice(0, 10)}`;
}

export function weightsFingerprint(w: WidthFitWeights): string {
  return [
    w.debit_efficiency,
    w.payoff_efficiency,
    w.gamma_efficiency,
    w.curvature_efficiency,
    w.theta_efficiency,
    w.surface_responsiveness,
    w.call_put_asymmetry,
  ]
    .map((n) => Number(n).toFixed(6))
    .join(",");
}

export type StreamMeta = {
  contentHash: string;
  asOf: string | null;
  receivedAt: number;
  epochQuality: string;
  stale: boolean;
};

export type WidthFitMemo = {
  weightsFp: string;
  colorT: Array<Array<number | null>>;
  widthPts: number[];
  median: Array<number | null>;
  stability: Array<number | null>;
  n: number[];
};

export type ContractSnap = { key: string; row: LadderRow };

export type StreamSlot = StreamMeta & {
  contracts: ContractSnap[];
  spot: number | null;
  strikeStep: number | null;
  wings: number;
  bytes: number;
  memo: WidthFitMemo | null;
};

export function measureSlotBytes(slot: Omit<StreamSlot, "bytes">): number {
  const body = JSON.stringify({
    h: slot.contentHash,
    a: slot.asOf,
    r: slot.receivedAt,
    q: slot.epochQuality,
    s: slot.stale,
    spot: slot.spot,
    step: slot.strikeStep,
    wings: slot.wings,
    contracts: slot.contracts,
    memo: slot.memo,
  });
  return body.length;
}

export function contractsFromMap(
  contracts: Map<string, LadderRow>,
): ContractSnap[] {
  const out: ContractSnap[] = [];
  for (const [key, row] of contracts) {
    out.push({ key, row });
  }
  return out;
}

export type CacheStatus = {
  bytesUsed: number;
  budgetBytes: number;
  gens: number;
  spanMs: number;
  atLimit: boolean;
  oversize: boolean;
};

export class StreamBook {
  private books = new Map<string, StreamSlot[]>();
  private budgetMib: BudgetStopMib = DEFAULT_BUDGET_MIB;
  private oversize = false;

  setBudgetMib(n: number): void {
    this.budgetMib = clampBudgetMib(n);
    this.evict();
  }

  get budgetBytes(): number {
    return this.budgetMib * MIB;
  }

  get budgetMibValue(): BudgetStopMib {
    return this.budgetMib;
  }

  bytesUsed(): number {
    let n = 0;
    for (const slots of this.books.values()) {
      for (const s of slots) n += s.bytes;
    }
    return n;
  }

  size(key?: string): number {
    if (key) return this.books.get(key)?.length ?? 0;
    let n = 0;
    for (const slots of this.books.values()) n += slots.length;
    return n;
  }

  spanMs(key: string): number {
    const slots = this.books.get(key);
    if (!slots?.length) return 0;
    const times = slots.map((s) => parseTime(s));
    return Math.max(0, Math.max(...times) - Math.min(...times));
  }

  status(key: string): CacheStatus {
    const used = this.bytesUsed();
    return {
      bytesUsed: used,
      budgetBytes: this.budgetBytes,
      gens: this.size(key),
      spanMs: this.spanMs(key),
      atLimit: used >= this.budgetBytes * 0.98 || this.oversize,
      oversize: this.oversize,
    };
  }

  /**
   * Push a generation. Same contentHash as newest for this key → replace in
   * place (no extra slot). Then global drop-oldest until under budget.
   */
  push(key: string, raw: Omit<StreamSlot, "bytes">): StreamSlot {
    const bytes = measureSlotBytes(raw);
    const slot: StreamSlot = { ...raw, bytes };
    this.oversize = bytes > this.budgetBytes;
    let list = this.books.get(key);
    if (!list) {
      list = [];
      this.books.set(key, list);
    }
    const newest = list[0];
    if (newest && newest.contentHash === slot.contentHash) {
      list[0] = slot;
      this.evict();
      return slot;
    }
    list.unshift(slot);
    this.evict();
    return slot;
  }

  window(key: string, n: number): StreamSlot[] {
    const w = Math.max(1, Math.floor(n));
    return (this.books.get(key) ?? []).slice(0, w);
  }

  atTime(key: string, tMs: number): StreamSlot | null {
    const list = this.books.get(key);
    if (!list?.length) return null;
    let best = list[0];
    let bestD = Math.abs(parseTime(best) - tMs);
    for (const s of list) {
      const d = Math.abs(parseTime(s) - tMs);
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }

  clear(key?: string): void {
    if (key) this.books.delete(key);
    else this.books.clear();
    this.oversize = false;
  }

  averageColorT(
    key: string,
    n: number,
    weightsFp: string,
  ): { grid: Array<Array<number | null>>; used: number } {
    const slots = this.window(key, n).filter(
      (s) => s.memo && s.memo.weightsFp === weightsFp,
    );
    return meanGrid(
      slots.map((s) => s.memo!.colorT),
      slots.length,
    );
  }

  averageWidthStats(
    key: string,
    n: number,
    weightsFp: string,
  ): {
    widthPts: number[];
    meanMedian: Array<number | null>;
    minStability: Array<number | null>;
    nGens: number[];
    used: number;
  } {
    const slots = this.window(key, n).filter(
      (s) => s.memo && s.memo.weightsFp === weightsFp,
    );
    const widthPts = slots[0]?.memo?.widthPts ?? [];
    const cols = widthPts.length;
    const meanMedian: Array<number | null> = [];
    const minStability: Array<number | null> = [];
    const nGens: number[] = [];
    for (let ci = 0; ci < cols; ci++) {
      const meds: number[] = [];
      const stabs: number[] = [];
      for (const s of slots) {
        const m = s.memo!.median[ci];
        if (m != null && Number.isFinite(m)) meds.push(m);
        const st = s.memo!.stability[ci];
        if (st != null && Number.isFinite(st)) stabs.push(st);
      }
      meanMedian[ci] = meds.length
        ? meds.reduce((a, b) => a + b, 0) / meds.length
        : null;
      minStability[ci] = stabs.length ? Math.min(...stabs) : null;
      nGens[ci] = meds.length;
    }
    return {
      widthPts,
      meanMedian,
      minStability,
      nGens,
      used: slots.length,
    };
  }

  private evict(): void {
    const cap = this.budgetBytes;
    if (this.oversize) {
      // Keep only the newest slot overall.
      let newest: { key: string; slot: StreamSlot } | null = null;
      for (const [k, list] of this.books) {
        const s = list[0];
        if (!s) continue;
        if (!newest || s.receivedAt > newest.slot.receivedAt) {
          newest = { key: k, slot: s };
        }
      }
      this.books.clear();
      if (newest) this.books.set(newest.key, [newest.slot]);
      return;
    }
    while (this.bytesUsed() > cap) {
      let oldest: { key: string; index: number; t: number } | null = null;
      for (const [k, list] of this.books) {
        for (let i = 0; i < list.length; i++) {
          const t = parseTime(list[i]);
          if (!oldest || t < oldest.t) oldest = { key: k, index: i, t };
        }
      }
      if (!oldest) break;
      const list = this.books.get(oldest.key);
      if (!list) break;
      list.splice(oldest.index, 1);
      if (!list.length) this.books.delete(oldest.key);
    }
  }
}

function parseTime(s: StreamSlot): number {
  if (s.asOf) {
    const t = Date.parse(s.asOf);
    if (Number.isFinite(t)) return t;
  }
  return s.receivedAt;
}

function meanGrid(
  grids: Array<Array<Array<number | null>>>,
  used: number,
): { grid: Array<Array<number | null>>; used: number } {
  if (!grids.length) return { grid: [], used: 0 };
  const rows = grids[0].length;
  const cols = grids[0][0]?.length ?? 0;
  const grid: Array<Array<number | null>> = [];
  for (let ri = 0; ri < rows; ri++) {
    grid[ri] = [];
    for (let ci = 0; ci < cols; ci++) {
      let sum = 0;
      let c = 0;
      for (const g of grids) {
        const v = g[ri]?.[ci];
        if (v != null && Number.isFinite(v)) {
          sum += v;
          c += 1;
        }
      }
      grid[ri][ci] = c ? sum / c : null;
    }
  }
  return { grid, used };
}

export function applyAverageColorT(
  cells: GridCell[][],
  avg: Array<Array<number | null>>,
): GridCell[][] {
  return cells.map((row, ri) =>
    row.map((cell, ci) => {
      const t = avg[ri]?.[ci];
      if (t == null || !Number.isFinite(t)) {
        return {
          ...cell,
          colorT: null,
          bgCss: "#1a1a1a",
          value: null,
          widthFitOutline: false,
        };
      }
      return {
        ...cell,
        colorT: t,
        bgCss: widthFitFill(t),
        widthFitOutline: false,
      };
    }),
  );
}

let _book: StreamBook | null = null;

export function getStreamBook(): StreamBook {
  if (!_book) _book = new StreamBook();
  return _book;
}

/** Tests. */
export function resetStreamBook(): void {
  _book = new StreamBook();
}

export function formatCacheLine(st: CacheStatus): string {
  const usedMb = st.bytesUsed / MIB;
  const budMb = st.budgetBytes / MIB;
  const span =
    st.spanMs < 60_000
      ? `${Math.max(0, Math.round(st.spanMs / 1000))}s`
      : `${Math.floor(st.spanMs / 60_000)}m ${Math.round((st.spanMs % 60_000) / 1000)}s`;
  return `${usedMb.toFixed(1)} / ${budMb.toFixed(0)} MB · ${st.gens} gens · ${span}`;
}
