/**
 * Chain GEX estimate gex_v1 — Spec §5.5
 *
 * Columns / value modes: Call · Put · Net · Absolute
 * Formula: call +Γ·OI·S² ; put −Γ·OI·S² ; net = sum ; abs = |call|+|put|
 * Label always “estimate” — not dealer GEX (HM12).
 */

import { NULL_CELL_COLOR, colorFromT, p95Abs, updateStickyScale } from "./color";
import { gexAbs, gexNet, gexSide } from "./pricing";
import type {
  ColDef,
  GridCell,
  HeatmapTemplate,
  TemplateParams,
} from "./types";
import { contractKey } from "@/lib/chainLadderApi";

/** Display divisor (OD4) — raw / 1e9 for readable tiles */
const DISPLAY_DIV = 1e9;

function fmtGex(n: number): string {
  const v = n / DISPLAY_DIV;
  return v.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

function cellFromValue(
  v: number | null,
  tooltipOk: string,
  tooltipBad: string,
): Omit<GridCell, "colorT" | "bgCss"> {
  if (v == null) {
    return {
      display: "—",
      value: null,
      valid: false,
      tooltip: tooltipBad,
    };
  }
  return {
    display: fmtGex(v),
    value: v,
    valid: true,
    tooltip: tooltipOk,
  };
}

const ALL_COLS: ColDef[] = [
  { id: "call", label: "Call", widthPts: 0 },
  { id: "put", label: "Put", widthPts: 0 },
  { id: "net", label: "Net", widthPts: 0 },
  { id: "abs", label: "Abs", widthPts: 0 },
];

export const gexTemplate: HeatmapTemplate = {
  id: "gex",
  label: "Chain GEX (estimate)",
  description:
    "Γ×OI×S² per share · Call + · Put − · Net · Abs = |C|+|P| · not dealer GEX",
  layout: "matrix",
  valueModes: [
    { id: "gex_all", label: "All" },
    { id: "gex_call", label: "Call" },
    { id: "gex_put", label: "Put" },
    { id: "gex_net", label: "Net" },
    { id: "gex_abs", label: "Absolute" },
  ],
  defaultValueMode: "gex_all",

  resolveColumns(_ctx, params) {
    switch (params.valueMode) {
      case "gex_call":
        return [{ id: "call", label: "Call", widthPts: 0 }];
      case "gex_put":
        return [{ id: "put", label: "Put", widthPts: 0 }];
      case "gex_net":
        return [{ id: "net", label: "Net", widthPts: 0 }];
      case "gex_abs":
        return [{ id: "abs", label: "Abs", widthPts: 0 }];
      case "gex_all":
      default:
        return ALL_COLS;
    }
  },

  resolveRows(ctx) {
    const strikes = new Set<number>();
    for (const row of ctx.contracts.values()) {
      strikes.add(Number(row.strike));
    }
    return [...strikes]
      .sort((a, b) => b - a)
      .map((k) => {
        const c = ctx.contracts.get(contractKey("call", k));
        const p = ctx.contracts.get(contractKey("put", k));
        return {
          strike: k,
          label: String(k),
          isSpot: Boolean(c?.is_spot || p?.is_spot),
        };
      });
  },

  computeCell(ctx, row, col) {
    const k = row.strike;
    if (col.id === "call") {
      const v = gexSide(ctx, "call", k);
      return cellFromValue(
        v,
        `Call GEX (estimate) +Γ·OI·S² = ${v != null ? v.toExponential(3) : "—"} /share`,
        "Missing call γ or OI",
      );
    }
    if (col.id === "put") {
      const v = gexSide(ctx, "put", k);
      return cellFromValue(
        v,
        `Put GEX (estimate) −Γ·OI·S² = ${v != null ? v.toExponential(3) : "—"} /share`,
        "Missing put γ or OI",
      );
    }
    if (col.id === "abs") {
      const v = gexAbs(ctx, k);
      return cellFromValue(
        v,
        `Absolute GEX |call|+|put| = ${v != null ? v.toExponential(3) : "—"} /share`,
        "Abs needs call and put γ/OI",
      );
    }
    // net
    const v = gexNet(ctx, k);
    return cellFromValue(
      v,
      `Net GEX (estimate) call+put = ${v != null ? v.toExponential(3) : "—"} /share`,
      "Net needs call and put γ/OI",
    );
  },

  assignColors(grid, params) {
    const mode = params.valueMode;
    const vals: number[] = [];
    for (const row of grid) {
      for (const cell of row) {
        if (cell.valid && cell.value != null) vals.push(cell.value);
      }
    }
    const raw = p95Abs(vals);
    const sticky = updateStickyScale(params.stickyScale, raw);

    for (let ri = 0; ri < grid.length; ri++) {
      for (let ci = 0; ci < grid[ri].length; ci++) {
        const cell = grid[ri][ci];
        if (!cell.valid || cell.value == null) {
          cell.colorT = null;
          cell.bgCss = NULL_CELL_COLOR;
          continue;
        }
        // Resolve column id from current mode layout
        let colId: string;
        if (mode === "gex_all") colId = ALL_COLS[ci]?.id ?? "net";
        else if (mode === "gex_call") colId = "call";
        else if (mode === "gex_put") colId = "put";
        else if (mode === "gex_abs") colId = "abs";
        else colId = "net";

        if (colId === "abs") {
          const t = Math.min(1, Math.abs(cell.value) / sticky);
          cell.colorT = t;
          cell.bgCss = absBlue(t);
          continue;
        }
        // Signed: call +, put −, net diverging blue↔red
        const t = Math.max(-1, Math.min(1, cell.value / sticky));
        cell.colorT = t;
        cell.bgCss = colorFromT(t);
      }
    }
    return { stickyScale: sticky };
  },
};

/** Absolute GEX color: dark navy → bright blue by magnitude t∈[0,1]. */
function absBlue(t: number): string {
  const u = Math.max(0, Math.min(1, t));
  // dark (15,25,50) → light (59,130,246)  — MSC blue band
  const r = Math.round(15 + (59 - 15) * u);
  const g = Math.round(25 + (130 - 25) * u);
  const b = Math.round(50 + (246 - 50) * u);
  return `rgb(${r},${g},${b})`;
}
