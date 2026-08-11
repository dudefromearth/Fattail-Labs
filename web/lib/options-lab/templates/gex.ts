/**
 * Chain GEX estimate — vertical profile (strike axis), Spec §5.5 / MSC-style.
 *
 * Layout: profile (not multi-column matrix).
 * Value modes: Call · Put · Net · Absolute (one series each).
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
  /** Signed for net/call/put; ≥0 for abs */
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
      case "gex_call":
        value = call;
        valid = call != null;
        break;
      case "gex_put":
        value = put;
        valid = put != null;
        break;
      case "gex_abs":
        value = gexAbs(ctx, k);
        valid = value != null;
        break;
      case "gex_net":
      default:
        value = gexNet(ctx, k);
        valid = value != null;
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

/** p95 |value| for bar scale */
export function gexProfileScale(points: GexProfilePoint[]): number {
  const vals = points
    .filter((p) => p.valid && p.value != null)
    .map((p) => Math.abs(p.value as number));
  if (!vals.length) return 1;
  vals.sort((a, b) => a - b);
  const i = Math.min(vals.length - 1, Math.floor(vals.length * 0.95));
  return vals[i] || 1;
}

/** Display divisor — raw / 1e9 */
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
    "Vertical strike profile · Γ×OI×S² · Call / Put / Net / Absolute · not dealer GEX",
  layout: "profile",
  valueModes: [
    { id: "gex_net", label: "Net" },
    { id: "gex_call", label: "Call" },
    { id: "gex_put", label: "Put" },
    { id: "gex_abs", label: "Absolute" },
  ],
  defaultValueMode: "gex_net",

  resolveColumns: () => [],
  resolveRows: () => [],
  computeCell: () => ({ display: null, value: null, valid: false }),
  assignColors: () => ({ stickyScale: 1 }),
};
