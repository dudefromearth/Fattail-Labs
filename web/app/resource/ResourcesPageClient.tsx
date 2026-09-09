"use client";

/**
 * Resources page client — Tag Manager Spec v0.2 §9a.
 * Centered [ Library | Tags ] pills sit above the hub title (Practice pattern).
 * Sessions is a Link child (OD-S2 a), hidden when anonymous (OD-S3 a).
 */

import { useEffect, useState } from "react";
import ResourcesHub, {
  ResourcesSubNav,
  type ResourcesHubTab,
} from "@/components/resources/ResourcesHub";
import SectionHubShell from "@/components/section-hub/SectionHubShell";
import { fetchMe } from "@/lib/useIsAdmin";
import type { SitePage } from "@/lib/sitePage";

export default function ResourcesPageClient({ page }: { page: SitePage }) {
  const [tab, setTab] = useState<ResourcesHubTab>("library");
  const [showSessions, setShowSessions] = useState(false);

  useEffect(() => {
    void fetchMe().then((me) => setShowSessions(Boolean(me)));
    if (new URLSearchParams(window.location.search).get("tab") === "tags") {
      setTab("tags");
    }
  }, []);

  return (
    <SectionHubShell
      page={page}
      beforeHeader={
        <ResourcesSubNav
          active={tab}
          onChange={setTab}
          showSessions={showSessions}
        />
      }
    >
      <ResourcesHub tab={tab} onTabChange={setTab} />
    </SectionHubShell>
  );
}
