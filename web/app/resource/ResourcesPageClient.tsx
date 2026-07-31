"use client";

/**
 * Resources page client — Tag Manager Spec v0.2 §9a.
 * Centered [ Library | Tags ] pills sit above the hub title (Practice pattern).
 */

import { useState } from "react";
import ResourcesHub, {
  ResourcesSubNav,
} from "@/components/resources/ResourcesHub";
import SectionHubShell from "@/components/section-hub/SectionHubShell";
import type { SitePage } from "@/lib/sitePage";

type Tab = "library" | "tags";

export default function ResourcesPageClient({ page }: { page: SitePage }) {
  const [tab, setTab] = useState<Tab>("library");

  return (
    <SectionHubShell
      page={page}
      beforeHeader={<ResourcesSubNav active={tab} onChange={setTab} />}
    >
      <ResourcesHub tab={tab} onTabChange={setTab} />
    </SectionHubShell>
  );
}
