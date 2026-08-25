/**
 * Registration only — wraps the existing HM v0.2 Advanced Fly template.
 * Do not copy or edit web/lib/options-lab/templates/*.
 */

import { FlySurfacePipeline } from "@/lib/options-lab/templates/flySurfacePipeline";
import {
  heatmapFlyWidths,
  symFlyTemplate,
} from "@/lib/options-lab/templates/symFly";
import type {
  ChainContext,
  GridCell,
  TemplateParams,
} from "@/lib/options-lab/templates/types";
import {
  register,
  type HeatmapTiles,
  type RunnerStreams,
} from "../registry";

const HEATMAP_ID = "sym-fly";
const HEATMAP_VERSION = "0.2";

const DEFAULT_PARAMS: TemplateParams = {
  valueMode: "debit",
  widthMode: "fixed_points",
  fixedPoints: heatmapFlyWidths(),
  stickyScale: 1,
};

function isChainContext(x: unknown): x is ChainContext {
  if (!x || typeof x !== "object") return false;
  const o = x as ChainContext;
  return o.contracts instanceof Map && typeof o.symbol === "string";
}

/** Current-path paint: pipeline ingest + assignColors (HeatmapChainPanel fly). */
export function paintCurrentHeatmap(ctx: ChainContext): HeatmapTiles {
  const pipe = new FlySurfacePipeline();
  const paint = pipe.ingest(ctx, "debit", heatmapFlyWidths(), {
    receivedAt: 1,
  });
  const cells: GridCell[][] = paint.cells.map((row) =>
    row.map((c) => ({ ...c })),
  );
  const colored = symFlyTemplate.assignColors(cells, DEFAULT_PARAMS);
  void colored;
  return {
    rows: paint.rows.map((r) => ({
      strike: r.strike,
      label: r.label,
      isSpot: r.isSpot,
    })),
    cols: paint.cols.map((c) => ({
      id: c.id,
      label: c.label,
      widthPts: c.widthPts,
    })),
    cells: cells.map((row) =>
      row.map((c) => ({
        display: c.display,
        value: c.value,
        valid: c.valid,
        colorT: c.colorT,
        bgCss: c.bgCss,
        tooltip: c.tooltip,
      })),
    ),
    contentHash: ctx.contentHash,
  };
}

function compute(streams: RunnerStreams, _controls: unknown): HeatmapTiles {
  void _controls;
  const ctx = streams.chain;
  if (!isChainContext(ctx)) {
    return {
      rows: [],
      cols: [],
      cells: [],
      contentHash: streams.content_hash ?? null,
    };
  }
  return paintCurrentHeatmap(ctx);
}

register({
  id: HEATMAP_ID,
  version: HEATMAP_VERSION,
  inputs: ["chain"],
  controls: [],
  live: true,
  outputKind: "visual/heatmap",
  cadence: "live",
  sinks: ["render"],
  honesty:
    "Tiles are listed long-fly package mids on the held generation. Gaps stay gaps.",
  framing: "Options Lab Heatmap — Advanced flies (visual, static per generation).",
  nonClaim:
    "Not a signal, fill, or profit claim. Observation of listed structure only.",
  compute,
});

export const HEATMAP_TEMPLATE_ID = HEATMAP_ID;
export const HEATMAP_TEMPLATE_VERSION = HEATMAP_VERSION;
