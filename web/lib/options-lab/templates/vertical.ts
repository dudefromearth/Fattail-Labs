/**
 * Vertical spread matrix — Spec HM §5.3.
 *
 * Debit: +1 body, −1 far (calls: K+w · puts: K−w).
 * Credit: flip. Exact listed strikes only.
 * Type (% Change · R:R) is secondary on the selected Debit or Credit package.
 */

import {
  DEFAULT_GRADIENT_THRESHOLD,
  NULL_CELL_COLOR,
  debitColor,
} from "./color";
import { heatmapFlyWidths } from "./symFly";
import {
  isPositiveListedDebit,
  verticalDebitPctFromSpot,
  verticalFarStrike,
  verticalPackage,
  type FlyDirection,
} from "./pricing";
import type {
  ChainContext,
  ColDef,
  GridCell,
  HeatmapTemplate,
  RowDef,
  TemplateParams,
  ValueModeId,
  VerticalKind,
  VerticalMetric,
} from "./types";
import { contractKey } from "@/lib/chainLadderApi";

export function verticalKindFromMode(
  valueMode: ValueModeId,
  stored?: VerticalKind,
): VerticalKind {
  if (valueMode === "credit") return "credit";
  if (valueMode === "debit") return "debit";
  return stored === "credit" ? "credit" : "debit";
}

export function verticalMetricFromMode(valueMode: ValueModeId): VerticalMetric {
  if (valueMode === "pct_change") return "pct_change";
  if (valueMode === "r2r") return "r2r";
  return "package";
}

export function verticalValueMode(
  kind: VerticalKind,
  metric: VerticalMetric,
): ValueModeId {
  if (metric === "pct_change") return "pct_change";
  if (metric === "r2r") return "r2r";
  return kind === "credit" ? "credit" : "debit";
}

export function verticalViewLabel(
  kind: VerticalKind,
  metric: VerticalMetric,
): string {
  const main = kind === "credit" ? "Credit" : "Debit";
  if (metric === "pct_change") return `${main} · % Change`;
  if (metric === "r2r") return `${main} · R:R`;
  return main;
}

function verticalDirection(kind: VerticalKind): FlyDirection {
  return kind === "credit" ? "short" : "long";
}

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
    "Debit or Credit vertical · Type is % Change or R:R of that package",
  layout: "matrix",
  valueModes: [
    { id: "debit", label: "Debit" },
    { id: "credit", label: "Credit" },
    { id: "pct_change", label: "% Change" },
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

    const metric = verticalMetricFromMode(params.valueMode);
    const kind: VerticalKind =
      metric === "package"
        ? params.valueMode === "credit"
          ? "credit"
          : "debit"
        : params.verticalKind === "credit"
          ? "credit"
          : "debit";
    const direction = verticalDirection(kind);
    const pkg = direction === "long" ? dLong : -dLong;

    if (metric === "pct_change") {
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
      const pct = verticalDebitPctFromSpot(ctx, strikes, idx, w, direction);
      if (pct == null) {
        return {
          display: "—",
          value: null,
          valid: false,
          tooltip: `Need ${kind} package at this strike and the next toward spot`,
        };
      }
      return {
        display: `${pct.toFixed(1)}%`,
        value: pct,
        valid: true,
        tooltip: `% change in ${kind} = |(inner − outer) / inner|`,
      };
    }

    if (metric === "r2r") {
      if (kind === "debit") {
        if (!isPositiveListedDebit(dLong)) {
          return {
            display: "—",
            value: null,
            valid: false,
            tooltip: "R:R needs a positive debit",
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
          tooltip: `R:R = (width − debit) / debit = (${w}−${formatPkg(dLong)})/${formatPkg(dLong)}`,
        };
      }
      const collected = -pkg;
      if (!isPositiveListedDebit(collected)) {
        return {
          display: "—",
          value: null,
          valid: false,
          tooltip: "R:R needs a collected credit",
        };
      }
      const maxLoss = w - collected;
      if (!(maxLoss > 0)) {
        return {
          display: "—",
          value: null,
          valid: false,
          tooltip: "Credit ≥ width — no positive max loss under mid model",
        };
      }
      const rr = collected / maxLoss;
      return {
        display: rr.toFixed(2),
        value: rr,
        valid: true,
        tooltip: `R:R = credit / (width − credit) = ${formatPkg(collected)}/(${w}−${formatPkg(collected)})`,
      };
    }

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
