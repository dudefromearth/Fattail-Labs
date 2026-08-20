/** Shared 2D risk-graph types (host-contract viewport). */

export interface PnLPoint {
  price: number;
  pnl: number;
}

export type PriceAlertType = "price_above" | "price_below" | "price_touch";

export interface PnLChartHandle {
  autoFit: () => void;
}
