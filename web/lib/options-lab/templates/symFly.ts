/**
 * Advanced Fly surface (registry id `sym-fly`) — Spec AF v0.2.2.
 *
 * Geometry: Long/Debit +1/−2/+1 · Short/Credit −1/+2/−1.
 * Value modes: Long/Debit · Short/Credit · tick % · R:R · Δ · Δ² · vel · accel · slope · curvature · C/P.
 * Time modes need flyHistory on TemplateParams (client ring buffer).
 */

import {
  DEFAULT_GRADIENT_THRESHOLD,
  NULL_CELL_COLOR,
  debitColor,
} from "./color";
import {
  cellKey,
  type DebitGridSnap,
  type FlySurfaceHistory,
} from "./flySurfaceHistory";
import {
  fmtMoney,
  isPositiveListedDebit,
  symFlyCpAsym,
  symFlyCredit,
  symFlyDebit,
  symFlyDebitPctFromSpot,
  symFlyGreek,
} from "./pricing";
import type {
  ChainContext,
  ColDef,
  GridCell,
  HeatmapTemplate,
  RowDef,
  TemplateParams,
} from "./types";
import { contractKey } from "@/lib/chainLadderApi";
import {
  assignWidthFitColors,
  widthFitComputeCell,
} from "./widthFit";

/**
 * Heatmap fly columns (center-to-wing points).
 * Coach 2026-08-18: 10…50 by 5 for every Advanced Fly variant (DL-435).
 */
export const HEATMAP_FLY_WIDTHS = [
  10, 15, 20, 25, 30, 35, 40, 45, 50,
] as const;

/** @deprecated Use HEATMAP_FLY_WIDTHS — same list. */
export const SYM_FLY_WIDTHS_DEFAULT = HEATMAP_FLY_WIDTHS;

/**
 * Fly column widths for the heatmap matrix.
 * Fixed 10…50 × 5 — not profile step-multiples (those started at 5).
 */
export function heatmapFlyWidths(
  _strikeStep?: number | null,
  _count?: number,
): number[] {
  void _strikeStep;
  void _count;
  return [...HEATMAP_FLY_WIDTHS];
}

function widthList(ctx: ChainContext, params: TemplateParams): number[] {
  if (params.widthMode === "fixed_points" && params.fixedPoints?.length) {
    return [...params.fixedPoints];
  }
  if (params.widthMode === "step_multiples") {
    const step = ctx.strikeStep && ctx.strikeStep > 0 ? ctx.strikeStep : 5;
    const n = Math.max(1, Math.min(12, params.widthCount ?? 7));
    return heatmapFlyWidths(step, n);
  }
  return heatmapFlyWidths(ctx.strikeStep, params.widthCount ?? 7);
}

function formatDebit(n: number): string {
  return n.toFixed(2);
}

function liveSnap(
  params: TemplateParams,
  cells: Map<string, number | null>,
): DebitGridSnap {
  return {
    asOf: params.flyLiveAsOf ?? null,
    contentHash: params.flyLiveContentHash ?? null,
    receivedAt: params.flyLiveReceivedAt ?? Date.now(),
    cells,
  };
}

function singleLiveCell(
  params: TemplateParams,
  side: string,
  k: number,
  w: number,
  d: number,
): DebitGridSnap {
  const cells = new Map<string, number | null>();
  cells.set(cellKey(side, k, w), d);
  return liveSnap(params, cells);
}

/** Build debit map for needed cells (viewSide only). */
export function buildDebitCellMap(
  ctx: ChainContext,
  rows: readonly RowDef[],
  cols: readonly ColDef[],
): Map<string, number | null> {
  const cells = new Map<string, number | null>();
  const side = ctx.viewSide;
  for (const row of rows) {
    for (const col of cols) {
      const d = symFlyDebit(ctx, row.strike, col.widthPts);
      cells.set(cellKey(side, row.strike, col.widthPts), d);
    }
  }
  return cells;
}

function invalid(tooltip: string): Omit<GridCell, "colorT" | "bgCss"> {
  return { display: "—", value: null, valid: false, tooltip };
}

export const symFlyTemplate: HeatmapTemplate = {
  id: "sym-fly",
  label: "Advanced flies",
  description:
    "Fly surface · Debit default · research Value modes over OPF-held chain",
  layout: "matrix",
  valueModes: [
    { id: "debit", label: "Long/Debit" },
    { id: "credit", label: "Short/Credit" },
    { id: "pct_change", label: "% Change (debit)" },
    { id: "r2r", label: "Risk to Reward" },
    { id: "d_debit", label: "Delta" },
    { id: "d2_debit", label: "Gamma" },
    { id: "theta", label: "Theta" },
    { id: "slope", label: "Slope" },
    { id: "curvature", label: "Curvature" },
    { id: "cp_asym", label: "Call/Put asym" },
  ],
  defaultValueMode: "debit",

  resolveColumns(ctx, params) {
    return widthList(ctx, params).map((w) => ({
      id: `w${w}`,
      label: String(w),
      widthPts: w,
    }));
  },

  resolveRows(ctx, params) {
    const widths = widthList(ctx, params);
    const maxW = Math.max(...widths, 0);
    const side = ctx.viewSide;
    const strikes = new Set<number>();
    for (const row of ctx.contracts.values()) {
      if ((row.side || "call").toLowerCase() !== side) continue;
      strikes.add(Number(row.strike));
    }
    const sorted = [...strikes].sort((a, b) => b - a);
    const rows: RowDef[] = [];
    for (const k of sorted) {
      const hasRoom = widths.some(
        (w) =>
          ctx.contracts.has(contractKey(side, k - w)) ||
          ctx.contracts.has(contractKey(side, k + w)),
      );
      if (!hasRoom && !ctx.contracts.has(contractKey(side, k))) continue;
      const canAny = widths.some((w) => {
        return (
          ctx.contracts.has(contractKey(side, k - w)) &&
          ctx.contracts.has(contractKey(side, k)) &&
          ctx.contracts.has(contractKey(side, k + w))
        );
      });
      if (!canAny && maxW > 0) {
        if (!ctx.contracts.has(contractKey(side, k))) continue;
      }
      const body = ctx.contracts.get(contractKey(side, k));
      rows.push({
        strike: k,
        label: String(k),
        isSpot: Boolean(body?.is_spot),
      });
    }
    return rows;
  },

  computeCell(ctx, row, col, params) {
    const w = col.widthPts;
    const k = row.strike;
    const side = ctx.viewSide;
    const d = symFlyDebit(ctx, k, w);
    if (d == null) {
      return invalid("Missing listed wing or null mid");
    }
    const mode = params.valueMode;
    const hist = params.flyHistory ?? null;

    if (mode === "width_fit") {
      return widthFitComputeCell(ctx, row, col, params);
    }

    if (mode === "debit") {
      return {
        display: formatDebit(d),
        value: d,
        valid: true,
        tooltip: `Long fly +1/−2/+1 · ${k - w} / ${k} / ${k + w}\nPackage ${formatDebit(d)} (mid)`,
      };
    }

    if (mode === "credit") {
      const c = symFlyCredit(ctx, k, w);
      if (c == null) {
        return invalid("Missing listed wing or null mid");
      }
      return {
        display: formatDebit(c),
        value: c,
        valid: true,
        tooltip: `Short fly −1/+2/−1 · ${k - w} / ${k} / ${k + w}\nPackage ${formatDebit(c)} (mid)`,
      };
    }

    if (mode === "pct_change") {
      const strikes = params.flyRowStrikes;
      const idx = params.flyRowIndex;
      if (strikes == null || idx == null || idx < 0) {
        return invalid("Row order unavailable");
      }
      const pct = symFlyDebitPctFromSpot(ctx, strikes, idx, w);
      if (pct == null) {
        return invalid("Need debit at this strike and the next toward spot");
      }
      return {
        display: `${pct.toFixed(1)}%`,
        value: pct,
        valid: true,
        tooltip: `% change in debit = |(inner − outer) / inner|`,
      };
    }

    if (mode === "r2r") {
      if (!isPositiveListedDebit(d)) {
        return invalid("Risk to Reward needs a positive debit");
      }
      const maxProfit = w - d;
      if (maxProfit <= 0) {
        return invalid("Debit ≥ width — no positive max profit under mid model");
      }
      const rr = maxProfit / d;
      return {
        display: rr.toFixed(2),
        value: rr,
        valid: true,
        tooltip: `Risk to Reward = (width − debit) / debit = (${w}−${fmtMoney(d)})/${fmtMoney(d)}`,
      };
    }

    if (mode === "d_debit" || mode === "d2_debit" || mode === "theta") {
      const greek =
        mode === "d_debit" ? "delta" : mode === "d2_debit" ? "gamma" : "theta";
      const g = symFlyGreek(ctx, k, w, greek);
      if (g == null) {
        return invalid(`Missing listed ${greek} on a fly leg`);
      }
      const digits = greek === "gamma" ? 4 : 3;
      return {
        display: g.toFixed(digits),
        value: g,
        valid: true,
        tooltip: `Long fly ${greek} = +1/−2/+1 chain ${greek}s`,
      };
    }

    if (mode === "cp_asym") {
      const a = symFlyCpAsym(ctx, k, w);
      if (a == null) {
        return invalid("Call or put fly incomplete");
      }
      // cents when |a| < 1 else points
      const cents = a * 100;
      const display =
        Math.abs(a) < 1
          ? `${cents.toFixed(1)}¢`
          : formatDebit(a);
      return {
        display,
        value: a,
        valid: true,
        tooltip:
          `Call fly debit − put fly debit (book asymmetry)\n` +
          `${formatDebit(a)} pts · not a directional cost edge`,
      };
    }

    // Spatial slope / curvature (descending K, per-point FD)
    if (mode === "slope" || mode === "curvature") {
      const strikes = params.flyRowStrikes;
      const idx = params.flyRowIndex;
      if (strikes == null || idx == null || idx < 0) {
        return invalid("Row order unavailable");
      }
      return computeSpatial(ctx, strikes, idx, w, mode);
    }

    // Time derivatives need history
    if (
      mode === "velocity" ||
      mode === "acceleration"
    ) {
      if (!hist) {
        return invalid("Needs prior snapshot(s)");
      }
      return computeTimeMode(ctx, hist, params, side, k, w, d, mode);
    }

    // fallback debit
    return {
      display: formatDebit(d),
      value: d,
      valid: true,
      tooltip: `Debit ${formatDebit(d)} (mid)`,
    };
  },

  assignColors(grid, params) {
    if (params.valueMode === "width_fit") {
      return assignWidthFitColors(grid, params);
    }
    const threshold =
      params.gradientThreshold ?? DEFAULT_GRADIENT_THRESHOLD;
    void params.valueMode;
    // Neighbor RoC of the displayed |value| (MSC Gradient / DL-435).
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        const cell = grid[i][j];
        if (!cell?.valid || cell.value == null) {
          cell.colorT = null;
          cell.bgCss = NULL_CELL_COLOR;
          continue;
        }
        const val = Math.abs(cell.value);
        if (!(val > 0)) {
          cell.colorT = 0;
          cell.bgCss = debitColor(0.01, 0, threshold);
          continue;
        }

        let pctChange = 0;
        if (i >= 1) {
          const upper = grid[i - 1][j];
          const prev =
            upper?.valid && upper.value != null
              ? Math.abs(upper.value)
              : null;
          if (prev != null && prev > 0) {
            pctChange = (Math.abs(val - prev) / prev) * 100;
          }
        }
        cell.colorT = pctChange;
        cell.bgCss = debitColor(val, pctChange, threshold);
      }
    }
    return { stickyScale: threshold };
  },
};

function computeSpatial(
  ctx: ChainContext,
  strikes: readonly number[],
  idx: number,
  w: number,
  mode: "slope" | "curvature",
): Omit<GridCell, "colorT" | "bgCss"> {
  // Descending K: strikes[i] > strikes[i+1]
  if (idx >= strikes.length - 1) {
    return invalid("Edge — no lower neighbor (slope invalid)");
  }
  const Ki = strikes[idx];
  const Kj = strikes[idx + 1];
  const Di = symFlyDebit(ctx, Ki, w);
  const Dj = symFlyDebit(ctx, Kj, w);
  if (Di == null || Dj == null) {
    return invalid("Incomplete fly for slope");
  }
  const gap = Ki - Kj;
  if (!(gap > 0)) {
    return invalid("Invalid strike order");
  }
  const slope_i = (Di - Dj) / gap;

  if (mode === "slope") {
    return {
      display: slope_i.toFixed(4),
      value: slope_i,
      valid: true,
      tooltip: `Slope = ΔD/ΔK = (${formatDebit(Di)}−${formatDebit(Dj)})/(${Ki}−${Kj})\nDebit points per strike point`,
    };
  }

  // Curvature: need slope_i and slope_{i+1} on uniform triple
  if (idx >= strikes.length - 2) {
    return invalid("Edge — curvature needs three centers");
  }
  const Kk = strikes[idx + 2];
  const Dk = symFlyDebit(ctx, Kk, w);
  if (Dk == null) {
    return invalid("Incomplete fly for curvature");
  }
  const gap2 = Kj - Kk;
  if (!(gap2 > 0)) {
    return invalid("Invalid strike order");
  }
  // Uniform triple gate (N1)
  if (Math.abs(gap - gap2) > 1e-9) {
    return invalid("Non-uniform strike spacing — curvature invalid");
  }
  const slope_j = (Dj - Dk) / gap2;
  const curv = slope_i - slope_j;
  return {
    display: curv.toFixed(4),
    value: curv,
    valid: true,
    tooltip: `Curvature = slope_i − slope_{i+1} (uniform triple)`,
  };
}

function computeTimeMode(
  ctx: ChainContext,
  hist: FlySurfaceHistory,
  params: TemplateParams,
  side: string,
  k: number,
  w: number,
  d: number,
  mode: string,
): Omit<GridCell, "colorT" | "bgCss"> {
  const live = singleLiveCell(params, side, k, w, d);

  if (mode === "velocity") {
    const t = hist.velocityDelta(live, side, k, w);
    if (!t) {
      return invalid(
        "Needs prior snapshot · velocity needs Δt ≥ 0.5s · debit points / min",
      );
    }
    const v = t.dD / (t.dtMs / 60_000);
    return {
      display: v.toFixed(3),
      value: v,
      valid: true,
      tooltip: `Velocity ${v.toFixed(3)} debit points / min`,
    };
  }

  if (mode === "acceleration") {
    const a = hist.acceleration(live, side, k, w);
    if (a == null) {
      return invalid("Needs two velocity-honest prior samples");
    }
    return {
      display: a.toFixed(3),
      value: a,
      valid: true,
      tooltip: `Acceleration (Δ velocity / min)`,
    };
  }

  return invalid("Unknown time mode");
}

export function buildGrid(
  tpl: HeatmapTemplate,
  ctx: ChainContext,
  params: TemplateParams,
): { rows: RowDef[]; cols: ColDef[]; cells: GridCell[][]; stickyScale: number } {
  const cols = tpl.resolveColumns(ctx, params);
  const rows = tpl.resolveRows(ctx, params);
  const rowStrikes = rows.map((r) => r.strike);
  const cells: GridCell[][] = rows.map((row, i) =>
    cols.map((col) => {
      const c = tpl.computeCell(ctx, row, col, {
        ...params,
        flyRowStrikes: rowStrikes,
        flyRowIndex: i,
      });
      return { ...c, colorT: null };
    }),
  );
  const { stickyScale } = tpl.assignColors(cells, params);
  return { rows, cols, cells, stickyScale };
}
