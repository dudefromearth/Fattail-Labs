/** Shared 2D risk-graph types (host-contract viewport). */

export interface PnLPoint {
  price: number;
  pnl: number;
}

export type PriceAlertType = "price_above" | "price_below" | "price_touch";

export interface PnLChartHandle {
  autoFit: () => void;
  /** Current X window — Autofit uses this to test PC-FIT-3 escape. */
  getView: () => { xMin: number; xMax: number; yMin: number; yMax: number };
}
