/**
 * Dollar-axis grid (Analyzer P&L Y and underlier X).
 * 1–2–5 × 10ⁿ, floor $10, ≥10 lines when the span allows, cap ~20 so labels read.
 * GEX scales are not dollars — do not use this there.
 */

export const AXIS_GRID_MIN_STEP = 10;
export const AXIS_GRID_MIN_LINES = 10;
export const AXIS_GRID_MAX_LINES = 20;

/** Smallest 1–2–5 × 10ⁿ ≥ raw. */
export function ceilNice125(raw: number): number {
  const x = Math.abs(Number(raw));
  if (!Number.isFinite(x) || x <= 0) return AXIS_GRID_MIN_STEP;
  const mag = Math.pow(10, Math.floor(Math.log10(x)));
  const n = x / mag;
  let nice = 10;
  if (n <= 1) nice = 1;
  else if (n <= 2) nice = 2;
  else if (n <= 5) nice = 5;
  const step = nice * mag;
  return step + 1e-12 < x ? nextNice125(step) : step;
}

export function nextNice125(step: number): number {
  const s = Math.abs(Number(step));
  if (!Number.isFinite(s) || s <= 0) return AXIS_GRID_MIN_STEP;
  const mag = Math.pow(10, Math.floor(Math.log10(s)));
  const n = Math.round(s / mag);
  if (n <= 1) return 2 * mag;
  if (n <= 2) return 5 * mag;
  return 10 * mag;
}

/**
 * Step for one visible axis span. Independent per axis (P&L vs underlier).
 * If even $10 cannot produce 10 lines, stay at $10 — do not invent $1/$2/$5.
 */
export function dollarAxisStep(range: number): number {
  const r = Math.abs(Number(range));
  if (!Number.isFinite(r) || r <= 0) return AXIS_GRID_MIN_STEP;
  const minByDensity = r / AXIS_GRID_MAX_LINES;
  let step = ceilNice125(Math.max(AXIS_GRID_MIN_STEP, minByDensity));
  while (r / step > AXIS_GRID_MAX_LINES + 1e-9) {
    step = nextNice125(step);
  }
  return step;
}

/** Inclusive grid-line count for a [min, max] window. */
export function dollarAxisLineCount(
  min: number,
  max: number,
  step: number,
): number {
  if (!(step > 0) || !(max >= min)) return 0;
  const y0 = Math.ceil(min / step) * step;
  if (y0 > max + 1e-9) return 0;
  return Math.floor((max - y0) / step + 1e-9) + 1;
}
