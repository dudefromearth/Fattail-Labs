import type { Metadata } from "next";
import { Suspense } from "react";
import StrategyLabApp from "@/components/strategy-lab/StrategyLabApp";
import { siteUrl } from "@/lib/catalog";

/**
 * Strategy Lab — member-owned strategies (identity_id isolation).
 * Archive (retired strategies, reports, logs) is a separate page.
 * Spec: Specs/Strategy-Lab-Architecture-Design-v1.0.md
 */

export const metadata: Metadata = {
  title: "Strategy Lab",
  // Public/logged-out meta: name only. No product story.
  description: "Strategy Lab",
  alternates: { canonical: siteUrl("/app/strategy-lab") },
  openGraph: {
    title: "Strategy Lab",
    description: "Strategy Lab",
    url: siteUrl("/app/strategy-lab"),
  },
};

export default function StrategyLabPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-[1200px] px-4 py-6">
          <p className="text-[var(--color-label-secondary)]">
            Loading Strategy Lab…
          </p>
        </main>
      }
    >
      <StrategyLabApp />
    </Suspense>
  );
}
