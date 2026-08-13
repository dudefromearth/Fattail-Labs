"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import VolumeProfileChart from "@/components/options-lab/VolumeProfileChart";

/**
 * Volume Profile app — interim OHLC-window bins (not measured tick VP).
 */
export default function OptionsLabVolumeProfilePage() {
  return (
    <OptionsLabChrome active="volume-profile" fillHeight wide>
      <VolumeProfileChart />
    </OptionsLabChrome>
  );
}
