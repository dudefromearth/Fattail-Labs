"use client";

import IkiSuiteChrome from "@/components/iki/IkiSuiteChrome";
import { OptionsLabProvider } from "@/lib/optionsLabContext";
import { HeatmapRenderHost } from "@/lib/runner/sinks/render";

/**
 * IKI Runner host — same HeatmapRenderHost as Options Lab (IKI-P2).
 * Props-driven chrome waits on the render-sink packet; do not 404 the tab.
 */
export default function IkiRunnerPage() {
  return (
    <IkiSuiteChrome active="runner" workspace>
      <OptionsLabProvider>
        <div
          className="flex min-h-0 flex-1 flex-col"
          data-testid="iki-runner-host"
        >
          <HeatmapRenderHost />
        </div>
      </OptionsLabProvider>
    </IkiSuiteChrome>
  );
}
