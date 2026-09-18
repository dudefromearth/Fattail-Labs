"use client";

import type { ReactNode } from "react";
import { OptionsLabProvider } from "@/lib/optionsLabContext";
import VpSurfaceKeepAlive from "@/components/options-lab/VpSurfaceKeepAlive";

/**
 * Options Lab suite shell — shared symbol + provider for all sub-apps.
 * VP keep-alive (A14.9) retains the chart instance across Analyzer/Heatmap.
 */
export default function OptionsLabLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <OptionsLabProvider>
      <div className="flex min-h-0 flex-1 flex-col">
        <VpSurfaceKeepAlive />
        {children}
      </div>
    </OptionsLabProvider>
  );
}
