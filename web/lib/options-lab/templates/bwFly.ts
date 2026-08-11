/**
 * Broken-wing butterfly matrix.
 *
 * Structure: +1 @ lo / −2 @ body / +1 @ hi (long) with unequal wings.
 *
 * Columns = equal-wing width in points (same ladder as sym-fly: 20…50).
 * Broken wing = N listed strikes from body, placed on the side
 * closest to spot or furthest from spot (TemplateParams.bwWingSide).
 *
 * Debit: D = m(lo) + m(hi) − 2 m(body). Color: vertical % change (MSC).
 */

import {
  DEFAULT_GRADIENT_THRESHOLD,
  NULL_CELL_COLOR,
  colorFromT,
  debitColor,
  p95Abs,
  updateStickyScale,
} from "./color";
import {
  bwFlyDebit,
  fmtMoney,
  resolveBwWings,
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
import { heatmapFlyWidths, SYM_FLY_WIDTHS_DEFAULT } from "./symFly";

export const BW_STRIKE_COUNT_DEFAULT = 1;
export const BW_STRIKE_COUNT_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const BW_WING_SIDE_DEFAULT = "closest" as const;

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

function bwParams(params: TemplateParams): {
  nStrikes: number;
  wingSide: "closest" | "furthest";
} {
  const n = Math.max(
    1,
    Math.min(12, Math.floor(params.bwStrikeCount ?? BW_STRIKE_COUNT_DEFAULT)),
  );
  const wingSide =
    params.bwWingSide === "furthest" ? "furthest" : "closest";
  return { nStrikes: n, wingSide };
}

function formatDebit(n: number): string {
  return n.toFixed(2);
}

export const bwFlyTemplate: HeatmapTemplate = {
  id: "bw-fly",
  label: "Broken-wing flies",
  description:
    "Asymmetric 1-2-1 · equal wing = column width · broken wing = N strikes closest/furthest to spot",
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
    const { nStrikes, wingSide } = bwParams(params);
    const side = ctx.viewSide;
    const strikes = new Set<number>();
    for (const row of ctx.contracts.values()) {
      if ((row.side || "call").toLowerCase() !== side) continue;
      strikes.add(Number(row.strike));
    }
    const sorted = [...strikes].sort((a, b) => b - a);
    const rows: RowDef[] = [];
    for (const k of sorted) {
      if (!ctx.contracts.has(contractKey(side, k))) continue;
      // Prefer bodies that can form at least one valid BWB in the width set
      const canAny = widths.some((w) => {
        return resolveBwWings(ctx, k, w, nStrikes, wingSide) != null;
      });
      if (!canAny) {
        // Still show listed body (invalid cells paint as —)
        // Match sym-fly scaffold behavior
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
    const { nStrikes, wingSide } = bwParams(params);
    const wings = resolveBwWings(
      ctx,
      row.strike,
      col.widthPts,
      nStrikes,
      wingSide,
    );
    if (!wings) {
      return { display: "—", value: null, valid: false };
    }
    const { lo, hi, brokenDir } = wings;
    const d = bwFlyDebit(ctx, row.strike, lo, hi);
    if (d == null) {
      return { display: "—", value: null, valid: false };
    }
    const wLo = row.strike - lo;
    const wHi = hi - row.strike;
    const mode = params.valueMode;
    const structureTip = `Long ${lo} / short 2×${row.strike} / long ${hi}\nBroken wing ${brokenDir} · N=${nStrikes} · equal ${col.widthPts} pts`;

    if (mode === "credit") {
      const c = -d;
      return {
        display: formatDebit(c),
        value: c,
        valid: true,
        tooltip: `${structureTip}\nShort BWB credit ${fmtMoney(c)} (mid)`,
      };
    }
    if (mode === "r2r") {
      // Max profit under mid model ≈ min wing width − debit (same as sym when equal).
      if (d <= 0) {
        return {
          display: "—",
          value: null,
          valid: false,
          tooltip: "R:R needs positive debit",
        };
      }
      const maxProfit = Math.min(wLo, wHi) - d;
      if (maxProfit <= 0) {
        return {
          display: "—",
          value: null,
          valid: false,
          tooltip:
            "Debit ≥ min wing — no positive max profit under mid model",
        };
      }
      const rr = maxProfit / d;
      return {
        display: rr.toFixed(2),
        value: rr,
        valid: true,
        tooltip: `R:R ≈ (min(wL,wH)−D)/D = (${Math.min(wLo, wHi)}−${fmtMoney(d)})/${fmtMoney(d)}\n${structureTip}`,
      };
    }
    return {
      display: formatDebit(d),
      value: d,
      valid: true,
      tooltip: `${structureTip}\nDebit ${formatDebit(d)} (mid)`,
    };
  },

  assignColors(grid, params) {
    const mode = params.valueMode;
    const threshold =
      params.gradientThreshold ?? DEFAULT_GRADIENT_THRESHOLD;

    if (mode === "debit" || mode === "credit") {
      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
          const cell = grid[i][j];
          if (!cell?.valid || cell.value == null) {
            cell.colorT = null;
            cell.bgCss = NULL_CELL_COLOR;
            continue;
          }
          const val =
            mode === "credit"
              ? Math.abs(cell.value)
              : cell.value > 0
                ? cell.value
                : null;

          let pctChange = 0;
          if (i >= 1) {
            const upper = grid[i - 1][j];
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
          const pctChange = Math.abs(cell.value) * 100;
          cell.colorT = pctChange;
          cell.bgCss = debitColor(1, pctChange, threshold);
        }
      }
      return { stickyScale: threshold };
    }

    return { stickyScale: params.stickyScale ?? threshold };
  },
};
