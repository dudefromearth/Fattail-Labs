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
 *  5. **Expiration breakevens ≤ ½ viewport** (Labs): when exp BEs are
 *     supplied, expand X so their span occupies at most
 *     {@link EXP_BREAKEVEN_MAX_VIEWPORT_FRAC} of the viewport, then apply
 *     {@link AUTOFIT_PAD_FRAC} beyond that target so markers sit with pad.
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

/**
 * Max fraction of viewport width occupied by expiration-line breakeven span.
 * 1/2 ⇒ (maxBE − minBE) / viewport ≤ 0.5 before pad expansion.
 */
export const EXP_BREAKEVEN_MAX_VIEWPORT_FRAC = 1 / 2;

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
  /**
   * Expiration-line breakeven prices only (not T+0 / theoretical BEs).
   * When ≥2 finite values, expand viewport so their span occupies at most
   * {@link EXP_BREAKEVEN_MAX_VIEWPORT_FRAC} of the width, then apply pad.
   */
  expBreakevenPrices?: readonly number[];
  /**
   * Max viewport fraction for exp BE span. Default
   * {@link EXP_BREAKEVEN_MAX_VIEWPORT_FRAC} (0.5).
   */
  expBreakevenMaxViewportFrac?: number;
}

/**
 * Symmetric X window about ATM (or content mid if spot looks stale).
 */
/**
 * Analyzer Autofit X: Shown strikes centered in the plot.
 *
 * When `plotWidthPx` + `ptsPerInch` are set, X span is
 * (plot CSS inches) × points/inch — a physical scale, not “fill the pane
 * with the tent.” Higher pts/inch → more axis on screen → smaller tent.
 * Strike span always fits (never clip the book).
 *
 * Without density, falls back to strike span + padFrac of that span
 * each side (legacy).
 */
export function strikeCenteredXRange(args: {
  strikes: readonly number[];
  padFrac?: number;
  minSpanPts?: number;
  plotWidthPx?: number;
  ptsPerInch?: number;
}): { xMin: number; xMax: number; center: number } {
  const padFrac = args.padFrac ?? AUTOFIT_PAD_FRAC;
  const minSpan = Math.max(args.minSpanPts ?? AUTOFIT_MIN_HALF_PTS * 2, 1);
  const ks = [
    ...new Set(
      args.strikes.filter((k) => Number.isFinite(k) && k > 0),
    ),
  ].sort((a, b) => a - b);
  if (!ks.length) {
    return { xMin: 5900, xMax: 6100, center: 6000 };
  }
  const lo = ks[0];
  const hi = ks[ks.length - 1];
  const center = (lo + hi) / 2;
  const raw = hi - lo;
  const span = raw > 1e-6 ? raw : minSpan;
  const plotPx = args.plotWidthPx;
  const ppi = args.ptsPerInch;
  if (
    plotPx != null &&
    ppi != null &&
    plotPx > 0 &&
    ppi > 0 &&
    Number.isFinite(plotPx) &&
    Number.isFinite(ppi)
  ) {
    const fromDensity = (plotPx / 96) * ppi;
    const xSpan = Math.max(span, fromDensity);
    const half = xSpan / 2;
    return { xMin: center - half, xMax: center + half, center };
  }
  const pad = span * padFrac;
  const half = span / 2 + pad;
  return { xMin: center - half, xMax: center + half, center };
}

/**
 * Time Machine Autofit X: same density/strike span as Autofit, centered on
 * the session open (ATM-O1). Listed strikes stay in view so the tent is
 * not clipped when the open sits away from today's book.
 */
export function openCenteredXRange(args: {
  strikes: readonly number[];
  open: number;
  padFrac?: number;
  minSpanPts?: number;
  plotWidthPx?: number;
  ptsPerInch?: number;
}): { xMin: number; xMax: number; center: number } {
  const open = args.open;
  const win = strikeCenteredXRange({
    strikes: args.strikes,
    padFrac: args.padFrac,
    minSpanPts: args.minSpanPts,
    plotWidthPx: args.plotWidthPx,
    ptsPerInch: args.ptsPerInch,
  });
  if (!(open > 0) || !Number.isFinite(open)) return win;
  const half = Math.max((win.xMax - win.xMin) / 2, AUTOFIT_MIN_HALF_PTS);
  let xMin = open - half;
  let xMax = open + half;
  const pad = Math.max(5, (xMax - xMin) * 0.02);
  for (const k of args.strikes) {
    if (!(k > 0) || !Number.isFinite(k)) continue;
    if (k < xMin) xMin = k - pad;
    if (k > xMax) xMax = k + pad;
  }
  return { xMin, xMax, center: open };
}

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
    half = applyExpBreakevenViewportCap(half, args, padFrac);
    return { xMin: mid - half, xMax: mid + half, center: mid };
  }

  if (pts.length === 0) {
    let half = Math.max(minHalf * 2, spot * 0.01);
    half = applyOneSigmaViewportCap(half, args.oneSigmaBandWidth, minHalf);
    half = applyExpBreakevenViewportCap(half, args, padFrac);
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

  // Exp BEs ≤ ½ viewport (+ pad) — only expands; never shrinks structure/1σ
  half = applyExpBreakevenViewportCap(half, args, padFrac);

  return {
    xMin: center - half,
    xMax: center + half,
    center,
  };
}

/**
 * Expand half so expiration breakeven span ≤ maxFrac of viewport, with pad.
 *
 *   beSpan / (2 * half) ≤ maxFrac / (1 + padFrac)
 *   ⇒ half ≥ beSpan * (1 + padFrac) / (2 * maxFrac)
 *
 * Default maxFrac=0.5, pad=0.30 → BEs occupy ~38% of view (≤ ½ with pad).
 * Only expands; never shrinks an existing half (structure / 1σ win).
 * Single BE (span 0) is a no-op.
 */
function applyExpBreakevenViewportCap(
  half: number,
  args: Pick<
    AtmCenteredXRangeArgs,
    'expBreakevenPrices' | 'expBreakevenMaxViewportFrac'
  >,
  padFrac: number,
): number {
  const bes = (args.expBreakevenPrices ?? []).filter(
    (p): p is number => typeof p === 'number' && Number.isFinite(p),
  );
  if (bes.length < 2) return half;

  const beSpan = Math.max(...bes) - Math.min(...bes);
  if (!(beSpan > 0) || !Number.isFinite(beSpan)) return half;

  const maxFrac =
    args.expBreakevenMaxViewportFrac ?? EXP_BREAKEVEN_MAX_VIEWPORT_FRAC;
  if (!(maxFrac > 0) || !(maxFrac <= 1)) return half;

  // Target: BE span is maxFrac of the *content* intent, then pad outside.
  // half such that 2*half = beSpan/maxFrac * (1+padFrac)
  const targetHalf = (beSpan * (1 + padFrac)) / (2 * maxFrac);
  return Math.max(half, targetHalf);
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
