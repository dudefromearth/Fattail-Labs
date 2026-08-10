"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import HeatmapChainPanel from "@/components/options-lab/HeatmapChainPanel";

/**
 * Heatmap app — options chain ladder (convexity templates later).
 */
export default function OptionsLabHeatmapPage() {
  return (
    <OptionsLabChrome active="heatmap">
      <HeatmapChainPanel />
    </OptionsLabChrome>
  );
}
