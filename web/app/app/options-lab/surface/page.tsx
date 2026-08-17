"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import SurfaceApp from "@/components/options-lab/surface/SurfaceApp";

/**
 * Do not wrap SurfaceApp in Suspense for useSearchParams.
 * Static prerender + that hook pins the fallback ("UPDATING") and the
 * canvas host never mounts (wiki search hit the same trap).
 */
export default function OptionsLabSurfacePage() {
  return (
    <OptionsLabChrome active="surface" workspace>
      <SurfaceApp />
    </OptionsLabChrome>
  );
}
