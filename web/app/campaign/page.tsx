import type { Metadata } from "next";
import { siteUrl } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Campaigns",
  description:
    "FatTail Labs campaigns — focused education and outreach sequences.",
  alternates: { canonical: siteUrl("/campaign") },
};

/**
 * Campaign catalog (SEO namespace: /campaign).
 * Content production for campaigns is forthcoming; this establishes the URL
 * hierarchy alongside /course, /resource, and /app.
 */
export default function CampaignCatalogPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Campaigns</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Campaign pages live under{" "}
          <code className="text-sm">/campaign/[campaign-name]</code>. New
          campaigns will appear here as they ship.
        </p>
      </header>
      <p className="mt-10 text-sm text-zinc-500">No campaigns published yet.</p>
    </main>
  );
}
