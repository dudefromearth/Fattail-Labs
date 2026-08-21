/**
 * Width Fit as a Heatmap **template** (Coach: Template switcher, not Value).
 * Geometry = Advanced Fly columns/rows. Internal mode id stays `width_fit`.
 */

import { heatmapFlyWidths, symFlyTemplate } from "./symFly";
import { assignWidthFitColors, widthFitComputeCell } from "./widthFit";
import type { HeatmapTemplate } from "./types";

export const WIDTH_FIT_TEMPLATE_ID = "width-fit";

export const widthFitTemplate: HeatmapTemplate = {
  id: WIDTH_FIT_TEMPLATE_ID,
  label: "Width Fit",
  description:
    "Fit of listed long butterflies to your criteria on the live surface. Observation only — not a signal.",
  layout: "matrix",
  valueModes: [{ id: "width_fit", label: "Width Fit" }],
  defaultValueMode: "width_fit",
  resolveColumns: (ctx, params) => {
    if (!params.fixedPoints?.length) {
      return heatmapFlyWidths().map((w) => ({
        id: `w${w}`,
        label: String(w),
        widthPts: w,
      }));
    }
    return symFlyTemplate.resolveColumns(ctx, params);
  },
  resolveRows: (ctx, params) => symFlyTemplate.resolveRows(ctx, params),
  computeCell: widthFitComputeCell,
  assignColors: assignWidthFitColors,
};

export function isWidthFitTemplate(id: string | undefined | null): boolean {
  return id === WIDTH_FIT_TEMPLATE_ID;
}

export function isFlySurfaceTemplate(id: string | undefined | null): boolean {
  return id === "sym-fly" || id === WIDTH_FIT_TEMPLATE_ID;
}
