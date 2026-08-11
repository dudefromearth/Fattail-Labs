"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import OpfRiskAnalyzer from "@/components/options-lab/OpfRiskAnalyzer";

/**
 * Options Lab Analyzer — full exercise of Options Pricing Foundation.
 * Data: dual-side chain generations. Pricing: OPF model packs only.
 * Render: PnLChart (presentation). MSC is not the pricing standard.
 */
export default function OptionsLabAnalyzerPage() {
  return (
    <OptionsLabChrome active="analyzer" workspace>
      <OpfRiskAnalyzer />
    </OptionsLabChrome>
  );
}
