"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import HeatmapChainPanel from "@/components/options-lab/HeatmapChainPanel";

/**
 * Runner — full-height workspace: template rail ~1/5 · chain ~4/5.
 */
export default function OptionsLabHeatmapPage() {
  return (
    <OptionsLabChrome active="heatmap" workspace>
      <HeatmapChainPanel />
    </OptionsLabChrome>
  );
}
