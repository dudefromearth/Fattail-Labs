/**
 * Registration wrap — Width Fit on the runner (TR8). Compute stays in
 * options-lab/templates. No MA here (TR14 / WF4).
 */

import { heatmapFlyWidths } from "@/lib/options-lab/templates/symFly";
import { FlySurfacePipeline } from "@/lib/options-lab/templates/flySurfacePipeline";
import {
  assignWidthFitColors,
  DEFAULT_MIN_VALID_N,
  DEFAULT_STABILITY_PENALTY,
  DEFAULT_WIDTH_FIT_WEIGHTS,
} from "@/lib/options-lab/templates/widthFit";
import { widthFitTemplate } from "@/lib/options-lab/templates/widthFitTemplate";
import type { ChainContext, GridCell } from "@/lib/options-lab/templates/types";
import {
  register,
  type HeatmapTiles,
  type RunnerStreams,
} from "../registry";

const ID = "width-fit";
const VERSION = "0.1";

function isChainContext(x: unknown): x is ChainContext {
  if (!x || typeof x !== "object") return false;
  const o = x as ChainContext;
  return o.contracts instanceof Map && typeof o.symbol === "string";
}

function paint(ctx: ChainContext): HeatmapTiles {
  const pipe = new FlySurfacePipeline();
  const paint0 = pipe.ingest(ctx, "width_fit", heatmapFlyWidths(), {
    receivedAt: 1,
  });
  const cells: GridCell[][] = paint0.cells.map((row) =>
    row.map((c) => ({ ...c })),
  );
  assignWidthFitColors(cells, {
    valueMode: "width_fit",
    widthMode: "fixed_points",
    fixedPoints: heatmapFlyWidths(),
    widthFitWeights: DEFAULT_WIDTH_FIT_WEIGHTS,
    minValidN: DEFAULT_MIN_VALID_N,
    stabilityPenaltyStrength: DEFAULT_STABILITY_PENALTY,
    widthFitNormalization: "per_width",
  });
  return {
    rows: paint0.rows.map((r) => ({
      strike: r.strike,
      label: r.label,
      isSpot: r.isSpot,
    })),
    cols: paint0.cols.map((c) => ({
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
  return paint(ctx);
}

register({
  id: ID,
  version: VERSION,
  inputs: ["chain"],
  controls: [],
  live: true,
  outputKind: "visual/heatmap",
  cadence: "live",
  sinks: ["render"],
  honesty:
    "Width Fit scores listed long flies on the held generation. Average/Replay are runner views.",
  framing: "Options Lab Heatmap — Width Fit (visual).",
  nonClaim: "Not a signal, fill, or recommendation. Observation only.",
  compute,
});

void widthFitTemplate;

export const WIDTH_FIT_RUNNER_ID = ID;
export const WIDTH_FIT_RUNNER_VERSION = VERSION;
