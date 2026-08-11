/**
 * Symmetric butterfly matrix — MSC look-compatible.
 *
 * Widths (SPX default): 20,25,30,35,40,45,50 — MASSIVE_WIDTHS_SPX.
 * Debit: D = m(K−w)+m(K+w)−2m(K).
 * Color: vertical |Δdebit|/upper × 100 vs MSC gradient threshold (debitColor).
 */

import {
  DEFAULT_GRADIENT_THRESHOLD,
  NULL_CELL_COLOR,
  colorFromT,
  debitColor,
  p95Abs,
  updateStickyScale,
} from "./color";
import { fmtMoney, symFlyDebit } from "./pricing";
import type {
  ChainContext,
  ColDef,
  GridCell,
  HeatmapTemplate,
  RowDef,
  TemplateParams,
} from "./types";
import { contractKey } from "@/lib/chainLadderApi";

/** MSC SPX default widths (center-to-wing points). */
export const SYM_FLY_WIDTHS_DEFAULT = [20, 25, 30, 35, 40, 45, 50] as const;

function widthList(ctx: ChainContext, params: TemplateParams): number[] {
  if (params.widthMode === "fixed_points" && params.fixedPoints?.length) {
    return [...params.fixedPoints];
  }
  if (params.widthMode === "step_multiples") {
    const step = ctx.strikeStep && ctx.strikeStep > 0 ? ctx.strikeStep : 5;
    const n = Math.max(1, Math.min(12, params.widthCount ?? 7));
    const out: number[] = [];
    for (let i = 1; i <= n; i++) out.push(step * i);
    return out;
  }
  // Default: MSC SPX ladder 20…50
  return [...SYM_FLY_WIDTHS_DEFAULT];
}

function formatDebit(n: number): string {
  return n.toFixed(2);
}

export const symFlyTemplate: HeatmapTemplate = {
  id: "sym-fly",
  label: "Symmetric flies",
  description: "Debit matrix · widths 20–50 · MSC color (vertical % change)",
  layout: "matrix",
  valueModes: [
    { id: "debit", label: "Debit" },
    { id: "credit", label: "Credit" },
    { id: "pct_change", label: "% change" },
    { id: "r2r", label: "R:R" },
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
      // Prefer rows that can form at least one fly in the width set
      const canAny = widths.some((w) => {
        return (
          ctx.contracts.has(contractKey(side, k - w)) &&
          ctx.contracts.has(contractKey(side, k)) &&
          ctx.contracts.has(contractKey(side, k + w))
        );
      });
      if (!canAny && maxW > 0) {
        // still show if body listed (MSC scaffolds from tiles)
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
    const d = symFlyDebit(ctx, row.strike, w);
    if (d == null) {
      return { display: "—", value: null, valid: false };
    }
    const mode = params.valueMode;
    if (mode === "credit") {
      const c = -d;
      return {
        display: formatDebit(c),
        value: c,
        valid: true,
        tooltip: `Short fly credit ${fmtMoney(c)} (mid)`,
      };
    }
    if (mode === "r2r") {
      if (d <= 0) {
        return {
          display: "—",
          value: null,
          valid: false,
          tooltip: "R:R needs positive debit",
        };
      }
      const maxProfit = w - d;
      if (maxProfit <= 0) {
        return {
          display: "—",
          value: null,
          valid: false,
          tooltip: "Debit ≥ width — no positive max profit under mid model",
        };
      }
      const rr = maxProfit / d;
      return {
        display: rr.toFixed(2),
        value: rr,
        valid: true,
        tooltip: `R:R ≈ (w−D)/D = (${w}−${fmtMoney(d)})/${fmtMoney(d)}`,
      };
    }
    // debit + pct_change (display debit first; color pass may convert)
    return {
      display: formatDebit(d),
      value: d,
      valid: true,
      tooltip: `Long ${row.strike - w} / short 2×${row.strike} / long ${row.strike + w}\nDebit ${formatDebit(d)} (mid)`,
    };
  },

  assignColors(grid, params) {
    const mode = params.valueMode;
    const threshold =
      params.gradientThreshold ?? DEFAULT_GRADIENT_THRESHOLD;

    // ── MSC path: debit (and credit as |value| for color) ──────────────
    // Vertical % change vs upper adjacent strike, same width column.
    // Rows are high→low strike (index 0 = highest).
    if (mode === "debit" || mode === "credit") {
      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
          const cell = grid[i][j];
          if (!cell?.valid || cell.value == null) {
            cell.colorT = null;
            cell.bgCss = NULL_CELL_COLOR;
            continue;
          }
          // Color uses positive debit magnitude (credit is negative)
          const val =
            mode === "credit"
              ? Math.abs(cell.value)
              : cell.value > 0
                ? cell.value
                : null;

          let pctChange = 0;
          if (i >= 1) {
            const upper = grid[i - 1][j]; // higher strike (rows sorted desc)
            const curr = mode === "credit" ? Math.abs(cell.value) : cell.value;
            const prev =
              upper?.valid && upper.value != null
                ? mode === "credit"
                  ? Math.abs(upper.value)
                  : upper.value
                : null;
            if (curr != null && curr > 0 && prev != null && prev > 0) {
              pctChange = (Math.abs(curr - prev) / prev) * 100;
            }
          }
          cell.colorT = pctChange;
          cell.bgCss = debitColor(val, pctChange, threshold);
        }
      }
      return { stickyScale: threshold };
    }

    // ── Level-based (r2r) ──────────────────────────────────────────────
    if (mode === "r2r") {
      const vals: number[] = [];
      for (const row of grid) {
        for (const cell of row) {
          if (cell.valid && cell.value != null) vals.push(cell.value);
        }
      }
      const raw = p95Abs(vals);
      const sticky = updateStickyScale(params.stickyScale, raw);
      for (const row of grid) {
        for (const cell of row) {
          if (!cell.valid || cell.value == null) {
            cell.colorT = null;
            cell.bgCss = NULL_CELL_COLOR;
            continue;
          }
          const t = Math.max(-1, Math.min(1, cell.value / sticky));
          cell.colorT = t;
          cell.bgCss = colorFromT(t);
        }
      }
      return { stickyScale: sticky };
    }

    // ── Horizontal pct_change (width neighbor) — Spec value mode ─────
    if (mode === "pct_change") {
      for (let i = 0; i < grid.length; i++) {
        for (let j = grid[i].length - 1; j >= 0; j--) {
          const cell = grid[i][j];
          if (!cell?.valid || cell.value == null) continue;
          const prev = j >= 1 ? grid[i][j - 1] : null;
          if (!prev?.valid || prev.value == null || prev.value === 0) {
            cell.valid = false;
            cell.display = "—";
            cell.value = null;
            cell.colorT = null;
            cell.bgCss = NULL_CELL_COLOR;
            continue;
          }
          const pct = (cell.value - prev.value) / Math.abs(prev.value);
          cell.value = pct;
          cell.display = `${(pct * 100).toFixed(1)}%`;
        }
      }
      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
          const cell = grid[i][j];
          if (!cell?.valid || cell.value == null) {
            cell.colorT = null;
            cell.bgCss = NULL_CELL_COLOR;
            continue;
          }
          // Map absolute % into MSC color space (×100)
          const pctChange = Math.abs(cell.value) * 100;
          const val = 1; // positive so debitColor applies
          cell.colorT = pctChange;
          cell.bgCss = debitColor(val, pctChange, threshold);
        }
      }
      return { stickyScale: threshold };
    }

    return { stickyScale: params.stickyScale ?? threshold };
  },
};

export function buildGrid(
  tpl: HeatmapTemplate,
  ctx: ChainContext,
  params: TemplateParams,
): { rows: RowDef[]; cols: ColDef[]; cells: GridCell[][]; stickyScale: number } {
  const cols = tpl.resolveColumns(ctx, params);
  const rows = tpl.resolveRows(ctx, params);
  const cells: GridCell[][] = rows.map((row) =>
    cols.map((col) => {
      const c = tpl.computeCell(ctx, row, col, params);
      return { ...c, colorT: null };
    }),
  );
  const { stickyScale } = tpl.assignColors(cells, params);
  return { rows, cols, cells, stickyScale };
}
