/**
 * Chain GEX estimate — vertical profile (strike axis), Spec §5.5 / MSC-style.
 *
 * Value modes:
 *   - Combined (default): call bar → right, put bar → left on same strike
 *   - Net: single signed bar
 *   - Absolute: |call|+|put| → right
 *
 * Formula gex_v1: call +Γ·OI·S² ; put −Γ·OI·S² ; net = sum ; abs = |C|+|P|
 */

import type { ChainContext, HeatmapTemplate, ValueModeId } from "./types";
import { contractKey } from "@/lib/chainLadderApi";
import { gexAbs, gexNet, gexSide } from "./pricing";

export type GexProfilePoint = {
  strike: number;
  label: string;
  isSpot: boolean;
  /** Mode series value (net / abs / or null when combined-only) */
  value: number | null;
  valid: boolean;
  call: number | null;
  put: number | null;
};

export function buildGexProfile(
  ctx: ChainContext,
  mode: ValueModeId,
): GexProfilePoint[] {
  const strikes = new Set<number>();
  for (const row of ctx.contracts.values()) {
    strikes.add(Number(row.strike));
  }
  const sorted = [...strikes].sort((a, b) => b - a);
  return sorted.map((k) => {
    const cRow = ctx.contracts.get(contractKey("call", k));
    const pRow = ctx.contracts.get(contractKey("put", k));
    const call = gexSide(ctx, "call", k);
    const put = gexSide(ctx, "put", k);

    let value: number | null = null;
    let valid = false;

    switch (mode) {
      case "gex_abs":
        value = gexAbs(ctx, k);
        valid = value != null;
        break;
      case "gex_net":
        value = gexNet(ctx, k);
        valid = value != null;
        break;
      case "gex_all": // combined book view
      case "gex_call": // legacy → treat as combined
      case "gex_put":
      default:
        // Combined: valid if either side has data
        valid = call != null || put != null;
        value = gexNet(ctx, k); // still compute net for label/tooltip when both present
        break;
    }

    return {
      strike: k,
      label: String(k),
      isSpot: Boolean(cRow?.is_spot || pRow?.is_spot),
      value,
      valid,
      call,
      put,
    };
  });
}

/** p95 scale for bar widths — mode-aware */
export function gexProfileScale(
  points: GexProfilePoint[],
  mode: ValueModeId,
): number {
  const vals: number[] = [];
  for (const p of points) {
    if (mode === "gex_abs") {
      if (p.valid && p.value != null) vals.push(Math.abs(p.value));
    } else if (mode === "gex_net") {
      if (p.valid && p.value != null) vals.push(Math.abs(p.value));
    } else {
      // combined: scale from call magnitude and |put|
      if (p.call != null) vals.push(Math.abs(p.call));
      if (p.put != null) vals.push(Math.abs(p.put));
    }
  }
  if (!vals.length) return 1;
  vals.sort((a, b) => a - b);
  const i = Math.min(vals.length - 1, Math.floor(vals.length * 0.95));
  return vals[i] || 1;
}

export const GEX_DISPLAY_DIV = 1e9;

export function fmtGexProfile(n: number): string {
  const v = n / GEX_DISPLAY_DIV;
  return v.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

export const gexTemplate: HeatmapTemplate = {
  id: "gex",
  label: "Chain GEX (estimate)",
  description:
    "Vertical profile · Call+Put combined · Net · Absolute · Γ×OI×S² · not dealer GEX",
  layout: "profile",
  valueModes: [
    { id: "gex_all", label: "Call / Put" },
    { id: "gex_net", label: "Net" },
    { id: "gex_abs", label: "Absolute" },
  ],
  defaultValueMode: "gex_all",

  resolveColumns: () => [],
  resolveRows: () => [],
  computeCell: () => ({ display: null, value: null, valid: false }),
  assignColors: () => ({ stickyScale: 1 }),
};
