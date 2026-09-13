/**
 * Heatmap column-width resolver (XS2).
 *
 * Overlay path: universe `fixed_points` wins for every symbol — no symbol list.
 * Offline / kind-default fallback is XSP/SPY only; else DL-435 remainder.
 */

import { HEATMAP_FLY_WIDTHS, heatmapFlyWidths } from "./symFly";
import type { ChainContext, TemplateParams } from "./types";

/** DL-435 remainder — SPX-class Advanced Fly columns. Do not mutate. */
export { HEATMAP_FLY_WIDTHS, heatmapFlyWidths };

/**
 * Offline / kind-default fallback, by symbol.
 * Fires ONLY when the universe row has not spoken. Never a clamp on a live overlay (B1).
 * OD-XS11 asks whether this should fail loud instead.
 */
const OFFLINE_FALLBACK_WIDTHS: Record<string, readonly number[]> = {
  XSP: [1, 2, 3, 4, 5, 6, 7],
  SPY: [1, 2, 3, 4, 5, 6, 7],
};

/** @deprecated v1.1 name. Retained so existing call sites and fixtures keep compiling. */
export const XSP_SPY_FLY_WIDTHS = OFFLINE_FALLBACK_WIDTHS.XSP;

type WidthProfile = {
  source?: string;
  fly_width_mode?: string;
  fly_widths?: number[];
} | null | undefined;

function universeFixedPoints(profile: WidthProfile): number[] | null {
  if (!profile) return null;
  if (profile.source !== "market_symbol_universe") return null;
  if (profile.fly_width_mode !== "fixed_points") return null;
  const w = (profile.fly_widths || []).filter(
    (n) => Number.isFinite(n) && n > 0,
  );
  return w.length ? w : []; // empty = fail loud, not fallback
}

export function heatmapColumnWidths(opts: {
  symbol?: string | null;
  profile?: WidthProfile;
}): number[] {
  // 1. The universe row is SoR — for EVERY symbol. No symbol list on this path.
  const overlay = universeFixedPoints(opts.profile);
  if (overlay !== null) return overlay; // [] = fail loud; [1,2,3] / [1..8] = DB wins

  // 2. Universe has not spoken. Symbol-keyed offline fallback, then DL-435 remainder.
  const s = (opts.symbol || "").toUpperCase();
  const fallback = OFFLINE_FALLBACK_WIDTHS[s];
  return fallback ? [...fallback] : [...HEATMAP_FLY_WIDTHS];
}

/**
 * Template widthList: honor params.fixedPoints, then ctx.columnWidths,
 * then the helper (kind-default / offline). step_multiples still uses
 * heatmapFlyWidths (DL-435 identity — that function ignores step).
 */
export function heatmapWidthList(
  ctx: ChainContext,
  params: Pick<TemplateParams, "widthMode" | "fixedPoints" | "widthCount">,
): number[] {
  if (params.widthMode === "fixed_points" && params.fixedPoints?.length) {
    return [...params.fixedPoints];
  }
  if (params.widthMode === "step_multiples") {
    const step = ctx.strikeStep && ctx.strikeStep > 0 ? ctx.strikeStep : 5;
    const n = Math.max(1, Math.min(12, params.widthCount ?? 7));
    return heatmapFlyWidths(step, n);
  }
  if (ctx.columnWidths !== undefined) {
    return [...ctx.columnWidths];
  }
  return heatmapColumnWidths({ symbol: ctx.symbol });
}

export function heatmapProfileWidthSource(
  source?: string | null,
): "universe" | "kind default" | "unknown" {
  if (source === "market_symbol_universe") return "universe";
  if (source === "client_kind_default") return "kind default";
  return "unknown";
}

/** Amendment A1 chrome — same string the panel paints. Empty list never interpolates undefined. */
export function heatmapProfileLine(opts: {
  strikeStep?: number | null;
  flyWidths: number[];
  source?: string | null;
  kind?: string | null;
}): string {
  const widthSource = heatmapProfileWidthSource(opts.source);
  const widthsPart =
    opts.flyWidths.length === 0
      ? ` · widths — (no column list)`
      : ` · widths ${opts.flyWidths[0]}–${opts.flyWidths[opts.flyWidths.length - 1]}`;
  return (
    `Profile` +
    (opts.strikeStep != null ? ` · step ${opts.strikeStep}` : "") +
    widthsPart +
    ` · ${widthSource}` +
    (opts.kind ? ` · ${opts.kind}` : "")
  );
}
