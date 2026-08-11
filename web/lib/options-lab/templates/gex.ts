/** Chain GEX estimate gex_v1 — Spec §5.5 */

import { colorFromT, p95Abs, updateStickyScale } from "./color";
import { gexSide } from "./pricing";
import type {
  ChainContext,
  ColDef,
  GridCell,
  HeatmapTemplate,
  RowDef,
  TemplateParams,
} from "./types";
import { contractKey } from "@/lib/chainLadderApi";

const DISPLAY_DIV = 1e9; // documented divisor for readability

function fmtGex(n: number): string {
  const v = n / DISPLAY_DIV;
  return v.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

export const gexTemplate: HeatmapTemplate = {
  id: "gex",
  label: "Chain GEX (estimate)",
  description: "Γ×OI×S² per share; call +, put −; not dealer GEX",
  layout: "matrix",
  valueModes: [
    { id: "gex_net", label: "Net" },
    { id: "gex_call", label: "Call" },
    { id: "gex_put", label: "Put" },
  ],
  defaultValueMode: "gex_net",

  resolveColumns(_ctx, params) {
    const mode = params.valueMode;
    if (mode === "gex_call")
      return [{ id: "call", label: "Call", widthPts: 0 }];
    if (mode === "gex_put")
      return [{ id: "put", label: "Put", widthPts: 0 }];
    return [
      { id: "net", label: "Net", widthPts: 0 },
      { id: "call", label: "Call", widthPts: 0 },
      { id: "put", label: "Put", widthPts: 0 },
    ];
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
    if (col.id === "call") {
      const v = gexSide(ctx, "call", row.strike);
      if (v == null)
        return { display: "—", value: null, valid: false, tooltip: "Missing γ/OI" };
      return {
        display: fmtGex(v),
        value: v,
        valid: true,
        tooltip: `Call GEX (per share) ${v.toExponential(3)}`,
      };
    }
    if (col.id === "put") {
      const v = gexSide(ctx, "put", row.strike);
      if (v == null)
        return { display: "—", value: null, valid: false, tooltip: "Missing γ/OI" };
      return {
        display: fmtGex(v),
        value: v,
        valid: true,
        tooltip: `Put GEX (per share) ${v.toExponential(3)}`,
      };
    }
    // net — both sides required
    const c = gexSide(ctx, "call", row.strike);
    const p = gexSide(ctx, "put", row.strike);
    if (c == null || p == null) {
      return {
        display: "—",
        value: null,
        valid: false,
        tooltip: "Net needs call and put γ/OI",
      };
    }
    const v = c + p;
    return {
      display: fmtGex(v),
      value: v,
      valid: true,
      tooltip: `Net GEX estimate (per share) ${v.toExponential(3)}`,
    };
  },

  assignColors(grid, params) {
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
  },
};
