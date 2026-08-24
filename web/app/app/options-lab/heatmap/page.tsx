"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import HeatmapChainPanel from "@/components/options-lab/HeatmapChainPanel";

/**
 * Heatmap — full-height workspace: controls ~1/5 · chain ~4/5.
 */
export default function OptionsLabHeatmapPage() {
  return (
    <OptionsLabChrome active="heatmap" workspace>
      <HeatmapChainPanel />
    </OptionsLabChrome>
  );
}
