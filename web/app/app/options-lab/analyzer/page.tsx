"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import AppPlaceholder from "@/components/options-lab/AppPlaceholder";

/**
 * Analyzer app — risk graph for the selected underlier (next).
 */
export default function OptionsLabAnalyzerPage() {
  return (
    <OptionsLabChrome active="analyzer">
      <AppPlaceholder
        testId="options-lab-analyzer"
        title="Analyzer"
        body="Risk graph for the selected underlier — payoff and greek surface. Scaffold only for now; symbol selection is shared with Volume Profile and Heatmap."
      />
    </OptionsLabChrome>
  );
}
