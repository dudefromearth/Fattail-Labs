/**
 * Risk Graph viewport autofit — ATM-centered.
 *
 * Priority:
 *  1. Center the X window on live ATM (spot).
 *  2. Keep the full position (strikes / structure content) visible.
 *  3. ~30% padding beyond content extent from ATM.
 *  4. **1σ view**: when a 1σ band width is known, autofit X snaps to a
 *     window where the 1σ band is **exactly 1/3 of the viewport**
 *     (viewport = 3 × 1σ width) — unless the structure is wider, in which
 *     case content wins. This replaced the old 5%-of-spot min half, which
 *     over-widened calendars/diagonals.
 *
 * Time-spread profile (calendar / diagonal):
 *  - Same X rules (1σ view above).
 *  - Milder Y soft-cap so residual peaks and −debit both stay readable.
 */

/** Fraction of content half-width added as pad (0.30 ⇒ 30%). */
export const AUTOFIT_PAD_FRAC = 0.30;

/** Floor half-width in price points when structure collapses to a pin. */
export const AUTOFIT_MIN_HALF_PTS = 25;

/**
 * On autofit, the 1σ band occupies this fraction of the viewport width
 * when structure fits inside that window.
 * 1/3 ⇒ viewport = 3 × (hi₁σ − lo₁σ); 1σ is never *less* than 1/3 of the view.
 */
export const ONE_SIGMA_MIN_VIEWPORT_FRAC = 1 / 3;

/** Milder loss-side share for residual calendars (was 0.20 — over-capped peaks). */
export const TIME_SPREAD_MIN_LOSS_Y_SHARE = 0.12;

/**
 * If |spot − contentMid| > this × contentSpan, treat spot as stale (e.g. default
 * 5950 before SSE) and fall back to content mid so autofit does not explode.
 */
const STALE_SPOT_SPAN_MULT = 3;

export type AutofitProfile = 'default' | 'time_spread';

export interface AtmCenteredXRangeArgs {
  spot: number;
  /** Prices that must remain visible (strikes, optional BEs). Spot is added. */
  contentPrices: readonly number[];
  /** Pad beyond content extent from ATM. Default 0.30. */
  padFrac?: number;
  minHalfPts?: number;
  /** calendar / diagonal — mild Y companion only; X uses same ATM + 1σ rules */
  profile?: AutofitProfile;
  /**
   * Full width of the 1σ expected-move band (hi − lo) under the PROB model.
   * When set, autofit X uses a window where 1σ = {@link ONE_SIGMA_MIN_VIEWPORT_FRAC}
   * of the viewport (never less than 1/3), expanding if the structure is
   * narrower and only going wider when content requires it.
   */
  oneSigmaBandWidth?: number;
}

/**
 * Symmetric X window about ATM (or content mid if spot looks stale).
 */
export function atmCenteredXRange(args: AtmCenteredXRangeArgs): {
  xMin: number;
  xMax: number;
  /** Spot used as center after stale-guard. */
  center: number;
} {
  const padFrac = args.padFrac ?? AUTOFIT_PAD_FRAC;
  const minHalf = args.minHalfPts ?? AUTOFIT_MIN_HALF_PTS;
  const spot = args.spot;

  const pts = args.contentPrices.filter(
    (p): p is number => typeof p === 'number' && Number.isFinite(p),
  );

  if (!(spot > 0) || !Number.isFinite(spot)) {
    if (pts.length === 0) return { xMin: 5900, xMax: 6100, center: 6000 };
    const mid = (Math.min(...pts) + Math.max(...pts)) / 2;
    let half = Math.max((Math.max(...pts) - Math.min(...pts)) / 2, minHalf) * (1 + padFrac);
    half = applyOneSigmaViewportCap(half, args.oneSigmaBandWidth, minHalf);
    return { xMin: mid - half, xMax: mid + half, center: mid };
  }

  if (pts.length === 0) {
    let half = Math.max(minHalf * 2, spot * 0.01);
    half = applyOneSigmaViewportCap(half, args.oneSigmaBandWidth, minHalf);
    return { xMin: spot - half, xMax: spot + half, center: spot };
  }

  const cMin = Math.min(...pts);
  const cMax = Math.max(...pts);
  const cSpan = Math.max(cMax - cMin, minHalf);
  const cMid = (cMin + cMax) / 2;

  // Stale default spot (e.g. 5950 vs SPX ~7500): don't center miles away
  let center = spot;
  if (Math.abs(spot - cMid) > cSpan * STALE_SPOT_SPAN_MULT) {
    center = cMid;
  }

  // Content that must fit: structure points + center
  const left = Math.max(0, center - Math.min(cMin, center));
  const right = Math.max(0, Math.max(cMax, center) - center);
  const contentHalf = Math.max(left, right, minHalf);
  // Padding beyond content extent from ATM
  let half = contentHalf * (1 + padFrac);

  // 1σ view: band = 1/3 of viewport when structure fits; content wins if wider
  half = applyOneSigmaViewportCap(half, args.oneSigmaBandWidth, contentHalf);

  return {
    xMin: center - half,
    xMax: center + half,
    center,
  };
}

/**
 * 1σ autofit window.
 *
 * Target: oneSigmaBandWidth / viewport = ONE_SIGMA_MIN_VIEWPORT_FRAC (1/3)
 *   ⇒ viewport = band / frac
 *   ⇒ half     = band / (2 * frac)
 *
 * - If structure fits inside that window → use the target half (1σ = 1/3 view).
 * - If structure is wider → keep content-based `half` (structure always visible).
 * - Never return below contentHalf.
 */
function applyOneSigmaViewportCap(
  half: number,
  oneSigmaBandWidth: number | undefined,
  contentHalf: number,
): number {
  if (
    oneSigmaBandWidth == null
    || !(oneSigmaBandWidth > 0)
    || !Number.isFinite(oneSigmaBandWidth)
  ) {
    return half;
  }
  const frac = ONE_SIGMA_MIN_VIEWPORT_FRAC;
  // half such that 2*half * frac = band  ⇒  1σ occupies exactly `frac` of viewport
  const targetHalf = oneSigmaBandWidth / (2 * frac);

  if (contentHalf >= targetHalf) {
    // Structure needs a wider window than the 1σ target — content wins (with pad).
    return Math.max(half, contentHalf);
  }
  // Structure fits: lock autofit to the 1σ view (band = 1/3 of viewport).
  // Also caps any over-wide pad / legacy floors so 1σ is never < 1/3.
  return Math.max(contentHalf, targetHalf);
}

/**
 * Y-range from visible P&L samples.
 *
 * default (butterflies, verticals, mixed books):
 *   Full peak + floor with 10% pad — tents must not clip vertically.
 *
 * time_spread (calendar / diagonal only):
 *   Mild soft-cap so residual peaks don't erase −debit on the scale.
 *   Never use this profile when a butterfly/vertical is visible.
 */
export function fitPnlYRange(
  pnls: readonly number[],
  profile: AutofitProfile = 'default',
): { yMin: number; yMax: number } {
  const vals = pnls.filter(v => Number.isFinite(v));
  if (vals.length === 0) return { yMin: -100, yMax: 100 };

  let yMin = Math.min(...vals, 0);
  let yMax = Math.max(...vals, 0);

  let yRange = yMax - yMin || 100;
  if (yRange < 50) {
    const yCenter = (yMin + yMax) / 2;
    yMin = yCenter - 50;
    yMax = yCenter + 50;
    yRange = 100;
  }

  if (profile === 'time_spread') {
    const floor = Math.min(...vals, 0);
    const peak = Math.max(...vals, 0);
    const lossMag = Math.max(Math.abs(floor), 50);

    // Light pad below debit
    yMin = floor - lossMag * 0.20;

    const minShare = TIME_SPREAD_MIN_LOSS_Y_SHARE;
    const lossDepth = Math.abs(Math.min(yMin, 0));
    const maxSpanForLoss = lossDepth / minShare;
    const rawSpan = peak * 1.08 - yMin;
    if (rawSpan > maxSpanForLoss && maxSpanForLoss > lossDepth + 50) {
      yMax = yMin + maxSpanForLoss;
    } else {
      yMax = Math.max(peak * 1.08, 50);
    }

    const yr = yMax - yMin;
    yMax += yr * 0.05;
    return { yMin, yMax };
  }

  // Butterflies / verticals / mixed: always keep full peak and debit floor.
  // Asymmetric tents (peak >> |debit|) need headroom above the peak, not a
  // residual soft-cap designed for calendars.
  const pad = Math.max(yRange * 0.12, 40);
  return {
    yMin: yMin - pad,
    yMax: yMax + pad,
  };
}

function isTimeSpreadType(s: { positionType?: string; strategy?: string; topology?: string }): boolean {
  const t = String(s.positionType || s.strategy || s.topology || '').toLowerCase();
  return t === 'calendar' || t === 'diagonal';
}

/**
 * Use residual (time-spread) Y autofit only when the entire *visible* book is
 * calendars/diagonals.
 *
 * Hidden calendars must NOT switch the profile — that soft-caps butterfly peaks
 * and clips the tent at the top of the chart.
 * Mixed fly + calendar → default (full peak headroom for the fly).
 */
export function isTimeSpreadAutofit(
  strategies: readonly {
    positionType?: string;
    strategy?: string;
    topology?: string;
    visible?: boolean;
  }[],
): boolean {
  const visible = strategies.filter(s => s.visible !== false);
  if (visible.length === 0) return false;
  return visible.every(isTimeSpreadType);
}
