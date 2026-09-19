"use client";

import OptionsLabChrome from "@/components/options-lab/OptionsLabChrome";
import VolumeProfileSaSurface from "@/components/options-lab/VolumeProfileSaSurface";

/** Member Volume Profile — Data-Delivery T1–T5 on this route. */
export default function OptionsLabVolumeProfilePage() {
  return (
    <OptionsLabChrome
      active="volume-profile"
      fillHeight
      wide
      workspace
      tone="dark"
    >
      <VolumeProfileSaSurface />
    </OptionsLabChrome>
  );
}
