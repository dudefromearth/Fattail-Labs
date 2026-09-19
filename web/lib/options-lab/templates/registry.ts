/** Template registry — Spec HM §4 */

import type { HeatmapTemplate } from "./types";
import { symFlyTemplate } from "./symFly";
import { widthFitTemplate } from "./widthFitTemplate";
import { bwFlyTemplate } from "./bwFly";
import { verticalTemplate } from "./vertical";
import { gexTemplate } from "./gex";
import { limTemplate } from "./lim";
import { gexCalTemplate, termMassFlagOn } from "./gexCal";

/** Default Heatmap template — Symmetric flies (MSC look). */
export const DEFAULT_HEATMAP_TEMPLATE_ID = "sym-fly";

export const HEATMAP_TEMPLATES: HeatmapTemplate[] = [
  symFlyTemplate,
  bwFlyTemplate,
  widthFitTemplate,
  verticalTemplate,
  limTemplate,
  gexTemplate,
  gexCalTemplate,
  {
    id: "ladder",
    label: "Strike Ladder (raw data)",
    description: "Raw dual-side chain (view side filtered)",
    layout: "table",
    valueModes: [{ id: "quote", label: "Quotes" }],
    defaultValueMode: "quote",
    resolveColumns: () => [],
    resolveRows: () => [],
    computeCell: () => ({ display: null, value: null, valid: false }),
    assignColors: () => ({ stickyScale: 1 }),
  },
];

/** Switcher list — gex-cal only when flag on (GC14 / JR2). */
export function memberHeatmapTemplates(): HeatmapTemplate[] {
  if (termMassFlagOn()) return HEATMAP_TEMPLATES;
  return HEATMAP_TEMPLATES.filter((t) => t.id !== gexCalTemplate.id);
}

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
