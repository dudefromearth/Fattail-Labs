/**
 * LIM chrome — Spec v0.4.7 Appendix B verbatim (LIM27 · E24). Tango lock.
 * Plane-edge labels are Coach-drawn (LIM9). No in-plane copy. No MSC outcome names.
 */

export const LIM_PICKER_LABEL = "GEX lean (window)";
export const LIM_MODE_LABEL = "Lean / near-spot mix";

export const LIM_AXIS_X = "Lean";
export const LIM_AXIS_Y = "Near-spot mix";

export const LIM_LABEL_EXPANSION = "EXPANSION";
export const LIM_LABEL_COMPRESSION = "COMPRESSION";
export const LIM_LABEL_WEIGHT_BELOW = "< WEIGHT BELOW";
export const LIM_LABEL_WEIGHT_ABOVE = "WEIGHT ABOVE >";

export const LIM_AXIS_GREEN = "#34c759";
export const LIM_AXIS_RED = "#ff3b30";

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

/** All four Appendix B lines — behind the title info affordance. */
export function limChromeInfoLines(oiAsOf: string | null = null): string[] {
  return [LIM_CHROME_1, LIM_CHROME_2, limChromeLine3(oiAsOf), LIM_CHROME_4];
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

/** Echo · E25 — ~20 px radius at a 480 px plot min (18–22 at 1440). */
export const LIM_DISC_R_PT = 20;
export const LIM_DISC_REF_MIN_PX = 480;
export const LIM_DISC_R_FLOOR_PT = 14;
/** Newest ghost starts at 30% opacity and fades to 0. */
export const LIM_GHOST_OPACITY_CAP = 0.3;

export function limDiscRadiusPx(plotW: number, plotH: number): number {
  const minWH = Math.min(plotW, plotH);
  const r = (minWH / LIM_DISC_REF_MIN_PX) * LIM_DISC_R_PT;
  return Math.max(LIM_DISC_R_FLOOR_PT, Math.round(r));
}

export function limGhostOpacity(ageOpacity: number): number {
  const o = Math.min(1, Math.max(0, ageOpacity));
  return o * LIM_GHOST_OPACITY_CAP;
}

export const LIM_DISC_SPHERE =
  "radial-gradient(circle at 32% 28%, #7ec4ff 0%, #0a84ff 45%, #0450a8 100%)";

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

export function limNoScaleMessage(symbol: string): string {
  return `No centre scale configured for ${symbol}.`;
}

export function limRefusalMessage(result: {
  valid: boolean;
  symbol: string;
  invalidReason?: "no-scale" | "no-spot" | null;
}): string | null {
  if (result.valid) return null;
  if (result.invalidReason === "no-spot") {
    return `No spot for ${result.symbol}.`;
  }
  return limNoScaleMessage(result.symbol);
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

/** Coach-drawn axis terms (LIM9 S2). Allowed. DL polarity note cited. */
export const LIM_AT23_ALLOWED = ["expansion", "compression"] as const;
