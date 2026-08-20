import { Suspense } from "react";
import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import OpfRiskAnalyzer from "@/components/options-lab/OpfRiskAnalyzer";

/**
 * Options Lab Analyzer — full exercise of Options Pricing Foundation.
 * Data: dual-side chain generations. Pricing: OPF model packs only.
 * Render: HostPnLChart (host-contract 2D). MSC is not the pricing standard.
 *
 * Suspense: OpfRiskAnalyzer reads useSearchParams (builder=1). Next 16
 * prerender requires a boundary; do not wrap Surface the same way.
 */
export default function OptionsLabAnalyzerPage() {
  return (
    <OptionsLabChrome active="analyzer" workspace>
      <Suspense fallback={null}>
        <OpfRiskAnalyzer />
      </Suspense>
    </OptionsLabChrome>
  );
}
