/** Heatmap template types — Spec HM v0.2 */

import type { LadderRow } from "@/lib/chainLadderApi";

export type ValueModeId =
  | "debit"
  | "credit"
  | "r2r"
  | "pct_change"
  | "gex_all"
  | "gex_net"
  | "gex_call"
  | "gex_put"
  | "gex_abs"
  | "quote";

export type TemplateLayout = "table" | "matrix" | "profile";

export type ChainContext = {
  symbol: string;
  viewSide: "call" | "put";
  spot: number | null;
  strikeStep: number | null;
  wings: number;
  /** Dual-side contract map "call:K" / "put:K" */
  contracts: Map<string, LadderRow>;
  asOf: string | null;
  contentHash: string | null;
};

export type ColDef = {
  id: string;
  label: string;
  /** Width in points (center-to-wing) */
  widthPts: number;
};

export type RowDef = {
  strike: number;
  label: string;
  isSpot?: boolean;
};

export type GridCell = {
  display: string | null;
  value: number | null;
  colorT: number | null;
  valid: boolean;
  tooltip?: string;
  bgCss?: string;
};

export type TemplateParams = {
  valueMode: ValueModeId;
  widthMode: "step_multiples" | "fixed_points" | "msc_default";
  /** n = 1..N for step_multiples */
  widthCount?: number;
  fixedPoints?: number[];
  /** Sticky scale for color hysteresis (GEX etc.) */
  stickyScale?: number;
  /**
   * MSC gradient threshold (1–100 scale, same units as vertical % change).
   * Default 50 — blue below, red above (see MSHeatmap.debitColor).
   */
  gradientThreshold?: number;
};

export type HeatmapTemplate = {
  id: string;
  label: string;
  description: string;
  layout: TemplateLayout;
  valueModes: { id: ValueModeId; label: string }[];
  defaultValueMode: ValueModeId;
  resolveColumns: (ctx: ChainContext, params: TemplateParams) => ColDef[];
  resolveRows: (ctx: ChainContext, params: TemplateParams) => RowDef[];
  computeCell: (
    ctx: ChainContext,
    row: RowDef,
    col: ColDef,
    params: TemplateParams,
  ) => Omit<GridCell, "colorT" | "bgCss">;
  assignColors: (
    grid: GridCell[][],
    params: TemplateParams,
  ) => { stickyScale: number };
};
