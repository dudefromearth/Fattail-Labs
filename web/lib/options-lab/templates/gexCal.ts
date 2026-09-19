/**
 * Term Mass (`gex-cal`) — strike × expiration matrix of frozen gex_v1.
 * Spec v0.1.1. Call pricing.ts only. Do not duplicate Γ·OI·S².
 */

import { gexAbs, gexNet, gexSide } from "./pricing";
import type {
  ChainContext,
  HeatmapTemplate,
  TemplateParams,
  ValueModeId,
} from "./types";

export const GEX_CAL_TEMPLATE_ID = "gex-cal";
export const GEX_CAL_LABEL = "Term Mass";

export type GexCalBook = {
  /** YYYY-MM-DD — must equal the pack map key (AT-GC9). */
  expiration: string;
  ctx: ChainContext;
};

export type GexCalPack = {
  symbol: string;
  wings: number;
  spot: number | null;
  /** Near-dated first. */
  visibleExpirations: string[];
  books: Map<string, GexCalBook>;
};

export type GexCalMark = "gold" | "green" | "red" | null;

export type GexCalCell = {
  expiration: string;
  strike: number;
  value: number | null;
  display: string | null;
  valid: boolean;
  call: number | null;
  put: number | null;
  /** gold = grid peak |value|; green = column max +; red = column min −. */
  mark: GexCalMark;
};

export type GexCalRow = {
  strike: number;
  label: string;
  isSpot: boolean;
};

export type GexCalCol = {
  expiration: string;
  label: string;
};

export type GexCalResult = {
  empty: boolean;
  emptyReason: "ok" | "empty" | "fake";
  rows: GexCalRow[];
  cols: GexCalCol[];
  cells: GexCalCell[][]; // [row][col]
  netFooter: { expiration: string; value: number | null; display: string | null }[];
  profile: { strike: number; value: number | null; valid: boolean }[];
  peakStrike: number | null;
};

export function termMassFlagOn(): boolean {
  return process.env.NEXT_PUBLIC_LABS_HEATMAP_TERM_MASS === "1";
}

export function inspectPack(pack: GexCalPack): "ok" | "empty" | "fake" {
  const vis = pack.visibleExpirations.map((e) => (e || "").slice(0, 10));
  if (!vis.length || pack.books.size === 0) return "empty";
  const seenCtx = new Set<ChainContext>();
  for (const exp of vis) {
    const book = pack.books.get(exp);
    if (!book) return "empty";
    if (book.expiration.slice(0, 10) !== exp) return "fake";
    if (seenCtx.has(book.ctx)) return "fake";
    seenCtx.add(book.ctx);
  }
  return "ok";
}

export function fmtGexCalDollars(n: number): string {
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "$0";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${sign}$${trimFixed(abs / 1e9, abs >= 1e10 ? 1 : 3)}B`;
  if (abs >= 1e6) {
    const m = abs / 1e6;
    return `${sign}$${trimFixed(m, m >= 100 ? 1 : 3)}M`;
  }
  if (abs >= 1e3) return `${sign}$${trimFixed(abs / 1e3, abs >= 1e5 ? 0 : 1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function trimFixed(v: number, digits: number): string {
  const t = v.toFixed(digits);
  if (!t.includes(".")) return t;
  return t.replace(/\.?0+$/, "");
}

function colLabel(exp: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(exp.slice(0, 10));
  if (!m) return exp;
  return `${m[2]}/${m[3]}/${m[1].slice(2)}`;
}

function cellFor(
  ctx: ChainContext,
  strike: number,
  expiration: string,
  mode: ValueModeId,
): GexCalCell {
  const call = gexSide(ctx, "call", strike);
  const put = gexSide(ctx, "put", strike);
  if (mode === "gex_abs") {
    const value = gexAbs(ctx, strike);
    const valid = value != null;
    return {
      expiration,
      strike,
      value,
      display: valid && value != null ? fmtGexCalDollars(value) : null,
      valid,
      call,
      put,
      mark: null,
    };
  }
  if (mode === "gex_all") {
    const valid = call != null || put != null;
    const value = gexNet(ctx, strike);
    return {
      expiration,
      strike,
      value,
      display: valid && value != null ? fmtGexCalDollars(value) : null,
      valid,
      call,
      put,
      mark: null,
    };
  }
  const value = gexNet(ctx, strike);
  const valid = value != null;
  return {
    expiration,
    strike,
    value,
    display: valid && value != null ? fmtGexCalDollars(value) : null,
    valid,
    call,
    put,
    mark: null,
  };
}

function assignMarks(cells: GexCalCell[][]): void {
  let gold: GexCalCell | null = null;
  let goldAbs = -1;
  for (const row of cells) {
    for (const c of row) {
      if (!c.valid || c.value == null) continue;
      const a = Math.abs(c.value);
      if (a > goldAbs) {
        goldAbs = a;
        gold = c;
      }
    }
  }
  if (gold) gold.mark = "gold";
  const colCount = cells[0]?.length ?? 0;
  for (let j = 0; j < colCount; j++) {
    let pos: GexCalCell | null = null;
    let neg: GexCalCell | null = null;
    for (const row of cells) {
      const c = row[j];
      if (!c.valid || c.value == null) continue;
      if (c.value > 0 && (pos == null || c.value > pos.value!)) pos = c;
      if (c.value < 0 && (neg == null || c.value < neg.value!)) neg = c;
    }
    if (pos && pos.mark == null) pos.mark = "green";
    if (neg && neg.mark == null) neg.mark = "red";
  }
}

export function computeGexCal(
  pack: GexCalPack,
  mode: ValueModeId = "gex_net",
): GexCalResult {
  const honesty = inspectPack(pack);
  if (honesty !== "ok") {
    return {
      empty: true,
      emptyReason: honesty,
      rows: [],
      cols: [],
      cells: [],
      netFooter: [],
      profile: [],
      peakStrike: null,
    };
  }

  const cols: GexCalCol[] = pack.visibleExpirations.map((expiration) => ({
    expiration,
    label: colLabel(expiration),
  }));

  const strikeSet = new Set<number>();
  for (const exp of pack.visibleExpirations) {
    const book = pack.books.get(exp);
    if (!book) continue;
    for (const row of book.ctx.contracts.values()) {
      const k = Number(row.strike);
      if (Number.isFinite(k)) strikeSet.add(k);
    }
  }
  const strikes = [...strikeSet].sort((a, b) => b - a);
  const spot = pack.spot;
  let spotStrike: number | null = null;
  if (spot != null && strikes.length) {
    spotStrike = strikes.reduce((best, k) =>
      Math.abs(k - spot) < Math.abs(best - spot) ? k : best,
    );
  }

  const rows: GexCalRow[] = strikes.map((strike) => ({
    strike,
    label: String(strike),
    isSpot: spotStrike != null && strike === spotStrike,
  }));

  const cells: GexCalCell[][] = rows.map((row) =>
    cols.map((col) => {
      const book = pack.books.get(col.expiration)!;
      return cellFor(book.ctx, row.strike, col.expiration, mode);
    }),
  );
  assignMarks(cells);

  const netFooter = cols.map((col, j) => {
    let sum = 0;
    let any = false;
    for (let i = 0; i < rows.length; i++) {
      const c = cells[i][j];
      if (c.valid && c.value != null) {
        sum += c.value;
        any = true;
      }
    }
    return {
      expiration: col.expiration,
      value: any ? sum : null,
      display: any ? fmtGexCalDollars(sum) : null,
    };
  });

  const profile = rows.map((row, i) => {
    let sum = 0;
    let any = false;
    for (let j = 0; j < cols.length; j++) {
      const c = cells[i][j];
      if (c.valid && c.value != null) {
        sum += c.value;
        any = true;
      }
    }
    return { strike: row.strike, value: any ? sum : null, valid: any };
  });

  let peakStrike: number | null = null;
  let peakAbs = -1;
  for (const p of [...profile].sort((a, b) => a.strike - b.strike)) {
    if (!p.valid || p.value == null) continue;
    const a = Math.abs(p.value);
    if (a > peakAbs) {
      peakAbs = a;
      peakStrike = p.strike;
    }
  }

  return {
    empty: false,
    emptyReason: "ok",
    rows,
    cols,
    cells,
    netFooter,
    profile,
    peakStrike,
  };
}

export function gexCalStickyScale(
  result: GexCalResult,
  prev: number,
): number {
  let max = 0;
  for (const row of result.cells) {
    for (const c of row) {
      if (c.valid && c.value != null) max = Math.max(max, Math.abs(c.value));
    }
  }
  if (max <= 0) return prev > 0 ? prev : 1;
  if (prev <= 0) return max;
  if (Math.abs(max - prev) / prev > 0.25) return max;
  return prev;
}

export function gexCalColorT(value: number, scale: number): number {
  const s = Math.max(Math.abs(scale), 1e-12);
  const t = value / s;
  return Math.max(-1, Math.min(1, t));
}

/** Same family as the profile bars (`#00d4dc` / `#e040c0`). Floor stays lit. */
const CYAN = [0, 212, 220] as const;
const MAGENTA = [224, 64, 192] as const;
const CYAN_FLOOR = [10, 72, 82] as const;
const MAGENTA_FLOOR = [72, 18, 62] as const;
const ZERO = [22, 18, 32] as const;

function lerp3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  u: number,
): string {
  const t = Math.max(0, Math.min(1, u));
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

export function gexCalBgCss(t: number): string {
  const x = Math.max(-1, Math.min(1, t));
  if (x === 0) return `rgb(${ZERO[0]},${ZERO[1]},${ZERO[2]})`;
  const u = Math.pow(Math.abs(x), 0.55);
  if (x < 0) return lerp3(CYAN_FLOOR, CYAN, u);
  return lerp3(MAGENTA_FLOOR, MAGENTA, u);
}

export function gexCalCellFill(mark: GexCalMark, t: number): string {
  if (mark === "gold") return "#e8a317";
  if (mark === "green") return "#3dff6e";
  if (mark === "red") return "#ff3a4a";
  return gexCalBgCss(t);
}

export const gexCalTemplate: HeatmapTemplate = {
  id: GEX_CAL_TEMPLATE_ID,
  label: GEX_CAL_LABEL,
  description:
    "Strike × expiration matrix of chain GEX (estimate) · companion profile · NET footer",
  layout: "matrix-profile",
  valueModes: [
    { id: "gex_net", label: "Net" },
    { id: "gex_abs", label: "Absolute" },
    { id: "gex_all", label: "Call / Put" },
  ],
  defaultValueMode: "gex_net",
  resolveColumns: () => [],
  resolveRows: () => [],
  computeCell: () => ({ display: null, value: null, valid: false }),
  assignColors: (_cells, _params: TemplateParams) => ({ stickyScale: 1 }),
};
