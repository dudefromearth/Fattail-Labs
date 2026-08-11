"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import RiskAnalyzerPanel from "@/components/options-lab/RiskAnalyzerPanel";

/**
 * Analyzer — expiration risk graph from Heatmap ToS selection or paste.
 */
export default function OptionsLabAnalyzerPage() {
  return (
    <OptionsLabChrome active="analyzer" workspace>
      <RiskAnalyzerPanel />
    </OptionsLabChrome>
  );
}
