"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import HeatmapChainPanel from "@/components/options-lab/HeatmapChainPanel";
import { runnerShellEnabled } from "@/lib/runner/registry";
import { HeatmapRenderHost } from "@/lib/runner/sinks/render";
import "@/lib/runner/templates/heatmap";

/**
 * Heatmap — full-height workspace: controls ~1/5 · chain ~4/5.
 * Flag NEXT_PUBLIC_LABS_RUNNER_SHELL=1 → Runner shell host (template selector).
 */
export default function OptionsLabHeatmapPage() {
  return (
    <OptionsLabChrome active="heatmap" workspace>
      {runnerShellEnabled() ? <HeatmapRenderHost /> : <HeatmapChainPanel />}
    </OptionsLabChrome>
  );
}
