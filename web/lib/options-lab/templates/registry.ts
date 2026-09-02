/** Template registry — Spec HM §4 */

import type { HeatmapTemplate } from "./types";
import { symFlyTemplate } from "./symFly";
import { widthFitTemplate } from "./widthFitTemplate";
import { bwFlyTemplate } from "./bwFly";
import { verticalTemplate } from "./vertical";
import { gexTemplate } from "./gex";
import { limTemplate } from "./lim";

/** Default Heatmap template — Symmetric flies (MSC look). */
export const DEFAULT_HEATMAP_TEMPLATE_ID = "sym-fly";

export const HEATMAP_TEMPLATES: HeatmapTemplate[] = [
  symFlyTemplate,
  widthFitTemplate,
  bwFlyTemplate,
  verticalTemplate,
  {
    id: "ladder",
    label: "Strike ladder",
    description: "Raw dual-side chain (view side filtered)",
    layout: "table",
    valueModes: [{ id: "quote", label: "Quotes" }],
    defaultValueMode: "quote",
    resolveColumns: () => [],
    resolveRows: () => [],
    computeCell: () => ({ display: null, value: null, valid: false }),
    assignColors: () => ({ stickyScale: 1 }),
  },
  gexTemplate,
  limTemplate,
];

export function getTemplate(id: string): HeatmapTemplate {
  const t = HEATMAP_TEMPLATES.find((x) => x.id === id);
  if (!t) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        `Unknown heatmap template ${id}; falling back to ${DEFAULT_HEATMAP_TEMPLATE_ID}`,
      );
    }
    return (
      HEATMAP_TEMPLATES.find((x) => x.id === DEFAULT_HEATMAP_TEMPLATE_ID) ||
      HEATMAP_TEMPLATES[0]
    );
  }
  return t;
}

export { buildGrid } from "./symFly";
