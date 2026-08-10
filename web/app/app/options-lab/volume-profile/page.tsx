"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import VolumeProfileChart from "@/components/options-lab/VolumeProfileChart";

/**
 * Volume Profile app — candlesticks now; volume profile bins next.
 */
export default function OptionsLabVolumeProfilePage() {
  return (
    <OptionsLabChrome active="volume-profile">
      <VolumeProfileChart />
    </OptionsLabChrome>
  );
}
