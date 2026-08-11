/** Symmetric butterfly matrix — Spec §5.2 */

import { colorFromT, p95Abs, updateStickyScale } from "./color";
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

function widthList(ctx: ChainContext, params: TemplateParams): number[] {
  if (params.widthMode === "fixed_points" && params.fixedPoints?.length) {
    return [...params.fixedPoints];
  }
  const step = ctx.strikeStep && ctx.strikeStep > 0 ? ctx.strikeStep : 5;
  const n = Math.max(1, Math.min(12, params.widthCount ?? 7));
  const out: number[] = [];
  for (let i = 1; i <= n; i++) out.push(step * i);
  return out;
}

export const symFlyTemplate: HeatmapTemplate = {
  id: "sym-fly",
  label: "Symmetric flies",
  description: "Debit matrix: body strike × width (center-to-wing)",
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
      // Need at least extreme longs present for some column to be useful
      const hasRoom =
        ctx.contracts.has(contractKey(side, k - maxW)) ||
        widths.some((w) => ctx.contracts.has(contractKey(side, k - w)));
      if (!hasRoom && !ctx.contracts.has(contractKey(side, k))) continue;
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
        display: fmtMoney(c),
        value: c,
        valid: true,
        tooltip: `Short fly credit ${fmtMoney(c)} (mid)`,
      };
    }
    if (mode === "r2r") {
      // Long fly: max profit ≈ w − debit (1× width, mid model)
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
    // debit + pct_change (pct converted in assignColors from debit neighbors)
    return {
      display: fmtMoney(d),
      value: d,
      valid: true,
      tooltip: `Long ${row.strike - w} / short 2×${row.strike} / long ${row.strike + w}\nDebit ${fmtMoney(d)} (mid)`,
    };
  },

  assignColors(grid, params) {
    const mode = params.valueMode;
    // Level-based modes: color by value magnitude (still diverging around 0)
    if (mode === "r2r" || mode === "credit") {
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
            cell.bgCss = "rgb(20,20,28)";
            continue;
          }
          const t = Math.max(-1, Math.min(1, cell.value / sticky));
          cell.colorT = t;
          cell.bgCss = colorFromT(t);
        }
      }
      return { stickyScale: sticky };
    }

    // First pass: optional pct_change conversion (mutates cell values)
    if (mode === "pct_change") {
      for (let i = 0; i < grid.length; i++) {
        // right→left so we still have original debit on neighbors
        for (let j = grid[i].length - 1; j >= 0; j--) {
          const cell = grid[i][j];
          if (!cell?.valid || cell.value == null) continue;
          const prev = j >= 1 ? grid[i][j - 1] : null;
          if (!prev?.valid || prev.value == null || prev.value === 0) {
            cell.valid = false;
            cell.display = "—";
            cell.value = null;
            cell.colorT = null;
            cell.bgCss = "rgb(20,20,28)";
            continue;
          }
          const pct = (cell.value - prev.value) / Math.abs(prev.value);
          cell.value = pct;
          cell.display = `${(pct * 100).toFixed(1)}%`;
        }
      }
    }

    // RoC slopes for color (debit Δ width or already-pct cells)
    const slopes: number[] = [];
    for (let i = 0; i < grid.length; i++) {
      for (let j = 1; j < grid[i].length; j++) {
        const a = grid[i][j];
        const b = grid[i][j - 1];
        if (a?.valid && b?.valid && a.value != null && b.value != null) {
          if (mode === "pct_change") {
            // cells already hold pct vs previous width; use that level for scale
            slopes.push(a.value);
          } else {
            slopes.push(a.value - b.value);
          }
        }
      }
    }
    const raw = p95Abs(slopes);
    const sticky = updateStickyScale(params.stickyScale, raw);

    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        const cell = grid[i][j];
        if (!cell?.valid || cell.value == null) {
          cell.colorT = null;
          cell.bgCss = "rgb(20,20,28)";
          continue;
        }
        let s: number;
        if (mode === "pct_change") {
          s = cell.value;
        } else if (
          j >= 1 &&
          grid[i][j - 1]?.valid &&
          grid[i][j - 1].value != null
        ) {
          s = cell.value - (grid[i][j - 1].value as number);
        } else {
          s = 0;
        }
        const t = Math.max(-1, Math.min(1, s / sticky));
        cell.colorT = t;
        cell.bgCss = colorFromT(t);
      }
    }
    return { stickyScale: sticky };
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
