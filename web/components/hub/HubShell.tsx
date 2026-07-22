"use client";

import type { HubPage } from "@/lib/hub";
import HubEditBar from "./HubEditBar";
import { HubEditProvider } from "./HubEditContext";
import HubFaqAccordion from "./HubFaqAccordion";
import HubHeader from "./HubHeader";

export default function HubShell({
  hub,
  courseCount,
  children,
}: {
  hub: HubPage;
  courseCount: number;
  /** Server-rendered middle of the page (flagship, categories, courses). */
  children: React.ReactNode;
}) {
  return (
    <HubEditProvider initial={hub}>
      <HubEditBar />
      <HubHeader hub={hub} courseCount={courseCount} />
      {children}
      <div className="max-w-3xl">
        <HubFaqAccordion
          initialItems={hub.faq_items.map((f) => ({
            id: f.id,
            sort_order: f.sort_order,
            question: f.question,
            answer_md: f.answer_md,
          }))}
        />
      </div>
    </HubEditProvider>
  );
}
