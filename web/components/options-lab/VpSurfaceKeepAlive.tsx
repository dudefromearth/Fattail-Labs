"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import VolumeProfileSaSurface from "@/components/options-lab/VolumeProfileSaSurface";
import { useIsAdmin } from "@/lib/useIsAdmin";

/** A14.9 — retain the VP instance across Options Lab nav. Hidden, never destroyed. */
export default function VpSurfaceKeepAlive() {
  const path = usePathname() || "";
  const isAdmin = useIsAdmin();
  const active = path.includes("/volume-profile");
  const [ever, setEver] = useState(false);

  useEffect(() => {
    if (isAdmin && active) setEver(true);
  }, [isAdmin, active]);

  if (!isAdmin || !ever) return null;

  return (
    <div
      className={active ? "flex min-h-0 flex-1 flex-col" : "hidden"}
      hidden={!active}
      data-testid="vp-keep-alive"
      data-active={active ? "1" : "0"}
      style={active ? undefined : { display: "none" }}
    >
      <OptionsLabChrome
        active="volume-profile"
        fillHeight
        wide
        workspace
        tone="dark"
      >
        <VolumeProfileSaSurface paused={!active} />
      </OptionsLabChrome>
    </div>
  );
}
