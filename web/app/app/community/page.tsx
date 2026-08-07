import type { Metadata } from "next";
import { Suspense } from "react";
import CommunityApp from "@/components/community/CommunityApp";
import { siteUrl } from "@/lib/catalog";

/**
 * Community — Discord second window shell + FatTail/member bot shelves.
 * Spec: Specs/FatTail-Labs-Community-App-Spec-v1.0.md v1.0.2
 * C1a: channels + shelves; message sync C1c.
 */

export const metadata: Metadata = {
  title: "Community",
  description:
    "Process peers and FatTail bots — same conversation as Discord, plus shared designs. No P&L theater.",
  alternates: { canonical: siteUrl("/app/community") },
};

export default async function CommunityPage({
  searchParams,
}: {
  searchParams?: Promise<{ channel?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const channel = typeof sp.channel === "string" ? sp.channel : undefined;

  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-[1200px] px-4 py-6">
          <p className="text-[var(--color-label-secondary)]">
            Loading Community…
          </p>
        </main>
      }
    >
      <CommunityApp initialChannel={channel} />
    </Suspense>
  );
}
