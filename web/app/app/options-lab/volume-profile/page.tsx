"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import VolumeProfileChart from "@/components/options-lab/VolumeProfileChart";
// Admin SA surface is retained by VpSurfaceKeepAlive in the Options Lab layout.
import { useIsAdmin } from "@/lib/useIsAdmin";

/**
 * Volume Profile app.
 * Residual OHLC-window bins persist for members (SA-L9 untouched).
 * Administrators see the SA Phase-1 surface (AZ-VP-9-A1) — admin-flag only.
 */
export default function OptionsLabVolumeProfilePage() {
  const isAdmin = useIsAdmin();
  if (isAdmin) {
    return null;
  }
  return (
    <OptionsLabChrome active="volume-profile" fillHeight wide>
      <VolumeProfileChart />
    </OptionsLabChrome>
  );
}
