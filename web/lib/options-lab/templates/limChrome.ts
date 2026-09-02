/**
 * LIM chrome — Spec v0.4.4 Appendix B verbatim (LIM27 · E24). Tango lock.
 * Cell labels are book-terms (LIM36 · E23). No MSC outcome names.
 */

export const LIM_PICKER_LABEL = "GEX lean (window)";
export const LIM_MODE_LABEL = "Lean / near-spot mix";

export const LIM_AXIS_X = "Lean";
export const LIM_AXIS_Y = "Near-spot mix";

export const LIM_AXIS_X_EDGE =
  "← mass sits below spot | mass sits above spot →";
export const LIM_AXIS_Y_TOP = "positive, concentrated, close to spot";
export const LIM_AXIS_Y_BOTTOM = "negative or thin, dispersed, far";

export const LIM_CELL_UL = "Weight below · packed";
export const LIM_CELL_UR = "Weight above · packed";
export const LIM_CELL_LL = "Weight below · loose";
export const LIM_CELL_LR = "Weight above · loose";

export const LIM_CHROME_1 =
  "Chain GEX (estimate). Dealer sign is assumed, not observed.";
export const LIM_CHROME_2 =
  "Window read — mass outside the wings is not counted.";
export const LIM_CHROME_4 =
  "The near-spot mix is a blend of measured factors. Whether it resists price movement is unmeasured.";

export const LIM_CHROME_3_HOLE =
  "Open interest as-of date unavailable. Today's trading is not in it.";

export function limChromeLine3(oiAsOf: string | null): string {
  if (oiAsOf == null || oiAsOf === "") return LIM_CHROME_3_HOLE;
  return `Open interest as of ${oiAsOf}. Today's trading is not in it.`;
}

/** Lines 1, 2, 4 — behind the title info affordance (LIM27 · E24). */
export function limChromeInfoLines(): string[] {
  return [LIM_CHROME_1, LIM_CHROME_2, LIM_CHROME_4];
}

/** State line: facts only. Never a crossing price (AT-LIM18). */
export function limStateLine(r: {
  expiration: string;
  wings: number;
  crossingCount: number;
}): string {
  const exp = r.expiration || "—";
  return `${exp} · w${r.wings} · crossings ${r.crossingCount}`;
}

export function limNumericHeader(r: {
  x: number;
  y: number;
  magF: number;
  crossingCount: number;
  crossingProximity: number;
}): string {
  const lean = r.x.toFixed(1);
  const mix = Number.isInteger(r.y) ? String(r.y) : r.y.toFixed(1);
  return `Lean ${lean} · Mix ${mix} · magF ${limMagFDisplay(r.magF)} · crossings ${r.crossingCount} · prox ${limProximityDisplay(r.crossingProximity)}`;
}

export function limMagFDisplay(magF: number): string {
  return Number.isInteger(magF) ? String(magF) : magF.toFixed(1);
}

export function limProximityDisplay(p: number): string {
  return p.toFixed(2);
}

export const LIM_DOT_OPACITY = 1;

/** Echo · E19 — legible on a dark cell; does not dominate one quadrant. */
export const LIM_DISC_R_PT = 9;

/** Narrow breakpoint (LIM31 · E21). Width of the LIM root, CSS pixels. */
export const LIM_NARROW_PX = 420;

export function limDotXY(
  x: number,
  y: number,
  w: number,
  h: number,
): { left: number; top: number } {
  return {
    left: ((x + 100) / 200) * w,
    top: ((100 - y) / 100) * h,
  };
}

/** Live disc uses clamped x. Ghosts may use xUnclamped past the edge. */
export function limGhostXY(
  xUnclamped: number,
  y: number,
  w: number,
  h: number,
): { left: number; top: number } {
  return {
    left: ((xUnclamped + 100) / 200) * w,
    top: ((100 - y) / 100) * h,
  };
}

export function limPlanePoint(
  result: { x: number; y: number; valid: boolean } | null,
): { x: number; y: number } {
  if (result == null || !result.valid) return { x: 0, y: 50 };
  return { x: result.x, y: result.y };
}

/**
 * AT-LIM24 — width in, not a mode. Chip always; trail drops when narrow.
 */
export function limSurfaceFlags(widthPx: number): {
  chip: true;
  trail: boolean;
} {
  return {
    chip: true,
    trail: widthPx >= LIM_NARROW_PX,
  };
}

export const LIM_AT23_WORDS = [
  "wall",
  "magnet",
  "pin",
  "gravity",
  "intent",
  "hostile",
  "support",
  "resistance",
  "friction",
  "muddy",
  "slippery",
] as const;

/** MSC outcome names — banned so they cannot land beside book-terms (E23). */
export const LIM_AT23_PHRASES = [
  "false breakout",
  "downside acceleration",
  "air-pocket",
  "air pocket",
  "mean reversion",
] as const;
