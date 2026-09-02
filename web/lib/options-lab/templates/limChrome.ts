/**
 * LIM chrome — Spec v0.4.3 Appendix B verbatim (LIM27). Tango lock.
 * No cell names. Picker carries neither intent nor friction (LIM35).
 */

export const LIM_PICKER_LABEL = "GEX lean (window)";
export const LIM_MODE_LABEL = "Lean / near-spot mix";

export const LIM_AXIS_X = "Lean";
export const LIM_AXIS_Y = "Near-spot mix";

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

export type LimDensity = "comfort" | "compact";

export function limChromeLines(
  oiAsOf: string | null,
  density: LimDensity,
): string[] {
  const line3 = limChromeLine3(oiAsOf);
  if (density === "compact") return [LIM_CHROME_1, line3];
  return [LIM_CHROME_1, LIM_CHROME_2, line3, LIM_CHROME_4];
}

/** State line: facts only. Never a crossing price (AT-LIM18). */
export function limStateLine(
  r: { expiration: string; wings: number; crossingCount: number },
  density: LimDensity,
): string {
  const exp = r.expiration || "—";
  if (density === "compact") return `${exp} · w${r.wings}`;
  return `${exp} · w${r.wings} · crossings ${r.crossingCount}`;
}

export function limMagFDisplay(magF: number): string {
  return Number.isInteger(magF) ? String(magF) : magF.toFixed(1);
}

export function limProximityDisplay(p: number): string {
  return p.toFixed(2);
}

export const LIM_DOT_OPACITY = 1;

export const LIM_DISC_R_PT = 6;
export const LIM_RING_MIN_OFFSET_PT = 4;

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

export function limRingRadius(proximity: number, minWH: number): number {
  const p = Math.min(1, Math.max(0, proximity));
  const minR = LIM_DISC_R_PT + LIM_RING_MIN_OFFSET_PT;
  const maxR = 0.32 * minWH;
  return minR + (1 - p) * (maxR - minR);
}

export function limPlanePoint(
  result: { x: number; y: number; valid: boolean } | null,
): { x: number; y: number } {
  if (result == null || !result.valid) return { x: 0, y: 50 };
  return { x: result.x, y: result.y };
}

export function limSurfaceFlags(density: LimDensity): {
  ring: true;
  chip: boolean;
  trail: boolean;
  magF: boolean;
  chrome2: boolean;
  chrome4: boolean;
} {
  const comfort = density === "comfort";
  return {
    ring: true,
    chip: comfort,
    trail: comfort,
    magF: comfort,
    chrome2: comfort,
    chrome4: comfort,
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
