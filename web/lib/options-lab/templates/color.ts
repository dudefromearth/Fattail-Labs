/**
 * Heatmap cell colors — port of MarketSwarm-Canonical MSHeatmap.debitColor.
 *
 * Color is driven by vertical % change of debit vs the upper adjacent strike
 * (same width), not by raw debit level.
 *
 * Blue band: pctChange < threshold (default 50)
 *   light blue rgb(59,130,246) → dark blue rgb(15,25,50)
 * Red band: pctChange ≥ threshold → maxRed = threshold × 2.5
 *   dark red rgb(50,15,15) → bright red rgb(239,68,68)
 */

export const DEFAULT_GRADIENT_THRESHOLD = 50;

export const NULL_CELL_COLOR = "#1a1a1a";

/** MSC debitColor(value, pctChange, threshold, nullColor) */
export function debitColor(
  value: number | null,
  pctChange: number,
  threshold: number = DEFAULT_GRADIENT_THRESHOLD,
  nullColor: string = NULL_CELL_COLOR,
): string {
  if (value === null || value <= 0) return nullColor;

  const maxRedPct = threshold * 2.5;
  let r: number, g: number, b: number;

  if (pctChange < threshold) {
    const t = pctChange / threshold;
    r = Math.round(59 - t * (59 - 15));
    g = Math.round(130 - t * (130 - 25));
    b = Math.round(246 - t * (246 - 50));
  } else {
    const t = Math.min((pctChange - threshold) / (maxRedPct - threshold), 1);
    r = Math.round(50 + t * (239 - 50));
    g = Math.round(15 + t * (68 - 15));
    b = Math.round(15 + t * (68 - 15));
  }

  return `rgb(${r}, ${g}, ${b})`;
}

/** Legacy diverging t∈[-1,1] helper (GEX / other templates). */
export function colorFromT(t: number): string {
  const x = Math.max(-1, Math.min(1, t));
  if (x <= 0) {
    const u = x + 1;
    const r = Math.round(153 + (13 - 153) * u);
    const g = Math.round(204 + (26 - 204) * u);
    const b = Math.round(255 + (89 - 255) * u);
    return `rgb(${r},${g},${b})`;
  }
  const u = x;
  const r = Math.round(89 + (255 - 89) * u);
  const g = Math.round(13 + (140 - 13) * u);
  const b = Math.round(20 + (140 - 20) * u);
  return `rgb(${r},${g},${b})`;
}

/** p95 of absolute values */
export function p95Abs(vals: number[]): number {
  if (!vals.length) return 1;
  const a = vals.map(Math.abs).sort((x, y) => x - y);
  const i = Math.min(a.length - 1, Math.floor(a.length * 0.95));
  return a[i] || 1;
}

/** Session sticky scale update (25% hysteresis) — GEX etc. */
export function updateStickyScale(
  sticky: number | undefined,
  rawP95: number,
  threshold = 0.25,
): number {
  const s = rawP95 > 0 ? rawP95 : 1;
  if (sticky == null || sticky <= 0) return s;
  if (Math.abs(s - sticky) / sticky > threshold) return s;
  return sticky;
}
