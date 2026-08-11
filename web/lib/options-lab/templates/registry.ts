/** Template registry — Spec HM §4 */

import type { HeatmapTemplate } from "./types";
import { symFlyTemplate } from "./symFly";
import { gexTemplate } from "./gex";

export const HEATMAP_TEMPLATES: HeatmapTemplate[] = [
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
  symFlyTemplate,
  gexTemplate,
];

export function getTemplate(id: string): HeatmapTemplate {
  const t = HEATMAP_TEMPLATES.find((x) => x.id === id);
  if (!t) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`Unknown heatmap template ${id}; falling back to ladder`);
    }
    return HEATMAP_TEMPLATES[0];
  }
  return t;
}

export { buildGrid } from "./symFly";
