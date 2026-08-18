/**
 * Vertical spread matrix — Spec HM §5.3.
 *
 * Long/Debit: +1 body, −1 far (calls: K+w · puts: K−w).
 * Short/Credit: flip. Exact listed strikes only.
 */

import {
  DEFAULT_GRADIENT_THRESHOLD,
  NULL_CELL_COLOR,
  debitColor,
} from "./color";
import { heatmapFlyWidths } from "./symFly";
import {
  verticalDebitPctFromSpot,
  verticalFarStrike,
  verticalPackage,
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

function widthList(ctx: ChainContext, params: TemplateParams): number[] {
  if (params.widthMode === "fixed_points" && params.fixedPoints?.length) {
    return [...params.fixedPoints];
  }
  return heatmapFlyWidths(ctx.strikeStep, params.widthCount ?? 7);
}

function formatPkg(n: number): string {
  return n.toFixed(2);
}

export const verticalTemplate: HeatmapTemplate = {
  id: "vertical",
  label: "Verticals",
  description:
    "Debit vertical · long body, short far strike (calls up / puts down)",
  layout: "matrix",
  valueModes: [
    { id: "debit", label: "Long/Debit" },
    { id: "credit", label: "Short/Credit" },
    { id: "pct_change", label: "% Change (debit)" },
    { id: "r2r", label: "Risk to Reward" },
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
    const side = ctx.viewSide;
    const strikes = new Set<number>();
    for (const row of ctx.contracts.values()) {
      if ((row.side || "call").toLowerCase() !== side) continue;
      strikes.add(Number(row.strike));
    }
    const rows: RowDef[] = [];
    for (const k of [...strikes].sort((a, b) => b - a)) {
      if (!ctx.contracts.has(contractKey(side, k))) continue;
      const body = ctx.contracts.get(contractKey(side, k));
      rows.push({
        strike: k,
        label: String(k),
        isSpot: Boolean(body?.is_spot),
      });
    }
    void widths;
    return rows;
  },

  computeCell(ctx, row, col, params) {
    const w = col.widthPts;
    const k = row.strike;
    const side = ctx.viewSide;
    const far = verticalFarStrike(side, k, w);
    const dLong = verticalPackage(ctx, k, w, "long");
    if (dLong == null) {
      return {
        display: "—",
        value: null,
        valid: false,
        tooltip: `${side} ${k} / ${far} not both listed with mids`,
      };
    }

    if (params.valueMode === "pct_change") {
      const strikes = params.flyRowStrikes;
      const idx = params.flyRowIndex;
      if (strikes == null || idx == null || idx < 0) {
        return {
          display: "—",
          value: null,
          valid: false,
          tooltip: "Row order unavailable",
        };
      }
      const pct = verticalDebitPctFromSpot(ctx, strikes, idx, w);
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
        tooltip: `% change in debit = |(inner − outer) / inner|`,
      };
    }

    if (params.valueMode === "r2r") {
      if (!(dLong > 0)) {
        return {
          display: "—",
          value: null,
          valid: false,
          tooltip: "Risk to Reward needs a positive debit",
        };
      }
      const maxProfit = w - dLong;
      if (!(maxProfit > 0)) {
        return {
          display: "—",
          value: null,
          valid: false,
          tooltip: "Debit ≥ width — no positive max profit under mid model",
        };
      }
      const rr = maxProfit / dLong;
      return {
        display: rr.toFixed(2),
        value: rr,
        valid: true,
        tooltip: `Risk to Reward = (width − debit) / debit = (${w}−${formatPkg(dLong)})/${formatPkg(dLong)}`,
      };
    }

    const direction = params.valueMode === "credit" ? "short" : "long";
    const pkg = direction === "long" ? dLong : -dLong;
    const longTip =
      side === "call"
        ? `Long ${k} / short ${far} call`
        : `Long ${k} / short ${far} put`;
    const shortTip =
      side === "call"
        ? `Short ${k} / long ${far} call`
        : `Short ${k} / long ${far} put`;
    return {
      display: formatPkg(pkg),
      value: pkg,
      valid: true,
      tooltip: `${direction === "long" ? longTip : shortTip}\nPackage ${formatPkg(pkg)} (mid)`,
    };
  },

  assignColors(grid, params) {
    const threshold =
      params.gradientThreshold ?? DEFAULT_GRADIENT_THRESHOLD;
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
