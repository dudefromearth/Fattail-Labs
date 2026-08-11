"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import MscRiskAnalyzer from "@/components/options-lab/MscRiskAnalyzer";

/**
 * Risk Analyzer — MSC Risk Graph engine + canvas PnLChart (ported).
 * Trade input: Heatmap ToS Option-click or paste.
 */
export default function OptionsLabAnalyzerPage() {
  return (
    <OptionsLabChrome active="analyzer" workspace>
      <MscRiskAnalyzer />
    </OptionsLabChrome>
  );
}
