"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import MscRiskAnalyzer from "@/components/options-lab/MscRiskAnalyzer";

/**
 * Risk Analyzer — OPF day_trade dual-curve risk graph (ToS-comparable).
 * Trade input: Heatmap ToS Option-click or paste. PnLChart canvas for pan/zoom.
 */
export default function OptionsLabAnalyzerPage() {
  return (
    <OptionsLabChrome active="analyzer" workspace>
      <MscRiskAnalyzer />
    </OptionsLabChrome>
  );
}
