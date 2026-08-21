/** Heatmap template types — Spec HM v0.2 */

import type { LadderRow } from "@/lib/chainLadderApi";

export type ValueModeId =
  | "debit"
  | "credit"
  | "r2r"
  | "pct_change"
  | "d_debit"
  | "d2_debit"
  | "theta"
  | "velocity"
  | "acceleration"
  | "slope"
  | "curvature"
  | "cp_asym"
  | "width_fit"
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

export type WidthFitQuality = "good" | "poor" | "invalid";

export type WidthFitComponents = {
  debit_efficiency: number | null;
  payoff_efficiency: number | null;
  gamma_efficiency: number | null;
  curvature_efficiency: number | null;
  theta_efficiency: number | null;
  surface_responsiveness: number | null;
  call_put_asymmetry: number | null;
};

export type WidthFitWeights = {
  debit_efficiency: number;
  payoff_efficiency: number;
  gamma_efficiency: number;
  curvature_efficiency: number;
  theta_efficiency: number;
  surface_responsiveness: number;
  call_put_asymmetry: number;
};

export type GridCell = {
  display: string | null;
  value: number | null;
  colorT: number | null;
  valid: boolean;
  tooltip?: string;
  bgCss?: string;
  components?: WidthFitComponents;
  qualityFlag?: WidthFitQuality;
  widthFitStability?: number;
  widthFitOutline?: boolean;
};

/** Which side of the body gets the broken (N-strike) wing. */
export type BwWingSide = "closest" | "furthest";

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
  /**
   * bw-fly: listed-strike count from body for the broken wing (1 = next strike).
   * The other wing uses the column width (points).
   */
  bwStrikeCount?: number;
  /**
   * bw-fly: place the broken wing on the side of body closest to spot,
   * or furthest from spot. When spot is missing, furthest → upper wing.
   */
  bwWingSide?: BwWingSide;
  /**
   * Advanced Fly — client history reader (time derivatives).
   * Optional; when absent, time modes render invalid.
   */
  flyHistory?: import("./flySurfaceHistory").FlySurfaceHistory | null;
  /** Live generation clocks / identity for pairing (before history push). */
  flyLiveAsOf?: string | null;
  flyLiveContentHash?: string | null;
  flyLiveReceivedAt?: number;
  /** Descending centers for this grid (slope/curvature). */
  flyRowStrikes?: readonly number[];
  flyRowIndex?: number;
  /** Width Fit — seven criteria weights (OD-W6: no stability slot). */
  widthFitWeights?: WidthFitWeights;
  minValidN?: number;
  /** Clamped to a config floor — not member-zeroable (OD-W6). */
  stabilityPenaltyStrength?: number;
  widthFitNormalization?: "per_width" | "grid";
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
