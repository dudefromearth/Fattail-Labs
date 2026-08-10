"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import AppPlaceholder from "@/components/options-lab/AppPlaceholder";

/**
 * Volume Profile app — TradingView Lightweight Charts + volume profile (next).
 */
export default function OptionsLabVolumeProfilePage() {
  return (
    <OptionsLabChrome active="volume-profile">
      <AppPlaceholder
        testId="options-lab-volume-profile"
        title="Volume Profile"
        body="Candlestick view of the underlier with a volume profile panel. Lightweight Charts integration and profile bins ship next — symbol selection already works across the suite."
      />
    </OptionsLabChrome>
  );
}
