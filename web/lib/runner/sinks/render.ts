"use client";

/**
 * Render sink (P1 only). Hands tiles to the existing heatmap renderer
 * unchanged — HeatmapChainPanel is imported, not forked.
 */

import { createElement, useEffect, type ReactElement } from "react";
import HeatmapChainPanel from "@/components/options-lab/HeatmapChainPanel";
import {
  emitToSink,
  type HeatmapTiles,
  type RunnerTemplate,
} from "../registry";
import { subscribe } from "../subscribe";

export function deliverRender(
  template: RunnerTemplate,
  tiles: HeatmapTiles,
): HeatmapTiles {
  emitToSink(template, "render");
  return tiles;
}

/** Flag-on host: interest on the tab singleton + existing renderer unchanged. */
export function HeatmapRenderHost(): ReactElement {
  useEffect(() => {
    return subscribe(
      { interestId: "runner-heatmap", topics: ["chain"] },
      () => undefined,
    );
  }, []);
  return createElement(HeatmapChainPanel);
}
