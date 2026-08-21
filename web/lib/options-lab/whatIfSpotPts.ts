/**
 * What-if Spot offset in strike/price points (not %).
 * Slider travel = visible canvas X about live/session spot.
 */

export const WHATIF_SPOT_PTS_FALLBACK = 50;

export function spotPtsRangeFromCanvas(args: {
  xMin: number;
  xMax: number;
  spot: number;
}): { min: number; max: number } {
  const { xMin, xMax, spot } = args;
  if (
    !(spot > 0) ||
    !Number.isFinite(spot) ||
    !Number.isFinite(xMin) ||
    !Number.isFinite(xMax) ||
    !(xMax > xMin)
  ) {
    return { min: -WHATIF_SPOT_PTS_FALLBACK, max: WHATIF_SPOT_PTS_FALLBACK };
  }
  const min = Math.floor(xMin - spot);
  const max = Math.ceil(xMax - spot);
  if (!(max > min)) {
    return { min: -WHATIF_SPOT_PTS_FALLBACK, max: WHATIF_SPOT_PTS_FALLBACK };
  }
  return { min, max };
}

export function clampSpotPts(
  pts: number,
  range: { min: number; max: number },
): number {
  if (!Number.isFinite(pts)) return 0;
  return Math.min(range.max, Math.max(range.min, pts));
}

export function spotPctFromPts(pts: number, spot: number): number {
  if (!(spot > 0) || !Number.isFinite(pts)) return 0;
  return (pts / spot) * 100;
}
