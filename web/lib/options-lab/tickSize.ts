/**
 * BASIS tick size from the PC1 Cboe fixture (PC-CHAIN-7).
 * Unknown product fails loud. No invented default.
 */

export type TickBand = {
  below: number;
  atOrAbove: number;
  threshold: number;
};

const ALL_PREMIUM = Number.POSITIVE_INFINITY;

const TABLE: Record<string, TickBand> = {
  SPX: { below: 0.05, atOrAbove: 0.1, threshold: 3 },
  SPXW: { below: 0.05, atOrAbove: 0.1, threshold: 3 },
  XSP: { below: 0.01, atOrAbove: 0.01, threshold: ALL_PREMIUM },
  SPY: { below: 0.01, atOrAbove: 0.01, threshold: ALL_PREMIUM },
  QQQ: { below: 0.01, atOrAbove: 0.01, threshold: ALL_PREMIUM },
  IWM: { below: 0.01, atOrAbove: 0.01, threshold: ALL_PREMIUM },
};

export function tickBandForProduct(product: string): TickBand {
  const key = String(product || "")
    .trim()
    .toUpperCase();
  const band = TABLE[key];
  if (!band) {
    throw new Error(
      `PC-CHAIN-7: no tick table for product ${JSON.stringify(product)}`,
    );
  }
  return band;
}

export function tickSize(product: string, premium: number): number {
  if (!Number.isFinite(premium) || premium < 0) {
    throw new Error(
      `PC-CHAIN-7: premium is not a usable number (${String(premium)})`,
    );
  }
  const band = tickBandForProduct(product);
  return premium < band.threshold ? band.below : band.atOrAbove;
}
